import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  Plus,
  Filter,
  User,
  Calendar,
  Clock,
  FileText,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';

function DocumentList({
  activeTab,
  setActiveTab,
  documents = [],
  loading = false,
  onDocumentClick,
  onNewDocument
}) {

  const [ocrDocuments, setOcrDocuments] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  // ✅ Statistics state
  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    pending: 0,
    completed: 0
  });

  // ✅ Fetch all OCR documents on component mount or when activeTab changes
  useEffect(() => {
    fetchAllOCRDocuments();
  }, [activeTab]);

  /**
   * Fetch all OCR documents
   */
  const fetchAllOCRDocuments = async () => {
    setOcrLoading(true);
    setOcrError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // ✅ ใช้ API_URL จาก .env
      const API_URL = process.env.REACT_APP_API_URL;

      // ✅ Try different endpoints (ไม่ต้องเพิ่ม /api/v1 เพราะมีอยู่แล้ว)
      const endpoints = [
        `${API_URL}/documents`,
        `${API_URL}/documents?document_type=${activeTab}`,
        `${API_URL}/ocr/results`
      ];

      let data = null;
      let lastError = null;

      for (const apiUrl of endpoints) {
        try {
          console.log('Trying endpoint:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const responseText = await response.text();
            data = JSON.parse(responseText);
            console.log('Success! Data from:', apiUrl);
            break;
          } else {
            lastError = `${response.status} ${response.statusText}`;
          }
        } catch (err) {
          lastError = err.message;
          continue;
        }
      }

      if (!data) {
        throw new Error(`All endpoints failed. Last error: ${lastError}`);
      }

      console.log('OCR Documents:', data);

      // Handle different response formats
      const documentsList = Array.isArray(data) ? data : data.data || data.documents || [];
      setOcrDocuments(documentsList);

      // ✅ Calculate statistics
      calculateStats(documentsList);

    } catch (err) {
      console.error('Error fetching OCR documents:', err.message);
      setOcrError(err.message);
      setOcrDocuments([]);
    } finally {
      setOcrLoading(false);
    }
  };

  /**
   * Calculate document statistics
   */
  const calculateStats = (documentsList) => {
    const newStats = {
      incoming: 0,
      outgoing: 0,
      pending: 0,
      completed: 0
    };

    documentsList.forEach((doc) => {
      const docType = doc.document_type || doc.type || 'incoming';
      const status = doc.status || 'รับแล้ว';

      // Count by type
      if (docType === 'incoming' || docType === 'รับเข้า') {
        newStats.incoming++;
      } else if (docType === 'outgoing' || docType === 'ส่งออก') {
        newStats.outgoing++;
      }

      // Count by status
      if (status === 'รอดำเนินการ' || status === 'pending' || status === 'รอส่ง') {
        newStats.pending++;
      } else if (status === 'เสร็จสิ้น' || status === 'completed' || status === 'ส่งแล้ว') {
        newStats.completed++;
      }
    });

    setStats(newStats);
    console.log('Stats calculated:', newStats);
  };

  /**
   * Fetch single OCR document by ID
   */
  const fetchOCRDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const API_URL = process.env.REACT_APP_API_URL;

      // ✅ Try different endpoints
      const endpoints = [
        `${API_URL}/documents/${documentId}`,
        `${API_URL}/ocr/document/${documentId}`
      ];

      let data = null;
      let lastError = null;

      for (const apiUrl of endpoints) {
        try {
          console.log('Trying endpoint:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            data = await response.json();
            console.log('Success! Data from:', apiUrl);
            break;
          } else {
            lastError = `${response.status} ${response.statusText}`;
          }
        } catch (err) {
          lastError = err.message;
          continue;
        }
      }

      if (!data) {
        throw new Error(`All endpoints failed. Last error: ${lastError}`);
      }

      console.log('OCR Document details:', data);
      return data;

    } catch (err) {
      console.error('Error fetching OCR document:', err.message);
      throw err;
    }
  };

  // ✅ Use OCR documents if available, otherwise use props documents
  const displayDocuments = activeTab === 'incoming' ? ocrDocuments : (Array.isArray(documents) ? documents : []);
  const isLoading = activeTab === 'incoming' ? ocrLoading : loading;

  const getStatusColor = (status) => {
    switch (status) {
      case 'รับแล้ว':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'รอดำเนินการ':
        return 'bg-gradient-to-r from-orange-400 to-amber-400 text-white';
      case 'เสร็จสิ้น':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'ส่งแล้ว':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'รอส่ง':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'ด่วนที่สุด':
      case 'ด่วนมาก':
        return 'text-red-500';
      case 'ด่วน':
        return 'text-orange-500';
      case 'ปกติ':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  /**
   * Handle document click - fetch full details if needed
   */
  const handleDocumentClick = async (doc) => {
    try {
      // If it's an OCR document, fetch full details
      if (doc.document_id) {
        const fullDoc = await fetchOCRDocument(doc.document_id);
        onDocumentClick?.(fullDoc);
      } else {
        onDocumentClick?.(doc);
      }
    } catch (err) {
      console.error('Error handling document click:', err);
      // Still pass the document even if fetch fails
      onDocumentClick?.(doc);
    }
  };

  // ✅ Statistics Card Component
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-2`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-600 text-xs font-medium text-center mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ✅ Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Inbox}
          label="เอกสารรับเข้า"
          value={stats.incoming}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />

        <StatCard
          icon={Send}
          label="เอกสารส่งออก"
          value={stats.outgoing}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />

        <StatCard
          icon={Clock}
          label="รอดำเนินการ"
          value={stats.pending}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />

        <StatCard
          icon={CheckCircle2}
          label="เสร็จสิ้น"
          value={stats.completed}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Document List */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/5 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'incoming'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Inbox className="w-4 h-4 inline mr-2" />
              เอกสารรับเข้า
            </button>

            <button
              onClick={() => setActiveTab('outgoing')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              เอกสารส่งออก
            </button>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2.5 text-gray-700 bg-white/50 rounded-xl hover:bg-white transition-all flex items-center gap-2 border border-gray-200">
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">กรอง</span>
            </button>

            <button
              onClick={onNewDocument}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              เพิ่มเอกสาร
            </button>
          </div>
        </div>

        {/* Error Message */}
        {ocrError && activeTab === 'incoming' && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">⚠️ {ocrError}</p>
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : displayDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ไม่มีเอกสาร</p>
            </div>
          ) : (
            displayDocuments.map((doc) => {
              // Support both OCR and regular document formats
              const title = doc.title || doc.subject || 'ไม่มีชื่อ';
              const from = doc.from_department || doc.from || doc.department || 'ไม่ระบุ';
              const date = doc.document_date || doc.date || new Date().toLocaleDateString('th-TH');
              const priority = doc.priority || 'ปกติ';
              const status = doc.status || 'รับแล้ว';
              const documentId = doc.id || doc.document_id;

              return (
                <div
                  key={documentId}
                  onClick={() => handleDocumentClick(doc)}
                  className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {title}
                        </h3>

                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(status)}`}>
                          {status}
                        </span>

                        <span className={`text-xs font-bold whitespace-nowrap ${getPriorityColor(priority)}`}>
                          ● {priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-5 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{from}</span>
                        </span>

                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          {date}
                        </span>

                        {doc.dueDate && (
                          <span className="flex items-center gap-2 text-orange-600 font-medium whitespace-nowrap">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            ครบกำหนด: {doc.dueDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>

                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentList;