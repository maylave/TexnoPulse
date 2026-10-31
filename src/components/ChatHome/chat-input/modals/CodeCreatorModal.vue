<!-- src/components/ChatHome/chat-input/modals/CodeCreatorModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  X,
  Check,
  Code2,
  Sparkles,
  Eye,
  FileCode2,
  Copy,
  RotateCcw,
} from "lucide-vue-next";
import CodePreview from "../../message/code/CodePreview.vue";
import SuggestionsMenu from "../SuggestionsMenu.vue";
import { useWordFrequencyStore, type WordEntry } from "@/stores/wordFrequency";
import {
  detectCodeLanguage,
  normalizeLanguage,
  LANGUAGE_EXTENSIONS,
} from "@/utils/codeDetection";

const props = defineProps<{
  initialCode?: string;
  initialLanguage?: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [
    payload: {
      code: string;
      language: string;
      fileName: string;
    },
  ];
}>();

const code = ref(props.initialCode || "");
const selectedLanguage = ref(props.initialLanguage || "auto");
const detectedLanguage = ref("javascript");
const fileName = ref("");
const activeTab = ref<"editor" | "preview">("editor");
const textareaRef = ref<HTMLTextAreaElement>();

// --- Подсказки ключевых слов кода ---
const wordFrequencyStore = useWordFrequencyStore();
const showSuggestions = ref(false);
const suggestions = ref<WordEntry[]>([]);
const selectedSuggestionIndex = ref(0);
const currentWordPrefix = ref("");
const currentWordRange = ref<{ start: number; end: number }>({ start: 0, end: 0 });

const popularLanguages = [
  { id: "auto", name: "✨ Авто" },
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "python", name: "Python" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "json", name: "JSON" },
  { id: "sql", name: "SQL" },
  { id: "bash", name: "Bash" },
  { id: "rust", name: "Rust" },
  { id: "cpp", name: "C++" },
  { id: "go", name: "Go" },
];

// Автоматическое определение языка в реальном времени
watch(
  code,
  (val) => {
    if (val.trim()) {
      const detected = detectCodeLanguage(val);
      detectedLanguage.value = detected === "plaintext" ? "javascript" : detected;
    }
  },
  { immediate: true },
);

const effectiveLanguage = computed(() => {
  if (selectedLanguage.value === "auto") {
    return detectedLanguage.value;
  }
  return selectedLanguage.value;
});

// Автоматическое имя файла при смене языка
watch(
  effectiveLanguage,
  (lang) => {
    const ext = LANGUAGE_EXTENSIONS[lang] || "txt";
    if (!fileName.value || fileName.value.startsWith("snippet.")) {
      fileName.value = `snippet.${ext}`;
    } else {
      const base = fileName.value.split(".")[0];
      fileName.value = `${base}.${ext}`;
    }
  },
  { immediate: true },
);

// Извлечение текущего слова для подсказок
const extractWordAtCursor = (text: string, cursorPos: number) => {
  if (cursorPos < 0) return { word: "", start: 0, end: 0 };
  let start = cursorPos;
  while (start > 0 && !/[\s,.;:!?()\[\]{}"'`<>]/.test(text[start - 1] ?? "")) {
    start--;
  }
  let end = cursorPos;
  while (end < text.length && !/[\s,.;:!?()\[\]{}"'`<>]/.test(text[end] ?? "")) {
    end++;
  }
  const word = text.slice(start, cursorPos);
  return { word, start, end };
};

const updateSuggestions = () => {
  const textarea = textareaRef.value;
  if (!textarea || activeTab.value !== "editor") return;

  const cursorPos = textarea.selectionStart;
  const text = code.value;
  const { word, start, end } = extractWordAtCursor(text, cursorPos);

  if (word.length >= 2) {
    const list = wordFrequencyStore.getSuggestions(word, {
      isCode: true,
      limit: 6,
      minChars: 2,
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

const applySuggestion = (item: WordEntry) => {
  const textarea = textareaRef.value;
  const text = code.value;
  const { start, end } = currentWordRange.value;

  const before = text.substring(0, start);
  const after = text.substring(end);
  const replacement = item.word;
  code.value = before + replacement + after;
  showSuggestions.value = false;

  nextTick(() => {
    if (textarea) {
      const newPos = start + replacement.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }
  });
};

// Поддержка клавиши Tab (отступ в 2 пробела) и навигации по подсказкам
const handleKeydown = (e: KeyboardEvent) => {
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
    if (e.key === "Tab" || e.key === "Enter") {
      const item = suggestions.value[selectedSuggestionIndex.value];
      if (item) {
        applySuggestion(item);
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
  }
};

const lineCount = computed(() => {
  if (!code.value) return 1;
  return code.value.split("\n").length;
});

const charCount = computed(() => code.value.length);

const quickTemplates: Record<string, string> = {
  javascript: `// Функция\nfunction calculate(data) {\n  console.log("Processing:", data);\n  return data.map(item => item * 2);\n}`,
  typescript: `interface User {\n  id: string;\n  name: string;\n  role: 'admin' | 'user';\n}\n\nconst currentUser: User = {\n  id: 'u1',\n  name: 'Alex',\n  role: 'admin'\n};`,
  python: `def process_items(items):\n    """Обработка списка элементов"""\n    results = [x * 2 for x in items if x > 0]\n    print(f"Обработано {len(results)} элементов")\n    return results`,
  html: `<div class="card">\n  <h2 class="title">Заголовок</h2>\n  <p class="description">Описание карточки</p>\n  <button class="btn">Нажми меня</button>\n</div>`,
  json: `{\n  "status": "success",\n  "version": "2.0",\n  "data": {\n    "itemsCount": 42\n  }\n}`,
  sql: `SELECT u.id, u.name, COUNT(o.id) as orders_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = 1\nGROUP BY u.id\nORDER BY orders_count DESC;`,
};

const applyTemplate = (langKey: string) => {
  const tmpl = quickTemplates[langKey];
  if (tmpl) {
    code.value = tmpl;
    selectedLanguage.value = langKey;
  }
};

const handleConfirm = () => {
  const text = code.value.trim();
  if (!text) return;
  emit("confirm", {
    code: text,
    language: effectiveLanguage.value,
    fileName: fileName.value || `snippet.${LANGUAGE_EXTENSIONS[effectiveLanguage.value] || "txt"}`,
  });
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121620]/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white animate-scaleIn max-h-[85vh]"
    >
      <!-- Шапка -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="size-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400"
          >
            <Code2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-tight">
              Сниппет кода
            </h3>
            <p class="text-xs text-white/50 leading-tight">
              Вставьте код или выберите язык
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Переключатель Редактор / Превью -->
          <div class="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10">
            <button
              type="button"
              @click="activeTab = 'editor'"
              class="px-2.5 py-1 text-xs rounded-md font-medium transition-all"
              :class="
                activeTab === 'editor'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              "
            >
              Редактор
            </button>
            <button
              type="button"
              @click="activeTab = 'preview'"
              class="px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition-all"
              :class="
                activeTab === 'preview'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              "
            >
              <Eye class="w-3 h-3" /> Превью
            </button>
          </div>

          <button
            type="button"
            @click="$emit('close')"
            class="size-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Панель управления (языки, имя файла, бейдж автоопределения) -->
      <div
        class="px-5 py-2.5 border-b border-white/5 bg-white/[0.01] flex flex-wrap items-center justify-between gap-3"
      >
        <!-- Чипсы языков -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[65%] custom-scrollbar">
          <button
            v-for="lang in popularLanguages"
            :key="lang.id"
            type="button"
            @click="selectedLanguage = lang.id"
            class="px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-all border"
            :class="
              selectedLanguage === lang.id
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
            "
          >
            {{ lang.name }}
          </button>
        </div>

        <!-- Поле имени файла -->
        <div class="flex items-center gap-2">
          <FileCode2 class="w-3.5 h-3.5 text-white/40" />
          <input
            v-model="fileName"
            placeholder="snippet.js"
            class="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-sky-400 w-32"
          />
        </div>
      </div>

      <!-- Индикатор автоопределения -->
      <div
        v-if="selectedLanguage === 'auto'"
        class="px-5 py-1.5 bg-sky-500/10 border-b border-sky-500/15 flex items-center justify-between text-xs text-sky-300"
      >
        <span class="flex items-center gap-1.5 font-medium">
          <Sparkles class="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          Автоопределено:
          <span class="font-mono uppercase font-bold text-sky-200">
            {{ effectiveLanguage }}
          </span>
        </span>
        <span class="text-white/40 text-[11px]">
          (можно выбрать другой язык выше)
        </span>
      </div>

      <!-- Основная область: Редактор или Превью -->
      <div class="flex-1 min-h-[220px] max-h-[400px] overflow-hidden flex flex-col relative">
        <!-- Редактор -->
        <div
          v-if="activeTab === 'editor'"
          class="flex-1 flex overflow-hidden font-mono text-xs bg-black/30 relative"
        >
          <!-- Номера строк -->
          <div
            class="select-none py-3 px-2 text-right text-white/20 bg-black/20 border-r border-white/5 font-mono text-xs leading-5"
          >
            <div v-for="n in Math.max(lineCount, 6)" :key="n">
              {{ n }}
            </div>
          </div>

          <!-- Поле ввода кода -->
          <textarea
            ref="textareaRef"
            v-model="code"
            @input="updateSuggestions"
            @click="updateSuggestions"
            @keyup="updateSuggestions"
            @keydown="handleKeydown"
            placeholder="// Вставьте или напишите ваш код здесь...&#10;// Поддерживается Tab, подсказки ключевых слов и подсветка."
            class="flex-1 p-3 bg-transparent text-white/90 focus:outline-none resize-none leading-5 font-mono overflow-y-auto custom-scrollbar"
            spellcheck="false"
          ></textarea>

          <!-- Меню подсказок для кода внутри редактора -->
          <Transition name="picker">
            <SuggestionsMenu
              v-if="showSuggestions && suggestions.length > 0"
              :suggestions="suggestions"
              :selected-index="selectedSuggestionIndex"
              :prefix="currentWordPrefix"
              @select="applySuggestion"
              @close="showSuggestions = false"
              class="bottom-3 left-14"
            />
          </Transition>
        </div>

        <!-- Превью через Shiki -->
        <div
          v-else
          class="flex-1 p-4 overflow-y-auto custom-scrollbar bg-black/40 font-mono text-xs"
        >
          <CodePreview :code="code || '// Код отсутствует'" :language="effectiveLanguage" :size="true" />
        </div>
      </div>

      <!-- Быстрые шаблоны (если код пуст) -->
      <div
        v-if="!code.trim()"
        class="px-5 py-2 border-t border-white/5 bg-white/[0.01] flex items-center gap-2 overflow-x-auto text-xs text-white/40"
      >
        <span>Быстрый шаблон:</span>
        <button
          v-for="t in ['javascript', 'typescript', 'python', 'html', 'json', 'sql']"
          :key="t"
          type="button"
          @click="applyTemplate(t)"
          class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          {{ t }}
        </button>
      </div>

      <!-- Подвал -->
      <div
        class="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between"
      >
        <div class="text-xs text-white/40 flex items-center gap-3">
          <span>Строк: {{ lineCount }}</span>
          <span>Символов: {{ charCount }}</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="code = ''"
            v-if="code.trim()"
            class="px-3 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            <RotateCcw class="w-3 h-3" /> Очистить
          </button>
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
            :disabled="!code.trim()"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white flex items-center gap-1.5 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-500/25"
          >
            <Check class="w-3.5 h-3.5" /> Прикрепить код
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
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
