import apiClient from './apiClient';

export const ocrApi = {
  // Process OCR from file
  processFile: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/ocr/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error processing OCR:', error);
      throw error;
    }
  }
};
