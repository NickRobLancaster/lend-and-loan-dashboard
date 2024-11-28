<script setup>
import { ref, watch } from "vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

const hovering_spiff = ref(false);

const spiff_over = () => {
  hovering_spiff.value = true;
};

const spiff_leave = () => {
  hovering_spiff.value = false;
};

// watch store.spiffs, begin countdown to save, if changes keep occuring reset timer
const saveTimeout = ref(null);

watch(
  () => store.spiffs,
  () => {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value);
    }
    saveTimeout.value = setTimeout(() => {
      localStorage.setItem("spiffs", JSON.stringify(store.spiffs));

      store.create_toast({
        message: "Spiffs Saved",
        color: "bg-emerald-500",
      });
    }, 1250); // 1.25 seconds delay
  },
  { deep: true }
);

const confirmDelete = (index) => {
  if (confirm("Are you sure you want to delete this spiff?")) {
    store.delete_spiff(index);
  }
};
</script>

<template>
  <div class="h-full hide-scroll w-full bg-base-100">
    <div class="flex flex-row items-center p-2">
      <div class="text-gray-100 text-xl">Spiffs</div>
    </div>

    <table class="table table-zebra table-xs">
      <thead class="sticky top-0 bg-base-100 text-gray-100">
        <tr>
          <th class="w-48">Sales User</th>
          <th>Deals</th>
          <th>Spiff</th>
          <th>Period</th>
          <th class="" v-if="hovering_spiff && store.spiffs.length !== 0">
            <font-awesome-icon icon="fa-solid fa-trash" />
          </th>
        </tr>
      </thead>

      <tbody @mouseover="spiff_over" @mouseleave="spiff_leave">
        <tr v-for="(item, i) in store?.spiffs" :key="i">
          <td>
            <select
              type="text"
              v-model="item.sales_user"
              class="w-full p-1 bg-transparent text-gray-100 rounded select text-xl"
            >
              <option
                v-for="(user, i) in store.getter_users_select_options"
                :key="user"
                :value="user.value"
              >
                {{ user.label }}
              </option>
            </select>
          </td>
          <td>
            <input
              type="text"
              v-model.number="item.deals"
              class="w-full p-1 bg-transparent text-gray-100 rounded input text-2xl"
            />
          </td>
          <td class="text-emerald-500 flex flex-row items-center text-2xl">
            $
            <input
              type="text"
              v-model.number="item.spiff"
              class="w-full text-emerald-500 p-1 bg-transparent rounded input text-2xl"
            />
          </td>
          <td>
            <select
              type="text"
              v-model="item.period"
              :value="item.period"
              class="w-24 p-1 bg-transparent text-gray-100 rounded select text-xl"
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
            </select>
          </td>

          <td v-if="hovering_spiff">
            <button
              @click="confirmDelete(i)"
              class="btn btn-sm bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
            >
              <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="store?.spiffs.length === 0" class="p-2">
      <div class="bg-blue-500 p-5 rounded text-gray-100 text-center">
        No Spiffs Added Yet
      </div>
    </div>
  </div>
</template>
