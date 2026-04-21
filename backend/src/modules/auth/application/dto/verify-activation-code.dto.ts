import { IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyActivationCodeDto {
  @ApiProperty({ description: 'ID del customer' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Código alfanumérico de 6 caracteres', example: 'A1B2C3' })
  @IsString()
  @Length(6, 6)
  code: string;
}
