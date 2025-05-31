<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
    <div v-if="isLoading" class="text-center">
      <p>Loading user data...</p>
      <!-- You can add a spinner here -->
    </div>
    <div v-else-if="userData" class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">Welcome, {{ userData.username }}!</h2>
      <p class="text-gray-600"><span class="font-medium">Email:</span> {{ userData.email }}</p>
      <p class="text-gray-600"><span class="font-medium">Role:</span> <span class="capitalize">{{ userData.role }}</span></p>

      <!-- Add more dashboard content here -->
      <div class="mt-6">
        <button
          @click="handleLogout"
          class="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
    <div v-else-if="error" class="text-red-500 text-center">
      <p>Error loading user data: {{ error }}</p>
      <p>You might be redirected to login shortly.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  middleware: ['auth'], // Apply the auth middleware we just created
  layout: 'default',
});

// Define User type locally if not globally available
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

const userData = ref<User | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

// Placeholder for client-side auth state management
const authState = useState<User | null>('user_auth_state', () => null);

async function fetchDashboardData() {
  isLoading.value = true;
  error.value = null;
  try {
    // Use the new composable
    // useApiFetch should be auto-imported by Nuxt from '~/composables/useApiFetch'
    const response = await useApiFetch<{ user: User }>('/api/users/me');
    userData.value = response.user;
    authState.value = response.user;
  } catch (err: any) {
    console.error('Failed to fetch dashboard data with useApiFetch:', err);
    error.value = err.data?.statusMessage || err.message || 'Could not load user data. Please try logging in again.';

    // useApiFetch should throw an error that leads to logout if refresh fails.
    // The page middleware should also protect against direct access if auth state is cleared.
    // If err.statusCode is 401 (from createError in useApiFetch), it means session is truly over.
    if (err.statusCode === 401) {
        // Optional: A small delay before redirect might allow user to see message.
        setTimeout(() => router.push('/login'), 1000);
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleLogout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' }); // Endpoint to be created
  } catch (e) {
    console.error('Logout API call failed (ignoring, proceeding with client logout):', e);
  } finally {
    // Clear client-side auth state
    authState.value = null;
    // Remove cookie (not directly possible for HttpOnly from client JS)
    // The server logout should handle cookie invalidation if needed.
    // For client-side, we just redirect.
    router.push('/login');
  }
}

onMounted(() => {
  // If client-side state already has user, use it, else fetch.
  // This avoids re-fetching if user navigated from another client page after login.
  if (authState.value) {
      userData.value = authState.value;
      isLoading.value = false;
  } else {
      fetchDashboardData();
  }
});
</script>
