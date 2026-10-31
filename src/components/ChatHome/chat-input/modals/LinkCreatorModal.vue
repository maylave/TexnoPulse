<!-- src/components/ChatHome/chat-input/modals/LinkCreatorModal.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { X, Check, Link2, ExternalLink, Globe } from "lucide-vue-next";

const emit = defineEmits<{
  close: [];
  confirm: [payload: { url: string; title: string }];
}>();

const rawUrl = ref("");
const title = ref("");

const normalizedUrl = computed(() => {
  const trimmed = rawUrl.value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
});

const hostname = computed(() => {
  try {
    const parsed = new URL(normalizedUrl.value);
    return parsed.hostname;
  } catch {
    return "";
  }
});

const handleConfirm = () => {
  if (!normalizedUrl.value) return;
  emit("confirm", {
    url: normalizedUrl.value,
    title: title.value.trim() || hostname.value || normalizedUrl.value,
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
            class="size-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400"
          >
            <Link2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-tight">
              Добавить ссылку
            </h3>
            <p class="text-xs text-white/50 leading-tight">
              Прикрепить веб-ссылку с описанием
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
        <!-- URL ввода -->
        <div>
          <label class="block text-[11px] font-medium text-white/50 mb-1">
            Адрес ссылки (URL)
          </label>
          <div class="relative flex items-center">
            <Globe class="w-4 h-4 absolute left-3 text-white/40 pointer-events-none" />
            <input
              v-model="rawUrl"
              placeholder="https://example.com"
              class="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-mono"
              @keydown.enter.prevent="handleConfirm"
            />
          </div>
        </div>

        <!-- Название ссылки -->
        <div>
          <label class="block text-[11px] font-medium text-white/50 mb-1">
            Название или текст (необязательно)
          </label>
          <input
            v-model="title"
            placeholder="Например: Документация API, GitHub репозиторий..."
            class="w-full text-xs px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
            @keydown.enter.prevent="handleConfirm"
          />
        </div>

        <!-- Карточка предварительного просмотра -->
        <div
          v-if="hostname"
          class="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs"
        >
          <div class="flex flex-col min-w-0">
            <span class="font-medium truncate text-white">
              {{ title || hostname }}
            </span>
            <span class="text-[11px] text-cyan-400/80 truncate font-mono">
              {{ normalizedUrl }}
            </span>
          </div>

          <a
            :href="normalizedUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="size-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white shrink-0 transition-colors"
            title="Проверить ссылку в новой вкладке"
          >
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
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
          :disabled="!normalizedUrl"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white flex items-center gap-1.5 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check class="w-3.5 h-3.5" /> Прикрепить ссылку
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
