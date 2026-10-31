import { fileUrl } from "@/api/files";
import type { MessageContent } from "@/api/protocol";
import type { AnyMessageContent } from "@/types/message";

/**
 * Надежный парсер содержимого из SQLite:
 * рекурсивно разворачивает JSON-строки и извлекает корректный массив блоков.
 */
export const parseContent = (raw: unknown): MessageContent => {
  let value: any = raw;

  while (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      value = parsed;
    } catch {
      break;
    }
  }

  if (Array.isArray(value)) {
    return { blocks: value };
  }

  if (value && typeof value === "object" && Array.isArray(value.blocks)) {
    return {
      blocks: value.blocks,
      createdAt: value.createdAt,
    };
  }

  if (value && typeof value === "object" && "type" in value) {
    return { blocks: [value] };
  }

  return { blocks: [] };
};

/** Построение актуальных URL для медиафайлов */
export const withUrls = (blocks: AnyMessageContent[]): AnyMessageContent[] =>
  blocks.map((b) =>
    "fileId" in b && (b as any).fileId
      ? ({ ...b, url: fileUrl((b as any).fileId) } as AnyMessageContent)
      : b,
  );
