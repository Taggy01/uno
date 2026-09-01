import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Typography, Chip, Surface, Alert } from "@heroui/react";
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
  Clock,
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
  const cardCount = 10;

  useEffect(() => {
    const snapTimer = setTimeout(() => {
      setStage("snap");
    }, 1300);

    const completeTimer = setTimeout(() => {
      setStage("done");
      if (onComplete) onComplete();
    }, 2600);

    return () => {
      clearTimeout(snapTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[100] pointer-events-none select-none"
    >
      <div className="relative w-36 h-52 flex items-center justify-center">
        {Array.from({ length: cardCount }).map((_, index) => {
          const mid = (cardCount - 1) / 2;
          const offset = index - mid;
          const fanAngle = offset * 7;
          const fanX = offset * 16;
          const fanY = Math.abs(offset) * 4 - 10;

          return (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ x: 0, y: 0, rotate: 0 }}
              animate={
                stage === "fan"
                  ? {
                      x: fanX,
                      y: fanY,
                      rotate: fanAngle,
                      transition: {
                        type: "spring",
                        stiffness: 160,
                        damping: 15,
                        delay: index * 0.03,
                      },
                    }
                  : {
                      x: (index % 2 === 0 ? 1 : -1) * (index * 0.4),
                      y: -index * 1.2,
                      rotate: (Math.random() - 0.5) * 3,
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
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-3xl border-2 border-amber-400/80 pointer-events-none"
          />
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-white/15 shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black tracking-wide text-neutral-100 uppercase">
            {stage === "fan" ? "Fanning Deck..." : "Shuffling & Dealing..."}
          </span>
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

  // Split cards into 2 layers for mobile when > 5 cards
  const topLayerCards = myCards.length > 5 ? myCards.slice(0, Math.ceil(myCards.length / 2)) : myCards;
  const bottomLayerCards = myCards.length > 5 ? myCards.slice(Math.ceil(myCards.length / 2)) : [];

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
    }, 3500);
  }, []);

  // Spawn rising floating emoji particles
  const spawnFloatingEmojis = useCallback((emoji, senderId) => {
    const isSelf = senderId === user?.id;
    const particleCount = 4;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const baseLeft = isSelf ? 50 + (Math.random() * 20 - 10) : 30 + Math.random() * 40;
      return {
        id: `${Date.now()}-${Math.random()}-${i}`,
        emoji,
        left: baseLeft,
        driftX: (Math.random() - 0.5) * 120,
        driftY: -(160 + Math.random() * 180),
        duration: 1.6 + Math.random() * 0.5,
        scale: 0.85 + Math.random() * 0.5,
        rotation: (Math.random() - 0.5) * 50,
        delay: i * 0.08,
      };
    });

    setFloatingParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 2500);
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
        particleCount: 140,
        spread: 80,
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
      setChatMessages((prev) => [...prev.slice(-30), msg]);
      if (!showChat) {
        setUnreadChatCount((c) => c + 1);
      }
    };

    const handlePlayerReaction = (reaction) => {
      setActiveReactions((prev) => [...prev, reaction]);
      spawnFloatingEmojis(reaction.emoji, reaction.senderId);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
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
      }, 500);
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
      }, 450);

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
    }, 450);

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
      particleCount: 45,
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
        <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center font-black text-base shadow-xl mb-4 animate-bounce">
          UNO
        </div>
        <Typography.Heading level={2} className="text-xl font-bold">
          Joining Match #{cleanCode}...
        </Typography.Heading>
        <Typography className="text-xs text-neutral-400 mt-2">
          Syncing game table with server
        </Typography>
        <Button
          variant="secondary"
          onClick={() => navigate(`/lobby/${cleanCode}`)}
          className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-neutral-300 border border-neutral-700 cursor-pointer h-auto"
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
      className={`relative min-h-[100dvh] h-[100dvh] bg-[#060608] text-white overflow-hidden flex flex-col select-none ${
        isMyTurn ? "ring-4 ring-inset ring-emerald-500/40" : ""
      }`}
    >
      {/* Lightweight Ambient Table Background Glow (Hardware Accelerated) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[100px] opacity-35 transition-colors duration-700 ${
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
      </div>

      {/* Fan + Snap Shuffle Intro on match start */}
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
                initial={{ top: "45%", left: "42%", scale: 0.8, opacity: 0.9 }}
                animate={{ top: "85%", left: "50%", scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 shadow-2xl"
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
                animate={{ top: "45%", left: "58%", scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 shadow-2xl"
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
              scale: [0.4, p.scale, p.scale],
              x: [0, p.driftX],
              y: [0, p.driftY],
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
            style={{ position: "absolute", left: `${p.left}%`, bottom: "22%" }}
            className="text-3xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] select-none"
          >
            {p.emoji}
          </motion.div>
        ))}
      </div>

      {/* =====================================================
          TOP HUD BAR (HeroUI & Gravity UI Icons)
      ===================================================== */}
      <header className="relative flex justify-between items-center px-3 md:px-6 py-1.5 border-b border-neutral-850 bg-neutral-950/90 backdrop-blur-md z-20 shadow-md">
        <div className="flex items-center gap-2 md:gap-3">
          <div
            onClick={() => navigate("/")}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center font-black text-xs shadow-md cursor-pointer active:scale-95 transition-transform"
          >
            UNO
          </div>
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={copyRoomCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer h-auto"
            title="Copy Room Code"
          >
            <span>#{cleanCode}</span>
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
          </Button>

          <Chip size="sm" className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400">
            {gameState?.direction === 1 ? (
              <>
                <ArrowRotateRight className="w-3 h-3 text-emerald-400" />
                <span>Clockwise</span>
              </>
            ) : (
              <>
                <ArrowRotateLeft className="w-3 h-3 text-amber-400" />
                <span>Counter-Clockwise</span>
              </>
            )}
          </Chip>
        </div>

        {/* Global Turn Alert & Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <Chip
            size="sm"
            className={`flex items-center gap-1.5 px-3 py-1 text-xs md:text-sm font-black border transition-all ${
              isMyTurn
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30"
                : "bg-neutral-850 border-neutral-750 text-neutral-300"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isMyTurn ? "YOUR TURN!" : `${gameState?.currentTurnUsername || "Waiting"}'s Turn`}</span>
            <span className="text-[11px] opacity-75 font-mono">({turnTimeLeft}s)</span>
          </Chip>

          <Button
            type="button"
            variant={showChat ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setShowChat(!showChat);
              setUnreadChatCount(0);
            }}
            className={`p-2 border rounded-xl transition-colors cursor-pointer relative h-auto ${
              showChat
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
            }`}
            title="Chat"
          >
            <Comment className="w-4 h-4" />
            {unreadChatCount > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2 bg-neutral-800 hover:bg-rose-500/20 border border-neutral-700 hover:border-rose-500/40 rounded-xl text-neutral-300 hover:text-rose-300 transition-colors cursor-pointer h-auto"
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
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 max-w-md w-full"
          >
            <Alert
              status={alertBanner.type === "danger" ? "danger" : alertBanner.type === "warning" ? "warning" : "success"}
              className="py-2 px-3 rounded-2xl shadow-xl font-bold text-xs md:text-sm text-center"
            >
              {alertBanner.message}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          MAIN GAME TABLE ARENA (Compact Height)
      ===================================================== */}
      <main className="relative flex-1 flex flex-col justify-between items-center px-2 sm:px-4 md:px-6 pt-1 pb-0.5 z-10 overflow-hidden">
        {/* Opponents Area (Compact Horizontal Row) */}
        <div className="w-full max-w-5xl flex items-center justify-center gap-2 md:gap-3 py-0.5 overflow-x-auto scrollbar-none">
          {otherPlayers.map((p) => {
            const isTurn = gameState?.currentTurnPlayerId === p.id;
            const gradient = getUserGradient(p.id);
            const isUnoDanger = p.cardCount === 1 && !p.calledUno;
            const playerReaction = activeReactions.find((r) => r.senderId === p.id);

            return (
              <div
                key={p.id}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-2 py-1 md:py-1.5 rounded-2xl border transition-all ${
                  isTurn
                    ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                    : "bg-neutral-900/90 border-neutral-800"
                }`}
              >
                <AnimatePresence>
                  {playerReaction && (
                    <motion.div
                      initial={{ scale: 0, y: 5 }}
                      animate={{ scale: 1.2, y: -24 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-xl bg-neutral-900 border border-white/20 text-lg shadow-xl"
                    >
                      {playerReaction.emoji}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-inner"
                  style={{ background: gradient }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-neutral-200 max-w-[70px] md:max-w-[95px] truncate">
                      {p.username}
                    </span>
                    {p.isBot && (
                      <span className="px-1 py-0.2 rounded bg-neutral-800 text-[8px] text-neutral-400 font-bold">BOT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-semibold">
                    <span>{p.cardCount} cards</span>
                    {isTurn && (
                      <span className="text-amber-400 text-[9px] font-bold">Thinking</span>
                    )}
                    {p.calledUno && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black text-[8px]">
                        UNO!
                      </span>
                    )}
                  </div>
                </div>

                {isUnoDanger && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleCatchUno(p.id)}
                    className="ml-0.5 px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[9px] font-black tracking-wider uppercase shadow-md cursor-pointer h-auto"
                  >
                    🚨 Catch
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Turn Guidance Pill */}
        <div className="w-full flex items-center justify-center my-0.5">
          <Chip
            size="sm"
            className={`px-3 py-0.5 text-[11px] font-bold border ${
              isMyTurn
                ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400"
            }`}
          >
            {isMyTurn
              ? hasPlayableCard
                ? "👉 Play a matching card from your hand"
                : "👉 No matching cards! Tap the Draw Deck"
              : `Waiting for ${gameState?.currentTurnUsername || "opponent"}...`}
          </Chip>
        </div>

        {/* Center Table Arena (Draw Deck + Discard Pile) */}
        <div className="relative flex items-center justify-center gap-6 sm:gap-10 md:gap-14 my-auto py-1">
          {/* Draw Deck */}
          <div className="flex flex-col items-center gap-1">
            <div
              onClick={handleDraw}
              className={`relative cursor-pointer transition-transform active:scale-95 ${
                isMyTurn && !hasPlayableCard
                  ? "ring-4 ring-emerald-400/80 rounded-2xl shadow-[0_0_18px_rgba(16,185,129,0.5)]"
                  : isMyTurn
                  ? "ring-2 ring-emerald-400/50 rounded-2xl"
                  : ""
              }`}
            >
              <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl bg-neutral-900 border border-neutral-700 opacity-60" />
              <UnoCard isFaceDown size="md" />
            </div>
            <span className="text-[10px] md:text-[11px] font-bold text-neutral-300">
              Draw Deck ({gameState.deckRemaining ?? 108})
            </span>
          </div>

          {/* Active Discard Pile */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <UnoCard card={gameState.topCard} size="md" />
              {discardImpact && (
                <div
                  key={discardImpact.timestamp}
                  className={`absolute inset-0 rounded-2xl border-2 pointer-events-none animate-ping ${
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
            </div>
            <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-neutral-300">
              <span>Color:</span>
              <span className={`w-3 h-3 rounded-full ${activeColorBg} shadow-sm`} />
              <span className="capitalize font-black text-white">{activeColor}</span>
            </div>
          </div>
        </div>

        {/* =====================================================
            BOTTOM AREA: PLAYER HAND & ACTION BAR
        ===================================================== */}
        <div className="w-full max-w-5xl flex flex-col items-center gap-1 z-20 pb-0.5">
          <AnimatePresence>
            {selfReaction && (
              <motion.div
                initial={{ scale: 0, y: 5 }}
                animate={{ scale: 1.3, y: -20 }}
                exit={{ scale: 0 }}
                className="px-2.5 py-0.5 rounded-xl bg-neutral-900 border border-white/20 text-xl shadow-xl"
              >
                {selfReaction.emoji}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar (Quick Emojis + UNO Button + Pass) */}
          <div className="w-full flex items-center justify-between gap-2 px-2">
            {/* Quick Emoji Reactions */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none max-w-[170px] sm:max-w-none">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReaction(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs md:text-sm active:scale-125 transition-transform cursor-pointer shadow-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Tactical 3D UNO Button & Pass Turn Button */}
            <div className="flex items-center gap-2">
              {isMyTurn && gameState?.hasDrawnThisTurn && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handlePass}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md cursor-pointer h-auto"
                >
                  Pass Turn
                </Button>
              )}

              {/* 3D Tactile UNO Calling Button */}
              <Button
                type="button"
                variant={myPlayer?.calledUno ? "secondary" : "primary"}
                onClick={handleCallUno}
                className={`relative px-4 sm:px-6 py-2 rounded-xl font-black text-xs md:text-sm tracking-wider uppercase select-none transition-all cursor-pointer h-auto ${
                  myPlayer?.calledUno
                    ? "bg-emerald-600 text-white border border-emerald-400 shadow-[0_3px_0_#065f46]"
                    : isUnoActive
                    ? "bg-gradient-to-b from-red-500 via-rose-600 to-red-700 text-white border-2 border-amber-300 ring-4 ring-amber-400/50 shadow-[0_4px_0_#991b1b,0_8px_16px_rgba(239,68,68,0.5)] animate-pulse"
                    : "bg-neutral-800 hover:bg-neutral-750 text-neutral-400 border border-neutral-700 shadow-[0_3px_0_#262626]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {myPlayer?.calledUno ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>UNO CALLED!</span>
                    </>
                  ) : (
                    <>
                      <Flame className={`w-3.5 h-3.5 ${isUnoActive ? "text-amber-300" : "text-neutral-500"}`} />
                      <span>SHOUT UNO!</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* =====================================================
              CARDS HAND: 2-LAYERED ON MOBILE FOR EASY PICKING
          ===================================================== */}
          <div className="w-full flex flex-col items-center justify-center overflow-x-auto overflow-y-visible pt-1 pb-1 px-1 sm:px-4 scrollbar-none touch-manipulation">
            {/* Mobile View: 2-Layered Staggered Hand when > 5 cards */}
            {myCards.length > 5 ? (
              <>
                {/* Mobile View (2 Layers) */}
                <div className="flex flex-col items-center w-full sm:hidden">
                  {/* Top Layer (Back Row) */}
                  <div className="flex items-center justify-center -space-x-3.5 py-0.5 z-10">
                    {topLayerCards.map((card, index) => {
                      const playable = isCardPlayable(card);
                      return (
                        <div
                          key={card.id || `top-${index}`}
                          style={{
                            transform: playable && isMyTurn ? "translateY(-4px)" : "translateY(0)",
                          }}
                          className="relative flex-shrink-0 transition-transform duration-150"
                        >
                          <UnoCard
                            card={card}
                            size="md"
                            isPlayable={playable}
                            onClick={() => handleCardClick(card)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Layer (Front Row - Staggered Overlap) */}
                  <div className="flex items-center justify-center -space-x-3.5 -mt-3.5 py-0.5 z-20">
                    {bottomLayerCards.map((card, index) => {
                      const playable = isCardPlayable(card);
                      return (
                        <div
                          key={card.id || `bot-${index}`}
                          style={{
                            transform: playable && isMyTurn ? "translateY(-4px)" : "translateY(0)",
                          }}
                          className="relative flex-shrink-0 transition-transform duration-150"
                        >
                          <UnoCard
                            card={card}
                            size="md"
                            isPlayable={playable}
                            onClick={() => handleCardClick(card)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop View (Single Large Smooth Row) */}
                <div className="hidden sm:flex items-center justify-center -space-x-5 md:-space-x-7 lg:-space-x-8 py-0.5">
                  {myCards.map((card, index) => {
                    const playable = isCardPlayable(card);
                    return (
                      <div
                        key={card.id || index}
                        style={{
                          transform: playable && isMyTurn ? "translateY(-4px)" : "translateY(0)",
                        }}
                        className="relative z-10 hover:z-40 flex-shrink-0 transition-transform duration-150"
                      >
                        <UnoCard
                          card={card}
                          size="md"
                          isPlayable={playable}
                          onClick={() => handleCardClick(card)}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Single Row (when <= 5 cards) */
              <div className="flex items-center justify-center -space-x-3.5 sm:-space-x-6 md:-space-x-8 py-0.5">
                {myCards.map((card, index) => {
                  const playable = isCardPlayable(card);
                  return (
                    <div
                      key={card.id || index}
                      style={{
                        transform: playable && isMyTurn ? "translateY(-4px)" : "translateY(0)",
                      }}
                      className="relative z-10 hover:z-40 flex-shrink-0 transition-transform duration-150"
                    >
                      <UnoCard
                        card={card}
                        size="md"
                        isPlayable={playable}
                        onClick={() => handleCardClick(card)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
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
            <Surface className="bg-neutral-900 border border-neutral-700/80 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-center">
              <Typography.Heading level={3} className="text-lg font-black text-white mb-1">
                Choose Color
              </Typography.Heading>
              <Typography className="text-xs text-neutral-400 mb-5">
                Pick the active color for the table
              </Typography>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleColorSelected(opt.name)}
                    className={`py-3.5 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform cursor-pointer ${opt.bg}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedWildCard(null)}
                className="w-full py-2 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer h-auto"
              >
                Cancel
              </Button>
            </Surface>
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-11 bottom-0 right-0 w-full sm:w-80 bg-neutral-900/95 backdrop-blur-xl border-l border-neutral-800 z-40 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Comment className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-neutral-200">Table Chat</span>
              </div>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setShowChat(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold p-1 cursor-pointer h-auto"
              >
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
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
                        className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] break-words ${
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

            <form onSubmit={handleSendChat} className="p-2.5 border-t border-neutral-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={120}
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer h-auto"
              >
                Send
              </Button>
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <Surface className="bg-neutral-900 border border-neutral-700 p-6 md:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                🏆
              </div>

              <Typography.Heading level={2} className="text-2xl font-black text-white mb-1">
                {gameState.winner.id === user?.id ? "VICTORY!" : "GAME OVER"}
              </Typography.Heading>

              <Typography className="text-sm font-semibold text-neutral-300 mb-6">
                🎉 <span className="font-bold text-amber-400">{gameState.winner.username}</span> won the match!
              </Typography>

              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  onClick={handleRestartToLobby}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl cursor-pointer h-auto"
                >
                  Play Again / Return to Lobby
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/")}
                  className="w-full py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs border border-neutral-700 cursor-pointer h-auto"
                >
                  Exit to Main Menu
                </Button>
              </div>
            </Surface>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}