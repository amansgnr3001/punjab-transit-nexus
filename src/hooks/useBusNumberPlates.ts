import { useState, useEffect } from 'react';

interface BusNumberPlatesResponse {
  success: boolean;
  totalBuses: number;
  busNumberPlates: string[];
}

export const useBusNumberPlates = () => {
  const [busNumberPlates, setBusNumberPlates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusNumberPlates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/passenger/bus-number-plates');
      const data: BusNumberPlatesResponse = await response.json();
      
      if (data.success) {
        setBusNumberPlates(data.busNumberPlates);
        console.log('✅ Fetched bus number plates:', data.busNumberPlates);
      } else {
        setError('Failed to fetch bus number plates');
      }
    } catch (error) {
      console.error('❌ Error fetching bus number plates:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusNumberPlates();
  }, []);

  return {
    busNumberPlates,
    loading,
    error,
    refetch: fetchBusNumberPlates
  };
};
