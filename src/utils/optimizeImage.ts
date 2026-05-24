import sharp from "sharp";

export const optimizedImage = async (buffer: Buffer) => {
  return await sharp(buffer)
    .resize(200, 200) // resize to 200x200 pixels
    .webp({ quality: 50 }) // compress size to 50% quality
    .toBuffer();
};