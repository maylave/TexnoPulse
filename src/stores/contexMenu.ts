// src/stores/contexMenu.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { MenuActionItem, MenuVariant } from '@/types/menu'

type Placement = 'bottom' | 'top'

export const useContextMenuStore = defineStore('contextMenu', () => {
	const isOpen = ref(false)
	const posX = ref(0)
	const posY = ref(0)
	const placement = ref<Placement>('bottom')
	const menuItems = ref<MenuActionItem[]>([])

	// Текущий активный вариант меню
	const currentVariant = ref<MenuVariant>('full')

	const style = computed(() =>
		placement.value === 'top'
			? {
					left: `${posX.value}px`,
					bottom: `${window.innerHeight - posY.value}px`
				}
			: { left: `${posX.value}px`, top: `${posY.value}px` }
	)

	function setPos(x: number, y: number) {
		posX.value = x
		posY.value = y
	}

	function moveBy(dx: number, dy: number) {
		posX.value += dx
		posY.value += dy
	}

	// Правый клик (обычно открывает полное меню)
	function open(
		e: MouseEvent,
		items: MenuActionItem[],
		variant: MenuVariant = 'full'
	) {
		e.preventDefault()
		openAtPoint(e.clientX, e.clientY, items, variant)
	}

	// Открытие меню по готовым координатам (например, из emit дочернего компонента)
	function openAtPoint(
		x: number,
		y: number,
		items: MenuActionItem[],
		variant: MenuVariant = 'full'
	) {
		placement.value = 'bottom'
		menuItems.value = items
		currentVariant.value = variant
		setPos(x, y)
		isOpen.value = true
	}

	// Меню, привязанное к элементу (кнопке)
	function openAt(
		el: HTMLElement,
		items: MenuActionItem[],
		where: Placement = 'top',
		variant: MenuVariant = 'full'
	) {
		const rect = el.getBoundingClientRect()
		const gap = 12
		placement.value = where
		menuItems.value = items
		currentVariant.value = variant
		setPos(rect.left, where === 'top' ? rect.top - gap : rect.bottom + gap)
		isOpen.value = true
	}

	function toggleAt(
		el: HTMLElement,
		items: MenuActionItem[],
		where: Placement = 'top',
		variant: MenuVariant = 'full'
	) {
		if (isOpen.value) close()
		else openAt(el, items, where, variant)
	}

	function close() {
		isOpen.value = false
	}

	function runItem(item: MenuActionItem) {
		if (item.disabled) return
		close()
		item.action?.()
	}

	return {
		isOpen,
		posX,
		posY,
		placement,
		menuItems,
		currentVariant,
		style,
		setPos,
		moveBy,
		open,
		openAtPoint,
		openAt,
		toggleAt,
		close,
		runItem
	}
})
