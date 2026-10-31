// src/api/deviceHandlers.ts — ответ на модалку «устройство X хочет подключиться»
import { appServer } from "./AppServer.js";
import { UserController } from "../controllers/UserController.js";

export function registerDeviceHandlers(userController: UserController) {
  appServer.register("device:approve", async (data) => {
    await userController.approveDevice(data.deviceId);
    return { success: true };
  });

  appServer.register("device:block", async (data) => {
    await userController.blockDevice(data.deviceId);
    return { success: true };
  });
}
