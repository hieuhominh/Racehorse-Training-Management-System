import React from 'react';
import VitalsCard from './VitalsCard';
import StatsStrip from './StatsStrip';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({ onOpenAuth }) {
  const { t } = useLanguage();

  return (
    <div className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              {t('heroEyebrow')}
            </div>
            <h1>
              {t('heroTitle1')} <em>{t('heroTitle2')}</em>
            </h1>
            <p className="lede">
              {t('heroLede')}
            </p>
            <div className="hero-actions">
              <a 
                className="btn btn-solid" 
                href="/dang-nhap.html"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('login');
                  }
                }}
              >
                {t('heroEnterSystem')}
              </a>
              <a className="btn btn-ghost" href="#vai-tro">
                {t('heroChooseRole')}
              </a>
            </div>
          </div>

          <VitalsCard />
        </div>

        <StatsStrip />
      </div>
    </div>
  );
}
