import React from "react";
import { motion } from "framer-motion";

const COLOR_MAP = {
  red: {
    bg: "bg-gradient-to-br from-red-500 via-rose-600 to-red-800",
    border: "border-red-300/80",
    pill: "bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-rose-600",
    accent: "#f43f5e",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-800",
    border: "border-blue-300/80",
    pill: "bg-gradient-to-tr from-white via-neutral-50 to-neutral-200 text-blue-600",
    accent: "#3b82f6",
  },
  green: {
    bg: "bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800",
    border: "border-emerald-300/80",
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
    pill: "bg-neutral-950 text-white",
    accent: "#ec4899",
  },
};

const SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 22,
  mass: 0.7,
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
  const sizeClasses =
    size === "sm"
      ? "w-14 h-20 rounded-xl text-xs"
      : size === "lg"
        ? "w-28 h-40 rounded-3xl text-base"
        : "w-22 h-32 rounded-2xl text-sm";

  const cardColor = card?.color || "wild";
  const cardValue = card?.value || "0";
  const theme = COLOR_MAP[cardColor] || COLOR_MAP.wild;

  const centerValue = (value) => {
    switch (value) {
      case "skip":
        return (
          <motion.svg
            className="w-7 h-7 stroke-current stroke-[2.5] fill-none"
            viewBox="0 0 24 24"
            animate={{ rotate: [0, -4, 4, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
          </motion.svg>
        );

      case "reverse":
        return (
          <motion.svg
            className="w-7 h-7 fill-current"
            viewBox="0 0 24 24"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          >
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </motion.svg>
        );

      case "draw2":
        return (
          <motion.span
            className="text-2xl font-black italic tracking-tighter"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            +2
          </motion.span>
        );

      case "wild4":
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5 w-7 h-7 rounded-md overflow-hidden border border-white/50 shadow-md">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-emerald-500" />
            </div>
            <span className="text-xs font-black text-white italic mt-0.5">+4</span>
          </div>
        );

      case "wild":
        return (
          <motion.div
            className="grid grid-cols-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white/70 shadow-inner"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-red-500" />
            <div className="bg-blue-500" />
            <div className="bg-yellow-400" />
            <div className="bg-emerald-500" />
          </motion.div>
        );

      default:
        return (
          <motion.span
            className="font-black italic text-2xl tracking-tighter"
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {value}
          </motion.span>
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

  if (isFaceDown) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1, rotate: tilt }}
        whileHover={onClick ? { y: -5, scale: 1.03 } : {}}
        whileTap={onClick ? { scale: 0.97 } : {}}
        transition={SPRING}
        onClick={onClick}
        className={`relative ${sizeClasses} bg-gradient-to-br from-neutral-900 via-neutral-800 to-black border-2 border-neutral-700 shadow-xl flex items-center justify-center select-none overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />
        <div className="absolute inset-1.5 rounded-xl border border-neutral-700/70" />

        <motion.div
          animate={{ rotate: [45, 47, 43, 45], scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-12 h-16 rounded-full bg-gradient-to-tr from-red-600 via-amber-400 to-blue-600 flex items-center justify-center border border-white/25 shadow-lg"
        >
          <span className="-rotate-45 font-black italic text-white text-xs tracking-widest drop-shadow-lg">
            UNO
          </span>
        </motion.div>

        <motion.div
          animate={{ x: ["-130%", "130%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 1.6,
            ease: "easeInOut",
          }}
          className="absolute top-0 bottom-0 w-7 bg-white/20 blur-md skew-x-[-20deg] pointer-events-none"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 14 }}
      animate={{
        opacity: 1,
        scale: selected ? 1.035 : 1,
        y: selected ? -12 : 0,
        rotate: tilt,
      }}
      whileHover={
        isPlayable
          ? { scale: 1.035, y: -8, transition: SPRING }
          : onClick
            ? { scale: 1.02, y: -3, transition: SPRING }
            : {}
      }
      whileTap={
        isPlayable || onClick
          ? { scale: 0.97, y: selected ? -8 : 0 }
          : {}
      }
      transition={SPRING}
      onClick={isPlayable || onClick ? onClick : undefined}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: selected
          ? "0 16px 28px rgba(251,191,36,0.28)"
          : isPlayable
            ? `0 12px 28px ${theme.accent}42`
            : "0 8px 20px rgba(0,0,0,0.28)",
      }}
      className={`relative ${sizeClasses} ${theme.bg} border-2 ${theme.border} flex flex-col justify-between p-1.5 select-none overflow-hidden ${isPlayable ? "cursor-pointer" : ""} ${selected ? "ring-2 ring-amber-400/80" : ""} ${className}`}
    >
      {/* Subtle glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-transparent pointer-events-none" />

      {/* Very subtle playable edge — no badge/dot */}
      {isPlayable && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] border-2 border-white/55 pointer-events-none"
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative z-10 flex items-center justify-start text-[11px] font-black leading-none pl-0.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {cornerValue(cardValue)}
      </div>

      <div className="relative z-10 flex-1 my-0.5 flex items-center justify-center">
        <div className={`relative w-full h-full rounded-full ${theme.pill} -rotate-12 flex items-center justify-center border border-white/45 shadow-md overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/65 via-transparent to-black/10 pointer-events-none" />
          <div className="relative rotate-12 flex items-center justify-center font-extrabold">
            {centerValue(cardValue)}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-end text-[11px] font-black leading-none pr-0.5 rotate-180 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {cornerValue(cardValue)}
      </div>
    </motion.div>
  );
}
