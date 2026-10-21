import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Ticker({ onOpenAuth }) {
  const { t } = useLanguage();

  return (
    <div className="ticker">
      <div className="wrap ticker-wrap">
        <div className="meet">
          <b>{t('tickerSeason')}</b>
          <span>{t('tickerMeet')}</span>
        </div>
        <nav>
          <a href="/ho-tro.html">{t('tickerSupport')}</a>
          <a href="/tai-lieu.html">{t('tickerDocs')}</a>
          <a 
            href="/dang-nhap.html"
            onClick={(e) => {
              if (onOpenAuth) {
                e.preventDefault();
                onOpenAuth('login');
              }
            }}
          >
            {t('tickerLogin')}
          </a>
        </nav>
      </div>
    </div>
  );
}
