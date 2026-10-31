<!-- src/components/ChatHome/message/blocks/PluginBlockWrapper.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { pluginBlockRegistry } from '@/services/plugins/sdk/BlockRegistry'

const props = defineProps<{
  block: any
}>()

const containerRef = ref<HTMLElement | null>(null)
let cleanupFn: (() => void) | void = undefined

onMounted(() => {
  if (!containerRef.value || !props.block?.type) return
  const def = pluginBlockRegistry.getDefinition(props.block.type)
  if (def && typeof def.render === 'function') {
    try {
      cleanupFn = def.render(containerRef.value, props.block)
    } catch (err) {
      console.error(`[PluginBlockWrapper] Ошибка отрисовки блока "${props.block.type}":`, err)
      if (containerRef.value) {
        containerRef.value.innerHTML = `<div class="p-2 text-xs text-rose-400 bg-rose-500/10 rounded-lg">Ошибка плагина блока: ${props.block.type}</div>`
      }
    }
  }
})

onBeforeUnmount(() => {
  if (typeof cleanupFn === 'function') {
    try {
      cleanupFn()
    } catch {}
  }
})
</script>

<template>
  <div ref="containerRef" class="snapi-plugin-custom-block w-full"></div>
</template>
