export interface Provider {
  id: string;
  name: string;
  category: 'plumber' | 'electrician' | 'cleaner';
  description: string;
  photo_url: string | null;
  lat: number;
  lng: number;
  city: string;
  price_from: number;
  languages: string[];
  rating: number;
  review_count: number;
  emergency: boolean;
  available: boolean;
  created_at: string;
  distance_km?: number;
  owner_id?: string | null;
  services?: string[];
  gallery?: string[];
}

export interface Booking {
  id: string;
  user_id: string;
  provider_id: string;
  status: 'pending' | 'accepted' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_for: string;
  address: string;
  notes: string | null;
  price: number | null;
  created_at: string;
  provider?: Provider;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DispatchUiProviderItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price_from: number;
  rating: number;
  review_count: number;
  distance_km: number;
  lat: number;
  lng: number;
  photo_url: string | null;
  languages: string[];
  emergency: boolean;
}

export interface DispatchUiBooking {
  id: string;
  provider_name: string;
  scheduled_for: string;
  address: string;
  price: number;
  status: string;
}

export interface DispatchUiStatus {
  booking_id: string;
  status: string;
}

export interface DispatchResponse {
  reply: string;
  ui: {
    providers?: DispatchUiProviderItem[];
    booking?: DispatchUiBooking;
    status?: DispatchUiStatus;
  };
  error?: string;
}
