import PearButton from "./PearButton";
import { Squiggle } from "./ui/Squiggle";

interface HeroProps {
  onTryNowClick: () => void;
}

export default function Hero({ onTryNowClick }: HeroProps) {
  return (
    <section className="bg-light-beige relative font-sans">
      <div className="max-w-5xl lg:max-w-[1200px] mx-auto px-4 sm:px-8 py-16 sm:py-20 pb-14 sm:pb-16">
        <div className="text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[72px] leading-tight sm:leading-[1.08] m-0 font-extrabold text-[#0a0a0a] tracking-tight">
            Pair{" "}
            <span className="relative inline-block">
              smarter
              <Squiggle
                width={275}
                className="left-0 right-0 -bottom-1 hidden sm:flex"
              />
            </span>
            . Build{" "}
            <span className="relative inline-block">
              stronger communities
              <Squiggle
                width={750}
                className="left-0 right-0 -bottom-1 hidden sm:flex"
              />
            </span>
            .
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#1a1a1a] max-w-2xl">
            PeerPear makes it effortless for student organizations to run
            mentorships, class projects, and big-little programs — all in one
            centralized platform.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
            <PearButton
              text="Try now"
              onClick={onTryNowClick}
              className="cursor-pointer w-full sm:w-auto  hover:scale-105 transition duration-300 p-5 text-md"
            />
            <a href="#features" className="w-full sm:w-auto ">
              <PearButton
                text="Learn more"
                onClick={() => {}}
                dark
                className="cursor-pointer w-full sm:w-auto hover:scale-105 transition duration-300 p-5 text-md"
              />
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
