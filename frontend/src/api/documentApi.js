import apiClient from './apiClient';

export const documentApi = {
  // Get all documents
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Get document by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  // Create new document
  create: async (documentData) => {
    try {
      const formData = new FormData();
      
      Object.keys(documentData).forEach(key => {
        if (key === 'file' && documentData[key]) {
          formData.append('file', documentData[key]);
        } else if (key === 'keywords' && Array.isArray(documentData[key])) {
          formData.append('keywords', JSON.stringify(documentData[key]));
        } else if (documentData[key] !== null && documentData[key] !== undefined) {
          formData.append(key, documentData[key]);
        }
      });

      const response = await apiClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },

  // Update document
  update: async (id, updates) => {
    try {
      const response = await apiClient.put(`/documents/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete document
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      const response = await apiClient.get('/documents/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Search documents
  search: async (query) => {
    try {
      const response = await apiClient.get('/documents/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
};
