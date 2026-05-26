"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { isWalletWhitelisted } from '@/lib/whitelist';

export default function LandingPage() {
  const [activeTier, setActiveTier] = useState(4); // Default to Tier 4
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const walletAddress = publicKey ? publicKey.toBase58() : null;
  const isWhitelisted = isWalletWhitelisted(walletAddress);

  const stakingTiers = [
    {
      level: "Tier 0 (Holder)",
      requirement: "Min 10,000 GG (Circulating)",
      predictions: "Base Daily Limit",
      xp: "1.0x XP",
      spin: "1,000 GG per Spin",
      perk: "Hold tokens in your Solana wallet to unlock basic prediction privileges.",
      color: "from-zinc-500 to-zinc-700",
      glow: "rgba(113, 113, 122, 0.15)"
    },
    {
      level: "Tier 1 (Soft)",
      requirement: "Min 100 GG Staked",
      predictions: "+1 Prediction / Day",
      xp: "1.0x XP",
      spin: "750 GG per Spin (25% Off)",
      perk: "Low-barrier lock with 1-day lockup. Perfect for casual forecasters.",
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(16, 185, 129, 0.15)"
    },
    {
      level: "Tier 2 (7-Day)",
      requirement: "Min 500 GG Staked",
      predictions: "+3 Predictions / Day",
      xp: "1.0x XP",
      spin: "500 GG per Spin (50% Off)",
      perk: "7-day lockup. Unlocks a 50% discount on the Lucky Spin wheel.",
      color: "from-blue-500 to-indigo-600",
      glow: "rgba(59, 130, 246, 0.15)"
    },
    {
      level: "Tier 3 (15-Day)",
      requirement: "Min 1,000 GG Staked",
      predictions: "+5 Predictions / Day",
      xp: "1.1x XP Booster",
      spin: "250 GG per Spin (75% Off)",
      perk: "15-day lockup. Unlocks a 1.1x XP scaling multiplier for leaderboard domination.",
      color: "from-purple-500 to-violet-600",
      glow: "rgba(139, 92, 246, 0.15)"
    },
    {
      level: "Tier 4 (30-Day)",
      requirement: "Min 5,000 GG Staked",
      predictions: "+10 Predictions / Day",
      xp: "1.25x XP Booster",
      spin: "1 Free Daily Spin!",
      perk: "30-day lockup. Premium VIP benefits including a free daily spin and maximum XP gains.",
      color: "from-yellow-400 via-amber-500 to-orange-500",
      glow: "rgba(245, 158, 11, 0.25)"
    }
  ];

  return (
    <div className="flex-1 w-full bg-zinc-950 text-zinc-100 flex flex-col items-center relative overflow-hidden">
      
      {/* Background glowing orb */}
      <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[70%] h-[400px] rounded-full bg-gradient-to-tr from-amber-500/10 via-yellow-600/5 to-transparent blur-[130px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-6xl mx-auto px-4 py-12 sm:py-24 flex flex-col items-center relative z-10">
        
        {/* HERO SECTION */}
        <section className="text-center w-full max-w-4xl mx-auto mb-20 mt-4 select-none">
          <div className="inline-flex items-center gap-2 text-xs tracking-widest text-amber-400/80 font-bold bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 mb-8 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            SOLANA COMPETITIVE FOOTBALL PREDICTIONS
          </div>

          <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight leading-none text-white">
            Football Prediction <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
              Competition Platform
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
            The next-generation competitive sports forecasting ecosystem on Solana. Hold or stake <span className="text-amber-400 font-semibold">$GG</span> to forecast matches, spin the provably fair Lucky Wheel, and dominate dual ladders with <span className="text-white font-semibold">zero capital loss.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-lg mx-auto">
            {connected ? (
              isWhitelisted ? (
                <Link 
                  href="/markets" 
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black py-4 px-10 rounded-2xl text-base transition-all hover:scale-105 shadow-[0_0_35px_rgba(245,158,11,0.3)] text-center uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Launch Platform 🚀
                </Link>
              ) : (
                <button 
                  disabled
                  className="w-full sm:w-auto bg-zinc-900/80 border border-red-500/30 text-red-500/90 font-black py-4 px-10 rounded-2xl text-base cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.05)] uppercase tracking-wider"
                  title="Coming Soon - This wallet address is not authorized for the closed beta testing phase."
                >
                  <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Coming Soon</span>
                </button>
              )
            ) : (
              <button 
                onClick={() => setVisible(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-500/10 to-amber-600/10 hover:from-yellow-500/20 hover:to-amber-600/20 text-yellow-400 hover:text-yellow-300 font-black py-4 px-10 rounded-2xl text-base border border-yellow-500/30 transition-all hover:scale-105 shadow-[0_0_25px_rgba(245,158,11,0.1)] flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                Launch Platform
              </button>
            )}
            <Link 
              href="/docs" 
              className="w-full sm:w-auto bg-zinc-900/80 border border-white/10 hover:bg-zinc-800 text-white font-bold py-4 px-8 rounded-2xl text-base transition-all hover:scale-105 flex items-center justify-center gap-2 hover:border-white/20"
            >
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Whitepaper
            </Link>
            <Link 
              href="/pitchdeck" 
              className="w-full sm:w-auto bg-zinc-900/80 border border-white/10 hover:bg-zinc-800 text-white font-bold py-4 px-8 rounded-2xl text-base transition-all hover:scale-105 flex items-center justify-center gap-2 hover:border-white/20"
            >
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Pitch Deck
            </Link>
          </div>
          {!isWhitelisted && connected && (
            <p className="mt-4 text-red-500/80 text-xs font-semibold uppercase tracking-widest animate-pulse font-mono flex items-center gap-1.5 justify-center">
              <span>🔒 Coming Soon - Access Restricted to Whitelisted Testers</span>
            </p>
          )}

          <p className="mt-8 text-[11px] uppercase tracking-widest font-mono text-zinc-500 max-w-xl mx-auto select-none leading-relaxed">
            ⚠️ NO PURCHASE NECESSARY. Void where prohibited by law. Standard daily prediction quotas are allocated for free. Competitions are decided strictly based on sports analytical skill and forecasting accuracy, not chance.
          </p>
        </section>

        {/* ECOSYSTEM STATS RIBBON */}
        <div className="w-full max-w-5xl bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-28 grid grid-cols-2 md:grid-cols-4 gap-6 text-center select-none">
          <div className="space-y-1">
            <div className="text-3xl font-black text-white font-mono">0%</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Capital Loss Risk</div>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <div className="text-3xl font-black text-amber-400 font-mono">Tier 0-4</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">VIP Staking Programs</div>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <div className="text-3xl font-black text-white font-mono">Provably Fair</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Lucky Spin Engine</div>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <div className="text-3xl font-black text-amber-400 font-mono">10%</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Unstake Burn Penalty</div>
          </div>
        </div>
30: 
31:         {/* SKILL-BASED SYSTEM SHOWCASE */}
32:         <section className="w-full max-w-5xl mb-32 select-none">
33:           <div className="relative rounded-[32px] overflow-hidden border border-yellow-500/20 bg-gradient-to-b from-[#161026]/90 to-[#0e0a1b]/90 p-8 sm:p-12 shadow-[0_0_50px_rgba(245,158,11,0.05)] backdrop-blur-xl">
34:             {/* Background vector glow */}
35:             <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
36:             <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
37: 
38:             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
39:               <div className="lg:col-span-5 space-y-6 col-span-1">
40:                 <div className="inline-flex items-center gap-1.5 text-[10px] tracking-widest text-yellow-400 font-black uppercase bg-yellow-400/10 px-3.5 py-1.5 rounded-full border border-yellow-400/20">
41:                   ⚡ SKILL OVER CHANCE
42:                 </div>
43:                 <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
44:                   A Purely <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">Skill-Based</span> Prediction Ecosystem
45:                 </h2>
46:                 <p className="text-zinc-400 text-sm leading-relaxed font-medium">
47:                   Golden Goal completely redefines sports forecasts. Our platform has <span className="text-white font-bold">no elements of chance or gambling</span>. It is a competitive sports analytics simulator where success is determined entirely by analytical skill, strategic asset allocation, and leaderboard performance.
48:                 </p>
49:                 <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500 font-mono">
50:                   <span>❌ NO ROULETTE</span>
51:                   <span>•</span>
52:                   <span>❌ NO HOUSE EDGE</span>
53:                   <span>•</span>
54:                   <span>❌ NO CAPITAL RISK</span>
55:                 </div>
56:               </div>
57: 
58:               <div className="lg:col-span-7 col-span-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
59:                 {/* Pillar 1 */}
60:                 <div className="bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 p-6 rounded-2xl transition-all duration-300 group">
61:                   <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🧠</div>
62:                   <h4 className="text-base font-bold text-white mb-2">Football Knowledge</h4>
63:                   <p className="text-zinc-400 text-xs leading-relaxed font-medium">
64:                     Test your in-depth understanding of league standings, tactical matching, team rosters, and historical head-to-head dynamics.
65:                   </p>
66:                 </div>
67: 
68:                 {/* Pillar 2 */}
69:                 <div className="bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 p-6 rounded-2xl transition-all duration-300 group">
70:                   <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📈</div>
71:                   <h4 className="text-base font-bold text-white mb-2">Prediction Accuracy</h4>
72:                   <p className="text-zinc-400 text-xs leading-relaxed font-medium">
73:                     Your foresight is graded mathematically. Build long-term win streaks across diverse match outcome types to scale your reputation.
74:                   </p>
75:                 </div>
76: 
77:                 {/* Pillar 3 */}
78:                 <div className="bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 p-6 rounded-2xl transition-all duration-300 group">
79:                   <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🏆</div>
80:                   <h4 className="text-base font-bold text-white mb-2">Leaderboard Dominance</h4>
81:                   <p className="text-zinc-400 text-xs leading-relaxed font-medium">
82:                     Outperform the global community. Dual ladders reward analytical brilliance and active community engagement with top ranks.
83:                   </p>
84:                 </div>
85:               </div>
86:             </div>
87:           </div>
88:         </section>
89: 
90:         {/* CORE PLATFORM FEATURES */}
91:         <section className="w-full mb-32">
92:           <div className="text-center mb-16 space-y-3">
93:             <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Ecosystem Mechanics</h2>
94:             <p className="text-zinc-500 max-w-2xl mx-auto font-medium">A cohesive sports analytics platform engineered for sustainability, gamification, and social virality.</p>
95:           </div>
96: 
97:           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
98:             
99:             {/* Feature 1 */}
100:             <div className="bg-zinc-900/50 border border-white/5 hover:border-amber-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
101:               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
102:               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-2xl animate-pulse">
103:                 ⚽
104:               </div>
105:               <h3 className="text-xl font-bold mb-3 text-white">1. Football Predictor</h3>
106:               <p className="text-zinc-400 text-sm leading-relaxed">
107:                 Forecast football matches across 4 sub-markets: Match Outcome (1X2), Correct Score, BTTS, and Under/Over 2.5 goals. You retain full editing rights until kick-off.
108:               </p>
109:             </div>
110: 
111:             {/* Feature 2 */}
112:             <div className="bg-zinc-900/50 border border-white/5 hover:border-red-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
113:               <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all"></div>
114:               <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-2xl">
115:                 🎰
116:               </div>
117:               <h3 className="text-xl font-bold mb-3 text-white">2. Lucky Spin Wheel</h3>
118:               <p className="text-zinc-400 text-sm leading-relaxed">
119:                 A provably fair, high-fidelity interactive wheel game. Spin to win XP boosts or extra prediction quotas. Staking unlocks massive discounts and free daily spins.
120:               </p>
121:             </div>
122: 
123:             {/* Feature 3 */}
124:             <div className="bg-zinc-900/50 border border-white/5 hover:border-emerald-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
125:               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
126:               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-2xl">
127:                 🛡️
128:               </div>
129:               <h3 className="text-xl font-bold mb-3 text-white">3. Deflationary Staking</h3>
130:               <p className="text-zinc-400 text-sm leading-relaxed">
131:                 Lock $GG (Tiers 1-4) to scale your prediction privileges and boost XP points. Early unstaking triggers a 10% penalty fee, with <strong>50% permanently burned</strong>.
132:               </p>
133:             </div>

            {/* Feature 4 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-blue-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-2xl">
                📊
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">4. Dual Leaderboards</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Compete on dual tracks: a <strong>Pro Forecasters</strong> leaderboard segmenting analytical skills, and a <strong>Social Leaderboard</strong> rewarding referral outreach and viral points.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-cyan-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-2xl">
                🌾
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">5. Twitter Farming Hub</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Unlock viral growth loops. Share custom referral links, tweet using #GoldenGoal, submit your tweet URL, and claim 25 Social Points verified by anti-sybil checks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-purple-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-2xl">
                ☁️
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">6. AWS Cloud Shield</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Enterprise cloud hosting. Powered by AWS VPC isolated clusters and real-time redundant database grids to deliver 99.99% operational uptime and instant sport score feeds.
              </p>
            </div>

          </div>
        </section>

        {/* INTERACTIVE STAKING PREVIEW */}
        <section className="w-full mb-32 bg-zinc-900/20 border border-white/5 p-8 sm:p-12 rounded-[32px] backdrop-blur-md relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Text & Interactive List */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">UTILITY HUB</span>
                <h3 className="text-3xl sm:text-4xl font-black text-white">VIP Staking Programs</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                  Staking your $GG tokens contracts circulating market supply while unlocking compound benefits across the platform. Click on a tier level below to preview its specific gaming benefits:
                </p>
              </div>

              {/* Selector Buttons */}
              <div className="flex flex-col gap-2.5">
                {stakingTiers.map((tier, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTier(idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer ${
                      activeTier === idx 
                        ? 'bg-zinc-800 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                        : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                    }`}
                  >
                    <span>{tier.level}</span>
                    <span className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-full bg-zinc-900/60 border ${activeTier === idx ? 'border-amber-500/40 text-amber-400' : 'border-white/5 text-zinc-500'}`}>
                      {tier.requirement.split(' ')[0] + ' ' + tier.requirement.split(' ')[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic visual card display */}
            <div className="relative flex justify-center items-center">
              
              {/* Glowing decorative background based on tier */}
              <div 
                className="absolute w-[80%] h-[80%] rounded-full blur-[80px] transition-all duration-500 -z-10"
                style={{ backgroundColor: stakingTiers[activeTier].glow }}
              ></div>

              {/* Gold Glassmorphic Card */}
              <div className="w-full max-w-sm bg-zinc-900/80 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stakingTiers[activeTier].color}`}></div>
                
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">ACTIVE PREVIEW</div>
                  <h4 className="text-2xl font-black text-white">{stakingTiers[activeTier].level}</h4>
                </div>

                <div className="divide-y divide-white/5 space-y-4 text-xs font-medium">
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-zinc-500">Requirement:</span>
                    <span className="text-white font-bold">{stakingTiers[activeTier].requirement}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-500">Prediction Limit:</span>
                    <span className="text-emerald-400 font-bold">{stakingTiers[activeTier].predictions}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-500">XP Booster Rate:</span>
                    <span className="text-blue-400 font-bold">{stakingTiers[activeTier].xp}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-500">Lucky Spin Cost:</span>
                    <span className="text-amber-400 font-bold">{stakingTiers[activeTier].spin}</span>
                  </div>

                </div>

                <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-[11px] text-zinc-400 leading-relaxed font-medium">
                  {stakingTiers[activeTier].perk}
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ROADMAP SECTION */}
        <section className="w-full mb-32">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Growth Roadmap</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto font-medium">Our strategic timeline to establish Golden Goal as the premium gaming infrastructure.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8 select-none">
            
            {/* Phase 1 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-500 font-bold tracking-widest text-lg font-mono">PHASE 1</span>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">COMPLETED</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">Technical Foundation</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Configured the core Solana wallet connector protocols, acquired our official high-end domain (www.goldengoalsol.com), and designed the beautiful cinematic landing page intro sequences.
                </p>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-gradient-to-r from-zinc-900 to-black border border-amber-500/25 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-amber-500 font-bold tracking-widest text-lg font-mono">PHASE 2</span>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">ACTIVE NOW</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">Platform Launch</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Release of prediction sub-markets, integration of dual ladders (Pro & Social Leaderboards), and initiation of our organic viral loop system (Twitter Farming module).
                </p>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-500 font-bold tracking-widest text-lg font-mono">PHASE 3</span>
                <span className="bg-zinc-800 border border-white/5 text-zinc-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">PLANNED</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">DeFi Integration & Mini-Games</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Launching the multi-tier lockup VIP Staking programs, activating the high-fidelity provably fair Lucky Spin casino wheel, and implementing deflationary burn mechanisms on early unstakes.
                </p>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-500 font-bold tracking-widest text-lg font-mono">PHASE 4</span>
                <span className="bg-zinc-800 border border-white/5 text-zinc-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">PLANNED</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">Expansion & Mobile App</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Deploying dedicated iOS and Android application binaries, introducing knockout bracket tournaments, and offering custom collectible avatar NFTs to reward loyal forecasters.
                </p>
              </div>
            </div>

            {/* Phase 5 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-500 font-bold tracking-widest text-lg font-mono">PHASE 5</span>
                <span className="bg-zinc-800 border border-white/5 text-zinc-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">PLANNED</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">Decentralized Governance (DAO)</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Enabling DAO governance model allowing community token votes to shape the roadmap, and expanding predictions into other global sports tournaments and e-sports categories.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="w-full text-center py-20 border-t border-white/5 select-none">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight">DOMINATE THE SCOREBOARD</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed mb-10 font-medium">
            Connect your Phantom wallet in seconds, lock your predictions, climb the analyst ranks, and earn weekly $GG rewards risk-free.
          </p>
          <div className="flex justify-center">
            {connected ? (
              isWhitelisted ? (
                <Link 
                  href="/markets" 
                  className="inline-block bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black py-4 px-12 rounded-2xl text-base transition-transform hover:scale-105 uppercase tracking-wider shadow-[0_0_35px_rgba(245,158,11,0.3)]"
                >
                  Enter Platform 🚀
                </Link>
              ) : (
                <button 
                  disabled
                  className="inline-block bg-zinc-900/80 border border-red-500/30 text-red-500/90 font-black py-4 px-12 rounded-2xl text-base cursor-not-allowed uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                  title="Coming Soon - This wallet address is not authorized for the closed beta testing phase."
                >
                  🔒 Coming Soon
                </button>
              )
            ) : (
              <button 
                onClick={() => setVisible(true)}
                className="inline-block bg-gradient-to-r from-yellow-500/10 to-amber-600/10 hover:from-yellow-500/20 hover:to-amber-600/20 text-yellow-400 hover:text-yellow-300 font-black py-4 px-12 rounded-2xl text-base border border-yellow-500/30 transition-transform hover:scale-105 uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.1)]"
              >
                Enter Platform
              </button>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
