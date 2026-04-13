import { Injectable, Inject, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import type { UserRepository } from '../auth/domain/interfaces/user.repository';
import { USER_REPOSITORY } from '../auth/domain/interfaces/user.repository';
import { User, UserRole, UserStatus } from '../auth/domain/entities/user.entity';
import { Account, ContractType, ServiceStatus, SessionLimitPolicy, SubscriptionStatus } from '../auth/domain/entities/account.entity';
import { ACCOUNT_REPOSITORY } from '../auth/domain/interfaces/account.repository';
import type { AccountRepository } from '../auth/domain/interfaces/account.repository';
import { HASH_SERVICE } from '../auth/domain/interfaces/hash.service';
import type { HashService } from '../auth/domain/interfaces/hash.service';
import { SESSION_REPOSITORY } from '../auth/domain/interfaces/session.repository';
import type { SessionRepository } from '../auth/domain/interfaces/session.repository';
import { EMAIL_SERVICE } from '../auth/domain/interfaces/email.service';
import type { EmailService } from '../auth/domain/interfaces/email.service';
import { CreateCmsUserUseCase } from '../auth/application/use-cases/create-cms-user.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetUserPasswordDto } from './dto/set-user-password.dto';
import { CanalTipoDto, CreateCanalDto } from './dto/create-canal.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CreatePlanDto, PlanEntitlementDto, PlanUserGroupDto, PlanVideoQualityDto } from './dto/create-plan.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
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
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
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



  private planes: OttPlan[] = [
    {
      id: 'plan-basic',
      nombre: 'Basic',
      descripcion: 'Acceso básico a TV en vivo y VOD esencial.',
      grupoUsuarios: PlanUserGroupDto.INDIVIDUAL,
      precio: 9.99,
      moneda: 'USD',
      duracionDias: 30,
      activo: true,
      maxDevices: 2,
      maxConcurrentStreams: 1,
      maxProfiles: 2,
      videoQuality: PlanVideoQualityDto.HD,
      allowDownloads: false,
      allowCasting: true,
      hasAds: true,
      trialDays: 0,
      gracePeriodDays: 2,
      entitlements: [PlanEntitlementDto.LIVE_TV, PlanEntitlementDto.VOD_BASIC],
      allowedComponentIds: ['comp-001', 'comp-003'],
      allowedCategoryIds: ['cat-001', 'cat-003'],
    },
    {
      id: 'plan-premium',
      nombre: 'Premium',
      descripcion: 'Experiencia premium con 4K, descargas y catálogo ampliado.',
      grupoUsuarios: PlanUserGroupDto.FAMILIAR,
      precio: 29.99,
      moneda: 'USD',
      duracionDias: 30,
      activo: true,
      maxDevices: 5,
      maxConcurrentStreams: 4,
      maxProfiles: 6,
      videoQuality: PlanVideoQualityDto.UHD_4K,
      allowDownloads: true,
      allowCasting: true,
      hasAds: false,
      trialDays: 7,
      gracePeriodDays: 5,
      entitlements: [
        PlanEntitlementDto.LIVE_TV,
        PlanEntitlementDto.VOD_BASIC,
        PlanEntitlementDto.VOD_PREMIUM,
        PlanEntitlementDto.SERIES,
        PlanEntitlementDto.KIDS,
        PlanEntitlementDto.SPORTS,
        PlanEntitlementDto.ULTRA_HD,
        PlanEntitlementDto.DOWNLOADS,
      ],
      allowedComponentIds: ['comp-001', 'comp-002', 'comp-003', 'comp-004', 'comp-007', 'comp-008'],
      allowedCategoryIds: ['cat-001', 'cat-002', 'cat-003', 'cat-004'],
    },
    {
      id: 'plan-family',
      nombre: 'Familiar',
      descripcion: 'Plan multiusuario con perfiles ampliados para el hogar.',
      grupoUsuarios: PlanUserGroupDto.FAMILIAR,
      precio: 19.99,
      moneda: 'USD',
      duracionDias: 30,
      activo: true,
      maxDevices: 8,
      maxConcurrentStreams: 3,
      maxProfiles: 7,
      videoQuality: PlanVideoQualityDto.FHD,
      allowDownloads: true,
      allowCasting: true,
      hasAds: false,
      trialDays: 3,
      gracePeriodDays: 3,
      entitlements: [
        PlanEntitlementDto.LIVE_TV,
        PlanEntitlementDto.VOD_BASIC,
        PlanEntitlementDto.VOD_PREMIUM,
        PlanEntitlementDto.SERIES,
        PlanEntitlementDto.KIDS,
      ],
      allowedComponentIds: ['comp-001', 'comp-003', 'comp-004', 'comp-007'],
      allowedCategoryIds: ['cat-003', 'cat-004'],
    },
    {
      id: 'plan-ott-basic',
      nombre: 'OTT Básico',
      descripcion: 'Acceso OTT standalone para clientes sin bundle ISP.',
      grupoUsuarios: PlanUserGroupDto.ISP_BUNDLE,
      precio: 0,
      moneda: 'USD',
      duracionDias: 30,
      activo: true,
      maxDevices: 3,
      maxConcurrentStreams: 1,
      maxProfiles: 3,
      videoQuality: PlanVideoQualityDto.HD,
      allowDownloads: false,
      allowCasting: true,
      hasAds: false,
      trialDays: 0,
      gracePeriodDays: 0,
      entitlements: [PlanEntitlementDto.LIVE_TV, PlanEntitlementDto.VOD_BASIC],
      allowedComponentIds: ['comp-001', 'comp-003'],
      allowedCategoryIds: ['cat-001', 'cat-003'],
    },
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

  async listUsers(): Promise<AdminUserRecord[]> {
    const allUsers = await this.getAllUsers();
    return Promise.all(allUsers.map((user) => this.mapUserRecord(user)));
  }

  async getUser(id: string): Promise<AdminUserRecord> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.mapUserRecord(user);
  }

  async createUser(dto: CreateUserDto): Promise<AdminUserRecord> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const role = dto.role ?? UserRole.CLIENTE;
    const status = dto.status ?? UserStatus.ACTIVE;

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

      const cmsUser = await this.userRepository.findById(created.id);
      if (!cmsUser) throw new NotFoundException('No se pudo recuperar el usuario creado.');
      cmsUser.status = status;
      await this.userRepository.save(cmsUser);
      return this.mapUserRecord(cmsUser);
    }

    const selectedPlan = this.resolvePlan(dto.planId ?? dto.plan);
    const contractNumber = this.buildContractNumber(dto.contrato);
    const contractOwner = await this.userRepository.findByContractNumber(contractNumber);
    if (contractOwner) {
      throw new ConflictException('Ese contrato ya está asociado a un usuario.');
    }

    const existingAccount = await this.accountRepository.findByContractNumber(contractNumber);
    if (existingAccount) {
      throw new ConflictException('Ese contrato ya está asociado a una cuenta.');
    }

    const names = this.extractNames(dto.nombre);
    const account = new Account({
      id: `acc-${uuidv4().slice(0, 8)}`,
      contractNumber,
      contractType: ContractType.OTT_ONLY,
      isIspCustomer: false,
      planId: selectedPlan.id,
      subscriptionStatus: status === UserStatus.SUSPENDED ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.ACTIVE,
      serviceStatus: status === UserStatus.SUSPENDED ? ServiceStatus.SUSPENDIDO : null,
      maxDevices: dto.maxDevices ?? selectedPlan.maxDevices ?? 3,
      sessionDurationDays: dto.sessionDurationDays ?? 30,
      sessionLimitPolicy: dto.sessionLimitPolicy ?? SessionLimitPolicy.BLOCK_NEW,
    });
    await this.accountRepository.save(account);

    const user = new User({
      id: `usr-${uuidv4().slice(0, 8)}`,
      contractNumber,
      email: normalizedEmail,
      phone: dto.telefono?.trim() || null,
      passwordHash: await this.hashService.hash(dto.password?.trim() || randomBytes(16).toString('hex')),
      role: UserRole.CLIENTE,
      status,
      accountId: account.id,
      createdAt: new Date(),
      firstName: names.firstName,
      lastName: names.lastName,
      mustChangePassword: false,
    });

    await this.userRepository.save(user);
    return this.mapUserRecord(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<AdminUserRecord> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (dto.email && dto.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.userRepository.findByEmail(dto.email.trim().toLowerCase());
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Ya existe un usuario con ese correo.');
      }
      (user as unknown as { email: string }).email = dto.email.trim().toLowerCase();
    }

    if (dto.telefono !== undefined) {
      (user as unknown as { phone: string | null }).phone = dto.telefono?.trim() || null;
    }

    if (dto.status) {
      user.status = dto.status;
    }

    if (user.isCmsUser()) {
      const names = this.extractNames(dto.nombre);
      user.firstName = dto.firstName?.trim() || names.firstName || user.firstName;
      user.lastName = dto.lastName?.trim() || names.lastName || user.lastName;

      if (dto.role && dto.role !== UserRole.CLIENTE) {
        user.role = dto.role;
      }

      await this.userRepository.save(user);
      return this.mapUserRecord(user);
    }

    const names = this.extractNames(dto.nombre);
    user.firstName = dto.firstName?.trim() || names.firstName || user.firstName;
    user.lastName = dto.lastName?.trim() || names.lastName || user.lastName;

    const currentAccount = user.accountId ? await this.accountRepository.findById(user.accountId) : null;
    const plan = this.resolvePlan(dto.planId ?? dto.plan ?? currentAccount?.planId ?? 'plan-ott-basic');
    const contractNumber = this.buildContractNumber(dto.contrato ?? user.contractNumber ?? undefined);

    if (contractNumber !== (user.contractNumber ?? '')) {
      const existingContractUser = await this.userRepository.findByContractNumber(contractNumber);
      if (existingContractUser && existingContractUser.id !== user.id) {
        throw new ConflictException('Ese contrato ya está asociado a otro usuario.');
      }
    }

    const account = new Account({
      id: currentAccount?.id ?? `acc-${uuidv4().slice(0, 8)}`,
      contractNumber,
      contractType: currentAccount?.contractType ?? ContractType.OTT_ONLY,
      isIspCustomer: currentAccount?.isIspCustomer ?? false,
      planId: plan.id,
      subscriptionStatus: user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.ACTIVE,
      serviceStatus: user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE ? ServiceStatus.SUSPENDIDO : currentAccount?.serviceStatus ?? null,
      maxDevices: dto.maxDevices ?? currentAccount?.maxDevices ?? plan.maxDevices ?? 3,
      sessionDurationDays: dto.sessionDurationDays ?? currentAccount?.sessionDurationDays ?? 30,
      sessionLimitPolicy: dto.sessionLimitPolicy ?? currentAccount?.sessionLimitPolicy ?? SessionLimitPolicy.BLOCK_NEW,
    });
    await this.accountRepository.save(account);

    (user as unknown as { contractNumber: string | null }).contractNumber = contractNumber;
    (user as unknown as { accountId: string | null }).accountId = account.id;
    await this.userRepository.save(user);
    return this.mapUserRecord(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<AdminUserRecord> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.status = status;
    await this.userRepository.save(user);

    if (user.accountId) {
      const account = await this.accountRepository.findById(user.accountId);
      if (account) {
        account.subscriptionStatus = status === UserStatus.SUSPENDED || status === UserStatus.INACTIVE ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.ACTIVE;
        account.serviceStatus = status === UserStatus.SUSPENDED || status === UserStatus.INACTIVE ? ServiceStatus.SUSPENDIDO : account.serviceStatus;
        await this.accountRepository.save(account);
      }
    }

    return this.mapUserRecord(user);
  }

  async setUserPassword(id: string, dto: SetUserPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const passwordHash = await this.hashService.hash(dto.newPassword);
    await this.userRepository.updatePassword(user.id, passwordHash);

    const refreshedUser = await this.userRepository.findById(id);
    if (refreshedUser) {
      refreshedUser.mustChangePassword = true;
      refreshedUser.failedAttempts = 0;
      refreshedUser.lockedUntil = null;
      await this.userRepository.save(refreshedUser);
    }

    if (dto.revokeSessions !== false) {
      await this.revokeAllSessionsInternal(user.id);
    }

    return { message: 'Contraseña actualizada y sesiones revocadas.' };
  }

  async generateAndSendPassword(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const password = this.generateSecurePassword();
    const passwordHash = await this.hashService.hash(password);
    await this.userRepository.updatePassword(user.id, passwordHash);

    const refreshedUser = await this.userRepository.findById(id);
    if (refreshedUser) {
      refreshedUser.mustChangePassword = true;
      refreshedUser.failedAttempts = 0;
      refreshedUser.lockedUntil = null;
      await this.userRepository.save(refreshedUser);
    }

    await this.revokeAllSessionsInternal(user.id);
    await this.emailService.sendGeneratedPassword(user.email, password, user.displayName());

    return { message: `Contraseña generada y enviada a ${user.email}` };
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
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const sessions = await this.sessionRepository.findByUserId(id);
    return sessions
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((session) => ({
        id: session.id,
        deviceId: session.deviceId,
        audience: session.audience,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        revokedAt: session.revokedAt?.toISOString() ?? null,
        status: session.revokedAt ? 'revoked' : session.isExpired() ? 'expired' : 'active',
      }));
  }

  async revokeUserSession(id: string, sessionId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.userId !== id) {
      throw new NotFoundException('La sesión indicada no existe para este usuario.');
    }

    session.revokedAt = new Date();
    await this.sessionRepository.save(session);
    return { message: 'Sesión revocada.' };
  }

  async revokeAllUserSessions(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.revokeAllSessionsInternal(id);
    return { message: 'Todas las sesiones fueron revocadas.' };
  }

  async getUserPlan(id: string): Promise<AdminUserPlanRecord> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const account = user.accountId ? await this.accountRepository.findById(user.accountId) : null;
    const plan = this.resolvePlan(account?.planId);
    return {
      id: plan.id,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      duracionDias: plan.duracionDias,
      maxDevices: plan.maxDevices || 3,
      maxConcurrentStreams: plan.maxConcurrentStreams,
      maxProfiles: plan.maxProfiles,
      videoQuality: plan.videoQuality,
      allowDownloads: plan.allowDownloads,
      allowCasting: plan.allowCasting,
      hasAds: plan.hasAds,
      trialDays: plan.trialDays,
      gracePeriodDays: plan.gracePeriodDays,
      entitlements: [...plan.entitlements],
      allowedComponentIds: [...plan.allowedComponentIds],
      allowedCategoryIds: [...plan.allowedCategoryIds],
    };
  }

  // ---- Monitor -------------------------------------------------------------

  async getMonitorStats() {
    const users = await this.getAllUsers();
    const active = users.filter((u) => u.status === UserStatus.ACTIVE);
    const withContract = users.filter((u) => u.contractNumber);

    return {
      totalUsuarios: users.length,
      usuariosActivos: active.length,
      sesionesActivas: Math.floor(Math.random() * 20) + 5,
      contratosActivos: withContract.length,
      ingresosMes: parseFloat((withContract.length * 19.99).toFixed(2)),
      cargaServidor: Math.floor(Math.random() * 40) + 20,
    };
  }

  // ---- Stub data for future modules ----------------------------------------

  getPlanes() {
    return this.planes.map((plan) => this.clonePlan(plan));
  }

  async createPlan(dto: CreatePlanDto) {
    await this.validatePlanReferences(dto.allowedComponentIds, dto.allowedCategoryIds ?? []);

    const baseId = this.slugifyPlanId(dto.nombre);
    const id = this.ensureUniquePlanId(baseId);

    const plan: OttPlan = {
      id,
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
      entitlements: [...dto.entitlements],
      allowedComponentIds: [...dto.allowedComponentIds],
      allowedCategoryIds: [...(dto.allowedCategoryIds ?? [])],
    };

    this.planes = [plan, ...this.planes];
    return this.clonePlan(plan);
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = this.planes.find((item) => item.id === id);
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);

    const nextComponentIds = dto.allowedComponentIds ?? plan.allowedComponentIds;
    const nextCategoryIds = dto.allowedCategoryIds ?? plan.allowedCategoryIds;
    await this.validatePlanReferences(nextComponentIds, nextCategoryIds);

    Object.assign(plan, {
      ...dto,
      moneda: dto.moneda ?? plan.moneda,
      entitlements: dto.entitlements ? [...dto.entitlements] : plan.entitlements,
      allowedComponentIds: [...nextComponentIds],
      allowedCategoryIds: [...nextCategoryIds],
    });

    return this.clonePlan(plan);
  }

  togglePlan(id: string) {
    const plan = this.planes.find((item) => item.id === id);
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    plan.activo = !plan.activo;
    return this.clonePlan(plan);
  }

  deletePlan(id: string): void {
    const exists = this.planes.some((item) => item.id === id);
    if (!exists) throw new NotFoundException(`Plan ${id} not found`);
    this.planes = this.planes.filter((item) => item.id !== id);
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

  private async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

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

  private async mapUserRecord(user: User): Promise<AdminUserRecord> {
    const now = new Date();
    const start = new Date(user.createdAt ?? now);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    const sessions = await this.sessionRepository.findByUserId(user.id);
    const activeSessions = sessions.filter((session) => !session.isExpired() && !session.isRevoked());
    const account = user.accountId ? await this.accountRepository.findById(user.accountId) : null;
    const plan = account ? this.planes.find((item) => item.id === account.planId) ?? null : null;

    return {
      id: user.id,
      nombre: user.isCmsUser() ? user.displayName() : user.displayName().toUpperCase(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      telefono: user.phone ?? null,
      plan: plan?.nombre ?? (user.isCmsUser() ? 'Usuario CMS' : 'OTT Básico'),
      planId: plan?.id ?? null,
      fechaInicio: start.toISOString().slice(0, 10),
      fechaFin: end.toISOString().slice(0, 10),
      sesiones: activeSessions.length,
      contrato: user.contractNumber ?? null,
      status: user.status,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      mfaEnabled: user.mfaEnabled,
      isLocked: user.isLocked(),
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      maxDevices: account?.maxDevices ?? plan?.maxDevices ?? 3,
      sessionDurationDays: account?.sessionDurationDays ?? (user.isCmsUser() ? 7 : 30),
      sessionLimitPolicy: account?.sessionLimitPolicy ?? SessionLimitPolicy.BLOCK_NEW,
      isCmsUser: user.isCmsUser(),
      isSubscriber: user.isClient(),
    };
  }

  private clonePlan(plan: OttPlan): OttPlan {
    return {
      ...plan,
      entitlements: [...plan.entitlements],
      allowedComponentIds: [...plan.allowedComponentIds],
      allowedCategoryIds: [...plan.allowedCategoryIds],
    };
  }

  private async validatePlanReferences(componentIds: string[], categoryIds: string[]): Promise<void> {
    const validComponentIds = new Set(this.componentes.map((item) => item.id));
    // Carga el caché si aún no está inicializado — evita falsos negativos al arrancar
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

  private slugifyPlanId(nombre: string): string {
    const normalized = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized.startsWith('plan-') ? normalized : `plan-${normalized}`;
  }

  private ensureUniquePlanId(baseId: string): string {
    if (!this.planes.some((plan) => plan.id === baseId)) return baseId;

    let suffix = 2;
    while (this.planes.some((plan) => plan.id === `${baseId}-${suffix}`)) {
      suffix += 1;
    }
    return `${baseId}-${suffix}`;
  }

  private resolvePlan(planIdOrName?: string | null): OttPlan {
    if (!planIdOrName) {
      return this.planes.find((plan) => plan.id === 'plan-ott-basic') ?? {
        id: 'plan-default',
        nombre: 'Base OTT',
        descripcion: 'Plan base temporal mientras se definen los planes finales.',
        grupoUsuarios: PlanUserGroupDto.INDIVIDUAL,
        precio: 0,
        moneda: 'USD',
        duracionDias: 30,
        activo: true,
        maxDevices: 3,
        maxConcurrentStreams: 1,
        maxProfiles: 1,
        videoQuality: PlanVideoQualityDto.HD,
        allowDownloads: false,
        allowCasting: true,
        hasAds: false,
        trialDays: 0,
        gracePeriodDays: 0,
        entitlements: [PlanEntitlementDto.LIVE_TV, PlanEntitlementDto.VOD_BASIC],
        allowedComponentIds: ['comp-001', 'comp-003'],
        allowedCategoryIds: ['cat-001', 'cat-003'],
      };
    }

    const normalized = planIdOrName.trim().toLowerCase();
    const found = this.planes.find((plan) => plan.id.toLowerCase() === normalized || plan.nombre.toLowerCase() === normalized);
    if (!found) {
      throw new BadRequestException(`Plan inválido: ${planIdOrName}`);
    }
    return found;
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

  private async revokeAllSessionsInternal(userId: string): Promise<void> {
    const sessions = await this.sessionRepository.findByUserId(userId);
    for (const session of sessions) {
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);
    }
  }
}
