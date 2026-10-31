<!-- src/components/ChatHome/chat-input/panels/ChecklistPanel.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { X, Check, ListTodo } from "lucide-vue-next";

const props = defineProps<{
  initialTitle?: string;
  initialItems?: Array<{ text: string; done: boolean }>;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [
    payload: {
      title: string;
      items: Array<{ text: string; done: boolean }>;
    },
  ];
}>();

const formatItemsToText = (items?: Array<{ text: string; done: boolean }>) => {
  if (!items || !items.length) return "";
  return items.map((i) => `${i.done ? "- [x]" : "- [ ]"} ${i.text}`).join("\n");
};

const title = ref(props.initialTitle || "Чек-лист");
const textContent = ref(formatItemsToText(props.initialItems));

watch(
  () => props.initialTitle,
  (val) => {
    if (val !== undefined) title.value = val;
  },
);
watch(
  () => props.initialItems,
  (val) => {
    if (val) textContent.value = formatItemsToText(val);
  },
  { deep: true },
);

const handleConfirm = () => {
  const lines = textContent.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return;

  const items = lines.map((line) => {
    let done = false;
    let clean = line;

    if (/^[-*]\s*\[([ xX])\]\s*/.test(clean)) {
      done = /^[-*]\s*\[[xX]\]/.test(clean);
      clean = clean.replace(/^[-*]\s*\[[ xX]\]\s*/, "");
    } else if (/^[-*•]\s+/.test(clean)) {
      clean = clean.replace(/^[-*•]\s+/, "");
    } else if (/^\d+[.)]\s+/.test(clean)) {
      clean = clean.replace(/^\d+[.)]\s+/, "");
    }

    return { text: clean, done };
  });

  emit("confirm", {
    title: title.value.trim() || "Чек-лист",
    items,
  });
};
</script>

<template>
  <div
    class="mb-3 p-3.5 panel-glass flex flex-col gap-2.5 z-20 relative text-white animate-scaleIn select-none"
  >
    <!-- Шапка панели -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div
          class="size-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0"
        >
          <ListTodo class="w-3.5 h-3.5" />
        </div>
        <input
          v-model="title"
          placeholder="Название списка..."
          class="text-xs font-semibold bg-transparent text-white/90 border-b border-white/10 focus:border-amber-400 focus:outline-none w-48"
        />
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="size-6 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Поле ввода пунктов -->
    <textarea
      v-model="textContent"
      rows="3"
      placeholder="Купить продукты&#10;Завершить верстку чата&#10;Проверить тесты..."
      class="w-full text-xs p-2.5 rounded-xl bg-black/25 border border-white/10 text-white/95 focus:outline-none focus:border-amber-400/60 resize-y max-h-40 leading-relaxed custom-scrollbar"
    ></textarea>

    <!-- Подвал панели -->
    <div class="flex items-center justify-between text-xs">
      <span class="text-[11px] text-white/40 font-mono">
        Каждый пункт с новой строки
      </span>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="px-3 py-1 rounded-lg text-white/50 hover:text-white transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          @click="handleConfirm"
          class="px-4 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Check class="w-3 h-3" />
          <span>Сохранить</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.75));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-scaleIn {
  animation: scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
