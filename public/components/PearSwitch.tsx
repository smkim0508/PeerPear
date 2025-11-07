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
      className={`inline-flex bg-[#CCCEC1] rounded-xl p-1.5 mb-5 ${className || ""
        }`}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onOptionChange(option)}
          className={`px-5 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 ${activeOption === option
              ? "bg-[#D7FF9C] text-[#1a1a1a] scale-105 shadow-md"
              : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
            }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
