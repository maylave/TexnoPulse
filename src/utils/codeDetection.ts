// src/utils/codeDetection.ts

/**
 * Словарь нормализации языков (включая популярные алиасы и случайные опечатки с русской раскладки)
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  // English aliases
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  python: "python",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  json: "json",
  jsonc: "jsonc",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  shell: "bash",
  rs: "rust",
  rust: "rust",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  cs: "csharp",
  "c#": "csharp",
  csharp: "csharp",
  go: "go",
  golang: "go",
  rb: "ruby",
  ruby: "ruby",
  php: "php",
  md: "markdown",
  markdown: "markdown",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  java: "java",
  kt: "kotlin",
  kotlin: "kotlin",
  swift: "swift",
  vue: "vue",

  // Русская раскладка для популярных алиасов
  ис: "javascript", // js -> ис
  еы: "typescript", // ts -> еы
  зн: "python",     // py -> зн
  зе: "python",     // py -> зе
  реьд: "html",     // html -> реьд
  сыы: "css",       // css -> сыы
  йыл: "json",      // json -> йыл
  ыйд: "sql",       // sql -> ыйд
  ифыр: "bash",     // bash -> ифыр
  ки: "rust",       // rs -> ки
  с: "c",
  "с++": "cpp",
  "с#": "csharp",
  пщ: "go",         // go -> пщ
  зрз: "php",       // php -> зрз
  мгу: "vue",       // vue -> мгу
  ьв: "markdown",   // md -> ьв
};

/**
 * Расширения по умолчанию для языков
 */
export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  sql: "sql",
  bash: "sh",
  rust: "rs",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  go: "go",
  ruby: "rb",
  php: "php",
  markdown: "md",
  yaml: "yml",
  xml: "xml",
  vue: "vue",
  plaintext: "txt",
};

/**
 * Нормализует имя языка или возвращает пустую строку, если язык не распознан
 */
export function normalizeLanguage(langName: string): string {
  const clean = langName.trim().toLowerCase();
  if (!clean) return "";
  if (LANGUAGE_ALIASES[clean]) {
    return LANGUAGE_ALIASES[clean];
  }
  // Если прямо совпадает с известным расширением/языком
  if (LANGUAGE_EXTENSIONS[clean]) {
    return clean;
  }
  return "";
}

/**
 * Автоматически определяет язык программирования по коду
 */
export function detectCodeLanguage(code: string): string {
  const clean = code.trim();
  if (!clean) return "plaintext";

  // 1. JSON (быстрая проверка)
  if (
    (clean.startsWith("{") && clean.endsWith("}")) ||
    (clean.startsWith("[") && clean.endsWith("]"))
  ) {
    try {
      JSON.parse(clean);
      return "json";
    } catch {
      // не валидный json, проверяем дальше
    }
  }

  // 2. HTML / XML
  if (
    /<!DOCTYPE\s+html/i.test(clean) ||
    /<html[\s>]/i.test(clean) ||
    /<\/(div|span|p|a|ul|li|table|h[1-6]|button|form|input)>/i.test(clean) ||
    /<(div|span|p|a|ul|li|button|form)\s+(class|id|style)=/i.test(clean)
  ) {
    return "html";
  }

  // 3. SQL
  if (
    /\b(SELECT\s+.+\s+FROM|INSERT\s+INTO\s+|UPDATE\s+.+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i.test(
      clean,
    )
  ) {
    return "sql";
  }

  // 4. CSS / SCSS
  if (
    /^[.#a-zA-Z0-9_\-\s,>+~:]+\s*\{[\s\S]*?(?:margin|padding|color|background|display|font-|border|flex|grid)[\s\S]*?\}/m.test(
      clean,
    )
  ) {
    return "css";
  }

  // 5. Bash / Shell
  if (
    clean.startsWith("#!/bin/") ||
    clean.startsWith("#!/usr/bin/env") ||
    /^(sudo\s+|npm\s+i|npm\s+run|git\s+|docker\s+|curl\s+|chmod\s+|grep\s+|echo\s+["'])/m.test(
      clean,
    )
  ) {
    return "bash";
  }

  // 6. Python
  let pyScore = 0;
  if (/^def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*?\)\s*:/m.test(clean)) pyScore += 4;
  if (/^class\s+[a-zA-Z_][a-zA-Z0-9_]*(?:\(.*?\))?\s*:/m.test(clean)) pyScore += 3;
  if (/^import\s+[a-zA-Z_][a-zA-Z0-9_]*/m.test(clean)) pyScore += 2;
  if (/^from\s+[a-zA-Z0-9_.]+\s+import\s+/m.test(clean)) pyScore += 3;
  if (/\bprint\s*\(/m.test(clean)) pyScore += 2;
  if (/\belif\b|\bNone\b|\bTrue\b|\bFalse\b|\bself\./m.test(clean)) pyScore += 2;
  if (/__init__|__name__\s*==\s*['"]__main__['"]/m.test(clean)) pyScore += 4;

  // 7. Rust
  let rustScore = 0;
  if (/\bfn\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*?\)/m.test(clean)) rustScore += 3;
  if (/\blet\s+mut\s+/m.test(clean)) rustScore += 4;
  if (/\bimpl\s+[a-zA-Z_]/m.test(clean)) rustScore += 4;
  if (/\bprintln!\s*\(/m.test(clean)) rustScore += 4;
  if (/\bpub\s+(?:fn|struct|enum)\b/m.test(clean)) rustScore += 3;
  if (/->\s*(?:Result|Option)<.*?>/m.test(clean)) rustScore += 3;

  // 8. Go
  let goScore = 0;
  if (/^package\s+[a-zA-Z_]+/m.test(clean)) goScore += 5;
  if (/^func\s+(?:\(.*?\)\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*\(/m.test(clean)) goScore += 4;
  if (/\bfmt\.(?:Println|Printf|Sprintf)\b/m.test(clean)) goScore += 4;
  if (/:\s*=\s*/m.test(clean)) goScore += 2;

  // 9. C / C++
  let cppScore = 0;
  if (/#include\s*<[a-zA-Z0-9_.]+>/m.test(clean)) cppScore += 5;
  if (/\bstd::(?:cout|cin|vector|string|endl)\b/m.test(clean)) cppScore += 4;
  if (/\bint\s+main\s*\(\s*(?:int\s+argc)?/m.test(clean)) cppScore += 3;

  // 10. JS / TS
  let jsScore = 0;
  let tsScore = 0;
  if (/\bconst\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(clean)) jsScore += 3;
  if (/\blet\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(clean)) jsScore += 3;
  if (/\bvar\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(clean)) jsScore += 2;
  if (/=>\s*\{|=>\s*[a-zA-Z0-9_("'[]/m.test(clean)) jsScore += 3;
  if (/\bconsole\.(?:log|error|warn|info)\s*\(/m.test(clean)) jsScore += 3;
  if (/^import\s+.*?\s+from\s+['"].*?['"]/m.test(clean)) jsScore += 3;
  if (/^export\s+(?:default|const|function|class)\s+/m.test(clean)) jsScore += 3;
  if (/\bfunction\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/m.test(clean)) jsScore += 3;
  if (/===|!==/m.test(clean)) jsScore += 2;
  if (/\basync\s+function|\bawait\s+/m.test(clean)) jsScore += 2;

  // TS специфичные маркеры
  if (/^interface\s+[A-Z][a-zA-Z0-9_]*/m.test(clean)) tsScore += 4;
  if (/^type\s+[A-Z][a-zA-Z0-9_]*\s*=/m.test(clean)) tsScore += 4;
  if (/:\s*(?:string|number|boolean|any|void|unknown|never)\b/m.test(clean)) tsScore += 3;
  if (/<[A-Z][a-zA-Z0-9_]*>/m.test(clean) && jsScore > 0) tsScore += 2;

  // Выбираем лучший счет
  const scores: Record<string, number> = {
    python: pyScore,
    rust: rustScore,
    go: goScore,
    cpp: cppScore,
    typescript: jsScore + tsScore,
    javascript: jsScore,
  };

  let bestLang = "plaintext";
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  // Если набрали хотя бы 2-3 балла уверенности
  if (maxScore >= 2) {
    if (bestLang === "typescript" && tsScore < 2) {
      return "javascript";
    }
    return bestLang;
  }

  // Если есть скобки {}, фигурные скобки и точки с запятой, скорее всего JS
  if (clean.includes("{") && clean.includes("}") && (clean.includes(";") || clean.includes("="))) {
    return "javascript";
  }

  return "plaintext";
}

export interface ParsedBlockResult {
  type: "text" | "code";
  text?: string;
  code?: string;
  language?: string;
  fileName?: string;
}

/**
 * Проверяет и парсит входное сообщение на блоки кода и текста.
 * Поддерживает:
 * - Формат: ```lang ... ```
 * - Формат: code = js ```...```
 * - Формат: code = js \n ...
 * - Формат: code=js \n ...
 * - Формат: код = js ...
 * И автоматически определяет язык, если он не указан, опечатка (например "шт") или некорректен.
 */
export function parseMessageContentWithCode(rawText: string): ParsedBlockResult[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  const results: ParsedBlockResult[] = [];

  // Регулярка для префиксов вида:
  // "code = js ```...```" или "код = ts \n ..." или "code: py"
  const prefixRegex =
    /^(?:code|код)\s*[:=]\s*([a-zA-Zа-яА-Я0-9_+#\-]*)\s*(?:```([a-zA-Zа-яА-Я0-9_+#\-]*)?\s*([\s\S]*?)```|([\s\S]+))$/i;

  const prefixMatch = trimmed.match(prefixRegex);
  if (prefixMatch) {
    const rawLangHint = prefixMatch[1] || prefixMatch[2] || "";
    const codeBody = (prefixMatch[3] ?? prefixMatch[4] ?? "").trim();

    let lang = normalizeLanguage(rawLangHint);
    if (!lang || lang === "plaintext") {
      // "и сам он смог определять" - запускаем автоопределение!
      lang = detectCodeLanguage(codeBody);
      if (lang === "plaintext") lang = "javascript"; // разумный дефолт
    }

    const ext = LANGUAGE_EXTENSIONS[lang] || "txt";
    results.push({
      type: "code",
      language: lang,
      fileName: `snippet.${ext}`,
      code: codeBody,
    });
    return results;
  }

  // Регулярка для стандартных блоков Markdown ```lang ... ```
  const codeBlockRegex = /```([a-zA-Zа-яА-Я0-9_+#\-]*)\s*([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    // Текст до блока кода
    if (match.index > lastIndex) {
      const textChunk = rawText.substring(lastIndex, match.index).trim();
      if (textChunk) {
        results.push({ type: "text", text: textChunk });
      }
    }

    const rawLang = (match[1] || "").trim();
    const codeContent = (match[2] || "").trim();

    let lang = normalizeLanguage(rawLang);
    // Если язык не указан или неизвестен (например "шт" или опечатка):
    if (!lang || lang === "plaintext") {
      lang = detectCodeLanguage(codeContent);
      if (lang === "plaintext") lang = "javascript";
    }

    const ext = LANGUAGE_EXTENSIONS[lang] || "txt";

    results.push({
      type: "code",
      language: lang,
      fileName: `snippet.${ext}`,
      code: codeContent,
    });

    lastIndex = match.index + match[0].length;
  }

  // Остаток текста после последнего блока кода
  if (lastIndex < rawText.length) {
    const remainingText = rawText.substring(lastIndex).trim();
    if (remainingText) {
      results.push({ type: "text", text: remainingText });
    }
  }

  // Если блоков кода не нашлось, возвращаем как обычный текст
  if (results.length === 0) {
    results.push({ type: "text", text: rawText });
  }

  return results;
}

/**
 * Проверяет, пишет ли пользователь в текущий момент код в поле ввода
 */
export function checkInlineCodeTyping(text: string): {
  isCode: boolean;
  language: string;
  code: string;
  hasBackticks: boolean;
  prefixFound: boolean;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isCode: false, language: "", code: "", hasBackticks: false, prefixFound: false };
  }

  // 1. Проверяем префикс `code = js` или `code: js` или `код = `
  const prefixMatch = trimmed.match(/^(?:code|код)\s*[:=]\s*([a-zA-Zа-яА-Я0-9_+#\-]*)\s*([\s\S]*)$/i);
  if (prefixMatch) {
    const rawLang = prefixMatch[1] || "";
    let codeBody = prefixMatch[2] || "";

    // Убираем обратные кавычки если есть
    if (codeBody.startsWith("```")) {
      codeBody = codeBody.replace(/^```[a-zA-Zа-яА-Я0-9_+#\-]*\s*/, "").replace(/```$/, "");
    }

    let lang = normalizeLanguage(rawLang);
    if (!lang) {
      lang = detectCodeLanguage(codeBody);
      if (lang === "plaintext") lang = "javascript";
    }

    return {
      isCode: true,
      language: lang,
      code: codeBody.trim(),
      hasBackticks: text.includes("```"),
      prefixFound: true,
    };
  }

  // 2. Проверяем наличие тройных обратных кавычек ```
  if (trimmed.includes("```")) {
    const match = trimmed.match(/```([a-zA-Zа-яА-Я0-9_+#\-]*)\s*([\s\S]*)$/);
    if (match) {
      const rawLang = match[1] || "";
      let codeBody = match[2] || "";
      if (codeBody.endsWith("```")) {
        codeBody = codeBody.slice(0, -3);
      }

      let lang = normalizeLanguage(rawLang);
      if (!lang) {
        lang = detectCodeLanguage(codeBody);
        if (lang === "plaintext") lang = "javascript";
      }

      return {
        isCode: true,
        language: lang,
        code: codeBody.trim(),
        hasBackticks: true,
        prefixFound: false,
      };
    }
  }

  // 3. Если введено более 2 строк и есть высокая уверенность по автоопределению
  if (trimmed.includes("\n") && trimmed.length > 25) {
    const detected = detectCodeLanguage(trimmed);
    if (detected !== "plaintext") {
      return {
        isCode: true,
        language: detected,
        code: trimmed,
        hasBackticks: false,
        prefixFound: false,
      };
    }
  }

  return { isCode: false, language: "", code: "", hasBackticks: false, prefixFound: false };
}
