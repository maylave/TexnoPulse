// plugins-server/src/index.mjs
import http from "node:http";
import { mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(ROOT_DIR, "data", "plugins");

// Порт сервера плагинов: по умолчанию 4000 (или из аргументов/env)
const portArg = process.argv.find((a) => a.startsWith("--port="));
const PORT = parseInt(
  process.env.PORT || process.env.PLUGINS_PORT || (portArg ? portArg.split("=")[1] : "4000"),
  10
);

// 1. Стартовый плагин: Cyberpunk Neon Theme
const DEFAULT_CYBERPUNK = {
  id: "cyberpunk-neon",
  name: "Cyberpunk Neon Theme",
  version: "1.0.0",
  desc: "Футуристическая неоновая киберпанк-тема с глубоким темным фоном, неоновым бирюзовым свечением и стилизованными эффектами чата.",
  author: "Snapi Team",
  icon: "Sparkles",
  categoryId: "visual",
  downloads: 245,
  rating: 4.95,
  hasTheme: true,
  createdAt: new Date().toISOString(),
  styles: `
    :root[data-plugin-theme="cyberpunk-neon"],
    body[data-plugin-theme="cyberpunk-neon"] {
      --sidebar-bg: #070914 !important;
      --color-background: #050811 !important;
      --color-surface: #080c1d !important;
      --color-surface-container: #0c122b !important;
      --color-surface-container-high: #121c40 !important;
      --color-surface-container-low: #050813 !important;
      --color-surface-container-lowest: #020409 !important;
      --color-accent: #00f2fe !important;
      --color-accent-hover: #4facfe !important;
      --color-primary: #00f2fe !important;
      --color-on-surface: #e0faff !important;
      --color-on-surface-variant: #7fe3f5 !important;
      --color-outline: #00f2fe !important;
      --color-outline-variant: rgba(0, 242, 254, 0.25) !important;
      --liquid-glass-bg: linear-gradient(135deg, rgba(8, 12, 29, 0.85) 0%, rgba(12, 18, 43, 0.75) 100%) !important;
      --liquid-glass-border: 1px solid rgba(0, 242, 254, 0.35) !important;
      --liquid-glass-shadow: 0 0 25px rgba(0, 242, 254, 0.18), inset 0 0 15px rgba(0, 242, 254, 0.08) !important;
      --message-content-bg: linear-gradient(135deg, rgba(12, 18, 43, 0.8) 0%, rgba(18, 28, 64, 0.85) 100%) !important;
    }
    [data-plugin-theme="cyberpunk-neon"] .liquid-glass {
      border: 1px solid rgba(0, 242, 254, 0.3) !important;
      box-shadow: 0 0 30px rgba(0, 242, 254, 0.12), inset 0 0 15px rgba(0, 242, 254, 0.05) !important;
    }
    [data-plugin-theme="cyberpunk-neon"] .glass-modal {
      border: 1px solid rgba(0, 242, 254, 0.4) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.2) !important;
    }
  `,
  code: `
    export default {
      install(context) {
        console.log('[Plugin: Cyberpunk Neon] Активирован успешно!');
        context.showNotification('Cyberpunk Neon', 'Тема Cyberpunk Neon успешно активирована на вашем ПК!');
      },
      uninstall(context) {
        console.log('[Plugin: Cyberpunk Neon] Деактивирован.');
      }
    };
  `
};

// 2. Стартовый плагин: Matrix Code
const DEFAULT_MATRIX = {
  id: "matrix-effect",
  name: "Matrix Code Canvas",
  version: "1.1.0",
  desc: "Зеленая терминальная тема в стиле Матрицы с изумрудным свечением акцентов и контуров.",
  author: "HackerOne",
  icon: "FileCode",
  categoryId: "visual",
  downloads: 190,
  rating: 4.8,
  hasTheme: true,
  createdAt: new Date().toISOString(),
  styles: `
    :root[data-plugin-theme="matrix-effect"],
    body[data-plugin-theme="matrix-effect"] {
      --sidebar-bg: #030d06 !important;
      --color-background: #020703 !important;
      --color-surface: #041208 !important;
      --color-surface-container: #061c0d !important;
      --color-surface-container-high: #0b2e17 !important;
      --color-surface-container-low: #020904 !important;
      --color-surface-container-lowest: #010402 !important;
      --color-accent: #00ff66 !important;
      --color-accent-hover: #33ff85 !important;
      --color-primary: #00ff66 !important;
      --color-on-surface: #dcffe7 !important;
      --color-on-surface-variant: #66ff99 !important;
      --color-outline: #00ff66 !important;
      --color-outline-variant: rgba(0, 255, 102, 0.25) !important;
      --liquid-glass-bg: linear-gradient(135deg, rgba(4, 18, 8, 0.85) 0%, rgba(6, 28, 13, 0.8) 100%) !important;
      --liquid-glass-border: 1px solid rgba(0, 255, 102, 0.3) !important;
      --liquid-glass-shadow: 0 0 25px rgba(0, 255, 102, 0.15) !important;
    }
    [data-plugin-theme="matrix-effect"] .liquid-glass {
      border: 1px solid rgba(0, 255, 102, 0.3) !important;
      box-shadow: 0 0 25px rgba(0, 255, 102, 0.15) !important;
    }
  `,
  code: `
    export default {
      install(context) {
        context.showNotification('Matrix Code', 'Тема Matrix Code подключена!');
      },
      uninstall(context) {
        console.log('[Plugin: Matrix Code] Отключен');
      }
    };
  `
};

// 3. Стартовый плагин: Quick Notes
const DEFAULT_NOTES = {
  id: "quick-notes",
  name: "Quick Notes & Scratchpad",
  version: "1.0.2",
  desc: "Встроенный блокнот для быстрых заметок, сниппетов кода и черновиков прямо внутри мессенджера.",
  author: "DevAlex",
  icon: "FileText",
  categoryId: "utils",
  downloads: 310,
  rating: 4.9,
  hasTheme: false,
  createdAt: new Date().toISOString(),
  styles: "",
  code: `
    export default {
      install(context) {
        console.log('[Plugin: Quick Notes] Инициализирован');
      },
      uninstall(context) {
        console.log('[Plugin: Quick Notes] Отключен');
      }
    };
  `
};

async function ensurePluginsDir() {
  await mkdir(PLUGINS_DIR, { recursive: true });
  const defaults = [DEFAULT_CYBERPUNK, DEFAULT_MATRIX, DEFAULT_NOTES];
  for (const p of defaults) {
    const pDir = path.join(PLUGINS_DIR, p.id);
    if (!existsSync(pDir)) {
      await mkdir(pDir, { recursive: true });
      await writeFile(path.join(pDir, "manifest.json"), JSON.stringify(p, null, 2));
      if (p.code) await writeFile(path.join(pDir, "bundle.js"), p.code);
      if (p.styles) await writeFile(path.join(pDir, "theme.css"), p.styles);
    }
  }
}

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
  });
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host || "127.0.0.1"}`);
  const pathname = url.pathname;

  console.log(`[Plugins Server] ${req.method} ${pathname}`);

  // Healthcheck
  if (pathname === "/health" || pathname === "/api/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "snapi-plugins-server",
      port: PORT,
      timestamp: Date.now()
    });
    return;
  }

  // 1. GET /api/plugins или GET /plugins — каталог плагинов
  if (req.method === "GET" && (pathname === "/api/plugins" || pathname === "/plugins")) {
    try {
      await ensurePluginsDir();
      const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });
      const plugins = [];

      for (const ent of entries) {
        if (ent.isDirectory()) {
          const manifestPath = path.join(PLUGINS_DIR, ent.name, "manifest.json");
          if (existsSync(manifestPath)) {
            try {
              const raw = await readFile(manifestPath, "utf8");
              plugins.push(JSON.parse(raw));
            } catch {}
          }
        }
      }

      sendJson(res, 200, { data: plugins, count: plugins.length });
    } catch (err) {
      sendJson(res, 500, { error: "Не удалось прочитать плагины", details: err?.message });
    }
    return;
  }

  // 2. GET /api/plugins/:id/download — скачивание пакета плагина на клиент
  const downloadMatch = pathname.match(/^\/(?:api\/)?plugins\/([a-zA-Z0-9_-]+)\/download$/);
  if (req.method === "GET" && downloadMatch) {
    const pluginId = downloadMatch[1];
    const pDir = path.join(PLUGINS_DIR, pluginId);
    const manifestPath = path.join(pDir, "manifest.json");

    if (!existsSync(manifestPath)) {
      sendJson(res, 404, { error: "Плагин не найден в каталоге сервера" });
      return;
    }

    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      let code = manifest.code || "";
      let styles = manifest.styles || "";

      if (existsSync(path.join(pDir, "bundle.js"))) {
        code = await readFile(path.join(pDir, "bundle.js"), "utf8");
      }
      if (existsSync(path.join(pDir, "theme.css"))) {
        styles = await readFile(path.join(pDir, "theme.css"), "utf8");
      }

      manifest.downloads = (manifest.downloads || 0) + 1;
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      sendJson(res, 200, {
        manifest,
        code,
        styles,
        downloadedAt: new Date().toISOString()
      });
    } catch (err) {
      sendJson(res, 500, { error: "Ошибка при формировании пакета плагина", details: err?.message });
    }
    return;
  }

  // 3. GET /api/plugins/:id — детальная информация
  const getMatch = pathname.match(/^\/(?:api\/)?plugins\/([a-zA-Z0-9_-]+)$/);
  if (req.method === "GET" && getMatch) {
    const pluginId = getMatch[1];
    const manifestPath = path.join(PLUGINS_DIR, pluginId, "manifest.json");

    if (!existsSync(manifestPath)) {
      sendJson(res, 404, { error: "Плагин не найден" });
      return;
    }

    try {
      const raw = await readFile(manifestPath, "utf8");
      sendJson(res, 200, JSON.parse(raw));
    } catch {
      sendJson(res, 500, { error: "Ошибка чтения манифеста" });
    }
    return;
  }

  // 4. POST /api/plugins/upload — загрузка стороннего плагина на сервер
  if (req.method === "POST" && (pathname === "/api/plugins/upload" || pathname === "/plugins/upload")) {
    try {
      await ensurePluginsDir();
      const bodyRaw = await readBody(req);
      let payload;

      try {
        payload = JSON.parse(bodyRaw);
      } catch {
        sendJson(res, 400, { error: "Тело запроса должно быть JSON объектом" });
        return;
      }

      if (!payload.name || !payload.id) {
        sendJson(res, 400, { error: "Поля 'id' и 'name' обязательны" });
        return;
      }

      const cleanId = payload.id.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      const pDir = path.join(PLUGINS_DIR, cleanId);
      await mkdir(pDir, { recursive: true });

      const newManifest = {
        id: cleanId,
        name: payload.name.trim(),
        version: payload.version || "1.0.0",
        desc: payload.desc || "Сторонний плагин для Snapi",
        author: payload.author || "Сторонний разработчик",
        icon: payload.icon || "Puzzle",
        categoryId: payload.categoryId || "visual",
        downloads: payload.downloads || 0,
        rating: payload.rating || 5.0,
        hasTheme: Boolean(payload.hasTheme || (payload.styles && payload.styles.trim().length > 0)),
        styles: payload.styles || "",
        code: payload.code || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await writeFile(path.join(pDir, "manifest.json"), JSON.stringify(newManifest, null, 2));
      if (newManifest.code) await writeFile(path.join(pDir, "bundle.js"), newManifest.code);
      if (newManifest.styles) await writeFile(path.join(pDir, "theme.css"), newManifest.styles);

      console.log(`[Plugins Server] Опубликован новый плагин: ${newManifest.name} (${newManifest.id})`);
      sendJson(res, 201, { success: true, plugin: newManifest });
    } catch (err) {
      sendJson(res, 500, { error: "Ошибка сохранения плагина на сервере", details: err?.message });
    }
    return;
  }

  // 5. DELETE /api/plugins/:id
  const deleteMatch = pathname.match(/^\/(?:api\/)?plugins\/([a-zA-Z0-9_-]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    const pluginId = deleteMatch[1];
    const pDir = path.join(PLUGINS_DIR, pluginId);

    if (!existsSync(pDir)) {
      sendJson(res, 404, { error: "Плагин не существует" });
      return;
    }

    try {
      await rm(pDir, { recursive: true, force: true });
      sendJson(res, 200, { success: true, message: `Плагин ${pluginId} удален с сервера` });
    } catch (err) {
      sendJson(res, 500, { error: "Не удалось удалить плагин", details: err?.message });
    }
    return;
  }

  sendJson(res, 404, { error: "Маршрут не найден" });
});

await ensurePluginsDir();

server.listen(PORT, "0.0.0.0", () => {
  console.log("\x1b[35m%s\x1b[0m", "==================================================");
  console.log("\x1b[35m%s\x1b[0m", `🧩 SNAPI PLUGINS & MARKETPLACE SERVER RUNNING!`);
  console.log("\x1b[35m%s\x1b[0m", `👉 URL: http://127.0.0.1:${PORT}`);
  console.log("\x1b[35m%s\x1b[0m", `👉 Healthcheck: http://127.0.0.1:${PORT}/health`);
  console.log("\x1b[35m%s\x1b[0m", `👉 Plugins API: http://127.0.0.1:${PORT}/api/plugins`);
  console.log("\x1b[35m%s\x1b[0m", "==================================================");
});
