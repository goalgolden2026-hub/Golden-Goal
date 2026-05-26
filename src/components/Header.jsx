"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { isWalletWhitelisted } from '@/lib/whitelist';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function Header() {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';
    const { publicKey, connected } = useWallet();
    const { setVisible } = useWalletModal();

    const walletAddress = publicKey ? publicKey.toBase58() : null;
    const isWhitelisted = isWalletWhitelisted(walletAddress);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center">
                        <span className="text-black font-bold text-lg">G</span>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 tracking-tight">
                        Golden Goal
                    </span>
                </Link>
                
                {isLandingPage ? (
                    <div className="flex items-center gap-4">

                        
                        {connected ? (
                            isWhitelisted ? (
                                <Link 
                                    href="/markets" 
                                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black py-2 px-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30 flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <span>Launch App</span>
                                    <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </Link>
                            ) : (
                                <button 
                                    disabled
                                    className="bg-zinc-900/80 border border-red-500/30 text-red-500/80 font-bold py-2 px-5 rounded-full flex items-center gap-1.5 cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                                    title="Coming Soon - This wallet address is not authorized for the closed beta testing phase."
                                >
                                    <svg className="w-4.5 h-4.5 text-red-500/80 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Coming Soon</span>
                                </button>
                            )
                        ) : (
                            <button 
                                onClick={() => setVisible(true)}
                                className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black py-2 px-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.25)] border border-yellow-400/30 flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <span>Launch App</span>
                                <svg className="w-4 h-4 text-zinc-950 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}

                        {connected && (
                            <WalletMultiButtonDynamic className="!bg-zinc-900 !border !border-white/10 hover:!bg-zinc-800 !transition-colors !rounded-full !h-10 !px-4 !font-semibold !text-xs" />
                        )}
                    </div>
                ) : (
                    <>
                        <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
                            <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
                            <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
                            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
                            <Link href="/stake" className="hover:text-white transition-colors">Staking</Link>
                            <Link href="/profile" className="hover:text-white transition-colors text-amber-500">Profile</Link>
                            <Link href="/spin" className="hover:text-white transition-colors text-amber-500 font-bold flex items-center gap-1">Rewards Box 🎁</Link>
                        </nav>

                        <div className="flex items-center">
                            <WalletMultiButtonDynamic className="!bg-zinc-800 hover:!bg-zinc-700 !transition-colors !rounded-full !h-10 !px-6 !font-semibold !text-sm" />
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
