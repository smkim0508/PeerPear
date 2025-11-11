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
<<<<<<< HEAD
  const [profile, setProfile] = useState({
    user_id: "1", // for now hardcoded, ideally fetched from auth/session
=======
  const [profile, setProfile] = useState<Profile>({
    user_id: "1", // hardcoded for now
>>>>>>> eb4a5980a800d65d803698396282b63295c1da7b
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

  // ✅ Fetch profile from backend when page loads
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `http://localhost:5001/user-profile/student-profile?user_id=${profile.user_id}`
        );
        const data = await res.json();

        if (data.profile) {
          // Merge existing data into the state
          setProfile((prev) => ({
            ...prev,
            ...data.profile,
            hobbies: data.profile.hobbies || [],
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Add hobby to list
  const handleAddHobby = () => {
    const trimmed = newHobby.trim();
    if (trimmed && !profile.hobbies.includes(trimmed)) {
      setProfile((prev) => ({ ...prev, hobbies: [...prev.hobbies, trimmed] }));
      setNewHobby("");
    }
  };

  // Remove hobby from list
  const handleRemoveHobby = (hobby: string) => {
    setProfile((prev) => ({
      ...prev,
      hobbies: prev.hobbies.filter((h) => h !== hobby),
    }));
  };

  // ✅ Submit profile changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage("");
    
    try {
<<<<<<< HEAD
      const res = await fetch("http://localhost:5001/update-profile", {
=======
      // convert class_year to number or null
      const payload = {
        ...profile,
        class_year: profile.class_year || null,
      };

      const res = await fetch("http://localhost:5001/user-profile/update-profile", {
>>>>>>> eb4a5980a800d65d803698396282b63295c1da7b
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
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
        <h1 className="text-6xl font-bold mb-12">
          Profile
          <br />
          Update
        </h1>

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

<<<<<<< HEAD
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

            <label className="text-xl font-semibold">Gender:</label>
            <div>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
                className="border-b border-black bg-transparent text-lg focus:outline-none w-full"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>

              {profile.gender === "Other" && (
                <input
                  name="other_gender"
                  value={profile.other_gender}
                  onChange={handleChange}
                  className="border-b border-black bg-transparent text-lg focus:outline-none mt-2 w-full"
                  placeholder="Please specify"
                />
              )}
            </div>

            <label className="text-xl font-semibold">Class Year:</label>
            <select
              name="class_year"
              value={profile.class_year}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none w-full"
            >
              <option value="">Select Year</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
=======
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
>>>>>>> eb4a5980a800d65d803698396282b63295c1da7b
            </select>

            <label className="text-xl font-semibold">Major:</label>
            <input
              name="major"
              value={profile.major}
              onChange={handleChange}
              className="border-b border-black bg-transparent text-lg focus:outline-none"
              placeholder="Enter your major"
            />

            {/* Dynamic Hobbies List */}
            <label className="text-xl font-semibold">Hobbies:</label>
<<<<<<< HEAD
            <div>
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="text"
                  value={newHobby}
                  onChange={(e) => setNewHobby(e.target.value)}
                  className="border-b border-black bg-transparent text-lg focus:outline-none w-1/2"
                  placeholder="Enter a hobby"
                />
                <button
                  type="button"
                  onClick={handleAddHobby}
                  className="px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-700 transition-all"
                >
                  Add
                </button>
              </div>

              <ul className="space-y-2">
                {profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hobby) => (
                    <li
                      key={hobby}
                      className="flex items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded"
                    >
                      <span>{hobby}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHobby(hobby)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No hobbies added yet.</p>
                )}
              </ul>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-10 flex flex-col items-start">
            <button
              type="submit"
              className="px-6 py-3 bg-lime-600 text-white rounded hover:bg-lime-700 transition-all"
            >
              Save Changes
            </button>
            {saveMessage && (
              <p className="mt-3 text-lg font-semibold text-green-700">
                {saveMessage}
              </p>
            )}
          </div>
=======
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
>>>>>>> eb4a5980a800d65d803698396282b63295c1da7b
        </form>
      </main>
      <Footer />
    </div>
  );
}
