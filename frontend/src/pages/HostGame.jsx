import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket"; // Ensure your hook supports the new topic
import { Timer, Users, ChevronRight } from "lucide-react";

function HostGame() {
  const { gamePin } = useParams();
  const { state } = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Subscribe to the question topic
  useWebSocket({
    gamePin: parseInt(gamePin),
    onQuestionReceived: (question) => {
        console.log("Received question:", question);
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit);
    },
  });

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-xl font-medium">Preparing first question...</div>
      </div>
    );
  }

  const colors = ["bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500"];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top Header */}
      <div className="p-6 flex justify-between items-center bg-gray-900/50 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="bg-violet-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}
          </div>
          <h2 className="text-lg font-semibold text-white/70">{state?.session?.quizTitle}</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-violet-400">
            <Timer size={24} />
            <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-white/40" />
            <span className="font-bold">0 Answers</span> {/* We'll link this to real-time count later */}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 leading-tight">
          {currentQuestion.text}
        </h1>

        {/* Image Display */}
        {currentQuestion.imageUrl && (
          <div className="w-full max-w-2xl aspect-video rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl mb-12">
            <img 
              src={currentQuestion.imageUrl} 
              alt="Question" 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Answers Grid (Host view shows options but doesn't allow clicking) */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {currentQuestion.answers.map((answer, index) => (
            <div 
              key={answer.id}
              className={`${colors[index % 4]} p-6 rounded-2xl flex items-center gap-4 shadow-lg`}
            >
              <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center font-bold text-xl">
                {String.fromCharCode(65 + index)}
              </div>
              <span className="text-2xl font-semibold">{answer.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="p-6 border-t border-white/10 bg-gray-900/50 flex justify-end">
        <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
          Next Question <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default HostGame;