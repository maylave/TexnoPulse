<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  Check,
  ChevronDown,
  Copy,
  FileCode2,
  Maximize2,
  MoreVertical,
} from "lucide-vue-next";
import CodePreview from "../code/CodePreview.vue";
import { getLanguageFromFileName } from "@/utils/language";
import type { Message } from "@/types/message.ts";

type CodeBlock = Extract<Message["content"][number], { type: "code" }>;

const props = defineProps<{
  block: CodeBlock;
}>();

const PREVIEW_LINES = 5;

const isActionsOpen = ref(false);
const isExpanded = ref(false);
const isFullscreen = ref(false);
const isCopied = ref(false);
const actionsRoot = ref<HTMLElement | null>(null);

const onOutsideClick = (e: MouseEvent) => {
  if (actionsRoot.value && !actionsRoot.value.contains(e.target as Node)) {
    isActionsOpen.value = false;
  }
};
onMounted(() => document.addEventListener("mousedown", onOutsideClick));
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onOutsideClick),
);

const language = computed(
  () =>
    props.block.language ??
    (props.block.fileName
      ? getLanguageFromFileName(props.block.fileName)
      : "plaintext"),
);
const title = computed(() => props.block.fileName ?? language.value);

// 🌟 ЗАЩИТА: Гарантируем, что code всегда строка, предотвращая TypeError с .split()
const safeCode = computed(() => {
  const block = props.block as any;

  // Проверяем все возможные варианты, куда инпут мог положить текст кода
  const raw = block.code ?? block.content ?? block.text ?? block.value ?? "";

  // Если это строка — возвращаем её
  if (typeof raw === "string") return raw;

  // Если это вложенный объект (например, сам attachment), ищем текст внутри него
  if (typeof raw === "object" && raw !== null) {
    return String(
      raw.code ||
        raw.content ||
        raw.text ||
        raw.value ||
        block.fileName ||
        JSON.stringify(raw, null, 2),
    );
  }

  return String(raw);
});

const lines = computed(() => safeCode.value.split("\n"));
const hasMore = computed(() => lines.value.length > PREVIEW_LINES);
const preview = computed(() =>
  (isExpanded.value ? lines.value : lines.value.slice(0, PREVIEW_LINES)).join(
    "\n",
  ),
);

const copy = async () => {
  try {
    await navigator.clipboard.writeText(safeCode.value);
    isCopied.value = true;
    setTimeout(() => (isCopied.value = false), 1500);
  } catch (e) {
    console.error(e);
  }
};

const actionBtn =
  "flex size-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-all duration-200 ease-apple hover:bg-white/5 hover:text-on-surface active:scale-90";
</script>

<template>
  <div class="w-full min-w-0 overflow-hidden bg-bg-(--msg-bg-own)/50">
    <div class="flex h-8 items-center justify-between pr-1 pl-3">
      <div class="flex min-w-0 items-center gap-2">
        <FileCode2 class="size-3.5 shrink-0 text-on-surface opacity-80" />
        <p class="truncate text-xs font-medium text-on-surface">
          {{ title }}
        </p>
      </div>

      <div ref="actionsRoot" class="flex items-center gap-0.5">
        <div
          class="flex origin-right items-center gap-0.5 overflow-hidden transition-all duration-300 ease-apple"
          :class="
            isActionsOpen
              ? 'max-w-40 scale-100 opacity-100'
              : 'pointer-events-none max-w-0 scale-90 opacity-0'
          "
        >
          <button
            v-if="hasMore"
            :class="actionBtn"
            :title="isExpanded ? 'Свернуть' : 'Развернуть'"
            @click="isExpanded = !isExpanded"
          >
            <ChevronDown
              class="size-3 transition-transform duration-300 ease-apple"
              :class="{ 'rotate-180': isExpanded }"
            />
          </button>

          <button
            :class="actionBtn"
            title="На весь экран"
            @click.stop="((isFullscreen = true), (isActionsOpen = false))"
          >
            <Maximize2 class="size-3" />
          </button>

          <button :class="actionBtn" title="Копировать" @click.stop="copy">
            <Check v-if="isCopied" class="size-3 text-accent" />
            <Copy v-else class="size-3" />
          </button>
        </div>

        <button
          :class="[actionBtn, { 'bg-white/5 text-on-surface': isActionsOpen }]"
          title="Действия"
          @click.stop="isActionsOpen = !isActionsOpen"
        >
          <MoreVertical class="size-3" />
        </button>
      </div>
    </div>

    <div class="h-px w-full bg-white/5" />

    <div class="px-2 py-1.5">
      <CodePreview :code="preview" :language="language" />
    </div>
  </div>
</template>
