// server/api/users/me.get.ts
import { defineEventHandler, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // The server/middleware/auth.ts should have already run.
  // If the user is authenticated, event.context.user will be populated.
  // If not, the auth middleware would have thrown a 401 error for API routes.

  if (!event.context.user) {
    // This case should ideally be caught by the main auth middleware for API routes.
    // However, having an explicit check here is a safeguard.
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: You must be logged in to access this resource.',
    });
  }

  // Return the user information from the context
  // The password is not included in event.context.user as per our token payload.
  return {
    user: event.context.user,
  };
});
