"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TEAM_FLAGS } from '@/lib/flags';

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

function formatMatchTime(dateStr) {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${formattedDate} • ${formattedTime} GMT`;
}

export default function GroupDetail() {
  const params = useParams();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [liveScores, setLiveScores] = useState({});
  const [loading, setLoading] = useState(true);

  // Group Identifier, e.g. "A", "B", etc.
  const groupId = params.id ? params.id.toUpperCase() : 'A';
  const groupName = `Group ${groupId}`;
  const groupTeams = GROUPS[groupName];

  useEffect(() => {
    const fetchMarkets = () => {
      fetch('/api/markets')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMatches(data.markets || []);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch fixtures:', err);
          setLoading(false);
        });
    };

    fetchMarkets();
    const marketInterval = setInterval(fetchMarkets, 60 * 1000);

    const fetchScores = async () => {
      try {
        const res = await fetch('/api/markets/live-scores');
        const data = await res.json();
        if (data.success && data.scores) {
          setLiveScores(data.scores);
        }
      } catch (err) {
        console.error("Failed to fetch live scores:", err);
      }
    };
    fetchScores();
    const scoreInterval = setInterval(fetchScores, 30 * 1000);

    return () => {
      clearInterval(marketInterval);
      clearInterval(scoreInterval);
    };
  }, []);

  if (!groupTeams) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-black items-center justify-center text-zinc-500 font-medium">
        <span>Group {groupId} not found.</span>
        <button 
          onClick={() => router.push('/groups')}
          className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
        >
          Back to Groups stage list
        </button>
      </div>
    );
  }

  // Calculate standings
  const calculateStandings = () => {
    const stats = {};
    groupTeams.forEach(team => {
      stats[team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    const groupMatches = matches.filter(m => {
      const gA = getTeamGroup(m.teamA);
      const gB = getTeamGroup(m.teamB);
      return gA === groupName && gB === groupName;
    });

    groupMatches.forEach(m => {
      const isConcluded = m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined;
      if (!isConcluded) return;

      const teamAKey = groupTeams.find(t => t.toLowerCase() === m.teamA.toLowerCase() || t.toLowerCase().includes(m.teamA.toLowerCase()) || m.teamA.toLowerCase().includes(t.toLowerCase()));
      const teamBKey = groupTeams.find(t => t.toLowerCase() === m.teamB.toLowerCase() || t.toLowerCase().includes(m.teamB.toLowerCase()) || m.teamB.toLowerCase().includes(t.toLowerCase()));

      if (!teamAKey || !teamBKey) return;

      stats[teamAKey].played += 1;
      stats[teamBKey].played += 1;
      stats[teamAKey].gf += m.scoreA;
      stats[teamAKey].ga += m.scoreB;
      stats[teamBKey].gf += m.scoreB;
      stats[teamBKey].ga += m.scoreA;

      if (m.scoreA > m.scoreB) {
        stats[teamAKey].won += 1;
        stats[teamAKey].pts += 3;
        stats[teamBKey].lost += 1;
      } else if (m.scoreB > m.scoreA) {
        stats[teamBKey].won += 1;
        stats[teamBKey].pts += 3;
        stats[teamAKey].lost += 1;
      } else {
        stats[teamAKey].drawn += 1;
        stats[teamAKey].pts += 1;
        stats[teamBKey].drawn += 1;
        stats[teamBKey].pts += 1;
      }

      stats[teamAKey].gd = stats[teamAKey].gf - stats[teamAKey].ga;
      stats[teamBKey].gd = stats[teamBKey].gf - stats[teamBKey].ga;
    });

    return Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  };

  const groupMatches = matches.filter(m => {
    const gA = getTeamGroup(m.teamA);
    const gB = getTeamGroup(m.teamB);
    return gA === groupName && gB === groupName;
  });

  const standings = calculateStandings();

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-black items-center justify-center text-zinc-500 font-medium">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <span>Loading group details...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 relative min-h-screen">
      {/* Background Glows */}
      <div className="absolute top-[10%] left-[5%] w-80 h-80 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10">
        
        {/* Back navigation */}
        <button 
          onClick={() => router.push('/groups')}
          className="text-zinc-500 hover:text-white mb-8 self-start flex items-center gap-2 transition-colors text-sm font-semibold"
        >
          ← Back to Groups stage
        </button>

        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            {groupName} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]">Tournament Hub</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
            Detailed group statistics, automatic points calculation, and full fixtures schedule. Forecast upcoming matches to secure points!
          </p>
        </div>

        {/* Double Column Layout reproducing Social Tasks layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Standings Table */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-yellow-500/20 transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 text-zinc-200 flex items-center gap-3">
              <span>🏆</span> Group Standings
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px] py-2">
                    <th className="pb-3 px-1 text-center w-8">#</th>
                    <th className="pb-3 px-2">Team</th>
                    <th className="pb-3 px-1 text-center w-10">P</th>
                    <th className="pb-3 px-1 text-center w-8">W</th>
                    <th className="pb-3 px-1 text-center w-8">D</th>
                    <th className="pb-3 px-1 text-center w-8">L</th>
                    <th className="pb-3 px-1 text-center w-10">GD</th>
                    <th className="pb-3 px-2 text-center w-12 text-yellow-400">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((stat, idx) => {
                    const isQualifying = idx < 2;
                    return (
                      <tr key={idx} className="border-b border-zinc-800/50 hover:bg-white/[0.01]">
                        <td className="py-4 px-1 text-center font-bold text-zinc-400">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                            isQualifying ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl shrink-0">{TEAM_FLAGS[stat.team] || '🏳️'}</span>
                            <span className="text-white truncate max-w-[100px] sm:max-w-none">{stat.team}</span>
                          </div>
                        </td>
                        <td className="py-4 px-1 text-center text-zinc-300 font-bold">{stat.played}</td>
                        <td className="py-4 px-1 text-center text-zinc-400">{stat.won}</td>
                        <td className="py-4 px-1 text-center text-zinc-400">{stat.drawn}</td>
                        <td className="py-4 px-1 text-center text-zinc-400">{stat.lost}</td>
                        <td className={`py-4 px-1 text-center font-mono font-bold ${stat.gd > 0 ? 'text-emerald-400' : stat.gd < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                          {stat.gd > 0 ? `+${stat.gd}` : stat.gd}
                        </td>
                        <td className="py-4 px-2 text-center text-yellow-400 font-black text-sm">{stat.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 mt-6 text-[9px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"></span>
              <span>Top 2 Teams advance to Knockout stage</span>
            </div>
          </div>

          {/* Right Column: Group Fixtures & Results */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-yellow-500/20 transition-all duration-300 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-zinc-200 flex items-center gap-3">
                <span>⚽</span> Match Fixtures & Results
              </h2>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {groupMatches.length === 0 ? (
                  <div className="text-center py-12 bg-black/40 rounded-2xl border border-zinc-800/60">
                    <span className="text-4xl block mb-2">📅</span>
                    <p className="text-zinc-500 text-sm">No matches scheduled for this group yet.</p>
                  </div>
                ) : (
                  groupMatches.map((match, idx) => {
                    const isConcluded = match.scoreA !== null && match.scoreB !== null && match.scoreA !== undefined && match.scoreB !== undefined;
                    const liveScore = liveScores[match.id];
                    const isLive = liveScore && liveScore.status === 'LIVE';
                    const isLiveConcluded = liveScore && liveScore.status === 'FT' && !isConcluded;

                    return (
                      <div 
                        key={idx} 
                        className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col gap-3 hover:border-zinc-700/60 transition-colors"
                      >
                        {/* Match Header: Date & Time / Live status */}
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono tracking-wider border-b border-white/5 pb-2 select-none">
                          <span>{formatMatchTime(match.matchDate)}</span>
                          {isLive && (
                            <span className="text-[9px] font-extrabold tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full animate-pulse border border-red-500/20 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                              <span>LIVE {liveScore.elapsed ? `${liveScore.elapsed}'` : 'HT'}</span>
                            </span>
                          )}
                          {isLiveConcluded && (
                            <span className="text-[9px] font-extrabold tracking-widest text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20 flex items-center gap-1.5">
                              <span>FT (Awaiting Sync)</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Match details & teams */}
                          <div className="flex items-center justify-between sm:justify-start gap-3 flex-1 min-w-0">
                            {/* Team A */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end sm:flex-initial sm:w-[110px]">
                              <span className="text-zinc-200 text-xs font-bold truncate text-right">{match.teamA}</span>
                              <span className="text-xl shrink-0">{TEAM_FLAGS[match.teamA] || '🏳️'}</span>
                            </div>

                            {/* Score or VS */}
                            <div className="shrink-0 flex items-center justify-center min-w-[54px]">
                              {isConcluded ? (
                                <span className="text-[11px] font-extrabold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md font-mono shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                  {match.scoreA} - {match.scoreB}
                                </span>
                              ) : isLive ? (
                                <span className="text-[11px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md font-mono shadow-[0_0_10px_rgba(239,68,68,0.1)] animate-pulse">
                                  {liveScore.goalsA} - {liveScore.goalsB}
                                </span>
                              ) : isLiveConcluded ? (
                                <span className="text-[11px] font-extrabold text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/10 px-2 py-0.5 rounded-md font-mono shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                                  {liveScore.goalsA} - {liveScore.goalsB}
                                </span>
                              ) : (
                                <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  VS
                                </span>
                              )}
                            </div>

                            {/* Team B */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-start sm:flex-initial sm:w-[110px]">
                              <span className="text-xl shrink-0">{TEAM_FLAGS[match.teamB] || '🏳️'}</span>
                              <span className="text-zinc-200 text-xs font-bold truncate">{match.teamB}</span>
                            </div>
                          </div>

                          {/* Action predict button */}
                          {!isConcluded && !isLive && !isLiveConcluded && (
                            <button
                              onClick={() => router.push(`/markets/${match.id}`)}
                              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap self-stretch flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            >
                              Predict
                            </button>
                          )}
                          {!isConcluded && isLive && (
                            <div className="w-full sm:w-auto text-[9px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl whitespace-nowrap text-center select-none shadow-[0_0_12px_rgba(239,68,68,0.1)]">
                              LIVE IN PLAY
                            </div>
                          )}
                          {!isConcluded && isLiveConcluded && (
                            <div className="w-full sm:w-auto text-[9px] font-black uppercase text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-4 py-2 rounded-xl whitespace-nowrap text-center select-none">
                              FINISHED
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-zinc-600 select-none uppercase tracking-widest font-mono">
              * Live standing scores synchronized dynamically *
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
