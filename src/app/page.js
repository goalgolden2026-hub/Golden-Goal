"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const tokenomicsData = [
    { id: 'presale', label: 'Presale', percentage: 40, tokens: '400M Tokens', color: '#F59E0B' },
    { id: 'dex', label: 'DEX Liquidity', percentage: 20, tokens: '200M Tokens', color: '#3B82F6' },
    { id: 'rewards', label: 'Rewards & Giveaways', percentage: 20, tokens: '200M Tokens', color: '#10B981' },
    { id: 'dev', label: 'Development', percentage: 10, tokens: '100M Tokens', color: '#8B5CF6' },
    { id: 'marketing', label: 'Marketing & Advisors', percentage: 10, tokens: '100M Tokens', color: '#EC4899' },
  ];

  const radius = 100;
  const strokeWidth = 40;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const handleMouseMove = (e, slice) => {
    setHoveredSlice(slice);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
  };

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
          <a 
            href="#how-it-works" 
            className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold py-4 px-10 rounded-full text-lg transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full mb-32 pt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">Three simple steps to start earning by predicting real-world outcomes.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="text-5xl mb-6">👛</div>
            <h3 className="text-xl font-bold mb-3 text-white">1. Connect Wallet</h3>
            <p className="text-zinc-400 leading-relaxed">
              Link your Solana wallet like Phantom safely. No sign-ups or KYC required. Your funds, your control.
            </p>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="text-5xl mb-6">🎯</div>
            <h3 className="text-xl font-bold mb-3 text-white">2. Make a Prediction</h3>
            <p className="text-zinc-400 leading-relaxed">
              Browse active markets and place your bet on the outcome you believe in. Lock in your position instantly.
            </p>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
            <div className="text-5xl mb-6">🏆</div>
            <h3 className="text-xl font-bold mb-3 text-white">3. Claim Rewards</h3>
            <p className="text-zinc-400 leading-relaxed">
              If your prediction is correct, the smart contract automatically distributes your Golden Token winnings.
            </p>
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="w-full mb-32 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tokenomics</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">1 Billion Total Supply. Designed for long-term sustainability and community growth.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto">
          {/* Interactive SVG Donut Chart */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Glow effect behind the chart */}
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-amber-500 via-blue-500 to-pink-500"></div>
            
            <svg viewBox="0 0 300 300" className="w-full h-full transform -rotate-90 z-10 drop-shadow-2xl">
              {tokenomicsData.map((slice) => {
                const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += (slice.percentage / 100) * circumference;

                const isHovered = hoveredSlice?.id === slice.id;

                return (
                  <circle
                    key={slice.id}
                    cx="150"
                    cy="150"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 10 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 ease-out cursor-pointer origin-center"
                    style={{ pointerEvents: 'stroke' }}
                    onMouseMove={(e) => handleMouseMove(e, slice)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </svg>

            {/* Inner Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Total Supply</span>
              <span className="text-lg font-extrabold text-white mt-1">1,000,000,000</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-4 w-full max-w-md">
            {tokenomicsData.map((slice) => {
              const isHovered = hoveredSlice?.id === slice.id;
              return (
                <div 
                  key={slice.id}
                  className={`border rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${
                    isHovered 
                      ? 'bg-zinc-800 border-zinc-600 scale-105 shadow-lg' 
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'
                  }`}
                  onMouseMove={(e) => handleMouseMove(e, slice)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full transition-shadow duration-300" 
                      style={{ 
                        backgroundColor: slice.color,
                        boxShadow: isHovered ? `0 0 15px ${slice.color}` : `0 0 5px ${slice.color}80`
                      }}
                    ></div>
                    <span className={`font-medium ${isHovered ? 'text-white' : 'text-zinc-300'}`}>{slice.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold" style={{ color: slice.color }}>{slice.percentage}%</span>
                    <span className="text-xs text-zinc-500">{slice.tokens}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Tooltip */}
        {hoveredSlice && (
          <div 
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-4"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-700 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-200">
              <span className="text-white font-bold">{hoveredSlice.label}</span>
              <div className="h-px w-full bg-zinc-800 my-1"></div>
              <span className="text-2xl font-black" style={{ color: hoveredSlice.color }}>
                {hoveredSlice.tokens}
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">{hoveredSlice.percentage}% of Supply</span>
            </div>
          </div>
        )}
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
                <li className="flex items-center gap-3"><span className="text-green-500 font-black text-xl">✓</span> Betting opening</li>
                <li className="flex items-center gap-3"><span className="text-green-500 font-black text-xl">✓</span> Staking opening</li>
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
                <li className="flex items-center gap-3"><span className="text-zinc-600 font-black text-xl">⏳</span> Polymarket integration</li>
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
