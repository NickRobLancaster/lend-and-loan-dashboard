<script setup>
import { ref, computed, reactive, watch, Teleport, onMounted } from "vue";
import axios from "axios";
import { csvParse } from "d3-dsv";
import Chart from "./Chart.vue";

//chart options for user chart
const userChartOptions = reactive({
  indexAxis: "y",
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: false,
        text: "Debt Load and Sales Revenue",
      },
      ticks: {
        font: {
          size: 16,
        },
        color: "white",
      },
    },
    y: {
      title: {
        display: false,
        text: "Sales Rep",
      },
      ticks: {
        font: {
          size: 16,
        },
        color: "white",
      },
    },
  },
  plugins: {
    legend: {
      display: true, // Enable the legend to differentiate the datasets
      labels: {
        font: {
          size: 16,
        },
        color: "rgb(14, 195, 227)",
      },
    },
    tooltip: {
      enabled: true,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
  barThickness: 50,
  maxBarThickness: 50,
});

//chart data for user chart
const userChartData = reactive({
  labels: salesReps,
  datasets: [
    {
      label: "Debt Load",
      backgroundColor: "rgba(39, 114, 245, 0.25)",
      borderColor: "rgba(39, 114, 245, 1)",
      borderWidth: 1,
      data: salesRepsDebt, // Example debt load values for each sales rep
    },

    // {
    //   label: "Deal Count", // The new data point
    //   backgroundColor: "rgba(245, 127, 39, 0.25)",
    //   borderColor: "rgba(245, 127, 39, 1)",
    //   borderWidth: 1,
    //   data: salesUsersData.value.deal_count, // Example deal count values for each sales rep
    // },
  ],
});
</script>

<template>
  <div
    v-if="leftColumnView === 'both' || leftColumnView === 'chart'"
    :class="`${
      leftColumnView === 'both'
        ? 'h-1/2'
        : leftColumnView === 'chart'
        ? 'h-full'
        : ''
    }`"
    class="bg-base-100"
  >
    <div class="">
      <div
        @click="
          leftColumnView === 'both'
            ? (leftColumnView = 'chart')
            : leftColumnView === 'chart'
            ? (leftColumnView = 'table')
            : (leftColumnView = 'both')
        "
        class="text-gray-100 text-xl flex flex-row justify-between items-center p-2 cursor-pointer hover:bg-gray-600"
      >
        <span> New Clients - Today </span>

        <button
          class="ml-auto btn btn-sm hover:bg-gray-100 hover:text-slate-600 border border-slate-500"
        >
          +
        </button>
      </div>

      <div class="flex-1 flex flex-col text-5xl">
        <div class="overflow-y-auto">
          <table class="table table-zebra">
            <thead class="text-gray-100">
              <tr>
                <th>Program Consultant</th>
                <th>Client Name</th>
                <th v-show="enabledBlocks.includes('average_program_length')">
                  Term
                </th>
                <th>Total Debt</th>
              </tr>
            </thead>
            <tbody class="text-gray-100">
              <tr v-for="(item, i) in newClientsToday" :key="i">
                <td>{{ item["Sales User"] }}</td>
                <th>{{ item["Customer Name"] }}</th>
                <td v-show="enabledBlocks.includes('average_program_length')">
                  {{ item["Term"] }}
                </td>
                <td>{{ item["Debt Amount"] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
