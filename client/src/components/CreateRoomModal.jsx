import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Alert, Chip, Typography } from '@heroui/react';
import { Xmark, Plus } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateRoomModal({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [roomSize, setRoomSize] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: roomName.trim() || `${user?.username || 'Player'}'s Room`,
          maxPlayers: Number(roomSize) || 4,
          isPrivate,
          user: user ? { id: user.id, username: user.username } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create room');
      }

      onClose();
      navigate(`/lobby/${data.room.code}`);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, translateY: 15 }}
            animate={{ scale: 1, opacity: 1, translateY: 0 }}
            exit={{ scale: 0.95, opacity: 0, translateY: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-left"
          >
            {/* Close Button */}
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              <Xmark className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl border border-blue-500/20">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <Typography.Heading level={3} className="text-xl font-bold text-white">
                  Create Match Room
                </Typography.Heading>
                <Typography className="text-xs text-neutral-400">
                  Configure room settings & invite players
                </Typography>
              </div>
            </div>

            {error && (
              <Alert status="danger" className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium">
                {error}
              </Alert>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={`${user?.username || 'Player'}'s Room`}
                  className="w-full px-4 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Max Players
                  </label>
                  <Chip size="sm" className="text-blue-400 font-bold text-xs bg-blue-400/10 border border-blue-400/20">
                    {roomSize} Players
                  </Chip>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={roomSize}
                  onChange={(e) => setRoomSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                  <span>2 Min</span>
                  <span>10 Max</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="privateToggle"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
                <label htmlFor="privateToggle" className="text-xs text-neutral-300 cursor-pointer select-none">
                  Private Room (Hidden from public listing)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-1/3 py-3 bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 text-neutral-300 font-bold rounded-xl border border-neutral-700 transition-colors text-sm cursor-pointer h-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-2/3 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 h-auto"
                >
                  {loading ? 'Creating Room...' : 'Continue to Lobby →'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
