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
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');

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

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-black items-center justify-center text-zinc-500 font-medium">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <span>Loading groups stage details...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-yellow-600/10 to-transparent blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-amber-600/10 to-transparent blur-[150px] pointer-events-none"></div>

      {/* Hero Section with Embedded Stadium Banner */}
      <section className="relative py-24 px-4 text-center overflow-hidden mb-12">
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 via-black/60 to-black"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <img 
            src="/logo.jpg" 
            alt="Golden Goal Logo" 
            className="w-20 h-20 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_25px_rgba(245,158,11,0.3)] mb-6 select-none animate-pulse"
          />
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.2)] tracking-tight uppercase mb-4">
            Tournament Group Stage
          </h1>
          <p className="text-zinc-300 max-w-2xl mx-auto font-medium text-sm md:text-base leading-relaxed">
            Track live tournament standings automatically calculated from match scores. Choose your group and lock in predictions to earn championship points.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-24 relative z-10">
        {/* Group Filter Navigation */}
        <div className="flex items-center justify-start sm:justify-center gap-1.5 md:gap-2 mb-16 max-w-4xl mx-auto px-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap select-none">
          {['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((letter) => {
            const isActive = selectedGroupFilter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedGroupFilter(letter)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all duration-300 border shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 border-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-105'
                    : 'bg-zinc-900/40 backdrop-blur-md border-white/5 text-zinc-400 hover:text-white hover:border-zinc-700/60'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* 12-Group Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.keys(GROUPS)
            .filter((groupName) => {
              if (selectedGroupFilter === 'ALL') return true;
              return groupName === `Group ${selectedGroupFilter}`;
            })
            .map((groupName) => {
              const standings = calculateStandings(groupName);
              const groupId = groupName.split(' ')[1];
              return (
                <div
                  key={groupName}
                  onClick={() => router.push(`/groups/${groupId}`)}
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
    </div>
  );
}
