// src/stores/colorMemory.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { WordEntry } from "./wordFrequency";

export interface ColorEntry {
  hex: string;              // Нормализованный HEX в верхнем регистре, например "#38BDF8"
  name?: string;            // Название / метка цвета, например "Primary", "Кнопка"
  chatId?: string;          // Привязка к конкретному чату (где цвет использовался)
  count: number;            // Частота использования
  lastUsed: number;         // Время последнего использования
  source?: "chat" | "panel" | "text" | "preset";
}

const STORAGE_KEY = "snapi_color_memory_v1";

// Базовые стартовые пресеты цветов
const PRESET_COLORS: ColorEntry[] = [
  { hex: "#38BDF8", name: "Sky Blue", count: 12, lastUsed: Date.now() - 1000, source: "preset" },
  { hex: "#06B6D4", name: "Cyan", count: 8, lastUsed: Date.now() - 2000, source: "preset" },
  { hex: "#10B981", name: "Emerald", count: 10, lastUsed: Date.now() - 3000, source: "preset" },
  { hex: "#8B5CF6", name: "Violet", count: 11, lastUsed: Date.now() - 4000, source: "preset" },
  { hex: "#F97316", name: "Orange", count: 7, lastUsed: Date.now() - 5000, source: "preset" },
  { hex: "#F43F5E", name: "Rose", count: 9, lastUsed: Date.now() - 6000, source: "preset" },
  { hex: "#EAB308", name: "Yellow", count: 6, lastUsed: Date.now() - 7000, source: "preset" },
  { hex: "#6366F1", name: "Indigo", count: 8, lastUsed: Date.now() - 8000, source: "preset" },
  { hex: "#64748B", name: "Slate", count: 5, lastUsed: Date.now() - 9000, source: "preset" },
  { hex: "#FFFFFF", name: "White", count: 15, lastUsed: Date.now() - 10000, source: "preset" },
  { hex: "#0F172A", name: "Slate Dark", count: 6, lastUsed: Date.now() - 11000, source: "preset" },
];

/**
 * Нормализация строки цвета в валидный HEX вида #RRGGBB
 */
export function normalizeHex(raw: string): string | null {
  if (!raw) return null;
  let clean = raw.trim();
  if (clean.startsWith("#")) clean = clean.slice(1);
  // Короткая запись #FFF -> #FFFFFF
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return `#${clean.toUpperCase()}`;
}

export const useColorMemoryStore = defineStore("colorMemory", () => {
  const colors = ref<ColorEntry[]>([]);

  // Загрузка из LocalStorage
  const loadColors = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, ColorEntry>();
          for (const item of parsed) {
            const key = `${item.hex.toUpperCase()}_${item.chatId || "global"}`;
            map.set(key, item);
          }
          // Дополняем пресетами, если их не было
          for (const def of PRESET_COLORS) {
            const key = `${def.hex.toUpperCase()}_global`;
            if (!map.has(key)) {
              map.set(key, { ...def });
            }
          }
          colors.value = Array.from(map.values());
          return;
        }
      }
    } catch (e) {
      console.error("[colorMemory] Ошибка загрузки памяти цветов:", e);
    }
    colors.value = [...PRESET_COLORS];
    saveColors();
  };

  const saveColors = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors.value));
    } catch (e) {
      console.error("[colorMemory] Ошибка сохранения памяти цветов:", e);
    }
  };

  loadColors();

  /**
   * Запомнить цвет (для текущего чата и/или глобально)
   */
  const rememberColor = (
    rawHex: string,
    name?: string,
    chatId?: string,
    source: "chat" | "panel" | "text" | "preset" = "panel",
  ) => {
    const hex = normalizeHex(rawHex);
    if (!hex) return;

    const trimmedName = name?.trim() || undefined;
    const now = Date.now();

    // 1. Сохранение/обновление с привязкой к chatId (если указан)
    if (chatId) {
      const chatMatch = colors.value.find(
        (c) => c.hex === hex && c.chatId === chatId,
      );
      if (chatMatch) {
        chatMatch.count += 1;
        chatMatch.lastUsed = now;
        if (trimmedName) chatMatch.name = trimmedName;
      } else {
        colors.value.push({
          hex,
          name: trimmedName,
          chatId,
          count: 1,
          lastUsed: now,
          source,
        });
      }
    }

    // 2. Также обновляем/создаем глобальную запись этого цвета
    const globalMatch = colors.value.find(
      (c) => c.hex === hex && !c.chatId,
    );
    if (globalMatch) {
      globalMatch.count += 1;
      globalMatch.lastUsed = now;
      if (trimmedName && !globalMatch.name) globalMatch.name = trimmedName;
    } else if (!chatId) {
      colors.value.push({
        hex,
        name: trimmedName,
        count: 1,
        lastUsed: now,
        source,
      });
    }

    saveColors();
  };

  /**
   * Получить цвета, использованные именно в этом чате
   */
  const getChatColors = (chatId: string): ColorEntry[] => {
    if (!chatId) return [];
    return colors.value
      .filter((c) => c.chatId === chatId)
      .sort((a, b) => b.lastUsed - a.lastUsed);
  };

  /**
   * Получить глобальные цвета (популярные и недавние)
   */
  const getGlobalColors = (): ColorEntry[] => {
    const map = new Map<string, ColorEntry>();
    for (const c of colors.value) {
      const existing = map.get(c.hex);
      if (!existing || c.lastUsed > existing.lastUsed) {
        map.set(c.hex, c);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
  };

  /**
   * Поиск цвета по названию (для синтаксиса color:акцент или $color:primary)
   */
  const findColorByName = (query: string, chatId?: string): ColorEntry | undefined => {
    const clean = query.trim().toLowerCase();
    if (!clean) return undefined;

    // Сначала ищем среди цветов текущего чата
    if (chatId) {
      const inChat = colors.value.find(
        (c) => c.chatId === chatId && c.name?.toLowerCase() === clean,
      );
      if (inChat) return inChat;
    }

    // Затем глобально
    return colors.value.find((c) => c.name?.toLowerCase() === clean);
  };

  /**
   * Подсказки цветов при наборе в инпуте (#..., color:..., $color:...)
   */
  const getColorSuggestions = (
    prefix: string,
    chatId?: string,
    limit = 6,
  ): WordEntry[] => {
    const clean = prefix.trim().toLowerCase();
    if (!clean) return [];

    // Определяем поисковый запрос: убираем префиксы #, color:, $color:, $
    let search = clean;
    if (search.startsWith("color:")) search = search.slice(6).trim();
    else if (search.startsWith("$color:")) search = search.slice(7).trim();
    else if (search.startsWith("$color")) search = search.slice(6).trim();
    else if (search.startsWith("$")) search = search.slice(1).trim();
    else if (search.startsWith("#")) search = search.slice(1).trim();

    const results: WordEntry[] = [];
    const seenHexes = new Set<string>();

    const allColors = [
      ...(chatId ? getChatColors(chatId) : []),
      ...getGlobalColors(),
    ];

    for (const c of allColors) {
      if (seenHexes.has(c.hex)) continue;

      const hexWithoutHash = c.hex.replace("#", "").toLowerCase();
      const nameLower = (c.name || "").toLowerCase();

      // Совпадение по пустому поиску после префикса `#` или совпадение по HEX/названию
      const matches =
        !search ||
        hexWithoutHash.startsWith(search) ||
        nameLower.includes(search) ||
        c.hex.toLowerCase().startsWith(clean);

      if (matches) {
        seenHexes.add(c.hex);
        const inThisChat = c.chatId === chatId;
        const detailParts: string[] = [];
        if (c.name) detailParts.push(c.name);
        detailParts.push(inThisChat ? "в этом чате" : "сохраненный цвет");

        results.push({
          word: c.hex,
          count: c.count,
          lastUsed: c.lastUsed,
          category: "custom",
          kind: "color",
          detail: detailParts.join(" · "),
          hint: c.name || (inThisChat ? "Использован в этом чате" : "HEX цвет"),
          insertText: c.hex,
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  };

  /**
   * Удалить цвет из истории чата или глобально
   */
  const removeColor = (hex: string, chatId?: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;

    if (chatId) {
      colors.value = colors.value.filter(
        (c) => !(c.hex === normalized && c.chatId === chatId),
      );
    } else {
      colors.value = colors.value.filter((c) => c.hex !== normalized);
    }
    saveColors();
  };

  /**
   * Сканирование текста на наличие HEX-кодов и автоматическое их запоминание
   */
  const scanTextForColors = (text: string, chatId?: string) => {
    if (!text) return;
    const matches = text.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
    if (!matches) return;

    for (const raw of matches) {
      const hex = normalizeHex(raw);
      if (hex) {
        rememberColor(hex, undefined, chatId, "text");
      }
    }
  };

  return {
    colors,
    rememberColor,
    getChatColors,
    getGlobalColors,
    findColorByName,
    getColorSuggestions,
    removeColor,
    scanTextForColors,
  };
});
