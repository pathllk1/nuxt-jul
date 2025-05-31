// server/api/auth/refresh.post.ts
import { defineEventHandler, getCookie, setCookie, createError } from 'h3';
import { getDb } from '~/server/utils/database';
import jwt from 'jsonwebtoken';

// Access Token Configuration (should match login endpoint's config)
const ACCESS_TOKEN_TTL_SECONDS = parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS || '900'); // Default 15 minutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-jwt-key-for-dev';

// (Optional) Refresh Token Rotation can be added here later
// const REFRESH_TOKEN_TTL_SECONDS = parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || '604800'); // Default 7 days
// import { randomBytes } from 'crypto';

export default defineEventHandler(async (event) => {
  const providedRefreshToken = getCookie(event, 'refresh_auth_token');

  if (!providedRefreshToken) {
    throw createError({
      statusCode: 401, // Unauthorized
      statusMessage: 'Missing refresh token.',
    });
  }

  const db = await getDb();

  try {
    // 1. Find user by the provided refresh token
    const user = await db.get(
      'SELECT * FROM users WHERE refresh_token = ?',
      [providedRefreshToken]
    );

    if (!user) {
      // Token not found or doesn't match any user
      // This could be a compromised token or an old one.
      // For security, clear the refresh token cookie on the client.
      setCookie(event, 'refresh_auth_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      throw createError({
        statusCode: 403, // Forbidden or Unauthorized
        statusMessage: 'Invalid refresh token.',
      });
    }

    // 2. Check if the refresh token has expired (from database)
    if (user.refresh_token_expires_at) {
      const expiryDate = new Date(user.refresh_token_expires_at);
      if (expiryDate < new Date()) {
        // Token has expired. Clear it from DB and client.
        await db.run('UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = ?', [user.id]);
        setCookie(event, 'refresh_auth_token', '', { httpOnly: true, maxAge: 0, path: '/' });
        setCookie(event, 'auth_token', '', { httpOnly: true, maxAge: 0, path: '/' }); // Also clear auth_token
        throw createError({
          statusCode: 403, // Forbidden
          statusMessage: 'Refresh token expired.',
        });
      }
    } else {
      // This case should ideally not happen if expiry is always set during login
      console.warn(`User ${user.id} refresh token has no expiry date in DB.`);
      // Depending on policy, you might deny or allow this. For stricter security, deny.
      setCookie(event, 'refresh_auth_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      throw createError({
        statusCode: 403, // Forbidden
        statusMessage: 'Invalid refresh token state (no expiry).',
      });
    }

    // --- Refresh Token is Valid, Issue New Access Token ---

    // (Optional - Implement Refresh Token Rotation here if desired)
    // If rotating:
    // 1. Generate a new refresh token string & expiry
    // 2. Update DB with new refresh token & expiry for this user
    // 3. Set new refresh_auth_token cookie with the new refresh token & new MaxAge

    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    setCookie(event, 'auth_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
      path: '/',
    });

    return {
      message: 'Access token refreshed successfully.',
      // Do NOT return tokens in the body. Client will use the new cookie.
    };

  } catch (error: any) {
    console.error('Refresh Token Error:', error);
    // If it's an error we already created (like 401/403), rethrow it
    if (error.statusCode) {
      throw error;
    }
    // For other unexpected errors
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred while refreshing token.',
    });
  }
});
