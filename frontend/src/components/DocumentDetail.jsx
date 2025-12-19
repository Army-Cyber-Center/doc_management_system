import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, FileText, Download, Edit, TrendingUp, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

function DocumentDetail({ document, onClose, onUpdate }) {
  // ✅ Debug
  console.log('🔍 DocumentDetail received:', document);
  
  // ✅ แปลง Backend data → Frontend format
  const normalizedDoc = {
    id: document.id,
    title: document.title,
    type: document.document_type,
    
    // ✅ ดึงจาก ocr_data.parsed_fields
    from: document.ocr_data?.parsed_fields?.['ส่วนราชการ'] || document.from_department || '-',
    to: document.to_user_id || document.to_department || '-',
    date: document.ocr_data?.parsed_fields?.['วันที่'] || document.due_date || document.created_at?.split('T')[0] || '-',
    documentNo: document.ocr_data?.parsed_fields?.['ที่'] || document.document_number || '-',
    subject: document.ocr_data?.parsed_fields?.['เรื่อง'] || '-',
    department: document.ocr_data?.parsed_fields?.['ส่วนราชการ'] || document.from_department || '-',
    
    priority: document.priority === 'normal' ? 'ปกติ' : document.priority,
    status: document.status === 'processed' ? 'รับแล้ว' : document.status,
    created_at: document.created_at,
    file_path: document.file_path
  };

  console.log('✅ Normalized:', normalizedDoc);

  // ✅ State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [editData, setEditData] = useState({
    title: normalizedDoc.title || '',
    from: normalizedDoc.from || '',
    to: normalizedDoc.to || '',
    date: normalizedDoc.date || '',
    status: normalizedDoc.status || 'รับแล้ว',
    priority: normalizedDoc.priority || 'ปกติ',
    subject: normalizedDoc.subject || '',
    department: normalizedDoc.department || '',
    documentNo: normalizedDoc.documentNo || ''
  });

  // ✅ State สำหรับ timeline
  const [currentStatus, setCurrentStatus] = useState(normalizedDoc.status);
  const [completedByName, setCompletedByName] = useState('');

  /**
   * Handle 401 - Redirect to login
   */
  const handleUnauthorized = () => {
    console.error('🔐 Token expired or invalid');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  /**
   * Get Authorization Header
   */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('⚠️ No access token found');
      handleUnauthorized();
      throw new Error('Authentication required. Please log in.');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  /**
   * ✅ Fetch workflows สำหรับเอกสารนี้
   */
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_URL}/workflows/document/${document.id}`, {
          headers
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Workflows:', data);
        setWorkflows(data.workflows || []);

        // ✅ หา workflow ล่าสุดที่เสร็จสิ้น
        if (data.workflows && data.workflows.length > 0) {
          const lastWorkflow = data.workflows[data.workflows.length - 1];
          if (lastWorkflow.completed_by_name) {
            setCompletedByName(lastWorkflow.completed_by_name);
          }
        }

      } catch (error) {
        console.error('❌ Fetch workflows failed:', error);
      }
    };

    fetchWorkflows();
  }, [document.id]);

  /**
   * ✅ ฟังก์ชันอัพเดทสถานะผ่าน workflow API
   */
  const handleUpdateWorkflow = async () => {
    setIsLoading(true);

    try {
      const headers = getAuthHeaders();

      // ✅ map สถานะปัจจุบัน → action
      const getNextAction = () => {
        if (currentStatus === 'รับแล้ว' || currentStatus === 'processed' || currentStatus === 'incoming') {
          return { action: 'process', nextStatus: 'กำลังดำเนินการ' };
        }

        if (currentStatus === 'กำลังดำเนินการ' || currentStatus === 'in_progress') {
          return { action: 'send_out', nextStatus: 'เอกสารส่งออก' };
        }

        if (currentStatus === 'เอกสารส่งออก' || currentStatus === 'sent_out') {
          return { action: 'complete', nextStatus: 'เสร็จสิ้น' };
        }

        return null;
      };

      const next = getNextAction();
      if (!next) return;

      // ✅ Validation: ถ้าจะทำให้เสร็จสิ้น ต้องกรอกชื่อ
      if (next.action === 'complete' && !completedByName.trim()) {
        alert('⚠️ กรุณากรอกชื่อผู้ดำเนินการให้เสร็จสิ้น');
        setIsLoading(false);
        return;
      }

      // ✅ payload ตรง schema backend 100%
      const payload = {
        document_id: document.id,
        action: next.action,
        comment: `เปลี่ยนสถานะเป็น ${next.nextStatus}`,
        completed_by_name: completedByName.trim() || undefined
      };

      console.log('📤 Workflow payload:', payload);

      const response = await fetch(`${API_URL}/workflows/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      // 🔐 401
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      // ❌ 422
      if (response.status === 422) {
        const errorData = await response.json();
        console.error('❌ Validation Error (422):', errorData);
        alert('ข้อมูลไม่ถูกต้อง: ' + JSON.stringify(errorData.detail));
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Workflow created:', result);

      // ✅ update UI
      setCurrentStatus(next.nextStatus);
      await onUpdate(document.id, { status: next.nextStatus });

      // ✅ Reload workflows
      const workflowsResponse = await fetch(`${API_URL}/workflows/document/${document.id}`, {
        headers
      });
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.workflows || []);
      }

      alert(`✅ อัพเดทสถานะเป็น "${next.nextStatus}" สำเร็จ`);

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Workflow update failed:', error);
      alert('อัพเดทสถานะล้มเหลว: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ✅ ฟังก์ชันบันทึกการแก้ไข (ไม่ใช้ workflow)
   */
  const handleSave = async () => {
    console.log('💾 กำลังบันทึก:', editData);
    setIsLoading(true);
    try {
      // แก้ไขข้อมูลเอกสารโดยตรง (ไม่ผ่าน workflow)
      await onUpdate(document.id, editData);
      setIsEditing(false);
      alert('✅ บันทึกข้อมูลสำเร็จ');
      
    } catch (error) {
      console.error('❌ บันทึกล้มเหลว:', error);
      alert('บันทึกไม่สำเร็จ: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ✅ ฟังก์ชันยกเลิก
   */
  const handleCancel = () => {
    setEditData({
      title: normalizedDoc.title || '',
      from: normalizedDoc.from || '',
      to: normalizedDoc.to || '',
      date: normalizedDoc.date || '',
      status: normalizedDoc.status || 'รับแล้ว',
      priority: normalizedDoc.priority || 'ปกติ',
      subject: normalizedDoc.subject || '',
      department: normalizedDoc.department || '',
      documentNo: normalizedDoc.documentNo || ''
    });
    setIsEditing(false);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'รับแล้ว': 
      case 'processed': 
      case 'incoming':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'รอดำเนินการ': 
      case 'pending':
        return 'bg-gradient-to-r from-orange-400 to-amber-400 text-white';
      case 'เสร็จสิ้น': 
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'กำลังดำเนินการ':
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white';
      case 'เอกสารส่งออก':
      case 'sent_out':
        return 'bg-gradient-to-r from-purple-400 to-pink-400 text-white';
      default: 
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'ด่วนที่สุด': 
      case 'urgent':
        return 'text-red-500';
      case 'ด่วนมาก': 
      case 'high':
        return 'text-orange-500';
      case 'ด่วน': 
      case 'medium':
        return 'text-yellow-600';
      case 'ปกติ': 
      case 'normal':
        return 'text-green-500';
      default: 
        return 'text-gray-500';
    }
  };

  /**
   * ✅ ฟังก์ชันแสดงข้อความปุ่มตามขั้น
   */
  const getButtonText = () => {
    if (currentStatus === 'รับแล้ว' || currentStatus === 'processed' || currentStatus === 'incoming') {
      return '→ ส่งไปดำเนินการ';
    } else if (currentStatus === 'กำลังดำเนินการ' || currentStatus === 'in_progress') {
      return '→ ส่งออก';
    } else if (currentStatus === 'เอกสารส่งออก' || currentStatus === 'sent_out') {
      return '→ ทำเสร็จสิ้น';
    } else {
      return 'อัพเดทสถานะ';
    }
  };

  /**
   * ✅ ฟังก์ชันสร้าง timeline steps จาก workflows
   */
  const getTimelineSteps = () => {
    const steps = [];

    // Step 1: เอกสารรับเข้า (always active)
    steps.push({
      step: 1,
      status: 'เอกสารรับเข้า',
      time: normalizedDoc.created_at 
        ? new Date(normalizedDoc.created_at).toLocaleString('th-TH')
        : '',
      color: 'green',
      active: true,
      completedBy: document.creator_username || null
    });

    // ✅ เพิ่ม workflows ที่มีจาก API
    workflows.forEach((workflow, idx) => {
      steps.push({
        step: idx + 2,
        status: workflow.action === 'process' 
          ? 'กำลังดำเนินการ'
          : workflow.action === 'send_out'
          ? 'เอกสารส่งออก'
          : workflow.action === 'complete'
          ? 'เสร็จสิ้น'
          : workflow.action,
        time: workflow.timestamp 
          ? new Date(workflow.timestamp).toLocaleString('th-TH')
          : '',
        color: workflow.action === 'complete' 
          ? 'purple'
          : workflow.action === 'send_out'
          ? 'orange'
          : 'blue',
        active: true,
        completedBy: workflow.completed_by_name || workflow.username
      });
    });

    return steps;
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{normalizedDoc.title || 'ไม่มีชื่อ'}</h2>
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
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                    <option value="เอกสารส่งออก">เอกสารส่งออก</option>
                    <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm ${getStatusColor(currentStatus)}`}>
                    {currentStatus}
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
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-bold bg-white ${getPriorityColor(normalizedDoc.priority)}`}>
                    ● ความสำคัญ {normalizedDoc.priority}
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
                จาก / ส่วนราชการ
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
                <p className="font-bold text-gray-900 text-lg">{normalizedDoc.from}</p>
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
                <p className="font-bold text-gray-900 text-lg">{normalizedDoc.documentNo}</p>
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
                <p className="font-bold text-gray-900 text-lg">{normalizedDoc.date}</p>
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
                <p className="font-bold text-gray-900 text-lg">{normalizedDoc.to}</p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border-2 border-cyan-100">
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              เรื่อง
            </p>
            {isEditing ? (
              <textarea
                value={editData.subject}
                onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-cyan-300 rounded-lg focus:border-cyan-500"
                placeholder="เรื่อง"
                rows={3}
              />
            ) : (
              <p className="font-bold text-gray-900 text-lg">{normalizedDoc.subject}</p>
            )}
          </div>

          {/* ✅ Input ชื่อคนเมื่อเสร็จสิ้น */}
          {(currentStatus === 'เอกสารส่งออก' || currentStatus === 'sent_out') && !isEditing ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                ชื่อผู้ดำเนินการให้เสร็จสิ้น <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                value={completedByName}
                onChange={(e) => setCompletedByName(e.target.value)}
                className="font-bold text-gray-900 text-lg w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500"
                placeholder="กรอกชื่อผู้ดำเนินการ (จำเป็น)"
                required
              />
              {!completedByName.trim() && (
                <p className="text-xs text-red-500 mt-1">⚠️ กรุณากรอกชื่อก่อนกดปุ่มทำเสร็จสิ้น</p>
              )}
            </div>
          ) : null}

          {/* Timeline */}
          {!isEditing && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Timeline การดำเนินการ
              </h3>
              <div className="space-y-4">
                {getTimelineSteps().map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      step.active 
                        ? step.color === 'green' 
                          ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                          : step.color === 'blue'
                          ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                          : step.color === 'orange'
                          ? 'bg-orange-500 shadow-lg shadow-orange-500/50'
                          : 'bg-purple-500 shadow-lg shadow-purple-500/50'
                        : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1 pb-4 border-l-2 border-dashed border-gray-200 last:border-0 pl-6 -ml-1.5">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.status}
                        </p>
                      </div>
                      {step.time && <p className="text-sm text-gray-500 mt-1">📅 {step.time}</p>}
                      {step.completedBy && <p className="text-sm text-blue-600 font-semibold mt-1">👤 ผู้ดำเนินการ: {step.completedBy}</p>}
                    </div>
                  </div>
                ))}
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
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" /> 
                {isLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
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
                onClick={handleUpdateWorkflow}
                disabled={
                  isLoading || 
                  currentStatus === 'เสร็จสิ้น' || 
                  currentStatus === 'completed' || 
                  ((currentStatus === 'เอกสารส่งออก' || currentStatus === 'sent_out') && !completedByName.trim())
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading 
                  ? 'กำลังอัพเดท...' 
                  : currentStatus === 'เสร็จสิ้น' || currentStatus === 'completed' 
                    ? '✓ เสร็จสิ้นแล้ว' 
                    : ((currentStatus === 'เอกสารส่งออก' || currentStatus === 'sent_out') && !completedByName.trim())
                      ? '⚠️ กรุณากรอกชื่อผู้ดำเนินการ'
                      : getButtonText()
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentDetail;