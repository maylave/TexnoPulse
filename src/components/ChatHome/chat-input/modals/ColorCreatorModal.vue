<!-- src/components/ChatHome/chat-input/modals/ColorCreatorModal.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { X, Check, Palette, Copy, Plus, Trash2 } from "lucide-vue-next";

const emit = defineEmits<{
  close: [];
  confirm: [payload: { color: string; title: string }];
}>();

const primaryColor = ref("#38bdf8");
const customTitle = ref("");
const isCopied = ref(false);

// Поддержка сборки палитры из нескольких цветов
const paletteColors = ref<string[]>(["#38bdf8"]);

const presets = [
  { name: "Neon Sky", hex: "#38bdf8" },
  { name: "Cyber Cyan", hex: "#06b6d4" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Electric Violet", hex: "#8b5cf6" },
  { name: "Sunset Orange", hex: "#f97316" },
  { name: "Rose Pink", hex: "#f43f5e" },
  { name: "Amber Gold", hex: "#f59e0b" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Mint", hex: "#34d399" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Slate Dark", hex: "#1e293b" },
  { name: "Pure White", hex: "#ffffff" },
];

const selectPreset = (hex: string) => {
  primaryColor.value = hex;
  if (paletteColors.value.length === 1) {
    paletteColors.value[0] = hex;
  }
};

const addColorToPalette = () => {
  if (paletteColors.value.length < 5) {
    paletteColors.value.push(primaryColor.value);
  }
};

const removeColorFromPalette = (index: number) => {
  if (paletteColors.value.length > 1) {
    paletteColors.value.splice(index, 1);
  }
};

const copyHex = () => {
  navigator.clipboard.writeText(primaryColor.value);
  isCopied.value = true;
  setTimeout(() => (isCopied.value = false), 1500);
};

const handleConfirm = () => {
  // Если в палитре несколько цветов, объединяем их через пробел
  const finalColorValue = paletteColors.value.join(" ");
  const title =
    customTitle.value.trim() ||
    (paletteColors.value.length > 1
      ? `Палитра (${paletteColors.value.length})`
      : primaryColor.value.toUpperCase());

  emit("confirm", {
    color: finalColorValue,
    title,
  });
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-white/10 bg-[#121620]/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white animate-scaleIn"
    >
      <!-- Шапка -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="size-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400"
          >
            <Palette class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-tight">
              Выбор цвета / Палитры
            </h3>
            <p class="text-xs text-white/50 leading-tight">
              HEX, готовые пресеты или мульти-палитра
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="size-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-5 space-y-4">
        <!-- Превью выбранного цвета / полос палитры -->
        <div
          class="w-full h-24 rounded-xl border border-white/15 overflow-hidden shadow-inner flex relative group"
        >
          <div
            v-for="(col, idx) in paletteColors"
            :key="idx"
            class="flex-1 h-full flex flex-col items-center justify-center relative transition-all duration-300"
            :style="{ backgroundColor: col }"
          >
            <span
              class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-white shadow select-none"
            >
              {{ col.toUpperCase() }}
            </span>

            <button
              v-if="paletteColors.length > 1"
              type="button"
              @click.stop="removeColorFromPalette(idx)"
              class="absolute top-1 right-1 size-5 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Удалить из палитры"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Управление текущим цветом -->
        <div class="flex items-center gap-3">
          <!-- Нативный селектор цвета -->
          <div class="relative size-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
            <input
              type="color"
              v-model="primaryColor"
              class="absolute -inset-2 w-16 h-16 cursor-pointer opacity-0"
            />
            <div
              class="w-full h-full rounded-xl"
              :style="{ backgroundColor: primaryColor }"
            ></div>
          </div>

          <!-- Текстовый ввод HEX -->
          <div class="flex-1 relative">
            <input
              v-model="primaryColor"
              placeholder="#38BDF8"
              class="w-full text-xs font-mono px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400 uppercase"
            />
          </div>

          <button
            type="button"
            @click="copyHex"
            class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
            :title="isCopied ? 'Скопировано!' : 'Копировать HEX'"
          >
            <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
            <Copy v-else class="w-3.5 h-3.5" />
            <span>{{ isCopied ? "Готово!" : "Копия" }}</span>
          </button>

          <button
            type="button"
            @click="addColorToPalette"
            :disabled="paletteColors.length >= 5"
            class="px-3 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 hover:bg-sky-500/30 text-sky-400 text-xs font-medium flex items-center gap-1 transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Добавить текущий цвет в мульти-палитру"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>В набор</span>
          </button>
        </div>

        <!-- Название цвета / заметка -->
        <div>
          <label class="block text-[11px] font-medium text-white/50 mb-1">
            Название цвета или заметка (необязательно)
          </label>
          <input
            v-model="customTitle"
            placeholder="Например: Цвет кнопки, Акцент темы..."
            class="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
          />
        </div>

        <!-- Популярные пресеты -->
        <div>
          <label class="block text-[11px] font-medium text-white/50 mb-2">
            Готовые оттенки
          </label>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="p in presets"
              :key="p.hex"
              type="button"
              @click="selectPreset(p.hex)"
              class="h-8 rounded-lg border transition-transform hover:scale-110 active:scale-95 flex items-center justify-center relative group"
              :class="
                primaryColor.toLowerCase() === p.hex.toLowerCase()
                  ? 'border-white ring-2 ring-sky-400'
                  : 'border-white/10'
              "
              :style="{ backgroundColor: p.hex }"
              :title="p.name"
            >
              <Check
                v-if="primaryColor.toLowerCase() === p.hex.toLowerCase()"
                class="w-3.5 h-3.5 text-black drop-shadow"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Подвал -->
      <div
        class="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-2"
      >
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          @click="handleConfirm"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white flex items-center gap-1.5 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25"
        >
          <Check class="w-3.5 h-3.5" /> Прикрепить цвет
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
.animate-scaleIn {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
