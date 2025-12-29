import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Camera, Image, Folder } from 'lucide-react';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import getCroppedImg from '../utils/cropImage';
import { useTyphoonOCR } from '../hooks/useTyphoonOCR';

// ✅ Parse OCR extracted_text into structured fields
const parseOCRText = (extractedText, parsedFields = {}) => {
  const result = {
    department: '',
    documentNo: '',
    date: '',
    subject: '',
    from: '',
    priority: 'ปกติ'
  };

  // ✅ ถ้ามี parsed_fields จาก API ให้ใช้เลย
  if (parsedFields && Object.keys(parsedFields).length > 0) {
    console.log('📋 ใช้ parsed_fields จาก API:', parsedFields);
    
    result.documentNo = parsedFields['ที่'] || parsedFields['เลขที่'] || parsedFields['document_no'] || '';
    result.date = parsedFields['วันที่'] || parsedFields['date'] || '';
    result.from = parsedFields['ส่วนราชการ'] || parsedFields['จาก'] || parsedFields['from'] || '';
    result.subject = parsedFields['เรื่อง'] || parsedFields['subject'] || '';
    result.department = parsedFields['ส่วนราชการ'] || parsedFields['หน่วยงาน'] || parsedFields['department'] || '';
    
    // เช็ค priority
    const allText = Object.values(parsedFields).join(' ').toLowerCase();
    if (allText.includes('ด่วนที่สุด')) result.priority = 'ด่วนที่สุด';
    else if (allText.includes('ด่วนมาก')) result.priority = 'ด่วนมาก';
    else if (allText.includes('ด่วน')) result.priority = 'ด่วน';
    
    return result;
  }

  // ✅ ถ้าไม่มี parsed_fields ให้ parse จาก raw text แบบเดิม
  if (!extractedText) return result;

  const text = extractedText;

  const datePattern = /วันที่\s*[:\s]*([0-9]{1,2}[/\-][0-9]{1,2}[/\-][0-9]{2,4}|[\d/\-]+|[๐-๙]{1,2}\s*[ก-๙.]+\s*[๐-๙]{2,4})/gi;
  const dateMatch = text.match(datePattern);
  if (dateMatch) result.date = dateMatch[0].replace(/วันที่\s*[:\s]*/gi, '').trim();

  const numberPattern = /(?:เลขที่|ที่)\s*[:\s]*([A-Z0-9ก-๙๐-๙/\-.\s()]+?)(?:\n|$)/gi;
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

  // ✅ Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [aspect, setAspect] = useState(4 / 3);

  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // ✅✅✅ useEffect ที่เรียก API ทุก 2 วินาที จนกว่าจะได้ OCR data ✅✅✅
  useEffect(() => {
    let intervalId = null;
    let attempts = 0;
    const maxAttempts = 90; // 3 นาที

    const fetchOCRData = async () => {
      if (!result?.id) {
        console.log('❌ ไม่มี result.id');
        return;
      }

      if (documentDetails?.ocr_id === result.id) {
        console.log('✅ มีข้อมูลแล้ว');
        return;
      }

      console.log('🚀 เริ่มต้นเรียก API หา OCR data... ID:', result.id);

      setLoadingDetails(true);
      setProgress(0);
      setProgressMessage('🔍 กำลังวิเคราะห์เอกสาร...');

      intervalId = setInterval(async () => {
        attempts++;
        const progressPercent = Math.min((attempts / maxAttempts) * 90, 90);
        setProgress(progressPercent);

        const elapsed = attempts * 2;
        if (elapsed < 20) {
          setProgressMessage('🔍 กำลังวิเคราะห์เอกสาร...');
        } else if (elapsed < 40) {
          setProgressMessage('📝 กำลังแยกข้อความจากเอกสาร...');
        } else if (elapsed < 60) {
          setProgressMessage('🔄 กำลังประมวลผลข้อมูล...');
        } else if (elapsed < 90) {
          setProgressMessage('⏳ เกือบเสร็จแล้ว กรุณารอสักครู่...');
        } else if (elapsed < 120) {
          setProgressMessage('⌛ กำลังประมวลผลขั้นสุดท้าย...');
        } else {
          setProgressMessage('🔄 กำลังตรวจสอบข้อมูลอีกครั้ง...');
        }

        console.log(`🔄 [${elapsed}s] ลองครั้งที่ ${attempts}/${maxAttempts}...`);

        try {
          const data = await getDocument(result.id);
          console.log(`📦 [ครั้งที่ ${attempts}] Response:`, data);
          console.log(`📦 [ครั้งที่ ${attempts}] ocr_data:`, data?.ocr_data);

          // ✅ เช็คว่า ocr_data ต้องไม่เป็น null และมี text ด้วย
          const hasOCRData = data?.ocr_data !== null && 
                            data?.ocr_data?.text && 
                            data?.ocr_data?.text.length > 0;

          console.log(`📊 [ครั้งที่ ${attempts}] hasOCRData:`, hasOCRData);

          if (hasOCRData) {
            console.log('✅ ได้ข้อมูล OCR แล้ว!');
            
            // ✅ หยุด interval
            clearInterval(intervalId);
            
            setProgress(100);
            setProgressMessage('✅ ประมวลผลสำเร็จ!');

            const rawText = data.ocr_data?.text || '';
            const parsedFieldsFromAPI = data.ocr_data?.parsed_fields || {};

            console.log('📝 Raw text:', rawText);
            console.log('📋 Parsed fields:', parsedFieldsFromAPI);

            const parsed = parseOCRText(rawText, parsedFieldsFromAPI);
            console.log('✅ Parsed result:', parsed);

            setDocumentDetails({
              ...parsed,
              ocr_id: result.id,
              full_raw_text: rawText
            });

            setTimeout(() => {
              setLoadingDetails(false);
              setProgress(0);
              setProgressMessage('');
            }, 500);
          } else {
            console.log(`⏳ [ครั้งที่ ${attempts}] OCR ยังไม่เสร็จ, รอต่อ...`);
          }

          // ✅ ถ้าครบ maxAttempts แล้วยังไม่ได้
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            setLoadingDetails(false);
            setProgress(0);
            setProgressMessage('');
            
            alert(
              '⚠️ ระบบใช้เวลานานเกินไป (เกิน 3 นาที)\n\n' +
              'กรุณา:\n' +
              '1. ตรวจสอบขนาดไฟล์ (ควร < 5MB)\n' +
              '2. ตรวจสอบคุณภาพภาพ (ชัดเจน ไม่เบลอ)\n' +
              '3. ลองอัพโหลดใหม่อีกครั้ง\n' +
              '4. ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่'
            );
          }
        } catch (err) {
          console.warn(`⚠️ [ครั้งที่ ${attempts}] Error:`, err.message);
        }
      }, 2000); // ทุก 2 วินาที
    };

    fetchOCRData();

    // ✅ Cleanup - หยุด interval เมื่อ component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.id]);

  useEffect(() => {
    if (documentDetails) {
      console.log('🔄 กำลังอัพเดตฟอร์มด้วยข้อมูล OCR:', documentDetails);
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

    console.log('📁 ไฟล์ที่เลือก:', file.name);

    setFormData(prev => ({ ...prev, file, title: file.name }));
    setShowFileOptions(false);

    try {
      console.log('🚀 เริ่มอัพโหลดไฟล์...');
      await processFile(file, {
        title: file.name,
        document_type: formData.type
      });
      console.log('✅ อัพโหลดสำเร็จ');
    } catch (err) {
      console.error('❌ อัพโหลดล้มเหลว:', err);
      alert('อัพโหลดไฟล์ไม่สำเร็จ: ' + err.message);
      reset();
      setShowFileOptions(true);
    }
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📸 ถ่ายรูปแล้ว');

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    try {
      console.log('✂️ กำลัง crop ภาพ...', {
        rotation,
        flipHorizontal,
        flipVertical,
        aspect
      });

      const croppedBlob = await getCroppedImg(
        tempImage,
        croppedAreaPixels,
        rotation,
        { horizontal: flipHorizontal, vertical: flipVertical }
      );

      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // ✅ Reset crop settings
      setCropModalOpen(false);
      setTempImage(null);
      setRotation(0);
      setFlipHorizontal(false);
      setFlipVertical(false);
      setAspect(4 / 3);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      console.log('✅ Crop สำเร็จ');
      await handleFileSelect(croppedFile);
    } catch (err) {
      console.error('❌ Crop ล้มเหลว:', err);
      alert('Crop ภาพไม่สำเร็จ: ' + err.message);
      setCropModalOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ ฟังก์ชันสำหรับปุ่ม "เสร็จสิ้น" - แค่บันทึกข้อมูล
  const handleSubmit = async () => {
    if (!result?.id) {
      alert('⚠️ ไม่มีเอกสารให้บันทึก');
      return;
    }

    console.log('✅ กดปุ่มเสร็จสิ้น - บันทึกข้อมูล');

    if (onSubmit) {
      onSubmit({
        ...formData,
        ...documentDetails,
        ocr_id: result.id,
        full_raw_text: documentDetails?.full_raw_text || ''
      });
    }
  };

  // ✅ Crop Modal
  if (cropModalOpen) {
    return (
      <Modal
        isOpen={cropModalOpen}
        onRequestClose={() => {
          setCropModalOpen(false);
          setTempImage(null);
          setRotation(0);
          setFlipHorizontal(false);
          setFlipVertical(false);
          setAspect(4 / 3);
          setShowFileOptions(true);
        }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/90 z-[9999]"
      >
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
            <h3 className="text-lg font-bold text-white">ปรับแต่งภาพ</h3>
            <button
              onClick={() => {
                setCropModalOpen(false);
                setTempImage(null);
                setRotation(0);
                setFlipHorizontal(false);
                setFlipVertical(false);
                setAspect(4 / 3);
                setShowFileOptions(true);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Cropper Area */}
          <div className="relative bg-gray-900 flex-1" style={{ minHeight: '400px' }}>
            {tempImage && (
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                rotation={rotation}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                cropShape="rect"
                showGrid={true}
                objectFit="contain"
                style={{
                  containerStyle: {
                    backgroundColor: '#000'
                  },
                  cropAreaStyle: {
                    border: '3px solid #3b82f6',
                    color: 'rgba(59, 130, 246, 0.2)'
                  }
                }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="p-6 border-t bg-gray-50 space-y-6 max-h-[400px] overflow-y-auto">
            
            {/* Aspect Ratio */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">อัตราส่วน</label>
              <div className="grid grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setAspect(1 / 0.2828)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspect === 1 / 0.2828
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-400'
                  }`}
                >
                  📄 Header
                </button>

                <button
                  type="button"
                  onClick={() => setAspect(16 / 9)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspect === 16 / 9
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  16:9
                </button>

                <button
                  type="button"
                  onClick={() => setAspect(4 / 3)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspect === 4 / 3
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  4:3
                </button>

                <button
                  type="button"
                  onClick={() => setAspect(1)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspect === 1
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  1:1
                </button>

                <button
                  type="button"
                  onClick={() => setAspect(3 / 4)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspect === 3 / 4
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  3:4
                </button>

                <button
                  type="button"
                  onClick={() => setAspect(9 / 16)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspect === 9 / 16
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  9:16
                </button>
              </div>

              {aspect === 1 / 0.2828 && (
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>สำหรับครอปส่วนหัวเอกสาร (กว้างเท่ากระดาษ A4, สูง 20%)</span>
                </p>
              )}
            </div>

            {/* Zoom */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">ซูม</label>
                <span className="text-sm text-gray-600 font-mono">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Flip */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">พลิก</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFlipHorizontal(!flipHorizontal)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    flipHorizontal
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  ↔️ แนวนอน
                </button>
                <button
                  type="button"
                  onClick={() => setFlipVertical(!flipVertical)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    flipVertical
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  ↕️ แนวตั้ง
                </button>
              </div>
            </div>

            {/* Reset */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setFlipHorizontal(false);
                  setFlipVertical(false);
                  setAspect(4 / 3);
                  setCrop({ x: 0, y: 0 });
                }}
                className="w-full px-4 py-2 bg-gray-100 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
              >
                🔄 รีเซ็ตทั้งหมด
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setTempImage(null);
                  setRotation(0);
                  setFlipHorizontal(false);
                  setFlipVertical(false);
                  setAspect(4 / 3);
                  setShowFileOptions(true);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCropComplete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                ใช้ภาพนี้
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {/* Main Modal */}
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
            {showFileOptions && !processing && !formData.file && (
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setTempImage(reader.result);
                          setCropModalOpen(true);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทเอกสาร</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อเอกสาร</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">เลขที่เอกสาร</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">จาก</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ถึง</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ความสำคัญ</label>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">เรื่อง</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">หน่วยงาน</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="หน่วยงาน"
                  />
                </div>
                
                {/* ✅ ปุ่มเสร็จสิ้น */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loadingDetails}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingDetails ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>กำลังประมวลผล...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>เสร็จสิ้น</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {loadingDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
            <button
              onClick={() => {
                if (window.confirm(
                  '⚠️ การปิดหน้าต่างจะยกเลิกการประมวลผล OCR\n\n' +
                  'คุณต้องการปิดหรือไม่?'
                )) {
                  console.log('❌ ผู้ใช้ยกเลิกการประมวลผล OCR');
                  setLoadingDetails(false);
                  setProgress(0);
                  setProgressMessage('');
                  setShowFileOptions(true);
                  setFormData(prev => ({ ...prev, file: null }));
                  reset();
                }
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="ปิดและยกเลิก"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">กำลังประมวลผล OCR</h3>
              <p className="text-sm text-gray-600 mb-6 min-h-[24px]">{progressMessage || 'กำลังเตรียมการ...'}</p>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600">ความคืบหน้า</span>
                <span className="font-bold text-blue-600 tabular-nums">{progress.toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>อาจใช้เวลาประมาณ 1-3 นาที</span>
              </div>

              {progress > 0 && progress < 100 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-in fade-in mb-3">
                  <p className="text-xs text-yellow-800 flex items-center justify-center gap-2">
                    <span className="text-base">⚠️</span>
                    การปิดหน้าต่างจะยกเลิกการประมวลผล
                  </p>
                </div>
              )}

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
    </>
  );
}

export default DocumentForm;
