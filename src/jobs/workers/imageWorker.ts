import fs from "node:fs/promises";
import { Worker, Job } from "bullmq";
import redisConnection from "@/config/redisClient";
import { optimizedImage } from "@/utils/optimizeImage";
import { uploadBufferImageToCloud } from "@/config/cloudinary/uploadBufferImageToCloud";
import { uploadFileImageToCloud } from "@/config/cloudinary/uploadFileImageToCloud";
import { deleteImage } from "@/config/cloudinary/deleteImage";

type ImageSource =
  | { type: "buffer"; data: string } // base64 string
  | { type: "file"; path: string }; // diskStorage path

interface ImageJobData {
  source: ImageSource;
  width: number;
  height: number;
  quality: number;
  fileName: string;
  folderName: string;
  oldPublicId?: string | null;
}

const imageWorker = new Worker(
  "imageQueue",
  async (job: Job<ImageJobData>) => {
    const {
      source,
      width,
      height,
      quality,
      fileName,
      folderName,
      oldPublicId,
    } = job.data;

    let decodedBufferOrFilePath: Buffer;

    try {
      if (source.type === "buffer") {
        // Convert base64 string to buffer
        decodedBufferOrFilePath = Buffer.from(source.data, "base64");
      } else {
        // Read file path
        decodedBufferOrFilePath = await fs.readFile(source.path);
      }

      // Optimize image => return buffer
      const optimized = await optimizedImage(
        decodedBufferOrFilePath,
        width,
        height,
        quality
      );
      if (!optimized) {
        throw new Error("Failed to optimize image");
      }

      if (source.type === "buffer") {
        // Upload from buffer (memoryStorage)
        await uploadBufferImageToCloud(optimized, folderName, fileName);
        console.log("✅ Stored via Cloudinary (MemoryStorage)");
      } else {
        // Write optimized buffer to temp file
        await fs.writeFile(source.path, optimized); // for the disk storage

        // Uploading to Cloudinary using a file path
        await uploadFileImageToCloud(source.path, folderName, fileName);
        console.log("✅ Stored via Cloudinary (DiskStorage)");
      }

      // Delete old image if it exists
      if (oldPublicId) {
        await deleteImage(oldPublicId).catch((err) => {
          console.error("Failed to delete old profile image!", err);
        });
      }
    } catch (error) {
      console.error("Error optimizing image in worker:", error);
      throw new Error("Failed to process image in worker");
    } finally {
      // If there is an error or no error occurs, delete the temporary files
      if (source.type === "file") {
        await fs.unlink(source.path).catch(() => null);
      }
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
