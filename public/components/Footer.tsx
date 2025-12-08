export default function Footer() {
  return (
    <footer className="bg-green text-white font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/logo.svg"
              alt="PeerPear logo"
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
            <span className="text-base font-bold transition-colors duration-300 group-hover:text-green-100">
              PeerPear
            </span>
          </div>
          <span className="opacity-80 text-sm">
            © {new Date().getFullYear()} PeerPear. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
