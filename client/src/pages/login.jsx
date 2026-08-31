import React, { useState } from 'react';
import { Button, Typography, Surface } from '@heroui/react';
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
      <Surface className="flex min-w-[340px] max-w-md w-full flex-col gap-4 rounded-3xl p-8 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-md">
              UNO
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">UNO Online</h2>
          </div>
          <p className="text-sm text-neutral-400">
            {activeTab === 'account' ? 'Log in with your existing account' : 'Join instantly with a temporary guest name'}
          </p>
        </div>

        {/* Auth Mode Toggle Pills */}
        <div className="flex p-1 bg-neutral-800/80 rounded-2xl border border-neutral-700/60">
          <button
            type="button"
            onClick={() => { setActiveTab('account'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Registered Account
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('guest'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'guest'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Play as Guest</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {activeTab === 'account' ? (
          <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Email or Username</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or username"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <CircleCheckFill className="w-4 h-4" />
                <span>{loading ? 'Logging in...' : 'Log In'}</span>
              </button>
              <button
                type="button"
                className="w-1/2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300">Choose Guest Nickname</label>
                <button
                  type="button"
                  onClick={generateRandomGuestName}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  <ArrowRotateLeft className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. CardMaster_42"
                maxLength={20}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                No password or email required. You can jump straight into matches!
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            >
              <Persons className="w-4 h-4" />
              <span>{loading ? 'Joining...' : 'Enter Game as Guest'}</span>
            </button>
          </form>
        )}
      </Surface>
    </div>
  );
}