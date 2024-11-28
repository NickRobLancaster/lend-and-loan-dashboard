<script setup>
import { ref } from "vue";

import XSidebar from "./XSidebar.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

const creating_spiff = ref({
  sales_user: "",
  spiff: 0,
  deals: 0,
});

const create_spiff = () => {
  store.create_spiff(creating_spiff.value);
  creating_spiff.value = {
    sales_user: "",
    deals: 0,
    spiff: 0,
    period: "",
  };
};

const confirmDelete = (index) => {
  if (confirm("Are you sure you want to delete this spiff?")) {
    store.delete_spiff(index);
  }
};
</script>

<template>
  <XSidebar shower="show_spiffs">
    <template #open-button>
      <button
        class="btn btn-success btn-square"
        @click="store.show_modal('show_spiffs')"
      >
        <!-- font awesome dollar sign icon -->
        <font-awesome-icon icon="fa-solid fa-dollar-sign" />
      </button>
    </template>
    <template #body>
      <div class="h-full w-full bg-base-100">
        <div class="flex flex-col gap-2 p-2 h-full w-full">
          <div class="flex flex-row gap-5 items-center p-3">
            <h1 class="text-2xl font-bold text-gray-100 text-left">
              <span class="text-white"> Manage Spiffs </span>
            </h1>
          </div>

          <div class="flex flex-row w-full">
            <FormKit
              type="form"
              :incomplete-message="false"
              @submit="create_spiff"
              form-class="w-full max-w-full border border-slate-500 p-5 rounded-xl"
              wrapper-class="w-full max-w-full"
            >
              <div class="flex-row w-full gap-5 grid grid-cols-2 items-center">
                <FormKit
                  name="sales_user"
                  type="select"
                  :options="store.getter_users_select_options"
                  label="Sales User"
                  help="The rep who qualified for the spiff"
                  help-class="$reset text-xs pt-2 text-gray-50"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model="creating_spiff.sales_user"
                />
                <FormKit
                  name="deals"
                  type="number"
                  label="Deals"
                  help="Deal count to qualify for the spiff"
                  help-class="$reset text-xs pt-2 text-gray-50"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model.number="creating_spiff.deals"
                />
                <FormKit
                  name="spiff"
                  type="number"
                  label="Spiff"
                  help="Amount of the spiff bonus"
                  help-class="$reset text-xs pt-2 text-gray-50"
                  placeholder="John"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model.number="creating_spiff.spiff"
                />
                <!-- FormKit select options with Day, Week, Month options -->
                <FormKit
                  name="period"
                  type="select"
                  :options="[
                    { value: 'Day', label: 'Day' },
                    { value: 'Week', label: 'Week' },
                    { value: 'Month', label: 'Month' },
                  ]"
                  help="The period the spiff is paid out"
                  help-class="$reset text-xs pt-2 text-gray-50"
                  label="Period"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset select bg-gray-50 w-full rounded text-gray-600"
                  v-model="creating_spiff.period"
                >
                </FormKit>
              </div>

              <template #actions>
                <button
                  type="submit"
                  class="btn bg-blue-500 rounded text-gray-50 w-full mt-5"
                >
                  Create Spiff
                </button>
              </template>
            </FormKit>
          </div>

          <div class="p-2 flex flex-col gap-5 text-white">
            <div class="grid grid-cols-4 gap-3">
              <div
                class="h-full overflow-y-auto hide-scroll col-span-4 bg-base-100"
              >
                <table class="table table-zebra table-xs">
                  <thead class="sticky top-0 bg-base-100 text-gray-100">
                    <tr>
                      <th>Sales User</th>

                      <th>Deals</th>
                      <th>Spiff</th>
                      <th>Period</th>
                      <th class="text-center">
                        <font-awesome-icon icon="fa-solid fa-trash" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in store?.spiffs" :key="i">
                      <td>
                        <input
                          type="text"
                          v-model="store.spiffs[i].sales_user"
                          placeholder=""
                          class="w-full p-3 bg-transparent text-base rounded input cursor-not-allowed pointer-events-none"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          v-model.number="store.spiffs[i].deals"
                          class="w-full p-3 bg-transparent text-base rounded input cursor-not-allowed pointer-events-none"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          v-model.number="store.spiffs[i].spiff"
                          class="w-full p-3 bg-transparent text-base rounded input curosor-not-allowed pointer-events-none"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          v-model="store.spiffs[i].period"
                          class="w-full p-3 bg-transparent text-base rounded input curosor-not-allowed pointer-events-none"
                        />
                      </td>
                      <td>
                        <button
                          @click="confirmDelete(i)"
                          class="btn bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
                        >
                          <font-awesome-icon icon="fa-solid fa-xmark" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="store?.users?.length === 0" class="p-2">
                  <div
                    class="bg-blue-500 p-5 rounded text-gray-100 text-center"
                  >
                    No Users Added Yet
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </XSidebar>
</template>
