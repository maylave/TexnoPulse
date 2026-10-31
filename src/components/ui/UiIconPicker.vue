<!-- src/components/ui/UiIconPicker.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { Search } from "lucide-vue-next";
import { NODE_ICONS } from "@/utils/nodeIcons";

defineProps<{
  modelValue: string;
  /** Цвет выбранной иконки */
  color?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const query = ref("");

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return NODE_ICONS;
  return NODE_ICONS.filter(
    (i) => i.label.toLowerCase().includes(q) || i.id.includes(q),
  );
});
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">
      <Search class="h-3.5 w-3.5 text-white/40" />
      <input
        v-model="query"
        type="text"
        placeholder="Найти иконку..."
        class="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
        @keydown.enter.prevent
      />
    </div>

    <div class="grid max-h-36 grid-cols-8 gap-1.5 overflow-y-auto pr-1">
      <button
        v-for="i in filtered"
        :key="i.id"
        type="button"
        :title="i.label"
        class="flex aspect-square items-center justify-center rounded-lg border transition"
        :class="
          modelValue === i.id
            ? 'border-white/60 bg-white/15'
            : 'border-transparent text-white/70 hover:bg-white/10 hover:text-white'
        "
        :style="modelValue === i.id && color ? { color } : {}"
        @click="emit('update:modelValue', i.id)"
      >
        <component :is="i.component" class="h-4 w-4" />
      </button>

      <p v-if="!filtered.length" class="col-span-8 py-3 text-center text-xs text-white/40">
        Ничего не найдено
      </p>
    </div>
  </div>
</template>