import { useState } from 'react';
import { ocrApi } from '../api';

export const useOCR = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const processFile = async (file) => {
    try {
      setProcessing(true);
      setProgress(0);
      setError(null);
      setResult(null);

      const data = await ocrApi.processFile(file, (percent) => {
        setProgress(percent);
      });

      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error processing OCR:', err);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setProcessing(false);
    setProgress(0);
    setResult(null);
    setError(null);
  };

  return {
    processing,
    progress,
    result,
    error,
    processFile,
    reset
  };
};
