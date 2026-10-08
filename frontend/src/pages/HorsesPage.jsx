import React from 'react';
import { Link } from 'react-router-dom';
import HorseListSection from '../components/HorseListSection';
import CtaBand from '../components/CtaBand';

export default function HorsesPage({ onOpenAuth }) {
  return (
    <main className="page-content horses-page-wrapper">
      {/* Breadcrumb & Header Banner */}
      <div className="page-banner">
        <div className="wrap">
          <div className="breadcrumb">
            <Link to="/" className="bc-item">Trang chủ</Link>
            <span className="bc-sep">/</span>
            <span className="bc-item active">Hồ sơ ngựa & Cây dòng dõi 3 đời</span>
          </div>

          <div className="banner-flex">
            <div>
              <span className="badge badge-gold">QUẢN LÝ THÔNG TIN MÃ TRƯỜNG</span>
              <h1 className="banner-title">HỒ SƠ MÃ ĐỊNH DANH & PHẢ HỆ</h1>
              <p className="banner-desc">
                Tra cứu danh sách chiến mã theo <strong>Mã Chip RFID</strong>, quản lý chủ sở hữu, lịch sử thi đấu và theo dõi <strong>Cây dòng dõi 3 đời (Sire, Dam, Grandparents)</strong> chuẩn quốc tế.
              </p>
            </div>

            <div className="banner-stats">
              <div className="stat-card">
                <span className="stat-num">8</span>
                <span className="stat-label">Chiến mã quản lý</span>
              </div>
              <div className="stat-card">
                <span className="stat-num gold-num">100%</span>
                <span className="stat-label">Đã gắn mã chip RFID</span>
              </div>
              <div className="stat-card">
                <span className="stat-num green-num">5</span>
                <span className="stat-label">Đủ điều kiện thi đấu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Horse List & Pedigree Modal Section */}
      <HorseListSection />

      {/* CTA Band */}
      <CtaBand onOpenAuth={onOpenAuth} />
    </main>
  );
}
