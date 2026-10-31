// src/api/messageHandlers.ts
import { appServer } from "./AppServer.js";
import { MessageController } from "../controllers/MessageController.js";

export function registerMessageHandlers(messageController: MessageController) {
  // История чата порциями (метод в контроллере был, но не был доступен из UI)
  appServer.register("message:load", async (data) => {
    const { chatId, limit = 20, offset = 0 } = data;
    return await messageController.loadMessagesChunk(chatId, limit, offset);
  });

  appServer.register("message:send", async (data) => {
    const { chatId, content } = data;
    // sendMessage делает content.createdAt = ..., поэтому нужен именно объект
    if (!content || typeof content !== "object") {
      throw new Error(
        "content должен быть объектом, например { blocks: [...] }",
      );
    }
    return await messageController.sendMessage(chatId, content);
  });

  appServer.register("message:edit", async (data) => {
    const { messageId, newContent } = data;
    return await messageController.editMessage(messageId, newContent);
  });

  appServer.register("message:delete", async (data) => {
    const { messageId, chatId } = data;
    await messageController.deleteMessage(messageId, chatId);
    return { success: true };
  });
}
