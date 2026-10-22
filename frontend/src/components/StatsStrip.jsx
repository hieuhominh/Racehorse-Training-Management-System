import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getHorsesApi, getStablesApi } from '../services/api';

export default function StatsStrip() {
  const { t } = useLanguage();
  const [totalHorses, setTotalHorses] = useState(38);
  const [activeBlocks, setActiveBlocks] = useState(5);

  useEffect(() => {
    let isMounted = true;
    getHorsesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setTotalHorses(res.data.length);
      }
    }).catch(() => {});

    getStablesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        const blocks = new Set(res.data.map(s => s.block).filter(Boolean));
        if (blocks.size > 0) {
          setActiveBlocks(blocks.size);
        }
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const stats = [
    { value: String(totalHorses), label: t('stat1Label') },
    { value: String(activeBlocks), label: t('stat2Label') },
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
