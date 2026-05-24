import { v2 as cloudinary } from "cloudinary";

export const deleteImage = async (public_id: string) => {
  const response = await cloudinary.uploader.destroy(public_id);
  return response.result === "ok"; // returns true if deletion was successful
};
