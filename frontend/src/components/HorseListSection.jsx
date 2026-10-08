import React, { useState, useMemo } from 'react';
import { initialHorsesData } from '../data/horsesData';
import PedigreeModal from './PedigreeModal';

export default function HorseListSection() {
  const [horses] = useState(initialHorsesData);
  const [searchChip, setSearchChip] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [activeHorseForPedigree, setActiveHorseForPedigree] = useState(null);
  const [detailModalHorse, setDetailModalHorse] = useState(null);

  // Filter logic
  const filteredHorses = useMemo(() => {
    return horses.filter((horse) => {
      // 1. Chip ID filter
      if (searchChip.trim() !== '') {
        const cleanChipSearch = searchChip.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanHorseChip = horse.chipId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (!cleanHorseChip.includes(cleanChipSearch)) {
          return false;
        }
      }

      // 2. Query filter (Name, English Name, Breed, Owner, Trainer)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = horse.name.toLowerCase().includes(q);
        const matchEng = horse.englishName.toLowerCase().includes(q);
        const matchBreed = horse.breed.toLowerCase().includes(q);
        const matchOwner = horse.owner.toLowerCase().includes(q);
        const matchTrainer = horse.trainer.toLowerCase().includes(q);
        if (!matchName && !matchEng && !matchBreed && !matchOwner && !matchTrainer) {
          return false;
        }
      }

      // 3. Status filter
      if (selectedStatus !== 'all' && horse.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [horses, searchChip, searchQuery, selectedStatus]);

  const handleResetFilters = () => {
    setSearchChip('');
    setSearchQuery('');
    setSelectedStatus('all');
  };

  const getStatusBadge = (status, label) => {
    switch (status) {
      case 'eligible':
        return <span className="badge badge-ok">✓ {label}</span>;
      case 'watch':
        return <span className="badge badge-warn">⚠️ {label}</span>;
      case 'resting':
        return <span className="badge badge-info">💤 {label}</span>;
      case 'hurt':
        return <span className="badge badge-alert">🚑 {label}</span>;
      default:
        return <span className="badge">{label}</span>;
    }
  };

  return (
    <section className="horse-section" id="danh-sach-ngua">
      <div className="wrap">
        {/* Section Header */}
        <div className="sec-head-flex">
          <div>
            <div className="eyebrow">
              FLOW 01 • LÝ LỊCH & QUẢN LÝ DÒNG DÕI
            </div>
            <h2>DANH SÁCH HỒ SƠ NGỰA & PHẢ HỆ</h2>
            <p>
              Tra cứu hồ sơ định danh, lọc theo <strong>Mã Chip RFID</strong> và mở sơ đồ <strong>Cây dòng dõi 3 đời (Sire, Dam, Grandparents)</strong>.
            </p>
          </div>
          <div className="sec-head-actions">
            <button 
              type="button" 
              className="btn btn-solid" 
              onClick={() => alert('Chức năng "Đăng ký ngựa mới" sẵn sàng kết nối với hệ thống RFID định danh.')}
            >
              + Đăng ký ngựa mới
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="filter-card">
          <div className="filter-grid">
            {/* Search by Microchip ID */}
            <div className="filter-group chip-filter-group">
              <label htmlFor="chip-search-input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8v8M10 8v8M14 8v8M18 8v8" />
                </svg>
                Lọc theo Mã Chip RFID:
              </label>
              <div className="input-with-icon">
                <input
                  id="chip-search-input"
                  type="text"
                  placeholder="Nhập mã chip (ví dụ: 982-000-348...)"
                  value={searchChip}
                  onChange={(e) => setSearchChip(e.target.value)}
                  className="filter-input chip-input"
                />
                {searchChip && (
                  <button 
                    type="button" 
                    className="clear-input-btn" 
                    onClick={() => setSearchChip('')}
                    title="Xóa mã chip"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* General Search Input */}
            <div className="filter-group">
              <label htmlFor="general-search-input">🔍 Tìm theo tên / giống / chủ sở hữu:</label>
              <input
                id="general-search-input"
                type="text"
                placeholder="Nhập tên ngựa, giống, HLV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Status Select Filter */}
            <div className="filter-group">
              <label htmlFor="status-select">⚡ Trạng thái thể lực:</label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="eligible">Đủ điều kiện thi đấu</option>
                <option value="watch">Cần theo dõi</option>
                <option value="resting">Nghỉ dưỡng</option>
                <option value="hurt">Chấn thương</option>
              </select>
            </div>

            {/* View Switcher Toggle */}
            <div className="filter-group view-toggle-group">
              <label>Chế độ hiển thị:</label>
              <div className="view-toggle-btns">
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Hiển thị dạng bảng"
                >
                  ☰ Bảng
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Hiển thị dạng thẻ"
                >
                  ☷ Thẻ
                </button>
              </div>
            </div>
          </div>

          {/* Quick Chip Preset Buttons */}
          <div className="quick-presets">
            <span className="preset-label">Mẫu mã chip nhanh:</span>
            <button 
              type="button" 
              className={`preset-pill ${searchChip === '982-000-348-192-001' ? 'active' : ''}`}
              onClick={() => setSearchChip('982-000-348-192-001')}
            >
              #001 (Xích Thố)
            </button>
            <button 
              type="button" 
              className={`preset-pill ${searchChip === '982-000-348-192-002' ? 'active' : ''}`}
              onClick={() => setSearchChip('982-000-348-192-002')}
            >
              #002 (Bạch Long)
            </button>
            <button 
              type="button" 
              className={`preset-pill ${searchChip === '982-000-348-192-003' ? 'active' : ''}`}
              onClick={() => setSearchChip('982-000-348-192-003')}
            >
              #003 (Hắc Phong)
            </button>
            
            {(searchChip || searchQuery || selectedStatus !== 'all') && (
              <button type="button" className="btn-reset-filters" onClick={handleResetFilters}>
                🔄 Xóa bộ lọc
              </button>
            )}

            <div className="counter-badge">
              Hiển thị <strong>{filteredHorses.length}</strong> / <strong>{horses.length}</strong> chiến mã
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {filteredHorses.length === 0 ? (
          <div className="no-results-card">
            <div className="no-results-icon">🐎🔍</div>
            <h3>Không tìm thấy chiến mã phù hợp</h3>
            <p>
              Không tìm thấy hồ sơ ngựa trùng khớp với mã chip "<strong>{searchChip}</strong>" hoặc từ khóa tìm kiếm.
            </p>
            <button type="button" className="btn btn-ghost" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="table-responsive-wrapper">
            <table className="horses-table">
              <thead>
                <tr>
                  <th>Mã Chip RFID</th>
                  <th>Tên & Ảnh chiến mã</th>
                  <th>Giống & Đặc điểm</th>
                  <th>Chuồng & Thể trạng</th>
                  <th>Dòng Cha (Sire) & Mẹ (Dam)</th>
                  <th>Chủ sở hữu & HLV</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Hành động Phả hệ</th>
                </tr>
              </thead>
              <tbody>
                {filteredHorses.map((horse) => (
                  <tr key={horse.id} className="horse-table-row">
                    {/* Chip ID */}
                    <td className="chip-cell">
                      <div className="chip-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M6 8v8M10 8v8M14 8v8M18 8v8" />
                        </svg>
                        <code>{horse.chipId}</code>
                      </div>
                    </td>

                    {/* Name & Avatar */}
                    <td className="horse-info-cell">
                      <div className="horse-avatar-group">
                        <img src={horse.avatar} alt={horse.name} className="horse-avatar-img" />
                        <div>
                          <div className="horse-name-main">{horse.name}</div>
                          <div className="horse-name-eng">{horse.englishName}</div>
                          <div className="horse-sub-meta">
                            {horse.gender} • {horse.age} tuổi ({horse.yob})
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Breed & Specs */}
                    <td>
                      <div className="breed-meta">
                        <strong>{horse.breed}</strong>
                        <span>{horse.color}</span>
                        <small>{horse.height} • {horse.weight}</small>
                      </div>
                    </td>

                    {/* Stall & Record */}
                    <td>
                      <div className="stall-meta">
                        <span className="stall-pill">{horse.stall}</span>
                        <div className="wins-meta">🏆 {horse.winsCount}</div>
                      </div>
                    </td>

                    {/* Sire & Dam */}
                    <td>
                      <div className="parents-mini-list">
                        <div className="parent-mini sire">
                          <span className="mini-icon">♂</span>
                          <strong>Cha:</strong> {horse.pedigree?.g2?.sire?.name || 'N/A'}
                        </div>
                        <div className="parent-mini dam">
                          <span className="mini-icon">♀</span>
                          <strong>Mẹ:</strong> {horse.pedigree?.g2?.dam?.name || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Owner & Trainer */}
                    <td>
                      <div className="owner-meta">
                        <div className="owner-name" title={horse.owner}>👤 {horse.owner}</div>
                        <div className="trainer-name">🧢 {horse.trainer}</div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {getStatusBadge(horse.status, horse.statusLabel)}
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="btn-pedigree-action"
                          onClick={() => setActiveHorseForPedigree(horse)}
                          title="Xem sơ đồ cây phả hệ 3 đời"
                        >
                          🌳 Cây dòng dõi
                        </button>
                        <button
                          type="button"
                          className="btn-profile-preview"
                          onClick={() => setDetailModalHorse(horse)}
                          title="Xem tóm tắt hồ sơ"
                        >
                          📋 Hồ sơ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS GRID VIEW */
          <div className="horses-cards-grid">
            {filteredHorses.map((horse) => (
              <div key={horse.id} className="horse-card">
                <div className="horse-card-header">
                  <img src={horse.avatar} alt={horse.name} className="card-avatar" />
                  <div className="card-status-badge">
                    {getStatusBadge(horse.status, horse.statusLabel)}
                  </div>
                </div>

                <div className="horse-card-body">
                  <div className="card-chip-bar">
                    <span className="chip-code-badge">MÃ CHIP: {horse.chipId}</span>
                    <span className="stall-code">{horse.stall}</span>
                  </div>

                  <h3 className="card-horse-name">{horse.name}</h3>
                  <div className="card-eng-name">{horse.englishName}</div>

                  <div className="card-specs-row">
                    <span className="spec-tag">{horse.breed}</span>
                    <span className="spec-tag">{horse.gender}</span>
                    <span className="spec-tag">{horse.age} tuổi</span>
                  </div>

                  {/* Sire & Dam box */}
                  <div className="card-pedigree-preview">
                    <div className="pedigree-preview-header">DÒNG DÕI CHA MẸ</div>
                    <div className="preview-row">
                      <span className="p-label sire">♂ CHA (SIRE):</span>
                      <span className="p-val">{horse.pedigree?.g2?.sire?.name}</span>
                    </div>
                    <div className="preview-row">
                      <span className="p-label dam">♀ MẸ (DAM):</span>
                      <span className="p-val">{horse.pedigree?.g2?.dam?.name}</span>
                    </div>
                  </div>

                  <div className="card-wins-strip">
                    <strong>THÀNH TÍCH:</strong> {horse.winsCount}
                  </div>
                </div>

                <div className="horse-card-footer">
                  <button
                    type="button"
                    className="btn btn-solid w-100"
                    onClick={() => setActiveHorseForPedigree(horse)}
                  >
                    🌳 Xem cây phả hệ 3 đời
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Profile Drawer / Preview Modal */}
        {detailModalHorse && (
          <div className="modal-overlay" onClick={() => setDetailModalHorse(null)}>
            <div className="modal-container profile-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>HỒ SƠ CHI TIẾT CHIẾN MÃ - {detailModalHorse.name}</h3>
                <button type="button" className="close-btn" onClick={() => setDetailModalHorse(null)}>✕</button>
              </div>
              <div className="modal-body profile-preview-body">
                <div className="profile-preview-grid">
                  <img src={detailModalHorse.avatar} alt={detailModalHorse.name} className="large-profile-img" />
                  <div className="profile-details-list">
                    <h4>{detailModalHorse.name} ({detailModalHorse.englishName})</h4>
                    <p className="chip-highlight">MÃ CHIP RFID DỊCH VỤ: <code>{detailModalHorse.chipId}</code></p>
                    <ul>
                      <li><strong>Giống loài:</strong> {detailModalHorse.breed}</li>
                      <li><strong>Giới tính & Tuổi:</strong> {detailModalHorse.gender}, {detailModalHorse.age} tuổi ({detailModalHorse.yob})</li>
                      <li><strong>Chiều cao & Cân nặng:</strong> {detailModalHorse.height}, {detailModalHorse.weight}</li>
                      <li><strong>Màu lông:</strong> {detailModalHorse.color}</li>
                      <li><strong>Vị trí chuồng:</strong> {detailModalHorse.stall}</li>
                      <li><strong>Chủ sở hữu:</strong> {detailModalHorse.owner}</li>
                      <li><strong>Huấn luyện viên:</strong> {detailModalHorse.trainer}</li>
                      <li><strong>Thống kê tiền thưởng:</strong> {detailModalHorse.totalEarnings}</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => {
                    const h = detailModalHorse;
                    setDetailModalHorse(null);
                    setActiveHorseForPedigree(h);
                  }}
                >
                  🌳 Mở cây phả hệ 3 đời của {detailModalHorse.name}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3-Generation Pedigree Tree Modal */}
        <PedigreeModal
          horse={activeHorseForPedigree}
          isOpen={!!activeHorseForPedigree}
          onClose={() => setActiveHorseForPedigree(null)}
        />
      </div>
    </section>
  );
}
