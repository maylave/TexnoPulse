import { mkdir, readFile, readdir, stat, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { ServerResponse, IncomingMessage } from "node:http";
import type { HttpRoute } from "./wsServer.js";

const PLUGINS_DIR = path.resolve("data/plugins");

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  desc: string;
  author: string;
  icon: string;
  categoryId: "visual" | "ai" | "sync" | "utils";
  downloads?: number;
  rating?: number;
  hasTheme?: boolean;
  styles?: string;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Первый официальный плагин: Cyberpunk Neon Theme
const DEFAULT_CYBERPUNK_PLUGIN: PluginManifest = {
  id: "cyberpunk-neon",
  name: "Cyberpunk Neon Theme",
  version: "1.0.0",
  desc: "Футуристическая неоновая киберпанк-тема с глубоким темным фоном, неоновым свечением и стилизованными эффектами чата.",
  author: "Snapi Team",
  icon: "Sparkles",
  categoryId: "visual",
  downloads: 240,
  rating: 4.95,
  hasTheme: true,
  createdAt: new Date().toISOString(),
  styles: `
    /* Cyberpunk Neon Theme for Snapi */
    :root[data-plugin-theme="cyberpunk-neon"],
    body[data-plugin-theme="cyberpunk-neon"] {
      --sidebar-bg: #070913 !important;
      --color-surface: #0a0d1a !important;
      --color-surface-container: #0f1426 !important;
      --color-surface-container-high: #161c36 !important;
      --glass-border: rgba(0, 242, 254, 0.25) !important;
      --color-primary: #00f2fe !important;
      --accent: #00f2fe !important;
      --neon-glow: 0 0 15px rgba(0, 242, 254, 0.45);
    }

    [data-plugin-theme="cyberpunk-neon"] .liquid-glass {
      border-color: rgba(0, 242, 254, 0.2) !important;
      box-shadow: 0 0 25px rgba(0, 242, 254, 0.08), inset 0 0 15px rgba(79, 172, 254, 0.05) !important;
    }

    [data-plugin-theme="cyberpunk-neon"] .glass-modal {
      border: 1px solid rgba(0, 242, 254, 0.3) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.15) !important;
    }
  `,
  code: `
    export default {
      install(context) {
        console.log('[Plugin: Cyberpunk Neon] Активирован успешно!');
        context.showNotification('Cyberpunk Neon', 'Тема Cyberpunk Neon успешно активирована!');
      },
      uninstall(context) {
        console.log('[Plugin: Cyberpunk Neon] Деактивирован.');
      }
    };
  `,
};

// Второй официальный плагин: Matrix Rain Effect
const DEFAULT_MATRIX_PLUGIN: PluginManifest = {
  id: "matrix-effect",
  name: "Matrix Code Canvas",
  version: "1.1.0",
  desc: "Цифровой дождь символов в стиле Матрицы в фоне чатов. Высокая производительность и стильная неоновая анимация.",
  author: "HackerOne",
  icon: "FileCode",
  categoryId: "visual",
  downloads: 185,
  rating: 4.8,
  hasTheme: true,
  createdAt: new Date().toISOString(),
  styles: `
    :root[data-plugin-theme="matrix-effect"] {
      --accent: #00ff66 !important;
      --glass-border: rgba(0, 255, 102, 0.2) !important;
    }
    [data-plugin-theme="matrix-effect"] .liquid-glass {
      border-color: rgba(0, 255, 102, 0.25) !important;
      box-shadow: 0 0 20px rgba(0, 255, 102, 0.1) !important;
    }
  `,
  code: `
    export default {
      install(context) {
        context.showNotification('Matrix Code', 'Эффект Matrix Code успешно подключен!');
      },
      uninstall(context) {
        console.log('[Plugin: Matrix Code] Отключен');
      }
    };
  `,
};

// Третий плагин: Quick Notes & Scratchpad
const DEFAULT_NOTES_PLUGIN: PluginManifest = {
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
  `,
};

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function ensurePluginsDir() {
  await mkdir(PLUGINS_DIR, { recursive: true });

  // Создаем дефолтные плагины, если их еще нет
  const defaults = [DEFAULT_CYBERPUNK_PLUGIN, DEFAULT_MATRIX_PLUGIN, DEFAULT_NOTES_PLUGIN];
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

export const pluginRoutes: HttpRoute = async (req, res, url) => {
  const p = url.pathname;

  // 1. GET /api/plugins или GET /plugins — список доступных плагинов
  if (req.method === "GET" && (p === "/api/plugins" || p === "/plugins")) {
    try {
      await ensurePluginsDir();
      const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });
      const plugins: PluginManifest[] = [];

      for (const ent of entries) {
        if (ent.isDirectory()) {
          const manifestPath = path.join(PLUGINS_DIR, ent.name, "manifest.json");
          if (existsSync(manifestPath)) {
            try {
              const raw = await readFile(manifestPath, "utf8");
              const manifest: PluginManifest = JSON.parse(raw);
              plugins.push(manifest);
            } catch {}
          }
        }
      }

      // Возвращаем в стандартном формате { data: [...] }
      sendJson(res, 200, { data: plugins, count: plugins.length });
    } catch (e: any) {
      sendJson(res, 500, { error: "Не удалось получить список плагинов", details: e?.message });
    }
    return true;
  }

  // 2. GET /api/plugins/:id/download или /plugins/:id/download — скачивание пакета плагина
  const downloadMatch = p.match(/^\/(?:api\/)?plugins\/([a-zA-Z0-9_-]+)\/download$/);
  if (req.method === "GET" && downloadMatch) {
    const pluginId = downloadMatch[1];
    const pDir = path.join(PLUGINS_DIR, pluginId);
    const manifestPath = path.join(pDir, "manifest.json");

    if (!existsSync(manifestPath)) {
      sendJson(res, 404, { error: "Плагин не найден" });
      return true;
    }

    try {
      const manifestRaw = await readFile(manifestPath, "utf8");
      const manifest: PluginManifest = JSON.parse(manifestRaw);

      let code = manifest.code || "";
      let styles = manifest.styles || "";

      if (existsSync(path.join(pDir, "bundle.js"))) {
        code = await readFile(path.join(pDir, "bundle.js"), "utf8");
      }
      if (existsSync(path.join(pDir, "theme.css"))) {
        styles = await readFile(path.join(pDir, "theme.css"), "utf8");
      }

      // Увеличиваем счетчик скачиваний
      manifest.downloads = (manifest.downloads || 0) + 1;
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      sendJson(res, 200, {
        manifest,
        code,
        styles,
        downloadedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      sendJson(res, 500, { error: "Ошибка скачивания плагина", details: e?.message });
    }
    return true;
  }

  // 3. GET /api/plugins/:id — детальная информация о плагине
  const getMatch = p.match(/^\/(?:api\/)?plugins\/([a-zA-Z0-9_-]+)$/);
  if (req.method === "GET" && getMatch) {
    const pluginId = getMatch[1];
    const manifestPath = path.join(PLUGINS_DIR, pluginId, "manifest.json");

    if (!existsSync(manifestPath)) {
      sendJson(res, 404, { error: "Плагин не найден" });
      return true;
    }

    try {
      const raw = await readFile(manifestPath, "utf8");
      sendJson(res, 200, JSON.parse(raw));
    } catch {
      sendJson(res, 500, { error: "Не удалось прочитать плагин" });
    }
    return true;
  }

  // 4. POST /api/plugins/upload или /plugins/upload — загрузка стороннего плагина на сервер
  if (req.method === "POST" && (p === "/api/plugins/upload" || p === "/plugins/upload")) {
    try {
      await ensurePluginsDir();
      const bodyRaw = await readBody(req);
      let payload: Partial<PluginManifest>;

      try {
        payload = JSON.parse(bodyRaw);
      } catch {
        sendJson(res, 400, { error: "Тело запроса должно быть валидным JSON манифестом" });
        return true;
      }

      if (!payload.name || !payload.id) {
        sendJson(res, 400, { error: "Поля 'id' и 'name' обязательны" });
        return true;
      }

      // Санитизация ID плагина
      const cleanId = payload.id.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      const pluginDir = path.join(PLUGINS_DIR, cleanId);
      await mkdir(pluginDir, { recursive: true });

      const newManifest: PluginManifest = {
        id: cleanId,
        name: payload.name.trim(),
        version: payload.version || "1.0.0",
        desc: payload.desc || "Сторонний плагин для Snapi",
        author: payload.author || "Сторонний автор",
        icon: payload.icon || "Puzzle",
        categoryId: payload.categoryId || "visual",
        downloads: payload.downloads || 0,
        rating: payload.rating || 5.0,
        hasTheme: Boolean(payload.hasTheme || (payload.styles && payload.styles.trim().length > 0)),
        styles: payload.styles || "",
        code: payload.code || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await writeFile(path.join(pluginDir, "manifest.json"), JSON.stringify(newManifest, null, 2));
      if (newManifest.code) {
        await writeFile(path.join(pluginDir, "bundle.js"), newManifest.code);
      }
      if (newManifest.styles) {
        await writeFile(path.join(pluginDir, "theme.css"), newManifest.styles);
      }

      console.log(`[Plugin System] Опубликован новый сторонний плагин: ${newManifest.name} (${newManifest.id})`);
      sendJson(res, 201, { success: true, plugin: newManifest });
    } catch (e: any) {
      sendJson(res, 500, { error: "Ошибка сохранения плагина", details: e?.message });
    }
    return true;
  }

  // 5. DELETE /api/plugins/:id — удаление плагина с сервера
  const deleteMatch = p.match(/^\/(?:api\/)?plugins\/([a-zA-Z0-9_-]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    const pluginId = deleteMatch[1];
    const pluginDir = path.join(PLUGINS_DIR, pluginId);

    if (!existsSync(pluginDir)) {
      sendJson(res, 404, { error: "Плагин не существует" });
      return true;
    }

    try {
      await rm(pluginDir, { recursive: true, force: true });
      sendJson(res, 200, { success: true, message: `Плагин ${pluginId} удален` });
    } catch (e: any) {
      sendJson(res, 500, { error: "Не удалось удалить плагин", details: e?.message });
    }
    return true;
  }

  return false;
};
