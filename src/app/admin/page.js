"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AdminDashboard() {
  const { connected, publicKey } = useWallet();
  const [markets, setMarkets] = useState([]);
  
  const [isResolving, setIsResolving] = useState(false);
  
  // Resolve Modal State
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
        const res = await fetch('/api/markets');
        const data = await res.json();
        if (data.success) {
            setMarkets(data.markets);
        }
    } catch (err) {
        console.error("Error fetching markets", err);
    }
  };

  const openResolveModal = (match) => {
      setSelectedMatch(match);
      setResolveModalOpen(true);
  };

  const handleResolve = async (predictionType, winningPrediction) => {
      if (!confirm(`Are you sure you want to resolve ${predictionType} as ${winningPrediction}? Points will be distributed to winners instantly.`)) return;

      setIsResolving(true);
      try {
          const res = await fetch('/api/admin/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ marketId: selectedMatch.id, predictionType, winningPrediction })
          });
          const data = await res.json();
          
          if (data.success) {
              alert(data.message);
          } else {
              alert('Error resolving market: ' + data.error);
          }
      } catch (err) {
          alert('Error during resolution flow');
          console.error(err);
      } finally {
          setIsResolving(false);
      }
  };

  const adminWalletsString = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";
  const hardcodedAdmins = [
    "2iF2q7hjEqEe8o6PTdJnYRYZUCeaMDjD35tSrKbu5R8K", // Owner / primary administrator
    "HMsWAhRC9wom6JVBpuo2gjAGp7Sb59FEyMraLpC4YXGc"  // Newly authorized administrator
  ];
  const authorizedWallets = [
    ...hardcodedAdmins,
    ...adminWalletsString.split(',').map(w => w.trim()).filter(Boolean)
  ];
  
  if (!connected) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <span className="text-6xl mb-4">🔐</span>
              <h2 className="text-2xl font-bold mb-2">Admin Login Required</h2>
              <p className="text-zinc-500">Please connect the authorized admin wallet.</p>
          </div>
      );
  }

  if (publicKey && !authorizedWallets.includes(publicKey.toBase58())) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <span className="text-6xl mb-4">⛔</span>
              <h2 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h2>
              <p className="text-zinc-500">Your wallet ({publicKey?.toBase58().slice(0,4)}...{publicKey?.toBase58().slice(-4)}) is not authorized.</p>
          </div>
      );
  }

  const renderResolveSection = (title, type, options) => (
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4">
          <p className="text-zinc-400 text-sm mb-2 font-bold">{title}</p>
          <div className="flex flex-wrap gap-2">
              {options.map(opt => (
                  <button
                      key={opt}
                      onClick={() => handleResolve(type, opt)}
                      disabled={isResolving}
                      className="flex-1 bg-zinc-800 hover:bg-green-600/50 hover:text-white hover:border-green-500/50 text-zinc-300 border border-zinc-700 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                  >
                      {opt} Won
                  </button>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-4xl font-bold mb-8 text-amber-500">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Markets List */}
          <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xl font-bold mb-4">Manage World Cup Matches</h2>
              {markets.map(m => (
                  <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{m.teamA} vs {m.teamB}</h3>
                          <p className="text-xs text-zinc-500">Date: {new Date(m.matchDate).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => openResolveModal(m)} 
                            className="flex-1 sm:flex-none bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2 px-6 rounded-xl text-sm font-bold transition-colors"
                          >
                              Resolve Sub-Markets
                          </button>
                      </div>
                  </div>
              ))}
              {markets.length === 0 && <p className="text-zinc-500">No matches found.</p>}
          </div>

      </div>

      {/* Resolve Modal */}
      {resolveModalOpen && selectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl my-8">
                  <button 
                    onClick={() => setResolveModalOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                  >
                      ✕
                  </button>
                  <h3 className="text-2xl font-bold mb-6">Resolve Markets: {selectedMatch.teamA} vs {selectedMatch.teamB}</h3>
                  
                  <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {renderResolveSection("Match Result", "MAIN", [selectedMatch.teamA, "Draw", selectedMatch.teamB])}
                      {renderResolveSection("Total Goals", "TOTAL_GOALS", ["Under 2.5", "Over 2.5"])}
                      {renderResolveSection("Both Teams to Score", "BTTS", ["Yes", "No"])}
                      {renderResolveSection("First Goalscorer", "FIRST_GOAL", [selectedMatch.teamA, "No Goal", selectedMatch.teamB])}
                      {renderResolveSection("Double Chance", "DOUBLE_CHANCE", [`${selectedMatch.teamA} & Draw`, `${selectedMatch.teamB} & Draw`])}
                      {renderResolveSection("First Half Winner", "FIRST_HALF", [selectedMatch.teamA, "Draw", selectedMatch.teamB])}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
