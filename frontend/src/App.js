import React, { useState } from 'react';
import Header from './components/Header';
// import StatsCard from './components/StatsCard'; // ✅ comment ออกถ้าไม่ใช้
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import { useDocuments, useStats } from './hooks';
// import { Inbox, Send, Clock, CheckCircle } from 'lucide-react'; // ✅ comment ออกถ้าไม่ใช้
import LoginSystem from "./components/LoginSystem";
import './App.css';
import { useTyphoonOCR } from './hooks/useTyphoonOCR';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth(); // ✅ ลบ token ออก
  
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { documents, loading, createDocument, updateDocument, fetchDocuments } = useDocuments({
    type: activeTab,
  });

  const { stats, fetchStats } = useStats();

  const { processFile } = useTyphoonOCR();

  if (!isAuthenticated) {
    return <LoginSystem />;
  }

  // ✅ ลบ statsConfig, handleNewDocumentSubmit ถ้าไม่ใช้

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
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
            onSubmit={async (data) => {
              await createDocument(data);
              await fetchStats();
              setShowNewDocForm(false);
            }}
          />
        )}

        {selectedDoc && (
          <DocumentDetail
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onUpdate={async (id, updates) => {
              await updateDocument(id, updates);
              await fetchStats();
              setSelectedDoc(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;