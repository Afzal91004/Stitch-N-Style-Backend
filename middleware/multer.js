import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Only accept images
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 5,
};

const upload = multer({ storage, fileFilter, limits });

export default upload;
