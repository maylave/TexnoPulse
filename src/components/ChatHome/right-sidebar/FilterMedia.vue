<!-- src/components/ChatHome/right-sidebar/FilterMedia.vue -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{
  tab: string;
}>();

const emit = defineEmits<{
  "update:tab": [value: string];
}>();

const tabs = ["Все", "Фото", "Видео", "Файлы", "Код"] as const;

const VISIBLE_COUNT = 4;
const isActive = (t: string) => props.tab === t;

const containerRef = ref<HTMLElement | null>(null);
const buttonRefs = ref<(HTMLButtonElement | null)[]>([]);

const offset = ref(0);
const maxOffset = computed(() => Math.max(0, tabs.length - VISIBLE_COUNT));
const tabWidthPercent = computed(() => 100 / tabs.length);

const trackStyle = computed(() => ({
  transform: `translateX(-${offset.value * tabWidthPercent.value}%)`,
  width: `${(tabs.length / VISIBLE_COUNT) * 100}%`,
}));

const indicatorStyle = ref<Record<string, string>>({ opacity: "0" });

const updateIndicator = async () => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 50));
  await nextTick();

  const activeIdx = tabs.findIndex((t) => t === props.tab);
  if (activeIdx === -1 || !containerRef.value) return;

  const localIdx = activeIdx - offset.value;
  if (localIdx < 0 || localIdx >= VISIBLE_COUNT) return;

  const btn = buttonRefs.value[localIdx];
  const container = containerRef.value;
  if (!btn) return;

  const containerRect = container.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();

  indicatorStyle.value = {
    width: `${btnRect.width}px`,
    transform: `translateX(${btnRect.left - containerRect.left}px)`,
    opacity: "1",
  };
};

watch(
  () => props.tab,
  (newTab) => {
    const idx = tabs.findIndex((t) => t === newTab);
    if (idx === -1) return;

    const visibleEnd = offset.value + VISIBLE_COUNT;

    if (idx >= visibleEnd) {
      offset.value = Math.min(idx, maxOffset.value);
    } else if (idx < offset.value) {
      offset.value = Math.max(idx, 0);
    }
    updateIndicator();
  },
);

onMounted(() => {
  updateIndicator();
});

const pressedIndex = ref<number | null>(null);

const onTap = (item: string, index: number) => {
  pressedIndex.value = index;
  emit("update:tab", item);
  setTimeout(() => {
    pressedIndex.value = null;
  }, 250);
};

const slideNext = () => {
  if (offset.value < maxOffset.value) {
    offset.value = Math.min(offset.value + 1, maxOffset.value);
    updateIndicator();
  }
};

const slidePrev = () => {
  if (offset.value > 0) {
    offset.value = Math.max(offset.value - 1, 0);
    updateIndicator();
  }
};

const canSlideLeft = computed(() => offset.value > 0);
const canSlideRight = computed(() => offset.value < maxOffset.value);
</script>

<template>
  <div
    class="relative mb-3 overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.06]"
  >
    <div ref="containerRef" class="overflow-hidden">
      <div
        class="flex gap-1 p-1 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :style="trackStyle"
      >
        <button
          v-for="(item, index) in tabs"
          :key="item"
          :ref="
            (el) => {
              if (index >= offset && index < offset + VISIBLE_COUNT)
                buttonRefs[index - offset] = el as HTMLButtonElement | null;
            }
          "
          type="button"
          class="flex-1 min-w-0 py-1.5 rounded-lg text-[10px] font-medium relative whitespace-nowrap transition-all duration-200 ease-out"
          :class="[
            isActive(item) ? 'text-white' : 'text-white/30 hover:text-white/60',
            pressedIndex === index ? 'scale-90' : '',
          ]"
          @click="onTap(item, index)"
        >
          <span class="relative z-10">{{ item }}</span>
        </button>
      </div>
    </div>

    <!-- Скользящий индикатор -->
    <div
      class="absolute top-1 bottom-1 left-0 rounded-lg pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      :style="indicatorStyle"
    >
      <div class="absolute inset-0 rounded-lg bg-white/[0.1]" />
    </div>

    <div
      v-if="canSlideLeft"
      class="absolute left-0 top-0 bottom-0 w-[6px] z-20 cursor-pointer"
      @mouseenter="slidePrev"
    />
    <div
      v-if="canSlideRight"
      class="absolute right-0 top-0 bottom-0 w-[6px] z-20 cursor-pointer"
      @mouseenter="slideNext"
    />
  </div>
</template>
