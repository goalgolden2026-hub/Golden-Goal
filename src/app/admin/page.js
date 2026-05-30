"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CustomModal from '@/components/CustomModal';

export default function AdminDashboard() {
  const { connected, publicKey } = useWallet();
  const [markets, setMarkets] = useState([]);
  
  const [isResolving, setIsResolving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Resolve Modal State
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resolvedInfo, setResolvedInfo] = useState({});
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!connected || !publicKey) {
        setIsAuthorized(false);
        setCheckingAuth(false);
        return;
      }
      try {
        setCheckingAuth(true);
        const res = await fetch(`/api/admin/check?wallet=${publicKey.toBase58()}`);
        const data = await res.json();
        setIsAuthorized(data.success && data.authorized);
      } catch (err) {
        console.error("Auth check failed", err);
        setIsAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [connected, publicKey]);

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

  const openResolveModal = async (match) => {
      setSelectedMatch(match);
      setResolveModalOpen(true);
      setResolvedInfo({});
      try {
          const res = await fetch(`/api/admin/resolved-predictions?marketId=${match.id}`);
          const data = await res.json();
          if (data.success && data.resolved) {
              setResolvedInfo(data.resolved);
          }
      } catch (err) {
          console.error("Failed to fetch resolved predictions", err);
      }
  };

  const handleResolve = async (predictionType, winningPrediction) => {
      const executeResolve = async () => {
          setIsResolving(true);
          try {
              const res = await fetch('/api/admin/resolve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ marketId: selectedMatch.id, predictionType, winningPrediction })
              });
              const data = await res.json();
              
              if (data.success) {
                  setResolvedInfo(prev => ({
                      ...prev,
                      [predictionType]: winningPrediction
                  }));
                  fetchMarkets(); // Refresh progress badges
                  setModalConfig({
                      isOpen: true,
                      title: "🎉 Market Resolved!",
                      message: data.message,
                      type: "success",
                      confirmText: "Great",
                      onConfirm: null
                  });
              } else {
                  setModalConfig({
                      isOpen: true,
                      title: "⚠️ Resolution Error",
                      message: data.error,
                      type: "danger",
                      confirmText: "Close",
                      onConfirm: null
                  });
              }
          } catch (err) {
              setModalConfig({
                  isOpen: true,
                  title: "⚠️ Server Error",
                  message: "Failed to communicate with resolution flow server.",
                  type: "danger",
                  confirmText: "Close",
                  onConfirm: null
              });
              console.error(err);
          } finally {
              setIsResolving(false);
          }
      };

      setModalConfig({
          isOpen: true,
          title: "🏆 Resolve Market",
          message: `Are you sure you want to resolve ${predictionType} as ${winningPrediction}?\n\nPoints will be distributed to winners instantly and cannot be reversed!`,
          type: "warning",
          confirmText: "Yes, Resolve",
          cancelText: "No, Cancel",
          onConfirm: executeResolve
      });
  };

  if (!connected) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <span className="text-6xl mb-4">🔐</span>
              <h2 className="text-2xl font-bold mb-2">Admin Login Required</h2>
              <p className="text-zinc-500">Please connect the authorized admin wallet.</p>
          </div>
      );
  }

  if (checkingAuth) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
              <h2 className="text-xl font-bold">Verifying Credentials...</h2>
              <p className="text-zinc-500">Checking secure server authorizations.</p>
          </div>
      );
  }

  if (!isAuthorized) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <span className="text-6xl mb-4">⛔</span>
              <h2 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h2>
              <p className="text-zinc-500">Your wallet ({publicKey?.toBase58().slice(0,4)}...{publicKey?.toBase58().slice(-4)}) is not authorized.</p>
          </div>
      );
  }

  const renderResolveSection = (title, type, options) => {
      const selectedOpt = resolvedInfo[type];
      
      return (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4">
              <p className="text-zinc-400 text-sm mb-2 font-bold">{title}</p>
              <div className="flex flex-wrap gap-2">
                  {options.map(opt => {
                      const isSelected = selectedOpt === opt;
                      return (
                          <button
                              key={opt}
                              onClick={() => handleResolve(type, opt)}
                              disabled={isResolving}
                              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold border transition-all duration-300 ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border-amber-500/60 text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 disabled:opacity-50'
                              }`}
                          >
                              {isSelected && <span className="mr-1.5 text-amber-400 font-bold">✓</span>}
                              {opt} Won
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-4xl font-bold mb-8 text-amber-500">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Markets List */}
          <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xl font-bold mb-4">Manage World Cup Matches</h2>
              {markets.map(m => {
                  let resolvedList = m.resolvedMarkets ? m.resolvedMarkets.split(',').filter(Boolean) : [];
                  if (m.resolvedOutcomes) {
                      try {
                          const outcomesKeys = Object.keys(JSON.parse(m.resolvedOutcomes));
                          const combined = new Set([...resolvedList, ...outcomesKeys]);
                          resolvedList = Array.from(combined);
                      } catch (e) {
                          // Keep resolvedList as is
                      }
                  }
                  const isFullyResolved = resolvedList.length >= 6;
                  
                  return (
                      <div 
                          key={m.id} 
                          className={`bg-zinc-900 border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-300 ${
                              isFullyResolved 
                                ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-emerald-500/30' 
                                : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                          <div className="flex-1 text-left">
                              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                  <h3 className="text-xl font-bold text-white leading-none">{m.teamA} vs {m.teamB}</h3>
                                  {isFullyResolved ? (
                                      <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.15)] flex items-center gap-1 shrink-0">
                                          ✓ FULLY RESOLVED
                                      </span>
                                  ) : resolvedList.length > 0 ? (
                                      <span className="text-[10px] font-extrabold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                                          {resolvedList.length}/6 RESOLVED
                                      </span>
                                  ) : null}
                              </div>
                              <p className="text-xs text-zinc-500">Date: {new Date(m.matchDate).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => openResolveModal(m)} 
                                className={`flex-1 sm:flex-none py-2.5 px-6 rounded-xl text-sm font-bold border transition-colors ${
                                    isFullyResolved
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}
                              >
                                  {isFullyResolved ? 'Edit Resolution' : 'Resolve Sub-Markets'}
                              </button>
                          </div>
                      </div>
                  );
              })}
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

      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </div>
  );
}
