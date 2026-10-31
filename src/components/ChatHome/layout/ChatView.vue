<!-- src/components/ChatHome/layout/ChatView.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import ChatRoom from "../chat-room/ChatRoom.vue";
import ChatInput from "../chat-input/ChatInput.vue";
import { useMessagesStore } from "@/stores/messages";
import { useNodeStore } from "@/stores/node";
import { useChatSettingsStore } from "@/stores/chatSettings";
import type { ChatAttachment } from "@/config/chatInput";

const text = ref("");

const messagesStore = useMessagesStore();
const nodeStore = useNodeStore();
const chatSettingsStore = useChatSettingsStore();

const inputWidthClass = computed(() => chatSettingsStore.getMaxWidthClass(0));

const handleSend = async (payload?: {
  text: string;
  attachments?: ChatAttachment[];
}) => {
  const contentText = payload?.text ?? text.value;
  const attachments = payload?.attachments ?? [];

  if (!contentText.trim() && attachments.length === 0) return;

  const activeId = nodeStore.activeChatId || "hello";

  if (messagesStore.editingMessage) {
    await messagesStore.saveEditedMessage(messagesStore.editingMessage.id, {
      text: contentText,
      attachments,
    });
  } else {
    messagesStore.sendFromChatInput(
      {
        text: contentText,
        attachments,
      },
      activeId,
    );
  }

  text.value = "";
};
</script>

<template>
  <div class="relative h-full w-full">
    <div class="h-full w-full">
      <ChatRoom />
    </div>

    <div
      class="absolute bottom-6 left-0 right-0 z-20 pointer-events-none flex justify-center px-4"
    >
      <div
        class="w-full pointer-events-auto transition-all duration-200"
        :class="inputWidthClass"
      >
        <ChatInput @send="handleSend" v-model="text" />
      </div>
    </div>
  </div>
</template>