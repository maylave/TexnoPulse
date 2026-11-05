<!-- src/components/ChatHome/message/RoomMessage.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Message, BlockHighlight } from "@/types/message";
import { useChatSettingsStore } from "@/stores/chatSettings";
import { blockConfig } from "@/config/messageBlocks";

const props = defineProps<{
  message: Message;
}>();

const emit = defineEmits<{
  (e: "contextmenu", event: MouseEvent, message: Message): void;
}>();

function onContextMenu(event: MouseEvent) {
  emit("contextmenu", event, props.message);
}

type Block = Message["content"][number];

const settings = useChatSettingsStore();
const side = computed(() => settings.getSide(props.message.isOwn));

const colorClasses = computed(() => {
  if (settings.colorBySender) {
    return "bg-(--msg-bg-own) text-(--msg-text-own)";
  }
  return props.message.isOwn
    ? "bg-(--msg-bg-own) text-(--msg-text-own)"
    : "bg-(--msg-bg-other) text-(--msg-text-other)";
});

const getBlockConfig = (type: string) =>
  blockConfig[type as keyof typeof blockConfig] || blockConfig.text;

const highlightMap: Record<BlockHighlight, string> = {
  none: "",
  blue: "bg-sky-500/15 border-l-2 border-sky-400",
  emerald: "bg-emerald-500/15 border-l-2 border-emerald-400",
  amber: "bg-amber-500/15 border-l-2 border-amber-400",
  rose: "bg-rose-500/15 border-l-2 border-rose-400",
  violet: "bg-violet-500/15 border-l-2 border-violet-400",
  slate: "bg-slate-500/20 border-l-2 border-slate-400",
};
</script>

<template>
  <article
    :id="`msg-${message.id}`"
    @contextmenu.prevent="onContextMenu"
    class="flex w-fit max-w-(--msg-max-width) flex-col overflow-hidden rounded-(--msg-radius-base) text-(length:--msg-font-size) leading-(--msg-line-height) [border:var(--msg-border)] [box-shadow:var(--msg-shadow)] backdrop-blur-(--msg-blur) cursor-pointer transition-all duration-300"
    :class="[
      side === 'right'
        ? 'self-end rounded-br-(--msg-radius-corner)'
        : 'self-start rounded-bl-(--msg-radius-corner)',
      colorClasses,
    ]"
  >
    <div
      v-for="(block, index) in message.content"
      :key="index"
      class="flex flex-col"
      :class="[
        getBlockConfig(block.type).marginBottom,
        getBlockConfig(block.type).containerClass,
        block.highlight ? highlightMap[block.highlight] : '',
      ]"
    >
      <component
        :is="getBlockConfig(block.type).component"
        v-if="getBlockConfig(block.type).component"
        :block="block"
      />
    </div>
  </article>
</template>