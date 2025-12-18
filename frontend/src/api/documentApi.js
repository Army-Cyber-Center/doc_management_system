// src/api/documentApi.js

const API_BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Upload document to backend
 */
export const uploadDocument = async (formData, token) => {
  if (!token) {
    throw new Error('Token not found. Please login again.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Fetch document by ID
 */
export const fetchDocumentById = async (documentId, token) => {
  if (!token) {
    throw new Error('Token not found. Please login again.');
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Fetch failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch document error:', error);
    throw error;
  }
};

/**
 * Fetch all documents with filters
 */
export const fetchDocuments = async (filters = {}, token) => {
  if (!token) throw new Error('Token not found');

  const query = new URLSearchParams(filters).toString();

  const response = await fetch(
    `${API_BASE_URL}/documents/${query ? `?${query}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Fetch failed');
  }

  return response.json();
};
/**
 * Delete document by ID
 */
export const deleteDocument = async (documentId, token) => {
  if (!token) {
    throw new Error('Token not found. Please login again.');
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Delete failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
};

/**
 * Update document
 */
export const updateDocument = async (documentId, updateData, token) => {
  if (!token) {
    throw new Error('Token not found. Please login again.');
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Update failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Update document error:', error);
    throw error;
  }
};

// Default export (for compatibility)
const documentApi = {
  uploadDocument,
  fetchDocumentById,
  fetchDocuments,
  deleteDocument,
  updateDocument,
};

export default documentApi;