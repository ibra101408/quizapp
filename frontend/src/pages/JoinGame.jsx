import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Volume2, VolumeX } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useGameMusic } from "../hooks/useGameMusic";
import AnimatedLeaderboard from "../components/game/AnimatedLeaderboard";
import { useDelayedLeaderboard } from "../hooks/useDelayedLeaderboard";

const API_URL = process.env.REACT_APP_API_URL

// 10 distinct colors — supports up to 10 answers per question
const ANSWER_COLORS = [
  { base: "bg-red-500" },
  { base: "bg-blue-500" },
  { base: "bg-yellow-500" },
  { base: "bg-green-500" },
  { base: "bg-purple-500" },
  { base: "bg-pink-500" },
  { base: "bg-orange-500" },
  { base: "bg-cyan-500" },
  { base: "bg-lime-500" },
  { base: "bg-indigo-500" },
];

// One unique shape per answer slot, all 24x24, white outlined
function AnswerShape({ index }) {
  const p = { className: "w-6 h-6", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" };
  switch (index % 10) {
    case 0: return <svg {...p}><polygon points="12,2 22,12 12,22 2,12" /></svg>;       // diamond
    case 1: return <svg {...p}><circle cx="12" cy="12" r="10" /></svg>;                 // circle
    case 2: return <svg {...p}><polygon points="12,3 22,21 2,21" /></svg>;              // triangle
    case 3: return <svg {...p}><rect x="3" y="3" width="18" height="18" /></svg>;       // square
    case 4: return <svg {...p}><polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" /></svg>; // star
    case 5: return <svg {...p}><path d="M12 21s-7-5-7-11a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-7 11-7 11z" /></svg>; // heart
    case 6: return <svg {...p}><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" /></svg>; // hexagon
    case 7: return <svg {...p}><polygon points="12,2 22,10 18,22 6,22 2,10" /></svg>;   // pentagon
    case 8: return <svg {...p}><path d="M12 4v16M4 12h16" /></svg>;                     // plus
    case 9: return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>; // moon
    default: return null;
  }
}

// Make grid rows match answer count → all answer boxes get equal height
function answerRowsClass(n) {
  if (n <= 2) return "grid-rows-1";
  if (n <= 4) return "grid-rows-2";
  if (n <= 6) return "grid-rows-3";
  if (n <= 8) return "grid-rows-4";
  return "grid-rows-5"; // 9–10
}

const MEDAL = ["🥇", "🥈", "🥉"];

function JoinGame() {
  const { gamePin } = useParams();
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [error, setError] = useState(null);
  const { 
    displayLeaderboard, 
    isUpdating, 
    updateLeaderboard 
  } = useDelayedLeaderboard(1000);
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

  // Restore session from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("quizSession") || "null");
    if (saved && saved.gamePin === gamePin) {
      setNickname(saved.nickname);
      setScore(saved.score || 0);
      setJoined(true);
      if (saved.currentQuestion) setCurrentQuestion(saved.currentQuestion);
      if (saved.submitted) setSubmitted(saved.submitted);
      if (saved.submitResult) setSubmitResult(saved.submitResult);
      if (saved.questionResult) setQuestionResult(saved.questionResult);
    }
  }, [gamePin]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("quizSession") || "null");
    if (saved && saved.gamePin === gamePin) {
      localStorage.setItem("quizSession", JSON.stringify({
        ...saved,
        score,
        currentQuestion,
        submitted,
        submitResult,
        questionResult,
      }));
    }
  }, [score, currentQuestion, submitted, submitResult, questionResult, gamePin]);

  // Final leaderboard
  const [gameFinished, setGameFinished] = useState(false);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  const phase = !joined ? null
    : gameFinished     ? "finished"
    : questionResult   ? "result"
    : currentQuestion  ? "playing"
    :                    "waiting";
  const audioEnabled = currentQuestion?.audioEnabled ?? true;
  const { muted, toggleMute } = useGameMusic(phase, audioEnabled);
  const muteButton = (
    <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"} className="text-white/60 hover:text-white transition">
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );

  // Countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft === 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const onKicked = useCallback(() => {
    setKicked(true);
    setJoined(false);
    localStorage.removeItem("quizSession");
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
    
    if (result.leaderboard) {
      updateLeaderboard(result.leaderboard);
    }
  }, [updateLeaderboard]);

  const onGameEnded = useCallback((data) => {
    setFinalLeaderboard(data.leaderboard || []);
    setGameFinished(true);
    localStorage.removeItem("quizSession");
  }, []);

  const onJoinRejected = useCallback((reason) => {
    setError(reason || "Join rejected");
    setJoined(false);
    localStorage.removeItem("quizSession");
  }, []);

  useWebSocket({
    gamePin: joined ? parseInt(gamePin) : null,
    nickname: joined ? nickname : null,
    onPlayersUpdate: () => {},
    onKicked,
    onQuestion,
    onQuestionResult,
    onGameEnded,
    onJoinRejected,
  });

  function handleJoin() {
    if (!nickname.trim()) {
      setError("Please enter a nickname!");
      return;
    }
    setError(null);
    localStorage.setItem("quizSession", JSON.stringify({ gamePin, nickname, score: 0 }));
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
                  <span className="flex-1 font-semibold text-base">{entry.nickname}{isMe ? " (you)" : ""}</span>
                  <span className="font-bold text-base">{entry.score} pts</span>
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
          {/*<div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-3">Leaderboard</p>
            {questionResult.leaderboard.map((entry) => {
              const isMe = entry.nickname === nickname;
              return (
                <div key={entry.position} className={`flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 ${isMe ? "text-violet-300" : ""}`}>
                  <span className="text-lg w-7 text-center">{entry.position <= 3 ? MEDAL[entry.position - 1] : `${entry.position}.`}</span>
                  <span className="flex-1 font-medium text-base">{entry.nickname}{isMe ? " (you)" : ""}</span>
                  <span className="font-bold text-base">{entry.score} pts</span>
                </div>
              );
            })}
          </div>*/}
          <AnimatedLeaderboard 
            leaderboard={displayLeaderboard} 
            isUpdating={isUpdating} 
            title="Top Players"
          />

          <p className="text-center text-white/30 text-sm">Waiting for next question...</p>
        </div>
      </div>
    );
  }

 // ── QUESTION PHASE ────────────────────────────────────────────────────────
  if (joined && currentQuestion) {
    const progress = timeLeft !== null ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
    const isMultiple = currentQuestion.multipleCorrect;
    const answerCount = currentQuestion.answers.length;

    // Dynamic Layout: If > 4 answers, give more space to the grid
    const topHeightClass = answerCount > 4 ? "h-[25%]" : "h-[45%]";
    const bottomHeightClass = answerCount > 4 ? "h-[75%]" : "h-[55%]";

    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex flex-col overflow-hidden">
        {/* 1. Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10 z-50">
          <div 
            className="h-full bg-violet-500 transition-all duration-1000 ease-linear" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        {/* 2. Top Section: Hero Image & Question Text */}
        {/* FIXED: Changed h-[50%] to ${topHeightClass} */}
        <div className={`${topHeightClass} flex flex-col items-center justify-between p-4 pb-2 text-center relative transition-all duration-500`}>
          
          <div className="z-10 w-full">
            <div className="flex justify-between items-center w-full px-2 mt-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {currentQuestion.questionIndex + 1} / {currentQuestion.totalQuestions}
              </span>
              <div className="flex items-center gap-3">
                {muteButton}
                <span className="text-violet-400 font-bold tabular-nums text-sm">
                  {score} pts
                </span>
              </div>
            </div>
          
            <h2 className={`${answerCount > 4 ? 'text-lg' : 'text-xl'} font-bold leading-tight text-center drop-shadow-md mt-2`}>
              {currentQuestion.text}
              {isMultiple && <span className="block text-violet-400 text-[10px] uppercase tracking-[0.2em] mt-1">Multi-Select</span>}
            </h2>
          </div>

          {currentQuestion.imageUrl && (
            <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl z-0 mt-2 w-full max-w-xs mx-auto">
               <div className="absolute top-2 right-2 bg-gray-950/70 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 z-10">
                 <span className={`${answerCount > 4 ? 'text-xl' : 'text-3xl'} font-black tabular-nums ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                   {timeLeft}
                 </span>
               </div>
              <img src={currentQuestion.imageUrl} alt="" className="w-full h-full object-contain bg-black/30" />
            </div>
          )}
        </div>

        {/* 3. Bottom Section: Answer Buttons */}
        <div className={`${bottomHeightClass} flex flex-col p-3 gap-2 transition-all duration-500`}>
          <div className={`flex-1 min-h-0 grid grid-cols-2 ${answerRowsClass(answerCount)} gap-3`}>
            {currentQuestion.answers.map((answer, i) => {
              const colors = ANSWER_COLORS[i % 10];
              const isSelected = isMultiple ? selectedAnswers.has(answer.id) : selectedAnswer === answer.id;

            return (
              <button
                key={answer.id}
                disabled={submitted || timeLeft === 0}
                onClick={() => isMultiple ? toggleMultiAnswer(answer.id) : handleSingleAnswer(answer.id)}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 touch-manipulation overflow-hidden
                  ${colors.base} 
                  ${isSelected ? 'ring-4 ring-white/60 z-10 scale-95 shadow-inner' : 'opacity-100'}
                  ${submitted && !isSelected ? 'opacity-40 grayscale-[0.5]' : ''}
                  disabled:cursor-not-allowed
                `}
              >
                {/* Visual Shape */}
                <div className="absolute top-2 left-2 opacity-20">
                  <AnswerShape index={i} />
                </div>

                {/* FIXED: Dynamic text scaling and line height */}
                <span className={`
                  ${answerCount > 6 ? 'text-[10px]' : answerCount > 4 ? 'text-xs' : 'text-sm'} 
                  font-bold text-center leading-snug px-2 break-words drop-shadow-md w-full
                `}>
                  {answer.text}
                </span>

                {isSelected && (
                  <div className="absolute bottom-2 right-2 bg-white text-gray-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
                    ✓
                  </div>
                )}
              </button>
            );
            })}
          </div>

          {isMultiple && !submitted && selectedAnswers.size > 0 && (
              <button
                  onClick={handleMultiSubmit}
                  className="shrink-0 w-full py-3 bg-white text-black font-black rounded-2xl shadow-xl animate-bounce text-md mb-2"
              >
                SUBMIT {selectedAnswers.size}
              </button>
          )}
        </div>

        {/* Overlay remains the same */}
        {submitted && !questionResult && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60]">
             <div className="text-center p-8 bg-gray-900 rounded-3xl border border-white/10 shadow-2xl">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xl font-bold">Answer Received!</p>
                <p className="text-white/40 text-sm mt-1">Check the big screen...</p>
             </div>
          </div>
        )}
      </div>
    );
  }
  
  // ── WAITING PHASE ─────────────────────────────────────────────────────────
  if (joined) {
    return (
        <div className="fixed inset-0 bg-gray-950 text-white flex flex-col items-center justify-between p-6 overflow-hidden">
        {/* Top Header - Mobile Style */}
        <div className="w-full flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Playing as</p>
            <p className="text-2xl font-bold text-violet-400">{nickname}</p>
          </div>
          <div className="flex items-center gap-3">
            {muteButton}
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Game PIN</p>
              <p className="text-2xl font-black tracking-tight">{gamePin}</p>
            </div>
          </div>
        </div>

        {/* Center Content - Pulsing Animation */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
             {/* Animated Pulsing Rings */}
            <div className="absolute inset-0 bg-violet-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-40 h-40 rounded-full bg-violet-600 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)]">
              <span className="text-7xl">🎮</span>
            </div>
          </div>

          <h1 className="text-7xl font-black mb-3 italic">You're in!</h1>
          <p className="text-white/50 text-3xl max-w-xs">
            Check your name on the big screen
          </p>
        </div>

        {/* Bottom Status Bar */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-3 bg-white/5 py-4 px-6 rounded-full border border-white/5 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <p className="text-xl font-medium text-white/60">Waiting for host to start...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── JOIN SCREEN ───────────────────────────────────────────────────────────
  return (
      <div className="fixed inset-0 bg-gray-950 text-white flex flex-col p-6 overflow-hidden">
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Minimal Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg mb-8 rotate-3">
          <span className="text-2xl font-black italic">Q</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-6xl font-black tracking-tight mb-2">Join Game</h1>
            <p className="text-white/40 text-3xl">Enter a nickname</p>
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
                  className="w-full bg-gray-900 border-2 border-white/10 rounded-2xl px-6 py-7 text-3xl font-bold text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-all text-center"
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
              className="w-full py-7 rounded-2xl font-black text-3xl bg-violet-500 hover:bg-violet-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_8px_0_rgb(109,40,217)] active:shadow-none active:translate-y-1"
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
