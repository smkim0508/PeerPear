export interface PairingResult {
  groups: number[][];
}

export interface PairingEvent {
  id: number;
  organization_id: number;
  organization_name: string;
  title: string;
  description: string;
  image_url: string;      // keep snake_case if backend sends it that way
  end_date: string | null;
  status: "NOT_STARTED" | "STARTED" | "TERMINATED" | "PAIRING_PUBLISHED"; // event state enum
  matches: PairingResult;
}

// Database types for Supabase integration
export interface DatabaseEvent {
  id: number;
  organization_id: number;
  created_at: string;
  ends_at: string | null;
  active: boolean;
  title: string | null;
  description: string | null;
  matches: any | null;
}

export interface Organization {
  id: number;
  org_name: string;
  description: string;
}

export interface Question {
  id: number;
  question: string;
  options: any | null;
  event_id: number;
}

export interface UserResponse {
  id: number;
  question_id: number;
  answer: any | null;
  user_id: number;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  events: number[];
}

export interface UserProfile {
  id: number;
  user_id: number;
  gender: string | null;
  class_year: number;
  major: string;
  hobbies: string[];
}