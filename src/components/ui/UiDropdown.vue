<!-- src/components/ui/UiDropdown.vue -->
<script setup lang="ts" generic="T extends string | number">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Check, ChevronDown } from "lucide-vue-next";

const props = defineProps<{
  modelValue: T;
  options: { value: T; label: string }[];
  title?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: T] }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const current = computed(() =>
  props.options.find((o) => o.value === props.modelValue),
);

const select = (value: T) => {
  emit("update:modelValue", value);
  open.value = false;
};

const onOutsidePointer = (e: PointerEvent) => {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
};

onMounted(() => document.addEventListener("pointerdown", onOutsidePointer));
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", onOutsidePointer),
);
</script>

<template>
  <div
    ref="root"
    class="relative inline-block min-w-32"
    @keydown.esc.stop="open = false"
  >
    <button
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :title="title"
      class="flex h-(--dropdown-height) w-full cursor-pointer items-center justify-between gap-2 rounded-(--toolbar-radius) border border-(--dropdown-trigger-border) bg-(--dropdown-trigger-bg) pr-2 pl-3 text-(length:--toolbar-font-size) text-on-surface outline-none transition-colors duration-(--toolbar-anim) hover:border-(--dropdown-trigger-border-hover) aria-expanded:border-(--dropdown-trigger-border-hover)"
      @click="open = !open"
    >
      <span class="truncate">{{ current?.label }}</span>
      <ChevronDown
        class="size-3 shrink-0 text-outline transition-transform duration-(--toolbar-anim)"
        :class="open && 'rotate-180'"
      />
    </button>

    <Transition
      enter-active-class="transition duration-(--menu-anim) ease-out"
      leave-active-class="transition duration-(--menu-anim) ease-in"
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <ul
        v-if="open"
        role="listbox"
        class="absolute top-full left-0 z-30 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-(--menu-item-radius) border border-(--menu-border) bg-(--menu-bg) p-(--menu-padding) shadow-(--menu-shadow) backdrop-blur-(--menu-blur)"
      >
        <li
          v-for="opt in options"
          :key="opt.value"
          role="option"
          :aria-selected="opt.value === modelValue"
          class="flex cursor-pointer items-center justify-between gap-3 rounded-(--toolbar-radius) px-2.5 py-1.5 text-(length:--toolbar-font-size) whitespace-nowrap text-(--menu-text) hover:bg-(--menu-hover) aria-selected:text-accent"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <Check v-if="opt.value === modelValue" class="size-3" />
        </li>
      </ul>
    </Transition>
  </div>
</template>
