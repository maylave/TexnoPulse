<!-- src/components/ChatHome/chat-input/panels/CodePanel.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { X, Check, Code2, FileCode2, Layers } from "lucide-vue-next";
import {
  detectCodeLanguage,
  LANGUAGE_EXTENSIONS,
} from "@/utils/codeDetection";
import { useWordFrequencyStore, type WordEntry } from "@/stores/wordFrequency";
import SuggestionsMenu from "../SuggestionsMenu.vue";

const props = defineProps<{
  initialCode?: string;
  initialLang?: string;
  initialFileName?: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [payload: { code: string; language: string; fileName: string }];
}>();

const code = ref(props.initialCode || "");
const selectedLang = ref(props.initialLang || "auto");
const detectedLang = ref("javascript");
const fileName = ref(props.initialFileName || "snippet.js");
const textareaRef = ref<HTMLTextAreaElement>();

const wordFrequencyStore = useWordFrequencyStore();
const showSuggestions = ref(false);
const suggestions = ref<WordEntry[]>([]);
const selectedSuggestionIndex = ref(0);
const currentWordPrefix = ref("");
const currentWordRange = ref<{ start: number; end: number }>({ start: 0, end: 0 });

watch(
  () => props.initialCode,
  (val) => {
    if (val !== undefined) code.value = val;
  },
);
watch(
  () => props.initialLang,
  (val) => {
    if (val !== undefined) selectedLang.value = val;
  },
);
watch(
  () => props.initialFileName,
  (val) => {
    if (val !== undefined) fileName.value = val;
  },
);

const popularLangs = [
  "auto",
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "sql",
  "bash",
  "cpp",
  "rust",
];

watch(
  code,
  (val) => {
    if (val.trim()) {
      const detected = detectCodeLanguage(val);
      detectedLang.value = detected === "plaintext" ? "javascript" : detected;
    }
  },
  { immediate: true },
);

const effectiveLang = computed(() => {
  if (selectedLang.value === "auto") {
    return detectedLang.value;
  }
  return selectedLang.value;
});

watch(
  effectiveLang,
  (lang) => {
    const ext = LANGUAGE_EXTENSIONS[lang] || "txt";
    const base = fileName.value.split(".")[0] || "snippet";
    fileName.value = `${base}.${ext}`;
  },
  { immediate: true },
);

// --- Извлечение слова на курсоре для подсказок кода ---
const extractWordAtCursor = (text: string, cursorPos: number) => {
  if (cursorPos < 0) return { word: "", start: 0, end: 0 };
  let start = cursorPos;
  while (start > 0 && /[a-zA-Z0-9_$.#]/.test(text[start - 1] ?? "")) {
    start--;
  }
  let end = cursorPos;
  while (end < text.length && /[a-zA-Z0-9_$.#]/.test(text[end] ?? "")) {
    end++;
  }
  const word = text.slice(start, cursorPos);
  return { word, start, end };
};

const updateCodeSuggestions = () => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const cursorPos = textarea.selectionStart;
  const text = code.value;
  const { word, start, end } = extractWordAtCursor(text, cursorPos);

  if (word.length >= 1) {
    const list = wordFrequencyStore.getSuggestions(word, {
      isCode: true,
      language: effectiveLang.value,
      contextCode: text,
      limit: 7,
      minChars: 1,
    });

    if (list.length > 0) {
      suggestions.value = list;
      currentWordPrefix.value = word;
      currentWordRange.value = { start, end };
      selectedSuggestionIndex.value = 0;
      showSuggestions.value = true;
      return;
    }
  }

  showSuggestions.value = false;
};

const applyCodeSuggestion = (item: WordEntry) => {
  const textarea = textareaRef.value;
  const text = code.value;
  const { start, end } = currentWordRange.value;

  const before = text.substring(0, start);
  const after = text.substring(end);
  const replacement = item.insertText || item.word;
  const newText = before + replacement + after;

  code.value = newText;
  showSuggestions.value = false;

  nextTick(() => {
    if (textarea) {
      const newPos = start + replacement.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }
  });
};

const handleKeydown = (e: KeyboardEvent) => {
  // Навигация по подсказкам
  if (showSuggestions.value && suggestions.value.length > 0) {
    if (e.key === "ArrowDown") {
      selectedSuggestionIndex.value =
        (selectedSuggestionIndex.value + 1) % suggestions.value.length;
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      selectedSuggestionIndex.value =
        (selectedSuggestionIndex.value - 1 + suggestions.value.length) %
        suggestions.value.length;
      e.preventDefault();
      return;
    }
    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && !e.ctrlKey)) {
      const item = suggestions.value[selectedSuggestionIndex.value];
      if (item) {
        applyCodeSuggestion(item);
        e.preventDefault();
        return;
      }
    }
    if (e.key === "Escape") {
      showSuggestions.value = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }

  if (e.key === "Tab") {
    e.preventDefault();
    const textarea = textareaRef.value;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    code.value = code.value.substring(0, start) + "  " + code.value.substring(end);
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
    return;
  }

  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    handleConfirm();
  }
};

const handleConfirm = () => {
  const text = code.value.trim();
  if (!text) return;

  emit("confirm", {
    code: text,
    language: effectiveLang.value,
    fileName: fileName.value || `snippet.${LANGUAGE_EXTENSIONS[effectiveLang.value] || "txt"}`,
  });
};

onMounted(() => {
  nextTick(() => {
    textareaRef.value?.focus();
  });
});
</script>

<template>
  <div
    class="mb-3 p-3.5 panel-glass flex flex-col gap-2.5 z-20 relative text-white animate-scaleIn select-none"
  >
    <!-- Шапка панели кода -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="size-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0"
        >
          <Code2 class="w-3.5 h-3.5" />
        </div>

        <span class="text-xs font-semibold text-white/90 truncate">
          Сниппет кода
        </span>

        <!-- Выбор языка без смайликов -->
        <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-xs text-white/80">
          <Layers class="w-3 h-3 text-sky-400" />
          <select
            v-model="selectedLang"
            class="bg-transparent text-xs text-sky-300 font-mono focus:outline-none cursor-pointer"
          >
            <option
              v-for="lang in popularLangs"
              :key="lang"
              :value="lang"
              class="bg-[#1a202c] text-white"
            >
              {{ lang === "auto" ? `Авто (${detectedLang})` : lang }}
            </option>
          </select>
        </div>

        <!-- Имя файла -->
        <div class="hidden sm:flex items-center gap-1 text-[11px] text-white/40 font-mono">
          <FileCode2 class="w-3 h-3" />
          <input
            v-model="fileName"
            class="bg-transparent border-b border-white/10 focus:border-sky-400 focus:outline-none w-24 text-white/80 text-[11px]"
            placeholder="snippet.js"
          />
        </div>
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="size-6 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        title="Закрыть"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Текстовое поле ввода кода с автоподсказками -->
    <div class="relative">
      <textarea
        ref="textareaRef"
        v-model="code"
        @input="updateCodeSuggestions"
        @click="updateCodeSuggestions"
        @keyup="updateCodeSuggestions"
        @keydown="handleKeydown"
        rows="4"
        placeholder="// Введите код здесь... (Tab для отступа или подсказки, Ctrl+Enter для сохранения)"
        class="w-full text-xs font-mono p-2.5 rounded-xl bg-black/25 border border-white/10 text-white/95 focus:outline-none focus:border-sky-400/60 resize-y max-h-56 leading-relaxed custom-scrollbar"
        spellcheck="false"
      ></textarea>

      <!-- Контекстное меню подсказок кода (в стиле VS Code) -->
      <Transition name="picker">
        <SuggestionsMenu
          v-if="showSuggestions && suggestions.length > 0"
          :suggestions="suggestions"
          :selected-index="selectedSuggestionIndex"
          :prefix="currentWordPrefix"
          @select="applyCodeSuggestion"
          @close="showSuggestions = false"
          class="!absolute !bottom-auto !top-2 !left-2 z-50 shadow-2xl"
        />
      </Transition>
    </div>

    <!-- Подвал панели: быстрые действия -->
    <div class="flex items-center justify-between text-xs">
      <span class="text-[11px] text-white/40 font-mono">
        {{ code ? `${code.split("\n").length} стр.` : "Пусто" }}
      </span>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="px-3 py-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs"
        >
          Отмена
        </button>

        <button
          type="button"
          @click="handleConfirm"
          :disabled="!code.trim()"
          class="px-3.5 py-1.5 rounded-xl bg-sky-500 text-white font-medium flex items-center gap-1.5 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-sky-500/20 text-xs"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Сохранить</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.65));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 2px 4px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
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

.picker-enter-active,
.picker-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
