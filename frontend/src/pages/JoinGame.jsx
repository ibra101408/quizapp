import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";

function JoinGame() {
  const { gamePin } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);

  const { disconnect } = useWebSocket({
    gamePin: joined ? parseInt(gamePin) : null,
    nickname: joined ? nickname : null,
    onPlayersUpdate: () => {},
  });

  function handleJoin() {
    if (!nickname.trim()) {
      setError("Please enter a nickname!");
      return;
    }
    setJoined(true);
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">You're in!</h1>
          <p className="text-white/40 mb-6">Waiting for the host to start the game...</p>
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-white/40 text-sm">Playing as</p>
            <p className="text-xl font-bold text-violet-300">{nickname}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/40 text-sm">Game PIN</p>
            <p className="text-2xl font-black">{gamePin}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full">
        <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-sm font-bold mx-auto mb-8">Q</div>
        <h1 className="text-2xl font-bold mb-2">Join Game</h1>
        <p className="text-white/40 mb-8">Game PIN: <span className="text-white font-bold">{gamePin}</span></p>

        <input
          type="text"
          placeholder="Enter your nickname..."
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleJoin()}
          maxLength={20}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition mb-4"
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={!nickname.trim()}
          className="w-full py-3 rounded-xl font-semibold bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Join Game!
        </button>
      </div>
    </div>
  );
}

export default JoinGame;