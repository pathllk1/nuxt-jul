<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <input type="hidden" name="remember" value="true">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            >
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            >
          </div>
        </div>

        <!-- Error Message Display -->
        <div v-if="errorMessage" class="text-red-500 text-sm text-center">
          {{ errorMessage }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <!-- Basic SVG Spinner -->
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Sign in
          </button>
        </div>
      </form>
      <p class="mt-2 text-center text-sm text-gray-600">
        Don't have an account?
        <NuxtLink to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
          Sign up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // Or useNuxtApp().$router for Nuxt 3
import { useState } from '#app'; // Import useState

// Define User interface
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const router = useRouter(); // Nuxt 3: const router = useRouter(); is correct.
const userAuthState = useState<User | null>('user_auth_state', () => null); // Define userAuthState

async function handleLogin() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Define expected response structure
    interface LoginResponse {
      message: string;
      user: User; 
      // token?: string; // If token were returned in body
    }

    const response = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    });

    // console.log('Login successful:', response);

    // ** CRUCIAL FIX: Update client-side auth state **
    if (response && response.user) {
      userAuthState.value = response.user;
    } else {
      // This case should ideally not happen if API guarantees user object on success
      console.error('Login response did not include user data.');
      errorMessage.value = 'Login succeeded but user data was not received. Please try again.';
      isLoading.value = false; // Stop loading before early return
      return; 
    }

    router.push('/dashboard'); 

  } catch (error: any) {
    console.error('Login failed:', error);
    if (error.data && error.data.statusMessage) {
      errorMessage.value = error.data.statusMessage;
    } else {
      errorMessage.value = 'An unexpected error occurred. Please try again.';
    }
  } finally {
    // isLoading is already set to false in the original code,
    // but ensure it's always set if there's an early return in the try block.
    isLoading.value = false; 
  }
}

// Optional: Define page meta for layout or other properties
definePageMeta({
  layout: 'default', // Assuming you have a default layout
  // middleware: ['guest'] // Example: If you have a 'guest' middleware to redirect if already logged in
});
</script>
