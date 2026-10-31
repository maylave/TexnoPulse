<script setup lang="ts">
import { useAppStore } from "@/stores/appLayout";

const appStore = useAppStore();

const members = [
  { id: 1, name: 'Влад', role: 'Владелец', color: 'bg-blue-500' },
  { id: 2, name: 'Мария', role: 'Дизайнер', color: 'bg-purple-500' },
];

const files = [
  { id: 1, name: 'Technical_Spec.pdf', size: '1.2 MB', type: 'pdf' },
  { id: 2, name: 'UI_Kit_Aether.zip', size: '45.4 MB', type: 'zip' },
];
</script>

<template>
  <!-- Главный анимированный контейнер -->
  <div 
    class="right-sidebar bg-[#2d1b4e]/60 backdrop-blur-xl border-l border-white/10 transition-all duration-300 ease-in-out overflow-hidden"
    :class="{ 'is-hidden': !appStore.isRightSidebarOpen }"
  >
    <!-- Внутренний контейнер с жесткой шириной (чтобы контент красиво "уезжал", а не сжимался) -->
    <div class="w-80 h-full flex flex-col text-[var(--color-on-surface)]">
      
      <!-- Шапка правой панели -->
      <div class="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <h3 class="font-medium text-sm">Информация о чате</h3>
        
        <!-- КНОПКА ЗАКРЫТИЯ -->
        <button
          @click="appStore.setRightSidebar(false)"
          class="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-white/10 hover:text-white transition-colors"
          title="Закрыть панель"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Контентная часть (участники, файлы) -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <!-- Блок с основной информацией -->
        <div class="flex flex-col items-center text-center pt-2">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-tertiary)] mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            A
          </div>
          <h2 class="text-lg font-semibold text-white">Разработка Aether</h2>
          <p class="text-xs text-[var(--color-on-surface-variant)] mt-1">3 участника • Создано сегодня</p>
        </div>

        <!-- Участники -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-3">Участники</h4>
          <div class="space-y-2">
            <div v-for="member in members" :key="member.id" class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" :class="member.color">
                {{ member.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ member.name }}</div>
                <div class="text-[10px] text-[var(--color-on-surface-variant)]">{{ member.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Задаем базовую ширину для панели */
.right-sidebar {
  width: 20rem; /* 80 в единицах Tailwind (320px) */
  height: 100vh;
}

/* Класс скрытия: сворачивает ширину в 0 */
.right-sidebar.is-hidden {
  width: 0 !important;
  border-left-width: 0;
  opacity: 0;
}

/* Стили скроллбара */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>