// src/composables/useSpellcheck.ts
import { ref } from "vue";
import type { EditorBlock } from "@/types/editor.types";

export interface SpellIssue {
  id: string;
  blockId: string;
  word: string;
  suggestions: string[];
}

// Локальный словарь частых опечаток (работает 100% оффлайн)
const OFFLINE_TYPOS: Record<string, string> = {
  попрубуем: "попробуем",
  пожалусто: "пожалуйста",
  пожалуста: "пожалуйста",
  приветсвую: "приветствую",
  здравсвуйте: "здравствуйте",
  здраствуйте: "здравствуйте",
  услвоно: "условно",
  вобщем: "в общем",
  вообщем: "в общем",
  кстате: "кстати",
  сдесь: "здесь",
  здеся: "здесь",
  севодня: "сегодня",
  сейчяс: "сейчас",
  щас: "сейчас",
  черезчур: "чересчур",
  придти: "прийти",
  будующее: "будущее",
  следущий: "следующий",
  каторый: "который",
  каторая: "которая",
  небудет: "не будет",
  немогу: "не могу",
  незнаю: "не знаю",
  изза: "из-за",
  потомучто: "потому что",
  также: "также",
  чтобы: "чтобы",
  коментарий: "комментарий",
  програма: "программа",
  приложене: "приложение",
  реализовать: "реализовать",
  екран: "экран",
  таблиצа: "таблица",
};

export function useSpellcheck() {
  const isChecking = ref(false);
  const issues = ref<SpellIssue[]>([]);
  const lastReport = ref<string | null>(null);

  // Оффлайн-автоформатирование пунктуации и типографики
  const formatTypography = (text: string): string => {
    if (!text.trim()) return text;

    let result = text
      // Убираем лишние пробелы перед знаками препинания
      .replace(/\s+([,.!?:;])/g, "$1")
      // Добавляем пробел после знаков препинания, если его забыли (кроме точек в числах и файлах)
      .replace(/([,!?:;])([^\s\d,.!?:;])/g, "$1 $2")
      // Схлопываем двойные/тройные пробелы
      .replace(/[ \t]{2,}/g, " ")
      // Заменяем дефис между пробелами на красивое среднее тире
      .replace(/\s-\s/g, " — ");

    // Заменяем слова из оффлайн-словаря опечаток
    result = result.replace(/[а-яёa-z-]+/gi, (match) => {
      const lower = match.toLowerCase();
      const replacement = OFFLINE_TYPOS[lower];
      if (!replacement) return match;
      // Сохраняем заглавную букву, если слово было с большой
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });

    // Делаем первую букву абзаца и букву после точки заглавной
    result = result.replace(/(^\s*[а-яёa-z]|[.!?]\s+[а-яёa-z])/g, (part) =>
      part.toUpperCase(),
    );

    return result;
  };

  // Запрос к бесплатному API Яндекс.Спеллера (с оффлайн-фолбэком)
  const fetchYandexSpeller = async (
    text: string,
  ): Promise<{ word: string; s: string[] }[]> => {
    try {
      const params = new URLSearchParams();
      params.append("text", text);
      params.append("lang", "ru,en");

      const res = await fetch(
        "https://speller.yandex.net/services/spellservice.json/checkText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      if (!res.ok) return [];
      return await res.json();
    } catch {
      // Если нет интернета — используем локальный словарь
      const found: { word: string; s: string[] }[] = [];
      const words = text.match(/[а-яёa-z-]+/gi) ?? [];
      for (const w of words) {
        const fix = OFFLINE_TYPOS[w.toLowerCase()];
        if (fix) found.push({ word: w, s: [fix] });
      }
      return found;
    }
  };

  // Поиск ошибок во всех текстовых блоках и чек-листах
  const checkBlocks = async (blocks: EditorBlock[]) => {
    isChecking.value = true;
    issues.value = [];
    lastReport.value = null;

    try {
      for (const block of blocks) {
        if (block.type === "text" && block.text.trim()) {
          const errors = await fetchYandexSpeller(block.text);
          for (const err of errors) {
            if (err.s?.length) {
              issues.value.push({
                id: `${block.id}-${err.word}-${Math.random()}`,
                blockId: block.id,
                word: err.word,
                suggestions: err.s,
              });
            }
          }
        }
      }

      if (issues.value.length === 0) {
        lastReport.value = "Ошибок не найдено";
        setTimeout(() => {
          lastReport.value = null;
        }, 2500);
      }
    } finally {
      isChecking.value = false;
    }
  };

  // Применить конкретное исправление к блоку
  const applySuggestion = (
    blocks: EditorBlock[],
    issue: SpellIssue,
    replacement: string,
  ) => {
    const block = blocks.find((b) => b.id === issue.blockId);
    if (block && block.type === "text") {
      block.text = block.text.replace(issue.word, replacement);
    }
    issues.value = issues.value.filter((i) => i.id !== issue.id);
  };

  // Автоматически исправить ВСЕ опечатки и отформатировать пунктуацию
  const autoFixAllBlocks = async (blocks: EditorBlock[]) => {
    isChecking.value = true;
    let fixedCount = 0;

    try {
      for (const block of blocks) {
        if (block.type === "text" && block.text.trim()) {
          const before = block.text;
          let updated = formatTypography(block.text);

          const errors = await fetchYandexSpeller(updated);
          for (const err of errors) {
            if (err.s && err.s[0]) {
              updated = updated.replace(err.word, err.s[0]);
              fixedCount++;
            }
          }

          if (updated !== before && fixedCount === 0) fixedCount++;
          block.text = updated;
        } else if (block.type === "checklist") {
          for (const item of block.items) {
            if (item.text.trim()) {
              item.text = formatTypography(item.text);
            }
          }
        }
      }

      issues.value = [];
      lastReport.value =
        fixedCount > 0
          ? `Исправлено блоков/ошибок: ${fixedCount}`
          : "Текст уже идеален";

      setTimeout(() => {
        lastReport.value = null;
      }, 3000);
    } finally {
      isChecking.value = false;
    }
  };

  return {
    isChecking,
    issues,
    lastReport,
    checkBlocks,
    applySuggestion,
    autoFixAllBlocks,
  };
}
