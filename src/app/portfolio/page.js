"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TEAM_FLAGS } from '@/lib/flags';

export default function Portfolio() {
  const { connected, publicKey } = useWallet();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (connected && publicKey) {
        fetchBets();
    } else {
        setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchBets = async () => {
    try {
        const res = await fetch(`/api/user/bets?wallet=${publicKey.toBase58()}`);
        const data = await res.json();
        if (data.success) {
            setBets(data.bets);
            setPoints(data.points || 0);
        }
    } catch (err) {
        console.error("Error fetching portfolio", err);
    } finally {
        setLoading(false);
    }
  };

  if (!connected) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <span className="text-6xl mb-4">👻</span>
              <h2 className="text-2xl font-bold mb-2">Wallet Disconnected</h2>
              <p className="text-zinc-500">Please connect your Solana wallet to view your portfolio.</p>
          </div>
      );
  }

  const activeBets = bets.filter(b => b.betStatus === 'PENDING');
  const pastBets = bets.filter(b => b.betStatus !== 'PENDING');

  // Calculate some stats
  const correctPredictions = pastBets.filter(b => b.betStatus === 'WON').length;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <h1 className="text-4xl font-bold mb-8 text-amber-500">My Portfolio</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-tr from-amber-600/20 to-yellow-400/10 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
              <p className="text-amber-500 font-bold text-sm mb-1">Total Points</p>
              <p className="text-4xl font-bold text-white">{points}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <p className="text-zinc-400 text-sm mb-1">Total Predictions</p>
              <p className="text-3xl font-mono">{bets.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <p className="text-zinc-400 text-sm mb-1">Win Rate</p>
              <p className="text-3xl font-mono text-green-400">
                  {pastBets.length > 0 ? ((correctPredictions / pastBets.length) * 100).toFixed(0) : 0}%
              </p>
          </div>
      </div>

      {loading ? (
          <p className="text-zinc-500 text-center">Loading your history...</p>
      ) : (
          <div className="space-y-12">
              {/* Active Bets Section */}
              <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                      Active Predictions
                  </h2>
                  <div className="space-y-4">
                      {activeBets.map(bet => (
                          <div key={bet.betId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex-1">
                                  <span className="text-xs font-mono text-zinc-500 mb-2 inline-block">{new Date(bet.matchDate).toLocaleString()}</span>
                                  <h3 className="text-lg font-bold">
                                      <span className="mr-1">{TEAM_FLAGS[bet.teamA] || '🏳️'}</span>
                                      <span>{bet.teamA}</span> <span className="text-zinc-600 text-sm mx-2">vs</span> <span>{bet.teamB}</span>
                                      <span className="ml-1">{TEAM_FLAGS[bet.teamB] || '🏳️'}</span>
                                  </h3>
                                  <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">{bet.betType?.replace('_', ' ') || 'MAIN'}</p>
                                  <p className="text-xs text-zinc-500 mt-1">Placed on: {new Date(bet.timestamp).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                  <div className="text-right">
                                      <p className="text-xs text-zinc-500">Reward</p>
                                      <p className="font-mono font-bold text-amber-500">+{bet.pointsReward || 100} PTS</p>
                                  </div>
                                  <div className="h-8 w-px bg-zinc-800"></div>
                                  <div className="text-right">
                                      <p className="text-xs text-zinc-500">Your Pick</p>
                                      <p className="font-bold text-white">
                                          {bet.prediction}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {activeBets.length === 0 && <p className="text-zinc-500 bg-zinc-900/50 p-6 rounded-xl text-center border border-zinc-800 border-dashed">You have no active predictions.</p>}
                  </div>
              </section>

              {/* Past Bets Section */}
              <section>
                  <h2 className="text-2xl font-bold mb-4 text-zinc-500">Past Predictions</h2>
                  <div className="space-y-4 opacity-70">
                      {pastBets.map(bet => {
                          const isWin = bet.betStatus === 'WON';
                          
                          return (
                              <div key={bet.betId} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex-1">
                                      <h3 className="font-bold text-zinc-400">
                                          <span className="mr-1">{TEAM_FLAGS[bet.teamA] || '🏳️'}</span>
                                          <span>{bet.teamA}</span> <span className="text-zinc-700 text-sm mx-2">vs</span> <span>{bet.teamB}</span>
                                          <span className="ml-1">{TEAM_FLAGS[bet.teamB] || '🏳️'}</span>
                                      </h3>
                                      <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">{bet.betType?.replace('_', ' ') || 'MAIN'}</p>
                                      <p className="text-xs text-zinc-600 mt-1">Status: {bet.betStatus}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <p className="text-xs text-zinc-600">Your Pick: {bet.prediction}</p>
                                      </div>
                                      <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${isWin ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                          {isWin ? `+${bet.pointsReward || 100} PTS` : '0 PTS'}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                      {pastBets.length === 0 && <p className="text-zinc-600">No past history.</p>}
                  </div>
              </section>
          </div>
      )}
    </div>
  );
}
