import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useWebSocket } from "../hooks/useWebSocket";

const API_URL = "http://localhost:8080/api";

const ANSWER_COLORS = [
  { base: "bg-red-500",    hover: "hover:bg-red-400",    ring: "ring-red-300",    check: "bg-red-600" },
  { base: "bg-blue-500",   hover: "hover:bg-blue-400",   ring: "ring-blue-300",   check: "bg-blue-600" },
  { base: "bg-yellow-500", hover: "hover:bg-yellow-400", ring: "ring-yellow-300", check: "bg-yellow-600" },
  { base: "bg-green-500",  hover: "hover:bg-green-400",  ring: "ring-green-300",  check: "bg-green-600" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

function JoinGame() {
  const { gamePin } = useParams();
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [error, setError] = useState(null);

  // Question phase
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  // For single-correct: selectedAnswer is a Long id or null
  // For multi-correct: selectedAnswers is a Set of ids
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Result phase
  const [questionResult, setQuestionResult] = useState(null);

  // Final leaderboard
  const [gameFinished, setGameFinished] = useState(false);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft === 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const onKicked = useCallback(() => {
    setKicked(true);
    setJoined(false);
  }, []);

  const onQuestion = useCallback((question) => {
    // Shuffle answers so each player sees a different order
    const shuffled = [...question.answers].sort(() => Math.random() - 0.5);
    setCurrentQuestion({ ...question, answers: shuffled });
    setTimeLeft(question.timeLimit);
    setSelectedAnswer(null);
    setSelectedAnswers(new Set());
    setSubmitted(false);
    setSubmitResult(null);
    setQuestionResult(null);
  }, []);

  const onQuestionResult = useCallback((result) => {
    setQuestionResult(result);
  }, []);

  const onGameEnded = useCallback((data) => {
    setFinalLeaderboard(data.leaderboard || []);
    setGameFinished(true);
  }, []);

  useWebSocket({
    gamePin: joined ? parseInt(gamePin) : null,
    nickname: joined ? nickname : null,
    onPlayersUpdate: () => {},
    onKicked,
    onQuestion,
    onQuestionResult,
    onGameEnded,
  });

  function handleJoin() {
    if (!nickname.trim()) {
      setError("Please enter a nickname!");
      return;
    }
    setJoined(true);
  }

  // Single correct answer — tap to submit immediately
  async function handleSingleAnswer(answerId) {
    if (submitted || timeLeft === 0) return;
    setSelectedAnswer(answerId);
    setSubmitted(true);
    await postAnswer([answerId]);
  }

  // Multiple correct — toggle selection
  function toggleMultiAnswer(answerId) {
    if (submitted || timeLeft === 0) return;
    setSelectedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(answerId)) next.delete(answerId);
      else next.add(answerId);
      return next;
    });
  }

  // Multiple correct — explicit submit button
  async function handleMultiSubmit() {
    if (submitted || selectedAnswers.size === 0 || timeLeft === 0) return;
    setSubmitted(true);
    await postAnswer([...selectedAnswers]);
  }

  async function postAnswer(answerIds) {
    try {
      const response = await axios.post(`${API_URL}/sessions/${gamePin}/answer`, {
        nickname,
        questionId: currentQuestion.questionId,
        answerIds,
      });
      setSubmitResult(response.data);
    } catch (err) {
      console.error("Failed to submit answer", err);
    }
  }

  // ── GAME FINISHED ─────────────────────────────────────────────────────────
  if (gameFinished) {
    const myEntry = finalLeaderboard.find(e => e.nickname === nickname);
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏆</span>
            </div>
            <h1 className="text-3xl font-black mb-1">Game Over!</h1>
            {myEntry && (
              <p className="text-white/60 text-lg mt-2">
                You finished {myEntry.position <= 3 ? MEDAL[myEntry.position - 1] : `#${myEntry.position}`} with <span className="text-violet-400 font-bold">{myEntry.score} pts</span>
              </p>
            )}
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white/40 uppercase tracking-widest text-sm mb-4">Final Leaderboard</h3>
            {finalLeaderboard.map((entry) => {
              const isMe = entry.nickname === nickname;
              return (
                <div key={entry.position} className={`flex items-center gap-4 py-3 border-b border-white/5 last:border-0 ${isMe ? "text-violet-300" : ""}`}>
                  <span className="text-2xl w-8 text-center">{entry.position <= 3 ? MEDAL[entry.position - 1] : `${entry.position}.`}</span>
                  <span className="flex-1 font-semibold">{entry.nickname}{isMe ? " (you)" : ""}</span>
                  <span className="font-bold">{entry.score} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── KICKED ────────────────────────────────────────────────────────────────
  if (kicked) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-gray-900 border border-red-500/30 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-400">You have been kicked</h1>
          <p className="text-white/40">The host removed you from this game.</p>
        </div>
      </div>
    );
  }

  // ── RESULT PHASE ──────────────────────────────────────────────────────────
  if (joined && currentQuestion && questionResult) {
    const myPosition = questionResult.leaderboard.find(e => e.nickname === nickname);
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {submitResult ? (
            <div className={`rounded-2xl p-5 text-center mb-5 ${submitResult.correct ? "bg-green-500/20 border border-green-500/40" : "bg-red-500/20 border border-red-500/40"}`}>
              <p className="text-3xl mb-1">{submitResult.correct ? "✓" : "✗"}</p>
              <p className="font-bold text-lg">{submitResult.correct ? "Correct!" : "Wrong answer"}</p>
              {submitResult.correct && <p className="text-white/60 text-sm mt-1">+{submitResult.scoreAwarded} points</p>}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center mb-5">
              <p className="text-white/40">Time's up — you didn't answer</p>
              <p className="text-white/30 text-sm">0 points</p>
            </div>
          )}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 text-center mb-5">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-1">Total Score</p>
            <p className="text-4xl font-black text-violet-400">{submitResult ? submitResult.totalScore : "—"}</p>
            {myPosition && (
              <p className="text-white/40 text-sm mt-1">
                {myPosition.position <= 3 ? MEDAL[myPosition.position - 1] : `#${myPosition.position}`} in top 5
              </p>
            )}
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-3">Leaderboard</p>
            {questionResult.leaderboard.map((entry) => {
              const isMe = entry.nickname === nickname;
              return (
                <div key={entry.position} className={`flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 ${isMe ? "text-violet-300" : ""}`}>
                  <span className="text-lg w-7 text-center">{entry.position <= 3 ? MEDAL[entry.position - 1] : `${entry.position}.`}</span>
                  <span className="flex-1 font-medium">{entry.nickname}{isMe ? " (you)" : ""}</span>
                  <span className="font-bold">{entry.score} pts</span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-white/30 text-sm">Waiting for next question...</p>
        </div>
      </div>
    );
  }

  // ── QUESTION PHASE ────────────────────────────────────────────────────────
  if (joined && currentQuestion) {
    const progress = timeLeft !== null ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
    const timerColor = timeLeft <= 5 ? "text-red-400" : "text-white";
    const isMultiple = currentQuestion.multipleCorrect;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-3 text-sm text-white/50">
            <span>
              Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}
              {isMultiple && <span className="ml-2 text-violet-400 text-xs uppercase tracking-widest">Select all correct</span>}
            </span>
            <span className={`text-3xl font-black tabular-nums ${timerColor}`}>{timeLeft}s</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full mb-8">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>

          {currentQuestion.imageUrl && (
            <img src={currentQuestion.imageUrl} alt="" className="w-full max-h-52 object-cover rounded-2xl mb-6" />
          )}

          <h2 className="text-white text-2xl font-semibold text-center mb-8 leading-snug">
            {currentQuestion.text}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.answers.map((answer, i) => {
              const colors = ANSWER_COLORS[i % 4];
              if (isMultiple) {
                const isSelected = selectedAnswers.has(answer.id);
                return (
                  <button
                    key={answer.id}
                    disabled={submitted || timeLeft === 0}
                    onClick={() => toggleMultiAnswer(answer.id)}
                    className={`${colors.base} ${colors.hover} ${isSelected ? `ring-4 ${colors.ring} scale-95` : "opacity-80"}
                      text-white font-semibold py-7 px-4 rounded-2xl text-base
                      transition-all duration-150 disabled:cursor-not-allowed
                      flex items-center gap-3`}
                  >
                    <span className={`w-5 h-5 rounded border-2 border-white/60 flex-shrink-0 flex items-center justify-center ${isSelected ? "bg-white" : ""}`}>
                      {isSelected && <span className="text-gray-900 text-xs font-black">✓</span>}
                    </span>
                    {answer.text}
                  </button>
                );
              } else {
                const isSelected = selectedAnswer === answer.id;
                return (
                  <button
                    key={answer.id}
                    disabled={submitted || timeLeft === 0}
                    onClick={() => handleSingleAnswer(answer.id)}
                    className={`${colors.base} ${colors.hover} ${isSelected ? `ring-4 ${colors.ring} scale-95` : "opacity-90"}
                      text-white font-semibold py-7 px-4 rounded-2xl text-base
                      transition-all duration-150 disabled:cursor-not-allowed`}
                  >
                    {answer.text}
                  </button>
                );
              }
            })}
          </div>

          {/* Submit button for multiple correct */}
          {isMultiple && !submitted && (
            <button
              onClick={handleMultiSubmit}
              disabled={selectedAnswers.size === 0 || timeLeft === 0}
              className="w-full mt-6 py-4 rounded-xl font-bold bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Submit {selectedAnswers.size > 0 ? `(${selectedAnswers.size} selected)` : ""}
            </button>
          )}

          {submitted && !questionResult && (
            <p className="text-center text-white/40 text-sm mt-6">✓ Answer submitted — waiting for results</p>
          )}
          {timeLeft === 0 && !submitted && (
            <p className="text-center text-red-400/70 text-sm mt-6">Time's up!</p>
          )}
        </div>
      </div>
    );
  }

  // ── WAITING PHASE ─────────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">You're in!</h1>
          <p className="text-white/40 mb-6">Waiting for the host to start the game...</p>
          <div className="bg-white/5 rounded-xl p-4 mb-4">
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

  // ── JOIN SCREEN ───────────────────────────────────────────────────────────
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
