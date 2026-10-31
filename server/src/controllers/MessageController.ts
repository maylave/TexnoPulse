import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { MessageDbService } from "../repositories/MessageRepository.js";
import { UserController } from "./UserController.js";
import { appServer } from "../api/AppServer.js";
import { notificationService } from "../services/NotificationService.js";

import { FileManager } from "../network/FileManager.js";
import { sendTextToDevice, activePeers } from "../network/NetworkManager.js";

export type MessageAction =
  | "NEW_MESSAGE"
  | "EDIT_MESSAGE"
  | "DELETE_MESSAGE"
  | "READ_STATUS";

export interface MessageNetworkPacket {
  type: "MESSAGE_SYNC";
  senderDeviceId: string;
  payload: {
    action: MessageAction;
    data: any;
    timestamp: number;
  };
}

export class MessageController {
  constructor(
    private myDeviceId: string,
    private userController: UserController,
    private messageRepo: MessageDbService,
  ) {}

  // ==========================================
  // 1. ЛОКАЛЬНЫЕ ДЕЙСТВИЯ (ЧАТЫ)
  // ==========================================

  // Теперь метод принимает сформированный объект content (с массивом блоков)
  async sendMessage(chatId: string, content: any) {
    // Гарантируем наличие метки времени в контенте
    if (!content.createdAt) {
      content.createdAt = Date.now();
    }

    const message = await this.messageRepo.createMessage({
      chatId,
      senderId: this.myDeviceId,
      content,
    });

    await this.broadcastMessageEvent("NEW_MESSAGE", { message });
    appServer.notifyNewMessage(chatId, message);

    return message;
  }

  // Обновление работает с массивом контента, а не просто текстом
  async editMessage(messageId: string, newContent: any) {
    const updatedMessage = await this.messageRepo.updateMessage(
      messageId,
      newContent,
    );

    await this.broadcastMessageEvent("EDIT_MESSAGE", {
      message: updatedMessage,
    });
    appServer.notify("message:edited", { messageId, newContent });

    return updatedMessage;
  }

  async deleteMessage(messageId: string, chatId: string) {
    await this.messageRepo.deleteMessage(messageId);

    await this.broadcastMessageEvent("DELETE_MESSAGE", { messageId, chatId });
    appServer.notify("message:deleted", { messageId, chatId });
  }

  async loadMessagesChunk(
    chatId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    return await this.messageRepo.getMessagesByChatId(chatId, limit, offset);
  }

  // ==========================================
  // 2. ОПТИМИЗИРОВАННАЯ РАБОТА С ФАЙЛАМИ
  // ==========================================

  // Метод больше не создает сообщение в БД. Он только пушит байты по P2P-сети.
  async broadcastFileToPeers(filePath: string, fileName: string) {
    appServer.notifyFileTransfer(fileName, fileName, 0, "upload", "started");

    try {
      FileManager.broadcastFile(filePath, fileName, fileName, activePeers);

      appServer.notifyFileTransfer(
        fileName,
        fileName,
        100,
        "upload",
        "completed",
      );

      return { success: true, fileName };
    } catch (error: any) {
      appServer.notifyFileTransfer(fileName, fileName, 0, "upload", "error");
      appServer.notifyError("Ошибка передачи файла", error.message);
      throw error;
    }
  }

  // ==========================================
  // 3. СЕТЕВЫЕ ДЕЙСТВИЯ (Входящие P2P пакеты)
  // ==========================================

  async handleIncomingPacket(packet: MessageNetworkPacket) {
    if (
      packet.type !== "MESSAGE_SYNC" ||
      packet.senderDeviceId === this.myDeviceId
    ) {
      return;
    }

    const isTrusted = await this.userController.isDeviceTrusted(
      packet.senderDeviceId,
    );
    if (!isTrusted) {
      console.warn(
        `[MessageController] Блокировка сообщений от недоверенного устройства: ${packet.senderDeviceId}`,
      );
      return;
    }

    try {
      const { action, data } = packet.payload;

      switch (action) {
        case "NEW_MESSAGE":
          await this.messageRepo.saveRawMessage(data.message);
          appServer.notifyNewMessage(data.message.chatId, data.message);
          break;

        case "EDIT_MESSAGE":
          // Теперь ожидается поле content вместо text
          await this.messageRepo.updateMessage(
            data.message.id,
            data.message.content,
          );
          appServer.notify("message:edited", {
            messageId: data.message.id,
            newContent: data.message.content,
          });
          break;

        case "DELETE_MESSAGE":
          await this.messageRepo.deleteMessage(data.messageId);
          appServer.notify("message:deleted", {
            messageId: data.messageId,
            chatId: data.chatId,
          });
          break;

        case "READ_STATUS":
          await this.messageRepo.markAsRead(data.messageIds);
          appServer.notify("message:read", { messageIds: data.messageIds });
          break;
      }
    } catch (error: any) {
      console.error(
        "[MessageController] Ошибка обработки сетевого сообщения:",
        error,
      );
      appServer.notifyError("Ошибка синхронизации сообщений", error.message);
    }
  }

  // ==========================================
  // 4. ВНУТРЕННИЕ МЕТОДЫ
  // ==========================================

  private async broadcastMessageEvent(action: MessageAction, data: any) {
    const packet: MessageNetworkPacket = {
      type: "MESSAGE_SYNC",
      senderDeviceId: this.myDeviceId,
      payload: {
        action,
        data,
        timestamp: Date.now(),
      },
    };

    const trustedDevices = await this.userController.getAllTrustedDevices();

    for (const device of trustedDevices) {
      sendTextToDevice(device.deviceId, packet);
    }
  }

  async getFileForDownload(filePath: string) {
    // Разворачиваем полный путь к файлу в папке uploads
    const absolutePath = path.resolve(process.cwd(), "uploads", filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Файл не найден на диске: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const base64Data = fileBuffer.toString("base64");

    return {
      success: true,
      data: base64Data,
      size: fileBuffer.length,
    };
  }
}
