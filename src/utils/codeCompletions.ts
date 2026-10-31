// src/utils/codeCompletions.ts
import { JS_TS_COMPLETIONS } from "./dictionaries/jsTsDictionary";
import { PYTHON_COMPLETIONS } from "./dictionaries/pythonDictionary";
import { WEB_COMPLETIONS } from "./dictionaries/webDictionary";
import { SQL_COMPLETIONS } from "./dictionaries/sqlDictionary";
import { GENERAL_CODE_COMPLETIONS } from "./dictionaries/generalCodeDictionary";

export type CompletionKind =
  | "keyword"
  | "function"
  | "property"
  | "snippet"
  | "variable"
  | "class"
  | "interface"
  | "color";

export interface CodeCompletionDefinition {
  word: string;
  kind: CompletionKind;
  hint?: string;
  detail?: string;
  insertText?: string;
  languages?: string[]; // Если не указано — доступно во всех языках
}

/**
 * Полный объединенный реестр подсказок кода в стиле VS Code IntelliSense
 */
export const VSCODE_CODE_COMPLETIONS: CodeCompletionDefinition[] = [
  ...JS_TS_COMPLETIONS,
  ...PYTHON_COMPLETIONS,
  ...WEB_COMPLETIONS,
  ...SQL_COMPLETIONS,
  ...GENERAL_CODE_COMPLETIONS,
];

/**
 * Извлечение всех идентификаторов (переменных, функций, свойств) из текущего документа/кода
 * Аналог функции "Word-based Suggestions" в VS Code
 */
export function extractIdentifiersFromContext(
  text: string,
  currentPrefix?: string,
): CodeCompletionDefinition[] {
  if (!text || text.length < 5) return [];

  const tokens = text.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
  if (!tokens) return [];

  const unique = new Set<string>();
  const results: CodeCompletionDefinition[] = [];
  const cleanPrefix = (currentPrefix || "").toLowerCase();

  for (const token of tokens) {
    if (token.length <= 2) continue;
    if (cleanPrefix && token.toLowerCase() === cleanPrefix) continue;
    if (unique.has(token)) continue;
    unique.add(token);

    results.push({
      word: token,
      kind: "variable",
      detail: "переменная",
      hint: "из контекста кода",
    });
  }

  return results;
}

/**
 * Поиск подсказок кода для заданного префикса и языка
 */
export function getVSCodeCompletions(
  prefix: string,
  language?: string,
  contextCode?: string,
  limit = 8,
): CodeCompletionDefinition[] {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];

  const lang = (language || "").toLowerCase();

  // 1. Идентификаторы из текущего кода (как в VS Code)
  const contextIdentifiers = contextCode ? extractIdentifiersFromContext(contextCode, p) : [];

  const allItems = [...contextIdentifiers, ...VSCODE_CODE_COMPLETIONS];
  const seen = new Set<string>();

  return allItems.filter((item) => {
    const key = item.word.toLowerCase();
    if (seen.has(key)) return false;
    if (key === p) return false;

    // Проверка совместимости языков
    if (item.languages && item.languages.length > 0 && lang) {
      const matchLang = item.languages.some(
        (l) =>
          l === lang ||
          (lang.startsWith("js") && (l === "javascript" || l === "js")) ||
          (lang.startsWith("ts") && (l === "typescript" || l === "ts")),
      );
      if (!matchLang) return false;
    }

    const matches = key.startsWith(p) || (p.length >= 2 && key.includes(p));
    if (matches) {
      seen.add(key);
      return true;
    }
    return false;
  })
    .sort((a, b) => {
      const aLower = a.word.toLowerCase();
      const bLower = b.word.toLowerCase();
      const aStarts = aLower.startsWith(p);
      const bStarts = bLower.startsWith(p);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Приоритет сниппетам и методам при коротких префиксах
      if (a.kind === "snippet" && b.kind !== "snippet") return -1;
      if (a.kind !== "snippet" && b.kind === "snippet") return 1;

      return a.word.length - b.word.length;
    })
    .slice(0, limit);
}
