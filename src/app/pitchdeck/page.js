"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Golden Goal",
      subtitle: "The Future of Decentralized Football Prediction Economies on Solana",
      type: "intro",
      content: (
        <div className="flex flex-col items-center justify-center text-center h-full space-y-8 select-none">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full"></div>
            <img 
              src="/logo.jpg" 
              alt="Golden Goal Logo" 
              className="w-24 h-24 rounded-full object-cover border-2 border-yellow-500/30 shadow-[0_0_50px_rgba(245,158,11,0.35)] hover:scale-105 transition-all duration-500"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
              GOLDEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">GOAL</span>
            </h2>
            <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto font-medium">
              Transforming football passion into a risk-free, highly gamified social prediction ecosystem on Solana.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 text-[10px] tracking-widest text-amber-400/80 font-bold bg-amber-500/5 px-4 py-2.5 rounded-full border border-amber-500/10">
            <span>SOLANA PROTOCOL</span>
            <span>•</span>
            <span>SPORTRADAR AUTOMATION</span>
            <span>•</span>
            <span>6 SUB-MARKETS</span>
            <span>•</span>
            <span>AWS PRIVATE VPC</span>
          </div>
        </div>
      )
    },
    {
      title: "The Problem",
      subtitle: "Traditional sports forecasting platforms are high-risk, expensive, and isolated.",
      type: "problem",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl space-y-2">
            <span className="text-xl">💸</span>
            <h4 className="font-bold text-red-400">High Financial Risk</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Casual fans are forced to constantly risk their own savings just to forecast match outcomes, creating high stress and bad experiences.
            </p>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl space-y-2">
            <span className="text-xl">🪘</span>
            <h4 className="font-bold text-red-400">Isolated Action</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Players make predictions in complete isolation. Legacy sites lack SocialFi integration, communal rewards, and viral feedback loops.
            </p>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl space-y-2">
            <span className="text-xl">⏳</span>
            <h4 className="font-bold text-red-400">Manual & Opaque Results</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Outdated operations process matches manually, leading to delayed payouts, stale data, and zero live score synchronization.
            </p>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl space-y-2">
            <span className="text-xl">🥀</span>
            <h4 className="font-bold text-red-400">Empty Speculative Tokens</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Most existing Web3 fan tokens lack concrete platform utility sinks, daily gamification loops, or deflationary mechanisms, driving high sell pressure.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "The Solution",
      subtitle: "A risk-free predictive matrix rewarding accuracy and social engagement.",
      type: "solution",
      content: (
        <div className="space-y-6 w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl text-center space-y-2">
              <span className="text-3xl">🛡️</span>
              <h4 className="font-bold text-emerald-400 text-sm">0% Capital Risk</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Users hold or lock $GoldenGoal. Capital is never lost or spent, creating a completely safe, stress-free prediction environment.
              </p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl text-center space-y-2">
              <span className="text-3xl">⚡</span>
              <h4 className="font-bold text-emerald-400 text-sm">Sportradar Live Sync</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Automated scores, live clocks, and background prediction auto-resolution keep fixtures synchronized in real-time.
              </p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl text-center space-y-2">
              <span className="text-3xl">🏆</span>
              <h4 className="font-bold text-emerald-400 text-sm">Ecosystem Utility</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Top 10 analysts on leadership boards claim weekly rewards. Staking locks increase prediction quotas and boost XP.
              </p>
            </div>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-center text-xs text-zinc-400">
            <strong>The Result:</strong> Football enthusiasts predict outcomes across 6 markets, unlock passive multipliers, and open Rewards Boxes with zero capital hazard.
          </div>
        </div>
      )
    },
    {
      title: "The Product & High-Fidelity UI",
      subtitle: "Cinematic football oracle dashboard engineered for maximum wow factor.",
      type: "product",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">🎯</span>
              <h4 className="font-bold text-white text-sm">6 Forecasting Sub-Markets</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Enables forecasts across 6 active markets: Match Outcome (`1X2`), Over/Under (`TOTAL_GOALS`), BTTS, First Half Result, Double Chance, and First Goalscorer.
            </p>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">🌟</span>
              <h4 className="font-bold text-white text-sm">Premium Aesthetics & Badges</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Side rails with rotating football legends (Maradona, Buffon, Gerrard, Mbappe, etc.), glassmorphic UI, and the dynamic card indicator badge showing <code className="text-emerald-400 font-bold">✓ X/6 PREDICTIONS PLACED</code>.
            </p>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">🎁</span>
              <h4 className="font-bold text-white text-sm">Rewards Box Module</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              A daily drop chest awarding booster XP and extra prediction quotas, with deep discounts up to 75% or free daily openings for Tier 4 lockers.
            </p>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">📊</span>
              <h4 className="font-bold text-white text-sm">Real-Time User Dashboard</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Tracks Win Rates, locking metrics, and prediction histories. Canceled matches are dynamically filtered out of success rates to ensure fair competition.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Why Solana?",
      subtitle: "Unmatched performance to onboard the next 100M sports fans.",
      type: "solana",
      content: (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl">
              <div className="text-2xl font-black text-amber-400 font-mono">&lt; 400ms</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Block Time</div>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl">
              <div className="text-2xl font-black text-amber-400 font-mono">$0.0002</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Avg Gas Fee</div>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl">
              <div className="text-2xl font-black text-amber-400 font-mono">65,000+</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Peak TPS</div>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 rounded-r-2xl space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>⚡</span> Mass-Market Onboarding
            </h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              By using Solana, Golden Goal completely bypasses the gas friction and latency associated with legacy blockchains, giving users instant transaction feedback and seamless Phantom/Solflare wallet connectivity.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Locking Economy",
      subtitle: "Multi-Tiered lock mechanisms driving core token utility.",
      type: "staking",
      content: (
        <div className="space-y-6 w-full max-w-3xl mx-auto">
          <div className="overflow-hidden border border-white/5 rounded-2xl text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 border-b border-white/5">
                  <th className="p-3 font-semibold">Tier Level</th>
                  <th className="p-3 font-semibold">Requirement</th>
                  <th className="p-3 font-semibold">Daily Prediction Limit</th>
                  <th className="p-3 font-semibold">XP Points Booster</th>
                  <th className="p-3 font-semibold">Rewards Box Perks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-zinc-950/40 font-mono">
                <tr><td className="p-3 font-sans text-zinc-300">Tier 0 (Holder)</td><td className="p-3">Min 250,000 GG in Wallet</td><td className="p-3">3 Predictions</td><td className="p-3 text-zinc-500">1.0x</td><td className="p-3">100 XP / Open</td></tr>
                <tr><td className="p-3 font-sans text-zinc-300">Tier 1 (Soft)</td><td className="p-3">Min 350,000 GG (1-Day Lock)</td><td className="p-3 text-emerald-400">+1 Prediction</td><td className="p-3 text-zinc-500">1.0x</td><td className="p-3">75 XP (25% Off)</td></tr>
                <tr><td className="p-3 font-sans text-zinc-300">Tier 2 (7-Day)</td><td className="p-3">Min 500,000 GG (7-Day Lock)</td><td className="p-3 text-emerald-400">+3 Predictions</td><td className="p-3 text-zinc-500">1.0x</td><td className="p-3">50 XP (50% Off)</td></tr>
                <tr><td className="p-3 font-sans text-zinc-300">Tier 3 (15-Day)</td><td className="p-3">Min 750,000 GG (15-Day Lock)</td><td className="p-3 text-emerald-400">+5 Predictions</td><td className="p-3 text-blue-400">1.1x XP</td><td className="p-3">25 XP (75% Off)</td></tr>
                <tr><td className="p-3 font-sans text-amber-400 font-semibold">Tier 4 (30-Day)</td><td className="p-3 font-bold">Min 1,000,000 GG (30-Day Lock)</td><td className="p-3 text-emerald-400 font-bold">+10 Predictions</td><td className="p-3 text-blue-400 font-bold">1.25x XP</td><td className="p-3 text-amber-400 font-bold">1 Free Daily Box (then 25 XP)</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            LOCKING DRIVES HIGHER DAILY PREDICTION LIMITS & SIGNIFICANT REWARDS BOX DISCOUNT UTILITIES
          </div>
        </div>
      )
    },
    {
      title: "Tokenomics",
      subtitle: "Deflationary token sinks designed for long-term price appreciation.",
      type: "tokenomics",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mx-auto">
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-2">
            <span className="text-2xl">🔥</span>
            <h4 className="font-bold text-amber-400 text-sm">Lock Breach Penalty</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Early unlocking triggers a 10% penalty fee: <strong>50% is permanently burned</strong>, contracting circulating supply, and 50% returns directly back to weekly rewards.
            </p>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-2">
            <span className="text-2xl">⚙️</span>
            <h4 className="font-bold text-amber-400 text-sm">Ecosystem Sinks</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              $GoldenGoal is locked within utility contracts to increase limits, while daily Rewards Box openings consume accumulated XP, creating active point-based loops.
            </p>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-2">
            <span className="text-2xl">🛡️</span>
            <h4 className="font-bold text-amber-400 text-sm">Fair Launch Standard</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              <strong>Zero locked pre-sale tokens</strong> scheduled to be released or dumped onto the market. All active circulating tokens represent organic players and lockers.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Viral Social Loop",
      subtitle: "Turning every participant into an organic marketer.",
      type: "viral",
      content: (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-zinc-900 border border-white/5 p-5 rounded-2xl">
            <div className="sm:w-1/2 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span>📈</span> Twitter Farming Hub
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Users share custom referral links or tweet about Golden Goal on X using the hashtag <strong>#GoldenGoal</strong>. They paste their tweet URL to claim 25 Social Points instantly.
              </p>
            </div>
            <div className="sm:w-1/2 space-y-2 bg-black/40 border border-white/5 p-4 rounded-xl">
              <h5 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sybil Prevention Engine</h5>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                The database logs all submitted URLs globally, completely blocking duplicates. A strict 60-second rate-limiting cooldown per user stops bot farming.
              </p>
            </div>
          </div>
          <div className="text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            TWITTER FARMING GROWS THE TELEGRAM AND ACTIVE WALLET SIGN-UPS ORGANICALLY
          </div>
        </div>
      )
    },
    {
      title: "Infrastructure & Caching",
      subtitle: "Enterprise AWS cloud architecture with smart quota protection.",
      type: "infrastructure",
      content: (
        <div className="space-y-6 w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl space-y-2">
              <div className="text-2xl">⚡</div>
              <h4 className="font-bold text-white text-xs">High Availability</h4>
              <p className="text-zinc-500 text-[10px]">Hosted on premium AWS server clusters ensuring 99.99% operational uptime.</p>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl space-y-2">
              <div className="text-2xl">🛡️</div>
              <h4 className="font-bold text-white text-xs">Isolated VPC Shield</h4>
              <p className="text-zinc-500 text-[10px]">Isolated network VPC with advanced firewalls preventing raw DDoS attacks.</p>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl space-y-2">
              <div className="text-2xl">🏦</div>
              <h4 className="font-bold text-white text-xs">60-Second API Caching</h4>
              <p className="text-zinc-500 text-[10px]">In-memory server caching protects Sportradar limits, consuming only ~115 hits per full match.</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 p-4 rounded-r-xl text-left text-xs text-zinc-400 leading-relaxed">
            By choosing AWS and smart server-side caching, Golden Goal guarantees instant score feeds, fast database write/read queries, and premium cyber defense required for modern global Web3 applications.
          </div>
        </div>
      )
    },
    {
      title: "Roadmap",
      subtitle: "A 5-phase growth strategy to dominate sports gaming.",
      type: "roadmap",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 w-full max-w-4xl mx-auto text-center">
          <div className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-xl space-y-1 relative">
            <span className="absolute top-2 right-2 text-emerald-500 text-xs">✓</span>
            <div className="text-[10px] text-emerald-500 font-bold">PHASE 1</div>
            <div className="font-bold text-white text-[11px] leading-tight">Foundation</div>
            <div className="text-[9px] text-zinc-500">Solana config, www.goldengoalsol.com, cinematic intro.</div>
          </div>
          <div className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-xl space-y-1 relative">
            <span className="absolute top-2 right-2 text-emerald-500 text-xs">✓</span>
            <div className="text-[10px] text-emerald-500 font-bold">PHASE 2</div>
            <div className="font-bold text-white text-[11px] leading-tight">Launch</div>
            <div className="text-[9px] text-zinc-500">Weekly rewards, Twitter Farming, wallet adapter integration.</div>
          </div>
          <div className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-xl space-y-1 relative">
            <span className="absolute top-2 right-2 text-emerald-500 text-xs">✓</span>
            <div className="text-[10px] text-emerald-500 font-bold">PHASE 3</div>
            <div className="font-bold text-white text-[11px] leading-tight">DeFi & Live Sync</div>
            <div className="text-[9px] text-zinc-500">Sportradar auto-resolving, 6 sub-markets, Tiers 1-4, Rewards Box.</div>
          </div>
          <div className="bg-zinc-900/80 border border-amber-500/30 p-4 rounded-xl space-y-1 relative">
            <span className="absolute top-2 right-2 text-amber-500 text-[9px] animate-pulse">⏳</span>
            <div className="text-[10px] text-amber-500 font-bold">PHASE 4</div>
            <div className="font-bold text-white text-[11px] leading-tight">Expansion</div>
            <div className="text-[9px] text-zinc-500">Dedicated mobile apps, bracket contests, NFT custom avatars.</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold">PHASE 5</div>
            <div className="font-bold text-white text-[11px] leading-tight">DAO & Growth</div>
            <div className="text-[9px] text-zinc-500">DAO governance enabled, global sports, esports markets.</div>
          </div>
        </div>
      )
    },
    {
      title: "Join the Future",
      subtitle: "Let's build the next giant sports prediction ecosystem.",
      type: "cta",
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto h-full">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <span className="text-black font-black text-2xl">G</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Partner with Golden Goal</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              We are opening active channels for strategic launchpads, sports influencers, Solana ecosystems, and long-term liquidity partners. Let's score some Golden Goals!
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full pt-4">
            <a href="https://www.goldengoalsol.com" className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-zinc-300 transition-colors uppercase tracking-wider">Website</a>
            <a href="https://x.com" className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-zinc-300 transition-colors uppercase tracking-wider">Twitter (X)</a>
            <Link href="/docs" className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-zinc-300 transition-colors uppercase tracking-wider">Whitepaper</Link>
            <a href="mailto:info@goldengoalsol.com" className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-2.5 rounded-xl text-[10px] font-extrabold transition-colors uppercase tracking-wider">Email Us</a>
          </div>
        </div>
      )
    }
  ];

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  return (
    <div className="flex-1 w-full bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 md:py-16 relative overflow-hidden min-h-screen">
      
      {/* Background glowing orb */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-amber-500/10 via-yellow-600/5 to-transparent blur-[120px]"></div>
      </div>

      {/* Main Pitch Deck Wrapper */}
      <div className="w-full max-w-5xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl rounded-[32px] p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col justify-between min-h-[560px]">
        
        {/* Slide Top Progress bar & Header */}
        <div className="w-full space-y-4">
          
          {/* Progress Bar & Indicators */}
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest uppercase">
              GOLDEN GOAL PITCH DECK
            </span>
            <div className="flex-1 max-w-md h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 font-mono">
              {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>

          {/* Dynamic slide titles */}
          {slides[currentSlide].type !== "intro" && (
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {slides[currentSlide].title}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {slides[currentSlide].subtitle}
              </p>
            </div>
          )}

        </div>

        {/* Slide Content Space with Animation Trigger */}
        <div className="flex-1 py-8 flex flex-col justify-center transition-all duration-300">
          {slides[currentSlide].content}
        </div>

        {/* Slide Bottom Controls */}
        <div className="w-full border-t border-white/5 pt-4 flex items-center justify-between gap-4">
          
          {/* Back to Home Link */}
          <Link 
            href="/" 
            className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-widest"
          >
            ← Exit Deck
          </Link>

          {/* Swipe / Key Instruction for VCs */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <span>Use Left / Right arrow keys to navigate</span>
          </div>

          {/* Back/Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-prev-slide"
              onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))}
              disabled={currentSlide === 0}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-semibold text-zinc-300 transition-colors uppercase tracking-wider"
            >
              Prev
            </button>
            <button
              id="btn-next-slide"
              onClick={() => setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev))}
              disabled={currentSlide === slides.length - 1}
              className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-extrabold text-black transition-all hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)] uppercase tracking-wider"
            >
              Next
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
