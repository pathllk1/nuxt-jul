// server/utils/rbac.ts
import type { H3Event } from 'h3'; // Import H3Event for type safety

// Define available roles (could be an enum or a const array)
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const; // Use 'as const' for stricter type checking

export type UserRole = typeof ROLES[keyof typeof ROLES]; // 'admin' | 'user'

// Helper function to check if the current user (from event.context) has a specific role
export function hasRole(event: H3Event, role: UserRole | UserRole[]): boolean {
  const user = event.context.user;

  if (!user || !user.role) {
    return false;
  }

  if (Array.isArray(role)) {
    return role.includes(user.role as UserRole);
  }
  
  return user.role === role;
}

// Specific check for admin role - convenience function
export function isAdmin(event: H3Event): boolean {
  return hasRole(event, ROLES.ADMIN);
}

// Example of how this might be used in a protected API route:
/*
// server/api/admin/some-admin-action.post.ts
import { defineEventHandler, createError } from 'h3';
import { isAdmin } from '~/server/utils/rbac'; // Path might vary based on Nuxt version/setup

export default defineEventHandler(async (event) => {
  // The server/middleware/auth.ts should have already run and populated event.context.user if authenticated.
  // If not authenticated, the middleware would have thrown an error.

  if (!isAdmin(event)) {
    throw createError({
      statusCode: 403, // Forbidden
      statusMessage: 'Access denied: Administrator role required.',
    });
  }

  // Proceed with admin-only action
  return { message: 'Admin action successful!' };
});
*/
