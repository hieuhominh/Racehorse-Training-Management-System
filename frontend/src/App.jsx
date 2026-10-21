import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import Ticker from './components/Ticker';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminRoute from './components/AdminRoute';
import TrainerRoute from './components/TrainerRoute';

import HomePage from './pages/HomePage';
import HorsesPage from './pages/HorsesPage';
import AchievementsPage from './pages/AchievementsPage';
import StablesPage from './pages/StablesPage';
import AdminPage from './pages/AdminPage';
import TrainerPage from './pages/TrainerPage';

// Helper component to auto scroll to top when changing routes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell({ authModal, handleOpenAuth, handleCloseAuth }) {
  const location = useLocation();
  const isRolePortal = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/trainer') || 
    location.pathname.startsWith('/huan-luyen');

  return (
    <div className={`app-container ${isRolePortal ? 'in-portal' : ''}`}>
      {/* 1. Chỉ hiển thị Ticker & Navbar trên các trang Public */}
      {!isRolePortal && <Ticker onOpenAuth={handleOpenAuth} />}
      {!isRolePortal && <Navbar onOpenAuth={handleOpenAuth} />}

      {/* 2. Dynamic Page Routing */}
      <Routes>
        <Route path="/" element={<HomePage onOpenAuth={handleOpenAuth} />} />
        <Route path="/ho-so-ngua" element={<HorsesPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/ho-so-ngua.html" element={<HorsesPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/ho-so-ngua/pedigree.html" element={<HorsesPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/thanh-tich" element={<AchievementsPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/thanh-tich.html" element={<AchievementsPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/ho-so-ngua/thanh-tich.html" element={<AchievementsPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/chuong-trai" element={<StablesPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/chuong-trai.html" element={<StablesPage onOpenAuth={handleOpenAuth} />} />
        <Route path="/chuong-trai/so-do.html" element={<StablesPage onOpenAuth={handleOpenAuth} />} />
        
        {/* CỔNG QUẢN TRỊ VIÊN BẢO MẬT (ADMIN PORTAL) */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin.html" 
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } 
        />

        {/* CỔNG HUẤN LUYỆN VIÊN TRƯỞNG BẢO MẬT (TRAINER PORTAL) */}
        <Route 
          path="/trainer" 
          element={
            <TrainerRoute>
              <TrainerPage />
            </TrainerRoute>
          } 
        />
        <Route 
          path="/trainer.html" 
          element={
            <TrainerRoute>
              <TrainerPage />
            </TrainerRoute>
          } 
        />
        <Route 
          path="/huan-luyen" 
          element={
            <TrainerRoute>
              <TrainerPage />
            </TrainerRoute>
          } 
        />
        <Route 
          path="/huan-luyen.html" 
          element={
            <TrainerRoute>
              <TrainerPage />
            </TrainerRoute>
          } 
        />

        <Route path="*" element={<HomePage onOpenAuth={handleOpenAuth} />} />
      </Routes>

      {/* 3. Chỉ hiển thị Chân trang trên các trang Public */}
      {!isRolePortal && <Footer onOpenAuth={handleOpenAuth} />}

      {/* Modal Đăng nhập & Đăng ký (khởi tạo chính xác tab khi bấm nút) */}
      {authModal.isOpen && (
        <AuthModal 
          key={`${authModal.isOpen}-${authModal.tab}`}
          isOpen={authModal.isOpen} 
          onClose={handleCloseAuth} 
          initialTab={authModal.tab} 
        />
      )}
    </div>
  );
}

// Error Boundary bảo vệ ứng dụng, không bao giờ để web bị màn hình đen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Lỗi giao diện:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E0C0A',
          color: '#EFECE6',
          fontFamily: 'sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#D4AF37', marginBottom: '10px' }}>Hệ thống Mã Trường</h2>
          <p style={{ color: '#888', maxWidth: '500px', marginBottom: '20px', fontSize: '14px', lineHeight: 1.5 }}>
            Đã phát hiện sự cố tải giao diện. Vui lòng bấm vào nút bên dưới để khôi phục và tiếp tục sử dụng.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            style={{
              padding: '10px 22px',
              background: '#D4AF37',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#14100A',
              fontSize: '14px'
            }}
          >
            Tải lại Trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleCloseAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AppShell 
                  authModal={authModal} 
                  handleOpenAuth={handleOpenAuth} 
                  handleCloseAuth={handleCloseAuth} 
                />
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
