"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function ProfilePage() {
    const { publicKey, connected } = useWallet();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (connected && publicKey) {
            fetchProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [connected, publicKey]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/user/profile?walletAddress=${publicKey.toBase58()}`);
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
        setLoading(false);
    };

    if (!connected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh]">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        Wallet Profile
                    </h1>
                    <p className="text-zinc-400 max-w-md mx-auto">
                        Connect your Solana wallet to access your Wallet Profile and check your balance.
                    </p>
                </div>
                <WalletMultiButtonDynamic className="!bg-amber-500 hover:!bg-amber-600 !text-black !font-bold !rounded-full !px-8 !py-4" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 relative">
            {/* Holographic Glowing Backgrounds */}
            <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-yellow-500/5 to-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-black mt-4 text-white tracking-tight">
                        Wallet <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">Profile</span>
                    </h1>
                </div>

                {/* Membership Card */}
                <div className="w-full bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden group hover:border-amber-500/20 transition-all duration-500">
                    {/* Decorative Shiny Lines */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                    <div className="absolute -top-[150px] -right-[150px] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500"></div>

                    <div className="flex flex-col gap-8">
                        {/* Upper Section: Brand & Level */}
                        <div className="flex justify-between items-center pb-6 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <img 
                                    src="/logo.jpg" 
                                    alt="Golden Goal Logo" 
                                    className="w-9 h-9 rounded-xl object-cover border border-yellow-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                />
                                <span className="font-black text-lg tracking-wider text-white">GOLDEN GOAL</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold text-zinc-300">
                                <span className="text-amber-500 text-xs">⚡</span> SKILL VERIFIED
                            </div>
                        </div>

                        {/* Middle Section: Wallet Info */}
                        <div className="space-y-6">
                            <div className="bg-black/40 rounded-2xl p-5 border border-zinc-900 flex flex-col gap-1.5">
                                <span className="text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase">Solana Wallet Address</span>
                                <span className="text-sm sm:text-base font-mono text-zinc-200 truncate select-all">{profile.walletAddress}</span>
                            </div>

                            {/* Token Balance */}
                            <div className="bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.04] rounded-2xl p-6 border border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] font-extrabold tracking-wider text-amber-500/80 uppercase block mb-1">$GoldenGoal Balance</span>
                                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{profile.balance.toLocaleString('en-US')}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                                        🪙
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Tokens Ready</span>
                                </div>
                            </div>
                        </div>

                        {/* Quota Progress */}
                        <div className="bg-black/40 rounded-2xl p-6 border border-zinc-900/80">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase">Daily Prediction Quota</span>
                                <span className="text-sm font-black text-white font-mono">
                                    {profile.maxPredictions - profile.predictionsToday} <span className="text-zinc-500 font-normal">/ {profile.maxPredictions} left</span>
                                </span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden p-[1px] border border-white/5">
                                <div 
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                    style={{ width: `${Math.max(0, ((profile.maxPredictions - profile.predictionsToday) / profile.maxPredictions) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-3.5 leading-relaxed">
                                Lock your $GoldenGoal tokens or unlock daily Rewards Boxes to permanently boost your prediction limit and XP multipliers.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/60 border border-yellow-500/10 hover:border-yellow-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">Contract:</span>
                    <a 
                      href="https://solscan.io/token/GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-mono font-bold text-zinc-100 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                      title="View on Solscan"
                    >
                      <span className="hidden sm:inline">GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump</span>
                      <span className="inline sm:hidden">GU527smM...FMBfZ8pump</span>
                      <svg className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    
                    <div className="w-[1px] h-4 bg-zinc-800"></div>
                    
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("GU527smM71ht8aCA8ouShfXhahVq6crz51FMbfZ8pump");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-all duration-200 cursor-pointer min-w-[55px] justify-center"
                      title="Copy Address"
                    >
                      {copied ? (
                        <span className="text-[10px] text-emerald-400 font-bold font-mono">Copied!</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footnote */}
                <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest text-center mt-12 select-none max-w-xl leading-relaxed">
                    NO PURCHASE NECESSARY. Standard daily prediction quotas are allocated for free. Wallet profile metrics strictly track non-financial skill simulation analytics. Void where prohibited by law.
                </p>
            </div>
        </div>
    );
}
