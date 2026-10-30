import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ownersList, ownedHorsesData, settlementStatementsData, raceHistoryLogs } from '../data/financialData';
import { getRacesApi, getFinancialSettlementsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import StatementDetailModal from '../components/StatementDetailModal';
import CtaBand from '../components/CtaBand';

// Clean minimalist SVGs
const IconHorse = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19l2-7 4-1 3-5h4l-2 5 4 3-1 4-3 1-2 5-3-1-1-4z" />
  </svg>
);

const IconTrophy = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 3h16v6a8 8 0 0 1-16 0V3z" />
    <path d="M12 17v4" />
    <path d="M8 21h8" />
  </svg>
);

const IconReceipt = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="13" y2="15" />
  </svg>
);

const IconCash = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

export default function AchievementsPage({ onOpenAuth }) {
  const { t, lang } = useLanguage();
  const [selectedOwnerId, setSelectedOwnerId] = useState(() => {
    try {
      return localStorage.getItem('matruong_achievements_owner') || 'ALL';
    } catch {
      return 'ALL';
    }
  });
  useEffect(() => { localStorage.setItem('matruong_achievements_owner', selectedOwnerId); }, [selectedOwnerId]);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_achievements');
      return ['statements', 'races', 'horses'].includes(saved) ? saved : 'statements';
    } catch {
      return 'statements';
    }
  }); // 'statements' | 'races' | 'horses'
  useEffect(() => { localStorage.setItem('matruong_tab_achievements', activeTab); }, [activeTab]);
  const [statementViewMode, setStatementViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_achievements_view_mode');
      return ['cards', 'table'].includes(saved) ? saved : 'cards';
    } catch {
      return 'cards';
    }
  }); // 'cards' | 'table'
  useEffect(() => { localStorage.setItem('matruong_achievements_view_mode', statementViewMode); }, [statementViewMode]);
  const [activeStatementForModal, setActiveStatementForModal] = useState(null);
  const [statements, setStatements] = useState(settlementStatementsData);
  const [races, setRaces] = useState(raceHistoryLogs);

  // Nạp dữ liệu đối soát và giải đua từ Backend API
  useEffect(() => {
    let isMounted = true;
    getFinancialSettlementsApi().then(res => {
      if (isMounted && res.isFromBackend && Array.isArray(res.data) && res.data.length > 0) {
        setStatements(res.data);
      }
    }).catch(() => {});

    getRacesApi().then(res => {
      if (isMounted && res.isFromBackend && Array.isArray(res.data) && res.data.length > 0) {
        setRaces(res.data);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Filtered horses based on owner
  const filteredHorses = useMemo(() => {
    if (selectedOwnerId === 'ALL') return ownedHorsesData;
    const owner = ownersList.find(o => o.id === selectedOwnerId);
    if (!owner) return ownedHorsesData;
    return ownedHorsesData.filter(h => h.ownerName.includes(owner.name));
  }, [selectedOwnerId]);

  // Filtered statements
  const filteredStatements = useMemo(() => {
    if (selectedOwnerId === 'ALL') return statements;
    const owner = ownersList.find(o => o.id === selectedOwnerId);
    if (!owner) return statements;
    const ownerHorseIds = ownedHorsesData.filter(h => h.ownerName.includes(owner.name)).map(h => h.id);
    return statements.filter(s => ownerHorseIds.includes(s.horseId));
  }, [selectedOwnerId, statements]);

  // Filtered race logs
  const filteredRaces = useMemo(() => {
    if (selectedOwnerId === 'ALL') return races;
    const owner = ownersList.find(o => o.id === selectedOwnerId);
    if (!owner) return races;
    const ownerHorseIds = ownedHorsesData.filter(h => h.ownerName.includes(owner.name)).map(h => h.id);
    return races.filter(r => ownerHorseIds.includes(r.horseId));
  }, [selectedOwnerId, races]);

  // Aggregate totals
  const totalStats = useMemo(() => {
    const totalPrize = filteredHorses.reduce((sum, h) => sum + h.sharePrizeWon, 0);
    const totalExpenses = filteredHorses.reduce((sum, h) => sum + h.shareExpenses, 0);
    const netBalance = totalPrize - totalExpenses;
    return {
      horseCount: filteredHorses.length,
      totalPrize,
      totalExpenses,
      netBalance
    };
  }, [filteredHorses]);

  const formatVND = (num) => {
    if (lang === 'en') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num / 25000);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <main className="page-content achievements-page-wrapper">
      {/* Header Banner & Owner Switcher */}
      <div className="page-banner">
        <div className="wrap">
          <div className="breadcrumb">
            <Link to="/" className="bc-item">{t('home')}</Link>
            <span className="bc-sep">/</span>
            <span className="bc-item active">{t('achieveBreadcrumb')}</span>
          </div>

          <div className="banner-flex">
            <div>
              <span className="badge badge-gold">{t('achieveBadge')}</span>
              <h1 className="banner-title">{t('achieveBannerTitle')}</h1>
              <p className="banner-desc">
                {t('achieveBannerDesc')}
              </p>
            </div>

            {/* Owner Selector Dropdown */}
            <div className="owner-select-card">
              <label htmlFor="owner-dropdown">{t('achieveFilterOwnerLabel')}</label>
              <select
                id="owner-dropdown"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="owner-dropdown-select"
              >
                <option value="ALL">{t('achieveAllOwners')}</option>
                {ownersList.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.farm})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Telemetry Summary Cards */}
          <div className="financial-summary-grid">
            <div className="fin-card">
              <div className="fin-icon"><IconHorse size={20} color="var(--brass)" /></div>
              <div>
                <span className="fin-label">{lang === 'en' ? 'Owned Racehorses' : 'Ngựa thuộc sở hữu'}</span>
                <span className="fin-val">{totalStats.horseCount} {t('ofHorsesCount')}</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon gold-icon"><IconTrophy size={20} color="var(--brass)" /></div>
              <div>
                <span className="fin-label">{lang === 'en' ? 'Purses Won (Share)' : 'Thưởng giải đua (% Hưởng)'}</span>
                <span className="fin-val gold-text">{formatVND(totalStats.totalPrize)}</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon alert-icon"><IconReceipt size={20} color="var(--paper-dim)" /></div>
              <div>
                <span className="fin-label">{lang === 'en' ? 'Board & Vet (Share)' : 'Chi phí nuôi & Thú y (% Gánh)'}</span>
                <span className="fin-val alert-text">{formatVND(totalStats.totalExpenses)}</span>
              </div>
            </div>

            <div className="fin-card highlight-fin-card">
              <div className="fin-icon green-icon"><IconCash size={20} color="var(--brass)" /></div>
              <div>
                <span className="fin-label">{t('summaryNetPayout')}</span>
                <span className="fin-val green-text">{formatVND(totalStats.netBalance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <section className="achievements-section">
        <div className="wrap">
          {/* Tab Navigation */}
          <div className="section-tabs-bar">
            <button
              type="button"
              className={`sec-tab ${activeTab === 'statements' ? 'active' : ''}`}
              onClick={() => setActiveTab('statements')}
            >
              {t('achieveTabStatements')} ({filteredStatements.length})
            </button>
            <button
              type="button"
              className={`sec-tab ${activeTab === 'races' ? 'active' : ''}`}
              onClick={() => setActiveTab('races')}
            >
              {t('achieveTabRaces')} ({filteredRaces.length})
            </button>
            <button
              type="button"
              className={`sec-tab ${activeTab === 'horses' ? 'active' : ''}`}
              onClick={() => setActiveTab('horses')}
            >
              {t('achieveTabHorses')} ({filteredHorses.length})
            </button>
          </div>

          {/* TAB 1: PERIODIC STATEMENTS */}
          {activeTab === 'statements' && (
            <div className="tab-content-panel">
              <div className="panel-header-row">
                <div>
                  <h3>{lang === 'en' ? 'PERIODIC FINANCIAL AUDIT & SETTLEMENTS' : 'BẢNG ĐỐI SOÁT NGHĨA VỤ TÀI CHÍNH ĐỊNH KỲ'}</h3>
                  <p>{lang === 'en' ? '100% transparent audit of race purses, training feeds, and medical expenses.' : 'Minh bạch 100% về tiền thưởng giải đua, chi phí nuôi dưỡng và viện phí thú y theo từng tháng.'}</p>
                </div>
                <div className="panel-actions-group">
                  <div className="view-mode-pill-toggle">
                    <button
                      type="button"
                      className={`v-mode-btn ${statementViewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setStatementViewMode('cards')}
                    >
                      {lang === 'en' ? 'Cards (Recommended)' : 'Dạng Thẻ Đối Soát (Khuyên dùng)'}
                    </button>
                    <button
                      type="button"
                      className={`v-mode-btn ${statementViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setStatementViewMode('table')}
                    >
                      {lang === 'en' ? 'Compact Table' : 'Dạng Bảng Thu Gọn 100%'}
                    </button>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                    {lang === 'en' ? 'Print Statement' : 'Xuất báo cáo'}
                  </button>
                </div>
              </div>

              {statementViewMode === 'cards' ? (
                /* REDESIGNED CARDS LIST: 100% VISIBLE WITH ZERO HORIZONTAL SCROLLBAR */
                <div className="statement-cards-list">
                  {filteredStatements.map((stmt) => (
                    <div key={stmt.id} className="statement-row-card">
                      {/* Top Bar */}
                      <div className="stmt-card-top">
                        <div className="stmt-period-group">
                          <span className="stmt-period-badge">{stmt.period}</span>
                          <span className="stmt-date-text">{lang === 'en' ? 'Issued:' : 'Ngày phát hành:'} {stmt.date}</span>
                        </div>
                        
                        <div className="stmt-horse-group">
                          <strong className="stmt-horse-name">{stmt.horseName}</strong>
                          <span className="chip-code-badge">CHIP: {stmt.chipId}</span>
                        </div>

                        <div className="stmt-badges-group">
                          <span className="badge badge-gold">{lang === 'en' ? 'SHARE' : 'SỞ HỮU'} {stmt.ownershipShare}%</span>
                          {stmt.status === 'paid' ? (
                            <span className="badge badge-gold">{t('stmtPaid')}</span>
                          ) : (
                            <span className="badge badge-slate">{t('stmtPending')}</span>
                          )}
                        </div>
                      </div>

                      {/* Middle Grid */}
                      <div className="stmt-card-middle">
                        <div className="stmt-race-info">
                          <span className="info-title">{lang === 'en' ? 'RACE EVENT & RESULT:' : 'GIẢI ĐUA & THÀNH TÍCH:'}</span>
                          <div className="race-headline">{stmt.raceName}</div>
                          <div className="race-rank-pill">{stmt.raceRank}</div>
                        </div>

                        <div className="stmt-financial-breakdown-grid">
                          <div className="fin-box fin-box-prize">
                            <span className="box-label">{lang === 'en' ? `Purse Won (${stmt.ownershipShare}% Share):` : `Thưởng giải (% Hưởng ${stmt.ownershipShare}%):`}</span>
                            <span className="box-amount gold-text">+{formatVND(stmt.shareRacePrize)}</span>
                            <span className="box-sub">{lang === 'en' ? 'Total Purse:' : 'Tổng giải:'} {formatVND(stmt.totalRacePrize)}</span>
                          </div>

                          <div className="fin-box fin-box-expense">
                            <span className="box-label">{lang === 'en' ? `Expenses (${stmt.ownershipShare}% Share):` : `Chi phí (% Gánh ${stmt.ownershipShare}%):`}</span>
                            <span className="box-amount alert-text">-{formatVND(stmt.shareMonthExpense)}</span>
                            <span className="box-sub">{lang === 'en' ? 'Board' : 'Nuôi'} {formatVND(stmt.careExpense)} • {lang === 'en' ? 'Vet' : 'Y tế'} {formatVND(stmt.vetExpense)}</span>
                          </div>

                          <div className="fin-box fin-box-payout">
                            <span className="box-label">{t('summaryNetPayout')}:</span>
                            <span className="box-amount green-text">+{formatVND(stmt.netPayout)}</span>
                            <button
                              type="button"
                              className="btn-pedigree-action btn-inspect-stmt"
                              onClick={() => setActiveStatementForModal(stmt)}
                            >
                              {t('stmtViewDetail')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* STREAMLINED 5-COLUMN COMPACT TABLE: FIT 100% WIDTH WITH ZERO HORIZONTAL SCROLL */
                <div className="clean-table-container">
                  <table className="clean-compact-table">
                    <thead>
                      <tr>
                        <th style={{ width: '22%' }}>{t('stmtColCode')} & {t('colHorse')}</th>
                        <th style={{ width: '24%' }}>{t('stmtColRace')}</th>
                        <th style={{ width: '24%' }}>{lang === 'en' ? 'Cashflow (% Share)' : 'Dòng tiền (% Hưởng / % Gánh)'}</th>
                        <th style={{ width: '15%' }}>{t('stmtColNet')}</th>
                        <th style={{ width: '15%' }} className="text-right">{t('stmtColStatus')} & {t('stmtColAction')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStatements.map((stmt) => (
                        <tr key={stmt.id}>
                          <td>
                            <div className="compact-horse-cell">
                              <span className="compact-period">{stmt.period} ({stmt.date})</span>
                              <strong className="compact-name">{stmt.horseName}</strong>
                              <div className="compact-meta">
                                <code className="compact-chip">CHIP: {stmt.chipId}</code>
                                <span className="badge badge-gold mini-badge">{stmt.ownershipShare}% {lang === 'en' ? 'share' : 'sở hữu'}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="race-name-cell">
                              <strong className="compact-race">{stmt.raceName}</strong>
                              <span className="d-block gold-text font-weight-bold">{stmt.raceRank}</span>
                            </div>
                          </td>

                          <td>
                            <div className="cashflow-compact-cell">
                              <div className="cf-row gold-text">
                                <span>{lang === 'en' ? 'Purse' : 'Thưởng'} ({stmt.ownershipShare}%):</span>
                                <strong>+{formatVND(stmt.shareRacePrize)}</strong>
                              </div>
                              <div className="cf-row alert-text">
                                <span>{lang === 'en' ? 'Cost' : 'Chi phí'} ({stmt.ownershipShare}%):</span>
                                <strong>-{formatVND(stmt.shareMonthExpense)}</strong>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="payout-cell green-text">
                              <span className="payout-amount">+{formatVND(stmt.netPayout)}</span>
                            </div>
                          </td>

                          <td className="text-right">
                            <div className="compact-action-cell">
                              {stmt.status === 'paid' ? (
                                <span className="badge badge-gold">{t('stmtPaid')}</span>
                              ) : (
                                <span className="badge badge-slate">{t('stmtPending')}</span>
                              )}
                              <button
                                type="button"
                                className="btn-pedigree-action btn-sm"
                                onClick={() => setActiveStatementForModal(stmt)}
                              >
                                {lang === 'en' ? 'Audit' : 'Xem đối soát'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RACE PERFORMANCE LOGS */}
          {activeTab === 'races' && (
            <div className="tab-content-panel">
              <div className="panel-header-row">
                <div>
                  <h3>{lang === 'en' ? 'RACE RESULTS & TROPHY LOGS' : 'NHẬT KÝ THÀNH TÍCH & KỶ LỤC GIẢI ĐUA'}</h3>
                  <p>{lang === 'en' ? 'Comprehensive historical race starts, finishes, time records, and owner shares.' : 'Tổng hợp lịch sử các giải đua đã tham dự, thứ hạng, kỷ lục thời gian và tiền thưởng nhận được.'}</p>
                </div>
              </div>

              <div className="clean-table-container">
                <table className="clean-compact-table">
                  <thead>
                    <tr>
                      <th style={{ width: '12%' }}>{t('raceRecordColDate')}</th>
                      <th style={{ width: '18%' }}>{t('raceRecordColHorse')}</th>
                      <th style={{ width: '28%' }}>{t('raceRecordColName')} & {t('raceRecordColTrack')}</th>
                      <th style={{ width: '14%' }}>{t('raceRecordColResult')}</th>
                      <th style={{ width: '14%' }}>{lang === 'en' ? 'Time Record' : 'Kỷ lục thời gian'}</th>
                      <th style={{ width: '14%' }} className="text-right">{lang === 'en' ? 'Purse to Owner' : 'Tiền về chủ sở hữu'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRaces.map((race) => (
                      <tr key={race.id}>
                        <td><strong>{race.date}</strong></td>
                        <td>
                          <strong className="d-block">{race.horseName}</strong>
                          <small className="text-dim">{race.jockey}</small>
                        </td>
                        <td>
                          <strong>{race.raceName}</strong>
                          <small className="d-block text-dim">{race.track}</small>
                        </td>
                        <td>
                          <span className="badge badge-gold">{race.rankBadge}</span>
                        </td>
                        <td><code>{race.timeRecord}</code></td>
                        <td className="text-right gold-text">
                          <strong>+{formatVND(race.ownerShareAmount)}</strong>
                          <small className="d-block text-dim">{lang === 'en' ? 'Total Purse:' : 'Tổng giải:'} {formatVND(race.prizeAmount)}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: OWNED HORSES FLEET */}
          {activeTab === 'horses' && (
            <div className="tab-content-panel">
              <div className="panel-header-row">
                <div>
                  <h3>{lang === 'en' ? 'OWNED RACEHORSE SYNDICATE' : 'DANH SÁCH CHIẾN MÃ THUỘC SỞ HỮU'}</h3>
                  <p>{lang === 'en' ? 'Manage equity stakes (%), boarding fees, and net balance for each individual horse.' : 'Quản lý tỷ lệ sở hữu (%), chi phí nuôi dưỡng và số dư tài chính ròng của từng cá thể ngựa.'}</p>
                </div>
              </div>

              <div className="horses-cards-grid">
                {filteredHorses.map((horse) => (
                  <div key={horse.id} className="horse-card owned-horse-card">
                    <div className="horse-card-header">
                      <img src={horse.avatar} alt={horse.name} className="card-avatar" />
                      <div className="card-status-badge">
                        <span className="badge badge-gold">{lang === 'en' ? 'SHARE' : 'SỞ HỮU'} {horse.ownershipShare}%</span>
                      </div>
                    </div>

                    <div className="horse-card-body">
                      <div className="card-chip-bar">
                        <span className="chip-code-badge">CHIP: {horse.chipId}</span>
                        <span className="stall-code">{horse.trainer}</span>
                      </div>

                      <h3 className="card-horse-name">{lang === 'en' ? (horse.englishName || horse.name) : horse.name}</h3>
                      <div className="card-eng-name">{(horse.englishName || horse.name)} • {horse.breed}</div>

                      <div className="owned-financial-summary">
                        <div className="fin-row">
                          <span>{lang === 'en' ? 'Purses Won (Share):' : 'Tiền thưởng (% Hưởng):'}</span>
                          <strong className="gold-text">+{formatVND(horse.sharePrizeWon)}</strong>
                        </div>
                        <div className="fin-row">
                          <span>{lang === 'en' ? 'Care Expenses (Share):' : 'Chi phí nuôi dưỡng (% Gánh):'}</span>
                          <strong className="alert-text">-{formatVND(horse.shareExpenses)}</strong>
                        </div>
                        <div className="fin-row highlight-fin-row">
                          <span>{t('summaryNetPayout')}:</span>
                          <strong className="green-text">+{formatVND(horse.netProfit)}</strong>
                        </div>
                      </div>

                      <div className="card-wins-strip">
                        <strong>{lang === 'en' ? 'RECORD:' : 'THÀNH TÍCH:'}</strong> {horse.winsSummary}
                      </div>
                    </div>

                    <div className="horse-card-footer">
                      <Link to="/ho-so-ngua" className="btn btn-solid w-100">
                        {lang === 'en' ? 'View Pedigree & Full Profile' : 'Xem phả hệ & Hồ sơ chi tiết'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Itemized Audit Modal */}
      <StatementDetailModal
        statement={activeStatementForModal}
        isOpen={!!activeStatementForModal}
        onClose={() => setActiveStatementForModal(null)}
      />

      {/* CTA Band */}
      <CtaBand onOpenAuth={onOpenAuth} />
    </main>
  );
}

