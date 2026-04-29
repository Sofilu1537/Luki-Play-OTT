import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  UserStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
  SessionLimitPolicy as PrismaSessionLimitPolicy,
  ChannelStatus,
  StreamProtocol,
  ChannelHealthStatus,
} from '@prisma/client';
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
import {
  CanalStatusDto,
  StreamProtocolDto,
  CreateCanalDto,
} from './dto/create-canal.dto.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';
import {
  CreatePlanDto,
  PlanEntitlementDto,
  PlanUserGroupDto,
  PlanVideoQualityDto,
} from './dto/create-plan.dto.js';
import { UpdateCanalDto } from './dto/update-canal.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { CreateSliderDto, SliderActionDto } from './dto/create-slider.dto.js';
import { UpdateSliderDto } from './dto/update-slider.dto.js';
import {
  CMS_MODULES,
  sanitizePermissions,
} from '../access-control/domain/permissions.js';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Component type definition
// ---------------------------------------------------------------------------

export interface OttComponent {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo: string;
  activo: boolean;
  orden: number;
  categories?: Array<{
    id: string;
    nombre: string;
    icono: string;
    activo: boolean;
  }>;
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

export interface AdminChannelRecord {
  id: string;
  nombre: string;
  slug: string;
  streamUrl: string;
  backupUrl: string | null;
  logoUrl: string | null;
  categoryId: string;
  category?: { id: string; nombre: string };
  epgSourceId: string | null;
  status: ChannelStatus;
  isLive: boolean;
  healthStatus: ChannelHealthStatus;
  uptimePercent: number;
  lastHealthCheckAt: Date | null;
  streamProtocol: StreamProtocol;
  resolution: string;
  bitrateKbps: number;
  isDrmProtected: boolean;
  geoRestriction: string | null;
  sortOrder: number;
  planIds: string[];
  requiereControlParental: boolean;
  viewerCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AdminCategoryRecord {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    private readonly createCmsUserUseCase: CreateCmsUserUseCase,
  ) {}

  // ---- Componentes ---------------------------------------------------------

  async getComponentes(): Promise<OttComponent[]> {
    const rows = await this.prisma.component.findMany({
      orderBy: { orden: 'asc' },
      include: {
        componentCategories: {
          include: {
            category: {
              select: { id: true, nombre: true, icono: true, activo: true },
            },
          },
        },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      icono: r.icono,
      tipo: r.tipo,
      activo: r.activo,
      orden: r.orden,
      categories: r.componentCategories.map((cc) => cc.category),
    }));
  }

  async getComponenteById(id: string): Promise<OttComponent> {
    const comp = await this.prisma.component.findUnique({
      where: { id },
      include: {
        componentCategories: {
          include: {
            category: {
              select: { id: true, nombre: true, icono: true, activo: true },
            },
          },
        },
      },
    });
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    return {
      id: comp.id,
      nombre: comp.nombre,
      descripcion: comp.descripcion,
      icono: comp.icono,
      tipo: comp.tipo,
      activo: comp.activo,
      orden: comp.orden,
      categories: comp.componentCategories.map((cc) => cc.category),
    };
  }

  async toggleComponente(id: string): Promise<OttComponent> {
    const comp = await this.prisma.component.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException(`Component ${id} not found`);
    const updated = await this.prisma.component.update({
      where: { id },
      data: { activo: !comp.activo },
    });
    return {
      id: updated.id,
      nombre: updated.nombre,
      descripcion: updated.descripcion,
      icono: updated.icono,
      tipo: updated.tipo,
      activo: updated.activo,
      orden: updated.orden,
      categories: [],
    };
  }

  async reorderComponentes(ids: string[]): Promise<OttComponent[]> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.component.update({
          where: { id },
          data: { orden: index + 1 },
        }),
      ),
    );
    return this.getComponentes();
  }

  async createComponente(dto: {
    nombre: string;
    descripcion?: string;
    icono?: string;
    tipo: string;
    activo?: boolean;
    orden?: number;
  }): Promise<OttComponent> {
    const { v4: uuidv4 } = await import('uuid');
    const existing = await this.prisma.component.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing)
      throw new ConflictException(
        `Ya existe un componente con el nombre "${dto.nombre}"`,
      );
    const maxOrden = await this.prisma.component.aggregate({
      _max: { orden: true },
    });
    const nextOrden = dto.orden ?? (maxOrden._max.orden ?? 0) + 1;
    const comp = await this.prisma.component.create({
      data: {
        id: uuidv4(),
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? '',
        icono: dto.icono ?? '',
        tipo: dto.tipo,
        activo: dto.activo ?? true,
        orden: nextOrden,
      },
    });
    return {
      id: comp.id,
      nombre: comp.nombre,
      descripcion: comp.descripcion,
      icono: comp.icono,
      tipo: comp.tipo,
      activo: comp.activo,
      orden: comp.orden,
      categories: [],
    };
  }

  async updateComponente(
    id: string,
    dto: {
      nombre?: string;
      descripcion?: string;
      icono?: string;
      tipo?: string;
      activo?: boolean;
      orden?: number;
    },
  ): Promise<OttComponent> {
    const comp = await this.prisma.component.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException(`Componente ${id} no encontrado`);
    if (dto.nombre && dto.nombre !== comp.nombre) {
      const conflict = await this.prisma.component.findUnique({
        where: { nombre: dto.nombre },
      });
      if (conflict)
        throw new ConflictException(
          `Ya existe un componente con el nombre "${dto.nombre}"`,
        );
    }
    const updated = await this.prisma.component.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.icono !== undefined && { icono: dto.icono }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
      },
      include: {
        componentCategories: {
          include: {
            category: {
              select: { id: true, nombre: true, icono: true, activo: true },
            },
          },
        },
      },
    });
    return {
      id: updated.id,
      nombre: updated.nombre,
      descripcion: updated.descripcion,
      icono: updated.icono,
      tipo: updated.tipo,
      activo: updated.activo,
      orden: updated.orden,
      categories: updated.componentCategories.map((cc) => cc.category),
    };
  }

  async deleteComponente(id: string): Promise<void> {
    const comp = await this.prisma.component.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException(`Componente ${id} no encontrado`);
    await this.prisma.componentCategory.deleteMany({
      where: { componentId: id },
    });
    await this.prisma.component.delete({ where: { id } });
  }

  async syncComponentCategories(
    componentId: string,
    categoryIds: string[],
  ): Promise<void> {
    const comp = await this.prisma.component.findUnique({
      where: { id: componentId },
    });
    if (!comp)
      throw new NotFoundException(`Component ${componentId} not found`);
    await this.prisma.componentCategory.deleteMany({ where: { componentId } });
    if (!categoryIds.length) return;
    const valid = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, deletedAt: null },
      select: { id: true },
    });
    if (valid.length) {
      await this.prisma.componentCategory.createMany({
        data: valid.map((c) => ({ componentId, categoryId: c.id })),
        skipDuplicates: true,
      });
    }
  }

  // ---- Users ---------------------------------------------------------------

  async listUsers(): Promise<AdminUser[]> {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        contracts: {
          where: { deletedAt: null },
          orderBy: { contractNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const sessionCounts = await this.prisma.session.groupBy({
      by: ['contractId'],
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      _count: true,
    });
    const sessionMap = new Map(
      sessionCounts.map((s) => [s.contractId, s._count]),
    );

    const users = customers.map((c) => {
      const contractIds = c.contracts.map((ct) => ct.id);
      const activeSessions = contractIds.reduce(
        (sum, cid) => sum + (sessionMap.get(cid) ?? 0),
        0,
      );
      return toAdminUser(c, activeSessions);
    });

    return users;
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
    const existing = await this.prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const role = dto.role ?? UserRole.CLIENTE;
    const status = dto.status ?? UserStatus.ACTIVE;

    // CMS user path
    if (
      role === UserRole.SUPERADMIN ||
      role === UserRole.ADMIN ||
      role === UserRole.SOPORTE
    ) {
      const firstName =
        dto.firstName?.trim() || this.extractNames(dto.nombre).firstName;
      const lastName =
        dto.lastName?.trim() || this.extractNames(dto.nombre).lastName;
      if (!firstName) {
        throw new BadRequestException(
          'Los usuarios del sistema requieren nombre.',
        );
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
        data: {
          status: this.toPrismaStatus(status),
        },
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
                sessionLimitPolicy: this.toPrismaSessionLimitPolicy(
                  dto.sessionLimitPolicy,
                ),
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
        const dup = await this.prisma.customer.findUnique({
          where: { email: normalizedEmail },
        });
        if (dup && dup.id !== id) {
          throw new ConflictException('Ya existe un usuario con ese correo.');
        }
      }
    }

    const names =
      dto.nombre !== undefined &&
      dto.firstName === undefined &&
      dto.lastName === undefined
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
        ...(dto.telefono !== undefined
          ? { telefono: dto.telefono?.trim() || null }
          : {}),
        ...(dto.idNumber !== undefined
          ? { idNumber: dto.idNumber?.trim() || null }
          : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() || null }
          : {}),
        ...(dto.status ? { status: this.toPrismaStatus(dto.status) } : {}),
      },
    });

    // Update contract-related fields on first contract
    const contract = customer.contracts[0];
    if (
      contract &&
      (dto.maxDevices !== undefined ||
        dto.sessionDurationDays !== undefined ||
        dto.sessionLimitPolicy !== undefined ||
        dto.planId !== undefined ||
        dto.contrato !== undefined)
    ) {
      const plan = dto.planId
        ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
        : null;
      await this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          ...(dto.maxDevices !== undefined
            ? { maxDevices: dto.maxDevices }
            : {}),
          ...(dto.sessionDurationDays !== undefined
            ? { sessionDurationDays: dto.sessionDurationDays }
            : {}),
          ...(dto.sessionLimitPolicy !== undefined
            ? {
                sessionLimitPolicy: this.toPrismaSessionLimitPolicy(
                  dto.sessionLimitPolicy,
                ),
              }
            : {}),
          ...(dto.planId !== undefined && plan
            ? {
                planName: plan.nombre,
                planId: plan.id,
                maxDevices: plan.maxDevices,
              }
            : {}),
          ...(dto.contrato !== undefined
            ? { contractNumber: dto.contrato }
            : {}),
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
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const now = new Date();
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: now },
    });
    await this.prisma.contract.updateMany({
      where: { customerId: id, deletedAt: null },
      data: { deletedAt: now },
    });
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: this.toPrismaStatus(status) },
      include: { contracts: { where: { deletedAt: null } } },
    });
    const activeSessions = await this.countActiveSessions(id);
    return toAdminUser(updated, activeSessions);
  }

  async setUserPassword(
    id: string,
    dto: SetUserPasswordDto,
  ): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.customer.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
        isLocked: false,
        lockedUntil: null,
      },
    });

    if (dto.revokeSessions !== false) {
      await this.revokeAllSessionsForCustomer(id);
    }

    return { message: 'Contraseña actualizada y sesiones revocadas.' };
  }

  async generateAndSendPassword(id: string): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const password = this.generateSecurePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.customer.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
        isLocked: false,
        lockedUntil: null,
      },
    });

    await this.revokeAllSessionsForCustomer(id);

    const displayName = customer.firstName
      ? `${customer.firstName} ${customer.lastName ?? ''}`.trim()
      : (customer.email?.split('@')[0] ?? 'Usuario');

    await this.emailService.sendGeneratedPassword(
      customer.email ?? '',
      password,
      displayName,
    );
    return { message: `Contraseña generada y enviada a ${customer.email}` };
  }

  async sendRecoveryCode(
    id: string,
    emailStr?: string,
  ): Promise<{ message: string; code: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const passwordHash = await bcrypt.hash(code, 10);
    await this.prisma.customer.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
        isLocked: false,
        lockedUntil: null,
      },
    });

    await this.revokeAllSessionsForCustomer(id);

    const displayName = customer.firstName
      ? `${customer.firstName} ${customer.lastName ?? ''}`.trim()
      : (customer.email?.split('@')[0] ?? 'Usuario');

    const targetEmail = emailStr || customer.email || customer.ispEmail;
    if (targetEmail) {
      try {
        await this.emailService.sendRecoveryCode(
          targetEmail,
          code,
          displayName,
        );
      } catch {
        this.logger.warn(
          `Email delivery failed for ${targetEmail} — code still valid`,
        );
      }
    }
    return {
      message: `Código enviado a ${targetEmail || 'correo no registrado'}`,
      code,
    };
  }

  /**
   * Generates a cryptographically secure password following OWASP guidelines:
   * - 16 characters minimum
   * - Guaranteed uppercase, lowercase, digits, and special characters
   * - Uses crypto.randomBytes for true randomness (never Math.random)
   * - Fisher-Yates shuffle with crypto-random indices
   */
  private generateSecurePassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%&*-_=+?';
    const all = upper + lower + digits + special;

    const pick = (charset: string): string =>
      charset[randomBytes(1)[0] % charset.length];

    const required = [
      pick(upper),
      pick(upper),
      pick(lower),
      pick(lower),
      pick(digits),
      pick(digits),
      pick(special),
      pick(special),
    ];

    const remaining = Array.from({ length: 8 }, () => pick(all));
    const combined = [...required, ...remaining];

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

    const contractIds = customer.contracts.map((c) => c.id);
    const sessions = await this.prisma.session.findMany({
      where: { contractId: { in: contractIds } },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return sessions.map((s) => ({
      id: s.id,
      deviceId: s.deviceId,
      audience: s.audience,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt?.toISOString() ?? null,
      status: s.revokedAt
        ? 'revoked'
        : s.expiresAt < now
          ? 'expired'
          : 'active',
    }));
  }

  async revokeUserSession(
    id: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { contracts: { select: { id: true } } },
    });
    if (!customer) throw new NotFoundException(`User ${id} not found`);

    const contractIds = customer.contracts.map((c) => c.id);
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (
      !session ||
      (session.contractId && !contractIds.includes(session.contractId)) ||
      (!session.contractId && session.customerId !== id)
    ) {
      throw new NotFoundException(
        'La sesión indicada no existe para este usuario.',
      );
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
      ? await this.prisma.plan.findFirst({
          where: { nombre: contract.planName },
        })
      : null;

    return {
      id: plan?.id ?? contract?.id ?? id,
      nombre: plan?.nombre ?? contract?.planName ?? 'LUKI PLAY',
      descripcion: plan?.descripcion ?? '',
      duracionDias: contract?.sessionDurationDays ?? 30,
      maxDevices: plan?.maxDevices ?? contract?.maxDevices ?? 3,
      maxConcurrentStreams:
        plan?.maxConcurrentStreams ?? contract?.maxConcurrentStreams ?? 1,
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
    const [totalUsuarios, usuariosActivos, contratosActivos] =
      await Promise.all([
        this.prisma.customer.count({ where: { deletedAt: null } }),
        this.prisma.customer.count({
          where: { deletedAt: null, status: PrismaUserStatus.ACTIVE },
        }),
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

  // ---- Roles & Permissions ---------------------------------------------------

  async getCmsRoles(): Promise<Array<{ key: string; permissions: string[] }>> {
    const roles = await this.prisma.cmsRole.findMany({
      orderBy: { key: 'asc' },
    });
    return roles.map((r) => ({
      key: r.key.toLowerCase(),
      permissions: r.permissions,
    }));
  }

  async updateCmsRolePermissions(
    roleKey: string,
    permissions: string[],
    actorId: string = 'system',
  ): Promise<{ key: string; permissions: string[] }> {
    const upperKey = roleKey.toUpperCase();
    const validKeys = Object.values(PrismaUserRole) as string[];
    if (!validKeys.includes(upperKey)) {
      throw new BadRequestException(`Rol '${roleKey}' no existe.`);
    }
    const key = upperKey as PrismaUserRole;

    if (key === PrismaUserRole.SUPERADMIN || key === PrismaUserRole.CLIENTE) {
      throw new BadRequestException(
        'Los permisos de SUPERADMIN y CLIENTE no se pueden editar.',
      );
    }

    const cleaned = sanitizePermissions(permissions);

    const updated = await this.prisma.$transaction(async (tx) => {
      const role = await tx.cmsRole.findUnique({ where: { key } });
      if (!role) throw new NotFoundException(`Rol ${roleKey} no encontrado.`);
      return tx.cmsRole.update({
        where: { key },
        data: { permissions: cleaned },
      });
    });

    this.logger.log(
      `[ROLES] Actor=${actorId} updated permissions for role=${key} → [${cleaned.join(', ')}]`,
    );

    return { key: updated.key.toLowerCase(), permissions: updated.permissions };
  }

  getPermissionModules() {
    return CMS_MODULES.map((m) => ({ key: m.key, label: m.label }));
  }

  // ---- Plans (Prisma) -------------------------------------------------------

  async getPlanes() {
    return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createPlan(dto: CreatePlanDto) {
    await this.validatePlanReferences(
      dto.allowedComponentIds,
      dto.allowedCategoryIds ?? [],
    );

    const plan = await this.prisma.plan.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        grupoUsuarios: dto.grupoUsuarios,
        precio: dto.precio,
        moneda: dto.moneda ?? 'USD',
        duracionDias: dto.duracionDias,
        activo: dto.activo ?? true,
        maxDevices: dto.maxDevices,
        maxConcurrentStreams: dto.maxConcurrentStreams,
        maxProfiles: dto.maxProfiles,
        videoQuality: dto.videoQuality,
        allowDownloads: dto.allowDownloads ?? false,
        allowCasting: dto.allowCasting ?? true,
        hasAds: dto.hasAds ?? false,
        trialDays: dto.trialDays ?? 0,
        gracePeriodDays: dto.gracePeriodDays ?? 0,
        entitlements: dto.entitlements as string[],
        allowedComponentIds: dto.allowedComponentIds,
        allowedCategoryIds: dto.allowedCategoryIds ?? [],
        allowedChannelIds: dto.allowedChannelIds ?? [],
      },
    });

    if (dto.allowedChannelIds && dto.allowedChannelIds.length > 0) {
      await this.syncChannelPlanIds(plan.id, [], dto.allowedChannelIds);
    }

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Plan ${id} not found`);

    const nextComponentIds =
      dto.allowedComponentIds ?? (existing.allowedComponentIds as string[]);
    const nextCategoryIds =
      dto.allowedCategoryIds ?? (existing.allowedCategoryIds as string[]);
    await this.validatePlanReferences(nextComponentIds, nextCategoryIds);

    const previousChannelIds = (existing.allowedChannelIds as string[]) ?? [];
    const nextChannelIds = dto.allowedChannelIds ?? previousChannelIds;

    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion }
          : {}),
        ...(dto.grupoUsuarios !== undefined
          ? { grupoUsuarios: dto.grupoUsuarios }
          : {}),
        ...(dto.precio !== undefined ? { precio: dto.precio } : {}),
        ...(dto.moneda !== undefined ? { moneda: dto.moneda } : {}),
        ...(dto.duracionDias !== undefined
          ? { duracionDias: dto.duracionDias }
          : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        ...(dto.maxDevices !== undefined ? { maxDevices: dto.maxDevices } : {}),
        ...(dto.maxConcurrentStreams !== undefined
          ? { maxConcurrentStreams: dto.maxConcurrentStreams }
          : {}),
        ...(dto.maxProfiles !== undefined
          ? { maxProfiles: dto.maxProfiles }
          : {}),
        ...(dto.videoQuality !== undefined
          ? { videoQuality: dto.videoQuality }
          : {}),
        ...(dto.allowDownloads !== undefined
          ? { allowDownloads: dto.allowDownloads }
          : {}),
        ...(dto.allowCasting !== undefined
          ? { allowCasting: dto.allowCasting }
          : {}),
        ...(dto.hasAds !== undefined ? { hasAds: dto.hasAds } : {}),
        ...(dto.trialDays !== undefined ? { trialDays: dto.trialDays } : {}),
        ...(dto.gracePeriodDays !== undefined
          ? { gracePeriodDays: dto.gracePeriodDays }
          : {}),
        ...(dto.entitlements
          ? { entitlements: dto.entitlements as string[] }
          : {}),
        allowedComponentIds: nextComponentIds,
        allowedCategoryIds: nextCategoryIds,
        allowedChannelIds: nextChannelIds,
      },
    });

    if (dto.allowedChannelIds !== undefined) {
      await this.syncChannelPlanIds(id, previousChannelIds, nextChannelIds);
    }

    return plan;
  }

  async togglePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return this.prisma.plan.update({
      where: { id },
      data: { activo: !plan.activo },
    });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);

    // Remove this plan from all channels before deleting
    const channelIds = (plan.allowedChannelIds as string[]) ?? [];
    if (channelIds.length > 0) {
      await this.syncChannelPlanIds(plan.id, channelIds, []);
    }

    await this.prisma.plan.delete({ where: { id } });
  }

  private async syncChannelPlanIds(
    planId: string,
    removed: string[],
    added: string[],
  ): Promise<void> {
    const toRemove = removed.filter((id) => !added.includes(id));
    const toAdd = added.filter((id) => !removed.includes(id));

    for (const channelId of toRemove) {
      const ch = await this.prisma.channel.findUnique({
        where: { id: channelId, deletedAt: null },
      });
      if (!ch) continue;
      const next = ch.planIds.filter((pid) => pid !== planId);
      await this.prisma.channel.update({
        where: { id: channelId },
        data: { planIds: next },
      });
    }

    for (const channelId of toAdd) {
      const ch = await this.prisma.channel.findUnique({
        where: { id: channelId, deletedAt: null },
      });
      if (!ch) continue;
      const current = ch.planIds;
      if (!current.includes(planId)) {
        await this.prisma.channel.update({
          where: { id: channelId },
          data: { planIds: [...current, planId] },
        });
      }
    }
  }

  // ---- Sliders CRUD (Prisma persistence) ------------------------------------

  async getSliders() {
    return this.prisma.slider.findMany({
      orderBy: { orden: 'asc' },
    });
  }

  async getPublicSliders(planId?: string) {
    const now = new Date();
    const sliders = await this.prisma.slider.findMany({
      where: {
        activo: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { orden: 'asc' },
    });

    if (!planId) return sliders;

    return sliders.filter(
      (s) => s.planIds.length === 0 || s.planIds.includes(planId),
    );
  }

  async createSlider(dto: CreateSliderDto) {
    const maxOrden = await this.prisma.slider.aggregate({ _max: { orden: true } });
    const nextOrden = (maxOrden._max.orden ?? 0) + 1;

    return this.prisma.slider.create({
      data: {
        titulo: dto.titulo,
        subtitulo: dto.subtitulo,
        imagen: dto.imagen,
        imagenMobile: dto.imagenMobile,
        actionType: (dto.actionType as any) ?? 'NONE',
        actionValue: dto.actionValue,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        planIds: dto.planIds ?? [],
        orden: dto.orden ?? nextOrden,
        activo: dto.activo ?? true,
      },
    });
  }

  async updateSlider(id: string, dto: UpdateSliderDto) {
    await this.findSliderOrFail(id);
    return this.prisma.slider.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.subtitulo !== undefined && { subtitulo: dto.subtitulo }),
        ...(dto.imagen !== undefined && { imagen: dto.imagen }),
        ...(dto.imagenMobile !== undefined && { imagenMobile: dto.imagenMobile }),
        ...(dto.actionType !== undefined && { actionType: dto.actionType as any }),
        ...(dto.actionValue !== undefined && { actionValue: dto.actionValue }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.planIds !== undefined && { planIds: dto.planIds }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  async toggleSlider(id: string) {
    const slider = await this.findSliderOrFail(id);
    return this.prisma.slider.update({
      where: { id },
      data: { activo: !slider.activo },
    });
  }

  async deleteSlider(id: string) {
    await this.findSliderOrFail(id);
    await this.prisma.slider.delete({ where: { id } });
  }

  async reorderSliders(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.slider.update({ where: { id }, data: { orden: index + 1 } }),
      ),
    );
    return this.getSliders();
  }

  private async findSliderOrFail(id: string) {
    const slider = await this.prisma.slider.findUnique({ where: { id } });
    if (!slider) throw new NotFoundException(`Slider ${id} no encontrado`);
    return slider;
  }

  // ---- Canales CRUD (Prisma persistence) ----------------------------------

  async getCanales(canSeeUrls = true) {
    const channels = await this.prisma.channel.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (!canSeeUrls) {
      return channels.map(({ streamUrl: _hidden, ...rest }) => rest);
    }
    return channels;
  }

  async createCanal(dto: CreateCanalDto) {
    // Verify category exists
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!categoryExists) {
      throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    // Check if channel name/slug already exists
    const existing = await this.prisma.channel.findFirst({
      where: {
        OR: [
          { nombre: dto.nombre },
          { slug: dto.slug || this.autoSlug(dto.nombre) },
        ],
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(`Channel "${dto.nombre}" already exists`);
    }

    const slug = dto.slug || this.autoSlug(dto.nombre);
    const status = this.mapStatusToDb(dto.status);

    let channel: Awaited<ReturnType<typeof this.prisma.channel.create>>;
    try {
      channel = await this.prisma.channel.create({
        data: {
          nombre: dto.nombre,
          slug,
          streamUrl: dto.streamUrl,
          backupUrl: dto.backupUrl,
          logoUrl: dto.logoUrl,
          categoryId: dto.categoryId,
          epgSourceId: dto.epgSourceId,
          status: status ?? ChannelStatus.ACTIVE,
          streamProtocol: this.mapProtocolToDb(dto.streamProtocol),
          resolution: dto.resolution ?? '1080p',
          bitrateKbps: dto.bitrateKbps ?? 5000,
          isDrmProtected: dto.isDrmProtected ?? false,
          geoRestriction: dto.geoRestriction,
          sortOrder: dto.sortOrder ?? 99,
          planIds: dto.planIds ?? [],
          requiereControlParental: dto.requiereControlParental ?? false,
        },
        include: { category: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(`Ya existe un canal con el nombre "${dto.nombre}"`);
      }
      throw e;
    }

    // Ensure ChannelCategory junction row exists for the primary category
    await this.prisma.channelCategory.upsert({
      where: {
        channelId_categoryId: {
          channelId: channel.id,
          categoryId: dto.categoryId,
        },
      },
      update: {},
      create: { channelId: channel.id, categoryId: dto.categoryId },
    });

    return channel;
  }

  async updateCanal(id: string, dto: UpdateCanalDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id, deletedAt: null },
    });
    if (!channel) {
      throw new NotFoundException(`Channel ${id} not found`);
    }

    // If name or slug is being updated, check for duplicates
    if (dto.nombre || dto.slug) {
      const newNombre = dto.nombre || channel.nombre;
      const newSlug = dto.slug || this.autoSlug(newNombre);

      const duplicate = await this.prisma.channel.findFirst({
        where: {
          AND: [
            { deletedAt: null },
            { id: { not: id } },
            {
              OR: [{ nombre: newNombre }, { slug: newSlug }],
            },
          ],
        },
      });
      if (duplicate) {
        throw new ConflictException(`Channel "${newNombre}" already exists`);
      }
    }

    // Verify category if being updated
    if (dto.categoryId) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!categoryExists) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    const updateData: any = {};
    if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.streamUrl !== undefined) updateData.streamUrl = dto.streamUrl;
    if (dto.backupUrl !== undefined) updateData.backupUrl = dto.backupUrl;
    if (dto.logoUrl !== undefined) updateData.logoUrl = dto.logoUrl;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.epgSourceId !== undefined) updateData.epgSourceId = dto.epgSourceId;
    if (dto.status !== undefined)
      updateData.status = this.mapStatusToDb(dto.status);
    if (dto.streamProtocol !== undefined)
      updateData.streamProtocol = this.mapProtocolToDb(dto.streamProtocol);
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;
    if (dto.bitrateKbps !== undefined) updateData.bitrateKbps = dto.bitrateKbps;
    if (dto.isDrmProtected !== undefined)
      updateData.isDrmProtected = dto.isDrmProtected;
    if (dto.geoRestriction !== undefined)
      updateData.geoRestriction = dto.geoRestriction;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.planIds !== undefined) updateData.planIds = dto.planIds;
    if (dto.requiereControlParental !== undefined)
      updateData.requiereControlParental = dto.requiereControlParental;

    return this.prisma.channel
      .update({
        where: { id },
        data: updateData,
        include: { category: true },
      })
      .then(async (updated) => {
        // Sync ChannelCategory junction: if categoryId changed, upsert the new junction row
        const resolvedCategoryId = dto.categoryId ?? updated.categoryId;
        await this.prisma.channelCategory.upsert({
          where: {
            channelId_categoryId: {
              channelId: id,
              categoryId: resolvedCategoryId,
            },
          },
          update: {},
          create: { channelId: id, categoryId: resolvedCategoryId },
        });
        return updated;
      });
  }

  async toggleCanal(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id, deletedAt: null },
    });
    if (!channel) {
      throw new NotFoundException(`Channel ${id} not found`);
    }

    const newStatus =
      channel.status === ChannelStatus.ACTIVE
        ? ChannelStatus.INACTIVE
        : ChannelStatus.ACTIVE;
    return this.prisma.channel.update({
      where: { id },
      data: { status: newStatus },
      include: { category: true },
    });
  }

  async deleteCanal(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id, deletedAt: null },
    });
    if (!channel) {
      throw new NotFoundException(`Channel ${id} not found`);
    }

    // Soft delete
    await this.prisma.channel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---- Categorias CRUD (Prisma persistence) ---------------------------------

  async getCategorias(query?: {
    active?: string;
    search?: string;
    limit?: string;
    offset?: string;
  }): Promise<any[]> {
    const where: any = { deletedAt: null };
    if (query?.active === 'true') where.activo = true;
    if (query?.active === 'false') where.activo = false;
    if (query?.search)
      where.nombre = { contains: query.search, mode: 'insensitive' };
    return this.prisma.category.findMany({
      where,
      include: {
        channelCategories: {
          include: {
            channel: { select: { id: true, nombre: true, status: true } },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
      ...(query?.limit ? { take: parseInt(query.limit, 10) } : {}),
      ...(query?.offset ? { skip: parseInt(query.offset, 10) } : {}),
    });
  }

  async getCategoriaById(id: string): Promise<any> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        channelCategories: {
          include: {
            channel: { select: { id: true, nombre: true, status: true } },
          },
        },
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async createCategoria(dto: CreateCategoriaDto): Promise<any> {
    const normalizedName = dto.nombre.trim();
    const slug = dto.slug?.trim() || this.autoSlug(normalizedName);

    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ nombre: normalizedName }, { slug }], deletedAt: null },
    });
    if (existing)
      throw new ConflictException(
        `Category "${normalizedName}" already exists`,
      );

    const category = await this.prisma.category.create({
      data: {
        nombre: normalizedName,
        slug,
        descripcion: dto.descripcion?.trim() ?? '',
        icono: dto.icono?.trim() ?? '',
        accentColor: dto.accentColor ?? '#FFB800',
        displayOrder: dto.displayOrder ?? 99,
        activo: dto.activo !== false,
        esContenidoAdulto: dto.esContenidoAdulto ?? false,
      },
    });

    if (dto.channelIds?.length) {
      await this.syncCategoryChannels(category.id, dto.channelIds);
    }

    return this.getCategoriaById(category.id);
  }

  async updateCategoria(id: string, dto: UpdateCategoriaDto): Promise<any> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);

    if (dto.nombre) {
      const normalizedName = dto.nombre.trim();
      if (normalizedName.toLowerCase() !== category.nombre.toLowerCase()) {
        const duplicate = await this.prisma.category.findFirst({
          where: { nombre: normalizedName, deletedAt: null, id: { not: id } },
        });
        if (duplicate)
          throw new ConflictException(
            `Category "${normalizedName}" already exists`,
          );
      }
    }

    const updateData: any = {};
    if (dto.nombre !== undefined) {
      updateData.nombre = dto.nombre.trim();
      updateData.slug = dto.slug?.trim() || this.autoSlug(dto.nombre.trim());
    }
    if (dto.slug !== undefined) updateData.slug = dto.slug.trim();
    if (dto.descripcion !== undefined)
      updateData.descripcion = dto.descripcion.trim();
    if (dto.icono !== undefined) updateData.icono = dto.icono.trim();
    if (dto.accentColor !== undefined) updateData.accentColor = dto.accentColor;
    if (dto.displayOrder !== undefined)
      updateData.displayOrder = dto.displayOrder;
    if (dto.activo !== undefined) updateData.activo = dto.activo;
    if (dto.esContenidoAdulto !== undefined)
      updateData.esContenidoAdulto = dto.esContenidoAdulto;

    await this.prisma.category.update({ where: { id }, data: updateData });

    if (dto.channelIds !== undefined) {
      await this.syncCategoryChannels(id, dto.channelIds);
    }

    return this.getCategoriaById(id);
  }

  async toggleCategoria(id: string): Promise<any> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return this.prisma.category.update({
      where: { id },
      data: { activo: !category.activo },
    });
  }

  async deleteCategoria(id: string): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);

    // Protect base categories (displayOrder <= 5)
    if (category.displayOrder <= 5) {
      throw new ConflictException(
        `Cannot delete base category "${category.nombre}". Deactivate it instead.`,
      );
    }

    // Soft delete
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async syncCategoryChannels(
    categoryId: string,
    channelIds: string[],
  ): Promise<void> {
    // Remove existing associations
    await this.prisma.channelCategory.deleteMany({ where: { categoryId } });
    if (!channelIds.length) return;
    // Validate channels exist
    const existing = await this.prisma.channel.findMany({
      where: { id: { in: channelIds }, deletedAt: null },
      select: { id: true },
    });
    const validIds = existing.map((c) => c.id);
    if (validIds.length > 0) {
      await this.prisma.channelCategory.createMany({
        data: validIds.map((channelId) => ({ channelId, categoryId })),
        skipDuplicates: true,
      });
    }
  }

  async removeCategoryChannel(
    categoryId: string,
    channelId: string,
  ): Promise<void> {
    await this.prisma.channelCategory.deleteMany({
      where: { categoryId, channelId },
    });
  }

  async bulkReorderCategorias(
    items: { id: string; displayOrder: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );
  }

  // ---- Helper methods for channels ------

  private autoSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private mapStatusToDb(status?: string): ChannelStatus | null {
    if (!status) return null;
    const mapping: Record<string, ChannelStatus> = {
      ACTIVE: ChannelStatus.ACTIVE,
      SCHEDULED: ChannelStatus.SCHEDULED,
      MAINTENANCE: ChannelStatus.MAINTENANCE,
      INACTIVE: ChannelStatus.INACTIVE,
    };
    return mapping[status] || null;
  }

  private mapProtocolToDb(protocol?: string): StreamProtocol {
    const mapping: Record<string, StreamProtocol> = {
      HLS: StreamProtocol.HLS,
      DASH: StreamProtocol.DASH,
      HLS_DASH: StreamProtocol.HLS_DASH,
    };
    return mapping[protocol || 'HLS'] || StreamProtocol.HLS;
  }

  getBlog() {
    return [
      {
        id: 'blog-001',
        titulo: 'Luki Play llega a toda Colombia',
        contenido: '',
        autor: 'admin@lukiplay.com',
        publicadoEn: '2026-03-01',
        activo: true,
      },
      {
        id: 'blog-002',
        titulo: 'Nuevos canales de deportes',
        contenido: '',
        autor: 'admin@lukiplay.com',
        publicadoEn: '2026-03-15',
        activo: true,
      },
      {
        id: 'blog-003',
        titulo: 'Actualización de la app móvil',
        contenido: '',
        autor: 'admin@lukiplay.com',
        publicadoEn: '2026-04-01',
        activo: true,
      },
    ];
  }

  getImpuestos() {
    return [
      {
        id: 'imp-001',
        nombre: 'IVA',
        porcentaje: 19,
        aplicaA: 'Planes OTT',
        activo: true,
      },
      {
        id: 'imp-002',
        nombre: 'ICA',
        porcentaje: 1,
        aplicaA: 'Servicios',
        activo: true,
      },
      {
        id: 'imp-003',
        nombre: 'ReteICA',
        porcentaje: 0.5,
        aplicaA: 'Contratos ISP',
        activo: false,
      },
    ];
  }

  // ---- Helpers -------------------------------------------------------------

  private async validatePlanReferences(
    componentIds: string[],
    categoryIds: string[],
  ): Promise<void> {
    const [components, categorias] = await Promise.all([
      this.prisma.component.findMany({ select: { id: true } }),
      this.prisma.category.findMany({ select: { id: true } }),
    ]);
    const validComponentIds = new Set(components.map((item) => item.id));
    const validCategoryIds = new Set(categorias.map((item) => item.id));

    const invalidComponents = componentIds.filter(
      (id) => !validComponentIds.has(id),
    );
    const invalidCategories = categoryIds.filter(
      (id) => !validCategoryIds.has(id),
    );

    if (invalidComponents.length > 0) {
      throw new BadRequestException(
        `Invalid component ids: ${invalidComponents.join(', ')}`,
      );
    }

    if (invalidCategories.length > 0) {
      throw new BadRequestException(
        `Invalid category ids: ${invalidCategories.join(', ')}`,
      );
    }
  }

  private extractNames(fullName?: string): {
    firstName: string | null;
    lastName: string | null;
  } {
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
    const suffix = String(Math.floor(Math.random() * 1_000_000)).padStart(
      6,
      '0',
    );
    return `OTT-${suffix}`;
  }

  private async countActiveSessions(customerId: string): Promise<number> {
    const contracts = await this.prisma.contract.findMany({
      where: { customerId, deletedAt: null },
      select: { id: true },
    });
    const contractIds = contracts.map((c) => c.id);
    if (contractIds.length === 0) return 0;
    return this.prisma.session.count({
      where: {
        contractId: { in: contractIds },
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  private async revokeAllSessionsForCustomer(
    customerId: string,
  ): Promise<void> {
    const contracts = await this.prisma.contract.findMany({
      where: { customerId },
      select: { id: true },
    });
    const contractIds = contracts.map((c) => c.id);
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

  private toPrismaSessionLimitPolicy(
    policy?: SessionLimitPolicy,
  ): PrismaSessionLimitPolicy {
    if (!policy) return PrismaSessionLimitPolicy.BLOCK_NEW;
    return policy.toUpperCase() as PrismaSessionLimitPolicy;
  }

  // ─── Registration Requests (Flujo 3) ──────────────────────

  async listRegistrationRequests(status?: string, page = 1, limit = 20) {
    const where = status ? { status: status.toUpperCase() as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.registrationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.registrationRequest.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getRegistrationRequest(id: string) {
    const req = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException(`Solicitud ${id} no encontrada`);
    return req;
  }

  async approveRegistrationRequest(
    id: string,
    contractNumber: string,
    maxDevices = 2,
    actorId: string,
  ) {
    const req = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException(`Solicitud ${id} no encontrada`);
    if (req.status !== 'PENDING')
      throw new BadRequestException('La solicitud ya fue procesada');

    // Verificar que no exista ya un cliente con esa cédula
    const existing = await this.prisma.customer.findUnique({
      where: { idNumber: req.idNumber },
    });
    if (existing)
      throw new ConflictException('Ya existe un cliente con esa cédula');

    // Verificar contractNumber único
    const existingContract = await this.prisma.contract.findUnique({
      where: { contractNumber },
    });
    if (existingContract)
      throw new ConflictException('El número de contrato ya está en uso');

    const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let activationCode = '';
    for (let i = 0; i < 6; i++)
      activationCode +=
        CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];

    const [customer, contract] = await this.prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          id: require('crypto').randomUUID(),
          nombre: `${req.nombres} ${req.apellidos}`.trim(),
          firstName: req.nombres,
          lastName: req.apellidos,
          idNumber: req.idNumber,
          telefono: req.telefono,
          email: req.email ?? null,
          role: 'CLIENTE',
          status: 'PENDING',
          isSubscriber: true,
          isCmsUser: false,
          isAccountActivated: false,
        },
      });

      const contract = await tx.contract.create({
        data: {
          id: require('crypto').randomUUID(),
          customerId: newCustomer.id,
          contractNumber,
          planName: 'LUKI PLAY',
          maxDevices,
        },
      });

      await tx.activationCode.create({
        data: {
          id: require('crypto').randomUUID(),
          customerId: newCustomer.id,
          code: activationCode,
          generatedBy: actorId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: actorId,
          reviewedAt: new Date(),
        },
      });

      return [newCustomer, contract];
    });

    this.logger.log(
      `Registration request ${id} approved by ${actorId} — customer ${customer.id}`,
    );
    return {
      customer: toAdminUser({ ...customer, contracts: [contract] }),
      activationCode,
      contractNumber: contract.contractNumber,
    };
  }

  async rejectRegistrationRequest(id: string, reason: string, actorId: string) {
    const req = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException(`Solicitud ${id} no encontrada`);
    if (req.status !== 'PENDING')
      throw new BadRequestException('La solicitud ya fue procesada');

    await this.prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: actorId,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    });

    this.logger.log(`Registration request ${id} rejected by ${actorId}`);
    return { message: 'Solicitud rechazada correctamente' };
  }

  // ---- Email health check --------------------------------------------------

  async emailHealthCheck(sendTestTo?: string) {
    return this.emailService.checkConnection(sendTestTo);
  }
}
