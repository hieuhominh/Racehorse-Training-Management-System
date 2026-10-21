import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import HorseListSection from '../components/HorseListSection';
import CtaBand from '../components/CtaBand';

export default function HorsesPage({ onOpenAuth }) {
  const { t } = useLanguage();

  return (
    <main className="page-content horses-page-wrapper">
      {/* Breadcrumb & Header Banner */}
      <div className="page-banner">
        <div className="wrap">
          <div className="breadcrumb">
            <Link to="/" className="bc-item">{t('home')}</Link>
            <span className="bc-sep">/</span>
            <span className="bc-item active">{t('horsesPageTitle')}</span>
          </div>

          <div className="banner-flex">
            <div>
              <span className="badge badge-gold">{t('horsesBadge')}</span>
              <h1 className="banner-title">{t('horsesBannerTitle')}</h1>
              <p className="banner-desc">
                {t('horsesBannerDesc')}
              </p>
            </div>

            <div className="banner-stats">
              <div className="stat-card">
                <span className="stat-num">8</span>
                <span className="stat-label">{t('horsesStat1Label')}</span>
              </div>
              <div className="stat-card">
                <span className="stat-num gold-num">100%</span>
                <span className="stat-label">{t('horsesStat2Label')}</span>
              </div>
              <div className="stat-card">
                <span className="stat-num green-num">5</span>
                <span className="stat-label">{t('horsesStat3Label')}</span>
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

