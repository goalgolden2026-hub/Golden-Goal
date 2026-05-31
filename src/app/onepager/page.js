"use client";

import React from 'react';
import Link from 'next/link';

export default function OnePagerPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center relative overflow-x-hidden print:bg-white print:text-zinc-900 print:min-h-0">
      
      {/* Dynamic Background Blur - Hidden in Print */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/10 via-yellow-600/5 to-transparent blur-[120px] pointer-events-none -z-10 print:hidden"></div>

      {/* Floating Action Button Bar - Hidden in Print */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-5 py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-zinc-950 font-black rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-yellow-400/30 text-xs tracking-wider uppercase"
        >
          <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print / PDF</span>
        </button>
        
        <Link
          href="/"
          className="px-4 py-3 bg-zinc-900/90 border border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/[0.04] text-zinc-300 hover:text-white font-bold rounded-full shadow-lg backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 text-xs flex items-center gap-1.5"
        >
          <span>Home Page</span>
        </Link>
      </div>

      {/* One-Pager Container - Sized to exactly A4 in print */}
      <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 flex flex-col justify-between print:p-0 print:max-w-none print:w-full print:mx-0">
        
        {/* Style injection for extreme print precision */}
        <style>{`
          @media print {
            body {
              background-color: #ffffff !important;
              color: #09090b !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-bg-card {
              background-color: #f4f4f5 !important;
              border: 1px solid #e4e4e7 !important;
              box-shadow: none !important;
              backdrop-filter: none !important;
            }
            .print-border-gold {
              border-color: #d97706 !important;
            }
            .print-text-dark {
              color: #18181b !important;
            }
            .print-text-gold {
              color: #b45309 !important;
            }
            .print-text-muted {
              color: #71717a !important;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 12mm 12mm 12mm;
            }
            .print-pb-0 {
              padding-bottom: 0px !important;
            }
          }
        `}</style>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-6 mb-8 print:border-zinc-200 print:pb-4 print:mb-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row mb-4 md:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full print:hidden"></div>
              <img 
                src="/logo.jpg" 
                alt="Golden Goal Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] print:shadow-none print:border-zinc-300"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 print:text-zinc-950 print:bg-none">
                GOLDEN GOAL
              </h1>
              <p className="text-xs sm:text-sm text-white font-bold uppercase tracking-widest print:text-zinc-500">
                Solana's Premier Risk-Free Football Prediction Market
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 font-mono text-[9px] font-bold select-none">
            <span className="bg-gradient-to-r from-[#9945FF]/15 to-[#14F195]/15 text-white border border-[#9945FF]/30 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-[0_0_15px_rgba(153,69,255,0.2)] print:bg-zinc-100 print:text-zinc-700 print:border-zinc-300 print:shadow-none print:animate-none">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] shadow-[0_0_8px_rgba(20,241,149,0.8)]"></span>
              Solana Ecosystem
            </span>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/50 font-mono shadow-[0_0_18px_rgba(52,211,153,0.45)] animate-pulse print:bg-emerald-50 print:text-emerald-700 print:border-emerald-300 print:shadow-none print:animate-none">
              <span className="relative flex h-2 w-2 print:hidden">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-100"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </span>
              COMPLIANCE VERIFIED
            </span>
          </div>
        </div>

        {/* HERO SECTION / THE HOOK */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-8 print-bg-card print:p-5 print:mb-5">
          <h2 className="text-lg font-black tracking-wider text-amber-400 uppercase mb-3 print:text-amber-800">
            📌 Vision & Project Summary
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed print:text-zinc-800">
            Golden Goal is a pioneering <strong className="text-white print:text-zinc-900">Skill-Based Social Prediction Hub</strong> built on Solana, designed to <strong className="text-white print:text-zinc-900">entirely eliminate the financial loss risks</strong> associated with traditional sports betting platforms. Instead of losing or risking capital to make predictions, players hold or lock their tokens in their wallets to unlock active prediction quotas. Fully integrated with the <strong className="text-white print:text-zinc-900">Sportradar Soccer v4 API</strong>, the platform tracks matches in real-time, features 6 granular prediction sub-markets per fixture, and automates result resolution seamlessly under a premium, highly gamified aesthetic.
          </p>
        </div>

        {/* PROBLEM & SOLUTION SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:gap-5 print:mb-5">
          {/* PROBLEM CARD */}
          <div className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-5 space-y-3 print:bg-zinc-50 print:border-zinc-200">
            <div className="flex items-center gap-2 text-red-400 print:text-zinc-800">
              <span className="text-xl">💸</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Critical Industry Problems</h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed print:text-zinc-700 list-disc list-inside">
              <li><strong className="text-zinc-300 print:text-zinc-900">High Financial Risk:</strong> Traditional sports forecasting forces casual fans to constantly risk their own savings, creating high stress.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Manual & Opaque Results:</strong> Outdated systems process results manually, leading to delayed payouts and a lack of real-time sports synchronization.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Passive Sports Tokens:</strong> Existing sports fan tokens lack real utility sinks, daily gamification rewards, or sustainable tokenomics, yielding immense sell pressure.</li>
            </ul>
          </div>

          {/* SOLUTION CARD */}
          <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-5 space-y-3 print:bg-zinc-50 print:border-zinc-200">
            <div className="flex items-center gap-2 text-emerald-400 print:text-zinc-800">
              <span className="text-xl">🛡️</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Golden Goal Solutions</h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed print:text-zinc-700 list-disc list-inside">
              <li><strong className="text-zinc-300 print:text-zinc-900">Zero Loss (0% Risk):</strong> Players submit predictions completely free of charge. Locked tokens are never spent or lost, ensuring a premium risk-free fan loop.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Sportradar Automation:</strong> Automatic scores, live match clock tracking, and background prediction auto-resolution keep the platform fully synchronized.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">6 Sub-Market Forecasts:</strong> Deep engagement through Match Outcome (`MAIN`), Over/Under (`TOTAL_GOALS`), BTTS, First Half Winner, Double Chance, and First Goalscorer.</li>
            </ul>
          </div>
        </div>

        {/* CORE PLATFORM FEATURES */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-8 print-bg-card print:p-5 print:mb-5">
          <h2 className="text-lg font-black tracking-wider text-amber-400 uppercase mb-4 print:text-amber-800">
            ⚡ Core Ecosystem Pillars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-xl">🎯</div>
              <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider print:text-zinc-900">1. Sportradar Predictor & Badges</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">
                Predict global fixtures across 6 active sub-markets with dynamic glow-in-the-dark checkmarks, side-scrolling football legends, and card indicators displaying <code className="text-emerald-400 font-bold">✓ X/6 PREDICTIONS PLACED</code>.
              </p>
            </div>
            <div className="space-y-1.5 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5 print:border-zinc-200">
              <div className="text-xl">🔒</div>
              <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider print:text-zinc-900">2. VIP Multi-Tier Locking</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">
                A robust utility locker (Tiers 0 to 4) offering 1 to 30 day options. Locks grant extra daily prediction limits, XP multipliers (up to 1.25x), and a 10% early breach penalty (50% permanently burned, 50% recycled into weekly pools).
              </p>
            </div>
            <div className="space-y-1.5 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5 print:border-zinc-200">
              <div className="text-xl">🎁</div>
              <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider print:text-zinc-900">3. Rewards Box Module</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">
                A gamified daily drops system awarding massive XP points and booster prediction quotas. Lockers receive deep discounts (up to 75% off), with Tier 4 lockers claiming 1 free box opening every single day.
              </p>
            </div>
          </div>
        </div>

        {/* STAKING/LOCKING TIERS TABLE */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-8 print-bg-card print:p-5 print:mb-5">
          <h2 className="text-lg font-black tracking-wider text-amber-400 uppercase mb-4 print:text-amber-800">
            📈 VIP Token Locking Tiers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-bold print:border-zinc-200 print:text-zinc-800">
                  <th className="py-2.5 px-3">Level (Tier)</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Daily Prediction Limit</th>
                  <th className="py-2.5 px-3">XP Multiplier</th>
                  <th className="py-2.5 px-3">Rewards Box Cost</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300 divide-y divide-white/5 print:text-zinc-800 print:divide-zinc-200">
                <tr>
                  <td className="py-2 px-3 font-semibold print:text-zinc-950">Tier 0 (Holder)</td>
                  <td className="py-2 px-3">Min 10,000 GG in Wallet (No Lock)</td>
                  <td className="py-2 px-3">Base Limit</td>
                  <td className="py-2 px-3">1.0x</td>
                  <td className="py-2 px-3">100 XP</td>
                </tr>
                <tr className="bg-emerald-500/5 print:bg-zinc-100/50">
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Tier 1 (Soft Lock)</td>
                  <td className="py-2 px-3 font-medium">100 GG (1-Day Lock)</td>
                  <td className="py-2 px-3">+1 Prediction / Day</td>
                  <td className="py-2 px-3">1.0x</td>
                  <td className="py-2 px-3">75 XP (25% Off)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-blue-400 print:text-blue-800">Tier 2 (Weekly)</td>
                  <td className="py-2 px-3 font-medium">500 GG (7-Day Lock)</td>
                  <td className="py-2 px-3">+3 Predictions / Day</td>
                  <td className="py-2 px-3">1.0x</td>
                  <td className="py-2 px-3">50 XP (50% Off)</td>
                </tr>
                <tr className="bg-purple-500/5 print:bg-zinc-100/50">
                  <td className="py-2 px-3 font-semibold text-purple-400 print:text-purple-800">Tier 3 (Fortnight)</td>
                  <td className="py-2 px-3 font-medium">1,000 GG (15-Day Lock)</td>
                  <td className="py-2 px-3">+5 Predictions / Day</td>
                  <td className="py-2 px-3">1.1x XP Booster</td>
                  <td className="py-2 px-3">25 XP (75% Off)</td>
                </tr>
                <tr className="bg-yellow-500/5 print:bg-yellow-50/50">
                  <td className="py-2 px-3 font-semibold text-yellow-400 print:text-amber-800">Tier 4 (Monthly)</td>
                  <td className="py-2 px-3 font-medium">5,000 GG (30-Day Lock)</td>
                  <td className="py-2 px-3 font-black">+10 Predictions / Day</td>
                  <td className="py-2 px-3 font-black">1.25x XP Booster ⚡</td>
                  <td className="py-2 px-3 font-black text-yellow-400 print:text-amber-800">1 Free Daily 🎁</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROADMAP & TECH STACK IN TWO COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 print:gap-5 print:mb-0">
          {/* TECHNOLOGY STACK */}
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-5 print-bg-card">
            <h3 className="text-sm font-black tracking-wider text-amber-400 uppercase mb-3 print:text-amber-800">
              🛠️ Robust Infrastructure & Security
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400 print:text-zinc-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">✔</span>
                <span><strong className="text-zinc-200 print:text-zinc-900">Sportradar Enterprise Engine:</strong> Integrates Soccer v4 API feeds with server-side 60-second caching, optimizing trial key limits to preserve quota.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">✔</span>
                <span><strong className="text-zinc-200 print:text-zinc-900">Cryptographic Signatures (`tweetnacl`):</strong> Uses Ed25519 signatures to verify lock/unlock requests, securely preventing any wallet impersonation or bot requests on server APIs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">✔</span>
                <span><strong className="text-zinc-200 print:text-zinc-900">AWS Cloud Isolation:</strong> Secure private subnets, advanced firewall shields, and VPC setups protect user prediction logs and profiles from DDoS spikes.</span>
              </li>
            </ul>
          </div>

          {/* ROADMAP PLAN */}
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-5 print-bg-card">
            <h3 className="text-sm font-black tracking-wider text-amber-400 uppercase mb-3 print:text-amber-800">
              📅 Growth Roadmap
            </h3>
            <div className="space-y-3 text-[11px] text-zinc-400 print:text-zinc-700 font-medium">
              <div className="flex items-center justify-between border-b border-white/5 pb-1 print:border-zinc-200">
                <span>Phase 1: Foundation (Solana adapter & visual rail setup)</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-emerald-50 print:text-emerald-800">Completed</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1 print:border-zinc-200">
                <span>Phase 2: Launch (Twitter Farming & Pro/Social Boards)</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-emerald-50 print:text-emerald-800">Completed</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1 print:border-zinc-200">
                <span>Phase 3: Live Sync (Sportradar, 6 Sub-Markets, Tiers 1-4)</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-emerald-50 print:text-emerald-800">Completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phase 4: Expansion (Dedicated Mobile Apps & custom avatars)</span>
                <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-yellow-50 print:text-yellow-800">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* PREMIUM LEGAL COMPLIANCE SHIELD CARD */}
        <div className="w-full mt-8 p-5 rounded-2xl bg-zinc-950/60 border border-yellow-500/10 hover:border-yellow-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.02)] transition-all duration-300 select-none text-left flex items-start gap-4 group print-bg-card">
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/20 group-hover:scale-105 transition-all duration-300 print:bg-yellow-500/[0.05] print:border-zinc-300">
            <svg className="w-6 h-6 text-amber-400 print:text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black tracking-widest text-amber-400 font-mono uppercase print:text-amber-800">⚖️ Legal Notice & Compliance Shield</span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/50 font-mono shadow-[0_0_18px_rgba(52,211,153,0.45)] print:bg-emerald-50 print:text-emerald-700 print:border-emerald-300">
                COMPLIANCE VERIFIED
              </span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-zinc-400 print:text-zinc-700">
              <strong className="text-zinc-200 print:text-zinc-900">NO PURCHASE NECESSARY.</strong> Void where prohibited by law. Standard daily prediction quotas are allocated free of charge. Platform operations strictly simulate a football analytical index. Leaderboards are decided 100% based on predictive foresight, football acumen, and data modelling—completely free of capital hazard or chance elements.
            </p>
          </div>
        </div>

        {/* FOOTER & CTA */}
        <div className="mt-8 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 print:border-zinc-200 print:text-zinc-600 print:pt-3 print:pb-0">
          <div className="mb-2 sm:mb-0 text-center sm:text-left print:text-left">
            <span>© 2026 Golden Goal. All Rights Reserved.</span>
            <span className="mx-2 hidden sm:inline">•</span>
            <span className="text-zinc-400 print:text-zinc-700">Not by Chance, but by Skill & Analysis.</span>
          </div>
          
          <div className="flex items-center gap-4 text-zinc-400 print:text-zinc-800 font-bold font-mono">
            <span>X.com: @GoldenGoal</span>
            <span>•</span>
            <span>Telegram: t.me/GoldenGoalSol</span>
          </div>
        </div>

      </div>
    </div>
  );
}
