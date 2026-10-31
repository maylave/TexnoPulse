// back/src/controllers/ChatController.ts
import { ChatDbService } from "../repositories/ChatRepository.js";
import { UserController } from "./UserController.js";
import { sendTextToDevice } from "../network/NetworkManager.js";
import { appServer } from "../api/AppServer.js";

export type NodeAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE";

export interface NetworkPacket {
  type: string;
  senderDeviceId: string;
  payload: any;
}

export class ChatController {
  private chatDb: ChatDbService;

  constructor(
    private myDeviceId: string,
    private userController: UserController,
  ) {
    this.chatDb = new ChatDbService();
  }

  async createNode(
    parentId: string | null | undefined, // Разрешаем null для корневых узлов
    type: "folder" | "chat",
    name: string,
    metadata: Record<string, any> | null = null,
  ) {
    const node = await this.chatDb.createNode(
      name,
      parentId,
      type,
      metadata || {},
    );

    await this.broadcastEvent("CREATE", { node });

    // Уведомляем фронтенд о создании локального узла
    appServer.notifyChatCreated(node);
    appServer.notifySuccess("Успех", `Узел "${name}" успешно создан`);

    return node;
  }

  async updateNode(
    id: string,
    updates: Partial<{ name: string; metadata: Record<string, any> }>,
  ) {
    await this.chatDb.editChat(id, updates);
    await this.broadcastEvent("UPDATE", { id, updates });

    // Оповещаем UI об изменении
    appServer.notify("chat:updated", { id, updates });
  }

  // Алиас для вызова из chatHandlers.ts
  async editNode(
    id: string,
    updates: Partial<{ name: string; metadata: Record<string, any> }>,
  ) {
    return await this.updateNode(id, updates);
  }

  async moveNode(id: string, newParentId: string | null | undefined) {
    await this.chatDb.dragChat(id, newParentId);
    await this.broadcastEvent("MOVE", { id, newParentId });

    // Оповещаем UI о перемещении
    appServer.notify("chat:moved", { id, newParentId });
  }

  async deleteNode(id: string) {
    await this.chatDb.deleteChat(id);
    await this.broadcastEvent("DELETE", { id });

    // Даем команду фронтенду убрать узел с экрана
    appServer.notifyChatDeleted(id);
    appServer.notifySuccess("Успех", "Узел удален");
  }

  async loadInitialData() {
    const allNodes = await this.chatDb.getAllNodes();
    return allNodes;
  }

  async handleIncomingPacket(packet: NetworkPacket) {
    if (
      packet.type !== "NODE_SYNC" ||
      packet.senderDeviceId === this.myDeviceId
    ) {
      return;
    }

    // Проверяем, доверяем ли мы устройству
    const isTrusted = await this.userController.isDeviceTrusted(
      packet.senderDeviceId,
    );

    if (!isTrusted) {
      console.warn(
        `[ChatController] Отклонена синхронизация от недоверенного устройства: ${packet.senderDeviceId}`,
      );
      appServer.notifyError(
        "Блокировка",
        `Отклонена синхронизация от недоверенного устройства: ${packet.senderDeviceId}`,
      );
      return;
    }

    try {
      const payload = packet.payload;
      const action = payload.action as NodeAction;
      const data = payload.data;

      switch (action) {
        case "CREATE":
          await this.chatDb.insertRawNode(data.node);
          appServer.notifyChatCreated(data.node);
          appServer.notifySync("chat", "synced");
          break;
        case "UPDATE":
          await this.chatDb.editChat(data.id, data.updates);
          appServer.notify("chat:updated", {
            id: data.id,
            updates: data.updates,
          });
          break;
        case "MOVE":
          await this.chatDb.dragChat(data.id, data.newParentId);
          appServer.notify("chat:moved", {
            id: data.id,
            newParentId: data.newParentId,
          });
          break;
        case "DELETE":
          await this.chatDb.deleteChat(data.id);
          appServer.notifyChatDeleted(data.id);
          break;
      }
    } catch (error: any) {
      console.error(
        "[ChatController] Ошибка обработки входящего пакета:",
        error,
      );
      appServer.notifyError("Ошибка синхронизации сети", error.message);
    }
  }

  private async broadcastEvent(action: NodeAction, data: any) {
    const payloadObject = {
      action,
      data,
      timestamp: Date.now(),
    };

    const packet: NetworkPacket = {
      type: "NODE_SYNC",
      senderDeviceId: this.myDeviceId,
      payload: payloadObject,
    };

    const trustedDevices = await this.userController.getAllTrustedDevices();

    for (const device of trustedDevices) {
      sendTextToDevice(device.deviceId, packet);
    }
  }
}
