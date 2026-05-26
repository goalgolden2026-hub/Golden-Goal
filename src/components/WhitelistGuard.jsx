"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { isWalletWhitelisted } from '@/lib/whitelist';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function WhitelistGuard({ children }) {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const walletAddress = publicKey ? publicKey.toBase58() : null;

  // Set connected_wallet cookie for server-side middleware validation
  useEffect(() => {
    if (mounted) {
      if (connected && walletAddress) {
        document.cookie = `connected_wallet=${walletAddress}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        document.cookie = `connected_wallet=; path=/; max-age=0; SameSite=Lax`;
      }
    }
  }, [connected, walletAddress, mounted]);

  if (!mounted) return null;

  // List of public, unprotected routes
  const publicRoutes = ['/', '/docs', '/pitchdeck', '/onepager'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If it's a public page, let them view it immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  const isWhitelisted = isWalletWhitelisted(walletAddress);

  // If connected AND whitelisted, grant access
  if (connected && isWhitelisted) {
    return <>{children}</>;
  }

  // Otherwise, render the gorgeous glassmorphic Beta Lock Screen
  return (
    <div className="flex-1 w-full bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden min-h-[calc(100vh-64px)]">
      
      {/* Background glowing orb */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-amber-500/10 via-yellow-600/5 to-transparent blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-lg bg-zinc-900/60 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center space-y-8 relative select-none">
        
        {/* Top gold bar decorative */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-t-[32px]"></div>

        {/* Lock Animation/Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse">
              <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-amber-400/80 font-mono tracking-widest uppercase bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/10">
            PRIVATE PREVIEW MODE
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-none">
            Platform is Locked
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
            Golden Goal is currently in closed testing. To enter the prediction platform, please connect a whitelisted Solana wallet.
          </p>
        </div>

        {/* Status Messaging */}
        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
          {connected ? (
            <div className="space-y-1">
              <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider font-mono">ACCESS DENIED</div>
              <div className="text-[11px] text-zinc-300 truncate max-w-xs mx-auto font-mono">
                {walletAddress}
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                This wallet is not whitelisted. Please reconnect with an authorized preview address or contact the team.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">STATUS</div>
              <p className="text-zinc-400 text-xs">Wallet is disconnected.</p>
            </div>
          )}
        </div>

        {/* Connection Action */}
        <div className="flex flex-col items-center justify-center pt-2">
          <WalletMultiButtonDynamic className="!bg-gradient-to-r !from-yellow-500 !to-amber-600 hover:!from-yellow-400 hover:!to-amber-500 !text-black !font-black !rounded-xl !h-12 !px-8 !transition-all hover:!scale-105 !shadow-[0_0_20px_rgba(245,158,11,0.25)] !uppercase !tracking-wider !text-xs" />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
          <Link 
            href="/docs" 
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            Read Whitepaper
          </Link>
          <Link 
            href="/pitchdeck" 
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            View Pitch Deck
          </Link>
        </div>

      </div>
    </div>
  );
}
