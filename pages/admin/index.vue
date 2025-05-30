<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">Welcome, Administrator!</h2>
      <p class="text-gray-600">This page is only accessible to users with the 'admin' role.</p>
      
      <div v-if="adminData" class="mt-4">
        <p>Your admin user ID is: {{ adminData.id }}</p>
        <p>Your admin username is: {{ adminData.username }}</p>
      </div>
      <!-- Add more admin-specific content or components here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Define page meta to apply the admin middleware
definePageMeta({
  middleware: ['auth', 'admin'], // Apply both auth and admin middleware
  layout: 'default', // Or a specific admin layout if you have one
});

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin'; // Role is specifically admin here
}

const adminData = ref<AdminUser | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Use the same client-side auth state as dashboard and auth middleware
const authState = useState<AdminUser | null>('user_auth_state', () => null);


onMounted(() => {
  // The 'admin' middleware should ensure only admins reach this page,
  // and the 'auth' middleware (and admin middleware's fetchUser)
  // should have populated the authState.
  if (authState.value && authState.value.role === 'admin') {
    adminData.value = authState.value;
    isLoading.value = false;
  } else {
    // This case should ideally not be reached if middleware is effective.
    // Could be a fallback or if authState isn't perfectly synced.
    // console.warn("Admin page mounted but user is not admin in authState, or authState is null.");
    // Forcing a re-check or redirect could be an option, but middleware should handle it.
    error.value = "Could not verify admin privileges or user data not available.";
    isLoading.value = false;
    // Potentially, redirect if authState.value is null after a delay,
    // as middleware should have caught this.
    // if (!authState.value) { useRouter().push('/login'); }
  }
});

</script>
