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
      
      // ✅ แก้ไข: ลบ /api/v1 ออก (เพราะมีใน REACT_APP_API_URL แล้ว)
      const apiUrl = `${process.env.REACT_APP_API_URL}/documents/upload`;
      console.log('🚀 Upload URL:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Upload failed:', res.status, errorText);
        throw new Error(`Upload failed: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log('✅ Upload success:', data);
      
      setResult(data); 
      return data;
    } catch (err) {
      console.error("❌ Upload Error:", err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const getDocument = useCallback(async (documentId) => {
    if (!documentId) return null;
    try {
      const token = localStorage.getItem("access_token");
      
      // ✅ แก้ไข: ใช้ /documents/ แทน /ocr/document/
      const apiUrl = `${process.env.REACT_APP_API_URL}/documents/${documentId}`;
      console.log('📥 Get document URL:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Get document failed:', res.status, errorText);
        throw new Error(`Fetch failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Get document success:', data);
      return data;
    } catch (err) {
      console.error('❌ Get document error:', err.message);
      throw err;
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      
      // ✅ แก้ไข: ลบ /api/v1 ออก
      const apiUrl = `${process.env.REACT_APP_API_URL}/documents/`;
      console.log('📋 Fetch documents URL:', apiUrl);

      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Fetch documents failed:', res.status, errorText);
        throw new Error(`Fetch failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Fetch documents success:', data.length, 'documents');

      setDocuments(data);
    } catch (err) {
      console.error("❌ Fetch Documents Error:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProcessing(false);
    setResult(null);
  }, []);

  return { 
    processing, 
    result, 
    processFile, 
    getDocument, 
    reset, 
    fetchDocuments,
    documents,
    loading,
    error
  };
}