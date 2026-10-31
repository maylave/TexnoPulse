<!-- src/components/ChatHome/chat-input/ChatInput.vue -->
<script setup lang="ts">
import { computed } from "vue";
import {
  Plus,
  X as XIcon,
  Send,
  Maximize2,
  Code,
  FileCode2,
  Trash2,
  Edit3,
  CornerUpLeft,
  Check,
  Palette,
} from "lucide-vue-next";
import AttachmentPicker from "@/components/ui/AttachmentPicker.vue";
import SuggestionsMenu from "./SuggestionsMenu.vue";
import { useChatInput } from "@/composables/useChatInput";
import { useMessagesStore } from "@/stores/messages";
import type { ChatAttachment } from "@/config/chatInput";
import { useModalStore } from "@/stores/appModal";

// Компактные панели над инпутом (в едином стиле с инпутом)
import CodePanel from "./panels/CodePanel.vue";
import ColorPanel from "./panels/ColorPanel.vue";
import ChecklistPanel from "./panels/ChecklistPanel.vue";
import LinkPanel from "./panels/LinkPanel.vue";
import CameraPanel from "./panels/CameraPanel.vue";
import VoicePanel from "./panels/VoicePanel.vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const modal = useModalStore();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [payload: { text: string; attachments: ChatAttachment[] }];
  "upload-files": [files: File[]];
}>();

const messagesStore = useMessagesStore();

const {
  textareaRef,
  fileInputRef,
  plusBtnRef,
  acceptTypes,
  showBigPicker,
  activePanel,
  editingAttachmentId,
  editAttachment,
  panelInitialCode,
  panelInitialLang,
  panelInitialFileName,
  panelInitialColor,
  panelInitialColorTitle,
  panelInitialChecklistTitle,
  panelInitialChecklistItems,
  panelInitialLinkUrl,
  panelInitialLinkTitle,
  inlineCodeState,
  convertInlineCodeToSnippet,
  openInlineCodeInPanel,
  inlineColorState,
  convertInlineColorToChip,
  openInlineColorInPanel,
  cancelEditing,
  // Подсказки
  showSuggestions,
  suggestions,
  selectedSuggestionIndex,
  currentWordPrefix,
  applySuggestion,
  handleKeydown,
  updateSuggestions,
  // Вложения
  attachments,
  isDraggingOver,
  isMenuOpen,
  isPlusActive,
  canSend,
  fullAttachmentItems,
  onFilesSelected,
  onPaste,
  onDrop,
  removeAttachment,
  clearAllAttachments,
  handlePlusAction,
  onInput,
  handleSend,
  getAttachmentIcon,
  handleConfirmCode,
  handleConfirmColor,
  handleConfirmChecklist,
  handleConfirmLink,
  handleConfirmCameraPhoto,
  handleConfirmVoiceRecording,
} = useChatInput({
  modelValue: () => props.modelValue,
  onUpdateModelValue: (val) => emit("update:modelValue", val),
  onSend: (payload) => emit("send", payload),
  onUploadFiles: (files) => emit("upload-files", files),
});

const editingMessagePreview = computed(() => {
  const msg = messagesStore.editingMessage;
  if (!msg) return "";
  for (const b of msg.content) {
    if (b.type === "text" && (b as any).text) return (b as any).text;
    if (b.type === "code" && (b as any).code)
      return `Код: ${(b as any).fileName || (b as any).language}`;
    if (b.type === "file" && (b as any).name) return `Файл: ${(b as any).name}`;
  }
  return "Вложение";
});

const replyingMessagePreview = computed(() => {
  const msg = messagesStore.replyingMessage;
  if (!msg) return "";
  for (const b of msg.content) {
    if (b.type === "text" && (b as any).text) return (b as any).text;
    if (b.type === "code" && (b as any).code)
      return `Код: ${(b as any).fileName || (b as any).language}`;
    if (b.type === "file" && (b as any).name) return `Файл: ${(b as any).name}`;
  }
  return "Сообщение";
});
</script>

<template>
  <div
    class="w-full mx-auto px-4 pb-6 mt-auto shrink-0 flex flex-col justify-end relative"
    @dragover.prevent="isDraggingOver = true"
    @dragleave.prevent="isDraggingOver = false"
    @drop.prevent="onDrop"
  >
    <!-- 0. БЛОК РЕДАКТИРОВАНИЯ СООБЩЕНИЯ -->
    <Transition name="picker">
      <div
        v-if="messagesStore.editingMessage"
        class="mb-2.5 px-3.5 py-2 panel-glass flex items-center justify-between gap-3 z-20 relative text-white animate-fadeIn"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="size-7 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0"
          >
            <Edit3 class="w-3.5 h-3.5" />
          </div>
          <div class="flex flex-col min-w-0 text-xs">
            <span class="text-sky-300 font-semibold flex items-center gap-1.5">
              <span>Редактирование сообщения</span>
              <span class="text-[10px] text-white/40 font-mono font-normal">
                (Esc для отмены)
              </span>
            </span>
            <span class="text-white/60 text-[11px] truncate">
              {{ editingMessagePreview }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="cancelEditing"
          class="size-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Отменить редактирование"
        >
          <XIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </Transition>

    <!-- 0.1 БЛОК ОТВЕТА НА СООБЩЕНИЕ -->
    <Transition name="picker">
      <div
        v-if="messagesStore.replyingMessage"
        class="mb-2.5 px-3.5 py-2 panel-glass flex items-center justify-between gap-3 z-20 relative text-white animate-fadeIn"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="size-7 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0"
          >
            <CornerUpLeft class="w-3.5 h-3.5" />
          </div>
          <div class="flex flex-col min-w-0 text-xs">
            <span class="text-violet-300 font-semibold">
              Ответ на сообщение
            </span>
            <span class="text-white/60 text-[11px] truncate">
              {{ replyingMessagePreview }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="messagesStore.cancelReplyMessage()"
          class="size-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Отменить ответ"
        >
          <XIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </Transition>

    <!-- 1. БЛОК ОПРЕДЕЛЕНИЯ КОДА (Появляется при вводе ```, code=js, или текста кода) -->
    <Transition name="picker">
      <div
        v-if="inlineCodeState.isCode && !activePanel && attachments.length < 5"
        class="mb-2.5 px-3.5 py-2 panel-glass flex items-center justify-between gap-3 z-20 relative text-white animate-fadeIn"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="size-7 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0"
          >
            <Code class="w-3.5 h-3.5" />
          </div>
          <div class="flex items-center gap-1.5 text-xs truncate">
            <span class="text-white/70 font-medium">Обнаружен код:</span>
            <span
              class="font-mono font-bold text-sky-300 uppercase bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/25"
            >
              {{ inlineCodeState.language }}
            </span>
            <span
              v-if="inlineCodeState.hasBackticks"
              class="text-white/40 text-[11px]"
            >
              (markdown)
            </span>
            <span
              v-else-if="inlineCodeState.prefixFound"
              class="text-white/40 text-[11px]"
            >
              (команда)
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            @click="convertInlineCodeToSnippet"
            class="text-xs px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border border-sky-500/30 transition-all font-medium flex items-center gap-1.5 shadow-sm"
            title="Преобразовать в блок кода для отправки"
          >
            <FileCode2 class="w-3.5 h-3.5" />
            <span>В сниппет</span>
          </button>
          <button
            type="button"
            @click="openInlineCodeInPanel"
            class="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all font-medium"
            title="Открыть в компактной панели кода"
          >
            <span>В панель</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 1.1 ПЛАШКА ОБНАРУЖЕННОГО ЦВЕТА -->
    <Transition name="picker">
      <div
        v-if="inlineColorState.isColor && activePanel !== 'color'"
        class="mb-2.5 p-2 px-3 panel-glass flex items-center justify-between gap-3 text-white z-20 relative animate-scaleIn"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="size-6 rounded-lg border border-white/25 shrink-0 flex items-center justify-center p-0.5 shadow-sm"
          >
            <div
              class="w-full h-full rounded-md border border-white/30 shadow-inner"
              :style="{ backgroundColor: inlineColorState.hex }"
            ></div>
          </div>
          <div class="flex items-center gap-2 text-xs truncate">
            <span class="text-white/70 font-medium">Обнаружен цвет:</span>
            <span
              class="font-mono font-bold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/25"
            >
              {{ inlineColorState.hex }}
            </span>
            <span
              v-if="inlineColorState.title && inlineColorState.title !== inlineColorState.hex"
              class="text-white/60 text-[11px] truncate"
            >
              «{{ inlineColorState.title }}»
            </span>
            <span class="text-white/40 text-[10px] hidden sm:inline">
              • Нажмите <kbd class="px-1 py-0.5 rounded bg-white/10 text-white/80 font-mono">Tab</kbd> чтобы прикрепить
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            @click="convertInlineColorToChip"
            class="text-xs px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border border-sky-500/30 transition-all font-medium flex items-center gap-1.5 shadow-sm"
            title="Прикрепить карточку цвета"
          >
            <Palette class="w-3.5 h-3.5" />
            <span>Прикрепить</span>
          </button>
          <button
            type="button"
            @click="openInlineColorInPanel"
            class="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all font-medium"
            title="Открыть в палитре цветов"
          >
            <span>В палитру</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 2. КОМПАКТНЫЕ ПАНЕЛИ НАД ИНПУТОМ (Код, Цвет, Список, Ссылка, Камера, Голос) -->
    <Transition name="picker">
      <CodePanel
        v-if="activePanel === 'code'"
        :initial-code="panelInitialCode"
        :initial-lang="panelInitialLang"
        :initial-file-name="panelInitialFileName"
        @close="activePanel = null"
        @confirm="handleConfirmCode"
      />

      <ColorPanel
        v-else-if="activePanel === 'color'"
        :initial-color="panelInitialColor"
        :initial-title="panelInitialColorTitle"
        @close="activePanel = null"
        @confirm="handleConfirmColor"
      />

      <ChecklistPanel
        v-else-if="activePanel === 'todo'"
        :initial-title="panelInitialChecklistTitle"
        :initial-items="panelInitialChecklistItems"
        @close="activePanel = null"
        @confirm="handleConfirmChecklist"
      />

      <LinkPanel
        v-else-if="activePanel === 'link'"
        :initial-url="panelInitialLinkUrl"
        :initial-title="panelInitialLinkTitle"
        @close="activePanel = null"
        @confirm="handleConfirmLink"
      />

      <CameraPanel
        v-else-if="activePanel === 'camera'"
        @close="activePanel = null"
        @confirm="handleConfirmCameraPhoto"
      />

      <VoicePanel
        v-else-if="activePanel === 'voice'"
        @close="activePanel = null"
        @confirm="handleConfirmVoiceRecording"
      />
    </Transition>

    <!-- 3. ТРЕЙ ВЫБРАННЫХ ВЛОЖЕНИЙ (с возможностью клика для редактирования) -->
    <Transition name="picker">
      <div
        v-if="attachments.length > 0"
        class="flex gap-2 mb-3 px-1 overflow-x-auto custom-scrollbar z-20 relative"
      >
        <div
          v-for="item in attachments"
          :key="item.id"
          @click="editAttachment(item)"
          class="group/att flex items-center gap-3 pl-3 pr-2 py-2 rounded-full border backdrop-blur-md transition-all cursor-pointer hover:border-sky-400/50 hover:bg-white/10 shrink-0 shadow-lg select-none"
          :class="{
            'ring-2 ring-sky-400 border-sky-400 bg-sky-500/15':
              editingAttachmentId === item.id,
          }"
          style="
            background: var(--input-bg, rgba(15, 23, 42, 0.6));
            border-color: var(--input-border, rgba(255, 255, 255, 0.1));
            color: var(--input-text, #fff);
          "
          title="Нажмите для редактирования"
        >
          <div
            class="size-8 rounded-full flex items-center justify-center bg-white/5 shrink-0 overflow-hidden"
          >
            <img
              v-if="item.previewUrl"
              :src="item.previewUrl"
              class="w-full h-full object-cover"
            />
            <span
              v-else-if="item.kind === 'color'"
              class="w-full h-full rounded-full border border-white/20"
              :style="{ backgroundColor: item.color?.split(' ')[0] || item.color }"
            />
            <component
              v-else
              :is="getAttachmentIcon(item)"
              class="w-4 h-4 opacity-70"
            />
          </div>

          <div class="flex flex-col min-w-0 max-w-[160px]">
            <span class="text-sm font-medium truncate leading-tight group-hover/att:text-sky-300 transition-colors">
              {{ item.title }}
            </span>
            <span class="text-xs opacity-50 uppercase leading-tight truncate">
              {{ item.subtitle }}
            </span>
          </div>

          <!-- Кнопка удаления вложения -->
          <button
            type="button"
            @click.stop="removeAttachment(item.id)"
            class="size-6 flex items-center justify-center rounded-full hover:bg-white/15 hover:text-rose-400 transition-colors ml-1"
            title="Удалить"
          >
            <XIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Кнопка очистки всех, если вложений несколько -->
        <button
          v-if="attachments.length > 1"
          type="button"
          @click="clearAllAttachments"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs text-white/60 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 backdrop-blur-md transition-all shrink-0 self-center"
          style="
            background: var(--input-bg, rgba(15, 23, 42, 0.6));
            border-color: var(--input-border, rgba(255, 255, 255, 0.1));
          "
          title="Удалить все вложения"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Очистить всё</span>
        </button>
      </div>
    </Transition>

    <!-- 4. ОСНОВНОЕ ПОЛЕ ВВОДА (Таблетка) -->
    <div class="ci-root relative group">
      <div
        class="ci-glass absolute inset-0 transition-all"
        :class="{
          'ring-2 ring-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]':
            isDraggingOver,
        }"
      ></div>

      <div
        class="ci-glow-wrap absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 z-0"
      >
        <div class="ci-glow-spin absolute -inset-[150%]"></div>
      </div>

      <div class="relative z-10 flex items-end gap-2.5 px-3 py-3">
        <!-- Кнопка Плюс / Закрыть панель -->
        <button
          ref="plusBtnRef"
          type="button"
          :title="isPlusActive ? 'Закрыть панель' : 'Добавить файл или действие'"
          @mousedown.stop
          @click="handlePlusAction"
          class="mb-0.5 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300"
          :class="
            isPlusActive
              ? 'bg-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] rotate-0'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
          "
        >
          <Transition name="icon-fade" mode="out-in">
            <XIcon v-if="isPlusActive" key="x" class="w-5 h-5" />
            <Plus
              v-else
              key="plus"
              class="w-5 h-5 transform transition-transform duration-300"
              :class="{ 'rotate-45': isMenuOpen && !isPlusActive }"
            />
          </Transition>
        </button>

        <input
          ref="fileInputRef"
          type="file"
          multiple
          :accept="acceptTypes"
          class="hidden"
          @change="onFilesSelected"
        />

        <!-- Текстовое поле ввода сообщения -->
        <div class="flex-1 min-w-0 pb-1">
          <textarea
            ref="textareaRef"
            :value="modelValue"
            @input="onInput"
            @paste="onPaste"
            @keydown="handleKeydown"
            @click="updateSuggestions"
            @keyup="updateSuggestions"
            :placeholder="
              messagesStore.editingMessage
                ? 'Редактируйте сообщение...'
                : placeholder || 'Напишите сообщение...'
            "
            rows="1"
            class="ci-textarea w-full bg-transparent focus:outline-none leading-relaxed resize-none overflow-y-auto break-words whitespace-pre-wrap"
          ></textarea>
        </div>

        <!-- Кнопка открытия редактора заметок -->
        <button
          type="button"
          title="Развернуть в редактор заметок"
          class="mb-0.5 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200"
          @click="modal.toggle('Editor')"
        >
          <Maximize2 class="w-4 h-4" />
        </button>

        <!-- Кнопка отправки / сохранения редактирования -->
        <button
          type="button"
          @click="handleSend"
          :disabled="!canSend"
          :title="messagesStore.editingMessage ? 'Сохранить изменения' : 'Отправить'"
          class="ci-send flex-shrink-0 w-10 h-10 mb-0.5 flex items-center justify-center rounded-full transition-all duration-300"
          :class="
            canSend
              ? 'ci-send-active hover:scale-110 active:scale-95'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          "
        >
          <Check v-if="messagesStore.editingMessage" class="w-4 h-4" />
          <Send
            v-else
            class="w-4 h-4 transform transition-transform duration-200"
            :class="{ 'translate-x-[1px] rotate-12': canSend }"
          />
        </button>
      </div>

      <!-- Всплывающее контекстное меню подсказок частых слов и кода -->
      <Transition name="picker">
        <SuggestionsMenu
          v-if="showSuggestions && suggestions.length > 0"
          :suggestions="suggestions"
          :selected-index="selectedSuggestionIndex"
          :prefix="currentWordPrefix"
          @select="applySuggestion"
          @close="showSuggestions = false"
        />
      </Transition>

      <!-- Всплывающая панель вложений (сетка 3x3) -->
      <Transition name="picker">
        <AttachmentPicker
          v-if="showBigPicker"
          :items="fullAttachmentItems"
          @close="showBigPicker = false"
          class="absolute bottom-full left-0 mb-3 z-30"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.ci-root,
.ci-glass,
.ci-glow-wrap {
  border-radius: var(--input-radius, 32px);
}

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

.ci-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.45));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 2px 4px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
}

/* Рамка: вырезаем центр маской, остаётся только тонкое кольцо толщиной --input-glow-width */
.ci-glow-wrap {
  padding: var(--input-glow-width, 1.5px);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

.ci-glow-spin {
  opacity: var(--input-glow-opacity, 1);
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    var(--input-glow, #fff) 20%,
    transparent 40%,
    transparent 50%,
    var(--input-glow-2, #fff) 70%,
    transparent 90%,
    transparent 100%
  );
  animation: ci-spin var(--input-glow-speed, 4s) linear infinite;
}

@keyframes ci-spin {
  to {
    transform: rotate(360deg);
  }
}

.ci-textarea {
  color: var(--input-text, #fff);
  font-size: var(--input-font-size, 15px);
  max-height: var(--input-max-height, 150px);
  scrollbar-width: none;
}
.ci-textarea::-webkit-scrollbar {
  display: none;
}
.ci-textarea::placeholder {
  color: var(--input-placeholder, rgba(255, 255, 255, 0.4));
}

.ci-send-active {
  background: var(--input-send-bg, #38bdf8);
  color: var(--input-send-text, #fff);
  box-shadow: 0 0 15px var(--input-send-glow, #38bdf8);
}
.ci-send-active:hover {
  background: var(--input-send-bg-hover, #7dd3fc);
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.icon-fade-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-90deg);
}
.icon-fade-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(90deg);
}

.picker-enter-active,
.picker-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
</style>
