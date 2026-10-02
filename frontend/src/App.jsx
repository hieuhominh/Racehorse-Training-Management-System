import React, { useState } from 'react';
import Ticker from './components/Ticker';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RolesSection from './components/RolesSection';
import FlowsSection from './components/FlowsSection';
import StableSection from './components/StableSection';
import CtaBand from './components/CtaBand';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

export default function App() {
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleCloseAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="app-container">
      {/* 1. Ticker thông báo mùa giải trên cùng */}
      <Ticker onOpenAuth={handleOpenAuth} />

      {/* 2. Header & Mega Menu tương tác */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* 3. Hero Section & Vitals Telemetry trực tiếp */}
      <Hero onOpenAuth={handleOpenAuth} />

      {/* 4. Danh sách các vai trò (RBAC Views) */}
      <RolesSection />

      {/* 5. Năm luồng nghiệp vụ cốt lõi */}
      <FlowsSection />

      {/* 6. Sơ đồ chuồng trực quan & Lịch sinh hoạt trong ngày */}
      <StableSection />

      {/* 7. Dải kêu gọi hành động */}
      <CtaBand onOpenAuth={handleOpenAuth} />

      {/* 8. Chân trang */}
      <Footer onOpenAuth={handleOpenAuth} />

      {/* Modal Đăng nhập & Đăng ký */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={handleCloseAuth} 
        initialTab={authModal.tab} 
      />
    </div>
  );
}

