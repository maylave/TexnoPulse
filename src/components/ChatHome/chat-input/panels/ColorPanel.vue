<!-- src/components/ChatHome/chat-input/panels/ColorPanel.vue -->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { X, Check, Palette, Clock, MessageSquare, Trash2 } from "lucide-vue-next";
import { useColorMemoryStore, type ColorEntry } from "@/stores/colorMemory";
import { useNodeStore } from "@/stores/node";

const props = defineProps<{
  initialColor?: string;
  initialTitle?: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [payload: { color: string; title: string }];
}>();

const colorMemoryStore = useColorMemoryStore();
const nodeStore = useNodeStore();

const activeChatId = computed(() => nodeStore.activeChatId || "hello");

const selectedColor = ref(props.initialColor || "#38BDF8");
const label = ref(props.initialTitle || "");

watch(
  () => props.initialColor,
  (val) => {
    if (val) selectedColor.value = val;
  },
);
watch(
  () => props.initialTitle,
  (val) => {
    if (val !== undefined) label.value = val;
  },
);

const presets = [
  "#38BDF8", // Sky
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#F97316", // Orange
  "#F43F5E", // Rose
  "#EAB308", // Yellow
  "#64748B", // Slate
  "#FFFFFF", // White
  "#0F172A", // Dark Slate
];

const chatColors = computed(() => colorMemoryStore.getChatColors(activeChatId.value));
const globalColors = computed(() => colorMemoryStore.getGlobalColors());

const selectColorEntry = (item: ColorEntry) => {
  selectedColor.value = item.hex;
  if (item.name) {
    label.value = item.name;
  }
};

const removeColorEntry = (item: ColorEntry, isChat: boolean) => {
  colorMemoryStore.removeColor(item.hex, isChat ? activeChatId.value : undefined);
};

const handleConfirm = () => {
  const finalHex = selectedColor.value.toUpperCase();
  const finalTitle = label.value.trim() || finalHex;

  // Сохраняем в память цветов (для этого чата и глобально)
  colorMemoryStore.rememberColor(
    finalHex,
    finalTitle !== finalHex ? finalTitle : undefined,
    activeChatId.value,
    "panel",
  );

  emit("confirm", {
    color: finalHex,
    title: finalTitle,
  });
};
</script>

<template>
  <div
    class="mb-3 p-4 panel-glass flex flex-col gap-3.5 z-20 relative text-white animate-scaleIn select-none w-full min-w-[320px] box-border"
  >
    <!-- Шапка панели -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div
          class="size-7 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0"
        >
          <Palette class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs font-semibold text-white/90">
            Выбор цвета / HEX
          </h4>
          <p class="text-[10px] text-white/40">
            Запоминается для этого чата и глобальной палитры
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="size-7 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        title="Закрыть"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Основная строка выбора цвета и пресеты -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Нативный инпут цвета в кружочке -->
      <div
        class="relative size-8 rounded-full overflow-hidden border border-white/20 shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform"
        title="Нажмите для выбора из системной палитры"
      >
        <input
          type="color"
          v-model="selectedColor"
          class="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0"
        />
        <div class="w-full h-full" :style="{ backgroundColor: selectedColor }"></div>
      </div>

      <!-- Ввод HEX -->
      <input
        v-model="selectedColor"
        placeholder="#38BDF8"
        class="w-28 text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-sky-400 uppercase text-center shrink-0"
      />

      <!-- Базовые пресеты кружочки -->
      <div class="flex items-center gap-1.5 flex-1 min-w-[180px] overflow-x-auto custom-scrollbar py-1">
        <button
          v-for="hex in presets"
          :key="hex"
          type="button"
          @click="selectedColor = hex"
          class="size-5 rounded-full border border-white/15 transition-transform hover:scale-125 shrink-0"
          :class="{ 'ring-2 ring-white scale-110 shadow-lg': selectedColor.toUpperCase() === hex.toUpperCase() }"
          :style="{ backgroundColor: hex }"
          :title="hex"
        ></button>
      </div>
    </div>

    <!-- Название цвета / метка -->
    <input
      v-model="label"
      placeholder="Название цвета (например: Кнопка, Акцент, Фоновый)"
      class="w-full text-xs px-3 py-2 rounded-xl bg-black/25 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-sky-400"
    />

    <!-- Раздел: Цвета этого чата (если есть) -->
    <div v-if="chatColors.length > 0" class="flex flex-col gap-1.5 pt-1 border-t border-white/5">
      <div class="flex items-center gap-1.5 text-[11px] text-sky-300 font-medium">
        <MessageSquare class="w-3.5 h-3.5 text-sky-400" />
        <span>Использовались в этом чате:</span>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
        <div
          v-for="item in chatColors"
          :key="item.hex + item.chatId"
          class="group/pill relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 shrink-0 cursor-pointer transition-all shadow-sm"
          :class="{ 'border-sky-400/70 bg-sky-500/15 ring-1 ring-sky-400/30': selectedColor.toUpperCase() === item.hex.toUpperCase() }"
          @click="selectColorEntry(item)"
        >
          <span
            class="size-3.5 rounded-full border border-white/30 shrink-0 shadow-inner"
            :style="{ backgroundColor: item.hex }"
          ></span>
          <span class="text-[11px] font-mono text-white/90">
            {{ item.name || item.hex }}
          </span>
          <button
            type="button"
            @click.stop="removeColorEntry(item, true)"
            class="opacity-0 group-hover/pill:opacity-100 hover:text-red-400 p-0.5 text-white/40 transition-opacity ml-0.5"
            title="Забыть цвет в этом чате"
          >
            <Trash2 class="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Раздел: Частые и сохраненные цвета (глобально) -->
    <div v-if="globalColors.length > 0" class="flex flex-col gap-1.5 pt-1 border-t border-white/5">
      <div class="flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
        <Clock class="w-3.5 h-3.5 text-white/50" />
        <span>История и частые цвета:</span>
      </div>
      <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
        <div
          v-for="item in globalColors.slice(0, 10)"
          :key="item.hex"
          class="group/g relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/25 hover:bg-white/5 border border-white/5 shrink-0 cursor-pointer transition-all"
          :class="{ 'border-sky-400/50 bg-sky-500/15': selectedColor.toUpperCase() === item.hex.toUpperCase() }"
          @click="selectColorEntry(item)"
        >
          <span
            class="size-3 rounded-full border border-white/20 shrink-0"
            :style="{ backgroundColor: item.hex }"
          ></span>
          <span class="text-[11px] font-mono text-white/80 truncate max-w-[90px]">
            {{ item.name || item.hex }}
          </span>
        </div>
      </div>
    </div>

    <!-- Подвал панели: подсказка и кнопки действий -->
    <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
      <span class="text-[10px] font-mono text-white/40">
        Синтаксис: <span class="text-sky-300">#HEX</span> или <span class="text-sky-300">color:#HEX [Имя]</span>
      </span>

      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          @click="$emit('close')"
          class="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          @click="handleConfirm"
          class="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Прикрепить</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.75));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar {
  height: 3px;
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-scaleIn {
  animation: scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
