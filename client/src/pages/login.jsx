import React, { useState } from 'react';
import { Button, Typography, Surface, Alert } from '@heroui/react';
import { CircleCheckFill, Persons, Sparkles, ArrowRotateLeft } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'guest'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const chosen = guestName.trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
      await guestLogin(chosen);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create guest session');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomGuestName = () => {
    const prefixes = ['Ace', 'Flash', 'Wild', 'Shadow', 'Lucky', 'Turbo', 'Blaze', 'Nova', 'Cyber'];
    const suffixes = ['Player', 'Cardist', 'Hero', 'Wizard', 'Gamer', 'Champion', 'Uno'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setGuestName(`${p}${s}_${num}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <Surface className="flex min-w-[340px] max-w-md w-full flex-col gap-5 rounded-3xl p-8 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-md">
              UNO
            </div>
            <Typography.Heading level={2} className="text-2xl font-bold tracking-tight text-white">
              UNO Online
            </Typography.Heading>
          </div>
          <Typography className="text-sm text-neutral-400">
            {activeTab === 'account' ? 'Log in with your existing account' : 'Join instantly with a temporary guest name'}
          </Typography>
        </div>

        {/* Auth Mode Toggle with HeroUI Buttons */}
        <div className="grid grid-cols-2 p-2 bg-neutral-800/80 rounded-2xl border border-neutral-700/60 gap-5">
          <Button
            type="button"
            variant={activeTab === 'account' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => { setActiveTab('account'); setError(''); }}
            className={`font-bold transition-all ${activeTab === 'account'
              ? 'bg-primary text-white shadow-sm w-full'
              : 'text-neutral-400 hover:text-neutral-200 w-full'
              }`}
          >
            Registered Account
          </Button>
          <Button
            type="button"
            variant={activeTab === 'guest' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => { setActiveTab('guest'); setError(''); }}
            className={`font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'guest'
              ? 'bg-primary text-white shadow-sm w-full'
              : 'text-neutral-400 hover:text-neutral-200 w-full'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Play as Guest</span>
          </Button>
        </div>

        {error && (
          <Alert status="danger" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-medium py-2.5 px-3.5">
            {error}
          </Alert>
        )}

        {activeTab === 'account' ? (
          <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-neutral-300 block">Email or Username</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or username"
                className="w-full px-4 py-3 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-500"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-neutral-300 block">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-1/2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md h-auto"
              >
                <CircleCheckFill className="w-4 h-4" />
                <span>{loading ? 'Logging in...' : 'Log In'}</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-1/2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer h-auto"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4 text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">Choose Guest Nickname</label>
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={generateRandomGuestName}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 p-0 h-auto cursor-pointer"
                >
                  <ArrowRotateLeft className="w-3 h-3" />
                  <span>Randomize</span>
                </Button>
              </div>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. CardMaster_42"
                maxLength={20}
                className="w-full px-4 py-3 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-500"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                No password or email required. You can jump straight into matches!
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md h-auto"
            >
              <Persons className="w-4 h-4" />
              <span>{loading ? 'Joining...' : 'Enter Game as Guest'}</span>
            </Button>
          </form>
        )}
      </Surface>
    </div>
  );
}