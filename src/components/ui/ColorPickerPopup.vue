<!-- src/components/ui/ColorPickerPopup.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { X as XIcon, Check, Pipette } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    initialColor?: string;
  }>(),
  {
    initialColor: "#8B5CF6",
  },
);

const emit = defineEmits<{
  select: [color: string];
  close: [];
}>();

const currentColor = ref(props.initialColor.toUpperCase());
const hue = ref(260);

// Готовые красивые пресеты
const presets = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#14B8A6",
  "#84CC16",
  "#FFFFFF",
  "#94A3B8",
  "#334155",
  "#0F172A",
];

// Перевод HSL (с ползунка оттенка) в HEX
const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

watch(hue, (newHue) => {
  currentColor.value = hslToHex(newHue, 85, 60);
});

const selectPreset = (hex: string) => {
  currentColor.value = hex.toUpperCase();
};

const handleConfirm = () => {
  if (/^#[0-9A-F]{6}$/i.test(currentColor.value)) {
    emit("select", currentColor.value.toUpperCase());
  } else {
    emit("select", "#8B5CF6");
  }
  emit("close");
};
</script>

<template>
  <div
    class="z-50 p-4 rounded-[var(--menu-radius)] border shadow-2xl backdrop-blur-xl flex flex-col gap-3.5"
    style="
      width: min(280px, 85vw);
      background: var(--menu-bg);
      border-color: var(--menu-border);
      box-shadow: var(--menu-shadow);
      color: var(--menu-text);
    "
    @click.stop
  >
    <!-- Шапка -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Pipette class="w-4 h-4 opacity-70" />
        <h3 class="text-xs font-semibold uppercase tracking-wider opacity-80">
          Выбор цвета
        </h3>
      </div>
      <button
        type="button"
        @click="emit('close')"
        class="size-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      >
        <XIcon class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Превью + HEX инпут -->
    <div class="flex items-center gap-2.5">
      <div
        class="size-10 rounded-xl border border-white/20 shrink-0 shadow-inner transition-colors"
        :style="{ backgroundColor: currentColor }"
      ></div>
      <div class="flex-1 relative">
        <input
          v-model="currentColor"
          maxlength="7"
          placeholder="#8B5CF6"
          class="w-full px-3 py-2 rounded-xl text-sm font-mono uppercase bg-black/25 border border-white/10 focus:outline-none focus:border-accent"
        />
      </div>
    </div>

    <!-- Ползунок оттенка (Hue) -->
    <div class="flex flex-col gap-1">
      <input
        type="range"
        min="0"
        max="360"
        v-model.number="hue"
        class="hue-slider w-full h-2.5 rounded-lg appearance-none cursor-pointer"
      />
    </div>

    <!-- Сетка пресетов -->
    <div class="grid grid-cols-8 gap-1.5">
      <button
        v-for="color in presets"
        :key="color"
        type="button"
        @click="selectPreset(color)"
        class="size-6 rounded-full border border-white/15 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
        :style="{ backgroundColor: color }"
      >
        <span
          v-if="currentColor.toUpperCase() === color"
          class="size-2 rounded-full bg-white shadow"
        ></span>
      </button>
    </div>

    <!-- Кнопка подтверждения -->
    <button
      type="button"
      @click="handleConfirm"
      class="w-full py-2 rounded-xl bg-accent text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all"
    >
      <Check class="w-4 h-4" />
      Добавить цвет
    </button>
  </div>
</template>

<style scoped>
.hue-slider {
  background: linear-gradient(
    to right,
    #ff0000 0%,
    #ffff00 17%,
    #00ff00 33%,
    #00ffff 50%,
    #0000ff 67%,
    #ff00ff 83%,
    #ff0000 100%
  );
}
.hue-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid rgba(0, 0, 0, 0.4);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
</style>
