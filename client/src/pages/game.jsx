import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Card, Chip, Typography } from "@heroui/react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import UnoCard from "../components/UnoCard";
import { getUserGradient } from "../Gradient/gradient";
import confetti from "canvas-confetti";
import {
  ArrowRightFromSquare,
  ArrowRotateLeft,
  ArrowRotateRight,
  Bell,
  Check,
  Comment,
  Cup,
  FaceSmile,
  PaperPlane,
  Sparkles,
} from "@gravity-ui/icons";

const COLOR_OPTIONS = [
  { name: "red", bg: "bg-red-500 hover:bg-red-600 ring-red-400", label: "Red" },
  { name: "blue", bg: "bg-blue-500 hover:bg-blue-600 ring-blue-400", label: "Blue" },
  { name: "green", bg: "bg-emerald-500 hover:bg-emerald-600 ring-emerald-400", label: "Green" },
  { name: "yellow", bg: "bg-amber-400 hover:bg-amber-500 ring-amber-300", label: "Yellow" },
];

const QUICK_EMOJIS = ["😂", "🔥", "👏", "💀", "😱", "🤬", "🃏", "🎯", "🎉", "⚡"];

export default function GamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : "";

  const [gameState, setGameState] = useState(null);
  const [selectedWildCard, setSelectedWildCard] = useState(null);
  const [alertBanner, setAlertBanner] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeReactions, setActiveReactions] = useState([]); // { id, senderId, sender, emoji, time }
  const [floatingParticles, setFloatingParticles] = useState([]); // Array of rising floating emojis

  // Card Animation States
  const [isShuffling, setIsShuffling] = useState(true);
  const [flyingCards, setFlyingCards] = useState([]); // { id, type: 'draw' | 'play', card, from, to }
  const [discardImpact, setDiscardImpact] = useState(null); // { color, timestamp }
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [topCardRotation, setTopCardRotation] = useState(0);

  const chatEndRef = useRef(null);
  const prevTopCardRef = useRef(null);
  const prevCardCountRef = useRef(null);
  const isMyTurn = gameState?.currentTurnPlayerId === user?.id;

  const triggerAlert = (message, type = "info") => {
    setAlertBanner({ message, type });
    setTimeout(() => {
      setAlertBanner(null);
    }, 4000);
  };

  // Trigger Shuffle Animation sequence
  const triggerShuffleSequence = useCallback(() => {
    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
    }, 2400);
  }, []);

  // Spawn multi-particle floating emoji stream
  const spawnFloatingEmojis = useCallback((emoji, senderId) => {
    const isSelf = senderId === user?.id;
    const particleCount = 6;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const baseLeft = isSelf ? 50 + (Math.random() * 20 - 10) : 30 + Math.random() * 40;
      return {
        id: `${Date.now()}-${Math.random()}-${i}`,
        emoji,
        left: baseLeft,
        driftX: (Math.random() - 0.5) * 160,
        driftY: -(180 + Math.random() * 240),
        duration: 1.8 + Math.random() * 0.8,
        scale: 0.9 + Math.random() * 0.7,
        rotation: (Math.random() - 0.5) * 60,
        delay: i * 0.08,
      };
    });

    setFloatingParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setFloatingParticles((prev) =>
        prev.filter((p) => !newParticles.some((np) => np.id === p.id))
      );
    }, 3200);
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !cleanCode || !user) return;

    // Join room emit
    socket.emit("join_room", {
      roomCode: cleanCode,
      user: { id: user.id, username: user.username },
    });

    // Start opening shuffle animation
    triggerShuffleSequence();

    const handlePlayerState = (state) => {
      setGameState(state);
    };

    const handleGameUpdate = (update) => {
      // Check if top card changed (card was played)
      if (update?.topCard && prevTopCardRef.current && update.topCard.id !== prevTopCardRef.current.id) {
        setDiscardImpact({
          color: update.topCard.color || "red",
          timestamp: Date.now(),
        });
      }
      if (update?.topCard && prevTopCardRef.current?.id !== update.topCard.id) {
        setTopCardRotation((Math.random() - 0.5) * 10);
      }
      prevTopCardRef.current = update?.topCard;

      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...update,
          players: update.players.map((p) => ({
            ...p,
            cards: p.id === user.id ? prev.players?.find((old) => old.id === user.id)?.cards || [] : undefined,
          })),
        };
      });
    };

    const handleUnoCalled = ({ username }) => {
      triggerAlert(`📢 ${username} CALLED UNO! 🚨`, "warning");
    };

    const handleUnoCaught = ({ catcher, target }) => {
      triggerAlert(`🚨 ${catcher} caught ${target} not saying UNO! (+2 Cards)`, "danger");
    };

    const handleGameOver = ({ winner }) => {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
      triggerAlert(`🎉 ${winner.username} won the match!`, "success");
    };

    const handleReturnedToLobby = () => {
      navigate(`/lobby/${cleanCode}`);
    };

    const handleError = (msg) => {
      triggerAlert(msg, "danger");
    };

    const handleChatMessage = (msg) => {
      setChatMessages((prev) => [...prev.slice(-30), msg]);
    };

    const handlePlayerReaction = (reaction) => {
      setActiveReactions((prev) => [...prev, reaction]);
      spawnFloatingEmojis(reaction.emoji, reaction.senderId);

      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
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
  }, [socket, connected, cleanCode, user, navigate, spawnFloatingEmojis, triggerShuffleSequence]);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  const myPlayer = gameState?.players?.find((p) => p.id === user?.id);
  const myCards = myPlayer?.cards || [];
  const otherPlayers = gameState?.players?.filter((p) => p.id !== user?.id) || [];
  const selfReaction = activeReactions.find((r) => r.senderId === user?.id);

  // Monitor hand count to trigger draw animation
  useEffect(() => {
    if (prevCardCountRef.current !== null && myCards.length > prevCardCountRef.current) {
      // Card was added to hand - trigger draw animation
      const newlyDrawnCard = myCards[myCards.length - 1];
      const animId = `draw-${Date.now()}`;
      setFlyingCards((prev) => [
        ...prev,
        {
          id: animId,
          type: "draw",
          card: newlyDrawnCard,
        },
      ]);

      setTimeout(() => {
        setFlyingCards((prev) => prev.filter((c) => c.id !== animId));
      }, 700);
    }
    prevCardCountRef.current = myCards.length;
  }, [myCards]);

  const isCardPlayable = (card) => {
    if (!isMyTurn || !card || !gameState?.topCard) return false;
    if (card.color === "wild" || card.value === "wild" || card.value === "wild4") {
      return true;
    }
    const activeColor = gameState.activeColor || gameState.topCard.color;
    return card.color === activeColor || card.value === gameState.topCard.value;
  };

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
      // Trigger playing card flight animation
      const playAnimId = `play-${card.id}-${Date.now()}`;
      setFlyingCards((prev) => [
        ...prev,
        {
          id: playAnimId,
          type: "play",
          card,
        },
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
      {
        id: playAnimId,
        type: "play",
        card: selectedWildCard,
      },
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

  const activeColorGlow = {
    red: "shadow-[0_0_60px_rgba(239,68,68,0.5)] border-red-500",
    blue: "shadow-[0_0_60px_rgba(59,130,246,0.5)] border-blue-500",
    green: "shadow-[0_0_60px_rgba(16,185,129,0.5)] border-emerald-500",
    yellow: "shadow-[0_0_60px_rgba(234,179,8,0.5)] border-amber-400",
  }[gameState?.activeColor || "red"];

  if (!gameState) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black text-sm mb-4 shadow-lg animate-pulse">
          UNO
        </div>
        <Typography.Heading level={2} className="text-xl font-bold">
          Loading Match Room #{cleanCode}...
        </Typography.Heading>
        <Typography className="text-sm text-neutral-400 mt-2">
          Connecting to game server
        </Typography>
        <Button
          variant="secondary"
          onClick={() => navigate(`/lobby/${cleanCode}`)}
          className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
        >
          Return to Lobby
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#060608] text-white overflow-hidden flex flex-col select-none">
      {/* Ambient game-table lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: ["-10%", "10%", "-10%"],
            y: ["-5%", "8%", "-5%"],
            scale: [1, 1.12, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-red-600/10 blur-[120px]"
        />
        <motion.div
          animate={{
            x: ["10%", "-8%", "10%"],
            y: ["5%", "-5%", "5%"],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-180px] right-[-120px] w-[500px] h-[400px] rounded-full bg-blue-600/10 blur-[110px]"
        />
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>
      {/* Premium Deck Shuffle Intro */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-[80] pointer-events-none"
          >
            <div className="relative flex flex-col items-center justify-center">
              {/* Soft table spotlight */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.18, 0.32, 0.18],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-72 h-72 rounded-full bg-white/10 blur-3xl"
              />

              {/* Center deck */}
              <div className="relative w-32 h-44 md:w-36 md:h-48">
                {[0, 1, 2, 3, 4].map((layer) => (
                  <motion.div
                    key={layer}
                    className="absolute inset-0"
                    initial={{ x: 0, y: 0, rotate: 0, scale: 0.96 }}
                    animate={{
                      x: [
                        0,
                        layer % 2 === 0 ? -20 : 20,
                        layer % 2 === 0 ? 18 : -18,
                        0,
                      ],
                      y: [
                        0,
                        -8 + layer,
                        5 - layer,
                        0,
                      ],
                      rotate: [
                        0,
                        layer % 2 === 0 ? -7 : 7,
                        layer % 2 === 0 ? 5 : -5,
                        0,
                      ],
                      scale: [0.96, 1, 1.01, 0.96],
                    }}
                    transition={{
                      duration: 0.95,
                      repeat: 2,
                      delay: layer * 0.06,
                      ease: "easeInOut",
                    }}
                  >
                    <UnoCard isFaceDown size="lg" />
                  </motion.div>
                ))}

                {/* Deck center highlight */}
                <motion.div
                  animate={{
                    opacity: [0.15, 0.65, 0.15],
                    scale: [0.9, 1.05, 0.9],
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-[-10px] rounded-[2rem] border border-white/30 pointer-events-none"
                />
              </div>

              {/* Shuffle progress */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 border border-white/10 shadow-2xl"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-amber-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.45, 1, 0.45],
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-sm font-bold tracking-wide text-neutral-200">
                    Shuffling deck
                  </span>
                  <span className="flex gap-0.5 text-neutral-500">
                    <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}>
                      .
                    </motion.span>
                    <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}>
                      .
                    </motion.span>
                    <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}>
                      .
                    </motion.span>
                  </span>
                </motion.div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 210 }}
                  transition={{ duration: 2.25, ease: "easeInOut" }}
                  className="h-1 rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-yellow-300 to-blue-500 shadow-lg"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Cards Animation Layer (Drawing & Playing Cards) */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {flyingCards.map((fc) => {
          if (fc.type === "draw") {
            // Card swoops from Deck to Bottom Hand
            return (
              <motion.div
                key={fc.id}
                initial={{
                  top: "45%",
                  left: "38%",
                  scale: 0.8,
                  rotateY: 180,
                  rotateZ: 20,
                  opacity: 0.9,
                }}
                animate={{
                  top: "84%",
                  left: "50%",
                  scale: [0.8, 1.25, 1],
                  rotateY: [180, 90, 0],
                  rotateZ: [20, -10, 0],
                  opacity: 1,
                }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 shadow-2xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              >
                <UnoCard card={fc.card} size="md" />
              </motion.div>
            );
          }

          if (fc.type === "play") {
            // Card swoops from Bottom Hand to Center Discard Pile
            return (
              <motion.div
                key={fc.id}
                initial={{
                  top: "82%",
                  left: "50%",
                  scale: 1,
                  rotateZ: 0,
                  opacity: 1,
                }}
                animate={{
                  top: "45%",
                  left: "58%",
                  scale: [1, 1.3, 1],
                  rotateZ: [0, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 8],
                  opacity: 1,
                }}
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
            initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.4, p.scale * 1.3, p.scale, p.scale * 0.8],
              x: [0, p.driftX * 0.4, p.driftX],
              y: [0, p.driftY * 0.6, p.driftY],
              rotate: [0, p.rotation, -p.rotation * 0.5],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              bottom: "22%",
            }}
            className="text-3xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] select-none"
          >
            {p.emoji}
          </motion.div>
        ))}
      </div>

      {/* Top HUD Bar */}
      <header className="relative flex justify-between items-center px-4 md:px-6 py-2.5 border-b border-white/10 bg-neutral-950/75 backdrop-blur-xl z-20 shadow-[0_10px_35px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center font-black text-xs shadow-md">
            UNO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-200">Room #{cleanCode}</span>
              <Chip size="sm" className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400">
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
          </div>
        </div>

        {/* Turn Status Pill & HUD Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            animate={isMyTurn ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-2xl border text-xs md:text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all ${isMyTurn
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30"
              : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300"
              }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? "bg-emerald-400 animate-ping" : "bg-neutral-500"
                }`}
            />
            <span>
              {isMyTurn ? "YOUR TURN!" : `${gameState?.currentTurnUsername || "Waiting"}'s Turn`}
            </span>
          </motion.div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={triggerShuffleSequence}
            className="p-2 border rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-amber-300 transition-colors cursor-pointer"
            title="Reshuffle Deck Animation"
          >
            <Sparkles className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={showChat ? "primary" : "secondary"}
            size="sm"
            onClick={() => { setShowChat(!showChat); setShowLogs(false); }}
            className={`p-2 border rounded-xl transition-colors cursor-pointer relative ${showChat
              ? "bg-blue-600 border-blue-500 text-white"
              : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
              }`}
            title="Chat"
          >
            <Comment className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={showLogs ? "primary" : "secondary"}
            size="sm"
            onClick={() => { setShowLogs(!showLogs); setShowChat(false); }}
            className={`p-2 border rounded-xl transition-colors cursor-pointer ${showLogs
              ? "bg-amber-600 border-amber-500 text-white"
              : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
              }`}
            title="Game Events"
          >
            <Bell className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => navigate(`/`)}
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className={`px-5 py-2.5 rounded-2xl shadow-2xl border font-bold text-sm flex items-center gap-2 backdrop-blur-md ${alertBanner.type === "danger"
                ? "bg-rose-950/95 border-rose-500 text-rose-200"
                : alertBanner.type === "warning"
                  ? "bg-amber-950/95 border-amber-500 text-amber-200 animate-bounce"
                  : "bg-emerald-950/95 border-emerald-500 text-emerald-200"
                }`}
            >
              <span>{alertBanner.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Arena Table */}
      <div className="pointer-events-none absolute inset-x-4 top-16 bottom-36 rounded-[3rem] border border-white/[0.035] bg-white/[0.012] shadow-[inset_0_0_100px_rgba(255,255,255,0.015)]" />
      <main className="relative flex-1 flex flex-col items-center px-3 md:px-5 pt-2 pb-1 z-10">
        {/* Opponents Top/Side Area */}
        <div className="w-full max-w-5xl flex flex-wrap items-center justify-center gap-2.5 md:gap-4 py-3">
          {otherPlayers.map((p) => {
            const isTurn = gameState?.currentTurnPlayerId === p.id;
            const gradient = getUserGradient(p.id);
            const isUnoDanger = p.cardCount === 1 && !p.calledUno;
            const playerReaction = activeReactions.find((r) => r.senderId === p.id);

            return (
              <motion.div
                key={p.id}
                animate={
                  isTurn
                    ? {
                      scale: [1, 1.035, 1],
                      y: [0, -2, 0],
                    }
                    : { scale: 1, y: 0 }
                }
                transition={
                  isTurn
                    ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
                className={`relative flex items-center gap-3 px-3.5 py-2 rounded-2xl border transition-all ${isTurn
                  ? "bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-xl"
                  : "bg-neutral-900/70 border-neutral-800/90"
                  }`}
              >
                {/* Floating 3D Animated Reaction Bubble for Opponent */}
                <AnimatePresence>
                  {playerReaction && (
                    <motion.div
                      initial={{ scale: 0, y: 15, rotate: -15, opacity: 0 }}
                      animate={{
                        scale: [0, 1.45, 0.95, 1.1, 1],
                        y: -36,
                        rotate: [-15, 12, -8, 4, 0],
                        opacity: 1,
                      }}
                      exit={{ scale: 0.4, y: -50, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 15 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900/95 border-2 border-amber-400 px-3 py-1 rounded-2xl text-2xl shadow-[0_0_25px_rgba(245,158,11,0.6)] z-30 pointer-events-none flex items-center gap-1 animate-pulse"
                    >
                      <span className="inline-block animate-bounce">{playerReaction.emoji}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md"
                    style={{ background: gradient }}
                  >
                    {p.username.slice(0, 2).toUpperCase()}
                  </div>
                  {p.calledUno && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.2 bg-rose-600 text-white font-black text-[9px] rounded-full border border-white shadow animate-bounce">
                      UNO!
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-neutral-200 max-w-[100px] truncate">
                      {p.username}
                    </span>
                    {p.isBot && <Chip size="sm" className="text-[10px] text-blue-400 font-semibold px-1 py-0 bg-blue-500/10">🤖</Chip>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-400 font-medium">
                      {p.cardCount} {p.cardCount === 1 ? "Card" : "Cards"}
                    </span>
                    <div className="flex -space-x-1">
                      {Array.from({ length: Math.min(p.cardCount, 5) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-3.5 rounded-[2px] bg-neutral-700 border border-neutral-500 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {isUnoDanger && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleCatchUno(p.id)}
                    className="ml-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md animate-pulse cursor-pointer h-auto"
                    title="Catch player who didn't say UNO!"
                  >
                    Catch!
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Center Game Arena: Draw Pile & Discard Pile */}
        <div className="relative flex-1 min-h-[290px] w-full flex items-center justify-center gap-9 md:gap-16 py-6 px-6"
          style={{ perspective: 1200 }}>
          <div
            className={`absolute -inset-16 rounded-full opacity-20 blur-[70px] transition-all duration-700 ${gameState?.activeColor === "red"
              ? "bg-red-500"
              : gameState?.activeColor === "blue"
                ? "bg-blue-500"
                : gameState?.activeColor === "green"
                  ? "bg-emerald-500"
                  : "bg-amber-400"
              }`}
          />

          {/* Draw Pile (Face Down Deck) with Click to Draw animation */}
          <div className="flex flex-col items-center gap-2 z-10">
            <motion.div
              whileHover={isMyTurn && !gameState?.hasDrawnThisTurn ? { scale: 1.06, y: -4 } : {}}
              whileTap={isMyTurn && !gameState?.hasDrawnThisTurn ? { scale: 0.94 } : {}}
              className={`relative group ${isMyTurn && !gameState?.hasDrawnThisTurn ? "cursor-pointer" : "cursor-default"}`}
              onClick={isMyTurn && !gameState?.hasDrawnThisTurn ? handleDraw : undefined}
            >
              <motion.div
                animate={isMyTurn && !gameState?.hasDrawnThisTurn
                  ? { rotate: [2, 4, 2], y: [0, -2, 0] }
                  : { rotate: 2, y: 0 }}
                transition={{ duration: 1.4, repeat: isMyTurn && !gameState?.hasDrawnThisTurn ? Infinity : 0 }}
                className="absolute -top-1 -left-1 w-22 h-32 rounded-2xl bg-neutral-800 border border-neutral-700 shadow-lg"
              />
              <motion.div
                animate={isMyTurn && !gameState?.hasDrawnThisTurn
                  ? { rotate: [-1, -3, -1], y: [0, -1, 0] }
                  : { rotate: -1, y: 0 }}
                transition={{ duration: 1.2, repeat: isMyTurn && !gameState?.hasDrawnThisTurn ? Infinity : 0 }}
                className="absolute -top-0.5 -left-0.5 w-22 h-32 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-lg"
              />

              <UnoCard
                isFaceDown
                size="md"
                className={`relative z-10 transition-transform ${isMyTurn && !gameState?.hasDrawnThisTurn
                  ? "ring-2 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse"
                  : "opacity-90"
                  }`}
              />
            </motion.div>
            <span className="text-xs font-semibold text-neutral-400">
              Draw Pile ({gameState?.deckRemaining || 0})
            </span>
          </div>

          {/* Active Discard Pile (Top Card) with Motion Throw & Impact Shockwave */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="relative">
              {/* Discard Card Impact Shockwave Ring */}
              <AnimatePresence>
                {discardImpact && (
                  <motion.div
                    key={discardImpact.timestamp}
                    initial={{ scale: 0.8, opacity: 0.9 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute -inset-4 rounded-3xl border-2 border-white pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div
                className={`absolute -inset-3 rounded-3xl border-2 ${activeColorGlow} transition-all duration-500 pointer-events-none`}
              />

              <AnimatePresence mode="popLayout">
                {gameState?.topCard ? (
                  <motion.div
                    key={`${gameState.topCard.id}-${gameState.topCard.color}-${gameState.topCard.value}`}
                    initial={{ scale: 1.35, rotate: (Math.random() - 0.5) * 25, opacity: 0.7 }}
                    animate={{ scale: 1, rotate: (Math.random() - 0.5) * 6, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                  >
                    <UnoCard card={gameState.topCard} size="md" />
                  </motion.div>
                ) : (
                  <div className="w-22 h-32 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-neutral-500">
                    Empty
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold capitalize">
              <span
                className={`w-2.5 h-2.5 rounded-full ${gameState?.activeColor === "red"
                  ? "bg-red-500"
                  : gameState?.activeColor === "blue"
                    ? "bg-blue-500"
                    : gameState?.activeColor === "green"
                      ? "bg-emerald-500"
                      : "bg-amber-400"
                  }`}
              />
              <span className="text-neutral-300">
                Active Color: {gameState?.activeColor || gameState?.topCard?.color || "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Super Animated Quick Reactions Bar */}
        <div className="relative flex items-center gap-1.5 py-1.5 px-3 bg-neutral-900/85 backdrop-blur-xl rounded-2xl border border-white/10 z-20 shadow-2xl">
          <FaceSmile className="w-4 h-4 text-amber-400 mr-1 animate-pulse" />
          {QUICK_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{
                scale: 1.45,
                rotate: [0, -10, 10, -5, 0],
                transition: { duration: 0.3 },
              }}
              whileTap={{ scale: 0.75, rotate: 15 }}
              onClick={() => handleSendReaction(emoji)}
              className="text-lg p-1.5 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer select-none filter hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
            >
              {emoji}
            </motion.button>
          ))}

          {/* Self Active Reaction Popover */}
          <AnimatePresence>
            {selfReaction && (
              <motion.div
                initial={{ scale: 0, y: 10, opacity: 0 }}
                animate={{
                  scale: [0, 1.4, 1],
                  y: -38,
                  opacity: 1,
                }}
                exit={{ scale: 0.5, y: -45, opacity: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600/95 text-white border border-blue-400 px-3 py-1 rounded-2xl text-2xl shadow-[0_0_20px_rgba(59,130,246,0.7)] pointer-events-none"
              >
                <span className="inline-block animate-bounce">{selfReaction.emoji}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player's Hand Controls & Fanned Cards */}
        <div className="relative w-full max-w-6xl flex flex-col items-center pb-2 pt-1 z-20">
          <div className="flex items-center justify-between gap-3 w-full px-2 md:px-4 mb-1.5">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={myPlayer?.calledUno ? "primary" : myCards.length === 1 ? "danger" : "secondary"}
                onClick={myCards.length === 1 && !myPlayer?.calledUno ? handleCallUno : undefined}
                disabled={myCards.length !== 1 && !myPlayer?.calledUno}
                className={`px-5 py-2 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-md flex items-center gap-2 h-auto ${myPlayer?.calledUno
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400 cursor-default"
                  : myCards.length === 1
                    ? "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white animate-pulse ring-2 ring-red-400 cursor-pointer shadow-red-500/30"
                    : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-60"
                  }`}
              >
                <span>UNO!</span>
                {myPlayer?.calledUno && <Check className="w-4 h-4 text-white" />}
              </Button>

              {myPlayer?.calledUno && (
                <Chip size="sm" className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20">
                  ✓ UNO Called Protected!
                </Chip>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isMyTurn && gameState?.hasDrawnThisTurn && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePass}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer h-auto"
                >
                  Pass Turn ➔
                </Button>
              )}

              {isMyTurn && !gameState?.hasDrawnThisTurn && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDraw}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer h-auto"
                >
                  + Draw Card
                </Button>
              )}

              <span className="text-xs font-semibold text-neutral-400">
                Your Hand: {myCards.length} {myCards.length === 1 ? "Card" : "Cards"}
              </span>
            </div>
          </div>

          {/* Friendly, easy-to-read interactive hand */}
          <div className="relative w-full max-w-6xl h-40 md:h-48 overflow-visible px-2 pb-2">
            <div
              className="relative mx-auto h-full w-full flex items-end justify-center px-2 md:px-4"
              style={{ paddingLeft: "max(8px, 3vw)", paddingRight: "max(8px, 3vw)" }}
            >
              <AnimatePresence initial={false}>
                {myCards.map((card, idx) => {
                  const playable = isCardPlayable(card);
                  const total = myCards.length;
                  const center = (total - 1) / 2;
                  const distance = idx - center;

                  // Keep the fan shallow so cards remain easy to read and tap.
                  const fanTilt =
                    total <= 6
                      ? distance * 2.2
                      : total <= 9
                        ? distance * 1.45
                        : total <= 12
                          ? distance * 0.95
                          : distance * 0.65;

                  const fanY =
                    Math.min(Math.abs(distance) * (total > 10 ? 0.8 : 1.2), 9);

                  const isHovered = hoveredCardId === card.id;

                  return (
                    <motion.div
                      key={card.id}
                      layout="position"
                      initial={{
                        opacity: 0,
                        y: 70,
                        scale: 0.88,
                        rotate: 0,
                      }}
                      animate={{
                        opacity: 1,
                        y: isHovered ? -18 : fanY,
                        scale: isHovered ? 1.045 : 1,
                        rotate: isHovered ? 0 : fanTilt,
                      }}
                      exit={{
                        opacity: 0,
                        y: -100,
                        scale: 0.82,
                        rotate: fanTilt,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 26,
                        mass: 0.8,
                      }}
                      onHoverStart={() => setHoveredCardId(card.id)}
                      onHoverEnd={() => setHoveredCardId(null)}
                      className="relative shrink-0 -mx-2 md:-mx-2.5 origin-bottom"
                      style={{
                        zIndex: isHovered ? 100 : idx,
                        touchAction: "manipulation",
                      }}
                    >
                      <UnoCard
                        card={card}
                        size="md"
                        isPlayable={playable}
                        tilt={0}
                        onClick={() => handleCardClick(card)}
                      />

                      {/* Subtle playable hint — no badge/text */}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Wild Color Picker Modal Overlay */}
      <AnimatePresence>
        {selectedWildCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.85, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 24 }}
              className="w-full max-w-sm"
            >
              <Card className="relative overflow-hidden bg-neutral-950/95 border border-white/10 rounded-[2rem] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.65)] text-center">
                <Typography.Heading level={3} className="text-xl font-black text-white mb-1">
                  Choose Wild Color
                </Typography.Heading>
                <Typography className="text-xs text-neutral-400 mb-6">
                  Select the active color that next players must follow.
                </Typography>

                <div className="grid grid-cols-2 gap-4">
                  {COLOR_OPTIONS.map((col) => (
                    <motion.div
                      key={col.name}
                      whileHover={{ scale: 1.06, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="button"
                        onClick={() => handleColorSelected(col.name)}
                        className={`${col.bg} text-white font-extrabold py-5 rounded-2xl text-base shadow-lg cursor-pointer ring-2 h-auto w-full`}
                      >
                        <span className="relative z-10">{col.label}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setSelectedWildCard(null)}
                  className="mt-6 text-xs text-neutral-400 hover:text-white underline cursor-pointer p-0 h-auto"
                >
                  Cancel Move
                </Button>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/20 via-yellow-400/10 to-blue-500/20 blur-3xl pointer-events-none"
                />
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live In-Game Chat Drawer */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="fixed bottom-20 right-6 w-84 max-h-[420px] h-[400px] bg-neutral-900/95 border border-neutral-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-40 flex flex-col text-left"
          >
            <div className="flex justify-between items-center pb-2.5 border-b border-neutral-800 text-xs font-bold text-neutral-200">
              <span className="flex items-center gap-1.5">
                <Comment className="w-3.5 h-3.5 text-blue-400" />
                <span>Live Match Chat</span>
              </span>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setShowChat(false)}
                className="text-neutral-400 hover:text-white cursor-pointer p-0 h-auto"
              >
                ✕
              </Button>
            </div>

            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs scrollbar-thin">
              {chatMessages.length === 0 ? (
                <p className="text-center text-neutral-500 text-[11px] py-8">
                  Say hello or send a quick reaction! 👋
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.senderId === user.id ? "items-end" : "items-start"
                      }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                      <span className="font-semibold">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words ${msg.senderId === user.id
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-neutral-800 text-neutral-200 rounded-bl-none"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input box */}
            <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-neutral-800">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={120}
                className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-colors h-auto"
              >
                <PaperPlane className="w-3.5 h-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Logs Drawer */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="fixed bottom-20 right-6 w-80 max-h-96 bg-neutral-900/95 border border-neutral-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-40 flex flex-col text-left"
          >
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800 text-xs font-bold text-neutral-300">
              <span>Match Event Log</span>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setShowLogs(false)}
                className="text-neutral-500 hover:text-white cursor-pointer p-0 h-auto"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 text-xs">
              {gameState?.logs?.map((log) => (
                <div key={log.id} className="text-neutral-300 leading-tight">
                  <span className="text-[10px] text-neutral-500 mr-1.5">[{log.time}]</span>
                  {log.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Modal */}
      {gameState?.winner && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative bg-neutral-950/95 border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-[0_30px_100px_rgba(0,0,0,0.7)] text-center space-y-6 overflow-hidden"
          >
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute left-1/2 top-8 -translate-x-1/2 w-36 h-36 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-lg shadow-amber-500/20">
              <Cup className="w-8 h-8" />
            </motion.div>

            <div>
              <Chip size="sm" className="text-xs uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20">
                Match Finished
              </Chip>
              <Typography.Heading level={2} className="text-3xl font-black text-white mt-2">
                {gameState.winner.username} Won! 🏆
              </Typography.Heading>
              <Typography className="text-sm text-neutral-400 mt-1">
                {gameState.winner.id === user?.id
                  ? "Outstanding victory! You emptied your hand first."
                  : "Good game! Better luck in the next round."}
              </Typography>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/")}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-300 font-bold rounded-2xl border border-neutral-700 transition-colors cursor-pointer h-auto"
              >
                Home
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleRestartToLobby}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-2xl shadow-md transition-colors cursor-pointer h-auto"
              >
                Play Again
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
