import React from 'react';
import { X, Camera } from 'lucide-react';

export default function CameraModal({ onClose, onCapture }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ถ่ายภาพเอกสาร
            </h2>
            <p className="text-sm text-gray-500 mt-1">วางเอกสารในกรอบให้ชัดเจน</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Camera Preview Simulation */}
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden aspect-video mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-20 h-20 text-white/30 mx-auto mb-4 animate-pulse" />
                <p className="text-white/50 text-sm">Camera Preview</p>
                <p className="text-white/30 text-xs mt-2">วางเอกสารในกรอบนี้</p>
              </div>
            </div>

            {/* Guide Frame */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="w-full h-full border-4 border-dashed border-white/50 rounded-2xl"></div>
            </div>

            {/* Corner Guides */}
            <div className="absolute top-12 left-12 w-8 h-8 border-l-4 border-t-4 border-purple-500"></div>
            <div className="absolute top-12 right-12 w-8 h-8 border-r-4 border-t-4 border-purple-500"></div>
            <div className="absolute bottom-12 left-12 w-8 h-8 border-l-4 border-b-4 border-purple-500"></div>
            <div className="absolute bottom-12 right-12 w-8 h-8 border-r-4 border-b-4 border-purple-500"></div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-blue-900 mb-2">💡 เคล็ดลับการถ่ายภาพที่ดี:</p>
            <ul className="text-xs text-blue-700 space-y-1 ml-4">
              <li>• วางเอกสารบนพื้นผิวเรียบ</li>
              <li>• ถ่ายในที่ที่มีแสงสว่างเพียงพอ</li>
              <li>• ให้เอกสารอยู่ในกรอบทั้งหมด</li>
              <li>• หลีกเลี่ยงเงา</li>
            </ul>
          </div>

          {/* Camera Controls */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              ยกเลิก
            </button>
            <button
              onClick={onCapture}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all font-bold flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              ถ่ายภาพ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}