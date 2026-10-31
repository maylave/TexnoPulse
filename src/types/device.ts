export type DeviceType =
  | "desktop"
  | "laptop"
  | "mobile"
  | "tablet"
  | "server"
  | "other";
export type DeviceStatus =
  | "pending"
  | "active"
  | "inactive"
  | "blocked"
  | "offline";

export interface AppDevice {
  deviceId: string; 
  name?: string; 
  type: DeviceType; 
  status: DeviceStatus; 
  lastSeen?: number; 
}
