// src/stores/wordFrequency.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getVSCodeCompletions,
  type CompletionKind,
} from "@/utils/codeCompletions";
import { RUSSIAN_VOCABULARY } from "@/utils/dictionaries/russianVocabulary";
import { useColorMemoryStore } from "@/stores/colorMemory";

export interface WordEntry {
  word: string;
  count: number;
  lastUsed: number;
  category: "custom" | "learned" | "code";
  hint?: string;
  kind?: CompletionKind;
  detail?: string;
  insertText?: string;
}

const STORAGE_KEY = "snapi_word_frequency_v1";

// Базовый стартовый словарь популярных слов и ключевых слов кода
const DEFAULT_WORDS: WordEntry[] = [
  ...RUSSIAN_VOCABULARY,

  // Популярные ключевые слова и сниппеты кода
  { word: "console.log", count: 30, lastUsed: Date.now() - 500, category: "code", kind: "function", detail: "(method)", hint: "JS вывод" },
  { word: "function", count: 28, lastUsed: Date.now() - 600, category: "code", kind: "keyword", detail: "keyword", hint: "Функция" },
  { word: "const", count: 26, lastUsed: Date.now() - 700, category: "code", kind: "keyword", detail: "keyword", hint: "Константа" },
  { word: "let", count: 24, lastUsed: Date.now() - 750, category: "code", kind: "keyword", detail: "keyword", hint: "Переменная" },
  { word: "return", count: 24, lastUsed: Date.now() - 800, category: "code", kind: "keyword", detail: "keyword", hint: "Возврат" },
  { word: "async", count: 22, lastUsed: Date.now() - 900, category: "code", kind: "keyword", detail: "keyword", hint: "Асинхронность" },
  { word: "await", count: 22, lastUsed: Date.now() - 950, category: "code", kind: "keyword", detail: "keyword", hint: "Ожидание" },
  { word: "import", count: 21, lastUsed: Date.now() - 1100, category: "code", kind: "keyword", detail: "keyword", hint: "Импорт" },
  { word: "export", count: 19, lastUsed: Date.now() - 1200, category: "code", kind: "keyword", detail: "keyword", hint: "Экспорт" },
  { word: "interface", count: 16, lastUsed: Date.now() - 1300, category: "code", kind: "interface", detail: "interface", hint: "TS интерфейс" },
  { word: "def", count: 18, lastUsed: Date.now() - 1400, category: "code", kind: "keyword", detail: "def function():", hint: "Python функция" },
  { word: "class", count: 17, lastUsed: Date.now() - 1500, category: "code", kind: "class", detail: "class", hint: "Класс" },
  { word: "SELECT", count: 15, lastUsed: Date.now() - 1600, category: "code", kind: "keyword", detail: "SQL выборка", hint: "SQL выборка" },
  { word: "FROM", count: 15, lastUsed: Date.now() - 1700, category: "code", kind: "keyword", detail: "SQL таблица", hint: "SQL таблица" },
  { word: "WHERE", count: 14, lastUsed: Date.now() - 1800, category: "code", kind: "keyword", detail: "SQL условие", hint: "SQL условие" },
];

export const useWordFrequencyStore = defineStore("wordFrequency", () => {
  const words = ref<WordEntry[]>([]);

  // Инициализация из LocalStorage
  const loadWords = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Дополняем новыми предустановленными словами, сохраняя прогресс пользователя
          const existingMap = new Map(parsed.map((w: WordEntry) => [w.word.toLowerCase(), w]));
          for (const def of DEFAULT_WORDS) {
            if (!existingMap.has(def.word.toLowerCase())) {
              parsed.push({ ...def });
            }
          }
          words.value = parsed;
          return;
        }
      }
    } catch (e) {
      console.error("[wordFrequency] Ошибка загрузки словаря:", e);
    }
    words.value = [...DEFAULT_WORDS];
    saveWords();
  };

  const saveWords = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words.value));
    } catch (e) {
      console.error("[wordFrequency] Ошибка сохранения словаря:", e);
    }
  };

  loadWords();

  // Отсортированный список всех слов (по популярности)
  const popularWords = computed(() =>
    [...words.value].sort((a, b) => b.count - a.count),
  );

  /**
   * Обучение на отправленном сообщении: извлекает слова и увеличивает их частоту
   */
  const learnFromText = (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    // Очищаем от url и markdown-блоков
    const cleaned = rawText
      .replace(/https?:\/\/\S+/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[^\wа-яА-ЯёЁ\s.-]/g, " ");

    const tokens = cleaned
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 2 && !/^\d+$/.test(t));

    if (tokens.length === 0) return;

    const wordMap = new Map(words.value.map((w) => [w.word.toLowerCase(), w]));

    for (const token of tokens) {
      const existing = wordMap.get(token);
      if (existing) {
        existing.count += 1;
        existing.lastUsed = Date.now();
      } else {
        const newEntry: WordEntry = {
          word: token,
          count: 1,
          lastUsed: Date.now(),
          category: "learned",
        };
        words.value.push(newEntry);
        wordMap.set(token, newEntry);
      }
    }

    saveWords();
  };

  /**
   * Поиск подсказок по началу слова (префиксу), объединяющий частые слова пользователя и библиотеку VS Code
   */
  const getSuggestions = (
    prefix: string,
    options?: {
      isCode?: boolean;
      language?: string;
      contextCode?: string;
      chatId?: string;
      limit?: number;
      minChars?: number;
    },
  ): WordEntry[] => {
    const isCode = options?.isCode ?? false;
    const isColorTrigger =
      prefix.startsWith("#") ||
      prefix.toLowerCase().startsWith("color:") ||
      prefix.toLowerCase().startsWith("$color");

    const minChars = options?.minChars ?? (isColorTrigger ? 1 : isCode ? 1 : 2);
    const cleanPrefix = prefix.trim().toLowerCase();
    if (!cleanPrefix || cleanPrefix.length < minChars) return [];

    const limit = options?.limit ?? 8;
    const language = options?.language;
    const contextCode = options?.contextCode;
    const chatId = options?.chatId;

    // 0. Если набран префикс цвета (#..., color:..., $color)
    if (isColorTrigger) {
      try {
        const colorStore = useColorMemoryStore();
        const colorMatches = colorStore.getColorSuggestions(cleanPrefix, chatId, limit);
        if (colorMatches.length > 0) {
          return colorMatches;
        }
      } catch {}
    }

    // 1. Пользовательские слова из памяти
    const userMatches = words.value.filter((item) => {
      const w = item.word.toLowerCase();
      if (w === cleanPrefix) return false;
      return w.startsWith(cleanPrefix) || (cleanPrefix.length >= 3 && w.includes(cleanPrefix));
    });

    // 2. Подсказки VS Code IntelliSense (если режим кода или префикс на латинице)
    const vsCodeItems = isCode || /^[a-zA-Z_]/.test(cleanPrefix)
      ? getVSCodeCompletions(cleanPrefix, language, contextCode, limit * 2).map((c): WordEntry => ({
          word: c.word,
          count: 0,
          lastUsed: 0,
          category: "code",
          hint: c.hint,
          kind: c.kind,
          detail: c.detail,
          insertText: c.insertText,
        }))
      : [];

    // 3. Объединяем, дополняя информацией
    const resultMap = new Map<string, WordEntry>();

    for (const item of userMatches) {
      resultMap.set(item.word.toLowerCase(), { ...item });
    }

    for (const item of vsCodeItems) {
      const key = item.word.toLowerCase();
      const existing = resultMap.get(key);
      if (existing) {
        existing.kind = item.kind;
        existing.detail = item.detail;
        if (!existing.hint && item.hint) existing.hint = item.hint;
        if (item.insertText) existing.insertText = item.insertText;
      } else {
        resultMap.set(key, item);
      }
    }

    const merged = Array.from(resultMap.values());

    // 4. Сортировка:
    // - Префикс начинается с запроса
    // - Популярные у пользователя слова (с высоким count) поднимаются вверх
    // - Сниппеты при коротких префиксах
    // - Длина слова
    merged.sort((a, b) => {
      const aLower = a.word.toLowerCase();
      const bLower = b.word.toLowerCase();
      const aStarts = aLower.startsWith(cleanPrefix);
      const bStarts = bLower.startsWith(cleanPrefix);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Пользовательские слова с реальным использованием
      if (b.count > 0 && a.count === 0 && b.count >= 5) return 1;
      if (a.count > 0 && b.count === 0 && a.count >= 5) return -1;

      if (b.count !== a.count && (a.count > 1 || b.count > 1)) {
        return b.count - a.count;
      }

      if (isCode) {
        if (a.kind === "snippet" && b.kind !== "snippet") return -1;
        if (a.kind !== "snippet" && b.kind === "snippet") return 1;
      }

      return a.word.length - b.word.length;
    });

    return merged.slice(0, limit);
  };

  // --- CRUD методы для меню настроек ---

  const addCustomWord = (
    word: string,
    count = 10,
    category: "custom" | "code" = "custom",
    hint?: string,
    kind?: CompletionKind,
    detail?: string,
  ) => {
    const trimmed = word.trim();
    if (!trimmed) return;

    const existing = words.value.find(
      (w) => w.word.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existing) {
      existing.count += count;
      existing.lastUsed = Date.now();
      if (hint) existing.hint = hint;
      if (kind) existing.kind = kind;
      if (detail) existing.detail = detail;
    } else {
      words.value.push({
        word: trimmed,
        count,
        lastUsed: Date.now(),
        category,
        hint,
        kind,
        detail,
      });
    }

    saveWords();
  };

  const removeWord = (word: string) => {
    words.value = words.value.filter(
      (w) => w.word.toLowerCase() !== word.toLowerCase(),
    );
    saveWords();
  };

  const resetToDefaults = () => {
    words.value = [...DEFAULT_WORDS];
    saveWords();
  };

  const exportToJson = (): string => {
    return JSON.stringify(words.value, null, 2);
  };

  const importFromJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const validated: WordEntry[] = parsed
          .filter((item) => item && typeof item.word === "string")
          .map((item) => ({
            word: item.word,
            count: Number(item.count) || 1,
            lastUsed: Number(item.lastUsed) || Date.now(),
            category: item.category === "code" || item.category === "custom" ? item.category : "learned",
            hint: typeof item.hint === "string" ? item.hint : undefined,
            kind: typeof item.kind === "string" ? item.kind : undefined,
            detail: typeof item.detail === "string" ? item.detail : undefined,
          }));

        if (validated.length > 0) {
          words.value = validated;
          saveWords();
          return true;
        }
      }
    } catch (e) {
      console.error("[wordFrequency] Ошибка импорта JSON:", e);
    }
    return false;
  };

  return {
    words,
    popularWords,
    learnFromText,
    getSuggestions,
    addCustomWord,
    removeWord,
    resetToDefaults,
    exportToJson,
    importFromJson,
  };
});
