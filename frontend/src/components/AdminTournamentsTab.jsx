import React, { useState, useEffect, useMemo } from 'react';
import {
  getOpenTournamentsApi,
  createTournamentApi,
  updateTournamentApi,
  getSystemTournamentNominationsApi,
  approveTournamentNominationApi,
  rejectTournamentNominationApi,
  settleTournamentPrizeApi
} from '../services/api';

const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

export default function AdminTournamentsTab({ lang = 'vi', showToast }) {
  const [adminTournaments, setAdminTournaments] = useState([]);
  const [adminNominations, setAdminNominations] = useState([]);
  const [tournTab, setTournTab] = useState('INTERNAL'); // 'INTERNAL' | 'NOMINATIONS' | 'EXTERNAL'
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showCreateTournModal, setShowCreateTournModal] = useState(false);
  const [newTournForm, setNewTournForm] = useState({
    name: '',
    tournamentType: 'INTERNAL',
    organizerName: 'Ban Quản Trị Mã Trường Phú Thọ',
    track: 'Trường đua Quốc tế Phú Thọ',
    surface: 'Sân cỏ Tự nhiên (Turf)',
    distance: '1.600m',
    date: '15/12/2026',
    regOpenDate: '01/11/2026',
    regCloseDate: '05/12/2026',
    totalPurse: 500000000,
    entryFee: 5000000,
    commissionRate: 0.05,
    rulesAndTerms: 'Giải đấu nội bộ chính thức. Nền tảng áp dụng trích hoa hồng trên tiền thưởng thực tế của Chủ ngựa.'
  });

  const [rejectModalData, setRejectModalData] = useState({ isOpen: false, nomination: null, reason: '' });
  const [settleModalData, setSettleModalData] = useState({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 });

  // Tải dữ liệu ban đầu và lắng nghe sự kiện đồng bộ
  const loadData = () => {
    getOpenTournamentsApi('ALL').then(data => setAdminTournaments(data || []));
    getSystemTournamentNominationsApi().then(data => setAdminNominations(data || []));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('matruong_nomination_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('matruong_nomination_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const pendingNominationsCount = useMemo(() => {
    return adminNominations.filter(n => n.status === 'PENDING').length;
  }, [adminNominations]);

  const totalCommissionEarned = useMemo(() => {
    return adminNominations.reduce((sum, n) => sum + (Number(n.commissionAmount) || 0), 0);
  }, [adminNominations]);

  // Handler tạo giải đấu mới
  const handleCreateTournament = async (e) => {
    if (e) e.preventDefault();
    if (!newTournForm.name.trim()) {
      if (showToast) showToast('Vui lòng nhập tên giải đấu.', 'THIẾU THÔNG TIN', 'warning');
      return;
    }
    const created = await createTournamentApi({
      ...newTournForm,
      totalPurse: Number(newTournForm.totalPurse) || 0,
      entryFee: Number(newTournForm.entryFee) || 0,
      commissionRate: newTournForm.tournamentType === 'INTERNAL' ? (Number(newTournForm.commissionRate) || 0.05) : 0.00
    });
    setAdminTournaments(prev => [created, ...prev.filter(t => t.id !== created.id)]);
    setShowCreateTournModal(false);
    if (showToast) showToast(`Đã tạo thành công giải: ${created.name}`, 'TẠO GIẢI THÀNH CÔNG', 'success');
  };

  // Handler duyệt đơn
  const handleApproveNomination = async (nomId) => {
    await approveTournamentNominationApi(nomId);
    setAdminNominations(prev => prev.map(n => n.id === nomId ? { ...n, status: 'APPROVED', nominationStatus: 'APPROVED' } : n));
    if (showToast) showToast('Đã phê duyệt đơn đăng ký thi đấu của chiến mã!', 'PHÊ DUYỆT THÀNH CÔNG', 'success');
  };

  // Handler từ chối đơn
  const handleRejectNomination = async (e) => {
    if (e) e.preventDefault();
    if (!rejectModalData.nomination) return;
    const reason = rejectModalData.reason.trim() || 'Không đạt điều kiện tiêu chuẩn thi đấu.';
    await rejectTournamentNominationApi(rejectModalData.nomination.id, reason);
    setAdminNominations(prev => prev.map(n => n.id === rejectModalData.nomination.id ? { ...n, status: 'REJECTED', nominationStatus: 'REJECTED', rejectionReason: reason } : n));
    setRejectModalData({ isOpen: false, nomination: null, reason: '' });
    if (showToast) showToast('Đã từ chối đơn đăng ký và thông báo lý do đến Chủ ngựa.', 'ĐÃ TỪ CHỐI ĐƠN', 'info');
  };

  // Handler quyết toán giải thưởng
  const handleSettlePrize = async (e) => {
    if (e) e.preventDefault();
    if (!settleModalData.nomination) return;
    const settled = await settleTournamentPrizeApi(settleModalData.nomination.id, {
      finalRank: Number(settleModalData.finalRank) || 1,
      grossPrize: Number(settleModalData.grossPrize) || 0
    });
    setAdminNominations(prev => prev.map(n => n.id === settleModalData.nomination.id ? settled : n));
    const netFormatted = Number(settled?.netPayout || 0).toLocaleString('vi-VN');
    const commFormatted = Number(settled?.commissionAmount || 0).toLocaleString('vi-VN');
    setSettleModalData({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 });
    if (showToast) showToast(`Đã quyết toán giải: Thực trả ${netFormatted} ₫ (Hoa hồng: ${commFormatted} ₫)`, 'QUYẾT TOÁN THÀNH CÔNG', 'success');
  };

  // Handler công tắc ẩn/hiển thị giải ngoài
  const handleToggleTournamentActive = async (tourn) => {
    const updatedStatus = !tourn.isActiveOnPlatform;
    await updateTournamentApi(tourn.id, { isActiveOnPlatform: updatedStatus });
    setAdminTournaments(prev => prev.map(t => t.id === tourn.id ? { ...t, isActiveOnPlatform: updatedStatus } : t));
    if (showToast) showToast(updatedStatus ? `Đã hiển thị giải "${tourn.name}" trên hệ thống` : `Đã ẩn giải "${tourn.name}"`, 'CẬP NHẬT HIỂN THỊ', 'info');
  };

  // Lọc danh sách đăng ký theo trạng thái
  const filteredNominations = useMemo(() => {
    if (statusFilter === 'ALL') return adminNominations;
    return adminNominations.filter(n => n.status === statusFilter);
  }, [adminNominations, statusFilter]);

  return (
    <div>
      {/* 4 THẺ KPI ĐIỀU HÀNH GIẢI ĐẤU (CÂN ĐỐI 1:1:1:1, KHÔNG SCROLLBAR) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div className="facility-card" style={{ padding: '18px 20px', borderTop: '3px solid var(--brass)' }}>
          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            TỔNG GIẢI ĐẤU QUẢN LÝ
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px' }}>
            {adminTournaments.length} giải
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
            {adminTournaments.filter(t => t.tournamentType === 'INTERNAL').length} Giải nội bộ · {adminTournaments.filter(t => t.tournamentType === 'EXTERNAL').length} Giải ngoài
          </div>
        </div>

        <div className="facility-card" style={{ padding: '18px 20px', borderTop: '3px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            ĐƠN ĐĂNG KÝ CHỜ DUYỆT
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: pendingNominationsCount > 0 ? '#F59E0B' : 'var(--paper)', margin: '6px 0 2px' }}>
            {pendingNominationsCount} hồ sơ
          </div>
          <div style={{ fontSize: '11.5px', color: pendingNominationsCount > 0 ? '#FBBF24' : 'var(--paper-dim)' }}>
            {pendingNominationsCount > 0 ? 'Cần thẩm định điều kiện & phê duyệt' : 'Đã duyệt toàn bộ hồ sơ'}
          </div>
        </div>

        <div className="facility-card" style={{ padding: '18px 20px', borderTop: '3px solid #3B82F6' }}>
          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            CHIẾN MÃ ĐÃ VÀO GIẢI
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#3B82F6', margin: '6px 0 2px' }}>
            {adminNominations.filter(n => n.status === 'CONFIRMED' || n.status === 'APPROVED').length} lượt
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
            Đã hoàn tất lệ phí & kiểm dịch thú y
          </div>
        </div>

        <div className="facility-card" style={{ padding: '18px 20px', borderTop: '3px solid #10B981', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)' }}>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>
            HOA HỒNG NỀN TẢNG THU ĐƯỢC
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', margin: '6px 0 2px', fontVariantNumeric: 'tabular-nums' }}>
            +{formatVND(totalCommissionEarned)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
            Trích 5%–8% từ giải nội bộ (Giải ngoài 0%)
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG 3 SUB-TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'inline-flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTournTab('INTERNAL')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: tournTab === 'INTERNAL' ? 'var(--brass)' : 'transparent',
              color: tournTab === 'INTERNAL' ? '#0A0D14' : 'var(--paper-dim)',
              fontWeight: tournTab === 'INTERNAL' ? 800 : 600,
              border: 'none',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🏆</span>
            <span>Giải Nội Bộ Nền Tảng</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: tournTab === 'INTERNAL' ? 'rgba(0,0,0,0.15)' : 'var(--bg-card)' }}>
              {adminTournaments.filter(t => t.tournamentType === 'INTERNAL').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTournTab('NOMINATIONS')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: tournTab === 'NOMINATIONS' ? 'var(--brass)' : 'transparent',
              color: tournTab === 'NOMINATIONS' ? '#0A0D14' : 'var(--paper-dim)',
              fontWeight: tournTab === 'NOMINATIONS' ? 800 : 600,
              border: 'none',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📝</span>
            <span>Xét Duyệt & Quyết Toán Thưởng</span>
            {pendingNominationsCount > 0 && (
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: '#EF4444', color: '#fff', fontWeight: 800 }}>
                {pendingNominationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTournTab('EXTERNAL')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: tournTab === 'EXTERNAL' ? 'var(--brass)' : 'transparent',
              color: tournTab === 'EXTERNAL' ? '#0A0D14' : 'var(--paper-dim)',
              fontWeight: tournTab === 'EXTERNAL' ? 800 : 600,
              border: 'none',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🌐</span>
            <span>Quản Lý Giải Ngoài</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: tournTab === 'EXTERNAL' ? 'rgba(0,0,0,0.15)' : 'var(--bg-card)' }}>
              {adminTournaments.filter(t => t.tournamentType === 'EXTERNAL').length}
            </span>
          </button>
        </div>

        {tournTab === 'INTERNAL' && (
          <button
            type="button"
            onClick={() => setShowCreateTournModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--brass)',
              color: '#0A0D14',
              fontWeight: 800,
              border: 'none',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span>
            <span>Tạo Giải Đấu Nội Bộ Mới</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: MÔ HÌNH B - GIẢI NỘI BỘ NỀN TẢNG (HOA HỒNG 5% - 8%) */}
      {tournTab === 'INTERNAL' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                <th style={{ padding: '12px 16px', width: '32%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tên Giải Đấu & Địa Điểm</th>
                <th style={{ padding: '12px 14px', width: '18%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thời Hạn Đăng Ký</th>
                <th style={{ padding: '12px 14px', width: '18%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Quỹ Thưởng & Lệ Phí</th>
                <th style={{ padding: '12px 14px', width: '17%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tỷ Lệ Hoa Hồng</th>
                <th style={{ padding: '12px 16px', width: '15%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {adminTournaments.filter(t => t.tournamentType === 'INTERNAL').map(tourn => (
                <tr key={tourn.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13.5px' }}>{tourn.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                      {tourn.track} · {tourn.distance} ({tourn.surface})
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                    <div style={{ color: 'var(--paper)', fontWeight: 600 }}>Ngày đua: {tourn.date}</div>
                    <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '1px' }}>Hạn chót: {tourn.regCloseDate || tourn.entryDeadline}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 800, color: 'var(--brass)', fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                      {formatVND(tourn.totalPurse)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '1px' }}>
                      Phí: {formatVND(tourn.entryFee)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      background: tourn.commissionRate === 0.08 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: tourn.commissionRate === 0.08 ? '#EF4444' : '#F59E0B',
                      border: `1px solid ${tourn.commissionRate === 0.08 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      Trích {((Number(tourn.commissionRate) || 0.05) * 100).toFixed(0)}% Thưởng
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      Đang Mở Đăng Ký
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 2: XÉT DUYỆT ĐƠN ĐĂNG KÝ & QUYẾT TOÁN GIẢI THƯỞNG */}
      {tournTab === 'NOMINATIONS' && (
        <div>
          {/* Filter Bar con cho đơn đăng ký */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: statusFilter === 'ALL' ? 700 : 500,
                background: statusFilter === 'ALL' ? 'var(--brass)' : 'var(--bg-secondary)',
                color: statusFilter === 'ALL' ? '#0A0D14' : 'var(--paper-dim)',
                border: '1px solid var(--line)',
                cursor: 'pointer'
              }}
            >
              Tất cả ({adminNominations.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: statusFilter === 'PENDING' ? 700 : 500,
                background: statusFilter === 'PENDING' ? '#F59E0B' : 'var(--bg-secondary)',
                color: statusFilter === 'PENDING' ? '#0A0D14' : 'var(--paper-dim)',
                border: '1px solid var(--line)',
                cursor: 'pointer'
              }}
            >
              Chờ duyệt ({adminNominations.filter(n => n.status === 'PENDING').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CONFIRMED')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: statusFilter === 'CONFIRMED' ? 700 : 500,
                background: statusFilter === 'CONFIRMED' ? '#10B981' : 'var(--bg-secondary)',
                color: statusFilter === 'CONFIRMED' ? '#fff' : 'var(--paper-dim)',
                border: '1px solid var(--line)',
                cursor: 'pointer'
              }}
            >
              Đã quyết toán thưởng ({adminNominations.filter(n => n.status === 'CONFIRMED').length})
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                  <th style={{ padding: '12px 16px', width: '25%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Chiến Mã & Chủ Sở Hữu</th>
                  <th style={{ padding: '12px 14px', width: '25%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Giải Đấu & Phân Loại</th>
                  <th style={{ padding: '12px 14px', width: '15%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Cam Kết Hoa Hồng</th>
                  <th style={{ padding: '12px 14px', width: '18%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thành Tích & Quyết Toán</th>
                  <th style={{ padding: '12px 16px', width: '17%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thẩm Định & Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredNominations.map(nom => (
                  <tr key={nom.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px' }}>
                        🐴 {nom.horseName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                        Chủ: <b>{nom.ownerName}</b> · Nài: {nom.jockey || 'HLV chỉ định'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--paper)', fontSize: '12px' }}>
                        {nom.raceName}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: nom.tournamentType === 'INTERNAL' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: nom.tournamentType === 'INTERNAL' ? '#60A5FA' : '#10B981',
                          border: `1px solid ${nom.tournamentType === 'INTERNAL' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}>
                          {nom.tournamentType === 'INTERNAL' ? 'Nội bộ Nền tảng' : 'Giải Ngoài Độc Lập'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {nom.tournamentType === 'INTERNAL' ? (
                        <div>
                          <b style={{ color: nom.commissionRate === 0.08 ? '#EF4444' : '#F59E0B' }}>
                            {((Number(nom.commissionRate) || 0.05) * 100).toFixed(0)}%
                          </b>
                          <div style={{ fontSize: '10.5px', color: '#10B981', marginTop: '1px' }}>
                            ✓ Chủ đã cam kết
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#10B981', fontWeight: 700 }}>
                          0% (Không trích)
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                      {nom.grossPrize && nom.grossPrize > 0 ? (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                            Thứ {nom.finalRank || 1} · Tổng: <b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatVND(nom.grossPrize)}</b>
                          </div>
                          <div style={{ fontSize: '11px', color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                            - Hoa hồng: {formatVND(nom.commissionAmount)}
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#10B981', marginTop: '1px', fontVariantNumeric: 'tabular-nums' }}>
                            Thực trả: +{formatVND(nom.netPayout)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontStyle: 'italic' }}>
                          Chưa thi đấu / chờ kết quả
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {nom.status === 'PENDING' && (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveNomination(nom.id)}
                            style={{
                              padding: '4px 10px',
                              background: '#10B981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Phê Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModalData({ isOpen: true, nomination: nom, reason: '' })}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Từ Chối
                          </button>
                        </div>
                      )}

                      {(nom.status === 'APPROVED' || nom.status === 'CONFIRMED') && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 700 }}>
                            {nom.grossPrize ? '✓ Đã Quyết Toán' : '✓ Sẵn sàng thi đấu'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentTourn = adminTournaments.find(t => t.name === nom.raceName);
                              const basePurse = Number(nom.estimatedPurse || currentTourn?.totalPurse || 500000000);
                              const initialRank = nom.finalRank !== undefined ? nom.finalRank : 1;
                              let initialGross = nom.grossPrize !== undefined ? nom.grossPrize : Math.round(basePurse * 0.5);
                              setSettleModalData({
                                isOpen: true,
                                nomination: nom,
                                finalRank: initialRank,
                                grossPrize: initialGross
                              });
                            }}
                            style={{
                              padding: '3px 8px',
                              background: 'rgba(212, 175, 55, 0.15)',
                              border: '1px solid var(--brass)',
                              color: 'var(--brass)',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {nom.grossPrize ? 'Sửa Thưởng' : 'Nhập Kết Quả & Thưởng'}
                          </button>
                        </div>
                      )}

                      {nom.status === 'REJECTED' && (
                        <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 700 }} title={nom.rejectionReason || ''}>
                          Đã Từ Chối
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MÔ HÌNH A - QUẢN LÝ HIỂN THỊ GIẢI NGOÀI */}
      {tournTab === 'EXTERNAL' && (
        <div>
          <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', fontSize: '12.5px', color: 'var(--paper)' }}>
            ℹ️ <b>Quy tắc Doanh thu Giải Ngoài:</b> Các giải đấu do đơn vị bên ngoài tổ chức. Chủ ngựa tự do liên hệ, nộp lệ phí trực tiếp cho BTC ngoài và tự cập nhật kết quả. Nền tảng <b>tuyệt đối không thu hoa hồng (0%)</b>. Admin có quyền Bật / Tắt hiển thị các giải đấu này trên nền tảng để bảo vệ quyền lợi người dùng.
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                  <th style={{ padding: '12px 16px', width: '35%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tên Giải & Đơn Vị Tổ Chức Ngoài</th>
                  <th style={{ padding: '12px 14px', width: '22%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Địa Điểm & Cự Ly</th>
                  <th style={{ padding: '12px 14px', width: '18%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tổng Thưởng BTC</th>
                  <th style={{ padding: '12px 14px', width: '13%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Hoa Hồng</th>
                  <th style={{ padding: '12px 16px', width: '12%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Hiển Thị</th>
                </tr>
              </thead>
              <tbody>
                {adminTournaments.filter(t => t.tournamentType === 'EXTERNAL').map(tourn => (
                  <tr key={tourn.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px' }}>{tourn.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                        BTC: <b>{tourn.organizerName}</b>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                      <div style={{ color: 'var(--paper)', fontSize: '12px' }}>{tourn.track}</div>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '1px' }}>
                        {tourn.distance} · {tourn.surface}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--brass)', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle' }}>
                      {formatVND(tourn.totalPurse)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                        0% (Miễn phí)
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleTournamentActive(tourn)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: tourn.isActiveOnPlatform ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: tourn.isActiveOnPlatform ? '#10B981' : '#EF4444',
                          border: `1px solid ${tourn.isActiveOnPlatform ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {tourn.isActiveOnPlatform ? 'Đang Hiển Thị' : 'Đang Ẩn'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: TẠO GIẢI ĐẤU NỘI BỘ MỚI (MÔ HÌNH B) ===================== */}
      {showCreateTournModal && (
        <div
          onClick={() => setShowCreateTournModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '600px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏆</span> Tạo Giải Đấu Mới (Nền Tảng Tổ Chức)
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateTournModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTournament}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                  Tên Giải Đấu *
                </label>
                <input
                  type="text"
                  required
                  value={newTournForm.name}
                  onChange={(e) => setNewTournForm({ ...newTournForm, name: e.target.value })}
                  placeholder="Ví dụ: Cúp Derby Quốc Tế Đại Nam 2026 (Group 1)"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Địa Điểm & Trường Đua
                  </label>
                  <input
                    type="text"
                    value={newTournForm.track}
                    onChange={(e) => setNewTournForm({ ...newTournForm, track: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Mặt Sân Thi Đấu
                  </label>
                  <select
                    value={newTournForm.surface}
                    onChange={(e) => setNewTournForm({ ...newTournForm, surface: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="Sân cỏ Tự nhiên (Turf)">Sân cỏ Tự nhiên (Turf)</option>
                    <option value="Sân cát Nén (Dirt)">Sân cát Nén (Dirt)</option>
                    <option value="Sân cát Tự nhiên (Sand)">Sân cát Tự nhiên (Sand)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Cự Ly Đua
                  </label>
                  <input
                    type="text"
                    value={newTournForm.distance}
                    onChange={(e) => setNewTournForm({ ...newTournForm, distance: e.target.value })}
                    placeholder="2.400m"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Ngày Diễn Ra
                  </label>
                  <input
                    type="text"
                    value={newTournForm.date}
                    onChange={(e) => setNewTournForm({ ...newTournForm, date: e.target.value })}
                    placeholder="15/12/2026"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Hạn Chót Đăng Ký
                  </label>
                  <input
                    type="text"
                    value={newTournForm.regCloseDate}
                    onChange={(e) => setNewTournForm({ ...newTournForm, regCloseDate: e.target.value })}
                    placeholder="05/12/2026"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Tổng Quỹ Tiền Thưởng (VND)
                  </label>
                  <input
                    type="number"
                    value={newTournForm.totalPurse}
                    onChange={(e) => setNewTournForm({ ...newTournForm, totalPurse: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Lệ Phí Tham Gia (VND)
                  </label>
                  <input
                    type="number"
                    value={newTournForm.entryFee}
                    onChange={(e) => setNewTournForm({ ...newTournForm, entryFee: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* CẤU HÌNH TỶ LỆ HOA HỒNG (5% HOẶC 8%) THEO ĐÚNG BUSINESS RULE */}
              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--brass)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--brass)', marginBottom: '6px' }}>
                  ⚙️ CẤU HÌNH TỶ LỆ HOA HỒNG NỀN TẢNG (5% – 8%)
                </label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--paper)' }}>
                    <input
                      type="radio"
                      name="commissionRate"
                      value="0.05"
                      checked={Number(newTournForm.commissionRate) === 0.05}
                      onChange={() => setNewTournForm({ ...newTournForm, commissionRate: 0.05 })}
                    />
                    <span><b>5%</b> (Ví dụ thưởng 500tr: Nền tảng 25tr, Chủ ngựa 475tr)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--paper)' }}>
                    <input
                      type="radio"
                      name="commissionRate"
                      value="0.08"
                      checked={Number(newTournForm.commissionRate) === 0.08}
                      onChange={() => setNewTournForm({ ...newTournForm, commissionRate: 0.08 })}
                    />
                    <span><b>8%</b> (Ví dụ thưởng 500tr: Nền tảng 40tr, Chủ ngựa 460tr)</span>
                  </label>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontStyle: 'italic' }}>
                  * Tỷ lệ hoa hồng phải được cấu hình rõ theo từng giải đấu và Chủ ngựa phải đồng ý cam kết trước khi tham gia.
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                  Thể Lệ Giải & Điều Khoản Cam Kết
                </label>
                <textarea
                  rows={3}
                  value={newTournForm.rulesAndTerms}
                  onChange={(e) => setNewTournForm({ ...newTournForm, rulesAndTerms: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTournModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper-dim)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                >
                  Tạo Giải Đấu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: TỪ CHỐI ĐƠN ĐĂNG KÝ ===================== */}
      {rejectModalData.isOpen && (
        <div
          onClick={() => setRejectModalData({ isOpen: false, nomination: null, reason: '' })}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#EF4444' }}>
              Từ Chối Hồ Sơ Đăng Ký Thi Đấu
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Chiến mã: <b style={{ color: 'var(--paper)' }}>{rejectModalData.nomination?.horseName}</b> · Giải: <b>{rejectModalData.nomination?.raceName}</b>
            </p>

            <form onSubmit={handleRejectNomination}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '6px' }}>
                  Lý do từ chối (Gửi thông báo chính thức đến Chủ ngựa) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectModalData.reason}
                  onChange={(e) => setRejectModalData({ ...rejectModalData, reason: e.target.value })}
                  placeholder="Ví dụ: Chiến mã chưa đạt điều kiện thể lực theo khuyến nghị Thú y, hoặc không đủ chuẩn đăng ký giải này."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalData({ isOpen: false, nomination: null, reason: '' })}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper-dim)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: '#EF4444', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: NHẬP KẾT QUẢ & QUYẾT TOÁN TIỀN THƯỞNG ===================== */}
      {settleModalData.isOpen && (
        <div
          onClick={() => setSettleModalData({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 })}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16.5px', color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💰</span> Quyết Toán Tiền Thưởng Giải Đấu
              </h3>
              <button
                type="button"
                onClick={() => setSettleModalData({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 })}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--paper)', marginBottom: '14px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
              <div>Chiến mã: <b style={{ color: 'var(--brass)' }}>{settleModalData.nomination?.horseName}</b></div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                Giải đấu: {settleModalData.nomination?.raceName} ({settleModalData.nomination?.tournamentType === 'INTERNAL' ? 'Nội bộ' : 'Giải ngoài'})
              </div>
            </div>

            <form onSubmit={handleSettlePrize}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Thứ Hạng Về Đích
                  </label>
                  <select
                    value={settleModalData.finalRank}
                    onChange={(e) => {
                      const rankVal = Number(e.target.value);
                      const currentTourn = adminTournaments.find(t => t.name === settleModalData.nomination?.raceName);
                      const basePurse = Number(settleModalData.nomination?.estimatedPurse || currentTourn?.totalPurse || 500000000);
                      let computedGross = 0;
                      if (rankVal === 1) computedGross = Math.round(basePurse * 0.5); // Giải nhất: 50%
                      else if (rankVal === 2) computedGross = Math.round(basePurse * 0.25); // Giải nhì: 25%
                      else if (rankVal === 3) computedGross = Math.round(basePurse * 0.15); // Giải ba: 15%
                      else if (rankVal === 4 || rankVal === 5) computedGross = Math.round(basePurse * 0.05); // Top 5: 5%
                      else computedGross = 0; // Không đạt giải: 0đ

                      setSettleModalData({ ...settleModalData, finalRank: rankVal, grossPrize: computedGross });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value={1}>Hạng 1 (Giải Nhất - 50% Quỹ)</option>
                    <option value={2}>Hạng 2 (Giải Nhì - 25% Quỹ)</option>
                    <option value={3}>Hạng 3 (Giải Ba - 15% Quỹ)</option>
                    <option value={5}>Top 5 Chung Cuộc (5% Quỹ)</option>
                    <option value={0}>Không Đạt Giải (0 ₫ - Không thưởng)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Tổng Tiền Thưởng (Gross Prize - VND) *
                  </label>
                  <input
                    type="number"
                    required
                    value={settleModalData.grossPrize}
                    onChange={(e) => setSettleModalData({ ...settleModalData, grossPrize: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* BẢNG TÍNH TOÁN MINH BẠCH 4 TRƯỜNG THEO ĐÚNG VÍ DỤ NGHIỆP VỤ */}
              {(() => {
                const gross = Number(settleModalData.grossPrize) || 0;
                const isExternal = settleModalData.nomination?.tournamentType === 'EXTERNAL';
                const commRate = isExternal ? 0.00 : (Number(settleModalData.nomination?.commissionRate) || 0.05);
                const commAmount = Math.round(gross * commRate);
                const netPayout = gross - commAmount;

                return (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', fontSize: '12.5px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--brass)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>
                      BẢNG ĐỐI SOÁT & PHÂN BỔ TIỀN THƯỞNG:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>1. Tổng tiền thưởng trước khấu trừ:</span>
                      <b style={{ color: 'var(--paper)', fontVariantNumeric: 'tabular-nums' }}>{formatVND(gross)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>2. Tỷ lệ hoa hồng nền tảng:</span>
                      <b style={{ color: isExternal ? '#10B981' : '#F59E0B' }}>
                        {(commRate * 100).toFixed(0)}% {isExternal ? '(Giải ngoài 0%)' : ''}
                      </b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>3. Số tiền hoa hồng nền tảng nhận:</span>
                      <b style={{ color: commAmount > 0 ? '#EF4444' : 'var(--paper)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatVND(commAmount)}
                      </b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '6px', fontSize: '14px' }}>
                      <b style={{ color: '#10B981' }}>4. Số tiền thực nhận của Chủ ngựa:</b>
                      <b style={{ color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>+{formatVND(netPayout)}</b>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSettleModalData({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 })}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper-dim)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', background: '#10B981', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                >
                  Xác Nhận & Quyết Toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

