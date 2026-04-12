import { IsNotEmpty, IsString, MinLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAppDto {
  @ApiProperty({
    example: 'juan@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'CONTRACT-001',
    description: 'Contract number (optional, legacy)',
    required: false,
  })
  @IsString()
  @IsOptional()
  contractNumber?: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'device-abc-123',
    description: 'Unique device identifier',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}