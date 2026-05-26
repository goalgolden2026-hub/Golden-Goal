# Golden Goal Manifesto

*Version: 1.0.0*
*Last Updated: 18 May 2026*

This document serves as the master record of the Golden Goal platform's architecture, economy, and feature set.

## 1. Core Mechanics & Economy

### 1.1 Golden Token (GG)
The central currency of the platform.
- **Acquisition:** Users start with a base balance (or test balance for now). They earn tokens by winning bets, completing social tasks, and referring friends.
- **Usage:** Betting on matches, playing the Lucky Spin, staking for tier benefits.

### 1.2 Betting System
- **Markets:** Users can place predictions on Match Outcomes (Home Win, Away Win, Draw), BTTS (Both Teams to Score), Under/Over 2.5 Goals, and Correct Score.
- **Constraints:** Predictions cannot be changed within 5 minutes of the match start time. Modifying a prediction costs 10 tokens. Deleting a prediction costs 20 tokens.

## 2. Staking Tiers & Benefits

Users can lock their tokens to unlock VIP benefits.
- **Tier 1 (Soft Stake):** 750 Token Spin Cost, 1 Bonus Daily Bet
- **Tier 2 (7 Days):** 500 Token Spin Cost, 3 Bonus Daily Bets
- **Tier 3 (15 Days):** 250 Token Spin Cost, 5 Bonus Daily Bets
- **Tier 4 (30 Days):** 250 Token Spin Cost (after 1st free spin), 1 Free Spin Daily, 10 Bonus Daily Bets

*Note: Non-stakers (Tier 0) pay 1000 tokens per spin and must hold a minimum balance of 10,000 Golden Tokens to prevent whale-abuse.*

## 3. Social Growth & Gamification

### 3.1 Lucky Spin (Casino Module)
- A highly visual, premium slot/spin wheel with neon/gold aesthetics and confetti animations on win.
- Spin costs are dynamically adjusted based on the user's Staking Tier.
- **Rewards:** Randomly distributed between 50 and 5000 tokens based on predetermined probabilities.

### 3.2 Infinite Social Tasks (Twitter Farming)
- Users can repeatedly share Golden Goal on X (Twitter) using the `#GoldenGoal` hashtag to farm points.
- **Reward:** 25 Social Points per valid tweet.
- **Constraints:** 60-second cooldown between submissions. Duplicate URLs globally are rejected (Spam Protection).

### 3.3 Leaderboards
- **Social Leaderboard:** Ranks users based purely on their Social Points (Twitter activity).
- **Pro Forecasters Leaderboard:** Ranks users based on their prediction success.
  - Displays Total Points, Weekly Points, Total Bets (TB), Won Bets (WB), and Win Rate (WR).
  - Includes a personalized "Your Ranking" card at the bottom for logged-in users.

## 4. Technical Architecture & Deployment

### 4.1 Tech Stack
- **Frontend:** Next.js (App Router), TailwindCSS, Web3 Wallet Adapter (Solana).
- **Backend:** Next.js Serverless Route Handlers.
- **Database:** Vercel Postgres SQL (`@vercel/postgres`).

### 4.2 Deployment & Integration Workflow
- **GitHub Repository:** [https://github.com/goalgolden2026-hub/Golden-Goal.git](https://github.com/goalgolden2026-hub/Golden-Goal.git)
- **Vercel Project:** Auto-linked to the GitHub `main` branch. 
- **Live URL:** [https://golden-goal-five.vercel.app](https://golden-goal-five.vercel.app)

**How it works (Memory Refresh):**
1. We write and modify code locally in the `/scratch/golden-goal` directory.
2. We use standard Git commands (`git add .`, `git commit -m "..."`, `git push`) to push updates to the `main` branch on GitHub.
3. Vercel automatically detects the push to GitHub and triggers a build.
4. Sometimes, for immediate deployment without waiting for the automatic trigger, we run `npx --yes vercel --prod` directly from the CLI.
5. Environment variables (like `POSTGRES_URL`) are securely stored in Vercel's project settings and mapped locally in `.env.local`.
