<!-- src/components/ChatHome/right-sidebar/RightSidebar.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useAppStore } from "@/stores/appLayout";
import { useNodeStore } from "@/stores/node";

import SidebarHeader from "./SidebarHeader.vue";
import SidebarChatProfile from "./SidebarChatProfile.vue";

import MenuTabMedia from "./MenuTabMedia.vue";

import MenuTabDevices from "./MenuTabDevices.vue";

const appStore = useAppStore();
const nodeStore = useNodeStore();

const activeTab = ref<"media" | "devices">("media");

const activeChatNode = computed(() =>
  nodeStore.nodes.find((n) => n.id === nodeStore.activeChatId),
);
</script>

<template>
  <aside
    class="right-sidebar bg-[#2d1b4e]/60 backdrop-blur-xl border-l border-white/10 transition-all duration-300 ease-in-out overflow-hidden shrink-0"
    :class="{ 'is-hidden': !appStore.isRightSidebarOpen }"
  >
    <div class="w-80 h-full flex flex-col text-[var(--color-on-surface)]">
      <!-- Шапка -->
      <SidebarHeader @close="appStore.setRightSidebar(false)" />

      <!-- Основная прокручиваемая область -->
      <div
        class="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar min-h-0"
      >
        <!-- Профиль текущего чата -->
        <SidebarChatProfile :chat="activeChatNode" />

        <!-- Контент выбранной вкладки -->
        <Transition name="fade-tab" mode="out-in">
          <MenuTabMedia
            v-if="activeTab === 'media'"
            :chat-id="nodeStore.activeChatId"
          />

          <MenuTabDevices v-else-if="activeTab === 'devices'" />
        </Transition>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.right-sidebar {
  width: 20rem;
  height: 100vh;
}

.right-sidebar.is-hidden {
  width: 0 !important;
  border-left-width: 0;
  opacity: 0;
}

.fade-tab-enter-active,
.fade-tab-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fade-tab-enter-from,
.fade-tab-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}
</style>
