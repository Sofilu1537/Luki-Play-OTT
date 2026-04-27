import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFavorites(
    customerId: string,
    deviceId: string,
    profileId: string,
  ): Promise<string[]> {
    const rows = await this.prisma.channelFavorite.findMany({
      where: { customerId, deviceId, profileId },
      select: { channelId: true },
    });
    return rows.map((r) => r.channelId);
  }

  async addFavorite(
    customerId: string,
    channelId: string,
    deviceId: string,
    profileId: string,
  ): Promise<void> {
    await this.prisma.channelFavorite.upsert({
      where: {
        customerId_channelId_deviceId_profileId: {
          customerId,
          channelId,
          deviceId,
          profileId,
        },
      },
      create: { customerId, channelId, deviceId, profileId },
      update: {},
    });
  }

  async removeFavorite(
    customerId: string,
    channelId: string,
    deviceId: string,
    profileId: string,
  ): Promise<void> {
    await this.prisma.channelFavorite.deleteMany({
      where: { customerId, channelId, deviceId, profileId },
    });
  }
}
