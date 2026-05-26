"use client";

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="text-center w-full max-w-4xl mx-auto mb-24 mt-8">
        <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tight">
          Predict the Future, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600">
            Win Golden Goals
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate decentralized prediction market on Solana. Bet on sports, politics, and crypto events. Fast settlements, zero hidden fees, and transparent payouts.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link 
            href="/markets" 
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold py-4 px-10 rounded-full text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            Launch App
          </Link>
          <Link 
            href="/docs" 
            className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold py-4 px-10 rounded-full text-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Read Whitepaper
          </Link>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full mb-32 pt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">Three simple steps to predict risk-free, climb the ranks, and earn massive rewards.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="text-5xl mb-6">🏦</div>
            <h3 className="text-xl font-bold mb-3 text-white">1. Hold & Stake</h3>
            <p className="text-zinc-400 leading-relaxed">
              Hold Golden Tokens in your Phantom wallet to unlock daily free predictions. Stake your tokens to earn massive point multipliers and extra prediction limits.
            </p>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="text-5xl mb-6">🎯</div>
            <h3 className="text-xl font-bold mb-3 text-white">2. Predict Risk-Free</h3>
            <p className="text-zinc-400 leading-relaxed">
              Use your daily quota to predict World Cup matches and other real-world outcomes. Your tokens are never spent or lost—predictions are completely risk-free.
            </p>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
            <div className="text-5xl mb-6">🏆</div>
            <h3 className="text-xl font-bold mb-3 text-white">3. Climb & Earn</h3>
            <p className="text-zinc-400 leading-relaxed">
              Earn Experience Points (XP) for every correct prediction. Rank high on the global Leaderboard to claim massive Golden Token payouts from the Community Treasury.
            </p>
          </div>
        </div>
      </section>



      {/* Roadmap Section */}
      <section className="w-full mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Roadmap</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">Our journey to becoming the leading Web3 prediction platform.</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900 border border-white/5 rounded-3xl p-8">
            <div className="sm:w-1/3">
              <h3 className="text-zinc-500 font-bold tracking-widest text-xl mb-2">PHASE 1</h3>
            </div>
            <div className="sm:w-2/3">
              <ul className="text-zinc-400 space-y-3 text-lg font-medium">
                <li className="flex items-center gap-3"><span className="text-green-500 font-black text-xl">✓</span> Infrastructure setup</li>
                <li className="flex items-center gap-3"><span className="text-green-500 font-black text-xl">✓</span> Website design</li>
                <li className="flex items-center gap-3"><span className="text-green-500 font-black text-xl">✓</span> Solana integration</li>
                <li className="flex items-center gap-3"><span className="text-green-500 font-black text-xl">✓</span> World Cup matches listing</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 bg-gradient-to-r from-zinc-900 to-black border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            <div className="sm:w-1/3">
              <h3 className="text-amber-500 font-bold tracking-widest text-xl mb-2">PHASE 2</h3>
            </div>
            <div className="sm:w-2/3">
              <ul className="text-zinc-400 space-y-3 text-lg font-medium">
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Presale launch</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Betting opening</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Staking opening</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Ad & marketing campaigns</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900 border border-white/5 rounded-3xl p-8">
            <div className="sm:w-1/3">
              <h3 className="text-zinc-500 font-bold tracking-widest text-xl mb-2">PHASE 3</h3>
            </div>
            <div className="sm:w-2/3">
              <ul className="text-zinc-400 space-y-3 text-lg font-medium">
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Rewards distribution</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Expanding giveaways</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Ad & marketing campaigns</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Polymarket integration</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> T1 Partnerships</li>
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Big Burn Event</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full text-center py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold mb-6">Ready to make your first prediction?</h2>
        <Link 
            href="/markets" 
            className="inline-block bg-white text-black font-bold py-4 px-12 rounded-full text-lg transition-transform hover:scale-105"
          >
            Enter App
          </Link>
      </section>

    </div>
  );
}
