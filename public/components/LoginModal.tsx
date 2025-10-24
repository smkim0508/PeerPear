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
      <div className="bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-8 max-w-[500px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-2 text-[#1a1a1a]">Log in to your account</h2>
        <p className="text-base text-gray-600 mb-6">
          Are you logging in as a student or organization?
        </p>

        <div className="inline-flex bg-[#CCCEC1] rounded-xl p-1.5 mb-6">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-6 py-2 rounded-lg font-semibold text-base cursor-pointer transition-colors ${
              activeTab === 'student'
                ? 'bg-[#D7FF9C] text-[#1a1a1a]'
                : 'bg-transparent text-[#1a1a1a]'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-6 py-2 rounded-lg font-semibold text-base cursor-pointer transition-colors ${
              activeTab === 'organization'
                ? 'bg-[#D7FF9C] text-[#1a1a1a]'
                : 'bg-transparent text-[#1a1a1a]'
            }`}
          >
            Organization
          </button>
        </div>

        <button className="w-full bg-[#D7FF9C] text-[#1a1a1a] px-6 py-3 rounded-xl text-lg font-bold hover:bg-opacity-90 transition-opacity cursor-pointer">
          Log in with CAS
        </button>
      </div>
    </div>
  );
}
