import crypto from 'node:crypto'
export function generateIdUser(username: string) {
	const normalizedName = username.trim().toLowerCase()

	return crypto.createHash('sha256').update(normalizedName).digest('hex')
}
