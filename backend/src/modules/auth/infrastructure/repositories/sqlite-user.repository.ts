import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/interfaces/user.repository';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3');
type BetterSqliteDb = import('better-sqlite3').Database;

// ---------------------------------------------------------------------------
// Row type returned by SQLite
// ---------------------------------------------------------------------------
interface UserRow {
  id: string;
  contract_number: string | null;
  email: string;
  phone: string | null;
  password_hash: string;
  role: string;
  status: string;
  account_id: string | null;
  first_name: string | null;
  last_name: string | null;
  must_change_password: number;
  mfa_enabled: number;
  locked_until: string | null;
  failed_attempts: number;
  last_login_at: string | null;
  created_by: string | null;
  created_at: string;
}

@Injectable()
export class SqliteUserRepository implements UserRepository, OnModuleInit {
  private readonly logger = new Logger(SqliteUserRepository.name);
  private db!: BetterSqliteDb;

  // Path: backend/data/lukiplay.db   (created automatically)
  private readonly dbPath = path.join(process.cwd(), 'data', 'lukiplay.db');

  async onModuleInit(): Promise<void> {
    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.createSchema();
    await this.seedIfEmpty();
    this.logger.log(`SQLite user repository ready → ${this.dbPath}`);
  }

  // ---------------------------------------------------------------------------
  // Schema
  // ---------------------------------------------------------------------------
  private createSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id                  TEXT PRIMARY KEY,
        contract_number     TEXT UNIQUE,
        email               TEXT NOT NULL UNIQUE COLLATE NOCASE,
        phone               TEXT,
        password_hash       TEXT NOT NULL,
        role                TEXT NOT NULL DEFAULT 'cliente',
        status              TEXT NOT NULL DEFAULT 'active',
        account_id          TEXT,
        first_name          TEXT,
        last_name           TEXT,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        mfa_enabled         INTEGER NOT NULL DEFAULT 0,
        locked_until        TEXT,
        failed_attempts     INTEGER NOT NULL DEFAULT 0,
        last_login_at       TEXT,
        created_by          TEXT,
        created_at          TEXT NOT NULL
      );
    `);
  }

  // ---------------------------------------------------------------------------
  // Seed default users on first run
  // ---------------------------------------------------------------------------
  private async seedIfEmpty(): Promise<void> {
    const count = (this.db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
    if (count > 0) {
      this.logger.log(`SQLite: ${count} existing users loaded (no seed needed)`);
      return;
    }

    this.logger.log('SQLite: seeding default users…');
    const hash = await bcrypt.hash('password123', 12);

    const seeds: User[] = [
      new User({ id: 'usr-001',        contractNumber: 'CONTRACT-001',    email: 'juan@example.com',               phone: '+57300111222', passwordHash: hash, role: UserRole.CLIENTE,     status: UserStatus.ACTIVE, accountId: 'acc-001',     createdAt: new Date() }),
      new User({ id: 'usr-002',        contractNumber: 'CONTRACT-002',    email: 'maria@example.com',              phone: '+57300333444', passwordHash: hash, role: UserRole.CLIENTE,     status: UserStatus.ACTIVE, accountId: 'acc-002',     createdAt: new Date() }),
      new User({ id: 'usr-003',        contractNumber: 'CONTRACT-003',    email: 'carlos@example.com',             phone: '+57300555666', passwordHash: hash, role: UserRole.CLIENTE,     status: UserStatus.ACTIVE, accountId: 'acc-003',     createdAt: new Date() }),
      new User({ id: 'usr-004',        contractNumber: 'CONTRACT-004',    email: 'ana@example.com',                phone: '+57300777888', passwordHash: hash, role: UserRole.CLIENTE,     status: UserStatus.ACTIVE, accountId: 'acc-004',     createdAt: new Date() }),
      new User({ id: 'usr-ott-001',    contractNumber: 'OTT-000001',      email: 'pedro@example.com',              phone: '+57300999000', passwordHash: hash, role: UserRole.CLIENTE,     status: UserStatus.ACTIVE, accountId: 'acc-ott-001', createdAt: new Date() }),
      new User({ id: 'usr-005',        contractNumber: 'OTT-17775493165660', email: 'sofia.soria.chamba@gmail.com',phone: '+593999000111', firstName: 'Sofia', lastName: 'Soria', passwordHash: hash, role: UserRole.CLIENTE, status: UserStatus.ACTIVE, accountId: 'acc-005', createdAt: new Date() }),
      new User({ id: 'usr-admin-001',  contractNumber: null,              email: 'admin@lukiplay.com',             firstName: 'Admin',   lastName: 'Principal', passwordHash: hash, role: UserRole.SUPERADMIN, status: UserStatus.ACTIVE, accountId: null, createdAt: new Date() }),
      new User({ id: 'usr-soporte-001',contractNumber: null,              email: 'soporte@lukiplay.com',           firstName: 'Agente',  lastName: 'Soporte',   passwordHash: hash, role: UserRole.SOPORTE,    status: UserStatus.ACTIVE, accountId: null, createdAt: new Date() }),
    ];

    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO users
        (id, contract_number, email, phone, password_hash, role, status, account_id,
         first_name, last_name, must_change_password, mfa_enabled, created_at)
      VALUES
        (@id, @contract_number, @email, @phone, @password_hash, @role, @status, @account_id,
         @first_name, @last_name, @must_change_password, @mfa_enabled, @created_at)
    `);

    const insertMany = this.db.transaction((users: User[]) => {
      for (const u of users) insert.run(this.toRow(u));
    });

    insertMany(seeds);
    this.logger.log(`SQLite: seeded ${seeds.length} users`);
  }

  // ---------------------------------------------------------------------------
  // UserRepository interface
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? this.fromRow(row) : null;
  }

  async findByContractNumber(contractNumber: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE contract_number = ?').get(contractNumber) as UserRow | undefined;
    return row ? this.fromRow(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim().toLowerCase()) as UserRow | undefined;
    return row ? this.fromRow(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];
    return rows.map((r) => this.fromRow(r));
  }

  async save(user: User): Promise<User> {
    const row = this.toRow(user);
    this.db.prepare(`
      INSERT INTO users
        (id, contract_number, email, phone, password_hash, role, status, account_id,
         first_name, last_name, must_change_password, mfa_enabled, locked_until,
         failed_attempts, last_login_at, created_by, created_at)
      VALUES
        (@id, @contract_number, @email, @phone, @password_hash, @role, @status, @account_id,
         @first_name, @last_name, @must_change_password, @mfa_enabled, @locked_until,
         @failed_attempts, @last_login_at, @created_by, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        contract_number      = excluded.contract_number,
        email                = excluded.email,
        phone                = excluded.phone,
        password_hash        = excluded.password_hash,
        role                 = excluded.role,
        status               = excluded.status,
        account_id           = excluded.account_id,
        first_name           = excluded.first_name,
        last_name            = excluded.last_name,
        must_change_password = excluded.must_change_password,
        mfa_enabled          = excluded.mfa_enabled,
        locked_until         = excluded.locked_until,
        failed_attempts      = excluded.failed_attempts,
        last_login_at        = excluded.last_login_at
    `).run(row);
    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    this.db.prepare(
      'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?'
    ).run(passwordHash, userId);
  }

  // ---------------------------------------------------------------------------
  // Mapping helpers
  // ---------------------------------------------------------------------------
  private toRow(u: User): Record<string, unknown> {
    return {
      id:                   u.id,
      contract_number:      u.contractNumber,
      email:                u.email.toLowerCase(),
      phone:                u.phone,
      password_hash:        u.passwordHash,
      role:                 u.role,
      status:               u.status,
      account_id:           u.accountId,
      first_name:           u.firstName,
      last_name:            u.lastName,
      must_change_password: u.mustChangePassword ? 1 : 0,
      mfa_enabled:          u.mfaEnabled ? 1 : 0,
      locked_until:         u.lockedUntil?.toISOString() ?? null,
      failed_attempts:      u.failedAttempts,
      last_login_at:        u.lastLoginAt?.toISOString() ?? null,
      created_by:           u.createdBy,
      created_at:           u.createdAt.toISOString(),
    };
  }

  private fromRow(r: UserRow): User {
    return new User({
      id:                 r.id,
      contractNumber:     r.contract_number,
      email:              r.email,
      phone:              r.phone,
      passwordHash:       r.password_hash,
      role:               r.role as UserRole,
      status:             r.status as UserStatus,
      accountId:          r.account_id,
      createdAt:          new Date(r.created_at),
      firstName:          r.first_name,
      lastName:           r.last_name,
      mustChangePassword: r.must_change_password === 1,
      mfaEnabled:         r.mfa_enabled === 1,
      lockedUntil:        r.locked_until ? new Date(r.locked_until) : null,
      failedAttempts:     r.failed_attempts,
      lastLoginAt:        r.last_login_at ? new Date(r.last_login_at) : null,
      createdBy:          r.created_by,
    });
  }
}
