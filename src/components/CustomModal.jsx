"use client";

import React, { useEffect } from 'react';

export default function CustomModal({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    type = 'confirm', // 'confirm', 'alert', 'warning', 'success', 'danger'
    onConfirm, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel' 
}) {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine color theme based on type
    const getTheme = () => {
        switch (type) {
            case 'danger':
            case 'error':
                return {
                    border: 'border-red-500/30',
                    text: 'text-red-400',
                    gradient: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
                    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
                    icon: (
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-2xl animate-bounce">
                            ⚠️
                        </div>
                    )
                };
            case 'warning':
                return {
                    border: 'border-amber-500/30',
                    text: 'text-amber-400',
                    gradient: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
                    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
                    icon: (
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl animate-pulse">
                            ⚠️
                        </div>
                    )
                };
            case 'success':
                return {
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-400',
                    gradient: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
                    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
                    icon: (
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                            🏆
                        </div>
                    )
                };
            default: // confirm & alert
                return {
                    border: 'border-yellow-500/30',
                    text: 'text-yellow-400',
                    gradient: 'from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
                    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
                    icon: (
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-2xl">
                            ⚽
                        </div>
                    )
                };
        }
    };

    const theme = getTheme();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div 
                className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div 
                className={`relative w-full max-w-md bg-zinc-950/95 border ${theme.border} rounded-3xl p-6 ${theme.glow} transition-all duration-300 animate-in scale-in duration-300 overflow-hidden relative`}
            >
                {/* Gold Highlight Line at Top */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>

                {/* Modal Header */}
                <div className="flex flex-col items-center text-center gap-4 mb-5">
                    {theme.icon}
                    <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                        {title}
                    </h3>
                </div>

                {/* Modal Body */}
                <div className="text-center mb-6">
                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                {/* Modal Footer / Buttons */}
                <div className="flex items-center gap-3">
                    {/* Cancel Button (only for confirm/danger/warning/success types that support confirm callback) */}
                    {(type === 'confirm' || type === 'danger' || type === 'warning') && onConfirm && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/10 transition-all text-sm active:scale-95"
                        >
                            {cancelText}
                        </button>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={() => {
                            if (onConfirm) {
                                onConfirm();
                            }
                            onClose();
                        }}
                        className={`py-3 px-4 rounded-xl font-bold text-zinc-950 bg-gradient-to-r ${theme.gradient} transition-all duration-300 shadow-md text-sm active:scale-95 ${
                            (type === 'confirm' || type === 'danger' || type === 'warning') && onConfirm ? 'flex-1' : 'w-full'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
