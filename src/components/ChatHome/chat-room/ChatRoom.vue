<!-- src/components/ChatHome/chat-room/ChatRoom.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useChatSettingsStore } from "@/stores/chatSettings";
import RoomHeader from "./RoomHeader.vue";
import RoomHistory from "./RoomHistory.vue";

const chatSettingsStore = useChatSettingsStore();

// Стандартная ширина (offset = 0)
const headerWidthClass = computed(() => chatSettingsStore.getMaxWidthClass(0));
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-transparent">
    <!-- Шапка -->
    <div
      class="absolute top-4 left-0 right-0 z-20 pointer-events-none flex justify-center px-4"
    >
      <div
        class="w-full pointer-events-auto transition-all duration-200"
        :class="headerWidthClass"
      >
        <RoomHeader />
      </div>
    </div>

    <!-- Лента сообщений -->
    <div
      class="h-full w-full overflow-y-auto custom-scrollbar px-4 pt-24 pb-36"
    >
      <div
        class="w-full mx-auto transition-all duration-200"
        :class="headerWidthClass"
      >
        <RoomHistory />
      </div>
    </div>
  </div>
</template>
