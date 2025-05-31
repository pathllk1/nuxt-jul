// composables/useApiFetch.ts
import { type UseFetchOptions, createError, useRouter, useState } from '#app';
import { $fetch } from 'ofetch'; // Or import { ofetch } from 'ofetch';

// Define AuthUser interface (ensure it's consistent)
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  accessTokenExpiresAt?: number | null;
}

// Module-scoped variables for global refresh lock mechanism
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

export function useApiFetch() { // This is the main composable function
  // Nuxt composables like useState and useRouter are called inside here,
  // ensuring they execute within a valid Nuxt context when useApiFetch() is called.
  const userAuthState = useState<AuthUser | null>('user_auth_state', () => null);
  const router = useRouter(); // This is now correctly scoped.

  const customFetch = async <T>(
    currentPath: string,
    currentOptions: UseFetchOptions<T> = {} // Provide default for options
  ): Promise<T> => {
    try {
      // @ts-ignore // currentOptions might not perfectly match $fetch options type, but usually compatible
      return await $fetch<T>(currentPath, currentOptions);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          // Create the refresh promise
          refreshPromise = (async () => {
            try {
              // console.log('useApiFetch: Attempting token refresh...');
              const refreshResponse = await $fetch<{ newAccessTokenExpiresAt: number }>('/api/auth/refresh', { method: 'POST' });
              if (userAuthState.value && typeof refreshResponse.newAccessTokenExpiresAt === 'number') {
                userAuthState.value.accessTokenExpiresAt = refreshResponse.newAccessTokenExpiresAt;
              }
              // console.log('useApiFetch: Token refresh successful.');
            } catch (e: any) {
              // console.error('useApiFetch: Token refresh failed.', e);
              userAuthState.value = null; // Clear auth state
              // Do not navigate from here, throw an error that page/middleware can catch
              throw createError({
                statusCode: 401,
                statusMessage: 'Session expired. Please log in again.',
                fatal: false, // Not fatal for client-side, page can handle redirect
                data: e
              });
            } finally {
              isRefreshing = false;
              // Don't nullify refreshPromise here, let awaiters finish with it.
              // It will be overwritten if a new refresh starts.
            }
          })();
        }

        // All requests (the one that got 401, and any subsequent ones while refreshing)
        // will await the current refreshPromise.
        try {
          await refreshPromise;
          // Once refreshPromise resolves (successfully, otherwise it throws), retry original request.
          // The cookie should have been updated by the /api/auth/refresh call.
          // console.log(`useApiFetch: Retrying request to ${currentPath} after refresh.`);
          // @ts-ignore
          return await $fetch<T>(currentPath, currentOptions);
        } catch (e) { // Catches error from refreshPromise or from the retried $fetch
          // console.error(`useApiFetch: Error after token refresh or during retry for ${currentPath}:`, e);
          // If the error is the specific 401 we throw from refresh failure, rethrow it.
          if (e instanceof Error && (e as any).statusCode === 401 && (e as any).message === 'Session expired. Please log in again.') {
            throw e;
          }
          // For other errors (e.g. retry still fails, or different error from refreshPromise), wrap or rethrow.
          throw createError({
            statusCode: (e as any).response?.status || 500, // Use error status if available
            statusMessage: (e as any).message || 'An error occurred after attempting token refresh.',
            data: e
          });
        } finally {
            // If this was the request that initiated the refresh, and it's now done (success or fail for retry)
            // we can consider clearing the promise if no other request is waiting for THIS specific promise.
            // This part is tricky. For now, refreshPromise is overwritten if a new refresh starts.
            // If isRefreshing is false, it means the refresh cycle (including potential retries for the first request) is over.
            if (!isRefreshing && refreshPromise !== null) { // Check if it's the same promise that just completed
                // To prevent clearing a new promise if another request initiated one in a race condition
                // This logic for clearing refreshPromise needs to be very careful.
                // The simplest is to let it be overwritten by a new refresh cycle.
            }
        }
      }
      // For non-401 errors, just rethrow
      throw error;
    }
  };

  // The composable `useApiFetch()` returns the actual `customFetch` function.
  // Usage: const apiFetch = useApiFetch(); const data = await apiFetch('/some/path');
  return customFetch;
}
