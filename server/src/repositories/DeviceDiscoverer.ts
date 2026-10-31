import { db } from "../db/db.js";
import { usersTable, deviceTable } from "../db/sqema.js";
import { eq } from "drizzle-orm";
import { generateIdUser } from "../utils/accountId.js";

export class UserDbService {
  async getOrCreateUser(name: string) {
    const accountId = generateIdUser(name);

    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.accountId, accountId));

    if (existingUsers.length > 0) {
      return existingUsers[0];
    }

    const [newUser] = await db
      .insert(usersTable)
      .values({
        name,
        accountId,
      })
      .returning();

    return newUser;
  }

  async upsertDevice(
    deviceId: string,
    accountId: string,
    ipAddress: string,
    status: "trusted" | "pending" | "blocked" = "pending",
    typeDevice: "phone" | "pc" | "laptop" | "tablet" | "other" = "other",
  ) {
    const existingDevices = await db
      .select()
      .from(deviceTable)
      .where(eq(deviceTable.deviceId, deviceId));

    if (existingDevices.length > 0) {
      const [updatedDevice] = await db
        .update(deviceTable)
        .set({ ipAddress })
        .where(eq(deviceTable.deviceId, deviceId))
        .returning();
      return updatedDevice;
    }

    const [newDevice] = await db
      .insert(deviceTable)
      .values({
        deviceId,
        accountId,
        ipAddress,
        typeDevice,
        status,
      })
      .returning();

    return newDevice;
  }
  // Добавь это в UserDbService
  async getDevicesByStatus(status: "trusted" | "pending" | "blocked") {
    return await db
      .select()
      .from(deviceTable)
      .where(eq(deviceTable.status, status));
  }
  async getDevice(deviceId: string) {
    const devices = await db
      .select()
      .from(deviceTable)
      .where(eq(deviceTable.deviceId, deviceId));

    return devices.length > 0 ? devices[0] : null;
  }

  async updateDeviceStatus(
    deviceId: string,
    newStatus: "trusted" | "pending" | "blocked",
  ) {
    await db
      .update(deviceTable)
      .set({ status: newStatus })
      .where(eq(deviceTable.deviceId, deviceId));
  }
}
