import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../env";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

// upload from file
export const uploadFileImageToCloud = async (
  image: string,
  folder_name: string,
  fileName?: string,
  fileFormat?: string
) => {
  const response = await cloudinary.uploader.upload(image, {
    folder: folder_name,
    public_id: fileName,
    format: fileFormat,
  });
  return {
    image_url: response.secure_url,
    public_id: response.public_id,
  };
};
