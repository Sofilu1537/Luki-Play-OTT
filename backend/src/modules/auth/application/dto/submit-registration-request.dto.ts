import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitRegistrationRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() nombres: string;
  @ApiProperty() @IsString() @IsNotEmpty() apellidos: string;
  @ApiProperty() @IsString() @MinLength(10) idNumber: string;
  @ApiProperty() @IsString() @IsNotEmpty() telefono: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() direccion?: string;
}
