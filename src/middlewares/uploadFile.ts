import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");

    // const type = file.mimetype.split("/")[0]; // eg: image/png => image
    // if (type === "image") {
    //   cb(null, "uploads/images");
    // } else {
    //   // if not image, store in files
    //   cb(null, "uploads/files");
    // }
  },
  filename: function (req, file, cb) {
    const extension = file.mimetype.split("/")[1]; // eg: image/png => png
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + extension;
    cb(null, uniqueSuffix);
  },
});

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

// Upload to disk ( server )
const uploadFile = multer({
  storage: fileStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // Maximum file size is 10MB, so image optimization is needed.
});

export default uploadFile;
