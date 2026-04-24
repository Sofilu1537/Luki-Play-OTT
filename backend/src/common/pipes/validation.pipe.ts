import { ValidationPipe } from '@nestjs/common';

/**
 * Global validation pipe applied to all incoming requests.
 *
 * Configuration:
 * - `whitelist` — strips unknown properties from DTOs
 * - `forbidNonWhitelisted` — throws if unknown properties are present
 * - `transform` — auto-transforms payloads into DTO class instances
 * - `enableImplicitConversion` — converts primitive types based on TS metadata
 */
export const globalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
