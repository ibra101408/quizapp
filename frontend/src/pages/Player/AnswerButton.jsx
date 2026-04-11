export default function AnswerButton({ text, color, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      className={`
        ${color}
        w-full
        h-20 md:h-28
        rounded-xl
        px-4
        text-left
        flex items-center
        text-sm md:text-base font-medium
        
        transition-all duration-150
        hover:scale-[1.01]
        active:scale-95
        
        ${selected ? "ring-2 ring-[#A78BFA]" : ""}
      `}
    >
      {text}
    </button>
  );
}
