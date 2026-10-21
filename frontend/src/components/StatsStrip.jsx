import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function StatsStrip() {
  const { t } = useLanguage();

  const stats = [
    { value: '38', label: t('stat1Label') },
    { value: '5', label: t('stat2Label') },
    { value: '24/7', label: t('stat3Label') },
    { value: '100%', label: t('stat4Label') },
  ];

  return (
    <div className="strip">
      {stats.map((item, idx) => (
        <div key={idx}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
