import { useState } from 'react';
import { Button, Card, Alert } from "@heroui/react";
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
    <div className="w-full max-w-lg">
      <Card className="w-full border border-neutral-800 bg-neutral-900 rounded-3xl p-4 sm:p-6 hover:border-neutral-700 transition-all shadow-xl text-left">
        <Card.Header className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Magnifier className="w-5 h-5" />
            </div>
            <div>
              <Card.Title className="text-xl font-bold text-white">Join with Room Code</Card.Title>
              <Card.Description className="text-neutral-400 text-xs sm:text-sm">
                Enter the room code shared by your friend to jump straight in.
              </Card.Description>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="pt-4">
          <form onSubmit={handleJoin} className="space-y-3">
            {error && (
              <Alert status="danger" className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
                {error}
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={10}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="e.g. 54321"
                  className="w-full px-4 py-3 bg-neutral-800/90 border border-neutral-700 rounded-2xl text-white font-mono text-center sm:text-left tracking-widest text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!code.trim() || loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap text-sm h-auto"
              >
                {loading ? (
                  <span>Finding...</span>
                ) : (
                  <>
                    <span>Join Match</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}