<script setup>
import { ref } from "vue";
import XSidebar from "./XSidebar.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

const creating_enrollment = ref({
  sales_user: "",
  debt_amount: "",
  enrollment_date: "",
  type: "local",
});

const create_enrollment = () => {
  store.get_reformatted_date(creating_enrollment.value.enrollment_date),
    store.create_enrollment(creating_enrollment.value);
  creating_enrollment.value = {
    sales_user: "",
    debt_amount: "",
    enrollment_date: "",
    type: "local",
  };
};

const confirm_delete = (index) => {
  if (confirm("Are you sure you want to delete this enrollment?")) {
    store.delete_enrollment(index);
  }
};
</script>

<template>
  <XSidebar shower="show_enrollments">
    <template #open-button>
      <button
        @click.stop="store.show_modal('show_enrollments')"
        class="btn btn-primary btn-square"
      >
        <font-awesome-icon icon="fa-solid fa-plus" />
      </button>
    </template>
    <template #body>
      <div class="h-full overflow-y-auto w-full bg-base-100">
        <div class="flex flex-col gap-2 p-2 h-full w-full">
          <div class="flex flex-row gap-5 items-center p-3">
            <!-- logo image -->

            <h1 class="text-2xl font-bold text-gray-100 text-left">
              <span class="text-white"> Manage Enrollments </span>
            </h1>
          </div>

          <div class="flex flex-row w-full">
            <FormKit
              type="form"
              :incomplete-message="false"
              @submit="create_enrollment"
              form-class="w-full max-w-full border border-slate-500 p-5 rounded-xl"
              wrapper-class="w-full max-w-full"
            >
              <div class="flex-row items-start w-full gap-5 grid grid-cols-2">
                <FormKit
                  name="sales_user"
                  type="select"
                  :options="store.getter_users_select_options"
                  label="Sales User"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model="creating_enrollment.sales_user"
                />
                <FormKit
                  name="debt_amount"
                  type="number"
                  label="Debt Amount"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model.number="creating_enrollment.debt_amount"
                />
              </div>

              <FormKit
                name="enrollment_date"
                type="date"
                label="Enrollment Date"
                validation="required"
                placeholder="example.com/image.jpg"
                wrapper-class="$reset w-full"
                input-class="$reset input bg-base-100 w-full rounded text-gray-50"
                v-model="creating_enrollment.enrollment_date"
                icon-class="text-gray-600 bg-gray-600"
              />

              <template #actions>
                <button
                  type="submit"
                  class="btn bg-blue-500 rounded text-gray-50 w-full mt-5"
                >
                  Create Enrollment
                </button>
              </template>
            </FormKit>
          </div>

          <div class="flex flex-col gap-5 text-white">
            <div class="grid grid-cols-4 gap-3">
              <div
                class="h-full overflow-y-auto hide-scroll col-span-4 bg-base-100"
              >
                <table class="table table-zebra table-xs">
                  <!-- head -->
                  <thead class="sticky top-0 bg-base-100 text-gray-100">
                    <tr>
                      <th>Sales User</th>
                      <th>Debt Amount</th>
                      <th>Enrolled Date</th>
                      <th class="text-center">
                        <font-awesome-icon icon="fa-solid fa-trash" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- row 1 -->
                    <tr v-for="(item, i) in store?.enrollments" :key="i">
                      <td class="flex flex-row gap-3">
                        <select
                          type="text"
                          v-model="store.enrollments[i].sales_user"
                          class="w-full p-3 bg-transparent text-base rounded select pointer-events-none cursor-disabled"
                        >
                          <option
                            v-for="option in store.getter_users_select_options"
                            :value="option['value']"
                          >
                            {{ option.label }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          v-model="store.enrollments[i].debt_amount"
                          class="p-3 bg-transparent text-base rounded input cursor-not-allowed cursor-disabled w-20"
                        />
                      </td>
                      <td>
                        <!-- native date selector that sets the date like this: 00-00-0000 -->
                        <!-- <input
                          type="date"
                          v-model="store.enrollments[i].enrollment_date"
                          class="p-3 bg-transparent text-base rounded input pointer-events-none cursor-disabled w-36"
                          @input="
                            store.enrollments[i].enrollment_date = new Date(
                              store.enrollments[i].enrollment_date
                            )
                              .toLocaleDateString('en-GB')
                              .split('/')
                              .reverse()
                              .join('-')
                          "
                        /> -->

                        <span class="text-base">
                          {{ store.enrollments[i].enrollment_date }}
                        </span>
                      </td>
                      <td>
                        <button
                          @click="confirm_delete(i)"
                          class="btn bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
                        >
                          <font-awesome-icon icon="fa-solid fa-xmark" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- <pre>
                    {{ data }}
                  </pre> -->
                <div v-if="store?.enrollments?.length === 0" class="p-2">
                  <div
                    class="bg-blue-500 p-5 rounded text-gray-100 text-center"
                  >
                    No Enrollments Added Yet
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
