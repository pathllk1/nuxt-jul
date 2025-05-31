// composables/useApiFetch.ts
import { type UseFetchOptions } from '#app'; // Nuxt 3 types for options consistency
import { $fetch } from 'ofetch'; // ofetch is the underlying fetch library Nuxt uses
import { createError, useState } from '#app'; // Nuxt composables, useRouter removed as it's not used

// Define AuthUser interface (consistent with login page)
export interface AuthUser { // Export if it were to be shared, local for now
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  accessTokenExpiresAt?: number | null; // Milliseconds UTC
}

// Shared auth state
const userAuthState = useState<AuthUser | null>('user_auth_state', () => null);

// Variable to prevent multiple concurrent refresh attempts
let isRefreshing = false;
// Queue for requests that came in while token was refreshing
// This is a simplified promise that resolves when refreshing is done, allowing retry.
let refreshPromise: Promise<void> | null = null;


export function useApiFetch<DataT = unknown>(
  path: string,
  options: UseFetchOptions<DataT> = {}
) {
  // const router = useRouter(); // Avoid using router directly in low-level composable for navigation

  const customFetch = async <T = DataT>(
    currentPath: string,
    currentOptions: UseFetchOptions<T>
  ): Promise<T> => {
    try {
      // @ts-ignore: currentOptions might not perfectly match ofetch options but generally compatible
      return await $fetch<T>(currentPath, currentOptions);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = (async () => {
            try {
              // console.log(`Attempting token refresh due to 401 on ${currentPath}...`);
              interface RefreshResponse {
                message: string;
                newAccessTokenExpiresAt: number;
              }
              const refreshResponse = await $fetch<RefreshResponse>('/api/auth/refresh', { method: 'POST' });
              // console.log('Token refresh successful.');
              if (userAuthState.value && typeof refreshResponse.newAccessTokenExpiresAt === 'number') {
                userAuthState.value.accessTokenExpiresAt = refreshResponse.newAccessTokenExpiresAt;
              }
            } catch (refreshError: any) {
              // console.error('Token refresh failed:', refreshError);
              userAuthState.value = null; // Clear auth state (user and expiry)
              // router.push('/login'); // Avoid navigation side-effects
              throw createError({ statusCode: 401, statusMessage: 'Session expired. Please log in again.', fatal: false, data: refreshError });
            } finally {
              isRefreshing = false;
              refreshPromise = null; // Clear the promise
            }
          })();
        }

        // Wait for the refresh attempt to complete if it's already in progress by another call
        if (refreshPromise) {
            try {
                await refreshPromise; // This ensures that the refresh logic (including setting new expiry) has completed
                 // Retry the original request with the new token (cookie should be updated)
                // console.log(`Retrying original request to ${currentPath} after refresh.`);
                // @ts-ignore
                return await $fetch<T>(currentPath, currentOptions);
            } catch (retryError: any) { // This catch is for errors from await refreshPromise or the subsequent $fetch
                 // If refreshPromise threw (e.g. refresh failed), it's already a createError from above.
                // console.error(`Retry failed for ${currentPath} after token refresh attempt:`, retryError);
                // If it's the specific error from refreshPromise, it's already a createError
                if (retryError.statusCode === 401 && retryError.message === 'Session expired. Please log in again.') {
                    throw retryError;
                }
                // Otherwise, throw a new one or the original error.
                throw createError({ statusCode: 401, statusMessage: 'Session expired or invalid after refresh. Please log in again.', fatal: false, data: retryError });
            }
        } else {
            // This case should ideally not be hit if refreshPromise logic is sound.
            // Fallback if isRefreshing was true but refreshPromise was null (should not happen).
            throw error;
        }

      }
      throw error; // Propagate other errors
    }
  };

  // Merge options - for now, we're not adding many defaults here as $fetch handles cookies.
  // Options like headers (e.g., 'Content-Type': 'application/json') could be defaulted here.
  const mergedOptions = { ...options };

  // The composable returns a promise from customFetch directly
  return customFetch(path, mergedOptions);
}
