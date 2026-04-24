import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  externalRef?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
