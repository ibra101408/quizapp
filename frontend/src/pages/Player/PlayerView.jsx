import { useEffect, useState } from "react";
import AnswerButton from "../../components/game/AnswerButton";

export default function PlayerView() {
  const player = {
    nickname: "Mary",
    score: 982,
  };

  const question = {
    text: "Who invented the lightbulb?",
    timeLimit: 30,
    multipleCorrect: true,
    answers: [
      { id: 1, text: "Thomas Edison" },
      { id: 2, text: "Benjamin Franklin" },
      { id: 3, text: "Nikola Tesla" },
      { id: 4, text: "Marie Curie" },
    ],
  };

  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [selected, setSelected] = useState([]);

  // TIMER
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

  const handleSelect = (id) => {
    if (question.multipleCorrect) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  };

  const colors = [
    "bg-[#A78BFA]/20 border border-[#A78BFA]/40",
    "bg-gray-800 border border-gray-700",
    "bg-[#5f47a5] border border-[#7c5fd1]",
    "bg-[#A78BFA] text-black",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* HEADER */}
      <div className="border-b border-white/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-gray-900/60 backdrop-blur-sm">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="w-8 h-8 rounded-lg bg-[#A78BFA] flex items-center justify-center text-sm font-bold text-black">
            {" "}
            Q{" "}
          </div>{" "}
          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            {" "}
            Quiz Game{" "}
          </span>{" "}
        </div>{" "}
        <div className="flex items-center gap-4">
          {" "}
          <div className="text-base md:text-lg font-semibold">
            {" "}
            {player.nickname}{" "}
          </div>{" "}
          <div className="text-base md:text-lg font-bold text-[#A78BFA]">
            {" "}
            {player.score}{" "}
          </div>{" "}
        </div>{" "}
      </div>

      {/* CONTENT */}
      <div className="flex-1 px-6 md:px-6 py-10 flex flex-col w-full md:max-w-4xl md:mx-auto">
        {/* QUESTION */}
        <div className="mb-6">
          <div className="text-xs uppercase text-white/40 mb-2">Question 1</div>

          {/* TIMER */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`text-4xl font-bold ${
                timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-[#A78BFA]"
              }`}
            >
              {timeLeft}
            </div>
            <span className="text-xs text-white/40">SEC</span>
          </div>

          <h1 className="text-lg font-semibold leading-snug">
            {question.text}
          </h1>
          {question.multipleCorrect && (
            <p className="text-xs text-[#A78BFA]/70 mt-2">Select all that apply</p>
          )}
        </div>
        {/* ANSWERS */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 w-full">
          {question.answers.map((answer, index) => (
            <AnswerButton
              key={answer.id}
              text={answer.text}
              color={colors[index]}
              selected={selected.includes(answer.id)}
              onClick={() => handleSelect(answer.id)}
            />
          ))}
        </div>
        {/* FOOTER */}
        <div className="mt-auto text-center text-xs text-white/30 pt-6">
          Choose wisely
        </div>
      </div>
    </div>
  );
}
