/**
 * User profile within an account.
 *
 * Supports multiple profiles per account (e.g. family members),
 * optional Kids mode, and PIN-based parental controls.
 *
 * @remarks Placeholder entity — persistence and business logic pending.
 */
export class Profile {
  readonly id: string;
  readonly accountId: string;
  name: string;
  /** Whether this profile restricts content to kids-safe titles. */
  readonly isKids: boolean;
  /** Bcrypt hash of the PIN, or null if PIN protection is disabled. */
  pinHash: string | null;

  constructor(props: {
    id: string;
    accountId: string;
    name: string;
    isKids: boolean;
    pinHash: string | null;
  }) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.name = props.name;
    this.isKids = props.isKids;
    this.pinHash = props.pinHash;
  }
}
