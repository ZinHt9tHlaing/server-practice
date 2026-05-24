import { Worker, Job } from "bullmq";
import { optimizedImage } from "@/utils/optimizeImage";
import { uploadBufferImageToCloud } from "@/config/cloudinary/uploadBufferImageToCloud";
import { getUserById, updateUser } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";
import redisConnection from "@/config/redisClient";
import fs from "node:fs/promises";

type ImageSource =
  | { type: "buffer"; data: string } // base64 string (NOT Buffer)
  | { type: "file"; path: string }; // file path for local upload for diskStorage

interface ImageJobData {
  userId: string;
  source: ImageSource;
  fileName?: string;
}

// Create a worker to process the image optimization job
const imageWorker = new Worker(
  "imageQueue",
  async (job: Job<ImageJobData>) => {
    const { userId, source, fileName } = job.data;

    const user = await getUserById(userId);
    checkUserIfNotExist(user);

    let decodedBuffer: Buffer;
    let optimized;

    try {
      // Decode base64 string to Buffer
      if (source.type === "buffer") {
        decodedBuffer = Buffer.from(source.data, "base64");
      } else {
        decodedBuffer = await fs.readFile(source.path);
      }

      // Optimize image before upload to cloudinary
      optimized = await optimizedImage(decodedBuffer);
      if (!optimized) {
        throw new Error("Failed to optimize image");
      }

      const result = await uploadBufferImageToCloud(
        optimized,
        "eShop.com/profile/optimize",
        fileName,
        "webp"
      );

      if (result) {
        const userData = {
          image: {
            upsert: {
              create: {
                imageUrl: result.image_url,
                publicId: result.public_id,
              },
              update: {
                imageUrl: result.image_url,
                publicId: result.public_id,
              },
            },
          },
        };

        await updateUser(user!.id, userData);
      }
    } catch (error) {
      console.error("Error uploading image to cloudinary:", error);
      throw new Error("Failed to upload image to cloudinary");
    }
  },
  { connection: redisConnection }
);

imageWorker.on("completed", (job) => {
  console.log(`✅ Job completed with result ${job.id}`);
});

imageWorker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed with error: ${error.message}`);
});
