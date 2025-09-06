import { useState, useEffect } from 'react';

interface BusRoutesData {
  startingPlaces: string[];
  destinations: string[];
}

interface UseBusRoutesReturn {
  startingPlaces: string[];
  destinations: string[];
  loading: boolean;
  error: string | null;
  fetchRoutes: (busNumberPlate: string) => void;
  clearRoutes: () => void;
}

export const useBusRoutes = (): UseBusRoutesReturn => {
  const [startingPlaces, setStartingPlaces] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async (busNumberPlate: string) => {
    if (!busNumberPlate.trim()) {
      clearRoutes();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/driver/bus-routes?busNumberPlate=${encodeURIComponent(busNumberPlate)}`);
      const data = await response.json();

      if (data.success) {
        setStartingPlaces(data.startingPlaces || []);
        setDestinations(data.destinations || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch bus routes');
        setStartingPlaces([]);
        setDestinations([]);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setStartingPlaces([]);
      setDestinations([]);
      console.error('Error fetching bus routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearRoutes = () => {
    setStartingPlaces([]);
    setDestinations([]);
    setError(null);
  };

  return {
    startingPlaces,
    destinations,
    loading,
    error,
    fetchRoutes,
    clearRoutes
  };
};
