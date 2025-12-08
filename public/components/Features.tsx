import { Squiggle } from "./ui/Squiggle";

function Card({
  title,
  text,
  rotation,
}: {
  title: string;
  text: string;
  rotation: number;
}) {
  return (
    <div
      className="bg-green p-7 sm:p-8 w-full sm:w-[260px] max-w-sm rounded-xl shadow-lg transition-transform duration-300 cursor-pointer md:hover:scale-105 md:hover:shadow-2xl md:hover:-translate-y-2"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <h4 className="m-0 text-xl font-bold leading-snug text-[#0a0a0a]">
        {title}
      </h4>
      <p className="mt-3 text-sm leading-normal text-[#1a1a1a] font-light">
        {text}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section className="relative bg-[#CCCEC1] font-sans" id="features">
      <div className="mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-[56px] mx-auto font-extrabold text-[#0a0a0a] relative inline-block tracking-tight">
          Features
          <Squiggle
            width={200}
            className="left-1/2 -translate-x-1/2 -bottom-2"
          />
        </h2>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 sm:gap-y-15 gap-x-6 lg:gap-x-10 justify-items-center">
          <Card
            title="Reusable Student Profiles"
            text="Fill out your details once — join any pairing program without repetition."
            rotation={-6}
          />
          <Card
            title="Smart Matching"
            text="AI-powered pairings based on interests, background, or personality."
            rotation={3}
          />
          <Card
            title="Organizer Dashboard"
            text="Create programs, track participants, and export final matches instantly."
            rotation={-2}
          />
          {/* <Card
            title="Flexible Match Modes"
            text="Choose between similarity-based or diversity-driven pairing."
            rotation={6}
          />
          <Card
            title="Instant Exports"
            text="Generate polished PDFs or text files for quick announcements."
            rotation={-4}
          /> */}
        </div>
      </div>
    </section>
  );
}
