"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    events: [] as number[],
  });

  const [newEvent, setNewEvent] = useState("");

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = () => {
    const id = parseInt(newEvent.trim());
    if (!isNaN(id) && !profile.events.includes(id)) {
      setProfile((prev) => ({ ...prev, events: [...prev.events, id] }));
      setNewEvent("");
    }
  };

  const handleRemoveEvent = (id: number) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e !== id),
    }));
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
        <h1 className="text-6xl font-bold mb-12">
          Profile
          <br />
          Update
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <label className="text-xl font-semibold">Username:</label>
            <input
              name="username"
              value={profile.username}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your username"
            />

            <label className="text-xl font-semibold">First Name:</label>
            <input
              name="first_name"
              value={profile.first_name}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your first name"
            />

            <label className="text-xl font-semibold">Last Name:</label>
            <input
              name="last_name"
              value={profile.last_name}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your last name"
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

            <label className="text-xl font-semibold">Phone Number:</label>
            <input
              name="phone_number"
              value={profile.phone_number}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your phone number"
            />

            {/* Dynamic Events Input */}
            <label className="text-xl font-semibold">Events (IDs):</label>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="number"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="border-b border-black bg-transparent text-lg focus:outline-none w-1/2"
                  placeholder="Enter event ID"
                />
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-700 transition-all"
                >
                  Add
                </button>
              </div>

              <ul className="space-y-2">
                {profile.events.length > 0 ? (
                  profile.events.map((id) => (
                    <li
                      key={id}
                      className="flex items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded"
                    >
                      <span>Event ID: {id}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No events added yet.</p>
                )}
              </ul>
            </div>
          </div>

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
