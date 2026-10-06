import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { query } from '../db/pool';
import { User, AuthUser } from '../types';
import { sendWelcomeEmail } from './email.service';

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.code = '23505';
      throw err;
    }

    // Hash password with bcrypt (salt rounds 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Persist new user
    const insertRes = await query<User>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, updated_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const newUser = insertRes.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    // Send welcome email asynchronously (non-blocking)
    sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.warn('[Email Warning] Failed to dispatch welcome email:', err.message);
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    };
  }

  /**
   * Log in an existing user
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    // Query user by email
    const userRes = await query<User>(
      'SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].password_hash) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const user = userRes.rows[0];

    // Safely compare password
    const isMatch = await bcrypt.compare(password, user.password_hash!);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }

  /**
   * Retrieve user profile
   */
  static async getProfile(userId: string): Promise<AuthUser> {
    const res = await query<User>('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }
    return {
      id: res.rows[0].id,
      name: res.rows[0].name,
      email: res.rows[0].email,
    };
  }
}
