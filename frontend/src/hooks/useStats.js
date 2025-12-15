import { useState, useEffect } from 'react';
import { documentApi } from '../api';

export const useStats = () => {
  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    pending: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};
