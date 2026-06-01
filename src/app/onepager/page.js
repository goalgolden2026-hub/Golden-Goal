"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const SLIDES_COUNT = 5;

const TEAM_FLAGS = {
  USA: '🇺🇸',
  Senegal: '🇸🇳',
  Mexico: '🇲🇽',
  Australia: '🇦🇺'
};

export default function OnePagerPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLivePulse, setIsLivePulse] = useState(true);

  // Auto-pulse effect for mock live elements
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLivePulse(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const nextSlide = () => {
    setActiveSlide(prev => (prev + 1) % SLIDES_COUNT);
  };

  const prevSlide = () => {
    setActiveSlide(prev => (prev - 1 + SLIDES_COUNT) % SLIDES_COUNT);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-between relative overflow-hidden font-sans print:bg-white print:text-black">
      
      {/* Cinematic Radial Glows (Background Ambiance) - Hidden in Print */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none -z-10 print:hidden"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none -z-10 print:hidden"></div>

      {/* FIXED PRINT PREPARATION - Injects CSS for flawless A4 print division */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-slide-container {
            display: block !important;
            page-break-after: always !important;
            height: auto !important;
            padding: 20px 0 !important;
            opacity: 1 !important;
            transform: none !important;
            border-bottom: 2px dashed #e4e4e7 !important;
          }
          .print-slide-container:last-child {
            border-bottom: none !important;
            page-break-after: avoid !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-bg-card {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            color: #0f172a !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-gold {
            color: #b45309 !important;
          }
          .print-border-gold {
            border-color: #f59e0b !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}} />

      {/* Floating Header Actions Bar - Hidden in Print */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-40 print:hidden">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full group-hover:bg-yellow-500/30 transition-all"></div>
            <img src="/logo.jpg" alt="Golden Goal" className="w-10 h-10 rounded-full object-cover border border-yellow-500/40" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">GOLDEN GOAL</span>
            <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">One-Pager Deck</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-black rounded-full shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-105 transition-all text-xs tracking-wider uppercase flex items-center gap-1.5 border border-yellow-400/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print PDF</span>
          </button>
          
          <Link
            href="/"
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 text-zinc-400 hover:text-white font-bold rounded-full text-xs transition-all"
          >
            Exit Deck
          </Link>
        </div>
      </header>

      {/* Main Slides Content Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-4 flex-1 flex items-center justify-center relative z-20 print:block print:max-w-none print:px-0">
        
        {/* ========================================================
            PAGE 1: THE RISK-FREE REVOLUTION (VISION & ANALYSIS)
            ======================================================== */}
        <div className={`w-full transition-all duration-500 flex flex-col gap-6 print-slide-container ${
          activeSlide === 0 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-12 print:block'
        }`}>
          <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] print-bg-card">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:border-zinc-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest print:text-amber-800">Slide 1 / 5 • Ecosystem Vision</span>
                <h2 className="text-3xl font-black tracking-tight text-white print:text-zinc-950">The Risk-Free Betting Revolution</h2>
              </div>
              <span className="text-2xl print:hidden">🛡️</span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-8 print:text-zinc-700">
              Golden Goal is a state-of-the-art, **0% risk prediction market** built on Solana. Standard forecasting platforms force users to constantly put their capital at hazard, creating stress and financial ruin. Golden Goal eliminates financial risk completely by introducing a **locking/holding mechanism**. Users hold or soft-lock their tokens to earn prediction quotas, predict global fixtures across 6 sub-markets resolved by the live **SportAPI (Sofascore) data engines**, and climb a competitive leaderboard to unlock massive gamified rewards!
            </p>

            {/* High-Fidelity Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-5 space-y-3 print:bg-zinc-50 print:border-zinc-200">
                <span className="text-red-400 font-extrabold text-xs tracking-wider uppercase block">💸 Traditional Betting Platforms</span>
                <ul className="space-y-2 text-xs text-zinc-400 print:text-zinc-600 leading-relaxed list-disc list-inside">
                  <li><strong className="text-zinc-200 print:text-zinc-900">Capital Loss:</strong> Every single failed prediction directly costs your hard-earned savings.</li>
                  <li><strong className="text-zinc-200 print:text-zinc-900">High stress loop:</strong> Fosters high anxiety, turning casual fans away from daily forecast interactions.</li>
                  <li><strong className="text-zinc-200 print:text-zinc-900">Opaque resolutions:</strong> Outdated manual scoring yields slow payouts and zero automated accountability.</li>
                </ul>
              </div>

              <div className="bg-yellow-500/[0.02] border border-yellow-500/10 rounded-2xl p-5 space-y-3 print:bg-zinc-50 print:border-zinc-200">
                <span className="text-amber-400 font-extrabold text-xs tracking-wider uppercase block print:text-amber-800">⚽ Golden Goal Staking Model</span>
                <ul className="space-y-2 text-xs text-zinc-400 print:text-zinc-600 leading-relaxed list-disc list-inside">
                  <li><strong className="text-zinc-200 print:text-zinc-900">Zero Risk (0% Loss):</strong> predictions are completely free. Locked tokens are never spent or lost.</li>
                  <li><strong className="text-zinc-200 print:text-zinc-900">Skill-Based Competition:</strong> Climb rankings based entirely on analysis, football acumen, and accuracy.</li>
                  <li><strong className="text-zinc-200 print:text-zinc-900">Real-Time Sofascore Automation:</strong> 100% automated score tracking and background prediction payouts.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            PAGE 2: DYNAMIC STADIUM ARENA (LIVE MATCH STYLES)
            ======================================================== */}
        <div className={`w-full transition-all duration-500 flex flex-col gap-6 print-slide-container ${
          activeSlide === 1 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-12 print:block'
        }`}>
          <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] print-bg-card">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:border-zinc-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest print:text-amber-800">Slide 2 / 5 • Match Interface</span>
                <h2 className="text-3xl font-black tracking-tight text-white print:text-zinc-950">Dynamic Stadium Arena & Live Scores</h2>
              </div>
              <span className="text-2xl print:hidden">🏟️</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-bold text-zinc-200 print:text-zinc-900">Visual Engagement & Real-Time Sync</h3>
                <p className="text-xs text-zinc-400 leading-relaxed print:text-zinc-700">
                  Golden Goal elevates the user experience with stunning stadium backdrops and interactive components. As soon as a match goes live:
                </p>
                <ul className="space-y-2 text-xs text-zinc-400 print:text-zinc-600 leading-relaxed list-disc list-inside">
                  <li>A pulsing **• LIVE** badge tracks elapsed minutes and halftime/fulltime periods dynamically.</li>
                  <li>Flag icons, high-contrast scoreboards, and animated glows update instantly.</li>
                  <li>The card remains fully open! Users can click `View Predictions →` even during a live game to inspect their lock-in choices, fostering high community engagement.</li>
                </ul>
              </div>

              {/* High-Fidelity Match Card Mockup Component */}
              <div className="lg:col-span-7 flex justify-center w-full">
                <div 
                  className="w-full max-w-md border border-zinc-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] print:border-zinc-300"
                  style={{
                    backgroundImage: "linear-gradient(to bottom, rgba(10, 10, 10, 0.45), rgba(10, 10, 10, 0.9)), url('/default-stadium-bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Top Live Badge */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <span className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isLivePulse ? 'opacity-100 scale-110' : 'opacity-40 scale-90'} transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]`}></span>
                      LIVE 43'
                    </span>
                  </div>

                  {/* Predictions Placed Badge */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[9px] font-extrabold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.15)] flex items-center gap-1 leading-none">
                      ✓ 6/6 PREDICTIONS PLACED
                    </span>
                  </div>

                  {/* Competitor Board */}
                  <div className="flex items-center justify-center gap-8 text-xl font-bold w-full">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-4xl drop-shadow-md select-none">{TEAM_FLAGS.USA}</span>
                      <span className="text-zinc-100 font-bold text-sm">USA</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 min-w-[70px]">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] tracking-tight">
                        3 - 2
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-4xl drop-shadow-md select-none">{TEAM_FLAGS.Senegal}</span>
                      <span className="text-zinc-100 font-bold text-sm">Senegal</span>
                    </div>
                  </div>

                  {/* View predictions Active Button mockup */}
                  <button className="w-full py-3 px-4 rounded-xl font-bold bg-white/5 border border-white/10 hover:border-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-xs flex items-center justify-center gap-1.5">
                    <span>View Predictions</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            PAGE 3: 6 SUB-MARKETS & DEDICATED MODALS (PREDICTION GLOW)
            ======================================================== */}
        <div className={`w-full transition-all duration-500 flex flex-col gap-6 print-slide-container ${
          activeSlide === 2 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-12 print:block'
        }`}>
          <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] print-bg-card">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:border-zinc-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest print:text-amber-800">Slide 3 / 5 • Market Sub-Markets</span>
                <h2 className="text-3xl font-black tracking-tight text-white print:text-zinc-950">Granular Markets & Irreversible Locking</h2>
              </div>
              <span className="text-2xl print:hidden">⚡</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Prediction Locking Mechanism Text */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-bold text-zinc-200 print:text-zinc-900">Six High-Yield Forecasting Modals</h3>
                <p className="text-xs text-zinc-400 leading-relaxed print:text-zinc-700">
                  Instead of standard win-lose options, Golden Goal splits each soccer fixture into **6 highly custom sub-markets** mapped directly to the live match play-by-play.
                </p>
                <div className="space-y-2 text-xs text-zinc-400 print:text-zinc-600">
                  <p>🛡️ **Permanent Lock-In:** To prevent front-running and keep token staking robust, **predictions cannot be changed once locked**, even before the match begins!</p>
                  <p>✨ **UI Glowing States:** When a choice is selected, it locks in a gorgeous, glowing yellow background with a `✓` checkmark, while the other non-selected choices are disabled and dimmed to ensure the highest visual clarity.</p>
                </div>
              </div>

              {/* Sub-market UI Mockup */}
              <div className="lg:col-span-7 space-y-4 w-full">
                {/* 1. Match Result mockup */}
                <div className="bg-zinc-950/70 border border-zinc-800/50 rounded-2xl p-4 print:bg-zinc-50 print:border-zinc-200">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2.5">Match Result</span>
                  <div className="flex gap-2.5">
                    <button className="flex-1 py-3 px-2 border border-transparent rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-400 opacity-30 cursor-not-allowed">USA</button>
                    <button className="flex-1 py-3 px-2 border border-transparent rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-400 opacity-30 cursor-not-allowed">Draw</button>
                    <button className="flex-1 py-3 px-2 border border-amber-500/50 text-amber-400 font-extrabold rounded-xl text-xs bg-gradient-to-r from-amber-500/20 to-yellow-600/10 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse flex items-center justify-center gap-1">
                      <span>✓</span>
                      <span>Senegal</span>
                    </button>
                  </div>
                </div>

                {/* 2. Total Goals mockup */}
                <div className="bg-zinc-950/70 border border-zinc-800/50 rounded-2xl p-4 print:bg-zinc-50 print:border-zinc-200">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2.5">Total Goals (Over/Under 2.5)</span>
                  <div className="flex gap-2.5">
                    <button className="flex-1 py-3 px-2 border border-amber-500/50 text-amber-400 font-extrabold rounded-xl text-xs bg-gradient-to-r from-amber-500/20 to-yellow-600/10 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse flex items-center justify-center gap-1">
                      <span>✓</span>
                      <span>Under 2.5</span>
                    </button>
                    <button className="flex-1 py-3 px-2 border border-transparent rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-400 opacity-30 cursor-not-allowed">Over 2.5</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            PAGE 4: COMPETITIVE BATTLEGROUND (LEADERBOARD SYSTEM)
            ======================================================== */}
        <div className={`w-full transition-all duration-500 flex flex-col gap-6 print-slide-container ${
          activeSlide === 3 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-12 print:block'
        }`}>
          <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] print-bg-card">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:border-zinc-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest print:text-amber-800">Slide 4 / 5 • Competitive Rankings</span>
                <h2 className="text-3xl font-black tracking-tight text-white print:text-zinc-950">The Competitive Leaderboard</h2>
              </div>
              <span className="text-2xl print:hidden">🏆</span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-6 print:text-zinc-700">
              Predictions are more than just a guess—they represent active skill! Our high-fidelity **Competitive Leaderboard** displays the performance of the best soccer forecasters in the ecosystem. Top users claim rank badges (Gold, Silver, Bronze Trophies), showcase custom web3 profile layouts, accumulate XP, and achieve glowing badges indicating high accuracy.
            </p>

            {/* High-Fidelity Leaderboard Grid Mockup */}
            <div className="overflow-hidden border border-zinc-800/80 rounded-2xl bg-zinc-950/40 print:border-zinc-200">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold print:border-zinc-200 print:bg-zinc-100 print:text-zinc-900">
                    <th className="py-3 px-4 text-center w-16">Rank</th>
                    <th className="py-3 px-4">User Wallet</th>
                    <th className="py-3 px-4 text-center">predictions Won</th>
                    <th className="py-3 px-4 text-center">Win Rate</th>
                    <th className="py-3 px-4 text-right pr-6">Score (XP)</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300 divide-y divide-zinc-900 print:text-zinc-800 print:divide-zinc-200">
                  <tr className="bg-yellow-500/[0.02] hover:bg-yellow-500/[0.04] transition-colors">
                    <td className="py-3 px-4 text-center font-black text-yellow-400 text-lg">🥇</td>
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2 print:text-zinc-900">
                      <span className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-[10px] flex items-center justify-center">⚽</span>
                      <span>2iF2q7hj...Kbu5R8K</span>
                      <span className="text-[8px] bg-yellow-500/20 border border-yellow-500/40 px-1.5 py-0.5 rounded text-yellow-400 uppercase font-black tracking-widest leading-none">Top Picker</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">142</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-extrabold font-mono">%83.3</td>
                    <td className="py-3 px-4 text-right font-black text-yellow-400 pr-6">14,200 XP</td>
                  </tr>

                  <tr className="bg-zinc-900/10 hover:bg-zinc-900/20 transition-colors">
                    <td className="py-3 px-4 text-center font-black text-zinc-400 text-lg">🥈</td>
                    <td className="py-3 px-4 font-semibold text-zinc-200 flex items-center gap-2 print:text-zinc-900">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center">🛡️</span>
                      <span>5a3b9x9c...kL2h9r5</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">128</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold font-mono">%76.4</td>
                    <td className="py-3 px-4 text-right font-bold pr-6">12,800 XP</td>
                  </tr>

                  <tr className="bg-zinc-900/10 hover:bg-zinc-900/20 transition-colors">
                    <td className="py-3 px-4 text-center font-black text-orange-500 text-lg">🥉</td>
                    <td className="py-3 px-4 font-semibold text-zinc-200 flex items-center gap-2 print:text-zinc-900">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center">👟</span>
                      <span>8x2r5y7u...jM8k3r2</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">115</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold font-mono">%72.1</td>
                    <td className="py-3 px-4 text-right font-bold pr-6">11,500 XP</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* ========================================================
            PAGE 5: STAKING UTILITY & LOCKING TIERS (TOKENOMICS)
            ======================================================== */}
        <div className={`w-full transition-all duration-500 flex flex-col gap-6 print-slide-container ${
          activeSlide === 4 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-12 print:block'
        }`}>
          <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] print-bg-card">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:border-zinc-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest print:text-amber-800">Slide 5 / 5 • Staking & Tokenomics</span>
                <h2 className="text-3xl font-black tracking-tight text-white print:text-zinc-950">Multi-Tier Token Locking & Box Loop</h2>
              </div>
              <span className="text-2xl print:hidden">💎</span>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-6 print:text-zinc-700">
              Golden Goal's tokenomics are powered by a **Multi-Tier Token Locker (Tiers 0 to 4)** and a gamified **Rewards Box Module**. Staking longer and locking more tokens directly boosts your daily forecasting powers, decreases item purchase costs, and accelerates XP gains.
            </p>

            {/* High-Fidelity Tier Locking Table */}
            <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-950/20 print:border-zinc-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-bold print:border-zinc-200 print:text-zinc-900">
                    <th className="py-2.5 px-3">Level (Tier)</th>
                    <th className="py-2.5 px-3">Lock Requirement</th>
                    <th className="py-2.5 px-3">Daily prediction Quota</th>
                    <th className="py-2.5 px-3">XP Booster</th>
                    <th className="py-2.5 px-3">Daily Reward Box</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300 divide-y divide-zinc-900 print:text-zinc-800 print:divide-zinc-200">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold print:text-zinc-900">Tier 0 (Holder)</td>
                    <td className="py-2.5 px-3 text-zinc-400">Min 10,000 $GG in Wallet</td>
                    <td className="py-2.5 px-3 text-zinc-400">Base Limit (3 per day)</td>
                    <td className="py-2.5 px-3 text-zinc-400">1.0x</td>
                    <td className="py-2.5 px-3 text-zinc-400">100 XP Cost</td>
                  </tr>
                  <tr className="bg-emerald-500/[0.02]">
                    <td className="py-2.5 px-3 font-semibold text-emerald-400 print:text-emerald-800">Tier 1 (Soft Lock)</td>
                    <td className="py-2.5 px-3">100 $GG (1-Day Lock)</td>
                    <td className="py-2.5 px-3 font-bold">+1 Extra per day</td>
                    <td className="py-2.5 px-3">1.0x</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-medium">75 XP (25% Off)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-blue-400 print:text-blue-800">Tier 2 (Weekly)</td>
                    <td className="py-2.5 px-3">500 $GG (7-Day Lock)</td>
                    <td className="py-2.5 px-3 font-bold">+3 Extra per day</td>
                    <td className="py-2.5 px-3">1.0x</td>
                    <td className="py-2.5 px-3 text-blue-400 font-medium">50 XP (50% Off)</td>
                  </tr>
                  <tr className="bg-purple-500/[0.02]">
                    <td className="py-2.5 px-3 font-semibold text-purple-400 print:text-purple-800">Tier 3 (Fortnight)</td>
                    <td className="py-2.5 px-3">1,000 $GG (15-Day Lock)</td>
                    <td className="py-2.5 px-3 font-bold">+5 Extra per day</td>
                    <td className="py-2.5 px-3 text-purple-400 font-bold">1.10x XP Boost ⚡</td>
                    <td className="py-2.5 px-3 text-purple-400 font-medium">25 XP (75% Off)</td>
                  </tr>
                  <tr className="bg-yellow-500/[0.03]">
                    <td className="py-2.5 px-3 font-semibold text-yellow-400 print:text-amber-800">Tier 4 (Monthly)</td>
                    <td className="py-2.5 px-3 font-bold">5,000 $GG (30-Day Lock)</td>
                    <td className="py-2.5 px-3 font-black text-yellow-400">+10 Extra per day</td>
                    <td className="py-2.5 px-3 font-black text-yellow-400">1.25x XP Boost ⚡</td>
                    <td className="py-2.5 px-3 font-black text-yellow-400 print:text-amber-800">🎁 1 FREE DAILY DROP!</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </main>

      {/* Slayt Alt Navigasyonu ve Kontroller - Hidden in Print */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between z-40 print:hidden">
        
        {/* Left/Right Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>

        {/* Indicators Dots */}
        <div className="flex gap-2">
          {Array.from({ length: SLIDES_COUNT }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-350 ${
                activeSlide === idx 
                  ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-110 w-6' 
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Help Tip */}
        <span className="text-[10px] font-mono font-bold text-zinc-600 hidden sm:inline select-none">
          💡 Tip: Use Left / Right arrows on your keyboard to navigate slides!
        </span>
      </footer>

      {/* Footer Legal Disclaimer - Printed at the bottom of every PDF page */}
      <div className="hidden print:block w-full text-center text-[8px] text-zinc-400 mt-6 pt-4 border-t border-zinc-200">
        <span>© 2026 Golden Goal. Not by Chance, but by Skill & Analysis. Solana Ecosystem Risk-Free Predictor Platform.</span>
      </div>

    </div>
  );
}
