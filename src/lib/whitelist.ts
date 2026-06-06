export const WHITELISTED_WALLETS: string[] = [
  // Burhan Selection Wallet & Team Whitelist Addresses
  "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K", // User's wallet address
];

/**
 * Checks if a given wallet address is in the official private preview whitelist.
 * @param walletAddress - The Solana wallet address to check.
 * @returns True if whitelisted, false otherwise.
 */
export function isWalletWhitelisted(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  // Whitelist is deactivated: any connected Solana wallet is allowed to access the platform.
  return true;
}

/**
 * Checks if a given wallet address belongs to the admin/team whitelist (gets limit overrides).
 */
export function isAdminWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return WHITELISTED_WALLETS.some(
    (addr) => addr.toLowerCase() === walletAddress.trim().toLowerCase()
  );
}
