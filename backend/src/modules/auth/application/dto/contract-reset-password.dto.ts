import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContractResetPasswordDto {
  @ApiProperty({ example: '000000003', description: 'Número de contrato' })
  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @ApiProperty({ example: '1720345678', description: 'Número de cédula' })
  @IsString()
  @IsNotEmpty()
  idNumber: string;

  @ApiProperty({ example: 'newPassword123', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
