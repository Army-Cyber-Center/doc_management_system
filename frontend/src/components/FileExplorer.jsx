import React, { useState } from 'react';
import { X, Home, ChevronRight, Folder, FileText } from 'lucide-react';

export default function FileExplorer({ fileSystem, onClose, onFileSelect }) {
  const [currentFolder, setCurrentFolder] = useState('root');

  const handleFolderClick = (folderId) => {
    setCurrentFolder(folderId);
  };

  const handleFileClick = (file) => {
    onFileSelect(file);
  };

  const handleBack = () => {
    setCurrentFolder('root');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              เลือกไฟล์จากโฟลเดอร์
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <Home className="w-4 h-4" />
              <span className="font-medium">เอกสาร</span>
              {currentFolder !== 'root' && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-blue-600 font-semibold">
                    {fileSystem[currentFolder]?.name}
                  </span>
                </>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50">
          {currentFolder !== 'root' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-3 mb-4 text-sm text-gray-700 hover:bg-white rounded-xl transition-all font-medium border border-gray-200"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              กลับ
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fileSystem[currentFolder]?.children?.map((item, idx) => (
              <div
                key={item.id || item.name || idx}
                onClick={() => {
                  if (item.type === 'folder') {
                    handleFolderClick(item.id);
                  } else {
                    handleFileClick(item);
                  }
                }}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  {item.type === 'folder' ? (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Folder className="w-7 h-7 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7 text-gray-600" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {item.name}
                    </p>
                    {item.type === 'file' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.size} • {item.date}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  {item.type === 'folder' && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {fileSystem[currentFolder]?.children?.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Folder className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">โฟลเดอร์ว่างเปล่า</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium"
          >
            ปิด
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            💡 คลิกที่โฟลเดอร์เพื่อเปิด หรือคลิกที่ไฟล์เพื่อเลือก
          </p>
        </div>
      </div>
    </div>
  );
}