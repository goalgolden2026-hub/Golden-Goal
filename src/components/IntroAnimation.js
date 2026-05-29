"use client";

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const BallImage = ({ size = 130, style = {} }) => {
  return (
    <img 
      src="/golden-ball.png" 
      alt="Premium 3D Golden Ball" 
      width={size} 
      height={size} 
      style={{ display: 'block', objectFit: 'contain', ...style }} 
    />
  );
};

export default function IntroAnimation() {
  const [showIntro, setShowIntro] = useState(false);
  const [phase, setPhase]         = useState('idle');
  const containerRef = useRef(null);
  const ballWrapRef  = useRef(null);

  useEffect(() => {
    if (!sessionStorage.getItem('goldenGoalIntroPlayed')) setShowIntro(true);
  }, []);

  const handleShoot = () => {
    if (phase !== 'idle') return;
    const el = ballWrapRef.current;
    if (!el) return;
    console.log('🔥 NEW ANIMATION ACTIVE — Web Animations API');
    setPhase('shooting');

    /* ── Phase 1: Flying to top corner (1.4s) ── */
    const fly = el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'translate(21vw,-44vh) scale(0.54) rotate(1380deg)', opacity: 1 },
    ], { duration: 1400, easing: 'cubic-bezier(0.15,0,0.35,1)', fill: 'forwards' });

    fly.addEventListener('finish', () => {
      setPhase('scored');

      // Screen shake
      containerRef.current?.classList.add('shake-anim');
      setTimeout(() => containerRef.current?.classList.remove('shake-anim'), 650);

      // Confetti
      const colors = ['#FFD700','#FFA500','#FFEC6E','#FFF','#B8860B'];
      confetti({ particleCount:180, spread:110, startVelocity:70, origin:{x:.5,y:.35}, colors, zIndex:10000, ticks:130 });
      const end = Date.now() + 2800;
      const iv = setInterval(() => {
        if (Date.now() >= end) { clearInterval(iv); return; }
        confetti({ particleCount:40, spread:85, startVelocity:46, origin:{x:.35+Math.random()*.3,y:.3+Math.random()*.15}, colors, zIndex:10000, ticks:110 });
      }, 240);

      /* ── Phase 2: Drop to ground (single smooth movement) ── */
      el.animate([
        { transform: 'translate(21vw,-44vh) scale(0.54) rotate(1380deg)' },
        { transform: 'translate(8vw,-22vh) scale(0.46) rotate(1540deg)' },
      ], { duration: 750, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });

      setTimeout(() => {
        setPhase('fading');
        setTimeout(() => {
          setShowIntro(false);
          sessionStorage.setItem('goldenGoalIntroPlayed', 'true');
        }, 700);
      }, 3500);
    });
  };

  if (!showIntro) return null;
  const isIdle = phase === 'idle', isFading = phase === 'fading';

  return (
    <div ref={containerRef} className={`fixed inset-0 z-[9999] overflow-hidden select-none transition-opacity duration-700 ${isFading?'opacity-0':'opacity-100'}`}>
      <style>{`
        @keyframes ballFloat {
          0%,100% { transform:translateY(0) scale(1); filter:drop-shadow(0 0 16px rgba(255,200,0,.65)) drop-shadow(0 0 28px rgba(255,150,0,.25)); }
          50%     { transform:translateY(-18px) scale(1.04); filter:drop-shadow(0 0 28px rgba(255,220,0,.9)) drop-shadow(0 0 50px rgba(255,150,0,.35)); }
        }
        @keyframes popIn {
          0%  { transform:scale(.3) translateY(30px); opacity:0; filter:blur(14px); }
          65% { transform:scale(1.1) translateY(-4px); opacity:1; filter:blur(0); }
          100%{ transform:scale(1); opacity:1; }
        }
        @keyframes shakeKF {
          0%,100%{transform:translate(0,0);}
          15%{transform:translate(-7px,-6px);} 30%{transform:translate(7px,6px);}
          45%{transform:translate(-5px,5px);} 60%{transform:translate(5px,-5px);}
          75%{transform:translate(-3px,3px);}
        }
        @keyframes explodeRing {
          0%  {transform:translate(-50%,-50%) scale(0);opacity:1;}
          55% {opacity:.75;}
          100%{transform:translate(-50%,-50%) scale(5);opacity:0;}
        }
        @keyframes tapB{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes tapF{0%,100%{opacity:1}50%{opacity:.5}}
        .ball-idle  { animation:ballFloat 2.8s ease-in-out infinite; }
        .text-pop   { animation:popIn .8s cubic-bezier(.175,.885,.32,1.275) forwards; }
        .shake-anim { animation:shakeKF .6s ease both; }
        .tap-b      { animation:tapB 1.2s ease-in-out infinite; }
        .tap-f      { animation:tapF 1.6s ease-in-out infinite; }
      `}</style>

      {/* Stadium */}
      <div className="absolute inset-0 w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stadium-bg.png" alt="stadium" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.7) 0%,rgba(0,0,0,.1) 40%,transparent 100%)'}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.55) 100%)'}}/>
        {/* Hide penalty spot white line */}
        <div style={{position:'absolute',bottom:'0%',left:'50%',transform:'translateX(-50%)',width:'22%',height:'18%',
          background:'radial-gradient(ellipse at center bottom,rgba(0,0,0,.72) 0%,rgba(0,0,0,.45) 45%,transparent 75%)',
          pointerEvents:'none'}}/>
      </div>

      {/* Goal explosion */}
      {phase==='scored' && (
        <div style={{position:'absolute',top:'38%',left:'50%',width:340,height:340,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(255,215,0,.85) 30%,rgba(255,140,0,.4) 65%,transparent 80%)',
          mixBlendMode:'screen',zIndex:70,pointerEvents:'none',animation:'explodeRing 1.2s ease-out forwards'}}/>
      )}

      {/* Ball */}
      <div
        style={{
          position:'absolute', bottom:'4%', left:'50%', transform:'translateX(-50%)', zIndex: phase === 'scored' ? 2 : 50,
          display:'flex', flexDirection:'column', alignItems:'center',
          cursor: phase === 'idle' ? 'pointer' : 'default',
        }}
        onClick={handleShoot}
      >
        <div ref={ballWrapRef} className={isIdle?'ball-idle':''} style={{display:'inline-block'}}>
          <BallImage size={130}/>
        </div>

        {isIdle && (
          <div className="tap-f" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginTop:12,pointerEvents:'none'}}>
            <svg className="tap-b" viewBox="0 0 36 36" width={34} height={34} fill="none">
              <circle cx="18" cy="18" r="16" stroke="#FFD700" strokeWidth="1.8" opacity=".6"/>
              <path d="M18 10v16M11 20l7 7 7-7" stroke="#FFD700" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{color:'#FFD700',fontWeight:800,fontSize:14,letterSpacing:'.28em',textTransform:'uppercase',
              textShadow:'0 0 14px rgba(255,215,0,1),0 0 36px rgba(255,165,0,.8)'}}>
              CLICK TO SHOOT
            </span>
          </div>
        )}
      </div>

      {/* GOAL text */}
      {phase==='scored' && (
        <div className="text-pop" style={{position:'absolute',top:'20%',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',zIndex:80,pointerEvents:'none'}}>
          <h1 style={{fontFamily:"'Impact','Arial Black',sans-serif",fontSize:'clamp(72px,13vw,158px)',fontWeight:900,fontStyle:'italic',lineHeight:1,
            background:'linear-gradient(180deg,#FFF 0%,#FFD700 38%,#FF8C00 100%)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
            filter:'drop-shadow(0 0 45px rgba(255,215,0,.95))'}}>GOOOL!</h1>
          <p style={{color:'#fff',fontWeight:700,fontSize:'clamp(16px,2.8vw,30px)',letterSpacing:'.42em',textTransform:'uppercase',marginTop:18,
            textShadow:'0 0 24px rgba(255,215,0,.9)',opacity:.96}}>✦ GOLDEN GOAL ✦</p>
        </div>
      )}
    </div>
  );
}
