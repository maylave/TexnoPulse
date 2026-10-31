<script setup lang="ts">
import LayoutBackground from "@/components/ChatHome/layout/LayoutBackground.vue";
import LayoutMain from "@/components/ChatHome/layout/LayoutMain.vue";
import LayoutSidebar from "@/components/ChatHome/layout/LayoutSidebar.vue";
import RightSidebar from "@/components/ChatHome/right-sidebar/RightSidebar.vue";
import ContexMenu from "@/components/ui/ContexMenu.vue";
import ModalHost from "@/components/ui/ModalHost.vue";
import { useBackgroundStore } from "@/stores/background";
import { useAppStore } from "@/stores/appLayout";
import { useModalStore } from '@/stores/appModal';
import { onMounted } from "vue";
const modal = useModalStore()
const backgroundStore = useBackgroundStore();
const appStore = useAppStore();


onMounted(() => {
 

 
 
});
</script>

<template>
  <div class="relative flex h-screen w-full overflow-hidden text-white">
    <!-- Фон -->
    <LayoutBackground
      class="absolute inset-0 z-0"
      :background="backgroundStore.currentBackground"
    />

    <!-- ПЛАВАЮЩАЯ КНОПКА (Стрелка по центру левого края) -->
    <button
      v-if="!appStore.isLeftSidebarOpen"
      @click="appStore.toggleLeftSidebar()"
      class="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-8 h-24 bg-[var(--sidebar-bg,#122131)]/70 backdrop-blur-lg border border-white/10 border-l-0 rounded-r-2xl text-[var(--color-on-surface-variant)] hover:text-white hover:bg-[var(--sidebar-bg,#122131)]/90 hover:w-10 transition-all duration-300 shadow-lg cursor-pointer"
      title="Открыть панель"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
   
    <!-- ЛЕВЫЙ САЙДБАР -->
    <LayoutSidebar class="relative z-10 hidden md:flex flex-shrink-0" />

    <!-- ГЛАВНАЯ ЗОНА (ЧАТ) -->
    <LayoutMain class="relative z-10 flex-1 bg-transparent" />

    <!-- ПРАВЫЙ САЙДБАР (ИНФОРМАЦИЯ) -->
    <RightSidebar class="relative z-10 flex-shrink-0" />

    <ContexMenu />

    
    <ModalHost />
  </div>
</template>