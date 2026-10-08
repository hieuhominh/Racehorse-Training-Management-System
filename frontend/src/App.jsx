import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Ticker from './components/Ticker';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import HorsesPage from './pages/HorsesPage';
import AchievementsPage from './pages/AchievementsPage';

// Helper component to auto scroll to top when changing routes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
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
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-container">
        {/* 1. Ticker thông báo mùa giải trên cùng */}
        <Ticker onOpenAuth={handleOpenAuth} />

        {/* 2. Header & Mega Menu tương tác */}
        <Navbar onOpenAuth={handleOpenAuth} />

        {/* 3. Dynamic Page Routing */}
        <Routes>
          <Route path="/" element={<HomePage onOpenAuth={handleOpenAuth} />} />
          <Route path="/ho-so-ngua" element={<HorsesPage onOpenAuth={handleOpenAuth} />} />
          <Route path="/ho-so-ngua.html" element={<HorsesPage onOpenAuth={handleOpenAuth} />} />
          <Route path="/ho-so-ngua/pedigree.html" element={<HorsesPage onOpenAuth={handleOpenAuth} />} />
          <Route path="/thanh-tich" element={<AchievementsPage onOpenAuth={handleOpenAuth} />} />
          <Route path="/thanh-tich.html" element={<AchievementsPage onOpenAuth={handleOpenAuth} />} />
          <Route path="/ho-so-ngua/thanh-tich.html" element={<AchievementsPage onOpenAuth={handleOpenAuth} />} />
          <Route path="*" element={<HomePage onOpenAuth={handleOpenAuth} />} />
        </Routes>

        {/* 4. Chân trang */}
        <Footer onOpenAuth={handleOpenAuth} />

        {/* Modal Đăng nhập & Đăng ký */}
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={handleCloseAuth} 
          initialTab={authModal.tab} 
        />
      </div>
    </BrowserRouter>
  );
}
