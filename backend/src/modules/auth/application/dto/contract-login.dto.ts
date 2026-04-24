import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContractLoginDto {
  @ApiProperty({ example: '000000003', description: 'Número de contrato' })
  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'device-abc-123',
    description: 'ID único del dispositivo',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
