<!-- src/components/ui/UiSelect.vue -->
<script setup lang="ts">
import type { SettingOption } from "@/types/settings";

defineProps<{
  modelValue: string | number;
  options: SettingOption[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: string | number] }>();

const update = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  // Пытаемся вернуть число, если оно было числом в options
  const numVal = Number(val);
  emit("update:modelValue", isNaN(numVal) ? val : numVal);
};
</script>

<template>
  <div class="relative">
    <select
      :value="modelValue"
      @change="update"
      class="appearance-none w-full max-w-[200px] pl-3 pr-8 py-2 text-sm rounded-md outline-none cursor-pointer border transition-colors"
      style="
        background-color: var(--color-surface-container-lowest);
        color: var(--color-on-surface);
        border-color: var(--menu-border);
        background-image: url(&quot;data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23909096%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-4.9%200-9.3%202-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%204.9%202%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E&quot;);
        background-repeat: no-repeat;
        background-position: right 0.7rem top 50%;
        background-size: 0.65rem auto;
      "
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        class="bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
