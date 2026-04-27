import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdNumberLoginDto {
  @ApiProperty({ example: '0503557068', description: 'Cédula de identidad' })
  @IsString()
  @IsNotEmpty()
  idNumber: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'device-abc-123', description: 'ID único del dispositivo' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
