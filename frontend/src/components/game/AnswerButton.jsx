import Button from "../ui/Button";

export default function AnswerButton({ text, color, selected, onClick, disabled }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full
        h-24 md:h-28
        text-left
        flex items-center
        text-sm md:text-base font-medium

        ${color}

        ${
          selected
            ? "ring-2 ring-[#A78BFA] border-[#A78BFA] shadow-lg shadow-[#A78BFA]/30 scale-[1.02]"
            : "border border-white/10"
        }

        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-95"}
      `}
    >
      {text}
    </Button>
  );
}
