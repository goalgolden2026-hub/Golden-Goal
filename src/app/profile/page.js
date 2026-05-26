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
                setClaimMessage("🎉 Successfully claimed 1500 Golden Goal Tokens!");
                fetchProfile(); // Refresh points
            } else {
                setClaimMessage(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setClaimMessage("❌ Server error.");
        }
        setClaiming(false);
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
                fetchProfile(); // refresh to show update points
            } else {
                setTweetMessage('❌ ' + data.error);
                // If backend error says "Please wait X seconds", parse X if possible, but backend handles block.
            }
        } catch (error) {
            setTweetMessage('❌ Server error.');
        }
        setSubmittingTweet(false);
    };

    const copyToClipboard = () => {
        const link = `${window.location.origin}/?ref=${profile.referralCode}`;
        navigator.clipboard.writeText(link);
        alert("Referral link copied!");
    };

    if (!connected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold mb-6 text-white">Profile & Referral System</h1>
                <p className="text-zinc-400 mb-8 text-center max-w-md">
                    Please connect your Phantom wallet to view your referral statistics and check your balance.
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
            <h1 className="text-4xl font-extrabold mb-8 text-white">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Wallet Balance Card */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-2xl font-bold mb-6 text-zinc-300">Wallet Summary</h2>
                    <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800">
                        <p className="text-sm text-zinc-500 mb-2">Wallet Address</p>
                        <p className="text-lg text-white font-mono truncate">{profile.walletAddress}</p>
                    </div>
                    <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-6 border border-amber-500/20">
                        <p className="text-sm text-amber-500/80 mb-2 font-bold">Golden Token Balance</p>
                        <p className="text-4xl font-black text-white">{profile.balance.toLocaleString()}</p>
                    </div>

                    <div className="mt-6 bg-black/50 rounded-2xl p-6 border border-zinc-800">
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-sm text-zinc-500">Daily Prediction Limit</p>
                            <p className="text-lg text-white font-bold">
                                {profile.maxBets - profile.betsToday} <span className="text-zinc-500 text-sm">/ {profile.maxBets} Left</span>
                            </p>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.max(0, ((profile.maxBets - profile.betsToday) / profile.maxBets) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                            You can increase your limit by staking or spinning the Lucky Wheel.
                        </p>
                    </div>
                </div>

                {/* Referral System Card */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h2 className="text-2xl font-bold mb-6 text-zinc-300">Invite & Earn!</h2>
                    
                    <div className="mb-8">
                        <p className="text-sm text-zinc-400 mb-2">Personal Referral Link</p>
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
                                Copy
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                            You earn <strong className="text-amber-500">100 Points</strong> for every friend who joins via this link and places their first prediction.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500 mb-1">Invited Users</p>
                            <p className="text-2xl font-bold text-white">{profile.totalInvited}</p>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50 text-center">
                            <p className="text-xs text-zinc-500 mb-1">Total Points</p>
                            <p className="text-2xl font-bold text-amber-500">{profile.referralPoints} <span className="text-sm text-zinc-500">/ 1000</span></p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-zinc-400">Reward Progress</span>
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
                            {claiming ? 'Processing...' : 'Claim Reward'}
                        </button>
                        <p className="text-xs text-zinc-500 mt-3">Reach the target to win 1500 Golden Goal Tokens.</p>
                        {claimMessage && (
                            <p className={`mt-4 text-sm font-medium ${claimMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                                {claimMessage}
                            </p>
                        )}
                    </div>

                </div>
            </div>

            {/* Social Tasks Card */}
            <div className="mt-8 bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-2xl font-bold mb-6 text-zinc-300">Social Tasks</h2>
                
                <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🐦</span>
                            <h3 className="text-lg font-bold text-white">Share on X (Twitter)</h3>
                        </div>
                        <p className="text-sm text-zinc-400 mb-4">
                            Tweet about Golden Goal using the hashtag <span className="text-blue-400 font-bold">#GoldenGoal</span> and paste your tweet link here to earn <span className="text-amber-500 font-bold">25 Social Points</span> instantly! You can do this repeatedly!
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            {cooldown > 0 ? (
                                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center font-bold flex flex-col items-center justify-center gap-2">
                                    <span className="text-2xl">✅</span>
                                    <span>Task Completed!</span>
                                    <span className="text-sm font-normal text-green-400/80">You can submit another tweet in {cooldown} seconds.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="https://x.com/username/status/123..."
                                        value={tweetUrl}
                                        onChange={(e) => setTweetUrl(e.target.value)}
                                        className="w-full sm:flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <button 
                                        onClick={handleTweetSubmit}
                                        disabled={submittingTweet || !tweetUrl}
                                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all ${
                                            submittingTweet || !tweetUrl 
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                    >
                                        {submittingTweet ? 'Verifying...' : 'Submit'}
                                    </button>
                                </div>
                            )}
                            
                            {tweetMessage && cooldown === 0 && (
                                <p className={`text-sm font-medium ${tweetMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                                    {tweetMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 border-t border-white/10 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User's Social Score */}
                    <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800 text-center flex flex-col items-center justify-center">
                        <p className="text-sm text-zinc-400 mb-2">My Social Points</p>
                        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            {profile.socialPoints || 0}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">Rank up to earn exclusive rewards!</p>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-black/50 rounded-2xl p-6 border border-zinc-800">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span>🏆</span> Social Leaderboard
                        </h3>
                        {socialLeaderboard.length === 0 ? (
                            <p className="text-zinc-500 text-sm">No one is on the leaderboard yet. Be the first!</p>
                        ) : (
                            <div className="space-y-3">
                                {socialLeaderboard.map((user, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                {index + 1}
                                            </div>
                                            <span className="font-mono text-sm text-zinc-300">
                                                {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                                            </span>
                                            {user.walletAddress === profile.walletAddress && (
                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">YOU</span>
                                            )}
                                        </div>
                                        <div className="font-bold text-blue-400">{user.socialPoints}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
