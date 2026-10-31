import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { ServerResponse } from "node:http";
import type { HttpRoute } from "./wsServer.js";

const FILES_DIR = path.resolve("data/files");
const INLINE_TYPES = /^(image|video|audio)\//;

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

export const fileRoutes: HttpRoute = async (req, res, url) => {
  // Загрузка: POST /files?name=photo.png  (тело запроса — сам файл)
  if (req.method === "POST" && url.pathname === "/files") {
    await mkdir(FILES_DIR, { recursive: true });
    const id = randomUUID();
    const name = url.searchParams.get("name") ?? "file";
    const mime = req.headers["content-type"] ?? "application/octet-stream";

    await pipeline(req, createWriteStream(path.join(FILES_DIR, id)));
    const { size } = await stat(path.join(FILES_DIR, id));
    await writeFile(
      path.join(FILES_DIR, `${id}.json`),
      JSON.stringify({ name, mime, size }),
    );

    sendJson(res, 201, { id, name, mime, size });
    return true;
  }

  // Скачивание / превью: GET /files/<uuid>  (regex не пропускает ../)
  const match = url.pathname.match(/^\/files\/([0-9a-f-]{36})$/);
  if (req.method === "GET" && match) {
    const id = match[1];
    try {
      const meta = JSON.parse(
        await readFile(path.join(FILES_DIR, `${id}.json`), "utf8"),
      );
      const inline = INLINE_TYPES.test(meta.mime);
      res.writeHead(200, {
        "Content-Type": meta.mime,
        "Content-Length": meta.size,
        "X-Content-Type-Options": "nosniff",
        // Всё, кроме медиа, только скачивается — загруженный HTML не исполнится
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      });
      createReadStream(path.join(FILES_DIR, id)).pipe(res);
    } catch {
      sendJson(res, 404, { error: "Файл не найден" });
    }
    return true;
  }

  return false;
};
