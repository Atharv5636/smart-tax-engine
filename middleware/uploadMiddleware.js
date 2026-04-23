const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const userId = req?.user?._id ? String(req.user._id) : "anonymous";
    const safeName = `${userId}-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    return cb(null, true);
  }

  const error = new Error("Only PDF files are allowed");
  error.statusCode = 400;
  return cb(error, false);
}

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function uploadPDF(req, res, next) {
  const middleware = uploader.single("file");

  middleware(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const uploadError = new Error(error.message || "File upload failed");
      uploadError.statusCode = 400;
      return next(uploadError);
    }

    return next(error);
  });
}

module.exports = {
  uploadPDF,
};
