"use client";

import React, { useState, useEffect } from 'react';
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showWalletUI = mounted && connected;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobilePredictionOpen, setMobilePredictionOpen] = useState(false);
    const [mobileRewardsOpen, setMobileRewardsOpen] = useState(false);


    const walletAddress = publicKey ? publicKey.toBase58() : null;
    const isWhitelisted = isWalletWhitelisted(walletAddress);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2 relative z-50">
                    <img 
                        src="/logo.jpg" 
                        alt="Golden Goal Logo" 
                        className="w-8 h-8 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    />
                    <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 tracking-tight">
                        Golden Goal
                    </span>
                </Link>
                
                {isLandingPage ? (
                    /* Landing Page Navbar - Minimalist & High Conversion */
                    <div className="flex items-center gap-4 relative z-50">
                        {showWalletUI ? (
                            isWhitelisted ? (
                                <Link 
                                    href="/markets?filter=live" 
                                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black py-2 px-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30 flex items-center gap-1.5 whitespace-nowrap text-xs"
                                >
                                    <span>Launch App</span>
                                    <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </Link>
                            ) : (
                                <button 
                                    disabled
                                    className="bg-zinc-900/80 border border-red-500/30 text-red-500/80 font-bold py-2 px-5 rounded-full flex items-center gap-1.5 cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.05)] text-xs"
                                    title="Coming Soon - This wallet address is not authorized for the closed beta testing phase."
                                >
                                    <svg className="w-4 h-4 text-red-500/80 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Coming Soon</span>
                                </button>
                            )
                        ) : (
                            <button 
                                onClick={() => setVisible(true)}
                                className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 bg-[length:200%_auto] hover:bg-[100%_0] text-zinc-950 font-black py-2 px-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.25)] border border-yellow-400/30 flex items-center gap-1.5 whitespace-nowrap text-xs"
                            >
                                <span>Launch App</span>
                                <svg className="w-4 h-4 text-zinc-950 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}

                        {showWalletUI && (
                            <WalletMultiButtonDynamic className="!bg-zinc-900 !border !border-white/10 hover:!bg-zinc-800 !transition-colors !rounded-full !h-9 !px-4 !font-semibold !text-[11px]" />
                        )}
                    </div>
                ) : (
                    /* App Pages Navbar - Fully Loaded & Responsive */
                    <>
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex gap-6 items-center text-sm font-semibold text-zinc-400">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            
                            {/* Prediction Dropdown */}
                            <div className="relative group py-2">
                                <button className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none">
                                    Prediction <span className="text-zinc-500 text-[10px] transition-transform duration-300 group-hover:rotate-180">▼</span>
                                </button>
                                
                                {/* Transparent Bridge Wrapper */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-52 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                                    {/* Actual Styled Dropdown Container */}
                                    <div className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:border-emerald-500/30 relative">
                                        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                                        <Link href="/markets?filter=live" className="block px-4 py-2.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold text-xs text-left">Live Match</Link>
                                        <Link href="/markets?filter=upcoming" className="block px-4 py-2.5 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 transition-all font-semibold text-xs text-left">Upcoming Match</Link>
                                        <Link href="/dashboard" className="block px-4 py-2.5 rounded-xl hover:bg-purple-500/10 hover:text-purple-400 transition-all font-semibold text-xs text-left">Dashboard</Link>
                                    </div>
                                </div>
                            </div>

                            <Link href="/groups" className="hover:text-white transition-colors">Groups</Link>
                            
                            {/* Rewards Dropdown */}
                            <div className="relative group py-2">
                                <button className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none">
                                    Rewards <span className="text-zinc-500 text-[10px] transition-transform duration-300 group-hover:rotate-180">▼</span>
                                </button>
                                
                                {/* Transparent Bridge Wrapper */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-52 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                                    {/* Actual Styled Dropdown Container */}
                                    <div className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:border-amber-500/30 relative">
                                        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                                        <Link href="/rewards/locking" className="block px-4 py-2.5 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 transition-all font-semibold text-xs text-left">Locking</Link>
                                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl text-zinc-500 cursor-not-allowed font-semibold text-xs select-none hover:bg-white/[0.02]">
                                            <span>Reward Box</span>
                                            <span className="text-[8px] font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse">Coming Soon</span>
                                        </div>
                                        <Link href="/rewards/social-tasks" className="block px-4 py-2.5 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 transition-all font-semibold text-xs text-left">Social Tasks</Link>
                                    </div>
                                </div>
                            </div>

                            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>


                            <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
                        </nav>

                        {/* Desktop Wallet connection */}
                        <div className="hidden md:flex items-center gap-4">
                            <WalletMultiButtonDynamic className="!bg-zinc-800 hover:!bg-zinc-700 !transition-colors !rounded-full !h-10 !px-6 !font-semibold !text-sm" />
                        </div>

                        {/* Mobile Menu Button / Hamburger */}
                        <button 
                            onClick={toggleMobileMenu} 
                            className="md:hidden flex flex-col justify-center items-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 z-[60] focus:outline-none"
                            aria-label="Toggle Menu"
                        >
                            <span className={`block w-4.5 h-0.5 bg-zinc-300 rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                            <span className={`block w-4.5 h-0.5 bg-zinc-300 rounded-full my-1 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`block w-4.5 h-0.5 bg-zinc-300 rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
                        </button>
                    </>
                )}
            </div>
        </header>

        {/* Mobile Menu Drawer (Slide Down Overlay) - Rendered as sibling to header to escape containing block filter constraints */}
        {!isLandingPage && isMobileMenuOpen && (
            <div className="fixed inset-0 top-16 bg-zinc-950 md:hidden z-[999] animate-in fade-in slide-in-from-top duration-300 flex flex-col justify-between p-6 overflow-y-auto">
                <div className="flex flex-col gap-5 text-base font-semibold text-zinc-300">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 border-b border-white/5 hover:text-white transition-colors">Home</Link>
                    
                    {/* Mobile Prediction Dropdown */}
                    <div className="flex flex-col">
                        <button 
                            onClick={() => setMobilePredictionOpen(!mobilePredictionOpen)}
                            className="flex justify-between items-center py-2.5 border-b border-white/5 hover:text-white transition-colors w-full text-left"
                        >
                            <span>Prediction</span>
                            <span className={`text-xs text-zinc-500 transform transition-transform ${mobilePredictionOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {mobilePredictionOpen && (
                            <div className="flex flex-col gap-3.5 pl-5 pr-4 py-4 text-sm bg-zinc-900/30 rounded-2xl mt-2.5 border border-zinc-800/50">
                                <Link href="/markets?filter=live" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-400 transition-colors font-medium">Live Match</Link>
                                <Link href="/markets?filter=upcoming" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-400 transition-colors font-medium">Upcoming Match</Link>
                                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 transition-colors font-medium">Dashboard</Link>
                            </div>
                        )}
                    </div>

                    <Link href="/groups" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 border-b border-white/5 hover:text-white transition-colors">Groups</Link>

                    {/* Mobile Rewards Dropdown */}
                    <div className="flex flex-col">
                        <button 
                            onClick={() => setMobileRewardsOpen(!mobileRewardsOpen)}
                            className="flex justify-between items-center py-2.5 border-b border-white/5 hover:text-white transition-colors w-full text-left"
                        >
                            <span>Rewards</span>
                            <span className={`text-xs text-zinc-500 transform transition-transform ${mobileRewardsOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {mobileRewardsOpen && (
                            <div className="flex flex-col gap-3.5 pl-5 pr-4 py-4 text-sm bg-zinc-900/30 rounded-2xl mt-2.5 border border-zinc-800/50">
                                <Link href="/rewards/locking" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-amber-400 transition-colors font-medium">Locking</Link>
                                <div className="flex justify-between items-center text-zinc-500 cursor-not-allowed text-xs py-0.5 select-none font-medium">
                                    <span>Reward Box</span>
                                    <span className="text-[8px] font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse">Coming Soon</span>
                                </div>
                                <Link href="/rewards/social-tasks" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-amber-400 transition-colors font-medium">Social Tasks</Link>
                            </div>
                        )}
                    </div>

                    <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 border-b border-white/5 hover:text-white transition-colors">Leaderboard</Link>

                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 border-b border-white/5 hover:text-white transition-colors">Profile</Link>
                </div>

                <div className="mt-8 flex flex-col gap-4 w-full pb-6">
                    <div className="flex justify-center w-full">
                        <WalletMultiButtonDynamic className="!bg-zinc-900 !border !border-white/10 hover:!bg-zinc-800 hover:!border-amber-500/20 !transition-all !rounded-full !h-12 !w-full !flex !items-center !justify-center !font-bold !text-sm" />
                    </div>
                </div>
            </div>
        )}
    </>
);
}

