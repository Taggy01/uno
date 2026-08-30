import React, { useEffect, useState } from "react";
import { Surface, Typography, Card, Avatar, Button } from "@heroui/react";
import { getUserGradient } from "../Gradient/gradient";
import { ArrowRightFromSquare, Copy, Check, Play, Plus, TrashBin, Comment, PaperPlane, Persons } from "@gravity-ui/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Lobby() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);

  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : "";

  // Initial HTTP fetch of room details
  useEffect(() => {
    if (!cleanCode) return;
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${cleanCode}`);
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
          if (data.room.status === "playing") {
            navigate(`/game/${cleanCode}`);
          }
        } else {
          setError(data.message || "Room not found. Check the code.");
        }
      } catch (err) {
        console.error("Failed to fetch room:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [cleanCode, navigate]);

  // Socket event setup
  useEffect(() => {
    if (!socket || !cleanCode || !user) return;

    // Join room emit
    const emitJoin = () => {
      socket.emit("join_room", {
        roomCode: cleanCode,
        user: { id: user.id, username: user.username },
      });
    };

    emitJoin();

    const handleJoined = ({ room: joinedRoom }) => {
      setRoom(joinedRoom);
      setError("");
      setLoading(false);
    };

    const handleRoomUpdated = (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === "playing") {
        navigate(`/game/${cleanCode}`);
      }
    };

    const handleGameStarted = () => {
      navigate(`/game/${cleanCode}`);
    };

    const handleError = (msg) => {
      setError(msg);
    };

    const handleChat = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on("joined_room_success", handleJoined);
    socket.on("room_updated", handleRoomUpdated);
    socket.on("game_started", handleGameStarted);
    socket.on("error_msg", handleError);
    socket.on("chat_message", handleChat);

    return () => {
      socket.off("joined_room_success", handleJoined);
      socket.off("room_updated", handleRoomUpdated);
      socket.off("game_started", handleGameStarted);
      socket.off("error_msg", handleError);
      socket.off("chat_message", handleChat);
    };
  }, [socket, connected, cleanCode, user, navigate]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddBot = () => {
    if (!socket || !room || !user) return;
    socket.emit("add_bot", { roomCode: cleanCode, userId: user.id });
  };

  const handleRemovePlayer = (targetId) => {
    if (!socket || !room || !user) return;
    socket.emit("remove_player", { roomCode: cleanCode, targetId, userId: user.id });
  };

  const handleStartGame = () => {
    if (!socket || !room || !user) return;
    if ((room?.players?.length || 0) < 2) {
      setError("Please add at least 1 AI Bot or invite a friend to start the match!");
      return;
    }
    socket.emit("start_game", { roomCode: cleanCode, userId: user.id });
  };

  const handleLeave = () => {
    if (socket && user) {
      socket.emit("leave_room", { userId: user.id });
    }
    navigate("/");
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !user) return;
    socket.emit("send_chat", {
      roomCode: cleanCode,
      message: chatInput.trim(),
      user: { id: user.id, username: user.username },
    });
    setChatInput("");
  };

  const isHost = room?.hostId === user?.id || (room?.players?.[0]?.id === user?.id);
  const playerCount = room?.players?.length || 0;
  const canStart = isHost && playerCount >= 2;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Lobby Panel */}
        <Surface className="lg:col-span-2 flex flex-col gap-4 rounded-3xl p-6 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Typography.Heading level={3} className="font-extrabold text-white">
                  {room?.name || `Room #${cleanCode}`}
                </Typography.Heading>
                {room?.isPrivate && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-semibold border border-neutral-700">
                    Private
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Share room code with friends to join the match.
              </p>
            </div>

            {/* Room Code Pill */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-2xl text-blue-400 font-mono font-bold text-base transition-colors active:scale-95 cursor-pointer shadow-sm"
              title="Click to copy room code"
            >
              <span>Code: #{cleanCode}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Player Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Persons className="w-4 h-4 text-blue-400" />
                Players ({playerCount}/{room?.maxPlayers || 4})
              </span>
              {isHost && playerCount < (room?.maxPlayers || 4) && (
                <button
                  onClick={handleAddBot}
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add AI Bot</span>
                </button>
              )}
            </div>

            {/* Empty Roster Loading */}
            {playerCount === 0 && loading ? (
              <div className="text-center py-8 text-neutral-400 text-sm animate-pulse">
                Connecting to room...
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room?.players?.map((p) => {
                const gradient = getUserGradient(p.id);
                const isMe = p.id === user?.id;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isMe
                        ? "bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/30"
                        : "bg-neutral-800/60 border-neutral-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={p.username}
                        className="w-10 h-10 text-sm font-bold text-white shadow-md shrink-0"
                        style={{ background: gradient }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm truncate">
                            {p.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.isHost && (
                            <span className="text-[10px] text-blue-400 font-semibold uppercase">
                              ★ Host
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[10px] text-blue-400 font-semibold">
                              🤖 AI Bot
                            </span>
                          )}
                          {!p.isHost && !p.isBot && (
                            <span className="text-[10px] text-neutral-400">Player</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHost && !isMe && (
                      <button
                        onClick={() => handleRemovePlayer(p.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove player"
                      >
                        <TrashBin className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hint when only 1 player */}
            {playerCount === 1 && (
              <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-xs text-neutral-300 flex items-center justify-between gap-2">
                <span>Waiting for another player or bot to start...</span>
                {isHost && (
                  <button
                    onClick={handleAddBot}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                  >
                    + Add Bot Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-neutral-800 mt-2">
            <button
              onClick={handleLeave}
              className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-300 font-bold rounded-2xl border border-neutral-700 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <ArrowRightFromSquare className="w-4 h-4 rotate-180" />
              <span>Leave Lobby</span>
            </button>

            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`flex-1 py-3 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md ${
                  canStart
                    ? "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white"
                    : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4" />
                <span>{canStart ? "Start Match" : "Need 2+ Players to Start"}</span>
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center p-3 rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm font-medium">
                <span className="animate-pulse mr-2">⏳</span> Waiting for host to start...
              </div>
            )}
          </div>
        </Surface>

        {/* Lobby Chat Sidebar */}
        <Surface className="flex flex-col h-[480px] rounded-3xl p-4 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-neutral-300 font-bold text-sm">
            <Comment className="w-4 h-4 text-blue-400" />
            <span>Lobby Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs pr-1">
            {chatMessages.length === 0 ? (
              <div className="text-center text-neutral-500 py-16">
                Say hello to your match opponents! 👋
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="p-2 rounded-xl bg-neutral-800 border border-neutral-700/60">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-blue-300">{msg.sender}</span>
                    <span className="text-[10px] text-neutral-500">{msg.time}</span>
                  </div>
                  <p className="text-neutral-200 break-words">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Emotes & Input */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <div className="flex gap-1.5 justify-center">
              {['👋', '🔥', '🃏', '😎', '💥', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    if (socket && user) {
                      socket.emit('send_chat', {
                        roomCode: cleanCode,
                        message: emoji,
                        user: { id: user.id, username: user.username },
                      });
                    }
                  }}
                  className="p-1 text-sm rounded-lg hover:bg-neutral-800 cursor-pointer transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                <PaperPlane className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </Surface>
      </div>
    </div>
  );
}