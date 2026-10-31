<!-- src/components/modals/settings/SettingsSidebar.vue -->
<script setup lang="ts">
import { SETTINGS_MENU_ITEMS } from "@/config/settingsMenu";
import SettingsItem from "./SettingsItem.vue";

defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: "update:activeTab", id: string): void;
}>();
</script>

<template>
  <div
    class="w-full h-full p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar"
  >
    <SettingsItem
      v-for="item in SETTINGS_MENU_ITEMS"
      :key="item.id"
      :item="item"
      :active="activeTab === item.id"
      @click="(id) => emit('update:activeTab', id)"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: var(--radius-full);
}
</style>
