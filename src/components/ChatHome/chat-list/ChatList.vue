<!-- src/components/ChatHome/sidebar/ChatList.vue -->
<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import { FolderPlus, MessageSquarePlus, Check, X } from "lucide-vue-next";
import { useNodeStore } from "@/stores/node";
import { useContextMenuStore } from "@/stores/contexMenu";
import {
  getChatMenuItems,
  type ChatMenuContext,
} from "@/config/contextMenu/ChatContext";
import NodeItem, { type NodeContextMenuPayload } from "./NodeItem.vue";
import { useModalStore } from "@/stores/appModal";
const nodeStore = useNodeStore();
const contextMenu = useContextMenuStore();

const creatingRootType = ref<"folder" | "chat" | null>(null);
const creatingParentId = ref<string | undefined>(undefined);
const rootLabel = ref("");
const rootInputRef = ref<HTMLInputElement | null>(null);
const isRootDragOver = ref(false);


const modal = useModalStore();
// Состояние загрузки для скелетона
const isLoading = ref(true);

onMounted(async () => {
  isLoading.value = true;
  try {
    await nodeStore.fetchNodes();
  } finally {
    isLoading.value = false;
  }
});

const startCreate = async (
  type: "folder" | "chat",
  parentId?: string,
  parentCollapsed = false,
) => {
  creatingRootType.value = type;
  creatingParentId.value = parentId;
  rootLabel.value = "";

  // Раскрываем папку, чтобы новый элемент был виден
  if (parentId && parentCollapsed) {
    await nodeStore.toggleFolder(parentId);
  }

  await nextTick();
  rootInputRef.value?.focus();
};

const cancelCreate = () => {
  creatingRootType.value = null;
  creatingParentId.value = undefined;
};

const confirmRootCreate = async () => {
  const labelToCreate = rootLabel.value.trim();
  const typeToCreate = creatingRootType.value;
  const parentId = creatingParentId.value;

  if (!typeToCreate || !labelToCreate) {
    cancelCreate();
    return;
  }

  cancelCreate();
  rootLabel.value = "";

  await nodeStore.createNode({
    label: labelToCreate,
    type: typeToCreate,
    parentId,
  });
};

const onDropToRoot = async (e: DragEvent) => {
  isRootDragOver.value = false;
  const draggedId =
    nodeStore.draggedNodeId || e.dataTransfer?.getData("text/plain");
  if (!draggedId) return;

  await nodeStore.moveNode(draggedId, undefined);
  nodeStore.draggedNodeId = null;
};

// Контекстное меню: правый клик по узлу
const onNodeContextMenu = (p: NodeContextMenuPayload) => {
  const context: ChatMenuContext = p.type === "folder" ? "folder" : "node";

  const items = getChatMenuItems(
    {
      onCreateChat: () => startCreate("chat", p.node.id, p.isCollapsed),
      onCreateFolder: () => startCreate("folder", p.node.id, p.isCollapsed),
      onEditNode: () => {
        // TODO: переименование
       modal.open("editNode", p.node)
      },
      onDeleteNode: () => nodeStore.deleteNode(p.node.id),
    },
    context,
  );

  contextMenu.openAtPoint(p.x, p.y, items);
};

// Контекстное меню: правый клик по свободному месту
const onRootContextMenu = (e: MouseEvent) => {
  const items = getChatMenuItems(
    {
      onCreateChat: () => startCreate("chat"),
      onCreateFolder: () => startCreate("folder"),
      onEditNode: () => {},
      onDeleteNode: () => {},
    },
    "root",
  );

  contextMenu.openAtPoint(e.clientX, e.clientY, items);
};
</script>

<template>
  <!-- Обработчик на внешнем контейнере: покрывает всю область списка -->
  <div
    class="flex flex-col flex-1 min-h-0"
    @contextmenu.prevent="onRootContextMenu"
  >
    <!-- Шапка навигации с кнопками создания в корне -->
    <div
      class="flex items-center justify-between px-3 py-1.5 text-xs text-white/50"
    >
      <span class="font-medium uppercase tracking-wider text-[11px]">
        Навигация
      </span>
      <div class="flex items-center gap-1">
        <button
          type="button"
          title="Новый чат"
          class="p-1 rounded hover:bg-white/10 hover:text-white transition"
          @click="startCreate('chat')"
        >
          <MessageSquarePlus class="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Новая папка"
          class="p-1 rounded hover:bg-white/10 hover:text-white transition"
          @click="startCreate('folder')"
        >
          <FolderPlus class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Форма создания элемента (в корне или внутри выбранной папки) -->
    <form
      v-if="creatingRootType"
      class="mx-2 mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-sky-400/40"
      @submit.prevent="confirmRootCreate"
      @click.stop
      @mousedown.stop
      @contextmenu.stop
    >
      <input
        ref="rootInputRef"
        v-model="rootLabel"
        type="text"
        :placeholder="
          creatingRootType === 'folder'
            ? 'Название папки...'
            : 'Название чата...'
        "
        class="w-full bg-transparent text-xs text-white focus:outline-none"
        @keydown.esc="cancelCreate"
      />
      <button
        type="submit"
        title="Создать"
        class="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 transition"
        @mousedown.prevent
      >
        <Check class="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Отмена"
        class="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition"
        @click.stop="cancelCreate"
      >
        <X class="w-4 h-4" />
      </button>
    </form>

    <!-- Список узлов со сбросом в корень -->
    <div
      class="flex-1 min-h-0 flex flex-col overflow-y-auto px-2 py-1 custom-scrollbar transition-colors rounded-lg"
      :class="{ 'bg-sky-500/5 ring-1 ring-sky-400/30': isRootDragOver }"
      @dragover.prevent="isRootDragOver = true"
      @dragleave="isRootDragOver = false"
      @drop="onDropToRoot"
    >
      <!-- Скелетная загрузка -->
      <template v-if="isLoading">
        <div class="space-y-1.5 px-1 animate-pulse mt-2">
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center gap-2.5 px-2 py-1.5"
          >
            <div class="w-4 h-4 rounded-[4px] bg-white/10 shrink-0"></div>
            <div
              class="h-3 rounded-[4px] bg-white/10"
              :class="i % 2 === 0 ? 'w-24' : 'w-32'"
            ></div>
          </div>
        </div>
      </template>

      <!-- Реальные данные -->
      <template v-else>
        <TransitionGroup
          name="tree-list"
          tag="div"
          class="space-y-1 flex-1 min-h-24"
        >
          <NodeItem
            v-for="node in nodeStore.rootNodes"
            :key="node.id"
            :node="node"
            @contextmenu="onNodeContextMenu"
          />
        </TransitionGroup>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tree-list-move,
.tree-list-enter-active,
.tree-list-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tree-list-enter-from,
.tree-list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>