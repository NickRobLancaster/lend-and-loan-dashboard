<script setup>
import {
  ref,
  watch,
  // onMounted
} from "vue";

import GoalChart from "./GoalChart.vue";
import SpiffsBoard from "./SpiffsBoard.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

const hovering_spiff_today = ref(false);

const spiff_today_over = () => {
  hovering_spiff_today.value = true;
};

const spiff_today_leave = () => {
  hovering_spiff_today.value = false;
};

const hovering_spiff_week = ref(false);

const spiff_week_over = () => {
  hovering_spiff_week.value = true;
};

const spiff_week_leave = () => {
  hovering_spiff_week.value = false;
};

// watch store.spiffs_today, begin countdown to save, if changes keep occuring reset timer
const saveTimeout = ref(null);

watch(
  () => store.spiffs_today,
  () => {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value);
    }
    saveTimeout.value = setTimeout(() => {
      localStorage.setItem("spiffs_today", JSON.stringify(store.spiffs_today));
    }, 2000); // 2 seconds delay
  },
  { deep: true }
);

// watch store.spiffs_week, begin countdown to save, if changes keep occuring reset timer
watch(
  () => store.spiffs_week,
  () => {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value);
    }
    saveTimeout.value = setTimeout(() => {
      localStorage.setItem("spiffs_week", JSON.stringify(store.spiffs_week));
    }, 2000); // 2 seconds delay
  },
  { deep: true }
);

// LOCAL ENROLLMENTS
// const fetch_enrollments = () => {
//   return store.get_enrollments();
// };

// DPP
// const fetch_data1 = async () => {
//   return await store.get_data1();
// };

// CORDOVA
// const fetch_data2 = async () => {
//   return await store.get_data2();
// };

//onMounted fetch data1
// onMounted(async () => {
//   fetch_enrollments();
//   await fetch_data1();
//   await fetch_data2();
// });
</script>

<template>
  <div class="flex flex-row flex-1 min-h-0 overflow-y-auto gap-2 p-2">
    <!-- left column -->
    <div class="bg-base-300 w-1/2 flex flex-col gap-2">
      <div class="bg-base-100 h-full overflow-y-auto">
        <!-- TOP LEFT -->
        <div class="flex flex-col h-full">
          <div
            class="text-gray-100 text-xl flex flex-row justify-between items-center p-2"
          >
            <span class="capitalize"
              >Enrollments by Rep -
              <span class="capitalize">{{ store.time_range_period }}</span>
            </span>
          </div>

          <div class="flex-1 flex flex-col">
            <!-- <Chart
                :data="userChartData"
                :options="userChartOptions"
                v-if="refreshing"
              /> -->

            <!-- Table Enrollments by rep - object example = { profile_pic_url } -->
            <div class="">
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <!-- head -->
                  <thead>
                    <tr>
                      <th class="text-gray-50">Rank</th>
                      <th class="text-gray-50">Consultant</th>
                      <th class="text-gray-50">Deals</th>
                      <th class="text-gray-50">Debt Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- row 1 -->
                    <tr
                      v-for="(user, i) in store.getter_user_leaderboard"
                      :key="i"
                    >
                      <td class="text-gray-50 text-lg text-center">
                        {{ i + 1 }}
                      </td>
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="avatar">
                            <div class="mask mask-squircle h-12 w-12">
                              <img
                                :src="
                                  store.users.find(
                                    (u) =>
                                      `${u.first_name} ${u.last_name}` ===
                                      user.sales_user
                                  )?.profile_pic_url ||
                                  '/images/default-profile-pic.jpg'
                                "
                                alt="Avatar Tailwind CSS Component"
                              />
                            </div>
                          </div>
                          <div>
                            <div class="font-bold text-gray-50 text-xl">
                              {{ user.sales_user }}
                            </div>
                            <!-- <div class="text-sm opacity-50">
                                United States
                              </div> -->
                          </div>
                        </div>
                      </td>

                      <td class="text-red-400 text-3xl">
                        {{ user.deal_count }}
                      </td>
                      <th class="text-emerald-400 text-2xl">
                        ${{ store.get_accounting_format(user.debt_amount) }}
                      </th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- <pre>
                {{ store.enrollments }}
            </pre>
            <pre>
                {{ store.data1 }}
            </pre>
            <pre>
                {{ store.data2 }}
            </pre> -->

            <!-- <pre>
              {{ store.getter_final_combined_data }}
            </pre> -->
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div class="bg-base-300 w-1/2 h-full overflow-y-auto flex flex-col gap-2">
      <!-- Debt Goal - Row 1 -->
      <GoalChart />

      <!-- Right - Row 2 -->
      <div class="col-span-1 bg-base-300 flex flex-row gap-2 h-1/6">
        <div class="flex-1 bg-base-100 rounded p-2 flex flex-col">
          <div class="text-gray-100 text-xl">
            Enrolled Debt <br />
            - Today
          </div>
          <div
            class="flex-1 flex flex-col justify-center items-center text-5xl text-blue-400"
          >
            ${{
              store.get_accounting_format(
                store?.getter_company_enrolled_debt_today
              )
            }}
          </div>
        </div>
        <div class="flex-1 bg-base-100 rounded p-2 flex flex-col">
          <div class="text-gray-100 text-xl">
            Average Debt / Client<br />
            - <span class="capitalize">{{ store.time_range_period }}</span>
          </div>
          <div
            class="flex-1 flex flex-col justify-center items-center text-5xl text-yellow-400"
          >
            ${{
              store.get_accounting_format(store.getter_company_average_debt)
            }}
          </div>
        </div>
      </div>

      <!-- Right - Row 3 -->
      <div class="col-span-1 flex flex-row gap-2 h-1/6">
        <div class="flex-1 bg-base-100 flex flex-col p-2">
          <div class="text-gray-100 text-xl">
            Enrollments <br />
            - Today
          </div>
          <div
            class="flex-1 flex flex-col justify-center items-center text-5xl text-rose-400"
          >
            {{ store.getter_company_enrollments_count_today }}
          </div>
        </div>
        <!-- average program length - no program data on the enrollments table -->
        <!-- <div class="flex-1 bg-base-100 flex flex-col p-2">
          <div class="text-gray-100 text-xl">
            Average Program Length <br />
            - <span class="capitalize">{{ timeRangePeriod }}</span>
          </div>
          <div
            class="flex-1 flex flex-col justify-center items-center text-5xl text-purple-400"
          >
            {{ averageProgramLength === "NaN" ? 0 : averageProgramLength }}
          </div>
        </div> -->
        <div class="flex-1 bg-base-100 flex flex-col p-2">
          <div class="text-gray-100 text-xl">
            Clients Enrolled <br />
            - <span class="capitalize">{{ store.time_range_period }}</span>
          </div>
          <div
            class="flex-1 flex flex-col justify-center items-center text-5xl text-sky-400"
          >
            {{ store.getter_company_clients_enrolled }}
          </div>
        </div>
      </div>

      <!-- SPIFFS BOARD -->
      <div class="bg-base-300 flex flex-row divide-slate-400 gap-2 h-1/2">
        <SpiffsBoard />
      </div>
    </div>
  </div>
</template>
