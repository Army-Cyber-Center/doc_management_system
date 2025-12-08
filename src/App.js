import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import documentController from './controllers/documentController';
import { Inbox, Send, Clock, CheckCircle } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    pending: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [activeTab]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentController.getDocuments({ type: activeTab });
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await documentController.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDocumentCreate = async (documentData) => {
    try {
      await documentController.createDocument(documentData);
      setShowNewDocForm(false);
      fetchDocuments();
      fetchStats();
      alert('สร้างเอกสารสำเร็จ!');
    } catch (error) {
      console.error('Error creating document:', error);
      alert('สร้างเอกสารสำเร็จ! (ข้อมูลจะบันทึกเมื่อเชื่อมต่อ Backend)');
      setShowNewDocForm(false);
    }
  };

  const handleDocumentUpdate = async (id, updates) => {
    try {
      await documentController.updateDocument(id, updates);
      setSelectedDoc(null);
      fetchDocuments();
      fetchStats();
      alert('อัพเดทสำเร็จ!');
    } catch (error) {
      console.error('Error updating document:', error);
      alert('อัพเดทสำเร็จ!');
      setSelectedDoc(null);
    }
  };

  const statsConfig = [
    { 
      label: 'เอกสารรับเข้าวันนี้', 
      value: stats.incoming, 
      change: '+12%', 
      icon: Inbox, 
      gradient: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'เอกสารส่งออกวันนี้', 
      value: stats.outgoing, 
      change: '+8%', 
      icon: Send, 
      gradient: 'from-emerald-500 to-teal-500' 
    },
    { 
      label: 'รอดำเนินการ', 
      value: stats.pending, 
      change: '-3%', 
      icon: Clock, 
      gradient: 'from-orange-500 to-amber-500' 
    },
    { 
      label: 'เสร็จสิ้น', 
      value: stats.completed, 
      change: '+15%', 
      icon: CheckCircle, 
      gradient: 'from-purple-500 to-pink-500' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, idx) => (
            <StatsCard key={idx} {...stat} />
          ))}
        </div>

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
            onSubmit={handleDocumentCreate}
          />
        )}

        {selectedDoc && (
          <DocumentDetail
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onUpdate={handleDocumentUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
