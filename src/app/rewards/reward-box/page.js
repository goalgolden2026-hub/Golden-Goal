"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CustomModal from '@/components/CustomModal';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const WHEEL_SLICES = [
    { 
        label: 'Miss', 
        displayLabel: 'Miss',
        color: '#4c1d95', 
        rarity: 'Common', 
        subtext: 'Try again tomorrow', 
        icon: '💨',
        gradient: 'from-zinc-800/40 to-zinc-900/60',
        borderColor: 'border-zinc-800 hover:border-zinc-700/50',
        rarityColor: 'text-zinc-400 bg-zinc-800/50'
    },
    { 
        label: '+1 Prediction', 
        displayLabel: '+1 Prediction',
        color: '#f97316', 
        rarity: 'Common', 
        subtext: 'Predict limits booster', 
        icon: '🎫',
        gradient: 'from-orange-950/20 to-zinc-900/40',
        borderColor: 'border-orange-500/20 hover:border-orange-500/40',
        rarityColor: 'text-orange-400 bg-orange-950/40 border border-orange-500/20'
    },
    { 
        label: '+3 Predictions', 
        displayLabel: '+3 Predictions',
        color: '#22c55e', 
        rarity: 'Rare', 
        subtext: 'Predict limits booster', 
        icon: '🎟️',
        gradient: 'from-emerald-950/20 to-zinc-900/40',
        borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
        rarityColor: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20'
    },
    { 
        label: '+5 Predictions', 
        displayLabel: '+5 Predictions',
        color: '#3b82f6', 
        rarity: 'Epic', 
        subtext: 'Predict limits booster', 
        icon: '⚡',
        gradient: 'from-blue-950/30 to-zinc-900/40',
        borderColor: 'border-blue-500/30 hover:border-blue-500/50',
        rarityColor: 'text-blue-400 bg-blue-950/40 border border-blue-500/30'
    },
    { 
        label: '+100 XP Points', 
        displayLabel: '+100 XP',
        color: '#eab308', 
        rarity: 'Common', 
        subtext: 'Instant XP boost', 
        icon: '🪙',
        gradient: 'from-yellow-950/20 to-zinc-900/40',
        borderColor: 'border-yellow-500/20 hover:border-yellow-500/40',
        rarityColor: 'text-yellow-400 bg-yellow-950/40 border border-yellow-500/20'
    },
    { 
        label: '+250 XP Points', 
        displayLabel: '+250 XP',
        color: '#6366f1', 
        rarity: 'Rare', 
        subtext: 'Instant XP boost', 
        icon: '💎',
        gradient: 'from-indigo-950/20 to-zinc-900/40',
        borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
        rarityColor: 'text-indigo-400 bg-indigo-950/40 border border-indigo-500/20'
    },
    { 
        label: '+500 XP Points', 
        displayLabel: '+500 XP',
        color: '#d946ef', 
        rarity: 'Epic', 
        subtext: 'Instant XP boost', 
        icon: '🔥',
        gradient: 'from-fuchsia-950/30 to-zinc-900/40',
        borderColor: 'border-fuchsia-500/30 hover:border-fuchsia-500/50',
        rarityColor: 'text-fuchsia-400 bg-fuchsia-950/40 border border-fuchsia-500/30'
    },
    { 
        label: '+1000 XP Points', 
        displayLabel: 'Mega +1000 XP',
        color: '#be185d', 
        rarity: 'Legendary', 
        subtext: 'Jackpot XP boost', 
        icon: '👑',
        gradient: 'from-amber-950/40 via-zinc-900/50 to-amber-950/20',
        borderColor: 'border-yellow-500/50 hover:border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
        rarityColor: 'text-yellow-300 bg-gradient-to-r from-amber-600 to-yellow-500 border border-yellow-400 font-extrabold animate-pulse'
    }
];

export default function RewardBoxPage() {
    const { publicKey, connected } = useWallet();
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm',
        onConfirm: null,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [reward, setReward] = useState(null);

    useEffect(() => {
        if (connected && publicKey) {
            checkStatus();
        } else {
            setLoading(false);
            setStatus(null);
        }
    }, [connected, publicKey]);

    // Confetti effect when reward is shown
    useEffect(() => {
        if (reward && reward.type !== 'EMPTY') {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults, particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults, particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [reward]);

    const checkStatus = async () => {
        try {
            const res = await fetch(`/api/reward-box?walletAddress=${publicKey.toBase58()}`);
            const data = await res.json();
            if (data.success) {
                setStatus(data);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleSpin = async () => {
        if (!status || isSpinning) return;
        
        setIsSpinning(true);
        setReward(null);

        try {
            const res = await fetch('/api/reward-box', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: publicKey.toBase58() })
            });
            const data = await res.json();

            if (data.success) {
                // Wait for shake animation to finish (2.5 seconds)
                setTimeout(() => {
                    setReward(data.reward);
                    setIsSpinning(false);
                    checkStatus(); // Refresh eligibility
                }, 2500);
                
            } else {
                setModalConfig({
                    isOpen: true,
                    title: "⚠️ Open Error",
                    message: data.error,
                    type: "danger",
                    confirmText: "Close",
                    onConfirm: null
                });
                setIsSpinning(false);
            }
        } catch (error) {
            setModalConfig({
                isOpen: true,
                title: "⚠️ Network Error",
                message: "Failed to connect to reward-box server.",
                type: "danger",
                confirmText: "Close",
                onConfirm: null
            });
            setIsSpinning(false);
        }
    };

    if (!connected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
                        Rewards Box
                    </h1>
                    <p className="text-zinc-400 max-w-md mx-auto">
                        Connect your wallet to spin the wheel and win XP boosts and prediction quotas.
                    </p>
                </div>
                <WalletMultiButtonDynamic className="!bg-amber-500 hover:!bg-amber-600 !text-black !font-bold !rounded-full !px-8 !py-4" />
            </div>
        );
    }

    if (loading) {
        return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>;
    }

    return (
        <div className="flex-1 w-full relative overflow-hidden bg-[#0a0514]">
            {/* Background Confetti/Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-2 h-2 bg-yellow-400 rotate-45 opacity-60 blur-[1px]"></div>
                <div className="absolute top-[30%] right-[15%] w-3 h-1 bg-pink-500 -rotate-12 opacity-50 blur-[1px]"></div>
                <div className="absolute bottom-[20%] left-[10%] w-2 h-2 bg-blue-400 rounded-full opacity-60 blur-[1px]"></div>
                <div className="absolute bottom-[40%] right-[25%] w-2 h-2 bg-orange-500 rotate-45 opacity-80 blur-[1px]"></div>
                <div className="absolute top-[50%] left-[5%] w-3 h-1 bg-yellow-500 rotate-12 opacity-40 blur-[1px]"></div>
            </div>

            <div className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)] tracking-wider">
                        REWARDS BOX
                    </h1>
                </div>

            {/* Custom CSS Keyframes for Chest Shaking */}
            <style jsx global>{`
                @keyframes chest-shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0deg) rotate(1deg); }
                    30% { transform: translate(0deg, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(2px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(2px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .animate-chest-shake {
                    animation: chest-shake 0.3s infinite;
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .shimmer-effect {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer-effect::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.15) 60%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    animation: shimmer 3s infinite;
                }
            `}</style>

            {/* GOLDEN MYSTERY CHEST CONTAINER */}
            <div className="relative w-[420px] h-[420px] mb-6 flex items-center justify-center select-none">
                {/* Golden Radial Glow */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-50 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 animate-pulse z-0"></div>
                
                {/* Exploding / Opening Glow */}
                {isSpinning && (
                    <div className="absolute inset-[-40px] rounded-full bg-yellow-500/10 blur-2xl animate-ping z-0"></div>
                )}

                {/* Chest Presentation */}
                {reward ? (
                    /* OPENED CHEST STATE */
                    <div className="relative flex flex-col items-center justify-center animate-bounce z-10">
                        {/* Golden Rays Backlight */}
                        <div className="absolute w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-yellow-500/30 via-amber-500/10 to-transparent blur-2xl pointer-events-none -z-10 animate-pulse"></div>
                        
                        {/* 3D Photorealistic Open Chest Image */}
                        <img 
                            src="/chest-open.png" 
                            alt="Open Golden Chest" 
                            className="w-[360px] h-[360px] object-contain drop-shadow-[0_20px_50px_rgba(245,158,11,0.5)] z-20"
                        />
                    </div>
                ) : (
                    /* CLOSED CHEST STATE */
                    <div className={`relative flex flex-col items-center justify-center z-10 transition-all duration-500 ${isSpinning ? 'animate-chest-shake' : 'hover:scale-[1.06]'}`}>
                        {/* 3D Photorealistic Closed Chest Image */}
                        <img 
                            src="/chest-closed.png" 
                            alt="Closed Golden Chest" 
                            className="w-[360px] h-[360px] object-contain drop-shadow-[0_20px_40px_rgba(245,158,11,0.35)] z-20 animate-pulse"
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 w-full max-w-sm mb-14 relative z-10">
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || (!status?.isEligibleForFreeBox && status?.points < status?.boxCost)}
                    className={`w-full py-5 rounded-full font-black text-xl uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 ${
                        isSpinning 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : status?.isEligibleForFreeBox
                            ? 'bg-gradient-to-b from-green-400 via-emerald-500 to-green-700 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 hover:brightness-110'
                            : (status?.points >= status?.boxCost)
                                ? 'bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 hover:brightness-110'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                    {!isSpinning && (
                        <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center border border-white/20">
                            <span className="text-yellow-300 text-xs font-bold">XP</span>
                        </div>
                    )}
                    {isSpinning ? 'OPENING...' : status?.isEligibleForFreeBox ? 'OPEN REWARDS BOX' : `OPEN FOR ${status?.boxCost || 0} XP`}
                </button>

                <div className="text-xs text-zinc-400 text-center flex flex-col gap-2 max-w-sm mx-auto select-none">
                    <div className="flex items-center justify-center gap-1.5 bg-zinc-900/60 border border-white/5 rounded-full px-4 py-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <span className="text-zinc-500">Your Balance:</span>
                        <span className="text-yellow-400 font-bold">{status?.points !== undefined ? status.points.toLocaleString('tr-TR') : 0} XP</span>
                    </div>
                    {!status?.isEligibleForFreeBox && (
                        <p className="mt-1">
                            {status?.points < status?.boxCost ? (
                                <span className="text-red-500 font-bold block">
                                    ⚠️ Insufficient XP Points. {status.boxCost} XP required.
                                </span>
                            ) : (
                                <span>
                                    Cost: <span className="text-amber-400 font-bold">{status?.boxCost} XP Points</span>. Opens are point-based.
                                </span>
                            )}
                        </p>
                    )}
                    {status?.isEligibleForFreeBox && (
                        <p className="mt-1 text-emerald-400 font-bold">
                            🎉 Your first daily Rewards Box opening is completely FREE!
                        </p>
                    )}
                </div>
            </div>

            {/* POTENTIAL REWARDS LIST */}
            <div className="w-full max-w-4xl mb-16 relative z-10 select-none">
                <div className="text-center mb-6">
                    <span className="text-xs font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 uppercase block">
                        🎁 Potential Rewards Chest Pool
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-1">Hover over rewards to inspect their properties and rarity levels</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {WHEEL_SLICES.map((slice, i) => {
                        const isLegendary = slice.rarity === 'Legendary';
                        const isEpic = slice.rarity === 'Epic';
                        
                        return (
                            <div 
                                key={i} 
                                className={`relative group p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between items-center text-center cursor-default bg-gradient-to-b ${slice.gradient} ${slice.borderColor} hover:scale-[1.03] hover:shadow-[0_10px_25px_rgba(0,0,0,0.4)] ${isLegendary || isEpic ? 'shimmer-effect' : ''}`}
                            >
                                {/* Glow Halo behind icon */}
                                <div 
                                    className="absolute w-12 h-12 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity top-4"
                                    style={{ backgroundColor: slice.color }}
                                ></div>

                                {/* Rarity Tag */}
                                <span className={`text-[8px] tracking-wider uppercase font-black px-2 py-0.5 rounded-full mb-3 self-center ${slice.rarityColor}`}>
                                    {slice.rarity}
                                </span>

                                {/* Icon Display */}
                                <div className="text-3xl mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-[0_5px_10px_rgba(0,0,0,0.3)]">
                                    {slice.icon}
                                </div>

                                {/* Title / Main Amount */}
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white group-hover:text-yellow-400 transition-colors duration-200">
                                        {slice.displayLabel}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 font-medium mt-0.5">
                                        {slice.subtext}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Info Cards */}
            <div className="w-full max-w-5xl bg-[#130b29]/80 backdrop-blur-md rounded-3xl border border-purple-500/20 p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 z-10 relative">
                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]">🎁</div>
                    <h3 className="text-xs font-bold text-orange-400 tracking-wider mb-2">DAILY REWARDS BOX</h3>
                    <p className="text-[11px] text-zinc-500">Lock your tokens for 30 days and earn 1 Rewards Box daily!</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">🛡️</div>
                    <h3 className="text-xs font-bold text-red-400 tracking-wider mb-2">SAFE & FAIR</h3>
                    <p className="text-[11px] text-zinc-500">All Reward Box mechanics and results are mathematically verified.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">🪙</div>
                    <h3 className="text-xs font-bold text-yellow-400 tracking-wider mb-2">XP & QUOTAS</h3>
                    <p className="text-[11px] text-zinc-500">Win up to +1000 XP Points or extra prediction limits!</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">⚡</div>
                    <h3 className="text-xs font-bold text-purple-400 tracking-wider mb-2">INSTANT BOOST</h3>
                    <p className="text-[11px] text-zinc-500">Rewards are instantly added to your profile points.</p>
                </div>
            </div>

            {/* Legal Disclaimer */}
            <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest text-center mt-8 relative z-10 select-none">
                NO PURCHASE NECESSARY. Void where prohibited. Skill-based prediction simulator.
            </p>

            {/* Reward Modal */}
            {reward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl shadow-amber-500/20">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
                        
                        <h2 className="text-3xl font-black text-white mb-2">
                            {reward.type === 'EMPTY' ? 'Oops!' : 'Congratulations! 🎉'}
                        </h2>
                        
                        <div className="my-8 py-8 bg-black/50 rounded-2xl border border-zinc-800">
                            {reward.type === 'EMPTY' ? (
                                <span className="text-2xl text-zinc-400 block">Nothing this time.<br/>Try again!</span>
                            ) : (
                                <>
                                    <span className="text-amber-500 text-sm font-bold tracking-widest uppercase mb-2 block">You Won</span>
                                    <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{reward.label}</span>
                                </>
                            )}
                        </div>

                        <button 
                            onClick={() => setReward(null)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                        >
                            Close
                        </button>
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
