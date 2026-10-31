import { db } from "../db/db.js";
import { messages, nodes } from "../db/sqema.js";
import { and, eq, max } from "drizzle-orm";

type NodeUpdate = Partial<typeof nodes.$inferInsert>;

export class ChatDbService {
  async createNode(
    name: string,
    parentId: string | null | undefined,
    type: "folder" | "chat",
    metadata: Record<string, any> = {},
  ) {
    const normalizedParentId =
      parentId && parentId.trim() !== "" ? parentId : null;

    const [node] = await db
      .insert(nodes)
      .values({
        name,
        parentId: normalizedParentId,
        type,
        metadata,
      })
      .returning();

    return node;
  }

  async deleteChat(id: string) {
    const allNodes = await db.select().from(nodes);

    // Рекурсивно собираем ID удаляемого узла и всех его потомков
    const collectIds = (targetId: string): string[] => {
      const children = allNodes.filter((n) => n.parentId === targetId);
      return [targetId, ...children.flatMap((c) => collectIds(c.id))];
    };

    const idsToRemove = collectIds(id);

    // Удаляем в обратном порядке (сначала дочерние элементы, потом родительские)
    for (const nodeId of idsToRemove.reverse()) {
      // Очищаем сообщения, привязанные к этому узлу
      await db.delete(messages).where(eq(messages.nodeId, nodeId));
      // Удаляем сам узел
      await db.delete(nodes).where(eq(nodes.id, nodeId));
    }
  }

  async editChat(id: string, updates: NodeUpdate) {
    if ("parentId" in updates && updates.parentId === "") {
      updates.parentId = null;
    }
    await db.update(nodes).set(updates).where(eq(nodes.id, id));
  }

  async dragChat(id: string, newParentId: string | null | undefined) {
    const normalizedParentId =
      newParentId && newParentId.trim() !== "" ? newParentId : null;

    await db
      .update(nodes)
      .set({ parentId: normalizedParentId })
      .where(eq(nodes.id, id));
  }

  // Алиасы для контроллера (вызывают методы напрямую через this)
  async editNode(id: string, updates: NodeUpdate) {
    return await this.editChat(id, updates);
  }

  async moveNode(id: string, newParentId: string | null | undefined) {
    return await this.dragChat(id, newParentId);
  }

  async deleteNode(id: string) {
    return await this.deleteChat(id);
  }

  async insertRawNode(nodeData: typeof nodes.$inferSelect) {
    await db.insert(nodes).values(nodeData).onConflictDoNothing();
  }

  async getAllNodes() {
    return await db.select().from(nodes);
  }
}
