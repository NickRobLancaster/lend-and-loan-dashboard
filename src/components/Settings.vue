<script setup>
import { ref } from "vue";

import { useMainStore } from "../stores/MainStore";
const store = useMainStore();

const show_logs = ref(false);
</script>

<template>
  <button
    @click="store.show_modal('show_settings')"
    class="btn btn-outline border-primary text-primary btn-square"
  >
    <font-awesome-icon icon="fa-solid fa-bars" />
  </button>
  <Teleport to="#modals">
    <transition
      enter-active-class="transition-opacity ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="store.show_settings"
        @click.self="store.hide_modal('show_settings')"
        class="fixed top-0 left-0 w-screen h-screen backdrop-brightness-50 z-50 max-w-screen max-h-screen flex flex-col items-end"
      ></div>
    </transition>

    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div
        v-if="store.show_settings"
        class="fixed top-0 right-0 h-screen w-1/2 bg-base-100 z-60"
      >
        <div class="flex flex-col gap-5 p-5 h-full w-full">
          <div class="flex flex-row gap-5 items-center">
            <h1 class="text-2xl font-bold text-gray-100 text-left">
              <span class="text-white"> Settings </span>
            </h1>

            <div class="flex flex-row items-center gap-2 ml-auto">
              <button
                class="btn btn-sm bg-red-500 hover:bg-red-600 text-white ml-auto"
                @click="store.clear_last_deal_count"
                title="Wipe All Local Storage Data"
              >
                Reset Boasts
              </button>
              <!-- <button
                class="btn btn-sm bg-red-500 hover:bg-red-600 text-white ml-auto"
                @click=""
                title="Wipe All Local Storage Data"
              >
                Reset To Default
              </button> -->
              <button
                class="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white"
                @click="store.save_settings"
                title="Wipe All Local Storage Data"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-5 text-white">
            <div class="grid grid-cols-4 gap-3">
              <div class="col-span-4 flex flex-col gap-3">
                <label for="debt_goal">Debt Goal</label>
                <input
                  id="debt_goal"
                  type="text"
                  v-model.number="store.settings.debt_goal"
                  class="input rounded bg-gray-100 text-gray-600"
                />
              </div>

              <!-- <div class="col-span-4 flex flex-col gap-3">
                  <div class="flex flex-col gap-3 items-start">
                    
                    <label for="timeRangePeriod">Hide / Show Blocks</label>
                    
                    <div class="flex flex-row gap-3">
                      <input
                        type="checkbox"
                        id="average-program-legnth"
                        v-model="enabledBlocks"
                        value="average_program_length"
                      />
                      <label for="average-program-length"
                        >Average Program Length</label
                      >
                    </div>
                  </div>
                </div> -->
            </div>
          </div>

          <!-- <div class="w-full ml-auto">
            <div class="flex-1 flex flex-row justify-center items-center">
              <div
                v-if="!fileName"
                class="p-8 rounded-xl flex flex-col items-center justify-center gap-8 h-full w-full"
                @dragover.prevent
                @dragleave.prevent
                @drop="handleDrop"
              >
                <p class="text-xl text-center">Drag and Drop CSV File Here</p>

                <p>OR</p>

                <button
                  @click="triggerFileInput"
                  class="bg-blue-500 text-gray-100 p-2"
                >
                  Browse for a CSV File
                </button>
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden"
                  accept=".csv"
                  @change="handleFiles"
                  placeholder="Upload File"
                />
              </div>
            </div>
          </div> -->

          <div class="mt-auto">
            <div class="overflow-y-auto border border-gray-500 rounded-xl">
              <div class="flex flex-row items-center gap-2 sticky top-0 z-10">
                <button @click="show_logs = !show_logs" class="btn btn-block">
                  {{ show_logs ? "Hide" : "Show" }} Logs
                </button>
              </div>
              <div v-if="show_logs" class="h-52">
                <!-- another table that shows the store.logs_api -->
                <table class="table table-zebra table-xs">
                  <thead>
                    <tr>
                      <th class="w-16">Source</th>
                      <th class="w-60">Message</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(log, i) in store?.getter_logs_api" :key="i">
                      <td>{{ log.source }}</td>
                      <td>{{ log.message }}</td>
                      <td>{{ log.created_at }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-5 text-white">
            <div class="flex flex-row">
              <!-- click to email -->
              <!-- <a
                href="mailto:support@finnypi.com"
                class="btn bg-blue-500 flex-1 rounded-r-none text-gray-50"
                >Contact Support - support@finnypi.com</a
              > -->

              <!-- button to copy the email -->
              <!-- <button
                @click="store.copy_text('support@finnypi.com')"
                class="btn bg-gray-500 text-gray-50 rounded-l-none"
              >
                
                <font-awesome-icon icon="fa-solid fa-copy" />
              </button> -->
            </div>
          </div>

          <div class="flex flex-row items-center justify-between">
            <button
              @click="store.hide_modal('show_settings')"
              class="btn btn-block bg-slate-700 text-gray-100 hover:bg-white hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
