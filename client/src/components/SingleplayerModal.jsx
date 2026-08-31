import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { PlayFill, Xmark, Cpu, Sparkles, Shield, Cup } from '@gravity-ui/icons';

export default function SingleplayerModal({ isOpen, onClose }) {
  const [botCount, setBotCount] = useState(2);
  const [difficulty, setDifficulty] = useState('strategic'); // 'casual' | 'strategic' | 'master'
  const [loading, setLoading] = useState(false);
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartSoloGame = () => {
    if (!socket || !connected || !user) return;
    setLoading(true);

    const onSingleplayerStarted = ({ roomCode }) => {
      socket.off('singleplayer_game_started', onSingleplayerStarted);
      onClose();
      navigate(`/game/${roomCode}`);
    };

    socket.on('singleplayer_game_started', onSingleplayerStarted);

    socket.emit('create_singleplayer_game', {
      user: { id: user.id, username: user.username },
      botCount,
      difficulty,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, translateY: 15 }}
            animate={{ scale: 1, opacity: 1, translateY: 0 }}
            exit={{ scale: 0.95, opacity: 0, translateY: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl z-10 select-none"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <Xmark className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Play vs AI Bots</h3>
                <p className="text-xs text-neutral-400">Instant solo match with intelligent bots</p>
              </div>
            </div>

            {/* Bot Count Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                Select Opponents Count
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBotCount(num)}
                    className={`py-3 px-2 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      botCount === num
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <span>{num} {num === 1 ? 'Bot' : 'Bots'}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {num === 1 ? '1v1 Duel' : `${num + 1} Players`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="mb-6">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                Bot Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'casual', label: 'Casual', icon: Sparkles },
                  { id: 'strategic', label: 'Strategic', icon: Shield },
                  { id: 'master', label: 'Master', icon: Cup },
                ].map((diff) => {
                  const Icon = diff.icon;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        difficulty === diff.id
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{diff.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>



            {/* Start Button */}
            <button
              onClick={handleStartSoloGame}
              disabled={loading || !connected}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlayFill className="w-4 h-4" />
              <span>{loading ? 'Launching Match...' : 'Start Match Now'}</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

