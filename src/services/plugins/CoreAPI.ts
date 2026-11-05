// src/services/plugins/api/index.ts
import { modalAPI } from './modal'
// import { chatAPI } from './chat'

export const coreApi = {
	modal: modalAPI
}

export type SnapiCoreAPI = typeof coreApi
