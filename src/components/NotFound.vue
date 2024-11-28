<script setup>
import { ref } from "vue";
</script>

<template>
  <div class="w-screen h-screen flex flex-col justify-center items-center">
    <div class="text-center flex flex-col gap-5 bg-red-500 p-5 rounded">
      <h1 class="text-gray-50">404 Not Found</h1>
      <p class="text-gray-50">Looks like this page doesn't exist yet.</p>
      <router-link to="/" class="btn text-gray-50"
        >Back to Dashboard</router-link
      >
    </div>
  </div>
</template>
