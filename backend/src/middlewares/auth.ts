// backend/src/middlewares/auth.ts
// Authentication Middleware - With Backwards Compatibility

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

/**
 * Middleware to authenticate JWT token
 * Uses extended Express.Request type with user property
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
    };

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Alias for authenticateToken (for backwards compatibility)
 * Use this if your routes import 'protect' instead of 'authenticateToken'
 */
export const protect = authenticateToken;

/**
 * Optional: Middleware to authenticate but not require token
 * Adds user to request if token is valid, but continues if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as {
        userId: string;
        email: string;
      };

      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch {
      // Invalid token, but continue without user
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};