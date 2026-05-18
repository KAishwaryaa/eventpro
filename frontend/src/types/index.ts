export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'attendee' | 'organizer' | 'admin';
  status: 'active' | 'inactive' | 'deleted';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_datetime: string;
  end_datetime: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_coordinates: { lat: number; lng: number } | null;
  image_url: string | null;
  status: 'draft' | 'published' | 'cancelled';
  organizer_id: string;
  ticket_types: TicketType[];
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  base_price: number;
  current_price: number;
  quantity: number;
  sold_count: number;
  seating_type: 'assigned' | 'general_admission';
  dynamic_pricing_enabled: boolean;
}

export interface Booking {
  id: string;
  attendee_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'checked_in';
  price_paid: number;
  currency: string;
  payment_reference: string;
  qr_code_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  delivery_status: string;
  created_at: string;
}

export interface Seat {
  id: string;
  row: string;
  number: string;
  status: 'available' | 'locked' | 'booked';
  lock_holder?: string;
}
