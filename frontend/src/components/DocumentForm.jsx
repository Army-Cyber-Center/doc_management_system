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

// ✅ แก้ไข: เพิ่ม onProgress callback + เพิ่ม timeout
const waitForDocument = async (
  getDocument,
  id,
  {
    interval = 3000,  // ยิงซ้ำทุก 3 วิ
    timeout = 240000  // ✅ เพิ่มเป็น 240 วิ (4 นาที)
  } = {},
  onProgress // ✅ เพิ่ม callback
) => {
  const start = Date.now();
  let attempts = 0;
  const maxAttempts = Math.floor(timeout / interval);

  while (Date.now() - start < timeout) {
    attempts++;
    
    // ✅ อัพเดต progress (0-90%)
    if (onProgress) {
      const progressPercent = Math.min((attempts / maxAttempts) * 90, 90);
      onProgress(progressPercent);
    }

    try {
      console.log(`⏳ กำลังรอ OCR... (${attempts}/${maxAttempts})`);
      const data = await getDocument(id);

      if (data?.ocr_data?.extracted_text) {
        console.log('✅ OCR เสร็จแล้ว!');
        if (onProgress) onProgress(100);
        return data;
      }
    } catch (err) {
      console.warn('⚠️ ยังไม่พร้อม, รอต่อ...', err.message);
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
  const [progress, setProgress] = useState(0);

  // ✅ แก้ไข useEffect
  useEffect(() => {
    const fetchFullDocumentDetails = async () => {
      if (!result?.id || documentDetails?.ocr_id === result.id) return;

      setLoadingDetails(true);
      setProgress(0);

      try {
        console.log('🚀 เริ่มต้นการประมวลผล OCR...');
        
        // ✅ รอจน DB พร้อม + ส่ง progress callback
        const data = await waitForDocument(
          getDocument, 
          result.id, 
          {
            interval: 3000,   // 3 วิ
            timeout: 240000   // 4 นาที
          },
          (progressPercent) => {
            // ✅ อัพเดต progress bar real-time
            setProgress(progressPercent);
            console.log(`📊 ความคืบหน้า: ${progressPercent.toFixed(0)}%`);
          }
        );

        setProgress(100);
        console.log('✅ ดึงข้อมูลสำเร็จ!');

        const rawText = data.ocr_data.extracted_text;
        const parsed = parseOCRText(rawText);

        setDocumentDetails({
          ...parsed,
          ocr_id: result.id,
          full_raw_text: rawText
        });

      } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err);
        setProgress(0);
        alert('⚠️ ระบบใช้เวลานานเกินไป (เกิน 4 นาที)\n\nกรุณา:\n1. ตรวจสอบขนาดไฟล์ (ควร < 5MB)\n2. ลองอัพโหลดใหม่อีกครั้ง\n3. ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchFullDocumentDetails();
  }, [result, documentDetails, getDocument]);

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
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-2xl">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* ✅ Animated Icon */}
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
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
              
              {/* ✅ Subtitle */}
              <p className="text-sm text-gray-600 mb-6">
                {progress < 30 ? '🔍 กำลังวิเคราะห์เอกสาร...' : 
                 progress < 60 ? '📝 กำลังแยกข้อความ...' : 
                 progress < 90 ? '🔄 กำลังประมวลผลข้อมูล...' : 
                 '✨ เกือบเสร็จแล้ว...'}
              </p>

              {/* ✅ Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* ✅ Percentage */}
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600">ความคืบหน้า</span>
                <span className="font-bold text-blue-600">{progress.toFixed(0)}%</span>
              </div>

              {/* ✅ Time Estimate */}
              <p className="text-xs text-gray-500 mb-4">
                ⏱️ ใช้เวลาประมาณ 1-2 นาที (ขึ้นอยู่กับขนาดไฟล์)
              </p>

              {/* ✅ Warning */}
              {progress > 0 && progress < 100 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ กรุณาอย่าปิดหน้าต่างนี้ระหว่างประมวลผล
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
        className="fixed inset-0 flex items-center justify-center p-4"
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