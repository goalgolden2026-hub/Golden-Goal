// Mock weights based on /api/reward-box weighted odds
const PRIZES = [
  { label: 'Miss', weight: 40 },         // 40% chance
  { label: '+1 Prediction', weight: 20 }, // 20% chance
  { label: '+3 Predictions', weight: 15 },// 15% chance
  { label: '+5 Predictions', weight: 5 }, // 5% chance
  { label: '+100 XP Points', weight: 12 }, // 12% chance
  { label: '+250 XP Points', weight: 5 },  // 5% chance
  { label: '+500 XP Points', weight: 2 },  // 2% chance
  { label: '+1000 XP Points', weight: 1 }  // 1% chance
];

const drawReward = (randomNumber) => {
  let cumulativeWeight = 0;
  for (const prize of PRIZES) {
    cumulativeWeight += prize.weight;
    if (randomNumber <= cumulativeWeight) {
      return prize;
    }
  }
  return PRIZES[0];
};

describe('Rewards Box Randomization and Odds Verification', () => {
  test('should return Miss when random number is in first 40%', () => {
    const draw1 = drawReward(10);
    const draw2 = drawReward(40);
    expect(draw1.label).toBe('Miss');
    expect(draw2.label).toBe('Miss');
  });

  test('should return +1 Prediction when random number is in 41-60% range', () => {
    const draw = drawReward(50);
    expect(draw.label).toBe('+1 Prediction');
  });

  test('should return legendary +1000 XP Points when random number hits exactly 100', () => {
    const draw = drawReward(100);
    expect(draw.label).toBe('+1000 XP Points');
  });

  test('odds cumulative total weight should be exactly 100%', () => {
    const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    expect(totalWeight).toBe(100);
  });
});
