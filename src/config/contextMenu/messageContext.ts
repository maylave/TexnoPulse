// src/config/contextMenu/messageContext.ts
import type { MenuActionItem, MenuVariant } from "@/types/menu";
import type { Message } from "@/types/message";
import { MessageSquare, Copy, Edit3, Trash2 } from "lucide-vue-next";

export interface MessageMenuHandlers {
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onCopyText?: (message: Message) => void;
}

export function getMessageMenuItems(
  message: Message,
  handlers: MessageMenuHandlers,
  variant?: MenuVariant,
): MenuActionItem[] {
  const isAllowedToManage = message.isOwn !== false || !message.sender;

  const baseItems: MenuActionItem[] = [
    {
      id: "reply",
      label: "Ответить",
      icon: MessageSquare,
      action: () => handlers.onReply(message),
    },
    {
      id: "copy",
      label: "Копировать текст",
      icon: Copy,
      action: () => {
        if (handlers.onCopyText) {
          handlers.onCopyText(message);
        } else {
          const text = message.content
            .map((b) => (b as any).text || (b as any).code || "")
            .filter(Boolean)
            .join("\n");
          navigator.clipboard.writeText(text);
        }
      },
    },
    {
      id: "edit",
      label: "Изменить",
      icon: Edit3,
      disabled: !isAllowedToManage,
      action: () => handlers.onEdit(message),
    },
    {
      id: "delete",
      label: "Удалить",
      icon: Trash2,
      disabled: !isAllowedToManage,
      action: () => handlers.onDelete(message),
    },
  ];

  const managementItems: MenuActionItem[] = [];

  if (variant === "compact") {
    return baseItems;
  }

  return [...baseItems, ...managementItems];
}
