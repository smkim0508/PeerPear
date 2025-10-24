import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />
        <Features />

        <section className="relative text-center bg-light-beige">
          {/* Wave at top of CTA section - transitions from dark beige features section */}
          <div className="w-full leading-0">
            <img src="/wave-2.svg" alt="" className="block w-full" />
          </div>
          
          <div className="px-8 py-6 pb-18">
            <h3 className="text-4xl m-0 font-extrabold italic text-[#0a0a0a] tracking-tight">
              Ready to simplify your pairings?
            </h3>
            <div className="mt-5">
              <a href="#" className="inline-flex items-center bg-green text-[#1a1a1a] px-5 py-3 rounded-lg text-base font-bold no-underline">
                Get started
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
