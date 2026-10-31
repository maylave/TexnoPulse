import { fileUrl, uploadFile } from "@/api/files";
import { formatBytes } from "@/components/editor/editor.blocks";
import type { AnyMessageContent, Message } from "@/types/message";
import type { EditorBlock } from "@/types/editor.types";
import type { ChatAttachment } from "@/config/chatInput";
import { parseMessageContentWithCode } from "@/utils/codeDetection";

export const fileToContent = async (
  file: File,
  alt?: string,
): Promise<AnyMessageContent> => {
  const up = await uploadFile(file);
  const url = fileUrl(up.id);

  if (file.type.startsWith("image/")) {
    return { type: "image", url, fileId: up.id, alt: alt ?? up.name };
  }
  if (file.type.startsWith("video/")) {
    return { type: "video", url, fileId: up.id };
  }
  if (file.type.startsWith("audio/")) {
    return { type: "audio", url, fileId: up.id };
  }
  return {
    type: "file",
    name: up.name,
    size: formatBytes(up.size),
    url,
    fileId: up.id,
  };
};

/** Преобразование блока редактора в формат сообщения */
export const editorBlockToContent = async (
  b: EditorBlock,
): Promise<AnyMessageContent | null> => {
  switch (b.type) {
    case "text":
      if (!b.text.trim()) return null;
      return {
        type: "text",
        text: b.text,
        variant: b.variant,
        align: b.align,
        highlight: b.highlight,
      };

    case "code":
      if (!b.code.trim()) return null;
      return {
        type: "code",
        language: b.language || "plaintext",
        fileName: b.fileName || `snippet.${b.language || "txt"}`,
        code: b.code,
        highlight: b.highlight,
      };

    case "checklist": {
      const items = b.items
        .filter((i) => i.text.trim().length > 0)
        .map((i) => ({ id: i.id, text: i.text, isChecked: i.done }));
      return items.length
        ? { type: "checklist", items, highlight: b.highlight }
        : null;
    }

    case "table": {
      const hasData = b.rows.some((r) => r.some((c) => c.trim().length > 0));
      return hasData
        ? {
            type: "table",
            rows: b.rows.map((r) => [...r]),
            highlight: b.highlight,
          }
        : null;
    }

    case "image":
    case "video":
    case "audio":
    case "file":
      if (!b.file) return null;
      return {
        ...(await fileToContent(b.file, b.name)),
        highlight: b.highlight,
      } as AnyMessageContent;

    case "canvas":
      return {
        type: "canvas",
        height: b.height,
        nodes: structuredClone(b.nodes),
        edges: structuredClone(b.edges),
        strokes: structuredClone(b.strokes),
        highlight: b.highlight,
      };

    case "divider":
      return { type: "divider", highlight: b.highlight };

    default:
      return null;
  }
};

/** Сборка контента сообщения из текста инпута и трея вложений */
export const buildContentFromPayload = async (payload: {
  text: string;
  attachments: ChatAttachment[];
}): Promise<AnyMessageContent[]> => {
  const text = payload.text.trim();

  const attachments = await Promise.all(
    payload.attachments.map(async (att): Promise<AnyMessageContent | null> => {
      if (att.kind === "code" && att.code) {
        return {
          type: "code",
          language: att.code.language || "plaintext",
          fileName: att.title || "snippet.ts",
          code: att.code.content,
        };
      }
      if (att.kind === "todo" && att.todoList) {
        return {
          type: "checklist",
          title: att.title,
          items: att.todoList.map((item, idx) => ({
            id: `${idx}-${Date.now()}`,
            text: item.text,
            isChecked: item.done,
          })),
        };
      }
      if (att.kind === "color" && att.color) {
        return { type: "color", value: att.color, label: att.title };
      }
      if (att.kind === "link" && att.url) {
        return {
          type: "text",
          text: `${att.title ? att.title + ": " : ""}${att.url}`,
        };
      }
      if (att.file) return fileToContent(att.file, att.title);
      if (att.kind === "file" && att.title) {
        return {
          type: "file",
          name: att.title,
          size: att.subtitle || "",
          url: att.previewUrl,
        };
      }
      if (att.kind === "voice" && att.previewUrl) {
        return {
          type: "audio",
          url: att.previewUrl,
        };
      }
      return null;
    }),
  );

  return [
    ...(text
      ? parseMessageContentWithCode(text).map((b) => {
          if (b.type === "code" && b.code) {
            return {
              type: "code",
              language: b.language || "plaintext",
              fileName: b.fileName || `snippet.${b.language || "txt"}`,
              code: b.code,
            } as AnyMessageContent;
          }
          return {
            type: "text",
            text: b.text || "",
          } as AnyMessageContent;
        })
      : []),
    ...attachments.filter((a): a is AnyMessageContent => a !== null),
  ];
};

/** Преобразование существующего сообщения в текст инпута и трей вложений для редактирования */
export const messageToChatInputPayload = (
  msg: Message,
): { text: string; attachments: ChatAttachment[] } => {
  let text = "";
  const attachments: ChatAttachment[] = [];

  for (const block of msg.content) {
    if (block.type === "text") {
      const t = (block as any).text || "";
      text = text ? `${text}\n${t}` : t;
    } else if (block.type === "code") {
      const cb = block as any;
      attachments.push({
        id: `att-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "code",
        title: cb.fileName || `Сниппет (${cb.language || "code"})`,
        subtitle: `${(cb.code || "").split("\n").length} стр. · ${(cb.language || "CODE").toUpperCase()}`,
        code: {
          language: cb.language || "javascript",
          content: cb.code || "",
        },
      });
    } else if (block.type === "color") {
      const clr = block as any;
      attachments.push({
        id: `att-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "color",
        title: clr.label || clr.value,
        subtitle: "ЦВЕТ / ПАЛИТРА",
        color: clr.value,
      });
    } else if (block.type === "checklist") {
      const chk = block as any;
      attachments.push({
        id: `att-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "todo",
        title: chk.title || "Чек-лист",
        subtitle: `${chk.items?.length || 0} задач(и)`,
        todoList: (chk.items || []).map((it: any) => ({
          text: it.text || "",
          done: !!it.isChecked,
        })),
      });
    } else if (block.type === "file") {
      const fb = block as any;
      attachments.push({
        id: `att-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "file",
        title: fb.name || "Файл",
        subtitle: fb.size || "",
        previewUrl: fb.url,
      });
    } else if (block.type === "image") {
      const ib = block as any;
      attachments.push({
        id: `att-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "file",
        title: ib.alt || "Изображение",
        subtitle: "IMAGE",
        previewUrl: ib.url,
      });
    } else if (block.type === "audio") {
      const ab = block as any;
      attachments.push({
        id: `att-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "voice",
        title: "Голосовое сообщение",
        subtitle: "АУДИО",
        previewUrl: ab.url,
      });
    }
  }

  return { text, attachments };
};
