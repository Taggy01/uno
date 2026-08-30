import React from 'react';

const COLOR_MAP = {
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-rose-700',
    border: 'border-red-400',
    pill: 'bg-white/95 text-red-600',
    accent: '#ef4444',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-700',
    border: 'border-blue-400',
    pill: 'bg-white/95 text-blue-600',
    accent: '#3b82f6',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-green-700',
    border: 'border-emerald-400',
    pill: 'bg-white/95 text-emerald-600',
    accent: '#22c55e',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-400 to-yellow-600',
    border: 'border-yellow-300',
    pill: 'bg-white/95 text-amber-700',
    accent: '#eab308',
  },
  wild: {
    bg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-black',
    border: 'border-neutral-700',
    pill: 'bg-white/95 text-neutral-900',
    accent: '#a855f7',
  },
};

export default function UnoCard({
  card,
  size = 'md', // 'sm' | 'md' | 'lg'
  isPlayable = false,
  onClick,
  isFaceDown = false,
  selected = false,
  className = '',
}) {
  if (isFaceDown) {
    const sizeClasses =
      size === 'sm'
        ? 'w-12 h-18 text-xs'
        : size === 'lg'
        ? 'w-28 h-40 text-base'
        : 'w-20 h-28 text-sm';

    return (
      <div
        onClick={onClick}
        className={`relative ${sizeClasses} rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 border-2 border-neutral-700/80 shadow-lg flex items-center justify-center select-none overflow-hidden transition-transform duration-200 ${
          onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''
        } ${className}`}
      >
        <div className="absolute inset-1 rounded-xl border border-neutral-700/50 flex items-center justify-center">
          <div className="w-10 h-14 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-blue-500 rotate-45 flex items-center justify-center shadow-inner opacity-90">
            <span className="font-extrabold text-white text-xs -rotate-45 tracking-widest drop-shadow-md">
              UNO
            </span>
          </div>
        </div>
      </div>
    );
  }

  const cardColor = card?.color || 'wild';
  const cardValue = card?.value || '0';
  const theme = COLOR_MAP[cardColor] || COLOR_MAP.wild;

  const sizeClasses =
    size === 'sm'
      ? 'w-14 h-20 text-xs'
      : size === 'lg'
      ? 'w-28 h-40 text-base'
      : 'w-22 h-32 text-sm';

  const renderValue = (val) => {
    switch (val) {
      case 'skip':
        return (
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
          </svg>
        );
      case 'reverse':
        return (
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        );
      case 'draw2':
        return '+2';
      case 'wild4':
        return '+4';
      case 'wild':
        return (
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 rounded-full overflow-hidden border border-neutral-300">
            <div className="bg-red-500" />
            <div className="bg-blue-500" />
            <div className="bg-yellow-400" />
            <div className="bg-green-500" />
          </div>
        );
      default:
        return val;
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
    <div
      onClick={isPlayable || onClick ? onClick : undefined}
      className={`relative ${sizeClasses} rounded-2xl ${theme.bg} border-2 ${
        theme.border
      } shadow-md flex flex-col justify-between p-1.5 select-none transition-all duration-200 ${
        isPlayable
          ? 'cursor-pointer hover:-translate-y-3 hover:scale-108 hover:shadow-2xl hover:ring-3 hover:ring-white/80 active:scale-95'
          : ''
      } ${selected ? 'ring-4 ring-amber-400 -translate-y-3 shadow-2xl' : ''} ${
        !isPlayable && onClick ? 'opacity-85' : ''
      } ${className}`}
      style={{
        boxShadow: isPlayable
          ? `0 10px 25px -5px ${theme.accent}66, 0 8px 10px -6px ${theme.accent}66`
          : undefined,
      }}
    >
      {/* Top Left Corner */}
      <div className="flex items-center justify-start text-[11px] font-black text-white drop-shadow leading-none pl-0.5">
        {cornerValue(cardValue)}
      </div>

      {/* Center Oval / Badge */}
      <div className="relative flex-1 my-0.5 flex items-center justify-center">
        <div
          className={`w-full h-full rounded-full ${theme.pill} -rotate-15 flex items-center justify-center shadow-inner font-extrabold text-2xl tracking-tighter`}
        >
          <div className="rotate-15 flex items-center justify-center">
            {renderValue(cardValue)}
          </div>
        </div>
      </div>

      {/* Bottom Right Corner */}
      <div className="flex items-center justify-end text-[11px] font-black text-white drop-shadow leading-none pr-0.5 rotate-180">
        {cornerValue(cardValue)}
      </div>

      {/* Playable Aura indicator badge */}
      {isPlayable && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
        </span>
      )}
    </div>
  );
}
