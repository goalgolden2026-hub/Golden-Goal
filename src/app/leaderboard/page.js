"use client";

import { useState, useEffect } from 'react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
          if (data.success) setLeaders(data.leaderboard);
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, []);

  // Utility to shorten wallet address
  const shortenWallet = (address) => {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Top Forecasters</h1>
          <p className="text-zinc-400">The most accurate predictors on Golden Goal, ranked by successful predictions.</p>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-zinc-800 text-sm font-bold text-zinc-500 uppercase tracking-wider">
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-6">Wallet Address</div>
              <div className="col-span-4 text-right">Total Points</div>
          </div>

          {loading ? (
              <div className="p-12 text-center text-zinc-500">Calculating rankings...</div>
          ) : (
              <div className="divide-y divide-zinc-800/50">
                  {leaders.map((leader, index) => (
                      <div key={leader.walletAddress} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-zinc-800/30 transition-colors">
                          <div className="col-span-2 text-center font-bold text-xl">
                              {index === 0 && <span className="text-yellow-400">🥇</span>}
                              {index === 1 && <span className="text-zinc-300">🥈</span>}
                              {index === 2 && <span className="text-amber-700">🥉</span>}
                              {index > 2 && <span className="text-zinc-600">#{index + 1}</span>}
                          </div>
                          <div className="col-span-6">
                              <span className="font-mono text-lg text-zinc-300">{shortenWallet(leader.walletAddress)}</span>
                          </div>
                          <div className="col-span-4 text-right">
                              <span className="inline-flex items-center justify-center min-w-[80px] px-4 h-12 rounded-2xl bg-amber-500/10 text-amber-500 font-bold text-xl border border-amber-500/20">
                                  {leader.points}
                              </span>
                          </div>
                      </div>
                  ))}
                  {leaders.length === 0 && (
                      <div className="p-12 text-center text-zinc-600">No predictions have been resolved yet.</div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
}
