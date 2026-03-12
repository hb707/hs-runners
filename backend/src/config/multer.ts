import multer from 'multer';
import { env } from './env';
import { AppError } from '../middleware/error.middleware';

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
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});
