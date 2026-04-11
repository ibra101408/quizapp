import { useEffect, useState } from "react";
import AnswerButton from "./AnswerButton";

export default function PlayerView() {
  const player = {
    nickname: "Mary",
    score: 982,
  };

  // Question Data Base
  const question = {
    text: "Who invented the lightbulb?",
    timeLimit: 30,
    answers: [
      { id: 1, text: "Thomas Edison" },
      { id: 2, text: "Benjamin Franklin" },
      { id: 3, text: "Nikola Tesla" },
      { id: 4, text: "Marie Curie" },
    ],
  };

  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [selected, setSelected] = useState(null);

  // Timer

  //   useEffect(() => {
  //   setTimeLeft(question.timeLimit);
  // }, [question]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Answer

  const handleAnswer = (id) => {
    if (selected) return;
    setSelected(id);
  };

  const colors = [
    "bg-[#A78BFA]/20 border border-[#A78BFA]/40 hover:bg-[#A78BFA]/30",
    "bg-gray-800 border border-gray-700 hover:bg-gray-700",
    "bg-[#5f47a5] border border-[#7c5fd1] hover:bg-[#6d55b8]", // 👈 новая 3-я кнопка
    "bg-[#A78BFA] text-black hover:bg-[#c4b5fd]",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* HEADER — как в HostCreateGame */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-gray-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Q квадрат */}
          <div className="w-8 h-8 rounded-lg bg-[#A78BFA] flex items-center justify-center text-sm font-bold text-black">
            Q
          </div>

          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Quiz Game
          </span>
        </div>

        {/* PLAYER INFO */}
        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold text-white">
            {player.nickname}
          </div>
          <div className="text-lg font-bold text-[#A78BFA]">{player.score}</div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* QUESTION INFO */}
        <div className="mb-6 text-left">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
            Question 1
          </p>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-white/50">⏱ {timeLeft}s</span>
          </div>

          <h1 className="text-2xl font-bold text-white">{question.text}</h1>
        </div>

        {/* ANSWERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.answers.map((answer, index) => (
            <AnswerButton
              key={answer.id}
              text={answer.text}
              color={colors[index]}
              selected={selected === answer.id}
              onClick={() => handleAnswer(answer.id)}
            />
          ))}
        </div>

        {/* FOOTER */}
        <div className="text-center text-white/30 text-xs mt-8">
          Choose wisely
        </div>
      </div>
    </div>
  );
}
