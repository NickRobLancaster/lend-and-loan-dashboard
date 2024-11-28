<script setup>
import { ref, watch } from "vue";
import Settings from "./Settings.vue";
import Enrollments from "./Enrollments.vue";
import Users from "./Users.vue";
import Spiffs from "./Spiffs.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

// watch the store.time_range_period and update it in the local storage
watch(
  () => store.time_range_period,
  () => {
    localStorage.setItem("time_range_period", store.time_range_period);
  }
);
</script>

<template>
  <div class="flex flex-row items-center justify-between p-2 bg-base-100 gap-5">
    <div class="flex flex-row gap-5 items-center">
      <img src="/images/landlLogo.png" alt="logo" class="w-16" />

      <div class="text-2xl text-gray-100 cursive-text">
        {{ store.company.name }}
      </div>
    </div>

    <!-- Today, Week, Month Button toolbar -->
    <div class="flex flex-row">
      <button
        @click="store.time_range_period = 'today'"
        :class="{
          btn: true,
          'btn-primary': store.time_range_period === 'today',
          'btn-outline': store.time_range_period !== 'today',
        }"
        class="rounded-r-none"
      >
        Today
      </button>
      <button
        @click="store.time_range_period = 'week'"
        :class="{
          btn: true,
          'btn-primary': store.time_range_period === 'week',
          'btn-outline': store.time_range_period !== 'week',
        }"
        class="rounded-none border-x-0"
      >
        Week
      </button>
      <button
        @click="store.time_range_period = 'month'"
        :class="{
          btn: true,
          'btn-primary': store.time_range_period === 'month',
          'btn-outline': store.time_range_period !== 'month',
        }"
        class="rounded-l-none"
      >
        Month
      </button>
    </div>

    <!-- settings buttons toolbar -->
    <div class="flex flex-row items-center gap-2">
      <Users />
      <Spiffs />
      <Enrollments />
    </div>

    <div class="flex flex-row items-center gap-2">
      <Settings />
    </div>
  </div>
</template>
