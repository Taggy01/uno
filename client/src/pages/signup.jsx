import React, { useState } from 'react';
import {
  Button,
  Typography,
  Surface,
  Alert,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@heroui/react';
import { CircleCheckFill, Sparkles, CircleInfo } from '@gravity-ui/icons';
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
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

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
      <Surface className="flex min-w-[340px] max-w-md w-full flex-col gap-5 rounded-3xl p-8 border border-neutral-800 bg-neutral-900 shadow-2xl" variant="default">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-md">
              UNO
            </div>
            <Typography.Heading level={2} className="text-2xl font-bold tracking-tight text-white">
              {step === 'details' ? 'Create Account' : 'Verify Email'}
            </Typography.Heading>
          </div>
          <Typography className="text-sm text-neutral-400">
            {step === 'details'
              ? 'Enter your details to receive an email verification code'
              : `Enter the 6-digit OTP code sent to ${email}`}
          </Typography>
        </div>

        {error && (
          <Alert status="danger" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-medium py-2.5 px-3.5 text-left">
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert status="success" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium py-2.5 px-3.5 flex items-center gap-2 text-left">
            <CircleInfo className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </Alert>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 block">Username</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. MasterGamer"
                className="w-full px-4 py-3 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                className="w-full px-4 py-3 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 block">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
                <span>{loading ? 'Sending Code...' : 'Send OTP →'}</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-1/2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer h-auto"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
            </div>

            <div className="pt-2 border-t border-neutral-800 text-center">
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={handleGuest}
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-blue-400 transition-colors cursor-pointer p-0 h-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skip for now, play as Guest →</span>
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col items-center">
              <label className="text-xs font-semibold text-neutral-300 block mb-3 text-center">
                Enter 6-Digit Code
              </label>

              {/* HeroUI InputOTP Component */}
              <div className="flex justify-center my-2">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  autoFocus
                  className="gap-2"
                >
                  <InputOTPGroup className="gap-1.5">
                    <InputOTPSlot index={0} className="w-11 h-13 rounded-xl border border-neutral-700 bg-neutral-800 text-lg font-bold text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <InputOTPSlot index={1} className="w-11 h-13 rounded-xl border border-neutral-700 bg-neutral-800 text-lg font-bold text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <InputOTPSlot index={2} className="w-11 h-13 rounded-xl border border-neutral-700 bg-neutral-800 text-lg font-bold text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-neutral-500 text-lg font-bold mx-1" />
                  <InputOTPGroup className="gap-1.5">
                    <InputOTPSlot index={3} className="w-11 h-13 rounded-xl border border-neutral-700 bg-neutral-800 text-lg font-bold text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <InputOTPSlot index={4} className="w-11 h-13 rounded-xl border border-neutral-700 bg-neutral-800 text-lg font-bold text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <InputOTPSlot index={5} className="w-11 h-13 rounded-xl border border-neutral-700 bg-neutral-800 text-lg font-bold text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Check your email inbox or spam folder for the 6-digit code.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setStep('details')}
                className="text-neutral-400 hover:text-white p-0 h-auto cursor-pointer"
              >
                ← Edit details
              </Button>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 p-0 h-auto cursor-pointer disabled:opacity-50"
              >
                Resend code
              </Button>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={otp.length !== 6 || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-auto"
            >
              <CircleCheckFill className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
            </Button>
          </form>
        )}
      </Surface>
    </div>
  );
}