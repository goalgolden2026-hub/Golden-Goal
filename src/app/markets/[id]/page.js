"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { TEAM_FLAGS } from '@/lib/flags';
import CustomModal from '@/components/CustomModal';

const LEFT_LEGENDS = [
  'ronaldo.png', 
  'pele.png', 
  'totti.png', 
  'gerrard.png', 
  'haaland.png',
  'baggio.png',
  'carlos.png',
  'kante.png',
  'neuer.png',
  'rijkaard.png',
  'zidane.png',
  'ronaldinho.png',
  'beckham.png',
  'davids.png',
  'henry.png',
  'del_piero.png'
];
const RIGHT_LEGENDS = [
  'messi.png', 
  'maradona.png', 
  'lampard.png', 
  'owen.png', 
  'mbappe.png',
  'figo.png',
  'dembele.png',
  'buffon.png',
  'nakata.png',
  'gullit.png',
  'basten.png',
  'pirlo.png',
  'gattuso.png',
  'pires.png',
  'materazzi.png',
  'kluivert.png'
];

export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const [market, setMarket] = useState(null);
  const [scoreInfo, setScoreInfo] = useState(null);
  const isLive = scoreInfo && scoreInfo.status === 'LIVE';
  const isMatchEnded = market && market.scoreA !== null && market.scoreB !== null && market.scoreA !== undefined && market.scoreB !== undefined;
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal State
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [predictionType, setPredictionType] = useState('');
  const [predictionOption, setPredictionOption] = useState('');
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const [userPredictions, setUserPredictions] = useState([]);
  const [resolvedOutcomes, setResolvedOutcomes] = useState({});
  const [legendIndex, setLegendIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Dynamic slot resolvers to show 2 players on each side (total 4 stacked legends)
  const leftSlotA = LEFT_LEGENDS[legendIndex]; // Top Left Player
  const leftSlotB = LEFT_LEGENDS[(legendIndex + 2) % LEFT_LEGENDS.length]; // Bottom Left Player

  const rightSlotA = RIGHT_LEGENDS[legendIndex]; // Top Right Player
  const rightSlotB = RIGHT_LEGENDS[(legendIndex + 2) % RIGHT_LEGENDS.length]; // Bottom Right Player

  useEffect(() => {
    if (!connected || !publicKey) {
      setUserPredictions([]);
      return;
    }
    
    const loadUserPredictions = async () => {
      try {
        const res = await fetch(`/api/user/predictions?wallet=${publicKey.toBase58()}`);
        const data = await res.json();
        if (data.success) {
          const currentMarketId = parseInt(params.id);
          const filtered = data.predictions.filter(p => p.marketId === currentMarketId);
          setUserPredictions(filtered);
        }
      } catch (err) {
        console.error("Failed to load user predictions:", err);
      }
    };
    
    loadUserPredictions();
  }, [params.id, connected, publicKey]);

  useEffect(() => {
    const loadResolvedOutcomes = async () => {
      try {
        const res = await fetch(`/api/admin/resolved-predictions?marketId=${params.id}`);
        const data = await res.json();
        if (data.success && data.resolved) {
          setResolvedOutcomes(data.resolved);
        }
      } catch (err) {
        console.error("Failed to load resolved outcomes:", err);
      }
    };
    loadResolvedOutcomes();
  }, [params.id]);

  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      setIsRotating(true);
    }, 5000); // 5 seconds initial delay to unblur first legends fully

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    if (!isRotating) return;

    const interval = setInterval(() => {
      setLegendIndex((prev) => (prev + 1) % LEFT_LEGENDS.length);
    }, 3000); // 3 seconds gorgeous cycling sequence

    return () => clearInterval(interval);
  }, [isRotating]);

  useEffect(() => {
    fetch(`/api/markets/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
            const m = data.market;
            const dateObj = new Date(m.matchDate);
            let tz = 'GMT';
            try {
                const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(dateObj);
                tz = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
            } catch (e) {}
            setMarket({
                ...m,
                dateStr: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                timeStr: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                tz: tz,
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

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch('/api/markets/live-scores');
        const data = await res.json();
        if (data.success && data.scores && data.scores[params.id]) {
          setScoreInfo(data.scores[params.id]);
        }
      } catch (err) {
        console.error("Failed to fetch live score:", err);
      }
    };
    fetchScore();
    const interval = setInterval(fetchScore, 60 * 1000);
    return () => clearInterval(interval);
  }, [params.id]);

  const openPredictionModal = (type, option) => {
    if (!connected) {
        setModalConfig({
            isOpen: true,
            title: "⚠️ Wallet Required",
            message: "Please connect your Solana wallet first to lock in your match predictions.",
            type: "warning",
            confirmText: "Close",
            onConfirm: null
        });
        return;
    }
    setPredictionType(type);
    setPredictionOption(option);
    setPredictionModalOpen(true);
  };

  const executePrediction = async () => {
    if (!publicKey) return;
    
    try {
        setIsProcessing(true);
        
        const res = await fetch('/api/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: publicKey.toBase58(),
                marketId: market.id,
                predictionType: predictionType,
                prediction: predictionOption,
                referredBy: localStorage.getItem('referralCode') || null
            })
        });
        const data = await res.json();
        
        if (data.success) {
            setModalConfig({
                isOpen: true,
                title: "🎯 Prediction Locked!",
                message: `Your prediction has been successfully locked!\n\nYou have ${data.remainingBets} predictions left today (Tier: ${data.tier}).`,
                type: "success",
                confirmText: "Great",
                onConfirm: null
            });
            setPredictionModalOpen(false);

            // Instantly load new user predictions to trigger glowing button state
            fetch(`/api/user/predictions?wallet=${publicKey.toBase58()}`)
                .then(res => res.json())
                .then(d => {
                    if (d.success) {
                        const currentMarketId = parseInt(params.id);
                        setUserPredictions(d.predictions.filter(p => p.marketId === currentMarketId));
                    }
                })
                .catch(err => console.error("Error refreshing predictions:", err));
        } else {
            setModalConfig({
                isOpen: true,
                title: "⚠️ Prediction Failed",
                message: data.error,
                type: "danger",
                confirmText: "Close",
                onConfirm: null
            });
        }
    } catch (error) {
        console.error("Prediction request failed:", error);
        setModalConfig({
            isOpen: true,
            title: "⚠️ Network Error",
            message: "Failed to communicate with prediction processing server.",
            type: "danger",
            confirmText: "Close",
            onConfirm: null
        });
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
              {options.map((opt, idx) => {
                  const isSelected = userPredictions.some(p => p.predictionType === type && p.prediction === opt);
                  const hasPredictedThisType = userPredictions.some(p => p.predictionType === type);

                  const winningOpt = resolvedOutcomes[type];
                  const isSubMarketResolved = winningOpt !== undefined;
                  const isWinner = isSubMarketResolved && winningOpt === opt;
                  const isUserWrongChoice = isSelected && isSubMarketResolved && !isWinner;

                  let btnStyle = "";
                  let statusIndicator = null;

                  if (isSubMarketResolved) {
                      if (isWinner) {
                          btnStyle = "bg-emerald-950/40 border-emerald-500/70 text-emerald-400 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-default";
                          statusIndicator = <span className="text-emerald-400 text-base font-bold">✓</span>;
                      } else if (isUserWrongChoice) {
                          btnStyle = "bg-rose-950/40 border-rose-500/70 text-rose-400 font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.25)] cursor-default";
                          statusIndicator = <span className="text-rose-400 text-base font-bold">✗</span>;
                      } else {
                          btnStyle = "bg-zinc-950/50 border-zinc-900/80 text-zinc-600 cursor-default opacity-40";
                      }
                  } else {
                      if (isSelected) {
                          btnStyle = "bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border-amber-500/60 text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse cursor-default disabled:cursor-default";
                          statusIndicator = <span className="text-amber-400 text-base">✓</span>;
                      } else {
                          btnStyle = "bg-zinc-800 hover:bg-zinc-700 border-transparent text-white disabled:opacity-30 disabled:cursor-not-allowed";
                      }
                  }

                  return (
                      <button 
                          key={idx}
                          onClick={() => !isSubMarketResolved && openPredictionModal(type, opt)}
                          disabled={market.isLocked || isSubMarketResolved || hasPredictedThisType}
                          className={`flex-1 min-w-[120px] font-medium py-4 px-4 rounded-xl text-sm text-center flex items-center justify-center gap-2 border transition-all duration-300 ${btnStyle}`}
                      >
                          {statusIndicator}
                          <span>{opt}</span>
                      </button>
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col flex-1 relative min-h-screen overflow-x-hidden bg-black w-full">
      {/* Left Side Rail (Rotating Stack - 2 Players Alt Alta) - Responsive Width, Z-0 */}
      <div className="hidden lg:flex fixed left-0 top-[8vh] w-[18vw] max-w-[280px] min-w-[150px] h-[88vh] z-0 flex-col justify-around items-center gap-4 pointer-events-none select-none">
        {/* Left Slot 1 (Top Left) - Facing RIGHT (Mirrored individually) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={leftSlotA}
            src={`/legends/${leftSlotA}`} 
            alt="Golden Goal Legend Left Top" 
            className="w-full h-full object-contain opacity-80 animate-cinematic-normal"
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>
        {/* Left Slot 2 (Bottom Left) - Facing RIGHT (Mirrored individually) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={leftSlotB}
            src={`/legends/${leftSlotB}`} 
            alt="Golden Goal Legend Left Bottom" 
            className="w-full h-full object-contain opacity-80 animate-cinematic-normal"
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Right Side Rail (Rotating Stack - 2 Players Alt Alta) - Responsive Width, Z-0 */}
      <div className="hidden lg:flex fixed right-0 top-[8vh] w-[18vw] max-w-[280px] min-w-[150px] h-[88vh] z-0 flex-col justify-around items-center gap-4 pointer-events-none select-none">
        {/* Right Slot 1 (Top Right) - Facing LEFT (Mirrored individually) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={rightSlotA}
            src={`/legends/${rightSlotA}`} 
            alt="Golden Goal Legend Right Top" 
            className="w-full h-full object-contain opacity-80 animate-cinematic-normal"
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>
        {/* Right Slot 2 (Bottom Right) - Facing LEFT (Mirrored individually) */}
        <div className="relative w-full h-[44vh] scale-x-[-1]">
          <img 
            key={rightSlotB}
            src={`/legends/${rightSlotB}`} 
            alt="Golden Goal Legend Right Bottom" 
            className="w-full h-full object-contain opacity-80 animate-cinematic-normal"
            style={{
              mixBlendMode: 'screen',
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Central Content Container - Elevated above side rails with z-10 */}
      <div className="relative z-10 flex flex-col flex-1 py-12 px-4 max-w-4xl mx-auto w-full">
          <button 
            onClick={() => router.push('/markets')}
            className="text-zinc-500 hover:text-white mb-8 self-start flex items-center gap-2 transition-colors"
          >
            ← Back to Markets
          </button>

          {/* Match Header */}
          <div 
            className={`text-center mb-12 relative overflow-hidden rounded-3xl p-8 border ${
              market.teamA === 'Mexico' && market.teamB === 'South Africa'
                ? 'border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
                : 'border-zinc-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            }`}
            style={{
              backgroundImage: "linear-gradient(to bottom, rgba(10, 10, 10, 0.4), rgba(10, 10, 10, 0.85)), url('/default-stadium-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
              {isLive ? (
                  <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xs font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                          • LIVE {scoreInfo.status === 'HT' ? 'HT' : scoreInfo.status === 'FT' ? 'FT' : `${scoreInfo.elapsed}'`}
                      </span>
                  </div>
              ) : isMatchEnded ? (
                  <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xs font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                          ✓ MATCH ENDED
                      </span>
                  </div>
              ) : (
                  <span className={`text-sm font-mono mb-2 block ${market.teamA === 'Mexico' && market.teamB === 'South Africa' ? 'text-amber-400 font-bold' : 'text-zinc-300'}`}>{market.dateStr} • {market.timeStr} {market.tz}</span>
              )}
              <div className="grid grid-cols-3 items-center w-full text-center text-3xl md:text-5xl font-extrabold mb-4 relative z-10">
                  {/* Team A */}
                  <div className="flex flex-col items-center gap-2 justify-center min-w-0">
                      <span className="text-5xl md:text-6xl drop-shadow-lg shrink-0">{TEAM_FLAGS[market.teamA] || '🏳️'}</span>
                      <span className="text-zinc-100 text-base md:text-lg lg:text-2xl leading-tight break-words w-full px-1">{market.teamA}</span>
                  </div>

                  {/* Center Score/VS */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                      {isLive ? (
                          <div className="flex flex-col items-center justify-center px-4">
                              <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.55)] tracking-tight">
                                  {scoreInfo.goalsA} - {scoreInfo.goalsB}
                              </span>
                          </div>
                      ) : isMatchEnded ? (
                          <div className="flex flex-col items-center justify-center px-4">
                              <span className="text-4xl md:text-6xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.55)] tracking-tight">
                                  {market.scoreA} - {market.scoreB}
                              </span>
                          </div>
                      ) : (
                          <span className="text-amber-500 text-xs font-black tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                              VS
                          </span>
                      )}
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col items-center gap-2 justify-center min-w-0">
                      <span className="text-5xl md:text-6xl drop-shadow-lg shrink-0">{TEAM_FLAGS[market.teamB] || '🏳️'}</span>
                      <span className="text-zinc-100 text-base md:text-lg lg:text-2xl leading-tight break-words w-full px-1">{market.teamB}</span>
                  </div>
              </div>
              {market.isLocked && !isLive && !isMatchEnded && (
                  <div className="inline-block bg-red-500/10 text-red-500 text-sm font-bold px-4 py-2 rounded-full border border-red-500/20 mt-4 relative z-10">
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

          {/* Prediction Modal */}
          {predictionModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="relative w-full max-w-md flex items-center justify-center">
                      
                      {/* Left Floating Legend - Framed on the left side of the modal, looking right */}
                      <div className="absolute right-full mr-8 top-1/2 -translate-y-1/2 w-[220px] h-[340px] hidden lg:block select-none pointer-events-none scale-x-[-1]">
                          <img 
                            key={leftSlotA}
                            src={`/legends/${leftSlotA}`} 
                            alt="Prediction Guard Left" 
                            className="w-full h-full object-contain opacity-70 animate-cinematic-normal"
                            style={{
                              mixBlendMode: 'screen',
                              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                            }}
                          />
                      </div>

                      {/* Prediction Modal Card */}
                      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full p-6 relative shadow-2xl z-10">
                          <button 
                            onClick={() => setPredictionModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                          >
                              ✕
                          </button>
                          <h3 className="text-xl font-bold mb-2 text-white">Lock in Prediction</h3>
                          <div className="flex items-center justify-center gap-3 text-lg font-bold text-zinc-400 mb-2 py-3 bg-zinc-950 rounded-xl border border-zinc-800">
                              <span>{market.teamA}</span>
                              <span className="text-zinc-600 text-sm">vs</span>
                              <span>{market.teamB}</span>
                          </div>
                          
                          <div className="bg-zinc-800/50 rounded-xl p-6 mb-6 border border-zinc-700 text-center mt-4">
                              <span className="text-zinc-400 block mb-2 text-sm uppercase tracking-wider">{predictionType.replace('_', ' ')}</span>
                              <span className="text-3xl font-extrabold text-yellow-400">{predictionOption}</span>
                          </div>

                          <p className="text-xs text-zinc-500 mb-6 text-center">Predicting is free. Make sure you hold enough Golden Tokens to qualify for your tier limit.</p>

                          <button 
                            onClick={executePrediction}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isProcessing}
                          >
                              {isProcessing ? "Processing..." : "Confirm Pick"}
                          </button>
                      </div>

                      {/* Right Floating Legend - Framed on the right side of the modal, looking left */}
                      <div className="absolute left-full ml-8 top-1/2 -translate-y-1/2 w-[220px] h-[340px] hidden lg:block select-none pointer-events-none scale-x-[-1]">
                          <img 
                            key={rightSlotA}
                            src={`/legends/${rightSlotA}`} 
                            alt="Prediction Guard Right" 
                            className="w-full h-full object-contain opacity-70 animate-cinematic-normal"
                            style={{
                              mixBlendMode: 'screen',
                              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                            }}
                          />
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
    </div>
  );
}
