export const HASH_SERVICE = Symbol('HASH_SERVICE');

/**
 * Port for password hashing and comparison.
 *
 * Implementation: {@link BcryptHashService}.
 */
export interface HashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}