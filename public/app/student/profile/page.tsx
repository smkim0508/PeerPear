"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
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
