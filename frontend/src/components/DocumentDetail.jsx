import React, { useState } from 'react';
import { X, User, Calendar, Clock, FileText, Download, Edit, TrendingUp, Save } from 'lucide-react';

function DocumentDetail({ document, onClose, onUpdate }) {
  // ✅ เพิ่ม state สำหรับโหมดแก้ไข
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: document.title || '',
    from: document.from || '',
    to: document.to || '',
    date: document.date || '',
    status: document.status || 'รับแล้ว',
    priority: document.priority || 'ปกติ',
    subject: document.subject || '',
    department: document.department || '',
    documentNo: document.documentNo || document.document_no || ''
  });

  // ✅ ฟังก์ชันบันทึกการแก้ไข
  const handleSave = async () => {
    console.log('💾 กำลังบันทึก:', editData);
    try {
      await onUpdate(document.id || document.document_id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('❌ บันทึกล้มเหลว:', error);
      alert('บันทึกไม่สำเร็จ: ' + error.message);
    }
  };

  // ✅ ฟังก์ชันยกเลิก
  const handleCancel = () => {
    setEditData({
      title: document.title || '',
      from: document.from || '',
      to: document.to || '',
      date: document.date || '',
      status: document.status || 'รับแล้ว',
      priority: document.priority || 'ปกติ',
      subject: document.subject || '',
      department: document.department || '',
      documentNo: document.documentNo || document.document_no || ''
    });
    setIsEditing(false);
  };
  
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
      case 'ด่วนที่สุด': return 'text-red-500';
      case 'ด่วนมาก': return 'text-orange-500';
      case 'ด่วน': return 'text-yellow-600';
      case 'ปกติ': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              {/* ✅ โหมดแก้ไข - ชื่อเอกสาร */}
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-2xl font-bold text-gray-900 mb-2 w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="ชื่อเอกสาร"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{document.title || 'ไม่มีชื่อ'}</h2>
              )}

              <div className="flex gap-2 flex-wrap">
                {/* ✅ เลือก Status */}
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium border-2 border-blue-300 focus:border-blue-500"
                  >
                    <option value="รับแล้ว">รับแล้ว</option>
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                    <option value="ส่งแล้ว">ส่งแล้ว</option>
                    <option value="รอส่ง">รอส่ง</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm ${getStatusColor(document.status || 'รับแล้ว')}`}>
                    {document.status || 'รับแล้ว'}
                  </span>
                )}

                {/* ✅ เลือก Priority */}
                {isEditing ? (
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium border-2 border-blue-300 focus:border-blue-500"
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ด่วน">ด่วน</option>
                    <option value="ด่วนมาก">ด่วนมาก</option>
                    <option value="ด่วนที่สุด">ด่วนที่สุด</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-bold bg-white ${getPriorityColor(document.priority || 'ปกติ')}`}>
                    ● ความสำคัญ {document.priority || 'ปกติ'}
                  </span>
                )}
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
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                จาก
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.from}
                  onChange={(e) => setEditData({ ...editData, from: e.target.value })}
                  className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500"
                  placeholder="ผู้ส่ง/หน่วยงาน"
                />
              ) : (
                <p className="font-bold text-gray-900 text-lg">{document.from || '-'}</p>
              )}
            </div>

            {/* To */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                ถึง
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.to}
                  onChange={(e) => setEditData({ ...editData, to: e.target.value })}
                  className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                  placeholder="ผู้รับ/หน่วยงาน"
                />
              ) : (
                <p className="font-bold text-gray-900 text-lg">{document.to || '-'}</p>
              )}
            </div>

            {/* Date */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                วันที่
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500"
                  placeholder="วันที่เอกสาร"
                />
              ) : (
                <p className="font-bold text-gray-900 text-lg">{document.date || document.document_date || '-'}</p>
              )}
            </div>

            {/* Document No */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                เลขที่เอกสาร
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.documentNo}
                  onChange={(e) => setEditData({ ...editData, documentNo: e.target.value })}
                  className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500"
                  placeholder="เลขที่เอกสาร"
                />
              ) : (
                <p className="font-bold text-gray-900 text-lg">{document.documentNo || document.document_no || '-'}</p>
              )}
            </div>
          </div>

          {/* Subject */}
          {(isEditing || document.subject) && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border-2 border-cyan-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                เรื่อง
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.subject}
                  onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                  className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-cyan-300 rounded-lg focus:border-cyan-500"
                  placeholder="เรื่อง"
                />
              ) : (
                <p className="font-bold text-gray-900 text-lg">{document.subject || '-'}</p>
              )}
            </div>
          )}

          {/* Department */}
          {(isEditing || document.department || document.from_department) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-100">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                หน่วยงาน
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                  className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:border-indigo-500"
                  placeholder="หน่วยงาน"
                />
              ) : (
                <p className="font-bold text-gray-900 text-lg">{document.department || document.from_department || '-'}</p>
              )}
            </div>
          )}

          {/* Timeline */}
          {!isEditing && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Timeline การดำเนินการ
              </h3>
              <div className="space-y-4">
                {[
                  { status: 'รับเอกสาร', time: document.created_at || '19 ต.ค. 2025 เวลา 09:30', color: 'green', active: true },
                  { status: 'กำลังดำเนินการ', time: '19 ต.ค. 2025 เวลา 10:15', color: 'blue', active: document.status !== 'รับแล้ว' },
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
          )}

          {/* Attachment */}
          {!isEditing && (
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
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          {isEditing ? (
            <>
              {/* ✅ โหมดแก้ไข */}
              <button 
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-white transition-all font-medium text-gray-700"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                บันทึกการแก้ไข
              </button>
            </>
          ) : (
            <>
              {/* ✅ โหมดปกติ */}
              <button 
                onClick={() => {
                  console.log('✏️ เปิดโหมดแก้ไข');
                  setIsEditing(true);
                }}
                className="flex-1 px-6 py-3 border-2 border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                แก้ไขเอกสาร
              </button>
              <button 
                onClick={() => onUpdate(document.id || document.document_id, { status: 'เสร็จสิ้น' })}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium"
              >
                อัพเดทเป็นเสร็จสิ้น
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentDetail;
