<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import {
  RotateCcw,
  Search,
  X,
  Puzzle,
  ExternalLink,
  CheckCircle2
} from "lucide-vue-next";
import SettingsBlock from "./SettingsBlock.vue";
import SettingsGroup from "./SettingsGroup.vue";
import DictionaryManager from "./DictionaryManager.vue";
import { SETTINGS_DEFINITIONS } from "@/config/settingsDefinitions";
import { useSettingsStore } from "@/stores/settings";
import { usePluginStore } from "@/stores/plugins";
import { useModalStore } from "@/stores/appModal";
import type { SettingDefinition } from "@/types/settings";
import { APP_VERSION } from "@/version";

const props = defineProps<{ activeTab: string }>();

const router = useRouter();
const modalStore = useModalStore();
const pluginStore = usePluginStore();
const settings = useSettingsStore();

const pluginsServerUrl = ref(localStorage.getItem('snapi_plugins_server_url') || 'http://127.0.0.1:4000');
const isCheckingPluginsServer = ref(false);
const pluginsServerStatus = ref<'idle' | 'connected' | 'error'>('idle');

const testPluginsServer = async () => {
  isCheckingPluginsServer.value = true;
  pluginsServerStatus.value = 'idle';
  try {
    const raw = pluginsServerUrl.value.trim().replace(/\/+$/, '');
    const res = await fetch(`${raw}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      pluginsServerStatus.value = 'connected';
      localStorage.setItem('snapi_plugins_server_url', pluginsServerUrl.value.trim());
      pluginStore.fetchPlugins();
    } else {
      pluginsServerStatus.value = 'error';
    }
  } catch {
    pluginsServerStatus.value = 'error';
  } finally {
    isCheckingPluginsServer.value = false;
  }
};

const savePluginsServerUrl = () => {
  localStorage.setItem('snapi_plugins_server_url', pluginsServerUrl.value.trim());
  testPluginsServer();
};

const openPluginMarket = () => {
  modalStore.close();
  router.push('/plugin');
};

/* ---------- dependsOn ---------- */
const definitionById = new Map(SETTINGS_DEFINITIONS.map((d) => [d.id, d]));

const isVisible = (s: SettingDefinition) => {
  if (!s.dependsOn) return true;
  const parent = definitionById.get(s.dependsOn.settingId);
  return !parent || settings.get(parent) === s.dependsOn.value;
};

const bindProps = (s: SettingDefinition) => ({
  ...s.range,
  options: s.options,
  placeholder: s.placeholder,
});

/* ---------- поиск ---------- */
const query = ref("");
const normalizedQuery = computed(() => query.value.trim().toLowerCase());
const isSearching = computed(() => normalizedQuery.value.length > 0);

const matches = (s: SettingDefinition) =>
  [s.label, s.description, s.group].some((t) =>
    t?.toLowerCase().includes(normalizedQuery.value),
  );

const onSearchEsc = (e: KeyboardEvent) => {
  if (!query.value) return; // пусть Esc закрывает окно
  query.value = "";
  e.stopPropagation();
};

/* ---------- секции ---------- */
interface Section {
  title: string | null;
  items: SettingDefinition[];
}

const sections = computed<Section[]>(() => {
  const list = SETTINGS_DEFINITIONS.filter(
    (s) =>
      (isSearching.value ? matches(s) : s.category === props.activeTab) &&
      isVisible(s),
  );

  const named = new Map<string, SettingDefinition[]>();
  const ungrouped: SettingDefinition[] = [];

  for (const s of list) {
    if (!s.group) {
      ungrouped.push(s);
      continue;
    }
    const bucket = named.get(s.group);
    if (bucket) bucket.push(s);
    else named.set(s.group, [s]);
  }

  const result: Section[] = [...named].map(([title, items]) => ({
    title,
    items,
  }));
  if (ungrouped.length) result.push({ title: null, items: ungrouped });
  return result;
});

const foundCount = computed(() =>
  sections.value.reduce((sum, s) => sum + s.items.length, 0),
);

/* ---------- сброс всего (с подтверждением) ---------- */
const confirmReset = ref(false);
let confirmTimer: ReturnType<typeof setTimeout> | undefined;

const onResetAll = () => {
  if (!confirmReset.value) {
    confirmReset.value = true;
    confirmTimer = setTimeout(() => (confirmReset.value = false), 3000);
    return;
  }
  clearTimeout(confirmTimer);
  confirmReset.value = false;
  settings.resetAll();
};

onBeforeUnmount(() => clearTimeout(confirmTimer));
</script>

<template>
  <div class="mx-auto min-h-full w-full max-w-3xl p-6">
    <!-- Поиск -->
    <div class="relative mb-6">
      <Search
        class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        v-model="query"
        type="text"
        placeholder="Поиск по настройкам..."
        class="w-full rounded-(--radius-lg) border border-(color:--glass-border) bg-white/5 py-2.5 pr-10 pl-10 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-accent/50"
        @keydown.esc="onSearchEsc"
      />
      <button
        v-if="query"
        type="button"
        title="Очистить"
        class="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
        @click="query = ''"
      >
        <X class="size-4" />
      </button>
    </div>

    <p
      v-if="isSearching && foundCount > 0"
      class="mb-4 text-xs text-on-surface-variant"
    >
      Найдено: {{ foundCount }}
    </p>

    <!-- Секции и динамический рендеринг настроек -->
    <component
      :is="section.title ? SettingsGroup : 'div'"
      v-for="section in sections"
      :key="section.title ?? '__ungrouped'"
      v-bind="
        section.title
          ? { title: section.title }
          : {
              class:
                'mt-8 flex flex-col gap-3 border-t border-(color:--glass-border) pt-8',
            }
      "
    >
      <SettingsBlock
        v-for="setting in section.items"
        :key="setting.id"
        :label="setting.label"
        :description="setting.description"
      >
        <div class="flex flex-col gap-2 w-full max-w-full">
          <!-- 1. Компонент статуса (например, для проверки соединения порта) -->
          <component 
            v-if="setting.statusComponent" 
            :is="setting.statusComponent" 
          />

          <!-- 2. Элементы управления (инпут и кнопки) -->
          <div v-if="setting.component || setting.actions?.length" class="flex flex-wrap items-center gap-2 mt-1">
            
            <button
              v-if="setting.component && settings.isModified(setting)"
              type="button"
              title="Сбросить"
              class="flex size-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
              @click="settings.reset(setting)"
            >
              <RotateCcw class="size-3.5" />
            </button>

            <!-- Основной инпут (текст, число, слайдер и т.д.) -->
            <component
              v-if="setting.component"
              :is="setting.component"
              :model-value="settings.get(setting)"
              v-bind="bindProps(setting)"
              @update:model-value="settings.set(setting, $event)"
            />

            <!-- Кнопки действий из конфига (например, "Применить", "Автопоиск") -->
            <button
              v-for="(action, idx) in setting.actions"
              :key="idx"
              type="button"
              class="flex cursor-pointer items-center gap-2 rounded-(--radius-default) px-4 py-2 text-xs font-medium transition-all active:scale-95"
              :class="action.primary 
                ? 'bg-[var(--color-accent)] text-white hover:opacity-90' 
                : 'border border-white/10 bg-white/5 text-on-surface hover:bg-white/10'"
              @click="action.onClick(settings.get(setting), (v) => settings.set(setting, v))"
            >
              <component v-if="action.icon" :is="action.icon" class="size-3.5" />
              <span>{{ action.label }}</span>
            </button>
          </div>
        </div>
      </SettingsBlock>
    </component>

    <!-- Пустое состояние -->
    <div
      v-if="sections.length === 0 && props.activeTab !== 'about' && props.activeTab !== 'dictionary' && props.activeTab !== 'plugins'"
      class="flex h-60 flex-col items-center justify-center opacity-40"
    >
      <p class="text-sm">
        {{
          isSearching
            ? `Ничего не найдено по запросу «${query.trim()}»`
            : "В этом разделе пока нет настроек"
        }}
      </p>
    </div>

    <!-- Раздел: Плагины и темы -->
    <div v-if="!isSearching && props.activeTab === 'plugins'" class="mt-4 flex flex-col gap-5">
      <div class="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Puzzle class="size-5" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-white">Каталог сторонних плагинов и тем</h4>
            <p class="text-xs text-slate-400">
              Установлено плагинов на ПК: <strong class="text-white">{{ pluginStore.installedPlugins.length }}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="openPluginMarket"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-medium shadow-md shadow-sky-500/25 transition-all hover:scale-102 cursor-pointer"
        >
          <span>Открыть каталог</span>
          <ExternalLink class="size-3.5" />
        </button>
      </div>

      <!-- Блок конфигурации выделенного сервера плагинов (Второй бэкенд) -->
      <div class="flex flex-col gap-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <h5 class="text-xs font-semibold text-white">Адрес сервера плагинов (Второй бэкенд)</h5>
            <p class="text-[11px] text-slate-400">
              По умолчанию: локальный порт 4000. В будущем сюда можно вставить адрес облачного сервера.
            </p>
          </div>

          <div v-if="pluginsServerStatus === 'connected'" class="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 class="size-3.5" />
            <span>Подключен</span>
          </div>
          <div v-else-if="pluginsServerStatus === 'error'" class="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <X class="size-3.5" />
            <span>Недоступен</span>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-1">
          <input
            v-model="pluginsServerUrl"
            type="text"
            placeholder="http://127.0.0.1:4000"
            class="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400/50 font-mono"
            @blur="savePluginsServerUrl"
            @keydown.enter="savePluginsServerUrl"
          />
          <button
            type="button"
            @click="testPluginsServer"
            :disabled="isCheckingPluginsServer"
            class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {{ isCheckingPluginsServer ? 'Проверка...' : 'Проверить' }}
          </button>
        </div>
      </div>

      <!-- Список установленных плагинов -->
      <div v-if="pluginStore.installedPlugins.length > 0" class="flex flex-col gap-2.5">
        <h5 class="text-xs font-medium text-slate-400 px-1">Активные расширения на этом ПК:</h5>
        <div 
          v-for="p in pluginStore.installedPlugins" 
          :key="p.id"
          class="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
        >
          <div class="flex items-center gap-2.5">
            <CheckCircle2 class="size-4" :class="p.isActive ? 'text-emerald-400' : 'text-slate-500'" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-white">{{ p.name }}</span>
              <span class="text-[10px] text-slate-400">v{{ p.version }} • {{ p.author }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[11px] font-medium" :class="p.isActive ? 'text-emerald-400' : 'text-slate-500'">
              {{ p.isActive ? 'Включен' : 'Отключен' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Менеджер словаря и частых слов -->
    <div v-if="!isSearching && props.activeTab === 'dictionary'" class="mt-8 border-t border-(color:--glass-border) pt-8">
      <DictionaryManager />
    </div>

    <!-- Блок «О приложении» -->
    <div
      v-if="!isSearching && props.activeTab === 'about'"
      class="mt-4 flex flex-col gap-4 rounded-(--radius-lg) border border-(color:--glass-border) bg-white/5 p-4"
    >
      <div class="flex flex-col gap-2 divide-y divide-white/5 text-xs text-on-surface-variant">
        <div class="flex items-center justify-between py-2">
          <span>Версия приложения</span>
          <span class="font-mono font-medium text-on-surface text-sm">v{{ APP_VERSION }}</span>
        </div>
      </div>
    </div>

    <!-- Сброс всех настроек -->
    <div class="mt-10 flex justify-end">
      <button
        type="button"
        class="rounded-(--radius-default) px-3 py-2 text-sm transition-colors"
        :class="
          confirmReset
            ? 'bg-error/15 text-error hover:bg-error/25'
            : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
        "
        @click="onResetAll"
      >
        {{
          confirmReset
            ? "Нажмите ещё раз для подтверждения"
            : "Сбросить все настройки"
        }}
      </button>
    </div>
  </div>
</template>