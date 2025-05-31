// server/api/auth/register.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { getDb } from '~/server/utils/database';
import bcrypt from 'bcryptjs'; // Can use direct import here as it's an API route

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, email, password } = body;

  // 1. Validate input
  if (!username || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing username, email, or password',
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format',
    });
  }

  // Password complexity (example: at least 6 characters)
  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 6 characters long',
    });
  }

  const db = await getDb();

  // 2. Check if username or email already exists
  try {
    const existingUser = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      throw createError({
        statusCode: 409, // Conflict
        statusMessage: 'Username or email already exists',
      });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds

    // 4. Store the new user (default role is 'user' as per table schema)
    const result = await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    if (!result.lastID) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to register user: Could not get lastID'
        });
    }

    // 5. Return success (excluding password)
    // It's good practice to refetch the user to ensure you get the default values (like ID, role)
    const newUser = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [result.lastID]);

    if (!newUser) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to register user: Could not retrieve new user'
        });
    }

    return {
      message: 'User registered successfully',
      user: newUser,
    };

  } catch (error: any) {
    // Log the error for server-side debugging
    console.error('Registration Error:', error);

    // If it's an error we threw with createError, rethrow it
    if (error.statusCode) {
      throw error;
    }

    // For other errors, return a generic server error
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during registration.',
    });
  }
});
