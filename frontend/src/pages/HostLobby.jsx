import { Users, Play } from "lucide-react";
import { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/authService";

const API_URL = "http://localhost:8080/api";

function HostLobby() {
  const { state } = useLocation();
  const { gamePin } = useParams();
  const session = state?.session;
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  useWebSocket({
    gamePin: gamePin ? parseInt(gamePin) : null,
    nickname: null,
    onPlayersUpdate: (updatedPlayers) => setPlayers([...updatedPlayers]),
  });

  async function handleKick(nickname) {
    if (!window.confirm(`Kick ${nickname}?`)) return;
    try {
      await axios.delete(`${API_URL}/sessions/${gamePin}/players/${nickname}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch (err) {
      console.error("Failed to kick player", err);
      alert("Failed to kick player.");
    }
  }

  async function handleStart() {
    try {
        await axios.put(`${API_URL}/sessions/${gamePin}/start`, {}, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        setGameStarted(true);
    } catch (err) {
        console.error("Failed to start game", err);
        alert("Failed to start game.");
    }
}

  if (!session) return <div className="text-white">Loading session...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      {/* Top Info */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div>
          <h2 className="text-white/40 uppercase tracking-widest text-sm">Quiz Title</h2>
          <h1 className="text-2xl font-bold">{session.quizTitle}</h1>
        </div>
        <button 
    	    onClick={handleStart} 
            disabled={gameStarted}
    	    className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition transform hover:scale-105"
	>
    	    <Play fill="currentColor" /> {gameStarted ? "Game In Progress" : "Start Game"}
	</button>
      </div>

      {/* PIN Section */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center mb-12 w-full max-w-md shadow-2xl">
        <p className="text-white/40 mb-2 uppercase font-semibold">
          Join at <span className="text-violet-400">localhost:3000/game/{gamePin}</span>
        </p>
        <h1 className="text-7xl font-black tracking-tighter text-white">
          {gamePin}
        </h1>
      </div>

      {/* Players Grid */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-violet-400" />
          <h3 className="text-xl font-semibold">{players.length} Players Joined</h3>
        </div>
        {players.length === 0 ? (
          <p className="text-white/30 text-center py-10">Waiting for players to join...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {players.map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl text-center relative group">
                <span className="font-medium text-white/80">{p}</span>
                <button
                  onClick={() => handleKick(p)}
                  className="absolute top-1 right-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HostLobby;