// src/composables/useChatInput.ts
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import type { Component } from "vue";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Code,
  Palette,
  ListTodo,
  Link as LinkIcon,
  Mic,
} from "lucide-vue-next";
import { useContextMenuStore } from "@/stores/contexMenu";
import { useSettingsStore } from "@/stores/settings";
import { useWordFrequencyStore, type WordEntry } from "@/stores/wordFrequency";
import { useMessagesStore } from "@/stores/messages";
import { useNodeStore } from "@/stores/node";
import { useColorMemoryStore } from "@/stores/colorMemory";
import { messageToChatInputPayload } from "@/stores/messages/converters";
import {
  getCompactAttachmentItems,
  getFullAttachmentItems,
  DEFAULT_USE_BIG_PICKER,
  type ChatAttachment,
  type AttachmentHandlers,
} from "@/config/chatInput";
import {
  checkInlineCodeTyping,
  detectCodeLanguage,
  LANGUAGE_EXTENSIONS,
} from "@/utils/codeDetection";
import { checkInlineColorTyping } from "@/utils/colorDetection";

export type InputActivePanel =
  | "code"
  | "color"
  | "todo"
  | "link"
  | "camera"
  | "voice"
  | null;

interface UseChatInputOptions {
  modelValue: () => string;
  onUpdateModelValue: (val: string) => void;
  onSend: (payload: { text: string; attachments: ChatAttachment[] }) => void;
  onUploadFiles?: (files: File[]) => void;
}

export function useChatInput(options: UseChatInputOptions) {
  // --- Refs ---
  const textareaRef = ref<HTMLTextAreaElement>();
  const fileInputRef = ref<HTMLInputElement>();
  const plusBtnRef = ref<HTMLButtonElement>();

  // --- Состояние ---
  const acceptTypes = ref("*/*");
  const showBigPicker = ref(false);
  const attachments = ref<ChatAttachment[]>([]);
  const isDraggingOver = ref(false);

  // --- Компактные панели над инпутом (вместо больших модалок) ---
  const activePanel = ref<InputActivePanel>(null);
  const editingAttachmentId = ref<string | null>(null);

  // Для кода
  const panelInitialCode = ref("");
  const panelInitialLang = ref("auto");
  const panelInitialFileName = ref("snippet.js");

  // Для цвета
  const panelInitialColor = ref("#38bdf8");
  const panelInitialColorTitle = ref("");

  // Для чек-листа
  const panelInitialChecklistTitle = ref("Чек-лист");
  const panelInitialChecklistItems = ref<Array<{ text: string; done: boolean }>>([]);

  // Для ссылки
  const panelInitialLinkUrl = ref("");
  const panelInitialLinkTitle = ref("");

  let idCounter = 0;
  const nextId = (prefix = "att") => `${prefix}-${++idCounter}-${Date.now()}`;

  // --- Сторы ---
  const contextMenuStore = useContextMenuStore();
  const settingsStore = useSettingsStore();
  const wordFrequencyStore = useWordFrequencyStore();
  const messagesStore = useMessagesStore();
  const nodeStore = useNodeStore();
  const colorMemoryStore = useColorMemoryStore();
  const { isOpen: isMenuOpen } = storeToRefs(contextMenuStore);

  const activeChatId = computed(() => nodeStore.activeChatId || "hello");

  // --- Подсказки и словарь частых слов ---
  // --- Навигация стрелочками по последним отправленным сообщениям ---
  const historyIndex = ref(-1);
  const savedDraft = ref<{ text: string; attachments: ChatAttachment[] } | null>(null);

  watch(
    () => nodeStore.activeChatId,
    () => {
      historyIndex.value = -1;
      savedDraft.value = null;
    }
  );

  const showSuggestions = ref(false);
  const suggestions = ref<WordEntry[]>([]);
  const selectedSuggestionIndex = ref(0);
  const currentWordPrefix = ref("");
  const currentWordRange = ref<{ start: number; end: number }>({ start: 0, end: 0 });

  // --- Умное отслеживание кода во время ввода текста ---
  const inlineCodeState = computed(() =>
    checkInlineCodeTyping(options.modelValue()),
  );

  // --- Умное отслеживание цвета во время ввода текста ---
  const inlineColorState = computed(() =>
    checkInlineColorTyping(options.modelValue(), activeChatId.value),
  );

  /**
   * Быстрое преобразование набранного цвета в плашку вложения
   */
  const convertInlineColorToChip = () => {
    const state = inlineColorState.value;
    if (!state.isColor) return;

    attachments.value.push({
      id: nextId("color"),
      kind: "color",
      title: state.title || state.hex,
      subtitle: "ЦВЕТ / ПАЛИТРА",
      color: state.hex,
    });

    colorMemoryStore.rememberColor(state.hex, state.title, activeChatId.value, "text");
    options.onUpdateModelValue("");
    showSuggestions.value = false;
  };

  /**
   * Открыть цвет из текущего инпута в панели палитры
   */
  const openInlineColorInPanel = () => {
    const state = inlineColorState.value;
    panelInitialColor.value = state.hex || "#38BDF8";
    panelInitialColorTitle.value = state.title || "";
    editingAttachmentId.value = null;
    options.onUpdateModelValue("");
    closePopups();
    activePanel.value = "color";
  };

  /**
   * Быстрое преобразование набранного в инпуте кода в сниппет-вложение
   */
  const convertInlineCodeToSnippet = () => {
    const state = inlineCodeState.value;
    if (!state.isCode) return;

    const lang = state.language || "javascript";
    const ext = LANGUAGE_EXTENSIONS[lang] || "txt";

    attachments.value.push({
      id: nextId("code"),
      kind: "code",
      title: `snippet.${ext}`,
      subtitle: `${state.code.split("\n").length} стр. · ${lang.toUpperCase()}`,
      code: { language: lang, content: state.code },
    });

    options.onUpdateModelValue("");
    showSuggestions.value = false;
  };

  /**
   * Открыть код из текущего инпута в компактной панели кода над инпутом
   */
  const openInlineCodeInPanel = () => {
    const state = inlineCodeState.value;
    panelInitialCode.value = state.code || options.modelValue();
    panelInitialLang.value = state.language || "auto";
    panelInitialFileName.value = `snippet.${LANGUAGE_EXTENSIONS[state.language || "javascript"] || "js"}`;
    editingAttachmentId.value = null;
    options.onUpdateModelValue("");
    closePopups();
    activePanel.value = "code";
  };

  /**
   * Редактирование существующего элемента вложения при клике по нему в трее
   */
  const editAttachment = (item: ChatAttachment) => {
    editingAttachmentId.value = item.id;
    if (item.kind === "code") {
      panelInitialCode.value = item.code?.content || "";
      panelInitialLang.value = item.code?.language || "auto";
      panelInitialFileName.value = item.title || "snippet.js";
      activePanel.value = "code";
    } else if (item.kind === "color") {
      panelInitialColor.value = item.color || "#38bdf8";
      panelInitialColorTitle.value = item.title || "";
      activePanel.value = "color";
    } else if (item.kind === "todo") {
      panelInitialChecklistTitle.value = item.title || "Чек-лист";
      panelInitialChecklistItems.value = item.todoList ? [...item.todoList] : [];
      activePanel.value = "todo";
    } else if (item.kind === "link") {
      panelInitialLinkUrl.value = item.url || "";
      panelInitialLinkTitle.value = item.title || "";
      activePanel.value = "link";
    } else if (item.kind === "file") {
      // Для файлов: при клике открываем файловый диалог для замены файла
      triggerFileInput("*/*");
    }
  };

  // --- Извлечение слова на курсоре для подсказок ---
  const extractWordAtCursor = (text: string, cursorPos: number) => {
    if (cursorPos < 0) return { word: "", start: 0, end: 0 };
    let start = cursorPos;
    while (start > 0 && !/[\s,.;:!?()\[\]{}"'`<>]/.test(text[start - 1] ?? "")) {
      start--;
    }
    let end = cursorPos;
    while (end < text.length && !/[\s,.;:!?()\[\]{}"'`<>]/.test(text[end] ?? "")) {
      end++;
    }
    const word = text.slice(start, cursorPos);
    return { word, start, end };
  };

  const updateSuggestions = () => {
    const textarea = textareaRef.value;
    if (!textarea) return;

    const settingEnabled =
      settingsStore.get({ id: "autocomplete_enabled", defaultValue: true } as any) !== false;
    if (!settingEnabled) {
      showSuggestions.value = false;
      return;
    }

    const minChars =
      Number(settingsStore.get({ id: "autocomplete_min_chars", defaultValue: 2 } as any)) || 2;
    const maxItems =
      Number(settingsStore.get({ id: "autocomplete_max_items", defaultValue: 6 } as any)) || 6;
    const codeEnabled =
      settingsStore.get({ id: "autocomplete_code_enabled", defaultValue: true } as any) !== false;

    const cursorPos = textarea.selectionStart;
    const text = options.modelValue();
    const { word, start, end } = extractWordAtCursor(text, cursorPos);

    if (word.length >= minChars) {
      const isCode =
        codeEnabled &&
        (inlineCodeState.value.isCode ||
          text.includes("```") ||
          /^(?:code|код)\s*=/i.test(text) ||
          /^[a-zA-Z_]\w*\s*[=(.]/.test(text));

      const codeLang = inlineCodeState.value.isCode ? inlineCodeState.value.language : undefined;

      const list = wordFrequencyStore.getSuggestions(word, {
        isCode,
        language: codeLang,
        contextCode: text,
        chatId: activeChatId.value,
        limit: maxItems,
        minChars,
      });

      if (list.length > 0) {
        suggestions.value = list;
        currentWordPrefix.value = word;
        currentWordRange.value = { start, end };
        selectedSuggestionIndex.value = 0;
        showSuggestions.value = true;
        return;
      }
    }

    showSuggestions.value = false;
  };

  const applySuggestion = (item: WordEntry) => {
    const textarea = textareaRef.value;
    const text = options.modelValue();
    const { start, end } = currentWordRange.value;

    const before = text.substring(0, start);
    const after = text.substring(end);
    const replacement = (item.insertText || item.word) + " ";
    const newText = before + replacement + after;

    options.onUpdateModelValue(newText);
    showSuggestions.value = false;

    nextTick(() => {
      if (textarea) {
        const newPos = start + replacement.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
        autoResize();
      }
    });
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (showSuggestions.value && suggestions.value.length > 0) {
      if (event.key === "ArrowDown") {
        selectedSuggestionIndex.value =
          (selectedSuggestionIndex.value + 1) % suggestions.value.length;
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowUp") {
        selectedSuggestionIndex.value =
          (selectedSuggestionIndex.value - 1 + suggestions.value.length) %
          suggestions.value.length;
        event.preventDefault();
        return;
      }
      if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
        const item = suggestions.value[selectedSuggestionIndex.value];
        if (item) {
          applySuggestion(item);
          event.preventDefault();
          return;
        }
      }
      if (event.key === "Escape") {
        showSuggestions.value = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    if (event.key === "Escape") {
      if (activePanel.value !== null) {
        activePanel.value = null;
        editingAttachmentId.value = null;
        event.preventDefault();
        return;
      }
      if (showBigPicker.value) {
        showBigPicker.value = false;
        event.preventDefault();
        return;
      }
      if (messagesStore.editingMessage) {
        cancelEditing();
        event.preventDefault();
        return;
      }
      if (messagesStore.replyingMessage) {
        messagesStore.cancelReplyMessage();
        event.preventDefault();
        return;
      }
    }

    // --- Навигация стрелочками по последним сообщениям (как в Telegram/Discord) ---
    const textarea = textareaRef.value;
    const isSingleLineOrEmpty =
      !options.modelValue().includes("\n") || options.modelValue().trim() === "";

    if (
      event.key === "ArrowUp" &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey
    ) {
      const isAtStart = textarea
        ? textarea.selectionStart === 0 && textarea.selectionEnd === 0
        : true;

      if (isSingleLineOrEmpty && (isAtStart || historyIndex.value !== -1)) {
        const myMessages = messagesStore.messages.filter(
          (m) => m.chatId === nodeStore.activeChatId && m.isOwn
        );

        if (myMessages.length > 0) {
          event.preventDefault();

          if (historyIndex.value === -1) {
            savedDraft.value = {
              text: options.modelValue(),
              attachments: [...attachments.value],
            };
            historyIndex.value = 0;
          } else if (historyIndex.value < myMessages.length - 1) {
            historyIndex.value++;
          }

          const targetMsg = myMessages[myMessages.length - 1 - historyIndex.value];
          if (targetMsg) {
            messagesStore.startEditMessage(targetMsg);
            const payload = messageToChatInputPayload(targetMsg);
            options.onUpdateModelValue(payload.text);
            attachments.value = payload.attachments;
            nextTick(() => {
              if (textareaRef.value) {
                const len = textareaRef.value.value.length;
                textareaRef.value.selectionStart = textareaRef.value.selectionEnd = len;
                autoResize();
              }
            });
          }
          return;
        }
      }
    }

    if (
      event.key === "ArrowDown" &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey
    ) {
      if (historyIndex.value !== -1) {
        const isAtEnd = textarea
          ? textarea.selectionStart === textarea.value.length
          : true;

        if (isSingleLineOrEmpty && isAtEnd) {
          const myMessages = messagesStore.messages.filter(
            (m) => m.chatId === nodeStore.activeChatId && m.isOwn
          );

          event.preventDefault();

          if (historyIndex.value > 0) {
            historyIndex.value--;
            const targetMsg = myMessages[myMessages.length - 1 - historyIndex.value];
            if (targetMsg) {
              messagesStore.startEditMessage(targetMsg);
              const payload = messageToChatInputPayload(targetMsg);
              options.onUpdateModelValue(payload.text);
              attachments.value = payload.attachments;
              nextTick(() => {
                if (textareaRef.value) {
                  const len = textareaRef.value.value.length;
                  textareaRef.value.selectionStart = textareaRef.value.selectionEnd = len;
                  autoResize();
                }
              });
            }
          } else {
            // Вернулись вниз к сохраненному черновику
            historyIndex.value = -1;
            messagesStore.cancelEditMessage();
            if (savedDraft.value) {
              options.onUpdateModelValue(savedDraft.value.text);
              attachments.value = savedDraft.value.attachments;
              savedDraft.value = null;
            } else {
              options.onUpdateModelValue("");
              attachments.value = [];
            }
            nextTick(() => {
              if (textareaRef.value) {
                const len = textareaRef.value.value.length;
                textareaRef.value.selectionStart = textareaRef.value.selectionEnd = len;
                autoResize();
              }
            });
          }
          return;
        }
      }
    }

    if (event.key === "Tab") {
      if (inlineColorState.value.isColor) {
        event.preventDefault();
        convertInlineColorToChip();
        return;
      }
      if (inlineCodeState.value.isCode && inlineCodeState.value.prefixFound) {
        event.preventDefault();
        convertInlineCodeToSnippet();
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // --- Вычисляемые свойства ---
  const isPlusActive = computed(
    () => showBigPicker.value || activePanel.value !== null,
  );

  const canSend = computed(
    () =>
      options.modelValue().trim().length > 0 || attachments.value.length > 0,
  );

  // --- Закрытие всех всплывающих панелей ---
  const closePopups = () => {
    showBigPicker.value = false;
    activePanel.value = null;
    editingAttachmentId.value = null;
    showSuggestions.value = false;
    if (isMenuOpen.value) contextMenuStore.close();
  };

  // --- Логика добавления ФАЙЛОВ ---
  const triggerFileInput = (accept: string) => {
    closePopups();
    acceptTypes.value = accept;
    nextTick(() => fileInputRef.value?.click());
  };

  const addFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList).filter(
      (f): f is File => f !== undefined,
    );
    if (!filesArray.length) return;

    // Если редактировали вложение файла, заменяем его
    if (editingAttachmentId.value) {
      const idx = attachments.value.findIndex((a) => a.id === editingAttachmentId.value);
      const existing = idx !== -1 ? attachments.value[idx] : undefined;
      if (existing && filesArray[0]) {
        const file = filesArray[0];
        const isImg = file.type.startsWith("image/");
        const isAudio = file.type.startsWith("audio/");
        attachments.value[idx] = {
          ...existing,
          id: existing.id,
          kind: isAudio ? "voice" : "file",
          title: file.name,
          subtitle: `${file.type.split("/")[1]?.toUpperCase() || "FILE"} · ${formatSize(file.size)}`,
          file,
          size: file.size,
          mimeType: file.type,
          previewUrl: isImg ? URL.createObjectURL(file) : undefined,
        };
        editingAttachmentId.value = null;
        options.onUploadFiles?.([file]);
        return;
      }
    }

    filesArray.forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const isAudio = file.type.startsWith("audio/");
      attachments.value.push({
        id: nextId(isAudio ? "voice" : "file"),
        kind: isAudio ? "voice" : "file",
        title: file.name,
        subtitle: `${file.type.split("/")[1]?.toUpperCase() || "FILE"} · ${formatSize(file.size)}`,
        file,
        size: file.size,
        mimeType: file.type,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
      });
    });

    options.onUploadFiles?.(filesArray);
  };

  const onFilesSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      addFiles(input.files);
      input.value = "";
    }
  };

  // Вставка файлов и скриншотов из буфера обмена (Ctrl + V)
  const onPaste = (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const files = clipboardData.files;
    if (files && files.length > 0) {
      addFiles(files);
      return;
    }

    const items = clipboardData.items;
    if (items) {
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `clipboard_image_${Date.now()}.png`;
            const file = new File([blob], fileName, { type: blob.type });
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault();
        addFiles(imageFiles);
      }
    }
  };

  const onDrop = (event: DragEvent) => {
    isDraggingOver.value = false;
    if (event.dataTransfer?.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  };

  // --- Обработчики подтверждений из компактных панелей ---
  const handleConfirmCode = (payload: {
    code: string;
    language: string;
    fileName: string;
  }) => {
    const lines = payload.code.split("\n").length;
    if (editingAttachmentId.value) {
      const idx = attachments.value.findIndex((a) => a.id === editingAttachmentId.value);
      const existing = idx !== -1 ? attachments.value[idx] : undefined;
      if (existing) {
        attachments.value[idx] = {
          ...existing,
          title: payload.fileName || `Сниппет (${payload.language})`,
          subtitle: `${lines} стр. · ${payload.language.toUpperCase()}`,
          code: { language: payload.language, content: payload.code },
        };
        editingAttachmentId.value = null;
        activePanel.value = null;
        return;
      }
    }

    attachments.value.push({
      id: nextId("code"),
      kind: "code",
      title: payload.fileName || `Сниппет (${payload.language})`,
      subtitle: `${lines} стр. · ${payload.language.toUpperCase()}`,
      code: { language: payload.language, content: payload.code },
    });
    activePanel.value = null;
  };

  const handleConfirmColor = (payload: { color: string; title: string }) => {
    colorMemoryStore.rememberColor(payload.color, payload.title, activeChatId.value, "panel");

    if (editingAttachmentId.value) {
      const idx = attachments.value.findIndex((a) => a.id === editingAttachmentId.value);
      const existing = idx !== -1 ? attachments.value[idx] : undefined;
      if (existing) {
        attachments.value[idx] = {
          ...existing,
          title: payload.title,
          color: payload.color,
        };
        editingAttachmentId.value = null;
        activePanel.value = null;
        return;
      }
    }

    attachments.value.push({
      id: nextId("color"),
      kind: "color",
      title: payload.title,
      subtitle: "ЦВЕТ / ПАЛИТРА",
      color: payload.color,
    });
    activePanel.value = null;
  };

  const handleConfirmChecklist = (payload: {
    title: string;
    items: Array<{ text: string; done: boolean }>;
  }) => {
    if (editingAttachmentId.value) {
      const idx = attachments.value.findIndex((a) => a.id === editingAttachmentId.value);
      const existing = idx !== -1 ? attachments.value[idx] : undefined;
      if (existing) {
        attachments.value[idx] = {
          ...existing,
          title: payload.title,
          subtitle: `${payload.items.length} задач(и)`,
          todoList: payload.items,
        };
        editingAttachmentId.value = null;
        activePanel.value = null;
        return;
      }
    }

    attachments.value.push({
      id: nextId("todo"),
      kind: "todo",
      title: payload.title,
      subtitle: `${payload.items.length} задач(и)`,
      todoList: payload.items,
    });
    activePanel.value = null;
  };

  const handleConfirmLink = (payload: { url: string; title: string }) => {
    if (editingAttachmentId.value) {
      const idx = attachments.value.findIndex((a) => a.id === editingAttachmentId.value);
      const existing = idx !== -1 ? attachments.value[idx] : undefined;
      if (existing) {
        attachments.value[idx] = {
          ...existing,
          title: payload.title,
          url: payload.url,
        };
        editingAttachmentId.value = null;
        activePanel.value = null;
        return;
      }
    }

    attachments.value.push({
      id: nextId("link"),
      kind: "link",
      title: payload.title,
      subtitle: "ССЫЛКА",
      url: payload.url,
    });
    activePanel.value = null;
  };

  const handleConfirmCameraPhoto = (file: File) => {
    addFiles([file]);
    activePanel.value = null;
  };

  const handleConfirmVoiceRecording = (file: File) => {
    attachments.value.push({
      id: nextId("voice"),
      kind: "voice",
      title: "Голосовое сообщение",
      subtitle: `АУДИО · ${formatSize(file.size)}`,
      file,
      size: file.size,
      mimeType: file.type || "audio/webm",
    });
    options.onUploadFiles?.([file]);
    activePanel.value = null;
  };

  // --- Обработчики для меню вложений ---
  const attachmentHandlers: AttachmentHandlers = {
    onPickPhoto: () => triggerFileInput("image/*"),
    onPickVideo: () => triggerFileInput("video/*"),
    onPickFile: () => triggerFileInput("*/*"),
    onAddCode: () => {
      closePopups();
      panelInitialCode.value = "";
      panelInitialLang.value = "auto";
      panelInitialFileName.value = "snippet.js";
      editingAttachmentId.value = null;
      activePanel.value = "code";
    },
    onAddColor: () => {
      closePopups();
      panelInitialColor.value = "#38bdf8";
      panelInitialColorTitle.value = "";
      editingAttachmentId.value = null;
      activePanel.value = "color";
    },
    onAddTodo: () => {
      closePopups();
      panelInitialChecklistTitle.value = "Чек-лист";
      panelInitialChecklistItems.value = [];
      editingAttachmentId.value = null;
      activePanel.value = "todo";
    },
    onAddLink: () => {
      closePopups();
      panelInitialLinkUrl.value = "";
      panelInitialLinkTitle.value = "";
      editingAttachmentId.value = null;
      activePanel.value = "link";
    },
    onCamera: () => {
      closePopups();
      editingAttachmentId.value = null;
      activePanel.value = "camera";
    },
    onVoice: () => {
      closePopups();
      editingAttachmentId.value = null;
      activePanel.value = "voice";
    },
  };

  const fullAttachmentItems = computed(() =>
    getFullAttachmentItems(attachmentHandlers),
  );

  // --- Синхронизация с редактированием сообщения ---
  watch(
    () => messagesStore.editingMessage,
    (msg) => {
      if (msg) {
        const payload = messageToChatInputPayload(msg);
        options.onUpdateModelValue(payload.text);
        attachments.value = payload.attachments;
        closePopups();
        nextTick(() => {
          textareaRef.value?.focus();
          autoResize();
        });
      }
    },
    { immediate: true },
  );

  const cancelEditing = () => {
    messagesStore.cancelEditMessage();
    if (savedDraft.value) {
      options.onUpdateModelValue(savedDraft.value.text);
      attachments.value = savedDraft.value.attachments;
      savedDraft.value = null;
    } else {
      options.onUpdateModelValue("");
      attachments.value = [];
    }
    historyIndex.value = -1;
    closePopups();
    nextTick(() => {
      autoResize();
    });
  };

  // --- Удаление и очистка ---
  const removeAttachment = (id: string) => {
    const index = attachments.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      const item = attachments.value[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      attachments.value.splice(index, 1);
      if (editingAttachmentId.value === id) {
        editingAttachmentId.value = null;
        activePanel.value = null;
      }
    }
  };

  const clearAllAttachments = () => {
    attachments.value.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    attachments.value = [];
    editingAttachmentId.value = null;
    if (activePanel.value !== null) {
      activePanel.value = null;
    }
  };

  onBeforeUnmount(() => clearAllAttachments());

  // --- Кнопка "+" / "X" ---
  const toggleAttachmentMenu = () => {
    if (!plusBtnRef.value) return;

    const settingDef = {
      id: "enable_attachment_picker",
      defaultValue: DEFAULT_USE_BIG_PICKER,
    };
    const useBig = settingsStore.get(settingDef as any) as boolean;

    if (useBig) {
      showBigPicker.value = !showBigPicker.value;
    } else {
      const items = getCompactAttachmentItems(attachmentHandlers);
      contextMenuStore.toggleAt(plusBtnRef.value, items, "top", "compact");
    }
  };

  const handlePlusAction = () => {
    if (showBigPicker.value || activePanel.value !== null) {
      closePopups();
      return;
    }
    toggleAttachmentMenu();
  };

  // --- Авто-высота и отправка ---
  const autoResize = () => {
    const textarea = textareaRef.value;
    if (!textarea) return;
    const max = parseFloat(getComputedStyle(textarea).maxHeight) || 150;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, max)}px`;
  };

  const onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    options.onUpdateModelValue(target.value);
    autoResize();
    updateSuggestions();
  };

  const handleSend = () => {
    if (!canSend.value) return;
    options.onSend({
      text: options.modelValue(),
      attachments: [...attachments.value],
    });
    attachments.value = [];
    historyIndex.value = -1;
    savedDraft.value = null;
    closePopups();
  };

  watch(options.modelValue, async (newVal) => {
    if (!newVal) {
      showSuggestions.value = false;
      await nextTick();
      autoResize();
    }
  });

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getAttachmentIcon = (att: ChatAttachment): Component => {
    if (att.kind === "code") return Code;
    if (att.kind === "color") return Palette;
    if (att.kind === "todo") return ListTodo;
    if (att.kind === "link") return LinkIcon;
    if (att.kind === "voice") return Mic;
    if (att.mimeType?.startsWith("image/")) return ImageIcon;
    if (att.mimeType?.startsWith("video/")) return Video;
    return FileText;
  };

  return {
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
    // Вложения и управление
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
  };
}
