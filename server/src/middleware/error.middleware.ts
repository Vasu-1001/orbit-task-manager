import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  
  // Safe logging without leaking sensitive payload info
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    code: err.code,
    statusCode,
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    res.status(409).json({
      error: 'Conflict',
      message: 'A record with the given unique identifier or email already exists.',
    });
    return;
  }

  if (err.code === '22P02') {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Invalid data format or malformed resource identifier.',
    });
    return;
  }

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: statusCode === 500 && config.nodeEnv === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
};
