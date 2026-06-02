"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function SocialTasksPage() {
    const { publicKey, connected } = useWallet();
    
    useEffect(() => {
        window.location.href = '/rewards/locking';
    }, []);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Social Tasks State
    const [tweetUrl, setTweetUrl] = useState('');
    const [submittingTweet, setSubmittingTweet] = useState(false);
    const [tweetMessage, setTweetMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [socialLeaderboard, setSocialLeaderboard] = useState([]);

    useEffect(() => {
        if (connected && publicKey) {
            fetchProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [connected, publicKey]);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/user/profile?walletAddress=${publicKey.toBase58()}`);
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
            }
            
            // Also fetch social leaderboard
            const lbRes = await fetch('/api/leaderboard/social');
            const lbData = await lbRes.json();
            if (lbData.success) {
                setSocialLeaderboard(lbData.leaderboard);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
        setLoading(false);
    };

    const handleTweetSubmit = async () => {
        if (!tweetUrl) return;
        setSubmittingTweet(true);
        setTweetMessage('');
        try {
            const res = await fetch('/api/user/twitter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: publicKey.toBase58(), tweetUrl })
            });
            const data = await res.json();
            if (data.success) {
                setTweetMessage('🎉 ' + data.message);
                setTweetUrl('');
                setCooldown(60); // Start 60s cooldown
                fetchProfile(); // refresh to show updated points
            } else {
                setTweetMessage('❌ ' + data.error);
            }
        } catch (error) {
            setTweetMessage('❌ Server error.');
        }
        setSubmittingTweet(false);
    };

    if (!connected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh]">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        Social Tasks
                    </h1>
                    <p className="text-zinc-400 max-w-md mx-auto">
                        Connect your wallet to participate in social campaigns, complete tasks, and climb the social leaderboard.
                    </p>
                </div>
                <WalletMultiButtonDynamic className="!bg-blue-500 hover:!bg-blue-600 !text-white !font-bold !rounded-full !px-8 !py-4" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 relative">
            {/* Background Glows */}
            <div className="absolute top-[10%] left-[5%] w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                        Social <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">Campaigns</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                        Spread the word about Golden Goal, earn Social Points, climb the leaderboard, and unlock exclusive rewards.
                    </p>
                </div>

                {/* Score Ribbon / Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all hover:bg-zinc-800/40 hover:border-blue-500/30 group">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-3xl mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-300">
                            🐦
                        </div>
                        <p className="text-zinc-400 text-sm font-medium tracking-wide mb-1">My Social Score</p>
                        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                            {profile.socialPoints || 0}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2 font-medium">Earn 25 Social Points for each tweet submission!</p>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all hover:bg-zinc-800/40 hover:border-purple-500/30 group">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-3xl mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform duration-300">
                            ⚡
                        </div>
                        <p className="text-zinc-400 text-sm font-medium tracking-wide mb-1">Active Wallet Address</p>
                        <p className="text-lg text-zinc-200 font-mono tracking-tight bg-black/40 px-4 py-2 rounded-xl border border-zinc-800/50 max-w-full truncate mt-2">
                            {profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-8)}
                        </p>
                        <p className="text-xs text-zinc-500 mt-3 font-medium">Connected and ready to claim rewards</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Twitter Task Card */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between hover:border-blue-500/20 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-zinc-200 flex items-center gap-3">
                                <span>🐦</span> Share on X (Twitter)
                            </h2>
                            
                            <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800/60 mb-6">
                                <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                                    Tweet about <strong className="text-white">Golden Goal</strong> using the hashtag <span className="text-blue-400 font-bold">#GoldenGoal</span> and paste your tweet link here to earn <span className="text-amber-500 font-bold">25 Social Points</span> instantly!
                                </p>
                                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex items-center justify-between gap-3">
                                    <div className="text-xs text-zinc-400">
                                        Need a quick tweet idea? Click below to generate a beautiful tweet automatically!
                                    </div>
                                    <a 
                                        href={`https://twitter.com/intent/tweet?text=Forecasting matches, climbing leaderboards, and earning XP on @GoldenGoal! Join the ultimate competitive football prediction ecosystem on Solana. ⚽🔥%0A%0A%23Solana %23GoldenGoal`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        🐦 Tweet Now
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            {cooldown > 0 ? (
                                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-6 rounded-2xl text-center font-bold flex flex-col items-center justify-center gap-2 animate-pulse">
                                    <span className="text-3xl">✅</span>
                                    <span className="text-lg">Task Verification Submitted!</span>
                                    <span className="text-xs font-normal text-green-400/80">Points updated successfully! Cooldown active for {cooldown} seconds.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="https://x.com/username/status/123..."
                                        value={tweetUrl}
                                        onChange={(e) => setTweetUrl(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-300 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder-zinc-600"
                                    />
                                    <button 
                                        onClick={handleTweetSubmit}
                                        disabled={submittingTweet || !tweetUrl}
                                        className={`w-full py-4 rounded-xl font-bold tracking-wide transition-all duration-300 text-sm ${
                                            submittingTweet || !tweetUrl 
                                            ? 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-white/5' 
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.5)]'
                                        }`}
                                    >
                                        {submittingTweet ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Verifying Submission...
                                            </span>
                                        ) : 'Submit and Earn 25 SP'}
                                    </button>
                                </div>
                            )}
                            
                            {tweetMessage && cooldown === 0 && (
                                <div className={`mt-4 p-3 rounded-xl border text-xs font-medium text-center ${tweetMessage.includes('❌') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                    {tweetMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social Leaderboard */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-purple-500/20 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-zinc-200 flex items-center gap-3">
                                <span>🏆</span> Social Leaderboard
                            </h2>
                            {socialLeaderboard.length === 0 ? (
                                <div className="text-center py-12 bg-black/40 rounded-2xl border border-zinc-800/60">
                                    <span className="text-4xl block mb-2">⭐</span>
                                    <p className="text-zinc-500 text-sm">No submissions yet. Be the first to claim the top spot!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {socialLeaderboard.map((user, index) => {
                                        const isCurrentUser = user.walletAddress === profile.walletAddress;
                                        return (
                                            <div 
                                                key={index} 
                                                className={`flex justify-between items-center p-3.5 rounded-xl border transition-all ${
                                                    isCurrentUser 
                                                        ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                                        : 'bg-zinc-950/60 border-zinc-800/60 hover:bg-zinc-900/60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        index === 1 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30' :
                                                        index === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' :
                                                        'bg-zinc-800 text-zinc-400'
                                                    }`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                    </div>
                                                    <span className="font-mono text-sm text-zinc-300">
                                                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="text-[9px] font-extrabold tracking-widest bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full uppercase">YOU</span>
                                                    )}
                                                </div>
                                                <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                                    {user.socialPoints} SP
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-8 text-center text-xs text-zinc-500 select-none">
                            * Social Points are checked and verified algorithmically. Play fair!
                        </div>
                    </div>
                </div>

                {/* Legal Notice */}
                <div className="mt-16 text-center max-w-3xl mx-auto pb-8">
                    <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 select-none leading-relaxed">
                        NO PURCHASE NECESSARY. Standard daily prediction quotas are allocated for free. Twitter social tasks reward players with Social Points strictly for non-financial competitive simulation metrics. Void where prohibited by law.
                    </p>
                </div>
            </div>
        </div>
    );
}
