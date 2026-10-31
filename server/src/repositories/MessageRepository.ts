import { db } from "../db/db.js";
import { messages } from "../db/sqema.js";
import { and, eq, max } from "drizzle-orm";

function mapMessageV2(row: any) {
  if (!row) return null;

  // Распаковываем content, если SQLite вернул его в виде строки
  const content =
    typeof row.content === "string" ? JSON.parse(row.content) : row.content;

  return {
    id: `${row.deviceId}-${row.mid}`,
    chatId: row.nodeId,
    senderId: row.deviceId,
    content: row.content,
    createdAt: content?.createdAt || Date.now(),
  };
}

// Умный парсер, который ищет только последний дефис
function parseMessageId(fullId: string) {
  const idStr = String(fullId);
  const lastDashIndex = idStr.lastIndexOf("-");

  if (lastDashIndex === -1) {
    throw new Error(`Неверный формат ID сообщения: ${fullId}`);
  }

  return {
    deviceId: idStr.substring(0, lastDashIndex),
    midNum: Number(idStr.substring(lastDashIndex + 1)),
  };
}

export class MessageDbService {
  async createMessage(data: { chatId: string; senderId: string; content: {} }) {
    const result = await db
      .select({ maxMid: max(messages.mid) })
      .from(messages)
      .where(eq(messages.deviceId, data.senderId));

    const nextMid = (result[0]?.maxMid ?? 0) + 1;
    const [newMessage] = await db
      .insert(messages)
      .values({
        mid: nextMid,
        deviceId: data.senderId,
        nodeId: data.chatId,
        content: data.content,
      })
      .returning();

    if (!newMessage) throw new Error("Не удалось создать сообщение");
    return mapMessageV2(newMessage);
  }

  async deleteMessage(messageId: string) {
    const { deviceId, midNum } = parseMessageId(messageId);

    await db
      .delete(messages)
      .where(and(eq(messages.mid, midNum), eq(messages.deviceId, deviceId)));
  }

  async updateMessage(messageId: string, newContent: any) {
    const { deviceId, midNum } = parseMessageId(messageId);

    const [currentMsgRow] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.mid, midNum), eq(messages.deviceId, deviceId)));

    if (!currentMsgRow) throw new Error("Сообщение не найдено");

    const updatedContent = {
      ...(typeof currentMsgRow.content === "string"
        ? JSON.parse(currentMsgRow.content)
        : (currentMsgRow.content as object)),
      ...newContent,
    };

    const [updatedMessage] = await db
      .update(messages)
      .set({ content: updatedContent })
      .where(and(eq(messages.mid, midNum), eq(messages.deviceId, deviceId)))
      .returning();

    if (!updatedMessage) throw new Error("Ошибка обновления сообщения");

    return mapMessageV2(updatedMessage);
  }

  async getMessagesByChatId(chatId: string, limit: number, offset: number) {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.nodeId, chatId as string))
      .limit(limit)
      .offset(offset);

    // Возвращаем данные через mapMessageV2, сохраняя поле content с блоками
    return msgs.map(mapMessageV2);
  }

  async getMessageById(messageId: string) {
    const { deviceId, midNum } = parseMessageId(messageId);

    const [msg] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.mid, midNum), eq(messages.deviceId, deviceId)));

    return mapMessageV2(msg);
  }

  async saveRawMessage(messageObj: any) {
    const { deviceId, midNum } = parseMessageId(messageObj.id);

    await db.insert(messages).values({
      mid: midNum,
      deviceId: deviceId,
      nodeId: messageObj.chatId as string,
      content: messageObj.content,
    });
  }

  async markAsRead(messageIds: string[]) {
    if (!messageIds || !Array.isArray(messageIds)) return;

    for (const messageId of messageIds) {
      const { deviceId, midNum } = parseMessageId(messageId);

      const [currentMsgRow] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.mid, midNum), eq(messages.deviceId, deviceId)));

      if (currentMsgRow) {
        const currentContent =
          typeof currentMsgRow.content === "string"
            ? JSON.parse(currentMsgRow.content)
            : (currentMsgRow.content as object);

        const updatedContent = {
          ...currentContent,
          status: "read",
        };

        await db
          .update(messages)
          .set({ content: updatedContent })
          .where(
            and(eq(messages.mid, midNum), eq(messages.deviceId, deviceId)),
          );
      }
    }
  }
}
