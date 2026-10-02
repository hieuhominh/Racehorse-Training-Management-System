import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notification, setNotification] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('owner');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  if (!isOpen) return null;

  const handleGoogleAuth = () => {
    const action = activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký';
    setNotification(`Đang kết nối Google... ${action} bằng tài khoản Gmail thành công!`);
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1500);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setNotification(`Đăng nhập thành công với tài khoản ${loginEmail}! Chào mừng bạn trở lại.`);
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1200);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      alert('Mật khẩu và xác nhận mật khẩu không khớp!');
      return;
    }
    setNotification(`Chúc mừng ${regName}! Đăng ký tài khoản thành công. Đang tự động đăng nhập...`);
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
            background: 'rgba(94, 156, 106, 0.15)',
            border: '1px solid var(--ok)',
            color: '#9cd5a5',
            textAlign: 'center'
          }}>
            {notification}
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#111111',
            border: '1px solid rgba(232, 227, 215, 0.2)',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontFamily: 'var(--body)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          {activeTab === 'login' ? 'Tiếp tục bằng tài khoản Google (Gmail)' : 'Đăng ký nhanh bằng Google (Gmail)'}
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
                <option value="owner">Chủ sở hữu ngựa (Owner)</option>
                <option value="trainer">Huấn luyện viên (Trainer)</option>
                <option value="vet">Bác sĩ thú y (Veterinarian)</option>
                <option value="groom">Nhân viên chăm sóc (Groom)</option>
                <option value="guest">Khách tham quan / Khác</option>
              </select>
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
    </div>
  );
}
