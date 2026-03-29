import { useLocation } from "react-router-dom";
import { useState } from "react";

const MOCK_QUIZ = {
  title: "General Knowledge Showdown",
  questions: [
    {
      text: "What is the capital of France?",
      answers: [
        { text: "Berlin", correct: false },
        { text: "Paris", correct: true },
        { text: "Madrid", correct: false },
        { text: "Rome", correct: false },
      ],
    },
    {
      text: "Which planet is closest to the Sun?",
      answers: [
        { text: "Venus", correct: false },
        { text: "Earth", correct: false },
        { text: "Mercury", correct: true },
        { text: "Mars", correct: false },
      ],
    },
    {
      text: "What is 12 × 12?",
      answers: [
        { text: "132", correct: false },
        { text: "144", correct: true },
        { text: "124", correct: false },
        { text: "148", correct: false },
      ],
    },
  ],
};

const answerColors = [
  { border: "border-rose-400", bg: "bg-rose-500/20", activeBg: "bg-rose-500", label: "A", dot: "bg-rose-400" },
  { border: "border-sky-400", bg: "bg-sky-500/20", activeBg: "bg-sky-500", label: "B", dot: "bg-sky-400" },
  { border: "border-amber-400", bg: "bg-amber-500/20", activeBg: "bg-amber-500", label: "C", dot: "bg-amber-400" },
  { border: "border-emerald-400", bg: "bg-emerald-500/20", activeBg: "bg-emerald-500", label: "D", dot: "bg-emerald-400" },
];

function HostLobby() {
  const location = useLocation();
  const quiz = location.state?.quiz || MOCK_QUIZ;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;

  function handleSelect(i) {
    if (revealed) return;
    setSelected(i);
  }

  function handleReveal() {
    if (selected === null) return;
    setRevealed(true);
    if (question.answers[selected].correct) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
        <div className="text-6xl mb-2">🎉</div>
        <h1 className="text-3xl font-bold">Quiz Complete!</h1>
        <p className="text-white/50 text-lg">{quiz.title}</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-12 py-8 text-center">
          <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Your Score</p>
          <p className="text-6xl font-bold text-violet-400">{score}<span className="text-white/30 text-3xl">/{total}</span></p>
          <p className="text-white/50 mt-3 text-sm">
            {score === total ? "Perfect score! 🌟" : score >= total / 2 ? "Nice work! 👏" : "Better luck next time 💪"}
          </p>
        </div>
        <button
          onClick={() => { setCurrentIndex(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); }}
          className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 font-semibold text-sm transition"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Navbar */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center justify-between bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-sm font-bold">Q</div>
          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">Quiz Builder</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/40">{quiz.title}</span>
          <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full text-white/60">
            {currentIndex + 1} / {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-1 bg-violet-500 transition-all duration-500"
          style={{ width: `${((currentIndex + (revealed ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Question number + text */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">
            Question {currentIndex + 1}
          </p>
          <h2 className="text-2xl font-bold leading-snug">{question.text}</h2>
        </div>

        {/* Answers */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {question.answers.map((a, i) => {
            const color = answerColors[i];
            const isSelected = selected === i;
            const isCorrect = a.correct;

            let style = "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10";
            if (revealed) {
              if (isCorrect) style = `${color.border} ${color.bg}`;
              else if (isSelected && !isCorrect) style = "border-red-500/50 bg-red-500/10";
              else style = "border-white/5 bg-white/3 opacity-40";
            } else if (isSelected) {
              style = `${color.border} ${color.bg}`;
            }

            return (
              <div
                key={i}
                onClick={() => handleSelect(i)}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${style}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center text-white shrink-0 transition-all ${isSelected || (revealed && isCorrect) ? color.activeBg : "bg-white/10"}`}>
                    {color.label}
                  </span>
                  <span className="text-sm font-medium text-white">{a.text}</span>
                  {revealed && isCorrect && (
                    <span className="ml-auto text-emerald-400 text-lg">✓</span>
                  )}
                  {revealed && isSelected && !isCorrect && (
                    <span className="ml-auto text-red-400 text-lg">✗</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={selected === null}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Reveal Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-violet-500 hover:bg-violet-400 transition"
            >
              {currentIndex + 1 >= total ? "See Results →" : "Next Question →"}
            </button>
          )}
        </div>

        {/* Score tracker */}
        <div className="mt-6 flex justify-center gap-2">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentIndex ? "bg-violet-400" : i === currentIndex ? "bg-white" : "bg-white/20"
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

export default HostLobby;