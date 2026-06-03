"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ANCHOR_PROGRAM_SOURCE } from '../../components/smart_contracts/AnchorProgramSource';
import { ANCHOR_TEST_CASES } from '../../components/smart_contracts/AnchorTestCases';
import { AUDIT_METADATA, AUDIT_FINDINGS, THREAT_MATRIX } from '../../components/smart_contracts/audit_data';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [lockAmount, setLockAmount] = useState(500000);
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState('program');

  const sections = [
    { id: 'introduction', label: '1. Introduction' },
    { id: 'vision', label: '2. Vision & Core Philosophy' },
    { id: 'problem-solution', label: '3. Problem & Solution' },
    { id: 'features', label: '4. Platform Features' },
    { id: 'staking', label: '5. Locking System' },
    { id: 'spin-system', label: '6. Rewards Box Module' },
    { id: 'social-referral', label: '7. Social Hub & Engagement' },
    { id: 'tokenomics', label: '8. Tokenomics & Fair Launch' },
    { id: 'infrastructure', label: '9. AWS Infrastructure' },
    { id: 'roadmap', label: '10. Roadmap' },
    { id: 'disclaimer', label: '11. Disclaimer' },
    { id: 'verification', label: '12. On-Chain Verification & Security' }
  ];

  // Helper to determine locking rewards dynamically
  const getLockingTierInfo = (amount) => {
    if (amount >= 1000000) {
      return {
        tier: "Tier 4 (1-Month Locked)",
        predictions: "+10 Daily Predictions",
        xp: "1.25x XP Multiplier",
        rewardsBox: "1 Free Daily Rewards Box (then 25 XP)",
        period: "30 Days Lock",
        color: "from-amber-400 to-yellow-600",
        unlockPenalty: "10% Penalty (50% Burned, 50% to Rewards)"
      };
    } else if (amount >= 750000) {
      return {
        tier: "Tier 3 (15-Day Locked)",
        predictions: "+5 Daily Predictions",
        xp: "1.10x XP Multiplier",
        rewardsBox: "25 XP / Box (75% Off)",
        period: "15 Days Lock",
        color: "from-yellow-500 to-amber-500",
        unlockPenalty: "10% Penalty (50% Burned, 50% to Rewards)"
      };
    } else if (amount >= 500000) {
      return {
        tier: "Tier 2 (7-Day Locked)",
        predictions: "+3 Daily Predictions",
        xp: "1.0x XP Multiplier",
        rewardsBox: "50 XP / Box (50% Off)",
        period: "7 Days Lock",
        color: "from-zinc-300 to-zinc-500",
        unlockPenalty: "10% Penalty (50% Burned, 50% to Rewards)"
      };
    } else if (amount >= 350000) {
      return {
        tier: "Tier 1 (Soft Lock)",
        predictions: "+1 Daily Prediction",
        xp: "1.0x XP Multiplier",
        rewardsBox: "75 XP / Box (25% Off)",
        period: "1 Day Lock",
        color: "from-amber-700 to-yellow-900",
        unlockPenalty: "Flexible - Zero Penalty"
      };
    } else {
      return {
        tier: "Tier 0 (No Active Lock)",
        predictions: amount >= 250000 ? "3 Daily Predictions" : "0 Daily Predictions (Needs 250.000+ $GoldenGoal)",
        xp: "1.0x XP Multiplier",
        rewardsBox: "100 XP / Box Open",
        period: "No Lock",
        color: "from-zinc-700 to-zinc-800",
        unlockPenalty: "N/A"
      };
    }
  };

  const currentTier = getLockingTierInfo(lockAmount);

  return (
    <div className="flex-1 w-full bg-zinc-950 text-zinc-100 flex flex-col md:flex-row relative">
      
      {/* Subdomain Simulation Banner */}
      <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-600/20 to-black border-b border-amber-500/30 py-2.5 px-4 text-center text-xs font-semibold tracking-wider text-amber-300 flex items-center justify-center gap-2 select-none md:absolute md:top-0 md:left-0 md:right-0 md:z-40">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        PREVIEW SUBDOMAIN DEV SIMULATOR: <span className="font-mono text-zinc-100 bg-black/60 px-2 py-0.5 rounded border border-white/5">docs.goldengoalsol.com</span>
      </div>

      {/* Docs Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row md:pt-10 min-h-screen">
        
        {/* Left Side Sidebar - Floating Index */}
        <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-6 md:sticky md:top-24 md:h-[calc(100vh-8rem)] overflow-y-auto mt-2 md:mt-0">
          <div className="mb-6 hidden md:block select-none">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/logo.jpg" 
                alt="Golden Goal Logo" 
                className="w-12 h-12 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse"
              />
              <div>
                <h4 className="text-sm font-black text-white tracking-tight">Golden Goal</h4>
                <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Official Docs</p>
              </div>
            </div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Index Table</h4>
            <div className="h-0.5 w-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded"></div>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 text-amber-400 border-l-2 border-amber-500 pl-4 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 pl-3'
                }`}
                id={`sidebar-link-${section.id}`}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Right Side - Content */}
        <main className="flex-1 px-4 md:px-12 py-8 md:py-12 overflow-y-auto max-w-4xl space-y-16 scroll-smooth">
          
          {/* Header Banner */}
          <div className="border-b border-white/5 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                Whitepaper v1.1
              </span>
              <span className="text-zinc-500 text-xs">Updated: May 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Golden Goal</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
              Official whitepaper detailing the decentralized, gamified prediction economy, tiered locking utility matrix, provably fair mechanics, and AWS global cluster architecture.
            </p>
          </div>

          {/* 1. INTRODUCTION */}
          <section id="introduction" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">1.</span> Introduction
            </h2>
            <div className="p-0.5 rounded-3xl bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-[22px] space-y-4 text-zinc-300 leading-relaxed text-sm md:text-base">
                <p>
                  <strong>Golden Goal</strong> is a next-generation Web3 sports prediction ecosystem engineered to unite high-fidelity gamification, passive locking mechanics, and sports oracle pipelines.
                </p>
                <p>
                  By creating a <strong>sustainable prediction economy</strong>, users can place risk-free predictions on global fixtures (such as World Cup matches) completely free, claim Experience Points (XP) for success, and win high-yielding payouts from weekly token rewards.
                </p>
                <p>
                  Built directly on Solana, Golden Goal delivers sub-second transaction speeds, near-zero network fees, and elegant wallet adapters, establishing a new gold standard for decentralized web3 gaming.
                </p>
              </div>
            </div>
          </section>

          {/* 2. VISION */}
          <section id="vision" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">2.</span> Vision & Philosophy
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Golden Goal aims to construct the world’s largest and most engaging football prediction ecosystem. We believe that predictive gaming should not result in financial stress or negative experiences for casual players.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl">
                <span className="text-2xl">⚡</span>
                <h4 className="font-bold text-white mt-2 mb-1">Zero-Capital Forecasting</h4>
                <p className="text-zinc-400 text-sm">Users utilize locking limits or wallet hold quotas to predict. Core assets remain 100% untouched.</p>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl">
                <span className="text-2xl">🏆</span>
                <h4 className="font-bold text-white mt-2 mb-1">Skill-Based Merits</h4>
                <p className="text-zinc-400 text-sm">Weekly reward pools distribute tokens exclusively to the most accurate forecasters, not the luckiest.</p>
              </div>
            </div>
          </section>

          {/* 3. PROBLEM & SOLUTION */}
          <section id="problem-solution" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">3.</span> The Problem & Solution
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-2 border-red-500/50 pl-4 space-y-2">
                <h3 className="font-bold text-red-400 text-lg">The Industry Problems</h3>
                <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                  <li>High capital requirements and financial risk in traditional sports forecasting platforms.</li>
                  <li>Overly complex UX, confusing interfaces, and high entry barriers.</li>
                  <li>Absence of organic social interactions and community growth drivers.</li>
                  <li>Speculative tokens lacking active in-app utility sinks or burned deflation.</li>
                </ul>
              </div>

              <div className="border-l-2 border-emerald-500/50 pl-4 space-y-2">
                <h3 className="font-bold text-emerald-400 text-lg">The Golden Goal Solutions</h3>
                <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                  <li>Risk-free predictive matrix based entirely on holdings and loyalty locks.</li>
                  <li>Sleek, cinematic premium layout co-located on optimized servers.</li>
                  <li>Twitter Farming and gamified double leaderboards rewarding viral support.</li>
                  <li>Sustainable sinks built into prediction changes, spins, and lock breaches.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. PLATFORM FEATURES */}
          <section id="features" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">4.</span> Platform Features
            </h2>
            
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-200 text-lg">4.1 Double Leaderboards</h3>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Golden Goal operates two distinct dashboards to reward both analysts and marketers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl">
                  <h4 className="font-bold text-amber-400 mb-2">Pro Forecasters</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Ranks players based strictly on predictions. Tracks Won Predictions (WP), Total Predictions (TP), Win Rate (WR), and earned points.
                  </p>
                </div>
                <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl">
                  <h4 className="font-bold text-amber-400 mb-2">Social Leaderboard</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Ranks players based on Twitter marketing tasks, Social Points, and community outreach.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-bold text-zinc-200 text-lg">4.2 Weekly Payout Pool</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Each matchweek, the top 10 forecasters on our global leaderboard receive direct reward distributions in <strong>Golden Goal ($GoldenGoal) tokens</strong>. 
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The exact prize pool size and token distribution structures are dynamically scaled by the platform treasury in proportion to user volume, sponsorship partnerships, and active match cycle transactions. This gives the ecosystem full flexibility to amplify reward payouts during major sports tournaments like the World Cup. Current matchweek payout scales are displayed transparently inside the application dashboard.
              </p>
            </div>
          </section>

          {/* 5. LOCKING SYSTEM (WITH INTERACTIVE CALCULATOR) */}
          <section id="staking" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">5.</span> Locking System
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              Locking your $GoldenGoal tokens reduces circulating market supply while unlocking elite platform advantages. Use the interactive calculator below to explore your loyalty benefits in real-time.
            </p>

            {/* INTERACTIVE LOCKING CALCULATOR */}
            <div className="bg-zinc-900 border border-amber-500/20 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <h3 className="font-extrabold text-white text-lg mb-4 flex items-center gap-2">
                <span>⚙️</span> Locking Benefit Simulator
              </h3>

              <div className="space-y-4 mb-6">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Select Locking Amount: <span className="text-amber-400 font-mono text-base font-bold">{lockAmount.toLocaleString('en-US')} $GoldenGoal</span>
                </label>
                <input
                  id="lock-slider"
                  type="range"
                  min="0"
                  max="1500000"
                  step="50000"
                  value={lockAmount}
                  onChange={(e) => setLockAmount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>0 $GoldenGoal</span>
                  <span>350.000 $GoldenGoal</span>
                  <span>500.000 $GoldenGoal</span>
                  <span>750.000 $GoldenGoal</span>
                  <span>1.000.000 $GoldenGoal</span>
                  <span>1.500.000 $GoldenGoal</span>
                </div>
              </div>

              {/* Simulated Perks Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 border border-white/5 p-5 rounded-2xl">
                <div>
                  <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Unlocked Level</h4>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {currentTier.tier}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Required Lock</h4>
                  <div className="text-base font-bold text-zinc-200 font-mono">{currentTier.period}</div>
                </div>
                <div>
                  <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Daily Forecast limits</h4>
                  <div className="text-base font-bold text-emerald-400">{currentTier.predictions}</div>
                </div>
                <div>
                  <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">XP Points Multiplier</h4>
                  <div className="text-base font-bold text-blue-400 font-mono">{currentTier.xp}</div>
                </div>
                <div className="sm:col-span-2 border-t border-white/5 pt-3 mt-1">
                  <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Rewards Box Discount</h4>
                  <div className="text-sm font-bold text-yellow-400">{currentTier.rewardsBox}</div>
                </div>
                <div className="sm:col-span-2 border-t border-white/5 pt-3 mt-1">
                  <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Lock Breach Penalty</h4>
                  <div className="text-xs font-semibold text-red-400">{currentTier.unlockPenalty}</div>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-amber-500/30 pl-4 py-1 text-sm text-zinc-400">
              <strong>Locking Burn Protocol:</strong> When you unlock early before the required period, the 10% penalty fee is dynamically split: 50% is sent to a burn address to contract supply, and 50% is routed directly back to the active rewards contract.
            </div>
          </section>

          {/* 6. REWARDS BOX SYSTEM */}
          <section id="spin-system" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">6.</span> Rewards Box Module
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              The Rewards Box is a provably fair gamified chest system designed to reward active token holders. It awards gamified rewards including XP Points (to advance in the Leaderboard ranks) and extra daily prediction quotas.
            </p>

            <div className="overflow-hidden border border-white/5 rounded-2xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 border-b border-white/5">
                    <th className="p-4 font-semibold">User Locking Classification</th>
                    <th className="p-4 font-semibold text-right">Access Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-zinc-950/40 font-mono">
                  <tr><td className="p-4 text-zinc-400 font-sans">No Active Lock (Tier 0)</td><td className="p-4 text-right text-zinc-300 font-bold">100 XP</td></tr>
                  <tr><td className="p-4 text-zinc-400 font-sans">Soft Lockers (Tier 1)</td><td className="p-4 text-right text-zinc-300 font-bold">75 XP</td></tr>
                  <tr><td className="p-4 text-zinc-400 font-sans">7-Day Locked Lockers (Tier 2)</td><td className="p-4 text-right text-zinc-300 font-bold">50 XP</td></tr>
                  <tr><td className="p-4 text-zinc-400 font-sans">15-Day Locked Lockers (Tier 3)</td><td className="p-4 text-right text-zinc-300 font-bold">25 XP</td></tr>
                  <tr><td className="p-4 text-zinc-400 font-sans font-semibold">30-Day Locked Lockers (Tier 4)</td><td className="p-4 text-right text-emerald-400 font-bold">1 Free Daily Box (then 25 XP)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. SOCIAL HUB */}
          <section id="social-referral" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">7.</span> Social Growth & Engagement
            </h2>
            
            <div className="space-y-4">
              <h3 className="font-bold text-white text-lg">7.1 Twitter Farming</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Golden Goal incorporates an automated social engagement protocol. Users tweet support using the hashtag <code className="bg-zinc-900 border border-white/10 px-2 py-0.5 rounded text-amber-400">#GoldenGoal</code>, submit their tweet link, and earn <strong>25 Social Points</strong>.
              </p>
              <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl text-xs text-zinc-400 leading-relaxed">
                <strong>Anti-Sybil Verification:</strong> The platform logs URLs globally. Multiple entries of the exact same tweet link are detected and blocked. A 60-second execution cooldown is enforced per user profile.
              </div>
            </div>
          </section>

          {/* 8. TOKENOMICS & FAIR LAUNCH */}
          <section id="tokenomics" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">8.</span> Tokenomics & Fair Launch
            </h2>
            
            <div className="p-6 bg-zinc-900 border border-emerald-500/20 rounded-3xl space-y-4">
              <h3 className="text-emerald-400 font-extrabold text-lg flex items-center gap-2">
                <span>🛡️</span> Zero Pre-Sale Lock Policy (Fair Launch)
              </h3>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                To guarantee organic price growth and absolute transparency, <strong>Golden Goal has bypass-eliminated public presales</strong>. 
              </p>
              <div className="border-l-4 border-emerald-500 pl-4 py-1 text-sm text-zinc-400">
                Because there is no public presale, there are <strong>zero locked pre-sale tokens</strong> scheduled to be released or dumped onto the market. All tokens in active circulation represent organic forecasters, real lockers, and leaderboard winners.
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-zinc-200">Core Deflation Sinks:</h4>
              <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                <li>Locking early unlock penalty burns 50% of the penalty.</li>
                <li>Prediction changes and deletion burn or lock micro $GoldenGoal tokens.</li>
                <li>Rewards Box utilizes gamified XP Points to reward platform loyalty rather than inflating circulating token supply.</li>
              </ul>
            </div>
          </section>

          {/* 9. AWS INFRASTRUCTURE */}
          <section id="infrastructure" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">9.</span> AWS Infrastructure & Enterprise-Grade Security
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl space-y-2">
                <div className="text-2xl">🌐</div>
                <h4 className="font-bold text-white">Amazon Web Services</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Hosted on premium high-performance AWS server clusters to guarantee 99.99% operational uptime and ultra-low latency globally.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl space-y-2">
                <div className="text-2xl">🔒</div>
                <h4 className="font-bold text-white">Isolated VPC Shield</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Deployed inside an isolated Virtual Private Cloud (VPC) network with stateful security walls and strict role-based access to safeguard data.
                </p>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              This high-performance AWS database pipeline ensures instantaneous processing of user stats, fast prediction updates, and advanced server-level DDoS defense to safeguard the platform's assets.
            </p>
          </section>

          {/* 10. ROADMAP */}
          <section id="roadmap" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">10.</span> Roadmap
            </h2>

            <div className="space-y-6 relative border-l border-white/5 pl-6 ml-2">
              
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-emerald-500 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                </span>
                <h4 className="font-bold text-white">Phase 1: Foundation (Completed)</h4>
                <p className="text-zinc-400 text-xs mt-1">
                  Solana infrastructure, domain mapping (www.goldengoalsol.com), high-fidelity cinematic golden ball penalty shootout animations, and core database setup.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-amber-500 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                </span>
                <h4 className="font-bold text-amber-400">Phase 2: Core Rollout (Active)</h4>
                <p className="text-zinc-400 text-xs mt-1">
                  Weekly leaderboard payouts ($150 - $5), Twitter Farming automation, and direct wallet adapters.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-zinc-700 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-zinc-950"></span>
                </span>
                <h4 className="font-bold text-zinc-400">Phase 3: Football Predictor & Locking Engine</h4>
                <p className="text-zinc-400 text-xs mt-1">
                  Activation of the core Football Predictor analytics board for global football leagues, and launching the multi-tier lockup tiered locking engine.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-zinc-700 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-zinc-950"></span>
                </span>
                <h4 className="font-bold text-zinc-400">Phase 4: Reward Box & Social Tasks</h4>
                <p className="text-zinc-400 text-xs mt-1">
                  Unlocking the gamified Rewards Box module for daily XP & prediction quota claims, and launching the social hub task engagement modules.
                </p>
              </div>

            </div>
          </section>

          {/* 11. DISCLAIMER */}
          <section id="disclaimer" className="scroll-mt-24 space-y-4 border-t border-white/5 pt-8">
            <h2 className="text-xl font-bold text-zinc-400 flex items-center gap-2">
                    <span className="text-zinc-600">11.</span> Legal Disclaimers
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Golden Goal ($GoldenGoal) is an entertainment-based decentralized prediction ecosystem. Participation in predictions is risk-free and carries no direct asset cost. Locking cryptocurrency tokens carries systemic smart contract, blockchain network, and market volatility risks. The $GoldenGoal token functions purely as a utility token within the application and represents no equity, security share, or debt claim on the development project team.
            </p>
          </section>

          {/* 12. ON-CHAIN VERIFICATION & SECURITY */}
          <section id="verification" className="scroll-mt-24 space-y-6 border-t border-white/5 pt-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">12.</span> On-Chain Verification & Security
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Golden Goal guarantees complete transparency of its game mechanics and financial token economy layer. All smart contracts are open source, compiled, and deployed on the Solana blockchain.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5">
                <h4 className="font-bold text-amber-400 text-sm mb-2">Golden Goal Token Mint Address</h4>
                <code className="text-xs font-mono text-zinc-300 block bg-black/60 p-2.5 rounded border border-white/5 break-all select-all">
                  GGGoalp5m2FqyZUCeaMDjD35tSrKbu5R8KxXGcXGcXG
                </code>
                <p className="text-zinc-500 text-[10px] mt-2">The official SPL token contract governing circulating requirements and platform tiers.</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5">
                <h4 className="font-bold text-amber-400 text-sm mb-2">Golden Goal Locking Program ID</h4>
                <code className="text-xs font-mono text-zinc-300 block bg-black/60 p-2.5 rounded border border-white/5 break-all select-all">
                  GGVaultJNYRYZUCeaMDjD35tSrKbu5R8KxXGcXGcXG
                </code>
                <p className="text-zinc-500 text-[10px] mt-2">The Anchor-verified smart contract governing lock vaults, penalty burns, and release times.</p>
              </div>
            </div>

            {/* Smart Contract Source Code Inspector */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>⚽</span> Solana Smart Contract Inspector
                  </h4>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Explore the verified Anchor program Rust codebase and TypeScript tests.</p>
                </div>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="bg-amber-500 hover:bg-amber-600 transition-colors text-zinc-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                >
                  <span>{showCode ? "Hide Code Inspector" : "Open Code Inspector"}</span>
                  <span className="text-[10px]">{showCode ? "▲" : "▼"}</span>
                </button>
              </div>

              {showCode && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex border-b border-white/5 gap-2">
                    <button
                      onClick={() => setCodeTab('program')}
                      className={`px-3 py-2 text-xs font-bold transition-all border-b-2 ${
                        codeTab === 'program'
                          ? 'border-amber-500 text-amber-400'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      lib.rs (Rust Program)
                    </button>
                    <button
                      onClick={() => setCodeTab('tests')}
                      className={`px-3 py-2 text-xs font-bold transition-all border-b-2 ${
                        codeTab === 'tests'
                          ? 'border-amber-500 text-amber-400'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      golden-goal.ts (Anchor Tests)
                    </button>
                  </div>
                  <div className="bg-black/60 rounded-xl p-4 border border-white/5 max-h-[350px] overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap select-all scrollbar-thin">
                    {codeTab === 'program' ? ANCHOR_PROGRAM_SOURCE : ANCHOR_TEST_CASES}
                  </div>
                </div>
              )}
            </div>

            {/* Sec3 Security Audit Compliance Dashboard */}
            <div className="p-6 rounded-2xl bg-[#130b29]/40 border border-purple-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>🛡️</span> Sec3 Security Audit Compliance Dashboard
                </h4>
                <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                  {AUDIT_METADATA.status}
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {AUDIT_METADATA.summary}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-950/10 p-4 rounded-xl border border-purple-500/5">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Audit Ref</span>
                  <span className="text-xs font-bold text-zinc-300">{AUDIT_METADATA.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Security Score</span>
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">{AUDIT_METADATA.score}</span>
                </div>
              </div>

              {/* Interactive Audit Findings Matrix */}
              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-zinc-200 text-xs uppercase tracking-wider">Sec3 Audited Vulnerability Matrix:</h5>
                <div className="space-y-2.5">
                  {AUDIT_FINDINGS.map((finding) => (
                    <div key={finding.id} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-400">{finding.id}: {finding.description}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          finding.severity === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          finding.severity === "Medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {finding.severity} Severity
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[10px] leading-relaxed"><strong>Mitigation:</strong> {finding.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat Matrix Checks */}
              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-zinc-200 text-xs uppercase tracking-wider">Audit Threat Mitigation Verification:</h5>
                <div className="space-y-2.5">
                  {THREAT_MATRIX.map((threatInfo, idx) => (
                    <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5 hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-bold text-zinc-200">{threatInfo.threat}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase tracking-wider">
                          {threatInfo.status}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[10px] leading-relaxed">{threatInfo.verification}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
