import { useState } from 'react';
import { Button, Card, Typography } from "@heroui/react";
import { Plus, Xmark } from '@gravity-ui/icons';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CreateCard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomSize, setRoomSize] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = () => {
    setRoomName(`${user?.username || 'Player'}'s Room`);
    setError('');
    setIsOpen(true);
  };

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

      setIsOpen(false);
      navigate(`/lobby/${data.room.code}`);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Card className="w-80 h-full flex flex-col justify-between border border-neutral-800 bg-neutral-900 rounded-3xl p-2 hover:border-neutral-700 transition-all shadow-xl">
        <Card.Header>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <Card.Title className="text-xl font-bold text-white">Create Room</Card.Title>
          <Card.Description className="text-neutral-400 text-sm">
            Create a custom room, configure player size, and invite your friends.
          </Card.Description>
        </Card.Header>

        <Card.Content className="pt-4">
          <button
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-colors shadow-md cursor-pointer"
            onClick={handleOpenModal}
          >
            Create Room
          </button>
        </Card.Content>
      </Card>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              <Xmark className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-1">Create Match Room</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Set up your room settings and jump into the lobby.
            </p>

            {error && (
              <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium">
                {error}
              </div>
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
                  placeholder="e.g. Aditya's Epic Match"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Max Players
                  </label>
                  <span className="text-blue-400 font-bold text-xs bg-blue-400/10 px-2 py-0.5 rounded-md border border-blue-400/20">
                    {roomSize} Players
                  </span>
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
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/3 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-300 font-bold rounded-xl border border-neutral-700 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating Room...' : 'Continue to Lobby →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}