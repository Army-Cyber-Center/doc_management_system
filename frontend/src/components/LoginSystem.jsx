import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // ✅ เพิ่ม

export default function LoginSystem() {
  // ✅ ใช้ useAuth
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    id_army: '',
    role: 'staff'
  });

  const API_URL = process.env.REACT_APP_API_URL;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);

      // ✅ แก้ไข: ใช้ API_URL โดยตรง (มี /api/v1 อยู่แล้ว)
      const tokenResponse = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.detail || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      const token = tokenData.access_token;

      // ✅ Fetch user data
      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let userData = null;
      if (userResponse.ok) {
        userData = await userResponse.json();
      }

      setMessage({ type: 'success', text: 'เข้าสู่ระบบสำเร็จ!' });

      // ✅ ใช้ login จาก AuthContext
      login(token, userData);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage(null);

    // ✅ Validation
    if (!formData.username || !formData.password || !formData.id_army) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setMessage({ type: 'error', text: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' });
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
      setLoading(false);
      return;
    }

    try {
      // ✅ แก้ไข: ใช้ API_URL โดยตรง
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          id_army: formData.id_army,
          role: formData.role || 'user',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'สมัครสมาชิกไม่สำเร็จ');
      }

      setMessage({
        type: 'success',
        text: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ',
      });

      // reset form
      setFormData({
        username: '',
        password: '',
        id_army: '',
        role: 'staff',
      });

      setIsLogin(true);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'เชื่อมต่อ Backend ไม่ได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-6xl flex bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">ระบบจัดการเอกสาร</h1>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed">
              ระบบจัดการเอกสารอัจฉริยะ พร้อม OCR และการมอบหมายงานอัตโนมัติ
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">OCR อัตโนมัติ</h3>
                <p className="text-blue-100 text-sm">อ่านและดึงข้อมูลจากเอกสารอัตโนมัติด้วย AI</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">มอบหมายงานง่าย</h3>
                <p className="text-blue-100 text-sm">Workflow ที่ชัดเจน ติดตามงานได้แบบ Real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">ปลอดภัยสูงสุด</h3>
                <p className="text-blue-100 text-sm">เข้ารหัสข้อมูล และระบบสิทธิ์แบบ Role-Based</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setMessage(null);
                }}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setMessage(null);
                }}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                สมัครสมาชิก
              </button>
            </div>

            {/* Alert Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : message.type === 'error'
                  ? 'bg-red-50 border-2 border-red-200'
                  : 'bg-blue-50 border-2 border-blue-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${message.type === 'error' ? 'text-red-600' : 'text-blue-600'}`} />
                )}
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : message.type === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

              {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อผู้ใช้</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="ชื่อผู้ใช้"
                    
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-gray-600">จำฉันไว้</span>
                  </label>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">ลืมรหัสผ่าน?</button>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : (
                    'เข้าสู่ระบบ'
                  )}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อผู้ใช้</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="ชื่อผู้ใช้"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">เลขประจำตัวทหาร (ID ARMY)</label>
                  <input
                    type="text"
                    name="id_army"
                    value={formData.id_army}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl"
                    placeholder="เช่น 56852"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pr-12 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      กำลังสมัครสมาชิก...
                    </span>
                  ) : (
                    'สมัครสมาชิก'
                  )}
                </button>
              </form>

            )}
          </div>
        </div>
      </div>
    </div>
  );
}