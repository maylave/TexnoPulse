import { appServer } from "./AppServer.js";
import { ChatController } from "../controllers/ChatController.js";

export function registerChatHandlers(chatController: ChatController) {
  appServer.register("chat:load", async () => {
    return await chatController.loadInitialData();
  });

  appServer.register("chat:create", async (data) => {
    // Защита от пустой строки для foreign key в SQLite
    const parentId =
      data.parentId && data.parentId.trim() !== "" ? data.parentId : null;

    return await chatController.createNode(
      parentId,
      data.type,
      data.name,
      data.metadata,
    );
  });

  // Обновление папки/чата (метаданные, свернутость, название)
  appServer.register("chat:update", async (data) => {
    await chatController.editNode(data.id, data.updates);
    return { success: true };
  });

  // Перемещение через Drag & Drop
  appServer.register("chat:move", async (data) => {
    const newParentId =
      data.newParentId && data.newParentId.trim() !== ""
        ? data.newParentId
        : null;
    await chatController.moveNode(data.id, newParentId);
    return { success: true };
  });

  appServer.register("chat:delete", async (data) => {
    await chatController.deleteNode(data.id);
    return { success: true };
  });
}
