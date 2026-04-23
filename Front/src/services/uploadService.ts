import api from './api';

export type UploadContext = 'avatar' | 'event' | 'venue';

/**
 * Envia um File para o backend e retorna a URL pública do Cloudinary.
 * O backend redimensiona e converte para WebP automaticamente.
 */
export async function uploadImage(file: File, context: UploadContext): Promise<string> {
  const form = new FormData();
  form.append('image', file);

  const { data } = await api.post<{ success: boolean; url: string }>(
    `/upload/${context}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return data.url;
}
