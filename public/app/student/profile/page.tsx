"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  other_gender: string;
  class_year: string | null; // can be null since dropdown
  major: string;
  hobbies: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    user_id: "1", // hardcoded for now
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    gender: "",
    other_gender: "",
    class_year: "",
    major: "",
    hobbies: [] as string[],
  });

  const [newHobby, setNewHobby] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `http://localhost:5001/user-profile/student-profile?user_id=${profile.user_id}`
        );
        const data = await res.json();
        if (data.profile) {
          setProfile((prev) => ({
            ...prev,
            ...data.profile,
            hobbies: data.profile.hobbies || [],
            class_year: data.profile.class_year?.toString() || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddHobby = () => {
    const trimmed = newHobby.trim();
    if (trimmed && !profile.hobbies.includes(trimmed)) {
      setProfile((prev) => ({ ...prev, hobbies: [...prev.hobbies, trimmed] }));
      setNewHobby("");
    }
  };

  const handleRemoveHobby = (hobby: string) => {
    setProfile((prev) => ({
      ...prev,
      hobbies: prev.hobbies.filter((h) => h !== hobby),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage("");
    
    try {
      // convert class_year to number or null
      const payload = {
        ...profile,
        class_year: profile.class_year || null,
      };

      const res = await fetch("http://localhost:5001/user-profile/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveMessage("Profile saved successfully!");
      } else {
        setSaveMessage("Error saving profile. Please try again.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setSaveMessage("Error saving profile. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f3f4ef]">
      <Navbar userType="student" />
      <main className="flex-1 p-10 max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-12">Profile Update</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
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

            <label className="text-xl font-semibold">Class Year:</label>

            <select
                id="class_year"
                name="class_year"
                value={profile.class_year || ""}
                className="border-b border-black bg-transparent text-lg focus:outline-none"
                onChange={(e) =>
                    setProfile({ ...profile, class_year: e.target.value || null })
                }
                >
                <option value="" disabled hidden>Select class year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
            </select>

            <label className="text-xl font-semibold">Major:</label>
            <input
              name="major"
              value={profile.major}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your major"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xl font-semibold">Hobbies:</label>
            <div className="flex gap-2 mt-2">
              <input
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                className="border-b border-black bg-transparent text-lg focus:outline-none flex-1"
                placeholder="Add a hobby"
              />
              <button type="button" onClick={handleAddHobby} className="px-4 py-2 bg-[#393D3F] text-white rounded">
                Add
              </button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {profile.hobbies.map((hobby) => (
                <span key={hobby} className="px-3 py-1 bg-gray-200 rounded-full flex items-center gap-2">
                  {hobby}
                  <button type="button" onClick={() => handleRemoveHobby(hobby)}>×</button>
                </span>
              ))}
            </div>
          </div>
            <button type="submit" className="px-6 py-3 bg-[#95D28F] text-white rounded text-lg">
                Save Profile
            </button>
              {/* This save message *could* be slightly adjusted to reduce buffer spacing */}
          {saveMessage && <p className="mt-4 text-lg">{saveMessage}</p>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
