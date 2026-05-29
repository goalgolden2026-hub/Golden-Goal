export const WHITELISTED_WALLETS: string[] = [
  // Burhan Selection Wallet & Team Whitelist Addresses
  "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K", // User's wallet address
  "2FugfmqpT4GYQbopT1yGWQMLvoDUYwfLvLqS4dsLJtC3", // Whitelisted tester wallet
  "GX7Bt7UPrXdyEbTNekgeXVm4jBuWpGcuGGMgwQh3JUmL", // Second whitelisted tester wallet
  "HMsWAhRC9wom6JVBpuo2gjAGp7Sb59FEyMraLpC4YXGc", // New authorized admin wallet
  "5taHGRqDNFGRMGUZRCgdF5bGikwqZ7smxsH5YF5WPyc7", // Newly requested authorized admin wallet
  "62dBE6cVZmG728DkbZssDjrJm6Dn1as9Me2dMCh6HMPN", // Newly requested authorized admin wallet 2
  "BurhanSelectionWalletPlaceHolder1111111",
  "GoalGoldenAdminWalletPlaceHolder222222",
];

/**
 * Checks if a given wallet address is in the official private preview whitelist.
 * @param walletAddress - The Solana wallet address to check.
 * @returns True if whitelisted, false otherwise.
 */
export function isWalletWhitelisted(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return WHITELISTED_WALLETS.some(
    (addr) => addr.toLowerCase() === walletAddress.trim().toLowerCase()
  );
}
