import { useState, useEffect } from 'react';
import { venueService } from '../services/venueService';
import type { Venue, UpdateVenuePayload, CreateVenuePayload } from '../types';

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVenues(); }, []);

  async function fetchVenues() {
    setLoading(true);
    try {
      const data = await venueService.getAll();
      setVenues(data);
    } finally {
      setLoading(false);
    }
  }

  async function createVenue(payload: CreateVenuePayload): Promise<Venue> {
    const venue = await venueService.create(payload);
    setVenues(prev => [...prev, venue]);
    return venue;
  }

  async function updateVenue(id: string, payload: UpdateVenuePayload): Promise<Venue> {
    const updated = await venueService.update(id, payload);
    setVenues(prev => prev.map(v => v.id === id ? updated : v));
    return updated;
  }

  async function deleteVenue(id: string) {
    await venueService.delete(id);
    setVenues(prev => prev.filter(v => v.id !== id));
  }

  return { venues, loading, createVenue, updateVenue, deleteVenue, refetch: fetchVenues };
}
