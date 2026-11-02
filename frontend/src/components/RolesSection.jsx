import React from 'react';
import { Link } from 'react-router-dom';
import { rolesData } from '../data/rolesData';
import { useLanguage } from '../context/LanguageContext';

/* Role color accents */
const ROLE_COLORS = [
  '#E86B2C', /* Trainer - orange */
  '#8B5CF6', /* Vet - purple */
  '#0D9488', /* Groom - teal */
  '#C47B3A', /* Owner - chestnut */
  '#3A7BD5', /* Manager - blue */
  '#E86B2C', /* Race Entry - orange */
];

export default function RolesSection() {
  const { t, lang } = useLanguage();

  return (
    <section className="roles" id="vai-tro">
      <div className="wrap">
        <div className="sec-head sec-head--light">
          <div className="sec-badge sec-badge--orange">{t('rolesBadge')}</div>
          <h2>{t('rolesHeading')}</h2>
          <p>{t('rolesDesc')}</p>
        </div>
        <div className="role-grid">
          {rolesData.map((role, idx) => {
            const tag = lang === 'en' ? role.tagEn : role.tagVi;
            const title = lang === 'en' ? role.titleEn : role.titleVi;
            const cta = lang === 'en' ? role.ctaEn : role.ctaVi;
            const duties = lang === 'en' ? role.dutiesEn : role.dutiesVi;
            const accentColor = ROLE_COLORS[idx] || '#E86B2C';

            return (
              <Link key={idx} className="role" to={role.link} style={{ '--role-accent': accentColor }}>
                <div className="role-accent-bar" />
                <div className="tag">{tag}</div>
                <h3>{title}</h3>
                <div className="vn">{lang === 'en' ? role.titleVi : (role.titleEn || role.vn)}</div>
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
