import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

// Configure Cloudinary if credentials are present
if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  console.log('[Cloudinary] Initialized SDK with cloud name:', config.cloudinary.cloudName);
} else {
  console.log('[Cloudinary] Not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env for production image hosting.');
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export class CloudinaryService {
  /**
   * Upload an image buffer directly to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string = 'orbit_tasks',
    mimetype: string = 'image/jpeg'
  ): Promise<UploadResult> {
    if (!config.cloudinary.isConfigured) {
      // In development fallback mode without Cloudinary credentials:
      // Return a data URI or placeholder to prevent crashes and allow offline work
      console.warn('[Cloudinary Warning] Upload called without credentials; providing resilient local fallback.');
      const base64 = buffer.toString('base64');
      const fallbackUrl = `data:${mimetype};base64,${base64}`;
      return {
        url: fallbackUrl,
        publicId: `local_fallback_${Date.now()}`,
      };
    }

    return new Promise((resolve, reject) => {
      const isSvg = mimetype.includes('svg');
      const uploadOptions: Record<string, any> = {
        folder,
        resource_type: 'auto',
      };

      // Only apply raster transformations for non-SVG images
      if (!isSvg) {
        uploadOptions.transformation = [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
          { max_width: 1920, max_height: 1080, crop: 'limit' },
        ];
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            console.error('[Cloudinary Upload Error]', error);
            return reject(new Error(error?.message || 'Failed to upload image to Cloudinary'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete an image from Cloudinary by public ID
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    if (!publicId || publicId.startsWith('local_fallback_')) {
      return true;
    }

    if (!config.cloudinary.isConfigured) {
      return true;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
      console.log(`[Cloudinary] Deleted asset ${publicId}:`, result);
      return result.result === 'ok';
    } catch (error: any) {
      console.warn(`[Cloudinary Warning] Could not delete asset ${publicId}:`, error.message);
      return false;
    }
  }

  /**
   * Generate an optimized thumbnail URL
   */
  static getThumbnailUrl(publicId: string, width = 300, height = 200): string {
    if (!config.cloudinary.isConfigured || publicId.startsWith('local_fallback_')) {
      return '';
    }
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }
}
