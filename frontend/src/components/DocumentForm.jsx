import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Camera, Image, Folder } from 'lucide-react';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import getCroppedImg from '../utils/cropImage';
import { useTyphoonOCR } from '../hooks/useTyphoonOCR';

// ✅ Parse OCR extracted_text into structured fields
const parseOCRText = (extractedText) => {
  if (!extractedText) return {};

  const result = {
    department: '',
    documentNo: '',
    date: '',
    subject: '',
    from: '',
    priority: 'ปกติ'
  };

  const text = extractedText;

  const datePattern = /วันที่\s*[:\s]*([0-9]{1,2}[/\-][0-9]{1,2}[/\-][0-9]{2,4}|[\d/\-]+)/gi;
  const dateMatch = text.match(datePattern);
  if (dateMatch) result.date = dateMatch[0].replace(/วันที่\s*[:\s]*/gi, '').trim();

  const numberPattern = /(?:เลขที่|ที่)\s*[:\s]*([A-Z0-9/\-.\s]+?)(?:\n|$)/gi;
  const numberMatch = text.match(numberPattern);
  if (numberMatch) {
    result.documentNo = numberMatch[0].replace(/(?:เลขที่|ที่)\s*[:\s]*/gi, '').trim().split('\n')[0];
  }

  const deptPattern = /ส่วนราชการ\s*[:\s]*([^\n]+)/gi;
  const deptMatch = text.match(deptPattern);
  if (deptMatch) result.department = deptMatch[0].replace(/ส่วนราชการ\s*[:\s]*/gi, '').trim();

  const subjectPattern = /เรื่อง\s*[:\s]*([^\n]+)/gi;
  const subjectMatch = text.match(subjectPattern);
  if (subjectMatch) result.subject = subjectMatch[0].replace(/เรื่อง\s*[:\s]*/gi, '').trim();

  const fromPattern = /จาก\s*[:\s]*([^\n]+)/gi;
  const fromMatch = text.match(fromPattern);
  if (fromMatch) result.from = fromMatch[0].replace(/จาก\s*[:\s]*/gi, '').trim();

  if (text.includes('ด่วนที่สุด')) result.priority = 'ด่วนที่สุด';
  else if (text.includes('ด่วนมาก')) result.priority = 'ด่วนมาก';
  else if (text.includes('ด่วน')) result.priority = 'ด่วน';

  return result;
};

// ✅ แก้ไข: เพิ่ม onProgress + onMessage callback
const waitForDocument = async (
  getDocument,
  id,
  {
    interval = 3000,
    timeout = 240000
  } = {},
  onProgress,
  onMessage
) => {
  const start = Date.now();
  let attempts = 0;
  const maxAttempts = Math.floor(timeout / interval);

  while (Date.now() - start < timeout) {
    attempts++;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    
    // ✅ อัพเดต progress (0-90%)
    if (onProgress) {
      const progressPercent = Math.min((attempts / maxAttempts) * 90, 90);
      onProgress(progressPercent);
    }

    // ✅ อัพเดตข้อความตามเวลา
    if (onMessage) {
      if (elapsed < 30) {
        onMessage('🔍 กำลังวิเคราะห์เอกสาร...');
      } else if (elapsed < 60) {
        onMessage('📝 กำลังแยกข้อความจากเอกสาร...');
      } else if (elapsed < 90) {
        onMessage('🔄 กำลังประมวลผลข้อมูล...');
      } else if (elapsed < 120) {
        onMessage('⏳ เกือบเสร็จแล้ว กรุณารอสักครู่...');
      } else {
        onMessage('⌛ กำลังประมวลผลขั้นสุดท้าย...');
      }
    }

    try {
      console.log(`⏳ [${elapsed}s] กำลังรอ OCR... (ครั้งที่ ${attempts}/${maxAttempts})`);
      const data = await getDocument(id);

      if (data?.ocr_data?.extracted_text) {
        console.log('✅ OCR เสร็จแล้ว!');
        if (onProgress) onProgress(100);
        if (onMessage) onMessage('✅ ประมวลผลสำเร็จ!');
        return data;
      }
    } catch (err) {
      console.warn(`⚠️ [${elapsed}s] ยังไม่พร้อม, รอต่อ...`, err.message);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('⏱️ ระบบใช้เวลานานเกินไป (เกิน 4 นาที) กรุณาลองใหม่');
};

function DocumentForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'incoming',
    title: '',
    from: '',
    to: '',
    priority: 'ปกติ',
    department: '',
    documentNo: '',
    date: '',
    subject: '',
    file: null
  });

  const [showFileOptions, setShowFileOptions] = useState(true);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { processing, result, processFile, getDocument, reset } = useTyphoonOCR();

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  
  // ✅ เพิ่ม state สำหรับ progress + message
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // ✅ แก้ไข useEffect
  useEffect(() => {
    const fetchFullDocumentDetails = async () => {
      // ✅ ตรวจสอบเงื่อนไข
      if (!result?.id) {
        console.log('❌ ไม่มี result.id');
        return;
      }
      
      if (documentDetails?.ocr_id === result.id) {
        console.log('✅ มีข้อมูลแล้ว');
        return;
      }

      console.log('🚀 เริ่มต้นการประมวลผล OCR... ID:', result.id);
      
      setLoadingDetails(true);
      setProgress(0);
      setProgressMessage('🔍 กำลังเตรียมการ...');

      try {
        // ✅ รอจน DB พร้อม
        const data = await waitForDocument(
          getDocument, 
          result.id, 
          {
            interval: 3000,
            timeout: 240000
          },
          (progressPercent) => {
            // ✅ อัพเดต progress
            setProgress(progressPercent);
            console.log(`📊 ความคืบหน้า: ${progressPercent.toFixed(0)}%`);
          },
          (message) => {
            // ✅ อัพเดตข้อความ
            setProgressMessage(message);
            console.log(`💬 ${message}`);
          }
        );

        setProgress(100);
        setProgressMessage('✅ ประมวลผลสำเร็จ!');
        console.log('✅ ดึงข้อมูลสำเร็จ!', data);

        // ✅ Parse OCR data
        const rawText = data.ocr_data?.extracted_text || '';
        const parsed = parseOCRText(rawText);

        setDocumentDetails({
          ...parsed,
          ocr_id: result.id,
          full_raw_text: rawText
        });

        // ✅ รอ 500ms แล้วปิด modal
        setTimeout(() => {
          setLoadingDetails(false);
          setProgress(0);
          setProgressMessage('');
        }, 500);

      } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err);
        setProgress(0);
        setProgressMessage('');
        setLoadingDetails(false);
        
        alert(
          '⚠️ ระบบใช้เวลานานเกินไป (เกิน 4 นาที)\n\n' +
          'กรุณา:\n' +
          '1. ตรวจสอบขนาดไฟล์ (ควร < 5MB)\n' +
          '2. ตรวจสอบคุณภาพภาพ (ชัดเจน ไม่เบลอ)\n' +
          '3. ลองอัพโหลดใหม่อีกครั้ง\n' +
          '4. ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่'
        );
      }
    };

    fetchFullDocumentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.id]);

  // ✅ Auto-fill form when documentDetails available
  useEffect(() => {
    if (documentDetails) {
      setFormData(prev => ({
        ...prev,
        department: documentDetails.department || prev.department,
        documentNo: documentDetails.documentNo || prev.documentNo,
        date: documentDetails.date || prev.date,
        subject: documentDetails.subject || prev.subject,
        from: documentDetails.from || prev.from,
        priority: documentDetails.priority || prev.priority
      }));
    }
  }, [documentDetails]);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setFormData(prev => ({ ...prev, file, title: file.name }));
    setShowFileOptions(false);

    // ✅ Upload & OCR
    try {
      await processFile(file, {
        title: file.name,
        document_type: formData.type
      });
    } catch (err) {
      alert('อัพโหลดไฟล์ไม่สำเร็จ: ' + err.message);
      reset();
    }
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels, 0);
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      setCropModalOpen(false);
      setTempImage(null);
      
      await handleFileSelect(croppedFile);
    } catch (err) {
      console.error(err);
      alert('Crop ภาพไม่สำเร็จ');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file) {
      alert('กรุณาเลือกไฟล์');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('file', formData.file);
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('from', formData.from);
      submitData.append('to', formData.to);
      submitData.append('priority', formData.priority);
      submitData.append('department', formData.department);
      submitData.append('documentNo', formData.documentNo);
      submitData.append('date', formData.date);
      submitData.append('subject', formData.subject);

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-2xl z-10">
            <h2 className="text-2xl font-bold">เพิ่มเอกสารใหม่</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* File Upload Options */}
            {showFileOptions && !processing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all group-hover:scale-105">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                    <p className="font-semibold text-gray-700">ถ่ายรูป</p>
                    <p className="text-sm text-gray-500">เปิดกล้องถ่ายเอกสาร</p>
                  </div>
                </label>

                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all group-hover:scale-105">
                    <Image className="w-12 h-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                    <p className="font-semibold text-gray-700">เลือกรูปภาพ</p>
                    <p className="text-sm text-gray-500">จากแกลเลอรี่</p>
                  </div>
                </label>

                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all group-hover:scale-105">
                    <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                    <p className="font-semibold text-gray-700">เลือกไฟล์</p>
                    <p className="text-sm text-gray-500">PDF, Word</p>
                  </div>
                </label>
              </div>
            )}

            {/* Processing Indicator */}
            {processing && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                  <div>
                    <p className="font-semibold text-blue-900">กำลังอัพโหลดไฟล์...</p>
                    <p className="text-sm text-blue-700">กรุณารอสักครู่</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            {formData.file && !processing && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ประเภทเอกสาร
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="incoming">เอกสารรับเข้า</option>
                    <option value="outgoing">เอกสารส่งออก</option>
                  </select>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ชื่อเอกสาร
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="ชื่อเอกสาร"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      เลขที่เอกสาร
                    </label>
                    <input
                      type="text"
                      name="documentNo"
                      value={formData.documentNo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="เลขที่เอกสาร"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      จาก
                    </label>
                    <input
                      type="text"
                      name="from"
                      value={formData.from}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="ผู้ส่ง/หน่วยงาน"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ถึง
                    </label>
                    <input
                      type="text"
                      name="to"
                      value={formData.to}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="ผู้รับ/หน่วยงาน"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      วันที่
                    </label>
                    <input
                      type="text"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="วันที่เอกสาร"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ความสำคัญ
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="ปกติ">ปกติ</option>
                      <option value="ด่วน">ด่วน</option>
                      <option value="ด่วนมาก">ด่วนมาก</option>
                      <option value="ด่วนที่สุด">ด่วนที่สุด</option>
                    </select>
                  </div>
                </div>

                {/* Subject & Department */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เรื่อง
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="เรื่อง"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    หน่วยงาน
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="หน่วยงาน"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={processing || loadingDetails}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingDetails ? 'กำลังประมวลผล...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Loading Modal with Progress */}
      {loadingDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* ✅ Animated Icon */}
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>

              {/* ✅ Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                กำลังประมวลผล OCR
              </h3>
              
              {/* ✅ Dynamic Message */}
              <p className="text-sm text-gray-600 mb-6 min-h-[24px]">
                {progressMessage || 'กำลังเตรียมการ...'}
              </p>

              {/* ✅ Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* ✅ Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                </div>
              </div>

              {/* ✅ Percentage & Time */}
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600">ความคืบหน้า</span>
                <span className="font-bold text-blue-600 tabular-nums">{progress.toFixed(0)}%</span>
              </div>

              {/* ✅ Time Estimate */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>ใช้เวลาประมาณ 1-2 นาที</span>
              </div>

              {/* ✅ Warning Box */}
              {progress > 0 && progress < 100 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-in fade-in">
                  <p className="text-xs text-yellow-800 flex items-center justify-center gap-2">
                    <span className="text-base">⚠️</span>
                    กรุณาอย่าปิดหน้าต่างนี้ระหว่างประมวลผล
                  </p>
                </div>
              )}

              {/* ✅ Success Box */}
              {progress === 100 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
                  <p className="text-xs text-green-800 flex items-center justify-center gap-2">
                    <span className="text-base">✅</span>
                    ประมวลผลเสร็จสมบูรณ์!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      <Modal
        isOpen={cropModalOpen}
        onRequestClose={() => setCropModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center p-4 z-[10000]"
        overlayClassName="fixed inset-0 bg-black/70"
      >
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="p-4 border-b">
            <h3 className="text-lg font-bold">ปรับแต่งภาพ</h3>
          </div>

          <div className="relative h-96 bg-gray-900">
            {tempImage && (
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            )}
          </div>

          <div className="p-4 border-t">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">ซูม</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCropModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCropComplete}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                ใช้ภาพนี้
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default DocumentForm;