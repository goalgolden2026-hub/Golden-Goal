"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TEAM_FLAGS } from '@/lib/flags';

export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal State
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betType, setBetType] = useState('');
  const [betPrediction, setBetPrediction] = useState('');

  useEffect(() => {
    fetch(`/api/markets/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
            const m = data.market;
            const dateObj = new Date(m.matchDate);
            setMarket({
                ...m,
                dateStr: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                timeStr: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                isLocked: dateObj.getTime() < Date.now()
            });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load match:", err);
        setLoading(false);
      });
  }, [params.id]);

  const openBetModal = (type, prediction) => {
    if (!connected) {
        alert("Please connect your wallet first!");
        return;
    }
    setBetType(type);
    setBetPrediction(prediction);
    setBetModalOpen(true);
  };

  const executeBet = async () => {
    if (!publicKey) return;
    
    try {
        setIsProcessing(true);
        
        const res = await fetch('/api/bets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: publicKey.toBase58(),
                marketId: market.id,
                betType: betType,
                prediction: betPrediction
            })
        });
        const data = await res.json();
        
        if (data.success) {
            alert(`Prediction locked! You have ${data.remainingBets} bets left today (Tier: ${data.tier}).`);
            setBetModalOpen(false);
        } else {
            alert('Prediction failed: ' + data.error);
        }
    } catch (error) {
        console.error("Bet request failed:", error);
        alert("Server error: " + error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) {
      return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading match details...</div>;
  }

  if (!market) {
      return <div className="flex-1 flex items-center justify-center text-zinc-500">Match not found.</div>;
  }

  const renderMarketSection = (title, type, options) => (
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-zinc-300">{title}</h3>
          <div className="flex flex-wrap gap-2">
              {options.map((opt, idx) => (
                  <button 
                      key={idx}
                      onClick={() => openBetModal(type, opt)}
                      disabled={market.isLocked}
                      className="flex-1 min-w-[120px] bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent text-white font-medium py-4 px-4 rounded-xl transition-all text-sm text-center"
                  >
                      {opt}
                  </button>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col flex-1 py-12 px-4 max-w-4xl mx-auto w-full">
      <button 
        onClick={() => router.push('/markets')}
        className="text-zinc-500 hover:text-white mb-8 self-start flex items-center gap-2 transition-colors"
      >
        ← Back to Markets
      </button>

      {/* Match Header */}
      <div className="text-center mb-12 relative">
          <span className="text-sm font-mono text-yellow-500 mb-2 block">{market.dateStr} • {market.timeStr} GMT</span>
          <div className="flex items-center justify-center gap-8 text-3xl md:text-5xl font-extrabold mb-4">
              <div className="flex flex-col items-center gap-2">
                  <span className="text-5xl md:text-6xl drop-shadow-lg">{TEAM_FLAGS[market.teamA] || '🏳️'}</span>
                  <span>{market.teamA}</span>
              </div>
              <span className="text-zinc-600 text-2xl font-normal mt-12">vs</span>
              <div className="flex flex-col items-center gap-2">
                  <span className="text-5xl md:text-6xl drop-shadow-lg">{TEAM_FLAGS[market.teamB] || '🏳️'}</span>
                  <span>{market.teamB}</span>
              </div>
          </div>
          {market.isLocked && (
              <div className="inline-block bg-red-500/10 text-red-500 text-sm font-bold px-4 py-2 rounded-full border border-red-500/20 mt-4">
                  MATCH LOCKED
              </div>
          )}
      </div>

      {/* Sub-Markets */}
      <div className="flex flex-col gap-2">
          {renderMarketSection("Match Result", "MAIN", [market.teamA, "Draw", market.teamB])}
          {renderMarketSection("Total Goals", "TOTAL_GOALS", ["Under 2.5", "Over 2.5"])}
          {renderMarketSection("Both Teams to Score", "BTTS", ["Yes", "No"])}
          {renderMarketSection("First Goalscorer", "FIRST_GOAL", [market.teamA, "No Goal", market.teamB])}
          {renderMarketSection("Double Chance", "DOUBLE_CHANCE", [`${market.teamA} & Draw`, `${market.teamB} & Draw`])}
          {renderMarketSection("First Half Winner", "FIRST_HALF", [market.teamA, "Draw", market.teamB])}
      </div>

      {/* Bet Modal */}
      {betModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
                  <button 
                    onClick={() => setBetModalOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                  >
                      ✕
                  </button>
                  <h3 className="text-xl font-bold mb-2">Lock in Prediction</h3>
                  <div className="flex items-center justify-center gap-3 text-lg font-bold text-zinc-400 mb-2 py-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span>{market.teamA}</span>
                      <span className="text-zinc-600 text-sm">vs</span>
                      <span>{market.teamB}</span>
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-xl p-6 mb-6 border border-zinc-700 text-center mt-4">
                      <span className="text-zinc-400 block mb-2 text-sm uppercase tracking-wider">{betType.replace('_', ' ')}</span>
                      <span className="text-3xl font-extrabold text-yellow-400">{betPrediction}</span>
                  </div>

                  <p className="text-xs text-zinc-500 mb-6 text-center">Predicting is free. Make sure you hold enough Golden Tokens to qualify for your tier limit.</p>

                  <button 
                    onClick={executeBet}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isProcessing}
                  >
                      {isProcessing ? "Processing..." : "Confirm Pick"}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
