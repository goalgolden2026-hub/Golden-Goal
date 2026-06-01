"use client";

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TEAM_FLAGS } from '@/lib/flags';

const LEFT_LEGENDS = [
  'ronaldo.png', 
  'pele.png', 
  'totti.png', 
  'gerrard.png', 
  'haaland.png',
  'baggio.png',
  'carlos.png',
  'kante.png',
  'neuer.png',
  'rijkaard.png',
  'zidane.png'
];
const RIGHT_LEGENDS = [
  'messi.png', 
  'maradona.png', 
  'lampard.png', 
  'owen.png', 
  'mbappe.png',
  'figo.png',
  'dembele.png',
  'buffon.png',
  'nakata.png',
  'gullit.png',
  'basten.png'
];

function MarketsContent() {
  const { connected, publicKey } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [userPredictions, setUserPredictions] = useState([]);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'live';

  // Staggered index tracking for the 4 slots (Ronaldo/Messi always first, others cycle through the rest of the array)
  // Left side list: ['ronaldo.png', 'pele.png', 'totti.png', 'gerrard.png', 'haaland.png']
  // Right side list: ['messi.png', 'maradona.png', 'lampard.png', 'owen.png', 'mbappe.png']
  const [legendIndex, setLegendIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      setIsRotating(true);
    }, 5000); // 5 seconds initial delay to unblur first legends fully

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    if (!isRotating) return;

    const interval = setInterval(() => {
      setLegendIndex((prev) => (prev + 1) % LEFT_LEGENDS.length);
    }, 3000); // 3 seconds gorgeous cycling sequence

    return () => clearInterval(interval);
  }, [isRotating]);

  // Dynamic slot resolvers to show 2 players on each side (total 4 stacked legends)
  const leftSlotA = LEFT_LEGENDS[legendIndex]; // Top Sol Player
  const leftSlotB = LEFT_LEGENDS[(legendIndex + 2) % LEFT_LEGENDS.length]; // Bottom Sol Player

  const rightSlotA = RIGHT_LEGENDS[legendIndex]; // Top Sağ Player
  const rightSlotB = RIGHT_LEGENDS[(legendIndex + 2) % RIGHT_LEGENDS.length]; // Bottom Sağ Player

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
    if (connected && publicKey) {
        fetch(`/api/user/predictions?wallet=${publicKey.toBase58()}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
                setUserPredictions(data.predictions);
            }
          })
          .catch(err => console.error("Failed to load user predictions", err));
    } else {
        setUserPredictions([]);
    }
  }, [connected, publicKey]);

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
  markets.filter(m => m.status === 'ACTIVE' && !(m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined)).forEach(m => {
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

  const resolvedMarkets = markets.filter(m => m.status !== 'ACTIVE' || (m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined));
  
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
                  const isLive = scoreInfo && scoreInfo.status === 'LIVE';
                  const userPredCount = userPredictions.filter(p => p.marketId === m.id).length;
                  
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
                            {isLive ? (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                                        • LIVE {scoreInfo.status === 'HT' ? 'HT' : scoreInfo.status === 'FT' ? 'FT' : `${scoreInfo.elapsed}'`}
                                    </span>
                                </div>
                            ) : (m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined) ? (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                                        ✓ MATCH ENDED
                                    </span>
                                </div>
                            ) : m.isLocked ? (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                                        🔒 LOCKED / PLAYING
                                    </span>
                                </div>
                            ) : (
                                <span className={`text-sm font-mono mb-2 block ${isMexicoSA ? 'text-zinc-400 font-medium' : 'text-zinc-500'}`}>{m.timeStr} GMT</span>
                            )}
                            
                            {/* Predictions Placed Badge */}
                            {userPredCount > 0 && (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold tracking-widest text-amber-400 bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border border-amber-500/50 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-1.5 leading-none">
                                        ✓ {userPredCount}/6 PREDICTIONS PLACED
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 items-center w-full text-center mt-2">
                                {/* Team A */}
                                <div className="flex flex-col items-center gap-2 justify-center min-w-0">
                                    <span className="text-3xl md:text-4xl drop-shadow-md shrink-0">{TEAM_FLAGS[m.teamA] || '🏳️'}</span>
                                    <span className="text-zinc-100 font-semibold text-xs md:text-sm lg:text-base leading-tight break-words w-full px-1">{m.teamA}</span>
                                </div>

                                {/* Center Score/VS */}
                                <div className="flex flex-col items-center justify-center shrink-0">
                                    {isLive ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.45)] tracking-tight">
                                                {scoreInfo.goalsA} - {scoreInfo.goalsB}
                                            </span>
                                        </div>
                                    ) : (m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined) ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.45)] tracking-tight">
                                                {m.scoreA} - {m.scoreB}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-amber-500 text-xs font-black tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                            VS
                                        </span>
                                    )}
                                </div>

                                {/* Team B */}
                                <div className="flex flex-col items-center gap-2 justify-center min-w-0">
                                    <span className="text-3xl md:text-4xl drop-shadow-md shrink-0">{TEAM_FLAGS[m.teamB] || '🏳️'}</span>
                                    <span className="text-zinc-100 font-semibold text-xs md:text-sm lg:text-base leading-tight break-words w-full px-1">{m.teamB}</span>
                                </div>
                            </div>
                        </div>

                        {/* Prediction Action Buttons */}
                        <div className="flex w-full gap-2 mt-2 relative z-10">
                            {(m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined) ? (
                                <button 
                                    disabled={false}
                                    className="w-full py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.1)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.2)]"
                                >
                                    <span>View Results</span>
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </button>
                            ) : m.isLocked ? (
                                <button 
                                    disabled={false}
                                    className="w-full py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.05)]"
                                >
                                    <span>View Predictions</span>
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </button>
                            ) : (
                                <button 
                                    disabled={false}
                                    className="w-full py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.05)]"
                                >
                                    <span>View Markets</span>
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </button>
                            )}
                        </div>
                        
                        {(m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined) && (
                            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-emerald-500/20 z-20">
                                ENDED
                            </div>
                        )}
                    </Link>
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col flex-1 relative min-h-screen overflow-x-hidden bg-black">
      
      {/* Left Side Rail (Rotating Stack - 2 Players Alt Alta) - Responsive Width, Z-0 (slides behind main content) */}
      <div className="hidden lg:flex fixed left-0 top-[8vh] w-[18vw] max-w-[280px] min-w-[150px] h-[88vh] z-0 flex-col justify-around items-center gap-4 pointer-events-none select-none">
        
        {/* Left Slot 1 (Top Left) - Facing RIGHT (Mirrored so he looks right) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={leftSlotA}
            src={`/legends/${leftSlotA}`} 
            alt="Golden Goal Legend Left Top" 
            className={`w-full h-full object-contain opacity-80 ${
              legendIndex === 0 && !isRotating 
                ? 'animate-cinematic-slow' 
                : 'animate-cinematic-normal'
            }`}
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>

        {/* Left Slot 2 (Bottom Left) - Facing RIGHT (Mirrored so he looks right) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={leftSlotB}
            src={`/legends/${leftSlotB}`} 
            alt="Golden Goal Legend Left Bottom" 
            className="w-full h-full object-contain opacity-80 animate-cinematic-normal"
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Right Side Rail (Rotating Stack Mirror - 2 Players Alt Alta) - Responsive Width, Z-0 (slides behind main content) */}
      {/* We REMOVE the global scale-x-[-1] here and control image directions individually so they look at each other */}
      <div className="hidden lg:flex fixed right-0 top-[8vh] w-[18vw] max-w-[280px] min-w-[150px] h-[88vh] z-0 flex-col justify-around items-center gap-4 pointer-events-none select-none">
        
        {/* Right Slot 1 (Top Right) - Facing LEFT (Mirrored individually so he looks left) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={rightSlotA}
            src={`/legends/${rightSlotA}`} 
            alt="Golden Goal Legend Right Top" 
            className={`w-full h-full object-contain opacity-80 ${
              legendIndex === 0 && !isRotating 
                ? 'animate-cinematic-slow' 
                : 'animate-cinematic-normal'
            }`}
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>

        {/* Right Slot 2 (Bottom Right) - Facing LEFT (Mirrored individually so he looks left) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={rightSlotB}
            src={`/legends/${rightSlotB}`} 
            alt="Golden Goal Legend Right Bottom" 
            className="w-full h-full object-contain opacity-80 animate-cinematic-normal"
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Main Content Wrapper - Elevated above side rails with z-10 */}
      <div className="relative z-10 w-full flex flex-col flex-1">
        {/* Hero Section */}
        <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 via-black/60 to-[#0A0A0A]"></div>
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            {/* Brand Logo at the Top */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-yellow-500/10 blur-2xl rounded-full"></div>
              <img 
                src="/logo.jpg" 
                alt="Golden Goal Logo" 
                className="w-20 h-20 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-105 transition-transform duration-300 relative z-10"
              />
            </div>

            <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-500 uppercase bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] inline-block mb-6">
                {isUpcomingMode ? 'UPCOMING MATCHES' : 'LIVE MATCHES'}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
                {isUpcomingMode ? (
                    <>Upcoming <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Fixtures</span></>
                ) : (
                    <>Predict the <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">World Cup</span></>
                )}
            </h1>
            <p className="text-zinc-300 font-medium text-lg md:text-xl max-w-2xl mx-auto text-shadow-sm leading-relaxed">
                {isUpcomingMode ? (
                    "Analyze scheduled matches after the next 3 days. Lock in your predictions ahead of time and secure your leaderboard multiplier!"
                ) : (
                    "Hold Golden Tokens to place free predictions on active FIFA World Cup 2026 matches. Correct predictions earn you points and rank you up the leaderboard."
                )}
            </p>
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-12 px-4 max-w-5xl mx-auto w-full relative z-10">
        
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
              <div className="flex flex-col gap-4">
                {resolvedMarkets.map((m) => {
                    const hasScores = m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined;
                    
                    if (hasScores) {
                        return (
                            <div key={m.id} className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex-1 w-full text-center md:text-left relative z-20">
                                    <span className="text-sm font-mono text-zinc-600 mb-2 block">{new Date(m.matchDate).toLocaleDateString('en-GB')}</span>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-xl font-bold text-zinc-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{TEAM_FLAGS[m.teamA] || '🏳️'}</span>
                                            <span>{m.teamA}</span>
                                        </div>
                                        
                                        <span className="text-amber-500 font-extrabold text-2xl px-4 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl tracking-tight">
                                            {m.scoreA} - {m.scoreB}
                                        </span>
                                        
                                        <div className="flex items-center gap-2">
                                            <span>{m.teamB}</span>
                                            <span className="text-2xl">{TEAM_FLAGS[m.teamB] || '🏳️'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto relative z-20 shrink-0">
                                    <Link 
                                      href={`/markets/${m.id}`}
                                      className="w-full md:w-auto px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.1)] text-sm"
                                    >
                                        <span>View Results</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    }

                    return (
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
                    );
                })}
                {resolvedMarkets.length === 0 && (
                    <div className="text-center py-8 text-zinc-600">No past matches yet.</div>
                )}
              </div>
            </>
        )}
      </section>
      </div>
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
