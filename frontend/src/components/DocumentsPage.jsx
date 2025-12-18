// src/DocumentsPage.jsx
import React, { useState } from 'react';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import { useDocuments, useStats } from './hooks';
import { useTyphoonOCR } from './hooks/useTyphoonOCR';

export default function DocumentsPage({ token }) {
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { documents, loading, createDocument, updateDocument, fetchDocuments } =
    useDocuments({ type: activeTab, token });

  const { stats, fetchStats } = useStats({ token });
  const { processFile } = useTyphoonOCR();

  const handleNewDocumentSubmit = async (file, documentData) => {
    try {
      const newDoc = await processFile(file, { ...documentData, document_type: activeTab });
      await fetchDocuments();
      await fetchStats();
      setShowNewDocForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <DocumentList
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documents={documents}
        loading={loading}
        onDocumentClick={setSelectedDoc}
        onNewDocument={() => setShowNewDocForm(true)}
      />

      {showNewDocForm && (
        <DocumentForm
          onClose={() => setShowNewDocForm(false)}
          onSubmit={handleNewDocumentSubmit}
        />
      )}

      {selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={async (id, updates) => {
            await updateDocument(id, updates);
            await fetchStats();
            await fetchDocuments();
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}
