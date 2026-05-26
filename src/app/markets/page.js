"use client";

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { TEAM_FLAGS } from '@/lib/flags';

export default function Home() {
  const { connected } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFutureMatches, setShowFutureMatches] = useState(false);

  useEffect(() => {
    fetch('/api/markets')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMarkets(data.markets);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load markets:", err);
        setLoading(false);
      });
  }, []);

  const groupedMarkets = [];
  markets.filter(m => m.status === 'ACTIVE').forEach(m => {
      const dateObj = new Date(m.matchDate);
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      let group = groupedMarkets.find(g => g.date === dateStr);
      if (!group) {
          group = { date: dateStr, matches: [] };
          groupedMarkets.push(group);
      }
      group.matches.push({
          ...m,
          timeStr: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          isLocked: dateObj.getTime() < Date.now()
      });
  });

  const resolvedMarkets = markets.filter(m => m.status !== 'ACTIVE');
  const initialGroups = groupedMarkets.slice(0, 3);
  const futureGroups = groupedMarkets.slice(3);

  const renderMatchGroup = (group, idx) => (
      <div key={group.date + idx} className="mb-12">
          <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">{group.date}</h2>
              <div className="flex-1 h-px bg-zinc-800"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.matches.map((m) => (
                  <Link href={`/markets/${m.id}`} key={m.id} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden flex flex-col items-center gap-6 block cursor-pointer">
                      
                      {/* Match Info */}
                      <div className="w-full text-center">
                          <span className="text-sm font-mono text-zinc-500 mb-2 block">{m.timeStr} GMT</span>
                          <div className="flex items-center justify-center gap-6 text-xl font-bold">
                              <div className="flex flex-col items-center gap-1">
                                  <span className="text-3xl drop-shadow-md">{TEAM_FLAGS[m.teamA] || '🏳️'}</span>
                                  <span>{m.teamA}</span>
                              </div>
                              <span className="text-zinc-600 text-sm font-normal">vs</span>
                              <div className="flex flex-col items-center gap-1">
                                  <span className="text-3xl drop-shadow-md">{TEAM_FLAGS[m.teamB] || '🏳️'}</span>
                                  <span>{m.teamB}</span>
                              </div>
                          </div>
                      </div>

                      {/* Prediction Action Buttons */}
                      <div className="flex w-full gap-2 mt-2">
                          <button 
                              disabled={m.isLocked}
                              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent text-white font-medium py-3 px-4 rounded-xl transition-all"
                          >
                              {m.isLocked ? 'LOCKED' : 'View Markets'}
                          </button>
                      </div>
                      
                      {m.isLocked && (
                          <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-red-500/20">
                              LOCKED
                          </div>
                      )}
                  </Link>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative py-28 px-4 text-center">
        <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 via-black/60 to-[#0A0A0A]"></div>
        <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Predict the <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">World Cup</span>
            </h1>
            <p className="text-zinc-300 font-medium text-lg md:text-xl max-w-2xl mx-auto mb-10 text-shadow-sm">
            Hold Golden Tokens to place free predictions on FIFA World Cup 2026 matches. 
            Correct predictions earn you points and rank you up the leaderboard.
            </p>
            
            {connected ? (
            <div className="inline-block bg-zinc-900/60 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
                <h3 className="text-xl font-medium text-amber-400 mb-2">Wallet Connected</h3>
                <p className="text-zinc-300">Scroll down to lock in your predictions.</p>
            </div>
            ) : (
            <button className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                Connect to Predict
            </button>
            )}
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-12 px-4 max-w-5xl mx-auto w-full">
        
        {loading ? (
            <div className="text-center text-zinc-500">Loading matches from database...</div>
        ) : (
            <>
              {/* Active Markets */}
              <div className="mb-16">
                {initialGroups.map(renderMatchGroup)}
                
                {futureGroups.length > 0 && (
                    <div className="mt-8 flex flex-col items-center">
                        <button 
                            onClick={() => setShowFutureMatches(!showFutureMatches)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3 px-8 rounded-full transition-all flex items-center gap-2 mb-8"
                        >
                            {showFutureMatches ? 'Hide Upcoming Matches' : 'Upcoming Matches'}
                            <span className={`transform transition-transform ${showFutureMatches ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        {showFutureMatches && futureGroups.map(renderMatchGroup)}
                    </div>
                )}
                
                {groupedMarkets.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">No active matches right now.</div>
                )}
              </div>

              {/* Resolved Markets */}
              <h2 className="text-2xl font-bold mb-8 text-zinc-500">Resolved Matches</h2>
              <div className="flex flex-col gap-4 opacity-70">
                {resolvedMarkets.map((m) => (
                    <div key={m.id} className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 grayscale-[50%]">
                        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>
                        
                        <div className="flex-1 w-full text-center md:text-left relative z-20">
                            <span className="text-sm font-mono text-zinc-600 mb-2 block">{new Date(m.matchDate).toLocaleDateString('en-GB')}</span>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-xl font-bold text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl opacity-70">{TEAM_FLAGS[m.teamA] || '🏳️'}</span>
                                    <span>{m.teamA}</span>
                                </div>
                                <span className="text-zinc-700 text-sm font-normal">vs</span>
                                <div className="flex items-center gap-2">
                                    <span>{m.teamB}</span>
                                    <span className="text-2xl opacity-70">{TEAM_FLAGS[m.teamB] || '🏳️'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center items-center py-3 px-6 bg-zinc-900 rounded-xl border border-zinc-800 relative z-20">
                            <span className="font-bold text-green-500">
                                ✓ {m.status.replace('RESOLVED_', '').toUpperCase()} WON
                            </span>
                        </div>
                    </div>
                ))}
                {resolvedMarkets.length === 0 && (
                    <div className="text-center py-8 text-zinc-600">No past matches yet.</div>
                )}
              </div>
            </>
        )}
      </section>

    </div>
  );
}
