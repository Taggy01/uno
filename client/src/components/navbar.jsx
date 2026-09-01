import React, { useState } from "react";
import { Typography, Dropdown, Button, Avatar, Chip } from "@heroui/react";
import { ArrowRightFromSquare, CircleQuestion, Cup, Play, Person, Shield, Sun, Moon } from '@gravity-ui/icons';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUserGradient } from "../Gradient/gradient";
import RulesModal from "./RulesModal";
import ProfileModal from "./ProfileModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const gradient = getUserGradient(user?.id || 'guest_123');

  const wins = user?.stats?.wins ?? 0;
  const gamesPlayed = user?.stats?.gamesPlayed ?? 0;

  return (
    <>
      <div className="flex justify-between items-center px-6 py-3.5 border-b border-neutral-800 backdrop-blur-md sticky top-0 z-40 bg-neutral-900/80">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-md">
            <span className="font-black text-white text-sm tracking-wider">UNO</span>
          </div>
          <Typography.Heading level={4} className="font-bold tracking-tight text-white hidden sm:block">
            UNO Online
          </Typography.Heading>
        </div>

        {/* Middle: Player Stats & Game Rules */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Stats Pill (Clickable -> Opens Profile & Stats) */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700/60 text-xs font-semibold text-neutral-300 shadow-sm cursor-pointer transition-colors h-auto"
            title="View full statistics"
          >
            <div className="flex items-center gap-1">
              <Cup className="w-3.5 h-3.5 text-amber-400" />
              <span>{wins}</span>
              <span className="text-[10px] text-neutral-400 hidden md:inline">Wins</span>
            </div>
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1">
              <Play className="w-3.5 h-3.5 text-blue-400" />
              <span>{gamesPlayed}</span>
              <span className="text-[10px] text-neutral-400 hidden md:inline">Played</span>
            </div>
          </Button>

          {/* Rules / Guide Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors cursor-pointer shadow-sm h-auto"
            title="How to play UNO"
          >
            <CircleQuestion className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Rules</span>
          </Button>

          {/* Theme Toggle Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-all cursor-pointer shadow-sm h-auto"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </Button>
        </div>

        {/* Right: User Profile & Dropdown */}
        <div className="flex items-center gap-3">
          <Dropdown>
            <Dropdown.Trigger>
              <Button variant="secondary" className="gap-2 pr-3.5 pl-1.5 py-1 rounded-full border border-neutral-700/60 hover:border-neutral-500 bg-neutral-800/80 text-white cursor-pointer h-auto">
                <Avatar
                  name={user?.username || 'User'}
                  className="w-7 h-7 text-xs text-white font-bold"
                  style={{ background: gradient }}
                />
                <span className="font-semibold text-xs sm:text-sm max-w-[100px] sm:max-w-[120px] truncate">
                  {user?.username || 'Player'}
                </span>
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Popover className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-1.5 min-w-[200px]">
              <Dropdown.Menu className="gap-1">
                <Dropdown.Item
                  id="user-profile"
                  textValue="View Profile & Stats"
                  className="flex items-center justify-between p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                  onAction={() => setShowProfile(true)}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-white">{user?.username}</span>
                    <span className="text-xs text-neutral-400">{user?.isGuest ? 'Guest Player' : user?.email}</span>
                  </div>
                  <Person className="w-4 h-4 text-neutral-400" />
                </Dropdown.Item>

                <Dropdown.Item
                  id="stats"
                  textValue="Profile & Password"
                  className="flex items-center justify-between p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                  onAction={() => setShowProfile(true)}
                >
                  <span className="text-xs">Profile & Stats</span>
                  <Shield className="w-3.5 h-3.5 text-neutral-400" />
                </Dropdown.Item>

                <Dropdown.Item
                  id="theme-toggle"
                  textValue="Switch Theme"
                  className="flex items-center justify-between p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
                  onAction={toggleTheme}
                >
                  <span className="text-xs">Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                </Dropdown.Item>

                <Dropdown.Item
                  id="logout"
                  textValue="Switch/Log Out"
                  className="flex items-center justify-between p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  onAction={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <span className="text-xs font-semibold">{user?.isGuest ? 'Log In / Register' : 'Log Out'}</span>
                  <ArrowRightFromSquare className="w-3.5 h-3.5" />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Profile & Stats / Password Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}