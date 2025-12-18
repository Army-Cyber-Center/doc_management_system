import React, { useState } from 'react';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import { useDocuments, useStats } from './hooks';
import { Inbox, Send, Clock, CheckCircle } from 'lucide-react';
import LoginSystem from "./components/LoginSystem";
import './App.css';
import { useTyphoonOCR } from './hooks/useTyphoonOCR';

function App() {
  const [token, setToken] = useState(
    sessionStorage.getItem('access_token') || null
  );
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

const { documents, loading, createDocument, updateDocument, fetchDocuments } = useDocuments({
  type: activeTab,
  token
});

  const { stats, fetchStats } = useStats({ token });

  const { processFile } = useTyphoonOCR();
  
  const handleLoginSuccess = (newToken) => {
    sessionStorage.setItem('access_token', newToken);
    setToken(newToken);
  };

  // ❌ ยังไม่ login
  if (!token) {
    return <LoginSystem onLoginSuccess={handleLoginSuccess} />;
  }

  // ✅ config สำหรับ StatsCard (มีสีแน่นอน)
  const statsConfig = [
    {
      label: 'เอกสารรับเข้าวันนี้',
      value: stats.incoming,
      icon: Inbox,
      change: '+12%',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'เอกสารส่งออกวันนี้',
      value: stats.outgoing,
      icon: Send,
      change: '+5%',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'รอดำเนินการ',
      value: stats.pending,
      icon: Clock,
      change: '-3%',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'เสร็จสิ้น',
      value: stats.completed,
      icon: CheckCircle,
      change: '+18%',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

    

  const handleNewDocumentSubmit = async (file, documentData) => {
    try {
      // อัปโหลดไฟล์ + OCR
      const newDoc = await processFile(file, { ...documentData, document_type: activeTab });

      // รีเฟรชรายการเอกสารใหม่
      await fetchDocuments(); // ต้องมีฟังก์ชัน fetchDocuments จาก useDocuments
      await fetchStats();
      setShowNewDocForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, idx) => (
            <StatsCard key={idx} {...stat} />
          ))}
        </div> */}

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
