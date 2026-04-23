import { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import type { Event, CreateEventPayload, UpdateEventPayload } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const data = await eventService.getToday();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  async function createEvent(payload: CreateEventPayload): Promise<Event> {
    const event = await eventService.create(payload);
    setEvents(prev => [...prev, event]);
    return event;
  }

  async function updateEvent(id: string, payload: UpdateEventPayload): Promise<Event> {
    const updated = await eventService.update(id, payload);
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  }

  async function deleteEvent(id: string) {
    await eventService.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return { events, loading, createEvent, updateEvent, deleteEvent, refetch: fetchEvents };
}
