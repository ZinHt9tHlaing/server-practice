# Image Optimization Queue Process

This note shows the current post image flow before upload to Cloudinary, using the BullMQ image worker.

## Main Flow

```text
Admin request
  |
  v
postController.createPost / postController.updatePost
  |
  | 1. Read uploaded images from req.files
  | 2. Generate a unique file name
  | 3. Precompute Cloudinary publicId and imageUrl
  | 4. Add an optimization job to ImageQueue
  v
BullMQ queue: imageQueue
  |
  v
imageWorker
  |
  | 5. Rebuild image buffer from memory or disk
  | 6. Optimize with sharp
  | 7. Upload optimized image to Cloudinary
  | 8. Delete old Cloudinary image(s) when oldPublicId or oldPublicIds exists
  | 9. Remove temporary disk file when disk storage was used
  v
Cloudinary
```

## Controller Step

File: `src/controller/admin/postController.ts`

The post controller does not upload directly to Cloudinary. Instead, for each uploaded image it:

1. Creates a unique file name:

```ts
const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
```

2. Builds the Cloudinary folder and future asset identifiers:

```ts
const folderName = "eShop.com/post";

const { publicId, imageUrl } = generateCloudinaryPath({
  folderName,
  fileName: uniqueFileName,
});
```

3. Adds a job to `ImageQueue`:

```ts
await ImageQueue.add("optimize-post-image", {
  source: image.buffer
    ? { type: "buffer", data: image.buffer.toString("base64") }
    : { type: "file", path: image.path },
  width: 835,
  height: 577,
  quality: 100,
  fileName: uniqueFileName,
  folderName: folderName,
});
```

For post updates, the controller also collects existing post image public IDs and passes them to the worker for deletion.

```ts
const oldImagePublicIds =
  post.images && post.images.length > 0
    ? post.images.map((img) => img.publicId)
    : undefined;
```

Only the first queued replacement-image job receives `oldPublicIds`. This avoids deleting the same old images once per new uploaded image.

```ts
await ImageQueue.add("optimize-post-image", {
  source: image.buffer
    ? { type: "buffer", data: image.buffer.toString("base64") }
    : { type: "file", path: image.path },
  width: 835,
  height: 577,
  quality: 100,
  fileName: uniqueFileName,
  folderName: folderName,
  oldPublicIds: index === 0 ? oldImagePublicIds : undefined,
});
```

4. Returns the precomputed Cloudinary values to the service:

```ts
return { imageUrl, publicId };
```

Because the upload happens in the worker, the database stores the expected Cloudinary `imageUrl` and `publicId` before the background job has finished uploading the optimized image.

## Queue Setup

File: `src/jobs/queues/imageQueue.ts`

The queue is named `imageQueue` and uses the shared Redis connection.

```ts
const ImageQueue = new Queue("imageQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
});
```

Current retry behavior:

- Failed jobs retry up to `3` times.
- Retry delay uses exponential backoff starting at `1000ms`.
- Completed jobs are removed from Redis.
- Failed jobs are retained up to `1000` failed jobs.

## Worker Step

File: `src/jobs/workers/imageWorker.ts`

The worker listens to the same queue name:

```ts
const imageWorker = new Worker(
  "imageQueue",
  async (job: Job<ImageJobData>) => {
    // process image job
  },
  { connection: redisConnection }
);
```

The worker receives this job data shape:

```ts
interface ImageJobData {
  source:
    | { type: "buffer"; data: string }
    | { type: "file"; path: string };
  width: number;
  height: number;
  quality: number;
  fileName: string;
  folderName: string;
  oldPublicId?: string | null;
  oldPublicIds?: string[];
}
```

### 1. Rebuild The Input Buffer

For memory storage, the controller sends the image buffer as a base64 string. The worker converts it back into a `Buffer`.

```ts
decodedBufferOrFilePath = Buffer.from(source.data, "base64");
```

For disk storage, the controller sends the uploaded file path. The worker reads that file into a `Buffer`.

```ts
decodedBufferOrFilePath = await fs.readFile(source.path);
```

### 2. Optimize With Sharp

File: `src/utils/optimizeImage.ts`

The worker passes the buffer through `optimizedImage`.

```ts
const optimized = await optimizedImage(
  decodedBufferOrFilePath,
  width,
  height,
  quality
);
```

The optimizer resizes the image and converts it to WebP:

```ts
return await sharp(buffer)
  .resize(width, height)
  .webp({ quality: quality })
  .toBuffer();
```

For post images, the controller currently sends:

```text
width: 835
height: 577
quality: 100
format: webp
```

### 3. Upload Optimized Image To Cloudinary

If the source came from memory storage, the worker uploads the optimized buffer directly:

```ts
await uploadBufferImageToCloud(optimized, folderName, fileName);
```

File: `src/config/cloudinary/uploadBufferImageToCloud.ts`

This uses `cloudinary.uploader.upload_stream` and pipes the optimized buffer into Cloudinary.

If the source came from disk storage, the worker writes the optimized buffer back to the same temporary file path, then uploads that file:

```ts
await fs.writeFile(source.path, optimized);
await uploadFileImageToCloud(source.path, folderName, fileName);
```

File: `src/config/cloudinary/uploadFileImageToCloud.ts`

This uses `cloudinary.uploader.upload`.

### 4. Delete Old Cloudinary Image(s)

The worker can delete either one old Cloudinary image or many old Cloudinary images after the new optimized image uploads successfully.

For a single old image, such as the profile-image optimization flow, the job sends `oldPublicId`.

```ts
if (oldPublicId) {
  await deleteImage(oldPublicId).catch((err) => {
    console.error("Failed to delete old image!", err);
  });
}
```

For multiple old images, such as replacing a post's image set, the job sends `oldPublicIds`.

```ts
if (oldPublicIds && oldPublicIds.length > 0) {
  await Promise.all(
    oldPublicIds.map((publicId) =>
      deleteImage(publicId).catch((err) => {
        console.error("Failed to delete old image!", err);
      })
    )
  );
}
```

The delete helper calls Cloudinary's destroy API and returns `true` when Cloudinary responds with `ok`.

```ts
export const deleteImage = async (public_id: string) => {
  const response = await cloudinary.uploader.destroy(public_id);
  return response.result === "ok";
};
```

Important behavior: the worker catches delete failures per image, logs the error, and continues. That means a failed old-image delete does not fail the whole optimization/upload job.

### 5. Clean Up Temporary File

When disk storage is used, the worker removes the temporary upload file in `finally`.

```ts
if (source.type === "file") {
  await fs.unlink(source.path).catch(() => null);
}
```

This runs whether the job succeeds or fails.

## Cloudinary URL Generation

File: `src/config/cloudinary/generateCloudinaryPath.ts`

The controller precomputes the public ID and secure URL before the worker uploads the actual image.

```ts
const publicId = `${folderName}/${fileName}`;

const imageUrl = cloudinary.url(publicId, {
  secure: true,
});
```

Example result:

```text
folderName: eShop.com/post
fileName: 1710000000000-123456789
publicId: eShop.com/post/1710000000000-123456789
imageUrl: https://res.cloudinary.com/<cloud-name>/image/upload/eShop.com/post/1710000000000-123456789
```

## Service Step

File: `src/services/postServices.ts`

After the controller queues all image jobs, it stores the precomputed Cloudinary image records with the post.

```ts
images:
  postData.images && postData.images.length > 0
    ? {
        create: postData.images?.map((img) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId,
        })),
      }
    : undefined,
```

This happens in both `createOnePost` and `updateOnePost`.

## How To Run The Worker

The worker script is defined in `package.json`:

```json
"image:work": "nodemon --exec ts-node -r tsconfig-paths/register src/jobs/workers/imageWorker.ts"
```

Run it with:

```bash
npm run image:work
```

The API process and the image worker process both need access to the same Redis connection.

## Review Notes

- The upload is asynchronous. The API response can complete before the optimized image exists in Cloudinary.
- `generateCloudinaryPath` predicts the Cloudinary URL. It does not confirm that the upload succeeded.
- The worker currently logs completion and failure, but the post record is not updated if a job fails after the database record has already been created.
- `updatePost` now passes the existing post image public IDs as `oldPublicIds` on the first new image job.
- Delete failures are intentionally swallowed inside each `deleteImage(...).catch(...)`, so failed cleanup will not trigger a BullMQ retry.
