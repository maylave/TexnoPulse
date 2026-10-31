// src/stores/modal.ts
import { ref, shallowRef, computed, markRaw } from 'vue'
import { defineStore } from 'pinia'
import type { ModalDefinition, ModalId } from '@/types/modal'

export const useModalStore = defineStore('modal', () => {
	// Реестр: компоненты не должны быть реактивными, поэтому shallowRef + markRaw
	const registry = shallowRef<Record<ModalId, ModalDefinition>>({})

	// Активная модалка и данные для неё
	const activeId = ref<ModalId | null>(null)
	const payload = ref<unknown>(null)

	const active = computed(() =>
		activeId.value ? (registry.value[activeId.value] ?? null) : null
	)

	const isOpen = (id: ModalId) => activeId.value === id
	const isRegistered = (id: ModalId) => id in registry.value

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

	// Открыть модалку: предыдущая активная заменяется
	function open<T = unknown>(id: ModalId, data?: T) {
		if (!isRegistered(id)) {
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
		isOpen,
		isRegistered,
		register,
		unregister,
		open,
		close,
		toggle
	}
})
