import React from 'react';
import { Inbox, Send, Plus, Filter, User, Calendar, Clock, FileText, ArrowUpRight } from 'lucide-react';

function DocumentList({ activeTab, setActiveTab, documents, loading, onDocumentClick, onNewDocument }) {
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'รับแล้ว': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'รอดำเนินการ': return 'bg-gradient-to-r from-orange-400 to-amber-400 text-white';
      case 'เสร็จสิ้น': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'ส่งแล้ว': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'รอส่ง': return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'สูง': return 'text-red-500';
      case 'กลาง': return 'text-orange-500';
      case 'ต่ำ': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/5 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
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
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
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

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่มีเอกสาร</p>
          </div>
        ) : (
          documents.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => onDocumentClick(doc)}
              className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    <span className={`text-xs font-bold ${getPriorityColor(doc.priority)}`}>
                      ● {doc.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-5 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {doc.from || doc.to}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {doc.date}
                    </span>
                    {doc.dueDate && (
                      <span className="flex items-center gap-2 text-orange-600 font-medium">
                        <Clock className="w-4 h-4" />
                        ครบกำหนด: {doc.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocumentList;
