import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initialStallsData } from '../data/stallsData';
import { getStablesApi, getIncidentsApi, reportIncidentApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import CtaBand from '../components/CtaBand';
import IncidentReportModal from '../components/IncidentReportModal';

// Clean Minimalist SVGs
function IconStall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  );
}

export default function StablesPage({ onOpenAuth }) {
  const { t, lang } = useLanguage();
  const [stalls, setStalls] = useState(initialStallsData);
  const [selectedZone, setSelectedZone] = useState('ALL'); // 'ALL' | 'A' | 'B'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedStallCode, setSelectedStallCode] = useState('A1');

  // Incident reporting modal state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);

  // Incidents history state
  const [incidentsList, setIncidentsList] = useState([
    {
      id: 'INC-9012',
      stallCode: 'A3',
      horseName: 'Hắc Phong',
      chipId: '982-000-348-192-003',
      symptoms: ['Ngựa bỏ ăn', 'Có dấu hiệu đau bụng / Sốt'],
      severity: 'HIGH',
      description: 'Hắc Phong bỏ 2/3 khẩu phần cỏ Alfalfa buổi trưa, thở nhanh và dậm chân liên tục. Thân nhiệt 38.8°C, nghi ngờ đau bụng nhẹ (Colic).',
      imageUrl: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Groom Nguyễn Văn Hùng',
      timestamp: '11:45 - 08/10/2026',
      status: 'pending_vet'
    },
    {
      id: 'INC-8819',
      stallCode: 'B4',
      horseName: 'Phi Vân',
      chipId: '982-000-348-192-010',
      symptoms: ['Móng bị xước / Rạn guốc'],
      severity: 'MEDIUM',
      description: 'Phát hiện vết rạn móng nhẹ ở guốc sau phải sau buổi tập trên sân cát. Đã làm sạch móng, ngâm đá & chờ Thú y kiểm tra.',
      imageUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Groom Phạm Minh Tiến',
      timestamp: '09:15 - 08/10/2026',
      status: 'in_review'
    }
  ]);

  // Nạp danh sách sự cố và chuồng từ API Backend
  useEffect(() => {
    let isMounted = true;
    getIncidentsApi().then(res => {
      if (isMounted && res.isFromBackend && Array.isArray(res.data) && res.data.length > 0) {
        setIncidentsList(res.data);
      }
    }).catch(() => {});

    getStablesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setStalls(prevStalls => {
          // Merge thông tin từ API Backend với danh sách chuồng hiện tại
          const apiStalls = res.data.map(apiStall => {
            const existing = prevStalls.find(s => s.code === apiStall.stall_code);
            const isOccupied = apiStall.status === 'OCCUPIED';
            const statusMap = {
              'OCCUPIED': 'eligible',
              'AVAILABLE': 'empty',
              'MAINTENANCE': 'quar'
            };
            return {
              code: apiStall.stall_code,
              zone: `Khu ${apiStall.block || 'A'} - Chuồng Huấn Luyện`,
              status: existing ? existing.status : (statusMap[apiStall.status] || 'eligible'),
              label: isOccupied ? (apiStall.horse || 'Đủ điều kiện') : 'Trống',
              horse: isOccupied ? apiStall.horse : '(Trống)',
              englishName: apiStall.horse,
              chipId: existing ? existing.chipId : `CHIP-${apiStall.stall_code}`,
              groom: existing ? existing.groom : 'Groom Trực Ban',
              avatar: apiStall.horse_avatar || existing?.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
              feedDiet: existing ? existing.feedDiet : '3.5kg Ngũ cốc yến mạch + 5kg Cỏ Alfalfa',
              checklist: existing ? existing.checklist : {
                feedMorning: true,
                cleanStall: true,
                iceBath: false,
                medication: false,
                feedEvening: false
              },
              dailyRoutine: existing ? existing.dailyRoutine : [
                { time: '05:30', title: 'Cho ăn sáng · Khẩu phần yến mạch', category: 'feed', done: true },
                { time: '08:00', title: 'Dọn chuồng & sát trùng', category: 'clean', done: true },
                { time: '17:30', title: 'Cho ăn chiều', category: 'feed', done: false }
              ]
            };
          });

          // Giữ lại các ô chuồng chưa có trong API
          const apiCodes = new Set(apiStalls.map(s => s.code));
          const leftovers = prevStalls.filter(s => !apiCodes.has(s.code));
          return [...apiStalls, ...leftovers];
        });
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Filtered stalls
  const filteredStalls = useMemo(() => {
    return stalls.filter((stall) => {
      if (selectedZone !== 'ALL') {
        if (selectedZone === 'A' && !stall.code.startsWith('A')) return false;
        if (selectedZone === 'B' && !stall.code.startsWith('B')) return false;
      }
      if (selectedStatusFilter !== 'ALL' && stall.status !== selectedStatusFilter) {
        return false;
      }
      return true;
    });
  }, [stalls, selectedZone, selectedStatusFilter]);

  // Selected stall object
  const activeStall = useMemo(() => {
    return stalls.find((s) => s.code === selectedStallCode) || stalls[0];
  }, [stalls, selectedStallCode]);

  // Calculate overall checklist completion percentage across all occupied stalls
  const overallProgress = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    stalls.forEach((s) => {
      if (s.status !== 'empty') {
        const cl = s.checklist || {};
        Object.keys(cl).forEach((k) => {
          totalItems++;
          if (cl[k]) completedItems++;
        });
      }
    });
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  }, [stalls]);

  // Toggle checklist item for active stall
  const handleToggleChecklist = (stallCode, itemKey) => {
    setStalls((prevStalls) =>
      prevStalls.map((s) => {
        if (s.code === stallCode) {
          const updatedChecklist = {
            ...s.checklist,
            [itemKey]: !s.checklist[itemKey]
          };
          return { ...s, checklist: updatedChecklist };
        }
        return s;
      })
    );
  };

  // Mark all checklist items complete for active stall
  const handleCompleteAllForStall = (stallCode) => {
    setStalls((prevStalls) =>
      prevStalls.map((s) => {
        if (s.code === stallCode) {
          const completeAll = {
            feedMorning: true,
            cleanStall: true,
            iceBath: true,
            medication: true,
            feedEvening: true
          };
          return { ...s, checklist: completeAll };
        }
        return s;
      })
    );
  };

  // Handle Submit New Emergency Incident Report
  const handleIncidentSubmit = (newIncident) => {
    // Lưu vào Backend API
    reportIncidentApi(newIncident).catch(() => {});

    setIncidentsList([newIncident, ...incidentsList]);

    // Automatically update the stall's status badge in the map grid if severe
    if (newIncident.severity === 'HIGH' || newIncident.severity === 'CRITICAL') {
      setStalls((prevStalls) =>
        prevStalls.map((s) => {
          if (s.code === newIncident.stallCode) {
            return {
              ...s,
              status: 'watch',
              label: `Cần theo dõi: ${newIncident.symptoms[0]}`
            };
          }
          return s;
        })
      );
    }

    // Trigger feedback Toast notification
    setToastAlert(`BÁO ĐỘNG SỰ CỐ CHUỒNG ${newIncident.stallCode}: Đã gửi thông báo tới Bác sĩ Thú y trực & HLV trưởng.`);
    setTimeout(() => {
      setToastAlert(null);
    }, 6000);
  };

  const getStatusBadge = (status, label) => {
    let displayLabel = label;
    if (lang === 'en') {
      if (status === 'eligible') displayLabel = 'Race Eligible';
      else if (status === 'watch') displayLabel = typeof label === 'string' && label.startsWith('Cần theo dõi') ? label.replace('Cần theo dõi:', 'Watchlist:') : 'Observation';
      else if (status === 'hurt') displayLabel = 'Injured';
      else if (status === 'quar') displayLabel = 'Quarantine';
      else if (status === 'empty') displayLabel = 'Vacant Stall';
    }
    switch (status) {
      case 'eligible':
        return <span className="badge badge-gold">{displayLabel}</span>;
      default:
        return <span className="badge badge-slate">{displayLabel}</span>;
    }
  };

  return (
    <main className="page-content stables-page-wrapper">
      {/* Toast Alert Popup */}
      {toastAlert && (
        <div className="emergency-toast-banner" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--brass)' }}>
          <div className="toast-content" style={{ color: 'var(--brass)' }}>
            <span>{toastAlert}</span>
          </div>
          <button type="button" className="toast-close-btn" onClick={() => setToastAlert(null)} aria-label={t('closeBtn')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="page-banner">
        <div className="wrap">
          <div className="breadcrumb">
            <Link to="/" className="bc-item">{t('stablesBreadcrumbHome')}</Link>
            <span className="bc-sep">/</span>
            <span className="bc-item active">{t('stablesBreadcrumbDetail')}</span>
          </div>

          <div className="banner-flex">
            <div>
              <span className="badge badge-gold">{t('stablesBadgeTitle')}</span>
              <h1 className="banner-title">{t('stablesBannerMainTitle')}</h1>
              <p className="banner-desc">
                {t('stablesBannerDescText')}
              </p>
            </div>

            {/* Emergency Report Action Button & Groom Progress Card */}
            <div className="banner-actions-column">
              <button
                type="button"
                className="btn btn-solid"
                onClick={() => setIsIncidentModalOpen(true)}
              >
                {t('stablesBtnReportStall')}
              </button>

              <div className="groom-progress-card">
                <div className="progress-top-row">
                  <span className="progress-title">{t('stablesGroomProgressTitle')}</span>
                  <span className="progress-percent" style={{ color: 'var(--brass)' }}>{overallProgress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${overallProgress}%`, background: 'var(--brass)' }}></div>
                </div>
                <div className="progress-sub">
                  {t('stablesGroomProgressSub')}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stall Status Telemetry Cards */}
          <div className="financial-summary-grid stall-telemetry-grid">
            <div className="fin-card">
              <div className="fin-icon gold-icon"><IconStall /></div>
              <div>
                <span className="fin-label">{t('stablesTelemetryOccupied')}</span>
                <span className="fin-val">{lang === 'en' ? '11 / 12 Stalls' : '11 / 12 Chuồng'}</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon gold-icon"><IconCheck /></div>
              <div>
                <span className="fin-label">{t('stablesTelemetryEligible')}</span>
                <span className="fin-val gold-text">{lang === 'en' ? '7 Stalls' : '7 Chuồng'}</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon slate-icon"><IconAlert /></div>
              <div>
                <span className="fin-label">{t('stablesTelemetryWatch')}</span>
                <span className="fin-val">{lang === 'en' ? '3 Stalls (A3, A5, B4)' : '3 Chuồng (A3, A5, B4)'}</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon slate-icon"><IconClipboard /></div>
              <div>
                <span className="fin-label">{t('stablesTelemetryIncidents')}</span>
                <span className="fin-val">{incidentsList.length} {lang === 'en' ? 'Incidents' : 'Ca sự cố'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Body */}
      <section className="stables-section">
        <div className="wrap">
          {/* Controls Bar: Zone Filter, Status Filter & Emergency Button */}
          <div className="stables-control-card">
            <div className="control-left">
              <span className="control-label">{t('stablesFilterZoneLabel')}</span>
              <div className="zone-pill-toggle">
                <button
                  type="button"
                  className={`zone-pill ${selectedZone === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedZone('ALL')}
                >
                  {t('stablesZoneAll')}
                </button>
                <button
                  type="button"
                  className={`zone-pill ${selectedZone === 'A' ? 'active' : ''}`}
                  onClick={() => setSelectedZone('A')}
                >
                  {t('stablesZoneA')}
                </button>
                <button
                  type="button"
                  className={`zone-pill ${selectedZone === 'B' ? 'active' : ''}`}
                  onClick={() => setSelectedZone('B')}
                >
                  {t('stablesZoneB')}
                </button>
              </div>
            </div>

            <div className="control-right">
              <label htmlFor="stall-status-filter">{t('stablesFilterStatusLabel')}</label>
              <select
                id="stall-status-filter"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">{t('stablesStatusAll')}</option>
                <option value="eligible">{t('stablesStatusEligible')}</option>
                <option value="watch">{t('stablesStatusWatch')}</option>
                <option value="hurt">{t('stablesStatusHurt')}</option>
                <option value="quar">{t('stablesStatusQuar')}</option>
                <option value="empty">{t('stablesStatusEmpty')}</option>
              </select>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsIncidentModalOpen(true)}
              >
                {t('stablesBtnEmergency')}
              </button>
            </div>
          </div>

          {/* Grid Layout: Stalls Map Grid (Left) & Active Stall Inspection (Right) */}
          <div className="stables-main-layout">
            {/* LEFT COLUMN: INTERACTIVE STALLS MAP GRID */}
            <div className="stalls-map-container">
              <div className="map-header">
                <h3>{t('stablesMapHeading')}</h3>
                <span className="map-hint">{t('stablesMapHint')}</span>
              </div>

              <div className="stalls-grid">
                {filteredStalls.map((stall) => {
                  const isSelected = stall.code === selectedStallCode;
                  const cl = stall.checklist || {};
                  const completedCount = Object.values(cl).filter(Boolean).length;
                  const totalCount = Object.keys(cl).length;
                  const stallIncidents = incidentsList.filter(inc => inc.stallCode === stall.code);
                  const horseDisplayName = (lang === 'en' && stall.englishName) ? stall.englishName : stall.horse;

                  return (
                    <div
                      key={stall.code}
                      className={`stall-card-item stall-${stall.status} ${isSelected ? 'stall-selected' : ''}`}
                      onClick={() => setSelectedStallCode(stall.code)}
                    >
                      <div className="stall-card-top">
                        <span className="stall-code-badge">{stall.code}</span>
                        {getStatusBadge(stall.status, stall.label)}
                      </div>

                      <div className="stall-card-middle">
                        <img src={stall.avatar} alt={horseDisplayName} className="stall-mini-avatar" />
                        <div>
                          <h4 className="stall-horse-name">{horseDisplayName}</h4>
                          <span className="stall-chip-text">{stall.chipId}</span>
                        </div>
                      </div>

                      <div className="stall-card-bottom">
                        <span className="groom-tag">{stall.groom.split(' ')[0]}</span>
                        {stallIncidents.length > 0 ? (
                          <span className="incident-badge-mini" style={{ color: 'var(--brass)' }}>
                            {stallIncidents.length} {t('stablesStallIncidentsCount')}
                          </span>
                        ) : (
                          stall.status !== 'empty' && (
                            <span className="checklist-mini-count">
                              Checklist: {completedCount}/{totalCount}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE STALL INSPECTION & GROOM CHECKLIST */}
            <div className="active-stall-inspection-panel">
              {/* Header Box of Selected Stall */}
              <div className="inspection-header">
                <div className="insp-top-row">
                  <span className="insp-code">{t('stablesStallLabelPrefix')} {activeStall.code}</span>
                  <div className="insp-status-actions">
                    {getStatusBadge(activeStall.status, activeStall.label)}
                    <button
                      type="button"
                      className="btn-report-this-stall"
                      onClick={() => setIsIncidentModalOpen(true)}
                    >
                      {lang === 'en' ? `Report Stall ${activeStall.code}` : `Báo sự cố chuồng ${activeStall.code}`}
                    </button>
                  </div>
                </div>

                <div className="insp-horse-row">
                  <img src={activeStall.avatar} alt={activeStall.horse} className="insp-avatar" />
                  <div>
                    <h2 className="insp-horse-name">{(lang === 'en' && activeStall.englishName) ? activeStall.englishName : activeStall.horse}</h2>
                    {activeStall.englishName && <span className="insp-eng-name">{activeStall.englishName}</span>}
                    <div className="insp-chip">{t('stablesRfidChip')} <code>{activeStall.chipId}</code></div>
                  </div>
                </div>

                <div className="insp-meta-strip">
                  <div><strong>{t('stablesZoneLabel')}</strong> {activeStall.zone}</div>
                  <div><strong>{t('stablesGroomLabel')}</strong> {activeStall.groom}</div>
                </div>
              </div>

              {activeStall.status === 'empty' ? (
                <div className="empty-stall-notice">
                  <h3>{t('stablesEmptyTitle')} ({activeStall.code})</h3>
                  <p>{t('stablesEmptyDesc')}</p>
                </div>
              ) : (
                <>
                  {/* Feed & Diet Specification Box */}
                  <div className="diet-spec-card">
                    <div className="diet-title">{t('stablesDietTitle')}</div>
                    <p className="diet-content">{activeStall.feedDiet}</p>
                  </div>

                  {/* GROOM'S DAILY CHECKLIST (INTERACTIVE TICK) */}
                  <div className="groom-checklist-card">
                    <div className="checklist-card-header">
                      <div>
                        <h3>{t('stablesChecklistCardTitle')}</h3>
                        <p>{t('stablesChecklistCardDesc')} {activeStall.code}.</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-solid btn-sm"
                        onClick={() => handleCompleteAllForStall(activeStall.code)}
                      >
                        {t('stablesBtnCheckAll')}
                      </button>
                    </div>

                    <div className="checklist-items-list">
                      {/* 1. Feed Morning */}
                      <label className={`checklist-item-row ${activeStall.checklist?.feedMorning ? 'checked-row' : ''}`}>
                        <input
                          type="checkbox"
                          checked={!!activeStall.checklist?.feedMorning}
                          onChange={() => handleToggleChecklist(activeStall.code, 'feedMorning')}
                          className="checklist-checkbox"
                        />
                        <span className="checkbox-custom"></span>
                        <div className="item-text-group">
                          <strong>{lang === 'en' ? 'Morning Feeding (05:30)' : 'Cho ăn sáng (05:30)'}</strong>
                          <small>{lang === 'en' ? 'Grain ration, Alfalfa hay & electrolytes' : 'Khẩu phần ngũ cốc, cỏ Alfalfa & điện giải'}</small>
                        </div>
                      </label>

                      {/* 2. Clean Stall */}
                      <label className={`checklist-item-row ${activeStall.checklist?.cleanStall ? 'checked-row' : ''}`}>
                        <input
                          type="checkbox"
                          checked={!!activeStall.checklist?.cleanStall}
                          onChange={() => handleToggleChecklist(activeStall.code, 'cleanStall')}
                          className="checklist-checkbox"
                        />
                        <span className="checkbox-custom"></span>
                        <div className="item-text-group">
                          <strong>{lang === 'en' ? 'Stall Cleaning & Bedding' : 'Dọn vệ sinh & Rải đệm chuồng'}</strong>
                          <small>{lang === 'en' ? `Clean old bedding, disinfect stall ${activeStall.code}` : `Thu dọn rơm cũ, lau vách & sát trùng chuồng ${activeStall.code}`}</small>
                        </div>
                      </label>

                      {/* 3. Ice Bath & Grooming */}
                      <label className={`checklist-item-row ${activeStall.checklist?.iceBath ? 'checked-row' : ''}`}>
                        <input
                          type="checkbox"
                          checked={!!activeStall.checklist?.iceBath}
                          onChange={() => handleToggleChecklist(activeStall.code, 'iceBath')}
                          className="checklist-checkbox"
                        />
                        <span className="checkbox-custom"></span>
                        <div className="item-text-group">
                          <strong>{lang === 'en' ? 'Ice Bath & Grooming (08:00)' : 'Ngâm chân nước đá & Tắm rửa (08:00)'}</strong>
                          <small>{lang === 'en' ? 'Cool down wash, brush tail & 20-min ice leg soak' : 'Tắm mát sau buổi tập, chải lông đuôi & ngâm chân đá 20 phút'}</small>
                        </div>
                      </label>

                      {/* 4. Medication & Vitamin */}
                      <label className={`checklist-item-row ${activeStall.checklist?.medication ? 'checked-row' : ''}`}>
                        <input
                          type="checkbox"
                          checked={!!activeStall.checklist?.medication}
                          onChange={() => handleToggleChecklist(activeStall.code, 'medication')}
                          className="checklist-checkbox"
                        />
                        <span className="checkbox-custom"></span>
                        <div className="item-text-group">
                          <strong>{lang === 'en' ? 'Vitamins & Vet Prescriptions' : 'Uống Vitamin / Thuốc theo đơn thú y'}</strong>
                          <small>{lang === 'en' ? 'Inspect hooves, mineral balm & dietary supplements' : 'Kiểm tra móng, bôi khoáng & bổ sung vi chất dinh dưỡng'}</small>
                        </div>
                      </label>

                      {/* 5. Feed Evening */}
                      <label className={`checklist-item-row ${activeStall.checklist?.feedEvening ? 'checked-row' : ''}`}>
                        <input
                          type="checkbox"
                          checked={!!activeStall.checklist?.feedEvening}
                          onChange={() => handleToggleChecklist(activeStall.code, 'feedEvening')}
                          className="checklist-checkbox"
                        />
                        <span className="checkbox-custom"></span>
                        <div className="item-text-group">
                          <strong>{lang === 'en' ? 'Evening Feed & Lock Inspection (17:30)' : 'Cho ăn chiều & Kiểm tra tổng thể (17:30)'}</strong>
                          <small>{lang === 'en' ? 'Add hay, inspect stall door & latch security' : 'Bổ sung cỏ khô, kiểm tra cửa chuồng & chốt khóa an toàn'}</small>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* DAILY ROUTINE TIMELINE */}
                  <div className="daily-routine-card">
                    <div className="routine-header">
                      <h3>{t('stablesRoutineTitle')} ({(lang === 'en' && activeStall.englishName) ? activeStall.englishName : activeStall.horse})</h3>
                    </div>

                    <div className="timeline-list">
                      {activeStall.dailyRoutine?.map((item, idx) => (
                        <div key={idx} className={`timeline-item ${item.done ? 'timeline-done' : ''}`}>
                          <div className="timeline-time">{item.time}</div>
                          <div className="timeline-dot-connector">
                            <span className="t-dot" style={{ background: item.done ? 'var(--brass)' : 'var(--line-strong)' }}></span>
                          </div>
                          <div className="timeline-content">
                            <span className="t-title">{item.title}</span>
                            {item.done ? (
                              <span className="t-status done" style={{ color: 'var(--brass)' }}>{t('stablesRoutineDone')}</span>
                            ) : (
                              <span className="t-status pending" style={{ color: 'var(--paper-dim)' }}>{t('stablesRoutinePending')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DEDICATED SECTION: INCIDENTS LOG & EMERGENCY REPORT GALLERY */}
          <div className="incidents-history-section">
            <div className="incidents-section-header">
              <div>
                <span className="badge badge-slate">{t('stablesIncidentsHeaderBadge')}</span>
                <h2>{t('stablesIncidentsHeaderTitle')}</h2>
                <p>{t('stablesIncidentsHeaderDesc')}</p>
              </div>

              <button
                type="button"
                className="btn btn-solid"
                onClick={() => setIsIncidentModalOpen(true)}
              >
                {t('stablesBtnNewIncident')}
              </button>
            </div>

            <div className="incidents-cards-grid">
              {incidentsList.map((inc) => (
                <div key={inc.id} className="incident-card" style={{ border: '1px solid var(--line)', background: 'var(--bg-secondary)' }}>
                  <div className="incident-card-top">
                    <div className="inc-stall-tag">
                      <span className="inc-code" style={{ color: 'var(--brass)' }}>{t('stablesStallLabelPrefix')} {inc.stallCode}</span>
                      <span className="inc-horse-name">{inc.horseName}</span>
                    </div>
                    <span className="badge badge-slate">
                      {lang === 'en'
                        ? (inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? 'CRITICAL EMERGENCY' : 'URGENT')
                        : (inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? 'RẤT KHẨN CẤP' : 'KHẨN CẤP')}
                    </span>
                  </div>

                  <div className="incident-card-body">
                    <div className="inc-symptoms-list">
                      {inc.symptoms.map((sym, sIdx) => (
                        <span key={sIdx} className="symptom-tag-pill" style={{ background: 'var(--line)', color: 'var(--paper)' }}>{sym}</span>
                      ))}
                    </div>

                    <p className="inc-description">{inc.description}</p>

                    {inc.imageUrl && (
                      <div className="inc-image-frame">
                        <img src={inc.imageUrl} alt="Ảnh thực tế sự cố tại chuồng" className="inc-actual-photo" />
                        <span className="inc-image-caption">{t('stablesActualPhotoCaption')}</span>
                      </div>
                    )}
                  </div>

                  <div className="incident-card-footer">
                    <div className="inc-meta-info">
                      <span className="inc-reporter">{inc.reportedBy}</span>
                      <span className="inc-time">{inc.timestamp}</span>
                    </div>

                    <span className="inc-status-tag" style={{ color: 'var(--paper-dim)' }}>
                      {t('stablesWaitingVet')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EMERGENCY INCIDENT REPORT MODAL */}
      <IncidentReportModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        activeStall={activeStall}
        stallsList={stalls}
        onSubmitIncident={handleIncidentSubmit}
      />

      {/* CTA Band */}
      <CtaBand onOpenAuth={onOpenAuth} />
    </main>
  );
}
