import { SignJWT, jwtVerify } from 'jose';
import { Request } from 'express';
import { getAccessTokenFromSiteId, getAccessTokenFromUserId } from './database';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface JWTPayload {
  user: User;
}

// Secret key for JWT signing and verification
const JWT_SECRET = new TextEncoder().encode(process.env.WEBFLOW_CLIENT_SECRET || 'your-secret-key');

/**
 * Creates a session token for a user.
 */
export async function createSessionToken(user: User) {
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now

  const sessionToken = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(JWT_SECRET);

  return { sessionToken, exp };
}

/**
 * Verifies a session token and returns the payload if valid.
 */
export async function verifySessionToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Validate that the payload has the expected structure
    if (!payload || typeof payload !== 'object' || !('user' in payload)) {
      throw new Error('Invalid token payload structure');
    }
    
    const user = payload.user as any;
    if (!user || typeof user !== 'object' || !user.id || !user.email) {
      throw new Error('Invalid user data in token');
    }
    
    return {
      user: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Gets an access token from the database using the site ID from the request body.
 */
export async function getAccessToken(request: Request): Promise<string | null> {
  try {
    const { siteId } = request.body;

    if (!siteId) {
      console.error('No siteId provided in request body');
      return null;
    }

    const accessToken = await getAccessTokenFromSiteId(siteId);
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Verifies authentication by extracting session token from Authorization header
 * and retrieving the associated access token from database.
 */
export async function verifyAuth(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.authorization;
    const sessionToken = authHeader?.split(' ')[1]; // Extract token from 'Bearer <token>'

    if (!sessionToken) {
      return null;
    }

    // Verify session token
    const { user } = await verifySessionToken(sessionToken);
    
    // Get access token from user ID
    const accessToken = await getAccessTokenFromUserId(user.id);
    
    return accessToken;
  } catch (error) {
    console.error('Error verifying auth:', error);
    return null;
  }
}

export default {
  createSessionToken,
  verifySessionToken,
  getAccessToken,
  verifyAuth,
};