"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function StakePage() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeStake, setActiveStake] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState({ tvl: 0, stakers: 0, userStaked: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = connected ? `/api/stake/stats?walletAddress=${publicKey.toString()}` : '/api/stake/stats';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setStats({
            tvl: data.totalValueLocked,
            stakers: data.activeStakers,
            userStaked: data.userStaked
          });
          setActiveStake(data.activeStake);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, [connected, publicKey, refresh]);

  const tiers = [
    { id: 1, name: "Soft Stake", lock: "24h Lock", penalty: "0%", reward: "+1 Daily Prediction", min: 100, color: "border-blue-500/30", glow: "group-hover:bg-blue-500/20", icon: "🌱" },
    { id: 2, name: "7-Day Stake", lock: "7 Days", penalty: "10%", reward: "+3 Daily Predictions", min: 500, color: "border-green-500/30", glow: "group-hover:bg-green-500/20", icon: "🛡️" },
    { id: 3, name: "15-Day Stake", lock: "15 Days", penalty: "10%", reward: "+5 Predictions & 1.1x XP", min: 1000, color: "border-amber-500/30", glow: "group-hover:bg-amber-500/20", icon: "🔥" },
    { id: 4, name: "1-Month Stake", lock: "30 Days", penalty: "10%", reward: "+10 Predictions & 1.25x XP", min: 5000, color: "border-purple-500/30", glow: "group-hover:bg-purple-500/20", icon: "👑" },
  ];

  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);

    useEffect(() => {
      const checkTime = () => {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const distance = target - now;

        if (distance <= 0) {
          setTimeLeft("Unlocked");
          setIsUnlocked(true);
          return true;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`);
        setIsUnlocked(false);
        return false;
      };

      const isDone = checkTime();
      if (isDone) return;

      const interval = setInterval(() => {
        const done = checkTime();
        if (done) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [targetDate]);

    if (isUnlocked) {
      return (
        <div className="flex flex-col gap-3 w-full animate-fade-in">
          <div className="w-full py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Status</span>
            <span className="text-emerald-400 font-mono font-extrabold text-lg flex items-center gap-1.5 animate-pulse">
              🔓 Unlocked
            </span>
          </div>
          <button
            onClick={handleUnstake}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] animate-pulse"
          >
            Withdraw / Unstake
          </button>
        </div>
      );
    }

    return (
      <div className="w-full py-3 bg-zinc-800/80 rounded-xl border border-zinc-700 flex flex-col items-center justify-center">
        <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Unlocks in</span>
        <span className="text-white font-mono font-bold text-lg">{timeLeft || '...'}</span>
      </div>
    );
  };

  const handleStake = async (tierId, minAmount) => {
    if (!connected) {
      showMessage("Please connect your wallet first.", "error");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          tier: tierId,
          amount: minAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Successfully staked ${minAmount} tokens!`, "success");
        setRefresh(prev => prev + 1);
      } else {
        showMessage(data.error, "error");
      }
    } catch (err) {
      showMessage("Network error.", "error");
    }
    setLoading(false);
  };

  const handleUnstake = async () => {
    if (!connected || !activeStake) return;

    const isExpired = new Date().getTime() >= new Date(activeStake.unlockDate).getTime();
    const tier = tiers.find(t => t.id === activeStake.tier);
    const hasPenalty = tier && tier.id > 1 && !isExpired;

    let confirmMessage = "Are you sure you want to unstake and withdraw your tokens?";
    if (hasPenalty) {
      confirmMessage = "⚠️ WARNING: You are unstaking BEFORE your lock period has expired. A 10% early withdrawal penalty will be applied. Are you sure you want to proceed?";
    } else if (tier && tier.id === 1) {
      confirmMessage = "Are you sure you want to unstake and withdraw your tokens from Soft Stake (0% penalty)?";
    } else {
      confirmMessage = "Your lock period has expired! You can withdraw your tokens with 0% penalty. Are you sure you want to proceed?";
    }

    if (!confirm(confirmMessage)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toString() })
      });
      const data = await res.json();
      if (data.success) {
        if (data.penaltyApplied) {
            showMessage(`Unstaked! Early penalty applied. You received ${data.returnedAmount} tokens.`, "warning");
        } else {
            showMessage(`Unstaked successfully!`, "success");
        }
        setRefresh(prev => prev + 1);
      } else {
        showMessage(data.error, "error");
      }
    } catch (err) {
      showMessage("Network error.", "error");
    }
    setLoading(false);
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-12">
      
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Token <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Staking</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Lock your Golden Tokens to unlock powerful multipliers, extra daily predictions, and secure the network.
        </p>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-8 p-4 rounded-xl border text-center ${
          message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 
          message.type === 'warning' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' :
          'bg-green-500/10 border-green-500/50 text-green-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-zinc-800/50">
          <div className="w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-2xl shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            🏦
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-wider mb-1 uppercase">Total Value Locked</div>
            <div className="text-2xl font-bold text-white">{stats.tvl.toLocaleString()} <span className="text-sm text-zinc-500 font-normal">Tokens</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-zinc-800/50">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            👥
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-wider mb-1 uppercase">Active Stakers</div>
            <div className="text-2xl font-bold text-white">{stats.stakers.toLocaleString()} <span className="text-sm text-zinc-500 font-normal">Wallets</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-zinc-800/50">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            👤
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-wider mb-1 uppercase">Your Staked</div>
            <div className="text-2xl font-bold text-white">{stats.userStaked.toLocaleString()} <span className="text-sm text-zinc-500 font-normal">Tokens</span></div>
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tiers.map((t) => (
          <div key={t.id} className={`bg-zinc-900/50 border ${t.color} rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:scale-105`}>
            {/* Glow Background */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl transition-all duration-500 bg-zinc-800 ${t.glow}`}></div>
            
            <div className="relative z-10">
              <div className="text-4xl mb-4">{t.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-1">{t.name}</h3>
              <div className="text-zinc-500 text-sm mb-6 pb-6 border-b border-white/5">Min: {t.min} Tokens</div>

              <ul className="space-y-4 mb-8">
                <li className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Lock Period</span>
                  <span className="text-white font-semibold">{t.lock}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Early Penalty</span>
                  <span className={t.penalty === '0%' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{t.penalty}</span>
                </li>
                <li className="bg-white/5 p-3 rounded-lg mt-2 border border-white/5 flex flex-col gap-1">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-amber-400 text-sm font-bold tracking-wide shrink-0">REWARD</span>
                    <span className="text-amber-400 font-extrabold text-xs lg:text-[13px] text-right whitespace-nowrap">{t.reward}</span>
                  </div>
                  {t.id === 4 && (
                    <div className="flex justify-end">
                      <span className="text-emerald-400 font-extrabold text-xs lg:text-[13px] text-right whitespace-nowrap">+ 1 Daily Free Spin</span>
                    </div>
                  )}
                </li>
              </ul>

              {activeStake && activeStake.tier === t.id ? (
                <CountdownTimer targetDate={activeStake.unlockDate} />
              ) : (
                <button 
                  onClick={() => handleStake(t.id, t.min)}
                  disabled={loading || !connected || activeStake}
                  className="w-full py-4 rounded-xl font-bold transition-all bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {activeStake ? 'Already Staked' : 'Stake Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Unstake Section */}
      {activeStake && (
        <div className="mt-16 bg-zinc-900/30 border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-2">Manage Your Stake</h3>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-2xl mx-auto">
            {new Date().getTime() >= new Date(activeStake.unlockDate).getTime() || activeStake.tier === 1 ? (
              <span className="text-emerald-400 font-semibold text-base block my-2">
                🔓 Your stake is unlocked! You can now withdraw all your staked tokens with 0% penalty.
              </span>
            ) : (
              <>
                If you withdraw before your lock period expires, a <strong className="text-red-400">10% penalty fee</strong> will be applied. 
                To ensure a fair and decentralized ecosystem, <strong className="text-white">Golden Goal takes 0% of these fees</strong>. 
                Instead, <strong className="text-orange-400">50% is permanently burned</strong> to reduce total token supply, and the remaining <strong className="text-amber-400">50% is sent directly to the Community Rewards Treasury</strong> to be distributed to top-ranking players on the leaderboard.
              </>
            )}
          </p>
          
          <button 
              onClick={handleUnstake}
              disabled={loading || !connected}
              className={`px-8 py-3 font-bold rounded-xl transition-all disabled:opacity-50 ${
                new Date().getTime() >= new Date(activeStake.unlockDate).getTime() || activeStake.tier === 1
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)]'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              Unstake / Withdraw
          </button>
        </div>
      )}

      {/* Legal Notice */}
      <div className="mt-12 text-center max-w-3xl mx-auto pb-8">
        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 select-none leading-relaxed">
          NO PURCHASE NECESSARY. Void where prohibited by law. Standard daily prediction quotas are allocated for free. Locking tokens increases daily prediction limits and XP multipliers strictly for analytical skill-based simulation rankings.
        </p>
      </div>

    </div>
  );
}
