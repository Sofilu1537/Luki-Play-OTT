import { API_BASE_URL } from './api/config';

export async function openStream(
  channelId: string,
  token: string,
  deviceId: string,
  contractId?: string,
): Promise<{ streamId: string }> {
  const res = await fetch(`${API_BASE_URL}/public/streams/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channelId, deviceId, ...(contractId ? { contractId } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const e = new Error((err['message'] as string) ?? 'Error al iniciar stream') as Error & { status: number };
    e.status = res.status;
    throw e;
  }
  return res.json() as Promise<{ streamId: string }>;
}

export async function streamHeartbeat(streamId: string, token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/public/streams/${streamId}/heartbeat`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export async function stopStream(streamId: string, token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/public/streams/${streamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}
