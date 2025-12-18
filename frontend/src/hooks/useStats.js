// src/hooks/useStats.js
import { useState, useEffect } from 'react';
import documentApi from '../api/documentApi';
import { useAuth } from '../context/AuthContext';

export const useStats = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    pending: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await documentApi.getStats(token);

      // ตรวจสอบว่าข้อมูลมี key ที่เราต้องการ
      setStats({
        incoming: data.incoming || 0,
        outgoing: data.outgoing || 0,
        pending: data.pending || 0,
        completed: data.completed || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'ไม่สามารถโหลดสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  // โหลด stats ตอน mount หรือเมื่อ token เปลี่ยน
  useEffect(() => {
    fetchStats();
  }, [token]);

  return { stats, loading, error, fetchStats };
};
