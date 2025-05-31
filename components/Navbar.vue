<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white p-4">
    <div class="container mx-auto flex items-center justify-between">
      <!-- Logo and Mobile Toggle (existing code) -->
      <div class="text-xl font-bold">
        <NuxtLink to="/" class="text-white hover:text-indigo-200">MyLogo</NuxtLink>
      </div>
      <div class="md:hidden">
        <button @click="toggleMobileMenu" class="p-2 rounded-md text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
          <!-- Hamburger/X icon (existing code) -->
          <span class="sr-only">Open main menu</span>
          <div v-if="!isMobileMenuOpen" class="space-y-1.5">
            <span class="block w-6 h-0.5 bg-white"></span>
            <span class="block w-6 h-0.5 bg-white"></span>
            <span class="block w-6 h-0.5 bg-white"></span>
          </div>
          <div v-else class="relative w-6 h-6">
            <span class="block absolute w-full h-0.5 bg-white transform rotate-45 top-1/2 left-0 -translate-y-1/2"></span>
            <span class="block absolute w-full h-0.5 bg-white transform -rotate-45 top-1/2 left-0 -translate-y-1/2"></span>
          </div>
        </button>
      </div>

      <!-- Navigation Links & Timer -->
      <ul :class="[isMobileMenuOpen ? 'block absolute top-16 left-0 w-full bg-indigo-700 md:hidden z-40 py-2' : 'hidden', 'md:flex md:items-center md:space-x-2 md:static md:w-auto md:bg-transparent']">
        <li><NuxtLink to="/" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Home</NuxtLink></li>

        <template v-if="!isLoggedIn">
          <li><NuxtLink to="/login" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Login</NuxtLink></li>
          <li><NuxtLink to="/register" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Register</NuxtLink></li>
        </template>

        <template v-else>
          <li><NuxtLink to="/dashboard" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Dashboard</NuxtLink></li>
          <li v-if="isAdmin"><NuxtLink to="/admin" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Admin</NuxtLink></li>
          <li>
            <button @click="handleLogout" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">
              Logout
            </button>
          </li>
          <!-- Timer Display - New Element -->
          <li v-if="isLoggedIn && tokenExpiryTimerDisplay" class="flex items-center ml-0 md:ml-4 mt-2 md:mt-0">
            <span class="text-xs px-2 py-1 bg-indigo-700 rounded-full" title="Access token remaining time">
              ⏳ {{ tokenExpiryTimerDisplay }}
            </span>
          </li>
        </template>
        <li><NuxtLink to="/about" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">About</NuxtLink></li>
        <li><NuxtLink to="/contact" @click="closeMobileMenuIfNeeded" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Contact</NuxtLink></li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useState } from '#app';

// Define AuthUser interface (ensure this matches the one used in login.vue and useApiFetch.ts)
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  accessTokenExpiresAt?: number | null; // Milliseconds UTC
}

// Mobile menu state
const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
const closeMobileMenuIfNeeded = () => { if (isMobileMenuOpen.value) isMobileMenuOpen.value = false; };

// Auth state
const userAuthState = useState<AuthUser | null>('user_auth_state', () => null);
const router = useRouter();

const isLoggedIn = computed(() => !!userAuthState.value);
const isAdmin = computed(() => userAuthState.value?.role === 'admin');

// ---- New Timer Logic ----
const tokenExpiryTimerDisplay = ref<string>('');
let timerInterval: ReturnType<typeof setInterval> | null = null;

function updateTimerDisplay() {
  if (userAuthState.value && userAuthState.value.accessTokenExpiresAt) {
    const now = Date.now();
    const expiryTime = userAuthState.value.accessTokenExpiresAt;
    const timeLeftSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));

    if (timeLeftSeconds <= 0) {
      tokenExpiryTimerDisplay.value = 'Expired';
      // (useApiFetch will handle refresh attempts when an API call is made)
      // Optionally, could show "Renewing..." if a refresh is known to be in progress.
      // However, useApiFetch is designed to be silent, so "Expired" is fine until next API call.
      if (timerInterval) clearInterval(timerInterval); // Stop interval if expired
      return;
    }

    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    tokenExpiryTimerDisplay.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    tokenExpiryTimerDisplay.value = '';
    if (timerInterval) clearInterval(timerInterval);
  }
}

watch(() => userAuthState.value?.accessTokenExpiresAt, (newExpiry, oldExpiry) => {
  if (timerInterval) clearInterval(timerInterval);
  if (newExpiry) {
    updateTimerDisplay(); // Update immediately
    timerInterval = setInterval(updateTimerDisplay, 1000);
  } else {
    tokenExpiryTimerDisplay.value = ''; // Clear display if no expiry (logged out)
  }
}, { immediate: true }); // `immediate: true` ensures it runs on component setup if expiry is already there

onMounted(() => {
  // Watch should handle initial setup due to `immediate: true`
  // If not using immediate, call updateTimerDisplay() and setup interval here too.
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
// ---- End New Timer Logic ----

async function handleLogout() {
  closeMobileMenuIfNeeded();
  if (timerInterval) clearInterval(timerInterval); // Stop timer on logout
  tokenExpiryTimerDisplay.value = '';
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout API call failed:', e);
  } finally {
    userAuthState.value = null;
    router.push('/login');
  }
}
</script>
