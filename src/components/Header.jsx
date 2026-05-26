"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function Header() {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';

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
                    <div className="flex items-center">
                        <Link href="/markets" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-2 px-6 rounded-full transition-all hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            Launch App
                        </Link>
                    </div>
                ) : (
                    <>
                        <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
                            <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
                            <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
                            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
                            <Link href="/stake" className="hover:text-white transition-colors">Staking</Link>
                            <Link href="/profile" className="hover:text-white transition-colors text-amber-500">Profile</Link>
                            <Link href="/spin" className="hover:text-white transition-colors text-red-500 font-bold flex items-center gap-1">Spin 🎰</Link>
                            <Link href="/docs" className="hover:text-white transition-colors text-yellow-400 font-medium flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Docs
                            </Link>
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
