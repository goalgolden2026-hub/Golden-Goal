// Mock Tier data matching src/app/page.js and src/app/rewards/locking/page.js
const getLockingTier = (amount) => {
  if (amount >= 5000) {
    return { tier: 4, predictions: 10, multiplier: 1.25, feeDiscount: 1.0 }; // 100% discount / Free box
  } else if (amount >= 1000) {
    return { tier: 3, predictions: 5, multiplier: 1.10, feeDiscount: 0.75 };
  } else if (amount >= 500) {
    return { tier: 2, predictions: 3, multiplier: 1.0, feeDiscount: 0.50 };
  } else if (amount >= 100) {
    return { tier: 1, predictions: 1, multiplier: 1.0, feeDiscount: 0.25 };
  }
  return { tier: 0, predictions: 0, multiplier: 1.0, feeDiscount: 0.0 };
};

const calculateEarlyUnlockPenalty = (amount, isEarly) => {
  if (!isEarly) return 0;
  const penalty = amount * 0.10; // 10% penalty
  const burnAmount = penalty * 0.50; // 50% burned
  const rewardPoolAmount = penalty * 0.50; // 50% to reward pool
  return { penalty, burnAmount, rewardPoolAmount };
};

describe('Multi-Tier Token Locking and Penalty Calculations', () => {
  test('should return correct Tier 4 details for locks >= 5,000 GG', () => {
    const res = getLockingTier(5000);
    expect(res.tier).toBe(4);
    expect(res.predictions).toBe(10);
    expect(res.multiplier).toBe(1.25);
    expect(res.feeDiscount).toBe(1.0);
  });

  test('should return correct Tier 3 details for locks >= 1,000 GG', () => {
    const res = getLockingTier(1500);
    expect(res.tier).toBe(3);
    expect(res.predictions).toBe(5);
    expect(res.multiplier).toBe(1.1);
  });

  test('should return Tier 0 for locks < 100 GG', () => {
    const res = getLockingTier(50);
    expect(res.tier).toBe(0);
    expect(res.predictions).toBe(0);
    expect(res.multiplier).toBe(1.0);
  });

  test('should calculate correct 10% early unlock penalty splits', () => {
    const lockAmount = 1000;
    const { penalty, burnAmount, rewardPoolAmount } = calculateEarlyUnlockPenalty(lockAmount, true);
    expect(penalty).toBe(100);       // 10% penalty
    expect(burnAmount).toBe(50);     // 50% of penalty burned
    expect(rewardPoolAmount).toBe(50); // 50% of penalty to reward pool
  });

  test('should return 0 penalty for mature locks', () => {
    const lockAmount = 1000;
    const penalty = calculateEarlyUnlockPenalty(lockAmount, false);
    expect(penalty).toBe(0);
  });
});
