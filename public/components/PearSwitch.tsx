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
      className={`
       flex flex-col sm:flex-row      /* vertical on mobile, horizontal on sm+ */
        bg-[#CCCEC1]
        rounded-xl
        p-2
        gap-2
        w-fit               
        mx-auto             
        ${className || ""}
      `}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onOptionChange(option)}
          className={`
            
            px-5 py-2 
            rounded-lg
            font-semibold text-sm
            cursor-pointer 
            transition-all duration-300
            
            
            flex items-center justify-center
            ${
              activeOption === option
                ? "bg-green text-[#1a1a1a] shadow-md scale-100 sm:scale-105"
                : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
