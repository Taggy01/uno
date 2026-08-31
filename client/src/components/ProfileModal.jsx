import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Chip, Alert, Typography } from '@heroui/react';
import { Xmark, Lock, CircleInfo } from '@gravity-ui/icons';
import { useAuth } from '../context/AuthContext';
import { getUserGradient } from '../Gradient/gradient';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, changePassword, refreshProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const gradient = getUserGradient(user?.id || 'guest_123');

  const wins = user?.stats?.wins ?? 0;
  const gamesPlayed = user?.stats?.gamesPlayed ?? 0;
  const score = user?.stats?.score ?? 0;
  const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0';

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (refreshProfile) refreshProfile();
    } catch (err) {
      setError(err.message || 'Failed to change password');
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
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-left max-h-[90vh] flex flex-col"
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

            {/* User Profile Header */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-neutral-800">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-white/10"
                style={{ background: gradient }}
              >
                {(user?.username || 'P')[0]?.toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Typography.Heading level={3} className="text-xl font-bold text-white">
                    {user?.username || 'Player'}
                  </Typography.Heading>
                  {user?.isGuest ? (
                    <Chip size="sm" className="bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-semibold">
                      Guest
                    </Chip>
                  ) : (
                    <Chip size="sm" className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                      Verified Member
                    </Chip>
                  )}
                </div>
                <Typography className="text-xs text-neutral-400 mt-0.5">
                  {user?.isGuest ? 'Temporary Session' : (user?.email || 'Registered User')}
                </Typography>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
              {/* Detailed Game Stats Grid */}
              <div>
                <Typography.Heading level={4} className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                  Match Statistics
                </Typography.Heading>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Card className="bg-neutral-800/60 p-3 rounded-2xl border border-neutral-800 text-center">
                    <span className="text-[11px] text-neutral-400 block mb-1">Played</span>
                    <span className="text-lg font-bold text-white">{gamesPlayed}</span>
                  </Card>

                  <Card className="bg-neutral-800/60 p-3 rounded-2xl border border-neutral-800 text-center">
                    <span className="text-[11px] text-amber-400 block mb-1">Victories</span>
                    <span className="text-lg font-bold text-amber-400">{wins}</span>
                  </Card>

                  <Card className="bg-neutral-800/60 p-3 rounded-2xl border border-neutral-800 text-center">
                    <span className="text-[11px] text-blue-400 block mb-1">Win Rate</span>
                    <span className="text-lg font-bold text-blue-400">{winRate}%</span>
                  </Card>

                  <Card className="bg-neutral-800/60 p-3 rounded-2xl border border-neutral-800 text-center">
                    <span className="text-[11px] text-emerald-400 block mb-1">Score</span>
                    <span className="text-lg font-bold text-emerald-400">{score}</span>
                  </Card>
                </div>
              </div>

              {/* Security / Password Section */}
              {!user?.isGuest ? (
                <div className="pt-2 border-t border-neutral-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-neutral-400" />
                    <Typography.Heading level={4} className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Change Password
                    </Typography.Heading>
                  </div>

                  {error && (
                    <Alert status="danger" className="p-3 mb-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert status="success" className="p-3 mb-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
                      {success}
                    </Alert>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full px-3.5 py-2.5 bg-neutral-800/90 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="pt-1 text-right">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm h-auto"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <Card className="p-4 bg-neutral-800/40 border border-neutral-800 rounded-2xl text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                    <CircleInfo className="w-3.5 h-3.5 text-blue-400" />
                    <span>Guest Account</span>
                  </div>
                  You are currently playing on a temporary guest session. Create a registered account to permanently safeguard your match statistics and leaderboard records.
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
