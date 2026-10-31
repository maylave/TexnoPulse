<!-- src/components/modals/EditNodeModal.vue -->
<script lang="ts" setup>
import { ref, computed } from "vue";
import { X, Upload, Trash2, Check } from "lucide-vue-next";
import { useModalStore } from "@/stores/appModal";
import { useNodeStore } from "@/stores/node";
import UiColorPopover from "@/components/ui/UiColorPopover.vue";
import UiIconPicker from "@/components/ui/UiIconPicker.vue";
import UiNodeAvatar from "@/components/ui/UiNodeAvatar.vue";
import { colorFromLabel } from "@/utils/nodeIcons";
import type { AppNode } from "@/types/chat";
import { PRESET_AVATARS, PRESET_PREFIX } from "@/utils/avatars";

const modal = useModalStore();
const nodeStore = useNodeStore();

const node = modal.payload as AppNode | null;
const isFolder = node?.type === "folder";
const chatMeta = node?.metaDate.chat;
const folderMeta = node?.metaDate.folder;

// Локальная копия: изменения применяются только по кнопке «Сохранить»
const label = ref(node?.label ?? "");
const icon = ref(isFolder ? (folderMeta?.icon ?? "folder") : (chatMeta?.icon ?? ""));
const color = ref(
  (isFolder ? folderMeta?.color : chatMeta?.iconColor) ||
    (isFolder ? "#4ea8ff" : colorFromLabel(node?.label ?? "")),
);
// "preset:имя.png", data URL или пусто
const avatarUrl = ref(chatMeta?.avatarUrl ?? "");
const mode = ref<"icon" | "image">(!isFolder && avatarUrl.value && !icon.value ? "image" : "icon");

const error = ref("");
const busy = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const canSave = computed(() => !busy.value && label.value.trim().length > 0);

// Что показывать в превью, зависит от выбранной вкладки
const previewIcon = computed(() => (mode.value === "icon" ? icon.value : ""));
const previewImage = computed(() => (mode.value === "image" ? avatarUrl.value : ""));

const pickIcon = (id: string) => {
  icon.value = id;
  avatarUrl.value = "";
};

const pickPreset = (id: string) => {
  avatarUrl.value = `${PRESET_PREFIX}${id}`;
  icon.value = "";
};

/** Обрезает до квадрата по центру и уменьшает до 256px */
const toAvatar = async (file: File): Promise<string> => {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  canvas
    .getContext("2d")!
    .drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 256, 256);
  bmp.close();
  return canvas.toDataURL("image/webp", 0.9);
};

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    error.value = "Выберите файл изображения";
    return;
  }
  error.value = "";
  try {
    avatarUrl.value = await toAvatar(file);
    icon.value = "";
  } catch {
    error.value = "Не удалось прочитать изображение";
  }
};

const save = async () => {
  if (!node || !canSave.value) return;
  busy.value = true;
  error.value = "";

  const metaDate = JSON.parse(JSON.stringify(node.metaDate));
  if (isFolder) {
    metaDate.folder = { ...metaDate.folder, color: color.value, icon: icon.value || "folder" };
  } else if (mode.value === "icon") {
    metaDate.chat = { ...metaDate.chat, icon: icon.value, iconColor: color.value, avatarUrl: "" };
  } else {
    metaDate.chat = { ...metaDate.chat, icon: "", avatarUrl: avatarUrl.value };
  }

  try {
    await nodeStore.updateNode(node.id, { label: label.value.trim(), metaDate });
    modal.close();
  } catch (e) {
    console.error("[EditNode] save failed:", e);
    error.value = "Не удалось сохранить изменения";
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <form
    class="w-[420px] max-w-[90vw] rounded-2xl border border-(--menu-border) bg-(--menu-bg) p-4 text-white shadow-2xl"
    @submit.prevent="save"
  >
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-medium">
        {{ isFolder ? "Редактирование папки" : "Редактирование чата" }}
      </h3>
      <button
        type="button"
        class="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        title="Закрыть"
        @click="modal.close()"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Превью + название -->
    <div class="mb-4 flex items-center gap-3">
      <UiNodeAvatar
        :label="label"
        :icon="previewIcon"
        :color="color"
        :image-url="previewImage"
        :size="56"
      />
      <div class="min-w-0 flex-1">
        <label class="mb-1 block text-xs text-white/60">Название</label>
        <input
          v-model="label"
          type="text"
          maxlength="60"
          placeholder="Введите название..."
          class="w-full rounded-lg bg-white/5 px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
          autofocus
        />
      </div>
    </div>

    <!-- Вкладки (только у чата) -->
    <div v-if="!isFolder" class="mb-3 flex gap-1 rounded-lg bg-black/20 p-1 text-xs">
      <button
        type="button"
        class="flex-1 rounded-md px-2 py-1 transition"
        :class="mode === 'icon' ? 'bg-[var(--color-accent,#4ea8ff)] text-white' : 'text-white/60 hover:text-white'"
        @click="mode = 'icon'"
      >
        Иконка
      </button>
      <button
        type="button"
        class="flex-1 rounded-md px-2 py-1 transition"
        :class="mode === 'image' ? 'bg-[var(--color-accent,#4ea8ff)] text-white' : 'text-white/60 hover:text-white'"
        @click="mode = 'image'"
      >
        Картинка
      </button>
    </div>

    <!-- Иконка + цвет -->
    <div v-if="mode === 'icon'" class="mb-4 space-y-3">
      <UiIconPicker :model-value="icon" :color="color" @update:model-value="pickIcon" />
      <div>
        <label class="mb-2 block text-xs text-white/60">Цвет</label>
        <UiColorPopover v-model="color" />
      </div>
    </div>

    <!-- Картинка -->
    <div v-else class="mb-4">
      <div class="mb-3 flex gap-2 text-xs">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20"
          @click="fileInput?.click()"
        >
          <Upload class="h-3.5 w-3.5" />
          Загрузить
        </button>
        <button
          v-if="avatarUrl"
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white/60 transition hover:bg-red-500/20 hover:text-red-400"
          @click="avatarUrl = ''"
        >
          <Trash2 class="h-3.5 w-3.5" />
          Убрать
        </button>
      </div>

      <template v-if="PRESET_AVATARS.length">
        <label class="mb-2 block text-xs text-white/60">Готовые</label>
        <div class="grid max-h-32 grid-cols-6 gap-2 overflow-y-auto pr-1">
          <button
            v-for="a in PRESET_AVATARS"
            :key="a.id"
            type="button"
            class="relative aspect-square overflow-hidden rounded-full border-2 transition"
            :class="avatarUrl === PRESET_PREFIX + a.id ? 'border-[var(--color-accent,#4ea8ff)]' : 'border-transparent hover:border-white/30'"
            :title="a.id"
            @click="pickPreset(a.id)"
          >
            <img :src="a.url" alt="" class="h-full w-full object-cover" />
            <span
              v-if="avatarUrl === PRESET_PREFIX + a.id"
              class="absolute inset-0 flex items-center justify-center bg-black/40"
            >
              <Check class="h-4 w-4" />
            </span>
          </button>
        </div>
      </template>
    </div>

    <p v-if="error" class="mb-3 text-xs text-red-400">{{ error }}</p>

    <div class="flex justify-end gap-2 text-xs">
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        @click="modal.close()"
      >
        Отмена
      </button>
      <button
        type="submit"
        :disabled="!canSave"
        class="rounded-lg bg-[var(--color-accent,#4ea8ff)] px-3 py-1.5 text-white transition hover:brightness-110 disabled:opacity-40"
      >
        Сохранить
      </button>
    </div>
  </form>
</template>