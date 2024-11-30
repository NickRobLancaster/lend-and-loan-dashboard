<script setup>
import { ref } from "vue";

import XSidebar from "./XSidebar.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

const show_url_input = ref(false);

const creating_user = ref({
  profile_pic_url: "",
  first_name: "",
  last_name: "",
});

const create_user = () => {
  store.create_user(creating_user.value);
  creating_user.value = {
    profile_pic_url: "",
    first_name: "",
    last_name: "",
    last_deal_count: {
      count: 0,
      created_at: new Date(),
    },
  };
};

const confirmDelete = (index) => {
  if (confirm("Are you sure you want to delete this user?")) {
    store.delete_user(index);
  }
};
</script>

<template>
  <XSidebar shower="show_users">
    <template #open-button>
      <button
        class="btn btn-secondary btn-square"
        @click="store.show_modal('show_users')"
      >
        <!-- font aweomse icon -->

        <font-awesome-icon icon="fa-solid fa-user" />
      </button>
    </template>
    <template #body>
      <div class="h-full w-full bg-base-100">
        <div class="flex flex-col gap-2 p-2 h-full w-full">
          <div class="flex flex-row gap-5 items-center p-3">
            <h1 class="text-2xl font-bold text-gray-100 text-left">
              <span class="text-white"> Manage Users </span>
            </h1>
          </div>

          <div class="flex flex-row w-full">
            <FormKit
              type="form"
              :incomplete-message="false"
              @submit="create_user"
              form-class="w-full max-w-full border border-slate-500 p-5 rounded-xl"
              wrapper-class="w-full max-w-full"
            >
              <div class="flex-row items-start w-full gap-5 grid grid-cols-2">
                <FormKit
                  name="first_name"
                  type="text"
                  label="First Name"
                  placeholder="John"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model="creating_user.first_name"
                />
                <FormKit
                  name="last_name"
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  validation="required"
                  wrapper-class="$reset w-full"
                  input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                  v-model="creating_user.last_name"
                />
              </div>

              <FormKit
                name="profile_pic"
                type="url"
                label="Profile Pic URL"
                validation="url"
                :validation-messages="{ url: 'Please enter a valid image URL' }"
                placeholder="example.com/image.jpg"
                wrapper-class="$reset w-full"
                input-class="$reset input bg-gray-50 w-full rounded text-gray-600"
                v-model="creating_user.profile_pic_url"
              />

              <template #actions>
                <button
                  type="submit"
                  class="btn bg-blue-500 rounded text-gray-50 w-full mt-5"
                >
                  Create User
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
                      <th>Pic</th>
                      <th v-if="show_url_input">Pic URL</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th class="text-center">
                        <font-awesome-icon icon="fa-solid fa-trash" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in store.users" :key="i">
                      <td class="flex flex-row gap-3">
                        <img
                          @click="show_url_input = !show_url_input"
                          :src="
                            item.profile_pic_url ||
                            '/images/default-profile-pic.jpg'
                          "
                          class="w-10 h-10 rounded-full cursor-pointer"
                        />
                      </td>
                      <td v-if="show_url_input">
                        <input
                          v-if="show_url_input"
                          type="text"
                          v-model="item.profile_pic_url"
                          @change="update_user_profile_pic_url()"
                          placeholder="Image URL"
                          class="w-full p-3 bg-transparent text-base rounded input input-bordered"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          v-model="item.first_name"
                          class="w-full p-3 bg-transparent text-base rounded input cursor-not-allowed pointer-events-none"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          v-model="item.last_name"
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
