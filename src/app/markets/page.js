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
  'zidane.png',
  'ronaldinho.png',
  'beckham.png',
  'davids.png',
  'henry.png',
  'del_piero.png'
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
  'basten.png',
  'pirlo.png',
  'gattuso.png',
  'pires.png',
  'materazzi.png',
  'kluivert.png'
];

const GROUPS = {
  'Group A': ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  'Group B': ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  'Group C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  'Group D': ['USA', 'Paraguay', 'Australia', 'Turkey'],
  'Group E': ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
  'Group F': ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  'Group G': ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  'Group H': ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  'Group I': ['France', 'Senegal', 'Iraq', 'Norway'],
  'Group J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  'Group K': ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  'Group L': ['England', 'Croatia', 'Ghana', 'Panama']
};

function getTeamGroup(teamName) {
  if (!teamName) return null;
  const normalized = teamName.toLowerCase().trim();
  for (const [groupName, teams] of Object.entries(GROUPS)) {
    const matched = teams.some(t => {
      const tNorm = t.toLowerCase().trim();
      return tNorm === normalized || tNorm.includes(normalized) || normalized.includes(tNorm);
    });
    if (matched) return groupName;
  }
  return null;
}

function MarketsContent() {
  const { connected, publicKey } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [userPredictions, setUserPredictions] = useState([]);
  const [latestPredictions, setLatestPredictions] = useState([]);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'live';

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  const [copied, setCopied] = useState(false);
  const [selectedSport, setSelectedSport] = useState('football');
  const [comingSoonModal, setComingSoonModal] = useState({ isOpen: false, sport: '', title: '', details: '' });

  useEffect(() => {
    const targetDate = new Date('2026-06-11T16:00:00Z').getTime();

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

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
  const leftSlotA = LEFT_LEGENDS[legendIndex]; // Top Left Player
  const leftSlotB = LEFT_LEGENDS[(legendIndex + 2) % LEFT_LEGENDS.length]; // Bottom Left Player

  const rightSlotA = RIGHT_LEGENDS[legendIndex]; // Top Right Player
  const rightSlotB = RIGHT_LEGENDS[(legendIndex + 2) % RIGHT_LEGENDS.length]; // Bottom Right Player

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

  useEffect(() => {
    const fetchLatest = () => {
        fetch('/api/predictions')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
                setLatestPredictions(data.predictions || []);
            }
          })
          .catch(err => console.error("Failed to load latest predictions:", err));
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkets = markets.filter(m => {
      const sport = m.sport ? m.sport.toLowerCase() : 'football';
      return sport === selectedSport;
  });

  const groupedMarkets = [];
  filteredMarkets.filter(m => m.status === 'ACTIVE' && !(m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined)).forEach(m => {
      const dateObj = new Date(m.matchDate);
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      let group = groupedMarkets.find(g => g.date === dateStr);
      if (!group) {
          group = { date: dateStr, matches: [] };
          groupedMarkets.push(group);
      }
      let tz = 'GMT';
      try {
          const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(dateObj);
          tz = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
      } catch (e) {}
      group.matches.push({
          ...m,
          timeStr: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          tz: tz,
          isLocked: dateObj.getTime() < Date.now()
      });
  });

  const resolvedMarkets = filteredMarkets.filter(m => m.status !== 'ACTIVE' || (m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined));
  
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
                            {/* Group Tag */}
                            <span className="text-[11px] font-black tracking-[0.2em] text-yellow-400 uppercase block mb-3 select-none">
                              {m.sport === 'VOLLEYBALL' ? 'Volleyball Nations League' : (getTeamGroup(m.teamA) || 'Tournament Match')}
                            </span>

                            {isLive ? (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                                        • LIVE {m.sport === 'VOLLEYBALL' ? (scoreInfo.matchStatus || 'LIVE') : (scoreInfo.status === 'HT' ? 'HT' : `${scoreInfo.elapsed}'`)}
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
                                <span className={`text-sm font-mono mb-2 block ${isMexicoSA ? 'text-zinc-400 font-medium' : 'text-zinc-500'}`}>{m.timeStr} {m.tz}</span>
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
                                            {m.sport === 'VOLLEYBALL' && scoreInfo.pointsA !== null && scoreInfo.pointsB !== null && (
                                                <span className="text-[10px] font-extrabold text-amber-500 mt-0.5 animate-pulse">
                                                    ({scoreInfo.pointsA} - {scoreInfo.pointsB})
                                                </span>
                                            )}
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

                            {/* Goalscorers Grid */}
                            {((isLive || (m.scoreA !== null && m.scoreB !== null)) && scoreInfo?.goals && scoreInfo.goals.length > 0) && (
                                <div className="mt-4 pt-4 border-t border-zinc-800/60 grid grid-cols-3 gap-2 text-[9px] md:text-[10px] text-zinc-400 font-semibold max-w-sm mx-auto drop-shadow-sm">
                                    {/* Team A Goals */}
                                    <div className="text-right space-y-1 min-w-0">
                                        {scoreInfo.goals.filter(g => g.isHome).map((g, idx) => (
                                            <div key={idx} className="flex items-center justify-end gap-1 truncate">
                                                <span className="text-zinc-300 truncate">{g.player}</span>
                                                <span className="text-zinc-500 font-mono flex-shrink-0">{g.time}{g.addedTime ? `+${g.addedTime}` : ''}'</span>
                                                {g.incidentClass === 'penalty' && <span className="text-amber-400 text-[8px] font-extrabold flex-shrink-0">(P)</span>}
                                                {g.incidentClass === 'ownGoal' && <span className="text-red-500 text-[8px] font-extrabold flex-shrink-0">(OG)</span>}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Ball Icon */}
                                    <div className="flex items-center justify-center opacity-30 select-none text-[10px] md:text-xs">
                                        {m.sport === 'VOLLEYBALL' ? '🏐' : '⚽'}
                                    </div>

                                    {/* Team B Goals */}
                                    <div className="text-left space-y-1 min-w-0">
                                        {scoreInfo.goals.filter(g => !g.isHome).map((g, idx) => (
                                            <div key={idx} className="flex items-center justify-start gap-1 truncate">
                                                {g.incidentClass === 'penalty' && <span className="text-amber-400 text-[8px] font-extrabold flex-shrink-0">(P)</span>}
                                                {g.incidentClass === 'ownGoal' && <span className="text-red-500 text-[8px] font-extrabold flex-shrink-0">(OG)</span>}
                                                <span className="text-zinc-500 font-mono flex-shrink-0">{g.time}{g.addedTime ? `+${g.addedTime}` : ''}'</span>
                                                <span className="text-zinc-300 truncate">{g.player}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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

  const formatWallet = (wallet) => {
    if (!wallet) return 'Anonymous';
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const formatType = (type) => {
    switch (type) {
      case 'MAIN': return 'Winner';
      case 'TOTAL_GOALS': return 'Total Goals';
      case 'BTTS': return 'Both Teams to Score';
      case 'FIRST_GOAL': return 'First Goal';
      case 'DOUBLE_CHANCE': return 'Double Chance';
      case 'FIRST_HALF': return 'First Half Winner';
      default: return type;
    }
  };

  const displayPredictions = latestPredictions.length > 0 ? latestPredictions : [
    { id: 'd1', walletAddress: 'At1KeuyXZiMFN2Tos8gsGjgyG9uMHSHLLweTbwzbsCsQ', teamA: 'Mexico', teamB: 'South Africa', predictionType: 'MAIN', prediction: 'Mexico' },
    { id: 'd2', walletAddress: '2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K', teamA: 'Germany', teamB: 'Curacao', predictionType: 'TOTAL_GOALS', prediction: 'Over 2.5' },
    { id: 'd3', walletAddress: 'At1KeuyXZiMFN2Tos8gsGjgyG9uMHSHLLweTbwzbsCsQ', teamA: 'Canada', teamB: 'Switzerland', predictionType: 'BTTS', prediction: 'Yes' },
    { id: 'd4', walletAddress: '2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K', teamA: 'Brazil', teamB: 'Morocco', predictionType: 'FIRST_HALF', prediction: 'Brazil' },
  ];

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
                    "Analyze scheduled matches. Lock in your predictions ahead of time and secure your leaderboard multiplier!"
                ) : (
                    "Hold at least 250K Golden Tokens to earn 3 free prediction rights daily."
                )}
            </p>

            {!isUpcomingMode && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/60 border border-yellow-500/10 hover:border-yellow-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">Contract:</span>
                  <a 
                    href="https://solscan.io/token/GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-mono font-bold text-zinc-100 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                    title="View on Solscan"
                  >
                    <span className="hidden sm:inline">GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump</span>
                    <span className="inline sm:hidden">GU527smM...FMBfZ8pump</span>
                    <svg className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  
                  <div className="w-[1px] h-4 bg-zinc-800"></div>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-all duration-200 cursor-pointer min-w-[55px] justify-center"
                    title="Copy Address"
                  >
                    {copied ? (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">Copied!</span>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* LEGAL NOTICE & COMPLIANCE SHIELD */}
            <div className="w-full max-w-2xl mx-auto mt-8 p-5 rounded-2xl bg-zinc-950/60 border border-yellow-500/10 hover:border-yellow-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.02)] transition-all duration-300 select-none text-left flex items-start gap-4 group">
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
            
            {/* LATEST PREDICTIONS TICKER */}
            <div className="w-full max-w-2xl mx-auto mt-8 overflow-hidden rounded-xl bg-zinc-950/45 border border-zinc-800/80 backdrop-blur-md py-3.5 relative select-none">
              {/* Left & Right fading shadows */}
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
              
              <div className="overflow-hidden w-full flex">
                <div className="animate-marquee flex gap-16 items-center whitespace-nowrap">
                  {[...displayPredictions, ...displayPredictions].map((pred, i) => (
                    <div key={pred.id + '-' + i} className="flex items-center gap-3 text-xs text-zinc-300 font-medium font-mono">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse inline-block shrink-0"></span>
                      <span className="text-zinc-500">{formatWallet(pred.walletAddress)}</span>
                      <span>predicted</span>
                      <span className="text-white font-bold">{TEAM_FLAGS[pred.teamA] || '🏳️'} {pred.teamA} vs {pred.teamB} {TEAM_FLAGS[pred.teamB] || '🏳️'}</span>
                      <span className="text-zinc-500">Pick:</span>
                      <span className="text-amber-400 font-extrabold">{formatType(pred.predictionType)} → {pred.prediction}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </section>

      <section className="py-12 px-4 max-w-5xl mx-auto w-full relative z-10">
        
        {/* Sports Tab Selector */}
        <div className="mb-12 p-1.5 bg-zinc-950/60 backdrop-blur-xl border border-white/5 rounded-2xl flex gap-2 w-max max-w-full overflow-x-auto select-none scrollbar-none shrink-0 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
          <button
            onClick={() => setSelectedSport('football')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer ${
              selectedSport === 'football'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-green-pulse hover:scale-[1.02]'
                : 'bg-transparent border border-transparent hover:border-white/5 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>⚽</span>
            <span>Football</span>
            <span className="flex items-center gap-1.5 ml-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-[9px] font-mono font-black text-emerald-400 uppercase bg-emerald-500/20 px-2 py-0.5 rounded-md">Live</span>
            </span>
          </button>

          <button
            onClick={() => setComingSoonModal({
              isOpen: true,
              sport: 'Basketball',
              title: '🏀 NBA Finals Markets',
              details: 'Predict the NBA Finals matches, quarter outcomes, player points, and series MVP. Hold at least 250K $GoldenGoal to unlock basic basketball prediction privileges.'
            })}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 bg-transparent border border-transparent hover:border-white/5 hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 cursor-pointer shrink-0 hover:scale-[1.02]"
          >
            <span>🏀</span>
            <span>Basketball</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-500 font-bold ml-1">🔒 Coming Soon</span>
          </button>

          <button
            onClick={() => setSelectedSport('volleyball')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer ${
              selectedSport === 'volleyball'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-amber-pulse hover:scale-[1.02]'
                : 'bg-transparent border border-transparent hover:border-white/5 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>🏐</span>
            <span>Volleyball</span>
            <span className="flex items-center gap-1.5 ml-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
              <span className="text-[9px] font-mono font-black text-amber-400 uppercase bg-amber-500/20 px-2 py-0.5 rounded-md">VNL</span>
            </span>
          </button>

          <button
            onClick={() => setComingSoonModal({
              isOpen: true,
              sport: 'Tennis',
              title: '🎾 Wimbledon Championship',
              details: 'Predict Wimbledon set scores, match aces, and tournament champions. Access to tennis pools is reserved for Tier 1 and higher token lockers.'
            })}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 bg-transparent border border-transparent hover:border-white/5 hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 cursor-pointer shrink-0 hover:scale-[1.02]"
          >
            <span>🎾</span>
            <span>Tennis</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-500 font-bold ml-1">🔒 Coming Soon</span>
          </button>
        </div>

        {/* Coming Soon Modal */}
        {comingSoonModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-zinc-950/90 border border-emerald-500/20 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden group select-none text-left">
              {/* Decorative glows */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 font-mono uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    ⚡ UPCOMING TOURNAMENT
                  </span>
                  <button 
                    onClick={() => setComingSoonModal({ isOpen: false, sport: '', title: '', details: '' })}
                    className="text-zinc-500 hover:text-zinc-300 font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tight">{comingSoonModal.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    {comingSoonModal.details}
                  </p>
                </div>

                {/* Info box */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex gap-3 items-start">
                  <span className="text-xl">🏆</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-200">Prepare Your Wallet</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Locking more $GoldenGoal tokens grants access to higher multiplier rewards and extra daily prediction quotas when these pools go live.
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setComingSoonModal({ isOpen: false, sport: '', title: '', details: '' })}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-black rounded-xl text-sm transition-all duration-205 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center uppercase tracking-wider"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
            <div className="text-center text-zinc-500 py-12">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading matches from database...
            </div>
        ) : (
            <>
              {/* Active Markets */}
              <div className="mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-8 w-full">
                    {/* Left Column: Section Title */}
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-white">
                            {isUpcomingMode ? 'Upcoming Matches' : 'Active Matches'}
                        </h2>
                    </div>

                    {/* Center Column: Kickoff Countdown / Tag */}
                    <div className="flex justify-center">
                        {isUpcomingMode ? null : (
                          <div>
                            {!timeLeft.expired ? (
                              <div className="flex items-center gap-2.5">
                                <span className="text-[10px] text-zinc-500 font-extrabold tracking-widest uppercase">Opening Kickoff:</span>
                                <span className="text-xs font-mono font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-1 select-none animate-pulse">
                                  <span>{String(timeLeft.days).padStart(2, '0')}d</span>
                                  <span className="text-zinc-600">:</span>
                                  <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                                  <span className="text-zinc-600">:</span>
                                  <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
                                  <span className="text-zinc-600">:</span>
                                  <span className="text-amber-500">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                                </span>
                              </div>
                            ) : (
                               <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.25)] animate-pulse">
                                🏆 WORLD CUP TOURNAMENT UNDERWAY
                               </span>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Right Column: Empty spacer to perfectly center the countdown on desktop */}
                    <div className="hidden md:block"></div>
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
