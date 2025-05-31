// middleware/admin.ts
import { defineNuxtRouteMiddleware, navigateTo, useError } from '#app'; // Nuxt 3 imports

// Re-using the placeholder for client-side auth state/store.
// This would ideally be a shared composable.
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

function useAuthClientAdmin() {
  const user = useState<User | null>('user_auth_state', () => null); // Same state as in auth.ts
  return {
    isLoggedIn: computed(() => !!user.value),
    isAdmin: computed(() => user.value?.role === 'admin'),
    user,
    fetchUser: async () => { // Function to fetch user if not in state
        if (user.value) return user.value;
        try {
            // Use the new composable
            // useApiFetch should be auto-imported
            const data = await useApiFetch<{ user: User }>('/api/users/me');
            if (data && data.user) {
                user.value = data.user;
                return data.user;
            }
            user.value = null;
            return null;
        } catch (e: any) {
            // console.error('admin.ts middleware: fetchUser failed with useApiFetch', e.message);
            user.value = null;
            return null;
        }
    }
  };
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  const showError = useError(); // Nuxt 3 error handling

  if (process.server) {
    // Server-side: Fetch user data. /api/users/me is protected by server/middleware/auth.ts
    try {
      const data = await $fetch<{ user: User }>('/api/users/me', {
        headers: useRequestHeaders(['cookie']) as HeadersInit,
      });

      if (!data.user) { // Should not happen if /api/users/me is hit after server auth middleware
        return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
      }
      if (data.user.role !== 'admin') {
        return showError({ statusCode: 403, statusMessage: 'Forbidden: Access is restricted to administrators.' });
        // Or navigateTo('/unauthorized') or navigateTo('/')
      }
      // If admin, allow access. Client state will be populated on client from payload.
    } catch (error) {
      // Error fetching user (e.g., token invalid, API error)
      // console.error('SSR Admin Middleware Error:', error);
      return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
    }
  } else {
    // Client-side
    const { isLoggedIn, isAdmin, fetchUser } = useAuthClientAdmin();

    let currentUser = isLoggedIn.value ? useAuthClientAdmin().user.value : null;

    if (!currentUser) {
      currentUser = await fetchUser();
    }

    if (!currentUser) { // Not logged in
      return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
    }

    if (currentUser.role !== 'admin') { // Logged in, but not an admin
      return showError({ statusCode: 403, statusMessage: 'Forbidden: Access is restricted to administrators.' });
      // Or navigateTo('/unauthorized') or navigateTo('/')
    }
    // If admin, allow navigation.
  }
});
