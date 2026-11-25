let csrfToken = '';

export function setCsrfToken(value: string) {
  csrfToken = value;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Server tidak tersedia. Jalankan aplikasi dengan npm run dev.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Permintaan gagal. Silakan coba lagi.');
  return result as T;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const result = await api<{ url: string }>('/admin/upload', { method: 'POST', body: form });
  return result.url;
}
