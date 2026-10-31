<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Settings as SettingsIcon, Puzzle } from "lucide-vue-next";
import Search from "../sidebar/Search.vue";
import ChatList from "../chat-list/ChatList.vue";
import { useAppStore } from "@/stores/appLayout"; 
import { useModalStore } from "@/stores/appModal";

const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();
const searchQuery = ref("");
</script>

<template>
  <div 
    class="sidebar liquid-glass transition-all duration-300 ease-in-out overflow-hidden"
    :class="{ 'is-hidden': !appStore.isLeftSidebarOpen }"
  >
    <!-- Внутренняя обертка с фиксированной шириной -->
    <div class="w-[var(--sidebar-width,280px)] h-full flex flex-col">
      
      <!-- Шапка сайдбара: Поиск + Плагины + Настройки + Кнопка закрытия -->
      <div class="p-4 shrink-0 flex items-center gap-1.5">
        
        <!-- Обертка поиска: flex-1 дает занять свободное место, min-w-0 не дает вытолкнуть кнопку -->
        <div class="flex-1 min-w-0">
          <Search v-model="searchQuery" class="w-full" />
        </div>

        <!-- Кнопка перехода в маркетплейс плагинов и тем -->
       
        
        <!-- Кнопка открытия настроек -->
        <button 
          @click="modalStore.open('settings')"
          class="shrink-0 p-2 flex items-center justify-center rounded-full text-[var(--color-on-surface-variant)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          title="Настройки"
        >
          <SettingsIcon class="w-4 h-4" />
        </button>

        <!-- КНОПКА ЗАКРЫТИЯ САЙДБАРА: shrink-0 запрещает кнопке сжиматься -->
        <button 
          @click="appStore.toggleLeftSidebar()"
          class="shrink-0 p-2 flex items-center justify-center rounded-full text-[var(--color-on-surface-variant)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          title="Скрыть панель"
        >
          <!-- Иконка стрелочки влево -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- Список чатов: flex-колонка, чтобы ChatList занял всю высоту -->
      <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ChatList />
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  /* Ширина возвращена на место */
  width: var(--sidebar-width, 280px);
  background-color: var(--sidebar-bg, #122131);
  border-right: 1px solid var(--color-outline-variant, #2e3033);

  display: flex;
  flex-direction: column;
}

/* Скрываем панель, когда isLeftSidebarOpen === false */
.sidebar.is-hidden {
  width: 0 !important;
  border-right-width: 0;
  opacity: 0;
}
</style>
