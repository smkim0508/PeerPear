"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import LoginModal from "@/components/LoginModal";
import OrganizationCarousel from "@/components/OrganizationCarousel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function About() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    const teamMembers = [
        { name: "Sungmin Kim", role: "Project Lead", image: "/sungmin.jpg" },
        { name: "Dongkon Lee", role: "Full Stack Developer", image: "/DK.png" },
        { name: "Gary Yang", role: "Full Stack Developer", image: "/gary.png" },
        { name: "Nadula", role: "Full Stack Developer", image: "/nadula.jpg" },
        { name: "Jaden", role: "Full Stack Developer", image: "/jaden.png" },
    ];

    return (
        <div className="font-sans min-h-screen flex flex-col">
            <Navbar onLoginClick={openLoginModal} userType="guest" />

            <main className="flex-1 bg-white">
                {/* Hero Section */}
                <section className="bg-green py-20 px-8 text-center relative">
                    <div className="absolute top-8 left-8">
                        <Link href="/" className="flex items-center gap-2 text-[#393D3F] font-bold hover:underline">
                            <ArrowLeft size={20} />
                            Back
                        </Link>
                    </div>
                    <h1 className="text-5xl font-extrabold text-[#393D3F] mb-6 tracking-tight">
                        About Us
                    </h1>
                    <p className="text-xl text-[#393D3F] max-w-2xl mx-auto">
                        Get to know the team behind PeerPear and our mission to build stronger communities.
                    </p>
                </section>

                {/* Our Service Section */}
                <section className="py-16 px-8 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-[#393D3F] mb-8 text-center">Our Service</h2>
                    <div className="bg-light-beige p-8 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                            PeerPear is a platform designed to simplify and automate the process of pairing individuals within campus-wide organizations.
                            Whether it's for mentorship programs, coffee chats, or club-wide events, we help you build
                            meaningful connections.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Our goal is to foster community and collaboration by making it easy for administrators to manage
                            pairings and for members to find their perfect match.
                        </p>
                    </div>
                </section>





                {/* Our Team Section */}
                <section className="py-16 px-8 bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-bold text-[#393D3F] mb-12 text-center">Our Team</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {teamMembers.map((member, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-green flex flex-col items-center text-center"
                                >
                                    <div className="w-24 h-24 bg-green rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-[#393D3F] overflow-hidden">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            member.name.charAt(0)
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-[#393D3F] mb-1">{member.name}</h3>
                                    <p className="text-gray-500 text-sm mb-2">Princeton University</p>
                                    <p className="text-gray-600 font-medium">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Organization Carousel */}
                <section className="pt-10 bg-white border-t border-gray-100">
                    <h2 className="text-2xl font-bold text-[#393D3F] mb-6 text-center opacity-80">Trusted by</h2>
                    <OrganizationCarousel />
                </section>
            </main>

            <Footer />
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
        </div>
    );
}
