// server/middleware/auth.ts
import { defineEventHandler, getCookie, createError } from 'h3';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-jwt-key-for-dev'; 
// Ensure this matches the one in login.post.ts

interface UserPayload {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  // Add other fields from token if any
}

// Extend the H3EventContext to include the user
declare module 'h3' {
  interface H3EventContext {
    user?: UserPayload;
  }
}

export default defineEventHandler(async (event) => {
  const { path } = event.node.req; // Get the path of the request

  // List of unprotected API routes (exact paths)
  const unprotectedApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    // Add other public API routes here, e.g., /api/public/some-data
  ];

  // We are primarily concerned with protecting API routes here.
  // Page rendering protection will be handled by Nuxt page middleware.
  if (path && path.startsWith('/api/')) {
    // If the path is one of our unprotected auth routes, do nothing.
    if (unprotectedApiRoutes.includes(path)) {
      return;
    }

    const token = getCookie(event, 'auth_token');

    if (!token) {
      // For any other API route, if no token, it's an error.
      // console.log(`No token for protected API route: ${path}`);
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Missing authentication token.',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      event.context.user = decoded; // Attach user to context
      // console.log(`User ${decoded.username} authenticated for API route: ${path}`);
    } catch (error) {
      // console.error(`Invalid token for API route ${path}:`, error);
      // If token is invalid (e.g., expired, malformed)
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid or expired token.',
      });
    }
  }
  // For non-API routes, or if logic needs to be different, adjust accordingly.
  // This server middleware primarily focuses on securing API endpoints.
  // Client-side route protection will be handled by Nuxt page middleware.
});
