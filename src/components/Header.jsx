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
                            <Link href="/docs" className="hover:text-white transition-colors text-yellow-400 font-medium">Docs 📄</Link>
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
