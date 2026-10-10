import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function TrainerRoute({ children }) {
  const { currentUser, login, logout, registerUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý đăng nhập trực tiếp tại cổng Trainer
  const handleTrainerLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = login(username, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error);
    } else if (res.user.role !== 'TRAINER' && res.user.role !== 'MANAGER' && res.user.role !== 'ADMIN') {
      setErrorMsg(`Tài khoản "${res.user.full_name}" không có quyền Huấn luyện viên (Chỉ có quyền ${res.user.role_name}). Vui lòng dùng tài khoản Trainer!`);
    }
  };

  // Nút hỗ trợ đăng nhập nhanh tài khoản Trainer cho buổi Demo/Thuyết trình
  const handleQuickTrainerLogin = () => {
    setErrorMsg('');
    setUsername('trainer_truong');
    setPassword('123');
    login('trainer_truong', '123');
  };

  // Nút đăng nhập / đăng ký nhanh Google với vai trò Trainer
  const handleQuickGoogleTrainer = () => {
    setErrorMsg('');
    const email = 'trainer.google@gmail.com';
    registerUser({
      email,
      username: 'trainer_google',
      full_name: 'Huấn luyện viên Google',
      phone: '0901234567',
      role: 'TRAINER',
      password: '123'
    });
    login('trainer_google', '123');
  };

  // 1. Trường hợp CHƯA ĐĂNG NHẬP: Hiển thị form đăng nhập bảo mật của Cổng Huấn Luyện
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'radial-gradient(circle at top, #131B2A 0%, #0A0A0A 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: '#0E131F',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '12px',
          padding: '40px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95)',
          color: '#FFFFFF'
        }}>
          {/* Logo & Tiêu đề */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3B82F6',
              marginBottom: '16px',
              fontSize: '28px'
            }}>
              🏇
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase' }}>
              HEAD TRAINER WORKSPACE
            </div>
            <h2 style={{ fontFamily: 'var(--display, serif)', fontSize: '26px', margin: '6px 0 8px', color: '#FFFFFF' }}>
              Cổng Huấn Luyện Viên
            </h2>
            <p style={{ fontSize: '13px', color: '#9DA6A0', margin: 0, lineHeight: 1.5 }}>
              Khu vực nghiệp vụ dành riêng cho Huấn luyện viên Trưởng. Vui lòng xác thực tài khoản để truy cập.
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: '6px',
              color: '#FF8885',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form đăng nhập */}
          <form onSubmit={handleTrainerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#E8E3D7', marginBottom: '6px', fontWeight: 500 }}>
                Tài khoản HLV hoặc Email
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: trainer_truong hoặc trainer@matruong.vn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#070A12',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#E8E3D7', marginBottom: '6px', fontWeight: 500 }}>
                Mật khẩu (Mặc định: 123)
              </label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#070A12',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: '#3B82F6',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
                marginTop: '6px'
              }}
            >
              {loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP VÀO KHU HUẤN LUYỆN'}
            </button>
          </form>

          {/* Phím tắt Demo cho giảng viên & hội đồng thẩm định */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(232, 227, 215, 0.1)' }}>
            <div style={{ fontSize: '12px', color: '#60A5FA', textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
              💡 TIỆN ÍCH DÀNH CHO DEMO & ĐÁNH GIÁ:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleQuickTrainerLogin}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93C5FD',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>⚡</span> Vào nhanh tài khoản HLV Trưởng (trainer_truong)
              </button>

              <button
                type="button"
                onClick={handleQuickGoogleTrainer}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#111827',
                  border: '1px solid rgba(232, 227, 215, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Đăng nhập bằng Google với quyền HLV
              </button>
            </div>
          </div>

          {/* Về trang chủ */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/" style={{ fontSize: '13px', color: '#9DA6A0', textDecoration: 'none' }}>
              ← Quay lại trang chủ Mã Trường
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trường hợp ĐÃ ĐĂNG NHẬP nhưng KHÔNG CÓ QUYỀN TRAINER (Và không phải MANAGER/ADMIN)
  const isTrainer = currentUser.role === 'TRAINER' || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';

  if (!isTrainer) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: '#0A0A0A'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: '#12110F',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '40px 32px',
          textAlign: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: '16px'
          }}>
            🚫
          </div>
          <h2 style={{ fontSize: '22px', margin: '0 0 10px', color: '#EF4444' }}>
            Truy Cập Bị Từ Chối (403)
          </h2>
          <p style={{ fontSize: '14px', color: '#C8C4B7', lineHeight: 1.6, margin: '0 0 20px' }}>
            Tài khoản hiện tại của bạn là <b>{currentUser.full_name}</b> mang vai trò <span style={{ color: '#F59E0B', fontWeight: 600 }}>{currentUser.role_name}</span>.
            Trang này chỉ dành riêng cho <b>Huấn luyện viên Trưởng (Head Trainer)</b> để lập giáo án, theo dõi nhịp tim/vận tốc và chấm phong độ chiến mã.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleQuickTrainerLogin}
              style={{
                padding: '12px',
                background: '#3B82F6',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Chuyển sang tài khoản HLV Trưởng (trainer_truong)
            </button>
            <button
              onClick={logout}
              style={{
                padding: '10px',
                background: 'rgba(232, 227, 215, 0.1)',
                border: '1px solid rgba(232, 227, 215, 0.2)',
                borderRadius: '6px',
                color: '#E8E3D7',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Đăng xuất tài khoản hiện tại
            </button>
            <Link
              to="/"
              style={{
                marginTop: '10px',
                fontSize: '13px',
                color: '#9DA6A0',
                textDecoration: 'none'
              }}
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Trường hợp ĐÃ XÁC THỰC LÀ TRAINER: Hiển thị giao diện bên trong
  return children;
}
