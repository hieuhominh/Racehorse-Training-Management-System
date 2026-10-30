import React, { useState, useMemo, useEffect } from 'react';
import { initialHorsesData } from '../data/horsesData';
import { getHorsesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import PedigreeModal from './PedigreeModal';

export default function HorseListSection() {
  const { showToast } = useToast();
  const { t, lang } = useLanguage();
  const [horses, setHorses] = useState(initialHorsesData);
  const [isFromBackend, setIsFromBackend] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [searchChip, setSearchChip] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(() => {
    try {
      return localStorage.getItem('matruong_horses_status_filter') || 'all';
    } catch {
      return 'all';
    }
  });
  useEffect(() => { localStorage.setItem('matruong_horses_status_filter', selectedStatus); }, [selectedStatus]);
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_horses_view_mode');
      return ['cards', 'table'].includes(saved) ? saved : 'cards';
    } catch {
      return 'cards';
    }
  }); // 'cards' | 'table' (default to 'cards' so action buttons are 100% prominent)
  useEffect(() => { localStorage.setItem('matruong_horses_view_mode', viewMode); }, [viewMode]);
  const [activeHorseForPedigree, setActiveHorseForPedigree] = useState(null);
  const [detailModalHorse, setDetailModalHorse] = useState(null);

  // Gọi API kết nối với Backend Java Servlet khi component mount
  useEffect(() => {
    let isMounted = true;


    getHorsesApi()
      .then((res) => {
        if (isMounted && res.data) {
          setHorses(res.data);
          setIsFromBackend(res.isFromBackend);
        }
      })
      .catch((err) => {
        console.error('Lỗi nạp dữ liệu ngựa từ API:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const getStatusText = (status, defaultLabel) => {
    if (lang === 'en') {
      switch (status) {
        case 'eligible': return 'Race Eligible';
        case 'watch': return 'Watchlist';
        case 'resting': return 'Resting';
        case 'hurt': return 'Injured';
        default: return defaultLabel || status;
      }
    }
    return defaultLabel;
  };

  const getStatusBadge = (status, label) => {
    const text = getStatusText(status, label);
    switch (status) {
      case 'eligible':
        return <span className="badge badge-gold">{text}</span>;
      case 'watch':
        return <span className="badge badge-slate">{text}</span>;
      case 'resting':
        return <span className="badge badge-slate">{text}</span>;
      case 'hurt':
        return <span className="badge badge-slate">{text}</span>;
      default:
        return <span className="badge badge-slate">{text}</span>;
    }
  };

  return (
    <section className="horse-section" id="danh-sach-ngua">
      <div className="wrap">
        {/* Section Header */}
        <div className="sec-head-flex">
          <div>
            <div className="eyebrow">
              {t('horseListEyebrow')}
            </div>
            <h2>{t('horseListHeading')}</h2>
            <p>
              {t('horseListDesc')}
            </p>
          </div>
          <div className="sec-head-actions">
            <button 
              type="button" 
              className="btn btn-solid" 
              onClick={() => showToast(t('regNewHorseToast'), 'QUẢN LÝ CHIẾN MÃ')}
            >
              {t('regNewHorseBtn')}
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
                {t('filterChipLabel')}
              </label>
              <div className="input-with-icon">
                <input
                  id="chip-search-input"
                  type="text"
                  placeholder={t('filterChipPlaceholder')}
                  value={searchChip}
                  onChange={(e) => setSearchChip(e.target.value)}
                  className="filter-input chip-input"
                />
                {searchChip && (
                  <button 
                    type="button" 
                    className="clear-input-btn" 
                    onClick={() => setSearchChip('')}
                    title={t('clearChipTitle')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* General Search Input */}
            <div className="filter-group">
              <label htmlFor="general-search-input">{t('filterSearchLabel')}</label>
              <input
                id="general-search-input"
                type="text"
                placeholder={t('filterSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Status Select Filter */}
            <div className="filter-group">
              <label htmlFor="status-select">{t('statusFilterLabel')}</label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('statusAll')}</option>
                <option value="eligible">{t('statusEligible')}</option>
                <option value="watch">{t('statusWatch')}</option>
                <option value="resting">{t('statusResting')}</option>
                <option value="hurt">{t('statusHurt')}</option>
              </select>
            </div>

            {/* View Switcher Toggle */}
            <div className="filter-group view-toggle-group">
              <label>{t('viewModeLabel')}</label>
              <div className="view-toggle-btns">
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Hiển thị dạng thẻ 100% khung hình"
                >
                  {t('viewActionCards')}
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Hiển thị dạng bảng thu gọn"
                >
                  {t('viewCompactTable')}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Chip Preset Buttons */}
          <div className="quick-presets">
            <span className="preset-label">{t('quickPresetsLabel')}</span>
            <button 
              type="button" 
              className={`preset-pill ${searchChip === '982-000-348-192-001' ? 'active' : ''}`}
              onClick={() => setSearchChip('982-000-348-192-001')}
            >
              #001 ({lang === 'en' ? 'Red Hare' : 'Xích Thố'})
            </button>
            <button 
              type="button" 
              className={`preset-pill ${searchChip === '982-000-348-192-002' ? 'active' : ''}`}
              onClick={() => setSearchChip('982-000-348-192-002')}
            >
              #002 ({lang === 'en' ? 'White Dragon' : 'Bạch Long'})
            </button>
            <button 
              type="button" 
              className={`preset-pill ${searchChip === '982-000-348-192-003' ? 'active' : ''}`}
              onClick={() => setSearchChip('982-000-348-192-003')}
            >
              #003 ({lang === 'en' ? 'Black Wind' : 'Hắc Phong'})
            </button>
            
            {(searchChip || searchQuery || selectedStatus !== 'all') && (
              <button type="button" className="btn-reset-filters" onClick={handleResetFilters}>
                {t('clearFiltersBtn')}
              </button>
            )}

            <div className="counter-badge">
              {t('showingHorsesCount')} <strong>{filteredHorses.length}</strong> / <strong>{horses.length}</strong> {t('ofHorsesCount')}
            </div>

            <div className="api-status-badge">
              {isLoadingApi ? (
                <span className="badge badge-slate" style={{ fontSize: '11px' }}>{t('checkingApi')}</span>
              ) : isFromBackend ? (
                <span className="badge badge-gold" style={{ fontSize: '11px' }}>{t('connectedApi')}</span>
              ) : (
                <span className="badge badge-slate" style={{ fontSize: '11px' }}>{lang === 'en' ? 'Local Mode' : 'Dữ liệu chuẩn hóa (Local Mode)'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {filteredHorses.length === 0 ? (
          <div className="no-results-card">
            <h3>{t('noHorsesFound')}</h3>
            <p>
              {lang === 'en' 
                ? `No racehorse profiles match chip ID "${searchChip}" or the search keyword.`
                : `Không tìm thấy hồ sơ ngựa trùng khớp với mã chip "${searchChip}" hoặc từ khóa tìm kiếm.`}
            </p>
            <button type="button" className="btn btn-ghost" onClick={handleResetFilters}>
              {t('clearFiltersBtn')}
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* CARDS GRID VIEW (DEFAULT & 100% PROMINENT BUTTONS) */
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
                    <span className="chip-code-badge">{t('cardChipLabel')}: {horse.chipId}</span>
                    <span className="stall-code">{horse.stall}</span>
                  </div>

                  <h3 className="card-horse-name">{lang === 'en' ? horse.englishName : horse.name}</h3>
                  <div className="card-eng-name">{lang === 'en' ? horse.name : horse.englishName}</div>

                  <div className="card-specs-row">
                    <span className="spec-tag">{horse.breed}</span>
                    <span className="spec-tag">{lang === 'en' ? (horse.gender === 'Đực' ? 'Stallion' : 'Mare') : horse.gender}</span>
                    <span className="spec-tag">{horse.age} {t('cardAgeLabel')}</span>
                  </div>

                  {/* Sire & Dam box */}
                  <div className="card-pedigree-preview">
                    <div className="pedigree-preview-header">{lang === 'en' ? 'LINEAGE (SIRE & DAM)' : 'DÒNG DÕI CHA MẸ'}</div>
                    <div className="preview-row">
                      <span className="p-label sire">♂ {lang === 'en' ? 'SIRE:' : 'CHA (SIRE):'}</span>
                      <span className="p-val">{horse.pedigree?.g2?.sire?.name}</span>
                    </div>
                    <div className="preview-row">
                      <span className="p-label dam">♀ {lang === 'en' ? 'DAM:' : 'MẸ (DAM):'}</span>
                      <span className="p-val">{horse.pedigree?.g2?.dam?.name}</span>
                    </div>
                  </div>

                  <div className="card-owner-info-strip">
                    <span className="owner-title">{t('cardOwnerLabel')}:</span>
                    <span className="owner-val">{horse.owner}</span>
                  </div>

                  <div className="card-wins-strip">
                    <strong>{lang === 'en' ? 'RECORD:' : 'THÀNH TÍCH:'}</strong> {horse.winsCount}
                  </div>
                </div>

                {/* Card Footer with BOTH Action Buttons 100% Visible */}
                <div className="horse-card-footer card-action-double-btn">
                  <button
                    type="button"
                    className="btn-pedigree-action btn-full-pedigree"
                    onClick={() => setActiveHorseForPedigree(horse)}
                  >
                    {t('cardPedigreeBtn')}
                  </button>
                  <button
                    type="button"
                    className="btn-profile-preview btn-full-profile"
                    onClick={() => setDetailModalHorse(horse)}
                  >
                    {t('cardProfileBtn')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* CONSOLIDATED 4-COLUMN COMPACT TABLE: 100% WIDTH WITH ZERO HORIZONTAL SCROLL */
          <div className="clean-table-container">
            <table className="clean-compact-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>{t('colHorse')} & {t('colChip')}</th>
                  <th style={{ width: '28%' }}>{t('colBreed')}</th>
                  <th style={{ width: '22%' }}>{t('colOwner')}</th>
                  <th style={{ width: '22%' }} className="text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHorses.map((horse) => (
                  <tr key={horse.id}>
                    {/* Col 1: Horse & Chip */}
                    <td>
                      <div className="horse-avatar-group">
                        <img src={horse.avatar} alt={horse.name} className="horse-avatar-img" />
                        <div>
                          <div className="horse-name-main">{lang === 'en' ? horse.englishName : horse.name}</div>
                          <div className="horse-name-eng">{lang === 'en' ? horse.name : horse.englishName}</div>
                          <div className="compact-chip-tag">
                            <code>{horse.chipId}</code>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Breed & Parents */}
                    <td>
                      <div className="compact-breed-box">
                        <strong>{horse.breed}</strong> ({horse.stall})
                        <div className="mini-parents">
                          <span className="sire-text">♂ {horse.pedigree?.g2?.sire?.name}</span>
                          <span className="dam-text">♀ {horse.pedigree?.g2?.dam?.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Col 3: Owner & Status */}
                    <td>
                      <div className="compact-owner-box">
                        <div className="owner-name-text">{horse.owner}</div>
                        <div className="status-badge-wrap">
                          {getStatusBadge(horse.status, horse.statusLabel)}
                        </div>
                      </div>
                    </td>

                    {/* Col 4: BOTH ACTION BUTTONS FULLY VISIBLE */}
                    <td className="text-right">
                      <div className="compact-action-buttons">
                        <button
                          type="button"
                          className="btn-pedigree-action btn-sm"
                          onClick={() => setActiveHorseForPedigree(horse)}
                          title={t('cardPedigreeBtn')}
                        >
                          {t('cardPedigreeBtn')}
                        </button>
                        <button
                          type="button"
                          className="btn-profile-preview btn-sm"
                          onClick={() => setDetailModalHorse(horse)}
                          title={t('cardProfileBtn')}
                        >
                          {t('cardProfileBtn')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Profile Drawer / Preview Modal */}
        {detailModalHorse && (
          <div className="modal-overlay" onClick={() => setDetailModalHorse(null)}>
            <div className="modal-container profile-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{lang === 'en' ? `HORSE PROFILE DOSSIER - ${detailModalHorse.englishName}` : `HỒ SƠ CHI TIẾT CHIẾN MÃ - ${detailModalHorse.name}`}</h3>
                <button type="button" className="close-btn" onClick={() => setDetailModalHorse(null)}>&times;</button>
              </div>
              <div className="modal-body profile-preview-body">
                <div className="profile-preview-grid">
                  <img src={detailModalHorse.avatar} alt={detailModalHorse.name} className="large-profile-img" />
                  <div className="profile-details-list">
                    <h4>{detailModalHorse.name} ({detailModalHorse.englishName})</h4>
                    <p className="chip-highlight">{t('colChip')}: <code>{detailModalHorse.chipId}</code></p>
                    <ul>
                      <li><strong>{t('propBreed')}</strong> {detailModalHorse.breed}</li>
                      <li><strong>{lang === 'en' ? 'Gender & Age:' : 'Giới tính & Tuổi:'}</strong> {lang === 'en' ? (detailModalHorse.gender === 'Đực' ? 'Stallion' : 'Mare') : detailModalHorse.gender}, {detailModalHorse.age} {t('cardAgeLabel')} ({detailModalHorse.yob})</li>
                      <li><strong>{lang === 'en' ? 'Height & Weight:' : 'Chiều cao & Cân nặng:'}</strong> {detailModalHorse.height}, {detailModalHorse.weight}</li>
                      <li><strong>{t('propColor')}</strong> {detailModalHorse.color}</li>
                      <li><strong>{lang === 'en' ? 'Stall Location:' : 'Vị trí chuồng:'}</strong> {detailModalHorse.stall}</li>
                      <li><strong>{t('cardOwnerLabel')}:</strong> {detailModalHorse.owner}</li>
                      <li><strong>{t('cardTrainerLabel')}:</strong> {detailModalHorse.trainer}</li>
                      <li><strong>{lang === 'en' ? 'Total Earnings:' : 'Thống kê tiền thưởng:'}</strong> {detailModalHorse.totalEarnings}</li>
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
                  {lang === 'en' ? `Open 3-Gen Pedigree for ${detailModalHorse.englishName}` : `Mở cây phả hệ 3 đời của ${detailModalHorse.name}`}
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
