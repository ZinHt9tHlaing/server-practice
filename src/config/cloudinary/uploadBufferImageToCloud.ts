import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { ENV } from "../env";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

// upload from buffer
export const uploadBufferImageToCloud = (
  buffer: Buffer,
  folder_name: string,
  fileName?: string,
  fileFormat?: string
): Promise<{ image_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder_name,
        public_id: fileName,
        format: fileFormat,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve({
          image_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
