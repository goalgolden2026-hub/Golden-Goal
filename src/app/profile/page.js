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
    const [claiming, setClaiming] = useState(false);
    const [claimMessage, setClaimMessage] = useState("");

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

    const handleClaimReward = async () => {
        setClaiming(true);
        setClaimMessage("");
        try {
            const res = await fetch('/api/user/claim-reward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: publicKey.toBase58() })
            });
            const data = await res.json();
            if (data.success) {
                setClaimMessage("🎉 Başarıyla 1500 Golden Goal Token kazandın!");
                fetchProfile(); // Refresh points
            } else {
                setClaimMessage(`❌ Hata: ${data.error}`);
            }
        } catch (error) {
            setClaimMessage("❌ Sunucu hatası.");
        }
        setClaiming(false);
    };

    const copyToClipboard = () => {
        const link = `${window.location.origin}/?ref=${profile.referralCode}`;
        navigator.clipboard.writeText(link);
        alert("Referans linki kopyalandı!");
    };

    if (!connected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold mb-6 text-white">Profil & Referans Sistemi</h1>
                <p className="text-zinc-400 mb-8 text-center max-w-md">
                    Referans istatistiklerinizi görmek ve cüzdan bakiyenizi kontrol etmek için lütfen Phantom cüzdanınızı bağlayın.
                </p>
                <WalletMultiButtonDynamic className="!bg-amber-500 hover:!bg-amber-600 !text-black !font-bold" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!profile) return null;

    const progressPercent = Math.min((profile.referralPoints / 1000) * 100, 100);

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-extrabold mb-8 text-white">Profilim</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Wallet Balance Card */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-2xl font-bold mb-6 text-zinc-300">Cüzdan Özeti</h2>
                    <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800">
                        <p className="text-sm text-zinc-500 mb-2">Cüzdan Adresi</p>
                        <p className="text-lg text-white font-mono truncate">{profile.walletAddress}</p>
                    </div>
                    <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-6 border border-amber-500/20">
                        <p className="text-sm text-amber-500/80 mb-2 font-bold">Golden Token Bakiyesi</p>
                        <p className="text-4xl font-black text-white">{profile.balance.toLocaleString()}</p>
                    </div>

                    <div className="mt-6 bg-black/50 rounded-2xl p-6 border border-zinc-800">
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-sm text-zinc-500">Günlük Bet Hakkı</p>
                            <p className="text-lg text-white font-bold">
                                {profile.maxBets - profile.betsToday} <span className="text-zinc-500 text-sm">/ {profile.maxBets} Kaldı</span>
                            </p>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.max(0, ((profile.maxBets - profile.betsToday) / profile.maxBets) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                            Stake yaparak veya Şans Çarkını çevirerek limitinizi yükseltebilirsiniz.
                        </p>
                    </div>
                </div>

                {/* Referral System Card */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h2 className="text-2xl font-bold mb-6 text-zinc-300">Davet Et, Kazan!</h2>
                    
                    <div className="mb-8">
                        <p className="text-sm text-zinc-400 mb-2">Kişisel Referans Linkin</p>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={`https://golden-goal-five.vercel.app/?ref=${profile.referralCode}`}
                                className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 font-mono text-sm focus:outline-none"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-bold transition-colors"
                            >
                                Kopyala
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                            Bu linkle gelip ilk tahminini yapan her arkadaşın için <strong className="text-amber-500">100 Puan</strong> kazanırsın.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500 mb-1">Davet Edilen</p>
                            <p className="text-2xl font-bold text-white">{profile.totalInvited}</p>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500 mb-1">Toplam Puan</p>
                            <p className="text-2xl font-bold text-amber-500">{profile.referralPoints} <span className="text-sm text-zinc-500">/ 1000</span></p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-zinc-400">Ödül İlerlemesi</span>
                            <span className="font-bold text-white">{progressPercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3">
                            <div 
                                className="bg-gradient-to-r from-yellow-500 to-amber-600 h-3 rounded-full transition-all duration-500" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={handleClaimReward}
                            disabled={profile.referralPoints < 1000 || claiming}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                                profile.referralPoints >= 1000 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:scale-[1.02]' 
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                        >
                            {claiming ? 'İşleniyor...' : 'Ödülü Al'}
                        </button>
                        <p className="text-xs text-zinc-500 mt-3">Hedefe ulaştığınızda 1500 Golden Goal Token ödülü kazanırsınız.</p>
                        {claimMessage && (
                            <p className={`mt-4 text-sm font-medium ${claimMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                                {claimMessage}
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
