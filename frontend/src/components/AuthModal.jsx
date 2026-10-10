import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, registerUser, usersList } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notification, setNotification] = useState('');
  const [isError, setIsError] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('trainer');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Google Modal State & Fields
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('huanluyen.vien@gmail.com');
  const [googleName, setGoogleName] = useState('Nguyễn Văn Tuấn');
  const [googlePhone, setGooglePhone] = useState('0912888999');
  const [googleRole, setGoogleRole] = useState('TRAINER');

  if (!isOpen) return null;

  const handleOpenGoogleAuth = () => {
    setIsError(false);
    setNotification('');
    setShowGoogleDialog(true);
  };

  const handleConfirmGoogleRegister = (e) => {
    e.preventDefault();
    if (!googleEmail?.trim() || !googleName?.trim()) {
      setIsError(true);
      setNotification('Vui lòng điền đủ thông tin tài khoản Google!');
      return;
    }

    const cleanEmail = googleEmail.trim().toLowerCase();
    const existing = usersList?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (existing) {
      const res = login(existing.username, existing.password || '123');
      if (res.success) {
        setNotification(`Đăng nhập Google thành công! Chào mừng ${existing.full_name} (${existing.role_name}).`);
      } else {
        setNotification(`Chào mừng ${existing.full_name}! Đã kết nối qua Google.`);
      }
    } else {
      const roleMap = {
        'TRAINER': 'Huấn luyện viên Trưởng',
        'OWNER': 'Chủ sở hữu Ngựa',
        'VET': 'Bác sĩ Thú y',
        'GROOM': 'Nhân viên Chăm sóc',
        'MANAGER': 'Quản lý Câu lạc bộ'
      };
      const createdUser = registerUser({
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        full_name: googleName.trim(),
        phone: googlePhone.trim() || '0901234567',
        role: googleRole.toUpperCase(),
        role_name: roleMap[googleRole.toUpperCase()] || 'Huấn luyện viên Trưởng',
        password: '123'
      });
      login(createdUser.username, '123');
      setNotification(`Đăng ký Google thành công! Chào mừng ${createdUser.full_name} với vai trò ${createdUser.role_name}.`);
    }

    setShowGoogleDialog(false);
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1400);
  };

  const handleQuickGoogleSelect = (preset) => {
    setGoogleEmail(preset.email);
    setGoogleName(preset.name);
    setGooglePhone(preset.phone);
    setGoogleRole(preset.role);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsError(false);
    const res = login(loginEmail, loginPassword);
    if (!res.success) {
      setIsError(true);
      setNotification(res.error);
      return;
    }
    setNotification(`Đăng nhập thành công! Chào mừng ${res.user.full_name} (${res.user.role_name}).`);
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1200);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setIsError(false);
    if (regPassword !== regConfirm) {
      setIsError(true);
      setNotification('Mật khẩu và xác nhận mật khẩu không khớp!');
      return;
    }
    registerUser({
      username: regEmail.split('@')[0],
      email: regEmail,
      full_name: regName,
      phone: regPhone || '0901234567',
      role: regRole.toUpperCase(),
      password: regPassword
    });
    login(regEmail.split('@')[0], regPassword);
    setNotification(`Chúc mừng ${regName}! Đăng ký thành công. Đang chuyển vào hệ thống...`);
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="auth-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="auth-modal-content"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#080808',
          border: '1px solid rgba(201, 162, 39, 0.35)',
          borderRadius: '8px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#9DA6A0',
            fontSize: '24px',
            cursor: 'pointer',
            lineHeight: 1
          }}
          aria-label="Đóng"
        >
          ×
        </button>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '22px' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '24px', color: '#FFFFFF', letterSpacing: '.02em', lineHeight: 1 }}>MÃ TRƯỜNG</div>
            <div style={{ fontSize: '10px', letterSpacing: '.16em', color: 'var(--brass)', marginTop: '2px' }}>RACEHORSE SYSTEM</div>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(232, 227, 215, 0.14)', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setNotification(''); }}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid var(--brass)' : '2px solid transparent',
              color: activeTab === 'login' ? 'var(--brass)' : '#9DA6A0',
              fontFamily: 'var(--body)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setNotification(''); }}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid var(--brass)' : '2px solid transparent',
              color: activeTab === 'register' ? 'var(--brass)' : '#9DA6A0',
              fontFamily: 'var(--body)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng ký
          </button>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '16px',
            background: isError ? 'rgba(217, 83, 79, 0.2)' : 'rgba(94, 156, 106, 0.15)',
            border: isError ? '1px solid #D9534F' : '1px solid var(--ok)',
            color: isError ? '#FF8885' : '#9cd5a5',
            textAlign: 'center'
          }}>
            {notification}
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleOpenGoogleAuth}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#111111',
            border: '1px solid rgba(232, 227, 215, 0.25)',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontFamily: 'var(--body)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brass)';
            e.currentTarget.style.background = '#181818';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(232, 227, 215, 0.25)';
            e.currentTarget.style.background = '#111111';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          {activeTab === 'login' ? 'Tiếp tục bằng tài khoản Google (Gmail)' : 'Đăng ký nhanh bằng Google (Chọn vai trò)'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: '#9DA6A0',
          fontSize: '12px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(232, 227, 215, 0.14)' }} />
          <span>hoặc với email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(232, 227, 215, 0.14)' }} />
        </div>

        {/* LOGIN FORM */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Email hoặc Tên đăng nhập</label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com hoặc username"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Mật khẩu</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#9DA6A0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--brass)' }} /> Ghi nhớ
              </label>
              <span 
                onClick={() => alert('Vui lòng liên hệ quản trị viên hoặc sử dụng Google Gmail để khôi phục tài khoản.')} 
                style={{ color: 'var(--brass)', cursor: 'pointer' }}
              >
                Quên mật khẩu?
              </span>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                background: 'var(--brass)',
                border: 'none',
                borderRadius: '4px',
                color: '#14100A',
                fontFamily: 'var(--body)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                transition: 'background 0.2s ease'
              }}
            >
              ĐĂNG NHẬP VÀO HỆ THỐNG
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13.5px', color: '#9DA6A0' }}>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setNotification(''); }}
                style={{ color: 'var(--brass)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Họ và tên</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Địa chỉ Gmail / Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="vidu@gmail.com"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Vai trò trong hệ thống</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="trainer">Huấn luyện viên Trưởng (Trainer)</option>
                <option value="owner">Chủ sở hữu ngựa (Owner)</option>
                <option value="vet">Bác sĩ thú y (Veterinarian)</option>
                <option value="groom">Nhân viên chăm sóc (Groom)</option>
                <option value="manager">Ban Quản lý Câu lạc bộ (Manager)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Số điện thoại liên hệ</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Mật khẩu</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#E8E3D7' }}>Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                style={{
                  padding: '11px 14px',
                  background: '#000000',
                  border: '1px solid rgba(232, 227, 215, 0.16)',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--body)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                background: 'var(--brass)',
                border: 'none',
                borderRadius: '4px',
                color: '#14100A',
                fontFamily: 'var(--body)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                transition: 'background 0.2s ease'
              }}
            >
              TẠO TÀI KHOẢN MỚI
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13.5px', color: '#9DA6A0' }}>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setNotification(''); }}
                style={{ color: 'var(--brass)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================== POPUP ĐĂNG KÝ BẰNG GOOGLE (CHỌN VAI TRÒ) ===================== */}
      {showGoogleDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowGoogleDialog(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#141210',
              border: '1px solid rgba(201, 162, 39, 0.5)',
              borderRadius: '12px',
              padding: '32px 28px',
              color: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(0,0,0,0.95)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Google */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF', fontWeight: 700 }}>
                  Đăng Ký Tài Khoản Google
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9DA6A0' }}>
                  Xác thực danh tính & Chọn vai trò nghiệp vụ của bạn
                </p>
              </div>
            </div>

            {/* Quick Demo Preset buttons */}
            <div style={{ background: '#0B0A09', border: '1px solid rgba(232, 227, 215, 0.1)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--brass, #C9A227)', fontWeight: 600, marginBottom: '6px' }}>
                ⚡ TÀI KHOẢN GOOGLE MẪU (BẤM ĐỂ CHỌN NHANH):
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSelect({ email: 'hlv.hung@gmail.com', name: 'HLV Trần Văn Hùng', phone: '0901234567', role: 'TRAINER' })}
                  style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', color: '#93C5FD', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🏇 HLV (Trainer)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSelect({ email: 'chu.thanh@gmail.com', name: 'Chủ ngựa Phạm Tiến Thành', phone: '0904567890', role: 'OWNER' })}
                  style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', color: '#C4B5FD', borderRadius: '4px', cursor: 'pointer' }}
                >
                  👑 Chủ sở hữu (Owner)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSelect({ email: 'bacsi.an@gmail.com', name: 'Bác sĩ Thú y Nguyễn An', phone: '0902345678', role: 'VET' })}
                  style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#6EE7B7', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🩺 Bác sĩ Thú y (Vet)
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmGoogleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={{ fontSize: '12.5px', color: '#C8C4B7', display: 'block', marginBottom: '4px' }}>Địa chỉ Gmail của bạn</label>
                <input
                  type="email"
                  required
                  placeholder="vidu@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: '#C8C4B7', display: 'block', marginBottom: '4px' }}>Họ và tên hiển thị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Tuấn"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: '#C8C4B7', display: 'block', marginBottom: '4px' }}>Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={googlePhone}
                  onChange={(e) => setGooglePhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              {/* VAI TRÒ CHỌN KHI ĐĂNG KÝ GOOGLE */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--brass, #C9A227)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  🌟 LỰA CHỌN VAI TRÒ TRONG HỆ THỐNG (BẮT BUỘC):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'TRAINER', title: '🏇 Huấn luyện viên Trưởng (Trainer)', desc: 'Lập giáo án tập luyện, theo dõi nhịp tim/vận tốc & chấm phong độ', color: '#3B82F6' },
                    { id: 'OWNER', title: '👑 Chủ sở hữu Ngựa (Horse Owner)', desc: 'Xem hồ sơ phả hệ, thể lực chiến mã và lịch sử thành tích thi đấu', color: '#8B5CF6' },
                    { id: 'VET', title: '🩺 Bác sĩ Thú y (Veterinarian)', desc: 'Quản lý y tế, chẩn đoán chấn thương & ra lệnh cấm tập khẩn cấp', color: '#10B981' },
                    { id: 'GROOM', title: '🌾 Nhân viên Chăm sóc (Groom)', desc: 'Theo dõi chuồng trại, khẩu phần ăn & xác nhận nhiệm vụ hằng ngày', color: '#F59E0B' },
                    { id: 'MANAGER', title: '🏛️ Quản lý Câu lạc bộ (Manager)', desc: 'Quản lý nhân sự, danh mục chiến mã và kiểm soát toàn bộ hệ thống', color: '#EF4444' }
                  ].map((roleItem) => {
                    const isSelected = googleRole === roleItem.id;
                    return (
                      <div
                        key={roleItem.id}
                        onClick={() => setGoogleRole(roleItem.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: isSelected ? `2px solid ${roleItem.color}` : '1px solid rgba(232, 227, 215, 0.15)',
                          background: isSelected ? `${roleItem.color}15` : '#0B0A09',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="googleRole"
                          checked={isSelected}
                          onChange={() => setGoogleRole(roleItem.id)}
                          style={{ cursor: 'pointer', accentColor: roleItem.color }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: isSelected ? '#FFFFFF' : '#E8E3D7' }}>
                            {roleItem.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#9DA6A0', marginTop: '2px' }}>
                            {roleItem.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleDialog(false)}
                  style={{ flex: 1, padding: '11px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.6,
                    padding: '11px',
                    background: 'var(--brass, #C9A227)',
                    border: 'none',
                    color: '#14100A',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>✓</span> Hoàn tất đăng ký với Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
