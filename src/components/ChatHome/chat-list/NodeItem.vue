<!-- src/components/ChatHome/sidebar/NodeItem.vue -->
<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import {
  FolderPlus,
  MessageSquarePlus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-vue-next";
import { useNodeStore } from "@/stores/node";
import { useModalStore } from "@/stores/appModal";
import type { AppNode } from "@/types/chat";
import FolderRow from "./FolderRow.vue";
import ChatRow from "./ChatRow.vue";

export interface NodeContextMenuPayload {
  x: number;
  y: number;
  node: AppNode;
  type: AppNode["type"];
  isCollapsed: boolean;
  isActive: boolean;
}

const props = defineProps<{
  node: AppNode;
}>();

const emit = defineEmits<{
  (e: "contextmenu", payload: NodeContextMenuPayload): void;
}>();

const nodeStore = useNodeStore();
const modal = useModalStore();

const children = computed(() => nodeStore.getChildren(props.node.id));
const isCollapsed = computed(() => !!props.node.metaDate.folder?.collapsed);
const isActiveChat = computed(
  () => props.node.type === "chat" && nodeStore.activeChatId === props.node.id,
);

const creatingType = ref<"folder" | "chat" | null>(null);
const newLabel = ref("");
const createInputRef = ref<HTMLInputElement | null>(null);

const openEdit = () => modal.open("editNode", props.node);

const startCreate = async (type: "folder" | "chat") => {
  creatingType.value = type;
  newLabel.value = "";
  if (props.node.metaDate.folder?.collapsed) {
    await nodeStore.toggleFolder(props.node.id);
  }
  await nextTick();
  createInputRef.value?.focus();
};

const confirmCreate = async () => {
  const labelToCreate = newLabel.value.trim();
  const typeToCreate = creatingType.value;

  if (!typeToCreate || !labelToCreate) {
    creatingType.value = null;
    return;
  }

  creatingType.value = null;
  newLabel.value = "";

  await nodeStore.createNode({
    label: labelToCreate,
    type: typeToCreate,
    parentId: props.node.id,
  });
};

// Правый клик: отдаём наверх координаты и состояние узла
const onContextMenu = (e: MouseEvent) => {
  emit("contextmenu", {
    x: e.clientX,
    y: e.clientY,
    node: props.node,
    type: props.node.type,
    isCollapsed: isCollapsed.value,
    isActive: isActiveChat.value,
  });
};

const isDragOver = ref(false);

const onDragStart = (e: DragEvent) => {
  e.stopPropagation();
  nodeStore.draggedNodeId = props.node.id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", props.node.id);
  }
};

const onDragEnd = () => {
  nodeStore.draggedNodeId = null;
  isDragOver.value = false;
};

const onDragOver = (e: DragEvent) => {
  e.stopPropagation();
  if (nodeStore.draggedNodeId === props.node.id) return;
  isDragOver.value = true;
};

const onDragLeave = (e: DragEvent) => {
  e.stopPropagation();
  isDragOver.value = false;
};

const onDrop = async (e: DragEvent) => {
  e.stopPropagation();
  isDragOver.value = false;

  const draggedId =
    nodeStore.draggedNodeId || e.dataTransfer?.getData("text/plain");
  if (!draggedId || draggedId === props.node.id) return;

  const rawParentId =
    props.node.type === "folder" ? props.node.id : props.node.parentId;
  const targetParentId: string | undefined = rawParentId || undefined;

  await nodeStore.moveNode(draggedId, targetParentId);
  nodeStore.draggedNodeId = null;
};
</script>

<template>
  <div
    class="select-none transition-all duration-200 rounded-lg"
    :class="{
      'opacity-40 scale-[0.98]': nodeStore.draggedNodeId === node.id,
      'ring-2 ring-sky-400/70 bg-sky-500/10': isDragOver,
    }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <!-- Папка -->
    <FolderRow
      v-if="node.type === 'folder'"
      :node="node"
      class="group"
      @click="nodeStore.toggleFolder(node.id)"
    >
      <div class="flex items-center gap-1" @click.stop>
        <button
          type="button"
          title="Создать чат в папке"
          class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          @click="startCreate('chat')"
        >
          <MessageSquarePlus class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Создать подпапку"
          class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          @click="startCreate('folder')"
        >
          <FolderPlus class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Редактировать папку"
          class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          @click="openEdit"
        >
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Удалить папку"
          class="p-1 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"
          @click="nodeStore.deleteNode(node.id)"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </FolderRow>

    <!-- Чат -->
    <ChatRow
      v-else
      :node="node"
      class="group"
      :class="{ 'bg-white/10 ring-1 ring-white/15': isActiveChat }"
      @click="nodeStore.selectChat(node.id)"
    >
      <div class="flex items-center gap-1">
        <button
          type="button"
          title="Редактировать чат"
          class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          @click.stop="openEdit"
        >
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Удалить чат"
          class="p-1 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"
          @click.stop="nodeStore.deleteNode(node.id)"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </ChatRow>

    <!-- Вложенные дочерние элементы -->
    <Transition name="folder-collapse">
      <div
        v-if="node.type === 'folder' && !isCollapsed"
        class="pl-3.5 ml-2.5 border-l border-white/10 mt-0.5 space-y-0.5 overflow-hidden"
      >
        <!-- Форма создания внутри папки -->
        <form
          v-if="creatingType"
          class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-sky-400/40 my-1"
          @submit.prevent="confirmCreate"
          @click.stop
          @mousedown.stop
        >
          <input
            ref="createInputRef"
            v-model="newLabel"
            type="text"
            :placeholder="
              creatingType === 'folder' ? 'Имя папки...' : 'Имя чата...'
            "
            class="w-full bg-transparent text-xs text-white focus:outline-none"
            @keydown.esc="creatingType = null"
          />
          <button
            type="submit"
            title="Подтвердить"
            class="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 transition"
            @mousedown.prevent
          >
            <Check class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Отмена"
            class="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition"
            @click.stop="creatingType = null"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </form>

        <!-- Список вложенных элементов -->
        <TransitionGroup name="tree-list" tag="div" class="space-y-0.5">
          <NodeItem
            v-for="child in children"
            :key="child.id"
            :node="child"
            @contextmenu="emit('contextmenu', $event)"
          />
        </TransitionGroup>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.folder-collapse-enter-active,
.folder-collapse-leave-active {
  transition:
    max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease,
    transform 0.2s ease;
  max-height: 1000px;
}
.folder-collapse-enter-from,
.folder-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateX(-4px);
}

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