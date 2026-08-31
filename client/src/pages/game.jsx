import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@gravity-ui/icons";

const COLOR_OPTIONS = [
  { name: "red", bg: "bg-red-500 hover:bg-red-600 ring-red-400", label: "Red" },
  { name: "blue", bg: "bg-blue-500 hover:bg-blue-600 ring-blue-400", label: "Blue" },
  { name: "green", bg: "bg-emerald-500 hover:bg-emerald-600 ring-emerald-400", label: "Green" },
  { name: "yellow", bg: "bg-amber-400 hover:bg-amber-500 ring-amber-300", label: "Yellow" },
];

const QUICK_EMOJIS = ["😂", "🔥", "👏", "💀", "😱", "🤬", "🃏", "🎯"];

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
  const [activeReactions, setActiveReactions] = useState([]); // { id, senderId, emoji, time }

  const chatEndRef = useRef(null);
  const isMyTurn = gameState?.currentTurnPlayerId === user?.id;

  const triggerAlert = (message, type = "info") => {
    setAlertBanner({ message, type });
    setTimeout(() => {
      setAlertBanner(null);
    }, 4000);
  };

  useEffect(() => {
    if (!socket || !cleanCode || !user) return;

    // Join / Re-fetch room & player state
    socket.emit("join_room", {
      roomCode: cleanCode,
      user: { id: user.id, username: user.username },
    });

    const handlePlayerState = (state) => {
      setGameState(state);
    };

    const handleGameUpdate = (update) => {
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
        particleCount: 140,
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
  }, [socket, connected, cleanCode, user, navigate]);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  const myPlayer = gameState?.players?.find((p) => p.id === user?.id);
  const myCards = myPlayer?.cards || [];
  const otherPlayers = gameState?.players?.filter((p) => p.id !== user?.id) || [];

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
        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black text-sm mb-4 shadow-lg">
          UNO
        </div>
        <h2 className="text-xl font-bold">Loading Match Room #{cleanCode}...</h2>
        <p className="text-sm text-neutral-400 mt-2">Connecting to game server</p>
        <button
          onClick={() => navigate(`/lobby/${cleanCode}`)}
          className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden flex flex-col justify-between select-none">
      {/* Top HUD Bar */}
      <header className="flex justify-between items-center px-4 md:px-6 py-2.5 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center font-black text-xs shadow-md">
            UNO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-200">Room #{cleanCode}</span>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400">
                {gameState?.direction === 1 ? (
                  <>
                    <ArrowRotateRight className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Clockwise</span>
                  </>
                ) : (
                  <>
                    <ArrowRotateLeft className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                    <span>Counter-Clockwise</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Turn Status Pill */}
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            animate={isMyTurn ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-2xl border text-xs md:text-sm font-bold shadow-lg transition-all ${
              isMyTurn
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30"
                : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMyTurn ? "bg-emerald-400 animate-ping" : "bg-neutral-500"
              }`}
            />
            <span>
              {isMyTurn ? "YOUR TURN!" : `${gameState?.currentTurnUsername || "Waiting"}'s Turn`}
            </span>
          </motion.div>

          <button
            onClick={() => { setShowChat(!showChat); setShowLogs(false); }}
            className={`p-2 border rounded-xl transition-colors cursor-pointer relative ${
              showChat
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
            }`}
            title="Chat"
          >
            <Comment className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setShowLogs(!showLogs); setShowChat(false); }}
            className={`p-2 border rounded-xl transition-colors cursor-pointer ${
              showLogs
                ? "bg-amber-600 border-amber-500 text-white"
                : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
            }`}
            title="Game Events"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate(`/`)}
            className="p-2 bg-neutral-800/80 hover:bg-rose-500/20 border border-neutral-700 hover:border-rose-500/40 rounded-xl text-neutral-300 hover:text-rose-300 transition-colors cursor-pointer"
            title="Exit Game"
          >
            <ArrowRightFromSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Alert Notification */}
      <AnimatePresence>
        {alertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className={`px-5 py-2.5 rounded-2xl shadow-2xl border font-bold text-sm flex items-center gap-2 ${
                alertBanner.type === "danger"
                  ? "bg-rose-950/95 border-rose-500 text-rose-200"
                  : alertBanner.type === "warning"
                  ? "bg-amber-950/95 border-amber-500 text-amber-200"
                  : "bg-emerald-950/95 border-emerald-500 text-emerald-200"
              }`}
            >
              <span>{alertBanner.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Arena Table */}
      <main className="relative flex-1 flex flex-col justify-between items-center px-4 py-2">
        {/* Opponents Top/Side Area */}
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-center gap-3 md:gap-5 py-2">
          {otherPlayers.map((p) => {
            const isTurn = gameState?.currentTurnPlayerId === p.id;
            const gradient = getUserGradient(p.id);
            const isUnoDanger = p.cardCount === 1 && !p.calledUno;
            const playerReaction = activeReactions.find((r) => r.senderId === p.id);

            return (
              <motion.div
                key={p.id}
                animate={isTurn ? { scale: 1.05 } : { scale: 1 }}
                className={`relative flex items-center gap-3 px-3.5 py-2 rounded-2xl border transition-all ${
                  isTurn
                    ? "bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-xl"
                    : "bg-neutral-900/70 border-neutral-800/90"
                }`}
              >
                {/* Floating Reaction Bubble */}
                <AnimatePresence>
                  {playerReaction && (
                    <motion.div
                      initial={{ scale: 0, y: 10, opacity: 0 }}
                      animate={{ scale: 1.3, y: -28, opacity: 1 }}
                      exit={{ scale: 0.8, y: -40, opacity: 0 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 px-2 py-1 rounded-full text-xl shadow-2xl z-30 pointer-events-none"
                    >
                      {playerReaction.emoji}
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
                    {p.isBot && <span className="text-[10px] text-blue-400 font-semibold">🤖</span>}
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
                  <button
                    onClick={() => handleCatchUno(p.id)}
                    className="ml-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md animate-pulse cursor-pointer"
                    title="Catch player who didn't say UNO!"
                  >
                    Catch!
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Center Game Arena: Draw Pile & Discard Pile */}
        <div className="relative my-auto flex items-center justify-center gap-8 md:gap-14 py-4">
          <div
            className={`absolute -inset-12 rounded-full opacity-30 blur-3xl transition-all duration-700 ${
              gameState?.activeColor === "red"
                ? "bg-red-500"
                : gameState?.activeColor === "blue"
                ? "bg-blue-500"
                : gameState?.activeColor === "green"
                ? "bg-emerald-500"
                : "bg-amber-400"
            }`}
          />

          {/* Draw Pile (Face Down Deck) */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="relative group">
              <div className="absolute -top-1 -left-1 w-22 h-32 rounded-2xl bg-neutral-800 border border-neutral-700 rotate-2" />
              <div className="absolute -top-0.5 -left-0.5 w-22 h-32 rounded-2xl bg-neutral-850 border border-neutral-700 -rotate-1" />

              <UnoCard
                isFaceDown
                size="md"
                onClick={isMyTurn && !gameState?.hasDrawnThisTurn ? handleDraw : undefined}
                className={`relative z-10 transition-transform ${
                  isMyTurn && !gameState?.hasDrawnThisTurn
                    ? "cursor-pointer ring-2 ring-amber-400 shadow-2xl"
                    : "opacity-90"
                }`}
              />
            </div>
            <span className="text-xs font-semibold text-neutral-400">
              Draw Pile ({gameState?.deckRemaining || 0})
            </span>
          </div>

          {/* Active Discard Pile (Top Card) with Motion Throw */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="relative">
              <div
                className={`absolute -inset-3 rounded-3xl border-2 ${activeColorGlow} transition-all duration-500 pointer-events-none`}
              />

              <AnimatePresence mode="popLayout">
                {gameState?.topCard ? (
                  <motion.div
                    key={`${gameState.topCard.id}-${gameState.topCard.color}-${gameState.topCard.value}`}
                    initial={{ scale: 1.3, rotate: (Math.random() - 0.5) * 20, opacity: 0.8 }}
                    animate={{ scale: 1, rotate: (Math.random() - 0.5) * 6, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
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
                className={`w-2.5 h-2.5 rounded-full ${
                  gameState?.activeColor === "red"
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

        {/* Quick Reactions Bar */}
        <div className="flex items-center gap-2 py-1 px-3 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-800 z-20 shadow-lg">
          <FaceSmile className="w-3.5 h-3.5 text-neutral-400 mr-1" />
          {QUICK_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleSendReaction(emoji)}
              className="text-base p-1 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Player's Hand Controls & Fanned Cards */}
        <div className="w-full max-w-5xl flex flex-col items-center pb-3 z-20">
          <div className="flex items-center justify-between w-full px-4 mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={myCards.length === 1 && !myPlayer?.calledUno ? handleCallUno : undefined}
                disabled={myCards.length !== 1 && !myPlayer?.calledUno}
                className={`px-5 py-2 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-md flex items-center gap-2 ${
                  myPlayer?.calledUno
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400 cursor-default"
                    : myCards.length === 1
                    ? "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white animate-pulse ring-2 ring-red-400 cursor-pointer shadow-red-500/30"
                    : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-60"
                }`}
              >
                <span>UNO!</span>
                {myPlayer?.calledUno && <Check className="w-4 h-4 text-white" />}
              </button>

              {myPlayer?.calledUno && (
                <span className="text-xs text-emerald-400 font-semibold">
                  ✓ UNO Called Protected!
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isMyTurn && gameState?.hasDrawnThisTurn && (
                <button
                  onClick={handlePass}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Pass Turn ➔
                </button>
              )}

              {isMyTurn && !gameState?.hasDrawnThisTurn && (
                <button
                  onClick={handleDraw}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  + Draw Card
                </button>
              )}

              <span className="text-xs font-semibold text-neutral-400">
                Your Hand: {myCards.length} {myCards.length === 1 ? "Card" : "Cards"}
              </span>
            </div>
          </div>

          {/* Cards Dynamic Fanning Area */}
          <div className="w-full overflow-x-auto pb-4 pt-4 px-8 flex justify-start sm:justify-center items-end scrollbar-thin">
            <div className="flex items-end justify-center -space-x-4 sm:-space-x-5 py-2">
              {myCards.map((card, idx) => {
                const playable = isCardPlayable(card);
                const total = myCards.length;
                const mid = (total - 1) / 2;
                // Calculate subtle fan angle and curve
                const fanTilt = (idx - mid) * (total > 8 ? 2.5 : 3.5);
                const fanTranslateY = Math.abs(idx - mid) * (total > 8 ? 1.5 : 2.5);

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: fanTranslateY }}
                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="shrink-0 transition-all"
                    style={{ zIndex: idx }}
                  >
                    <UnoCard
                      card={card}
                      size="md"
                      isPlayable={playable}
                      tilt={fanTilt}
                      onClick={() => handleCardClick(card)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Wild Color Picker Modal Overlay */}
      {selectedWildCard && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-black text-white mb-1">Choose Wild Color</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Select the active color that next players must follow.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => handleColorSelected(col.name)}
                  className={`${col.bg} text-white font-extrabold py-5 rounded-2xl text-base shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ring-2`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedWildCard(null)}
              className="mt-6 text-xs text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Cancel Move
            </button>
          </div>
        </div>
      )}

      {/* Live In-Game Chat Drawer */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="fixed bottom-20 right-6 w-84 max-h-[420px] h-[400px] bg-neutral-900/95 border border-neutral-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-40 flex flex-col"
          >
            <div className="flex justify-between items-center pb-2.5 border-b border-neutral-800 text-xs font-bold text-neutral-200">
              <span className="flex items-center gap-1.5">
                <Comment className="w-3.5 h-3.5 text-blue-400" />
                <span>Live Match Chat</span>
              </span>
              <button
                onClick={() => setShowChat(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs scrollbar-thin">
              {chatMessages.length === 0 ? (
                <p className="text-center text-neutral-500 text-[11px] py-8">
                  Say hello or send a quick reaction!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderId === user.id ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                      <span className="font-semibold">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words ${
                        msg.senderId === user.id
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
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={120}
                className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-colors"
              >
                <PaperPlane className="w-3.5 h-3.5" />
              </button>
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
            className="fixed bottom-20 right-6 w-80 max-h-96 bg-neutral-900/95 border border-neutral-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-40 flex flex-col"
          >
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800 text-xs font-bold text-neutral-300">
              <span>Match Event Log</span>
              <button
                onClick={() => setShowLogs(false)}
                className="text-neutral-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-lg shadow-amber-500/20">
              <Cup className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Match Finished
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                {gameState.winner.username} Won!
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                {gameState.winner.id === user?.id
                  ? "Outstanding victory! You emptied your hand first."
                  : "Good game! Better luck in the next round."}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-300 font-bold rounded-2xl border border-neutral-700 transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={handleRestartToLobby}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

