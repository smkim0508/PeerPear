export default function Footer() {
  return (
    <footer className="bg-nav-dark text-white font-sans">
      <div className="max-w-[1200px] mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/logo.svg"
              alt="PeerPear logo"
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
            <span className="text-base font-bold transition-colors duration-300 group-hover:text-green">
              PeerPear
            </span>
          </div>
          <span className="opacity-70 text-sm">
            © {new Date().getFullYear()} PeerPear. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Made with ❤️ for <a className="hover:underline" href="https://www.cs.princeton.edu/courses/cos333" target="_blank">COS333</a> by Nadula, Jaden, Sungmin, Gary, and DK.</span>
          </div>
      </div>
    </footer>
  );
}
