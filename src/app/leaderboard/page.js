"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Leaderboard() {
  const { publicKey, connected } = useWallet();
  const [leaders, setLeaders] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletParam = connected && publicKey ? `?walletAddress=${publicKey.toBase58()}` : '';
    fetch(`/api/leaderboard${walletParam}`)
      .then(res => res.json())
      .then(data => {
          if (data.success) {
            setLeaders(data.leaderboard);
            setUserStats(data.userStats || null);
          }
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, [connected, publicKey]);

  const shortenWallet = (address) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  const StatBadge = ({ label, value, valueClass = 'text-white' }) => (
    <span className="bg-zinc-800/50 text-zinc-400 text-xs px-2 py-1 rounded-md border border-zinc-700">
      {label}: <span className={valueClass}>{value}</span>
    </span>
  );

  const wrColor = (wr) => wr >= 50 ? 'text-green-400' : wr > 0 ? 'text-red-400' : 'text-zinc-400';

  const LeaderRow = ({ leader, index }) => (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 p-6 md:items-center hover:bg-zinc-800/30 transition-colors">
      {/* Mobile view */}
      <div className="flex justify-between items-center md:hidden mb-2">
        <div className="font-bold text-xl flex items-center gap-2">
          {index === 0 && <span className="text-yellow-400">🥇</span>}
          {index === 1 && <span className="text-zinc-300">🥈</span>}
          {index === 2 && <span className="text-amber-700">🥉</span>}
          {index > 2 && <span className="text-zinc-600">#{index + 1}</span>}
          <span className="font-mono text-lg text-zinc-300 ml-2">{shortenWallet(leader.walletAddress)}</span>
        </div>
        <span className="inline-flex items-center justify-center px-4 py-1 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-lg border border-amber-500/20">
          {leader.points} pts
        </span>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block col-span-1 text-center font-bold text-xl">
        {index === 0 && <span className="text-yellow-400">🥇</span>}
        {index === 1 && <span className="text-zinc-300">🥈</span>}
        {index === 2 && <span className="text-amber-700">🥉</span>}
        {index > 2 && <span className="text-zinc-600">#{index + 1}</span>}
      </div>
      <div className="hidden md:block col-span-3">
        <span className="font-mono text-lg text-zinc-300">{shortenWallet(leader.walletAddress)}</span>
      </div>

      {/* Stats */}
      <div className="md:col-span-4 flex items-center justify-center gap-2">
        <StatBadge label="TP" value={leader.totalPredictions} />
        <StatBadge label="WP" value={leader.wonPredictions} />
        <StatBadge label="WR" value={`${leader.winrate}%`} valueClass={wrColor(leader.winrate)} />
      </div>

      {/* Points */}
      <div className="flex justify-between items-center md:contents">
        <div className="md:col-span-2 text-left md:text-right">
          <span className="text-xs text-zinc-500 md:hidden mr-2">Weekly:</span>
          <span className="text-blue-400 font-bold text-lg">{leader.weeklyPoints}</span>
        </div>
        <div className="hidden md:block col-span-2 text-right">
          <span className="inline-flex items-center justify-center min-w-[80px] px-4 h-12 rounded-2xl bg-amber-500/10 text-amber-500 font-bold text-xl border border-amber-500/20">
            {leader.points}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Top Forecasters</h1>
        <p className="text-zinc-400">The most accurate predictors on Golden Goal, ranked by successful predictions.</p>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-zinc-800 text-sm font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-3">Wallet</div>
          <div className="col-span-4 text-center">Stats</div>
          <div className="col-span-2 text-right">Weekly Pts</div>
          <div className="col-span-2 text-right">Total Pts</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Calculating rankings...</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {leaders.map((leader, index) => (
              <LeaderRow key={leader.walletAddress} leader={leader} index={index} />
            ))}
            {leaders.length === 0 && (
              <div className="p-12 text-center text-zinc-600">No predictions have been resolved yet.</div>
            )}
          </div>
        )}
      </div>

      {/* My Rank Card */}
      {connected && userStats && (
        <div className="mt-6 relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-400/5 to-amber-500/10 rounded-3xl blur-xl pointer-events-none" />
          <div className="relative bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">Your Ranking</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
              {/* Rank Badge */}
              <div className="flex items-center gap-4 md:flex-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl font-black text-amber-400">
                  #{userStats.rank}
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-white">{shortenWallet(userStats.walletAddress)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Your wallet</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 md:flex-1 md:justify-center">
                <StatBadge label="TP" value={userStats.totalPredictions} />
                <StatBadge label="WP" value={userStats.wonPredictions} />
                <StatBadge label="WR" value={`${userStats.winrate}%`} valueClass={wrColor(userStats.winrate)} />
              </div>

              {/* Points */}
              <div className="flex items-center gap-4 md:justify-end">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Weekly</p>
                  <p className="text-blue-400 font-black text-xl">{userStats.weeklyPoints}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Total</p>
                  <p className="text-amber-400 font-black text-3xl">{userStats.points}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect prompt */}
      {!connected && (
        <div className="mt-6 text-center text-zinc-600 text-sm py-4">
          Connect your wallet to see your personal ranking.
        </div>
      )}
    </div>
  );
}
