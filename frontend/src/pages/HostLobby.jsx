import { useLocation, useParams } from "react-router-dom";
import { Users, Play } from "lucide-react";

function HostLobby() {
  const { state } = useLocation();
  const session = state?.session;

  // Placeholder for real-time players (will be handled by WebSockets later)
  const players = ["PlayerOne", "QuizMaster99", "Waiting..."]; 

  if (!session) return <div className="text-white">Loading session...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      {/* Top Info */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div>
          <h2 className="text-white/40 uppercase tracking-widest text-sm">Quiz Title</h2>
          <h1 className="text-2xl font-bold">{session.quizTitle}</h1>
        </div>
        <button className="bg-green-500 hover:bg-green-400 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition transform hover:scale-105">
          <Play fill="currentColor" /> Start Game
        </button>
      </div>

      {/* PIN Section */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center mb-12 w-full max-w-md shadow-2xl">
        <p className="text-white/40 mb-2 uppercase font-semibold">Join at <span className="text-violet-400">your-url.com</span></p>
        <h1 className="text-7xl font-black tracking-tighter text-white">
          {session.gamePin}
        </h1>
      </div>

      {/* Players Grid */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-violet-400" />
          <h3 className="text-xl font-semibold">{players.length} Players Joined</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {players.map((p, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl text-center animate-pulse">
              <span className="font-medium text-white/80">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HostLobby;