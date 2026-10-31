import fs from "node:fs";
import path from "node:path";
import { db } from "./db/db.js";
import { usersTable, nodes } from "./db/sqema.js";
import { generateIdUser } from "./utils/accountId.js";

import {
  startWebSocketServer,
  onTextMessage,
  onBinaryMessage,
} from "./network/NetworkManager.js";
import { handleTextPacket, handleBinaryPacket } from "./network/handlers.js";

import { appServer } from "./api/AppServer.js";
import { fileRoutes } from "./api/fileRoutes.js";
import { pluginRoutes } from "./api/pluginRoutes.js";
import { registerChatHandlers } from "./api/chatHandlers.js";
import { registerMessageHandlers } from "./api/messageHanglers.js";
import { registerDeviceHandlers } from "./api/deviceHandlers.js";
import { registerNotificationHandlers } from "./api/notificationHandlers.js";
import { notificationService } from "./services/NotificationService.js";

import { UserController } from "./controllers/UserController.js";
import { MessageController } from "./controllers/MessageController.js";
import { ChatController } from "./controllers/ChatController.js";
import { UserDbService } from "./repositories/DeviceDiscoverer.js";
import { MessageDbService } from "./repositories/MessageRepository.js";

export async function startApp() {
  const userName = "Артем";
  const accountId = generateIdUser(userName);
  const myDeviceId = `device-${accountId}-01`;

  // Инициализация БД
  try {
    await db.insert(usersTable).values({ name: userName, accountId });
  } catch (e) {}

  try {
    await db
      .insert(nodes)
      .values({ id: "test-chat-1", type: "chat", name: "Тестовая комната" });
  } catch (e) {}

  try {
    await db
      .insert(nodes)
      .values({ id: "hello", type: "chat", name: "Общий чат" });
  } catch (e) {}

  // Контроллеры
  const userController = new UserController(new UserDbService(), accountId);
  const messageController = new MessageController(
    myDeviceId,
    userController,
    new MessageDbService(),
  );
  const chatController = new ChatController(myDeviceId, userController);

  // Авторизуем тестовый браузер заранее
  await userController.handleDiscoveredDevice(
    "test-pc-01",
    accountId,
    "127.0.0.1",
    "pc",
  );

  // Сеть между устройствами (P2P, порт 8080)
  try { startWebSocketServer(8080); } catch (e) { console.warn("[App] P2P port 8080 unavailable:", e); }
  onTextMessage((ws, msg) =>
    handleTextPacket(ws, msg, messageController, chatController),
  );
  onBinaryMessage((ws, buf) => handleBinaryPacket(ws, buf));

  // Регистрация хендлеров для UI
  registerChatHandlers(chatController);
  registerMessageHandlers(messageController);
  registerDeviceHandlers(userController);
  registerNotificationHandlers();

  // Отправка системного уведомления о запуске программы (один раз)
  notificationService.sendStartupNotification().catch(() => {});

  // Регистрация действия app:me для фронтенда
  appServer.register("app:me", async () => {
    return {
      deviceId: myDeviceId,
      accountId: accountId,
      name: userName,
    };
  });

  // Действия для проверки и управления активным портом
  appServer.register("app:port:get", async () => {
    return {
      port: appServer.getActivePort(),
      wsUrl: `ws://127.0.0.1:${appServer.getActivePort()}`,
      httpUrl: `http://127.0.0.1:${appServer.getActivePort()}`,
    };
  });

  appServer.addRoute(fileRoutes);
  appServer.addRoute(pluginRoutes);

  // Выбираем порт: из env SNAPI_PORT, аргумента --port или сохраненного port.json (по умолч. 3000)
  let preferredPort = 3000;
  try {
    const appData = process.env.APPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "AppData", "Roaming") : "");
    if (appData) {
      const cfgPath = path.join(appData, "Snapi", "port.json");
      if (fs.existsSync(cfgPath)) {
        const parsed = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
        if (parsed.preferredPort || parsed.port) {
          preferredPort = Number(parsed.preferredPort || parsed.port);
        }
      }
    }
  } catch {}

  const cliPortArg = process.argv.find((a) => a.startsWith("--port="));
  if (process.env.SNAPI_PORT) {
    preferredPort = parseInt(process.env.SNAPI_PORT, 10);
  } else if (cliPortArg) {
    preferredPort = parseInt(cliPortArg.split("=")[1], 10);
  }

  await appServer.start(preferredPort, {
    allowedOrigins: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:1420",
      "http://127.0.0.1:1420",
      "tauri://localhost",
      "http://tauri.localhost",
      "https://tauri.localhost",
    ],
    autoPort: true,
  });

  console.log(`[App] Все модули успешно запущены на порту ${appServer.getActivePort()}!`);
}
