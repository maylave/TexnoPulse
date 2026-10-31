<!-- src/components/ui/ModalHost.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { useModalStore } from "@/stores/appModal";

const store = useModalStore();

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && store.active?.closeOnEsc) store.close();
};

const onBackdrop = () => {
  if (store.active?.closeOnBackdrop) store.close();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="store.active"
        class="fixed inset-0 z-40 flex items-center justify-center "
        @mousedown.self="onBackdrop"
      >
        <!-- key пересоздаёт компонент при смене модалки -->
        <component :is="store.active.component" :key="store.active.id" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
