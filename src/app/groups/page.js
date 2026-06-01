"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// Help map DB team names to our predefined group names
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

export default function GroupStage() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'fixtures'

  useEffect(() => {
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
  }, []);

  // Compute standings for a specific group
  const calculateStandings = (groupName) => {
    const groupTeams = GROUPS[groupName];
    
    // Initialize stats
    const stats = {};
    groupTeams.forEach(team => {
      stats[team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    // Filter finished matches in this group
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

    // Sort standings: Points DESC, Goal Diff DESC, Goals For DESC, Name ASC
    return Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  };

  // Get matches for a group
  const getGroupMatches = (groupName) => {
    const groupTeams = GROUPS[groupName];
    return matches.filter(m => {
      const gA = getTeamGroup(m.teamA);
      const gB = getTeamGroup(m.teamB);
      return gA === groupName && gB === groupName;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-black items-center justify-center text-zinc-500 font-medium">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <span>Loading groups stage details...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-black text-white py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-yellow-600/10 to-transparent blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-amber-600/10 to-transparent blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.2)] tracking-tight uppercase mb-4">
            Tournament Group Stage
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto font-medium text-sm md:text-base">
            Track live tournament standings automatically calculated from match scores. Choose your group and lock in predictions to earn championship points.
          </p>
        </div>

        {/* 12-Group Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.keys(GROUPS).map((groupName) => {
            const standings = calculateStandings(groupName);
            return (
              <div
                key={groupName}
                onClick={() => {
                  setSelectedGroup(groupName);
                  setActiveTab('standings');
                }}
                className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 hover:border-yellow-500/40 rounded-3xl p-6 transition-all duration-300 shadow-xl cursor-pointer hover:-translate-y-1 select-none flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual Glow Bridge on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div>
                  {/* Group Title */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                      {groupName}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 group-hover:text-yellow-400 transition-colors">
                      View Details →
                    </span>
                  </div>

                  {/* Team List with Flags & Points */}
                  <div className="flex flex-col gap-3">
                    {standings.map((stat, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 last:border-b-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{TEAM_FLAGS[stat.team] || '🏳️'}</span>
                          <span className="text-zinc-200 text-xs font-semibold truncate">{stat.team}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] text-zinc-500 font-bold">P{stat.played}</span>
                          <span className="text-xs text-yellow-400 font-extrabold min-w-[14px] text-right">{stat.pts} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Group Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
              <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                {selectedGroup} Tournament Hub
              </h3>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-zinc-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/20">
              <button
                onClick={() => setActiveTab('standings')}
                className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'standings'
                    ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                STANDINGS
              </button>
              <button
                onClick={() => setActiveTab('fixtures')}
                className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'fixtures'
                    ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                FIXTURES & RESULTS
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-zinc-900">
              {activeTab === 'standings' ? (
                /* Detailed Standings Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[10px]">
                        <th className="py-3 px-1 text-center w-8">#</th>
                        <th className="py-3 px-2">Team</th>
                        <th className="py-3 px-1 text-center w-12">P</th>
                        <th className="py-3 px-1 text-center w-10">W</th>
                        <th className="py-3 px-1 text-center w-10">D</th>
                        <th className="py-3 px-1 text-center w-10">L</th>
                        <th className="py-3 px-2 text-center w-16">GF-GA</th>
                        <th className="py-3 px-1 text-center w-12">GD</th>
                        <th className="py-3 px-2 text-center w-16 text-yellow-400">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateStandings(selectedGroup).map((stat, idx) => {
                        const isQualifying = idx < 2; // Top 2 qualify
                        return (
                          <tr key={idx} className="border-b border-zinc-800/50 hover:bg-white/[0.02]">
                            <td className="py-4 px-1 text-center font-bold text-zinc-400">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                                isQualifying ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl shrink-0">{TEAM_FLAGS[stat.team] || '🏳️'}</span>
                                <span className="text-white truncate">{stat.team}</span>
                              </div>
                            </td>
                            <td className="py-4 px-1 text-center text-zinc-300 font-bold">{stat.played}</td>
                            <td className="py-4 px-1 text-center text-zinc-400">{stat.won}</td>
                            <td className="py-4 px-1 text-center text-zinc-400">{stat.drawn}</td>
                            <td className="py-4 px-1 text-center text-zinc-400">{stat.lost}</td>
                            <td className="py-4 px-2 text-center text-zinc-400 font-mono">{stat.gf}:{stat.ga}</td>
                            <td className={`py-4 px-1 text-center font-mono font-bold ${stat.gd > 0 ? 'text-emerald-400' : stat.gd < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                              {stat.gd > 0 ? `+${stat.gd}` : stat.gd}
                            </td>
                            <td className="py-4 px-2 text-center text-yellow-400 font-black text-sm">{stat.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-2 mt-6 text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"></span>
                    <span>Top 2 Teams advance to Knockout Stage</span>
                  </div>
                </div>
              ) : (
                /* Group Fixtures List */
                <div className="flex flex-col gap-4">
                  {getGroupMatches(selectedGroup).length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 font-semibold">No matches scheduled for this group yet.</div>
                  ) : (
                    getGroupMatches(selectedGroup).map((match, idx) => {
                      const isConcluded = match.scoreA !== null && match.scoreB !== null && match.scoreA !== undefined && match.scoreB !== undefined;
                      return (
                        <div key={idx} className="bg-zinc-950/30 border border-zinc-800/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Teams & Scores */}
                          <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                            {/* Team A */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end sm:flex-initial sm:w-[150px]">
                              <span className="text-white text-xs font-bold truncate text-right">{match.teamA}</span>
                              <span className="text-xl shrink-0">{TEAM_FLAGS[match.teamA] || '🏳️'}</span>
                            </div>

                            {/* Score or VS */}
                            <div className="shrink-0 flex items-center justify-center min-w-[60px]">
                              {isConcluded ? (
                                <span className="text-sm font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-lg font-mono">
                                  {match.scoreA} - {match.scoreB}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  VS
                                </span>
                              )}
                            </div>

                            {/* Team B */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-start sm:flex-initial sm:w-[150px]">
                              <span className="text-xl shrink-0">{TEAM_FLAGS[match.teamB] || '🏳️'}</span>
                              <span className="text-white text-xs font-bold truncate">{match.teamB}</span>
                            </div>
                          </div>

                          {/* Predict button if upcoming */}
                          {!isConcluded && (
                            <button
                              onClick={() => {
                                setSelectedGroup(null);
                                router.push(`/markets/${match.id}`);
                              }}
                              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 font-black text-xs px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap self-stretch flex items-center justify-center"
                            >
                              Predict Match
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
