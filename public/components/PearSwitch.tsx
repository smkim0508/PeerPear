interface PearSwitchProps {
  options: string[];
  activeOption: string;
  onOptionChange: (option: string) => void;
  className?: string;
}

export default function PearSwitch({
  options,
  activeOption,
  onOptionChange,
  className,
}: PearSwitchProps) {
  return (
    <div
      className={`inline-flex h-12 items-center bg-[#CCCEC1] rounded-xl p-1.5 gap-1.5 ${className || ""}`}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onOptionChange(option)}
          className={`px-5 h-full rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center ${activeOption === option
            ? "bg-green text-[#1a1a1a] scale-105 shadow-md"
            : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
            }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
