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
    pill: "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-black text-white",
    accent: "#ec4899",
  },
};

const SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 25,
  mass: 0.65,
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
   * Responsive dimensions:
   *
   * sm:
   *   phone 42x62 → desktop 56x80
   *
   * md:
   *   phone 50x74 → desktop 84x122
   *
   * lg:
   *   phone 68x98 → desktop 110x156
   */

  const sizeClasses = {
    sm: [
      "w-[clamp(2.5rem,10vw,3.5rem)]",
      "h-[clamp(3.75rem,15vw,5rem)]",
      "rounded-[clamp(0.5rem,2vw,0.75rem)]",
      "text-[clamp(0.55rem,2vw,0.7rem)]",
      "p-1",
    ].join(" "),

    md: [
      "w-[clamp(3.1rem,14vw,5.25rem)]",
      "h-[clamp(4.5rem,20vw,7.5rem)]",
      "rounded-[clamp(0.65rem,2vw,0.95rem)]",
      "text-[clamp(0.65rem,2vw,0.85rem)]",
      "p-[clamp(0.25rem,1vw,0.4rem)]",
    ].join(" "),

    lg: [
      "w-[clamp(4.1rem,18vw,6.75rem)]",
      "h-[clamp(5.9rem,26vw,9.75rem)]",
      "rounded-[clamp(0.85rem,2.8vw,1.35rem)]",
      "text-[clamp(0.75rem,2vw,1rem)]",
      "p-1.5",
    ].join(" "),
  }[size];

  const cardColor = card?.color || "wild";
  const cardValue = card?.value || "0";
  const theme = COLOR_MAP[cardColor] || COLOR_MAP.wild;

  const centerValue = (value) => {
    switch (value) {
      case "skip":
        return (
          <motion.svg
            className="w-[clamp(1.2rem,6.5vw,1.65rem)] h-[clamp(1.2rem,6.5vw,1.65rem)] stroke-current stroke-[2.5] fill-none"
            viewBox="0 0 24 24"
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
          </motion.svg>
        );

      case "reverse":
        return (
          <motion.svg
            className="w-[clamp(1.2rem,6.5vw,1.65rem)] h-[clamp(1.2rem,6.5vw,1.65rem)] fill-current"
            viewBox="0 0 24 24"
            animate={{ rotate: [0, 180, 360] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </motion.svg>
        );

      case "draw2":
        return (
          <motion.span
            className="font-black italic tracking-tighter text-[clamp(1.1rem,6.5vw,1.6rem)]"
            animate={{ scale: [1, 1.035, 1] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            +2
          </motion.span>
        );

      case "wild4":
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="grid grid-cols-2 gap-px w-[clamp(1.25rem,6.5vw,1.65rem)] h-[clamp(1.25rem,6.5vw,1.65rem)] rounded-md overflow-hidden border border-white/50 shadow-md">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-emerald-500" />
            </div>

            <span className="text-[clamp(0.5rem,2.2vw,0.65rem)] font-black text-white italic mt-0.5">
              +4
            </span>
          </div>
        );

      case "wild":
        return (
          <motion.div
            className="grid grid-cols-2 w-[clamp(1.4rem,7.5vw,1.85rem)] h-[clamp(1.4rem,7.5vw,1.85rem)] rounded-full overflow-hidden border-2 border-white/70 shadow-inner"
            animate={{ scale: [1, 1.035, 1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
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
            className="font-black italic tracking-tighter text-[clamp(1.1rem,6.5vw,1.6rem)]"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
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

  /*
   * FACE DOWN
   */

  if (isFaceDown) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: tilt,
        }}
        whileTap={
          onClick
            ? {
              scale: 0.96,
            }
            : {}
        }
        transition={SPRING}
        onClick={onClick}
        className={`
          relative
          ${sizeClasses}
          bg-gradient-to-br from-neutral-900 via-neutral-800 to-black
          border-2 border-neutral-700
          shadow-xl
          flex items-center justify-center
          select-none
          overflow-hidden
          ${onClick ? "cursor-pointer" : ""}
          ${className}
        `}
      >
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:5px_5px]" />

        <div className="absolute inset-[5%] rounded-[inherit] border border-neutral-700/70" />

        <motion.div
          animate={{
            rotate: [45, 47, 43, 45],
            scale: [1, 1.025, 1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            relative
            w-[48%]
            h-[68%]
            rounded-full
            bg-gradient-to-tr
            from-red-600
            via-amber-400
            to-blue-600
            flex
            items-center
            justify-center
            border
            border-white/25
            shadow-lg
          "
        >
          <span className="-rotate-45 font-black italic text-white text-[clamp(0.55rem,2vw,0.75rem)] tracking-widest drop-shadow-lg">
            UNO
          </span>
        </motion.div>

        <motion.div
          animate={{ x: ["-140%", "140%"] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
          className="
            absolute
            top-0
            bottom-0
            w-5
            bg-white/15
            blur-md
            skew-x-[-20deg]
            pointer-events-none
          "
        />
      </motion.div>
    );
  }

  /*
   * NORMAL CARD
   */

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.9,
        y: 8,
      }}
      animate={{
        opacity: 1,
        scale: selected ? 1.03 : 1,
        y: selected ? -4 : 0,
        rotate: tilt,
      }}
      whileTap={
        isPlayable || onClick
          ? {
            scale: 0.96,
          }
          : {}
      }
      transition={SPRING}
      onClick={isPlayable || onClick ? onClick : undefined}
      style={{
        boxShadow: selected
          ? "0 8px 20px rgba(251,191,36,0.3)"
          : isPlayable
            ? `0 6px 18px ${theme.accent}50`
            : "0 4px 12px rgba(0,0,0,0.3)",
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
        ${isPlayable ? "cursor-pointer ring-1 ring-white/50" : ""}
        ${selected ? "ring-2 ring-amber-400/80" : ""}
        touch-manipulation
        ${className}
      `}
    >
      {/* Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.14] to-transparent pointer-events-none" />

      {/* Playable border glow */}
      {isPlayable && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] border-2 border-white/80 pointer-events-none"
          animate={{
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Top value */}
      <div className="
        relative
        z-10
        flex
        items-center
        justify-start
        pl-0.5
        text-[clamp(0.5rem,2.2vw,0.7rem)]
        font-black
        leading-none
        text-white
        drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]
      ">
        {cornerValue(cardValue)}
      </div>

      {/* Center */}
      <div className="relative z-10 flex-1 min-h-0 my-0.5 flex items-center justify-center">
        <div
          className={`
            relative
            w-[92%]
            h-[78%]
            rounded-[50%]
            ${theme.pill}
            -rotate-12
            flex
            items-center
            justify-center
            border
            border-white/45
            shadow-md
            overflow-hidden
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/10 pointer-events-none" />

          <div className="relative rotate-12 flex items-center justify-center font-extrabold">
            {centerValue(cardValue)}
          </div>
        </div>
      </div>

      {/* Bottom value */}
      <div className="
        relative
        z-10
        flex
        items-center
        justify-end
        pr-0.5
        rotate-180
        text-[clamp(0.5rem,2.2vw,0.7rem)]
        font-black
        leading-none
        text-white
        drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]
      ">
        {cornerValue(cardValue)}
      </div>
    </motion.div>
  );
}