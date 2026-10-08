import multer from 'multer';
import { Request } from 'express';

// Use memory storage so image buffers stream directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isImageMime = file.mimetype.startsWith('image/');
  const hasImageExt = /\.(jpe?g|png|webp|gif|svg|bmp|tiff?|ico|avif|heic|heif)$/i.test(file.originalname);

  if (isImageMime || hasImageExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are accepted.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
});
