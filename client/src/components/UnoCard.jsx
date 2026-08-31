import React from 'react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  red: {
    bg: 'bg-gradient-to-br from-red-500 via-rose-600 to-red-800',
    border: 'border-red-300/80',
    innerGlow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]',
    pill: 'bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-rose-600 shadow-lg',
    accent: '#f43f5e',
    cornerText: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-800',
    border: 'border-blue-300/80',
    innerGlow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]',
    pill: 'bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-blue-600 shadow-lg',
    accent: '#3b82f6',
    cornerText: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800',
    border: 'border-emerald-300/80',
    innerGlow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]',
    pill: 'bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-emerald-600 shadow-lg',
    accent: '#10b981',
    cornerText: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600',
    border: 'border-yellow-200/90',
    innerGlow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]',
    pill: 'bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-amber-600 shadow-lg',
    accent: '#eab308',
    cornerText: 'text-neutral-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]',
  },
  wild: {
    bg: 'bg-gradient-to-br from-neutral-900 via-neutral-850 to-black',
    border: 'border-neutral-600',
    innerGlow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]',
    pill: 'bg-neutral-950 text-white shadow-xl',
    accent: '#ec4899',
    cornerText: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
  },
};

export default function UnoCard({
  card,
  size = 'md', // 'sm' | 'md' | 'lg'
  isPlayable = false,
  onClick,
  isFaceDown = false,
  selected = false,
  tilt = 0,
  className = '',
}) {
  const sizeClasses =
    size === 'sm'
      ? 'w-14 h-20 text-xs'
      : size === 'lg'
      ? 'w-28 h-40 text-base'
      : 'w-22 h-32 text-sm';

  // Face down design with metallic UNO logo
  if (isFaceDown) {
    return (
      <motion.div
        whileHover={onClick ? { scale: 1.06, translateY: -4 } : {}}
        whileTap={onClick ? { scale: 0.96 } : {}}
        onClick={onClick}
        className={`relative ${sizeClasses} rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 border-2 border-neutral-700 shadow-2xl flex items-center justify-center select-none overflow-hidden ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      >
        {/* Carbon texture layer */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Outer Ring Inset */}
        <div className="absolute inset-1.5 rounded-xl border border-neutral-700/60 flex items-center justify-center">
          {/* Diagonal Uno Emblem */}
          <div className="w-12 h-16 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-blue-600 rotate-45 flex items-center justify-center shadow-lg border border-white/20">
            <span className="font-black text-white text-xs -rotate-45 tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic">
              UNO
            </span>
          </div>
        </div>

        {/* Glossy Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </motion.div>
    );
  }

  const cardColor = card?.color || 'wild';
  const cardValue = card?.value || '0';
  const theme = COLOR_MAP[cardColor] || COLOR_MAP.wild;
  const isWild = cardColor === 'wild' || cardValue.startsWith('wild');

  const renderCenterValue = (val) => {
    switch (val) {
      case 'skip':
        return (
          <svg className="w-7 h-7 stroke-current stroke-[2.5] fill-none drop-shadow-sm" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
          </svg>
        );
      case 'reverse':
        return (
          <svg className="w-7 h-7 fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        );
      case 'draw2':
        return <span className="text-xl font-black italic tracking-tighter drop-shadow-sm">+2</span>;
      case 'wild4':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 rounded-md overflow-hidden shadow-md border border-white/40 mb-0.5">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-emerald-500" />
            </div>
            <span className="text-xs font-black text-white italic drop-shadow">+4</span>
          </div>
        );
      case 'wild':
        return (
          <div className="grid grid-cols-2 gap-0.5 w-7 h-7 rounded-full overflow-hidden shadow-inner border-2 border-white/60">
            <div className="bg-red-500" />
            <div className="bg-blue-500" />
            <div className="bg-yellow-400" />
            <div className="bg-emerald-500" />
          </div>
        );
      default:
        return (
          <span className="font-black italic text-2xl tracking-tighter drop-shadow-sm">
            {val}
          </span>
        );
    }
  };

  const cornerValue = (val) => {
    if (val === 'skip') return '⊘';
    if (val === 'reverse') return '⇄';
    if (val === 'draw2') return '+2';
    if (val === 'wild4') return '+4';
    if (val === 'wild') return '★';
    return val;
  };

  return (
    <motion.div
      layout
      whileHover={
        isPlayable
          ? {
              scale: 1.12,
              translateY: -12,
              transition: { type: 'spring', stiffness: 400, damping: 17 },
            }
          : onClick
          ? { scale: 1.04 }
          : {}
      }
      whileTap={isPlayable || onClick ? { scale: 0.95 } : {}}
      onClick={isPlayable || onClick ? onClick : undefined}
      className={`relative ${sizeClasses} rounded-2xl ${theme.bg} border-2 ${
        theme.border
      } ${theme.innerGlow} shadow-xl flex flex-col justify-between p-1.5 select-none overflow-hidden ${
        isPlayable ? 'cursor-pointer ring-2 ring-white/60' : ''
      } ${selected ? 'ring-4 ring-amber-400 -translate-y-3 shadow-2xl' : ''} ${
        !isPlayable && onClick ? 'opacity-80' : ''
      } ${className}`}
      style={{
        boxShadow: isPlayable
          ? `0 14px 28px -4px ${theme.accent}77, 0 8px 12px -4px ${theme.accent}55`
          : undefined,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      {/* Glossy Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Top Left Corner Value */}
      <div className={`flex items-center justify-start text-[11px] font-black leading-none pl-0.5 ${theme.cornerText}`}>
        {cornerValue(cardValue)}
      </div>

      {/* Center Oval / Badge */}
      <div className="relative flex-1 my-0.5 flex items-center justify-center">
        <div
          className={`w-full h-full rounded-full ${theme.pill} -rotate-15 flex items-center justify-center border border-white/40 shadow-md`}
        >
          <div className="rotate-15 flex items-center justify-center font-extrabold">
            {renderCenterValue(cardValue)}
          </div>
        </div>
      </div>

      {/* Bottom Right Inverted Corner Value */}
      <div className={`flex items-center justify-end text-[11px] font-black leading-none pr-0.5 rotate-180 ${theme.cornerText}`}>
        {cornerValue(cardValue)}
      </div>

      {/* Playable Aura Ping indicator */}
      {isPlayable && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
        </span>
      )}
    </motion.div>
  );
}

