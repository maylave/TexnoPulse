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

// 1. Официальный демонстрационный плагин: Interactive Action Card (SDK)
const DEFAULT_ACTION_CARD = {
  id: "action-card",
  name: "Interactive Action Card",
  version: "1.0.0",
  desc: "Демонстрационный плагин нового SDK: регистрирует интерактивный тип сообщений action-card, изолированное хранилище и всплывающие уведомления.",
  author: "Snapi SDK Team",
  icon: "FileCode",
  categoryId: "utils",
  downloads: 120,
  rating: 5.0,
  hasTheme: false,
  createdAt: new Date().toISOString(),
  styles: "",
  code: `
    export default {
      install(snapi) {
        console.log('[Plugin: Action Card] Инициализирован через Snapi SDK');

        const runCount = (snapi.storage.get('runCount', 0) || 0) + 1;
        snapi.storage.set('runCount', runCount);

        snapi.ui.showToast('Action Card активирован (запуск #' + runCount + ')', 'success');

        snapi.messages.registerBlock('action-card', {
          containerClass: 'w-full my-1',
          render(container, block) {
            const title = block.title || 'Новая задача';
            const status = block.status || 'В процессе';
            const priority = block.priority || 'Высокий';

            container.innerHTML = '<div class="p-3.5 rounded-xl bg-white/[0.04] border border-sky-500/30 backdrop-blur-md flex flex-col gap-2">' +
              '<div class="flex items-center justify-between">' +
                '<span class="text-xs font-semibold text-sky-400">⚡ Action Card</span>' +
                '<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">' + priority + '</span>' +
              '</div>' +
              '<div class="text-sm font-medium text-white">' + title + '</div>' +
              '<div class="flex items-center justify-between pt-2 border-t border-white/10 text-xs">' +
                '<span class="text-slate-400 text-[11px]">Статус: <strong class="text-slate-200">' + status + '</strong></span>' +
                '<button class="snapi-act-complete px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-[11px] transition-colors cursor-pointer">' +
                  'Завершить' +
                '</button>' +
              '</div>' +
            '</div>';

            const btn = container.querySelector('.snapi-act-complete');
            const clickHandler = () => {
              snapi.ui.showToast('Задача "' + title + '" выполнена!', 'success');
              if (btn) {
                btn.textContent = 'Готово ✓';
                btn.style.background = '#22c55e';
                btn.style.color = '#fff';
              }
            };
            btn && btn.addEventListener('click', clickHandler);

            return () => {
              btn && btn.removeEventListener('click', clickHandler);
            };
          }
        });

        this._widget = snapi.ui.addFloatingWidget({
          position: 'bottom-right',
          html: '<button id="snapi-action-demo-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 9999px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">' +
            '<span>⚡</span>' +
            '<span>Action Card SDK</span>' +
          '</button>',
          onMount(el) {
            el.querySelector('#snapi-action-demo-btn')?.addEventListener('click', () => {
              snapi.ui.showToast('Новый тип сообщения "action-card" зарегистрирован и готов к рендеру', 'info');
            });
          }
        });
      },

      uninstall(snapi) {
        console.log('[Plugin: Action Card] Отключен');
        snapi.messages.unregisterBlock('action-card');
        if (this._widget) {
          this._widget.remove();
        }
        snapi.ui.showToast('Action Card деактивирован', 'info');
      }
    };
  `
};

// 2. Официальная тема: Aurora Borealis Theme (SDK)
const DEFAULT_AURORA = {
  id: "aurora-theme",
  name: "Aurora Borealis Theme",
  version: "1.0.0",
  desc: "Пример темы оформления на базе snapi.theme.setTokens: глубокие бирюзовые и изумрудные тона северного сияния.",
  author: "Snapi SDK Team",
  icon: "Palette",
  categoryId: "visual",
  downloads: 95,
  rating: 4.9,
  hasTheme: true,
  createdAt: new Date().toISOString(),
  styles: "",
  code: `
    export default {
      install(snapi) {
        snapi.theme.setTokens({
          '--color-background': '#040d12',
          '--sidebar-bg': '#07161e',
          '--color-surface': '#0b1d28',
          '--color-surface-container': '#0f2736',
          '--color-surface-container-high': '#14354a',
          '--color-accent': '#14b8a6',
          '--color-accent-hover': '#2dd4bf',
          '--color-primary': '#14b8a6',
          '--color-outline': '#14b8a6',
          '--liquid-glass-border': '1px solid rgba(20, 184, 166, 0.35)',
          '--liquid-glass-shadow': '0 0 25px rgba(20, 184, 166, 0.15)'
        });
        snapi.ui.showToast('Тема Aurora Borealis активирована', 'success');
      },
      uninstall(snapi) {
        snapi.theme.reset();
      }
    };
  `
};

async function ensurePluginsDir() {
  await mkdir(PLUGINS_DIR, { recursive: true });
  const defaults = [DEFAULT_ACTION_CARD, DEFAULT_AURORA];
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

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\x1b[33m[Plugins Server] Порт ${PORT} уже занят. Сервер плагинов уже работает в фоне.\x1b[0m`);
    process.exit(0);
  } else {
    console.error("[Plugins Server] Ошибка сервера:", err);
    process.exit(1);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\x1b[35m%s\x1b[0m", "==================================================");
  console.log("\x1b[35m%s\x1b[0m", `🧩 SNAPI PLUGINS & MARKETPLACE SERVER RUNNING!`);
  console.log("\x1b[35m%s\x1b[0m", `👉 URL: http://127.0.0.1:${PORT}`);
  console.log("\x1b[35m%s\x1b[0m", `👉 Healthcheck: http://127.0.0.1:${PORT}/health`);
  console.log("\x1b[35m%s\x1b[0m", `👉 Plugins API: http://127.0.0.1:${PORT}/api/plugins`);
  console.log("\x1b[35m%s\x1b[0m", "==================================================");
});
