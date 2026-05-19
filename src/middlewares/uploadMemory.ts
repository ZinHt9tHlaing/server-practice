import multer from "multer";

const storage = multer.memoryStorage();

// Upload to memory
const uploadMemory = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (optional)
  },
});

export default uploadMemory;
