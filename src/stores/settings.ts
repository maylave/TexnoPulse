import { api } from "@/api/client";
import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { useThemeStore } from "@/stores/theme"; // поправь путь под свой файл
import type { SettingDefinition, SettingValue } from "@/types/settings";

const STORAGE_KEY = "appSettings";
const SIZE_MAP: Record<number, string> = {
  1: "w-8 h-8 top-2 left-2",
  2: "w-10 h-10 top-1 left-1",
  3: "w-12 h-12 top-0 left0",
};
export type Side = "left" | "right";

function load(): Record<string, SettingValue> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const cssVars = (def: SettingDefinition): string[] => {
  const v = def.css?.var;
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
};

export const useSettingsStore = defineStore("settings", () => {
  const theme = useThemeStore();
  const values = ref<Record<string, SettingValue>>(load());
  const sizeAvatar = ref<number>(2);
  watch(
    values,
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values.value));
      } catch {
        /* localStorage недоступен: не сохраняем */
      }
    },
    { deep: true },
  );
  // Синхронизация настроек уведомлений с бэкендом
  const syncNotificationsToBackend = () => {
    try {
      api.request("settings:notifications:update", {
        enabled: values.value.notifications_enabled !== false,
        sound: values.value.notifications_sound !== false,
        startup: values.value.notifications_startup !== false,
        messages: values.value.notifications_messages !== false,
        devices: values.value.notifications_devices !== false,
      }).catch(() => {});
    } catch {}
  };

  watch(
    () => [
      values.value.notifications_enabled,
      values.value.notifications_sound,
      values.value.notifications_startup,
      values.value.notifications_messages,
      values.value.notifications_devices,
    ],
    () => {
      syncNotificationsToBackend();
    }
  );

  api.onOpen(async () => {
    try {
      const serverNotifs = await api.request("settings:notifications:get");
      if (serverNotifs) {
        if (values.value.notifications_enabled === undefined) values.value.notifications_enabled = serverNotifs.enabled;
        if (values.value.notifications_sound === undefined) values.value.notifications_sound = serverNotifs.sound;
        if (values.value.notifications_startup === undefined) values.value.notifications_startup = serverNotifs.startup;
        if (values.value.notifications_messages === undefined) values.value.notifications_messages = serverNotifs.messages;
        if (values.value.notifications_devices === undefined) values.value.notifications_devices = serverNotifs.devices;
      }
    } catch {}
  });

  const getSizeAvatarHeader = (): string => {
    const rawSize = Number();
    const clampedSize = Math.max(1, Math.min(3, rawSize));
    return SIZE_MAP[clampedSize] ?? "w-10 h-10 top-1 left-1";
  };
  // Выключатель анимаций: глобальное правило в main.css смотрит на этот атрибут
  watch(
    () => values.value.animations_enabled,
    (on) => {
      document.documentElement.dataset.animations = on === false ? "off" : "on";
    },
    { immediate: true },
  );

  const get = (def: SettingDefinition): SettingValue => {
    if (def.css) {
      const name = cssVars(def)[0];
      if (!name) return def.defaultValue;

      const raw = theme.overrides[name]; // читаем реактивно

      if (typeof def.defaultValue === "number") {
        if (raw === undefined) return def.defaultValue;
        const n = parseFloat(raw);
        if (Number.isNaN(n)) return def.defaultValue;
        return def.css.scale ? Math.round(n / def.css.scale) : n;
      }

      // Цвета: пока не переопределён, показываем текущее значение из CSS
      return raw ?? (theme.getVar(name) || def.defaultValue);
    }

    return values.value[def.id] ?? def.defaultValue;
  };

  const set = (def: SettingDefinition, value: SettingValue) => {
    if (def.css) {
      const names = cssVars(def);

      // Число вернули к значению по умолчанию: убираем переопределение
      if (typeof value === "number" && value === def.defaultValue) {
        names.forEach((n) => theme.resetVar(n));
        return;
      }

      const css =
        typeof value === "number"
          ? `${def.css.scale ? +(value * def.css.scale).toFixed(4) : value}${def.css.unit ?? ""}`
          : String(value);

      theme.setVars(Object.fromEntries(names.map((n) => [n, css])));
      return;
    }

    values.value[def.id] = value;
  };

  /** Изменена ли настройка относительно значения по умолчанию */
  const isModified = (def: SettingDefinition): boolean => {
    if (def.css) {
      return cssVars(def).some((n) => theme.overrides[n] !== undefined);
    }
    return def.id in values.value && values.value[def.id] !== def.defaultValue;
  };

  /** Сбросить одну настройку */
  const reset = (def: SettingDefinition) => {
    if (def.css) {
      cssVars(def).forEach((n) => theme.resetVar(n));
    } else {
      delete values.value[def.id];
    }
  };

  /** Сторона пузыря: свои/чужие или все с одной стороны */
  const getSide = (isOwn: boolean): Side => {
    const split = (values.value.split_messages_by_sender ?? true) as boolean;
    const side = (values.value.messages_side ?? "left") as Side;
    if (!split) return side;
    return isOwn ? "right" : "left";
  };

  const resetAppearance = () => theme.resetTheme();

  const resetAll = () => {
    values.value = {};
    theme.resetTheme();
  };

  return {
    SIZE_MAP,
    sizeAvatar,
    values,
    get,
    set,
    isModified,
    reset,
    getSide,
    resetAppearance,
    resetAll,
  };
});
