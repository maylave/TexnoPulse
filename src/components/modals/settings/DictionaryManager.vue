<!-- src/components/modals/settings/DictionaryManager.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useWordFrequencyStore, type WordEntry } from "@/stores/wordFrequency";
import {
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Code2,
  MessageSquareQuote,
  Check,
  X,
  FileJson,
} from "lucide-vue-next";

const store = useWordFrequencyStore();

const searchQuery = ref("");
const selectedFilter = ref<"all" | "learned" | "code" | "custom">("all");

// Форма добавления нового слова
const isAddingWord = ref(false);
const newWord = ref("");
const newCount = ref(10);
const newCategory = ref<"custom" | "code">("custom");
const newHint = ref("");

// Окно импорта JSON
const isImporting = ref(false);
const jsonInput = ref("");
const importStatus = ref<string | null>(null);

const filteredWords = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return store.popularWords.filter((item) => {
    if (selectedFilter.value !== "all" && item.category !== selectedFilter.value) {
      return false;
    }
    if (!q) return true;
    return (
      item.word.toLowerCase().includes(q) ||
      (item.hint && item.hint.toLowerCase().includes(q))
    );
  });
});

const totalUsageCount = computed(() =>
  store.words.reduce((sum, w) => sum + w.count, 0),
);

const handleAddWord = () => {
  const text = newWord.value.trim();
  if (!text) return;

  store.addCustomWord(text, newCount.value, newCategory.value, newHint.value.trim() || undefined);

  newWord.value = "";
  newCount.value = 10;
  newHint.value = "";
  isAddingWord.value = false;
};

const handleExport = () => {
  const data = store.exportToJson();
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `snapi_dictionary_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = () => {
  if (!jsonInput.value.trim()) return;
  const success = store.importFromJson(jsonInput.value);
  if (success) {
    importStatus.value = "Словарь успешно импортирован!";
    setTimeout(() => {
      isImporting.value = false;
      importStatus.value = null;
      jsonInput.value = "";
    }, 1200);
  } else {
    importStatus.value = "Ошибка: невалидный формат JSON";
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Информационная плашка со статистикой -->
    <div
      class="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="size-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400"
        >
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white">
            Частые слова и умные подсказки
          </h4>
          <p class="text-xs text-white/50">
            Всего слов в словаре: {{ store.words.length }} · Использований: {{ totalUsageCount }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="isAddingWord = !isAddingWord"
          class="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-sky-400 transition-all shadow-md shadow-sky-500/20"
        >
          <Plus class="w-4 h-4" />
          <span>Добавить слово</span>
        </button>

        <button
          type="button"
          @click="handleExport"
          class="size-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Экспорт словаря в JSON"
        >
          <Download class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="isImporting = !isImporting"
          class="size-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Импорт словаря из JSON"
        >
          <Upload class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="store.resetToDefaults"
          class="size-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Сброс к исходным словам"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Модальная форма добавления нового слова -->
    <div
      v-if="isAddingWord"
      class="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 space-y-3 animate-fadeIn"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-sky-300">
          Добавление нового частого слова или команды
        </span>
        <button
          type="button"
          @click="isAddingWord = false"
          class="text-white/40 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-[11px] text-white/50 mb-1">Слово или фраза</label>
          <input
            v-model="newWord"
            placeholder="например: привет, return, console.log"
            class="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label class="block text-[11px] text-white/50 mb-1">Категория</label>
          <select
            v-model="newCategory"
            class="w-full text-xs px-3 py-2 rounded-xl bg-[#1b202c] border border-white/10 text-white focus:outline-none focus:border-sky-400"
          >
            <option value="custom">Текст / Фраза</option>
            <option value="code">Ключевое слово кода</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] text-white/50 mb-1">Подсказка / Описание</label>
          <input
            v-model="newHint"
            placeholder="необязательно"
            class="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <button
          type="button"
          @click="isAddingWord = false"
          class="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
        >
          Отмена
        </button>
        <button
          type="button"
          @click="handleAddWord"
          :disabled="!newWord.trim()"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-40"
        >
          Сохранить
        </button>
      </div>
    </div>

    <!-- Модальная форма импорта JSON -->
    <div
      v-if="isImporting"
      class="p-4 rounded-2xl border border-white/20 bg-white/[0.04] space-y-3 animate-fadeIn"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-white">
          Импорт словаря из формата JSON
        </span>
        <button
          type="button"
          @click="isImporting = false"
          class="text-white/40 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <textarea
        v-model="jsonInput"
        rows="4"
        placeholder='[ { "word": "привет", "count": 10, "category": "learned" } ]'
        class="w-full text-xs font-mono p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-sky-400 resize-none"
      ></textarea>

      <div class="flex items-center justify-between">
        <span class="text-xs text-emerald-400" v-if="importStatus">{{ importStatus }}</span>
        <span v-else></span>

        <div class="flex gap-2">
          <button
            type="button"
            @click="isImporting = false"
            class="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
          >
            Отмена
          </button>
          <button
            type="button"
            @click="handleImport"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400"
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>

    <!-- Поиск и фильтрация -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <Search class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          v-model="searchQuery"
          placeholder="Поиск по словарю..."
          class="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
        />
      </div>

      <!-- Вкладки фильтров -->
      <div class="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs">
        <button
          type="button"
          @click="selectedFilter = 'all'"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="selectedFilter === 'all' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'"
        >
          Все ({{ store.words.length }})
        </button>
        <button
          type="button"
          @click="selectedFilter = 'learned'"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="selectedFilter === 'learned' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'"
        >
          Частые слова
        </button>
        <button
          type="button"
          @click="selectedFilter = 'code'"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="selectedFilter === 'code' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'"
        >
          Код
        </button>
        <button
          type="button"
          @click="selectedFilter = 'custom'"
          class="px-3 py-1 rounded-lg font-medium transition-colors"
          :class="selectedFilter === 'custom' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'"
        >
          Свои
        </button>
      </div>
    </div>

    <!-- Список слов таблицы -->
    <div
      class="rounded-2xl border border-white/10 bg-white/[0.01] overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar"
    >
      <div
        v-if="filteredWords.length === 0"
        class="p-8 text-center text-xs text-white/40 flex flex-col items-center gap-2"
      >
        <Search class="w-6 h-6 opacity-40" />
        <span>Слова не найдены</span>
      </div>

      <div v-else class="divide-y divide-white/5">
        <div
          v-for="item in filteredWords"
          :key="item.word"
          class="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="size-7 rounded-lg flex items-center justify-center shrink-0"
              :class="
                item.category === 'code'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-sky-500/15 text-sky-400'
              "
            >
              <Code2 v-if="item.category === 'code'" class="w-3.5 h-3.5" />
              <MessageSquareQuote v-else class="w-3.5 h-3.5" />
            </div>

            <div class="flex flex-col min-w-0">
              <span class="text-xs font-semibold text-white truncate">
                {{ item.word }}
              </span>
              <span v-if="item.hint" class="text-[11px] text-white/40 truncate">
                {{ item.hint }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Счетчик частоты -->
            <div class="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
              <TrendingUp class="w-3 h-3 text-sky-400" />
              <span class="text-xs font-mono font-medium text-white/90">
                {{ item.count }}
              </span>
            </div>

            <!-- Кнопка удаления -->
            <button
              type="button"
              @click="store.removeWord(item.word)"
              class="size-7 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Удалить слово"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
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
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
</style>
