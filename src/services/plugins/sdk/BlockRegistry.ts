// src/services/plugins/sdk/BlockRegistry.ts
import { shallowRef } from 'vue'
import type { PluginBlockDefinition } from './types'
import PluginBlockWrapper from '@/components/ChatHome/message/blocks/PluginBlockWrapper.vue'

class BlockRegistryManager {
  private blocks = new Map<string, PluginBlockDefinition>()
  private version = shallowRef(0)

  register(type: string, definition: PluginBlockDefinition) {
    this.blocks.set(type, definition)
    this.version.value++
  }

  unregister(type: string) {
    if (this.blocks.delete(type)) {
      this.version.value++
    }
  }

  get(type: string) {
    // Чтение version.value гарантирует реактивность во Vue шаблонах
    void this.version.value
    const def = this.blocks.get(type)
    if (!def) return undefined

    return {
      component: PluginBlockWrapper,
      marginBottom: def.marginBottom ?? '',
      containerClass: def.containerClass ?? 'w-full',
      definition: def
    }
  }

  getDefinition(type: string): PluginBlockDefinition | undefined {
    return this.blocks.get(type)
  }

  has(type: string): boolean {
    return this.blocks.has(type)
  }

  clear() {
    this.blocks.clear()
    this.version.value++
  }
}

export const pluginBlockRegistry = new BlockRegistryManager()
