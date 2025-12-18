import React, { useState, useEffect, useCallback } from 'react'; // นำเข้า useCallback
import { X, CheckCircle, FileText, Camera, Image, Folder } from 'lucide-react';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import getCroppedImg from '../utils/cropImage';
import { useTyphoonOCR } from '../hooks/useTyphoonOCR';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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

  const datePattern = /วันที่\s*[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}|[\d\/\-]+)/gi;
  const dateMatch = text.match(datePattern);
  if (dateMatch) result.date = dateMatch[0].replace(/วันที่\s*[:\s]*/gi, '').trim();

  const numberPattern = /(?:เลขที่|ที่)\s*[:\s]*([A-Z0-9\/\-.\s]+?)(?:\n|$)/gi;
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

const waitForDocument = async (
  getDocument,
  id,
  {
    interval = 3000, // ยิงซ้ำทุก 3 วิ
    timeout = 200000  // รอสูงสุด 20 วิ
  } = {}
) => {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const data = await getDocument(id);

      if (data?.ocr_data?.extracted_text) {
        return data; // ✅ DB พร้อม
      }
    } catch (err) {
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout: OCR data not ready');
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { processing, result, processFile, getDocument, reset } = useTyphoonOCR();

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [aspect, setAspect] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [progress, setProgress] = useState(0);
  // ✅ แก้ปัญหา Infinite Loop โดยใช้เงื่อนไขตรวจสอบผลลัพธ์เดิม
useEffect(() => {
  const fetchFullDocumentDetails = async () => {
    if (!result?.id || documentDetails?.ocr_id === result.id) return;

    setLoadingDetails(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 5 : prev));
    }, 500);

    try {
      // ✅ รอจน DB พร้อม
      const data = await waitForDocument(getDocument, result.id, {
        interval: 3000,
        timeout: 200000
      });

      clearInterval(progressInterval);
      setProgress(1000);

      const rawText = data.ocr_data.extracted_text;
      const parsed = parseOCRText(rawText);

      setDocumentDetails({
        ...parsed,
        ocr_id: result.id,
        full_raw_text: rawText
      });

    } catch (err) {
      console.error(err);
      alert('ระบบใช้เวลานานเกินไป กรุณาลองใหม่');
    } finally {
      clearInterval(progressInterval);
      setLoadingDetails(false);
      setProgress(0);
    }
  };

  fetchFullDocumentDetails();
}, [result, getDocument, documentDetails]);

  // ✅ อัปเดตฟอร์มอัตโนมัติเพียงครั้งเดียวเมื่อได้ข้อมูล
  useEffect(() => {
    if (documentDetails) {
      setFormData(prev => ({
        ...prev,
        title: documentDetails.subject || documentDetails.title || prev.title,
        from: documentDetails.from_department || documentDetails.from || prev.from,
        department: documentDetails.department || prev.department,
        documentNo: documentDetails.document_number || documentDetails.documentNo || prev.documentNo,
        date: documentDetails.document_date || documentDetails.date || prev.date,
        priority: documentDetails.priority || prev.priority
      }));
    }
  }, [documentDetails]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('รองรับเฉพาะไฟล์ PDF หรือรูปภาพเท่านั้น (JPG, PNG)');
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    setShowFileOptions(false);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      setFileType('image');
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFileType('pdf');
      setPreviewUrl(null);
      try {
        await processFile(file, {
          title: file.name,
          document_type: formData.type
        });
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
        reset();
        setShowFileOptions(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.file) return alert('กรุณาแนบไฟล์เอกสาร');

    const token = localStorage.getItem('access_token');
    const form = new FormData();
    form.append('file', formData.file);
    form.append('title', formData.title);
    form.append('document_type', formData.type);
    form.append('from_department', formData.from);
    form.append('priority', formData.priority);
    form.append('document_number', formData.documentNo || '');
    form.append('document_date', formData.date || '');

    if (result?.id) form.append('ocr_id', result.id);

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/documents/upload`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });

      if (!response.ok) throw new Error('บันทึกไม่สำเร็จ');

      alert('บันทึกเอกสารสำเร็จ');
      if (onSubmit) onSubmit();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4 text-gray-800">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">เพิ่มเอกสารใหม่</h2>
            <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลหรือใช้ระบบสแกนอัตโนมัติ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {/* ประเภทเอกสาร */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทเอกสาร</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none"
            >
              <option value="incoming">รับเข้า</option>
              <option value="outgoing">ส่งออก</option>
            </select>
          </div>

          {/* Processing State */}
          {processing && (
            <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-bold text-blue-800">กำลังใช้ AI วิเคราะห์ข้อมูลเอกสาร...</p>
            </div>
          )}
          {loadingDetails && (
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 bg-indigo-50">
              <p className="font-bold text-indigo-700 mb-3 text-center">
                ⏳ กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูลเอกสาร
                ระบบกำลังประมวลผลเอกสาร
                อาจใช้เวลาประมาณ 1–2 นาที
                กรุณาอย่าปิดหน้านี้
              </p>

              <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-center text-indigo-600 mt-2">
                {progress}% กำลังประมวลผล
              </p>
            </div>
          )}
          {/* OCR Result Card */}
          {documentDetails && !processing && (
            <div className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 text-lg">สแกนข้อมูลสำเร็จ ✨</p>
                  <p className="text-xs text-blue-600">ระบบสกัดข้อความจากเอกสารของคุณแล้ว</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 space-y-3 text-sm border border-blue-100">
                {/* 1. ส่วนราชการ (แสดงข้อความที่สกัดได้ทั้งหมด) */}
                <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-medium italic">ข้อความที่สกัดได้ (Extracted Text):</span>
                  <div className="bg-blue-50/50 p-3 rounded-lg text-gray-800 font-semibold leading-relaxed whitespace-pre-line border border-blue-100">
                    {documentDetails.full_raw_text || "ไม่พบข้อความในเอกสาร"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 2. เลขที่ */}
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500">เลขที่:</span>
                    <span className="font-bold text-gray-900">{documentDetails.documentNo || '-'}</span>
                  </div>
                  {/* 3. วันที่ */}
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500">วันที่:</span>
                    <span className="font-bold text-gray-900">{documentDetails.date || '-'}</span>
                  </div>
                </div>
                
                {/* 4. เรื่อง */}
                <div className="flex justify-between">
                  <span className="text-gray-500">เรื่อง:</span>
                  <span className="font-bold text-gray-900 text-right">{documentDetails.subject || '-'}</span>
                </div>
              </div>
            </div>
          )}


          {/* Form Inputs */}
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">หัวข้อเอกสาร / เรื่อง</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ส่วนราชการ / จาก</label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ความเร่งด่วน</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl"
              >
                <option value="ปกติ">ปกติ</option>
                <option value="ด่วน">ด่วน</option>
                <option value="ด่วนมาก">ด่วนมาก</option>
                <option value="ด่วนที่สุด">ด่วนที่สุด</option>
              </select>
            </div>
          </div>

          {/* File Upload Options */}
          {showFileOptions && !processing && (
            <div className="grid grid-cols-3 gap-4">
              <label className="cursor-pointer group">
                <input type="file" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                <div className="h-32 border-3 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center hover:bg-blue-50">
                  <Folder className="w-8 h-8 mb-2 text-blue-600" />
                  <p className="text-sm font-bold">เลือกไฟล์</p>
                </div>
              </label>
              <label className="cursor-pointer group">
                <input type="file" onChange={handleFileUpload} accept="image/*" capture="environment" className="hidden" />
                <div className="h-32 border-3 border-dashed border-purple-100 bg-purple-50/30 rounded-2xl flex flex-col items-center justify-center hover:bg-purple-50">
                  <Camera className="w-8 h-8 mb-2 text-purple-600" />
                  <p className="text-sm font-bold">ถ่ายภาพ</p>
                </div>
              </label>
              <label className="cursor-pointer group">
                <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                <div className="h-32 border-3 border-dashed border-emerald-100 bg-emerald-50/30 rounded-2xl flex flex-col items-center justify-center hover:bg-emerald-50">
                  <Image className="w-8 h-8 mb-2 text-emerald-600" />
                  <p className="text-sm font-bold">รูปภาพ</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-500">ยกเลิก</button>
          <button
            onClick={handleSubmit}
            disabled={processing || !formData.file}
            className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg ${(processing || !formData.file) ? 'bg-gray-300' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}
          >
            {processing ? 'กำลังประมวลผล...' : 'บันทึกเอกสาร'}
          </button>
        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && tempImage && (
        <Modal
          isOpen={cropModalOpen}
          onRequestClose={() => setCropModalOpen(false)}
          className="max-w-2xl mx-auto mt-24 bg-white rounded-xl p-6 outline-none z-50"
          overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50"
        >
          <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
            <Cropper
              image={tempImage}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="flex justify-end mt-6 gap-3">
            <button className="px-6 py-2 rounded-xl border-2" onClick={() => setCropModalOpen(false)}>ยกเลิก</button>
            <button
              className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold"
              onClick={async () => {
                const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels, rotation);
                const file = new File([croppedBlob], formData.file.name, { type: "image/jpeg" });
                setFormData(prev => ({ ...prev, file }));
                setPreviewUrl(URL.createObjectURL(file));
                setCropModalOpen(false);
                processFile(file, { title: file.name, document_type: formData.type });
              }}
            >
              ยืนยันและสแกน
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DocumentForm;