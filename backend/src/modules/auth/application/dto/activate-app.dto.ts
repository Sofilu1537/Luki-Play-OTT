import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateAppDto {
  @ApiProperty({ description: 'Customer ID returned by first-access' })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    example: 'A1B2C3',
    description: 'Código de activación de 6 caracteres',
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    example: 'myNewPassword123',
    description: 'Nueva contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'juan@gmail.com',
    description: 'Email personal (opcional)',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
