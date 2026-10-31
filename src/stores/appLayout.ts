import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  const isLeftSidebarOpen = ref(true);
  const isModalSettingsOpen = ref(false);
  const isRightSidebarOpen = ref(false);
  const isModalEditorOpen = ref(false);
  function toggleLeftSidebar() {
    isLeftSidebarOpen.value = !isLeftSidebarOpen.value;
    isRightSidebarOpen.value = false;
  }

  function toggleRightSidebar() {
    isRightSidebarOpen.value = !isRightSidebarOpen.value;
    isLeftSidebarOpen.value = false;
  }

  function setLeftSidebar(status: boolean) {
    isLeftSidebarOpen.value = status;
  }

  function setRightSidebar(status: boolean) {
    isRightSidebarOpen.value = status;
  }

  return {
    isLeftSidebarOpen,
    isRightSidebarOpen,
    isModalEditorOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    setLeftSidebar,
    setRightSidebar,
    isModalSettingsOpen,
  };
});
