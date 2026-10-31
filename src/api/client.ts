// src/api/client.ts
import { ref } from "vue";
import type { ApiActions, ServerEvents } from "./protocol";

export type ConnectionStatus = "connecting" | "open" | "closed";

interface Pending {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

class ApiClient {
  /** Для индикатора «нет связи с сервером» в UI */
  readonly status = ref<ConnectionStatus>("closed");
  readonly currentPort = ref<number>(3000);

  private ws: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private listeners = new Map<string, Set<(data: any) => void>>();
  private openListeners = new Set<() => void>();
  private seq = 0;
  private retry = 0;
  private manualClose = false;
  private url: string;

  constructor(initialUrl: string) {
    this.url = initialUrl;
    const match = initialUrl.match(/:(\d+)/);
    if (match) this.currentPort.value = parseInt(match[1], 10);

    // Автоматически определяем порт сервера
    this.initPortAndConnect();
  }

  async initPortAndConnect() {
    await this.detectPort();
    this.connect();
  }

  /**
   * Определение активного порта сервера (через Tauri invoke или сканирование 3000..3010)
   */
  async detectPort(): Promise<number> {
    // 1. Проверяем через Tauri команду get_server_port
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res = await invoke<{ port: number; wsUrl: string }>("get_server_port");
      if (res && res.port) {
        this.setPort(res.port, false);
        return res.port;
      }
    } catch {}

    // 2. Проверяем сохраненный пользователем порт
    try {
      const saved = localStorage.getItem("snapi_custom_port");
      if (saved) {
        const p = parseInt(saved, 10);
        if (!isNaN(p)) {
          this.setPort(p, false);
          return p;
        }
      }
    } catch {}

    // 3. Пробуем пинговать порты 3000..3015 в веб-режиме
    const candidatePorts = [3000, 3001, 3002, 3003, 3004, 3005];
    for (const p of candidatePorts) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 200);
        const resp = await fetch(`http://127.0.0.1:${p}/api/health`, {
          signal: controller.signal,
        });
        clearTimeout(t);
        if (resp.ok) {
          const json = await resp.json();
          if (json.app === "snapi") {
            this.setPort(p, false);
            return p;
          }
        }
      } catch {}
    }

    return this.currentPort.value;
  }

  setPort(newPort: number, reconnectNow = true) {
    this.currentPort.value = newPort;
    this.url = `ws://127.0.0.1:${newPort}`;
    try {
      localStorage.setItem("snapi_custom_port", String(newPort));
    } catch {}

    if (reconnectNow) {
      this.disconnect();
      this.connect();
    }
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualClose = false;
    this.status.value = "connecting";

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      this.status.value = "open";
      this.openListeners.forEach((cb) => cb());
    };

    ws.onmessage = (e) => this.handleMessage(e.data);

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = async () => {
      this.ws = null;
      this.status.value = "closed";
      this.rejectAll(new Error("Соединение с сервером потеряно"));

      if (!this.manualClose) {
        // Если соединение закрыто, периодически проверяем не сменился ли порт
        if (this.retry > 1) {
          await this.detectPort();
        }
        setTimeout(
          () => this.connect(),
          Math.min(1000 * 2 ** this.retry++, 10_000),
        );
      }
    };
  }

  disconnect() {
    this.manualClose = true;
    this.ws?.close();
  }

  /** Запрос → ответ. Ждет открытия сокета при статусе "connecting" */
  async request<A extends keyof ApiActions>(
    action: A,
    data?: ApiActions[A]["req"],
    timeoutMs = 15_000,
  ): Promise<ApiActions[A]["res"]> {
    if (this.status.value === "closed") {
      throw new Error("Нет соединения с сервером");
    }

    if (this.status.value === "connecting") {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Таймаут ожидания подключения к серверу")),
          5000,
        );
        this.onOpen(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    const requestId = `req_${++this.seq}_${Date.now()}`;
    const packet = { requestId, action, data };

    return new Promise<ApiActions[A]["res"]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Таймаут запроса: ${action}`));
      }, timeoutMs);

      this.pending.set(requestId, { resolve, reject, timer });
      this.ws!.send(JSON.stringify(packet));
    });
  }

  /** Подписка на серверные события */
  on<E extends keyof ServerEvents>(
    event: E,
    callback: (data: ServerEvents[E]) => void,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback);
    return () => set.delete(callback);
  }

  onOpen(callback: () => void): () => void {
    if (this.status.value === "open") {
      callback();
      return () => {};
    }
    this.openListeners.add(callback);
    return () => this.openListeners.delete(callback);
  }

  private handleMessage(raw: string) {
    let packet: any;
    try {
      packet = JSON.parse(raw);
    } catch {
      return;
    }

    if (packet.requestId) {
      const pending = this.pending.get(packet.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(packet.requestId);
      if (packet.status === "ok") pending.resolve(packet.payload);
      else pending.reject(new Error(packet.message ?? "Ошибка сервера"));
      return;
    }

    if (packet.event) {
      this.listeners.get(packet.event)?.forEach((cb) => cb(packet.data));
    }
  }

  private rejectAll(error: Error) {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(error);
    }
    this.pending.clear();
  }
}

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";
export const api = new ApiClient(API_URL.replace(/^http/, "ws"));
