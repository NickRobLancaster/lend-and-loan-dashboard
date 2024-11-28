<script setup>
import { ref } from "vue";

import Loading from "./Loading.vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();
</script>

<template>
  <Teleport to="#modals">
    <div class="fixed top-5 left-5 z-70">
      <transition-group
        tag="div"
        class="flex flex-col space-y-2"
        enter-active-class="transition ease-out duration-200"
        enter-from-class="-translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition ease-in duration-500"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="store.toasts.length >= 1"
          v-for="(item, index) in store.toasts"
          @click="store.delete_toast(index)"
          :key="index"
          class="h-16 rounded flex flex-row overflow-clip cursor-pointer"
        >
          <div
            class="w-16 bg-white flex flex-row items-center justify-center text-white"
          >
            <!-- Font Awesome info icon -->
            <span class="rounded-full px-3 py-1" :class="item.color">
              <font-awesome-icon icon="fa-solid fa-info" size="lg" />
            </span>
          </div>

          <div
            class="flex-1 flex flex-col justify-center px-4"
            :class="item.color"
          >
            <!-- title -->
            <div class="text-white text-base font-bold text-center">
              {{ item.title }}
            </div>

            <!-- message -->
            <div v-if="item.message" class="text-white text-sm">
              <span v-if="!item.loading">
                {{ item.message }}
              </span>
              <div v-else>
                <Loading />
              </div>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>
