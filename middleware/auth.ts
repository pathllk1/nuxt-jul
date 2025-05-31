// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from '#app'; // Nuxt 3 imports

// Define User interface locally or import if global
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

// Placeholder for a client-side auth state/store.
function useAuthClient() {
  // This is a simplified placeholder.
  const user = useState<User | null>('user_auth_state', () => null);
  return {
    isLoggedIn: computed(() => !!user.value),
    user, // The user data
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
            // console.error('auth.ts middleware: fetchUser failed with useApiFetch', e.message);
            user.value = null;
            return null;
        }
    }
  };
}


export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) {
    // On the server-side, Nuxt has access to the request event and thus cookies.
    // We try to fetch the user. If it fails (throws error or returns null),
    // then the user is not authenticated.
    // The /api/users/me endpoint itself is protected by server/middleware/auth.ts
    try {
      const { user } = await $fetch('/api/users/me', {
        // Pass along cookies from the original request to the API call
        headers: useRequestHeaders(['cookie']) as HeadersInit,
      });
      if (!user) {
        return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
      }
      // If user is fetched, it implies they are authenticated.
      // We could potentially store this user in a state accessible on client-side hydration.
      // For now, just allowing access is enough.
    } catch (error) {
      // console.error('SSR Auth Middleware Error:', error);
      return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
    }
  } else {
    // Client-side: use our placeholder composable
    const { isLoggedIn, fetchUser } = useAuthClient();

    if (!isLoggedIn.value) {
        // Attempt to fetch user. If successful, isLoggedIn will become true.
        // If not, then redirect.
        const user = await fetchUser();
        if (!user) {
            return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
        }
    }
    // If isLoggedIn is true or becomes true after fetchUser, allow navigation.
  }
});
