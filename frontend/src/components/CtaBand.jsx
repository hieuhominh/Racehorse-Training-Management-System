import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CtaBand({ onOpenAuth }) {
  const { t } = useLanguage();

  return (
    <div className="band">
      <div className="wrap">
        <div>
          <h2>{t('ctaHeading')}</h2>
          <p>{t('ctaDesc')}</p>
        </div>
        <div className="hero-actions">
          <a 
            className="btn btn-solid" 
            href="/dang-ky.html"
            onClick={(e) => {
              if (onOpenAuth) {
                e.preventDefault();
                onOpenAuth('register');
              }
            }}
          >
            {t('ctaRegisterBtn')}
          </a>
          <a className="btn btn-ghost" href="/lien-he.html">
            {t('ctaDemoBtn')}
          </a>
        </div>
      </div>
    </div>
  );
}
