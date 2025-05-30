// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from '#app'; // Nuxt 3 imports

// Placeholder for a client-side auth state/store.
// In a real app, this would come from Pinia, useState, or a dedicated auth library.
function useAuthClient() {
  // This is a simplified placeholder.
  // It would typically check a ref/reactive variable set after login.
  // For now, we'll assume if there's no immediate client state, we need to verify with API.
  // This composable would be more fleshed out in step 10.
  const user = useState<object | null>('user_auth_state', () => null); // Placeholder
  return {
    isLoggedIn: computed(() => !!user.value),
    user, // The user data
    fetchUser: async () => { // Function to fetch user if not in state
        if (user.value) return user.value;
        try {
            const data = await $fetch('/api/users/me', {
                headers: useRequestHeaders(['cookie']) as HeadersInit, // Important for SSR/initial load
            });
            user.value = data.user;
            return data.user;
        } catch (e) {
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
