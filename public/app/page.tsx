'use client';

import { useState } from 'react';
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import Navbar from '@/components/Navbar';

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Navbar onLoginClick={openLoginModal} />

      {/* <Header onLoginClick={openLoginModal} /> */}

      <main className="flex-1">
        <Hero onTryNowClick={openLoginModal} />
        <Features />

        <section className="relative text-center bg-light-beige">
          {/* Wave at top of CTA section - transitions from dark beige features section */}
          <div className="w-full leading-0">
            <img src="/wave-2.svg" alt="" className="block w-full" />
          </div>

          <div className="px-8 py-6 pb-18">
            <h3 className="text-4xl m-0 mt-8 font-extrabold italic text-[rgb(10,10,10)] tracking-tight">
              Ready to simplify your pairings?
            </h3>
            <div className="mt-5">
              <button onClick={openLoginModal} className="inline-flex items-center bg-green text-[#1a1a1a] px-5 py-3 rounded-lg text-base font-bold no-underline cursor-pointer border-none transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:brightness-105 hover:-translate-y-1">
                Get started
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
