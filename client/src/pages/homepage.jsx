import React from "react";
import AllRoomCard from "../components/allRoomCard";
import CreateCard from "../components/createCard";
import JoinCard from "../components/joinCard";
import Navbar from "../components/navbar";
import { useAuth } from "../context/AuthContext";
import { getUserGradient } from "../Gradient/gradient";

export default function Homepage() {
  const { user, updateUsername } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(user?.username || 'Player');

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
            <span>✨ Real-Time Online Multiplayer</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Play <span className="text-red-500">UNO</span> With Friends
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-base">
            Create or join private & public rooms, challenge your friends or play against intelligent AI bots!
          </p>

          {/* Quick Nickname Pill */}
          <div className="mt-5 inline-flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2 text-sm">
            <span className="text-neutral-400">Playing as:</span>
            {editing ? (
              <form onSubmit={handleNameSave} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-0.5 text-white text-sm focus:outline-none focus:border-blue-500"
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

        {/* Action Cards: Join & Create */}
        <div className="flex flex-wrap gap-6 justify-center items-stretch">
          <JoinCard />
          <CreateCard />
        </div>

        {/* Public Rooms List */}
        <AllRoomCard />
      </main>
    </div>
  );
}