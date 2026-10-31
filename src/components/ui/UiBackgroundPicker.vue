<!-- src/components/ui/UiBackgroundPicker.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Trash2, Check, Upload } from "lucide-vue-next";
import { useBackgroundStore } from "@/stores/background";
import type { ChatBackground } from "@/types/background";

// Настройки могут передавать modelValue и прочее, этому компоненту они не нужны
defineOptions({ inheritAttrs: false });

const store = useBackgroundStore();

type Mode = "color" | "url" | "file";

const showForm = ref(false);
const mode = ref<Mode>("color");
const name = ref("");
const color = ref("#1e293b");
const url = ref("");
const error = ref("");
const busy = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const modes: { id: Mode; label: string }[] = [
  { id: "color", label: "Цвет" },
  { id: "url", label: "Ссылка" },
  { id: "file", label: "Файл" },
];

// Превью: картинка и кастомный цвет через style, встроенные через tailwind-класс
const previewStyle = (bg: ChatBackground) => {
  if (bg.type === "image") {
    return {
      backgroundImage: `url(${bg.preview})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (bg.custom && bg.type === "solid") return { backgroundColor: bg.value };
  return {};
};
const previewClass = (bg: ChatBackground) =>
  bg.type === "image" || (bg.custom && bg.type === "solid") ? "" : bg.preview;

const canSubmit = computed(() => {
  if (busy.value) return false;
  if (mode.value === "color") return !!color.value;
  if (mode.value === "url") return /^https?:\/\//i.test(url.value.trim());
  return false; // для файла отправка идёт сразу после выбора
});

const resetForm = () => {
  name.value = "";
  url.value = "";
  error.value = "";
  showForm.value = false;
};

const save = (bg: Omit<ChatBackground, "id" | "custom">) => {
  const ok = store.addBackground(bg);
  if (!ok) {
    error.value =
      "Не удалось сохранить: хранилище переполнено. Удалите ненужные фоны или используйте ссылку.";
    return false;
  }
  resetForm();
  return true;
};

const submit = () => {
  error.value = "";
  if (mode.value === "color") {
    save({
      name: name.value.trim() || `Цвет ${color.value.toUpperCase()}`,
      type: "solid",
      value: color.value,
      preview: color.value,
    });
  } else if (mode.value === "url") {
    const link = url.value.trim();
    save({
      name: name.value.trim() || "Фон по ссылке",
      type: "image",
      value: link,
      preview: link,
    });
  }
};

/** Уменьшает картинку и возвращает data URL */
const resizeImage = (
  img: HTMLImageElement,
  maxSide: number,
  quality: number,
): string => {
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = objectUrl;
  });

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    error.value = "Выберите файл изображения";
    return;
  }

  busy.value = true;
  error.value = "";
  try {
    const img = await loadImage(file);
    save({
      name: name.value.trim() || file.name.replace(/\.[^.]+$/, ""),
      type: "image",
      value: resizeImage(img, 1920, 0.8),
      preview: resizeImage(img, 240, 0.7),
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Ошибка загрузки";
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <div class="w-full space-y-3">
    <!-- Сетка фонов -->
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <button
        v-for="bg in store.availableBackgrounds"
        :key="bg.id"
        type="button"
        class="group relative aspect-video overflow-hidden rounded-lg border transition"
        :class="
          store.currentBackgroundId === bg.id
            ? 'border-[var(--color-accent,#4ea8ff)] ring-2 ring-[var(--color-accent,#4ea8ff)]/50'
            : 'border-white/10 hover:border-white/30'
        "
        :title="bg.name"
        @click="store.setBackground(bg.id)"
      >
        <div
          class="absolute inset-0"
          :class="previewClass(bg)"
          :style="previewStyle(bg)"
        />

        <!-- Подпись -->
        <span
          class="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-left text-[10px] text-white/90"
        >
          {{ bg.name }}
        </span>

        <!-- Галочка активного -->
        <span
          v-if="store.currentBackgroundId === bg.id"
          class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent,#4ea8ff)] text-white"
        >
          <Check class="h-3 w-3" />
        </span>

        <!-- Удаление (только свои фоны) -->
        <span
          v-if="bg.custom"
          role="button"
          title="Удалить фон"
          class="absolute left-1 top-1 hidden rounded bg-black/60 p-1 text-white/80 hover:bg-red-500/80 hover:text-white group-hover:block"
          @click.stop="store.removeBackground(bg.id)"
        >
          <Trash2 class="h-3 w-3" />
        </span>
      </button>

      <!-- Кнопка добавления -->
      <button
        type="button"
        class="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/20 text-white/50 transition hover:border-white/40 hover:text-white"
        title="Добавить свой фон"
        @click="showForm = !showForm"
      >
        <Plus class="h-5 w-5" />
      </button>
    </div>

    <!-- Форма добавления -->
    <div
      v-if="showForm"
      class="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <div class="flex gap-1 rounded-lg bg-black/20 p-1">
        <button
          v-for="m in modes"
          :key="m.id"
          type="button"
          class="flex-1 rounded-md px-2 py-1 text-xs transition"
          :class="
            mode === m.id
              ? 'bg-[var(--color-accent,#4ea8ff)] text-white'
              : 'text-white/60 hover:text-white'
          "
          @click="mode = m.id"
        >
          {{ m.label }}
        </button>
      </div>

      <input
        v-model="name"
        type="text"
        placeholder="Название (необязательно)"
        class="w-full rounded-lg bg-black/20 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
      />

      <!-- Цвет -->
      <div v-if="mode === 'color'" class="flex items-center gap-2">
        <input
          v-model="color"
          type="color"
          class="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span class="font-mono text-xs text-white/70">
          {{ color.toUpperCase() }}
        </span>
      </div>

      <!-- Ссылка -->
      <input
        v-else-if="mode === 'url'"
        v-model="url"
        type="url"
        placeholder="https://example.com/image.jpg"
        class="w-full rounded-lg bg-black/20 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
        @keydown.enter.prevent="canSubmit && submit()"
      />

      <!-- Файл -->
      <div v-else>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />
        <button
          type="button"
          :disabled="busy"
          class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-3 text-xs text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
          @click="fileInput?.click()"
        >
          <Upload class="h-4 w-4" />
          {{ busy ? "Обработка..." : "Выбрать изображение" }}
        </button>
      </div>

      <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

      <div class="flex justify-end gap-2 text-xs">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          @click="resetForm"
        >
          Отмена
        </button>
        <button
          v-if="mode !== 'file'"
          type="button"
          :disabled="!canSubmit"
          class="rounded-lg bg-[var(--color-accent,#4ea8ff)] px-3 py-1.5 text-white transition hover:brightness-110 disabled:opacity-40"
          @click="submit"
        >
          Добавить
        </button>
      </div>
    </div>
  </div>
</template>