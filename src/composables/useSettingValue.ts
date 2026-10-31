import { useThemeStore } from "@/stores/theme"; // поправь путь под свой файл
import type { SettingDefinition, SettingValue } from "@/types/settings";

export function useSettingValue(
  fallbackGet: (id: string) => SettingValue,
  fallbackSet: (id: string, value: SettingValue) => void,
) {
  const theme = useThemeStore();

  const get = (def: SettingDefinition): SettingValue => {
    if (!def.css) return fallbackGet(def.id);

    const raw = theme.overrides[def.css.var];
    if (raw === undefined) return def.defaultValue;

    if (typeof def.defaultValue === "number") {
      const n = parseFloat(raw);
      return Number.isNaN(n) ? def.defaultValue : n;
    }
    return raw;
  };

  const set = (def: SettingDefinition, value: SettingValue) => {
    if (!def.css) return fallbackSet(def.id, value);

    // Вернули значение по умолчанию: убираем переопределение,
    // тогда настройка снова следует за токеном из main.css
    const isDefault =
      String(value).toLowerCase() === String(def.defaultValue).toLowerCase();

    if (isDefault) theme.resetVar(def.css.var);
    else theme.setVar(def.css.var, `${value}${def.css.unit ?? ""}`);
  };

  return { get, set };
}
