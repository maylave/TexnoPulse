<!-- src/components/ui/UiColorPopover.vue -->
<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from "vue";
import { Chrome } from "@ckpack/vue-color";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    presets?: string[];
  }>(),
  {
    presets: () => [
      "#4ea8ff",
      "#22c55e",
      "#eab308",
      "#f97316",
      "#ef4444",
      "#ec4899",
      "#a855f7",
      "#94a3b8",
    ],
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const pos = ref({ left: 0, top: 0 });

const isPreset = computed(() =>
  props.presets.some((c) => c.toLowerCase() === props.modelValue.toLowerCase()),
);

// vue-color отдаёт строку или объект с hex, поддерживаем оба варианта
const onPick = (value: unknown) => {
  const hex =
    typeof value === "string"
      ? value
      : ((value as { hex?: string })?.hex ?? "");
  if (hex) emit("update:modelValue", hex.slice(0, 7));
};

// Позиция под кнопкой; если не помещается, открываем сверху или сдвигаем влево
const place = async () => {
  await nextTick();
  const t = trigger.value;
  if (!t) return;
  const r = t.getBoundingClientRect();
  const pw = panel.value?.offsetWidth ?? 240;
  const ph = panel.value?.offsetHeight ?? 320;
  const margin = 8;

  let left = r.left;
  let top = r.bottom + margin;
  if (left + pw > window.innerWidth - margin) {
    left = window.innerWidth - margin - pw;
  }
  if (top + ph > window.innerHeight - margin) {
    top = Math.max(margin, r.top - margin - ph);
  }
  pos.value = { left: Math.max(margin, left), top };
};

const toggle = () => {
  open.value = !open.value;
};

const onOutsidePointerDown = (e: PointerEvent) => {
  const target = e.target as Node;
  if (panel.value?.contains(target) || trigger.value?.contains(target)) return;
  open.value = false;
};

watch(open, (isOpen) => {
  if (isOpen) {
    place();
    window.addEventListener("pointerdown", onOutsidePointerDown, true);
    window.addEventListener("resize", place);
  } else {
    window.removeEventListener("pointerdown", onOutsidePointerDown, true);
    window.removeEventListener("resize", place);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onOutsidePointerDown, true);
  window.removeEventListener("resize", place);
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- Готовые цвета -->
    <button
      v-for="c in presets"
      :key="c"
      type="button"
      class="h-6 w-6 rounded-full border-2 transition"
      :class="
        modelValue.toLowerCase() === c.toLowerCase()
          ? 'border-white'
          : 'border-transparent hover:border-white/40'
      "
      :style="{ backgroundColor: c }"
      :title="c"
      @click="emit('update:modelValue', c)"
    />

    <!-- Свой цвет: кнопка открывает палитру -->
    <button
      ref="trigger"
      type="button"
      class="flex h-6 items-center gap-1.5 rounded-full border px-2 text-[10px] transition"
      :class="
        !isPreset || open
          ? 'border-white text-white'
          : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
      "
      @click="toggle"
    >
      <span
        class="h-3 w-3 rounded-full border border-white/30"
        :style="{ backgroundColor: modelValue }"
      />
      Свой
    </button>

    <!-- Палитра во всплывающем окне -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="panel"
        class="fixed z-[1100] overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
        @contextmenu.prevent
      >
        <Chrome
          :model-value="modelValue"
          disable-alpha
          @update:model-value="onPick"
        />
      </div>
    </Teleport>
  </div>
</template>