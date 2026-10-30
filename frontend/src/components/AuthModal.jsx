import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, FIXED_TRAINERS, FIXED_VETS, FIXED_GROOMS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { COUNTRY_PHONE_CODES, DEFAULT_COUNTRY } from '../data/countryPhoneCodes';

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
  const { showToast } = useToast();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();

  const redirectToRolePortal = (user) => {
    if (!user) return;
    const r = (user.role || user.role_code || '').toUpperCase();
    if (r === 'TRAINER') {
      navigate('/trainer');
    } else if (r === 'VET') {
      navigate('/vet');
    } else if (r === 'GROOM') {
      navigate('/groom');
    } else if (r === 'OWNER') {
      navigate('/owner');
    } else if (r === 'MANAGER' || r === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/owner');
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
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [regPhone, setRegPhone] = useState('');
  const [regRole] = useState('OWNER');
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

  // Tự động chuyển đúng tab (Đăng ký hoặc Đăng nhập) theo nút người dùng bấm và làm sạch ô nhập
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setLoginEmail('');
      setLoginPassword('');
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setSelectedCountry(DEFAULT_COUNTRY);
      setRegPassword('');
      setRegConfirmPassword('');
      setFieldErrors({});
      setNotification('');
      setIsError(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Validate Email regex
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Validate phone number (7 to 14 digits)
  const isValidPhone = (phone) => {
    const clean = phone.replace(/[\s.-]/g, '');
    return /^\d{7,14}$/.test(clean);
  };

  // Quick fill & instant login for demo roles
  const handleQuickRoleLogin = async (username, pass = '123456') => {
    setLoginEmail(username);
    setLoginPassword(pass);
    setFieldErrors({});
    setIsError(false);
    setNotification(lang === 'vi' ? 'Đang xác thực và chuyển hướng...' : 'Authenticating and redirecting...');
    
    const res = await login(username, pass);
    if (res && res.success) {
      setIsError(false);
      setNotification(`${t('loginSuccess')} (${res.user.full_name})`);
      setTimeout(() => {
        setNotification('');
        onClose();
        redirectToRolePortal(res.user);
      }, 500);
    } else {
      setIsError(true);
      setNotification(res?.error || t('loginInvalid'));
    }
  };

  // Submit Đăng nhập (Hỗ trợ tài khoản admin hoặc Email & Mật khẩu)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setNotification('');
    const errors = {};

    const cleanAccount = (loginEmail || '').trim();
    if (!cleanAccount) {
      errors.loginEmail = lang === 'en' ? 'Please enter your username or email.' : 'Vui lòng nhập tài khoản hoặc email.';
    } else {
      const lower = cleanAccount.toLowerCase();
      if (lower !== 'admin' && cleanAccount.includes('@') && !isValidEmail(cleanAccount)) {
        errors.loginEmail = t('errEmailFormat');
      }
    }

    if (!loginPassword) {
      errors.loginPassword = t('errPasswordReq');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const res = await login(cleanAccount, loginPassword);
    if (!res || !res.success) {
      setIsError(true);
      setNotification(res?.error || t('loginInvalid'));
      return;
    }

    setIsError(false);
    setNotification(`${t('loginSuccess')} (${res.user.full_name})`);
    setTimeout(() => {
      setNotification('');
      onClose();
      redirectToRolePortal(res.user);
    }, 600);
  };

  // Submit Đăng ký (Đầy đủ trường & Mật khẩu mạnh)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setNotification('');
    const errors = {};

    // 1. Kiểm tra Họ và tên
    if (!regFullName.trim() || regFullName.trim().length < 2) {
      errors.regFullName = t('errFullName');
    }

    // 2. Kiểm tra Email
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail) {
      errors.regEmail = t('errEmailReq');
    } else if (!isValidEmail(cleanEmail)) {
      errors.regEmail = t('errEmailFormat');
    } else {
      let activeUsers = usersList;
      try {
        const stored = localStorage.getItem('matruong_users_list');
        if (stored) activeUsers = JSON.parse(stored);
      } catch {}
      const isDuplicate = activeUsers?.some(u => u.email?.toLowerCase() === cleanEmail);
      if (isDuplicate) {
        errors.regEmail = t('errEmailExists');
      }
    }

    // 3. Kiểm tra Số điện thoại
    if (!regPhone.trim()) {
      errors.regPhone = t('errPhoneReq');
    } else if (!isValidPhone(regPhone)) {
      errors.regPhone = t('errPhoneInvalid');
    }

    // 4. Kiểm tra Mật khẩu
    if (!regPassword) {
      errors.regPassword = t('errPasswordReq');
    } else if (regPassword.length < 8) {
      errors.regPassword = t('errPasswordLength');
    } else if (!/[0-9]/.test(regPassword)) {
      errors.regPassword = t('errPasswordNum');
    } else if (!/[A-Z]/.test(regPassword)) {
      errors.regPassword = t('errPasswordUpper');
    } else if (!/[a-z]/.test(regPassword)) {
      errors.regPassword = t('errPasswordLower');
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(regPassword)) {
      errors.regPassword = t('errPasswordSpecial');
    }

    // 5. Kiểm tra Xác nhận mật khẩu
    if (!regConfirmPassword) {
      errors.regConfirmPassword = t('errConfirmPasswordReq');
    } else if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = t('errConfirmPasswordMismatch');
    }

    // 6. Kiểm tra Đồng ý điều khoản
    if (!regAgreedTerms) {
      errors.regAgreedTerms = t('errTermsReq');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsError(true);
      setNotification(t('errGeneralReq'));
      return;
    }

    setFieldErrors({});

    const roleLabels = {
      'TRAINER': t('roleTrainer'),
      'OWNER': t('roleOwner'),
      'VET': t('roleVet'),
      'GROOM': t('roleGroom'),
      'MANAGER': t('roleManager')
    };

    const fullPhoneNumber = `${selectedCountry.dialCode} ${regPhone.trim()}`;

    const createdUser = registerUser({
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      full_name: regFullName.trim(),
      phone: fullPhoneNumber,
      role: regRole.toUpperCase(),
      role_name: roleLabels[regRole.toUpperCase()] || t('roleOwner'),
      password: regPassword
    });

    // Đăng nhập ngay lập tức với tài khoản mới tạo
    await login(cleanEmail, regPassword);

    setIsError(false);
    setNotification(t('registerSuccess'));
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
      showToast('Vui lòng nhập địa chỉ email hợp lệ.', 'QUÊN MẬT KHẨU', 'warning');
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
        {/* Nút Đóng & Bộ chuyển đổi ngôn ngữ Anh - Việt */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10
        }}>
          {/* Nút chuyển đổi ngôn ngữ trực tiếp */}
          <button
            type="button"
            onClick={toggleLang}
            title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--brass)',
              borderRadius: '20px',
              color: 'var(--brass)',
              fontFamily: 'var(--body)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>⇄</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--paper-dim)',
              fontSize: '22px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
          >
            &times;
          </button>
        </div>

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
              {t('systemTitle')}
            </div>
            <div style={{ fontSize: '10.5px', letterSpacing: '.12em', color: 'var(--brass)', marginTop: '3px', fontWeight: 600, textTransform: 'uppercase' }}>
              {lang === 'vi' ? 'ENTERPRISE RACEHORSE SYSTEM' : 'ENTERPRISE RACEHORSE SYSTEM'}
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
            {t('loginTab')}
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
            {t('registerTab')}
          </button>
        </div>

        {/* Thông báo Alert */}
        {notification && (
          <div style={{
            padding: '11px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            background: isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(200, 168, 107, 0.12)',
            border: isError ? '1px solid #EF4444' : '1px solid var(--brass)',
            color: isError ? '#EF4444' : 'var(--brass)',
            textAlign: 'center',
            fontWeight: 600,
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {isError ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <span>{notification}</span>
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
          {activeTab === 'login' ? t('googleLogin') : t('googleRegister')}
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
          <span>{t('orEmail')}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        {/* ===================== 1. LOGIN FORM (Chỉ dùng Email) ===================== */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Dummy hidden inputs để bẫy và triệt tiêu cơ chế tự động điền của trình duyệt */}
            <input type="text" name="bsp_prevent_autofill_user" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="bsp_prevent_autofill_pwd" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }} tabIndex={-1} autoComplete="new-password" />

            {/* Input Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('emailLabel')}
              </label>
              {fieldErrors.loginEmail && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.loginEmail}
                </div>
              )}
              <input
                type="text"
                required
                name="matruong_login_account"
                autoComplete="off"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (isError) setIsError(false);
                  if (notification) setNotification('');
                  if (fieldErrors.loginEmail) setFieldErrors({ ...fieldErrors, loginEmail: '' });
                }}
                placeholder={t('emailPlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${isError || fieldErrors.loginEmail ? '#EF4444' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Input Mật khẩu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('passwordLabel')}
              </label>
              {fieldErrors.loginPassword && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.loginPassword}
                </div>
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  name="matruong_login_pwd"
                  autoComplete="new-password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (isError) setIsError(false);
                    if (notification) setNotification('');
                    if (fieldErrors.loginPassword) setFieldErrors({ ...fieldErrors, loginPassword: '' });
                  }}
                  placeholder={t('passwordPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${isError || fieldErrors.loginPassword ? '#EF4444' : 'var(--line)'}`,
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
                  title={showLoginPassword ? (lang === 'vi' ? 'Ẩn mật khẩu' : 'Hide password') : (lang === 'vi' ? 'Hiện mật khẩu' : 'Show password')}
                >
                  {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
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
                <span>{t('rememberMe')}</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)} 
                style={{ color: 'var(--brass)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', padding: 0 }}
              >
                {t('forgotPassword')}
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
              {t('loginSubmit')}
            </button>

            {/* Khối Đăng nhập nhanh 1 chạm theo vai trò */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--line)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--brass)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span> {lang === 'vi' ? 'Đăng nhập nhanh 1 chạm (Cố định 10 nhân sự + Chủ ngựa)' : '1-Click Quick Demo Login'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--brass)', textTransform: 'none' }}>Pass: 123</span>
              </div>
              
              {/* Quản trị & Chủ sở hữu */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                marginBottom: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('admin', '123')}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(217, 119, 6, 0.12)',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    borderRadius: '6px',
                    color: '#D97706',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Đăng nhập Quản trị viên (admin / 123) -> Chuyển thẳng Cổng Quản trị"
                >
                  <span>⚙️</span>
                  <div>
                    <div>Quản Trị Viên (1)</div>
                    <div style={{ fontSize: '9.5px', color: 'var(--paper-dim)', fontWeight: 400 }}>admin / 123</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('owner_thanh', '123')}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(236, 72, 153, 0.12)',
                    border: '1px solid rgba(236, 72, 153, 0.35)',
                    borderRadius: '6px',
                    color: '#EC4899',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Đăng nhập Chủ sở hữu Ngựa (owner_thanh / 123)"
                >
                  <span>👑</span>
                  <div>
                    <div>Chủ Sở Hữu Ngựa</div>
                    <div style={{ fontSize: '9.5px', color: 'var(--paper-dim)', fontWeight: 400 }}>owner_thanh / 123</div>
                  </div>
                </button>
              </div>

              {/* 3 Huấn luyện viên chính */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🏇</span> 3 Huấn Luyện Viên Chính:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {FIXED_TRAINERS.map(tr => (
                    <button
                      key={tr.username}
                      type="button"
                      onClick={() => handleQuickRoleLogin(tr.username, '123')}
                      style={{
                        padding: '5px 6px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '5px',
                        color: 'var(--paper)',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      title={`${tr.full_name} (${tr.title})`}
                    >
                      <div style={{ fontWeight: 700, color: '#93C5FD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tr.full_name.split(' ').slice(-2).join(' ')}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--paper-dim)' }}>{tr.username}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Bác sĩ thú y chính */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🩺</span> 3 Bác Sĩ Thú Y Chính:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {FIXED_VETS.map(vt => (
                    <button
                      key={vt.username}
                      type="button"
                      onClick={() => handleQuickRoleLogin(vt.username, '123')}
                      style={{
                        padding: '5px 6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '5px',
                        color: 'var(--paper)',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      title={`${vt.full_name} (${vt.title})`}
                    >
                      <div style={{ fontWeight: 700, color: '#6EE7B7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vt.full_name}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--paper-dim)' }}>{vt.username}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Chuyên viên chăm sóc chính */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#C084FC', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🌾</span> 3 Người Chăm Sóc Chính:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {FIXED_GROOMS.map(gm => (
                    <button
                      key={gm.username}
                      type="button"
                      onClick={() => handleQuickRoleLogin(gm.username, '123')}
                      style={{
                        padding: '5px 6px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '5px',
                        color: 'var(--paper)',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      title={`${gm.full_name} (${gm.title})`}
                    >
                      <div style={{ fontWeight: 700, color: '#D8B4FE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {gm.full_name.split(' ').slice(-2).join(' ')}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--paper-dim)' }}>{gm.username}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chuyển sang Đăng ký */}
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--paper-dim)' }}>
              {t('noAccount')}{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setNotification(''); setFieldErrors({}); }}
                style={{ color: 'var(--brass)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t('registerNow')}
              </button>
            </div>
          </form>
        ) : (

          /* ===================== 2. REGISTER FORM (Đầy đủ & Mật khẩu) ===================== */
          <form onSubmit={handleRegisterSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Dummy hidden inputs để bẫy và triệt tiêu cơ chế tự động điền của trình duyệt */}
            <input type="text" name="bsp_prevent_reg_user" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="bsp_prevent_reg_pwd" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }} tabIndex={-1} autoComplete="new-password" />

            {/* 1. Họ và tên */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('regFullNameLabel')}
              </label>
              {fieldErrors.regFullName && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.regFullName}
                </div>
              )}
              <input
                type="text"
                required
                name="matruong_reg_fullname"
                autoComplete="off"
                value={regFullName}
                onChange={(e) => {
                  setRegFullName(e.target.value);
                  if (fieldErrors.regFullName) setFieldErrors({ ...fieldErrors, regFullName: '' });
                }}
                placeholder={t('regFullNamePlaceholder')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${fieldErrors.regFullName ? '#EF4444' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 2. Địa chỉ Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('regEmailLabel')}
              </label>
              {fieldErrors.regEmail && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.regEmail}
                </div>
              )}
              <input
                type="email"
                required
                name="matruong_reg_email"
                autoComplete="off"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  if (fieldErrors.regEmail) setFieldErrors({ ...fieldErrors, regEmail: '' });
                }}
                placeholder={t('regEmailPlaceholder')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: `1px solid ${fieldErrors.regEmail ? '#EF4444' : 'var(--line)'}`,
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontFamily: 'var(--body)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 3. Số điện thoại & Bộ chọn mã vùng */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('regPhoneLabel')}
              </label>
              {fieldErrors.regPhone && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.regPhone}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                {/* Selector chỉ hiển thị mã vùng */}
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRY_PHONE_CODES.find(c => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  title={lang === 'vi' ? 'Chọn mã vùng điện thoại' : 'Select dial code'}
                  style={{
                    width: '78px',
                    flexShrink: 0,
                    padding: '8px 6px',
                    textAlign: 'center',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontFamily: 'var(--body)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {COUNTRY_PHONE_CODES.map((item) => (
                    <option 
                      key={item.code} 
                      value={item.code} 
                      title={lang === 'vi' ? item.nameVi : item.nameEn}
                      style={{ background: 'var(--bg-card)', color: 'var(--paper)' }}
                    >
                      {item.dialCode}
                    </option>
                  ))}
                </select>

                {/* Ô nhập số điện thoại */}
                <input
                  type="tel"
                  required
                  name="matruong_reg_phone"
                  autoComplete="off"
                  value={regPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9\s-]/g, '');
                    setRegPhone(val);
                    if (fieldErrors.regPhone) setFieldErrors({ ...fieldErrors, regPhone: '' });
                  }}
                  placeholder={selectedCountry.placeholder || t('regPhonePlaceholder')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '9px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${fieldErrors.regPhone ? '#EF4444' : 'var(--line)'}`,
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontFamily: 'var(--body)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 4. Mật khẩu mới */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('regPasswordLabel')}
              </label>
              {fieldErrors.regPassword && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.regPassword}
                </div>
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  name="matruong_reg_pwd"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    if (fieldErrors.regPassword) setFieldErrors({ ...fieldErrors, regPassword: '' });
                  }}
                  placeholder={t('passwordPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${fieldErrors.regPassword ? '#EF4444' : 'var(--line)'}`,
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
                  title={showRegPassword ? (lang === 'vi' ? 'Ẩn mật khẩu' : 'Hide password') : (lang === 'vi' ? 'Hiện mật khẩu' : 'Show password')}
                >
                  {showRegPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* 6. Xác nhận mật khẩu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                {t('regConfirmPasswordLabel')}
              </label>
              {fieldErrors.regConfirmPassword && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.regConfirmPassword}
                </div>
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  name="matruong_reg_conf_pwd"
                  autoComplete="new-password"
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    if (fieldErrors.regConfirmPassword) setFieldErrors({ ...fieldErrors, regConfirmPassword: '' });
                  }}
                  placeholder={t('regConfirmPasswordPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${fieldErrors.regConfirmPassword ? '#EF4444' : 'var(--line)'}`,
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
                  title={showRegConfirmPassword ? (lang === 'vi' ? 'Ẩn mật khẩu' : 'Hide password') : (lang === 'vi' ? 'Hiện mật khẩu' : 'Show password')}
                >
                  {showRegConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* 7. Checkbox Điều khoản */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
              {fieldErrors.regAgreedTerms && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 500, lineHeight: 1.3 }}>
                  {fieldErrors.regAgreedTerms}
                </div>
              )}
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
                  {t('termsAgreement')} <span style={{ color: 'var(--brass)' }}>{t('termsOfService')}</span> {lang === 'vi' ? 'và' : '&'} <span style={{ color: 'var(--brass)' }}>{t('privacyPolicy')}</span> {lang === 'vi' ? 'của Mã Trường OS.' : 'of Ma Truong OS.'}
                </span>
              </label>
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
              {t('registerSubmit')}
            </button>

            {/* Chuyển sang Đăng nhập */}
            <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
              {t('haveAccount')}{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setNotification(''); setFieldErrors({}); }}
                style={{ color: 'var(--brass)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t('loginNow')}
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
