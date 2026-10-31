// src/stores/settings.ts
import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { useThemeStore } from "@/stores/theme"; // поправь путь под свой файл
import type {
  SettingDefinition,
  SettingValue,
  HotkeyValue,
} from "@/types/settings";
import { DEFAULT_HOTKEYS, type HotkeyBinding } from "@/config/hotkeys";

const STORAGE_KEY = "appSettings";

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

/** Преобразует значение настройки в формат биндинга для глобального слушателя */
const toHotkeyBinding = (val: SettingValue): Partial<HotkeyBinding> => {
  if (typeof val === "object" && val !== null && "key" in val) {
    return val as unknown as Partial<HotkeyBinding>;
  }
  return {};
};

export const useSettingsStore = defineStore("settings", () => {
  const theme = useThemeStore();
  const values = ref<Record<string, SettingValue>>(load());

  // Сохранение в localStorage при любых изменениях
  watch(
    values,
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values.value));
      } catch {
        /* localStorage недоступен */
      }
    },
    { deep: true },
  );

  // Глобальный выключатель анимаций
  watch(
    () => values.value.animations_enabled,
    (on) => {
      document.documentElement.dataset.animations = on === false ? "off" : "on";
    },
    { immediate: true },
  );

  // Синхронизация хоткеев из настроек в тему/глобальный слушатель
  // Если у тебя есть отдельный useGlobalHotkeys(), вызывай его обновление здесь
  watch(
    () => values.value,
    (newValues) => {
      Object.entries(newValues).forEach(([id, val]) => {
        if (id.startsWith("hk_") && typeof val === "object") {
          // Здесь можно вызвать метод обновления глобальных хоткеев
          // Например: updateGlobalHotkey(id.replace("hk_", ""), val as HotkeyValue);
          console.log(`[Hotkey] Updated ${id}:`, val);
        }
      });
    },
    { deep: true },
  );

  const get = (def: SettingDefinition): SettingValue => {
    if (def.css) {
      const name = cssVars(def)[0];
      if (!name) return def.defaultValue;

      const raw = theme.overrides[name];

      if (typeof def.defaultValue === "number") {
        if (raw === undefined) return def.defaultValue;
        const n = parseFloat(raw);
        if (Number.isNaN(n)) return def.defaultValue;
        return def.css.scale ? Math.round(n / def.css.scale) : n;
      }

      return raw ?? (theme.getVar(name) || def.defaultValue);
    }

    return values.value[def.id] ?? def.defaultValue;
  };

  const set = (def: SettingDefinition, value: SettingValue) => {
    if (def.css) {
      const names = cssVars(def);

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

  const isModified = (def: SettingDefinition): boolean => {
    if (def.css) {
      return cssVars(def).some((n) => theme.overrides[n] !== undefined);
    }
    return def.id in values.value && values.value[def.id] !== def.defaultValue;
  };

  const reset = (def: SettingDefinition) => {
    if (def.css) {
      cssVars(def).forEach((n) => theme.resetVar(n));
    } else {
      delete values.value[def.id];
    }
  };

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
    // Сброс хоткеев происходит автоматически, так как они удаляются из values
    // и при следующем чтении get() вернет defaultValue из конфига
  };

  /** Получить текущее значение хоткея по ID настройки */
  const getHotkey = (settingId: string): HotkeyValue | undefined => {
    const val = values.value[settingId];
    if (typeof val === "object" && val !== null && "key" in val) {
      return val as HotkeyValue;
    }
    return undefined;
  };

  return {
    values,
    get,
    set,
    isModified,
    reset,
    getSide,
    resetAppearance,
    resetAll,
    getHotkey,
  };
});
