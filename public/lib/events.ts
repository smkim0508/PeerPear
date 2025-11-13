import { DatabaseEvent, Organization, Question, UserResponse, User } from '@/types/events';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface EventWithDetails extends DatabaseEvent {
  organizations: Organization;
  questions: Question[];
}

/**
 * Fetch a single event with organization and questions
 */
export async function fetchEventById(eventId: number): Promise<EventWithDetails | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Error fetching event:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data as EventWithDetails;
  } catch (err) {
    console.error('Error in fetchEventById:', err);
    return null;
  }
}

/**
 * Fetch all active events with organization details
 */
export async function fetchActiveEvents(): Promise<EventWithDetails[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/active`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Error fetching active events:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data as EventWithDetails[];
  } catch (err) {
    console.error('Error in fetchActiveEvents:', err);
    return [];
  }
}

/**
 * Check if a user is registered for an event
 */
export async function checkUserRegistration(username: string, eventId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/registration/${username}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Error checking user registration:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.registered ?? false;
  } catch (err) {
    console.error('Error checking user registration:', err);
    return false;
  }
}

/**
 * Register a user for an event
 */
export async function registerUserForEvent(userId: number, eventId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/event_registration/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        user_id: userId,
        event_id: eventId,
      }), 
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Error registering user:", error.error || response.statusText);
      return {success: false, error: error.error || "Failed to Register"}
    }

    return {success:true};
  } catch (err) {
    console.error("Error in registerUserForEvent:", err);
    return {success: false, error: "Network Error"};
  }
}


/**
 * Unregister a user from an event
 */
export async function unregisterUserFromEvent(username: string, eventId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      console.error('Error unregistering user:', response.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in unregisterUserFromEvent:', err);
    return false;
  }
}

/**
 * Get user's responses for an event
 */
export async function getUserEventResponses(username: string, eventId: number): Promise<UserResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/responses/${username}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Error fetching responses:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (err) {
    console.error('Error in getUserEventResponses:', err);
    return [];
  }
}

/**
 * Submit user responses for event questions
 */
export async function submitEventResponses(username: string, eventId: number, responses: { questionId: number; answer: any }[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, responses }),
    });

    if (!response.ok) {
      console.error('Error submitting responses:', response.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in submitEventResponses:', err);
    return false;
  }
}

/**
 * Get event participants (for organization users)
 */
export async function getEventParticipants(eventId: number): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/participants`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Error fetching participants:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (err) {
    console.error('Error in getEventParticipants:', err);
    return [];
  }
}