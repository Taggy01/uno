import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Typography, Chip } from "@heroui/react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import UnoCard from "../components/UnoCard";
import { getUserGradient } from "../Gradient/gradient";
import confetti from "canvas-confetti";
import {
  ArrowRightFromSquare,
  ArrowRotateLeft,
  ArrowRotateRight,
  Comment,
  Sparkles,
  Check,
  Copy,
  Flame,
} from "@gravity-ui/icons";

/* =========================================================
   CONSTANTS & CONFIG
========================================================= */
const COLOR_OPTIONS = [
  { name: "red", bg: "bg-red-600 hover:bg-red-500 ring-red-400 text-white", label: "Red" },
  { name: "blue", bg: "bg-blue-600 hover:bg-blue-500 ring-blue-400 text-white", label: "Blue" },
  { name: "green", bg: "bg-emerald-600 hover:bg-emerald-500 ring-emerald-400 text-white", label: "Green" },
  { name: "yellow", bg: "bg-amber-500 hover:bg-amber-400 ring-amber-300 text-black", label: "Yellow" },
];

const QUICK_EMOJIS = ["😂", "🔥", "👏", "💀", "😱", "🤬", "🃏", "🎯", "🎉", "⚡"];

/* =========================================================
   FAN + SNAP SHUFFLE ANIMATION COMPONENT
========================================================= */
function FanSnapShuffleOverlay({ onComplete }) {
  const [stage, setStage] = useState("fan"); // 'fan' -> 'snap' -> 'done'
  const cardCount = 14;

  useEffect(() => {
    const snapTimer = setTimeout(() => {
      setStage("snap");
    }, 1400);

    const completeTimer = setTimeout(() => {
      setStage("done");
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(snapTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center z-[100] pointer-events-none select-none"
    >
      <motion.div
        animate={{
          scale: stage === "fan" ? [1, 1.25, 1.1] : [1.1, 1.4, 1],
          opacity: stage === "snap" ? [0.3, 0.8, 0.4] : [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-red-600/30 via-amber-500/20 to-blue-600/30 blur-3xl"
      />

      <div className="relative w-36 h-52 flex items-center justify-center">
        {Array.from({ length: cardCount }).map((_, index) => {
          const mid = (cardCount - 1) / 2;
          const offset = index - mid;
          const fanAngle = offset * 6.5;
          const fanX = offset * 14;
          const fanY = Math.abs(offset) * 3.5 - 12;

          return (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ x: 0, y: 0, rotate: 0, scale: 0.9 }}
              animate={
                stage === "fan"
                  ? {
                      x: fanX,
                      y: fanY,
                      rotate: fanAngle,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 140,
                        damping: 14,
                        delay: index * 0.035,
                      },
                    }
                  : {
                      x: (index % 2 === 0 ? 1 : -1) * (index * 0.4),
                      y: -index * 1.2,
                      rotate: (Math.random() - 0.5) * 3,
                      scale: [1, 1.08, 1],
                      transition: {
                        type: "spring",
                        stiffness: 450,
                        damping: 24,
                        delay: (cardCount - index) * 0.015,
                      },
                    }
              }
            >
              <UnoCard isFaceDown size="lg" className="shadow-2xl" />
            </motion.div>
          );
        })}

        {stage === "snap" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute inset-0 rounded-3xl border-2 border-amber-400/80 pointer-events-none"
          />
        )}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3">
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-neutral-900/90 border border-white/15 shadow-2xl backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-sm font-black tracking-wide text-neutral-100 uppercase">
            {stage === "fan" ? "Fanning Deck" : "Snapping & Dealing"}
          </span>
          <span className="flex gap-1 text-amber-400 font-bold">
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.4 }}>.</motion.span>
          </span>
        </motion.div>

        <div className="w-56 h-1.5 rounded-full bg-neutral-800/80 overflow-hidden border border-white/10 p-0.5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: stage === "fan" ? "60%" : "100%" }}
            transition={{ duration: 1.3, ease: "easeInOut" }}
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 shadow-md"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   MAIN GAME PAGE COMPONENT
========================================================= */
export default function GamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : "";

  // Game Engine & UI States
  const [gameState, setGameState] = useState(null);
  const [selectedWildCard, setSelectedWildCard] = useState(null);
  const [alertBanner, setAlertBanner] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);

  // Animations & Deck Shuffle
  const [isShuffling, setIsShuffling] = useState(true);
  const [flyingCards, setFlyingCards] = useState([]);
  const [discardImpact, setDiscardImpact] = useState(null);

  // Chat & Emotes
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeReactions, setActiveReactions] = useState([]);
  const [floatingParticles, setFloatingParticles] = useState([]);

  // Refs for tracking changes
  const chatEndRef = useRef(null);
  const prevTopCardRef = useRef(null);
  const prevCardCountRef = useRef(null);
  const prevTurnPlayerRef = useRef(null);

  // Derived state
  const isMyTurn = gameState?.currentTurnPlayerId === user?.id && !isShuffling;
  const myPlayer = gameState?.players?.find((p) => p.id === user?.id);
  const myCards = myPlayer?.cards || [];
  const otherPlayers = gameState?.players?.filter((p) => p.id !== user?.id) || [];
  const selfReaction = activeReactions.find((r) => r.senderId === user?.id);

  // Only active when strictly 1 card is left and not yet called
  const isUnoActive = myCards.length === 1 && !myPlayer?.calledUno;

  // Turn timer countdown effect
  useEffect(() => {
    if (!gameState || isShuffling) return;

    if (prevTurnPlayerRef.current !== gameState.currentTurnPlayerId) {
      setTurnTimeLeft(30);
      prevTurnPlayerRef.current = gameState.currentTurnPlayerId;
    }

    const interval = setInterval(() => {
      setTurnTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.currentTurnPlayerId, isShuffling, gameState]);

  // Trigger floating alert banner
  const triggerAlert = useCallback((message, type = "info") => {
    setAlertBanner({ message, type });
    setTimeout(() => {
      setAlertBanner((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Spawn rising floating emoji particles
  const spawnFloatingEmojis = useCallback((emoji, senderId) => {
    const isSelf = senderId === user?.id;
    const particleCount = 5;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const baseLeft = isSelf ? 50 + (Math.random() * 20 - 10) : 30 + Math.random() * 40;
      return {
        id: `${Date.now()}-${Math.random()}-${i}`,
        emoji,
        left: baseLeft,
        driftX: (Math.random() - 0.5) * 140,
        driftY: -(180 + Math.random() * 220),
        duration: 1.8 + Math.random() * 0.7,
        scale: 0.85 + Math.random() * 0.6,
        rotation: (Math.random() - 0.5) * 60,
        delay: i * 0.08,
      };
    });

    setFloatingParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 3000);
  }, [user?.id]);

  /* =========================================================
     SOCKET SUBSCRIPTIONS
  ========================================================= */
  useEffect(() => {
    if (!socket || !cleanCode || !user) return;

    socket.emit("join_room", {
      roomCode: cleanCode,
      user: { id: user.id, username: user.username },
    });

    const handlePlayerState = (state) => {
      setGameState(state);
    };

    const handleGameUpdate = (update) => {
      if (update?.topCard && prevTopCardRef.current && update.topCard.id !== prevTopCardRef.current.id) {
        setDiscardImpact({
          color: update.topCard.color || "red",
          timestamp: Date.now(),
        });
      }
      prevTopCardRef.current = update?.topCard;

      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...update,
          players: update.players?.map((p) => ({
            ...p,
            cards: p.id === user.id ? prev.players?.find((old) => old.id === user.id)?.cards || [] : undefined,
          })) || prev.players,
        };
      });
    };

    const handleUnoCalled = ({ username }) => {
      triggerAlert(`📢 ${username} SHOUTED UNO! 🚨`, "warning");
    };

    const handleUnoCaught = ({ catcher, target }) => {
      triggerAlert(`🚨 ${catcher} caught ${target} forgetting to say UNO! (+2 Cards)`, "danger");
    };

    const handleGameOver = ({ winner }) => {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.6 },
      });
      triggerAlert(`🎉 ${winner.username} WON THE MATCH!`, "success");
    };

    const handleReturnedToLobby = () => {
      navigate(`/lobby/${cleanCode}`);
    };

    const handleError = (msg) => {
      triggerAlert(msg, "danger");
    };

    const handleChatMessage = (msg) => {
      setChatMessages((prev) => [...prev.slice(-40), msg]);
      if (!showChat) {
        setUnreadChatCount((c) => c + 1);
      }
    };

    const handlePlayerReaction = (reaction) => {
      setActiveReactions((prev) => [...prev, reaction]);
      spawnFloatingEmojis(reaction.emoji, reaction.senderId);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2800);
    };

    socket.on("player_state", handlePlayerState);
    socket.on("game_update", handleGameUpdate);
    socket.on("uno_called", handleUnoCalled);
    socket.on("uno_caught", handleUnoCaught);
    socket.on("game_over", handleGameOver);
    socket.on("returned_to_lobby", handleReturnedToLobby);
    socket.on("error_msg", handleError);
    socket.on("chat_message", handleChatMessage);
    socket.on("player_reaction", handlePlayerReaction);

    return () => {
      socket.off("player_state", handlePlayerState);
      socket.off("game_update", handleGameUpdate);
      socket.off("uno_called", handleUnoCalled);
      socket.off("uno_caught", handleUnoCaught);
      socket.off("game_over", handleGameOver);
      socket.off("returned_to_lobby", handleReturnedToLobby);
      socket.off("error_msg", handleError);
      socket.off("chat_message", handleChatMessage);
      socket.off("player_reaction", handlePlayerReaction);
    };
  }, [socket, cleanCode, user, navigate, showChat, spawnFloatingEmojis, triggerAlert]);

  // Scroll chat to bottom when open
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  // Monitor hand count to trigger draw animation
  useEffect(() => {
    if (prevCardCountRef.current !== null && myCards.length > prevCardCountRef.current && !isShuffling) {
      const newlyDrawnCard = myCards[myCards.length - 1];
      const animId = `draw-${Date.now()}`;
      setFlyingCards((prev) => [
        ...prev,
        { id: animId, type: "draw", card: newlyDrawnCard },
      ]);
      setTimeout(() => {
        setFlyingCards((prev) => prev.filter((c) => c.id !== animId));
      }, 650);
    }
    prevCardCountRef.current = myCards.length;
  }, [myCards, isShuffling]);

  /* =========================================================
     GAMEPLAY ACTIONS
  ========================================================= */
  const isCardPlayable = (card) => {
    if (!isMyTurn || !card || !gameState?.topCard) return false;
    if (card.color === "wild" || card.value === "wild" || card.value === "wild4") {
      return true;
    }
    const activeCol = gameState.activeColor || gameState.topCard.color;
    return card.color === activeCol || card.value === gameState.topCard.value;
  };

  const hasPlayableCard = myCards.some((c) => isCardPlayable(c));

  const handleCardClick = (card) => {
    if (!isMyTurn) {
      triggerAlert("Wait for your turn!", "warning");
      return;
    }

    if (!isCardPlayable(card)) {
      triggerAlert("Invalid move. Card must match active color or number!", "danger");
      return;
    }

    if (card.color === "wild" || card.value === "wild" || card.value === "wild4") {
      setSelectedWildCard(card);
    } else {
      const playAnimId = `play-${card.id}-${Date.now()}`;
      setFlyingCards((prev) => [
        ...prev,
        { id: playAnimId, type: "play", card },
      ]);
      setTimeout(() => {
        setFlyingCards((prev) => prev.filter((c) => c.id !== playAnimId));
      }, 550);

      socket.emit("play_card", {
        roomCode: cleanCode,
        userId: user.id,
        cardId: card.id,
        chosenColor: null,
      });
    }
  };

  const handleColorSelected = (color) => {
    if (!selectedWildCard) return;

    const playAnimId = `play-${selectedWildCard.id}-${Date.now()}`;
    setFlyingCards((prev) => [
      ...prev,
      { id: playAnimId, type: "play", card: selectedWildCard },
    ]);
    setTimeout(() => {
      setFlyingCards((prev) => prev.filter((c) => c.id !== playAnimId));
    }, 550);

    socket.emit("play_card", {
      roomCode: cleanCode,
      userId: user.id,
      cardId: selectedWildCard.id,
      chosenColor: color,
    });
    setSelectedWildCard(null);
  };

  const handleDraw = () => {
    if (!isMyTurn) {
      triggerAlert("Wait for your turn to draw!", "warning");
      return;
    }
    socket.emit("draw_card", {
      roomCode: cleanCode,
      userId: user.id,
    });
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    socket.emit("pass_turn", {
      roomCode: cleanCode,
      userId: user.id,
    });
  };

  const handleCallUno = () => {
    if (myCards.length !== 1) {
      triggerAlert("You can only shout UNO when you have exactly 1 card left!", "warning");
      return;
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.85, x: 0.8 },
      colors: ["#ef4444", "#f59e0b", "#ffffff"],
    });

    socket.emit("call_uno", {
      roomCode: cleanCode,
      userId: user.id,
    });
  };

  const handleCatchUno = (targetPlayerId) => {
    socket.emit("catch_uno", {
      roomCode: cleanCode,
      callerId: user.id,
      targetPlayerId,
    });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit("send_chat", {
      roomCode: cleanCode,
      message: chatInput.trim(),
      user: { id: user.id, username: user.username },
    });
    setChatInput("");
  };

  const handleSendReaction = (emoji) => {
    socket.emit("send_reaction", {
      roomCode: cleanCode,
      emoji,
      user: { id: user.id, username: user.username },
    });
  };

  const handleRestartToLobby = () => {
    socket.emit("restart_to_lobby", {
      roomCode: cleanCode,
      userId: user.id,
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeColor = gameState?.activeColor || gameState?.topCard?.color || "red";
  const activeColorBg = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    yellow: "bg-amber-400",
  }[activeColor] || "bg-red-500";

  /* =========================================================
     LOADING STATE
  ========================================================= */
  if (!gameState) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center font-black text-base shadow-xl mb-4"
        >
          UNO
        </motion.div>
        <Typography.Heading level={2} className="text-xl font-bold">
          Joining Match #{cleanCode}...
        </Typography.Heading>
        <Typography className="text-xs text-neutral-400 mt-2">
          Syncing game table with server
        </Typography>
        <Button
          variant="secondary"
          onClick={() => navigate(`/lobby/${cleanCode}`)}
          className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-neutral-300 border border-neutral-700 cursor-pointer"
        >
          Return to Lobby
        </Button>
      </div>
    );
  }

  /* =========================================================
     MAIN ARENA UI
  ========================================================= */
  return (
    <div
      className={`relative min-h-[100dvh] h-[100dvh] bg-[#060608] text-white overflow-hidden flex flex-col select-none transition-colors duration-500 ${
        isMyTurn ? "ring-4 ring-inset ring-emerald-500/40" : ""
      }`}
    >
      {/* Dynamic Ambient Table Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: isMyTurn ? [1.05, 1.18, 1.05] : [1, 1.1, 1],
            opacity: isMyTurn ? [0.45, 0.7, 0.45] : [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[500px] rounded-full blur-[140px] ${
            isMyTurn
              ? "bg-emerald-500/25"
              : activeColor === "red"
              ? "bg-red-600/20"
              : activeColor === "blue"
              ? "bg-blue-600/20"
              : activeColor === "green"
              ? "bg-emerald-600/20"
              : "bg-amber-500/20"
          }`}
        />
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      {/* Fan + Snap Shuffle Intro on match start / reset */}
      <AnimatePresence>
        {isShuffling && (
          <FanSnapShuffleOverlay onComplete={() => setIsShuffling(false)} />
        )}
      </AnimatePresence>

      {/* Flying Cards Animation Layer */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {flyingCards.map((fc) => {
          if (fc.type === "draw") {
            return (
              <motion.div
                key={fc.id}
                initial={{ top: "45%", left: "42%", scale: 0.8, rotateY: 180, opacity: 0.9 }}
                animate={{ top: "85%", left: "50%", scale: [0.8, 1.2, 1], rotateY: [180, 0], opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 shadow-2xl filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
              >
                <UnoCard card={fc.card} size="md" />
              </motion.div>
            );
          }
          if (fc.type === "play") {
            return (
              <motion.div
                key={fc.id}
                initial={{ top: "82%", left: "50%", scale: 1, opacity: 1 }}
                animate={{ top: "45%", left: "58%", scale: [1, 1.25, 1], rotateZ: [0, (Math.random() - 0.5) * 20], opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="absolute -translate-x-1/2 -translate-y-1/2 shadow-2xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
              >
                <UnoCard card={fc.card} size="md" />
              </motion.div>
            );
          }
          return null;
        })}
      </div>

      {/* Dynamic Floating Rising Emojis Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.4, p.scale * 1.25, p.scale],
              x: [0, p.driftX * 0.5, p.driftX],
              y: [0, p.driftY * 0.6, p.driftY],
              rotate: [0, p.rotation],
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: "absolute", left: `${p.left}%`, bottom: "20%" }}
            className="text-3xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] select-none"
          >
            {p.emoji}
          </motion.div>
        ))}
      </div>

      {/* =====================================================
          TOP HUD BAR
      ===================================================== */}
      <header className="relative flex justify-between items-center px-3 md:px-6 py-2 border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl z-20 shadow-md">
        <div className="flex items-center gap-2 md:gap-3">
          <div
            onClick={() => navigate("/")}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center font-black text-xs shadow-md cursor-pointer hover:scale-105 transition-transform"
          >
            UNO
          </div>
          <button
            type="button"
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            title="Copy Room Code"
          >
            <span>#{cleanCode}</span>
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
          </button>
          <Chip size="sm" className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400">
            {gameState?.direction === 1 ? (
              <>
                <ArrowRotateRight className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: "6s" }} />
                <span>Clockwise</span>
              </>
            ) : (
              <>
                <ArrowRotateLeft className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
                <span>Counter-Clockwise</span>
              </>
            )}
          </Chip>
        </div>

        {/* Global Turn Alert & Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Turn Countdown & Status Pill */}
          <motion.div
            animate={isMyTurn ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs md:text-sm font-black shadow-lg transition-all ${
              isMyTurn
                ? "bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 shadow-emerald-950/50 animate-pulse"
                : "bg-neutral-900 border-neutral-750 text-neutral-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isMyTurn ? "bg-emerald-400 animate-ping" : "bg-neutral-500"}`} />
            <span>{isMyTurn ? "YOUR TURN!" : `${gameState?.currentTurnUsername || "Waiting"}'s Turn`}</span>
            <span className="text-[11px] opacity-75 font-mono">({turnTimeLeft}s)</span>
          </motion.div>

          <Button
            type="button"
            variant={showChat ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setShowChat(!showChat);
              setUnreadChatCount(0);
            }}
            className={`p-2 border rounded-xl transition-colors cursor-pointer relative ${
              showChat
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
            }`}
            title="Chat"
          >
            <Comment className="w-4 h-4" />
            {unreadChatCount > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2 bg-neutral-800/80 hover:bg-rose-500/20 border border-neutral-700 hover:border-rose-500/40 rounded-xl text-neutral-300 hover:text-rose-300 transition-colors cursor-pointer"
            title="Exit Game"
          >
            <ArrowRightFromSquare className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Floating Alert Notification */}
      <AnimatePresence>
        {alertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 max-w-md w-full"
          >
            <div
              className={`px-4 py-2.5 rounded-2xl shadow-2xl border font-bold text-xs md:text-sm flex items-center justify-center gap-2 backdrop-blur-md text-center ${
                alertBanner.type === "danger"
                  ? "bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-900/40"
                  : alertBanner.type === "warning"
                  ? "bg-amber-950/95 border-amber-500 text-amber-200 animate-bounce shadow-amber-900/40"
                  : "bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-900/40"
              }`}
            >
              <span>{alertBanner.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          MAIN GAME TABLE ARENA
      ===================================================== */}
      <main className="relative flex-1 flex flex-col justify-between items-center px-2 sm:px-4 md:px-6 pt-1 pb-1 z-10 overflow-hidden">
        {/* Opponents Area (Mobile-friendly horizontal chips) */}
        <div className="w-full max-w-5xl flex items-center justify-center gap-2 md:gap-3 py-1 overflow-x-auto scrollbar-none">
          {otherPlayers.map((p) => {
            const isTurn = gameState?.currentTurnPlayerId === p.id;
            const gradient = getUserGradient(p.id);
            const isUnoDanger = p.cardCount === 1 && !p.calledUno;
            const playerReaction = activeReactions.find((r) => r.senderId === p.id);

            return (
              <motion.div
                key={p.id}
                animate={isTurn ? { scale: [1, 1.04, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                transition={isTurn ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                className={`relative flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 md:py-2 rounded-2xl border transition-all ${
                  isTurn
                    ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-950/40"
                    : "bg-neutral-900/80 border-neutral-800/80"
                }`}
              >
                <AnimatePresence>
                  {playerReaction && (
                    <motion.div
                      initial={{ scale: 0, y: 10, opacity: 0 }}
                      animate={{ scale: [0, 1.35, 1], y: -30, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 px-2 py-1 rounded-2xl bg-neutral-900 border border-white/20 text-xl shadow-2xl"
                    >
                      {playerReaction.emoji}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-inner"
                  style={{ background: gradient }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] md:text-xs font-bold text-neutral-200 max-w-[75px] md:max-w-[100px] truncate">
                      {p.username}
                    </span>
                    {p.isBot && (
                      <span className="px-1 py-0.2 rounded bg-neutral-800 text-[8px] text-neutral-400 font-bold">BOT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] md:text-[11px] text-neutral-400 font-semibold">
                    <span>{p.cardCount} cards</span>
                    {isTurn && (
                      <span className="text-amber-400 text-[9px] font-bold">🤔 Thinking</span>
                    )}
                    {p.calledUno && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black text-[8px] animate-pulse">
                        UNO!
                      </span>
                    )}
                  </div>
                </div>

                {isUnoDanger && (
                  <motion.button
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.95, 1.08, 0.95] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    onClick={() => handleCatchUno(p.id)}
                    className="ml-1 px-2 py-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white text-[9px] md:text-[10px] font-black tracking-wider uppercase shadow-lg shadow-red-900/50 cursor-pointer"
                  >
                    🚨 CATCH!
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Turn Guidance Bar in Table Center */}
        <div className="w-full flex items-center justify-center my-0.5">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border ${
              isMyTurn
                ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300 ring-2 ring-emerald-500/30"
                : "bg-neutral-900/70 border-neutral-800 text-neutral-400"
            }`}
          >
            <span>
              {isMyTurn
                ? hasPlayableCard
                  ? "👉 Select a highlighted card from your hand to play"
                  : "👉 No matching cards in hand! Tap Draw Deck to draw"
                : `Waiting for ${gameState?.currentTurnUsername || "opponent"} to make a move...`}
            </span>
          </motion.div>
        </div>

        {/* Center Table: Draw Deck + Discard Pile + Active Color */}
        <div className="relative flex items-center justify-center gap-5 sm:gap-8 md:gap-12 my-auto py-1">
          {/* Draw Deck */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              whileHover={isMyTurn ? { scale: 1.04 } : {}}
              whileTap={isMyTurn ? { scale: 0.96 } : {}}
              animate={isMyTurn && !hasPlayableCard ? { scale: [1, 1.06, 1], y: [0, -2, 0] } : {}}
              transition={isMyTurn && !hasPlayableCard ? { repeat: Infinity, duration: 1.2 } : {}}
              onClick={handleDraw}
              className={`relative cursor-pointer transition-all ${
                isMyTurn
                  ? "ring-4 ring-emerald-400/80 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : ""
              }`}
            >
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-neutral-900 border border-neutral-700 opacity-60" />
              <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-2xl bg-neutral-850 border border-neutral-700 opacity-80" />
              <UnoCard isFaceDown size="md" />
            </motion.div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] md:text-[11px] font-bold text-neutral-300">
                Draw Deck ({gameState.deckRemaining ?? 108})
              </span>
              {isMyTurn && !hasPlayableCard && (
                <span className="text-[10px] font-extrabold text-emerald-400 animate-bounce">
                  👆 Tap to Draw
                </span>
              )}
            </div>
          </div>

          {/* Active Discard Pile */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              key={gameState.topCard?.id}
              initial={{ scale: 0.75, rotate: (Math.random() - 0.5) * 20, opacity: 0.6 }}
              animate={{ scale: 1, rotate: (Math.random() - 0.5) * 6, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="relative"
            >
              <UnoCard card={gameState.topCard} size="md" />
              {discardImpact && (
                <motion.div
                  key={discardImpact.timestamp}
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className={`absolute inset-0 rounded-2xl border-2 pointer-events-none ${
                    discardImpact.color === "red"
                      ? "border-red-500"
                      : discardImpact.color === "blue"
                      ? "border-blue-500"
                      : discardImpact.color === "green"
                      ? "border-emerald-500"
                      : "border-amber-400"
                  }`}
                />
              )}
            </motion.div>
            <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-neutral-300">
              <span>Active Color:</span>
              <span className={`w-3 h-3 rounded-full ${activeColorBg} shadow-[0_0_8px_currentColor]`} />
              <span className="capitalize font-black text-white">{activeColor}</span>
            </div>
          </div>
        </div>

        {/* =====================================================
            BOTTOM AREA: PLAYER HAND & ACTION BAR
        ===================================================== */}
        <div className="w-full max-w-5xl flex flex-col items-center gap-1 z-20 pb-1">
          <AnimatePresence>
            {selfReaction && (
              <motion.div
                initial={{ scale: 0, y: 10, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1], y: -24, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="px-3 py-1 rounded-2xl bg-neutral-900 border border-white/20 text-2xl shadow-2xl"
              >
                {selfReaction.emoji}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar (Reactions + Tactical 3D UNO Button + Pass) */}
          <div className="w-full flex items-center justify-between gap-2 px-2">
            {/* Quick Emoji Reactions */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-[170px] sm:max-w-none">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReaction(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs md:text-sm hover:scale-125 transition-transform cursor-pointer shadow-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Tactical 3D Arcade UNO Button */}
            <div className="flex items-center gap-2">
              {isMyTurn && gameState?.hasDrawnThisTurn && (
                <motion.button
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePass}
                  className="px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs md:text-sm shadow-lg cursor-pointer"
                >
                  Pass Turn
                </motion.button>
              )}

              {/* UNO Calling Button (Active strictly on 1 card) */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                animate={
                  isUnoActive
                    ? {
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          "0 5px 0 #991b1b, 0 10px 20px rgba(239,68,68,0.4)",
                          "0 5px 0 #991b1b, 0 14px 30px rgba(239,68,68,0.8)",
                          "0 5px 0 #991b1b, 0 10px 20px rgba(239,68,68,0.4)",
                        ],
                      }
                    : {}
                }
                transition={isUnoActive ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
                onClick={handleCallUno}
                className={`relative px-5 md:px-7 py-2 md:py-2.5 rounded-2xl font-black text-xs md:text-sm tracking-wider uppercase select-none transition-all cursor-pointer ${
                  myPlayer?.calledUno
                    ? "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white border-2 border-emerald-300 shadow-[0_4px_0_#065f46]"
                    : isUnoActive
                    ? "bg-gradient-to-b from-red-500 via-rose-600 to-red-700 text-white border-2 border-amber-300 ring-4 ring-amber-400/50"
                    : "bg-neutral-800 hover:bg-neutral-750 text-neutral-400 border border-neutral-700 shadow-[0_3px_0_#262626]"
                }`}
              >
                <div className="flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {myPlayer?.calledUno ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>UNO CALLED!</span>
                    </>
                  ) : (
                    <>
                      <Flame className={`w-3.5 h-3.5 ${isUnoActive ? "text-amber-300 animate-bounce" : "text-neutral-500"}`} />
                      <span>SHOUT UNO!</span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          </div>

          {/* Cards Hand Carousel (Full 100% Opacity, No Spilling Out of Screen) */}
          <div className="w-full flex items-center justify-center overflow-x-auto overflow-y-visible pt-2 pb-1 px-3 sm:px-4 scrollbar-none touch-manipulation">
            <div className="flex items-center justify-center -space-x-4 sm:-space-x-7 md:-space-x-9 py-1">
              {myCards.map((card, index) => {
                const playable = isCardPlayable(card);
                return (
                  <motion.div
                    key={card.id || index}
                    animate={
                      playable && isMyTurn
                        ? { y: -4, scale: 1.02 }
                        : { y: 0, scale: 1 }
                    }
                    whileHover={{ y: -6, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 350, damping: 24 }}
                    className="relative z-10 hover:z-30 opacity-100 flex-shrink-0"
                  >
                    <UnoCard
                      card={card}
                      size="md"
                      isPlayable={playable}
                      onClick={() => handleCardClick(card)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================
          WILD COLOR PICKER MODAL
      ===================================================== */}
      <AnimatePresence>
        {selectedWildCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-neutral-700/80 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-center"
            >
              <Typography.Heading level={3} className="text-lg font-black text-white mb-1">
                Choose Color
              </Typography.Heading>
              <p className="text-xs text-neutral-400 mb-6">
                Pick the active color for the table
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleColorSelected(opt.name)}
                    className={`py-4 rounded-2xl font-black text-sm shadow-xl transition-transform hover:scale-105 cursor-pointer ${opt.bg}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedWildCard(null)}
                className="w-full py-2 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          CHAT DRAWER / SIDEBAR
      ===================================================== */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-12 bottom-0 right-0 w-full sm:w-80 bg-neutral-900/95 backdrop-blur-2xl border-l border-neutral-800 z-40 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Comment className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-neutral-200">Table Chat</span>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs text-neutral-500 my-auto py-12">
                  No messages yet. Send a greeting!
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isSelf = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-neutral-400 font-semibold mb-0.5">{m.sender}</span>
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                          isSelf
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/60"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-neutral-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={120}
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          GAME OVER MODAL
      ===================================================== */}
      <AnimatePresence>
        {gameState?.status === "ended" && gameState?.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-700 p-6 md:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                🏆
              </div>

              <Typography.Heading level={2} className="text-2xl font-black text-white mb-1">
                {gameState.winner.id === user?.id ? "VICTORY!" : "GAME OVER"}
              </Typography.Heading>

              <p className="text-sm font-semibold text-neutral-300 mb-6">
                🎉 <span className="font-bold text-amber-400">{gameState.winner.username}</span> won the match!
              </p>

              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  onClick={handleRestartToLobby}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl cursor-pointer"
                >
                  Play Again / Return to Lobby
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/")}
                  className="w-full py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs border border-neutral-700 cursor-pointer"
                >
                  Exit to Main Menu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}