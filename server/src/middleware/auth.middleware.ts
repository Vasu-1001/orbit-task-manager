import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { query } from '../db/pool';
import { AuthenticatedRequest, AuthUser } from '../types';

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Try reading from HttpOnly cookie
    if (req.cookies && req.cookies.orbit_token) {
      token = req.cookies.orbit_token;
    }

    // 2. Fall back to Authorization: Bearer <token> header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is missing. Please log in to continue.',
      });
      return;
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Verify user exists in the database
    const userResult = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'The user account associated with this session no longer exists.',
      });
      return;
    }

    const dbUser = userResult.rows[0];
    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'TokenExpired',
        message: 'Your session has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      error: 'InvalidToken',
      message: 'Invalid or malformed authentication token.',
    });
  }
};
