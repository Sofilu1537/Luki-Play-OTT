import {
  TemporaryCode,
  TemporaryCodeType,
} from '../entities/temporary-code.entity';

export const TEMPORARY_CODE_REPOSITORY = Symbol('TEMPORARY_CODE_REPOSITORY');

export interface TemporaryCodeRepository {
  save(code: TemporaryCode): Promise<void>;
  findByEmailAndType(
    email: string,
    type: TemporaryCodeType,
  ): Promise<TemporaryCode[]>;
  markUsed(id: string): Promise<void>;
  invalidateByEmailAndType(
    email: string,
    type: TemporaryCodeType,
  ): Promise<void>;
}
