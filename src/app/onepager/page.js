"use client";

import React from 'react';
import Link from 'next/link';

export default function OnePagerPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center relative overflow-x-hidden print:bg-white print:text-zinc-900 print:min-h-0">
      
      {/* Dynamic Background Blur - Hidden in Print */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/10 via-yellow-600/5 to-transparent blur-[120px] pointer-events-none -z-10 print:hidden"></div>

      {/* Floating Action Button Bar - Hidden in Print */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-5 py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-zinc-950 font-black rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-yellow-400/30 text-xs tracking-wider uppercase"
        >
          <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>PDF / Yazdır</span>
        </button>
        
        <Link
          href="/"
          className="px-4 py-3 bg-zinc-900/90 border border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/[0.04] text-zinc-300 hover:text-white font-bold rounded-full shadow-lg backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 text-xs flex items-center gap-1.5"
        >
          <span>Ana Sayfa</span>
        </Link>
      </div>

      {/* One-Pager Container - Sized to exactly A4 in print */}
      <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 flex flex-col justify-between print:p-0 print:max-w-none print:w-full print:mx-0">
        
        {/* Style injection for extreme print precision */}
        <style>{`
          @media print {
            body {
              background-color: #ffffff !important;
              color: #09090b !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-bg-card {
              background-color: #f4f4f5 !important;
              border: 1px solid #e4e4e7 !important;
              box-shadow: none !important;
              backdrop-filter: none !important;
            }
            .print-border-gold {
              border-color: #d97706 !important;
            }
            .print-text-dark {
              color: #18181b !important;
            }
            .print-text-gold {
              color: #b45309 !important;
            }
            .print-text-muted {
              color: #71717a !important;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 12mm 12mm 12mm;
            }
            .print-pb-0 {
              padding-bottom: 0px !important;
            }
          }
        `}</style>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-6 mb-8 print:border-zinc-200 print:pb-4 print:mb-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row mb-4 md:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full print:hidden"></div>
              <img 
                src="/logo.jpg" 
                alt="Golden Goal Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] print:shadow-none print:border-zinc-300"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white print:text-zinc-950">
                GOLDEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 print:text-amber-600 print:bg-none">GOAL</span>
              </h1>
              <p className="text-xs sm:text-sm text-amber-400 font-bold uppercase tracking-widest print:text-amber-700">
                Solana'nın Risk-Free Futbol Tahmin Piyasası
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 font-mono text-[9px] font-bold">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider print:bg-zinc-100 print:text-zinc-700 print:border-zinc-300">
              Solana Ecosystem
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider print:bg-emerald-50 print:text-emerald-700 print:border-emerald-200 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 print:bg-emerald-600"></span>
              Compliance Verified
            </span>
          </div>
        </div>

        {/* HERO SECTION / THE HOOK */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-8 print-bg-card print:p-5 print:mb-5">
          <h2 className="text-lg font-black tracking-wider text-amber-400 uppercase mb-3 print:text-amber-800">
            📌 Vizyon & Proje Özeti
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed print:text-zinc-800">
            Golden Goal; geleneksel spor tahmin ve bahis platformlarındaki <strong className="text-white print:text-zinc-900">finansal kayıp risklerini tamamen ortadan kaldıran</strong>, Solana altyapılı yenilikçi bir **Beceri ve Analiz Piyasası (Skill-Based Prediction Market)** simülatörüdür. 
            Kullanıcılar platformda tahmin yapmak için sermaye kaybetmek yerine, cüzdanlarında token bulundurur veya kilitler (`Lock`). Böylece taraftar heyecanı ve futbol analitiği, sıfır risk barındıran modern bir Web3 oyunlaştırma ekosisteminde bir araya gelir.
          </p>
        </div>

        {/* PROBLEM & SOLUTION SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:gap-5 print:mb-5">
          {/* PROBLEM CARD */}
          <div className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-5 space-y-3 print:bg-zinc-50 print:border-zinc-200">
            <div className="flex items-center gap-2 text-red-400 print:text-zinc-800">
              <span className="text-xl">💸</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Kritik Sektör Problemleri</h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed print:text-zinc-700 list-disc list-inside">
              <li><strong className="text-zinc-300 print:text-zinc-900">Yüksek Finansal Risk:</strong> Geleneksel tahmin ve bahis siteleri taraftarları sürekli sermaye kaybetme tehlikesiyle karşı karşıya bırakır.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Pasif Fan Tokenları:</strong> Piyasada bulunan taraftar tokenlarının gerçek bir kullanım senaryosu veya güçlü bir deflasyonist mekanizması yoktur.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Geri Beslemesiz Topluluk:</strong> Sosyal paylaşım ve liderlik rekabetinin olmaması, kullanıcıları izole eder.</li>
            </ul>
          </div>

          {/* SOLUTION CARD */}
          <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-5 space-y-3 print:bg-zinc-50 print:border-zinc-200">
            <div className="flex items-center gap-2 text-emerald-400 print:text-zinc-800">
              <span className="text-xl">🛡️</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Golden Goal Çözümleri</h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed print:text-zinc-700 list-disc list-inside">
              <li><strong className="text-zinc-300 print:text-zinc-900">Sıfır Sermaye Kaybı (%0 Risk):</strong> Katılımcılar sermayelerini kaybetmez. Sadece token kilitleyerek günlük ücretsiz tahmin hakkı kazanır.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Derin Token Faydası ($GG):</strong> $GG tokenları kilitlendikçe VIP çarpanları, günlük ekstra tahmin kotaları ve Rewards Box hakları aktifleşir.</li>
              <li><strong className="text-zinc-300 print:text-zinc-900">Veriye Dayalı Liderlik Ligleri:</strong> Pro ve Social olmak üzere çift liderlik tablosuyla en iyi analistler haftalık havuzdan ödüllendirilir.</li>
            </ul>
          </div>
        </div>

        {/* CORE PLATFORM FEATURES */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-8 print-bg-card print:p-5 print:mb-5">
          <h2 className="text-lg font-black tracking-wider text-amber-400 uppercase mb-4 print:text-amber-800">
            ⚡ Temel Ekosistem Bileşenleri
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-xl">🎯</div>
              <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider print:text-zinc-900">1. Football Predictor</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">
                Global liglerdeki maçlar üzerine kurulu beceri tabanlı tahmin modülü. Kullanıcılar futbol birikimlerini konuşturarak tahmin yapar.
              </p>
            </div>
            <div className="space-y-1.5 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5 print:border-zinc-200">
              <div className="text-xl">🔒</div>
              <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider print:text-zinc-900">2. Multi-Tier Locking</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">
                1 günden 30 güne kadar değişen kilit süreleriyle token kilitleyen VIP Locking sistemi. Kilitleme miktarı arttıkça platform ayrıcalıkları katlanır.
              </p>
            </div>
            <div className="space-y-1.5 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5 print:border-zinc-200">
              <div className="text-xl">🎁</div>
              <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider print:text-zinc-900">3. Rewards Box Module</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">
                Günlük ücretsiz veya indirimli açılabilen, içerisinden platform içi ekstra tahmin kotası ve XP kazandıran provably fair ödül havuzları.
              </p>
            </div>
          </div>
        </div>

        {/* STAKING/LOCKING TIERS TABLE */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 mb-8 print-bg-card print:p-5 print:mb-5">
          <h2 className="text-lg font-black tracking-wider text-amber-400 uppercase mb-4 print:text-amber-800">
            📈 VIP Token Kilitleme Kademeleri (Locking Tiers)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-bold print:border-zinc-200 print:text-zinc-800">
                  <th className="py-2.5 px-3">Seviye (Tier)</th>
                  <th className="py-2.5 px-3">Gereksinim</th>
                  <th className="py-2.5 px-3">Günlük Tahmin Kotası</th>
                  <th className="py-2.5 px-3">XP Çarpanı</th>
                  <th className="py-2.5 px-3">Rewards Box Açım Maliyeti</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300 divide-y divide-white/5 print:text-zinc-800 print:divide-zinc-200">
                <tr>
                  <td className="py-2 px-3 font-semibold print:text-zinc-950">Tier 0 (Holder)</td>
                  <td className="py-2 px-3">Cüzdanda Min 10,000 GG</td>
                  <td className="py-2 px-3">Standart Sınır</td>
                  <td className="py-2 px-3">1.0x</td>
                  <td className="py-2 px-3">100 XP</td>
                </tr>
                <tr className="bg-emerald-500/5 print:bg-zinc-100/50">
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Tier 1 (Soft Lock)</td>
                  <td className="py-2 px-3 font-medium">100 GG (1 Gün Kilit)</td>
                  <td className="py-2 px-3">+1 Tahmin Hak / Gün</td>
                  <td className="py-2 px-3">1.0x</td>
                  <td className="py-2 px-3">75 XP (%25 İndirimli)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-blue-400 print:text-blue-800">Tier 2 (Weekly)</td>
                  <td className="py-2 px-3 font-medium">500 GG (7 Gün Kilit)</td>
                  <td className="py-2 px-3">+3 Tahmin Hak / Gün</td>
                  <td className="py-2 px-3">1.0x</td>
                  <td className="py-2 px-3">50 XP (%50 İndirimli)</td>
                </tr>
                <tr className="bg-purple-500/5 print:bg-zinc-100/50">
                  <td className="py-2 px-3 font-semibold text-purple-400 print:text-purple-800">Tier 3 (Fortnight)</td>
                  <td className="py-2 px-3 font-medium">1,000 GG (15 Gün Kilit)</td>
                  <td className="py-2 px-3">+5 Tahmin Hak / Gün</td>
                  <td className="py-2 px-3">1.1x Booster</td>
                  <td className="py-2 px-3">25 XP (%75 İndirimli)</td>
                </tr>
                <tr className="bg-yellow-500/5 print:bg-yellow-50/50">
                  <td className="py-2 px-3 font-semibold text-yellow-400 print:text-amber-800">Tier 4 (Monthly)</td>
                  <td className="py-2 px-3 font-medium">5,000 GG (30 Gün Kilit)</td>
                  <td className="py-2 px-3 font-black">+10 Tahmin Hak / Gün</td>
                  <td className="py-2 px-3 font-black">1.25x Booster ⚡</td>
                  <td className="py-2 px-3 font-black text-yellow-400 print:text-amber-800">Hergün 1 Tane Ücretsiz 🎁</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROADMAP & TECH STACK IN TWO COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 print:gap-5 print:mb-0">
          {/* TECHNOLOGY STACK */}
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-5 print-bg-card">
            <h3 className="text-sm font-black tracking-wider text-amber-400 uppercase mb-3 print:text-amber-800">
              🛠️ Güçlü Altyapı & Güvenlik
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400 print:text-zinc-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">✔</span>
                <span><strong className="text-zinc-200 print:text-zinc-900">Solana Hızı & Maliyeti:</strong> Web3 işlemlerinin neredeyse anında ve sıfıra yakın gas ücretleriyle gerçekleşmesini sağlayan Solana Entegrasyonu.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">✔</span>
                <span><strong className="text-zinc-200 print:text-zinc-900">Kriptografik İmza (`tweetnacl`):</strong> API rotalarında cüzdan taklitlerini tamamen engelleyen matematiksel şifreli güvenlik kapıları.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">✔</span>
                <span><strong className="text-zinc-200 print:text-zinc-900">AWS Cloud Sinerjisi:</strong> Hızlı sayfa açılışları ve kesintisiz API yönetimi sağlayan kurumsal Next.js ve AWS bulut ağları.</span>
              </li>
            </ul>
          </div>

          {/* ROADMAP PLAN */}
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-5 print-bg-card">
            <h3 className="text-sm font-black tracking-wider text-amber-400 uppercase mb-3 print:text-amber-800">
              📅 Gelecek Yol Haritası
            </h3>
            <div className="space-y-3 text-[11px] text-zinc-400 print:text-zinc-700 font-medium">
              <div className="flex items-center justify-between border-b border-white/5 pb-1 print:border-zinc-200">
                <span>Phase 2: Platform Launch & Whitelist Beta</span>
                <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-yellow-50 print:text-yellow-800">Aktif Testte</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1 print:border-zinc-200">
                <span>Phase 3: Football Predictor & Leaderboards</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-blue-50 print:text-blue-800">Çok Yakında</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1 print:border-zinc-200">
                <span>Phase 4: Rewards Box & Multi-Tier Locking</span>
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-purple-50 print:text-purple-800">Geliştiriliyor</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phase 5: Mobile Apps & DAO Governance</span>
                <span className="text-[9px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-full font-bold uppercase print:bg-zinc-100 print:text-zinc-600">Planlandı</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER & CTA */}
        <div className="mt-8 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 print:border-zinc-200 print:text-zinc-600 print:pt-3 print:pb-0">
          <div className="mb-2 sm:mb-0 text-center sm:text-left print:text-left">
            <span>© 2026 Golden Goal. Tüm Hakları Saklıdır.</span>
            <span className="mx-2 hidden sm:inline">•</span>
            <span className="text-zinc-400 print:text-zinc-700">Not by Chance, but by Skill & Analysis.</span>
          </div>
          
          <div className="flex items-center gap-4 text-zinc-400 print:text-zinc-800 font-bold font-mono">
            <span>X.com: @GoldenGoal</span>
            <span>•</span>
            <span>Telegram: t.me/GoldenGoalSol</span>
          </div>
        </div>

      </div>
    </div>
  );
}
