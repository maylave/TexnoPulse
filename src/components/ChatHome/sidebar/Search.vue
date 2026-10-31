<script setup lang="ts">
import { ref, watch } from "vue";
import { useModalStore } from "@/stores/appModal";

// Пропсы и события для связи с родителем (например, шапкой)
const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", value: string): void;
}>();

const modalStore = useModalStore();
const searchQuery = ref(props.modelValue ?? "");
const isFocused = ref(false);

// Следим за изменениями ввода и передаем наверх
watch(searchQuery, (newValue) => {
  emit("update:modelValue", newValue);
  emit("search", newValue);
});
</script>

<template>
  <div class="relative flex items-center">
    <div
      class="search-container flex items-center transition-all duration-300 ease-out cursor-text"
      :class="{ 'is-focused': isFocused || searchQuery.length > 0 }"
    >
      <!-- Иконка поиска -->
      <span
        class="search-icon flex items-center justify-center pl-3 pr-2 pointer-events-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>

      <!-- Поле ввода -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск..."
        class="search-input bg-transparent border-none outline-none w-full text-sm pr-2 py-2"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- Бейдж глобального поиска Ctrl+K -->
      <button
        v-if="!searchQuery"
        type="button"
        @click="modalStore.open('global-search')"
        class="pr-3 text-[10px] font-mono text-[var(--header-icon)] hover:text-white transition-colors cursor-pointer"
        title="Глобальный поиск (⌘K / Ctrl+K)"
      >
        ⌘K
      </button>

      <!-- Кнопка очистки (появляется, если есть текст) -->
      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="pr-3 text-[var(--header-icon)] hover:text-[var(--header-icon-active)] transition-colors"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  width: var(--search-width, 25rem);
  background-color: var(--header-glass-bg, rgba(30, 41, 59, 0.4));
  border: 1px solid var(--header-border, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(var(--header-glass-blur, 16px));
  -webkit-backdrop-filter: blur(var(--header-glass-blur, 16px));
  border-radius: var(--header-radius, 9999px);
  color: var(--header-text);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.search-container.is-focused {
  border-color: var(--header-border-focus, #38bdf8);
  box-shadow: 0 0 15px -3px rgba(56, 189, 248, 0.3);
}

.search-icon {
  color: var(--header-icon);
}

.search-container.is-focused .search-icon {
  color: var(--header-icon-active);
}

.search-input {
  color: var(--header-text);
}

.search-input::placeholder {
  color: var(--header-placeholder);
}
</style>
