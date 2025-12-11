"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Squiggle } from "@/components/ui/Squiggle";
import { User, Mail, Phone, BookOpen, GraduationCap, Heart } from "lucide-react";
import PearButton from "@/components/PearButton";

interface Profile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  other_gender: string;
  class_year: string | null;
  major: string;
  hobbies: string[];
}

export default function ProfilePage() {
  const { user, refreshAuth } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newHobby, setNewHobby] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [nameErrors, setNameErrors] = useState({
    first: false,
    last: false,
  });
  const [hobbyError, setHobbyError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setProfile((prev) => {
      if (prev) return prev;

      return {
        user_id: user.id ?? 0,
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        email: user.email || "",
        phone_number: user.phoneNumber || "",
        gender: "",
        other_gender: "",
        class_year: "",
        major: "",
        hobbies: [],
      };
    });
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${apiUrl}/user-profile/student-profile?user_id=${user.id}`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.profile && Object.keys(data.profile).length > 0) {
          setProfile((prev) => ({
            user_id: user.id ?? 0,
            first_name: data.profile.first_name || prev?.first_name || "",
            last_name: data.profile.last_name || prev?.last_name || "",
            email: data.profile.email || prev?.email || "",
            phone_number:
              data.profile.phone_number || prev?.phone_number || "",
            gender: data.profile.gender || "",
            other_gender: "",
            class_year: data.profile.class_year || "",
            major: data.profile.major || "",
            hobbies: data.profile.hobbies || [],
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "first_name") {
      setNameErrors((prev) => ({ ...prev, first: value.length > 10 }));
    }
    if (name === "last_name") {
      setNameErrors((prev) => ({ ...prev, last: value.length > 10 }));
    }
    if (name === "phone_number") {
      let digits = value.replace(/\D/g, "");

      digits = digits.slice(0, 10);

      let formatted = digits;

      if (digits.length > 3) {
        formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      }
      if (digits.length > 6) {
        formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }

      setProfile((prev) =>
        prev ? { ...prev, [name]: formatted } : prev
      );
      return;
    }
    setProfile((prev) => (prev ? { ...prev, [name]: value } : prev));
  };


  // Add hobby
  const handleAddHobby = () => {
    const trimmed = newHobby.trim();

    if (trimmed.length > 15) {
      setHobbyError(true);
      return;
    }
    setHobbyError(false);

    if (trimmed && profile && !profile.hobbies.includes(trimmed)) {
      setProfile((prev) =>
        prev ? { ...prev, hobbies: [...prev.hobbies, trimmed] } : prev
      );
      setNewHobby("");
    }
  };


  // Remove hobby
  const handleRemoveHobby = (hobby: string) => {
    setProfile((prev) =>
      prev
        ? { ...prev, hobbies: prev.hobbies.filter((h) => h !== hobby) }
        : prev
    );
  };

  // Validation
  const validateProfile = (p: Profile): string[] => {
    const missing: string[] = [];

    if (!p.first_name.trim()) missing.push("First Name");
    if (!p.last_name.trim()) missing.push("Last Name");
    if (!p.phone_number.trim()) missing.push("Phone Number");
    if (!p.class_year?.trim()) missing.push("Class Year");
    if (!p.major.trim()) missing.push("Major");
    if (!p.hobbies || p.hobbies.length === 0) missing.push("Hobbies");

    return missing;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage("");
    setErrors([]);
    setIsLoading(true);

    if (!profile) {
      setIsLoading(false);
      return;
    }

    const missing = validateProfile(profile);
    if (missing.length > 0) {
      setErrors(missing);
      setSaveMessage("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = { ...profile, class_year: profile.class_year || null };
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      const res = await fetch(`${apiUrl}/user-profile/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveMessage("Profile saved successfully! 🎉");
        await refreshAuth();
      } else {
        setSaveMessage("Error saving profile. Please try again.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setSaveMessage("Error saving profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.id || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans bg-light-beige">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-nav-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-nav-dark">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const isFieldError = (field: string) => errors.includes(field);

  return (
    <ProtectedRoute requiredRole="student">
      <div className="flex flex-col min-h-screen font-sans bg-light-beige">
        <Navbar userType="student" />

        <div className="bg-linear-to-br from-light-beige to-dark-beige relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-8 py-16 text-center">
            <h1 className="text-6xl md:text-7xl font-extrabold text-nav-dark tracking-tight mb-4">
              Your{" "}
              <span className="relative inline-block whitespace-nowrap">
                Profile
                <Squiggle width={225} className="left-0 right-0 -bottom-2" />
              </span>
            </h1>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Tell us about yourself! This information helps us create better matches
              and makes you part of the PeerPear community.
            </p>
          </div>
        </div>

        <main className="flex-1 max-w-4xl mx-auto px-8 py-12 w-full">

          {/* 🔥 Moved success/error message to top */}
          {saveMessage && (
            <div
              className={`p-4 mb-8 rounded-lg text-center font-semibold ${saveMessage.includes("successfully")
                ? "bg-green text-nav-dark"
                : "bg-red-100 text-red-800"
                }`}
            >
              {saveMessage}
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-4 mb-8 bg-red-100 text-red-800 rounded-lg text-center font-medium">
              Missing fields: {errors.join(", ")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-green" />
                <h2 className="text-2xl font-semibold text-nav-dark">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "first_name", label: "First Name", icon: User },
                  { name: "last_name", label: "Last Name", icon: User },
                  { name: "phone_number", label: "Phone Number", icon: Phone },
                ].map(({ name, label, icon: Icon }) => (
                  <div key={name} className="space-y-2">
                    <label className="text-lg font-semibold text-nav-dark flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label} <span className="text-red-500">*</span>
                    </label>

                    <input
                      name={name}
                      value={(profile as any)[name]}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors ${isFieldError(label)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-transparent focus:border-green"
                        }`}
                      placeholder={`Enter your ${label.toLowerCase()}`}
                      maxLength={name === "phone_number" ? 20 : 10}
                    />
                    {name === "first_name" && nameErrors.first && (
                      <p className="text-red-600 text-sm">
                        First name must be 10 characters or fewer.
                      </p>
                    )}
                    {name === "last_name" && nameErrors.last && (
                      <p className="text-red-600 text-sm">
                        Last name must be 10 characters or fewer.
                      </p>
                    )}

                  </div>
                ))}
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-nav-dark flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-6 h-6 text-green" />
                <h2 className="text-2xl font-semibold text-nav-dark">Academic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Year */}
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-nav-dark flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Class Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="class_year"
                    value={profile.class_year || ""}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors ${isFieldError("Class Year")
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-transparent focus:border-green"
                      }`}
                  >
                    <option value="" disabled>
                      Select your class year
                    </option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>

                {/* Major */}
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-nav-dark flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Major <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="major"
                    value={profile.major}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors ${isFieldError("Major")
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-transparent focus:border-green"
                      }`}
                    placeholder="Your field of study"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-green" />
                <h2 className="text-2xl font-semibold text-nav-dark">
                  Interests & Hobbies <span className="text-red-500">*</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    value={newHobby}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewHobby(val);

                      if (val.length > 15) {
                        setHobbyError(true);
                      } else {
                        setHobbyError(false);
                      }
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-transparent text-lg focus:outline-none focus:border-green"
                    placeholder="Add a hobby or interest..."
                    maxLength={20}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddHobby())
                    }
                  />

                  <PearButton text="Add" onClick={handleAddHobby} className="hover:scale-105" />
                </div>

                {hobbyError && (
                  <p className="text-red-600 text-sm">
                    Hobbies must be 15 characters or fewer.
                  </p>
                )}

                {profile.hobbies.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-nav-dark">
                      Your hobbies:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {profile.hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green/20 border-2 border-green rounded-full text-nav-dark font-medium"
                        >
                          <Heart className="w-4 h-4" />
                          {hobby}
                          <button
                            type="button"
                            onClick={() => handleRemoveHobby(hobby)}
                            className="w-5 h-5 rounded-full bg-nav-dark/20 hover:bg-nav-dark/40 flex items-center justify-center text-nav-dark font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center">
              <PearButton text={isLoading ? "Saving Profile..." : "Save Profile"} disabled={isLoading} className="hover:scale-105" />
            </div>
          </form>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
