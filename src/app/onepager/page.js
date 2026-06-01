"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const SLIDES = [
  { id: 1, title: "Cover Page", src: "/Page1.png" },
  { id: 2, title: "Executive Summary", src: "/Page2.png" },
  { id: 3, title: "Ecosystem Game Loop", src: "/page3.png" },
  { id: 4, title: "Match Engine & Dashboard", src: "/page4.png" },
  { id: 5, title: "Staking Tiers", src: "/Page5.png" },
  { id: 6, title: "Leaderboard Rankings", src: "/Page6.png" },
  { id: 7, title: "Tokenomics & Safety", src: "/Page7.png" }
];

export default function OnePagerPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  const nextSlide = () => {
    setActiveSlide(prev => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  // Keyboard arrow keys navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-between relative overflow-hidden font-sans print:bg-white print:text-black">
      
      {/* Background Cinematic Spotlight & Gradients */}
      <div className="absolute top-[-10%] left-[20%] w-[900px] h-[900px] rounded-full bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent blur-[250px] pointer-events-none -z-10 print:hidden"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-[900px] h-[900px] rounded-full bg-gradient-to-bl from-purple-500/5 via-fuchsia-500/3 to-transparent blur-[250px] pointer-events-none -z-10 print:hidden"></div>

      {/* Styled A4 print layouts for high-fidelity borderless PDF exporting */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
          font-family: 'Outfit', sans-serif;
        }
        
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-slide-container {
            display: block !important;
            page-break-after: always !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .print-slide-container:last-child {
            page-break-after: avoid !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}} />

      {/* Floating Action Header Bar - Hidden in Print */}
      <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between z-40 print:hidden shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/25 blur-md rounded-full group-hover:bg-amber-500/45 transition-all"></div>
            <img src="/logo.jpg" alt="Golden Goal Logo" className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/40 relative z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">GOLDEN GOAL</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black border border-amber-500/20 select-none">GAMEPAPER</span>
            </div>
            <span className="text-[8px] text-zinc-500 font-extrabold tracking-widest uppercase">Premium Pitch Deck</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4.5 py-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-black rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-[1.03] active:scale-[0.98] transition-all text-[11px] tracking-wider uppercase flex items-center gap-2 border border-yellow-400/20 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>PDF / Print</span>
          </button>
          
          <Link
            href="/"
            className="px-3.5 py-2 bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/40 text-zinc-400 hover:text-white font-bold rounded-xl text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Slides Content Section */}
      <main className="w-full max-w-6xl mx-auto px-6 py-2 flex-1 flex items-center justify-center relative z-20 print:block print:max-w-none print:px-0">
        
        {SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`w-full transition-all duration-500 flex flex-col items-center justify-center print-slide-container ${
              activeSlide === idx 
                ? 'block opacity-100 scale-100' 
                : 'hidden opacity-0 scale-95 print:block'
            }`}
          >
            {/* Slide Frame container with significantly increased max-w for larger image scaling */}
            <div className="relative border border-zinc-800 bg-zinc-950/65 backdrop-blur-md p-2 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.12)] hover:shadow-[0_0_60px_rgba(245,158,11,0.22)] transition-all duration-300 print:p-0 print:border-none print:bg-transparent print:shadow-none max-w-5xl w-full">
              
              {/* Header Slogan Inside Frame */}
              <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-900 print:hidden text-[10px] font-bold text-zinc-500 font-mono tracking-wider uppercase">
                <span>Page {slide.id}: {slide.title}</span>
                <span className="text-amber-500">GOLDEN GOAL</span>
              </div>

              {/* Responsive containment of full-page images */}
              <div className="w-full relative flex items-center justify-center p-1 md:p-3 overflow-hidden select-none print:p-0">
                <img 
                  src={slide.src} 
                  alt={slide.title} 
                  className="max-h-[75vh] sm:max-h-[80vh] w-auto h-auto object-contain rounded-lg border border-zinc-900 shadow-inner hover:scale-[1.01] transition-transform duration-500 print:rounded-none print:border-none print:max-h-none print:w-full print:h-auto print-img" 
                />
              </div>

            </div>
          </div>
        ))}

      </main>

      {/* Slide Navigation Foot Controller - Hidden in Print */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between z-40 print:hidden shrink-0">
        
        {/* Left/Right Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            className="w-9 h-9 bg-zinc-950/60 border border-zinc-800 hover:border-amber-500/40 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-sm font-bold text-zinc-400 hover:text-white"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            className="w-9 h-9 bg-zinc-950/60 border border-zinc-800 hover:border-amber-500/40 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-sm font-bold text-zinc-400 hover:text-white"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>

        {/* Dynamic Slide indicators */}
        <div className="flex gap-2">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === idx 
                  ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-110 w-5.5' 
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Keyboard Help Tip - English only */}
        <span className="text-[9px] font-mono font-bold text-zinc-600 hidden sm:inline select-none uppercase tracking-wider">
          💡 Keyboard: Use Left / Right arrow keys to navigate slides!
        </span>
      </footer>

      {/* Printed legal disclaimer footer - printed at the bottom of every PDF page */}
      <div className="hidden print:block w-full text-center text-[7px] text-zinc-400 mt-6 pt-4 border-t border-zinc-200">
        <span>© 2026 Golden Goal. Not by Chance, but by Skill & Analysis. Built on Solana Blockchain. All Rights Reserved.</span>
      </div>

    </div>
  );
}
