import { supabase } from '@/lib/supabase';
import { DatabaseEvent, Organization, Question, UserResponse, User } from '@/types/events';

export interface EventWithDetails extends DatabaseEvent {
  organizations: Organization;
  questions: Question[];
}

/**
 * Fetch a single event with organization and questions
 */
export async function fetchEventById(eventId: number): Promise<EventWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizations (
          id,
          org_name,
          description
        ),
        questions (
          id,
          question,
          options,
          event_id
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

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
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizations (
          id,
          org_name,
          description
        ),
        questions (
          id,
          question,
          options,
          event_id
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active events:', error);
      return [];
    }

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
    const { data, error } = await supabase
      .from('users')
      .select('events')
      .eq('username', username)
      .single();

    if (error || !data) {
      return false;
    }

    return data.events?.includes(eventId) ?? false;
  } catch (err) {
    console.error('Error checking user registration:', err);
    return false;
  }
}

/**
 * Register a user for an event
 */
export async function registerUserForEvent(username: string, eventId: number): Promise<boolean> {
  try {
    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, events')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return false;
    }

    // Add event to user's events array
    const updatedEvents = [...(userData.events || []), eventId];
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ events: updatedEvents })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error registering user:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in registerUserForEvent:', err);
    return false;
  }
}

/**
 * Unregister a user from an event
 */
export async function unregisterUserFromEvent(username: string, eventId: number): Promise<boolean> {
  try {
    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, events')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return false;
    }

    // Remove event from user's events array
    const updatedEvents = (userData.events || []).filter((id: number) => id !== eventId);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ events: updatedEvents })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error unregistering user:', updateError);
      return false;
    }

    // Also remove any responses the user made for this event
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('event_id', eventId);

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      await supabase
        .from('responses')
        .delete()
        .eq('user_id', userData.id)
        .in('question_id', questionIds);
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
    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      return [];
    }

    // Get questions for this event
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('event_id', eventId);

    if (questionsError || !questions || questions.length === 0) {
      return [];
    }

    const questionIds = questions.map(q => q.id);

    // Get user's responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userData.id)
      .in('question_id', questionIds);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return [];
    }

    return responses || [];
  } catch (err) {
    console.error('Error in getUserEventResponses:', err);
    return [];
  }
}

/**
 * Submit user responses for event questions
 */
export async function submitEventResponses(username: string, responses: { questionId: number; answer: any }[]): Promise<boolean> {
  try {
    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return false;
    }

    // Prepare responses for insertion
    const responseData = responses.map(response => ({
      question_id: response.questionId,
      user_id: userData.id,
      answer: response.answer
    }));

    // Insert responses
    const { error: insertError } = await supabase
      .from('responses')
      .insert(responseData);

    if (insertError) {
      console.error('Error inserting responses:', insertError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in submitEventResponses:', err);
    return false;
  }
}