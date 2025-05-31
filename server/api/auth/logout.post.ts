// server/api/auth/logout.post.ts
import { defineEventHandler, getCookie, setCookie, createError } from 'h3';
import { getDb } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const refreshTokenFromCookie = getCookie(event, 'refresh_auth_token');

  if (refreshTokenFromCookie) {
    try {
      const db = await getDb();
      // Invalidate the refresh token in the database
      // We find the user by the refresh token they presented, then clear their token fields.
      // This ensures we only clear the token for the user who is actually logging out.
      const result = await db.run(
        'UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE refresh_token = ?',
        [refreshTokenFromCookie]
      );

      // Optional: Log if a token was actually cleared or not found for extra insight
      // if (result.changes > 0) {
      //   console.log(`Refresh token invalidated for user during logout.`);
      // } else {
      //   console.log(`Logout attempt with a refresh token that was not found in DB or already null.`);
      // }

    } catch (dbError: any) {
      // Log the database error but proceed to clear cookies anyway,
      // as the primary goal of logout is to clear client-side session.
      console.error('Database error during logout (clearing refresh token):', dbError);
      // Optionally, you could rethrow or handle this more gracefully if DB access is critical
      // For now, we prioritize clearing cookies.
    }
  }

  // Clear the access token cookie
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Delete cookie
    path: '/',
  });

  // Clear the refresh token cookie
  setCookie(event, 'refresh_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Delete cookie
    path: '/',
  });

  return {
    message: 'Logout successful. Authentication tokens cleared.',
  };
});
