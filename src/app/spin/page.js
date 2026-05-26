"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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

export default function SpinPage() {
    const { publicKey, connected } = useWallet();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
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
            const res = await fetch(`/api/spin?walletAddress=${publicKey.toBase58()}`);
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
            const res = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: publicKey.toBase58() })
            });
            const data = await res.json();

            if (data.success) {
                const targetIndex = data.reward.index;
                const sliceDegree = 360 / WHEEL_SLICES.length;
                // Center of the target slice
                const targetCenterAngle = (targetIndex * sliceDegree) + (sliceDegree / 2);
                // Tiny random offset to land naturally within the slice
                const randomOffset = Math.floor(Math.random() * (sliceDegree - 10)) - (sliceDegree/2 - 5); 
                const stopAngle = 1800 + (360 - targetCenterAngle) + randomOffset;
                
                // Add to current rotation so it spins smoothly from current position
                const newRotation = rotation + stopAngle + (360 - (rotation % 360));

                setRotation(newRotation);

                // Wait for animation to finish (5 seconds)
                setTimeout(() => {
                    setReward(data.reward);
                    setIsSpinning(false);
                    checkStatus(); // Refresh eligibility
                }, 5000);
                
            } else {
                alert("Error: " + data.error);
                setIsSpinning(false);
            }
        } catch (error) {
            alert("Server error");
            setIsSpinning(false);
        }
    };

    if (!connected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
                        Lucky Wheel
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
                        GOLDEN SPIN
                    </h1>
                    <p className="text-zinc-300 font-medium">
                        Get <span className="text-yellow-400 font-bold">1 Rewards Box</span> every day if you have a 30-Day active stake!
                    </p>
                </div>

            {/* WHEEL CONTAINER */}
            <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] mb-16 flex items-center justify-center">
                {/* Glow Background */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-50 bg-gradient-to-r from-yellow-500 to-amber-600 animate-pulse"></div>
                
                {/* Outer Golden Border & Lights */}
                <div className="absolute inset-[-10px] md:inset-[-15px] rounded-full bg-gradient-to-tr from-yellow-400 via-amber-600 to-yellow-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] z-0 flex items-center justify-center">
                    <div className="absolute inset-[3px] md:inset-[5px] rounded-full bg-[#1a0f2e]"></div>
                    {/* Glowing dots */}
                    {[...Array(16)].map((_, i) => (
                        <div 
                            key={`dot-${i}`}
                            className="absolute w-2 h-2 rounded-full bg-yellow-100 shadow-[0_0_8px_#fef08a]"
                            style={{
                                transform: `rotate(${i * 22.5}deg) translateY(-160px)`, // Adjusted for 320px base, will scale via CSS or just use % for responsive
                                top: '50%', left: '50%', margin: '-4px 0 0 -4px'
                            }}
                        />
                    ))}
                    {/* Responsive Dots Fix */}
                    <style jsx>{`
                        @media (min-width: 768px) {
                            div[style*="translateY(-160px)"] {
                                transform: rotate(calc(var(--i) * 22.5deg)) translateY(-210px) !important;
                            }
                        }
                    `}</style>
                </div>

                {/* Selector Diamond (Top) */}
                <div className="absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 z-30 drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">
                    <div className="w-8 h-12 md:w-10 md:h-14 bg-gradient-to-b from-yellow-200 to-amber-500" style={{ clipPath: 'polygon(50% 100%, 0 25%, 50% 0, 100% 25%)' }}></div>
                </div>

                {/* The Wheel */}
                <div 
                    className="absolute inset-0 rounded-full border-4 border-yellow-500/20 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-transform ease-out z-10"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transitionDuration: '5s', // 5 second spin animation
                        background: `conic-gradient(${WHEEL_SLICES.map((s, i) => `${s.color} ${i * (360/WHEEL_SLICES.length)}deg ${(i+1) * (360/WHEEL_SLICES.length)}deg`).join(', ')})`
                    }}
                >
                    {WHEEL_SLICES.map((slice, i) => {
                        const sliceAngle = 360 / WHEEL_SLICES.length;
                        const deg = (i * sliceAngle) + (sliceAngle / 2);
                        return (
                            <div 
                                key={i}
                                className="absolute top-0 left-0 w-full h-full flex items-start justify-center pointer-events-none"
                                style={{
                                    transform: `rotate(${deg}deg)`,
                                }}
                            >
                                <span 
                                    className="block mt-6 text-white font-bold text-xs md:text-sm tracking-wider text-center"
                                    style={{
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                    }}
                                >
                                    {slice.label}
                                </span>
                            </div>
                        );
                    })}
                    
                    {/* Inner Center Circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-zinc-900 border-[6px] border-amber-500 rounded-full z-10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                        <span className="text-yellow-400 font-black text-3xl drop-shadow-[0_2px_5px_rgba(245,158,11,0.5)]">G</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 w-full max-w-sm mb-16 relative z-10">
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || (!status?.isEligibleForFreeSpin && (status?.balance < status?.spinCost || (status?.requiresMinBalance && status?.balance < 10000)))}
                    className={`w-full py-5 rounded-full font-black text-xl uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 ${
                        isSpinning 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : status?.isEligibleForFreeSpin
                            ? 'bg-gradient-to-b from-green-400 via-emerald-500 to-green-700 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 hover:brightness-110'
                            : (status?.balance >= status?.spinCost && (!status?.requiresMinBalance || status?.balance >= 10000))
                                ? 'bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 hover:brightness-110'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                    {!isSpinning && (
                        <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center border border-white/20">
                            <span className="text-yellow-300 text-sm">G</span>
                        </div>
                    )}
                    {isSpinning ? 'SPINNING...' : status?.isEligibleForFreeSpin ? 'OPEN REWARDS BOX' : `SPIN FOR ${status?.spinCost || '...'} TOKENS`}
                </button>

                {!status?.isEligibleForFreeSpin && (
                    <div className="text-xs text-zinc-400 text-center flex items-start gap-2 max-w-sm mx-auto">
                        <span className="text-zinc-500 mt-0.5">ⓘ</span>
                        <p>
                            Stake tokens to get massive discounts and up to 1 Rewards Box daily!
                            
                            {status?.requiresMinBalance && status?.balance < 10000 && (
                                <span className="block text-red-500 mt-2 font-bold">
                                    ⚠️ Minimum 10,000 Golden Tokens required to spin without an active stake. (Current: {status.balance.toLocaleString()})
                                </span>
                            )}
                            
                            {status?.balance < status?.spinCost && (!status?.requiresMinBalance || status?.balance >= 10000) && (
                                <span className="block text-red-500 mt-2 font-bold">
                                    ⚠️ Insufficient balance. {status.spinCost} tokens required.
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Info Cards */}
            <div className="w-full max-w-5xl bg-[#130b29]/80 backdrop-blur-md rounded-3xl border border-purple-500/20 p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 z-10 relative">
                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]">🎁</div>
                    <h3 className="text-xs font-bold text-orange-400 tracking-wider mb-2">EVERY DAY 1 SPIN</h3>
                    <p className="text-[11px] text-zinc-500">Stake your tokens for 30 days and earn 1 Rewards Box daily!</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">🛡️</div>
                    <h3 className="text-xs font-bold text-red-400 tracking-wider mb-2">SAFE & FAIR</h3>
                    <p className="text-[11px] text-zinc-500">All spin mechanics and results are mathematically verified.</p>
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

            </div>
        </div>
    );
}
