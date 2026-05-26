"use client";

import React, { useState, useEffect, useRef } from 'react';

const PLAYLIST = [
    {
        year: '1998',
        title: 'La Copa de la Vida',
        artist: 'Ricky Martin',
        edition: "France '98 🇫🇷",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
        year: '2002',
        title: 'Anthem (Official Theme)',
        artist: 'Vangelis',
        edition: "Korea/Japan '02 🇰🇷🇯🇵",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    {
        year: '2006',
        title: 'The Time of Our Lives',
        artist: 'Il Divo & Toni Braxton',
        edition: "Germany '06 🇩🇪",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    },
    {
        year: '2010',
        title: 'Waka Waka (This Time for Africa)',
        artist: 'Shakira',
        edition: "South Africa '10 🇿🇦",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
    },
    {
        year: '2014',
        title: 'We Are One (Ole Ola)',
        artist: 'Pitbull & Jennifer Lopez',
        edition: "Brazil '14 🇧🇷",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
    },
    {
        year: '2018',
        title: 'Live It Up',
        artist: 'Nicky Jam ft. Will Smith',
        edition: "Russia '18 🇷🇺",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
    },
    {
        year: '2022',
        title: 'Dreamers',
        artist: 'Jungkook (BTS)',
        edition: "Qatar '22 🇶🇦",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
    },
    {
        year: '2026',
        title: 'Dai Dai (Official Theme)',
        artist: 'Shakira & Burna Boy',
        edition: "North America '26 🇺🇸🇨🇦🇲🇽",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
    }
];

export default function WorldCupMusicPlayer({ isMobile = false }) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(3); // Start with Waka Waka (2010) as default iconic track
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    const audioRef = useRef(null);

    const activeTrack = PLAYLIST[currentTrackIndex];

    // Handle initialization & Autoplay
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.35; // Default volume set to a comfortable level (35%)
            
            // Try playing on mount (Autoplay)
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        setAutoplayBlocked(false);
                    })
                    .catch((error) => {
                        console.log("Autoplay blocked by browser. Awaiting user interaction.", error);
                        setAutoplayBlocked(true);
                        setIsPlaying(false);
                    });
            }
        }
    }, [currentTrackIndex]);

    // Handle Play / Pause trigger
    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setAutoplayBlocked(false);
                })
                .catch((error) => {
                    console.error("Failed to play audio:", error);
                });
        }
    };

    // Skip to next track
    const nextTrack = () => {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % PLAYLIST.length);
        setIsPlaying(true);
    };

    // Skip to previous track
    const prevTrack = () => {
        setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + PLAYLIST.length) % PLAYLIST.length);
        setIsPlaying(true);
    };

    // Toggle mute
    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    // Audio element track end trigger
    const handleTrackEnded = () => {
        nextTrack();
    };

    // Mobile layout structure
    if (isMobile) {
        return (
            <div className="flex flex-col gap-4 w-full p-4 bg-zinc-950/60 border border-white/5 rounded-2xl relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                {/* Embedded HTML5 Audio Tag */}
                <audio 
                    ref={audioRef}
                    src={activeTrack.url}
                    onEnded={handleTrackEnded}
                    autoPlay
                />

                {/* Glow behind player */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>

                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isPlaying ? '' : 'hidden'}`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isPlaying ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
                        </span>
                        WC Radio 📻
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                        {activeTrack.edition}
                    </span>
                </div>

                {/* Track Details & Visualizer */}
                <div className="flex items-center gap-3 mt-1">
                    {/* Rotating Golden Vinyl Disk */}
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-full border-2 border-black bg-zinc-950 flex items-center justify-center shadow-lg shadow-black/50 overflow-hidden">
                        <div className={`w-full h-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-500 absolute transition-transform duration-1000 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}></div>
                        <div className="w-5.5 h-5.5 rounded-full bg-black border border-black/40 z-10 flex items-center justify-center shadow-inner shadow-black">
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        </div>
                        {/* Radial grooves */}
                        <div className="absolute inset-1 rounded-full border border-black/15 pointer-events-none"></div>
                        <div className="absolute inset-2.5 rounded-full border border-black/15 pointer-events-none"></div>
                        <div className="absolute inset-4 rounded-full border border-black/15 pointer-events-none"></div>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate drop-shadow-md">{activeTrack.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{activeTrack.artist} ({activeTrack.year})</p>
                    </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-between gap-4 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    {/* Autoplay Block Warning Button */}
                    {autoplayBlocked && (
                        <button 
                            onClick={togglePlay}
                            className="text-[9px] font-black text-yellow-500 animate-pulse uppercase tracking-wider flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20"
                        >
                            <span>▶ Click to Start</span>
                        </button>
                    )}

                    <div className="flex items-center gap-4 mx-auto">
                        <button 
                            onClick={prevTrack}
                            className="text-zinc-400 hover:text-white transition-all transform active:scale-90"
                            aria-label="Previous Track"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.445 14.83a1 1 0 001.555-.832V10l5.045 4.022a1 1 0 001.555-.832V6.81a1 1 0 00-1.555-.832L10 10V6.81a1 1 0 00-1.555-.832L3.4 10l5.045 4.83z" />
                            </svg>
                        </button>

                        <button 
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <svg className="w-4 h-4 fill-zinc-950" viewBox="0 0 24 24">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 fill-zinc-950 ml-0.5" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <button 
                            onClick={nextTrack}
                            className="text-zinc-400 hover:text-white transition-all transform active:scale-90"
                            aria-label="Next Track"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11.555 14.83a1 1 0 01-1.555-.832V10L4.955 14.022A1 1 0 013.4 13.19V6.81a1 1 0 011.555-.832L10 10V6.81a1 1 0 011.555-.832L16.6 10l-5.045 4.83z" />
                            </svg>
                        </button>
                    </div>

                    {/* Mute toggle button */}
                    <button 
                        onClick={toggleMute}
                        className={`text-zinc-400 hover:text-white transition-colors p-1 ${isMuted ? 'text-red-500/80 hover:text-red-400' : ''}`}
                        aria-label="Toggle Mute"
                    >
                        {isMuted ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Desktop layout structure (Ultra premium, slim and beautiful)
    return (
        <div 
            className="flex items-center gap-3 bg-zinc-950/60 hover:bg-zinc-900/60 border border-white/5 rounded-full pl-3 pr-4 py-1.5 transition-all duration-300 relative group max-w-[270px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Embedded HTML5 Audio Tag */}
            <audio 
                ref={audioRef}
                src={activeTrack.url}
                onEnded={handleTrackEnded}
                autoPlay
            />

            {/* Glowing Border Line */}
            <div className="absolute inset-0 rounded-full border border-yellow-500/10 pointer-events-none group-hover:border-yellow-500/30 transition-all duration-500"></div>

            {/* Rotating Golden Vinyl Disk */}
            <div className="relative flex-shrink-0 w-8 h-8 rounded-full border border-black bg-zinc-950 flex items-center justify-center shadow-lg shadow-black/60 overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-500 absolute transition-transform duration-1000 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}></div>
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-black/40 z-10 flex items-center justify-center shadow-inner shadow-black">
                    <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
                {/* Grooves */}
                <div className="absolute inset-0.5 rounded-full border border-black/15 pointer-events-none"></div>
                <div className="absolute inset-1 rounded-full border border-black/15 pointer-events-none"></div>
                <div className="absolute inset-1.5 rounded-full border border-black/10 pointer-events-none"></div>
            </div>

            {/* Text Marquee / Meta Details */}
            <div className="flex flex-col min-w-0 w-24">
                <div className="relative overflow-hidden h-4">
                    {/* We use a simple horizontal animation or simple title presentation */}
                    <div className="text-[11px] font-black text-white truncate uppercase tracking-tight group-hover:text-yellow-400 transition-colors">
                        {activeTrack.title}
                    </div>
                </div>
                <div className="text-[9px] font-bold text-zinc-500 truncate flex items-center gap-1">
                    <span>{activeTrack.year}</span>
                    <span>•</span>
                    <span className="text-zinc-400 truncate">{activeTrack.artist}</span>
                </div>
            </div>

            {/* Micro Controls */}
            <div className="flex items-center gap-2.5 border-l border-white/10 pl-2">
                {/* Play/Pause Button */}
                <button 
                    onClick={togglePlay}
                    className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all transform p-0.5"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Skip Next Button */}
                <button 
                    onClick={nextTrack}
                    className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all transform p-0.5"
                    aria-label="Next Track"
                >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M11.555 14.83a1 1 0 01-1.555-.832V10L4.955 14.022A1 1 0 013.4 13.19V6.81a1 1 0 011.555-.832L10 10V6.81a1 1 0 011.555-.832L16.6 10l-5.045 4.83z" />
                    </svg>
                </button>

                {/* Volume/Mute Button */}
                <button 
                    onClick={toggleMute}
                    className={`text-zinc-500 hover:text-white transition-colors p-0.5 ${isMuted ? 'text-red-500 hover:text-red-400 animate-pulse' : ''}`}
                    aria-label="Toggle Mute"
                >
                    {isMuted ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Autoplay blocked dynamic warning badge */}
            {autoplayBlocked && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-zinc-950 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded shadow-lg pointer-events-none animate-bounce whitespace-nowrap z-50 border border-yellow-400">
                    ⚠️ Click to Start Radio
                </div>
            )}

            {/* Hover Tooltip showing full edition and info */}
            {showTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-zinc-950/95 border border-white/10 p-2.5 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md pointer-events-none transition-all duration-300 z-50 text-left">
                    <div className="text-[9px] font-black text-yellow-500 tracking-wider uppercase mb-1">
                        🏆 World Cup Anthem
                    </div>
                    <div className="text-xs font-bold text-white leading-tight mb-0.5">
                        {activeTrack.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 mb-1.5">
                        {activeTrack.artist}
                    </div>
                    <div className="border-t border-white/5 pt-1.5 flex items-center justify-between text-[9px] text-zinc-500">
                        <span>Edition:</span>
                        <span className="font-bold text-zinc-300">{activeTrack.edition}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
