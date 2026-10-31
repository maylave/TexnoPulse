<!-- src/components/ChatHome/layout/ViewModeSelector.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from "vue";
import {
  MessageSquare,
  Network,
  LayoutGrid,
  ChevronDown,
} from "lucide-vue-next";

export type ViewMode = "chat" | "graph" | "canvas";

interface ViewOption {
  id: ViewMode;
  label: string;
  icon: Component;
}

const modelValue = defineModel<ViewMode>({ required: true });
const isDropdownOpen = ref(false);

const viewOptions: ViewOption[] = [
  {
    id: "chat",
    label: "Режим чата",
    icon: MessageSquare,
  },
  {
    id: "graph",
    label: "Граф связей",
    icon: Network,
  },
  {
    id: "canvas",
    label: "Бесконечный холст",
    icon: LayoutGrid,
  },
];

const currentOption = computed(
  () => viewOptions.find((o) => o.id === modelValue.value) ?? viewOptions[0]!,
);

const selectMode = (mode: ViewMode) => {
  modelValue.value = mode;
  isDropdownOpen.value = false;
};

const cycleViewMode = () => {
  const currentIndex = viewOptions.findIndex((o) => o.id === modelValue.value);
  const nextIndex = (currentIndex + 1) % viewOptions.length;
  const nextOption = viewOptions[nextIndex];
  if (nextOption) {
    modelValue.value = nextOption.id;
  }
  isDropdownOpen.value = false;
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.shiftKey && e.key === "Tab") {
    e.preventDefault();
    cycleViewMode();
  } else if (e.key === "Escape") {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
  <div class="relative select-none">
    <!-- Главная кнопка -->
    <button
      type="button"
      class="group/btn relative overflow-hidden panel-glass-btn flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-medium text-white/90 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/30 hover:bg-white/[0.12] active:scale-95"
      @click="isDropdownOpen = !isDropdownOpen"
    >
      <!-- Эффект пробегающего блика -->
      <div class="glass-shine"></div>

      <!-- Иконка текущего режима -->
      <component 
        :is="currentOption.icon" 
        class="relative z-10 w-4 h-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-transform duration-300 ease-out group-hover/btn:scale-110" 
      />
      
      <span class="relative z-10 tracking-wide font-semibold">{{ currentOption.label }}</span>
      
      <!-- Индикатор раскрытия (Chevron) -->
      <ChevronDown 
        class="relative z-10 w-3.5 h-3.5 text-white/50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ml-1"
        :class="isDropdownOpen ? 'rotate-180 text-white' : 'rotate-0'"
      />
    </button>

    <!-- Выпадающее меню -->
    <Transition name="dropdown-fade">
      <!-- ОБЕРТКА: Используем pt-2.5 для создания мостика, чтобы курсор не проваливался -->
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 top-full pt-2.5 w-52 z-40 origin-top-right"
      >
        <!-- САМО МЕНЮ -->
        <div class="panel-glass-menu p-1.5 rounded-3xl shadow-2xl space-y-1">
          <button
            v-for="opt in viewOptions"
            :key="opt.id"
            type="button"
            class="group w-full flex items-center gap-3 px-2.5 py-1.5 rounded-[20px] text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95"
            :class="
              modelValue === opt.id
                ? 'bg-sky-500/10 text-white border border-sky-400/20 shadow-[inset_0_0_12px_rgba(56,189,248,0.1)]'
                : 'text-white/70 hover:bg-white/[0.08] hover:text-white border border-transparent'
            "
            @click="selectMode(opt.id)"
          >
            <!-- Иконка в списке -->
            <div
              class="size-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ease-out group-hover:scale-105"
              :class="
                modelValue === opt.id
                  ? 'bg-sky-400/20 text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.3)]'
                  : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white'
              "
            >
              <component :is="opt.icon" class="w-4 h-4" />
            </div>
            <div class="text-xs font-medium tracking-wide truncate">{{ opt.label }}</div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-glass-btn {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.65));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
}

.panel-glass-menu {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.85));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(var(--input-blur, 32px));
  -webkit-backdrop-filter: blur(var(--input-blur, 32px));
  box-shadow:
    var(--input-shadow, 0 16px 40px rgba(0, 0, 0, 0.45)),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
}

/* Эффект блика */
.glass-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.12), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
  transition: none;
}

.group\/btn:hover .glass-shine {
  animation: shine-sweep 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes shine-sweep {
  0% { left: -100%; }
  100% { left: 200%; }
}

/* Премиум-анимация появления меню (с блюром) */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  filter: blur(4px);
}
</style>