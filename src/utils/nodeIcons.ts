// src/utils/nodeIcons.ts
import type { Component } from 'vue'
import {
	Folder,
	GraduationCap,
	BookOpen,
	Notebook,
	StickyNote,
	FileText,
	Pencil,
	Briefcase,
	Code,
	Terminal,
	Cpu,
	Database,
	Gamepad2,
	Music,
	Film,
	Camera,
	Heart,
	Star,
	Home,
	ShoppingCart,
	Plane,
	Car,
	Coffee,
	Dumbbell,
	Wallet,
	Lightbulb,
	Rocket,
	Bell,
	Calendar,
	Clock,
	Globe,
	Lock,
	Mail,
	Phone,
	Users,
	MessageSquare,
	Bookmark,
	Flag,
	Gift,
	Palette,
	Wrench,
	Cloud,
	Sun,
	Moon,
	Flame,
	Leaf,
	PawPrint,
	Utensils,
	Trophy,
	Target,
	Inbox,
	Archive,
	Newspaper,
	Languages,
	Calculator,
	FlaskConical,
	Atom
} from 'lucide-vue-next'

export interface NodeIconDef {
	id: string
	/** Название и ключевые слова для поиска */
	label: string
	component: Component
}

export const NODE_ICONS: NodeIconDef[] = [
	{ id: 'folder', label: 'Папка', component: Folder },
	{
		id: 'graduation-cap',
		label: 'Учёба университет',
		component: GraduationCap
	},
	{ id: 'book-open', label: 'Книга чтение', component: BookOpen },
	{ id: 'notebook', label: 'Заметки блокнот', component: Notebook },
	{ id: 'sticky-note', label: 'Стикер заметка', component: StickyNote },
	{ id: 'file-text', label: 'Документ файл', component: FileText },
	{ id: 'pencil', label: 'Карандаш', component: Pencil },
	{ id: 'briefcase', label: 'Работа', component: Briefcase },
	{ id: 'code', label: 'Код программирование', component: Code },
	{ id: 'terminal', label: 'Терминал консоль', component: Terminal },
	{ id: 'cpu', label: 'Процессор железо', component: Cpu },
	{ id: 'database', label: 'База данных', component: Database },
	{ id: 'gamepad', label: 'Игры', component: Gamepad2 },
	{ id: 'music', label: 'Музыка', component: Music },
	{ id: 'film', label: 'Кино видео', component: Film },
	{ id: 'camera', label: 'Фото камера', component: Camera },
	{ id: 'heart', label: 'Любимое сердце', component: Heart },
	{ id: 'star', label: 'Избранное звезда', component: Star },
	{ id: 'home', label: 'Дом семья', component: Home },
	{ id: 'shopping-cart', label: 'Покупки магазин', component: ShoppingCart },
	{ id: 'plane', label: 'Путешествия самолёт', component: Plane },
	{ id: 'car', label: 'Машина авто', component: Car },
	{ id: 'coffee', label: 'Кофе отдых', component: Coffee },
	{ id: 'dumbbell', label: 'Спорт зал', component: Dumbbell },
	{ id: 'wallet', label: 'Финансы деньги', component: Wallet },
	{ id: 'lightbulb', label: 'Идеи', component: Lightbulb },
	{ id: 'rocket', label: 'Проект запуск', component: Rocket },
	{ id: 'bell', label: 'Напоминания', component: Bell },
	{ id: 'calendar', label: 'Календарь планы', component: Calendar },
	{ id: 'clock', label: 'Время', component: Clock },
	{ id: 'globe', label: 'Интернет мир', component: Globe },
	{ id: 'lock', label: 'Приватное секрет', component: Lock },
	{ id: 'mail', label: 'Почта', component: Mail },
	{ id: 'phone', label: 'Звонки телефон', component: Phone },
	{ id: 'users', label: 'Друзья группа', component: Users },
	{ id: 'message', label: 'Чат сообщение', component: MessageSquare },
	{ id: 'bookmark', label: 'Закладки', component: Bookmark },
	{ id: 'flag', label: 'Важное флаг', component: Flag },
	{ id: 'gift', label: 'Подарки', component: Gift },
	{ id: 'palette', label: 'Дизайн рисование', component: Palette },
	{ id: 'wrench', label: 'Инструменты ремонт', component: Wrench },
	{ id: 'cloud', label: 'Облако', component: Cloud },
	{ id: 'sun', label: 'День солнце', component: Sun },
	{ id: 'moon', label: 'Ночь луна', component: Moon },
	{ id: 'flame', label: 'Огонь горячее', component: Flame },
	{ id: 'leaf', label: 'Природа', component: Leaf },
	{ id: 'paw', label: 'Животные питомцы', component: PawPrint },
	{ id: 'utensils', label: 'Еда рецепты', component: Utensils },
	{ id: 'trophy', label: 'Цели достижения', component: Trophy },
	{ id: 'target', label: 'Цель', component: Target },
	{ id: 'inbox', label: 'Входящие', component: Inbox },
	{ id: 'archive', label: 'Архив', component: Archive },
	{ id: 'newspaper', label: 'Новости', component: Newspaper },
	{ id: 'languages', label: 'Языки перевод', component: Languages },
	{ id: 'calculator', label: 'Математика расчёты', component: Calculator },
	{ id: 'flask', label: 'Химия наука', component: FlaskConical },
	{ id: 'atom', label: 'Физика', component: Atom }
]

const byId = new Map(NODE_ICONS.map(i => [i.id, i.component]))

export const getNodeIcon = (id?: string): Component | null =>
	id ? (byId.get(id) ?? null) : null

// Цвет по умолчанию зависит от названия: у разных чатов разные кружки
const DEFAULT_PALETTE = [
	'#4ea8ff',
	'#22c55e',
	'#eab308',
	'#f97316',
	'#ef4444',
	'#ec4899',
	'#a855f7',
	'#14b8a6'
]

export const colorFromLabel = (label: string): string => {
	let h = 0
	for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0
	return DEFAULT_PALETTE[h % DEFAULT_PALETTE.length]!
}
