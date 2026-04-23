import api from './api';
import type { Venue, CreateVenuePayload, UpdateVenuePayload } from '../types';

interface ApiResponse<T> { success: boolean; data: T; }

export const venueService = {
  async getAll(): Promise<Venue[]> {
    const { data } = await api.get<ApiResponse<Venue[]>>('/venues');
    return data.data;
  },
  async create(payload: CreateVenuePayload): Promise<Venue> {
    const { data } = await api.post<ApiResponse<Venue>>('/venues', payload);
    return data.data;
  },
  async update(id: string, payload: UpdateVenuePayload): Promise<Venue> {
    const { data } = await api.put<ApiResponse<Venue>>(`/venues/${id}`, payload);
    return data.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/venues/${id}`);
  },
};
