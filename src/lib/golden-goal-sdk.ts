import { 
  Connection, 
  PublicKey, 
  TransactionInstruction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress 
} from '@solana/spl-token';

/**
 * Interface representing the on-chain lock state accounts
 * stored in the Solana ledger.
 */
export interface LockState {
  owner: PublicKey;
  tier: number;
  amount: bigint;
  unlockDate: bigint;
  isActive: boolean;
}

/**
 * Standard Solana Golden Goal Anchor Client SDK.
 * Handles Program-Derived Address (PDA) derivations, transactions building,
 * and ledger state query integrations for the decentralized predictive locking economy.
 */
export class GoldenGoalSDK {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey = new PublicKey("GoalG11111111111111111111111111111111111111")) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Derives the unique Program-Derived Address (PDA) for a user's lock state account.
   * PDA seeds: [b"lock-state", owner_pubkey]
   * 
   * @param owner The public key of the lock vault owner.
   * @returns The derived lock state PublicKey and its bump seed.
   */
  public getLockStateAddress(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("lock-state"), owner.toBuffer()],
      this.programId
    );
  }

  /**
   * Fetches and deserializes the lock state account from the Solana ledger.
   * 
   * @param owner The public key of the lock owner.
   * @returns The parsed LockState object or null if the account doesn't exist.
   */
  public async fetchLockState(owner: PublicKey): Promise<LockState | null> {
    const [lockStateAddress] = this.getLockStateAddress(owner);
    try {
      const accountInfo = await this.connection.getAccountInfo(lockStateAddress);
      if (!accountInfo) return null;

      // Anchor serializes with 8-byte discriminator followed by struct fields
      const data = accountInfo.data;
      if (data.length < 8 + 32 + 1 + 8 + 8 + 1) {
        throw new Error("Invalid lock state account data length.");
      }

      // Skip 8-byte Anchor discriminator
      let offset = 8;

      const ownerPubkey = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const tier = data.readUInt8(offset);
      offset += 1;

      // Read u64 little-endian amount
      const amount = data.readBigUInt64LE(offset);
      offset += 8;

      // Read i64 little-endian unlock date timestamp
      const unlockDate = data.readBigInt64LE(offset);
      offset += 8;

      const isActive = data.readUInt8(offset) !== 0;

      return {
        owner: ownerPubkey,
        tier,
        amount,
        unlockDate,
        isActive
      };
    } catch (e) {
      console.error("Failed to fetch lock state account:", e);
      return null;
    }
  }

  /**
   * Generates a TransactionInstruction to initialize a lock account and transfer 
   * utility tokens into the platform locking vault.
   * 
   * @param owner The public key of the lock initializer.
   * @param userTokenAccount The ATA holding the user's SPL tokens.
   * @param vaultTokenAccount The platform-owned SPL token vault account.
   * @param tier The locking tier selection (Tier 1-4).
   * @param amount The quantity of tokens to lock.
   * @param unlockDate The unix timestamp when lock matures.
   */
  public createLockInstruction(
    owner: PublicKey,
    userTokenAccount: PublicKey,
    vaultTokenAccount: PublicKey,
    tier: number,
    amount: number,
    unlockDate: number
  ): TransactionInstruction {
    const [lockStateAddress] = this.getLockStateAddress(owner);

    // Anchor Instruction Serialization
    // 8-byte discriminator for initialize_lock
    const discriminator = Buffer.from([224, 185, 237, 219, 137, 246, 219, 44]);
    
    const args = Buffer.alloc(1 + 8 + 8);
    args.writeUInt8(tier, 0);
    args.writeBigUInt64LE(BigInt(amount), 1);
    args.writeBigInt64LE(BigInt(unlockDate), 9);

    const data = Buffer.concat([discriminator, args]);

    return new TransactionInstruction({
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: lockStateAddress, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
      ],
      programId: this.programId,
      data
    });
  }

  /**
   * Generates a TransactionInstruction to unlock tokens.
   * Performs standard CPI calls on the Solana ledger, enforcing a 10% withdrawal penalty 
   * split (50% real burn, 50% community rewards treasury transfer) if early.
   */
  public createUnlockInstruction(
    owner: PublicKey,
    vaultMint: PublicKey,
    vaultTokenAccount: PublicKey,
    vaultAuthority: PublicKey,
    userTokenAccount: PublicKey,
    rewardTokenAccount: PublicKey
  ): TransactionInstruction {
    const [lockStateAddress] = this.getLockStateAddress(owner);

    // Anchor Instruction Serialization
    // 8-byte discriminator for unlock_tokens
    const discriminator = Buffer.from([105, 126, 218, 148, 199, 127, 218, 148]);

    return new TransactionInstruction({
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: lockStateAddress, isSigner: false, isWritable: true },
        { pubkey: vaultMint, isSigner: false, isWritable: true },
        { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
        { pubkey: vaultAuthority, isSigner: false, isWritable: false },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: rewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      programId: this.programId,
      data: discriminator
    });
  }
}
