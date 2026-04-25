import { Users, Play, ChevronRight, Clock, CheckCircle, XCircle, Trophy } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/authService";

const API_URL = "http://localhost:8080/api";

const ANSWER_COLORS = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];
const MEDAL = ["🥇", "🥈", "🥉"];

function HostLobby() {
  const { state } = useLocation();
  const { gamePin } = useParams();
  const session = state?.session;
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [phase, setPhase] = useState("waiting"); // waiting | playing | result | finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answerCount, setAnswerCount] = useState({ answered: 0, total: 0 });
  const [questionResult, setQuestionResult] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const questionEndedRef = useRef(false);

  useEffect(() => {
    if (timeLeft === null || timeLeft === 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleEndQuestion = useCallback(async () => {
    if (questionEndedRef.current) return;
    questionEndedRef.current = true;
    setTimeLeft(0);
    try {
      await axios.put(`${API_URL}/sessions/${gamePin}/end-question`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Failed to end question", err);
      questionEndedRef.current = false;
    }
  }, [gamePin]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "playing" && !questionEndedRef.current) {
      handleEndQuestion();
    }
  }, [timeLeft, phase, handleEndQuestion]);

  const onQuestion = useCallback((question) => {
    const shuffled = [...question.answers].sort(() => Math.random() - 0.5);
    setCurrentQuestion({ ...question, answers: shuffled });
    setTimeLeft(question.timeLimit);
    setAnswerCount({ answered: 0, total: 0 });
    setQuestionResult(null);
    questionEndedRef.current = false;
    setPhase("playing");
  }, []);

  const onQuestionResult = useCallback((result) => {
    setQuestionResult(result);
    setPhase("result");
  }, []);

  const onAnswerCount = useCallback((count) => {
    setAnswerCount(count);
  }, []);

  const onGameEnded = useCallback((data) => {
    setFinalLeaderboard(data.leaderboard || []);
    setPhase("finished");
  }, []);

  useWebSocket({
    gamePin: gamePin ? parseInt(gamePin) : null,
    nickname: null,
    onPlayersUpdate: (updatedPlayers) => setPlayers([...updatedPlayers]),
    onQuestion,
    onQuestionResult,
    onAnswerCount,
    onGameEnded,
  });

  async function handleKick(nickname) {
    if (!window.confirm(`Kick ${nickname}?`)) return;
    try {
      await axios.delete(`${API_URL}/sessions/${gamePin}/players/${nickname}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Failed to kick player", err);
    }
  }

  async function handleStart() {
    try {
      await axios.put(`${API_URL}/sessions/${gamePin}/start`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setGameStarted(true);
    } catch (err) {
      console.error("Failed to start game", err);
      alert("Failed to start game.");
    }
  }

  async function handleNextQuestion() {
    try {
      await axios.put(`${API_URL}/sessions/${gamePin}/next-question`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Failed to advance question", err);
      alert("Failed to advance question.");
    }
  }

  async function handleEndGame() {
    if (!window.confirm("End the quiz for all players?")) return;
    try {
      await axios.put(`${API_URL}/sessions/${gamePin}/end-game`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Failed to end game", err);
      alert("Failed to end game.");
    }
  }

  if (!session) return <div className="text-white">Loading session...</div>;

  // ── FINISHED PHASE ────────────────────────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-yellow-400" size={32} />
            </div>
            <h1 className="text-3xl font-black mb-1">Game Over!</h1>
            <p className="text-white/40">{session.quizTitle}</p>
          </div>

          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white/40 uppercase tracking-widest text-sm mb-4">Final Leaderboard</h3>
            {finalLeaderboard.length === 0 ? (
              <p className="text-white/30 text-center py-4">No players</p>
            ) : (
              finalLeaderboard.map((entry) => (
                <div key={entry.position} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                  <span className="text-2xl w-8 text-center">
                    {entry.position <= 3 ? MEDAL[entry.position - 1] : <span className="text-white/40 font-black">{entry.position}</span>}
                  </span>
                  <span className="flex-1 font-semibold">{entry.nickname}</span>
                  <span className="text-violet-400 font-bold">{entry.score} pts</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate("/Home")}
            className="w-full py-4 rounded-xl font-bold bg-violet-500 hover:bg-violet-400 transition"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ── RESULT PHASE ──────────────────────────────────────────────────────────
  if (phase === "result" && questionResult) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
        <div className="w-full max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-white/40 text-sm uppercase tracking-widest">{session.quizTitle}</p>
              <p className="text-white/60 text-sm">Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}</p>
            </div>
            <button onClick={handleEndGame} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition">
              <XCircle size={16} /> End Quiz
            </button>
          </div>

          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-white/40 text-sm mb-2 uppercase tracking-widest">Question {currentQuestion.questionIndex + 1}</p>
            <h2 className="text-xl font-semibold mb-5">{currentQuestion.text}</h2>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, i) => {
                const isCorrect = questionResult.correctAnswerIds.includes(answer.id);
                return (
                  <div key={answer.id} className={`${ANSWER_COLORS[i % 4]} ${isCorrect ? "ring-4 ring-white" : "opacity-40"} rounded-xl px-4 py-4 font-semibold flex items-center gap-2 transition-all`}>
                    {isCorrect && <CheckCircle size={18} />}
                    {answer.text}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white/40 uppercase tracking-widest text-sm mb-4">Top Players</h3>
            {questionResult.leaderboard.map((entry) => (
              <div key={entry.position} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                <span className={`text-2xl font-black w-8 text-center ${entry.position === 1 ? "text-yellow-400" : entry.position === 2 ? "text-gray-300" : entry.position === 3 ? "text-amber-600" : "text-white/40"}`}>
                  {entry.position}
                </span>
                <span className="flex-1 font-semibold">{entry.nickname}</span>
                <span className="text-violet-400 font-bold">{entry.score} pts</span>
              </div>
            ))}
          </div>

          <button onClick={handleNextQuestion} className="w-full py-4 rounded-xl font-bold bg-violet-500 hover:bg-violet-400 transition flex items-center justify-center gap-2">
            Next Question <ChevronRight />
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING PHASE ─────────────────────────────────────────────────────────
  if (phase === "playing" && currentQuestion) {
    const timerPct = timeLeft !== null ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
    const timerColor = timeLeft <= 5 ? "text-red-400" : "text-white";

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
        <div className="w-full max-w-3xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white/40 text-sm uppercase tracking-widest">{session.quizTitle}</p>
              <p className="text-white/60 text-sm">Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-black tabular-nums ${timerColor}`}>{timeLeft}s</span>
              <button onClick={handleEndGame} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition">
                <XCircle size={16} /> End Quiz
              </button>
            </div>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full mb-6">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${timerPct}%` }} />
          </div>

          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-6">{currentQuestion.text}</h2>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, i) => (
                <div key={answer.id} className={`${ANSWER_COLORS[i % 4]} opacity-80 rounded-xl px-4 py-4 font-semibold`}>
                  {answer.text}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <Users className="text-violet-400" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Answered</span>
                <span className="font-bold">{answerCount.answered} / {answerCount.total}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full">
                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: answerCount.total > 0 ? `${(answerCount.answered / answerCount.total) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>

          <button onClick={handleEndQuestion} disabled={questionEndedRef.current} className="w-full py-4 rounded-xl font-bold bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
            <Clock size={18} /> End Question
          </button>
        </div>
      </div>
    );
  }

  // ── WAITING PHASE ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div>
          <h2 className="text-white/40 uppercase tracking-widest text-sm">Quiz Title</h2>
          <h1 className="text-2xl font-bold">{session.quizTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleStart} disabled={gameStarted} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition transform hover:scale-105">
            <Play fill="currentColor" /> {gameStarted ? "Game In Progress" : "Start Game"}
          </button>
          <button onClick={handleEndGame} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition">
            <XCircle size={16} /> End Quiz
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center mb-12 w-full max-w-md shadow-2xl">
        <p className="text-white/40 mb-2 uppercase font-semibold">Join at <span className="text-violet-400">localhost:3000/game/{gamePin}</span></p>
        <h1 className="text-7xl font-black tracking-tighter text-white">{gamePin}</h1>
      </div>

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
                <button onClick={() => handleKick(p)} className="absolute top-1 right-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition text-xs px-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HostLobby;
