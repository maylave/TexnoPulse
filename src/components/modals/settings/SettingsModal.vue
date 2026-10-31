<!-- src/components/modals/settings/SettingsModal.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useAppStore } from "@/stores/appLayout";
import { useModalStore } from "@/stores/appModal";
import SettingsSidebar from "./SettingsSidebar.vue";
import SettingsContent from "./SettingsContent.vue";
import { SETTINGS_MENU_ITEMS } from "@/config/settingsMenu";

const appStore = useAppStore();
const modalStore = useModalStore();
const isOpen = computed(() => appStore.isModalSettingsOpen);

const initialTab =
  (modalStore.payload as any)?.tab ?? SETTINGS_MENU_ITEMS[0]?.id ?? "";
const activeTab = ref(initialTab);

watch(
  () => modalStore.payload,
  (newPayload: any) => {
    if (newPayload?.tab) {
      activeTab.value = newPayload.tab;
    }
  }
);
</script>

<template>
  <Transition name="modal">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style=""
    >
      <div
        class="w-full max-w-7xl h-[75vh] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden flex flex-col"
        style="
          background-color: color-mix(in srgb, var(--color-surface-container) var(--transparent-settings), transparent);
          box-shadow: var(--menu-shadow);
        "
      >
        <!-- Шапка -->
        <div class="px-8 pt-6 pb-4 shrink-0">
          <h2
            class="text-xl font-semibold tracking-tight"
            style="color: var(--color-on-surface)"
          >
            Настройки
          </h2>
        </div>

        <!-- Тело -->
        <div class="flex flex-1 overflow-hidden px-4 pb-4 gap-4">
          <aside
            class="w-64 rounded-[var(--radius-lg)] overflow-hidden shrink-0"
            style="background-color: color-mix(in srgb, var(--color-surface-container-low) var(--transparent-settings), transparent);"
          >
            <SettingsSidebar
              :active-tab="activeTab"
              @update:active-tab="activeTab = $event"
            />
          </aside>

          <main
            class="flex-1 rounded-[var(--radius-lg)] overflow-y-auto custom-scrollbar"
            style="background-color: color-mix(in srgb, var(--color-surface-container-high) var(--transparent-settings), transparent);"
          >
            <SettingsContent :active-tab="activeTab" />
          </main>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: var(--radius-full);
}
</style>