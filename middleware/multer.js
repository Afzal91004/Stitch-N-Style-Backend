import multer from "multer";

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("File is not an image!"), false);
  }
  cb(null, true);
};

// Use memory storage instead of disk storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
});

export default upload;
