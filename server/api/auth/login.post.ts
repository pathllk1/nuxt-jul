// server/api/auth/login.post.ts
import { defineEventHandler, readBody, createError, setCookie } from 'h3';
import { getDb } from '~/server/utils/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto'; // For generating refresh token

// --- Token Configuration ---
// Access Token: Short-lived, for accessing resources
const ACCESS_TOKEN_TTL_SECONDS = parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS || '900'); // Default 15 minutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-jwt-key-for-dev';

// Refresh Token: Long-lived, for obtaining new access tokens
const REFRESH_TOKEN_TTL_SECONDS = parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || '604800'); // Default 7 days
// Note: Refresh tokens are typically opaque strings and not JWTs themselves,
// but could be JWTs if you need them to be self-contained and verifiable without DB lookup for some checks.
// For this implementation, we'll generate a secure random string for the refresh token.

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email or password' });
  }

  const db = await getDb();

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
    }

    // --- Generate Access Token (JWT) ---
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const accessTokenExpiresInSeconds = ACCESS_TOKEN_TTL_SECONDS; // Defined at top of file
    const accessTokenActualExpiryTimestampSeconds = nowInSeconds + accessTokenExpiresInSeconds;

    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      // exp: accessTokenActualExpiryTimestampSeconds, // jwt.sign handles 'exp' based on 'expiresIn'
    };
    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: accessTokenExpiresInSeconds, // Use the variable
    });

    // --- Generate Refresh Token (Secure Random String) ---
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

    // --- Store Refresh Token in Database ---
    await db.run(
      'UPDATE users SET refresh_token = ?, refresh_token_expires_at = ? WHERE id = ?',
      [refreshToken, refreshTokenExpiresAt.toISOString(), user.id]
    );

    // --- Set Cookies ---
    // Access Token Cookie
    setCookie(event, 'auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_TTL_SECONDS, // MaxAge should match token expiry
      path: '/',
    });

    // Refresh Token Cookie
    setCookie(event, 'refresh_auth_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Consider 'strict' if appropriate for your app
      maxAge: REFRESH_TOKEN_TTL_SECONDS, // MaxAge should match token expiry
      path: '/', // Typically same path, or a more specific one like /api/auth/refresh
    });

    const { password: _, refresh_token: __, refresh_token_expires_at: ___, ...userWithoutSensitiveData } = user;

    return {
      message: 'Login successful',
      user: userWithoutSensitiveData, // Return user data (excluding sensitive fields)
      accessTokenExpiresAt: accessTokenActualExpiryTimestampSeconds * 1000, // Convert to milliseconds for client
      // Tokens are not returned in the body as they are in HttpOnly cookies
    };

  } catch (error: any) {
    console.error('Login Error:', error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'An unexpected error occurred during login.' });
  }
});
