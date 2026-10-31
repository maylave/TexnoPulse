// src/wsServer.ts
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { WebSocketServer, WebSocket, type RawData } from "ws";

type ApiHandler = (data: any, ws: WebSocket) => Promise<any>;

/** HTTP-маршрут: вернуть true, если запрос обработан */
export type HttpRoute = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
) => Promise<boolean>;

export interface WsStartOptions {
  host?: string;
  /** Разрешённые Origin для браузерных клиентов. Пустой список = без проверки */
  allowedOrigins?: string[];
  /** Разрешить ли автоматический выбор следующего порта, если предпочитаемый занят */
  autoPort?: boolean;
}

export class WsServerManager {
  private httpServer: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private handlers = new Map<string, ApiHandler>();
  private routes: HttpRoute[] = [];
  protected clients = new Set<WebSocket>();
  private activePort = 3000;

  getActivePort(): number {
    return this.activePort;
  }

  private savePortConfig(port: number) {
    const payload = JSON.stringify({
      port,
      wsUrl: `ws://127.0.0.1:${port}`,
      httpUrl: `http://127.0.0.1:${port}`,
      pid: process.pid,
      timestamp: Date.now(),
    }, null, 2);

    try {
      // 1. В системную папку AppData/Roaming/Snapi
      const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || ".", "AppData", "Roaming");
      const snapiDir = path.join(appData, "Snapi");
      if (!fs.existsSync(snapiDir)) {
        fs.mkdirSync(snapiDir, { recursive: true });
      }
      fs.writeFileSync(path.join(snapiDir, "port.json"), payload);
    } catch {}

    try {
      // 2. В корень проекта / папку запуска для быстрого чтения фронтендом
      fs.writeFileSync(path.resolve(process.cwd(), ".port.json"), payload);
    } catch {}
  }

  async start(
    preferredPort: number = 3000,
    { host = "127.0.0.1", allowedOrigins = [], autoPort = true }: WsStartOptions = {},
  ): Promise<number> {
    const isAllowed = (origin?: string) =>
      !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

    return new Promise((resolve, reject) => {
      let currentPort = preferredPort;
      const maxAttempts = autoPort ? 50 : 1;
      let attempt = 0;

      const tryBind = () => {
        const server = http.createServer(async (req, res) => {
          // Встроенная проверка здоровья сервера
          if (req.url === "/api/health" || req.url === "/health") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok", app: "snapi", port: this.activePort }));
            return;
          }

          const origin = req.headers.origin;
          if (!isAllowed(origin)) {
            res.writeHead(403).end();
            return;
          }
          if (origin) {
            res.setHeader("Access-Control-Allow-Origin", origin || "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            res.setHeader("Vary", "Origin");
          } else {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
          }
          if (req.method === "OPTIONS") {
            res.writeHead(204).end();
            return;
          }

          try {
            const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
            for (const route of this.routes) {
              if (await route(req, res, url)) return;
            }
            res.writeHead(404).end();
          } catch (error) {
            console.error("[HTTP] Ошибка:", error);
            if (!res.headersSent) res.writeHead(500);
            res.end();
          }
        });

        server.once("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            attempt++;
            console.warn(`[WS Server] Порт ${currentPort} занят другим процессом.`);
            if (attempt < maxAttempts) {
              currentPort++;
              console.log(`[WS Server] Пробуем следующий свободный порт: ${currentPort}...`);
              tryBind();
            } else {
              reject(new Error(`[WS Server] Не удалось запустить сервер: порты ${preferredPort}..${currentPort} заняты`));
            }
          } else {
            reject(err);
          }
        });

        server.listen(currentPort, host, () => {
          this.httpServer = server;
          this.activePort = currentPort;

          this.wss = new WebSocketServer({
            server: this.httpServer,
            verifyClient: ({ origin }: { origin: string }) => isAllowed(origin),
          });

          this.wss.on("connection", (ws: WebSocket) => {
            this.clients.add(ws);

            ws.on("message", async (raw: RawData) => {
              let requestId: string | null = null;
              try {
                const packet = JSON.parse(raw.toString());
                requestId = packet.requestId;
                const { action, data } = packet;

                const handler = this.handlers.get(action);
                if (!handler) throw new Error(`Неизвестное действие: ${action}`);

                const result = await handler(data, ws);
                ws.send(JSON.stringify({ requestId, status: "ok", payload: result }));
              } catch (error: any) {
                console.error("[WS Server] Ошибка:", error);
                ws.send(
                  JSON.stringify({
                    requestId,
                    status: "error",
                    message: error.message,
                  }),
                );
              }
            });

            ws.on("close", () => this.clients.delete(ws));
          });

          console.log(`[WS Server] Запущен на ws://${host}:${currentPort}`);
          this.savePortConfig(currentPort);
          resolve(currentPort);
        });
      };

      tryBind();
    });
  }

  register(action: string, handler: ApiHandler) {
    this.handlers.set(action, handler);
    console.log(`[WS Server] Зарегистрировано действие: ${action}`);
  }

  addRoute(route: HttpRoute) {
    this.routes.push(route);
  }

  notify(event: string, data: any) {
    const message = JSON.stringify({ event, data });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    }
  }

  getClientCount(): number {
    let count = 0;
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) count++;
    }
    return count;
  }
}
