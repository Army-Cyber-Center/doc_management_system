import React, { useState, useEffect } from 'react';
import { Bell, FileText, Search } from 'lucide-react';

function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // const notifications = [
  //   { id: 1, text: 'เอกสารใหม่: หนังสือขออนุมัติงบประมาณ', time: '5 นาทีที่แล้ว', unread: true },
  //   { id: 2, text: 'เอกสารครบกำหนด: บันทึกข้อความการประชุม', time: '1 ชั่วโมงที่แล้ว', unread: true },
  //   { id: 3, text: 'เอกสารส่งสำเร็จ: หนังสือตอบกลับ', time: '2 ชั่วโมงที่แล้ว', unread: false },
  // ];

  // สร้างตัวอักษรย่อ (เช่น สมชาย -> ส)
  const firstChar = user?.full_name
    ? user.full_name.charAt(0)
    : '?';

  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-blue-500/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left */}
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
              <p className="text-xs text-gray-500 mt-0.5">
                Document Management System
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเอกสาร..."
                className="pl-10 pr-4 py-2.5 w-64 bg-white/50 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div> */}

            {/* <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 hover:bg-white/50 rounded-xl"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button> */}

            {/* User Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold">
                  {firstChar}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.username || 'ไม่พบชื่อผู้ใช้'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role || 'ผู้ใช้งานระบบ'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {/* {showNotifications && (
          <div className="absolute right-6 top-20 w-96 bg-white rounded-2xl shadow-2xl z-20">
            <div className="p-5 border-b">
              <h3 className="font-bold">การแจ้งเตือน</h3>
            </div>
            {notifications.map(n => (
              <div key={n.id} className="p-4 border-b text-sm">
                {n.text}
              </div>
            ))}
          </div> */}
        {/* )} */}
      </div>
    </header>
  );
}

export default Header;
