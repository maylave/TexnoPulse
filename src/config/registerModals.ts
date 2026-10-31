// src/config/registerModals.ts
import { useModalStore } from '@/stores/appModal'
import SettingsModal from '@/components/modals/settings/SettingsModal.vue'
import EditorModal from '@/components/modals/EditorModal.vue'
import EditNodeModal from '@/components/modals/EditNodeModal.vue'
import CodeModal from '@/components/modals/chat/codeModal.vue'
import imageModal from '@/components/modals/chat/imageModal.vue'
import GlobalSearch from '@/components/modals/GlobalSearch.vue'
export function registerModals() {
	const store = useModalStore()

	store.register({ id: 'settings', component: SettingsModal })
	store.register({ id: 'Editor', component: EditorModal })
	store.register({ id: 'editNode', component: EditNodeModal })
	store.register({ id: 'global-search', component: GlobalSearch })
	store.register({ id: 'code-modal', component: CodeModal })
	store.register({ id: 'image-modal', component: imageModal })
}
