import React, { useState, useEffect } from 'react';
import { stallsData, scheduleData } from '../data/stallsData';
import { getStablesApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function StableSection() {
  const { t, lang } = useLanguage();
  const [stalls, setStalls] = useState(stallsData);
  const [selectedStall, setSelectedStall] = useState(() => {
    try {
      const savedCode = localStorage.getItem('matruong_home_selected_stall');
      return stallsData.find(s => s.code === savedCode) || stallsData.find(s => s.code === 'A3') || stallsData[0];
    } catch {
      return stallsData.find(s => s.code === 'A3') || stallsData[0];
    }
  });

  useEffect(() => {
    if (selectedStall && selectedStall.code) {
      localStorage.setItem('matruong_home_selected_stall', selectedStall.code);
    }
  }, [selectedStall]);

  useEffect(() => {
    let isMounted = true;
    getStablesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setStalls(prev => {
          const mapApi = new Map(res.data.map(item => [item.stall_code, item]));
          return prev.map(s => {
            if (mapApi.has(s.code)) {
              const apiItem = mapApi.get(s.code);
              const isOccupied = apiItem.status === 'OCCUPIED';
              return {
                ...s,
                status: isOccupied ? (s.status === 'quar' ? 'quar' : 'eligible') : 'empty',
                horse: isOccupied ? apiItem.horse : '(Trống)',
                englishName: isOccupied ? (apiItem.horseEn || apiItem.horse) : 'Empty Stall'
              };
            }
            return s;
          });
        });
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'eligible': return t('stallsLegendEligible');
      case 'watch': return t('stallsLegendWatch');
      case 'hurt': return t('stallsLegendHurt');
      case 'quar': return t('stallsLegendQuar');
      default: return lang === 'vi' ? 'Chuồng trống' : 'Empty';
    }
  };

  return (
    <section style={{ background: 'var(--bg-secondary)', borderBlock: '1px solid var(--line)' }}>
      <div className="wrap">
        {/* Split 1: Stalls Map */}
        <div className="split">
          <div className="art">
            <div className="stalls">
              {stalls.map((stall) => {
                let extraClass = '';
                if (stall.status === 'watch') extraClass = ' watch';
                if (stall.status === 'hurt') extraClass = ' hurt';
                if (stall.status === 'quar') extraClass = ' quar';
                if (stall.status === 'empty') extraClass = ' empty';
                const isSelected = selectedStall && selectedStall.code === stall.code;
                const horseName = lang === 'en' ? (stall.englishName || stall.horse) : stall.horse;

                return (
                  <div 
                    key={stall.code} 
                    className={`stall${extraClass}`}
                    onClick={() => setSelectedStall(stall)}
                    style={{ 
                      cursor: 'pointer', 
                      borderColor: isSelected ? 'var(--brass)' : undefined,
                      transform: isSelected ? 'scale(1.05)' : undefined,
                      transition: 'transform 0.15s, border-color 0.15s'
                    }}
                    title={`${stall.code}: ${horseName} (${getStatusLabel(stall.status)})`}
                  >
                    <i></i>
                    {stall.code}
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--brass)' }}></i>{t('stallsLegendEligible')}</span>
              <span><i style={{ background: 'var(--brass-dim)' }}></i>{t('stallsLegendWatch')}</span>
              <span><i style={{ background: 'var(--paper-dim)' }}></i>{t('stallsLegendHurt')}</span>
              <span><i style={{ background: 'var(--paper-muted)' }}></i>{t('stallsLegendQuar')}</span>
            </div>

            {selectedStall && (
              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', color: 'var(--paper)' }}>
                <b style={{ color: 'var(--brass)' }}>{t('stallsStall')} {selectedStall.code}:</b>{' '}
                {lang === 'en' ? (selectedStall.englishName || selectedStall.horse) : selectedStall.horse} —{' '}
                <span style={{ color: 'var(--paper-dim)' }}>{getStatusLabel(selectedStall.status)}</span>
              </div>
            )}
          </div>

          <div>
            <h2>{t('stallsHeading')}</h2>
            <p>{t('stallsDesc')}</p>
            <ul>
              <li>{t('stallsFeature1')}</li>
              <li>{t('stallsFeature2')}</li>
              <li>{t('stallsFeature3')}</li>
              <li>{t('stallsFeature4')}</li>
            </ul>
          </div>
        </div>

        {/* Split 2: Daily Schedule */}
        <div className="split rev">
          <div className="art">
            <div className="sched">
              {scheduleData.map((item, idx) => {
                const title = lang === 'en' ? (item.titleEn || item.title) : (item.titleVi || item.title);
                return (
                  <div key={idx} className="row">
                    <span className="t">{item.time}</span>
                    <div className={`bar ${item.barClass}`}>{title}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h2>{t('scheduleHeading')}</h2>
            <p>{t('scheduleDesc')}</p>
            <ul>
              <li>{t('scheduleFeature1')}</li>
              <li>{t('scheduleFeature2')}</li>
              <li>{t('scheduleFeature3')}</li>
              <li>{t('scheduleFeature4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
