import { useState } from 'react';

interface BusSearchResult {
  _id: string;
  Bus_number_plate: string;
  busName: string;
  schedule: {
    starttime: string;
    endtime: string;
    startingPlace: string;
    destination: string;
    stops: Array<{
      name: string;
      lat: number;
      long: number;
      time: number;
    }>;
  };
  isactive: boolean;
}

interface UseBusSearchReturn {
  searchBuses: (day: string, startingPlace: string, destination: string) => Promise<BusSearchResult[]>;
  loading: boolean;
  error: string | null;
}

export const useBusSearch = (): UseBusSearchReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchBuses = async (day: string, startingPlace: string, destination: string): Promise<BusSearchResult[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        day,
        startingPlace,
        destination
      });
      
      const response = await fetch(`http://localhost:3002/api/passenger/search-buses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return data.buses;
      } else {
        setError(data.message || 'Failed to search buses');
        return [];
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error searching buses:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    searchBuses,
    loading,
    error
  };
};
