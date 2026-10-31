<script setup lang="ts">
import { ref, watch, nextTick } from "vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
  focus: [];
  blur: [];
}>();

const textareaRef = ref<HTMLTextAreaElement>();

// Автоматическое изменение высоты textarea
const autoResize = () => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
};

// Обработка ввода
const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  autoResize();
};

// Отправка по Enter (без Shift)
const handleSend = () => {
  if (props.modelValue.trim()) {
    emit("send");
  }
};

// Сброс высоты, если родитель очистил поле ввода (например, после отправки)
watch(
  () => props.modelValue,
  async (newValue) => {
    if (!newValue) {
      await nextTick();
      autoResize();
    }
  },
);
</script>

<template>
  <div class="flex-1 relative min-w-0">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="onInput"
      @keydown.enter.exact.prevent="handleSend"
      @focus="emit('focus')"
      @blur="emit('blur')"
      :placeholder="placeholder || 'Напишите сообщение...'"
      rows="1"
      class="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none text-sm leading-relaxed resize-none overflow-y-auto max-h-[150px] py-2 break-words whitespace-pre-wrap transition-colors scrollbar-thin scrollbar-thumb-slate-600"
    ></textarea>
  </div>
</template>
