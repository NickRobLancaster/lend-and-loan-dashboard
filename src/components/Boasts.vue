<script setup>
import { ref, watch } from "vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

// watch the store.getter_final_combined_data and use it's value to set store.boast_tracker
</script>

<template>
  <Teleport to="#modals">
    <div
      class="fixed inset-0 z-70 flex items-center justify-center pointer-events-none"
    >
      <transition-group
        tag="div"
        class="flex flex-col space-y-2 w-5/6"
        enter-active-class="transition ease-out duration-200"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-500"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        move-class="transition ease-in-out duration-300"
      >
        <div
          v-if="store.boasts.length >= 1"
          v-for="(item, index) in store.boasts"
          @click="store.delete_boast(index)"
          :key="index"
          class="h-full flex flex-col cursor-pointer w-full p-5 gradient-animation rounded-xl"
        >
          <div
            class="h-full flex flex-col gap-14 justify-center p-10 w-full bg-base-100 rounded-xl"
          >
            <!-- title -->
            <div
              class="text-white text-5xl font-bold text-center flex flex-row items-center justify-center gap-5"
            >
              <img
                :src="
                  store.users.find(
                    (user) =>
                      user.first_name + ' ' + user.last_name === item.title
                  ).profile_pic_url
                "
                class="h-24 rounded-full"
              />

              <span>{{ item.title }}</span>
            </div>
            <!-- body -->
            <div class="text-white text-4xl font-bold text-center">
              {{ item.body }}
            </div>

            <!-- image - item.pic -->
            <div class="flex justify-center">
              <img v-if="item.pic" :src="item.pic" class="w-full rounded-xl" />
            </div>

            <!-- message -->
            <div class="text-white text-4xl font-bold text-center">
              {{ item.message }}
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.gradient-animation {
  @apply bg-gradient-to-r from-blue-400 via-pink-500 to-purple-600;
  background-size: 200% 200%;
  animation: gradient 6s ease infinite;
}
</style>
