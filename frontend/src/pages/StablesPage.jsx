import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { initialStallsData } from '../data/stallsData';
import CtaBand from '../components/CtaBand';

export default function StablesPage({ onOpenAuth }) {
  const [stalls, setStalls] = useState(initialStallsData);
  const [selectedZone, setSelectedZone] = useState('ALL'); // 'ALL' | 'A' | 'B'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedStallCode, setSelectedStallCode] = useState('A1');

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

  const getStatusBadge = (status, label) => {
    switch (status) {
      case 'eligible':
        return <span className="badge badge-ok">✓ {label}</span>;
      case 'watch':
        return <span className="badge badge-warn">⚠️ {label}</span>;
      case 'hurt':
        return <span className="badge badge-alert">🚑 {label}</span>;
      case 'quar':
        return <span className="badge badge-quar">☣️ {label}</span>;
      case 'empty':
        return <span className="badge badge-empty">⚪ {label}</span>;
      default:
        return <span className="badge">{label}</span>;
    }
  };

  return (
    <main className="page-content stables-page-wrapper">
      {/* Header Banner */}
      <div className="page-banner">
        <div className="wrap">
          <div className="breadcrumb">
            <Link to="/" className="bc-item">Trang chủ</Link>
            <span className="bc-sep">/</span>
            <span className="bc-item active">Sơ đồ chuồng trại & Checklist Groom</span>
          </div>

          <div className="banner-flex">
            <div>
              <span className="badge badge-gold">FLOW 04 • QUẢN LÝ CHUỒNG TRẠI & GROOM</span>
              <h1 className="banner-title">SƠ ĐỒ CHUỒNG & CHECKLIST HẰNG NGÀY</h1>
              <p className="banner-desc">
                Phân bổ vị trí 12 ô chuồng (A1-A6, B1-B6), theo dõi khẩu phần ăn, lịch ngâm đá và <strong>tick hoàn thành checklist công việc của Groom</strong> trực tiếp.
              </p>
            </div>

            {/* Overall Groom Progress Widget */}
            <div className="groom-progress-card">
              <div className="progress-top-row">
                <span className="progress-title">⚡ TIẾN ĐỘ CHECKLIST GROOM HÔM NAY</span>
                <span className="progress-percent">{overallProgress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
              </div>
              <div className="progress-sub">
                Đã hoàn thành kiểm tra vệ sinh, ngâm đá & cho ăn toàn khu chuồng trại.
              </div>
            </div>
          </div>

          {/* Quick Stall Status Telemetry Cards */}
          <div className="financial-summary-grid stall-telemetry-grid">
            <div className="fin-card">
              <div className="fin-icon green-icon">🏠</div>
              <div>
                <span className="fin-label">Chuồng đang sử dụng</span>
                <span className="fin-val">11 / 12 Chuồng</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon gold-icon">✓</div>
              <div>
                <span className="fin-label">Chiến mã đủ điều kiện</span>
                <span className="fin-val gold-text">7 Chuồng</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon alert-icon">⚠️</div>
              <div>
                <span className="fin-label">Cần theo dõi & Y tế</span>
                <span className="fin-val alert-text">3 Chuồng (A3, A5, B4)</span>
              </div>
            </div>

            <div className="fin-card">
              <div className="fin-icon quar-icon">☣️</div>
              <div>
                <span className="fin-label">Chuồng cách ly</span>
                <span className="fin-val quar-text">1 Chuồng (B2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Body */}
      <section className="stables-section">
        <div className="wrap">
          {/* Controls Bar: Zone Filter & Status Filter */}
          <div className="stables-control-card">
            <div className="control-left">
              <span className="control-label">Lọc Khu Chuồng:</span>
              <div className="zone-pill-toggle">
                <button
                  type="button"
                  className={`zone-pill ${selectedZone === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedZone('ALL')}
                >
                  Tất cả (12 Chuồng)
                </button>
                <button
                  type="button"
                  className={`zone-pill ${selectedZone === 'A' ? 'active' : ''}`}
                  onClick={() => setSelectedZone('A')}
                >
                  Khu A (A1 - A6)
                </button>
                <button
                  type="button"
                  className={`zone-pill ${selectedZone === 'B' ? 'active' : ''}`}
                  onClick={() => setSelectedZone('B')}
                >
                  Khu B (B1 - B6)
                </button>
              </div>
            </div>

            <div className="control-right">
              <label htmlFor="stall-status-filter">Lọc Trạng Thái:</label>
              <select
                id="stall-status-filter"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="eligible">Đủ điều kiện thi đấu</option>
                <option value="watch">Cần theo dõi</option>
                <option value="hurt">Chấn thương</option>
                <option value="quar">Cách ly</option>
                <option value="empty">Chuồng trống</option>
              </select>
            </div>
          </div>

          {/* Grid Layout: Stalls Map Grid (Left) & Active Stall Checklist & Routine (Right) */}
          <div className="stables-main-layout">
            {/* LEFT COLUMN: INTERACTIVE STALLS MAP GRID */}
            <div className="stalls-map-container">
              <div className="map-header">
                <h3>SƠ ĐỒ VỊ TRÍ CHUỒNG TRẠI (A1 - A6, B1 - B6)</h3>
                <span className="map-hint">💡 Bấm chọn ô chuồng để xem lịch trình & tick checklist</span>
              </div>

              <div className="stalls-grid">
                {filteredStalls.map((stall) => {
                  const isSelected = stall.code === selectedStallCode;
                  const cl = stall.checklist || {};
                  const completedCount = Object.values(cl).filter(Boolean).length;
                  const totalCount = Object.keys(cl).length;

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
                        <img src={stall.avatar} alt={stall.horse} className="stall-mini-avatar" />
                        <div>
                          <h4 className="stall-horse-name">{stall.horse}</h4>
                          <span className="stall-chip-text">{stall.chipId}</span>
                        </div>
                      </div>

                      <div className="stall-card-bottom">
                        <span className="groom-tag">👤 {stall.groom.split(' ')[0]}</span>
                        {stall.status !== 'empty' && (
                          <span className="checklist-mini-count">
                            Checklist: {completedCount}/{totalCount}
                          </span>
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
                  <span className="insp-code">CHUỒNG {activeStall.code}</span>
                  {getStatusBadge(activeStall.status, activeStall.label)}
                </div>

                <div className="insp-horse-row">
                  <img src={activeStall.avatar} alt={activeStall.horse} className="insp-avatar" />
                  <div>
                    <h2 className="insp-horse-name">{activeStall.horse}</h2>
                    <span className="insp-eng-name">{activeStall.englishName}</span>
                    <div className="insp-chip">MÃ CHIP RFID: <code>{activeStall.chipId}</code></div>
                  </div>
                </div>

                <div className="insp-meta-strip">
                  <div><strong>Khu vực:</strong> {activeStall.zone}</div>
                  <div><strong>Người chăm sóc (Groom):</strong> {activeStall.groom}</div>
                </div>
              </div>

              {activeStall.status === 'empty' ? (
                <div className="empty-stall-notice">
                  <div className="notice-icon">⚪</div>
                  <h3>CHUỒNG TRỐNG (B6)</h3>
                  <p>Hiện chưa phân bổ chiến mã vào ô chuồng này. Đã hoàn thành dọn dẹp khử trùng định kỳ.</p>
                </div>
              ) : (
                <>
                  {/* Feed & Diet Specification Box */}
                  <div className="diet-spec-card">
                    <div className="diet-title">🥣 KHẨU PHẦN ĂN & DINH DƯỠNG TRONG NGÀY</div>
                    <p className="diet-content">{activeStall.feedDiet}</p>
                  </div>

                  {/* GROOM'S DAILY CHECKLIST (INTERACTIVE TICK) */}
                  <div className="groom-checklist-card">
                    <div className="checklist-card-header">
                      <div>
                        <h3>📋 CHECKLIST CÔNG VIỆC CỦA GROOM (TICK HOÀN THÀNH)</h3>
                        <p>Đánh dấu các công việc chăm sóc đã thực hiện cho chuồng {activeStall.code}.</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-solid btn-sm"
                        onClick={() => handleCompleteAllForStall(activeStall.code)}
                      >
                        ✓ Tick tất cả
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
                          <strong>🥣 Cho ăn sáng (05:30)</strong>
                          <small>Khẩu phần ngũ cốc, cỏ Alfalfa & điện giải</small>
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
                          <strong>🧹 Dọn vệ sinh & Rải đệm chuồng</strong>
                          <small>Thu dọn rơm cũ, lau vách & sát trùng chuồng {activeStall.code}</small>
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
                          <strong>🧊 Ngâm chân nước đá & Tắm rửa (08:00)</strong>
                          <small>Tắm mát sau buổi tập, chải lông đuôi & ngâm chân đá 20 phút</small>
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
                          <strong>💊 Uống Vitamin / Thuốc theo đơn thú y</strong>
                          <small>Kiểm tra móng, bôi khoáng & bổ sung vi chất dinh dưỡng</small>
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
                          <strong>🥣 Cho ăn chiều & Kiểm tra tổng thể (17:30)</strong>
                          <small>Bổ sung cỏ khô, kiểm tra cửa chuồng & chốt khóa an toàn</small>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* DAILY ROUTINE TIMELINE */}
                  <div className="daily-routine-card">
                    <div className="routine-header">
                      <h3>⏰ LỊCH TRÌNH SINH HOẠT HẰNG NGÀY ({activeStall.horse})</h3>
                    </div>

                    <div className="timeline-list">
                      {activeStall.dailyRoutine?.map((item, idx) => (
                        <div key={idx} className={`timeline-item ${item.done ? 'timeline-done' : ''}`}>
                          <div className="timeline-time">{item.time}</div>
                          <div className="timeline-dot-connector">
                            <span className="t-dot"></span>
                          </div>
                          <div className="timeline-content">
                            <span className="t-title">{item.title}</span>
                            {item.done ? (
                              <span className="t-status done">✓ Đã hoàn thành</span>
                            ) : (
                              <span className="t-status pending">⏳ Đang chờ thực hiện</span>
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
        </div>
      </section>

      {/* CTA Band */}
      <CtaBand onOpenAuth={onOpenAuth} />
    </main>
  );
}
