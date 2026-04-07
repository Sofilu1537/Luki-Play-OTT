import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { TEMPORARY_CODE_REPOSITORY } from '../../domain/interfaces/temporary-code.repository';
import type { TemporaryCodeRepository } from '../../domain/interfaces/temporary-code.repository';
import { TemporaryCodeType } from '../../domain/entities/temporary-code.entity';

@Injectable()
export class ValidateCodeUseCase {
  constructor(
    @Inject(TEMPORARY_CODE_REPOSITORY) private readonly codeRepo: TemporaryCodeRepository,
  ) {}

  async execute(email: string, rawCode: string, type: TemporaryCodeType): Promise<{ valid: boolean; codeId: string }> {
    const codes = await this.codeRepo.findByEmailAndType(email.trim().toLowerCase(), type);
    const match = codes.find((c) => c.isValid() && c.matchesCode(rawCode));

    if (!match) {
      throw new BadRequestException('Código inválido, expirado o ya utilizado.');
    }

    return { valid: true, codeId: match.id };
  }
}
