<!-- src/components/ChatHome/chat-input/SuggestionsMenu.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { WordEntry } from "@/stores/wordFrequency";
import {
  Code2,
  FileCode2,
  MessageSquareQuote,
  Layers,
  CornerDownLeft,
  TrendingUp,
  Braces,
  Sliders,
  Type,
} from "lucide-vue-next";

const props = defineProps<{
  suggestions: WordEntry[];
  selectedIndex: number;
  prefix: string;
}>();

const emit = defineEmits<{
  select: [item: WordEntry];
  close: [];
}>();

const formatMatch = (fullWord: string, searchPrefix: string) => {
  const p = searchPrefix.toLowerCase();
  const lower = fullWord.toLowerCase();
  const idx = lower.indexOf(p);

  if (idx === -1) {
    return { before: "", matched: "", after: fullWord };
  }

  return {
    before: fullWord.substring(0, idx),
    matched: fullWord.substring(idx, idx + p.length),
    after: fullWord.substring(idx + p.length),
  };
};

const getKindBadge = (item: WordEntry) => {
  if (item.kind === "color") {
    return {
      label: "hex",
      color: "bg-white/10 text-white border-white/20",
      detail: item.detail || "цвет",
      isColor: true,
      swatch: item.word,
    };
  }
  if (item.kind === "snippet") {
    return {
      label: "snip",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      detail: item.detail || "snippet",
    };
  }
  if (item.kind === "function") {
    return {
      label: "fn",
      color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      detail: item.detail || "(method)",
    };
  }
  if (item.kind === "keyword") {
    return {
      label: "key",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      detail: item.detail || "keyword",
    };
  }
  if (item.kind === "property") {
    return {
      label: "prop",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      detail: item.detail || "(property)",
    };
  }
  if (item.kind === "class" || item.kind === "interface") {
    return {
      label: "type",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      detail: item.detail || item.kind,
    };
  }
  if (item.category === "code") {
    return {
      label: "code",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      detail: item.detail || "code",
    };
  }
  return {
    label: "word",
    color: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    detail: item.detail || "частое",
  };
};
</script>

<template>
  <div
    class="suggestions-menu absolute bottom-full left-4 mb-2.5 z-40 panel-glass overflow-hidden select-none animate-scaleIn min-w-[300px] max-w-[400px]"
    @click.stop
  >
    <!-- Шапка подсказок -->
    <div
      class="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-white/[0.02] text-[11px] text-white/50"
    >
      <div class="flex items-center gap-1.5 font-medium">
        <Layers class="w-3.5 h-3.5 text-sky-400" />
        <span>Подсказки (VS Code + частые слова)</span>
      </div>

      <div class="flex items-center gap-1 font-mono text-[10px] text-white/40">
        <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white/80">Tab</kbd>
        <span>или</span>
        <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white/80">Enter</kbd>
      </div>
    </div>

    <!-- Список совпадений -->
    <div class="p-1.5 flex flex-col gap-0.5 max-h-[240px] overflow-y-auto custom-scrollbar">
      <button
        v-for="(item, idx) in props.suggestions"
        :key="item.word"
        type="button"
        @mousedown.prevent="emit('select', item)"
        class="flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-all duration-150 group"
        :class="
          idx === props.selectedIndex
            ? 'bg-sky-500/20 text-white border border-sky-500/30'
            : 'text-white/80 hover:bg-white/5 border border-transparent'
        "
      >
        <!-- Иконка / бейдж вида в стиле VS Code и текст слова -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            v-if="item.kind === 'color'"
            class="size-6 rounded-lg bg-black/30 border border-white/20 shrink-0 flex items-center justify-center p-0.5"
          >
            <div
              class="w-full h-full rounded-md border border-white/30 shadow-inner"
              :style="{ backgroundColor: item.word }"
            ></div>
          </div>
          <div
            v-else
            class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 flex items-center justify-center min-w-[34px]"
            :class="getKindBadge(item).color"
          >
            {{ getKindBadge(item).label }}
          </div>

          <div class="flex flex-col min-w-0">
            <span
              class="text-xs font-mono font-medium truncate"
              :class="item.category === 'code' ? 'text-white' : 'font-sans'"
            >
              <span class="opacity-70">{{ formatMatch(item.word, props.prefix).before }}</span>
              <span class="text-sky-300 font-bold underline decoration-sky-400/50 underline-offset-2">
                {{ formatMatch(item.word, props.prefix).matched }}
              </span>
              <span>{{ formatMatch(item.word, props.prefix).after }}</span>
            </span>

            <span
              v-if="item.hint"
              class="text-[10px] text-white/40 leading-none truncate"
            >
              {{ item.hint }}
            </span>
          </div>
        </div>

        <!-- Правая часть: тип метода/сниппета и частота использования -->
        <div class="flex items-center gap-2 shrink-0">
          <span
            v-if="getKindBadge(item).detail"
            class="text-[10px] font-mono text-white/35 group-hover:text-white/50 truncate max-w-[100px]"
          >
            {{ getKindBadge(item).detail }}
          </span>

          <span
            v-if="item.count > 1"
            class="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-sky-300/80 group-hover:text-sky-200 border border-white/5"
            :title="`Частое слово: использовано ${item.count} раз`"
          >
            <TrendingUp class="w-2.5 h-2.5 text-sky-400" />
            {{ item.count }}
          </span>

          <CornerDownLeft
            v-if="idx === props.selectedIndex"
            class="w-3 h-3 text-sky-400 animate-pulse"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.65));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 2px 4px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-scaleIn {
  animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
