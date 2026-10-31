<!-- src/components/ui/UiNodeAvatar.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { getNodeIcon, colorFromLabel } from "@/utils/nodeIcons";
import { resolveAvatar } from "@/utils/avatars";

const props = withDefaults(
  defineProps<{
    label?: string;
    icon?: string;
    color?: string;
    imageUrl?: string;
    size?: number;
  }>(),
  { size: 36 },
);

const iconComp = computed(() => getNodeIcon(props.icon));
const src = computed(() => resolveAvatar(props.imageUrl));
const tint = computed(() => props.color || colorFromLabel(props.label ?? ""));
const initial = computed(() => ((props.label ?? "").trim()[0] ?? "?").toUpperCase());
const showImage = computed(() => !iconComp.value && !!src.value);

const boxStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size * 0.42}px`,
  ...(showImage.value
    ? {}
    : {
        backgroundColor: `color-mix(in srgb, ${tint.value} 22%, transparent)`,
        color: tint.value,
      }),
}));
</script>

<template>
  <div
    class="flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold"
    :style="boxStyle"
  >
    <component
      :is="iconComp"
      v-if="iconComp"
      :style="{ width: `${size * 0.55}px`, height: `${size * 0.55}px` }"
    />
    <img v-else-if="src" :src="src" alt="" class="h-full w-full object-cover" />
    <span v-else>{{ initial }}</span>
  </div>
</template>