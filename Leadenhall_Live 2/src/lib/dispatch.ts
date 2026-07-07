import { supabase } from './supabase';
import type { ChatMessage, DispatchResponse } from './types';

export async function callDispatch(
  messages: ChatMessage[],
  userLocation?: { lat: number; lng: number },
  sessionId?: string
): Promise<DispatchResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispatch`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, user_location: userLocation, session_id: sessionId }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Dispatch error ${response.status}: ${body}`);
  }

  const data: DispatchResponse = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}
