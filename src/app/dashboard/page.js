"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TEAM_FLAGS } from '@/lib/flags';
import CustomModal from '@/components/CustomModal';

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [managingPredictionId, setManagingPredictionId] = useState(null);
  const [changePredictionModal, setChangePredictionModal] = useState(null); // stores the prediction object being changed
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
              message: "Are you sure you want to cancel this prediction?\n\nThis will cost 10.000 $GoldenGoal (5.000 burned, 5.000 to Treasury).",
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
                                  <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">{pred.predictionType?.replace('_', ' ') || 'MAIN'}</p>
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
                                      onClick={() => setChangePredictionModal(pred)}
                                      disabled={managingPredictionId === pred.predictionId}
                                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg transition-colors border border-transparent hover:border-zinc-600 disabled:opacity-50 flex justify-center items-center gap-1"
                                  >
                                      ✏️ Change (5.000 <span className="text-amber-500 font-bold">$GoldenGoal</span>)
                                  </button>
                                  <button 
                                      onClick={() => handleManagePrediction(pred.predictionId, 'CANCEL')}
                                      disabled={managingPredictionId === pred.predictionId}
                                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-3 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 flex justify-center items-center gap-1"
                                  >
                                      {managingPredictionId === pred.predictionId ? 'Processing...' : <>🗑️ Cancel (10.000 <span className="text-amber-500 font-bold">$GoldenGoal</span>)</>}
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
                                      <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider font-bold">{pred.predictionType?.replace('_', ' ') || 'MAIN'}</p>
                                      <p className="text-xs text-zinc-600 mt-1">Status: {pred.predictionStatus}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <p className="text-xs text-zinc-600">Your Pick: {pred.prediction}</p>
                                      </div>
                                      <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${isWin ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                          {isWin ? `+${pred.pointsReward || 100} PTS` : '0 PTS'}
                                      </div>
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
                      <p className="text-sm text-zinc-400 mb-3 text-center uppercase tracking-wider">{changePredictionModal.predictionType?.replace('_', ' ') || 'MAIN'}</p>
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
                      Cost: 5.000 $GoldenGoal<br/>
                      <span className="text-zinc-500">2.500 permanently burned | 2.500 to Treasury</span>
                  </p>
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

