const API_BASE =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3000';

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP' | 'SMART_TV' | 'UNKNOWN';

export interface DeviceListItem {
  id: string;
  deviceFingerprint: string;
  nombre: string | null;
  tipo: DeviceType;
  os: string | null;
  browser: string | null;
  modelo: string | null;
  ipAddress: string | null;
  lastSeenAt: string | null;
  registeredAt: string;
  isCurrentDevice: boolean;
}

export interface DevicesResponse {
  devices: DeviceListItem[];
  count: number;
  limit: number;
}

export interface SessionItem {
  id: string;
  deviceId: string;
  audience: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  deviceTipo: DeviceType | null;
  deviceOs: string | null;
  deviceBrowser: string | null;
  isCurrentDevice: boolean;
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `Error ${res.status}`;
    try { msg = JSON.parse(text).message ?? msg; } catch { /* */ }
    throw Object.assign(new Error(msg), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Detect current browser/OS for registration */
function detectDeviceInfo(): { tipo: DeviceType; os: string; browser: string } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  let tipo: DeviceType = 'DESKTOP';
  if (/iPhone|iPod/.test(ua)) tipo = 'MOBILE';
  else if (/iPad/.test(ua)) tipo = 'TABLET';
  else if (/Android/.test(ua)) (/Mobile/.test(ua) ? (tipo = 'MOBILE') : (tipo = 'TABLET'));
  else if (/Smart|TV|HbbTV|Tizen|webOS/.test(ua)) tipo = 'SMART_TV';

  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = 'macOS';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  return { tipo, os, browser };
}

export async function registerDevice(token: string, deviceFingerprint: string, nombre?: string): Promise<void> {
  const { tipo, os, browser } = detectDeviceInfo();
  await apiFetch<void>('/public/devices/register', token, {
    method: 'POST',
    body: JSON.stringify({ deviceFingerprint, tipo, os, browser, nombre }),
  });
}

export async function getDevices(token: string, currentDevice?: string): Promise<DevicesResponse> {
  const qs = currentDevice ? `?currentDevice=${encodeURIComponent(currentDevice)}` : '';
  return apiFetch<DevicesResponse>(`/public/devices${qs}`, token);
}

export async function renameDevice(token: string, fingerprint: string, nombre: string): Promise<void> {
  await apiFetch<void>(`/public/devices/${encodeURIComponent(fingerprint)}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ nombre }),
  });
}

export async function removeDevice(token: string, fingerprint: string, currentDevice?: string): Promise<void> {
  const qs = currentDevice ? `?currentDevice=${encodeURIComponent(currentDevice)}` : '';
  await apiFetch<void>(`/public/devices/${encodeURIComponent(fingerprint)}${qs}`, token, {
    method: 'DELETE',
  });
}

export async function getActiveSessions(token: string, currentDevice?: string): Promise<SessionItem[]> {
  const qs = currentDevice ? `?currentDevice=${encodeURIComponent(currentDevice)}` : '';
  return apiFetch<SessionItem[]>(`/public/sessions${qs}`, token);
}
