import React from 'react';
import { Link } from 'react-router-dom';
import { flowsData } from '../data/flowsData';
import { useLanguage } from '../context/LanguageContext';

export default function FlowsSection() {
  const { t, lang } = useLanguage();

  return (
    <section>
      <div className="wrap">
        <div className="sec-head">
          <h2>{t('flowsHeading')}</h2>
          <p>{t('flowsDesc')}</p>
        </div>

        {flowsData.map((flow) => {
          const title = lang === 'en' ? flow.titleEn : flow.titleVi;
          const desc = lang === 'en' ? flow.descEn : flow.descVi;
          const badge = lang === 'en' ? flow.badgeEn : flow.badgeVi;
          const linkText = lang === 'en' ? flow.linkTextEn : flow.linkTextVi;

          return (
            <div key={flow.no} className="flow">
              <div className="no">{flow.no}</div>
              <div>
                <h3>{title}</h3>
                <div className="vn">{flow.vn}</div>
                <p>{desc}</p>
              </div>
              <div className="meta">
                <span className={`badge ${flow.isReq ? 'req' : 'opt'}`}>{badge}</span>
                <Link to={flow.link}>{linkText}</Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
