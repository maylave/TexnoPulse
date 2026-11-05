import { useModalStore } from '@/stores/appModal'

export const modalAPI = {
	hasModal: (modalId: string): boolean => {
		const modalStore = useModalStore()
		return modalStore.hasModal(modalId)
	},
	openModal: (modalId: string, payload?: any) => {
		const modalStore = useModalStore()
		modalStore.open(modalId, payload)
	},

	closeModal: (modalId?: string) => {
		const modalStore = useModalStore()
		modalStore.close(modalId)
	},

	toggleModal: (modalId: string, payload?: any) => {
		const modalStore = useModalStore()
		modalStore.toggle(modalId, payload)
	},

	registerModal: (
		modalId: string,
		component: any,
		options: Record<string, any> = {}
	) => {
		const modalStore = useModalStore()
		modalStore.register({
			id: modalId,
			component: component,
			...options
		})
	},
	getRegisteredModals: () => {
		const modalStore = useModalStore()
		return modalStore.registeredModalIds
	},

	unregisterModal: (modalId: string) => {
		const modalStore = useModalStore()
		modalStore.unregister(modalId)
	}
}
