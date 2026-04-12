import { useState } from "react";
import { createQuiz } from "../services/quizService";
import { useNavigate, useLocation } from "react-router-dom";

function HostCreateGame() {
  const [saveStatus, setSaveStatus] = useState(null);
  const navigate = useNavigate();

  const location = useLocation();
  const existingQuiz = location.state?.quiz;

  const [title, setTitle] = useState(existingQuiz?.title || "");
  const [theme, setTheme] = useState(existingQuiz?.theme || "");
  const [questions, setQuestions] = useState(existingQuiz?.questions || []);
  const [questionText, setQuestionText] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [questionType, setQuestionType] = useState("multiple");

  function toggleCorrect(index) {
    if (correct.includes(index)) {
      setCorrect(correct.filter((i) => i !== index));
    } else {
      setCorrect([...correct, index]);
    }
  }

  function handleTypeChange(type) {
    setQuestionType(type);
    if (type === "truefalse") {
      setAnswers(["True answer here", "False answer here"]);
      setCorrect([0]); // True is selected by default
    } else {
      setAnswers(["", "", "", ""]);
      setCorrect([]);
    }
  }

  function addQuestion() {
    const formattedAnswers = answers.map((answer, index) => ({
      text: answer,
      isCorrect: correct.includes(index),
    }));
    const newQuestion = {
      text: questionText,
      timeLimit,
      questionType,
      answers: formattedAnswers,
    };
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
    {
      border: "border-rose-400",
      bg: "bg-rose-50",
      label: "text-rose-500",
      activeBg: "bg-rose-400",
    },
    {
      border: "border-sky-400",
      bg: "bg-sky-50",
      label: "text-sky-500",
      activeBg: "bg-sky-400",
    },
    {
      border: "border-amber-400",
      bg: "bg-amber-50",
      label: "text-amber-500",
      activeBg: "bg-amber-400",
    },
    {
      border: "border-emerald-400",
      bg: "bg-emerald-50",
      label: "text-emerald-500",
      activeBg: "bg-emerald-400",
    },
    {
      border: "border-purple-400",
      bg: "bg-purple-50",
      label: "text-purple-500",
      activeBg: "bg-purple-400",
    },
    {
      border: "border-orange-400",
      bg: "bg-orange-50",
      label: "text-orange-500",
      activeBg: "bg-orange-400",
    },
    {
      border: "border-pink-400",
      bg: "bg-pink-50",
      label: "text-pink-500",
      activeBg: "bg-pink-400",
    },
    {
      border: "border-teal-400",
      bg: "bg-teal-50",
      label: "text-teal-500",
      activeBg: "bg-teal-400",
    },
    {
      border: "border-indigo-400",
      bg: "bg-indigo-50",
      label: "text-indigo-500",
      activeBg: "bg-indigo-400",
    },
    {
      border: "border-lime-400",
      bg: "bg-lime-50",
      label: "text-lime-500",
      activeBg: "bg-lime-400",
    },
  ];

  const answerLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Top navbar */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center justify-between bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-sm font-bold">
            Q
          </div>
          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Quiz Builder
          </span>
          <button
            onClick={() => navigate("/Home")}
            className="ml-6 text-sm text-white/50 hover:text-white transition"
          >
            My Quizzes
          </button>
          <button
            onClick={() => navigate("/HostCreateGame")}
            className="ml-4 text-sm text-white/50 hover:text-white transition"
          >
            + New Quiz
          </button>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <span className="text-sm text-emerald-400 font-medium">
              ✓ Quiz saved!
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-400 font-medium">
              ✗ Failed to save
            </span>
          )}
          <button
            onClick={saveQuiz}
            disabled={!title.trim() || questions.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-white/20 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            Save Draft
          </button>
          <button
            onClick={() =>
              navigate("/HostLobby", { state: { quiz: { title, questions } } })
            }
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
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                Quiz Title
              </p>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                placeholder="Enter quiz title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                Theme
              </p>
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
                No questions yet.
                <br />
                Add one on the right →
              </div>
            )}
            {questions.map((q, i) => (
              <div
                key={i}
                onClick={() => {
                  const q = questions[i];
                  setActiveQuestion(activeQuestion === i ? null : i);
                  setQuestionText(q.text);
                  setTimeLimit(q.timeLimit || 30);
                  setAnswers(q.answers.map((a) => a.text));
                  setCorrect(
                    q.answers
                      .map((a, idx) => (a.isCorrect ? idx : null))
                      .filter((idx) => idx !== null),
                  );
                }}
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
                  <p className="text-sm truncate">
                    {q.text || "Untitled question"}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuestions(questions.filter((_, qi) => qi !== i));
                    }}
                    className="ml-auto text-white/20 hover:text-red-400 transition text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 ml-7">
                  <div className="flex gap-1">
                    {q.answers.map((a, j) => (
                      <span
                        key={j}
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          a.isCorrect
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-white/30"
                        }`}
                      >
                        {answerLabels[j]}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-white/30">
                    ⏱ {q.timeLimit}s
                  </span>
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
              <p className="text-white/40 text-sm mt-1">
                Click an answer to mark it as correct
              </p>
            </div>

            {/* Question type */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                Question Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("multiple")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    questionType === "multiple"
                      ? "bg-violet-500 text-white"
                      : "border border-white/20 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Multiple Choice
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("truefalse")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    questionType === "truefalse"
                      ? "bg-violet-500 text-white"
                      : "border border-white/20 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  True / False
                </button>
              </div>
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
              <span className="text-white/30 text-xs ml-2">
                seconds (5–120)
              </span>
            </div>

            {/* Answers grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
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
                      <span
                        className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center text-white ${isCorrect ? color.activeBg : "bg-white/10"}`}
                      >
                        {answerLabels[i]}
                      </span>
                      {isCorrect && (
                        <span
                          className={`text-xs font-semibold ${color.label}`}
                        >
                          ✓ Correct
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className={`w-full bg-transparent text-sm focus:outline-none placeholder-white/30 ${isCorrect ? "text-black" : "text-white"}`}
                        placeholder={`Answer ${answerLabels[i]}...`}
                        value={a}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const copy = [...answers];
                          copy[i] = e.target.value;
                          setAnswers(copy);
                        }}
                      />
                      {answers.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnswers(answers.filter((_, ai) => ai !== i));
                            setCorrect(
                              correct
                                .filter((ci) => ci !== i)
                                .map((ci) => (ci > i ? ci - 1 : ci)),
                            );
                          }}
                          className={`shrink-0 transition text-xs font-bold ${isCorrect ? "text-red-500" : "text-white/40 hover:text-red-400"}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Answer count controls */}
            {questionType === "multiple" && (
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setAnswers([...answers, ""])}
                  disabled={answers.length >= 10}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/20 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  + Add Answer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnswers(answers.slice(0, -1));
                    setCorrect(correct.filter((i) => i < answers.length - 1));
                  }}
                  disabled={answers.length <= 2}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/20 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  − Remove Answer
                </button>
              </div>
            )}

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
                <span>
                  📋 <strong className="text-white">{questions.length}</strong>{" "}
                  questions
                </span>
                <span>
                  ✅{" "}
                  <strong className="text-white">
                    {questions.reduce(
                      (acc, q) =>
                        acc + q.answers.filter((a) => a.isCorrect).length,
                      0,
                    )}
                  </strong>{" "}
                  correct answers
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostCreateGame;
