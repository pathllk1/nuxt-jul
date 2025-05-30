<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input
              id="username"
              v-model="username"
              name="username"
              type="text"
              autocomplete="username"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Username"
            >
          </div>
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
              autocomplete="new-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password (min. 6 characters)"
            >
          </div>
        </div>

        <!-- Error Message Display -->
        <div v-if="errorMessage" class="text-red-500 text-sm text-center">
          {{ errorMessage }}
        </div>
         <!-- Success Message Display -->
        <div v-if="successMessage" class="text-green-500 text-sm text-center">
          {{ successMessage }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Sign up
          </button>
        </div>
      </form>
      <p class="mt-2 text-center text-sm text-gray-600">
        Already have an account?
        <NuxtLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

async function handleRegister() {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: username.value,
        email: email.value,
        password: password.value,
      },
    });

    // console.log('Registration successful:', response);
    successMessage.value = response.message || 'Registration successful! Please log in.';
    
    // Clear form
    username.value = '';
    email.value = '';
    password.value = '';

    // Optional: Redirect to login page after a short delay
    setTimeout(() => {
      router.push('/login');
    }, 2000); // 2 seconds delay

  } catch (error: any) {
    console.error('Registration failed:', error);
    if (error.data && error.data.statusMessage) {
      errorMessage.value = error.data.statusMessage;
    } else {
      errorMessage.value = 'An unexpected error occurred. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
}

definePageMeta({
  layout: 'default',
  // middleware: ['guest'] // Example: If you have a 'guest' middleware
});
</script>
