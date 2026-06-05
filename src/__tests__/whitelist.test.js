import { isWalletWhitelisted, WHITELISTED_WALLETS } from '../lib/whitelist';

describe('Solana Private Preview Whitelist Tests', () => {
  test('should return true for whitelisted admin wallets', () => {
    const adminWallet = '2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K';
    expect(isWalletWhitelisted(adminWallet)).toBe(true);
  });

  test('should return true regardless of lower/uppercase or trailing whitespace', () => {
    const mixedCaseWallet = '  2if2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K  ';
    expect(isWalletWhitelisted(mixedCaseWallet)).toBe(true);
  });

  test('should return false for empty, null, or undefined inputs', () => {
    expect(isWalletWhitelisted(null)).toBe(false);
    expect(isWalletWhitelisted(undefined)).toBe(false);
    expect(isWalletWhitelisted('')).toBe(false);
  });

  test('should return false for non-whitelisted standard wallets', () => {
    const standardWallet = 'SolanaWalletAddress1111111111111111111111111';
    expect(isWalletWhitelisted(standardWallet)).toBe(false);
  });

  test('whitelist array should contain the core admin preview wallets', () => {
    expect(WHITELISTED_WALLETS).toContain('2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K');
  });
});
