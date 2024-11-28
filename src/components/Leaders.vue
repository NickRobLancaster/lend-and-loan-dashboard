<script setup>
import { ref } from "vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();
</script>

<template>
  <div class="col-span-3 row-span-1 flex flex-row max-sm:flex-col gap-2">
    <div
      v-if="store?.getter_user_leaderboard?.length >= 1"
      class="flex-1 bg-amber-500 flex flex-col text-center justify-center glass divide-x"
    >
      <div class="flex flex-row items-center justify-between p-2">
        <!-- profile pic - get the profile pic from the users array of object by the name of the user -->
        <div class="flex flex-row items-center gap-3">
          <div class="flex-shrink-0">
            <img
              :src="
                store?.users?.find(
                  (user) =>
                    `${user.first_name} ${user.last_name}` ===
                    store?.getter_user_leaderboard[0]?.sales_user
                )?.profile_pic_url || '/images/default-profile-pic.jpg'
              "
              class="w-16 rounded-full"
            />
            <h1 class="text-gray-100 text-5xl">1st</h1>
          </div>
        </div>
        <div class="flex flex-col flex-1">
          <div class="text-gray-100 text-3xl flex-1 text-right">
            {{ store?.getter_user_leaderboard[0]?.sales_user }}
          </div>
          <div class="text-right">
            <h2 class="text-4xl font-bold text-emerald-600">
              ${{
                store.get_accounting_format(
                  store?.getter_user_leaderboard[0]?.debt_amount
                )
              }}
            </h2>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="store?.getter_user_leaderboard.length >= 2"
      class="flex-1 bg-gray-400 flex flex-col text-center justify-center glass divide-x"
    >
      <div class="flex flex-row items-center justify-between p-2">
        <!-- profile pic - get the profile pic from the users array of object by the name of the user -->
        <div class="flex flex-row items-center gap-3">
          <div class="flex-shrink-0">
            <img
              :src="
                store?.users?.find(
                  (user) =>
                    `${user.first_name} ${user.last_name}` ===
                    store?.getter_user_leaderboard[1]?.sales_user
                )?.profile_pic_url || '/images/default-profile-pic.jpg'
              "
              class="w-16 rounded-full"
            />
            <h1 class="text-gray-100 text-5xl">2nd</h1>
          </div>
        </div>
        <div class="flex flex-col flex-1">
          <div class="text-gray-100 text-3xl flex-1 text-right">
            {{ store?.getter_user_leaderboard[1]?.sales_user }}
          </div>
          <div class="text-right">
            <h2 class="text-4xl font-bold text-emerald-600">
              ${{
                store.get_accounting_format(
                  store?.getter_user_leaderboard[1]?.debt_amount
                )
              }}
            </h2>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="store?.getter_user_leaderboard.length >= 3"
      class="flex-1 bg-amber-900 flex flex-col text-center justify-center glass divide-x"
    >
      <div class="flex flex-row items-center justify-between p-2">
        <!-- profile pic - get the profile pic from the users array of object by the name of the user -->
        <div class="flex flex-col items-center gap-3">
          <div class="flex-shrink-0">
            <img
              :src="
                store?.users?.find(
                  (user) =>
                    `${user.first_name} ${user.last_name}` ===
                    store?.getter_user_leaderboard[2]?.sales_user
                )?.profile_pic_url || '/images/default-profile-pic.jpg'
              "
              class="w-16 rounded-full"
            />
            <h1 class="text-gray-100 text-5xl">3rd</h1>
          </div>
        </div>
        <div class="flex flex-col flex-1">
          <div class="text-gray-100 text-3xl flex-1 text-right">
            {{ store?.getter_user_leaderboard[2]?.sales_user }}
          </div>
          <div class="text-right">
            <h2 class="text-4xl font-bold text-emerald-600">
              ${{
                store.get_accounting_format(
                  store?.getter_user_leaderboard[2]?.debt_amount
                )
              }}
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
