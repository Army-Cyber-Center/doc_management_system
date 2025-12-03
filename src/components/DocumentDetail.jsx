// src/components/DocumentDetail.jsx
import React from 'react';
import { X, User, Calendar, Clock, FileText, Download, Edit, TrendingUp } from 'lucide-react';

function DocumentDetail({ document, onClose, onUpdate }) {
  
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h2>
              <div className="flex gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold bg-white ${getPriorityColor(document.priority)}`}>
                  ● ความสำคัญ {document.priority}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                {document.from ? 'จาก' : 'ถึง'}
              </p>
              <p className="font-bold text-gray-900 text-lg">{document.from || document.to}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                วันที่
              </p>
              <p className="font-bold text-gray-900 text-lg">{document.date}</p>
            </div>
            {document.dueDate && (
              <div className="col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200">
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  วันครบกำหนด
                </p>
                <p className="font-bold text-orange-600 text-lg">{document.dueDate}</p>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Timeline การดำเนินการ
            </h3>
            <div className="space-y-4">
              {[
                { status: 'รับเอกสาร', time: '19 ต.ค. 2025 เวลา 09:30', color: 'green', active: true },
                { status: 'กำลังดำเนินการ', time: '19 ต.ค. 2025 เวลา 10:15', color: 'blue', active: true },
                { status: 'รอการอนุมัติ', time: '', color: 'gray', active: false }
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    step.active 
                      ? step.color === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-blue-500 shadow-lg shadow-blue-500/50'
                      : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 pb-4 border-l-2 border-dashed border-gray-200 last:border-0 pl-6 -ml-1.5">
                    <p className={`font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.status}
                    </p>
                    {step.time && <p className="text-sm text-gray-500 mt-1">{step.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">เอกสารแนบ.pdf</p>
                  <p className="text-sm text-gray-600 mt-1">2.4 MB</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 font-medium">
                <Download className="w-4 h-4" />
                ดาวน์โหลด
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <button 
            onClick={() => onUpdate(document.id, { status: 'กำลังดำเนินการ' })}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-white transition-all font-medium text-gray-700 flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            แก้ไข
          </button>
          <button 
            onClick={() => onUpdate(document.id, { status: 'เสร็จสิ้น' })}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium"
          >
            อัพเดทสถานะ
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetail;