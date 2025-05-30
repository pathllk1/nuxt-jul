<template>
  <div> <!-- Removed inline style -->
    <Navbar />
    <main> <!-- Optional: wrap NuxtPage in main for semantic HTML -->
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from '~/components/Navbar.vue';
</script>
