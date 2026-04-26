import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useWebSocket } from "../hooks/useWebSocket";

const API_URL = process.env.REACT_APP_API_URL

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

  // Persistent score across questions
  const [score, setScore] = useState(0);

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
    console.log("New question received", question);
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
      setScore(response.data.totalScore);
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
            <p className="text-4xl font-black text-violet-400">{score}</p>
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
    const isMultiple = currentQuestion.multipleCorrect;

    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex flex-col overflow-hidden">
        {/* Progress Bar - Top of screen */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10 z-50">
          <div 
            className="h-full bg-violet-500 transition-all duration-1000 ease-linear" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-3 text-sm text-white/50">
            <span>
              Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}
              {isMultiple && <span className="ml-2 text-violet-400 text-xs uppercase tracking-widest">Select all correct</span>}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-violet-400 font-bold tabular-nums">{score} pts</span>
              <span className={`text-3xl font-black tabular-nums ${timerColor}`}>{timeLeft}s</span>
            </div>
          </div>

        {/* Top Section: Question, Media, Timer (Approx 50% height now) */}
        <div className="h-[50%] flex flex-col items-center justify-between p-4 pb-2 text-center relative">
          
          {/* Info bar (Question X of Y) */}
          <div className="flex justify-between w-full z-10 px-2 mt-2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {currentQuestion.questionIndex + 1} / {currentQuestion.totalQuestions}
            </span>
          </div>

          {/* Hero Image Container */}
          {currentQuestion.imageUrl && (
            <div className="absolute inset-x-4 top-14 bottom-12 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl z-0">
               {/* Animated Timer Overlay */}
               <div className="absolute top-3 right-3 bg-gray-950/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 z-10">
                 <span className={`text-4xl font-black tabular-nums ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                   {timeLeft}
                 </span>
               </div>

              <img src={currentQuestion.imageUrl} alt="" className="w-full h-full object-contain bg-black/30" />
            </div>
          )}

          {/* Question Text (Stays visible even if no image) */}
          <h2 className="text-xl md:text-2xl font-bold leading-tight z-10 mt-auto pb-1 px-4 drop-shadow-md">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Bottom Section: Answer Buttons (The "Kahoot" Grid - 50% height) */}
        <div className="h-[50%] grid grid-cols-2 grid-rows-2 gap-2 p-2 pb-6">
          {currentQuestion.answers.map((answer, i) => {
            const colors = ANSWER_COLORS[i % 4];
            const isSelected = isMultiple ? selectedAnswers.has(answer.id) : selectedAnswer === answer.id;

            return (
              <button
                key={answer.id}
                disabled={submitted || timeLeft === 0}
                onClick={() => isMultiple ? toggleMultiAnswer(answer.id) : handleSingleAnswer(answer.id)}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95
                  ${colors.base} 
                  ${isSelected ? 'ring-8 ring-white/30 z-10 scale-95 shadow-inner' : 'opacity-100'}
                  ${submitted && !isSelected ? 'opacity-40 grayscale-[0.5]' : ''}
                  disabled:cursor-not-allowed
                `}
              >
                {/* Kahoot-style icons */}
                <div className="absolute top-3 left-3 opacity-30">
                  {i === 0 && <div className="w-6 h-6 border-4 border-white rotate-45" />}
                  {i === 1 && <div className="w-6 h-6 border-4 border-white rounded-full" />}
                  {i === 2 && <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-white" />}
                  {i === 3 && <div className="w-6 h-6 border-4 border-white" />}
                </div>

                <span className="text-xl font-black text-center drop-shadow-md">
                  {answer.text}
                </span>

                {isSelected && (
                  <div className="absolute bottom-3 right-3 bg-white text-gray-900 rounded-full w-6 h-6 flex items-center justify-center font-black animate-bounce">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Overlays (Multi-Select, Waiting) - Keep these as they were */}
        {isMultiple && !submitted && selectedAnswers.size > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-20">
            <button
              onClick={handleMultiSubmit}
              className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-2xl animate-bounce"
            >
              SUBMIT {selectedAnswers.size}
            </button>
          </div>
        )}

        {submitted && !questionResult && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
             <div className="text-center p-6 bg-gray-900 rounded-3xl border border-white/10 shadow-2xl">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-bold">Answer Received!</p>
                <p className="text-white/40 text-sm mt-1">Waiting for others to finish...</p>
             </div>
          </div>
        )}
      </div>
    );
  }
  
  // ── WAITING PHASE ─────────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-between p-6">
        {/* Top Header - Mobile Style */}
        <div className="w-full flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Playing as</p>
            <p className="text-lg font-bold text-violet-400">{nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Game PIN</p>
            <p className="text-lg font-black tracking-tight">{gamePin}</p>
          </div>
        </div>

        {/* Center Content - Pulsing Animation */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
             {/* Animated Pulsing Rings */}
            <div className="absolute inset-0 bg-violet-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)]">
              <span className="text-4xl">🎮</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-black mb-3 italic">You're in!</h1>
          <p className="text-white/50 text-base max-w-[200px]">
            Check your name on the big screen
          </p>
        </div>

        {/* Bottom Status Bar */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-3 bg-white/5 py-4 px-6 rounded-full border border-white/5 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <p className="text-sm font-medium text-white/60">Waiting for host to start...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── JOIN SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Minimal Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg mb-8 rotate-3">
          <span className="text-2xl font-black italic">Q</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight mb-2">Join Game</h1>
            <p className="text-white/40">Enter a nickname to start playing</p>
          </div>

          <div className="space-y-4">
             <div className="relative">
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                  maxLength={20}
                  className="w-full bg-gray-900 border-2 border-white/10 rounded-2xl px-6 py-5 text-xl font-bold text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-all text-center"
                />
             </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
                <p className="text-red-400 text-center text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={!nickname.trim()}
              className="w-full py-5 rounded-2xl font-black text-xl bg-violet-500 hover:bg-violet-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_8px_0_rgb(109,40,217)] active:shadow-none active:translate-y-1"
            >
              Ready!
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer info for mobile users */}
      <p className="text-center text-white/20 text-[10px] uppercase tracking-widest mt-8">
        Game PIN: {gamePin}
      </p>
    </div>
  );
}

export default JoinGame;
