"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TEAM_FLAGS } from '@/lib/flags';
import CustomModal from '@/components/CustomModal';

const formatPredictionType = (type) => {
    if (!type) return 'Match Results';
    switch (type.toUpperCase()) {
        case 'MAIN':
        case 'MAIN_WINNER':
            return 'Match Results';
        case 'BTTS':
            return 'Both Teams to Score';
        case 'TOTAL_GOALS':
            return 'Total Goals';
        case 'DOUBLE_CHANCE':
            return 'Double Chance';
        case 'FIRST_GOAL':
            return 'First Goal';
        case 'FIRST_HALF':
            return 'First Half Winner';
        default:
            return type.replace('_', ' ');
    }
};

const formatPredictionValue = (val) => {
    if (!val) return '';
    return val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const spaceOutText = (text) => {
    if (!text) return '';
    return text.toUpperCase().split('').join(' ');
};

const drawTicket = (canvas, pred, walletAddress, bgImg) => {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 1600, 900);
    
    // Draw background image
    if (bgImg && bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, 1600, 900);
        
        // Draw dark premium overlay gradient
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, 900);
        overlayGrad.addColorStop(0, 'rgba(10, 10, 10, 0.65)');
        overlayGrad.addColorStop(0.5, 'rgba(12, 12, 12, 0.88)');
        overlayGrad.addColorStop(1, 'rgba(8, 8, 8, 0.98)');
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, 1600, 900);
    } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 1600, 900);
        bgGrad.addColorStop(0, '#09090b');
        bgGrad.addColorStop(0.5, '#111113');
        bgGrad.addColorStop(1, '#09090b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1600, 900);
    }

    // Glowing accent center orbs for premium stadium card design
    const glowGrad = ctx.createRadialGradient(800, 300, 20, 800, 300, 500);
    glowGrad.addColorStop(0, 'rgba(217, 119, 6, 0.12)');
    glowGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.01)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1600, 900);

    // Outer gold border (premium stadium card frame)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1520, 820);
    
    // Inner thin border
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, 1496, 796);

    // 1. Header Area (Enlarged to 18px, spaced out)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "bold 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#71717a';
    ctx.fillText(spaceOutText('GOLDEN GOAL PREDICTION PASS'), 800, 105);

    // Divider line 1 (below header)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 145);
    ctx.lineTo(1400, 145);
    ctx.stroke();

    // 2. Matchup Section Title (Enlarged to 16px, spaced out)
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#d97706';
    ctx.fillText(spaceOutText('MATCH FIXTURE'), 800, 180);

    const flagA = TEAM_FLAGS[pred.teamA] || '🏳️';
    const flagB = TEAM_FLAGS[pred.teamB] || '🏳️';
    const nameA = pred.teamA || '';
    const nameB = pred.teamB || '';

    // Draw Team A Flag (Centered, enlarged to 64px, and fillStyle set to opaque white)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = "64px 'Inter', sans-serif";
    ctx.fillText(flagA, 460, 265);
    
    // Draw Team A Name (Centered, enlarged to 36px/28px, spaced out)
    const nameAFontSize = nameA.length > 12 ? '28px' : '36px';
    ctx.font = `900 ${nameAFontSize} 'Outfit', 'Inter', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(spaceOutText(nameA), 460, 335);

    // VS center indicator (Centered at X=800, Y=295, enlarged to 32px, spaced out)
    ctx.font = "italic 900 32px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#52525b';
    ctx.fillText(spaceOutText('VS'), 800, 295);

    // Draw Team B Flag (Centered, enlarged to 64px, and fillStyle set to opaque white)
    ctx.fillStyle = '#ffffff';
    ctx.font = "64px 'Inter', sans-serif";
    ctx.fillText(flagB, 1140, 265);
    
    // Draw Team B Name (Centered, enlarged to 36px/28px, spaced out)
    const nameBFontSize = nameB.length > 12 ? '28px' : '36px';
    ctx.font = `900 ${nameBFontSize} 'Outfit', 'Inter', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(spaceOutText(nameB), 1140, 335);

    // Match Date (Centered below matchup, Y=415, enlarged to 18px)
    ctx.font = "bold 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#71717a';
    ctx.fillText(new Date(pred.matchDate).toLocaleString(), 800, 415);

    // Divider line 2 (below matchup)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(200, 450);
    ctx.lineTo(1400, 450);
    ctx.stroke();

    // 3. Forecast Details & Ticket Status headers (Enlarged to 16px, spaced out)
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#d97706';
    
    ctx.textAlign = 'left';
    ctx.fillText(spaceOutText('FORECAST DETAILS'), 200, 490);
    
    ctx.textAlign = 'right';
    ctx.fillText(spaceOutText('TICKET STATUS'), 1400, 490);

    // 1. Calculate dynamic widths for Forecast and Ticket Status card boxes
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    const forecastLabelWidth = ctx.measureText('Forecast: ').width;

    const forecastVal = formatPredictionType(pred.predictionType);
    const forecastValSize = forecastVal.length > 20 ? '22px' : '26px';
    ctx.font = `bold ${forecastValSize} 'Outfit', 'Inter', sans-serif`;
    const forecastValWidth = ctx.measureText(forecastVal).width;
    
    // Total width required inside the card is padding + label + value + right padding
    const leftCardRequired = (240 + forecastLabelWidth + forecastValWidth + 40) - 200;
    const leftCardWidth = Math.max(520, leftCardRequired);
    
    const gap = 80;
    const rightCardWidth = 1200 - leftCardWidth - gap;
    const rightCardX = 200 + leftCardWidth + gap;
    const rightCardCenter = rightCardX + rightCardWidth / 2;

    // Left card box (Forecast info, X=200, Y=520, H=170, W=leftCardWidth)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(200, 520, leftCardWidth, 170, 16);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(200, 520, leftCardWidth, 170);
    }
    
    // Draw Forecast Info (Left Column: Symmetrical Inline Label & Value Rows)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Row 1: Forecast Label & Value
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#71717a';
    ctx.fillText('Forecast: ', 240, 570);
    
    ctx.font = `bold ${forecastValSize} 'Outfit', 'Inter', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(forecastVal, 240 + forecastLabelWidth, 570);

    // Row 2: Pick Label & Value
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#71717a';
    ctx.fillText('Pick: ', 240, 640);
    const pickLabelWidth = ctx.measureText('Pick: ').width;
    
    ctx.font = "900 32px 'Outfit', 'Inter', sans-serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(formatPredictionValue(pred.prediction), 240 + pickLabelWidth, 640);

    // Right card box (Ticket Status, X=rightCardX, Y=520, W=rightCardWidth, H=170)
    const isSettled = pred.predictionStatus === 'WON' || pred.predictionStatus === 'LOST';
    const isWin = pred.predictionStatus === 'WON';

    ctx.fillStyle = isSettled 
        ? (isWin ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)') 
        : 'rgba(245, 158, 11, 0.02)';
    ctx.strokeStyle = isSettled 
        ? (isWin ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)') 
        : 'rgba(245, 158, 11, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(rightCardX, 520, rightCardWidth, 170, 16);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(rightCardX, 520, rightCardWidth, 170);
    }

    // Centered Ticket Status details inside the right card
    ctx.textAlign = 'center';
    ctx.font = "900 38px 'Outfit', 'Inter', sans-serif";
    if (isSettled) {
        ctx.fillStyle = isWin ? '#10b981' : '#ef4444';
        ctx.fillText(isWin ? '🏆 WON' : '❌ LOST', rightCardCenter, 580);
        ctx.font = "bold 20px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#71717a';
        ctx.fillText(isWin ? `+${pred.pointsReward || 100} PTS AWARDED` : '0 PTS REWARDED', rightCardCenter, 635);
    } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('⌛ PENDING', rightCardCenter, 580);
        ctx.font = "bold 20px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#71717a';
        ctx.fillText(`+${pred.pointsReward || 100} PTS PENDING`, rightCardCenter, 635);
    }

    // Divider line 3 (above footer branding)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 730);
    ctx.lineTo(1400, 730);
    ctx.stroke();

    // 4. Footer Branding (Enlarged to 18px)
    ctx.textAlign = 'left';
    ctx.font = "bold 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#52525b';
    ctx.fillText('www.goldengoalsol.com', 200, 790);

    if (walletAddress) {
        const masked = `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}`;
        ctx.textAlign = 'right';
        ctx.font = "bold 18px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#52525b';
        ctx.fillText(`PLAYER: ${masked}`, 1400, 790);
        ctx.textAlign = 'left';
    }
};

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [managingPredictionId, setManagingPredictionId] = useState(null);
  const [changePredictionModal, setChangePredictionModal] = useState(null); // stores the prediction object being changed
  const [shareTicketModal, setShareTicketModal] = useState(null); // stores the prediction object being shared
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
    if (shareTicketModal) {
      // Pre-load the stadium background image
      const bgImg = new Image();
      bgImg.src = '/default-stadium-bg.png';
      
      const draw = () => {
        const canvas = document.getElementById('ticket-canvas');
        if (canvas) {
          drawTicket(canvas, shareTicketModal, publicKey?.toBase58(), bgImg);
        }
      };

      bgImg.onload = draw;
      
      if (bgImg.complete) {
        draw();
      }

      // Re-draw once web fonts are fully loaded to prevent browser default font overrides
      if (typeof document !== 'undefined' && document.fonts) {
          document.fonts.ready.then(() => {
              draw();
          });
      }

      // Fallback in case loading takes too long or fails
      const timer = setTimeout(() => {
        const canvas = document.getElementById('ticket-canvas');
        if (canvas) {
          drawTicket(canvas, shareTicketModal, publicKey?.toBase58(), bgImg.complete ? bgImg : null);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [shareTicketModal, publicKey]);

  const handleDownloadTicket = (pred) => {
      const canvas = document.getElementById('ticket-canvas');
      if (canvas) {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `GoldenGoal_Ticket_${pred.teamA}_vs_${pred.teamB}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  const handleShareOnX = (pred) => {
      // Copy canvas to clipboard as PNG (using a Promise to preserve user activation and focus)
      const canvas = document.getElementById('ticket-canvas');
      if (canvas) {
          try {
              const imagePromise = new Promise((resolve) => {
                  canvas.toBlob((blob) => {
                      resolve(blob);
                  }, 'image/png');
              });

              const item = new ClipboardItem({ "image/png": imagePromise });
              navigator.clipboard.write([item]).then(() => {
                  setModalConfig({
                      isOpen: true,
                      title: "📋 Copied to Clipboard!",
                      message: "Your ticket image has been copied to your clipboard.\n\nSimply press Ctrl+V (or Cmd+V on Mac) in the Twitter post window to attach your ticket image!",
                      type: "success",
                      confirmText: "Got It",
                      onConfirm: null
                  });
              }).catch((err) => {
                  console.error("Clipboard writing promise failed:", err);
              });
          } catch (clipErr) {
              console.error("Clipboard write error:", clipErr);
          }
      }

      const isSettled = pred.predictionStatus === 'WON' || pred.predictionStatus === 'LOST';
      const isWin = pred.predictionStatus === 'WON';
      
      let tweetText = "";
      if (isSettled) {
          if (isWin) {
              tweetText = `🏆 I predicted ${pred.teamA.toUpperCase()} vs ${pred.teamB.toUpperCase()} correctly and won +${pred.pointsReward || 100} PTS on @goldengoalsol!\n\nCheck out my ticket! 👇\n\n#GoldenGoal #Solana`;
          } else {
              tweetText = `⚽️ My forecast for ${pred.teamA.toUpperCase()} vs ${pred.teamB.toUpperCase()} on @goldengoalsol.\n\nWe analyze and go again! Join the prediction economy! 🏆\n\n#GoldenGoal #Solana`;
          }
      } else {
          tweetText = `⚽️ I just placed a prediction on ${pred.teamA.toUpperCase()} vs ${pred.teamB.toUpperCase()} at @goldengoalsol!\n\nPredict World Cup matches for free! 🏆\n\n#GoldenGoal #Solana`;
      }
      
      const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://goldengoalsol.com')}`;
      window.open(shareUrl, '_blank');
  };
  
  useEffect(() => {
    if (connected && publicKey) {
        fetchPredictions();
    } else {
        setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchPredictions = async () => {
    try {
        const res = await fetch(`/api/user/predictions?wallet=${publicKey.toBase58()}`);
        const data = await res.json();
        if (data.success) {
            setPredictions(data.predictions);
            setPoints(data.points || 0);
        }
    } catch (err) {
        console.error("Error fetching dashboard data", err);
    } finally {
        setLoading(false);
    }
  };

  const handleManagePrediction = async (predictionId, action, newPrediction = null) => {
      const executeAction = async () => {
          try {
              setManagingPredictionId(predictionId);
              const res = await fetch(`/api/predictions/manage`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      walletAddress: publicKey.toBase58(),
                      predictionId: predictionId,
                      action,
                      newPrediction
                  })
              });
              const data = await res.json();
              if (data.success) {
                  setModalConfig({
                      isOpen: true,
                      title: "🎉 Success!",
                      message: data.message,
                      type: "success",
                      confirmText: "Great",
                      onConfirm: null
                  });
                  if (changePredictionModal) setChangePredictionModal(null);
                  fetchPredictions(); // Refresh list
              } else {
                  setModalConfig({
                      isOpen: true,
                      title: "⚠️ Action Failed",
                      message: data.error,
                      type: "danger",
                      confirmText: "Close",
                      onConfirm: null
                  });
              }
          } catch (err) {
              console.error("Manage prediction error:", err);
              setModalConfig({
                  isOpen: true,
                  title: "⚠️ Server Error",
                  message: err.message,
                  type: "danger",
                  confirmText: "Close",
                  onConfirm: null
              });
          } finally {
              setManagingPredictionId(null);
          }
      };

      if (action === 'CANCEL') {
          setModalConfig({
              isOpen: true,
              title: "🗑️ Cancel Prediction?",
              message: "Are you sure you want to cancel this prediction?\n\nThis will cost 20.000 $GoldenGoal (10.000 burned, 10.000 to Treasury).",
              type: "warning",
              confirmText: "Yes, Cancel",
              cancelText: "No, Keep It",
              onConfirm: executeAction
          });
          return;
      }
      
      executeAction();
  };

  const getOptionsForPredictionType = (pred) => {
      const { predictionType, teamA, teamB } = pred;
      switch (predictionType) {
          case 'TOTAL_GOALS': return ["Under 2.5", "Over 2.5"];
          case 'BTTS': return ["Yes", "No"];
          case 'DOUBLE_CHANCE': return [`${teamA} & Draw`, `${teamB} & Draw`];
          case 'FIRST_GOAL': return [teamA, "No Goal", teamB];
          case 'FIRST_HALF':
          case 'MAIN':
          default:
              return [teamA, "Draw", teamB];
      }
  };

  if (!connected) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <span className="text-6xl mb-4">👻</span>
              <h2 className="text-2xl font-bold mb-2">Wallet Disconnected</h2>
              <p className="text-zinc-500">Please connect your Solana wallet to view your dashboard.</p>
          </div>
      );
  }

  const activePredictions = predictions.filter(p => p.predictionStatus === 'PENDING');
  const pastPredictions = predictions.filter(p => p.predictionStatus === 'WON' || p.predictionStatus === 'LOST');

  // Calculate stats
  const correctPredictions = pastPredictions.filter(p => p.predictionStatus === 'WON').length;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <h1 className="text-4xl font-bold mb-8 text-amber-500 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-tr from-amber-600/20 to-yellow-400/10 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
              <p className="text-amber-500 font-bold text-sm mb-1">Total Points</p>
              <p className="text-4xl font-bold text-white">{points}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <p className="text-zinc-400 text-sm mb-1">Total Predictions</p>
              <p className="text-3xl font-mono">{predictions.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <p className="text-zinc-400 text-sm mb-1">Win Rate</p>
              <p className="text-3xl font-mono text-green-400">
                  {pastPredictions.length > 0 ? ((correctPredictions / pastPredictions.length) * 100).toFixed(0) : 0}%
              </p>
          </div>
      </div>

      {loading ? (
          <p className="text-zinc-500 text-center">Loading your history...</p>
      ) : (
          <div className="space-y-12">
              {/* Active Predictions Section */}
              <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                      Active Predictions
                  </h2>
                  <div className="space-y-4">
                      {activePredictions.map(pred => (
                          <div key={pred.predictionId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex-1">
                                  <span className="text-xs font-mono text-zinc-500 mb-2 inline-block">{new Date(pred.matchDate).toLocaleString()}</span>
                                  <h3 className="text-lg font-bold">
                                      <span className="mr-1">{TEAM_FLAGS[pred.teamA] || '🏳️'}</span>
                                      <span>{pred.teamA}</span> <span className="text-zinc-600 text-sm mx-2">vs</span> <span>{pred.teamB}</span>
                                      <span className="ml-1">{TEAM_FLAGS[pred.teamB] || '🏳️'}</span>
                                  </h3>
                                  <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">{formatPredictionType(pred.predictionType)}</p>
                                  <p className="text-xs text-zinc-500 mt-1">
                                      Placed on: {new Date(pred.timestamp).toLocaleString()}
                                      {pred.updatedAt && <span className="ml-2 pl-2 border-l border-zinc-800 text-amber-500/80">Changed: {new Date(pred.updatedAt).toLocaleString()}</span>}
                                  </p>
                                </div>
                              <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                  <div className="text-right">
                                      <p className="text-xs text-zinc-500">Reward</p>
                                      <p className="font-mono font-bold text-amber-500">+{pred.pointsReward || 100} PTS</p>
                                  </div>
                                  <div className="h-8 w-px bg-zinc-800"></div>
                                  <div className="text-right">
                                      <p className="text-xs text-zinc-500">Your Pick</p>
                                      <p className="font-bold text-white">
                                          {pred.prediction}
                                      </p>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-2 border-l border-zinc-800 pl-4 w-full md:w-auto">
                                  <button 
                                      onClick={() => setShareTicketModal(pred)}
                                      className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 py-2 px-3 rounded-lg transition-colors border border-amber-500/20 hover:border-amber-500/40 flex justify-center items-center gap-1 font-bold animate-pulse"
                                  >
                                      🎫 Share Ticket
                                  </button>
                                  <button 
                                      onClick={() => setChangePredictionModal(pred)}
                                      disabled={managingPredictionId === pred.predictionId}
                                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg transition-colors border border-transparent hover:border-zinc-600 disabled:opacity-50 flex justify-center items-center gap-1"
                                  >
                                      ✏️ Change (10.000 <span className="text-amber-500 font-bold">$GoldenGoal</span>)
                                  </button>
                                  <button 
                                      onClick={() => handleManagePrediction(pred.predictionId, 'CANCEL')}
                                      disabled={managingPredictionId === pred.predictionId}
                                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-3 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 flex justify-center items-center gap-1"
                                  >
                                      {managingPredictionId === pred.predictionId ? 'Processing...' : <>🗑️ Cancel (20.000 <span className="text-amber-500 font-bold">$GoldenGoal</span>)</>}
                                  </button>
                              </div>
                          </div>
                      ))}
                      {activePredictions.length === 0 && <p className="text-zinc-500 bg-zinc-900/50 p-6 rounded-xl text-center border border-zinc-800 border-dashed">You have no active predictions.</p>}
                  </div>
              </section>

              {/* Past Predictions Section */}
              <section>
                  <h2 className="text-2xl font-bold mb-4 text-zinc-500">Past Predictions</h2>
                  <div className="space-y-4 opacity-70">
                      {pastPredictions.map(pred => {
                          const isWin = pred.predictionStatus === 'WON';
                          
                          return (
                              <div key={pred.predictionId} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex-1">
                                      <h3 className="font-bold text-zinc-400">
                                          <span className="mr-1">{TEAM_FLAGS[pred.teamA] || '🏳️'}</span>
                                          <span>{pred.teamA}</span> <span className="text-zinc-700 text-sm mx-2">vs</span> <span>{pred.teamB}</span>
                                          <span className="ml-1">{TEAM_FLAGS[pred.teamB] || '🏳️'}</span>
                                      </h3>
                                      <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">{formatPredictionType(pred.predictionType)}</p>
                                      <p className="text-xs text-zinc-600 mt-1">Status: {pred.predictionStatus}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <p className="text-xs text-zinc-600">Your Pick: {pred.prediction}</p>
                                      </div>
                                      <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${isWin ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                          {isWin ? `+${pred.pointsReward || 100} PTS` : '0 PTS'}
                                      </div>
                                      <button 
                                          onClick={() => setShareTicketModal(pred)}
                                          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 px-3 rounded-lg transition-colors border border-zinc-700 flex justify-center items-center gap-1 font-bold"
                                      >
                                          🎫 Share Ticket
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                      {pastPredictions.length === 0 && <p className="text-zinc-600">No past history.</p>}
                  </div>
              </section>
          </div>
      )}

      {/* Change Prediction Modal */}
      {changePredictionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
                  <button 
                    onClick={() => setChangePredictionModal(null)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                  >
                      ✕
                  </button>
                  <h3 className="text-xl font-bold mb-2">Change Prediction</h3>
                  <div className="flex items-center justify-center gap-3 text-lg font-bold text-zinc-400 mb-2 py-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span>{changePredictionModal.teamA}</span>
                      <span className="text-zinc-600 text-sm">vs</span>
                      <span>{changePredictionModal.teamB}</span>
                  </div>
                  
                  <div className="mb-6 mt-4">
                      <p className="text-sm text-zinc-400 mb-3 text-center uppercase tracking-wider">{formatPredictionType(changePredictionModal.predictionType)}</p>
                      <div className="flex flex-col gap-2">
                          {getOptionsForPredictionType(changePredictionModal).map((opt, idx) => (
                              <button 
                                  key={idx}
                                  onClick={() => handleManagePrediction(changePredictionModal.predictionId, 'CHANGE', opt)}
                                  disabled={managingPredictionId === changePredictionModal.predictionId || opt === changePredictionModal.prediction}
                                  className={`w-full py-3 rounded-xl border font-bold transition-all ${
                                      opt === changePredictionModal.prediction 
                                          ? 'bg-amber-500/20 border-amber-500 text-amber-500 opacity-50 cursor-not-allowed' 
                                          : 'bg-zinc-800 hover:bg-zinc-700 border-transparent text-white'
                                  }`}
                              >
                                  {opt === changePredictionModal.prediction ? `${opt} (Current Pick)` : opt}
                              </button>
                          ))}
                      </div>
                  </div>

                  <p className="text-xs text-amber-500/80 mb-2 text-center bg-amber-500/10 p-2 rounded-lg">
                      Cost: 10.000 $GoldenGoal<br/>
                      <span className="text-zinc-500">5.000 permanently burned | 5.000 to Treasury</span>
                  </p>
              </div>
          </div>
      )}

      {/* Share Ticket Modal */}
      {shareTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl flex flex-col items-center">
                  <button 
                    onClick={() => setShareTicketModal(null)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white text-lg font-bold"
                  >
                      ✕
                  </button>
                  <h3 className="text-xl font-bold mb-1 text-white">Prediction Ticket</h3>
                  <p className="text-zinc-500 text-xs mb-4 text-center">Save your custom ticket image to share it directly on X (Twitter).</p>
                  
                  {/* Canvas Container */}
                  <div className="w-full aspect-[16/9] relative bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-inner flex items-center justify-center">
                      <canvas 
                        id="ticket-canvas" 
                        width="1600" 
                        height="900" 
                        className="w-full h-auto block rounded-2xl"
                      />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                      <button
                        onClick={() => handleDownloadTicket(shareTicketModal)}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black transition-colors flex items-center justify-center gap-2"
                      >
                        📥 Download Ticket
                      </button>
                      <button
                        onClick={() => handleShareOnX(shareTicketModal)}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Share on X
                      </button>
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

