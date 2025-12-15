import { useState, useEffect } from 'react';
import { documentApi } from '../api';

export const useDocuments = (filters = {}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentApi.getAll(filters);
      setDocuments(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [JSON.stringify(filters)]);

  const createDocument = async (documentData) => {
    try {
      const result = await documentApi.create(documentData);
      await fetchDocuments(); // Refresh list
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id, updates) => {
    try {
      const result = await documentApi.update(id, updates);
      await fetchDocuments(); // Refresh list
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await documentApi.delete(id);
      await fetchDocuments(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument
  };
};
