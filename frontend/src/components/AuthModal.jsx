import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Minimalist SVG Icons
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
  </svg>
);

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, registerUser, usersList } = useAuth();
  const navigate = useNavigate();

  const redirectToRolePortal = (user) => {
    if (!user) return;
    if (user.role === 'TRAINER') {
      navigate('/trainer');
    } else {
      navigate('/admin');
    }
  };

  const [activeTab, setActiveTab] = useState(initialTab);
  const [notification, setNotification] = useState('');
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Login form state (Only Email & Password)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (Full details & Strong Password)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('TRAINER');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regAgreedTerms, setRegAgreedTerms] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Google Modal State
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('huanluyen.vien@gmail.com');
  const [googleName, setGoogleName] = useState('Nguyễn Văn Tuấn');
  const [googlePhone, setGooglePhone] = useState('0912888999');
  const [googleRole, setGoogleRole] = useState('TRAINER');

  if (!isOpen) return null;

  // Đánh giá độ mạnh mật khẩu - Tối giản theo 3 màu chủ đạo
  const evaluatePasswordStrength = (pass) => {
    if (!pass) {
      return { 
        score: 0, 
        label: 'Chưa nhập', 
        checks: { length: false, upper: false, lower: false, num: false, special: false }, 
        isStrong: false 
      };
    }
    
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      num: /[0-9]/.test(pass),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pass)
    };

    const count = Object.values(checks).filter(Boolean).length;
    let score = 1;
    let label = 'Yếu';

    if (count <= 2) {
      score = 1;
      label = 'Yếu';
    } else if (count === 3) {
      score = 2;
      label = 'Trung bình';
    } else if (count === 4) {
      score = 3;
      label = 'Mạnh';
    } else if (count === 5) {
      score = 4;
      label = 'Rất mạnh';
    }

    return {
      score,
      label,
      checks,
      isStrong: checks.length && count >= 4
    };
  };

  const passwordStrength = evaluatePasswordStrength(regPassword);

  // Validate Email regex
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Validate Vietnamese Phone number (10 digits)
  const isValidPhone = (phone) => {
    const clean = phone.replace(/[\s.-]/g, '');
    return /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(clean);
  };

  // Quick fill demo account for instant login testing
  const handleQuickLoginFill = (emailPreset) => {
    setLoginEmail(emailPreset);
    setLoginPassword('123');
    setFieldErrors({});
    setNotification('');
  };

  // Submit Đăng nhập (Chỉ dùng Email & Mật khẩu)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsError(false);
    setNotification('');
    const errors = {};

    if (!loginEmail.trim()) {
      errors.loginEmail = 'Vui lòng nhập địa chỉ email.';
    } else if (!isValidEmail(loginEmail)) {
      errors.loginEmail = 'Địa chỉ email không đúng định dạng.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Vui lòng nhập mật khẩu.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const res = login(loginEmail, loginPassword);
    if (!res.success) {
      setIsError(true);
      setNotification(res.error);
      return;
    }

    setNotification(`Đăng nhập thành công. Chào mừng ${res.user.full_name} (${res.user.role_name}). Đang chuyển hướng...`);
    setTimeout(() => {
      setNotification('');
      onClose();
      redirectToRolePortal(res.user);
    }, 600);
  };

  // Submit Đăng ký (Đầy đủ trường & Mật khẩu mạnh)
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setIsError(false);
    setNotification('');
    const errors = {};

    // 1. Kiểm tra Họ và tên
    if (!regFullName.trim() || regFullName.trim().length < 2) {
      errors.regFullName = 'Họ và tên bắt buộc từ 2 ký tự trở lên.';
    }

    // 2. Kiểm tra Email
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail) {
      errors.regEmail = 'Vui lòng nhập địa chỉ email.';
    } else if (!isValidEmail(cleanEmail)) {
      errors.regEmail = 'Địa chỉ email không đúng định dạng.';
    } else {
      const isDuplicate = usersList?.some(u => u.email?.toLowerCase() === cleanEmail);
      if (isDuplicate) {
        errors.regEmail = 'Email này đã được sử dụng trong hệ thống.';
      }
    }

    // 3. Kiểm tra Số điện thoại
    if (!regPhone.trim()) {
      errors.regPhone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else if (!isValidPhone(regPhone)) {
      errors.regPhone = 'Số điện thoại không hợp lệ (cần 10 chữ số).';
    }

    // 4. Kiểm tra Mật khẩu mạnh
    if (!regPassword) {
      errors.regPassword = 'Vui lòng nhập mật khẩu.';
    } else if (!passwordStrength.isStrong) {
      errors.regPassword = 'Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
    }

    // 5. Kiểm tra Xác nhận mật khẩu
    if (!regConfirmPassword) {
      errors.regConfirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    // 6. Kiểm tra Đồng ý điều khoản
    if (!regAgreedTerms) {
      errors.regAgreedTerms = 'Cần đồng ý với Điều khoản dịch vụ để tiếp tục.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsError(true);
      setNotification('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setFieldErrors({});

    const roleLabels = {
      'TRAINER': 'Huấn luyện viên Trưởng',
      'OWNER': 'Chủ sở hữu Ngựa',
      'VET': 'Bác sĩ Thú y',
      'GROOM': 'Nhân viên Chăm sóc',
      'MANAGER': 'Quản lý Câu lạc bộ'
    };

    const createdUser = registerUser({
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      full_name: regFullName.trim(),
      phone: regPhone.trim(),
      role: regRole.toUpperCase(),
      role_name: roleLabels[regRole.toUpperCase()] || 'Chủ sở hữu Ngựa',
      password: regPassword
    });

    login(cleanEmail, regPassword);

    setNotification(`Đăng ký tài khoản thành công. Đang chuyển hướng vào hệ thống...`);
    setTimeout(() => {
      setNotification('');
      onClose();
      redirectToRolePortal(createdUser);
    }, 700);
  };

  // Google SSO Handlers
  const handleOpenGoogleAuth = () => {
    setIsError(false);
    setNotification('');
    setShowGoogleDialog(true);
  };

  const handleConfirmGoogleRegister = (e) => {
    e.preventDefault();
    if (!googleEmail?.trim() || !googleName?.trim()) {
      setIsError(true);
      setNotification('Vui lòng cung cấp đầy đủ thông tin tài khoản Google.');
      return;
    }

    const cleanEmail = googleEmail.trim().toLowerCase();
    const existing = usersList?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (existing) {
      login(existing.email, existing.password || '123');
      setNotification(`Đăng nhập Google thành công. Chào mừng ${existing.full_name}.`);
      setShowGoogleDialog(false);
      setTimeout(() => {
        setNotification('');
        onClose();
        redirectToRolePortal(existing);
      }, 600);
      return;
    }

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

    login(cleanEmail, '123');
    setNotification(`Đăng ký Google thành công. Chào mừng ${createdUser.full_name}. Đang chuyển hướng...`);
    setShowGoogleDialog(false);
    setTimeout(() => {
      setNotification('');
      onClose();
      redirectToRolePortal(createdUser);
    }, 700);
  };

  const handleQuickGoogleSelect = (preset) => {
    setGoogleEmail(preset.email);
    setGoogleName(preset.name);
    setGooglePhone(preset.phone);
    setGoogleRole(preset.role);
  };

  const handleSendForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !isValidEmail(forgotEmail)) {
      alert('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setForgotMsg(`Liên kết đặt lại mật khẩu đã được gửi đến ${forgotEmail}. Vui lòng kiểm tra hộp thư.`);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotMsg('');
      setForgotEmail('');
    }, 2400);
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
        backgroundColor: 'rgba(10, 13, 20, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="auth-modal-content"
        style={{
          width: '100%',
          maxWidth: activeTab === 'register' ? '490px' : '430px',
          background: 'var(--bg-card)',
          border: '1px solid var(--line-strong)',
          borderRadius: '12px',
          padding: 'clamp(20px, 3.5vw, 30px) clamp(18px, 3vw, 26px)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          color: 'var(--paper)',
          maxHeight: '92vh',
          overflowY: 'auto',
          transition: 'all 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng tối giản */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--paper-dim)',
            fontSize: '22px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
          aria-label="Đóng"
        >
          &times;
        </button>

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            border: '1.5px solid var(--brass)',
            background: 'var(--bg-secondary)',
            color: 'var(--brass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconShield />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '20px', color: 'var(--paper)', letterSpacing: '.02em', lineHeight: 1 }}>
              MÃ TRƯỜNG OS
            </div>
            <div style={{ fontSize: '10.5px', letterSpacing: '.12em', color: 'var(--brass)', marginTop: '3px', fontWeight: 600 }}>
              ENTERPRISE RACEHORSE SYSTEM
            </div>
          </div>
        </div>

        {/* Tab Switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setNotification(''); setFieldErrors({}); }}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2.5px solid var(--brass)' : '2.5px solid transparent',
              color: activeTab === 'login' ? 'var(--brass)' : 'var(--paper-dim)',
              fontFamily: 'var(--body)',
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 0.2s ease, border-color 0.2s ease'
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setNotification(''); setFieldErrors({}); }}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2.5px solid var(--brass)' : '2.5px solid transparent',
              color: activeTab === 'register' ? 'var(--brass)' : 'var(--paper-dim)',
              fontFamily: 'var(--body)',
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 0.2s ease, border-color 0.2s ease'
            }}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Thông báo Alert */}
        {notification && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '16px',
            background: isError ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
            border: isError ? '1px solid var(--line-strong)' : '1px solid var(--brass)',
            color: isError ? 'var(--paper)' : 'var(--brass)',
            textAlign: 'center',
            fontWeight: 500,
            lineHeight: 1.45
          }}>
            {notification}
          </div>
        )}

        {/* Nút Đăng nhập / Đăng ký qua Google */}
        <button
          type="button"
          onClick={handleOpenGoogleAuth}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            color: 'var(--paper)',
            fontFamily: 'var(--body)',
            fontSize: '13.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brass)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          {activeTab === 'login' ? 'Tiếp tục bằng tài khoản Google' : 'Đăng ký nhanh qua Google'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '16px 0',
          color: 'var(--paper-dim)',
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
          <span>hoặc dùng email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        {/* ===================== 1. LOGIN FORM (Chỉ dùng Email) ===================== */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Input Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--paper)' }}>
                Địa chỉ Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (fieldErrors.loginEmail) setFieldErrors({ ...fieldErrors, loginEmail: '' });
                }}
                placeholder="name@matruong.vn"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${fieldErrors.loginEmail ? 'var(--brass)' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.loginEmail && (
                <div style={{ fontSize: '11.5px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.loginEmail}
                </div>
              )}
            </div>

            {/* Input Mật khẩu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--paper)' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (fieldErrors.loginPassword) setFieldErrors({ ...fieldErrors, loginPassword: '' });
                  }}
                  placeholder="Nhập mật khẩu"
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${fieldErrors.loginPassword ? 'var(--brass)' : 'var(--line)'}`,
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontFamily: 'var(--body)',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--paper-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {fieldErrors.loginPassword && (
                <div style={{ fontSize: '11.5px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.loginPassword}
                </div>
              )}
            </div>

            {/* Ghi nhớ & Quên mật khẩu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  style={{ accentColor: 'var(--brass)', cursor: 'pointer' }} 
                /> 
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)} 
                style={{ color: 'var(--brass)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', padding: 0 }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Đăng nhập */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '11px',
                background: 'var(--brass)',
                border: 'none',
                borderRadius: '6px',
                color: '#14100A',
                fontFamily: 'var(--body)',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'opacity 0.2s ease'
              }}
            >
              ĐĂNG NHẬP
            </button>

            {/* Tài khoản mẫu thử nghiệm - Tối giản chuẩn 3 màu */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '6px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Tài khoản mẫu thử nghiệm (chọn để điền nhanh)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {[
                  { label: 'Admin (Quản trị)', email: 'admin@matruong.vn' },
                  { label: 'Trainer (HLV)', email: 'trainer@matruong.vn' },
                  { label: 'Vet (Bác sĩ thú y)', email: 'vet@matruong.vn' },
                  { label: 'Owner (Chủ ngựa)', email: 'owner@matruong.vn' },
                ].map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLoginFill(acc.email)}
                    style={{
                      fontSize: '11.5px',
                      padding: '6px 8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brass)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--brass)', fontSize: '11px' }}>{acc.label}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', marginTop: '1px' }}>{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chuyển sang Đăng ký */}
            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '13px', color: 'var(--paper-dim)' }}>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setNotification(''); setFieldErrors({}); }}
                style={{ color: 'var(--brass)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        ) : (

          /* ===================== 2. REGISTER FORM (Đầy đủ & Mật khẩu mạnh) ===================== */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* 1. Họ và tên */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                1. Họ và tên
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => {
                  setRegFullName(e.target.value);
                  if (fieldErrors.regFullName) setFieldErrors({ ...fieldErrors, regFullName: '' });
                }}
                placeholder="Ví dụ: Hoàng Minh Tuấn"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${fieldErrors.regFullName ? 'var(--brass)' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.regFullName && (
                <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.regFullName}
                </div>
              )}
            </div>

            {/* 2. Địa chỉ Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                2. Địa chỉ Email (dùng để đăng nhập)
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  if (fieldErrors.regEmail) setFieldErrors({ ...fieldErrors, regEmail: '' });
                }}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${fieldErrors.regEmail ? 'var(--brass)' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.regEmail && (
                <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.regEmail}
                </div>
              )}
            </div>

            {/* 3. Số điện thoại */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                3. Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => {
                  setRegPhone(e.target.value);
                  if (fieldErrors.regPhone) setFieldErrors({ ...fieldErrors, regPhone: '' });
                }}
                placeholder="Ví dụ: 0912345678"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${fieldErrors.regPhone ? 'var(--brass)' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.regPhone && (
                <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.regPhone}
                </div>
              )}
            </div>

            {/* 4. Vai trò trong hệ thống */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                4. Vai trò mong muốn trong hệ thống
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="TRAINER">Huấn luyện viên Trưởng (Trainer)</option>
                <option value="OWNER">Chủ sở hữu ngựa (Horse Owner)</option>
                <option value="VET">Bác sĩ Thú y (Veterinarian)</option>
                <option value="GROOM">Nhân viên chăm sóc (Groom)</option>
                <option value="MANAGER">Ban Quản lý Câu lạc bộ (Facility Manager)</option>
              </select>
            </div>

            {/* 5. Mật khẩu mạnh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                  5. Mật khẩu mới (yêu cầu mật khẩu mạnh)
                </label>
                {regPassword && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brass)' }}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    if (fieldErrors.regPassword) setFieldErrors({ ...fieldErrors, regPassword: '' });
                  }}
                  placeholder="Tối thiểu 8 ký tự, gồm Hoa, Thường, Số và Ký tự đặc biệt"
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${fieldErrors.regPassword ? 'var(--brass)' : 'var(--line)'}`,
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontFamily: 'var(--body)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--paper-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showRegPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>

              {/* Thanh độ mạnh mật khẩu - Tối giản */}
              {regPassword && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: '3px',
                        borderRadius: '2px',
                        background: level <= passwordStrength.score ? 'var(--brass)' : 'var(--line)',
                        transition: 'background 0.25s ease'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Checklist Tiêu Chuẩn */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '6px 10px',
                marginTop: '4px',
                fontSize: '11px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '3px',
                color: 'var(--paper-dim)'
              }}>
                <div style={{ color: passwordStrength.checks.length ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: passwordStrength.checks.length ? 600 : 400 }}>
                  {passwordStrength.checks.length ? '[+]' : '[-]'} Tối thiểu 8 ký tự
                </div>
                <div style={{ color: passwordStrength.checks.upper ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: passwordStrength.checks.upper ? 600 : 400 }}>
                  {passwordStrength.checks.upper ? '[+]' : '[-]'} Chữ hoa (A-Z)
                </div>
                <div style={{ color: passwordStrength.checks.lower ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: passwordStrength.checks.lower ? 600 : 400 }}>
                  {passwordStrength.checks.lower ? '[+]' : '[-]'} Chữ thường (a-z)
                </div>
                <div style={{ color: passwordStrength.checks.num ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: passwordStrength.checks.num ? 600 : 400 }}>
                  {passwordStrength.checks.num ? '[+]' : '[-]'} Chữ số (0-9)
                </div>
                <div style={{ gridColumn: '1 / -1', color: passwordStrength.checks.special ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: passwordStrength.checks.special ? 600 : 400 }}>
                  {passwordStrength.checks.special ? '[+]' : '[-]'} Ký tự đặc biệt (!, @, #, $, %, ^, &...)
                </div>
              </div>
              {fieldErrors.regPassword && (
                <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.regPassword}
                </div>
              )}
            </div>

            {/* 6. Xác nhận mật khẩu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                  6. Xác nhận lại mật khẩu
                </label>
                {regConfirmPassword && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: regPassword === regConfirmPassword ? 'var(--brass)' : 'var(--paper-dim)' }}>
                    {regPassword === regConfirmPassword ? 'Mật khẩu khớp' : 'Chưa trùng khớp'}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    if (fieldErrors.regConfirmPassword) setFieldErrors({ ...fieldErrors, regConfirmPassword: '' });
                  }}
                  placeholder="Nhập lại mật khẩu"
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${fieldErrors.regConfirmPassword ? 'var(--brass)' : 'var(--line)'}`,
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontFamily: 'var(--body)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--paper-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showRegConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {fieldErrors.regConfirmPassword && (
                <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.regConfirmPassword}
                </div>
              )}
            </div>

            {/* 7. Checkbox Điều khoản */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: 'var(--paper-dim)', cursor: 'pointer', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  required
                  checked={regAgreedTerms}
                  onChange={(e) => {
                    setRegAgreedTerms(e.target.checked);
                    if (fieldErrors.regAgreedTerms) setFieldErrors({ ...fieldErrors, regAgreedTerms: '' });
                  }}
                  style={{ accentColor: 'var(--brass)', cursor: 'pointer', marginTop: '2px' }}
                />
                <span>
                  Tôi đồng ý với <span style={{ color: 'var(--brass)' }}>Điều khoản dịch vụ</span> và <span style={{ color: 'var(--brass)' }}>Chính sách bảo mật</span> của Mã Trường OS.
                </span>
              </label>
              {fieldErrors.regAgreedTerms && (
                <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                  {fieldErrors.regAgreedTerms}
                </div>
              )}
            </div>

            {/* Submit Đăng ký */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '11px',
                background: 'var(--brass)',
                border: 'none',
                borderRadius: '6px',
                color: '#14100A',
                fontFamily: 'var(--body)',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'opacity 0.2s ease'
              }}
            >
              HOÀN TẤT ĐĂNG KÝ
            </button>

            {/* Chuyển sang Đăng nhập */}
            <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setNotification(''); setFieldErrors({}); }}
                style={{ color: 'var(--brass)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================== POPUP QUÊN MẬT KHẨU ===================== */}
      {showForgotModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 13, 20, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--bg-card)',
              border: '1px solid var(--line-strong)',
              borderRadius: '10px',
              padding: '24px 22px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: 'var(--paper)', fontWeight: 600 }}>
              Khôi Phục Mật Khẩu
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
              Nhập địa chỉ email đăng ký để nhận liên kết thiết lập lại mật khẩu an toàn.
            </p>

            {forgotMsg && (
              <div style={{ padding: '9px 12px', borderRadius: '5px', background: 'var(--bg-secondary)', border: '1px solid var(--brass)', color: 'var(--brass)', fontSize: '12px', marginBottom: '14px', fontWeight: 500 }}>
                {forgotMsg}
              </div>
            )}

            <form onSubmit={handleSendForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                required
                placeholder="Nhập email của bạn (ví dụ: admin@matruong.vn)"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ flex: 1, padding: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{ flex: 1.4, padding: '9px', background: 'var(--brass)', border: 'none', color: '#14100A', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== POPUP GOOGLE SSO ===================== */}
      {showGoogleDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 13, 20, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowGoogleDialog(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '470px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--line-strong)',
              borderRadius: '10px',
              padding: '24px 22px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Google */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--paper)', fontWeight: 600 }}>
                  Xác Thực Tài Khoản Google
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Đăng nhập và phân vai trò trực tiếp qua email
                </p>
              </div>
            </div>

            {/* Quick Demo Preset buttons - Tối giản */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Chọn nhanh vai trò mẫu:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSelect({ email: 'hlv.hung@gmail.com', name: 'HLV Trần Văn Hùng', phone: '0901234567', role: 'TRAINER' })}
                  style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Trainer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSelect({ email: 'chu.thanh@gmail.com', name: 'Chủ ngựa Phạm Tiến Thành', phone: '0904567890', role: 'OWNER' })}
                  style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSelect({ email: 'bacsi.an@gmail.com', name: 'Bác sĩ Thú y Nguyễn An', phone: '0902345678', role: 'VET' })}
                  style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Vet
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmGoogleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px' }}>Địa chỉ Gmail</label>
                <input
                  type="email"
                  required
                  placeholder="vidu@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', background: 'var(--bg-primary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px' }}>Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Tuấn"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', background: 'var(--bg-primary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px' }}>Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={googlePhone}
                  onChange={(e) => setGooglePhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', background: 'var(--bg-primary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--paper)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Vai trò trong hệ thống:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { id: 'TRAINER', title: 'Huấn luyện viên Trưởng (Trainer)' },
                    { id: 'OWNER', title: 'Chủ sở hữu Ngựa (Horse Owner)' },
                    { id: 'VET', title: 'Bác sĩ Thú y (Veterinarian)' },
                    { id: 'GROOM', title: 'Nhân viên Chăm sóc chuồng (Groom)' },
                    { id: 'MANAGER', title: 'Ban Quản lý Câu lạc bộ (Manager)' }
                  ].map((roleItem) => {
                    const isSelected = googleRole === roleItem.id;
                    return (
                      <div
                        key={roleItem.id}
                        onClick={() => setGoogleRole(roleItem.id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '5px',
                          border: isSelected ? '1px solid var(--brass)' : '1px solid var(--line)',
                          background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <input
                          type="radio"
                          name="googleRole"
                          checked={isSelected}
                          onChange={() => setGoogleRole(roleItem.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--brass)' }}
                        />
                        <span style={{ fontSize: '12.5px', color: isSelected ? 'var(--brass)' : 'var(--paper)', fontWeight: isSelected ? 600 : 400 }}>
                          {roleItem.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleDialog(false)}
                  style={{ flex: 1, padding: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: '9px',
                    background: 'var(--brass)',
                    border: 'none',
                    color: '#14100A',
                    fontWeight: 700,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
