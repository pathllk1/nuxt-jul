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
      <ul :class="[isMobileMenuOpen ? 'block absolute top-16 left-0 w-full bg-indigo-700 md:hidden z-40' : 'hidden', 'md:flex md:items-center md:space-x-2 md:static md:w-auto md:bg-transparent']">
        <li><NuxtLink to="/" @click="closeMobileMenu" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Home</NuxtLink></li>
        <li><NuxtLink to="/about" @click="closeMobileMenu" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">About</NuxtLink></li>
        <li><NuxtLink to="/contact" @click="closeMobileMenu" class="block md:inline-block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 w-full md:w-auto text-center md:text-left">Contact</NuxtLink></li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
// Script remains the same
import { ref } from 'vue';
const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
const closeMobileMenu = () => { if (isMobileMenuOpen.value) { isMobileMenuOpen.value = false; } };
</script>

<!-- NO <style scoped> anymore -->
