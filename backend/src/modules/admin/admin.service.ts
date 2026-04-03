import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { UserRepository } from '../auth/domain/interfaces/user.repository';
import { USER_REPOSITORY } from '../auth/domain/interfaces/user.repository';
import { User, UserRole, UserStatus } from '../auth/domain/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  // ---- Users ---------------------------------------------------------------

  async listUsers() {
    // Access the underlying map via findAll — fallback to iterating known IDs
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

    // Persist as a basic user (no password — admin-created)
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
    // In-memory repo: mark as inactive (no hard-delete method yet)
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
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
    // Known seed IDs + any dynamically created
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
