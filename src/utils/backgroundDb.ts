// src/utils/backgroundDb.ts
const DB_NAME = 'chat-backgrounds'
const STORE = 'images'

const openDb = (): Promise<IDBDatabase> =>
	new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1)
		req.onupgradeneeded = () => req.result.createObjectStore(STORE)
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})

const run = async <T>(
	mode: IDBTransactionMode,
	fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
	const db = await openDb()
	return new Promise<T>((resolve, reject) => {
		const req = fn(db.transaction(STORE, mode).objectStore(STORE))
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

export const putImage = (id: string, blob: Blob) =>
	run('readwrite', s => s.put(blob, id))

export const getImage = (id: string) =>
	run<Blob | undefined>('readonly', s => s.get(id))

export const deleteImage = (id: string) => run('readwrite', s => s.delete(id))
