export interface AdminUser {
  id: string;
  nombre: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  telefono: string | null;
  plan: string;
  planId: string | null;
  fechaInicio: string;
  fechaFin: string;
  sesiones: number;
  contrato: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  role: 'superadmin' | 'soporte' | 'cliente';
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  isLocked: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  maxDevices: number;
  sessionDurationDays: number;
  sessionLimitPolicy: 'block_new' | 'replace_oldest';
  isCmsUser: boolean;
  isSubscriber: boolean;
}

export function toAdminUser(customer: any, activeSessions: number = 0): AdminUser {
  const contract = customer.contracts?.[0];
  return {
    id: customer.id,
    nombre: customer.nombre,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email ?? customer.ispEmail ?? '',
    telefono: customer.telefono,
    plan: customer.isCmsUser ? 'Usuario CMS' : 'LUKI PLAY',
    planId: null,
    fechaInicio: contract?.fechaInicio?.toISOString().slice(0, 10) ?? '',
    fechaFin: contract?.fechaFin?.toISOString().slice(0, 10) ?? '',
    sesiones: activeSessions,
    contrato: contract?.contractNumber ?? null,
    status: customer.status.toLowerCase() as AdminUser['status'],
    role: customer.role.toLowerCase() as AdminUser['role'],
    mustChangePassword: customer.mustChangePassword,
    mfaEnabled: customer.mfaEnabled,
    isLocked: customer.isLocked,
    lockedUntil: customer.lockedUntil?.toISOString() ?? null,
    lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
    maxDevices: contract?.maxDevices ?? 3,
    sessionDurationDays: contract?.sessionDurationDays ?? 30,
    sessionLimitPolicy: contract?.sessionLimitPolicy === 'REPLACE_OLDEST' ? 'replace_oldest' : 'block_new',
    isCmsUser: customer.isCmsUser,
    isSubscriber: customer.isSubscriber,
  };
}
