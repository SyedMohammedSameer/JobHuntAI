// backend/src/types/express.d.ts
// Extend Express Request type to include user property

import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      email: string;
      _id?: any; // For backwards compatibility with existing authController
    };
  }
}