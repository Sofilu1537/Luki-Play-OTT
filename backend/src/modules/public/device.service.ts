import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceType } from '@prisma/client';

export interface DeviceInfo {
  deviceFingerprint: string;
  nombre?: string;
  tipo?: DeviceType;
  os?: string;
  browser?: string;
  modelo?: string;
  ipAddress?: string;
  contractId?: string;
}

export interface DeviceListItem {
  id: string;
  deviceFingerprint: string;
  nombre: string | null;
  tipo: DeviceType;
  os: string | null;
  browser: string | null;
  modelo: string | null;
  ipAddress: string | null;
  lastSeenAt: Date | null;
  registeredAt: Date;
  isCurrentDevice: boolean;
}

export interface DevicesResponse {
  devices: DeviceListItem[];
  count: number;
  limit: number;
}

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertDevice(customerId: string, info: DeviceInfo): Promise<void> {
    await this.prisma.device.upsert({
      where: {
        customerId_deviceFingerprint: {
          customerId,
          deviceFingerprint: info.deviceFingerprint,
        },
      },
      create: {
        customerId,
        contractId: info.contractId ?? null,
        deviceFingerprint: info.deviceFingerprint,
        nombre: info.nombre ?? null,
        tipo: info.tipo ?? DeviceType.UNKNOWN,
        os: info.os ?? null,
        browser: info.browser ?? null,
        modelo: info.modelo ?? null,
        ipAddress: info.ipAddress ?? null,
        lastSeenAt: new Date(),
        isActive: true,
      },
      update: {
        ...(info.contractId ? { contractId: info.contractId } : {}),
        ...(info.tipo ? { tipo: info.tipo } : {}),
        ...(info.os !== undefined ? { os: info.os } : {}),
        ...(info.browser !== undefined ? { browser: info.browser } : {}),
        ...(info.modelo !== undefined ? { modelo: info.modelo } : {}),
        ...(info.ipAddress ? { ipAddress: info.ipAddress } : {}),
        lastSeenAt: new Date(),
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async getDevices(customerId: string, currentDeviceFingerprint?: string): Promise<DevicesResponse> {
    const [devices, limit] = await Promise.all([
      this.prisma.device.findMany({
        where: { customerId, deletedAt: null, isActive: true },
        orderBy: { lastSeenAt: 'desc' },
      }),
      this.resolveDeviceLimit(customerId),
    ]);

    return {
      devices: devices.map((d) => ({
        id: d.id,
        deviceFingerprint: d.deviceFingerprint,
        nombre: d.nombre,
        tipo: d.tipo,
        os: d.os,
        browser: d.browser,
        modelo: d.modelo,
        ipAddress: d.ipAddress,
        lastSeenAt: d.lastSeenAt,
        registeredAt: d.registeredAt,
        isCurrentDevice: d.deviceFingerprint === currentDeviceFingerprint,
      })),
      count: devices.length,
      limit,
    };
  }

  async renameDevice(customerId: string, deviceFingerprint: string, nombre: string): Promise<void> {
    const result = await this.prisma.device.updateMany({
      where: { customerId, deviceFingerprint, deletedAt: null },
      data: { nombre },
    });
    if (result.count === 0) throw new NotFoundException('Dispositivo no encontrado');
  }

  async removeDevice(customerId: string, deviceFingerprint: string, currentDeviceFingerprint?: string): Promise<void> {
    if (deviceFingerprint === currentDeviceFingerprint) {
      throw new ForbiddenException('No puedes eliminar el dispositivo actual desde esta pantalla. Cierra sesión primero.');
    }

    const device = await this.prisma.device.findFirst({
      where: { customerId, deviceFingerprint, deletedAt: null },
    });
    if (!device) throw new NotFoundException('Dispositivo no encontrado');

    // Soft-delete device + revoke its active sessions
    await this.prisma.$transaction([
      this.prisma.device.updateMany({
        where: { customerId, deviceFingerprint },
        data: { deletedAt: new Date(), isActive: false },
      }),
      this.prisma.session.updateMany({
        where: { customerId, deviceId: deviceFingerprint, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async resolveDeviceLimit(customerId: string): Promise<number> {
    // 1. Contract-level override
    const contract = await this.prisma.contract.findFirst({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (contract?.maxDevices) return contract.maxDevices;

    // 2. Subscription plan snapshot
    const subscription = await this.prisma.subscription.findFirst({
      where: { customerId, status: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
      orderBy: { startDate: 'desc' },
    });
    if (subscription?.planSnapshot) {
      const snap = subscription.planSnapshot as any;
      if (snap?.maxDevices) return snap.maxDevices;
    }

    return 3; // default
  }
}
