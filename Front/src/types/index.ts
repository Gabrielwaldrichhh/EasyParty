export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  birthDate?: string | null;
  createdAt: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  birthDate?: string | null;
  avatarUrl?: string | null;
}

export type Category = 'PARTY' | 'SHOW' | 'SPORTS' | 'ESPORTS' | 'FESTIVAL' | 'THEATER' | 'WORKSHOP' | 'GASTRONOMY' | 'NETWORKING' | 'RELIGIOUS' | 'OTHER';
export type VenueType = 'NIGHTCLUB' | 'BAR' | 'RESTAURANT' | 'EVENT_SPACE' | 'OUTDOOR' | 'PRIVATE' | 'OTHER';

export interface Venue {
  id: string;
  name: string;
  description?: string;
  type: VenueType;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  isVerified: boolean;
  imageUrl?: string;
  owner: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  events: Event[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  category: Category;
  customCategory?: string;
  date: string;
  endDate?: string;
  price: number;
  maxCapacity?: number;
  minAge?: number | null;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: string;
  author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  // venue fixo ou lat/lng avulso
  venueId?: string;
  venue?: Pick<Venue, 'id' | 'name' | 'type' | 'latitude' | 'longitude' | 'address'>;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface MapClickPosition {
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  category?: Category;
  customCategory?: string;
  minAge?: number;
  date: string;
  endDate?: string;
  price?: number;
  maxCapacity?: number;
  isPublic?: boolean;
  imageUrl?: string;
  venueId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface CreateVenuePayload {
  name: string;
  description?: string;
  type?: VenueType;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  imageUrl?: string;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  category?: Category;
  customCategory?: string;
  minAge?: number | null;
  date?: string;
  endDate?: string | null;
  price?: number;
  maxCapacity?: number;
  address?: string;
  isPublic?: boolean;
}

export interface UpdateVenuePayload {
  name?: string;
  description?: string;
  type?: VenueType;
  address?: string;
  city?: string;
  state?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}
