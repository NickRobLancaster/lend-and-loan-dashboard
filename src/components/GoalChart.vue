<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { csvParse } from "d3-dsv";
import Chart from "./Chart.vue";

import Loading from "./Loading.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

//chart options for goal chart
const goal_chart_options = ref({
  maintainAspectRatio: false,
  //turn off labels
  labels: {
    display: false,
  },

  plugins: {
    legend: {
      display: false, // Disables the legend
    },

    annotation: {
      annotations: {
        line1: {
          type: "line",
          xMin: () => store.settings.debt_goal,
          xMax: () => store.settings.debt_goal,
          borderColor: "white",
          borderWidth: 2,
          borderDash: [10, 5],
        },
        label1: {
          type: "label",
          xMin: () => store.settings.debt_goal,
          xMax: () => store.settings.debt_goal,
          color: "white",
          borderRadius: 5,
          backgroundColor: "rgba(65, 196, 122)",
          content: () =>
            `GOAL: $${store.get_accounting_format(store.settings.debt_goal)}`,
          font: {
            size: 18,
          },
          xAdjust: -65, // Adjust this value to offset the label to the left
        },
      },
    },
  },
  indexAxis: "y", // Makes the bar chart horizontal
  scales: {
    x: {
      ticks: {
        font: {
          size: 16, // Change this value to adjust the font size
        },
        color: "white", // Change this value to adjust the font color
      },
    },
    y: {
      ticks: {
        font: {
          size: 16, // Change this value to adjust the font size
        },
        color: "white", // Change this value to adjust the font color
      },
    },
  },
});

const goal_chart_data = computed(() => ({
  labels: ["Debt Total"],
  datasets: [
    {
      data: [store.getter_company_debt_total], // Ensure it's wrapped in an array
      backgroundColor: "rgba(39, 213, 245, 0.22)",
      borderColor: "rgba(39, 213, 245, 1)",
      borderWidth: 1,
      barThickness: 75,
    },
  ],
}));
</script>

<template>
  <div class="col-span-3 bg-base-300 flex flex-col h-1/3">
    <div class="flex-1 bg-base-100 p-2 flex flex-col">
      <div class="text-gray-100 text-xl flex flex-row gap-3">
        <span>Enrolled Debt</span> -

        <span class="capitalize">{{ store.time_range_period }}</span>

        <button @click="store.trigger_refresh" class="ml-auto">
          <font-awesome-icon icon="fa-solid fa-sync" />
        </button>
      </div>

      <div
        v-if="!store.refreshing"
        class="text-center flex-1 flex flex-col items-center justify-center"
      >
        <h1 class="text-green-400 text-6xl">
          ${{ store.get_accounting_format(store.getter_company_debt_total) }}
        </h1>
      </div>

      <Loading />
      <div class="">
        <Chart
          :data="goal_chart_data"
          :options="goal_chart_options"
          v-if="!store.refreshing"
        />
      </div>
    </div>
  </div>
</template>
