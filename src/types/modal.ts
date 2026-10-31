// src/types/modal.ts
import type { Component } from 'vue'

export type ModalId = string

export interface ModalDefinition {
	id: ModalId
	component: Component
	closeOnEsc?: boolean
	closeOnBackdrop?: boolean
}
