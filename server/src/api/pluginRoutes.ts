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

// 1. Официальный демонстрационный плагин: Interactive Action Card (SDK)
const DEFAULT_ACTION_CARD_PLUGIN: PluginManifest = {
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
const DEFAULT_AURORA_PLUGIN: PluginManifest = {
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
  const defaults = [DEFAULT_ACTION_CARD_PLUGIN, DEFAULT_AURORA_PLUGIN];
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
