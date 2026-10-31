<!-- src/components/AttachmentMenu.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

// Закрытие меню при клике вне его области
const closeMenu = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener("click", closeMenu));
onUnmounted(() => document.removeEventListener("click", closeMenu));

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <!-- Обертка компонента -->
  <div class="relative flex items-end" ref="menuRef">
    <!-- Кнопка "+" -->
    <button
      @click.stop="toggleMenu"
      class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300"
      :class="
        isOpen
          ? 'bg-accent text-white shadow-[0_0_15px_var(--color-accent)]' /* Активный: главный акцентный цвет темы */
          : 'bg-surface-bright/50 text-on-surface-variant hover:bg-surface-bright hover:text-on-surface' /* Спокойный: цвета поверхности */
      "
      title="Меню"
    >
      <svg
        class="w-5 h-5 transform transition-transform duration-300"
        :class="{ 'rotate-45': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>

    <!-- Выпадающее меню -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute bottom-full left-0 mb-3 w-64 bg-surface-container rounded-2xl border border-outline/20 shadow-2xl py-2 z-50 text-body-md font-medium text-on-surface origin-bottom-left"
      >
        <!-- Слот: сюда вы вставите свой компонент со списком -->
        <slot>
            
        </slot>
      </div>
    </Transition>
  </div>
</template>
