interface PearButtonProps {
    text: string;
    onClick?: () => void;
    dark?: boolean;
    className?: string;
}
export default function PearButton({ text, onClick, dark, className }: PearButtonProps) {
    return (
        <button className={`inline-flex items-center justify-center text-[#1a1a1a] font-bold rounded-lg px-5 py-3 cursor-pointer
        transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:brightness-105 hover:-translate-y-1
    ${dark ? 'bg-dark-beige' : 'bg-green'} ${className || ''} `} onClick={onClick}> {text} </button>
    )
}