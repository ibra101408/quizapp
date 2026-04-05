import { useState } from "react";
import { createQuiz } from "../services/quizService";
import { useNavigate } from "react-router-dom";

function HostCreateGame() {
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [questions, setQuestions] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null); // null | "success" | "error"
  const navigate = useNavigate();

  const [questionText, setQuestionText] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);

  function toggleCorrect(index) {
    if (correct.includes(index)) {
      setCorrect(correct.filter((i) => i !== index));
    } else {
      setCorrect([...correct, index]);
    }
  }

  function addQuestion() {
    const formattedAnswers = answers.map((answer, index) => ({
      text: answer,
      isCorrect: correct.includes(index),
    }));

    const newQuestion = { text: questionText, timeLimit, answers: formattedAnswers };
    setQuestions([...questions, newQuestion]);
    setQuestionText("");
    setTimeLimit(30);
    setAnswers(["", "", "", ""]);
    setCorrect([]);
  }

  async function saveQuiz() {
    const quiz = { title, theme, questions };
    try {
      const response = await createQuiz(quiz);
      console.log("Quiz saved:", response.data);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Error saving quiz:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  const answerColors = [
    { border: "border-rose-400", bg: "bg-rose-50", dot: "bg-rose-400", label: "text-rose-500", activeBg: "bg-rose-400" },
    { border: "border-sky-400", bg: "bg-sky-50", dot: "bg-sky-400", label: "text-sky-500", activeBg: "bg-sky-400" },
    { border: "border-amber-400", bg: "bg-amber-50", dot: "bg-amber-400", label: "text-amber-500", activeBg: "bg-amber-400" },
    { border: "border-emerald-400", bg: "bg-emerald-50", dot: "bg-emerald-400", label: "text-emerald-500", activeBg: "bg-emerald-400" },
  ];

  const answerLabels = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Top navbar */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center justify-between bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-sm font-bold">Q</div>
          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">Quiz Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <span className="text-sm text-emerald-400 font-medium">✓ Quiz saved!</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-400 font-medium">✗ Failed to save</span>
          )}
          <button
            onClick={saveQuiz}
            disabled={!title.trim() || questions.length === 0}

            className="px-4 py-2 text-sm font-medium rounded-lg border border-white/20 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            Save Draft
          </button>
          <button
            onClick={() => navigate("/HostLobby", { state: { quiz: { title, questions } } })}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-500 hover:bg-violet-400 transition-all duration-150 shadow-lg shadow-violet-500/30"
          >
            Start Game →
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">

        {/* Sidebar – question list */}
        <div className="w-72 border-r border-white/10 bg-gray-900/40 flex flex-col">
          <div className="p-5 border-b border-white/10 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Quiz Title</p>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                placeholder="Enter quiz title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Theme</p>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                placeholder="e.g. Animals, Politics..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
              Questions ({questions.length})
            </p>
            {questions.length === 0 && (
              <div className="text-center py-10 text-white/20 text-sm">
                No questions yet.<br />Add one on the right →
              </div>
            )}
            {questions.map((q, i) => (
              <div
                key={i}
                onClick={() => setActiveQuestion(activeQuestion === i ? null : i)}
                className={`p-3 rounded-lg cursor-pointer border transition-all duration-150 ${
                  activeQuestion === i
                    ? "bg-violet-500/20 border-violet-500/50 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center font-bold text-white/50 shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm truncate">{q.text || "Untitled question"}</p>
                </div>
                <div className="flex items-center gap-2 mt-2 ml-7">
                  <div className="flex gap-1">
                    {q.answers.map((a, j) => (
                      <span
                        key={j}
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          a.isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                        }`}
                      >
                        {answerLabels[j]}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-white/30">⏱ {q.timeLimit}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main editor */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">

            <div className="mb-4">

              <h1 className="text-2xl font-bold text-white">Add a Question</h1>
              <p className="text-white/40 text-sm mt-1">Click an answer to mark it as correct</p>
            </div>

            {/* Question input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                Question
              </label>
              <textarea
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none transition text-sm"
                placeholder="What do you want to ask?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </div>

            {/* Time limit */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
              <span className="text-white/30 text-xs ml-2">seconds (5–120)</span>
            </div>

            {/* Answers grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {answers.map((a, i) => {
                const color = answerColors[i];
                const isCorrect = correct.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleCorrect(i)}
                    className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-150 ${
                      isCorrect
                        ? `${color.border} ${color.bg}`
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center text-white ${isCorrect ? color.activeBg : "bg-white/10"}`}>
                        {answerLabels[i]}
                      </span>
                      {isCorrect && (
                        <span className={`text-xs font-semibold ${color.label}`}>✓ Correct</span>
                      )}
                    </div>
                    <input
                      className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                      placeholder={`Answer ${answerLabels[i]}...`}
                      value={a}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const copy = [...answers];
                        copy[i] = e.target.value;
                        setAnswers(copy);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Add question button */}
            <button
              onClick={addQuestion}
              disabled={!questionText.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-violet-500/20"
            >
              + Add Question
            </button>

            {/* Stats bar */}
            {questions.length > 0 && (
              <div className="mt-6 flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-white/50">
                <span>📋 <strong className="text-white">{questions.length}</strong> questions</span>
                <span>✅ <strong className="text-white">
                  {questions.reduce((acc, q) => acc + q.answers.filter(a => a.isCorrect).length, 0)}
                </strong> correct answers</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default HostCreateGame;