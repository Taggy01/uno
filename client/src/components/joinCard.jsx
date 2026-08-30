import { useState } from 'react';
import { Button, Card, Typography } from "@heroui/react";
import { Magnifier, ArrowRight } from '@gravity-ui/icons';
import { useNavigate } from "react-router-dom";

export default function JoinCard() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${cleanCode}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Room not found. Please check the code.');
      }

      navigate(`/lobby/${cleanCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Card className="w-80 h-full flex flex-col justify-between border border-neutral-800 bg-neutral-900 rounded-3xl p-2 hover:border-neutral-700 transition-all shadow-xl">
        <Card.Header>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
            <Magnifier className="w-6 h-6" />
          </div>
          <Card.Title className="text-xl font-bold text-white">Join with Code</Card.Title>
          <Card.Description className="text-neutral-400 text-sm">
            Enter the 5-digit room code shared by your friend.
          </Card.Description>
        </Card.Header>

        <Card.Content className="pt-4">
          <form onSubmit={handleJoin} className="space-y-3">
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                maxLength={10}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                placeholder="e.g. 54321"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-500"
              />
            </div>

            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Finding Room...' : (
                <>
                  <span>Join Match</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}