import { useEffect, useState } from "react";
import { getMyQuizzes, deleteQuiz } from "../services/quizService";
import { Plus, Play, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../services/quizService";

function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await getMyQuizzes();
        setQuizzes(data.data);
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const themes = [...new Set(quizzes.map(q => q.theme?.toLowerCase()).filter(Boolean))];

  const filtered = quizzes.filter(q => {
    const matchesName = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesTheme = themeFilter === "" || q.theme?.toLowerCase() === themeFilter;
    return matchesName && matchesTheme;
  });

  async function handleHost(quizId) {
  try {
    const sessionData = await createSession(quizId);
    console.log("Session created:", sessionData);
    navigate(`/HostLobby/${sessionData.gamePin}`, { state: { session: sessionData } });
  } catch (err) {
    console.error("Failed to start session", err);
    alert("Could not start game session.");
  }
}

  function handleDelete(quizId) {
    if (window.confirm("Delete this quiz?")) {
      deleteQuiz(quizId)
        .then(() => setQuizzes(quizzes.filter(q => q.id !== quizId)))
        .catch(() => alert("Failed to delete quiz."));
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">My Quizzes</h1>
            <p className="text-white/40">Select a quiz to host or create a new one</p>
          </div>
          <button
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 px-6 py-3 rounded-xl font-semibold transition"
            onClick={() => navigate("/HostCreateGame")}
          >
            <Plus size={20} /> Create New Quiz
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
          />
          <select
            value={themeFilter}
            onChange={e => setThemeFilter(e.target.value)}
            className="bg-gray-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
          >
            <option value="">All Themes</option>
            {themes.map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>

        {/* States */}
        {loading ? (
          <div className="text-center py-20 text-white/20">Loading your quizzes...</div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-white/5 rounded-3xl py-20 text-center">
            <p className="text-white/30 mb-4">No quizzes found.</p>
            <button
              className="text-violet-400 hover:underline"
              onClick={() => navigate("/HostCreateGame")}
            >
              Build your first one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition group"
              >
                {/* Theme + version */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
                    {quiz.theme || "General"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3">{quiz.title}</h3>

                {/* Meta info */}
                <div className="flex gap-4 text-white/30 text-xs mb-6">
                  <span>{quiz.questions?.length ?? 0} question{quiz.questions?.length !== 1 ? "s" : ""}</span>
                  <span>
                    {quiz.createdAt
                      ? new Date(quiz.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric"
                        })
                      : "—"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    className="flex-grow flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-medium transition"
                    onClick={() => navigate("/HostCreateGame", { state: { quiz } })}
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    className="flex-grow flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-400 py-2 rounded-lg text-sm font-medium transition"
                    onClick={() => handleHost(quiz.id)}
                  >
                    <Play size={16} /> Host
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition"
                    onClick={() => handleDelete(quiz.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
