<!-- src/components/ChatHome/sidebar/ChatRow.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { AppNode, ChatMeta } from "@/types/chat";
import UiNodeAvatar from "@/components/ui/UiNodeAvatar.vue";

const props = defineProps<{
  node: AppNode;
}>();

const chatMeta = computed(
  () => props.node.metaDate.chat || ({} as Partial<ChatMeta>),
);
</script>

<template>
  <div
    class="flex items-center p-1 rounded-[var(--sidebar-item-radius,0.5rem)] cursor-pointer transition-colors hover:bg-[var(--menu-hover)]"
  >
    <!-- Аватарка: иконка + цвет, картинка или буква -->
    <UiNodeAvatar
      class="mr-3"
      :label="node.label"
      :icon="chatMeta.icon"
      :color="chatMeta.iconColor"
      :image-url="chatMeta.avatarUrl"
      :size="32"
    />

    <!-- Текстовый блок -->
    <div class="flex-1 min-w-0">
      <div class="flex justify-between items-baseline mb-0.5">
        <h4
          class="text-sm font-medium text-[var(--color-on-surface)] truncate pr-2"
        >
          {{ node.label }}
        </h4>
      </div>
      <div class="flex justify-between items-center">
        <p class="text-xs text-[var(--color-on-surface-variant)] truncate pr-2">
          {{ chatMeta.lastMessagePreview || "Нет сообщений" }}
        </p>

        <!-- Непрочитанные -->
        <span
          v-if="chatMeta.unreadCount && chatMeta.unreadCount > 0"
          class="shrink-0 bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
        >
          {{ chatMeta.unreadCount }}
        </span>
      </div>
    </div>

    <!-- Слот для действий -->
    <div
      class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
    >
      <slot></slot>
    </div>
  </div>
</template>