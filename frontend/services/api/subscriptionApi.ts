import { API_BASE_URL } from './config';

export type SubscriptionStatus = 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED';

export interface MePlanResponse {
  plan: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number | null;
    moneda: string;
    duracionDias: number;
    gracePeriodDays: number;
    maxDevices: number;
    maxConcurrentStreams: number;
    maxProfiles: number;
    videoQuality: string;
    allowDownloads: boolean;
    allowCasting: boolean;
    hasAds: boolean;
    trialDays: number;
    entitlements: string[];
  };
  subscription: {
    id: string;
    status: SubscriptionStatus;
    startDate: string;
    expirationDate: string;
    gracePeriodEnd: string | null;
  } | null;
}

export async function getMePlan(accessToken: string): Promise<MePlanResponse> {
  const res = await fetch(`${API_BASE_URL}/public/me/plan`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { message?: string }).message ?? 'Error al obtener el plan');
  return data as MePlanResponse;
}
