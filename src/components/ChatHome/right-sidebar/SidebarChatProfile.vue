<!-- src/components/ChatHome/right-sidebar/SidebarChatProfile.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { Pencil } from "lucide-vue-next";
import type { AppNode } from "@/types/chat";
import { useModalStore } from "@/stores/appModal";
import UiNodeAvatar from "@/components/ui/UiNodeAvatar.vue";

const props = defineProps<{
  chat?: AppNode;
}>();

const modal = useModalStore();

const title = computed(() => props.chat?.label || "Общий чат");
const chatMeta = computed(() => props.chat?.metaDate.chat);

// Редактировать можно только настоящий узел из стора
const openEdit = () => {
  if (props.chat) modal.open("editNode", props.chat);
};
</script>

<template>
  <div
    class="flex flex-col items-center text-center pt-1 pb-2 border-b border-white/5"
  >
    <!-- Аватарка с карандашом при наведении -->
    <div class="group relative mb-2.5 shadow-lg rounded-full">
      <UiNodeAvatar
        :label="title"
        :icon="chatMeta?.icon"
        :color="chatMeta?.iconColor"
        :image-url="chatMeta?.avatarUrl"
        :size="64"
      />

      <button
        v-if="chat"
        type="button"
        title="Изменить название и аватарку"
        class="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
        @click="openEdit"
      >
        <Pencil class="h-5 w-5" />
      </button>
    </div>

    <h2 class="text-base font-semibold text-white truncate max-w-full px-2">
      {{ title }}
    </h2>
    <p class="text-[11px] text-white/40 mt-0.5">
      Локальная P2P комната • Активна
    </p>
  </div>
</template>