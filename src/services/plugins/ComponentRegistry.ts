// src/services/plugins/ComponentRegistry.ts
import { reactive, shallowRef, type Component } from 'vue'

export interface RegistryItem {
	component: Component
	options?: Record<string, any>
}

class ComponentRegistry {
	private registry = reactive<Record<string, Record<string, RegistryItem>>>({})

	register(
		zone: string,
		type: string,
		component: Component,
		options: Record<string, any> = {}
	) {
		if (!this.registry[zone]) {
			this.registry[zone] = {}
		}
		this.registry[zone][type] = {
			component: shallowRef(component).value,
			options
		}
		console.log(`[Registry] В зону '${zone}' добавлен: '${type}'`)
	}

	unregister(zone: string, type: string) {
		if (this.registry[zone] && this.registry[zone][type]) {
			delete this.registry[zone][type]
			console.log(`[Registry] Из зоны '${zone}' удален: '${type}'`)
		}
	}

	get(zone: string, type: string): RegistryItem | undefined {
		return this.registry[zone]?.[type]
	}
}

export const pluginRegistry = new ComponentRegistry()
