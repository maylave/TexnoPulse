<!-- src/components/ui/UiSteppedSlider.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    /** каждая N-я риска (в шагах) крупная; 0 = крупные только крайние */
    majorEvery?: number;
    /** подписи под крупными рисками */
    showLabels?: boolean;
    disabled?: boolean;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    unit: "",
    majorEvery: 0,
    showLabels: false,
    disabled: false,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

/** Больше стольких рисок не рисуем (при мелком шаге они сольются) */
const MAX_TICKS = 40;

/* ---------- геометрия ---------- */
const range = computed(() => Math.max(props.max - props.min, Number.EPSILON));
const ratioOf = (v: number) =>
  Math.min(1, Math.max(0, (v - props.min) / range.value));

/** Позиция центра ползунка: нативный thumb ходит от thumb/2 до 100% - thumb/2 */
const posOf = (ratio: number) =>
  `calc(var(--slider-thumb) / 2 + (100% - var(--slider-thumb)) * ${ratio})`;

const thumbLeft = computed(() => posOf(ratioOf(props.modelValue)));

/* ---------- форматирование ---------- */
const decimals = computed(
  () => (String(props.step).split(".")[1] ?? "").length,
);
const fmt = (v: number) => Number(v.toFixed(decimals.value));
const display = computed(() => fmt(props.modelValue));

/* ---------- риски ---------- */
interface Tick {
  index: number;
  left: string;
  major: boolean;
  active: boolean;
  label: string;
}

const stepsCount = computed(() =>
  Math.max(1, Math.floor((props.max - props.min) / props.step + 1e-9)),
);
const stride = computed(() => Math.ceil(stepsCount.value / MAX_TICKS));

const ticks = computed<Tick[]>(() => {
  const last = stepsCount.value;
  const result: Tick[] = [];

  for (let i = 0; i <= last; i++) {
    const major =
      i === 0 ||
      i === last ||
      (props.majorEvery > 0 && i % props.majorEvery === 0);
    if (!major && i % stride.value !== 0) continue;

    const value = props.min + i * props.step;
    result.push({
      index: i,
      major,
      left: posOf(ratioOf(value)),
      active: value <= props.modelValue + 1e-9,
      label: `${fmt(value)}${props.unit}`,
    });
  }
  return result;
});

const majorTicks = computed(() => ticks.value.filter((t) => t.major));

/* ---------- tooltip ---------- */
const isDragging = ref(false);
const isKeyboardFocus = ref(false);
const tooltipVisible = computed(
  () => isDragging.value || isKeyboardFocus.value,
);

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
};

const onPointerDown = () => {
  isDragging.value = true;
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
};

// Подсказка при управлении с клавиатуры (стрелки), но не при обычном клике
const onFocus = (e: FocusEvent) => {
  isKeyboardFocus.value = (e.target as HTMLElement).matches(":focus-visible");
};
const onBlur = () => {
  isKeyboardFocus.value = false;
};

onBeforeUnmount(stopDrag);

const onInput = (e: Event) => {
  emit("update:modelValue", Number((e.target as HTMLInputElement).value));
};
</script>

<template>
  <div
    class="ui-slider relative w-60 shrink-0 select-none"
    :class="{ 'pointer-events-none opacity-50': disabled }"
  >
    <!-- Tooltip -->
    <div
      class="pointer-events-none absolute bottom-full z-20 mb-2 -translate-x-1/2"
      :style="{ left: thumbLeft }"
    >
      <Transition name="tip">
        <div
          v-if="tooltipVisible"
          class="relative rounded-md border border-white/10 bg-surface-container-highest px-2 py-1 text-xs font-bold whitespace-nowrap text-on-surface shadow-lg"
        >
          {{ display }}{{ unit }}
          <span
            class="absolute top-full left-1/2 -mt-1 size-2 -translate-x-1/2 rotate-45 border-r border-b border-white/10 bg-surface-container-highest"
          />
        </div>
      </Transition>
    </div>

    <!-- Дорожка + заливка + input -->
    <div class="relative h-(--slider-thumb)">
      <div
        class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-variant"
      />
      <div
        class="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-accent"
        :style="{ width: thumbLeft }"
      />
      <input
        type="range"
        class="slider-input absolute inset-0 m-0 h-full w-full cursor-pointer touch-pan-y appearance-none bg-transparent"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        :aria-valuetext="`${display}${unit}`"
        @input="onInput"
        @pointerdown="onPointerDown"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>

    <!-- Риски -->
    <div class="relative mt-1 h-2.5" aria-hidden="true">
      <span
        v-for="t in ticks"
        :key="t.index"
        class="absolute top-0 w-px -translate-x-1/2 rounded-full transition-colors duration-200"
        :class="[
          t.major ? 'h-2.5' : 'h-1.5',
          t.active ? 'bg-accent' : 'bg-on-surface-variant/35',
        ]"
        :style="{ left: t.left }"
      />
    </div>

    <!-- Подписи -->
    <div v-if="showLabels" class="relative mt-1 h-4" aria-hidden="true">
      <span
        v-for="t in majorTicks"
        :key="t.index"
        class="absolute top-0 -translate-x-1/2 text-(length:--font-size-caption) whitespace-nowrap text-on-surface-variant"
        :style="{ left: t.left }"
      >
        {{ t.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.ui-slider {
  --slider-thumb: 18px;
}

.slider-input {
  outline: none;
}

/* Дорожку рисуем сами, нативную делаем прозрачной */
.slider-input::-webkit-slider-runnable-track {
  height: var(--slider-thumb);
  background: transparent;
}
.slider-input::-moz-range-track {
  height: var(--slider-thumb);
  background: transparent;
}

/* Ползунок */
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
  width: var(--slider-thumb);
  height: var(--slider-thumb);
  border-radius: 9999px;
  background: var(--color-accent);
  border: 2px solid var(--color-surface-container);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  cursor: grab;
  transition:
    transform 0.15s var(--ease-apple, ease),
    box-shadow 0.2s ease;
}
.slider-input::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--slider-thumb);
  height: var(--slider-thumb);
  border-radius: 9999px;
  background: var(--color-accent);
  border: 2px solid var(--color-surface-container);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  cursor: grab;
  transition:
    transform 0.15s var(--ease-apple, ease),
    box-shadow 0.2s ease;
}

.slider-input:hover::-webkit-slider-thumb {
  transform: scale(1.1);
}
.slider-input:hover::-moz-range-thumb {
  transform: scale(1.1);
}

.slider-input:active::-webkit-slider-thumb {
  transform: scale(1.2);
  cursor: grabbing;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 30%, transparent);
}
.slider-input:active::-moz-range-thumb {
  transform: scale(1.2);
  cursor: grabbing;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

/* Кольцо фокуса только для клавиатуры */
.slider-input:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 35%, transparent);
}
.slider-input:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 35%, transparent);
}

/* Анимация tooltip */
.tip-enter-active,
.tip-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.85);
}
</style>
