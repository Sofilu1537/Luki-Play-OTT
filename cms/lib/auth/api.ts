const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

export async function backendPost<T>(path: string, body: unknown): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (json as { message?: string }).message ?? 'Error del servidor.';
      return { error: Array.isArray(msg) ? msg[0] : msg, status: res.status };
    }
    return { data: json as T, status: res.status };
  } catch {
    return { error: 'No se pudo conectar con el servidor.', status: 503 };
  }
}
