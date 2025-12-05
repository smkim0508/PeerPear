import PearButton from "./PearButton";
import { Squiggle } from "./ui/Squiggle";

interface HeroProps {
  onTryNowClick: () => void;
}

export default function Hero({ onTryNowClick }: HeroProps) {
  return (
    <section className="bg-light-beige relative font-sans">
      <div className="max-w-[1200px] mx-auto px-8 py-20 pb-16">
        <div className="text-center flex flex-col items-center">
          <h1 className="text-[72px] leading-[1.1] m-0 font-extrabold text-[#0a0a0a] tracking-tight">
            Pair{" "}
            <span className="relative inline-block whitespace-nowrap">
              smarter
              <Squiggle width={275} className="left-0 right-0 -bottom-1" />
            </span>
            . Build{" "}
            <span className="relative inline-block whitespace-nowrap">
              stronger communities
              <Squiggle width={750} className="left-0 right-0 -bottom-1" />
            </span>
            .
          </h1>

          <p className="mt-6 text-[19px] leading-relaxed text-[#1a1a1a] max-w-[720px]">
            PeerPear makes it effortless for student organizations to run
            mentorships, class projects, and big-little programs — all in one
            centralized platform.
          </p>

          <div className="mt-7 flex gap-3 justify-center">
            <PearButton text="Try now" onClick={onTryNowClick} className="cursor-pointer" />
            <a href="#features">
              <PearButton text="Learn more" onClick={() => {}} dark className="cursor-pointer" />
            </a>
          </div>
        </div>
      </div>
      {/* Wave at bottom of hero section - transitions to dark beige features section */}
      <div className="w-full leading-0">
        <img src="/wave-1.svg" alt="" className="block w-full" />
      </div>
    </section>
  );
}
