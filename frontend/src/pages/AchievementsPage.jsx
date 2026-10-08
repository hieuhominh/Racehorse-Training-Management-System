import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ownersList, ownedHorsesData, settlementStatementsData, raceHistoryLogs } from '../data/financialData';
import StatementDetailModal from '../components/StatementDetailModal';
import CtaBand from '../components/CtaBand';

export default function AchievementsPage({ onOpenAuth }) {
  const [selectedOwnerId, setSelectedOwnerId] = useState('ALL');
  const [activeTab, setActiveTab] = useState('statements'); // 'statements' | 'races' | 'horses'
  const [statementViewMode, setStatementViewMode] = useState('cards'); // 'cards' | 'table'
  const [activeStatementForModal, setActiveStatementForModal] = useState(null);

  // Filtered horses based on owner
  const filteredHorses = useMemo(() => {
    if (selectedOwnerId === 'ALL') return ownedHorsesData;
    const owner = ownersList.find(o => o.id === selectedOwnerId);
    if (!owner) return ownedHorsesData;
    return ownedHorsesData.filter(h => h.ownerName.includes(owner.name));
  }, [selectedOwnerId]);

  // Filtered statements
  const filteredStatements = useMemo(() => {
    if (selectedOwnerId === 'ALL') return settlementStatementsData;
    const owner = ownersList.find(o => o.id === selectedOwnerId);
    if (!owner) return settlementStatementsData;
    const ownerHorseIds = ownedHorsesData.filter(h => h.ownerName.includes(owner.name)).map(h => h.id);
    return settlementStatementsData.filter(s => ownerHorseIds.includes(s.horseId));
  }, [selectedOwnerId]);

  // Filtered race logs
  const filteredRaces = useMemo(() => {
    if (selectedOwnerId === 'ALL') return raceHistoryLogs;
    const owner = ownersList.find(o => o.id === selectedOwnerId);
    if (!owner) return raceHistoryLogs;
    const ownerHorseIds = ownedHorsesData.filter(h => h.ownerName.includes(owner.name)).map(h => h.id);
    return raceHistoryLogs.filter(r => ownerHorseIds.includes(r.horseId));
  }, [selectedOwnerId]);

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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <main className="page-content achievements-page-wrapper">
      {/* Header Banner & Owner Switcher */}
      <div className="page-banner">
        <div className="wrap">
          <div className="breadcrumb">
            <Link to="/" className="bc-item">Trang chủ</Link>
            <span className="bc-sep">/</span>
            <span className="bc-item active">Lịch sử thành tích & Đối soát tài chính</span>
          </div>

          <div className="banner-flex">
            <div>
              <span className="badge badge-gold">MINH BẠCH TÀI CHÍNH MÃ TRƯỜNG</span>
              <h1 className="banner-title">LỊCH SỬ THÀNH TÍCH & ĐỐI SOÁT CHỦ SỞ HỮU</h1>
              <p className="banner-desc">
                Theo dõi chi tiết ngựa thuộc sở hữu, đối soát định kỳ chi phí nuôi dưỡng, viện phí thú y và <strong>phần trăm tiền thưởng giải đua</strong> theo tỉ lệ sở hữu minh bạch.
              </p>
            </div>

            {/* Owner Selector Dropdown */}
            <div className="owner-select-card">
              <label htmlFor="owner-dropdown">👤 Chọn hồ sơ chủ sở hữu:</label>
              <select
                id="owner-dropdown"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="owner-dropdown-select"
              >
                <option value="ALL">🏢 Tất cả chủ sở hữu (Tổng quan)</option>
                {ownersList.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.avatar} {owner.name} ({owner.farm})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Telemetry Summary Cards */}
          <div className="financial-summary-grid">
            <div className="fin-card">
              <div className="fin-icon">🏇</div>
              <div>
                <span className="fin-label">Ngựa thuộc sở hữu</span>
                <span className="fin-val">{totalStats.horseCount} chiến mã</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon gold-icon">🏆</div>
              <div>
                <span className="fin-label">Thưởng giải đua (% Hưởng)</span>
                <span className="fin-val gold-text">{formatVND(totalStats.totalPrize)}</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon alert-icon">🧾</div>
              <div>
                <span className="fin-label">Chi phí nuôi & Thú y (% Gánh)</span>
                <span className="fin-val alert-text">{formatVND(totalStats.totalExpenses)}</span>
              </div>
            </div>

            <div className="fin-card highlight-fin-card">
              <div className="fin-icon green-icon">💰</div>
              <div>
                <span className="fin-label">Số dư ròng thực nhận</span>
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
              📋 Bản Đối Soát Tài Chính Định Kỳ ({filteredStatements.length})
            </button>
            <button
              type="button"
              className={`sec-tab ${activeTab === 'races' ? 'active' : ''}`}
              onClick={() => setActiveTab('races')}
            >
              🏆 Kỷ Lục & Thành Tích Giải Đua ({filteredRaces.length})
            </button>
            <button
              type="button"
              className={`sec-tab ${activeTab === 'horses' ? 'active' : ''}`}
              onClick={() => setActiveTab('horses')}
            >
              🐎 Ngựa Thuộc Sở Hữu & Tỉ Lệ (%) ({filteredHorses.length})
            </button>
          </div>

          {/* TAB 1: PERIODIC STATEMENTS */}
          {activeTab === 'statements' && (
            <div className="tab-content-panel">
              <div className="panel-header-row">
                <div>
                  <h3>BẢNG ĐỐI SOÁT NGHĨA VỤ TÀI CHÍNH ĐỊNH KỲ</h3>
                  <p>Minh bạch 100% về tiền thưởng giải đua, chi phí nuôi dưỡng và viện phí thú y theo từng tháng.</p>
                </div>
                <div className="panel-actions-group">
                  <div className="view-mode-pill-toggle">
                    <button
                      type="button"
                      className={`v-mode-btn ${statementViewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setStatementViewMode('cards')}
                    >
                      💳 Dạng Thẻ Đối Soát (Khuyên dùng)
                    </button>
                    <button
                      type="button"
                      className={`v-mode-btn ${statementViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setStatementViewMode('table')}
                    >
                      📊 Dạng Bảng Thu Gọn 100%
                    </button>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                    🖨️ Xuất báo cáo
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
                          <span className="stmt-period-badge">📅 {stmt.period}</span>
                          <span className="stmt-date-text">Ngày phát hành: {stmt.date}</span>
                        </div>
                        
                        <div className="stmt-horse-group">
                          <strong className="stmt-horse-name">{stmt.horseName}</strong>
                          <span className="chip-code-badge">CHIP: {stmt.chipId}</span>
                        </div>

                        <div className="stmt-badges-group">
                          <span className="badge badge-gold">SỞ HỮU {stmt.ownershipShare}%</span>
                          {stmt.status === 'paid' ? (
                            <span className="badge badge-ok">✓ {stmt.statusLabel}</span>
                          ) : (
                            <span className="badge badge-warn">⏳ {stmt.statusLabel}</span>
                          )}
                        </div>
                      </div>

                      {/* Middle Grid */}
                      <div className="stmt-card-middle">
                        <div className="stmt-race-info">
                          <span className="info-title">🏆 GIẢI ĐUA & THÀNH TÍCH:</span>
                          <div className="race-headline">{stmt.raceName}</div>
                          <div className="race-rank-pill">{stmt.raceRank}</div>
                        </div>

                        <div className="stmt-financial-breakdown-grid">
                          <div className="fin-box fin-box-prize">
                            <span className="box-label">🏆 Thưởng giải (% Hưởng {stmt.ownershipShare}%):</span>
                            <span className="box-amount gold-text">+{formatVND(stmt.shareRacePrize)}</span>
                            <span className="box-sub">Tổng giải: {formatVND(stmt.totalRacePrize)}</span>
                          </div>

                          <div className="fin-box fin-box-expense">
                            <span className="box-label">🧾 Chi phí (% Gánh {stmt.ownershipShare}%):</span>
                            <span className="box-amount alert-text">-{formatVND(stmt.shareMonthExpense)}</span>
                            <span className="box-sub">Nuôi {formatVND(stmt.careExpense)} • Y tế {formatVND(stmt.vetExpense)}</span>
                          </div>

                          <div className="fin-box fin-box-payout">
                            <span className="box-label">💰 SỐ DƯ RÒNG THỰC NHẬN:</span>
                            <span className="box-amount green-text">+{formatVND(stmt.netPayout)}</span>
                            <button
                              type="button"
                              className="btn-pedigree-action btn-inspect-stmt"
                              onClick={() => setActiveStatementForModal(stmt)}
                            >
                              🔍 Xem chi tiết hóa đơn & đối soát
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
                        <th style={{ width: '22%' }}>Kỳ đối soát & Chiến mã</th>
                        <th style={{ width: '24%' }}>Giải đua & Thành tích</th>
                        <th style={{ width: '24%' }}>Dòng tiền (% Hưởng / % Gánh)</th>
                        <th style={{ width: '15%' }}>Thực nhận ròng</th>
                        <th style={{ width: '15%' }} className="text-right">Trạng thái & Thao tác</th>
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
                                <span className="badge badge-gold mini-badge">{stmt.ownershipShare}% sở hữu</span>
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
                                <span>🏆 Thưởng ({stmt.ownershipShare}%):</span>
                                <strong>+{formatVND(stmt.shareRacePrize)}</strong>
                              </div>
                              <div className="cf-row alert-text">
                                <span>🧾 Chi phí ({stmt.ownershipShare}%):</span>
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
                                <span className="badge badge-ok">✓ Đã thanh toán</span>
                              ) : (
                                <span className="badge badge-warn">⏳ Đang chờ xác nhận</span>
                              )}
                              <button
                                type="button"
                                className="btn-pedigree-action btn-sm"
                                onClick={() => setActiveStatementForModal(stmt)}
                              >
                                🔍 Xem đối soát
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
                  <h3>NHẬT KÝ THÀNH TÍCH & KỶ LỤC GIẢI ĐUA</h3>
                  <p>Tổng hợp lịch sử các giải đua đã tham dự, thứ hạng, kỷ lục thời gian và tiền thưởng nhận được.</p>
                </div>
              </div>

              <div className="clean-table-container">
                <table className="clean-compact-table">
                  <thead>
                    <tr>
                      <th style={{ width: '12%' }}>Ngày đua</th>
                      <th style={{ width: '18%' }}>Chiến mã</th>
                      <th style={{ width: '28%' }}>Giải đua & Mặt sân</th>
                      <th style={{ width: '14%' }}>Thứ hạng</th>
                      <th style={{ width: '14%' }}>Kỷ lục thời gian</th>
                      <th style={{ width: '14%' }} className="text-right">Tiền về chủ sở hữu</th>
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
                          <small className="d-block text-dim">Tổng giải: {formatVND(race.prizeAmount)}</small>
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
                  <h3>DANH SÁCH CHIẾN MÃ THUỘC SỞ HỮU</h3>
                  <p>Quản lý tỷ lệ sở hữu (%), chi phí nuôi dưỡng và số dư tài chính ròng của từng cá thể ngựa.</p>
                </div>
              </div>

              <div className="horses-cards-grid">
                {filteredHorses.map((horse) => (
                  <div key={horse.id} className="horse-card owned-horse-card">
                    <div className="horse-card-header">
                      <img src={horse.avatar} alt={horse.name} className="card-avatar" />
                      <div className="card-status-badge">
                        <span className="badge badge-gold">SỞ HỮU {horse.ownershipShare}%</span>
                      </div>
                    </div>

                    <div className="horse-card-body">
                      <div className="card-chip-bar">
                        <span className="chip-code-badge">CHIP: {horse.chipId}</span>
                        <span className="stall-code">{horse.trainer}</span>
                      </div>

                      <h3 className="card-horse-name">{horse.name}</h3>
                      <div className="card-eng-name">{horse.englishName} • {horse.breed}</div>

                      <div className="owned-financial-summary">
                        <div className="fin-row">
                          <span>🏆 Tiền thưởng (% Hưởng):</span>
                          <strong className="gold-text">+{formatVND(horse.sharePrizeWon)}</strong>
                        </div>
                        <div className="fin-row">
                          <span>🧾 Chi phí nuôi dưỡng (% Gánh):</span>
                          <strong className="alert-text">-{formatVND(horse.shareExpenses)}</strong>
                        </div>
                        <div className="fin-row highlight-fin-row">
                          <span>💰 Số dư ròng thực nhận:</span>
                          <strong className="green-text">+{formatVND(horse.netProfit)}</strong>
                        </div>
                      </div>

                      <div className="card-wins-strip">
                        <strong>THÀNH TÍCH:</strong> {horse.winsSummary}
                      </div>
                    </div>

                    <div className="horse-card-footer">
                      <Link to="/ho-so-ngua" className="btn btn-solid w-100">
                        🌳 Xem phả hệ & Hồ sơ chi tiết
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
