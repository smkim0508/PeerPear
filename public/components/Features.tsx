import { Squiggle } from "./ui/Squiggle";

function Card({ title, text, rotation }: { title: string; text: string; rotation: number }) {
  return (
    <div 
      className="bg-green p-9 px-[30px] max-w-[225px] rounded-xl shadow-lg transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-2xl hover:brightness-105 hover:-translate-y-2"
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `rotate(0deg) translateY(-8px) scale(1.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotation}deg) translateY(0) scale(1)`;
      }}
    >
      <h4 className="m-0 text-xl font-bold leading-snug text-[#0a0a0a]">{title}</h4>
      <p className="mt-3 text-sm leading-normal text-[#1a1a1a] font-light">{text}</p>
    </div>
  );
}

export default function Features() {
  return (
    <section className="relative bg-dark-beige font-sans" id="features">
      <div className="mx-auto px-8 py-15 pb-20 text-center">
        <h2 className="text-[56px] mx-auto font-extrabold text-[#0a0a0a] relative inline-block tracking-tight">
          Features
          <Squiggle width={235} className="left-1/2 -translate-x-1/2 -bottom-2" />
        </h2>
        
        <div className="mt-15 flex justify-center gap-14 items-center flex-wrap">
          <Card 
            title="Reusable Student Profiles" 
            text="Fill out your details once — join any pairing event without repetition." 
            rotation={-6} 
          />
          <Card 
            title="Smart Matching" 
            text="AI-powered pairings based on interests, background, or personality." 
            rotation={3} 
          />
          <Card 
            title="Organizer Dashboard" 
            text="Create events, track participants, and export final matches instantly." 
            rotation={-2} 
          />
          <Card 
            title="Flexible Match Modes" 
            text="Choose between similarity-based or diversity-driven pairing." 
            rotation={6} 
          />
          <Card 
            title="Instant Exports" 
            text="Generate polished PDFs or text files for quick announcements." 
            rotation={-4} 
          />
        </div>
      </div>
    </section>
  );
}
