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
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [syncDate, setSyncDate] = useState('2026-06-11'); // Default to World Cup start date
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState('');

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  // Holder & Trades Analysis Tab State
  const [activeTab, setActiveTab] = useState('resolution'); // 'resolution' | 'trades'
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

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

  const fetchAnalysis = async () => {
    if (!publicKey) return;
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    try {
        const res = await fetch(`/api/admin/holder-analysis?wallet=${publicKey.toBase58()}`);
        const data = await res.json();
        if (data.success) {
            setAnalysisData(data);
        } else {
            setAnalysisError(data.error || "Failed to load analysis data.");
        }
    } catch (err) {
        console.error("Error fetching analysis", err);
        setAnalysisError("Network or server error fetching analysis data.");
    } finally {
        setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trades' && publicKey) {
      fetchAnalysis();
    }
  }, [activeTab, publicKey]);

  const openResolveModal = async (match) => {
      setSelectedMatch(match);
      setScoreA(match.scoreA !== null && match.scoreA !== undefined ? String(match.scoreA) : '');
      setScoreB(match.scoreB !== null && match.scoreB !== undefined ? String(match.scoreB) : '');
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

  const handleSaveScore = async () => {
      if (!selectedMatch) return;
      setIsSavingScore(true);
      try {
          const res = await fetch('/api/admin/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  marketId: selectedMatch.id,
                  scoreA: scoreA !== '' ? parseInt(scoreA) : null,
                  scoreB: scoreB !== '' ? parseInt(scoreB) : null
              })
          });
          const data = await res.json();
          if (data.success) {
              setModalConfig({
                  isOpen: true,
                  title: "⚽ Score Saved!",
                  message: "Match final score has been successfully updated in the database.",
                  type: "success",
                  confirmText: "Great",
                  onConfirm: null
              });
              fetchMarkets(); // Refresh matches score on the main admin list
              // Update selectedMatch with new scores in-place so modal inputs stay in sync
              setSelectedMatch(prev => ({
                  ...prev,
                  scoreA: scoreA !== '' ? parseInt(scoreA) : null,
                  scoreB: scoreB !== '' ? parseInt(scoreB) : null
              }));
          } else {
              setModalConfig({
                  isOpen: true,
                  title: "⚠️ Save Error",
                  message: data.error || "Failed to update match score.",
                  type: "danger",
                  confirmText: "Close",
                  onConfirm: null
              });
          }
      } catch (err) {
          console.error(err);
          setModalConfig({
              isOpen: true,
              title: "⚠️ Server Error",
              message: "Failed to connect to resolution flow server.",
              type: "danger",
              confirmText: "Close",
              onConfirm: null
          });
      } finally {
          setIsSavingScore(false);
      }
  };

  const handleResolve = async (predictionType, winningPrediction) => {
      const executeResolve = async () => {
          setIsResolving(true);
          try {
              const res = await fetch('/api/admin/resolve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      marketId: selectedMatch.id, 
                      predictionType, 
                      winningPrediction,
                      scoreA: scoreA !== '' ? parseInt(scoreA) : null,
                      scoreB: scoreB !== '' ? parseInt(scoreB) : null
                  })
              });
              const data = await res.json();
              
              if (data.success) {
                  setResolvedInfo(prev => ({
                      ...prev,
                      [predictionType]: winningPrediction
                  }));
                  fetchMarkets(); // Refresh progress badges
                  // Update selectedMatch in place
                  setSelectedMatch(prev => ({
                      ...prev,
                      scoreA: scoreA !== '' ? parseInt(scoreA) : null,
                      scoreB: scoreB !== '' ? parseInt(scoreB) : null
                  }));
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

  const handleSportradarSync = async () => {
      if (!syncDate) return;
      setIsSyncing(true);
      setSyncLogs('Starting Sportradar Soccer v4 Sync...\nConnecting to Sportradar servers...');
      try {
          const res = await fetch('/api/admin/sportradar-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: syncDate })
          });
          const data = await res.json();
          if (data.success) {
              setSyncLogs(prev => prev + `\n\n🟢 SUCCESS:\n${data.message}`);
              fetchMarkets(); // Refresh match lists
              setModalConfig({
                  isOpen: true,
                  title: "🟢 Sync Completed!",
                  message: data.message,
                  type: "success",
                  confirmText: "Awesome",
                  onConfirm: null
              });
          } else {
              setSyncLogs(prev => prev + `\n\n🔴 ERROR:\n${data.error}`);
              setModalConfig({
                  isOpen: true,
                  title: "⚠️ Sync Failed",
                  message: data.error || "Failed to sync daily schedule.",
                  type: "danger",
                  confirmText: "Close",
                  onConfirm: null
              });
          }
      } catch (err) {
          console.error("Sync error:", err);
          setSyncLogs(prev => prev + `\n\n🔴 Network/Server error:\n${err.message}`);
          setModalConfig({
              isOpen: true,
              title: "⚠️ Server Error",
              message: "Failed to connect to automated sync server.",
              type: "danger",
              confirmText: "Close",
              onConfirm: null
          });
      } finally {
          setIsSyncing(false);
      }
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

  const renderTradesTab = () => {
      if (isLoadingAnalysis && !analysisData) {
          return (
              <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
                  <h3 className="text-lg font-bold text-white">Querying Helius Nodes...</h3>
                  <p className="text-zinc-500 text-sm">Parsing recent token swaps and native transfers.</p>
              </div>
          );
      }

      if (analysisError) {
          if (analysisError.includes("Helius API Key")) {
              return (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-3xl p-8 max-w-2xl mx-auto text-left shadow-xl">
                      <div className="flex gap-4">
                          <span className="text-3xl shrink-0">⚠️</span>
                          <div>
                              <h3 className="text-lg font-bold text-amber-400 mb-2">Helius API Key Not Found</h3>
                              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                  This tab requires a Helius API connection to retrieve Solana transactions. Please add your key to proceed.
                              </p>
                              <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-2 mb-6 leading-relaxed">
                                  <li>Go to <a href="https://dev.helius.xyz/" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">dev.helius.xyz</a> and sign up for a free account.</li>
                                  <li>Copy your API key from the dashboard.</li>
                                  <li>Add it to your <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">.env.local</code> as <code className="text-zinc-300">HELIUS_API_KEY="..."</code>.</li>
                              </ol>
                              <button 
                                  onClick={fetchAnalysis}
                                  className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-md"
                              >
                                  Retry Fetching
                              </button>
                          </div>
                      </div>
                  </div>
              );
          }

          return (
              <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-8 max-w-2xl mx-auto text-center shadow-xl">
                  <span className="text-3xl mb-2 block">❌</span>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Error Loading Data</h3>
                  <p className="text-sm text-zinc-400 mb-6">{analysisError}</p>
                  <button 
                      onClick={fetchAnalysis}
                      className="py-2.5 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-sm transition-colors border border-zinc-700"
                  >
                      Try Again
                  </button>
              </div>
          );
      }

      if (!analysisData) return null;

      const totalTrades = (analysisData.totalBuys || 0) + (analysisData.totalSells || 0);
      const buyPercentage = totalTrades > 0 ? Math.round((analysisData.totalBuys / totalTrades) * 100) : 0;
      const sellPercentage = totalTrades > 0 ? 100 - buyPercentage : 0;

      return (
          <div className="space-y-8 animate-fadeIn">
              
              {/* Header metrics card */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/80">
                  <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          📈 Token Swap Metrics
                          {analysisData.fromCache && (
                              <span className="text-[10px] font-extrabold tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                                  ⚡ CACHED
                              </span>
                          )}
                      </h2>
                      <p className="text-xs text-zinc-500">Real-time analysis computed from the last 100 on-chain actions.</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                          onClick={fetchAnalysis}
                          disabled={isLoadingAnalysis}
                          className="w-full md:w-auto py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                          {isLoadingAnalysis ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-zinc-300"></div>
                          ) : (
                              <span>🔄</span>
                          )}
                          Refresh Stats
                      </button>
                  </div>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Volume */}
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Trading Volume</span>
                          <span className="text-lg">🪙</span>
                      </div>
                      <h3 className="text-3xl font-extrabold text-amber-500 mb-1">
                          {analysisData.totalSolVolume} <span className="text-lg text-zinc-400">SOL</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500">Calculated over native and stable transfers</p>
                  </div>

                  {/* Card 2: Buys */}
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Buy Orders</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">+{buyPercentage}%</span>
                      </div>
                      <h3 className="text-3xl font-extrabold text-emerald-400 mb-1">
                          {analysisData.totalBuys} <span className="text-lg text-zinc-400">txs</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500">Purchases directly hitting liquidity pools</p>
                  </div>

                  {/* Card 3: Sells */}
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Sell Orders</span>
                          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">-{sellPercentage}%</span>
                      </div>
                      <h3 className="text-3xl font-extrabold text-rose-400 mb-1">
                          {analysisData.totalSells} <span className="text-lg text-zinc-400">txs</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500">Sales directly exiting liquidity pools</p>
                  </div>
              </div>

              {/* Buy vs Sell Ratio Meter */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2.5">
                      <span className="text-emerald-400">Buys ({analysisData.totalBuys})</span>
                      <span className="text-zinc-400">Buy vs Sell Volume Ratio</span>
                      <span className="text-rose-400">Sells ({analysisData.totalSells})</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-3 rounded-full flex overflow-hidden border border-zinc-800">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${buyPercentage}%` }}></div>
                      <div className="bg-gradient-to-r from-rose-500 to-rose-600" style={{ width: `${sellPercentage}%` }}></div>
                  </div>
              </div>

              {/* Main tables grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  
                  {/* Left: Top Buyers / Whales List */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-lg font-bold text-white">🐳 Top Buyers & Cost Basis</h3>
                              <p className="text-xs text-zinc-500">Top wallets by SOL spent in analyzed period</p>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider pb-3">
                                      <th className="pb-3 text-center w-12">#</th>
                                      <th className="pb-3">Trader Wallet</th>
                                      <th className="pb-3 text-right">SOL Spent</th>
                                      <th className="pb-3 text-right">Tokens</th>
                                      <th className="pb-3 text-right">Est. Avg Cost</th>
                                      <th className="pb-3 text-center w-16">Trades</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/50 text-sm">
                                  {analysisData.topBuyers && analysisData.topBuyers.map((b, idx) => {
                                      let medal = '';
                                      if (idx === 0) medal = '🥇';
                                      else if (idx === 1) medal = '🥈';
                                      else if (idx === 2) medal = '🥉';

                                      return (
                                          <tr key={b.wallet} className="hover:bg-zinc-950/40 transition-colors">
                                              <td className="py-3.5 text-center font-bold text-zinc-500">
                                                  {medal ? medal : idx + 1}
                                              </td>
                                              <td className="py-3.5 font-mono text-zinc-300">
                                                  <a 
                                                      href={`https://solscan.io/account/${b.wallet}`} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="hover:text-amber-400 hover:underline flex items-center gap-1 w-fit"
                                                  >
                                                      {b.wallet.slice(0, 6)}...{b.wallet.slice(-4)}
                                                      <span className="text-[10px] text-zinc-600">↗</span>
                                                  </a>
                                              </td>
                                              <td className="py-3.5 text-right font-bold text-white">
                                                  {b.totalSol.toFixed(2)} SOL
                                              </td>
                                              <td className="py-3.5 text-right text-zinc-300 font-sans">
                                                  {b.totalTokens.toLocaleString()}
                                              </td>
                                              <td className="py-3.5 text-right font-mono text-amber-500/80 text-xs">
                                                  {b.avgPrice.toFixed(8)} SOL
                                              </td>
                                              <td className="py-3.5 text-center font-semibold text-zinc-400">
                                                  {b.tradesCount}
                                              </td>
                                          </tr>
                                      );
                                  })}
                                  {(!analysisData.topBuyers || analysisData.topBuyers.length === 0) && (
                                      <tr>
                                          <td colSpan="6" className="py-10 text-center text-zinc-500 text-sm">
                                              No buy activities found in this dataset.
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* Right: Live Trades Feed */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-lg font-bold text-white">💸 Recent Swaps</h3>
                              <p className="text-xs text-zinc-500">Direct on-chain events in chronological order</p>
                          </div>
                      </div>
                      <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider pb-3 sticky top-0 bg-zinc-900 z-10">
                                      <th className="pb-3">Time</th>
                                      <th className="pb-3">Type</th>
                                      <th className="pb-3 text-right">SOL</th>
                                      <th className="pb-3 text-right">Tokens</th>
                                      <th className="pb-3 text-right">Price (SOL)</th>
                                      <th className="pb-3 text-center w-12">Tx</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/50 text-xs font-mono">
                                  {analysisData.trades && analysisData.trades.map((t) => {
                                      const isBuy = t.type === 'BUY';
                                      const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                                      return (
                                          <tr key={t.signature} className="hover:bg-zinc-950/40 transition-colors">
                                              <td className="py-3 text-zinc-500">
                                                  {timeStr}
                                              </td>
                                              <td className="py-3">
                                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border ${
                                                      isBuy 
                                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                                  }`}>
                                                      {t.type}
                                                  </span>
                                              </td>
                                              <td className={`py-3 text-right font-bold ${isBuy ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                                                  {t.solAmount > 0 ? `${t.solAmount.toFixed(3)} SOL` : '0.00 SOL'}
                                              </td>
                                              <td className="py-3 text-right text-zinc-300 font-sans">
                                                  {Math.round(t.tokenAmount).toLocaleString()}
                                              </td>
                                              <td className="py-3 text-right text-zinc-400">
                                                  {t.pricePerToken.toFixed(8)}
                                              </td>
                                              <td className="py-3 text-center">
                                                  <a 
                                                      href={`https://solscan.io/tx/${t.signature}`} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="hover:text-amber-400 text-zinc-600 transition-colors"
                                                  >
                                                      ↗
                                                  </a>
                                              </td>
                                          </tr>
                                      );
                                  })}
                                  {(!analysisData.trades || analysisData.trades.length === 0) && (
                                      <tr>
                                          <td colSpan="6" className="py-10 text-center text-zinc-500 font-sans text-sm">
                                              No swaps detected in the latest transactions.
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

              </div>

          </div>
      );
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-4xl font-bold mb-8 text-amber-500">Admin Dashboard</h1>

      {/* Tabs Menu */}
      <div className="flex gap-6 border-b border-zinc-800/80 mb-8">
          <button
              onClick={() => setActiveTab('resolution')}
              className={`pb-4 px-1 font-bold text-sm transition-all relative ${
                  activeTab === 'resolution'
                      ? 'text-amber-400 font-extrabold border-b-2 border-amber-500'
                      : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
              ⚽ Match Resolution
          </button>
          <button
              onClick={() => setActiveTab('trades')}
              className={`pb-4 px-1 font-bold text-sm transition-all relative ${
                  activeTab === 'trades'
                      ? 'text-amber-400 font-extrabold border-b-2 border-amber-500'
                      : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
              📊 Holder & Trades
          </button>
      </div>

      {activeTab === 'resolution' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Active Markets List */}
              <div className="lg:col-span-2 space-y-4">
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

              {/* Sportradar Automation Panel */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div className="flex items-center gap-2 mb-6">
                          <span className="text-2xl animate-pulse">⚡</span>
                          <h2 className="text-xl font-bold text-white">Sportradar Sync</h2>
                      </div>

                      <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                          Automatically fetch match scores, resolve all 6 prediction sub-markets, and distribute points to winning lockers using the Sportradar v4 Soccer API.
                      </p>

                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Select Target Date</label>
                              <input 
                                  type="date"
                                  value={syncDate}
                                  onChange={(e) => setSyncDate(e.target.value)}
                                  className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                              />
                          </div>

                          <button
                              onClick={handleSportradarSync}
                              disabled={isSyncing}
                              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-black text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              {isSyncing ? (
                                  <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-zinc-950 animate-pulse"></div>
                                      Syncing Fixtures...
                                  </>
                              ) : (
                                  <>
                                      <span>🔄</span>
                                      Run Auto-Resolver
                                  </>
                              )}
                          </button>
                      </div>

                      {syncLogs && (
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Automation Activity Log</label>
                              <pre className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-48 leading-normal custom-scrollbar">
                                  {syncLogs}
                              </pre>
                          </div>
                      )}
                  </div>
              </div>

          </div>
      ) : (
          renderTradesTab()
      )}

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
                  <h3 className="text-2xl font-bold mb-6 text-white">Resolve Markets: {selectedMatch.teamA} vs {selectedMatch.teamB}</h3>
                  
                  <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Match Score Input Section */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                              <p className="text-white font-bold text-sm mb-1">Set Match Score</p>
                              <p className="text-zinc-500 text-xs">Enter the final score to display on cards</p>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-zinc-400">{selectedMatch.teamA}</span>
                                  <input 
                                      type="number"
                                      placeholder="0"
                                      min="0"
                                      value={scoreA}
                                      onChange={(e) => setScoreA(e.target.value)}
                                      className="w-12 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-center font-bold text-white focus:outline-none focus:border-amber-500 text-sm"
                                  />
                              </div>
                              <span className="text-zinc-600 font-bold">-</span>
                              <div className="flex items-center gap-2">
                                  <input 
                                      type="number"
                                      placeholder="0"
                                      min="0"
                                      value={scoreB}
                                      onChange={(e) => setScoreB(e.target.value)}
                                      className="w-12 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-center font-bold text-white focus:outline-none focus:border-amber-500 text-sm"
                                  />
                                  <span className="text-xs font-bold text-zinc-400">{selectedMatch.teamB}</span>
                              </div>
                              <button
                                  onClick={handleSaveScore}
                                  disabled={isSavingScore}
                                  className="ml-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                              >
                                  {isSavingScore ? 'Saving...' : 'Save Score'}
                              </button>
                          </div>
                      </div>

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
