// src/utils/avatars.ts
const modules = import.meta.glob(
	'../assets/avatars/*.{png,jpg,jpeg,webp,svg}',
	{
		eager: true,
		query: '?url',
		import: 'default'
	}
) as Record<string, string>

export interface PresetAvatar {
	id: string // имя файла
	url: string // адрес для <img>
}

export const PRESET_PREFIX = 'preset:'

export const PRESET_AVATARS: PresetAvatar[] = Object.entries(modules).map(
	([path, url]) => ({ id: path.split('/').pop()!, url })
)

const byId = new Map(PRESET_AVATARS.map(a => [a.id, a.url]))

/** Превращает сохранённое значение (preset:..., data URL, ссылку) в адрес для <img> */
export function resolveAvatar(value?: string): string {
	if (!value) return ''
	if (value.startsWith(PRESET_PREFIX)) {
		return byId.get(value.slice(PRESET_PREFIX.length)) ?? ''
	}
	return value
}
