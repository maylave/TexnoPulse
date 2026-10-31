<!-- src/components/ChatHome/chat-input/panels/LinkPanel.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { X, Check, Link2, Globe } from "lucide-vue-next";

const props = defineProps<{
  initialUrl?: string;
  initialTitle?: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [payload: { url: string; title: string }];
}>();

const rawUrl = ref(props.initialUrl || "");
const title = ref(props.initialTitle || "");

watch(
  () => props.initialUrl,
  (val) => {
    if (val !== undefined) rawUrl.value = val;
  },
);
watch(
  () => props.initialTitle,
  (val) => {
    if (val !== undefined) title.value = val;
  },
);

const normalizedUrl = computed(() => {
  const trimmed = rawUrl.value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
});

const handleConfirm = () => {
  if (!normalizedUrl.value) return;
  emit("confirm", {
    url: normalizedUrl.value,
    title: title.value.trim() || normalizedUrl.value,
  });
};
</script>

<template>
  <div
    class="mb-3 p-3.5 panel-glass flex flex-col gap-2.5 z-20 relative text-white animate-scaleIn select-none"
  >
    <!-- Шапка панели -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          class="size-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0"
        >
          <Link2 class="w-3.5 h-3.5" />
        </div>
        <span class="text-xs font-semibold text-white/90">
          Прикрепить веб-ссылку
        </span>
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="size-6 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Поле URL -->
    <div class="relative">
      <Globe class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        v-model="rawUrl"
        placeholder="https://example.com"
        class="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-black/25 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 font-mono"
      />
    </div>

    <!-- Поле названия ссылки -->
    <input
      v-model="title"
      placeholder="Название ссылки (необязательно)"
      class="text-xs px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
    />

    <!-- Кнопки действий -->
    <div class="flex justify-end gap-2 pt-1">
      <button
        type="button"
        @click="$emit('close')"
        class="px-3 py-1 rounded-lg text-xs text-white/50 hover:text-white transition-colors"
      >
        Отмена
      </button>
      <button
        type="button"
        @click="handleConfirm"
        :disabled="!normalizedUrl"
        class="px-4 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-40"
      >
        <Check class="w-3 h-3" />
        <span>Сохранить</span>
      </button>
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
