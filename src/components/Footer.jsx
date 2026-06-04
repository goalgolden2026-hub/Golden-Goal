import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-950/45 backdrop-blur-lg border-t border-white/5 py-12 mt-auto relative z-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Brand Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.jpg" 
              alt="Golden Goal Logo" 
              className="w-8 h-8 rounded-full object-cover border border-yellow-500/20"
            />
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 text-lg uppercase tracking-wider">
              Golden Goal
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
            The ultimate gamified prediction economy on Solana. Lock, forecast, and climb the leaderboard.
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-col gap-4">
          <span className="text-zinc-400 text-xs font-black tracking-widest uppercase">Community & Socials</span>
          <div className="flex flex-col gap-2">
            <a 
              href="https://x.com/goldengoalsol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-amber-400 text-xs font-bold transition-all flex items-center gap-2 w-fit hover:translate-x-1"
            >
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (formerly Twitter)</span>
            </a>
            <a 
              href="https://t.me/goldengoalsol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-sky-400 text-xs font-bold transition-all flex items-center gap-2 w-fit hover:translate-x-1"
            >
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 4-.1.74-1.72 13.97-5.12.9-.24 1.53-.16 1.76-.04.24.12.3.36.26.69z"/>
              </svg>
              <span>Telegram Chat</span>
            </a>
          </div>
        </div>

        {/* Verified Contracts */}
        <div className="flex flex-col gap-4">
          <span className="text-zinc-400 text-xs font-black tracking-widest uppercase">Verified Contracts & Vaults</span>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Stake Wallet</span>
              <a 
                href="https://solscan.io/account/Fk3kDaJbh4dBHNfDyiquXTiKZmbVS8BQ8bLvDy4aeJwm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-zinc-300 hover:text-amber-400 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between group break-all"
              >
                <span>Fk3kDaJbh4dBHNfDyiquXTiKZmbVS8BQ8bLvDy4aeJwm</span>
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Treasury Wallet</span>
              <a 
                href="https://solscan.io/account/5imEZhSwMUfx6XpyQCBqsCWxJKfmmF5JCNoxMWvB23cH" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-zinc-300 hover:text-amber-400 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between group break-all"
              >
                <span>5imEZhSwMUfx6XpyQCBqsCWxJKfmmF5JCNoxMWvB23cH</span>
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-6 border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest">
          © 2026 GOLDEN GOAL. ALL RIGHTS RESERVED.
        </span>
        <span className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest">
          BUILT ON SOLANA 🚀
        </span>
      </div>
    </footer>
  );
}
