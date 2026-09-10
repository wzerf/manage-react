import { post } from '@/api/rest/request';

export async function uploadFile(
  _bucket: string,
  _path: string,
  file: File,
): Promise<{ publicUrl?: string }> {
  const form = new FormData();
  form.append('file', file);
  return post<{ publicUrl?: string }>('/file/upload', form);
}

export async function fetchFileTransfers(): Promise<unknown[]> {
  return [];
}
