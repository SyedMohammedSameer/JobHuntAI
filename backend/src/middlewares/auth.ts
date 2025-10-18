import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import User, { IUser } from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

// Protect routes - requires valid JWT token
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.',
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Authorization denied.',
      });
      return;
    }
    
    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.',
      });
      return;
    }
    
    // Attach user to request
    req.user = user;
    req.userId = (user._id as any).toString();
    
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid token. Authorization denied.',
    });
  }
};

// Premium-only routes
export const premiumOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }
    
    if (req.user.subscriptionTier !== 'PREMIUM') {
      res.status(403).json({
        success: false,
        message: 'This feature requires a Premium subscription.',
        upgradeUrl: '/premium',
      });
      return;
    }
    
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.',
    });
  }
};

// Feature usage check (for free tier limits)
export const checkFeatureUsage = (feature: 'resumeTailoring' | 'coverLetters') => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }
      
      // Check if user can use the feature
      if (!req.user.canUseFeature(feature)) {
        const limits = {
          resumeTailoring: 5,
          coverLetters: 3,
        };
        
        res.status(403).json({
          success: false,
          message: `You've reached your monthly limit of ${limits[feature]} ${feature}. Upgrade to Premium for unlimited access.`,
          currentUsage: req.user.monthlyUsage[feature],
          limit: limits[feature],
          upgradeUrl: '/premium',
        });
        return;
      }
      
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Server error during feature check.',
      });
    }
  };
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = (user._id as any).toString();
      }
    }
    
    next();
  } catch (error) {
    // Silently fail - this is optional auth
    next();
  }
};