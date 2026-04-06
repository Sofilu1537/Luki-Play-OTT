import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { UserRepository } from '../auth/domain/interfaces/user.repository';
import { USER_REPOSITORY } from '../auth/domain/interfaces/user.repository';
import type { HashService } from '../auth/domain/interfaces/hash.service';
import { HASH_SERVICE } from '../auth/domain/interfaces/hash.service';
import type { EmailService } from '../auth/domain/interfaces/email.service';
import { EMAIL_SERVICE } from '../auth/domain/interfaces/email.service';
import { User, UserRole, UserStatus } from '../auth/domain/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
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

@Injectable()
export class AdminService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
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

  async listUsers() {
    const allUsers = await this.getAllUsers();
    const now = new Date();

    return allUsers.map((user) => {
      const start = new Date(user.createdAt ?? now);
      const end = new Date(start);
      end.setDate(end.getDate() + 30);

      return {
        id: user.id,
        nombre: (user.email.split('@')[0]).toUpperCase().replace('.', ' '),
        email: user.email,
        telefono: user.phone ?? null,
        plan: user.role === UserRole.CLIENTE ? 'Full' : user.role,
        fechaInicio: start.toISOString().slice(0, 10),
        fechaFin: end.toISOString().slice(0, 10),
        sesiones: Math.floor(Math.random() * 4) + 1,
        contrato: user.contractNumber ?? null,
        status: user.status,
        role: user.role,
      };
    });
  }

  async createUser(dto: CreateUserDto) {
    const id = `usr-${uuidv4().slice(0, 8)}`;
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    const user = new User({
      id,
      contractNumber: dto.contrato ?? null,
      email: dto.email,
      phone: dto.telefono ?? null,
      passwordHash: '',
      role: UserRole.CLIENTE,
      status: UserStatus.ACTIVE,
      accountId: dto.contrato ? `acc-${uuidv4().slice(0, 8)}` : null,
      createdAt: now,
    });

    await this.userRepository.save(user);

    return {
      id,
      nombre: dto.nombre.toUpperCase(),
      email: dto.email,
      telefono: dto.telefono ?? null,
      plan: dto.plan ?? 'Full',
      fechaInicio: now.toISOString().slice(0, 10),
      fechaFin: end.toISOString().slice(0, 10),
      sesiones: 0,
      contrato: dto.contrato ?? null,
      status: UserStatus.ACTIVE,
      role: UserRole.CLIENTE,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  async generateAndSendPassword(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const password = this.generateSecurePassword();
    user.passwordHash = await this.hashService.hash(password);
    user.mustChangePassword = true;
    await this.userRepository.save(user);

    const displayName = user.displayName();
    await this.emailService.sendGeneratedPassword(user.email, password, displayName);

    return { message: `Contraseña generada y enviada a ${user.email}` };
  }

  /**
   * Generates a cryptographically secure password following OWASP guidelines:
   * - Minimum 16 characters
   * - Uppercase, lowercase, digits, and special characters
   * - Uses crypto.randomBytes for true randomness (not Math.random)
   */
  private generateSecurePassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%&*-_=+?';
    const all = upper + lower + digits + special;

    const pick = (charset: string): string => {
      const idx = randomBytes(1)[0] % charset.length;
      return charset[idx];
    };

    // Guarantee at least one char from each character class
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

    // Fill remaining positions up to 16 characters
    const remaining = Array.from({ length: 8 }, () => pick(all));

    // Fisher-Yates shuffle using crypto random bytes
    const combined = [...required, ...remaining];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = randomBytes(1)[0] % (i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
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
    return [
      { id: 'plan-001', nombre: 'Basic',   precio: 9.99,  moneda: 'USD', duracionDias: 30, descripcion: 'Acceso básico a contenido estándar',   activo: true },
      { id: 'plan-002', nombre: 'Full',    precio: 19.99, moneda: 'USD', duracionDias: 30, descripcion: 'Acceso completo a todo el catálogo',     activo: true },
      { id: 'plan-003', nombre: 'Premium', precio: 29.99, moneda: 'USD', duracionDias: 30, descripcion: 'Acceso Premium con 4K y descargas',      activo: true },
      { id: 'plan-004', nombre: 'ISP Bundle', precio: 0, moneda: 'USD', duracionDias: 30, descripcion: 'Incluido con plan de internet del ISP', activo: true },
    ];
  }

  getSliders() {
    return [
      { id: 'sl-001', titulo: 'Bienvenido a Luki Play', subtitulo: 'Tu entretenimiento sin límites', imagen: '', orden: 1, activo: true },
      { id: 'sl-002', titulo: 'Contenido 4K',          subtitulo: 'La mejor calidad de imagen',      imagen: '', orden: 2, activo: true },
      { id: 'sl-003', titulo: 'Deportes en Vivo',       subtitulo: 'No te pierdas ningún partido',   imagen: '', orden: 3, activo: false },
    ];
  }

  getCanales() {
    return [
      { id: 'ch-001', nombre: 'Noticias 24',  logo: '', streamUrl: 'https://stream.example.com/noticias24',  categoria: 'Noticias', activo: true },
      { id: 'ch-002', nombre: 'Deportes HD',  logo: '', streamUrl: 'https://stream.example.com/deportes',   categoria: 'Deportes', activo: true },
      { id: 'ch-003', nombre: 'Cine Clásico', logo: '', streamUrl: 'https://stream.example.com/cine',       categoria: 'Cine',     activo: true },
      { id: 'ch-004', nombre: 'Infantil TV',  logo: '', streamUrl: 'https://stream.example.com/infantil',   categoria: 'Infantil', activo: false },
      { id: 'ch-005', nombre: 'Música Live',  logo: '', streamUrl: 'https://stream.example.com/musica',     categoria: 'Música',   activo: true },
    ];
  }

  getCategorias() {
    return [
      { id: 'cat-001', nombre: 'Noticias',   descripcion: 'Canales de noticias', icono: 'newspaper-o', activo: true },
      { id: 'cat-002', nombre: 'Deportes',   descripcion: 'Fútbol y más',        icono: 'futbol-o',    activo: true },
      { id: 'cat-003', nombre: 'Cine',       descripcion: 'Películas y series',  icono: 'film',        activo: true },
      { id: 'cat-004', nombre: 'Infantil',   descripcion: 'Contenido para niños', icono: 'child',      activo: true },
      { id: 'cat-005', nombre: 'Música',     descripcion: 'Canales de música',   icono: 'music',       activo: true },
    ];
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
    const knownIds = [
      'usr-001', 'usr-002', 'usr-003', 'usr-004', 'usr-ott-001',
      'usr-admin-001', 'usr-soporte-001',
    ];

    const users: User[] = [];
    for (const id of knownIds) {
      const user = await this.userRepository.findById(id);
      if (user && user.status !== UserStatus.INACTIVE) users.push(user);
    }
    return users;
  }
}
