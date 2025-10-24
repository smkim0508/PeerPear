interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  return (
    <header className="bg-nav-dark text-white font-sans">
      <div className="max-w-[1200px] mx-auto px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PeerPear logo" className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">PeerPear</span>
        </div>
        
        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-6 items-center text-[15px] font-medium">
          <a href="#" className="text-white no-underline">dashboard</a>
          <a href="#" className="text-white no-underline">profile</a>
        </nav>

        <div>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center bg-green text-[#1a1a1a] px-[18px] py-2 rounded-md text-[15px] font-semibold no-underline cursor-pointer border-none"
          >
            log in
          </button>
        </div>
      </div>
    </header>
  );
}
