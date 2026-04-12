export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`
        rounded-xl
        px-4
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
