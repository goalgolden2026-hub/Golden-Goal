export const WHITELISTED_WALLETS = [
  // Burhan Selection Wallet & Team Whitelist Addresses
  "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K", // User's wallet address
  "BurhanSelectionWalletPlaceHolder1111111",
  "GoalGoldenAdminWalletPlaceHolder222222",
];

/**
 * Checks if a given wallet address is in the official private preview whitelist.
 * @param {string} walletAddress - The Solana wallet address to check.
 * @returns {boolean} True if whitelisted, false otherwise.
 */
export function isWalletWhitelisted(walletAddress) {
  if (!walletAddress) return false;
  return WHITELISTED_WALLETS.some(
    (addr) => addr.toLowerCase() === walletAddress.trim().toLowerCase()
  );
}
