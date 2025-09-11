import { useState, useEffect, useCallback } from 'react';

interface BusPlacesResponse {
  success: boolean;
  busNumberPlate: string;
  busName: string;
  totalPlaces: number;
  places: string[];
  error?: string;
  message?: string;
}

export const useBusPlaces = (busNumberPlate: string | null) => {
  const [places, setPlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusPlaces = useCallback(async (busNumberPlate: string) => {
    if (!busNumberPlate) {
      setPlaces([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3002/api/passenger/bus/${encodeURIComponent(busNumberPlate)}/places`);
      const data: BusPlacesResponse = await response.json();

      if (data.success) {
        setPlaces(data.places);
      } else {
        setError(data.message || data.error || 'Failed to fetch bus places');
        setPlaces([]);
      }
    } catch (err: any) {
      console.error('Error fetching bus places:', err);
      setError(err.message || 'Network error');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (busNumberPlate) {
      fetchBusPlaces(busNumberPlate);
    } else {
      setPlaces([]);
      setError(null);
      setLoading(false);
    }
  }, [busNumberPlate, fetchBusPlaces]);

  return { 
    places, 
    loading, 
    error, 
    refetch: () => busNumberPlate ? fetchBusPlaces(busNumberPlate) : Promise.resolve() 
  };
};
