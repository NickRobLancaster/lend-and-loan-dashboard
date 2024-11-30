<script setup>
// import { ref } from "vue";
import Toasts from "./components/Toasts.vue";
import Boasts from "./components/Boasts.vue";
</script>

<template>
  <Toasts />
  <Boasts />
  <router-view />
</template>
