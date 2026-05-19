import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./env";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

export const uploadSingleImage = async (image: string, folder_name: string) => {
  const response = await cloudinary.uploader.upload(image, {
    folder: folder_name,
  });
  return {
    image_url: response.secure_url,
    public_id: response.public_id,
  };
};

export const deleteImage = async (public_id: string) => {
  const response = await cloudinary.uploader.destroy(public_id);
  return response.result === "ok"; // returns true if deletion was successful
};
