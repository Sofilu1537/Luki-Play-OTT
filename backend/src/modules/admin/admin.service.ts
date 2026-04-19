import { Injectable, Inject, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  UserStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
  SessionLimitPolicy as PrismaSessionLimitPolicy,
} from '../../../generated/prisma/client.js';
import { UserRole, UserStatus } from '../auth/domain/entities/user.entity.js';
import { SessionLimitPolicy } from '../auth/domain/entities/account.entity.js';
import { HASH_SERVICE } from '../auth/domain/interfaces/hash.service.js';
import type { HashService } from '../auth/domain/interfaces/hash.service.js';
import { EMAIL_SERVICE } from '../auth/domain/interfaces/email.service.js';
import type { EmailService } from '../auth/domain/interfaces/email.service.js';
import { CreateCmsUserUseCase } from '../auth/application/use-cases/create-cms-user.use-case.js';
import { toAdminUser } from './utils/to-admin-user.js';
import type { AdminUser } from './utils/to-admin-user.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { SetUserPasswordDto } from './dto/set-user-password.dto.js';
import { CanalTipoDto, CreateCanalDto } from './dto/create-canal.dto.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';
import { CreatePlanDto, PlanEntitlementDto, PlanUserGroupDto, PlanVideoQualityDto } from './dto/create-plan.dto.js';
import { UpdateCanalDto } from './dto/update-canal.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Component type definition
// ---------------------------------------------------------------------------

export interface OttComponent {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo: string;        // VOD | LIVE | DESTACADOS | SERIES | RADIO | PPV
  activo: boolean;
  orden: number;
}

export interface OttPlan {
  id: string;
  nombre: string;
  descripcion: string;
  grupoUsuarios: PlanUserGroupDto;
  precio: number;
  moneda: string;
  duracionDias: number;
  activo: boolean;
  maxDevices: number;
  maxConcurrentStreams: number;
  maxProfiles: number;
  videoQuality: PlanVideoQualityDto;
  allowDownloads: boolean;
  allowCasting: boolean;
  hasAds: boolean;
  trialDays: number;
  gracePeriodDays: number;
  entitlements: PlanEntitlementDto[];
  allowedComponentIds: string[];
  allowedCategoryIds: string[];
}

export interface AdminUserRecord {
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
  status: UserStatus;
  role: UserRole;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  isLocked: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  maxDevices: number;
  sessionDurationDays: number;
  sessionLimitPolicy: SessionLimitPolicy;
  isCmsUser: boolean;
  isSubscriber: boolean;
}

export interface AdminUserSessionRecord {
  id: string;
  deviceId: string;
  audience: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: 'active' | 'expired' | 'revoked';
}

export interface AdminUserPlanRecord {
  id: string;
  nombre: string;
  descripcion: string;
  duracionDias: number;
  maxDevices: number;
  maxConcurrentStreams: number;
  maxProfiles: number;
  videoQuality: PlanVideoQualityDto;
  allowDownloads: boolean;
  allowCasting: boolean;
  hasAds: boolean;
  trialDays: number;
  gracePeriodDays: number;
  entitlements: PlanEntitlementDto[];
  allowedComponentIds: string[];
  allowedCategoryIds: string[];
}

export interface AdminCanalRecord {
  id: string;
  nombre: string;
  logo: string;
  streamUrl: string;
  detalle: string;
  categoria: string;
  tipo: CanalTipoDto;
  requiereControlParental: boolean;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface AdminCategoriaRecord {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

@Injectable()
export class AdminService {
  private readonly canalesStorePath = resolve(process.cwd(), 'data', 'admin-canales.json');
  private canalesCache: AdminCanalRecord[] | null = null;
  private canalesLock: Promise<void> = Promise.resolve();

  private readonly categoriasStorePath = resolve(process.cwd(), 'data', 'admin-categorias.json');
  private categoriasCache: AdminCategoriaRecord[] | null = null;
  private categoriasLock: Promise<void> = Promise.resolve();

  /** Categorías semilla — IDs fijos que coinciden con los planes predefinidos */
  private readonly SEED_CATEGORIAS: AdminCategoriaRecord[] = [
    { id: 'cat-001', nombre: 'Noticias',  descripcion: 'Canales informativos nacionales e internacionales', icono: 'newspaper-o', activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-002', nombre: 'Deportes',  descripcion: 'Canales y eventos deportivos en vivo',              icono: 'futbol-o',    activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-003', nombre: 'Infantil',  descripcion: 'Contenido para niños con control parental',         icono: 'child',       activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-004', nombre: 'General',   descripcion: 'Entretenimiento general',                            icono: 'tv',          activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-005', nombre: 'Cine',      descripcion: 'Películas y series de cine',                         icono: 'film',        activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-006', nombre: 'Música',    descripcion: 'Canales de música y videoclips',                     icono: 'music',       activo: true, creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
  ];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    private readonly createCmsUserUseCase: CreateCmsUserUseCase,
  ) {}

  // ---- In-memory components store ------------------------------------------

  private componentes: OttComponent[] = [
    { id: 'comp-001', nombre: 'VOD',            descripcion: 'Video bajo demanda — películas y series disponibles en cualquier momento',                  icono: 'film',        tipo: 'VOD',        activo: true,  orden: 1 },
    { id: 'comp-002', nombre: 'Destacados',     descripcion: 'Contenido destacado y recomendado que aparece en el banner principal',                       icono: 'star',        tipo: 'DESTACADOS', activo: true,  orden: 2 },
    { id: 'comp-003', nombre: 'Live',           descripcion: 'Canales en vivo — transmisión en tiempo real de televisión y eventos',                       icono: 'circle',      tipo: 'LIVE',       activo: true,  orden: 3 },
    { id: 'comp-004', nombre: 'Series',         descripcion: 'Catálogo de series organizadas por temporadas y episodios',                                  icono: 'list',        tipo: 'SERIES',     activo: true,  orden: 4 },
    { id: 'comp-005', nombre: 'Radio',          descripcion: 'Estaciones de radio en línea con streaming de audio continuo',                               icono: 'headphones',  tipo: 'RADIO',      activo: false, orden: 5 },
    { id: 'comp-006', nombre: 'PPV',            descripcion: 'Pay Per View — eventos y contenido premium de pago individual',                              icono: 'ticket',      tipo: 'PPV',        activo: false, orden: 6 },
    { id: 'comp-007', nombre: 'Kids',           descripcion: 'Contenido infantil con controles parentales integrados',                                     icono: 'child',       tipo: 'KIDS',       activo: true,  orden: 7 },
    { id: 'comp-008', nombre: 'Deportes',       descripcion: 'Canales y eventos deportivos en vivo y bajo demanda',                                        icono: 'futbol-o',    tipo: 'DEPORTES',   activo: true,  orden: 8 },
    { id: 'comp-009', nombre: 'Música',         descripcion: 'Canales de música, videoclips y conciertos en streaming',                                    icono: 'music',       tipo: 'MUSICA',     activo: false, orden: 9 },
    { id: 'comp-010', nombre: 'Noticias',       descripcion: 'Canales de noticias nacionales e internacionales 24/7',                                      icono: 'newspaper-o', tipo: 'NOTICIAS',   activo: true,  orden: 10 },
  ];

  // ---- Componentes ---------------------------------------------------------

  getComponentes(): OttComponent[] {
    return [...this.componentes].sort((a, b) => a.orden - b.orden);
  }

  toggleComponente(id: string): OttComponent {
    const comp = this.componentes.find((c) => c.id === id);
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    comp.activo = !comp.activo;
    return { ...comp };
  }

  reorderComponentes(ids: string[]): OttComponent[] {
    ids.forEach((id, index) => {
      const comp = this.componentes.find((c) => c.id === id);
      if (comp) comp.orden = index + 1;
    });
    return this.getComponentes();
  }

  // ---- Users ---------------------------------------------------------------

  async listUsers(): Promise<AdminUser[]> {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: { contracts: { where: { deletedAt: null } } },
      orderBy: { createdAt: 'desc' },
    });

    const sessionCounts = await this.prisma.session.groupBy({
      by: ['contractId'],
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      _count: true,
    });
    const sessionMap = new Map(sessionCounts.map(s => [s.contractId, s._count]));

    return customers.map(c => {
      const contractIds = c.contracts.map(ct => ct.id);
      const activeSessions = contractIds.reduce((sum, cid) => sum + (sessionMap.get(cid) ?? 0), 0);
      return toAdminUser(c, activeSessions);
    });
  }

  async getUser(id: string): Promise<AdminUser> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { where: { deletedAt: null } } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);
    const activeSessions = await this.countActiveSessions(id);
    return toAdminUser(customer, activeSessions);
  }

  async createUser(dto: CreateUserDto): Promise<AdminUser> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.customer.findUnique({ where: { email: normalizedEmail } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const role = dto.role ?? UserRole.CLIENTE;
    const status = dto.status ?? UserStatus.ACTIVE;

    // CMS user path
    if (role === UserRole.SUPERADMIN || role === UserRole.SOPORTE) {
      const firstName = dto.firstName?.trim() || this.extractNames(dto.nombre).firstName;
      const lastName = dto.lastName?.trim() || this.extractNames(dto.nombre).lastName;
      if (!firstName) {
        throw new BadRequestException('Los usuarios del sistema requieren nombre.');
      }

      const created = await this.createCmsUserUseCase.execute({
        email: normalizedEmail,
        firstName,
        lastName: lastName ?? '',
        role,
        phone: dto.telefono?.trim() || undefined,
        createdBy: 'usr-admin-001',
      });

      const customer = await this.prisma.customer.update({
        where: { id: created.id },
        data: { status: this.toPrismaStatus(status) },
        include: { contracts: { where: { deletedAt: null } } },
      });

      return toAdminUser(customer, 0);
    }

    // Regular CLIENTE user path
    const names = this.extractNames(dto.nombre);
    const passwordHash = await bcrypt.hash(randomBytes(16).toString('hex'), 10);

    const contractData = dto.contrato
      ? (() => {
          const contractNumber = this.buildContractNumber(dto.contrato);
          return {
            contracts: {
              create: {
                contractNumber,
                planName: dto.plan ?? dto.planId ?? 'LUKI PLAY',
                maxDevices: dto.maxDevices ?? 3,
                sessionDurationDays: dto.sessionDurationDays ?? 30,
                sessionLimitPolicy: this.toPrismaSessionLimitPolicy(dto.sessionLimitPolicy),
                fechaInicio: new Date(),
                fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
          };
        })()
      : {};

    const customer = await this.prisma.customer.create({
      data: {
        nombre: dto.nombre?.trim() || normalizedEmail.split('@')[0],
        firstName: dto.firstName?.trim() || names.firstName,
        lastName: dto.lastName?.trim() || names.lastName,
        email: normalizedEmail,
        telefono: dto.telefono?.trim() || null,
        passwordHash,
        role: this.toPrismaRole(role),
        status: this.toPrismaStatus(status),
        isSubscriber: true,
        ...contractData,
      },
      include: { contracts: { where: { deletedAt: null } } },
    });

    return toAdminUser(customer, 0);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<AdminUser> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { where: { deletedAt: null } } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== customer.email?.toLowerCase()) {
        const dup = await this.prisma.customer.findUnique({ where: { email: normalizedEmail } });
        if (dup && dup.id !== id) {
          throw new ConflictException('Ya existe un usuario con ese correo.');
        }
      }
    }

    const names = dto.nombre !== undefined && dto.firstName === undefined && dto.lastName === undefined
      ? this.extractNames(dto.nombre)
      : { firstName: null, lastName: null };

    await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.firstName !== undefined
          ? { firstName: dto.firstName.trim() }
          : names.firstName
            ? { firstName: names.firstName }
            : {}),
        ...(dto.lastName !== undefined
          ? { lastName: dto.lastName.trim() }
          : names.lastName
            ? { lastName: names.lastName }
            : {}),
        ...(dto.email ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.telefono !== undefined ? { telefono: dto.telefono?.trim() || null } : {}),
        ...(dto.status ? { status: this.toPrismaStatus(dto.status) } : {}),
      },
    });

    // Update contract-related fields on first contract
    const contract = customer.contracts[0];
    if (contract && (dto.maxDevices !== undefined || dto.sessionDurationDays !== undefined || dto.sessionLimitPolicy !== undefined)) {
      await this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          ...(dto.maxDevices !== undefined ? { maxDevices: dto.maxDevices } : {}),
          ...(dto.sessionDurationDays !== undefined ? { sessionDurationDays: dto.sessionDurationDays } : {}),
          ...(dto.sessionLimitPolicy !== undefined ? { sessionLimitPolicy: this.toPrismaSessionLimitPolicy(dto.sessionLimitPolicy) } : {}),
        },
      });
    }

    const updated = await this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: { contracts: { where: { deletedAt: null } } },
    });
    const activeSessions = await this.countActiveSessions(id);
    return toAdminUser(updated, activeSessions);
  }

  async deleteUser(id: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const now = new Date();
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: now } });
    await this.prisma.contract.updateMany({ where: { customerId: id, deletedAt: null }, data: { deletedAt: now } });
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
    const customer = await this.prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: this.toPrismaStatus(status) },
      include: { contracts: { where: { deletedAt: null } } },
    });
    const activeSessions = await this.countActiveSessions(id);
    return toAdminUser(updated, activeSessions);
  }

  async setUserPassword(id: string, dto: SetUserPasswordDto): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.customer.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, isLocked: false, lockedUntil: null },
    });

    if (dto.revokeSessions !== false) {
      await this.revokeAllSessionsForCustomer(id);
    }

    return { message: 'Contraseña actualizada y sesiones revocadas.' };
  }

  async generateAndSendPassword(id: string): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const password = this.generateSecurePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.customer.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, isLocked: false, lockedUntil: null },
    });

    await this.revokeAllSessionsForCustomer(id);

    const displayName = customer.firstName
      ? `${customer.firstName} ${customer.lastName ?? ''}`.trim()
      : customer.email?.split('@')[0] ?? 'Usuario';

    await this.emailService.sendGeneratedPassword(customer.email ?? '', password, displayName);
    return { message: `Contraseña generada y enviada a ${customer.email}` };
  }

  /**
   * Generates a cryptographically secure password following OWASP guidelines:
   * - 16 characters minimum
   * - Guaranteed uppercase, lowercase, digits, and special characters
   * - Uses crypto.randomBytes for true randomness (never Math.random)
   * - Fisher-Yates shuffle with crypto-random indices
   */
  private generateSecurePassword(): string {
    const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower   = 'abcdefghijklmnopqrstuvwxyz';
    const digits  = '0123456789';
    const special = '!@#$%&*-_=+?';
    const all     = upper + lower + digits + special;

    const pick = (charset: string): string => charset[randomBytes(1)[0] % charset.length];

    const required = [
      pick(upper), pick(upper),
      pick(lower), pick(lower),
      pick(digits), pick(digits),
      pick(special), pick(special),
    ];

    const remaining = Array.from({ length: 8 }, () => pick(all));
    const combined  = [...required, ...remaining];

    for (let i = combined.length - 1; i > 0; i--) {
      const j = randomBytes(1)[0] % (i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }

  async listUserSessions(id: string): Promise<AdminUserSessionRecord[]> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { select: { id: true } } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const contractIds = customer.contracts.map(c => c.id);
    const sessions = await this.prisma.session.findMany({
      where: { contractId: { in: contractIds } },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return sessions.map(s => ({
      id: s.id,
      deviceId: s.deviceId,
      audience: s.audience,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt?.toISOString() ?? null,
      status: (s.revokedAt ? 'revoked' : s.expiresAt < now ? 'expired' : 'active') as AdminUserSessionRecord['status'],
    }));
  }

  async revokeUserSession(id: string, sessionId: string): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { select: { id: true } } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const contractIds = customer.contracts.map(c => c.id);
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || !contractIds.includes(session.contractId)) {
      throw new NotFoundException('La sesión indicada no existe para este usuario.');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { message: 'Sesión revocada.' };
  }

  async revokeAllUserSessions(id: string): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { select: { id: true } } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);
    await this.revokeAllSessionsForCustomer(id);
    return { message: 'Todas las sesiones fueron revocadas.' };
  }

  async getUserPlan(id: string): Promise<AdminUserPlanRecord> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { where: { deletedAt: null }, take: 1 } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const contract = customer.contracts[0];
    const plan = contract
      ? await this.prisma.plan.findFirst({ where: { nombre: contract.planName } })
      : null;

    return {
      id: plan?.id ?? contract?.id ?? id,
      nombre: plan?.nombre ?? contract?.planName ?? 'LUKI PLAY',
      descripcion: plan?.descripcion ?? '',
      duracionDias: contract?.sessionDurationDays ?? 30,
      maxDevices: plan?.maxDevices ?? contract?.maxDevices ?? 3,
      maxConcurrentStreams: plan?.maxConcurrentStreams ?? contract?.maxConcurrentStreams ?? 1,
      maxProfiles: plan?.maxProfiles ?? 3,
      videoQuality: (plan?.videoQuality ?? 'HD') as PlanVideoQualityDto,
      allowDownloads: plan?.allowDownloads ?? false,
      allowCasting: plan?.allowCasting ?? true,
      hasAds: plan?.hasAds ?? true,
      trialDays: 0,
      gracePeriodDays: 0,
      entitlements: (plan?.entitlements ?? []) as PlanEntitlementDto[],
      allowedComponentIds: (plan?.allowedComponentIds ?? []) as string[],
      allowedCategoryIds: (plan?.allowedCategoryIds ?? []) as string[],
    };
  }

  // ---- Monitor -------------------------------------------------------------

  async getMonitorStats() {
    const [totalUsuarios, usuariosActivos, contratosActivos] = await Promise.all([
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({ where: { deletedAt: null, status: PrismaUserStatus.ACTIVE } }),
      this.prisma.contract.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalUsuarios,
      usuariosActivos,
      sesionesActivas: Math.floor(Math.random() * 20) + 5,
      contratosActivos,
      ingresosMes: parseFloat((contratosActivos * 19.99).toFixed(2)),
      cargaServidor: Math.floor(Math.random() * 40) + 20,
    };
  }

  // ---- Plans (Prisma) -------------------------------------------------------

  async getPlanes() {
    return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createPlan(dto: CreatePlanDto) {
    await this.validatePlanReferences(dto.allowedComponentIds, dto.allowedCategoryIds ?? []);

    return this.prisma.plan.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        activo: dto.activo ?? true,
        maxDevices: dto.maxDevices,
        maxConcurrentStreams: dto.maxConcurrentStreams,
        maxProfiles: dto.maxProfiles,
        videoQuality: dto.videoQuality,
        allowDownloads: dto.allowDownloads ?? false,
        allowCasting: dto.allowCasting ?? true,
        hasAds: dto.hasAds ?? false,
        entitlements: dto.entitlements as string[],
        allowedComponentIds: dto.allowedComponentIds,
        allowedCategoryIds: (dto.allowedCategoryIds ?? []) as string[],
      },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Plan ${id} not found`);

    const nextComponentIds = dto.allowedComponentIds ?? (existing.allowedComponentIds as string[]);
    const nextCategoryIds = dto.allowedCategoryIds ?? (existing.allowedCategoryIds as string[]);
    await this.validatePlanReferences(nextComponentIds, nextCategoryIds);

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        ...(dto.maxDevices !== undefined ? { maxDevices: dto.maxDevices } : {}),
        ...(dto.maxConcurrentStreams !== undefined ? { maxConcurrentStreams: dto.maxConcurrentStreams } : {}),
        ...(dto.maxProfiles !== undefined ? { maxProfiles: dto.maxProfiles } : {}),
        ...(dto.videoQuality !== undefined ? { videoQuality: dto.videoQuality } : {}),
        ...(dto.allowDownloads !== undefined ? { allowDownloads: dto.allowDownloads } : {}),
        ...(dto.allowCasting !== undefined ? { allowCasting: dto.allowCasting } : {}),
        ...(dto.hasAds !== undefined ? { hasAds: dto.hasAds } : {}),
        ...(dto.entitlements ? { entitlements: dto.entitlements as string[] } : {}),
        allowedComponentIds: nextComponentIds,
        allowedCategoryIds: nextCategoryIds,
      },
    });
  }

  async togglePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return this.prisma.plan.update({ where: { id }, data: { activo: !plan.activo } });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    await this.prisma.plan.delete({ where: { id } });
  }

  getSliders() {
    return [
      { id: 'sl-001', titulo: 'Bienvenido a Luki Play', subtitulo: 'Tu entretenimiento sin límites', imagen: '', orden: 1, activo: true },
      { id: 'sl-002', titulo: 'Contenido 4K',          subtitulo: 'La mejor calidad de imagen',      imagen: '', orden: 2, activo: true },
      { id: 'sl-003', titulo: 'Deportes en Vivo',       subtitulo: 'No te pierdas ningún partido',   imagen: '', orden: 3, activo: false },
    ];
  }

  async getCanales() {
    return this.readCanalesStore();
  }

  async createCanal(dto: CreateCanalDto) {
    return this.withCanalesLock(async () => {
      const canales = await this.readCanalesStore();
      const now = new Date().toISOString();
      const created = this.normalizeCanalRecord({
        id: `ch-${uuidv4().slice(0, 8)}`,
        nombre: dto.nombre,
        logo: dto.logo ?? '',
        streamUrl: dto.streamUrl,
        detalle: dto.detalle,
        categoria: dto.categoria,
        tipo: dto.tipo ?? CanalTipoDto.LIVE,
        requiereControlParental: dto.requiereControlParental ?? false,
        activo: dto.activo ?? true,
        creadoEn: now,
        actualizadoEn: now,
      });
      canales.unshift(created);
      await this.writeCanalesStore(canales);
      return this.cloneCanal(created);
    });
  }

  async updateCanal(id: string, dto: UpdateCanalDto) {
    return this.withCanalesLock(async () => {
      const canales = await this.readCanalesStore();
      const index = canales.findIndex((item) => item.id === id);
      if (index === -1) throw new NotFoundException(`Canal ${id} not found`);

      const updated = this.normalizeCanalRecord({
        ...canales[index],
        ...dto,
        id,
        tipo: dto.tipo ?? canales[index].tipo,
        actualizadoEn: new Date().toISOString(),
      });

      canales[index] = updated;
      await this.writeCanalesStore(canales);
      return this.cloneCanal(updated);
    });
  }

  async toggleCanal(id: string) {
    return this.withCanalesLock(async () => {
      const canales = await this.readCanalesStore();
      const index = canales.findIndex((item) => item.id === id);
      if (index === -1) throw new NotFoundException(`Canal ${id} not found`);

      const updated = this.normalizeCanalRecord({
        ...canales[index],
        activo: !canales[index].activo,
        actualizadoEn: new Date().toISOString(),
      });

      canales[index] = updated;
      await this.writeCanalesStore(canales);
      return this.cloneCanal(updated);
    });
  }

  async deleteCanal(id: string) {
    return this.withCanalesLock(async () => {
      const canales = await this.readCanalesStore();
      const next = canales.filter((item) => item.id !== id);
      if (next.length === canales.length) throw new NotFoundException(`Canal ${id} not found`);
      await this.writeCanalesStore(next);
    });
  }

  // ---- Categorias CRUD (JSON persistence) ---------------------------------

  async getCategorias(): Promise<AdminCategoriaRecord[]> {
    return this.readCategoriasStore();
  }

  async createCategoria(dto: CreateCategoriaDto): Promise<AdminCategoriaRecord> {
    return this.withCategoriasLock(async () => {
      const categorias = await this.readCategoriasStore();

      const normalizedName = dto.nombre.trim();
      const duplicate = categorias.find(
        (c) => c.nombre.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (duplicate) {
        throw new ConflictException(`La categoría "${normalizedName}" ya existe.`);
      }

      const now = new Date().toISOString();
      const record: AdminCategoriaRecord = {
        id: `cat-${uuidv4().slice(0, 8)}`,
        nombre: normalizedName,
        descripcion: dto.descripcion?.trim() ?? '',
        icono: dto.icono?.trim() ?? '',
        activo: dto.activo !== false,
        creadoEn: now,
        actualizadoEn: now,
      };

      categorias.push(record);
      await this.writeCategoriasStore(categorias);
      return { ...record };
    });
  }

  async updateCategoria(id: string, dto: UpdateCategoriaDto): Promise<AdminCategoriaRecord> {
    return this.withCategoriasLock(async () => {
      const categorias = await this.readCategoriasStore();
      const index = categorias.findIndex((c) => c.id === id);
      if (index === -1) throw new NotFoundException(`Categoría ${id} not found`);

      let nombreAnterior: string | null = null;
      if (dto.nombre !== undefined) {
        const normalizedName = dto.nombre.trim();
        const duplicate = categorias.find(
          (c) => c.id !== id && c.nombre.toLowerCase() === normalizedName.toLowerCase(),
        );
        if (duplicate) {
          throw new ConflictException(`La categoría "${normalizedName}" ya existe.`);
        }
        if (normalizedName.toLowerCase() !== categorias[index].nombre.toLowerCase()) {
          nombreAnterior = categorias[index].nombre;
        }
      }

      const updated: AdminCategoriaRecord = {
        ...categorias[index],
        nombre: dto.nombre?.trim() ?? categorias[index].nombre,
        descripcion: dto.descripcion?.trim() ?? categorias[index].descripcion,
        icono: dto.icono?.trim() ?? categorias[index].icono,
        activo: dto.activo !== undefined ? dto.activo : categorias[index].activo,
        actualizadoEn: new Date().toISOString(),
      };

      categorias[index] = updated;
      await this.writeCategoriasStore(categorias);

      // Cascade: actualizar los canales que referencian esta categoría por nombre
      if (nombreAnterior !== null) {
        await this.withCanalesLock(async () => {
          const canales = await this.readCanalesStore();
          const now = new Date().toISOString();
          let changed = false;
          const actualizados = canales.map((canal) => {
            if (canal.categoria === nombreAnterior) {
              changed = true;
              return { ...canal, categoria: updated.nombre, actualizadoEn: now };
            }
            return canal;
          });
          if (changed) await this.writeCanalesStore(actualizados);
        });
      }

      return { ...updated };
    });
  }

  async toggleCategoria(id: string): Promise<AdminCategoriaRecord> {
    return this.withCategoriasLock(async () => {
      const categorias = await this.readCategoriasStore();
      const index = categorias.findIndex((c) => c.id === id);
      if (index === -1) throw new NotFoundException(`Categoría ${id} not found`);

      categorias[index] = {
        ...categorias[index],
        activo: !categorias[index].activo,
        actualizadoEn: new Date().toISOString(),
      };
      await this.writeCategoriasStore(categorias);
      return { ...categorias[index] };
    });
  }

  async deleteCategoria(id: string): Promise<void> {
    return this.withCategoriasLock(async () => {
      const categorias = await this.readCategoriasStore();
      const target = categorias.find((c) => c.id === id);
      if (!target) throw new NotFoundException(`Categoría ${id} not found`);

      // Integridad referencial: verificar que ningún canal use esta categoría
      const canales = await this.readCanalesStore();
      const enUso = canales.some((canal) => canal.categoria === target.nombre);
      if (enUso) {
        throw new ConflictException(
          `No se puede eliminar la categoría "${target.nombre}" porque está asignada a uno o más canales.`,
        );
      }

      const next = categorias.filter((c) => c.id !== id);
      await this.writeCategoriasStore(next);
    });
  }

  private async readCategoriasStore(): Promise<AdminCategoriaRecord[]> {
    if (this.categoriasCache) {
      return this.categoriasCache.map((item) => ({ ...item }));
    }

    try {
      const raw = await readFile(this.categoriasStorePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const now = new Date().toISOString();
      const categorias: AdminCategoriaRecord[] = Array.isArray(parsed)
        ? (parsed as Partial<AdminCategoriaRecord>[]).map((item) => ({
            id: typeof item.id === 'string' ? item.id : `cat-${uuidv4().slice(0, 8)}`,
            nombre: typeof item.nombre === 'string' ? item.nombre : 'Sin nombre',
            descripcion: typeof item.descripcion === 'string' ? item.descripcion : '',
            icono: typeof item.icono === 'string' ? item.icono : '',
            activo: item.activo !== false,
            creadoEn: typeof item.creadoEn === 'string' ? item.creadoEn : now,
            actualizadoEn: typeof item.actualizadoEn === 'string' ? item.actualizadoEn : now,
          }))
        : [];

      // Primera instalación: sembrar categorías por defecto con IDs fijos
      const seed = categorias.length === 0 ? [...this.SEED_CATEGORIAS] : categorias;
      if (categorias.length === 0) await this.writeCategoriasStore(seed);
      this.categoriasCache = seed;
      return seed.map((item) => ({ ...item }));
    } catch {
      // Archivo no existe: sembrar y persistir
      await this.writeCategoriasStore([...this.SEED_CATEGORIAS]);
      return this.SEED_CATEGORIAS.map((item) => ({ ...item }));
    }
  }

  private async writeCategoriasStore(categorias: AdminCategoriaRecord[]): Promise<void> {
    this.categoriasCache = categorias.map((item) => ({ ...item }));
    await mkdir(dirname(this.categoriasStorePath), { recursive: true });
    await writeFile(this.categoriasStorePath, JSON.stringify(categorias, null, 2), 'utf8');
  }


  getBlog() {
    return [
      { id: 'blog-001', titulo: 'Luki Play llega a toda Colombia',  contenido: '', autor: 'admin@lukiplay.com', publicadoEn: '2026-03-01', activo: true },
      { id: 'blog-002', titulo: 'Nuevos canales de deportes',        contenido: '', autor: 'admin@lukiplay.com', publicadoEn: '2026-03-15', activo: true },
      { id: 'blog-003', titulo: 'Actualización de la app móvil',     contenido: '', autor: 'admin@lukiplay.com', publicadoEn: '2026-04-01', activo: true },
    ];
  }

  getImpuestos() {
    return [
      { id: 'imp-001', nombre: 'IVA',     porcentaje: 19, aplicaA: 'Planes OTT',     activo: true },
      { id: 'imp-002', nombre: 'ICA',     porcentaje: 1,  aplicaA: 'Servicios',       activo: true },
      { id: 'imp-003', nombre: 'ReteICA', porcentaje: 0.5, aplicaA: 'Contratos ISP', activo: false },
    ];
  }

  // ---- Helpers -------------------------------------------------------------

  private cloneCanal(canal: AdminCanalRecord): AdminCanalRecord {
    return { ...canal };
  }

  /** Serializa el acceso de lectura-modificación-escritura sobre el almacén de canales */
  private withCanalesLock<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.canalesLock.then(() => fn());
    this.canalesLock = result.then(() => undefined, () => undefined);
    return result;
  }

  /** Serializa el acceso de lectura-modificación-escritura sobre el almacén de categorías */
  private withCategoriasLock<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.categoriasLock.then(() => fn());
    this.categoriasLock = result.then(() => undefined, () => undefined);
    return result;
  }

  private normalizeCanalRecord(canal: Partial<AdminCanalRecord>): AdminCanalRecord {
    const now = new Date().toISOString();
    return {
      id: canal.id ?? `ch-${uuidv4().slice(0, 8)}`,
      nombre: canal.nombre?.trim() || 'Canal sin nombre',
      logo: canal.logo?.trim() ?? '',
      streamUrl: canal.streamUrl?.trim() || '',
      detalle: canal.detalle?.trim() || '',
      categoria: canal.categoria?.trim() || 'General',
      tipo: canal.tipo ?? CanalTipoDto.LIVE,
      requiereControlParental: canal.requiereControlParental ?? false,
      activo: canal.activo ?? true,
      creadoEn: canal.creadoEn ?? now,
      actualizadoEn: canal.actualizadoEn ?? canal.creadoEn ?? now,
    };
  }

  private async readCanalesStore(): Promise<AdminCanalRecord[]> {
    if (this.canalesCache) {
      return this.canalesCache.map((item) => this.cloneCanal(item));
    }

    try {
      const raw = await readFile(this.canalesStorePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const canales = Array.isArray(parsed)
        ? parsed.map((item) => this.normalizeCanalRecord(item as Partial<AdminCanalRecord>))
        : [];
      this.canalesCache = canales;
      return canales.map((item) => this.cloneCanal(item));
    } catch {
      await this.writeCanalesStore([]);
      return [];
    }
  }

  private async writeCanalesStore(canales: AdminCanalRecord[]) {
    const normalized = canales.map((item) => this.normalizeCanalRecord(item));
    await mkdir(dirname(this.canalesStorePath), { recursive: true });
    await writeFile(this.canalesStorePath, JSON.stringify(normalized, null, 2), 'utf8');
    this.canalesCache = normalized;
  }

  private async validatePlanReferences(componentIds: string[], categoryIds: string[]): Promise<void> {
    const validComponentIds = new Set(this.componentes.map((item) => item.id));
    const categorias = await this.readCategoriasStore();
    const validCategoryIds = new Set(categorias.map((item: AdminCategoriaRecord) => item.id));

    const invalidComponents = componentIds.filter((id) => !validComponentIds.has(id));
    const invalidCategories = categoryIds.filter((id) => !validCategoryIds.has(id));

    if (invalidComponents.length > 0) {
      throw new BadRequestException(`Invalid component ids: ${invalidComponents.join(', ')}`);
    }

    if (invalidCategories.length > 0) {
      throw new BadRequestException(`Invalid category ids: ${invalidCategories.join(', ')}`);
    }
  }

  private extractNames(fullName?: string): { firstName: string | null; lastName: string | null } {
    const normalized = fullName?.trim();
    if (!normalized) return { firstName: null, lastName: null };
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: null };
    }
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts.slice(-1).join(' '),
    };
  }

  private buildContractNumber(contractNumber?: string): string {
    if (contractNumber?.trim()) return contractNumber.trim().toUpperCase();
    const suffix = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    return `OTT-${suffix}`;
  }

  private async countActiveSessions(customerId: string): Promise<number> {
    const contracts = await this.prisma.contract.findMany({
      where: { customerId, deletedAt: null },
      select: { id: true },
    });
    const contractIds = contracts.map(c => c.id);
    if (contractIds.length === 0) return 0;
    return this.prisma.session.count({
      where: { contractId: { in: contractIds }, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  private async revokeAllSessionsForCustomer(customerId: string): Promise<void> {
    const contracts = await this.prisma.contract.findMany({
      where: { customerId },
      select: { id: true },
    });
    const contractIds = contracts.map(c => c.id);
    if (contractIds.length > 0) {
      await this.prisma.session.updateMany({
        where: { contractId: { in: contractIds }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  private toPrismaStatus(status: UserStatus): PrismaUserStatus {
    return status.toUpperCase() as PrismaUserStatus;
  }

  private toPrismaRole(role: UserRole): PrismaUserRole {
    return role.toUpperCase() as PrismaUserRole;
  }

  private toPrismaSessionLimitPolicy(policy?: SessionLimitPolicy): PrismaSessionLimitPolicy {
    if (!policy) return PrismaSessionLimitPolicy.BLOCK_NEW;
    return policy.toUpperCase() as PrismaSessionLimitPolicy;
  }
}
