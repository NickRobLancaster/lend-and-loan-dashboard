<script setup>
import { onMounted, watch } from "vue";
import Navbar from "./Navbar.vue";
import Leaders from "./Leaders.vue";
import DashboardV2 from "./DashboardV2.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

// LOCAL ENROLLMENTS
const fetch_enrollments = () => {
  return store.get_enrollments();
};

// DPP
const fetch_data1 = async () => {
  return await store.get_data1();
};

// CORDOVA
const fetch_data2 = async () => {
  return await store.get_data2();
};

//onMounted fetch data1
onMounted(async () => {
  await store.start_fetch_interval();
});

// watch for changes on the store.getter_final_combined_data
import { computed } from "vue";

const time_range_period = computed(() => store.time_range_period);

watch(time_range_period, () => {
  store.trigger_refresh();
});
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-base-300">
    <Navbar />

    <Leaders />

    <DashboardV2 />
  </div>
</template>
