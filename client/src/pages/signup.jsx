import React, { useState } from 'react';
import { Button, Typography, Surface } from '@heroui/react';
import { CircleCheckFill } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(username.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    guestLogin();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <Surface className="flex min-w-[340px] max-w-md w-full flex-col gap-4 rounded-3xl p-8 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
        <div className="flex flex-col text-left">
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xs mb-3 shadow-md">
            UNO
          </div>
          <Typography.Heading level={3} className="font-extrabold text-white">
            Create Account
          </Typography.Heading>
          <p className="text-sm text-neutral-400 mt-1">Start playing and tracking your stats</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. MasterGamer"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
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
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CircleCheckFill className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Sign Up'}</span>
            </button>
            <button
              type="button"
              className="w-1/2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-center">
            <button
              type="button"
              onClick={handleGuest}
              className="text-xs text-neutral-400 hover:text-blue-400 transition-colors underline cursor-pointer"
            >
              Continue as Guest Player →
            </button>
          </div>
        </form>
      </Surface>
    </div>
  );
}