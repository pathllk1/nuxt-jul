// server/api/auth/logout.post.ts
import { defineEventHandler, setCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // Clear the auth_token cookie by setting its value to empty and maxAge to 0 or a past date.
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Match settings used during login
    sameSite: 'lax', // Match settings used during login
    maxAge: 0, // Instructs the browser to delete the cookie immediately
    path: '/', // Ensure the path matches the original cookie's path
  });

  return {
    message: 'Logout successful. Cookie cleared.',
  };
});
