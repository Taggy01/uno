import React from "react";

const COLOR_MAP = {
  red: {
    bg: "bg-gradient-to-br from-red-500 via-rose-600 to-red-800",
    border: "border-red-300/85",
    pill: "bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-rose-600",
    accent: "#f43f5e",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-800",
    border: "border-blue-300/85",
    pill: "bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-blue-600",
    accent: "#3b82f6",
  },
  green: {
    bg: "bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800",
    border: "border-emerald-300/85",
    pill: "bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-emerald-600",
    accent: "#10b981",
  },
  yellow: {
    bg: "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600",
    border: "border-yellow-200/90",
    pill: "bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-amber-600",
    accent: "#eab308",
  },
  wild: {
    bg: "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black",
    border: "border-neutral-600",
    pill: "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-black text-white",
    accent: "#ec4899",
  },
};

export default function UnoCard({
  card,
  size = "md",
  isPlayable = false,
  onClick,
  isFaceDown = false,
  selected = false,
  tilt = 0,
  className = "",
}) {
  /*
   * Sizing tuned for mobile clarity & larger readability:
   * sm: table avatars / history
   * md: player hand & active table card (large & touch-friendly)
   * lg: shuffle animation / victory spotlight
   */
  const sizeClasses = {
    sm: [
      "w-[clamp(2.8rem,11vw,3.75rem)]",
      "h-[clamp(4.1rem,16.5vw,5.4rem)]",
      "rounded-[clamp(0.55rem,2vw,0.8rem)]",
      "text-[clamp(0.6rem,2.2vw,0.75rem)]",
      "p-1",
    ].join(" "),

    md: [
      "w-[clamp(3.8rem,16vw,5.75rem)]",
      "h-[clamp(5.4rem,23vw,8.4rem)]",
      "rounded-[clamp(0.75rem,2.5vw,1.1rem)]",
      "text-[clamp(0.75rem,2.5vw,1rem)]",
      "p-[clamp(0.3rem,1vw,0.45rem)]",
    ].join(" "),

    lg: [
      "w-[clamp(4.8rem,20vw,7.25rem)]",
      "h-[clamp(6.8rem,28vw,10.5rem)]",
      "rounded-[clamp(0.95rem,3vw,1.45rem)]",
      "text-[clamp(0.85rem,2.5vw,1.15rem)]",
      "p-1.5",
    ].join(" "),
  }[size];

  const cardColor = card?.color || "wild";
  const cardValue = card?.value || "0";
  const theme = COLOR_MAP[cardColor] || COLOR_MAP.wild;

  const renderCenterContent = (value) => {
    switch (value) {
      case "skip":
        return (
          <svg
            className="w-[clamp(1.5rem,8vw,2.1rem)] h-[clamp(1.5rem,8vw,2.1rem)] stroke-current stroke-[2.8] fill-none"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
          </svg>
        );

      case "reverse":
        return (
          <svg
            className="w-[clamp(1.5rem,8vw,2.1rem)] h-[clamp(1.5rem,8vw,2.1rem)] fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        );

      case "draw2":
        return (
          <span className="font-black italic tracking-tighter text-[clamp(1.35rem,8vw,2rem)] select-none">
            +2
          </span>
        );

      case "wild4":
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5 w-[clamp(1.4rem,7.5vw,1.9rem)] h-[clamp(1.4rem,7.5vw,1.9rem)] rounded-md overflow-hidden border border-white/60 shadow-md">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-emerald-500" />
            </div>
            <span className="text-[clamp(0.6rem,2.8vw,0.75rem)] font-black text-white italic mt-0.5">
              +4
            </span>
          </div>
        );

      case "wild":
        return (
          <div className="grid grid-cols-2 w-[clamp(1.6rem,8.5vw,2.2rem)] h-[clamp(1.6rem,8.5vw,2.2rem)] rounded-full overflow-hidden border-2 border-white/80 shadow-md">
            <div className="bg-red-500" />
            <div className="bg-blue-500" />
            <div className="bg-yellow-400" />
            <div className="bg-emerald-500" />
          </div>
        );

      default:
        return (
          <span className="font-black italic tracking-tighter text-[clamp(1.4rem,8.5vw,2.2rem)] select-none drop-shadow-sm">
            {value}
          </span>
        );
    }
  };

  const cornerValue = (value) => {
    if (value === "skip") return "⊘";
    if (value === "reverse") return "⇄";
    if (value === "draw2") return "+2";
    if (value === "wild4") return "+4";
    if (value === "wild") return "★";
    return value;
  };

  /*
   * FACE DOWN (DRAW DECK / CARD BACK)
   */
  if (isFaceDown) {
    return (
      <div
        onClick={onClick}
        style={{ transform: `rotate(${tilt}deg) translateZ(0)` }}
        className={`
          relative
          ${sizeClasses}
          bg-gradient-to-br from-neutral-900 via-neutral-800 to-black
          border-2 border-neutral-700
          shadow-xl
          flex items-center justify-center
          select-none
          overflow-hidden
          will-change-transform
          ${onClick ? "cursor-pointer hover:-translate-y-1.5 hover:scale-105 active:scale-95 transition-all duration-200 ease-out hover:shadow-2xl" : ""}
          ${className}
        `}
      >
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:5px_5px]" />
        <div className="absolute inset-[5%] rounded-[inherit] border border-neutral-700/70" />

        <div className="
          relative
          w-[52%]
          h-[72%]
          rounded-full
          bg-gradient-to-tr
          from-red-600
          via-amber-400
          to-blue-600
          flex
          items-center
          justify-center
          border
          border-white/30
          shadow-lg
          -rotate-12
        ">
          <span className="font-black italic text-white text-[clamp(0.65rem,2.5vw,0.9rem)] tracking-widest drop-shadow-lg">
            UNO
          </span>
        </div>
      </div>
    );
  }

  /*
   * NORMAL PLAY CARD
   */
  return (
    <div
      onClick={isPlayable || onClick ? onClick : undefined}
      style={{
        transform: `rotate(${tilt}deg) translateZ(0)`,
        boxShadow: selected
          ? "0 10px 26px rgba(251,191,36,0.4)"
          : isPlayable
            ? `0 8px 24px ${theme.accent}65`
            : "0 4px 14px rgba(0,0,0,0.35)",
      }}
      className={`
        relative
        uno-card
        ${sizeClasses}
        ${theme.bg}
        border-2
        ${theme.border}
        flex
        flex-col
        justify-between
        select-none
        overflow-hidden
        opacity-100
        will-change-transform
        ${isPlayable ? "cursor-pointer ring-2 ring-white/90 ring-offset-1 ring-offset-black/40 hover:-translate-y-2 hover:scale-[1.05] active:scale-95 active:translate-y-0 hover:z-40 transition-all duration-200 ease-out hover:shadow-2xl" : onClick ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out" : ""}
        ${selected ? "ring-2 ring-amber-400" : ""}
        touch-manipulation
        ${className}
      `}
    >
      {/* Glass reflection highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.14] to-transparent pointer-events-none" />

      {/* Top Corner Value */}
      <div className="
        relative
        z-10
        flex
        items-center
        justify-start
        pl-0.5
        text-[clamp(0.6rem,2.5vw,0.85rem)]
        font-black
        leading-none
        text-white
        drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]
      ">
        {cornerValue(cardValue)}
      </div>

      {/* Center White Oval Pill */}
      <div className="relative z-10 flex-1 min-h-0 my-0.5 flex items-center justify-center">
        <div
          className={`
            relative
            w-[92%]
            h-[82%]
            rounded-[50%]
            ${theme.pill}
            -rotate-12
            flex
            items-center
            justify-center
            border
            border-white/50
            shadow-md
            overflow-hidden
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/10 pointer-events-none" />
          <div className="relative rotate-12 flex items-center justify-center font-extrabold">
            {renderCenterContent(cardValue)}
          </div>
        </div>
      </div>

      {/* Bottom Inverted Corner Value */}
      <div className="
        relative
        z-10
        flex
        items-center
        justify-end
        pr-0.5
        rotate-180
        text-[clamp(0.6rem,2.5vw,0.85rem)]
        font-black
        leading-none
        text-white
        drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]
      ">
        {cornerValue(cardValue)}
      </div>
    </div>
  );
}