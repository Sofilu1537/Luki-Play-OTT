import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/presentation/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/domain/interfaces/token.service';

const DEFAULT_PROFILE = '__default__';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get favorite channel IDs for a device+profile' })
  async getFavorites(
    @CurrentUser() user: JwtPayload,
    @Query('deviceId') deviceId: string,
    @Query('profileId') profileId?: string,
  ): Promise<string[]> {
    return this.favoritesService.getFavorites(
      user.sub,
      deviceId ?? '',
      profileId ?? DEFAULT_PROFILE,
    );
  }

  @Post(':channelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add a channel to favorites' })
  async addFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('channelId') channelId: string,
    @Body('deviceId') deviceId: string,
    @Body('profileId') profileId?: string,
  ): Promise<void> {
    await this.favoritesService.addFavorite(
      user.sub,
      channelId,
      deviceId ?? '',
      profileId ?? DEFAULT_PROFILE,
    );
  }

  @Delete(':channelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a channel from favorites' })
  async removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('channelId') channelId: string,
    @Query('deviceId') deviceId: string,
    @Query('profileId') profileId?: string,
  ): Promise<void> {
    await this.favoritesService.removeFavorite(
      user.sub,
      channelId,
      deviceId ?? '',
      profileId ?? DEFAULT_PROFILE,
    );
  }
}
