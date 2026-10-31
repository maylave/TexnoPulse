<script setup lang="ts">
import { computed } from "vue";
// Обязательно импортируйте ChatMeta из вашего файла типов
import type { AppNode, ChatMeta } from "@/types/chat";

const props = defineProps<{
  node: AppNode;
}>();

// Теперь TypeScript знает, что пустой объект может содержать свойства ChatMeta
const chatMeta = computed(
  () => props.node.metaDate.chat || ({} as Partial<ChatMeta>),
);
</script>

<template>
  <div
    class="flex items-center p-1 rounded-[var(--sidebar-item-radius,0.5rem)] cursor-pointer transition-colors hover:bg-[var(--menu-hover)]"
  >
    <!-- Аватарка -->
    <div
      class="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-[var(--color-surface-bright)] to-[var(--color-surface-variant)] flex items-center justify-center font-bold text-sm text-[var(--color-on-surface)] mr-3 overflow-hidden"
    >
      <img
        v-if="chatMeta.avatarUrl"
        :src="chatMeta.avatarUrl"
        :alt="node.label"
        class="w-full h-full object-cover"
      />
      <span v-else>{{ node.label.charAt(0).toUpperCase() }}</span>
    </div>

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
