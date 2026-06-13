export const WHITELISTED_WALLETS: string[] = [
  // Burhan Selection Wallet & Team Whitelist Addresses
  "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K", // User's wallet address
];

const hardcodedAdmins = [
  "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K",
  "HMsWAhRC9wom6JVBpuo2gjAGp7Sb59FEyMraLpC4YXGc",
  "5HFHidgXqhe7o56QziENpfRDta1txJpHEU16cCoMWejh",
  "GPdbYKP8dkKfijatW9RpA4aSdYizK4g2aKyDe9JwZUSg"
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
  
  const adminWalletsString = process.env.ADMIN_WALLET || "";
  const authorizedWallets = adminWalletsString.split(',').map(w => w.trim()).filter(Boolean);
  
  const normalizedAddress = walletAddress.trim().toLowerCase();
  
  return (
    authorizedWallets.some(addr => addr.toLowerCase() === normalizedAddress) ||
    hardcodedAdmins.some(addr => addr.toLowerCase() === normalizedAddress) ||
    WHITELISTED_WALLETS.some(addr => addr.toLowerCase() === normalizedAddress)
  );
}

