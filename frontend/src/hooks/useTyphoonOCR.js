import { useState, useCallback } from "react";

export function useTyphoonOCR() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const processFile = useCallback(async (file, documentData = {}) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Authentication required.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", documentData.title || file.name);
      formData.append("document_type", documentData.document_type || "incoming");
      
      const apiUrl = `${process.env.REACT_APP_API_URL}/documents/upload`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      
      // เก็บข้อมูล result เพื่อให้ Component นำไปใช้ต่อ
      setResult(data); 
      return data;
    } catch (err) {
      console.error("Upload Error:", err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const getDocument = useCallback(async (documentId) => {
    if (!documentId) return null;
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = `${process.env.REACT_APP_API_URL}/ocr/document/${documentId}`;
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  }, []);

   const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/v1/documents/`;

      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();

      setDocuments(data); // สมมติ API ส่ง array ของเอกสาร
    } catch (err) {
      console.error("Fetch Documents Error:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProcessing(false);
    setResult(null);
  }, []);

  return { processing, result, processFile, getDocument, reset,fetchDocuments };
}