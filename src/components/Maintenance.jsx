import React from 'react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      
      {/* Premium Glowing Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      </div>

      {/* Main Glassmorphic Card Container */}
      <div className="relative max-w-xl w-full bg-zinc-950/60 border border-white/5 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-[0_0_50px_-12px_rgba(251,191,36,0.15)] overflow-hidden text-center flex flex-col items-center">
        
        {/* Top Gold/Amber Gradient Border Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
        
        {/* Animated Trophy/Ball SVG Logo Wrapper */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-400/20 to-orange-500/10 flex items-center justify-center border border-amber-500/30 mb-8 relative group">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-md animate-ping" style={{ animationDuration: '3s' }}></div>
          
          {/* Trophy SVG */}
          <svg className="w-12 h-12 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ animationDuration: '3s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Maintenance Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Scheduled Maintenance
        </div>

        {/* Dynamic Titles */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 uppercase">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 block">
            System Update
          </span>
          <span className="text-zinc-400 text-sm md:text-base font-medium normal-case tracking-normal block mt-1">
            Undergoing Scheduled Maintenance
          </span>
        </h1>

        {/* Description */}
        <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8 max-w-md">
          We are upgrading our systems to improve Golden Goal and roll out exciting new features. We will be back online shortly!
        </p>

        {/* Safety Banner */}
        <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mb-8 text-left flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-zinc-200 text-xs font-bold uppercase tracking-wider mb-0.5">On-Chain Protection</h4>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              All staked tokens and user history are safely stored on the Solana blockchain and remain completely unaffected.
            </p>
          </div>
        </div>

        {/* Community Links */}
        <div className="w-full flex flex-col gap-3">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Follow Our Updates</span>
          
          <div className="grid grid-cols-2 gap-3">
            <a 
              href="https://x.com/goldengoalsol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/20 text-zinc-300 hover:text-white px-4 py-3 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Twitter (X)</span>
            </a>
            
            <a 
              href="https://t.me/goldengoalsol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-sky-500/20 text-zinc-300 hover:text-white px-4 py-3 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 4-.1.74-1.72 13.97-5.12.9-.24 1.53-.16 1.76-.04.24.12.3.36.26.69z"/>
              </svg>
              <span>Telegram</span>
            </a>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-zinc-600 text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 select-none">
        <span>© 2026 Golden Goal</span>
        <span>•</span>
        <span>Built on Solana</span>
      </div>

    </div>
  );
}
