<!-- src/components/ChatHome/chat-input/modals/ChecklistCreatorModal.vue -->
<script setup lang="ts">
import { ref, nextTick } from "vue";
import {
  X,
  Check,
  ListTodo,
  Plus,
  Trash2,
  ClipboardPaste,
  FileText,
} from "lucide-vue-next";

const emit = defineEmits<{
  close: [];
  confirm: [
    payload: {
      title: string;
      items: Array<{ text: string; done: boolean }>;
    },
  ];
}>();

const title = ref("Чек-лист");
const newItemText = ref("");
const newItemInputRef = ref<HTMLInputElement>();
const isPasteMode = ref(false);
const bulkText = ref("");

const items = ref<Array<{ id: number; text: string; done: boolean }>>([
  { id: 1, text: "Первая задача", done: false },
]);

let nextId = 2;

const addItem = () => {
  const text = newItemText.value.trim();
  if (!text) return;
  items.value.push({ id: nextId++, text, done: false });
  newItemText.value = "";
  nextTick(() => newItemInputRef.value?.focus());
};

const removeItem = (id: number) => {
  items.value = items.value.filter((i) => i.id !== id);
};

const toggleItem = (item: { done: boolean }) => {
  item.done = !item.done;
};

// Парсинг многострочного текста или markdown чек-листов
const parseBulkText = () => {
  const lines = bulkText.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 0) {
    items.value = lines.map((line) => {
      let isDone = false;
      let cleanText = line;

      // Распознаем markdown "- [x] Задача" или "- [ ] Задача"
      if (/^[-*]\s*\[([ xX])\]\s*/.test(cleanText)) {
        isDone = /^[-*]\s*\[[xX]\]/.test(cleanText);
        cleanText = cleanText.replace(/^[-*]\s*\[[ xX]\]\s*/, "");
      } else if (/^[-*•]\s+/.test(cleanText)) {
        cleanText = cleanText.replace(/^[-*•]\s+/, "");
      } else if (/^\d+[.)]\s+/.test(cleanText)) {
        cleanText = cleanText.replace(/^\d+[.)]\s+/, "");
      }

      return {
        id: nextId++,
        text: cleanText,
        done: isDone,
      };
    });
    bulkText.value = "";
    isPasteMode.value = false;
  }
};

const handleConfirm = () => {
  const validItems = items.value.filter((i) => i.text.trim().length > 0);
  if (!validItems.length) return;

  emit("confirm", {
    title: title.value.trim() || "Чек-лист",
    items: validItems.map((i) => ({ text: i.text.trim(), done: i.done })),
  });
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121620]/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white animate-scaleIn max-h-[85vh]"
    >
      <!-- Шапка -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="size-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400"
          >
            <ListTodo class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-tight">
              Создать чек-лист / список
            </h3>
            <p class="text-xs text-white/50 leading-tight">
              Интерактивные пункты для выполнения
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Режим быстрой вставки списком -->
          <button
            type="button"
            @click="isPasteMode = !isPasteMode"
            class="px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-colors"
            :class="
              isPasteMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            "
            title="Быстрая вставка списком"
          >
            <ClipboardPaste class="w-3.5 h-3.5" />
            <span>Вставить текстом</span>
          </button>

          <button
            type="button"
            @click="$emit('close')"
            class="size-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Контент -->
      <div class="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
        <!-- Заголовок чек-листа -->
        <div>
          <label class="block text-[11px] font-medium text-white/50 mb-1">
            Заголовок списка
          </label>
          <input
            v-model="title"
            placeholder="Например: План релиза, Покупки..."
            class="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-medium"
          />
        </div>

        <!-- Если включен режим быстрой вставки -->
        <div v-if="isPasteMode" class="flex flex-col gap-2">
          <label class="block text-[11px] font-medium text-white/50">
            Вставьте строки (каждая строка станет пунктом; поддерживается `- [ ]`):
          </label>
          <textarea
            v-model="bulkText"
            rows="5"
            placeholder="- Задача 1&#10;- [x] Выполненная задача 2&#10;3. Задача 3"
            class="w-full text-xs p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400 resize-none font-mono"
          ></textarea>
          <button
            type="button"
            @click="parseBulkText"
            :disabled="!bulkText.trim()"
            class="self-end px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-40"
          >
            Применить список
          </button>
        </div>

        <!-- Построчный редактор пунктов -->
        <div v-else class="flex flex-col gap-2">
          <label class="block text-[11px] font-medium text-white/50">
            Пункты списка ({{ items.length }})
          </label>

          <div class="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="item in items"
              :key="item.id"
              class="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors"
            >
              <!-- Чекбокс -->
              <button
                type="button"
                @click="toggleItem(item)"
                class="size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors"
                :class="
                  item.done
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : 'border-white/30 bg-white/5 hover:border-white/60'
                "
              >
                <Check v-if="item.done" class="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <!-- Текст пункта -->
              <input
                v-model="item.text"
                class="flex-1 text-xs bg-transparent text-white focus:outline-none"
                :class="{ 'line-through opacity-40': item.done }"
              />

              <!-- Удалить -->
              <button
                type="button"
                @click="removeItem(item.id)"
                class="size-6 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Добавление нового пункта -->
          <div class="flex items-center gap-2 mt-2">
            <input
              ref="newItemInputRef"
              v-model="newItemText"
              @keydown.enter.prevent="addItem"
              placeholder="Добавить новый пункт (Enter)..."
              class="flex-1 text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              @click="addItem"
              :disabled="!newItemText.trim()"
              class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Подвал -->
      <div
        class="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between"
      >
        <span class="text-xs text-white/40">
          {{ items.filter((i) => i.done).length }} из {{ items.length }} готово
        </span>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="!items.some((i) => i.text.trim())"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white flex items-center gap-1.5 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check class="w-3.5 h-3.5" /> Прикрепить список
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
.animate-scaleIn {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
