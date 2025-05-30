// server/api/auth/login.post.ts
import { defineEventHandler, readBody, createError, setCookie } from 'h3';
import { getDb } from '~/server/utils/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Ensure you have a JWT_SECRET in your environment or a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-jwt-key-for-dev';
// TODO: Add JWT_SECRET to .env for production and inform user.

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body; // Or username, if you want to allow login with username

  // 1. Validate input
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing email or password',
    });
  }

  const db = await getDb();

  try {
    // 2. Find user by email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      throw createError({
        statusCode: 401, // Unauthorized
        statusMessage: 'Invalid credentials', // Generic message for security
      });
    }

    // 3. Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401, // Unauthorized
        statusMessage: 'Invalid credentials', // Generic message
      });
    }

    // 4. Generate JWT
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '1d', // Token expiration (e.g., 1 day, 7d, 1h)
    });

    // 5. Set JWT in an HTTPOnly cookie (more secure than local storage)
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // Or 'strict'
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: '/', // Cookie available for all paths
    });

    // Also return user info (excluding password and token, as token is in cookie)
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Login successful',
      user: userWithoutPassword,
      // Optionally, you could return the token here too if not using cookies exclusively
      // token: token
    };

  } catch (error: any) {
    console.error('Login Error:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during login.',
    });
  }
});
