import { IsString, IsUUID, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestActivationCodeDto {
  @ApiProperty({ description: 'ID del customer (retornado por first-access)' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Email para enviar el código (opcional)' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
