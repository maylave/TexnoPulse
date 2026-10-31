import { FileManager } from "./FileManager.js";
import { MessageController } from "../controllers/MessageController.js";
import { ChatController } from "../controllers/ChatController.js";

export function handleTextPacket(
  ws: any,
  message: any,
  messageController: MessageController,
  chatController: ChatController,
) {
  if (!message.type) return;

  // Подготовка к приёму файла
  if (message.type === "FILE_INCOMING") {
    FileManager.expectFile(ws, message.meta);
    return;
  }

  // Сообщения (включая массивы блоков)
  if (message.type === "MESSAGE_SYNC") {
    messageController.handleIncomingPacket(message);
    return;
  }

  // Чаты и папки
  if (message.type === "NODE_SYNC") {
    chatController.handleIncomingPacket(message);
  }
}

export async function handleBinaryPacket(ws: any, buffer: Buffer) {
  // Принимаем бинарник и сохраняем на диск
  const savedMeta = FileManager.receiveBinary(ws, buffer);
  const sender = ws.deviceId || "unknown-device";

  // Запись в БД не нужна: сообщение придёт отдельным MESSAGE_SYNC
  // с JSON-объектом, который ссылается на этот файл.
  if (savedMeta) {
    console.log(
      `[Network] Файл ${savedMeta.fileName} от ${sender} успешно загружен в кэш.`,
    );
  }
}
