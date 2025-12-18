// Export default from apiClient as apiClient
export { default as apiClient } from './apiClient';

// Export default from documentApi as documentApi
export { default as documentApi } from './documentApi';

// Export all the named functions from documentApi
export { uploadDocument, fetchDocumentById, fetchDocuments, deleteDocument, updateDocument } from './documentApi';

// Export ocrApi (assuming named export)
export { ocrApi } from './ocrApi';
