import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const rawPort = process.env.PORT;
const parsedPort = rawPort ? parseInt(rawPort, 10) : 5000;
const port = Number.isNaN(parsedPort) || parsedPort <= 0 ? 5000 : parsedPort;

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_2026_change_in_production!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  },
  email: {
    apiKey: process.env.BREVO_API_KEY || '',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    from: process.env.EMAIL_FROM || 'ORBIT Work OS <noreply@orbit.app>',
    isConfigured: Boolean(process.env.BREVO_API_KEY)
  }
};
