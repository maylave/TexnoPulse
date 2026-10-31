import type { AppNode } from "@/types/chat";
import type { ChatNode } from "@/api/protocol";

export function mapChatNodeToAppNode(serverNode: ChatNode): AppNode {
  const s = serverNode as any;
  const isFolder = s.type === "folder";

  return {
    id: String(s.id),
    label: s.name ?? s.label ?? (isFolder ? "Новая папка" : "Новый чат"),
    type: isFolder ? "folder" : "chat",
    parentId: s.parentId ? String(s.parentId) : undefined,
    metaDate: isFolder
      ? { folder: { collapsed: false, ...(s.metadata?.folder || {}) } }
      : {
          chat: {
            avatarUrl: s.metadata?.avatarUrl || "",
            unreadCount: s.metadata?.unreadCount || 0,
            lastMessagePreview:
              s.metadata?.lastMessagePreview || "Нет сообщений",
            ...(s.metadata?.chat || {}),
          },
        },
  };
}
