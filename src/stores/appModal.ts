// src/stores/modal.ts
import { ref, shallowRef, computed, markRaw } from 'vue'
import { defineStore } from 'pinia'
import type { ModalDefinition, ModalId } from '@/types/modal'

export const useModalStore = defineStore('modal', () => {
	const registry = shallowRef<Record<ModalId, ModalDefinition>>({})

	const activeId = ref<ModalId | null>(null)
	const payload = ref<unknown>(null)

	const active = computed(() =>
		activeId.value ? (registry.value[activeId.value] ?? null) : null
	)

	const registeredModalIds = computed(
		() => Object.keys(registry.value) as ModalId[]
	)

	// 🌟 Добавляем/переименовываем метод hasModal
	const hasModal = (id: ModalId) => id in registry.value
	const isOpen = (id: ModalId) => activeId.value === id

	function register(def: ModalDefinition) {
		registry.value = {
			...registry.value,
			[def.id]: {
				closeOnEsc: true,
				closeOnBackdrop: true,
				...def,
				component: markRaw(def.component)
			}
		}
	}

	function unregister(id: ModalId) {
		if (activeId.value === id) close()
		const { [id]: _removed, ...rest } = registry.value
		registry.value = rest
	}

	function open<T = unknown>(id: ModalId, data?: T) {
		if (!hasModal(id)) {
			console.warn(`[modal] "${id}" не зарегистрирована`)
			return
		}
		activeId.value = id
		payload.value = data ?? null
	}

	function close(id?: ModalId) {
		if (id && activeId.value !== id) return
		activeId.value = null
		payload.value = null
	}

	function toggle<T = unknown>(id: ModalId, data?: T) {
		if (isOpen(id)) close(id)
		else open(id, data)
	}

	return {
		registry,
		activeId,
		active,
		payload,
		registeredModalIds,
		hasModal, // 🌟 Экспортируем
		isOpen,
		register,
		unregister,
		open,
		close,
		toggle
	}
})
