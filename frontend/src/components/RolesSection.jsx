import React from 'react';
import { Link } from 'react-router-dom';
import { rolesData } from '../data/rolesData';
import { useLanguage } from '../context/LanguageContext';

export default function RolesSection() {
  const { t, lang } = useLanguage();

  return (
    <section className="roles" id="vai-tro">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-badge">{t('rolesBadge')}</div>
          <h2>{t('rolesHeading')}</h2>
          <p>{t('rolesDesc')}</p>
        </div>
        <div className="role-grid">
          {rolesData.map((role, idx) => {
            const tag = lang === 'en' ? role.tagEn : role.tagVi;
            const title = lang === 'en' ? role.titleEn : role.titleVi;
            const cta = lang === 'en' ? role.ctaEn : role.ctaVi;
            const duties = lang === 'en' ? role.dutiesEn : role.dutiesVi;

            return (
              <Link key={idx} className="role" to={role.link}>
                <div className="tag">{tag}</div>
                <h3>{title}</h3>
                <div className="vn">{role.vn}</div>
                <ul>
                  {duties.map((duty, dIdx) => (
                    <li key={dIdx}>{duty}</li>
                  ))}
                </ul>
                <div className="go">
                  <span>{cta}</span>
                  <span className="go-arrow">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
