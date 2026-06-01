import sharp from "sharp";

export const optimizedImage = async (
  buffer: Buffer,
  width: number,
  height: number,
  quality: number,
) => {
  return await sharp(buffer)
    .resize(width, height) // resize pixels
    .webp({ quality: quality })
    .toBuffer();
};
