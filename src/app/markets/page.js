"use client";

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TEAM_FLAGS } from '@/lib/flags';

function MarketsContent() {
  const { connected } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'live';

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

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/markets/live-scores');
        const data = await res.json();
        if (data.success) setScores(data.scores);
      } catch (err) {
        console.error("Failed to fetch live scores:", err);
      }
    };
    fetchScores();
    const interval = setInterval(fetchScores, 60 * 1000);
    return () => clearInterval(interval);
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
  
  // Separator: first 3 groups (Live/Active), remaining groups (Upcoming)
  const initialGroups = groupedMarkets.slice(0, 3);
  const futureGroups = groupedMarkets.slice(3);

  const displayedGroups = filter === 'upcoming' ? futureGroups : initialGroups;
  const isUpcomingMode = filter === 'upcoming';

  const renderMatchGroup = (group, idx) => (
      <div key={group.date + idx} className="mb-12">
          <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-zinc-100">{group.date}</h2>
              <div className="flex-1 h-px bg-zinc-800"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.matches.map((m) => {
                  const isMexicoSA = m.teamA === 'Mexico' && m.teamB === 'South Africa';
                  const scoreInfo = scores[m.id];
                  
                  return (
                    <Link 
                      href={`/markets/${m.id}`} 
                      key={m.id} 
                      className={`backdrop-blur-md border transition-all duration-500 relative overflow-hidden flex flex-col items-center gap-6 block cursor-pointer rounded-3xl p-6 group ${
                        isMexicoSA 
                          ? 'border-yellow-600/30 hover:border-yellow-500/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_40px_rgba(245,158,11,0.1)] hover:scale-[1.01]' 
                          : 'border-zinc-800/80 hover:border-blue-500/40 shadow-[0_4px_25px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] hover:scale-[1.01]'
                      }`}
                      style={{
                        backgroundImage: "linear-gradient(to bottom, rgba(10, 10, 10, 0.4), rgba(10, 10, 10, 0.85)), url('/default-stadium-bg.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                        
                        {/* Match Info */}
                        <div className="w-full text-center relative z-10">
                            {scoreInfo ? (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                                        • LIVE {scoreInfo.status === 'HT' ? 'HT' : scoreInfo.status === 'FT' ? 'FT' : `${scoreInfo.elapsed}'`}
                                    </span>
                                </div>
                            ) : (
                                <span className={`text-sm font-mono mb-2 block ${isMexicoSA ? 'text-zinc-400 font-medium' : 'text-zinc-500'}`}>{m.timeStr} GMT</span>
                            )}
                            <div className="flex items-center justify-center gap-6 text-xl font-bold">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-3xl drop-shadow-md">{TEAM_FLAGS[m.teamA] || '🏳️'}</span>
                                    <span className="text-zinc-100 font-semibold">{m.teamA}</span>
                                </div>
                                {scoreInfo ? (
                                    <div className="flex flex-col items-center justify-center px-3 min-w-[80px]">
                                        <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.45)] tracking-tight">
                                            {scoreInfo.goalsA} - {scoreInfo.goalsB}
                                        </span>
                                    </div>
                                ) : (
                                    <span className={isMexicoSA ? "text-amber-500 text-xs font-black tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20" : "text-zinc-400 text-sm font-semibold"}>
                                        {isMexicoSA ? 'VS' : 'vs'}
                                    </span>
                                )}
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-3xl drop-shadow-md">{TEAM_FLAGS[m.teamB] || '🏳️'}</span>
                                    <span className="text-zinc-100 font-semibold">{m.teamB}</span>
                                </div>
                            </div>
                        </div>

                        {/* Prediction Action Buttons */}
                        <div className="flex w-full gap-2 mt-2 relative z-10">
                            <button 
                                disabled={m.isLocked}
                                className="w-full py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {m.isLocked ? (
                                  'LOCKED'
                                ) : (
                                  <>
                                    <span>View Markets</span>
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                  </>
                                )}
                            </button>
                        </div>
                        
                        {m.isLocked && (
                            <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-red-500/20 z-20">
                                LOCKED
                            </div>
                        )}
                    </Link>
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 via-black/60 to-[#0A0A0A]"></div>
        <div className="relative z-10">
            <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-500 uppercase bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] inline-block mb-4">
                {isUpcomingMode ? 'UPCOMING MATCHES' : 'LIVE MATCHES'}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                {isUpcomingMode ? (
                    <>Upcoming <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Fixtures</span></>
                ) : (
                    <>Predict the <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">World Cup</span></>
                )}
            </h1>
            <p className="text-zinc-300 font-medium text-lg md:text-xl max-w-2xl mx-auto mb-10 text-shadow-sm">
                {isUpcomingMode ? (
                    "Analyze scheduled matches after the next 3 days. Lock in your predictions ahead of time and secure your leaderboard multiplier!"
                ) : (
                    "Hold Golden Tokens to place free predictions on active FIFA World Cup 2026 matches. Correct predictions earn you points and rank you up the leaderboard."
                )}
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
            <div className="text-center text-zinc-500 py-12">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading matches from database...
            </div>
        ) : (
            <>
              {/* Active Markets */}
              <div className="mb-16">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-white">
                        {isUpcomingMode ? 'Upcoming Match Program' : 'Live & Active Matches'}
                    </h2>
                    <span className="text-xs text-zinc-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-mono font-bold">
                        {isUpcomingMode ? '3+ Days Out' : 'Next 72 Hours'}
                    </span>
                </div>

                {displayedGroups.map(renderMatchGroup)}
                
                {displayedGroups.length === 0 && (
                    <div className="text-center py-16 bg-zinc-900/20 rounded-3xl border border-white/5 text-zinc-500">
                        <span className="text-4xl block mb-2">📅</span>
                        No active matches scheduled in this range.
                    </div>
                )}
              </div>

              {/* Resolved Markets */}
              <h2 className="text-2xl font-bold mb-8 text-zinc-500 border-t border-white/5 pt-12">Resolved Matches</h2>
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

export default function Home() {
  return (
    <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
            <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
            Preparing Platform...
        </div>
    }>
      <MarketsContent />
    </Suspense>
  );
}
