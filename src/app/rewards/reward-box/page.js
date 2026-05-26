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
    { label: 'Miss', color: '#4c1d95' },         // Deep Purple
    { label: '+1 Prediction', color: '#f97316' }, // Orange
    { label: '+3 Predictions', color: '#22c55e' },// Green
    { label: '+5 Predictions', color: '#3b82f6' },// Blue
    { label: '+100 XP Points', color: '#eab308' }, // Yellow
    { label: '+250 XP Points', color: '#6366f1' }, // Indigo
    { label: '+500 XP Points', color: '#d946ef' }, // Fuchsia
    { label: '+1000 XP Points', color: '#be185d' } // Pink/Rose
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
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)] tracking-wider">
                        REWARDS BOX
                    </h1>
                    <p className="text-zinc-300 font-medium">
                        Get <span className="text-yellow-400 font-bold">1 Free Rewards Box</span> daily with 30-Day locking, subsequent openings cost just 25 XP!
                    </p>
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
            `}</style>

            {/* GOLDEN MYSTERY CHEST CONTAINER */}
            <div className="relative w-[320px] h-[320px] mb-12 flex items-center justify-center select-none">
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
                        <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-yellow-500/20 to-transparent blur-xl pointer-events-none -z-10 animate-pulse"></div>
                        
                        {/* SVG Open Chest Illustration */}
                        <div className="w-48 h-36 bg-zinc-900 border-4 border-yellow-500 rounded-3xl relative shadow-[0_20px_45px_rgba(245,158,11,0.3)] flex flex-col justify-end">
                            {/* Lid thrown back */}
                            <div className="absolute -top-12 left-4 right-4 h-14 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 border-4 border-yellow-500 rounded-t-2xl shadow-md origin-bottom -rotate-12 transition-all"></div>
                            
                            {/* Shiny Gold Inside */}
                            <div className="absolute inset-x-2 top-2 bottom-12 bg-gradient-to-b from-yellow-400/40 via-yellow-500/10 to-transparent rounded-xl flex items-center justify-center">
                                <span className="text-4xl animate-pulse">✨</span>
                            </div>

                            {/* Padlock (Unlocked) */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-950 border-2 border-emerald-500 flex items-center justify-center z-10 shadow-lg">
                                <span className="text-emerald-400 text-xs">🔓</span>
                            </div>

                            {/* Front Details */}
                            <div className="h-12 bg-zinc-950/80 w-full flex items-center justify-between px-6 rounded-b-2xl border-t border-white/5">
                                <div className="w-2 h-5 bg-yellow-500/40 rounded-full"></div>
                                <div className="w-2 h-5 bg-yellow-500/40 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* CLOSED CHEST STATE */
                    <div className={`relative flex flex-col items-center justify-center z-10 transition-all duration-500 ${isSpinning ? 'animate-chest-shake' : 'hover:scale-[1.04]'}`}>
                        {/* Closed Chest Illustration */}
                        <div className="w-48 h-36 bg-zinc-900 border-4 border-yellow-500 rounded-3xl relative shadow-[0_20px_35px_rgba(245,158,11,0.2)] flex flex-col justify-end">
                            
                            {/* Lid (Top Half) */}
                            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 border-b-4 border-yellow-500 rounded-t-2xl flex items-center justify-center shadow-lg">
                                {/* Shiny center badge */}
                                <div className="w-7 h-7 rounded-full bg-zinc-950 border border-yellow-400/30 flex items-center justify-center shadow-inner">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></div>
                                </div>
                            </div>

                            {/* Padlock (Locked) */}
                            <div className="absolute top-[44px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-950 border-2 border-yellow-500 flex items-center justify-center z-10 shadow-lg">
                                <span className="text-yellow-400 text-xs">🔒</span>
                            </div>

                            {/* Front Details */}
                            <div className="h-12 bg-zinc-950/80 w-full flex items-center justify-between px-6 rounded-b-2xl border-t border-white/5">
                                <div className="w-2 h-5 bg-yellow-500/40 rounded-full"></div>
                                <div className="w-2 h-5 bg-yellow-500/40 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* POTENTIAL REWARDS LIST */}
            <div className="w-full max-w-xl mb-12 relative z-10 text-center select-none">
                <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase block mb-4">
                    🎁 Potential Rewards Chest Pool
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                    {WHEEL_SLICES.map((slice, i) => (
                        <span 
                            key={i} 
                            className="text-[10px] font-bold px-3.5 py-2 rounded-full border border-white/5 bg-zinc-900/40 text-zinc-300 hover:text-white hover:border-yellow-500/20 transition-all cursor-default"
                        >
                            {slice.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 w-full max-w-sm mb-16 relative z-10">
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
                        <span className="text-yellow-400 font-bold">{status?.points !== undefined ? status.points.toLocaleString() : 0} XP</span>
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
