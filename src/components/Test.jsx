import React, { useState } from 'react';
import { Bell, FileText, Upload, Search, Calendar, User, CheckCircle, Clock, Send, Inbox, Menu, X, Plus, Filter, Folder, File, ChevronRight, Home, Download, Edit, TrendingUp, ArrowUpRight, Camera, Image } from 'lucide-react';

export default function DocManagementMockup() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadMethod, setUploadMethod] = useState(null); // 'file', 'camera', 'image'

  // Mock file system
  const fileSystem = {
    root: {
      name: 'เอกสาร',
      type: 'folder',
      children: [
        { name: 'เอกสารรับเข้า', type: 'folder', id: 'incoming' },
        { name: 'เอกสารส่งออก', type: 'folder', id: 'outgoing' },
        { name: 'เอกสารร่าง', type: 'folder', id: 'draft' },
      ]
    },
    incoming: {
      name: 'เอกสารรับเข้า',
      type: 'folder',
      children: [
        { name: 'หนังสืออนุมัติ_001.pdf', type: 'file', size: '2.4 MB', date: '19 ต.ค. 2025' },
        { name: 'บันทึกข้อความ_002.pdf', type: 'file', size: '1.8 MB', date: '18 ต.ค. 2025' },
        { name: 'แบบฟอร์ม_003.pdf', type: 'file', size: '856 KB', date: '17 ต.ค. 2025' },
      ]
    },
    outgoing: {
      name: 'เอกสารส่งออก',
      type: 'folder',
      children: [
        { name: 'หนังสือตอบกลับ_001.pdf', type: 'file', size: '1.2 MB', date: '19 ต.ค. 2025' },
        { name: 'รายงานสรุป_002.pdf', type: 'file', size: '3.1 MB', date: '18 ต.ค. 2025' },
      ]
    },
    draft: {
      name: 'เอกสารร่าง',
      type: 'folder',
      children: [
        { name: 'ร่างหนังสือ_draft.pdf', type: 'file', size: '945 KB', date: '20 ต.ค. 2025' },
      ]
    }
  };

  const incomingDocs = [
    { id: 1, title: 'หนังสือขออนุมัติงบประมาณ', from: 'กองคลัง', date: '2025-10-19', status: 'รับแล้ว', priority: 'สูง', dueDate: '2025-10-25' },
    { id: 2, title: 'บันทึกข้อความ เรื่อง การประชุม', from: 'ฝ่ายบริหาร', date: '2025-10-18', status: 'รอดำเนินการ', priority: 'กลาง', dueDate: '2025-10-22' },
    { id: 3, title: 'แบบฟอร์มขอลาพักร้อน', from: 'ฝ่ายทรัพยากรบุคคล', date: '2025-10-17', status: 'เสร็จสิ้น', priority: 'ต่ำ', dueDate: '2025-10-20' },
  ];

  const outgoingDocs = [
    { id: 4, title: 'หนังสือตอบกลับงบประมาณ', to: 'กองคลัง', date: '2025-10-19', status: 'ส่งแล้ว', priority: 'สูง' },
    { id: 5, title: 'บันทึกข้อความภายใน', to: 'ฝ่ายปฏิบัติการ', date: '2025-10-18', status: 'รอส่ง', priority: 'กลาง' },
  ];

  const notifications = [
    { id: 1, text: 'เอกสารใหม่: หนังสือขออนุมัติงบประมาณ', time: '5 นาทีที่แล้ว', unread: true },
    { id: 2, text: 'เอกสารครบกำหนด: บันทึกข้อความการประชุม', time: '1 ชั่วโมงที่แล้ว', unread: true },
    { id: 3, text: 'เอกสารส่งสำเร็จ: หนังสือตอบกลับ', time: '2 ชั่วโมงที่แล้ว', unread: false },
  ];

  const stats = [
    { label: 'เอกสารรับเข้าวันนี้', value: '8', change: '+12%', icon: Inbox, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'เอกสารส่งออกวันนี้', value: '5', change: '+8%', icon: Send, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'รอดำเนินการ', value: '12', change: '-3%', icon: Clock, gradient: 'from-orange-500 to-amber-500' },
    { label: 'เสร็จสิ้น', value: '45', change: '+15%', icon: CheckCircle, gradient: 'from-purple-500 to-pink-500' },
  ];

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

  const handleFileUpload = () => {
    setUploadMethod('choose');
  };

  const handleCameraCapture = () => {
    setShowCamera(true);
    setUploadMethod('camera');
  };

  const handleImageCapture = () => {
    // Simulate camera capture
    setTimeout(() => {
      setSelectedFile({
        name: 'ภาพถ่ายเอกสาร_' + new Date().getTime() + '.jpg',
        size: '1.8 MB',
        date: new Date().toLocaleDateString('th-TH')
      });
      setShowCamera(false);
      setIsProcessingOCR(true);
      setOcrComplete(false);
      
      setTimeout(() => {
        setExtractedData({
          title: 'หนังสือขออนุมัติโครงการพัฒนาระบบสารสนเทศ',
          from: 'ฝ่ายเทคโนโลยีสารสนเทศ',
          date: '2025-10-19',
          documentNo: 'ศธ 0201/2568',
          subject: 'ขออนุมัติดำเนินโครงการ',
          priority: 'สูง',
          keywords: ['งบประมาณ', 'ระบบสารสนเทศ', 'อนุมัติ']
        });
        setIsProcessingOCR(false);
        setOcrComplete(true);
      }, 2500);
    }, 1000);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setShowFileExplorer(false);
    setIsProcessingOCR(true);
    setOcrComplete(false);
    
    setTimeout(() => {
      setExtractedData({
        title: 'หนังสือขออนุมัติโครงการพัฒนาระบบสารสนเทศ',
        from: 'ฝ่ายเทคโนโลยีสารสนเทศ',
        date: '2025-10-19',
        documentNo: 'ศธ 0201/2568',
        subject: 'ขออนุมัติดำเนินโครงการ',
        priority: 'สูง',
        keywords: ['งบประมาณ', 'ระบบสารสนเทศ', 'อนุมัติ']
      });
      setIsProcessingOCR(false);
      setOcrComplete(true);
    }, 2500);
  };

  const currentDocs = activeTab === 'incoming' ? incomingDocs : outgoingDocs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glassmorphism */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ระบบจัดการเอกสาร
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Document Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาเอกสาร..."
                  className="pl-10 pr-4 py-2.5 w-64 bg-white/50 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 hover:bg-white/50 rounded-xl transition-all group"
              >
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/30">
                    ส
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">สมชาย ใจดี</p>
                  <p className="text-xs text-gray-500">ผู้ดูแลระบบ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Notifications */}
        {showNotifications && (
          <div className="absolute right-6 top-20 w-96 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-20 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-bold text-gray-900">การแจ้งเตือน</h3>
              <p className="text-xs text-gray-500 mt-0.5">คุณมี 2 การแจ้งเตือนใหม่</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-4 border-b border-gray-100 hover:bg-blue-50/50 transition-all cursor-pointer ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${notif.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notif.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-3xl blur opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`bg-gradient-to-r ${stat.gradient} p-3 rounded-2xl shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modern Main Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/5 overflow-hidden">
          {/* Enhanced Tabs */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('incoming')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'incoming' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Inbox className="w-4 h-4 inline mr-2" />
                เอกสารรับเข้า
              </button>
              <button
                onClick={() => setActiveTab('outgoing')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'outgoing' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Send className="w-4 h-4 inline mr-2" />
                เอกสารส่งออก
              </button>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2.5 text-gray-700 bg-white/50 rounded-xl hover:bg-white transition-all flex items-center gap-2 border border-gray-200">
                <Filter className="w-4 h-4" />
                <span className="hidden md:inline">กรอง</span>
              </button>
              <button 
                onClick={() => setShowNewDocForm(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                เพิ่มเอกสาร
              </button>
            </div>
          </div>

          {/* Enhanced Document List */}
          <div className="divide-y divide-gray-100">
            {currentDocs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => setSelectedDoc(doc)}
                className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      <span className={`text-xs font-bold ${getPriorityColor(doc.priority)}`}>
                        ● {doc.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-5 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {doc.from || doc.to}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {doc.date}
                      </span>
                      {doc.dueDate && (
                        <span className="flex items-center gap-2 text-orange-600 font-medium">
                          <Clock className="w-4 h-4" />
                          ครบกำหนด: {doc.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced New Document Form */}
        {showNewDocForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">เพิ่มเอกสารใหม่</h2>
                  <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลหรือให้ AI ช่วยดึงข้อมูลจากเอกสาร</p>
                </div>
                <button 
                  onClick={() => {
                    setShowNewDocForm(false);
                    setOcrComplete(false);
                    setExtractedData(null);
                  }}
                  className="p-2 hover:bg-white rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">ประเภทเอกสาร</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option>รับเข้า</option>
                    <option>ส่งออก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">หัวข้อเอกสาร</label>
                  
                  {!ocrComplete ? (
                    <>
                      <div className="relative mb-3">
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="เริ่มพิมพ์หรือเลือกจากรายการด้านล่าง..."
                          disabled={isProcessingOCR}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-white px-2 py-1 rounded-lg">
                          💡 พิมพ์ 2-3 ตัว
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-100">
                        <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          เทมเพลตสำเร็จรูป
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['หนังสือขออนุมัติงบประมาณ', 'บันทึกข้อความภายใน', 'แบบฟอร์มขออนุญาต', 'หนังสือส่งตัว', 'รายงานสรุปผล'].map((template, i) => (
                            <button key={i} className="px-4 py-2 bg-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white border-2 border-blue-200 hover:border-transparent rounded-xl text-sm transition-all duration-300 font-medium hover:shadow-lg">
                              {template}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-800 mb-2">✨ OCR อ่านข้อมูลสำเร็จ!</p>
                          <p className="text-lg font-bold text-gray-900 mb-3">{extractedData?.title}</p>
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">แก้ไขหัวข้อ</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">จาก/ถึง</label>
                    <input 
                      type="text" 
                      value={extractedData?.from || ''}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="หน่วยงาน/บุคคล"
                      disabled={isProcessingOCR}
                    />
                    {ocrComplete && <p className="text-xs text-green-600 mt-2 font-medium">✓ ดึงจาก OCR</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">ความสำคัญ</label>
                    <select 
                      value={extractedData?.priority || ''}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={isProcessingOCR}
                    >
                      <option>ต่ำ</option>
                      <option>กลาง</option>
                      <option>สูง</option>
                    </select>
                    {ocrComplete && <p className="text-xs text-green-600 mt-2 font-medium">✓ วิเคราะห์อัตโนมัติ</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">อัพโหลดเอกสาร</label>
                  
                  {!isProcessingOCR && !ocrComplete && !uploadMethod && (
                    <div className="space-y-4">
                      {/* Upload Options */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Choose File from Folder */}
                        <div 
                          onClick={() => setShowFileExplorer(true)}
                          className="relative border-3 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-300 group"
                        >
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                            <Folder className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 mb-1">เลือกจากโฟลเดอร์</p>
                          <p className="text-xs text-gray-600">เลือกไฟล์ PDF ที่มีอยู่</p>
                        </div>

                        {/* Take Photo */}
                        <div 
                          onClick={handleCameraCapture}
                          className="relative border-3 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 cursor-pointer transition-all duration-300 group"
                        >
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 mb-1">ถ่ายภาพเอกสาร</p>
                          <p className="text-xs text-gray-600">ใช้กล้องถ่ายรูป</p>
                        </div>

                        {/* Upload Image */}
                        <div 
                          onClick={handleFileUpload}
                          className="relative border-3 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center hover:border-green-400 hover:bg-gradient-to-br hover:from-green-100 hover:to-emerald-100 cursor-pointer transition-all duration-300 group"
                        >
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                            <Image className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 mb-1">อัพโหลดรูปภาพ</p>
                          <p className="text-xs text-gray-600">JPG, PNG ที่มีอยู่</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        <span className="text-xs text-gray-500 font-medium">หรือ</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      </div>

                      {/* Drag and Drop Area */}
                      <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-8 text-center">
                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600 mb-1">ลากไฟล์มาวางที่นี่</p>
                        <p className="text-xs text-gray-500">รองรับ PDF, JPG, PNG (สูงสุด 10MB)</p>
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl text-sm text-blue-700 font-medium mx-auto">
                        <span>🤖 OCR จะอ่านหัวข้ออัตโนมัติจากเอกสาร</span>
                      </div>
                    </div>
                  )}

                  {isProcessingOCR && (
                    <div className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <p className="text-base font-bold text-blue-900 mb-2">🤖 กำลังประมวลผล OCR...</p>
                      <p className="text-sm text-blue-600 mb-6">กำลังอ่านและวิเคราะห์เอกสาร</p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          อ่านข้อความจากภาพ
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          ระบุหัวข้อเอกสาร
                        </div>
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium animate-pulse">
                          <Clock className="w-4 h-4" />
                          ดึงข้อมูลรายละเอียด...
                        </div>
                      </div>
                    </div>
                  )}

                  {ocrComplete && extractedData && (
                    <div className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-green-800 text-base">เอกสารอัพโหลดสำเร็จ!</p>
                          <p className="text-sm text-green-600">AI วิเคราะห์ข้อมูลเสร็จสิ้น</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{selectedFile?.name || 'เอกสารขออนุมัติ.pdf'}</p>
                            <p className="text-sm text-gray-500">{selectedFile?.size || '2.4 MB'} • อัพโหลดเมื่อสักครู่</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-gray-700">📊 ข้อมูลที่ OCR ดึงได้</p>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">แม่นยำ 98%</span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">เลขที่หนังสือ:</span>
                              <span className="font-semibold text-gray-900">{extractedData.documentNo}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">วันที่:</span>
                              <span className="font-semibold text-gray-900">{extractedData.date}</span>
                            </div>
                            <div className="flex justify-between items-start py-2">
                              <span className="text-gray-600">เรื่อง:</span>
                              <span className="font-semibold text-gray-900 text-right">{extractedData.subject}</span>
                            </div>
                            <div className="pt-2">
                              <p className="text-xs text-gray-600 mb-2">คำสำคัญ:</p>
                              <div className="flex gap-2 flex-wrap">
                                {extractedData.keywords?.map((keyword, i) => (
                                  <span key={i} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg text-xs font-medium">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button className="w-full py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium border-2 border-blue-100 hover:border-blue-200">
                          เปลี่ยนไฟล์
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
                  <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    ระบบ OCR รองรับหลายรูปแบบ
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-xl p-3 text-center border-2 border-blue-100">
                      <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-900">PDF</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border-2 border-purple-100">
                      <Camera className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-900">ถ่ายรูป</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border-2 border-green-100">
                      <Image className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-900">รูปภาพ</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">อ่านหัวข้ออัตโนมัติ</p>
                        <p className="text-blue-600">ไม่ต้องพิมพ์เลย</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">ดึงเลขที่หนังสือ</p>
                        <p className="text-blue-600">จับเลขอัตโนมัติ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">วิเคราะห์ความสำคัญ</p>
                        <p className="text-blue-600">AI ประเมินอัตโนมัติ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">รองรับภาษาไทย</p>
                        <p className="text-blue-600">แม่นยำสูง</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <p className="text-sm text-blue-800 font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      ประหยัดเวลา: จาก 3-5 นาที → เหลือ 10 วินาที!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                <button 
                  onClick={() => {
                    setShowNewDocForm(false);
                    setOcrComplete(false);
                    setExtractedData(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-white transition-all font-medium text-gray-700"
                >
                  ยกเลิก
                </button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium">
                  บันทึกเอกสาร
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ถ่ายภาพเอกสาร</h2>
                  <p className="text-sm text-gray-500 mt-1">วางเอกสารในกรอบให้ชัดเจน</p>
                </div>
                <button 
                  onClick={() => {
                    setShowCamera(false);
                    setUploadMethod(null);
                  }}
                  className="p-2 hover:bg-white rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
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
                    onClick={() => {
                      setShowCamera(false);
                      setUploadMethod(null);
                    }}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    onClick={handleImageCapture}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    ถ่ายภาพ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced File Explorer */}
        {showFileExplorer && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">เลือกไฟล์จากโฟลเดอร์</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Home className="w-4 h-4" />
                    <span className="font-medium">เอกสาร</span>
                    {currentFolder !== 'root' && (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-blue-600 font-semibold">{fileSystem[currentFolder]?.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowFileExplorer(false);
                    setCurrentFolder('root');
                  }}
                  className="p-2 hover:bg-white rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50">
                {currentFolder !== 'root' && (
                  <button
                    onClick={() => setCurrentFolder('root')}
                    className="flex items-center gap-2 px-4 py-3 mb-4 text-sm text-gray-700 hover:bg-white rounded-xl transition-all font-medium border border-gray-200"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    กลับ
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fileSystem[currentFolder]?.children?.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.type === 'folder') {
                          setCurrentFolder(item.id);
                        } else {
                          handleFileSelect(item);
                        }
                      }}
                      className="group relative bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-4">
                        {item.type === 'folder' ? (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Folder className="w-7 h-7 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-7 h-7 text-gray-600" />
                          </div>
                        )}
                        
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

              <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                <button 
                  onClick={() => {
                    setShowFileExplorer(false);
                    setCurrentFolder('root');
                  }}
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
        )}

        {/* Enhanced Document Detail Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedDoc.title}</h2>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm ${getStatusColor(selectedDoc.status)}`}>
                        {selectedDoc.status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-bold bg-white ${getPriorityColor(selectedDoc.priority)}`}>
                        ● ความสำคัญ {selectedDoc.priority}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDoc(null)}
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
                      จาก/ถึง
                    </p>
                    <p className="font-bold text-gray-900 text-lg">{selectedDoc.from || selectedDoc.to}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100">
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      วันที่
                    </p>
                    <p className="font-bold text-gray-900 text-lg">{selectedDoc.date}</p>
                  </div>
                  {selectedDoc.dueDate && (
                    <div className="col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200">
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        วันครบกำหนด
                      </p>
                      <p className="font-bold text-orange-600 text-lg">{selectedDoc.dueDate}</p>
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
                        <div className={`w-3 h-3 rounded-full mt-2 ${step.active ? `bg-${step.color}-500 shadow-lg shadow-${step.color}-500/50` : 'bg-gray-300'}`}></div>
                        <div className="flex-1 pb-4 border-l-2 border-dashed border-gray-200 last:border-0 pl-6 -ml-1.5">
                          <p className={`font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.status}</p>
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
                <button className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-white transition-all font-medium text-gray-700 flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  แก้ไข
                </button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all font-medium">
                  อัพเดทสถานะ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}