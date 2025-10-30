'use client';

import { useState } from 'react';
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import Navbar from '@/components/Navbar';
import PearButton from '@/components/PearButton';

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Navbar onLoginClick={openLoginModal} userType='guest' />

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
              <PearButton text="Get started" onClick={openLoginModal} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
