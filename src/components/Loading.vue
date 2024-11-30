<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

// define shower prop
const props = defineProps({
  shower: {
    type: Boolean,
    required: false,
    default: false,
  },
});
</script>

<template>
  <div
    v-if="store.refreshing || props.shower"
    class="flex items-center justify-center w-full h-full"
    role="status"
    aria-label="Loading"
  >
    <div
      class="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"
    ></div>
  </div>
</template>
