<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();
</script>

<template>
  <div
    v-if="store.refreshing"
    class="flex items-center justify-center w-full h-full"
    role="status"
    aria-label="Loading"
  >
    <div
      class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
    ></div>
  </div>
</template>
