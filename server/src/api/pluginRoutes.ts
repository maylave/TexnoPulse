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
  `,
};

// Второй официальный плагин: Matrix Code
const DEFAULT_MATRIX_PLUGIN: PluginManifest = {
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
  `,
};

// Третий плагин: Pomodoro Focus Timer
const DEFAULT_POMODORO_PLUGIN: PluginManifest = {
  id: "pomodoro-timer",
  name: "Pomodoro Focus Timer",
  version: "1.2.0",
  desc: "Интерактивный плавающий таймер продуктивности с режимами фокуса (25 мин), отдыха (5 мин), звуковым сигналом и системными уведомлениями.",
  author: "FocusLab",
  icon: "Timer",
  categoryId: "utils",
  downloads: 412,
  rating: 4.98,
  hasTheme: false,
  createdAt: new Date().toISOString(),
  styles: `
    .snapi-pomodoro-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: inherit;
      user-select: none;
    }
    .snapi-pomodoro-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 9999px;
      background: rgba(11, 17, 32, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 242, 254, 0.35);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 242, 254, 0.25);
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .snapi-pomodoro-badge:hover {
      transform: translateY(-2px) scale(1.04);
      border-color: rgba(0, 242, 254, 0.6);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7), 0 0 22px rgba(0, 242, 254, 0.4);
    }
    .snapi-pomodoro-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 270px;
      padding: 18px;
      border-radius: 22px;
      background: rgba(11, 17, 32, 0.94);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.15);
      color: #fff;
      animation: snapiPomoFadeIn 0.25s ease-out;
    }
    @keyframes snapiPomoFadeIn {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `,
  code: `
    export default {
      install(context) {
        console.log('[Pomodoro Plugin] Инициализирован');
        context.showNotification('Pomodoro Timer', 'Таймер фокуса готов к работе!');

        let duration = 25 * 60;
        let remaining = duration;
        let timerId = null;
        let isRunning = false;
        let isCollapsed = false;
        let currentMode = 'focus';

        const container = document.createElement('div');
        container.id = 'snapi-plugin-pomodoro';
        container.className = 'snapi-pomodoro-container';

        function formatTime(sec) {
          const m = Math.floor(sec / 60).toString().padStart(2, '0');
          const s = (sec % 60).toString().padStart(2, '0');
          return m + ':' + s;
        }

        function playChime() {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
          } catch (e) {}
        }

        function render() {
          if (isCollapsed) {
            container.innerHTML = '<div id=\"snapi-pomo-badge\" class=\"snapi-pomodoro-badge\">' +
              '<span style=\"font-size: 16px;\">' + (currentMode === 'focus' ? '🍅' : '☕') + '</span>' +
              '<span>' + formatTime(remaining) + '</span>' +
              '<span style=\"font-size: 11px; opacity: 0.7;\">' + (isRunning ? '▶' : '⏸') + '</span>' +
            '</div>';
            const badge = container.querySelector('#snapi-pomo-badge');
            badge && badge.addEventListener('click', () => {
              isCollapsed = false;
              render();
            });
            return;
          }

          const progress = ((duration - remaining) / duration) * 100;
          const themeColor = currentMode === 'focus' ? '#00f2fe' : (currentMode === 'shortBreak' ? '#10b981' : '#a855f7');

          container.innerHTML = '<div class=\"snapi-pomodoro-panel\">' +
            '<div style=\"display: flex; justify-content: space-between; align-items: center;\">' +
              '<div style=\"display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px;\">' +
                '<span>🍅</span>' +
                '<span>Pomodoro Фокус</span>' +
              '</div>' +
              '<button id=\"snapi-pomo-minimize\" style=\"background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 2px 6px; border-radius: 6px; font-size: 14px;\" title=\"Свернуть\">_</button>' +
            '</div>' +

            '<div style=\"display: flex; gap: 4px; background: rgba(255,255,255,0.06); padding: 3px; border-radius: 12px;\">' +
              '<button class=\"snapi-pomo-mode\" data-mode=\"focus\" style=\"flex: 1; padding: 5px; font-size: 10px; font-weight: 600; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; ' + (currentMode === 'focus' ? 'background: #00f2fe; color: #020617;' : 'background: transparent; color: #94a3b8;') + '\">Фокус 25м</button>' +
              '<button class=\"snapi-pomo-mode\" data-mode=\"shortBreak\" style=\"flex: 1; padding: 5px; font-size: 10px; font-weight: 600; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; ' + (currentMode === 'shortBreak' ? 'background: #10b981; color: #020617;' : 'background: transparent; color: #94a3b8;') + '\">Отдых 5м</button>' +
              '<button class=\"snapi-pomo-mode\" data-mode=\"longBreak\" style=\"flex: 1; padding: 5px; font-size: 10px; font-weight: 600; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; ' + (currentMode === 'longBreak' ? 'background: #a855f7; color: #ffffff;' : 'background: transparent; color: #94a3b8;') + '\">Пауза 15м</button>' +
            '</div>' +

            '<div style=\"text-align: center; padding: 8px 0;\">' +
              '<div style=\"font-size: 38px; font-weight: 800; letter-spacing: -1px; font-family: monospace; color: ' + themeColor + '; text-shadow: 0 0 20px ' + themeColor + '40;\">' +
                formatTime(remaining) +
              '</div>' +
              '<div style=\"font-size: 11px; color: #94a3b8; margin-top: 2px;\">' +
                (currentMode === 'focus' ? 'Концентрация на задачах' : 'Время перевести дух') +
              '</div>' +
            '</div>' +

            '<div style=\"width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden;\">' +
              '<div style=\"width: ' + progress + '%; height: 100%; background: ' + themeColor + '; transition: width 0.3s;\"></div>' +
            '</div>' +

            '<div style=\"display: flex; gap: 8px; margin-top: 4px;\">' +
              '<button id=\"snapi-pomo-toggle\" style=\"flex: 1; padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: ' + (isRunning ? 'rgba(239, 68, 68, 0.2)' : themeColor) + '; color: ' + (isRunning ? '#f87171' : '#020617') + '; border: ' + (isRunning ? '1px solid rgba(239, 68, 68, 0.4)' : 'none') + '; box-shadow: ' + (isRunning ? 'none' : '0 4px 15px ' + themeColor + '40') + '; transition: all 0.2s;\">' +
                (isRunning ? 'Пауза ⏸' : 'Старт ▶') +
              '</button>' +
              '<button id=\"snapi-pomo-reset\" style=\"padding: 8px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; transition: all 0.2s;\" title=\"Сбросить время\">' +
                '↺' +
              '</button>' +
            '</div>' +
          '</div>';

          container.querySelector('#snapi-pomo-minimize')?.addEventListener('click', () => {
            isCollapsed = true;
            render();
          });

          container.querySelectorAll('.snapi-pomo-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const mode = e.currentTarget.getAttribute('data-mode');
              currentMode = mode;
              if (mode === 'focus') duration = 25 * 60;
              else if (mode === 'shortBreak') duration = 5 * 60;
              else if (mode === 'longBreak') duration = 15 * 60;
              remaining = duration;
              if (timerId) { clearInterval(timerId); timerId = null; isRunning = false; }
              render();
            });
          });

          container.querySelector('#snapi-pomo-toggle')?.addEventListener('click', () => {
            if (isRunning) {
              clearInterval(timerId);
              timerId = null;
              isRunning = false;
            } else {
              isRunning = true;
              timerId = setInterval(() => {
                if (remaining > 0) {
                  remaining--;
                  render();
                } else {
                  clearInterval(timerId);
                  timerId = null;
                  isRunning = false;
                  playChime();
                  context.showNotification(
                    '🍅 Pomodoro Таймер',
                    currentMode === 'focus' ? 'Время работы завершено! Пора отдохнуть.' : 'Перерыв окончен! Возвращаемся к делам.'
                  );
                  render();
                }
              }, 1000);
            }
            render();
          });

          container.querySelector('#snapi-pomo-reset')?.addEventListener('click', () => {
            if (timerId) { clearInterval(timerId); timerId = null; isRunning = false; }
            remaining = duration;
            render();
          });
        }

        render();
        document.body.appendChild(container);
      },

      uninstall(context) {
        console.log('[Pomodoro Plugin] Отключен');
        const existing = document.getElementById('snapi-plugin-pomodoro');
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }
    };
  `,
};

// Четвертый плагин: Quick Notes & Scratchpad
const DEFAULT_NOTES_PLUGIN: PluginManifest = {
  id: "quick-notes",
  name: "Quick Notes & Scratchpad",
  version: "1.0.2",
  desc: "Встроенный блокнот для быстрых заметок, списков задач и сниппетов кода с автосохранением на ПК.",
  author: "DevAlex",
  icon: "FileText",
  categoryId: "utils",
  downloads: 330,
  rating: 4.92,
  hasTheme: false,
  createdAt: new Date().toISOString(),
  styles: `
    .snapi-quicknotes-container {
      position: fixed;
      bottom: 84px;
      right: 24px;
      z-index: 999998;
      font-family: inherit;
      user-select: none;
    }
    .snapi-quicknotes-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 9999px;
      background: rgba(11, 17, 32, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05);
      color: #fff;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .snapi-quicknotes-badge:hover {
      transform: translateY(-2px) scale(1.04);
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.2);
    }
    .snapi-quicknotes-modal {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 320px;
      padding: 16px;
      border-radius: 20px;
      background: rgba(11, 17, 32, 0.94);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.1);
      color: #fff;
      animation: snapiQnFadeIn 0.25s ease-out;
    }
    @keyframes snapiQnFadeIn {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `,
  code: `
    export default {
      install(context) {
        console.log('[Plugin: Quick Notes] Активирован');
        context.showNotification('Quick Notes', 'Блокнот для заметок открыт!');

        const STORAGE_KEY = 'snapi_scratchpad_notes';
        let isOpen = false;

        const container = document.createElement('div');
        container.id = 'snapi-plugin-quicknotes';
        container.className = 'snapi-quicknotes-container';

        function render() {
          const savedText = localStorage.getItem(STORAGE_KEY) || '';

          if (!isOpen) {
            container.innerHTML = '<button id=\"snapi-qn-badge\" class=\"snapi-quicknotes-badge\" title=\"Открыть быстрый блокнот\">' +
              '<span>📝</span>' +
              '<span style=\"font-weight: 600; font-size: 12px;\">Заметки</span>' +
            '</button>';
            container.querySelector('#snapi-qn-badge')?.addEventListener('click', () => {
              isOpen = true;
              render();
            });
            return;
          }

          container.innerHTML = '<div class=\"snapi-quicknotes-modal\">' +
            '<div style=\"display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);\">' +
              '<div style=\"display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px;\">' +
                '<span>📝</span>' +
                '<span>Быстрый блокнот</span>' +
              '</div>' +
              '<div style=\"display: flex; gap: 6px;\">' +
                '<button id=\"snapi-qn-copy\" style=\"background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; cursor: pointer; padding: 3px 8px; border-radius: 8px; font-size: 11px;\" title=\"Скопировать всё\">Копировать</button>' +
                '<button id=\"snapi-qn-close\" style=\"background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 2px 6px; border-radius: 6px; font-size: 14px;\" title=\"Свернуть\">✕</button>' +
              '</div>' +
            '</div>' +
            '<textarea id=\"snapi-qn-text\" placeholder=\"Введите быстрые мысли, задачи или сниппеты кода...\" style=\"width: 100%; height: 160px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #f8fafc; font-size: 12px; font-family: monospace; padding: 10px; resize: none; outline: none; box-sizing: border-box;\"></textarea>' +
            '<div style=\"display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; padding-top: 4px;\">' +
              '<span id=\"snapi-qn-status\">Автосохранение активно</span>' +
              '<button id=\"snapi-qn-clear\" style=\"background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 10px;\">Очистить</button>' +
            '</div>' +
          '</div>';

          const textarea = container.querySelector('#snapi-qn-text');
          if (textarea) {
            textarea.value = savedText;
            textarea.focus();
            textarea.addEventListener('input', (e) => {
              localStorage.setItem(STORAGE_KEY, e.target.value);
              const status = container.querySelector('#snapi-qn-status');
              if (status) {
                status.textContent = 'Сохранено ✓';
                setTimeout(() => { if (status) status.textContent = 'Автосохранение активно'; }, 1000);
              }
            });
          }

          container.querySelector('#snapi-qn-close')?.addEventListener('click', () => {
            isOpen = false;
            render();
          });

          container.querySelector('#snapi-qn-copy')?.addEventListener('click', () => {
            const text = localStorage.getItem(STORAGE_KEY) || '';
            if (text) {
              navigator.clipboard.writeText(text);
              const copyBtn = container.querySelector('#snapi-qn-copy');
              if (copyBtn) {
                copyBtn.textContent = 'Скопировано!';
                setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Копировать'; }, 1500);
              }
            }
          });

          container.querySelector('#snapi-qn-clear')?.addEventListener('click', () => {
            if (confirm('Очистить текст блокнота?')) {
              localStorage.removeItem(STORAGE_KEY);
              if (textarea) textarea.value = '';
            }
          });
        }

        render();
        document.body.appendChild(container);
      },

      uninstall(context) {
        console.log('[Plugin: Quick Notes] Отключен');
        const existing = document.getElementById('snapi-plugin-quicknotes');
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
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
  const defaults = [DEFAULT_CYBERPUNK_PLUGIN, DEFAULT_MATRIX_PLUGIN, DEFAULT_POMODORO_PLUGIN, DEFAULT_NOTES_PLUGIN];
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
