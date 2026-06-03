# Golden Goal Manifesto

*Version: 1.1.0*  
*Last Updated: May 22, 2026*  

This document is the primary reference explaining the architecture, economy, and feature set of the Golden Goal platform within the framework of legal compliance and skill-based prediction principles.

## 1. Core Mechanics & Economy

### 1.1 Experience Points (XP) and Token Structure
Platform's primary engagement and skill metric.
- **Acquisition:** Users start with a free initial quota. They earn XP (Experience Points) by completing social tasks, making accurate predictions, and inviting friends to the platform.
- **Usage:** Forecasting to test their skills, opening daily Rewards Boxes, and unlocking VIP privileges through the locking mechanism.

### 1.2 Prediction System
- **Markets:** Users can make predictions on standard sports analysis markets such as Match Result (Home, Draw, Away), Both Teams to Score (Yes/No), 2.5 Over/Under, and Double Chance.
- **Restrictions:** Predictions can be modified or cancelled up to 5 minutes before the start of the match. Prediction modifications cost 100 Golden Tokens, and prediction cancellations cost 200 Golden Tokens in transaction fees (half of these fees are burned, and the other half is routed to the reward pool).

## 2. Locking Tiers & Privileges

Users can lock their Golden Tokens for specific durations to advance to VIP analysis tiers and increase their daily prediction limits.
- **Tier 1 (Soft Lock):** 225 XP Rewards Box cost, +1 daily Extra Prediction Limit.
- **Tier 2 (7-Day Lock):** 200 XP Rewards Box cost, +3 daily Extra Prediction Limit.
- **Tier 3 (15-Day Lock):** 150 XP Rewards Box cost, +5 daily Extra Prediction Limit.
- **Tier 4 (1-Month Lock):** The first Rewards Box opening each day is COMPLETELY FREE, subsequent openings are 150 XP, +10 daily Extra Prediction Limit.

*Note: Users who do not perform any locking operation (Tier 0) have a standard daily limit of 5 predictions and pay 250 XP to open Rewards Boxes.*

## 3. Social Growth & Gamification

### 3.1 Rewards Box (Loyalty Module)
- A premium loyalty module that is entirely based on user retention and XP rewards, featuring neon/golden visual effects and confetti animations, free from luck/chance factors.
- Box opening costs decrease dynamically based on the user's locking tier.
- **Rewards:** Extra prediction limits or XP Points (+100, +250, +500, +1000 XP) directly added to the profile score, distributed based on mathematical probabilities.

### 3.2 Unlimited Social Tasks (Twitter Farming)
- Users can collect community points by making posts on X (Twitter) with the `#GoldenGoal` tag.
- **Reward:** 25 Social Points per valid share.
- **Security Constraints:** To prevent spam, a 60-second cooldown is enforced between submissions. URLs previously used globally are rejected by the system.

### 3.3 Leaderboards
- **Social Leaderboard:** Ranks users strictly based on Social Points earned from social posts and referrals.
- **Pro Forecasters Leaderboard:** Ranks users based on their prediction accuracy rates and scores.
  - Displays purely analytical data such as Total Predictions (TP), Winning Predictions (WP), and Win Rate (WR).
  - A personalized "Your Rank" card is displayed at the bottom of the page for logged-in users.

## 4. Technical Architecture & Deployment

### 4.1 Technology Stack
- **Frontend:** Next.js (App Router), Vanilla CSS, Solana Web3 Wallet Connection.
- **Backend:** Next.js Serverless API Routes.
- **Database:** Vercel Postgres SQL (`@vercel/postgres`).

### 4.2 Deployment & Integration Workflow
- **GitHub Repository:** [https://github.com/goalgolden2026-hub/Golden-Goal.git](https://github.com/goalgolden2026-hub/Golden-Goal.git)
- **Vercel Project:** Automatically linked to the GitHub `main` branch.
- **Live Address:** [https://golden-goal-five.vercel.app](https://golden-goal-five.vercel.app)

**Workflow Cycle:**
1. Code developments are performed locally in the `/scratch/golden-goal` directory.
2. Changes are sent to the GitHub `main` branch via Git (`git add .`, `git commit -m "..."`, `git push`).
3. Vercel instantly detects changes and triggers the automatic build and deployment pipeline.
4. Environment variables (e.g. `POSTGRES_URL`) are securely stored in the Vercel dashboard and mapped locally with the `.env.local` file.
