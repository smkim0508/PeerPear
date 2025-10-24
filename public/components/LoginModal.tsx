'use client';

import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'organization'>('student');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0000003c] flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-6 max-w-[420px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-1.5 text-[#1a1a1a]">Log in to your account</h2>
        <p className="text-sm text-gray-600 mb-5">
          Are you logging in as a student or organization?
        </p>

        <div className="inline-flex bg-[#CCCEC1] rounded-xl p-1.5 mb-5">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-5 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
              activeTab === 'student'
                ? 'bg-[#D7FF9C] text-[#1a1a1a]'
                : 'bg-transparent text-[#1a1a1a]'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-5 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
              activeTab === 'organization'
                ? 'bg-[#D7FF9C] text-[#1a1a1a]'
                : 'bg-transparent text-[#1a1a1a]'
            }`}
          >
            Organization
          </button>
        </div>

        <button className="w-full bg-[#D7FF9C] text-[#1a1a1a] px-5 py-2.5 rounded-xl text-base font-bold hover:bg-opacity-90 transition-opacity cursor-pointer">
          Log in with CAS
        </button>
      </div>
    </div>
  );
}
