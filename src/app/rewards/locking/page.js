"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CustomModal from '@/components/CustomModal';

export default function LockingPage() {
  const { publicKey, connected, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeLock, setActiveLock] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState({ tvl: 0, lockers: 0, userLocked: 0 });
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
    const fetchStats = async () => {
      try {
        const url = connected ? `/api/lock/stats?walletAddress=${publicKey.toString()}` : '/api/lock/stats';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setStats({
            tvl: data.totalValueLocked,
            lockers: data.activeLockers,
            userLocked: data.userLocked
          });
          setActiveLock(data.activeLock);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, [connected, publicKey, refresh]);

  const tiers = [
    { 
      id: 1, 
      name: "Soft Lock", 
      lock: "24h Lock", 
      penalty: "0%", 
      reward: "+1 Daily Prediction",
      rewards: [
        { text: "+1 Daily Prediction", type: "primary" }
      ], 
      min: 350000, 
      color: "border-blue-500/30", 
      glow: "group-hover:bg-blue-500/20", 
      icon: (
        <svg className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c4-1.5 6-4.5 6-7.5s-2.5-1-4-1c-1.5 0-2 1.5-2 3.5 0 2.5 0 5 0 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16c-3-1-4.5-3-4.5-5.5s1.5-1 2.5-1c1 0 1.5 1 2 2.5" />
          <circle cx="12" cy="22" r="1.5" className="fill-current text-blue-400" />
        </svg>
      )
    },
    { 
      id: 2, 
      name: "7-Day Lock", 
      lock: "7 Days", 
      penalty: "10%", 
      reward: "+3 Daily Predictions",
      rewards: [
        { text: "+3 Daily Predictions", type: "primary" }
      ], 
      min: 500000, 
      color: "border-green-500/30", 
      glow: "group-hover:bg-green-500/20", 
      icon: (
        <svg className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8" />
        </svg>
      )
    },
    { 
      id: 3, 
      name: "15-Day Lock", 
      lock: "15 Days", 
      penalty: "10%", 
      reward: "+5 Predictions & 1.1x XP",
      rewards: [
        { text: "+5 Daily Predictions", type: "primary" },
        { text: "1.1x XP Multiplier", type: "multiplier" }
      ], 
      min: 750000, 
      color: "border-amber-500/30", 
      glow: "group-hover:bg-amber-500/20", 
      icon: (
        <svg className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C9.5 5 7.5 7.5 7.5 11c0 2.5 1.5 4.5 4.5 5.5 3-1 4.5-3 4.5-5.5 0-3.5-2-6-4.5-9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7c-1.5 2-2.5 3.5-2.5 5.5 0 1.5.8 2.5 2.5 3.1 1.7-.6 2.5-1.6 2.5-3.1 0-2-1-3.5-2-5.5z" />
          <circle cx="12" cy="19" r="0.75" className="fill-current text-amber-400" />
        </svg>
      )
    },
    { 
      id: 4, 
      name: "1-Month Lock", 
      lock: "30 Days", 
      penalty: "10%", 
      reward: "+10 Predictions & 1.25x XP",
      rewards: [
        { text: "+10 Daily Predictions", type: "primary" },
        { text: "1.25x XP Multiplier", type: "multiplier" },
        { text: "+1 Daily Rewards Box", type: "spin" }
      ], 
      min: 1000000, 
      color: "border-purple-500/30", 
      glow: "group-hover:bg-purple-500/20", 
      icon: (
        <svg className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16l1.5-9-4.5 3.5L12 4 7 12.5 2.5 9 4 18z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18c0 1.5 2.5 2 6 2s6-.5 6-2" />
          <circle cx="12" cy="4" r="1" className="fill-current text-purple-400" />
          <circle cx="2.5" cy="9" r="1" className="fill-current text-purple-400" />
          <circle cx="21.5" cy="9" r="1" className="fill-current text-purple-400" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3" />
        </svg>
      )
    },
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
            onClick={handleUnlock}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] animate-pulse"
          >
            Unlock / Withdraw
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

  const handleLock = async (tierId, minAmount) => {
    if (!connected || !publicKey) {
      showMessage("Please connect your wallet first.", "error");
      return;
    }
    
    setLoading(true);
    showMessage("Checking your wallet balance...", "info");
    
    try {
      if (!signMessage) {
        showMessage("Wallet does not support message signing. Please use Phantom, Backpack or Solflare.", "error");
        setLoading(false);
        return;
      }

      // 1. Fetch user's profile mock balance from the database profile API
      const profileRes = await fetch(`/api/user/profile?walletAddress=${publicKey.toString()}`);
      const profileData = await profileRes.json();
      
      if (!profileData.success || !profileData.profile) {
        showMessage(profileData.error || "Failed to query wallet profile.", "error");
        setLoading(false);
        return;
      }
      
      const userBalance = profileData.profile.balance || 0;
      
      if (userBalance < minAmount) {
        let warningMsg = "";
        if (tierId === 1) {
          warningMsg = `You need to hold at least 350.000 $GoldenGoal tokens in your wallet to perform a Soft Lock. Your current balance is ${userBalance.toLocaleString('tr-TR')} $GoldenGoal.`;
        } else if (tierId === 2) {
          warningMsg = `You need to hold at least 500.000 $GoldenGoal tokens in your wallet to lock for 7 days. Your current balance is ${userBalance.toLocaleString('tr-TR')} $GoldenGoal.`;
        } else if (tierId === 3) {
          warningMsg = `You need to hold at least 750.000 $GoldenGoal tokens in your wallet to lock for 15 days. Your current balance is ${userBalance.toLocaleString('tr-TR')} $GoldenGoal.`;
        } else if (tierId === 4) {
          warningMsg = `You need to hold at least 1.000.000 $GoldenGoal tokens in your wallet to lock for 30 days (1 month). Your current balance is ${userBalance.toLocaleString('tr-TR')} $GoldenGoal.`;
        } else {
          warningMsg = `Insufficient balance. You need at least ${minAmount.toLocaleString('tr-TR')} $GoldenGoal to lock. Your current balance is ${userBalance.toLocaleString('tr-TR')} $GoldenGoal.`;
        }
        showMessage(warningMsg, "error");
        setLoading(false);
        return;
      }

      // 2. Request wallet message signature
      showMessage("Awaiting signature in cüzdan...", "info");
      const msgText = `Authenticate Golden Goal Lock Transaction:\nWallet: ${publicKey.toString()}\nAmount: ${minAmount}\nTier: ${tierId}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(msgText);
      const signatureBytes = await signMessage(encodedMessage);
      const signatureHex = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // 3. Submit lock request to backend API
      showMessage("Submitting lock request...", "info");
      const res = await fetch('/api/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          tier: tierId,
          amount: minAmount,
          message: msgText,
          signature: signatureHex
        })
      });
      
      const data = await res.json();
      if (data.success) {
        showMessage(`🎉 Successfully locked ${minAmount.toLocaleString('tr-TR')} $GoldenGoal! Rewards active.`, "success");
        setRefresh(prev => prev + 1);
      } else {
        showMessage(data.error || "Lock failed.", "error");
      }
    } catch (err) {
      console.error("Lock error:", err);
      showMessage(err.message || "Lock cancelled or network error.", "error");
    }
    setLoading(false);
  };

  const handleUnlock = async () => {
    if (!connected || !activeLock) return;

    const isExpired = new Date().getTime() >= new Date(activeLock.unlockDate).getTime();
    const tier = tiers.find(t => t.id === activeLock.tier);
    const hasPenalty = tier && tier.id > 1 && !isExpired;

    let confirmTitle = "Unlock Request";
    let confirmMessage = "Are you sure you want to unlock and withdraw your tokens?";
    let modalType = "confirm";

    if (hasPenalty) {
      confirmTitle = "⚠️ Warning: Early Withdrawal Penalty";
      confirmMessage = "You are unlocking BEFORE your lock period has expired. A 10% early withdrawal penalty will be applied.\n\nAre you sure you want to proceed?";
      modalType = "warning";
    } else if (tier && tier.id === 1) {
      confirmTitle = "Soft Lock Withdrawal";
      confirmMessage = "Are you sure you want to unlock and withdraw your tokens from Soft Lock (0% penalty)?";
      modalType = "confirm";
    } else {
      confirmTitle = "🎉 Lock Period Expired!";
      confirmMessage = "Your lock period has expired! You can withdraw your tokens with 0% penalty.\n\nAre you sure you want to proceed?";
      modalType = "success";
    }

    setModalConfig({
      isOpen: true,
      title: confirmTitle,
      message: confirmMessage,
      type: modalType,
      confirmText: "Withdraw",
      cancelText: "Cancel",
      onConfirm: async () => {
        setLoading(true);
        try {
          if (!signMessage) {
            setModalConfig({
              isOpen: true,
              title: "Error",
              message: "Wallet does not support message signing.",
              type: "error",
              confirmText: "Close",
              onConfirm: null
            });
            setLoading(false);
            return;
          }

          const msgText = `Authenticate Golden Goal Unlock Transaction:\nWallet: ${publicKey.toString()}\nTimestamp: ${Date.now()}`;
          const encodedMessage = new TextEncoder().encode(msgText);
          const signatureBytes = await signMessage(encodedMessage);
          const signatureHex = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');

          const res = await fetch('/api/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: publicKey.toString(),
              message: msgText,
              signature: signatureHex
            })
          });
          const data = await res.json();
          if (data.success) {
            if (data.penaltyApplied) {
                setModalConfig({
                  isOpen: true,
                  title: "⚠️ Penalty Applied",
                  message: `Unlocked! Early penalty was applied. You received ${data.returnedAmount} tokens.`,
                  type: "warning",
                  confirmText: "Close",
                  onConfirm: null
                });
            } else {
                setModalConfig({
                  isOpen: true,
                  title: "🎉 Unlocked Successfully!",
                  message: "Your locked tokens have been successfully returned to your wallet.",
                  type: "success",
                  confirmText: "Great",
                  onConfirm: null
                });
            }
            setRefresh(prev => prev + 1);
          } else {
            setModalConfig({
              isOpen: true,
              title: "Error",
              message: data.error,
              type: "error",
              confirmText: "Close",
              onConfirm: null
            });
          }
        } catch (err) {
          setModalConfig({
            isOpen: true,
            title: "Network Error",
            message: "Failed to connect to server.",
            type: "error",
            confirmText: "Close",
            onConfirm: null
          });
        }
        setLoading(false);
      }
    });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-12">
      
      {/* Header */}
      <div className="text-center mb-16 flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-white leading-none flex items-center justify-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="Golden Goal Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0 hover:scale-105 transition-transform duration-300"
          />
          <span>
            Token <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Locking</span>
          </span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed mt-2">
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
            <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M6 21V10M18 21V10M12 21V10M3 21h18M12 3L3 10h18L12 3z" />
            </svg>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-wider mb-1 uppercase">Total Value Locked</div>
            <div className="text-2xl font-bold text-white">{stats.tvl.toLocaleString('tr-TR')} <span className="text-sm text-zinc-500 font-normal">$GoldenGoal</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-zinc-800/50">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-wider mb-1 uppercase">Active Lockers</div>
            <div className="text-2xl font-bold text-white">{stats.lockers.toLocaleString('tr-TR')} <span className="text-sm text-zinc-500 font-normal">Wallets</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-zinc-800/50">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-wider mb-1 uppercase">Your Locked</div>
            <div className="text-2xl font-bold text-white">{stats.userLocked.toLocaleString('tr-TR')} <span className="text-sm text-zinc-500 font-normal">$GoldenGoal</span></div>
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
              <div className="text-zinc-500 text-sm mb-6 pb-6 border-b border-white/5">Min: {t.min.toLocaleString('tr-TR')} $GoldenGoal</div>

              <ul className="space-y-4 mb-8">
                <li className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Lock Period</span>
                  <span className="text-white font-semibold">{t.lock}</span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-zinc-400 text-sm">Early Penalty</span>
                  <span className={t.penalty === '0%' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{t.penalty}</span>
                </li>
              </ul>

              {/* Premium Rewards List */}
              <div className="mb-8 flex flex-col gap-2">
                <span className="text-zinc-500 text-[10px] font-extrabold tracking-widest uppercase mb-1">REWARDS & PERKS</span>
                <div className="flex flex-col gap-2">
                  {t.rewards.map((reward, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:translate-x-1 ${
                        reward.type === 'multiplier' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                          : reward.type === 'spin'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] animate-pulse'
                          : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-sm shrink-0">
                        {reward.type === 'multiplier' ? '⚡' : reward.type === 'spin' ? '🎁' : '🎯'}
                      </span>
                      <span className="leading-tight text-left">{reward.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {activeLock && activeLock.tier === t.id ? (
                <CountdownTimer targetDate={activeLock.unlockDate} />
              ) : (
                <button 
                  onClick={() => handleLock(t.id, t.min)}
                  disabled={loading || !connected || activeLock}
                  className="w-full py-4 rounded-xl font-bold transition-all bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {activeLock ? 'Already Locked' : 'Lock Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Unlock Section */}
      {activeLock && (
        <div className="mt-16 bg-zinc-900/30 border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-2">Manage Your Lock</h3>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-2xl mx-auto">
            {new Date().getTime() >= new Date(activeLock.unlockDate).getTime() || activeLock.tier === 1 ? (
              <span className="text-emerald-400 font-semibold text-base block my-2">
                🔓 Your lock is unlocked! You can now withdraw all your locked tokens with 0% penalty.
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
              onClick={handleUnlock}
              disabled={loading || !connected}
              className={`px-8 py-3 font-bold rounded-xl transition-all disabled:opacity-50 ${
                new Date().getTime() >= new Date(activeLock.unlockDate).getTime() || activeLock.tier === 1
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)]'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              Unlock / Withdraw
          </button>
        </div>
      )}

      {/* Legal Notice */}
      <div className="mt-12 text-center max-w-3xl mx-auto pb-8">
        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 select-none leading-relaxed">
          NO PURCHASE NECESSARY. Void where prohibited by law. Standard daily prediction quotas are allocated for free. Locking tokens increases daily prediction limits and XP multipliers strictly for analytical skill-based simulation rankings.
        </p>
      </div>

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
