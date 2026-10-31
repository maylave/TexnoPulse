<!-- src/components/ui/BaseInput.vue -->
<template>
  <div class="relative w-full">
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      :placeholder="placeholder"
      class="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-sky-500/50 focus:bg-white/15 transition-all duration-200"
    />

    <!-- Кнопка очистки -->
    <button
      v-if="modelValue"
      @click="clear"
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputRef = ref<HTMLInputElement>();

const clear = () => {
  emit("update:modelValue", "");
  inputRef.value?.focus();
};
</script>
