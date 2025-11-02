interface PearSwitchProps {
  option1: string;
  option2: string;
  activeOption: string;
  onOptionChange: (option: string) => void;
  className?: string;
}

export default function PearSwitch({
  option1,
  option2,
  activeOption,
  onOptionChange,
  className,
}: PearSwitchProps) {
  return (
    <div
      className={`inline-flex bg-[#CCCEC1] rounded-xl p-1.5 mb-5 ${
        className || ""
      }`}
    >
      <button
        onClick={() => onOptionChange(option1)}
        className={`px-5 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 ${
          activeOption === option1
            ? "bg-[#D7FF9C] text-[#1a1a1a] scale-105 shadow-md"
            : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
        }`}
      >
        {option1}
      </button>
      <button
        onClick={() => onOptionChange(option2)}
        className={`px-5 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 ${
          activeOption === option2
            ? "bg-[#D7FF9C] text-[#1a1a1a] scale-105 shadow-md"
            : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
        }`}
      >
        {option2}
      </button>
    </div>
  );
}
