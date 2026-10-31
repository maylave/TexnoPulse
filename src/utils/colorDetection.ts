// src/utils/colorDetection.ts
import { normalizeHex, useColorMemoryStore } from "@/stores/colorMemory";

export interface InlineColorState {
  isColor: boolean;
  hex: string;
  title: string;
  rawText: string;
}

/**
 * Проверяет, пишет ли пользователь в текущий момент синтаксис цвета:
 * - `color: #38bdf8` / `цвет: #38bdf8`
 * - `color:#38bdf8[Метка]` / `color:#38bdf8 (Метка)`
 * - `#38bdf8` (одиночный HEX-код)
 * - `color:акцент` или `$color:акцент` (поиск по сохраненному названию)
 */
export function checkInlineColorTyping(
  text: string,
  chatId?: string,
): InlineColorState {
  const empty: InlineColorState = {
    isColor: false,
    hex: "",
    title: "",
    rawText: text,
  };

  const trimmed = text.trim();
  if (!trimmed) return empty;

  // 1. Префикс `color: #38bdf8 [Название]` или `цвет: #38bdf8 (Название)` или `color = #38bdf8`
  const macroMatch = trimmed.match(
    /^(?:color|цвет|\$color)\s*[:=]\s*(#[0-9a-fA-F]{3,6}|[a-zA-Zа-яА-Я0-9_-]+)(?:\s*[\[(]([^\])]*)[\])])?(?:\s+(.*))?$/i,
  );

  if (macroMatch) {
    const rawValue = macroMatch[1] || "";
    const bracketTitle = macroMatch[2]?.trim() || "";
    const trailingTitle = macroMatch[3]?.trim() || "";
    const title = bracketTitle || trailingTitle;

    // Вариант А: Передан явный HEX-код
    const hex = normalizeHex(rawValue);
    if (hex) {
      return {
        isColor: true,
        hex,
        title: title || hex,
        rawText: text,
      };
    }

    // Вариант Б: Передано название цвета из памяти (например `color:акцент`)
    try {
      const colorStore = useColorMemoryStore();
      const found = colorStore.findColorByName(rawValue, chatId);
      if (found) {
        return {
          isColor: true,
          hex: found.hex,
          title: title || found.name || found.hex,
          rawText: text,
        };
      }
    } catch {}
  }

  // 2. Одиночный HEX код с возможным названием: `#38bdf8` или `#38bdf8 Название кнопки`
  const standaloneMatch = trimmed.match(
    /^(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(?:\s+(.*))?$/,
  );

  if (standaloneMatch) {
    const hex = normalizeHex(standaloneMatch[1] || "");
    const label = standaloneMatch[2]?.trim() || "";
    if (hex) {
      return {
        isColor: true,
        hex,
        title: label || hex,
        rawText: text,
      };
    }
  }

  return empty;
}
