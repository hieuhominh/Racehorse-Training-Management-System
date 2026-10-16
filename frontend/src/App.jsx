import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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

      {/* Modal Đăng nhập & Đăng ký */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={handleCloseAuth} 
        initialTab={authModal.tab} 
      />
    </div>
  );
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppShell 
            authModal={authModal} 
            handleOpenAuth={handleOpenAuth} 
            handleCloseAuth={handleCloseAuth} 
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
