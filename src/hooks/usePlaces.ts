import { useState, useEffect } from 'react';

interface UsePlacesReturn {
  places: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePlaces = (): UsePlacesReturn => {
  const [places, setPlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/passenger/places');
      const data = await response.json();
      
      if (data.success) {
        setPlaces(data.places);
      } else {
        setError(data.message || 'Failed to fetch places');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  return {
    places,
    loading,
    error,
    refetch: fetchPlaces
  };
};
