import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý đăng nhập trực tiếp tại cổng Admin
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = login(username, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error);
    } else if (res.user.role !== 'MANAGER' && res.user.role !== 'ADMIN') {
      setErrorMsg(`Tài khoản "${res.user.full_name}" không có quyền Quản trị viên (Chỉ có quyền ${res.user.role_name}). Vui lòng dùng tài khoản Admin!`);
    }
  };

  // Nút hỗ trợ đăng nhập nhanh tài khoản Admin cho buổi Demo/Thuyết trình
  const handleQuickAdminLogin = () => {
    setErrorMsg('');
    setUsername('admin');
    setPassword('123');
    login('admin', '123');
  };

  // 1. Trường hợp CHƯA ĐĂNG NHẬP: Hiển thị form đăng nhập bảo mật của Cổng Quản trị
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'radial-gradient(circle at top, #1A1713 0%, #0A0A0A 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: '#11100E',
          border: '1px solid rgba(201, 162, 39, 0.4)',
          borderRadius: '12px',
          padding: '40px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95)',
          color: '#FFFFFF'
        }}>
          {/* Logo & Tiêu đề */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              padding: '14px',
              borderRadius: '50%',
              background: 'rgba(201, 162, 39, 0.1)',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '28px' }}>🛡️</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--display, serif)',
              fontSize: '24px',
              color: '#FFFFFF',
              marginBottom: '6px',
              letterSpacing: '0.04em'
            }}>
              CỔNG QUẢN TRỊ VIÊN
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--brass, #C9A227)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              CLUB MANAGER & SYSTEM ADMIN
            </div>
            <p style={{ fontSize: '13.5px', color: '#9DA6A0', marginTop: '10px' }}>
              Khu vực bảo mật yêu cầu xác thực tài khoản thuộc <b>Ban Quản lý Câu lạc bộ</b> để truy cập.
            </p>
          </div>

          {/* Thông báo lỗi */}
          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '18px',
              background: 'rgba(217, 83, 79, 0.18)',
              border: '1px solid #D9534F',
              color: '#FF8885'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form đăng nhập */}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#E8E3D7', marginBottom: '6px', fontWeight: 600 }}>
                Tên đăng nhập / Email Admin
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập 'admin' hoặc 'admin_quan'"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.2)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#E8E3D7', marginBottom: '6px', fontWeight: 600 }}>
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu: 123"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.2)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
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
                background: 'var(--brass, #C9A227)',
                color: '#14100A',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                transition: 'opacity 0.2s ease'
              }}
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP VÀO TRANG QUẢN TRỊ'}
            </button>
          </form>

          {/* Hỗ trợ nhanh cho Demo Thuyết trình */}
          <div style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(232, 227, 215, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#9DA6A0', marginBottom: '10px' }}>
              💡 Tài khoản Admin mặc định: <b>admin</b> | Mật khẩu: <b>123</b>
            </div>
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(201, 162, 39, 0.12)',
                border: '1px dashed var(--brass, #C9A227)',
                borderRadius: '6px',
                color: 'var(--brass, #C9A227)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚡ Đăng nhập nhanh bằng tài khoản Quản trị viên (Demo)
            </button>
            <div style={{ marginTop: '16px' }}>
              <Link to="/" style={{ color: '#9DA6A0', fontSize: '13px', textDecoration: 'none' }}>
                ← Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trường hợp ĐÃ ĐĂNG NHẬP nhưng KHÔNG CÓ QUYỀN ADMIN (Access Denied 403)
  if (!isAdmin) {
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
          maxWidth: '520px',
          background: '#151311',
          border: '1px solid rgba(217, 83, 79, 0.4)',
          borderRadius: '12px',
          padding: '40px 32px',
          textAlign: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
          <h2 style={{ fontFamily: 'var(--display, serif)', fontSize: '24px', color: '#FF7675', marginBottom: '12px' }}>
            403 - TỪ CHỐI TRUY CẬP
          </h2>
          <p style={{ fontSize: '14.5px', color: '#C8C4B7', lineHeight: 1.6, marginBottom: '20px' }}>
            Tài khoản hiện tại của bạn là <b>{currentUser.full_name}</b> với vai trò{' '}
            <span style={{ color: 'var(--brass, #C9A227)', fontWeight: 600 }}>{currentUser.role_name}</span>.
            <br />
            Chỉ những tài khoản thuộc <b>Ban Quản lý Câu lạc bộ (Club Manager / Admin)</b> mới có quyền truy cập khu vực này.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={logout}
              style={{
                padding: '11px 20px',
                background: '#D9534F',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Đăng xuất & Đổi tài khoản Admin
            </button>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '11px 20px',
                background: 'rgba(232, 227, 215, 0.1)',
                border: '1px solid rgba(232, 227, 215, 0.2)',
                borderRadius: '6px',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Đã đăng nhập và đúng quyền Admin -> Cho phép truy cập Cổng Quản trị!
  return children;
}
