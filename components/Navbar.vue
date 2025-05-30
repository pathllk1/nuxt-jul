<template>
  <nav>
    <div class="nav-container">
      <div class="brand">
        <NuxtLink to="/">MyLogo</NuxtLink> <!-- Optional: Add a brand/logo -->
      </div>
      <button class="mobile-nav-toggle" @click="toggleMobileMenu">
        <span class="hamburger-icon"></span>
        <!-- You can use an SVG or a simple CSS hamburger icon here -->
      </button>
      <ul :class="{ 'nav-links': true, 'mobile-menu-open': isMobileMenuOpen }">
        <li><NuxtLink to="/" @click="closeMobileMenu">Home</NuxtLink></li>
        <li><NuxtLink to="/about" @click="closeMobileMenu">About</NuxtLink></li>
        <li><NuxtLink to="/contact" @click="closeMobileMenu">Contact</NuxtLink></li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
// No script needed for this basic navbar
import { ref } from 'vue';

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  // Optional: only close if it's actually open, though setting to false is fine
  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
  }
};
</script>

<style scoped>
nav {
  background-color: indigo; /* Changed background color */
  padding: 1rem;
  position: fixed; /* Added fixed positioning */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000; /* Added z-index */
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.brand { /* Optional styling for a logo/brand */
  font-size: 1.5rem;
}
.brand a {
  padding: 0.5rem 0; /* Adjust if 'a' has global padding */
}
.brand a:hover {
  background-color: transparent; /* Brand link might not need hover bg */
}

.mobile-nav-toggle {
  display: none; /* Hidden by default, shown in media query */
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem; /* Adjust as needed */
  cursor: pointer;
  padding: 0.5rem; /* Make it easier to click */
}

/* Basic CSS Hamburger Icon */
.hamburger-icon {
  display: block;
  width: 24px;
  height: 2px;
  background-color: white;
  position: relative;
}
.hamburger-icon::before,
.hamburger-icon::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background-color: white;
  left: 0;
}
.hamburger-icon::before {
  top: -8px;
}
.hamburger-icon::after {
  top: 8px;
}

/* .nav-links class is now on the ul tag */
.nav-links {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex; /* This is for desktop */
  align-items: center;
}

.nav-links li {
  /* margin-right: 1rem; /* Replaced by padding on 'a' if preferred */
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem; /* Default padding for desktop links */
  display: block;
  transition: background-color 0.3s ease;
}

.nav-links a:hover {
  background-color: #400080; /* Darker indigo for desktop hover */
}

/* --- Mobile Styles --- */
@media (max-width: 768px) {
  .nav-links {
    display: none; /* Hidden by default on mobile */
    flex-direction: column; /* Stack links vertically */
    width: 100%;
    position: absolute;
    top: 58px; /* Adjust based on actual nav height (approx padding 1rem + brand font 1.5rem -> 2.5rem + some buffer) */
    left: 0;
    background-color: indigo; /* Same as nav or slightly different */
    padding-bottom: 1rem; /* Spacing for the bottom of the menu */
  }

  .nav-links.mobile-menu-open {
    display: flex; /* Show when menu is open */
  }

  .nav-links li {
    width: 100%;
    text-align: center;
    /* margin-right: 0; /* No right margin in column layout */
  }
  .nav-links a {
    width: 100%; /* Make links take full width */
    padding: 1rem 0; /* Adjust padding for vertical layout */
  }
  .nav-links a:hover {
    background-color: #4f008c; /* Slightly different hover for mobile if desired */
  }

  .mobile-nav-toggle {
    display: block; /* Show hamburger button */
  }
}
</style>
