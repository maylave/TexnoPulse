<!-- src/components/ChatHome/chat-room/RoomHistory.vue -->
<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { storeToRefs } from "pinia";
import RoomMessage from "../message/RoomMessage.vue";
import { useMessagesStore } from "@/stores/messages";
import { useNodeStore } from "@/stores/node";
import { useContextMenuStore } from "@/stores/contexMenu";
import type { Message } from "@/types/message";
import { getMessageMenuItems } from "@/config/contextMenu/messageContext";

const messagesStore = useMessagesStore();
const nodeStore = useNodeStore();
const contextMenu = useContextMenuStore();

const { messages } = storeToRefs(messagesStore);
const isLoading = ref(true);

function handleContextMenu(event: MouseEvent, message: Message) {
  const handlers = {
    onReply: (msg: Message) => {
      messagesStore.startReplyMessage(msg);
    },
    onEdit: (msg: Message) => {
      messagesStore.startEditMessage(msg);
    },
    onDelete: (msg: Message) => {
      messagesStore.deleteMessage(msg.id);
    },
    onCopyText: (msg: Message) => {
      const text = msg.content
        .map((b) => (b as any).text || (b as any).code || "")
        .filter(Boolean)
        .join("\n");
      navigator.clipboard.writeText(text);
    },
  };
  const items = getMessageMenuItems(message, handlers, "full");
  contextMenu.open(event, items, "full");
}

watch(
  () => nodeStore.activeChatId,
  async (newChatId) => {
    if (newChatId) {
      isLoading.value = true;
      try {
        await messagesStore.loadMessages(newChatId);
      } finally {
        isLoading.value = false;
      }
    }
  },
  { immediate: true },
);

const currentMessages = computed(() => {
  return messages.value.filter(
    (message) => message.chatId === nodeStore.activeChatId,
  );
});

const MONTH_NAMES = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/**
 * Преобразует дату сообщения в красивый текст разделителя:
 * "Сегодня", "Вчера", "24 октября" или "15 декабря 2025"
 */
function formatDateDivider(rawDate: Date | string | number): string {
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return "Сегодня";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDay.getTime() === today.getTime()) {
    return "Сегодня";
  }
  if (targetDay.getTime() === yesterday.getTime()) {
    return "Вчера";
  }

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${date.getFullYear()}`;
}

interface MessageDateGroup {
  dateKey: string;
  dateLabel: string;
  messages: Message[];
}

/**
 * Группирует сообщения по календарным суткам с разделителями
 */
const groupedByDay = computed<MessageDateGroup[]>(() => {
  const groups: MessageDateGroup[] = [];
  let lastKey = "";
  let currentGroup: MessageDateGroup | null = null;

  for (const msg of currentMessages.value) {
    const d = new Date(msg.timestamp);
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const dateKey = `${validDate.getFullYear()}-${validDate.getMonth()}-${validDate.getDate()}`;

    if (dateKey !== lastKey) {
      lastKey = dateKey;
      currentGroup = {
        dateKey,
        dateLabel: formatDateDivider(validDate),
        messages: [],
      };
      groups.push(currentGroup);
    }

    currentGroup?.messages.push(msg);
  }

  return groups;
});
</script>

<template>
  <!-- При клике в пустоту закрываем меню (если открыто) -->
  <div
    class="flex flex-col justify-end min-h-full gap-3 relative"
    @click="contextMenu.close"
  >
    <!-- Скелетная анимация загрузки -->
    <template v-if="isLoading">
      <div class="flex flex-col gap-4 w-full animate-pulse mb-2">
        <div
          class="self-start w-2/3 max-w-sm rounded-2xl rounded-bl-sm bg-white/10 h-16"
        ></div>
        <div
          class="self-end w-1/2 max-w-sm rounded-2xl rounded-br-sm bg-sky-500/20 h-12 mt-4"
        ></div>
      </div>
    </template>

    <!-- Сообщения с умными разделителями по датам -->
    <template v-else>
      <div
        v-for="group in groupedByDay"
        :key="group.dateKey"
        class="flex flex-col gap-3"
      >
        <!-- Стеклянный разделитель даты («Сегодня», «Вчера», «24 октября») -->
        <div class="sticky top-2 z-10 flex justify-center my-1.5 pointer-events-none">
          <div
            class="px-3.5 py-1 rounded-full text-[11px] font-medium tracking-wide text-white/75 bg-[#0d1522]/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] select-none pointer-events-auto"
          >
            {{ group.dateLabel }}
          </div>
        </div>

        <!-- Сообщения за этот день -->
        <RoomMessage
          v-for="message in group.messages"
          :key="message.id"
          :message="message"
          @contextmenu="handleContextMenu"
        />
      </div>

      <!-- Пустое состояние, если в диалоге пока нет сообщений -->
      <div
        v-if="currentMessages.length === 0"
        class="flex flex-col items-center justify-center my-auto py-16 text-center text-white/35 text-xs select-none"
      >
        Начните общение — отправьте первое сообщение
      </div>
    </template>
  </div>
</template>
