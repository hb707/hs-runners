import multer from 'multer';
import path from 'path';
import { ulid } from 'ulid';
import { env } from './env';
import { AppError } from '../middleware/error.middleware';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(env.UPLOADS_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `rec_${ulid()}${ext}`);
  },
});

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only image files are allowed (JPEG, PNG, HEIC, WebP)'));
  }
}

const maxSizeMb = parseInt(env.MAX_UPLOAD_SIZE_MB, 10) || 10;

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});
