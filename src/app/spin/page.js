"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const WHEEL_SLICES = [
    { label: 'Miss', color: '#3f3f46' },         // Index 0
    { label: '1 Extra Bet', color: '#f59e0b' }, // Index 1
    { label: '3 Extra Bets', color: '#10b981' }, // Index 2
    { label: '5 Extra Bets', color: '#3b82f6' }, // Index 3
    { label: '1000 Golden', color: '#eab308' }, // Index 4
    { label: '1 USDC', color: '#6366f1' },      // Index 5
    { label: '10 USDC', color: '#8b5cf6' },     // Index 6
    { label: '5000 Golden', color: '#ec4899' }  // Index 7
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
                        Connect your wallet to spin the wheel and win amazing prizes.
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
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
            
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    Golden Spin
                </h1>
                <p className="text-zinc-400">
                    Get 1 free spin every day if you have a 30-Day active stake!
                </p>
            </div>

            {/* WHEEL CONTAINER */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 mb-12 flex items-center justify-center">
                {/* Glow Background */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-30 bg-gradient-to-r from-yellow-500 to-red-600 animate-pulse"></div>
                
                {/* Selector Arrow (Top) */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 drop-shadow-2xl">
                    <div className="w-8 h-10 bg-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                </div>

                {/* The Wheel */}
                <div 
                    className="absolute inset-0 rounded-full border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-transform ease-out"
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
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-zinc-900 border-4 border-zinc-800 rounded-full z-10 flex items-center justify-center shadow-inner">
                        <span className="text-amber-500 font-black text-xl">G</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || (!status?.isEligibleForFreeSpin && status?.balance < 500)}
                    className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${
                        isSpinning 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : status?.isEligibleForFreeSpin
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105'
                            : status?.balance >= 500 
                                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                    {isSpinning ? 'SPINNING...' : status?.isEligibleForFreeSpin ? 'FREE SPIN' : 'SPIN FOR 500 TOKENS'}
                </button>

                {!status?.isEligibleForFreeSpin && (
                    <p className="text-xs text-zinc-500 text-center">
                        You don't have a free spin. Stake your tokens for 30 days to get 1 free spin daily!
                        {status?.balance < 500 && (
                            <span className="block text-red-500 mt-1 font-bold">
                                Insufficient balance ({status.balance} Golden). 500 tokens required.
                            </span>
                        )}
                    </p>
                )}
            </div>

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
    );
}
