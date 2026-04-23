const fs = require("fs");
const path = require("path");
const { parsePDF } = require("../services/pdfParserService");

const uploadsDir = path.join(__dirname, "..", "uploads");
const DEFAULT_RETENTION_DAYS = 30;
const retentionDaysFromEnv = Number(process.env.UPLOAD_RETENTION_DAYS);
const uploadRetentionDays = Number.isFinite(retentionDaysFromEnv) && retentionDaysFromEnv > 0
  ? retentionDaysFromEnv
  : DEFAULT_RETENTION_DAYS;
const uploadRetentionMs = uploadRetentionDays * 24 * 60 * 60 * 1000;

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getDisplayFileName(storedName) {
  if (!storedName || typeof storedName !== "string") {
    return "Unknown file";
  }

  return storedName.replace(/^[^-]+-\d+-/, "");
}

function belongsToUser(fileName, userId) {
  if (!fileName || !userId) {
    return false;
  }

  return fileName.startsWith(`${userId}-`);
}

async function cleanupOldUploads() {
  let entries = [];

  try {
    entries = await fs.promises.readdir(uploadsDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  const now = Date.now();
  const staleFiles = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
      .map(async (entry) => {
        const absolutePath = path.join(uploadsDir, entry.name);
        const stats = await fs.promises.stat(absolutePath);
        const ageMs = now - stats.mtimeMs;

        return {
          absolutePath,
          isStale: ageMs > uploadRetentionMs,
        };
      })
  );

  await Promise.all(
    staleFiles
      .filter((file) => file.isStale)
      .map((file) => fs.promises.unlink(file.absolutePath).catch(() => {}))
  );
}

async function uploadAndParsePDF(req, res, next) {
  const uploadedFile = req.file;

  try {
    await cleanupOldUploads();

    if (!uploadedFile || !uploadedFile.path) {
      throw createHttpError("PDF file is required", 400);
    }

    const extractedValues = await parsePDF(uploadedFile.path);

    return res.status(200).json({
      success: true,
      data: extractedValues,
      file: {
        originalName: uploadedFile.originalname,
        storedName: uploadedFile.filename,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to process PDF", error.statusCode));
  }
}

async function listRecentUploads(req, res, next) {
  try {
    const userId = req?.user?._id ? String(req.user._id) : "";
    await cleanupOldUploads();
    let files = [];

    try {
      files = await fs.promises.readdir(uploadsDir, { withFileTypes: true });
    } catch (error) {
      if (!error || error.code !== "ENOENT") {
        throw error;
      }
    }

    const pdfFiles = files
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
      .filter((entry) => belongsToUser(entry.name, userId))
      .map((entry) => entry.name);

    const fileDetails = await Promise.all(
      pdfFiles.map(async (fileName) => {
        const absolutePath = path.join(uploadsDir, fileName);
        const stats = await fs.promises.stat(absolutePath);

        return {
          name: fileName,
          displayName: getDisplayFileName(fileName),
          sizeBytes: stats.size,
          uploadedAt: stats.mtime.toISOString(),
        };
      })
    );

    const sortedFiles = fileDetails
      .sort((first, second) => new Date(second.uploadedAt) - new Date(first.uploadedAt))
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: sortedFiles,
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to list uploads", 500));
  }
}

module.exports = {
  uploadAndParsePDF,
  listRecentUploads,
};
