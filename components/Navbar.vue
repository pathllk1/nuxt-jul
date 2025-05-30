<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white p-4">
    <div class="container mx-auto flex items-center justify-between">
      <div class="text-xl font-bold">
        <NuxtLink to="/" class="text-white hover:text-indigo-200">MyLogo</NuxtLink>
      </div>

      <!-- Mobile Menu Button -->
      <div class="md:hidden">
        <button @click="toggleMobileMenu" class="p-2 rounded-md text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
          <span class="sr-only">Open main menu</span>
          <div v-if="!isMobileMenuOpen" class="space-y-1.5">
            <span class="block w-6 h-0.5 bg-white"></span>
            <span class="block w-6 h-0.5 bg-white"></span>
            <span class="block w-6 h-0.5 bg-white"></span>
          </div>
          <div v-else class="relative w-6 h-6"> <!-- X icon -->
            <span class="block absolute w-full h-0.5 bg-white transform rotate-45 top-1/2 left-0 -translate-y-1/2"></span>
            <span class="block absolute w-full h-0.5 bg-white transform -rotate-45 top-1/2 left-0 -translate-y-1/2"></span>
          </div>
        </button>
      </div>

      <!-- Navigation Links -->
      <ul :class="[isMobileMenuOpen ? 'block absolute top-16 left-0 w-full bg-indigo-700 md:hidden z-40 py-2' : 'hidden', 'md:flex md:items-center md:space-x-2 md:static md:w-auto md:bg-transparent']">
        <li><NuxtLink to="/" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Home</NuxtLink></li>
        
        <!-- Unauthenticated User Links -->
        <template v-if="!isLoggedIn">
          <li><NuxtLink to="/login" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Login</NuxtLink></li>
          <li><NuxtLink to="/register" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Register</NuxtLink></li>
        </template>
        
        <!-- Authenticated User Links -->
        <template v-else>
          <li><NuxtLink to="/dashboard" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Dashboard</NuxtLink></li>
          <li v-if="isAdmin"><NuxtLink to="/admin" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Admin</NuxtLink></li>
          <li>
            <button @click="handleLogout" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">
              Logout
            </button>
          </li>
        </template>
        <li><NuxtLink to="/about" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">About</NuxtLink></li>
        <li><NuxtLink to="/contact" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Contact</NuxtLink></li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router'; // Or from '#app' for Nuxt 3
import { useState } from '#app'; // Nuxt 3 composable for shared state

// Define User type (can be moved to a types file later)
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

// Mobile menu state
const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
const closeMobileMenuIfNeeded = () => {
  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
  }
};

// Auth state using Nuxt's useState
const userAuthState = useState<User | null>('user_auth_state', () => null);
const router = useRouter();

const isLoggedIn = computed(() => !!userAuthState.value);
const isAdmin = computed(() => userAuthState.value?.role === 'admin');

async function handleLogout() {
  closeMobileMenuIfNeeded(); // Close mobile menu if open
  try {
    await $fetch('/api/auth/logout', { method: 'POST' }); // Backend logout (to be created in next step)
  } catch (e) {
    console.warn('Logout API call failed (ignoring, proceeding with client logout):', e);
  } finally {
    userAuthState.value = null; // Clear client-side state
    // The HttpOnly cookie 'auth_token' cannot be cleared by client-side JS.
    // The server-side /api/auth/logout should handle cookie invalidation.
    router.push('/login');
  }
}

// Common classes for nav links for easier re-styling if needed via @apply in a global CSS
// For now, direct classes are fine.
// const navLinkClasses = "block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left";
</script>

<!-- No <style scoped> needed as it's all Tailwind utility classes -->
