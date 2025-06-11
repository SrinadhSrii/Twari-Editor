import { Request, Response, NextFunction } from 'express';
import jwt from '../utils/jwt';

// Extend the Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      accessToken?: string;
    }
  }
}

/**
 * Authentication middleware that verifies JWT tokens and sets user info on request
 */
export async function verifyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify authentication and get access token
    const accessToken = await jwt.verifyAuth(req);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the session token to get user info
    const payload = await jwt.verifySessionToken(token);

    // Set user info and access token on request object
    req.user = payload.user;
    req.accessToken = accessToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to verify access token only (for routes that don't need user session)
 */
export async function verifyAccessTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const accessToken = await jwt.verifyAuth(req);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.accessToken = accessToken;
    next();
  } catch (error) {
    console.error('Access token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}