import api from './api';
import type { Event, CreateEventPayload, UpdateEventPayload } from '../types';

interface ApiResponse<T> { success: boolean; data: T; }

export const eventService = {
  async getToday(): Promise<Event[]> {
    const { data } = await api.get<ApiResponse<Event[]>>('/events');
    return data.data;
  },
  async getById(id: string): Promise<Event> {
    const { data } = await api.get<ApiResponse<Event>>(`/events/${id}`);
    return data.data;
  },
  async create(payload: CreateEventPayload): Promise<Event> {
    const { data } = await api.post<ApiResponse<Event>>('/events', payload);
    return data.data;
  },
  async update(id: string, payload: UpdateEventPayload): Promise<Event> {
    const { data } = await api.put<ApiResponse<Event>>(`/events/${id}`, payload);
    return data.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },
};
