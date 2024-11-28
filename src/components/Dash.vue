<script setup>
import { ref, computed, reactive, watch, Teleport, onMounted } from "vue";
import axios from "axios";
import { csvParse } from "d3-dsv";
import Chart from "./Chart.vue";
import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

//test mode
const test_mode = ref(true);

// reformat a string to a number for easier math - BOTH DPP and Cordova
const stringToNumber = (string) => {
  return parseFloat(string.replace(/,/g, ""));
};

// reformat a date to iso for easier comparison - DPP specific
const data1DateFormatter = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

// reformat a date to iso for easier comparison - Cordova specific
const data2DateFormatter = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

//test data vvvvvvvvvvvvvvvvvvvvvvvv
const test_data_local = ref([
  {
    sales_user: "John Doe",
    debt_amount: 10000,
    enrollment_date: "2024-11-02",
    type: "local",
  },
]);
const test_data1 = ref([
  {
    sales_user: "Jane Doe",
    debt_amount: 20000,
    enrollment_date: "2024-11-03",
    type: "dpp",
  },
]);
const test_data2 = ref([
  {
    sales_user: "Brawn Doe",
    debt_amount: 30000,
    enrollment_date: "2024-11-04",
    type: "cordova",
  },
]);
//test data ^^^^^^^^^^^^^^^^^^^^^^^^

const enrollments = ref(
  test_mode.value
    ? test_data_local.value
    : JSON.parse(localStorage.getItem("enrollments")) || []
);
const data1_url = "https://example.com"; // dpp endpoint
const data1 = ref(
  test_mode.value
    ? test_data1.value
    : JSON.parse(localStorage.getItem("enrollments")) || []
); // dpp
const data2_url = "https://example2.com"; // cordova endpoint
const data2 = ref(
  test_mode.value
    ? test_data2.value
    : JSON.parse(localStorage.getItem("enrollments")) || []
); // cordova

//function to push data to the local records array
const createLocalRecord = (data) => {
  enrollments.value.push(data);
  localStorage.setItem("enrollments", JSON.stringify(enrollments.value));
};

//fetch local storage 'enrollments' and set to enrollments
const fetchLocalData = () => {
  const localData = localStorage.getItem("enrollments");
  if (localData) {
    enrollments.value = JSON.parse(localData);
  }
};

//example function to fetch data from the API and set to data1
const fetchData1 = async () => {
  try {
    const response = await axios.get("https://example.com");
    data1.value = response.data.bpi;
  } catch (error) {
    console.error(error);
  }
};

const fetchData2 = async () => {
  try {
    const response = await axios.get("https://example2.com");
    data2.value = response.data.bpi;
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <!-- DPP -->
      <div class="w-1/3 text-white">
        <h1 class="text-2xl">Local</h1>
        <pre>
        {{ enrollments }}
      </pre
        >
        <h1 class="text-2xl">Local</h1>
      </div>
      <div class="w-1/3 text-white">
        <h1 class="text-2xl">DPP</h1>
        <pre>
        {{ data1 }}
      </pre
        >
      </div>
      <div class="w-1/3 text-white">
        <h1 class="text-2xl">Cordova</h1>
        <pre>
        {{ data2 }}
      </pre
        >
      </div>
    </div>

    <div>
      <h1>Simple Form</h1>
      <FormKit type="form" @submit="handleSubmit">
        <FormKit
          name="email"
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          validation="required|email"
        />
        <FormKit
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          validation="required|min:6"
        />
      </FormKit>
    </div>
  </div>
</template>
