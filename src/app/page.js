"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { isWalletWhitelisted } from '@/lib/whitelist';

export default function LandingPage() {
  const [activeTier, setActiveTier] = useState(4); // Default to Tier 4
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showWalletUI = mounted && connected;
  const walletAddress = publicKey ? publicKey.toBase58() : null;
  const isWhitelisted = isWalletWhitelisted(walletAddress);

  const lockingTiers = [
    {
      level: "Tier 0 (Holder)",
      requirement: "Min 250,000 $GoldenGoal (Circulating)",
      predictions: "3 Predictions / Day",
      xp: "1.0x XP",
      rewardsBox: "100 XP / Rewards Box Open",
      perk: "Hold 250K+ tokens in your Solana wallet to unlock basic prediction privileges (3 predictions/day) and open boxes for 100 XP.",
      color: "from-zinc-500 to-zinc-700",
      glow: "rgba(113, 113, 122, 0.15)"
    },
    {
      level: "Tier 1 (Soft)",
      requirement: "Min 350,000 $GoldenGoal Locked",
      predictions: "+1 Prediction / Day",
      xp: "1.0x XP",
      rewardsBox: "75 XP / Rewards Box (25% Off)",
      perk: "Lock 350K+ $GoldenGoal for a 1-day lockup. Unlocks a 25% discount on the daily Rewards Box opening fee.",
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(16, 185, 129, 0.15)"
    },
    {
      level: "Tier 2 (7-Day)",
      requirement: "Min 500,000 $GoldenGoal Locked",
      predictions: "+3 Predictions / Day",
      xp: "1.0x XP",
      rewardsBox: "50 XP / Rewards Box (50% Off)",
      perk: "Lock 500K+ $GoldenGoal for a 7-day lockup. Unlocks a 50% discount on the daily Rewards Box opening fee.",
      color: "from-blue-500 to-indigo-600",
      glow: "rgba(59, 130, 246, 0.15)"
    },
    {
      level: "Tier 3 (15-Day)",
      requirement: "Min 750,000 $GoldenGoal Locked",
      predictions: "+5 Predictions / Day",
      xp: "1.1x XP Booster",
      rewardsBox: "25 XP / Rewards Box (75% Off)",
      perk: "Lock 750K+ $GoldenGoal for a 15-day lockup. Unlocks a 75% discount on the daily Rewards Box opening fee and 1.1x XP.",
      color: "from-purple-500 to-violet-600",
      glow: "rgba(139, 92, 246, 0.15)"
    },
    {
      level: "Tier 4 (30-Day)",
      requirement: "Min 1,000,000 $GoldenGoal Locked",
      predictions: "+10 Predictions / Day",
      xp: "1.25x XP Booster",
      rewardsBox: "1 Free Daily + 25 XP / Next Rewards Box",
      perk: "Lock 1M+ $GoldenGoal for a 30-day lockup. First daily Rewards Box opening is completely free, subsequent openings cost 25 XP.",
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
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/10 blur-2xl rounded-full"></div>
              <img 
                src="/logo.jpg" 
                alt="Golden Goal Logo" 
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-2 border-yellow-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] hover:scale-105 transition-all duration-500 relative z-10"
              />
            </div>
          </div>

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
            A competitive football prediction ecosystem built on <span className="text-white font-semibold">Solana</span> where fans forecast matches, earn <span className="text-amber-400 font-semibold">XP</span>, climb leaderboards, and unlock <span className="text-white font-semibold">ecosystem rewards.</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full max-w-4xl mx-auto px-4 select-none">
            {showWalletUI ? (
              isWhitelisted ? (
                <Link 
                  href="/markets?filter=live" 
                  className="h-14 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black rounded-2xl text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/40 text-center uppercase tracking-wider flex items-center justify-center gap-2 group whitespace-nowrap"
                >
                  <span>Launch Platform</span>
                  <svg className="w-5 h-5 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </Link>
              ) : (
                <button 
                  disabled
                  className="h-14 bg-zinc-950/80 border border-red-500/30 text-red-500/80 font-black rounded-2xl text-sm cursor-not-allowed flex items-center justify-center gap-2 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] uppercase tracking-wider relative group whitespace-nowrap"
                  title="Coming Soon - This wallet address is not authorized for the closed beta testing phase."
                >
                  <svg className="w-5 h-5 text-red-500/80 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Coming Soon</span>
                </button>
              )
            ) : (
              <button 
                onClick={() => setVisible(true)}
                className="h-14 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black rounded-2xl text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_30px_rgba(245,158,11,0.3)] border border-yellow-400/40 uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Launch Platform</span>
                <svg className="w-5 h-5 text-zinc-950 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {/* Whitepaper Secondary Button */}
            <Link 
              href="/docs" 
              className="h-14 bg-white/[0.02] border border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/[0.04] text-zinc-300 hover:text-white font-bold rounded-2xl text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md group whitespace-nowrap"
            >
              <svg className="w-5 h-5 text-yellow-500/80 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Whitepaper</span>
            </Link>

            {/* Pitch Deck Secondary Button */}
            <Link 
              href="/pitchdeck" 
              className="h-14 bg-white/[0.02] border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/[0.04] text-zinc-300 hover:text-white font-bold rounded-2xl text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md group whitespace-nowrap"
            >
              <svg className="w-5 h-5 text-amber-500/80 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Pitch Deck</span>
            </Link>

            {/* One-Pager Secondary Button */}
            <Link 
              href="/onepager" 
              className="h-14 bg-white/[0.02] border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/[0.04] text-zinc-300 hover:text-white font-bold rounded-2xl text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md group whitespace-nowrap"
            >
              <svg className="w-5 h-5 text-orange-500/80 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>One-Pager</span>
            </Link>
          </div>

          {!isWhitelisted && showWalletUI && (
            <p className="mt-4 text-red-500/80 text-xs font-semibold uppercase tracking-widest animate-pulse font-mono flex items-center gap-1.5 justify-center">
              <span>🔒 Coming Soon - Access Restricted to Whitelisted Testers</span>
            </p>
          )}

          {/* PREMIUM LEGAL COMPLIANCE SHIELD CARD */}
          <div className="w-full max-w-2xl mx-auto mt-12 p-5 rounded-2xl bg-zinc-950/60 border border-yellow-500/10 hover:border-yellow-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.02)] transition-all duration-300 select-none text-left flex items-start gap-4 group">
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/20 group-hover:scale-105 transition-all duration-300">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black tracking-widest text-amber-400 font-mono uppercase">⚖️ Legal Notice & Compliance Shield</span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/50 font-mono shadow-[0_0_18px_rgba(52,211,153,0.45)] animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-100"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  </span>
                  COMPLIANCE VERIFIED
                </span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-zinc-400">
                <strong className="text-zinc-200">NO PURCHASE NECESSARY.</strong> Void where prohibited by law. Standard daily prediction quotas are allocated free of charge. Platform operations strictly simulate a football analytical index. Leaderboards are decided 100% based on predictive foresight, football acumen, and data modelling—completely free of capital hazard or chance elements.
              </p>
            </div>
          </div>
        </section>

        {/* ECOSYSTEM STATS RIBBON */}
        <div className="w-full max-w-5xl mb-28 grid grid-cols-1 md:grid-cols-3 gap-6 select-none relative group/ribbon">
          {/* Decorative blur shadows under the ribbon */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-amber-500/5 to-orange-500/5 rounded-[32px] blur-2xl opacity-50 group-hover/ribbon:opacity-100 transition-opacity duration-500 -z-10"></div>
          
          {/* Stat 1: Capital Loss Risk */}
          <div className="relative overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 hover:border-emerald-500/20 backdrop-blur-md rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_30px_rgba(0,0,0,0.2)] group/stat">
            <div className="space-y-1 text-left">
              <div className="text-[10px] font-black text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Guaranteed
              </div>
              <div className="text-3xl font-black text-white tracking-tight">0%</div>
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Capital Loss Risk</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Stat 2: Tiered Locking */}
          <div className="relative overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 hover:border-amber-500/20 backdrop-blur-md rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_30px_rgba(0,0,0,0.2)] group/stat">
            <div className="space-y-1 text-left">
              <div className="text-[10px] font-black text-amber-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Multi-Tiered
              </div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tracking-tight">Tiers 0-4</div>
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Tiered Locking Programs</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          {/* Stat 3: Rewards Box Module */}
          <div className="relative overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 hover:border-red-500/20 backdrop-blur-md rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_30px_rgba(0,0,0,0.2)] group/stat">
            <div className="space-y-1 text-left">
              <div className="text-[10px] font-black text-red-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                Provably Fair
              </div>
              <div className="text-3xl font-black text-white tracking-tight">Daily Drops</div>
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Rewards Box Engine</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* SKILL-BASED SYSTEM SHOWCASE */}
        <section className="w-full max-w-5xl mb-32 select-none">
          <div className="relative rounded-[32px] overflow-hidden border border-yellow-500/20 bg-gradient-to-b from-[#161026]/90 to-[#0e0a1b]/90 p-8 sm:p-12 shadow-[0_0_50px_rgba(245,158,11,0.05)] backdrop-blur-xl">
            {/* Background vector glow */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6 col-span-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-widest text-yellow-400 font-black uppercase bg-yellow-400/10 px-3.5 py-1.5 rounded-full border border-yellow-400/20">
                  ⚡ SKILL OVER CHANCE
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  A Purely <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">Skill-Based</span> Prediction Ecosystem
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                  Golden Goal completely redefines sports forecasts. Our platform has <span className="text-white font-bold">no elements of chance or gambling</span>. It is a competitive sports analytics simulator where success is determined entirely by analytical skill, strategic asset allocation, and leaderboard performance.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500 font-mono">
                  <span>❌ NO ROULETTE</span>
                  <span>•</span>
                  <span>❌ NO HOUSE EDGE</span>
                  <span>•</span>
                  <span>❌ NO CAPITAL RISK</span>
                </div>
              </div>

              <div className="lg:col-span-7 col-span-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pillar 1 */}
                <div className="bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 p-6 rounded-2xl transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 .364l-.707 .707M21 12h-1M4 12H3m.337-6.929l.707 .707M12 21v-1m4.243-1.757l-.707-.707M7.757 19.243l-.707-.707M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Football Knowledge</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                    Test your in-depth understanding of league standings, tactical matching, team rosters, and historical head-to-head dynamics.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 p-6 rounded-2xl transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Prediction Accuracy</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                    Your foresight is graded mathematically. Build long-term win streaks across diverse match outcome types to scale your reputation.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 p-6 rounded-2xl transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Leaderboard Dominance</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                    Outperform the global community. Dual ladders reward analytical brilliance and active community engagement with top ranks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE PLATFORM FEATURES */}
        <section className="w-full mb-32">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Ecosystem Mechanics</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto font-medium">A cohesive sports analytics platform engineered for sustainability, gamification, and social virality.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-amber-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-2xl">
                <svg className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">1. Football Predictor</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Analyze and forecast football fixtures across global leagues with a variety of predictive options. Fully manage your insights and strategy adjustments until kick-off.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-red-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-2xl">
                <svg className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">2. Rewards Box Module</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                A provably fair gamified rewards module. Open daily boxes to claim experience points, leaderboard boosts, and extra prediction quotas. Active locking unlocks daily boxes for free.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-emerald-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-2xl">
                <svg className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">3. Deflationary Locking</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Lock your $GoldenGoal tokens to scale your prediction capabilities, boost your XP multiplier, and unlock higher access levels. Drive premium value through long-term loyalty.
              </p>
            </div>

            {/* Feature 4 */}
            {/* Feature 4 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-blue-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-2xl">
                <svg className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2M2 4h20a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">4. Dual Leaderboards</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Compete on dual tracks: a <strong>Pro Forecasters</strong> leaderboard segmenting analytical skills, and a <strong>Social Leaderboard</strong> rewarding active community participation, platform engagement, and growth.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-zinc-900/50 border border-white/5 hover:border-cyan-500/25 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-2xl">
                <svg className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
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
                <svg className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">6. AWS Cloud Shield</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Enterprise cloud hosting. Powered by AWS VPC isolated clusters and real-time redundant database grids to deliver 99.99% operational uptime and instant sport score feeds.
              </p>
            </div>

          </div>
        </section>

        {/* INTERACTIVE LOCKING PREVIEW */}
        <section className="w-full mb-32 bg-zinc-900/20 border border-white/5 p-8 sm:p-12 rounded-[32px] backdrop-blur-md relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Text & Interactive List */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">UTILITY HUB</span>
                <h3 className="text-3xl sm:text-4xl font-black text-white">Tiered Locking Programs</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                  Locking your $GoldenGoal tokens contracts circulating market supply while unlocking compound benefits across the platform. Click on a tier level below to preview its specific gaming benefits:
                </p>
              </div>

              {/* Selector Buttons */}
              <div className="flex flex-col gap-2.5">
                {lockingTiers.map((tier, idx) => (
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
                style={{ backgroundColor: lockingTiers[activeTier].glow }}
              ></div>

              {/* Gold Glassmorphic Card */}
              <div className="w-full max-w-sm bg-zinc-900/80 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${lockingTiers[activeTier].color}`}></div>
                
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">ACTIVE PREVIEW</div>
                  <h4 className="text-2xl font-black text-white">{lockingTiers[activeTier].level}</h4>
                </div>

                <div className="divide-y divide-white/5 space-y-4 text-xs font-medium">
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-zinc-500">Requirement:</span>
                    <span className="text-white font-bold">{lockingTiers[activeTier].requirement}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-500">Prediction Limit:</span>
                    <span className="text-emerald-400 font-bold">{lockingTiers[activeTier].predictions}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-500">XP Booster Rate:</span>
                    <span className="text-blue-400 font-bold">{lockingTiers[activeTier].xp}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-500">Rewards Box:</span>
                    <span className="text-amber-400 font-bold">{lockingTiers[activeTier].rewardsBox}</span>
                  </div>

                </div>

                <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-[11px] text-zinc-400 leading-relaxed font-medium">
                  {lockingTiers[activeTier].perk}
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
                <h4 className="font-bold text-white text-base mb-2">Platform Launch & Closed Beta</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Public announcement of the platform, preview release of landing page mechanics, and whitelisted closed beta testing access for early community participants.
                </p>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-500 font-bold tracking-widest text-lg font-mono">PHASE 3</span>
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">LAUNCHING SOON</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">Football Predictor & Leaderboards</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Activation of the core Football Predictor analytics board, allowing live forecasts across global football leagues, alongside the launch of Pro & Social Leaderboards.
                </p>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
              <div className="sm:w-1/3 flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-500 font-bold tracking-widest text-lg font-mono">PHASE 4</span>
                <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">UPCOMING</span>
              </div>
              <div className="sm:w-2/3">
                <h4 className="font-bold text-white text-base mb-2">Rewards Box & Locking Engine</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Unlocking the gamified Rewards Box module for daily XP & prediction quota claims, and launching the multi-tier lockup tiered locking programs.
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
                <h4 className="font-bold text-white text-base mb-2">Expansion & Decentralized Governance</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  Releasing dedicated mobile apps (iOS & Android), bracket tournaments, and enabling a DAO governance model with community token voting.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="w-full text-center py-20 border-t border-white/5 select-none">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight">DOMINATE THE SCOREBOARD</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed mb-10 font-medium">
            Connect your Phantom wallet in seconds, lock your predictions, climb the analyst ranks, and earn weekly $GoldenGoal rewards risk-free.
          </p>
          <div className="flex justify-center">
            {showWalletUI ? (
              isWhitelisted ? (
                <Link 
                  href="/markets?filter=live" 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black py-4 px-12 rounded-2xl text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] uppercase tracking-wider shadow-[0_0_35px_rgba(245,158,11,0.3)] border border-yellow-400/40"
                >
                  <span>Enter Platform</span>
                  <svg className="w-5 h-5 text-zinc-950 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
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
