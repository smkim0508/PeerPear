"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    careerInterests: "",
    hobbies: "",
    photo: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/student-profile");
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://127.0.0.1:5000/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f3f4ef]">
      <Navbar userType="student" />
      <main className="flex-1 p-10 max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-12">Profile<br />Update</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <label className="text-xl font-semibold">Name:</label>
            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your name"
            />

            <label className="text-xl font-semibold">Email:</label>
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your email"
            />

            <label className="text-xl font-semibold">Career Interests:</label>
            <textarea
              name="careerInterests"
              value={profile.careerInterests}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none resize-none"
              placeholder="E.g. Software Engineering, Product Design"
            />

            <label className="text-xl font-semibold">Hobbies:</label>
            <textarea
              name="hobbies"
              value={profile.hobbies}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none resize-none"
              placeholder="E.g. Reading, Hiking, Drawing"
            />

            <label className="text-xl font-semibold">Photo URL:</label>
            <input
              name="photo"
              value={profile.photo}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Paste a photo URL"
            />
          </div>

          {profile.photo && (
            <div className="mt-8">
              <img
                src={profile.photo}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover border"
              />
            </div>
          )}

          <button
            type="submit"
            className="mt-10 px-6 py-3 bg-lime-600 text-white rounded hover:bg-lime-700 transition-all"
          >
            Save Changes
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
