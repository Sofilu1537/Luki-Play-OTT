import { IsNotEmpty, IsString, MinLength, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateAppDto {
  @ApiProperty({ description: 'Customer ID returned by first-access' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'myNewPassword123', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'juan@gmail.com', description: 'Email personal (opcional, para marketing)' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
