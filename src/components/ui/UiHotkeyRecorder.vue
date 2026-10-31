<!-- src/components/ui/UiHotkeyRecorder.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  modelValue: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean };
}>();

const emit = defineEmits<{
  "update:modelValue": [value: typeof props.modelValue];
}>();

const isRecording = ref(false);
const displayText = ref("");

// Форматируем сочетание для отображения
const formatBinding = (b: typeof props.modelValue) => {
  const parts: string[] = [];
  if (b.ctrl) parts.push("Ctrl");
  if (b.shift) parts.push("Shift");
  if (b.alt) parts.push("Alt");
  if (b.key && b.key !== "Control" && b.key !== "Shift" && b.key !== "Alt") {
    parts.push(b.key.toUpperCase());
  }
  return parts.join(" + ") || "Не назначено";
};

displayText.value = formatBinding(props.modelValue);

const startRecording = () => {
  isRecording.value = true;
  displayText.value = "Нажмите сочетание...";
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isRecording.value) return;
  e.preventDefault();

  // Игнорируем одиночные модификаторы
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

  const newBinding = {
    key: e.key,
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
  };

  emit("update:modelValue", newBinding);
  displayText.value = formatBinding(newBinding);
  isRecording.value = false;
};

onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<template>
  <button
    type="button"
    @click="startRecording"
    class="min-w-[140px] px-3 py-2 text-sm rounded-md border transition-all duration-200 text-left font-mono"
    :class="[
      isRecording
        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] animate-pulse'
        : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-[var(--menu-border)] hover:border-[var(--color-outline)]',
    ]"
  >
    {{ displayText }}
  </button>
</template>
