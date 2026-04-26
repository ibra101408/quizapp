import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyQuizzes, deleteQuiz, createSession } from "../services/quizService";

function MyQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getMyQuizzes()
      .then(res => setQuizzes(res.data))
      .catch(() => setError("Failed to load quizzes."))
      .finally(() => setLoading(false));
  }, []);

  const themes = [...new Set(quizzes.map(q => q.theme).filter(Boolean))];

  const filtered = quizzes.filter(q => {
    const matchesName = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesTheme = themeFilter === "" || q.theme === themeFilter;
    return matchesName && matchesTheme;
  });

  function handleCardClick(quizId) {
    setSelectedId(selectedId === quizId ? null : quizId);
  }

  async function handlePlay(quiz) {
    try {
      const sessionData = await createSession(quiz.id);
      navigate(`/HostLobby/${sessionData.gamePin}`, { state: { session: sessionData } });
    } catch (err) {
      console.error("Failed to start session", err);
      alert("Could not start game session.");
    }
  }

  function handleModify(quiz) {
    // TODO: wire up GET /api/quizzes/{id} when teammate finishes backend
    navigate("/HostCreateGame", { state: { quiz } });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-sm font-bold">Q</div>
            <span className="text-lg font-semibold tracking-wide uppercase text-white/80">Quiz Builder</span>
          </div>
          <button
            onClick={() => navigate("/HostCreateGame")}
            className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-sm font-semibold transition shadow-lg shadow-violet-500/20"
          >
            + New Quiz
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-1">My Quizzes</h1>
        <p className="text-white/40 text-sm mb-8">All your saved quiz drafts</p>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
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

        {loading && <p className="text-white/40 text-sm text-center py-20">Loading quizzes...</p>}
        {error && <p className="text-red-400 text-sm text-center py-20">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-white/40 text-sm text-center py-20">No quizzes found.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(quiz => {
              const isSelected = selectedId === quiz.id;
              return (
                <div
                  key={quiz.id}
                  onClick={() => handleCardClick(quiz.id)}
                  className={`bg-gray-900/60 border rounded-2xl p-5 cursor-pointer transition-all duration-150 group ${
                    isSelected
                      ? "border-violet-500/70 shadow-lg shadow-violet-500/10"
                      : "border-white/10 hover:border-violet-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className={`text-base font-semibold leading-snug transition ${isSelected ? "text-violet-300" : "group-hover:text-violet-300"}`}>
                      {quiz.title}
                    </h2>
                    {quiz.theme && (
                      <span className="ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {quiz.theme}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs mb-4">
                    {quiz.questions?.length ?? 0} question{quiz.questions?.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-white/25 text-xs mb-4">
                    {quiz.createdAt
                      ? new Date(quiz.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric"
                        })
                      : "—"}
                  </p>

                  {isSelected && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); handlePlay(quiz); }}
                        className="flex-1 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-xs font-semibold transition shadow-lg shadow-violet-500/20"
                      >
                        ▶ Play
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleModify(quiz); }}
                        className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-xs font-semibold transition"
                      >
                        ✏ Modify
                      </button>
                      <button
                          onClick={e => {
                            e.stopPropagation();
                            if (window.confirm("Delete this quiz?")) {
                              deleteQuiz(quiz.id)
                                  .then(() => setQuizzes(quizzes.filter(q => q.id !== quiz.id)))
                                  .catch(() => alert("Failed to delete quiz."));
                            }
                          }}
                          className="flex-1 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyQuizzes;
