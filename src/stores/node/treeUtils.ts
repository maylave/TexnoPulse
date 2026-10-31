import type { AppNode } from "@/types/chat";

// Сбор ID всех дочерних элементов (для удаления папки со всем содержимым)
export function collectNodeIds(nodes: AppNode[], rootId: string): string[] {
  const children = nodes.filter((n) => n.parentId === rootId);
  return [rootId, ...children.flatMap((c) => collectNodeIds(nodes, c.id))];
}

// Защита от перемещения папки саму в себя или в свои дочерние элементы
export function isDescendantNode(
  nodes: AppNode[],
  sourceId: string,
  targetId: string,
): boolean {
  let current = nodes.find((n) => n.id === targetId);
  while (current && current.parentId) {
    if (current.parentId === sourceId) return true;
    current = nodes.find((n) => n.id === current?.parentId);
  }
  return false;
}
