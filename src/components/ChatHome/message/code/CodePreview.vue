<script setup lang="ts">
import { codeToHtml } from 'shiki'
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    code: string | string[]
    language?: string
    theme?: string
    size?: boolean
  }>(),
  {
    language: 'plaintext',
    theme: 'github-dark',
    size: false, // По умолчанию — ограниченная высота (для превью)
  },
)

const highlightedHtml = ref('')

const renderHighlight = async () => {
  const codeString = Array.isArray(props.code) ? props.code.join('\n') : props.code

  try {
    const result =
      (await codeToHtml(codeString, {
        lang: props.language,
        theme: props.theme,
      })) ?? ''

    // Shiki возвращает <pre><code>...</code></pre>.
    // Нам нужно извлечь только содержимое <code>, так как у нас свой <pre>
    const match = result.match(/<code[^>]*>([\s\S]*)<\/code>/)
    // match?.[1] гарантированно string | undefined -> подстраховываемся через ?? result
    highlightedHtml.value = match?.[1] ?? result
  } catch (e) {
    console.error('Shiki highlight error:', e)
    highlightedHtml.value = String(codeString).replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

// Перерисовываем при изменении кода, языка или темы
watch(() => [props.code, props.language, props.theme], renderHighlight, { immediate: true })
</script>

<template>
  <!-- Ваш исходный контейнер с кастомным скроллом -->
  <pre
    class="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed opacity-80 overflow-y-auto custom-scrollbar bg-transparent p-0 m-0"
    v-html="highlightedHtml"
    :class="size ? 'max-h-full overflow-y-auto' : 'max-h-50 overflow-y-auto'"
  ></pre>
</template>

<style scoped>
/* Стили для кастомного скроллбара */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
/* Важно: сбрасываем фон у span внутри pre, чтобы не было "квадратов" от shiki */
pre :deep(span) {
  background-color: transparent !important;
}
</style>
