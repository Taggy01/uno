import React, { useState } from "react";
import AllRoomCard from "../components/allRoomCard";
import JoinCard from "../components/joinCard";
import Navbar from "../components/navbar";
import SingleplayerModal from "../components/SingleplayerModal";
import CreateRoomModal from "../components/CreateRoomModal";
import { useAuth } from "../context/AuthContext";
import { PlayFill, Plus, Globe, Persons, Cpu } from "@gravity-ui/icons";

export default function Homepage() {
  const { user, updateUsername } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.username || 'Player');
  const [showSoloModal, setShowSoloModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleNameSave = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateUsername(nameInput.trim());
      setEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-600 selection:text-white pb-16">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-10">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Globe className="w-3.5 h-3.5" />
            <span>Real-Time Online UNO</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Play <span className="text-red-500">UNO</span> Online
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-sm md:text-base">
            Jump into instant games against smart AI bots or create and join multiplayer rooms with friends.
          </p>

          {/* Player Profile / Nickname Pill */}
          <div className="mt-5 inline-flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2 text-sm shadow-md">
            <span className="text-neutral-400">Playing as:</span>
            {editing ? (
              <form onSubmit={handleNameSave} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-neutral-800 border border-neutral-600 rounded-lg px-2.5 py-0.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{user?.username || 'Player'}</span>
                {user?.isGuest && (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-1.5 py-0.2 rounded-md font-semibold">
                    Guest
                  </span>
                )}
                <button
                  onClick={() => {
                    setNameInput(user?.username || 'Player');
                    setEditing(true);
                  }}
                  className="text-xs text-neutral-400 hover:text-white underline ml-1 cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Primary Modes Section */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Mode 1: Singleplayer vs Bots */}
            <div className="relative group overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Solo Match
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Play vs AI Bots</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                  Play instantly with 1 to 3 AI bot opponents with adjustable difficulty settings. Zero waiting time.
                </p>
              </div>

              <button
                onClick={() => setShowSoloModal(true)}
                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-white font-bold rounded-2xl border border-neutral-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <PlayFill className="w-4 h-4 text-amber-400" />
                <span>Play vs AI Bots</span>
              </button>
            </div>

            {/* Mode 2: Multiplayer Online -> Directly opens Create Room modal */}
            <div className="relative group overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                  <Persons className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Online Multiplayer
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                  Create a custom match room, configure max players (2-10), toggle private mode, and invite your friends.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Match Room</span>
              </button>
            </div>
          </div>
        </div>


        {/* Quick Join & Room Browser Section */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-bold text-neutral-200">Join by Code or Browse Public Rooms</h2>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          <div className="flex justify-center mb-8">
            <JoinCard />
          </div>

          {/* Public Rooms List */}
          <AllRoomCard />
        </div>
      </main>

      {/* Modals */}
      <SingleplayerModal
        isOpen={showSoloModal}
        onClose={() => setShowSoloModal(false)}
      />

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}