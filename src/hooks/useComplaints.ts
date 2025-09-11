import { useState, useEffect, useCallback } from 'react';

interface Complaint {
  _id: string;
  busnumberplate: string;
  startingplace: string;
  destination: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintsResponse {
  success: boolean;
  totalComplaints: number;
  complaints: Complaint[];
  error?: string;
  message?: string;
}

export const useComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newComplaintsCount, setNewComplaintsCount] = useState<number>(0);

  const calculateNewComplaints = (complaints: Complaint[]) => {
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    
    return complaints.filter(complaint => {
      const complaintDate = new Date(complaint.createdAt);
      return complaintDate >= twoDaysAgo;
    }).length;
  };

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/municipality/complaints');
      const data: ComplaintsResponse = await response.json();

      if (data.success) {
        setComplaints(data.complaints);
        const newCount = calculateNewComplaints(data.complaints);
        setNewComplaintsCount(newCount);
      } else {
        setError(data.message || data.error || 'Failed to fetch complaints');
        setComplaints([]);
        setNewComplaintsCount(0);
      }
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Network error');
      setComplaints([]);
      setNewComplaintsCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { 
    complaints, 
    loading, 
    error, 
    newComplaintsCount,
    refetch: fetchComplaints 
  };
};
