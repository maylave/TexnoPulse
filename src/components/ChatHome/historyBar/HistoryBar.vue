<!-- src/components/ChatHome/historyBar/HistoryBar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { Search, Minus, ChevronUp, ChevronDown } from "lucide-vue-next";
import { useMessagesStore } from "@/stores/messages";
import { useNodeStore } from "@/stores/node";
import { useSettingsStore } from "@/stores/settings";
import type { Message } from "@/types/message";

export interface HistoryTurn {
  id: string | number;
  title: string;
  role?: "user" | "assistant";
  timestamp?: number;
}

const props = withDefaults(
  defineProps<{
    turns?: HistoryTurn[];
    activeId?: string | number;
  }>(),
  {
    turns: undefined,
    activeId: undefined,
  },
);

const emit = defineEmits<{
  (e: "select", turn: HistoryTurn): void;
}>();

const messagesStore = useMessagesStore();
const nodeStore = useNodeStore();
const settingsStore = useSettingsStore();

const active = ref<string | number | undefined>(props.activeId);
const isHovered = ref(false);
const isCollapsed = ref(false);
const searchQuery = ref("");

// Настройки кастомизации из стора настроек
const isBarEnabled = computed(() => {
  return (
    settingsStore.get({ id: "history_bar_enabled", defaultValue: true } as any) !==
    false
  );
});

const maxDashes = computed(() => {
  const val = Number(
    settingsStore.get({ id: "history_bar_max_dashes", defaultValue: 5 } as any),
  );
  return val >= 3 && val <= 10 ? val : 5;
});

// Базовый список шагов в точности как на референсе пользователя
const defaultTurns: HistoryTurn[] = [
  { id: 1, title: "test gh" },
  { id: 2, title: "fsdfsdfsdfsdf" },
  { id: 3, title: "fsdfdfdsf" },
];

/**
 * Извлекает краткий заголовок для сообщения в списке истории
 */
function getMessageTitle(m: Message): string {
  if (!Array.isArray(m.content) || m.content.length === 0) return "Сообщение";

  // 1. Сначала ищем реальный текст
  for (const block of m.content) {
    if ((block as any).type === "text") {
      const t = ((block as any).text || "").trim();
      if (t) {
        const firstLine = t.split("\n")[0].trim();
        if (firstLine) {
          return firstLine.length > 28 ? firstLine.slice(0, 28) + "..." : firstLine;
        }
      }
    }
  }

  // 2. Если текста нет, берем имя файла или сниппета
  for (const block of m.content) {
    if ((block as any).type === "file") {
      return (block as any).name || "Файл";
    }
    if ((block as any).type === "code") {
      return (block as any).fileName || `snippet.${(block as any).language || "ts"}`;
    }
    if ((block as any).type === "color") {
      return (block as any).label || (block as any).value || "Цвет";
    }
    if ((block as any).type === "todo") {
      return (block as any).title || "Чек-лист";
    }
    if ((block as any).type === "link") {
      return (block as any).title || (block as any).url || "Ссылка";
    }
    if ((block as any).type === "image") {
      return (block as any).alt || "Изображение";
    }
  }

  return "Сообщение";
}

// Сообщения текущего активного чата
const currentChatMessages = computed(() => {
  const chatId = nodeStore.activeChatId;
  return messagesStore.messages.filter((m) => !chatId || m.chatId === chatId);
});

// Полный список всех шагов/сообщений
const turnsList = computed<HistoryTurn[]>(() => {
  if (props.turns && props.turns.length > 0) {
    return props.turns;
  }

  if (currentChatMessages.value.length > 0) {
    const list = currentChatMessages.value
      .map((m) => ({
        id: m.id,
        title: getMessageTitle(m),
        role: m.isOwn ? ("user" as const) : ("assistant" as const),
        timestamp: m.timestamp?.getTime(),
      }))
      .filter((item) => item.title && item.title.trim().length > 0);

    if (list.length > 0) {
      return list;
    }
  }

  return defaultTurns;
});

// Ограничение черточек в свернутом виде (строго 4-5 штук по настройке)
const collapsedDashes = computed<HistoryTurn[]>(() => {
  const limit = maxDashes.value;
  if (turnsList.value.length <= limit) {
    return turnsList.value;
  }
  return turnsList.value.slice(-limit);
});

// Фильтрация записей в расширенной карточке через строку поиска
const filteredTurns = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return turnsList.value;
  return turnsList.value.filter((t) => t.title.toLowerCase().includes(q));
});

// Навигация по стрелочкам (предыдущее / следующее / последнее сообщение)
const navigateTurn = (dir: "up" | "down") => {
  const list = filteredTurns.value;
  if (list.length === 0) return;
  const currentIdx = list.findIndex((t) => String(t.id) === String(active.value));
  let targetIdx = currentIdx;

  if (dir === "up") {
    targetIdx = currentIdx > 0 ? currentIdx - 1 : list.length - 1;
  } else {
    targetIdx = currentIdx >= 0 && currentIdx < list.length - 1 ? currentIdx + 1 : 0;
  }

  const target = list[targetIdx];
  if (target) {
    handleSelect(target);
  }
};

// Переход к конкретному сообщению при клике
const handleSelect = (turn: HistoryTurn) => {
  active.value = turn.id;
  emit("select", turn);

  const el = document.getElementById(`msg-${turn.id}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-target-pulse");
    setTimeout(() => {
      el.classList.remove("highlight-target-pulse");
    }, 1600);
  }
};

// Отслеживание текущего видимого сообщения при обычном скролле
let observer: IntersectionObserver | null = null;

const setupScrollObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (typeof IntersectionObserver === "undefined") return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace("msg-", "");
          if (id) {
            active.value = id;
          }
        }
      }
    },
    { threshold: 0.5 },
  );

  for (const turn of turnsList.value) {
    const el = document.getElementById(`msg-${turn.id}`);
    if (el) observer.observe(el);
  }
};

watch(
  () => [turnsList.value.length, nodeStore.activeChatId],
  () => {
    setTimeout(setupScrollObserver, 300);
  },
);

onMounted(() => {
  setTimeout(setupScrollObserver, 400);
  if (!active.value && turnsList.value.length > 0) {
    active.value = turnsList.value[turnsList.value.length - 1]?.id;
  }
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>

  <div
    v-if="isBarEnabled"
    class="history-bar-root fixed right-0 top-1/2 -translate-y-1/2 flex items-center pr-3 pl-8 py-6 select-none z-40"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Всплывающая карточка истории (в точности по дизайну референса) -->
    <div
      class="history-glass-card w-48 p-5 flex flex-col gap-3.5 text-white transition-all duration-200 mr-3 bg-(--menu-bg)"
      :class="
        isHovered
          ? 'opacity-100 translate-x-0 pointer-events-auto'
          : 'opacity-0 translate-x-3 pointer-events-none'
      "
    >
      <!-- Поле поиска с лупой и разделительной линией без плейсхолдера (как на картинке) -->
      <div class="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
        <Search class="w-4 h-4 text-white/40 shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder=""
          class="w-full bg-transparent text-xs text-white/90 placeholder-transparent focus:outline-none"
          @keydown.up.prevent="navigateTurn('up')"
          @keydown.down.prevent="navigateTurn('down')"
        />
      </div>

      <!-- Секция «Сегодня» с тонкой черточкой сворачивания справа -->
      <div class="flex items-center justify-between pt-0.5">
        <span class="text-sm font-semibold text-white/95 tracking-normal">
          Сегодня
        </span>
        <div class="flex items-center gap-0.5">
          <button
            type="button"
            @click="navigateTurn('up')"
            class="size-5 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Предыдущее сообщение (Стрелочка вверх)"
          >
            <ChevronUp class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="navigateTurn('down')"
            class="size-5 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Следующее сообщение (Стрелочка вниз)"
          >
            <ChevronDown class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="isCollapsed = !isCollapsed"
            class="size-5 flex items-center justify-center rounded text-white/60 hover:text-white transition-colors"
            title="Свернуть / развернуть"
          >
            <Minus class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <!-- Список записей: чистый текст как на картинке, без лишних серых плашек -->
      <div
        v-show="!isCollapsed"
        class="flex flex-col gap-2 pt-0.5 max-h-[160px] overflow-y-auto no-scrollbar"
      >
        <div
          v-if="filteredTurns.length === 0"
          class="text-xs text-white/35 py-2"
        >
          Нет записей
        </div>

        <button
          v-for="turn in filteredTurns"
          :key="turn.id"
          type="button"
          @click="handleSelect(turn)"
          class="text-left text-[13.5px] leading-snug py-0.5 px-0 text-white/75 hover:text-white transition-colors truncate"
          :class="{
            'text-white font-medium': String(active) === String(turn.id),
          }"
          :title="turn.title"
        >
          {{ turn.title }}
        </button>
      </div>
    </div>

    <!-- Тонкие черточки-индикаторы на правом краю (ограничены 4-5 штуками) -->
    <div
      class="flex flex-col items-end justify-center gap-4 py-2 cursor-pointer"
    >
      <div
        v-for="turn in collapsedDashes"
        :key="turn.id"
        class="group relative flex items-center py-1"
        @click="handleSelect(turn)"
      >
        <!-- Тонкая черточка: потоньше (h-[2px]), мягкая приглушенная яркость -->
        <div
          class="h-[1px] rounded-full transition-all duration-200"
          :class="[
            String(active) === String(turn.id)
              ? 'w-3.5 bg-white/85 shadow-[0_0_6px_rgba(255,255,255,0.4)] opacity-100'
              : 'w-2 bg-white/25 group-hover:w-4.5 group-hover:bg-white/60 group-hover:opacity-90',
          ]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-glass-card {
  /* Плотное темное матовое стекло, не пропускающее визуальный шум сообщений сзади */
  
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  border-radius: 28px;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:global(.highlight-target-pulse) {
  animation: targetPulse 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}

@keyframes targetPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
    transform: scale(1);
  }
  25% {
    box-shadow:
      0 0 0 4px rgba(56, 189, 248, 0.5),
      0 0 24px rgba(56, 189, 248, 0.4);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
    transform: scale(1);
  }
}
</style>
