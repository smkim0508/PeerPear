interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  return (
    <header className="bg-nav-dark text-white font-sans">
      <div className="max-w-[1200px] mx-auto px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group">
          <img src="/logo.svg" alt="PeerPear logo" className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span className="text-lg font-bold tracking-tight transition-colors duration-300 group-hover:text-green">PeerPear</span>
        </div>
        
        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-6 items-center text-[15px] font-medium">
          <a href="#" className="text-white no-underline relative group transition-colors duration-300 hover:text-green">
            dashboard
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-green transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#" className="text-white no-underline relative group transition-colors duration-300 hover:text-green">
            profile
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-green transition-all duration-300 group-hover:w-full"></span>
          </a>
        </nav>

        <div>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center bg-green text-[#1a1a1a] px-[18px] py-2 rounded-md text-[15px] font-semibold no-underline cursor-pointer border-none transition-all duration-300 hover:scale-105 hover:shadow-lg hover:brightness-110"
          >
            log in
          </button>
        </div>
      </div>
    </header>
  );
}
