// src/api/files.ts
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

export interface UploadedFile {
  id: string;
  name: string;
  mime: string;
  size: number;
}

export const fileUrl = (id: string) => `${API_URL}/files/${id}`;

export async function uploadFile(file: File): Promise<UploadedFile> {
  const res = await fetch(
    `${API_URL}/files?name=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    },
  );
  if (!res.ok) throw new Error(`Не удалось загрузить «${file.name}»`);
  return res.json();
}
