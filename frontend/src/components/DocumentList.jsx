import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  Plus,
  Filter,
  User,
  Calendar,
  Clock,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Search,
  CalendarDays
} from 'lucide-react';
import { DatePicker } from 'antd'; // ✅ Import DatePicker จาก antd
import dayjs from 'dayjs'; // ✅ Import dayjs
import 'antd/dist/reset.css'; // ✅ Import Ant Design CSS
import 'dayjs/locale/th'; // ✅ Import Thai locale

const { RangePicker } = DatePicker; // ✅ ใช้ RangePicker

// ✅ Set Thai locale
dayjs.locale('th');

function DocumentList({
  activeTab,
  setActiveTab,
  documents = [],
  loading = false,
  onDocumentClick,
  onNewDocument
}) {

  const [ocrDocuments, setOcrDocuments] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  // ✅ Statistics state
  const [stats, setStats] = useState({
    received: 0,
    approval: 0,
    sent_out: 0,
    completed: 0
  });

  // 🔍 Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // ✅ Date Range Picker - ใช้ dayjs
  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // ✅ Fetch documents เมื่อ activeTab, dateFilter, หรือ dateRange เปลี่ยน
  useEffect(() => {
    fetchAllOCRDocuments();
  }, [activeTab, dateFilter, dateRange]);

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
   * ✅ Format date to YYYY-MM-DD
   */
  const formatDate = (date) => {
    if (!date) return null;
    return dayjs(date).format('YYYY-MM-DD');
  };

  /**
   * ✅ Fetch all OCR documents with date filter
   */
  const fetchAllOCRDocuments = async () => {
    setOcrLoading(true);
    setOcrError(null);

    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.REACT_APP_API_URL;

      if (!API_URL) {
        throw new Error('API_URL is not configured. Set REACT_APP_API_URL in .env');
      }

      // ✅ สร้าง query parameters
      const params = new URLSearchParams({
        document_type: activeTab,
        page: 1,
        per_page: 100
      });

      // ✅ ถ้าเลือก custom date range
      if (dateFilter === 'custom' && dateRange && dateRange.length === 2) {
        params.append('date_filter', 'all');
        params.append('date_from', formatDate(dateRange[0]));
        params.append('date_to', formatDate(dateRange[1]));
      } else {
        params.append('date_filter', dateFilter);
      }

      const apiUrl = `${API_URL}/documents?${params.toString()}`;
      console.log(`🔍 Fetching: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      if (response.status === 401) {
        console.error('❌ Authentication failed (401)');
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Documents fetched:', data);

      const documentsList = Array.isArray(data) 
        ? data 
        : data.data || data.documents || [];

      setOcrDocuments(documentsList);
      calculateStats(documentsList);

    } catch (err) {
      console.error('❌ Error fetching documents:', err.message);
      setOcrError(err.message);
      setOcrDocuments([]);
    } finally {
      setOcrLoading(false);
    }
  };

  /**
   * ✅ Normalize status
   */
  const normalizeStatus = (status) => {
    if (!status) return 'รับเข้า';
    
    const normalized = status.toLowerCase().trim();
    
    if (normalized === 'รับแล้ว' || normalized === 'received' || normalized === 'incoming' || normalized === 'processed') {
      return 'รับเข้า';
    }
    if (normalized === 'รออนุมัติ' || normalized === 'pending approval' || normalized === 'approval pending' || normalized === 'กำลังดำเนินการ' || normalized === 'in_progress') {
      return 'รออนุมัติ';
    }
    if (normalized === 'ส่งออก' || normalized === 'sent out' || normalized === 'sent_out' || normalized === 'เอกสารส่งออก') {
      return 'ส่งออก';
    }
    if (normalized === 'เสร็จสิ้น' || normalized === 'completed' || normalized === 'done') {
      return 'เสร็จสิ้น';
    }
    
    return 'รับเข้า';
  };

  /**
   * ✅ Calculate statistics
   */
  const calculateStats = (documentsList) => {
    const newStats = {
      received: documentsList.length,
      approval: 0,
      sent_out: 0,
      completed: 0
    };

    documentsList.forEach(doc => {
      const normalizedStatus = normalizeStatus(doc.status);

      if (normalizedStatus === 'รออนุมัติ') {
        newStats.approval++;
      } 
      else if (normalizedStatus === 'ส่งออก') {
        newStats.sent_out++;
      } 
      else if (normalizedStatus === 'เสร็จสิ้น') {
        newStats.completed++;
      }
    });

    console.log('📊 Statistics:', newStats);
    setStats(newStats);
  };

  /**
   * Fetch single document
   */
  const fetchOCRDocument = async (documentId) => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.REACT_APP_API_URL;

      if (!API_URL) {
        throw new Error('API_URL is not configured');
      }

      const apiUrl = `${API_URL}/documents/${documentId}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      if (response.status === 401) {
        handleUnauthorized();
        return null;
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (err) {
      console.error('❌ Error fetching document:', err.message);
      throw err;
    }
  };

  const displayDocuments = activeTab === 'incoming' 
    ? ocrDocuments 
    : (Array.isArray(documents) ? documents : []);
  const isLoading = activeTab === 'incoming' ? ocrLoading : loading;

  // 🔍 Search filter
  const filteredDocuments = displayDocuments.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    return (
      (doc.title || doc.subject || '').toLowerCase().includes(q) ||
      (doc.from_department || doc.from || doc.department || '').toLowerCase().includes(q) ||
      (doc.document_number || '').toLowerCase().includes(q) ||
      (doc.priority || '').toLowerCase().includes(q) ||
      normalizeStatus(doc.status || '').toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatus(status);
    
    switch (normalizedStatus) {
      case 'รับเข้า':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'รออนุมัติ':
        return 'bg-gradient-to-r from-orange-400 to-amber-400 text-white';
      case 'ส่งออก':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'เสร็จสิ้น':
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'ด่วนที่สุด':
      case 'ด่วนมาก':
      case 'urgent':
      case 'high':
        return 'text-red-500';
      case 'ด่วน':
      case 'medium':
        return 'text-orange-500';
      case 'ปกติ':
      case 'normal':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleDocumentClick = async (doc) => {
    try {
      if (doc.document_id) {
        const fullDoc = await fetchOCRDocument(doc.document_id);
        onDocumentClick?.(fullDoc);
      } else {
        onDocumentClick?.(doc);
      }
    } catch (err) {
      console.error('Error handling document click:', err);
      onDocumentClick?.(doc);
    }
  };

  // ✅ Statistics Card
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-2`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-600 text-xs font-medium text-center mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  // ✅ Date Filter Label
  const getDateFilterLabel = () => {
    if (dateFilter === 'custom' && dateRange && dateRange.length === 2) {
      return `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`;
    }
    switch (dateFilter) {
      case 'today': return '📅 วันนี้';
      case 'this_week': return '📆 สัปดาห์นี้';
      case 'this_month': return '🗓️ เดือนนี้';
      case 'all': return '📋 ทั้งหมด';
      default: return '📅 วันนี้';
    }
  };

  // ✅ Handle preset filter
  const handlePresetFilter = (filter) => {
    setDateFilter(filter);
    setShowFilterMenu(false);
    
    if (filter !== 'custom') {
      setDateRange([dayjs(), dayjs()]);
    }
  };

  // ✅ Handle custom date range
  const handleCustomDateRange = () => {
    setDateFilter('custom');
    setShowFilterMenu(false);
    setShowDatePicker(true);
  };

  // ✅ Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // ✅ Apply custom date range
  const applyCustomDateRange = () => {
    setShowDatePicker(false);
  };

  // ✅ Clear custom date range
  const clearCustomDateRange = () => {
    setDateFilter('today');
    setDateRange([dayjs(), dayjs()]);
    setShowDatePicker(false);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Inbox}
          label="รับเข้า"
          value={stats.received}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Clock}
          label="รออนุมัติ"
          value={stats.approval}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          icon={Send}
          label="ส่งออก"
          value={stats.sent_out}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="เสร็จสิ้น"
          value={stats.completed}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Document List */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/5 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 gap-4 flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'incoming'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Inbox className="w-4 h-4 inline mr-2" />
              เอกสารรับเข้า
            </button>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเอกสาร..."
                className="pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-48 md:w-64"
              />
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-4 py-2.5 text-gray-700 bg-white/50 rounded-xl hover:bg-white transition-all flex items-center gap-2 border border-gray-200"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden md:inline text-sm">{getDateFilterLabel()}</span>
              </button>

              {showFilterMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowFilterMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handlePresetFilter('today')}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${dateFilter === 'today' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <span>📅</span>
                      <span>วันนี้</span>
                    </button>
                    <button
                      onClick={() => handlePresetFilter('this_week')}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${dateFilter === 'this_week' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <span>📆</span>
                      <span>สัปดาห์นี้</span>
                    </button>
                    <button
                      onClick={() => handlePresetFilter('this_month')}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${dateFilter === 'this_month' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <span>🗓️</span>
                      <span>เดือนนี้</span>
                    </button>
                    <button
                      onClick={() => handlePresetFilter('all')}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${dateFilter === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <span>📋</span>
                      <span>ทั้งหมด</span>
                    </button>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                      onClick={handleCustomDateRange}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${dateFilter === 'custom' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>กำหนดช่วงวันที่...</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onNewDocument}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              เพิ่มเอกสาร
            </button>
          </div>
        </div>

        {/* ✅ Ant Design Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  เลือกช่วงวันที่
                </h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>

              {/* ✅ Ant Design RangePicker */}
              <div className="mb-6">
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>

              {/* Summary */}
              {dateRange && dateRange.length === 2 && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-600 mb-1">ช่วงวันที่ที่เลือก:</p>
                  <p className="text-base font-bold text-blue-600">
                    {formatDate(dateRange[0])} ถึง {formatDate(dateRange[1])}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={clearCustomDateRange}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={applyCustomDateRange}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  ใช้ช่วงวันที่นี้
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {ocrError && activeTab === 'incoming' && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">⚠️ {ocrError}</p>
          </div>
        )}

        {/* Document List */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'ไม่พบเอกสารที่ตรงกับการค้นหา' : `ไม่มีเอกสาร${dateFilter === 'custom' ? 'ในช่วงวันที่นี้' : getDateFilterLabel()}`}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const title = doc.title || doc.subject || 'ไม่มีชื่อ';
              const from = doc.from_department || doc.from || doc.department || 'ไม่ระบุ';
              const date = doc.document_date || doc.date || new Date().toLocaleDateString('th-TH');
              const priority = doc.priority || 'ปกติ';
              const status = normalizeStatus(doc.status || 'รับเข้า');
              const documentId = doc.id || doc.document_id;

              return (
                <div
                  key={documentId}
                  onClick={() => handleDocumentClick(doc)}
                  className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {title}
                        </h3>

                        <span className={`text-xs font-bold whitespace-nowrap ${getPriorityColor(priority)}`}>
                          ● {priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-5 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{from}</span>
                        </span>

                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          {date}
                        </span>

                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(status)}`}>
                          {status}
                        </span>

                        {doc.dueDate && (
                          <span className="flex items-center gap-2 text-orange-600 font-medium whitespace-nowrap">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            ครบกำหนด: {doc.dueDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>

                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentList;