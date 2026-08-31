import React, { useState } from 'react';
import { Button, Typography, Surface } from '@heroui/react';
import { CircleCheckFill, Sparkles, ArrowRight, ArrowRotateLeft, CircleInfo } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOtp, verifyOtpAndSignup, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await sendOtp(username.trim(), email.trim(), password);
      setSuccessMsg(res.message || `Verification code sent to ${email.trim()}`);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtpAndSignup(email.trim(), otp.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(username.trim(), email.trim(), password);
      setSuccessMsg(res.message || 'A new verification code has been sent to your email!');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    const defaultName = username.trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    await guestLogin(defaultName);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <Surface className="flex min-w-[340px] max-w-md w-full flex-col gap-4 rounded-3xl p-8 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-md">
              UNO
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {step === 'details' ? 'Create Account' : 'Verify Email'}
            </h2>
          </div>
          <p className="text-sm text-neutral-400">
            {step === 'details'
              ? 'Enter your details to receive an email verification code'
              : `Enter the 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CircleInfo className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}


        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
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
                className="w-1/2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <span>{loading ? 'Sending OTP...' : 'Continue →'}</span>
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
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-blue-400 transition-colors underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skip for now, play as Guest →</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">6-Digit Email Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white font-mono text-center tracking-widest text-xl focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-neutral-500 mt-1.5">
                Check your email inbox or spam folder for the 6-digit verification code.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-neutral-400 hover:text-white underline cursor-pointer"
              >
                ← Edit details
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer disabled:opacity-50"
              >
                Resend code
              </button>
            </div>

            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CircleCheckFill className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
            </button>
          </form>
        )}
      </Surface>
    </div>
  );
}