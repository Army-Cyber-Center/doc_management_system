import React, { useState } from 'react';
import Header from './components/Header';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import { useDocuments, useStats } from './hooks';
import LoginSystem from "./components/LoginSystem";
import './App.css';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { documents, loading, createDocument, updateDocument, fetchDocuments } = useDocuments({
    type: activeTab,
  });

  const { fetchStats } = useStats();

  if (!isAuthenticated) {
    return <LoginSystem />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <DocumentList
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          documents={documents}
          loading={loading}
          onDocumentClick={(doc) => {
            console.log('📄 เปิดเอกสาร:', doc);
            setSelectedDoc(doc);
          }}
          onNewDocument={() => setShowNewDocForm(true)}
        />

        {showNewDocForm && (
          <DocumentForm
            onClose={() => setShowNewDocForm(false)}
            onSubmit={async (data) => {
              console.log('💾 กำลังบันทึกเอกสารใหม่:', data);
              await createDocument(data);
              await fetchStats();
              await fetchDocuments();
              setShowNewDocForm(false);
              console.log('✅ บันทึกเอกสารสำเร็จ');
            }}
          />
        )}

        {selectedDoc && (
          <DocumentDetail
            document={selectedDoc}
            onClose={() => {
              console.log('❌ ปิด DocumentDetail');
              setSelectedDoc(null);
            }}
            onUpdate={async (id, updates) => {
              console.log('✏️ กำลังอัพเดตเอกสาร ID:', id, 'ข้อมูล:', updates);
              try {
                await updateDocument(id, updates);
                await fetchStats();
                await fetchDocuments();
                setSelectedDoc(null);
                console.log('✅ อัพเดตเอกสารสำเร็จ');
              } catch (error) {
                console.error('❌ อัพเดตเอกสารล้มเหลว:', error);
                alert('ไม่สามารถอัพเดตเอกสารได้: ' + error.message);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;