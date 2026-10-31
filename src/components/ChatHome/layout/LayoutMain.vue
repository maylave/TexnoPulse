<!-- src/components/ChatHome/layout/LayoutMain.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import ViewModeSelector, { type ViewMode } from './ViewModeSelector.vue'
import ChatView from './ChatView.vue'
import NodeGraphView from '../graph/NodeGraphView.vue'
import InfiniteCanvasView from '../canvas/InfiniteCanvasView.vue'
import { useNodeStore } from '@/stores/node'
import HistoryBar from '../historyBar/HistoryBar.vue'
import { Puzzle, Info } from 'lucide-vue-next'

const viewMode = ref<ViewMode>('chat')
const nodeStore = useNodeStore()

const openChatFromVisualView = (chatId: string) => {
  nodeStore.selectChat(chatId)
  viewMode.value = 'chat'
}

import { useRouter } from 'vue-router'

const router = useRouter()

const goToPluginPage = () => {
 
  router.push('/plugin') 
}

</script>

<template>
  <main class="relative h-screen w-full overflow-hidden bg-background">
    <!-- Кнопка и меню выбора режима -->
    <div class="absolute top-4 right-4 z-30 group">
      
      <!-- Триггер ("i") с анимацией "дыхания" (pulse-soft) -->
      <button
        class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-sm text-white/80 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-0 group-hover:scale-75 group-hover:-translate-y-2 group-hover:blur-sm pointer-events-auto pulse-soft"
      >
        <Info class="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
      </button>

      <!-- Контейнер меню -->
      <div class="absolute top-0 right-0 flex flex-col gap-2.5 pointer-events-none group-hover:pointer-events-auto">
        
        <!-- Кнопка Plugin (добавлен класс group/btn для внутренних эффектов) -->
        <button
          class="group/btn relative overflow-hidden panel-glass-btn flex items-center px-4 py-2.5 rounded-2xl text-xs font-medium text-white/90 whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 -translate-y-4 scale-90 blur-sm group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:blur-none group-hover:delay-75 hover:border-white/30 hover:bg-white/[0.12] active:scale-95 gap-2.5"
          @click="goToPluginPage"
        >
          <!-- Эффект пробегающего блика -->
          <div class="glass-shine"></div>

          <!-- Иконка с микро-анимацией (scale и rotate) -->
          <Puzzle class="relative z-10 w-4 h-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-transform duration-300 ease-out group-hover/btn:scale-110 group-hover/btn:rotate-12" />
          
          <span class="relative z-10 tracking-wide">plugin</span>
        </button>

        <!-- Выбор режима -->
        <div class="transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 -translate-y-4 scale-90 blur-sm group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:blur-none group-hover:delay-150">
          <ViewModeSelector v-model="viewMode" />
        </div>
        
      </div>
    </div>

    <!-- Режимы отображения -->
    <ChatView v-if="viewMode === 'chat'" />

    <NodeGraphView
      v-else-if="viewMode === 'graph'"
      @open-chat="openChatFromVisualView"
    />

    <InfiniteCanvasView
      v-else-if="viewMode === 'canvas'"
      @open-chat="openChatFromVisualView"
    />
    
    <HistoryBar />
  </main>
</template>

<style scoped>
/* Твои базовые стили стекла */
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
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 16px 40px rgba(0, 0, 0, 0.45)),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
}

/* 1. Эффект блика для кнопки (Shine) */
.glass-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
  transition: none;
}

/* Запускаем блик только при наведении на саму кнопку (group/btn) */
.group\/btn:hover .glass-shine {
  animation: shine-sweep 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes shine-sweep {
  0% { left: -100%; }
  100% { left: 200%; }
}

/* 2. Мягкое дыхание для иконки "i" */
.pulse-soft {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.05); }
  50% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
}
</style>