import { useState, useEffect, useCallback } from 'react';
import documentApi from '../api/documentApi';
import { useAuth } from '../context/AuthContext'; // ✅ เพิ่ม

export const useDocuments = ({ type }) => {
  // ✅ ใช้ useAuth แทนการรับ token จาก props
  const { token } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!token) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await documentApi.fetchDocuments({ type }, token);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch documents error:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [token, type]);

  const createDocument = async (docData) => {
    if (!token) throw new Error('No token');
    const newDoc = await documentApi.uploadDocument(docData, token);
    await fetchDocuments();
    return newDoc;
  };

  const updateDocument = async (id, updates) => {
    if (!token) throw new Error('No token');
    const updated = await documentApi.updateDocument(id, updates, token);
    await fetchDocuments();
    return updated;
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, createDocument, updateDocument, fetchDocuments };
};