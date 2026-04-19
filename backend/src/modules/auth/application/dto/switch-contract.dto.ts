import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchContractDto {
  @ApiProperty({ description: 'ID del contrato al que cambiar' })
  @IsString()
  @IsNotEmpty()
  contractId: string;
}
