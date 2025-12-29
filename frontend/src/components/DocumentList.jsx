import React, { useState } from 'react';
import { ChevronDown, Plus, AlertCircle } from 'lucide-react';

function DocumentList({ activeTab, setActiveTab, documents, loading, onDocumentClick, onNewDocument }) {
  const [expandedDoc, setExpandedDoc] = useState(null);

  const getStatusColor = (status) => {
    const normalized = status?.toLowerCase() || '';
    if (normalized === 'รับเข้า' || normalized === 'received' || normalized === 'processed') return 'bg-blue-100 text-blue-700';
    if (normalized === 'รออนุมัติ' || normalized === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (normalized === 'ส่งออก' || normalized === 'sent') return 'bg-green-100 text-green-700';
    if (normalized === 'เสร็จสิ้น' || normalized === 'completed') return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const normalized = priority?.toLowerCase() || '';
    if (normalized === 'ด่วนที่สุด' || normalized === 'urgent') return 'text-red-600';
    if (normalized === 'ด่วนมาก' || normalized === 'high') return 'text-orange-600';
    if (normalized === 'ด่วน' || normalized === 'medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  const tabOptions = [
    { id: 'incoming', label: 'เข้ามา', count: documents.filter(d => d.status === 'processed' || d.status === 'รับเข้า').length },
    { id: 'pending', label: 'รอดำเนินการ', count: documents.filter(d => d.status === 'in_progress' || d.status === 'รออนุมัติ').length },
    { id: 'sent', label: 'ส่งออก', count: documents.filter(d => d.status === 'sent_out' || d.status === 'ส่งออก').length },
    { id: 'completed', label: 'เสร็จสิ้น', count: documents.filter(d => d.status === 'completed' || d.status === 'เสร็จสิ้น').length },
  ];

  const filteredDocuments = documents.filter(doc => {
    const status = doc.status?.toLowerCase() || '';
    if (activeTab === 'incoming') return status === 'processed' || status === 'รับเข้า';
    if (activeTab === 'pending') return status === 'in_progress' || status === 'รออนุมัติ';
    if (activeTab === 'sent') return status === 'sent_out' || status === 'ส่งออก';
    if (activeTab === 'completed') return status === 'completed' || status === 'เสร็จสิ้น';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-3 border-b border-gray-200 overflow-x-auto pb-4">
        {tabOptions.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-sm font-bold ${
              activeTab === tab.id ? 'bg-blue-700' : 'bg-gray-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Add Document Button */}
      <div className="flex justify-end">
        <button
          onClick={onNewDocument}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" /> เพิ่มเอกสารใหม่
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดเอกสาร...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDocuments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">ไม่มีเอกสารในหมวดหมู่นี้</p>
        </div>
      )}

      {/* Documents List */}
      {!loading && filteredDocuments.length > 0 && (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-lg"
            >
              <div
                onClick={() => onDocumentClick(doc)}
                className="p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                      {doc.title || `เอกสารที่ ${doc.id}`}
                    </h3>
                    
                    <div className="flex gap-3 flex-wrap mb-3">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status === 'processed' ? 'รับเข้า' : doc.status}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getPriorityColor(doc.priority)}`}>
                        ● {doc.priority === 'normal' ? 'ปกติ' : doc.priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-gray-600">
                        <p className="text-xs text-gray-500 mb-1">จาก</p>
                        <p className="font-medium truncate">{doc.from_department || doc.ocr_data?.parsed_fields?.['ส่วนราชการ'] || '-'}</p>
                      </div>
                      <div className="text-gray-600">
                        <p className="text-xs text-gray-500 mb-1">เลขที่</p>
                        <p className="font-medium truncate">{doc.document_number || doc.ocr_data?.parsed_fields?.['ที่'] || '-'}</p>
                      </div>
                      <div className="text-gray-600">
                        <p className="text-xs text-gray-500 mb-1">วันที่</p>
                        <p className="font-medium">{doc.created_at?.split('T')[0] || '-'}</p>
                      </div>
                      <div className="text-gray-600">
                        <p className="text-xs text-gray-500 mb-1">ไป</p>
                        <p className="font-medium truncate">{doc.to_department || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDoc(expandedDoc === doc.id ? null : doc.id);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedDoc === doc.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedDoc === doc.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">เรื่อง</p>
                      <p className="text-gray-900">{doc.ocr_data?.parsed_fields?.['เรื่อง'] || doc.subject || '-'}</p>
                    </div>
                    <button
                      onClick={() => onDocumentClick(doc)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      ดูรายละเอียดเต็ม
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentList;
