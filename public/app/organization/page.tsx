'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";


export default function StudentDashBoard() {
    return (
        <div className="font-sans min-h-screen flex flex-col">
            <Navbar onLoginClick={() => { }} />
            <main className='flex-1'>
                <section >

                </section>

            </main>
            <Footer />
        </div>
    )
}