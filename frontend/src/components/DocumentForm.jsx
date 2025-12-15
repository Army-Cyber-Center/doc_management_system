import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, FileText, Camera, Image, Folder, Upload } from 'lucide-react';
import { useOCR } from '../hooks';

function DocumentForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'incoming',
    title: '',
    from: '',
    to: '',
    priority: 'กลาง',
    department: '',
    documentNo: '',
    date: '',
    subject: '',
    file: null
  });
  const [showFileOptions, setShowFileOptions] = useState(true);

  // Use OCR Hook
  const { processing, progress, result, processFile, reset } = useOCR();

  useEffect(() => {
    if (result) {
      // อัพเดทฟอร์มด้วยข้อมูล OCR
      setFormData(prev => ({
        ...prev,
        title: result.title || result.subject,
        from: result.from || result.department,
        department: result.department,
        documentNo: result.documentNo,
        date: result.date,
        subject: result.subject,
        priority: result.priority,
      }));
    }
  }, [result]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setShowFileOptions(false);
      
      try {
        await processFile(file);
      } catch (error) {
        console.error('OCR Error:', error);
        alert('เกิดข้อผิดพลาดในการประมวลผล OCR กรุณาลองใหม่อีกครั้ง');
        setShowFileOptions(true);
        reset();
      }
    }
  };

  const handleSubmit = () => {
    onSubmit({ ...formData, extractedData: result });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              เพิ่มเอกสารใหม่
            </h2>
            <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลหรือให้ AI ช่วยดึงข้อมูลจากเอกสาร</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">ประเภทเอกสาร</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="incoming">รับเข้า</option>
              <option value="outgoing">ส่งออก</option>
            </select>
          </div>

          {/* แสดงข้อมูล OCR ที่สแกนได้ */}
          {result && (
            <div className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-800">✨ OCR สแกนสำเร็จ!</p>
                  <p className="text-sm text-green-600">ข้อมูลจากเอกสาร</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 space-y-3">
                {result.department && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600 font-medium">1. ส่วนราชการ:</span>
                    <span className="font-bold text-gray-900">{result.department}</span>
                  </div>
                )}
                {result.documentNo && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600 font-medium">2. ที่:</span>
                    <span className="font-bold text-gray-900">{result.documentNo}</span>
                  </div>
                )}
                {result.date && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600 font-medium">3. วันที่:</span>
                    <span className="font-bold text-gray-900">{result.date}</span>
                  </div>
                )}
                {result.subject && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 font-medium">4. เรื่อง:</span>
                    <span className="font-bold text-gray-900 text-right">{result.subject}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ฟอร์มกรอกข้อมูล */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">หัวข้อเอกสาร / เรื่อง</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="พิมพ์หัวข้อเอกสาร..."
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {result && <p className="text-xs text-green-600 mt-2 font-medium">✓ ดึงจาก OCR</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">ส่วนราชการ / จาก</label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                placeholder="หน่วยงาน/บุคคล"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {result && <p className="text-xs text-green-600 mt-2 font-medium">✓ ดึงจาก OCR</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">ความสำคัญ</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option>ต่ำ</option>
                <option>กลาง</option>
                <option>สูง</option>
              </select>
              {result && <p className="text-xs text-green-600 mt-2 font-medium">✓ วิเคราะห์อัตโนมัติ</p>}
            </div>
          </div>

          {/* อัพโหลดไฟล์ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">อัพโหลดเอกสาร</label>
            
            {showFileOptions && !processing && !result && (
              <div className="grid grid-cols-3 gap-4">
                <label className="cursor-pointer">
                  <input type="file" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                  <div className="border-3 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 hover:border-blue-400 transition-all text-center">
                    <Folder className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-bold text-gray-900">เลือกไฟล์</p>
                    <p className="text-xs text-gray-600 mt-1">PDF, JPG, PNG</p>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input type="file" onChange={handleFileUpload} accept="image/*" capture="environment" className="hidden" />
                  <div className="border-3 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:border-purple-400 transition-all text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-bold text-gray-900">ถ่ายภาพ</p>
                    <p className="text-xs text-gray-600 mt-1">สแกน OCR</p>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                  <div className="border-3 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 hover:border-green-400 transition-all text-center">
                    <Image className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-bold text-gray-900">รูปภาพ</p>
                    <p className="text-xs text-gray-600 mt-1">JPG, PNG</p>
                  </div>
                </label>
              </div>
            )}

            {processing && (
              <div className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-base font-bold text-blue-900 mb-2">🤖 กำลังสแกนเอกสาร...</p>
                <p className="text-sm text-blue-600 mb-4">กำลังอ่านข้อความจากรูปภาพ</p>
                <div className="max-w-md mx-auto bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${progress}%`}}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{progress}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-white transition-all font-medium text-gray-700"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSubmit}
            disabled={processing}
            className={`flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {processing ? 'กำลังประมวลผล...' : 'บันทึกเอกสาร'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentForm;
