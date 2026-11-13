import React, { useState, useEffect, useMemo } from 'react';
import {
  getOpenTournamentsApi,
  createTournamentApi,
  updateTournamentApi,
  getSystemTournamentNominationsApi,
  approveTournamentNominationApi,
  rejectTournamentNominationApi,
  settleTournamentPrizeApi,
  getTournamentTimeStatus,
  isTestOrMockHorse
} from '../services/api';

const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

// Helper chuyển đổi định dạng ngày giữa DD/MM/YYYY và YYYY-MM-DD cho input date picker
const parseDateToYMD = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
};

const formatYMDToDMY = (ymdStr) => {
  if (!ymdStr) return '';
  const parts = ymdStr.trim().split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return ymdStr;
};

// Tính ngày hạn chót đăng ký mặc định (trước ngày thi đấu 7 ngày)
const calculateDefaultDeadline = (raceDateDMY) => {
  const ymd = parseDateToYMD(raceDateDMY);
  if (!ymd) return '';
  const d = new Date(ymd);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() - 7);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

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

  // State chỉnh sửa giải đấu nội bộ
  const [showEditTournModal, setShowEditTournModal] = useState(false);
  const [editTournForm, setEditTournForm] = useState(null);

  // State xem xét kết quả đua & quyết toán người chiến thắng chung cuộc theo giải
  const [reviewTournModal, setReviewTournModal] = useState({
    isOpen: false,
    tournament: null
  });

  const handleOpenReviewRace = (tourn) => {
    setReviewTournModal({
      isOpen: true,
      tournament: tourn
    });
  };

  const [rejectModalData, setRejectModalData] = useState({ isOpen: false, nomination: null, reason: '' });
  const [settleModalData, setSettleModalData] = useState({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 });

  // Tải dữ liệu ban đầu và lắng nghe sự kiện đồng bộ
  const loadData = () => {
    getOpenTournamentsApi('ALL').then(data => setAdminTournaments(data || []));
    getSystemTournamentNominationsApi().then(data => {
      const clean = (data || []).filter(n => {
        if (!n) return false;
        if (n.horseName && isTestOrMockHorse(n.horseName)) return false;
        if (n.assignedHorseName && isTestOrMockHorse(n.assignedHorseName)) return false;
        return true;
      });
      setAdminNominations(clean);
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('matruong_nomination_updated', loadData);
    window.addEventListener('matruong_tournament_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('matruong_nomination_updated', loadData);
      window.removeEventListener('matruong_tournament_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const pendingNominationsCount = useMemo(() => {
    return adminNominations.filter(n => (n.status === 'PENDING' || n.status === 'PENDING_APPROVAL' || !n.feeApproved) && n.status !== 'REJECTED').length;
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

  // Handler mở modal chỉnh sửa giải đấu nội bộ
  const handleOpenEditTournament = (tourn) => {
    setEditTournForm({
      id: tourn.id,
      name: tourn.name || '',
      tournamentType: tourn.tournamentType || 'INTERNAL',
      organizerName: tourn.organizerName || 'Ban Quản Trị Mã Trường Phú Thọ',
      track: tourn.track || 'Trường đua Quốc tế Phú Thọ',
      surface: tourn.surface || 'Sân cỏ Tự nhiên (Turf)',
      distance: tourn.distance || '1.600m',
      date: tourn.date || '15/12/2026',
      regCloseDate: tourn.regCloseDate || tourn.entryDeadline || '05/12/2026',
      totalPurse: tourn.totalPurse || 500000000,
      entryFee: tourn.entryFee || 5000000,
      commissionRate: tourn.commissionRate ?? 0.05,
      rulesAndTerms: tourn.rulesAndTerms || tourn.description || 'Giải đấu nội bộ chính thức.'
    });
    setShowEditTournModal(true);
  };

  // Handler lưu cập nhật giải đấu nội bộ
  const handleUpdateTournament = async (e) => {
    if (e) e.preventDefault();
    if (!editTournForm || !editTournForm.id) return;
    if (!editTournForm.name.trim()) {
      if (showToast) showToast('Vui lòng nhập tên giải đấu.', 'THIẾU THÔNG TIN', 'warning');
      return;
    }

    const updates = {
      ...editTournForm,
      totalPurse: Number(editTournForm.totalPurse) || 0,
      entryFee: Number(editTournForm.entryFee) || 0,
      commissionRate: Number(editTournForm.commissionRate) || 0.05,
      entryDeadline: editTournForm.regCloseDate
    };

    await updateTournamentApi(editTournForm.id, updates);
    setAdminTournaments(prev => prev.map(t => t.id === editTournForm.id ? { ...t, ...updates } : t));
    setShowEditTournModal(false);
    if (showToast) {
      showToast(`Đã cập nhật thành công giải: "${updates.name}"! Giao diện Chủ sở hữu đã tự động đồng bộ.`, 'CẬP NHẬT THÀNH CÔNG', 'success');
    }
  };

  // Handler duyệt đơn
  const handleApproveNomination = async (nomId) => {
    await approveTournamentNominationApi(nomId);
    setAdminNominations(prev => prev.map(n => n.id === nomId ? { ...n, status: 'CONFIRMED', nominationStatus: 'CONFIRMED', feeApproved: true, approvedAt: new Date().toLocaleString('vi-VN') } : n));
    if (showToast) showToast('Đã xác nhận thu 5.000.000 ₫ và phê duyệt đơn thi đấu của chiến mã! Giấy xác nhận thi đấu (PDF) đã được kích hoạt cho Chủ sở hữu.', 'XÁC NHẬN THU PHÍ THÀNH CÔNG', 'success');
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
    const commPct = Math.round((settled?.commissionRate || 0.05) * 100);
    setSettleModalData({ isOpen: false, nomination: null, finalRank: 1, grossPrize: 500000000 });
    if (showToast) {
      showToast(
        `Đã quyết toán giải nội bộ: Tự động trừ ${commPct}% hoa hồng (-${commFormatted} ₫) và chuyển +${netFormatted} ₫ sang tài khoản Chủ sở hữu ${settled?.ownerName || ''}!`,
        'QUYẾT TOÁN THÀNH CÔNG',
        'success'
      );
    }
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
    if (statusFilter === 'PENDING') {
      return adminNominations.filter(n => (n.status === 'PENDING' || n.status === 'PENDING_APPROVAL' || !n.feeApproved) && n.status !== 'REJECTED');
    }
    if (statusFilter === 'CONFIRMED') {
      return adminNominations.filter(n => (n.status === 'CONFIRMED' || n.status === 'APPROVED' || n.feeApproved) && n.status !== 'REJECTED');
    }
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
                <th style={{ padding: '12px 16px', width: '28%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tên Giải Đấu & Địa Điểm</th>
                <th style={{ padding: '12px 14px', width: '17%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thời Hạn Đăng Ký</th>
                <th style={{ padding: '12px 14px', width: '17%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Quỹ Thưởng & Lệ Phí</th>
                <th style={{ padding: '12px 14px', width: '15%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tỷ Lệ Hoa Hồng</th>
                <th style={{ padding: '12px 16px', width: '23%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Trạng Thái & Thao Tác</th>
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
                  <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      {(() => {
                        const tournPendingCount = adminNominations.filter(n => (n.tournamentId === tourn.id || n.raceName === tourn.name) && (n.status === 'PENDING' || n.status === 'PENDING_APPROVAL' || !n.feeApproved) && n.status !== 'REJECTED').length;
                        if (tournPendingCount > 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => { setTournTab('NOMINATIONS'); setStatusFilter('PENDING'); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '170px',
                                height: '24px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#F59E0B',
                                border: '1px solid #F59E0B',
                                boxSizing: 'border-box',
                                cursor: 'pointer'
                              }}
                              title="Bấm để xem và duyệt thu phí các đơn đăng ký giải này"
                            >
                              ⏳ {tournPendingCount} đơn chờ duyệt phí
                            </button>
                          );
                        }
                        return (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '170px',
                            height: '24px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            boxSizing: 'border-box'
                          }}>
                            Đang Mở Đăng Ký
                          </span>
                        );
                      })()}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenReviewRace(tourn)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '82px',
                            height: '25px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid #10B981',
                            color: '#10B981',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease'
                          }}
                          title="Xem xét danh sách chiến mã đã đăng ký & Quyết toán cho người chiến thắng chung cuộc"
                        >
                          Quyết Toán
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditTournament(tourn)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '82px',
                            height: '25px',
                            borderRadius: '4px',
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid var(--brass)',
                            color: 'var(--brass)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease'
                          }}
                          title="Chỉnh sửa thông tin giải đấu nội bộ"
                        >
                          Cập Nhật
                        </button>
                      </div>
                    </div>
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
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: statusFilter === 'ALL' ? 700 : 500,
                background: statusFilter === 'ALL' ? 'var(--brass)' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === 'ALL' ? '#0A0D14' : 'var(--paper-dim)',
                border: `1px solid ${statusFilter === 'ALL' ? 'var(--brass)' : 'rgba(255, 255, 255, 0.08)'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Tất cả</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '12px',
                background: statusFilter === 'ALL' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: statusFilter === 'ALL' ? '#0A0D14' : 'var(--paper)',
                fontWeight: 800
              }}>
                {adminNominations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: statusFilter === 'PENDING' ? 700 : 500,
                background: statusFilter === 'PENDING' ? '#F59E0B' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === 'PENDING' ? '#0A0D14' : 'var(--paper-dim)',
                border: `1px solid ${statusFilter === 'PENDING' ? '#F59E0B' : 'rgba(255, 255, 255, 0.08)'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Chờ duyệt thu phí</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '12px',
                background: statusFilter === 'PENDING' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(245, 158, 11, 0.15)',
                color: statusFilter === 'PENDING' ? '#0A0D14' : '#F59E0B',
                fontWeight: 800
              }}>
                {pendingNominationsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CONFIRMED')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: statusFilter === 'CONFIRMED' ? 700 : 500,
                background: statusFilter === 'CONFIRMED' ? '#10B981' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === 'CONFIRMED' ? '#0A0D14' : 'var(--paper-dim)',
                border: `1px solid ${statusFilter === 'CONFIRMED' ? '#10B981' : 'rgba(255, 255, 255, 0.08)'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Đã quyết toán thưởng</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '12px',
                background: statusFilter === 'CONFIRMED' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                color: statusFilter === 'CONFIRMED' ? '#0A0D14' : '#10B981',
                fontWeight: 800
              }}>
                {adminNominations.filter(n => n.status === 'CONFIRMED').length}
              </span>
            </button>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                  <th style={{ padding: '14px 18px', width: '26%', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Chiến Mã & Chủ Sở Hữu</th>
                  <th style={{ padding: '14px 16px', width: '25%', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Giải Đấu & Phân Loại</th>
                  <th style={{ padding: '14px 12px', width: '13%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cam Kết Hoa Hồng</th>
                  <th style={{ padding: '14px 14px', width: '18%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Thành Tích & Quyết Toán</th>
                  <th style={{ padding: '14px 18px', width: '18%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Thẩm Định & Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredNominations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--paper-dim)' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏁</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Chưa có đơn đăng ký nào trong danh mục này</div>
                      <div style={{ fontSize: '11.5px', marginTop: '4px', opacity: 0.7 }}>Các chiến mã đăng ký thi đấu hoặc cập nhật giải ngoài sẽ hiển thị tại đây.</div>
                    </td>
                  </tr>
                ) : (
                  filteredNominations.map(nom => {
                    const isExternal = nom.tournamentType === 'EXTERNAL' || nom.isExternal;
                    const rankLabel = nom.rank
                      ? (nom.rank.includes('1') ? 'Hạng 1' : nom.rank.includes('2') ? 'Hạng 2' : nom.rank.includes('3') ? 'Hạng 3' : nom.rank.includes('5') ? 'Top 5' : nom.rank.split('(')[0]?.trim())
                      : (nom.finalRank ? `Hạng ${nom.finalRank}` : 'Hoàn thành');

                    return (
                      <tr
                        key={nom.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'rgba(212, 175, 55, 0.12)',
                              border: '1px solid rgba(212, 175, 55, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              flexShrink: 0
                            }}>
                              🏇
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13.5px' }}>
                                {nom.horseName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                                Chủ: <b style={{ color: 'var(--paper)' }}>{nom.ownerName}</b> · Nài: <span style={{ color: 'var(--brass)' }}>{nom.jockey?.replace('Chủ sở hữu tự bố trí', 'Tự bố trí') || 'Tự bố trí'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: 'var(--paper)', fontSize: '13px', lineHeight: 1.35 }}>
                            {nom.raceName}
                          </div>
                          <div style={{ marginTop: '5px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: isExternal ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 175, 55, 0.12)',
                              color: isExternal ? '#10B981' : 'var(--brass)',
                              border: `1px solid ${isExternal ? 'rgba(16, 185, 129, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`
                            }}>
                              {isExternal ? '🌐 Giải Ngoài Độc Lập' : '🏆 Nội Bộ Nền Tảng'}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {!isExternal ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{
                                width: '92px',
                                height: '24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: nom.commissionRate === 0.08 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: nom.commissionRate === 0.08 ? '#EF4444' : '#F59E0B',
                                border: `1px solid ${nom.commissionRate === 0.08 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                boxSizing: 'border-box'
                              }}>
                                Trích {((Number(nom.commissionRate) || 0.05) * 100).toFixed(0)}%
                              </span>
                              <span style={{ fontSize: '10px', color: '#10B981', marginTop: '3px', fontWeight: 600 }}>
                                ✓ Đã cam kết
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{
                                width: '92px',
                                height: '24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                boxSizing: 'border-box'
                              }}>
                                0% Hoa hồng
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                                (Chủ nhận 100%)
                              </span>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {nom.grossPrize && nom.grossPrize > 0 ? (
                            <div style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              minWidth: '150px',
                              boxSizing: 'border-box'
                            }}>
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
                                <b style={{ color: 'var(--brass)' }}>{rankLabel}</b> · Tổng: <b style={{ color: 'var(--paper)', fontVariantNumeric: 'tabular-nums' }}>{formatVND(nom.grossPrize)}</b>
                              </div>
                              <div style={{ fontSize: '10.5px', color: nom.commissionAmount > 0 ? '#EF4444' : 'var(--paper-dim)', fontVariantNumeric: 'tabular-nums', marginTop: '1px' }}>
                                - Hoa hồng: {formatVND(nom.commissionAmount || 0)}
                              </div>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#10B981', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                                Thực trả: +{formatVND(nom.netPayout || nom.grossPrize)}
                              </div>
                            </div>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '5px 12px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(245, 158, 11, 0.08)',
                              color: getTournamentTimeStatus(nom.date).isUpcoming ? '#F59E0B' : 'var(--paper-dim)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              whiteSpace: 'nowrap'
                            }}>
                              {getTournamentTimeStatus(nom.date).isUpcoming ? `⏳ Sắp thi đấu (${nom.date})` : 'Chưa thi đấu / Chờ kết quả'}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isExternal ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <span style={{
                                width: '154px',
                                height: '26px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                whiteSpace: 'nowrap',
                                boxSizing: 'border-box'
                              }}>
                                <span>🌐</span>
                                <span>Chủ Ngựa Tự Cập Nhật</span>
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
                                (Admin không can thiệp)
                              </span>
                            </div>
                          ) : (nom.status === 'PENDING' || nom.status === 'PENDING_APPROVAL' || (!nom.feeApproved && nom.status !== 'REJECTED')) ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                              <div style={{ fontSize: '10.5px', color: '#F59E0B', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {nom.paymentMethod === 'BANK' ? '💳 CK VietQR (5.000.000 ₫)' : '🏦 Quỹ hệ thống (5.000.000 ₫)'}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleApproveNomination(nom.id)}
                                style={{
                                  width: '154px',
                                  height: '28px',
                                  background: '#10B981',
                                  color: '#0A0D14',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxSizing: 'border-box'
                                }}
                                title="Xác nhận số tiền đã nộp 5.000.000 ₫ và duyệt cấp PDF thi đấu"
                              >
                                ✓ Duyệt Thu Phí & Cấp PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectModalData({ isOpen: true, nomination: nom, reason: '' })}
                                style={{
                                  width: '154px',
                                  height: '24px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxSizing: 'border-box'
                                }}
                              >
                                Từ Chối
                              </button>
                            </div>
                          ) : (nom.status === 'APPROVED' || nom.status === 'CONFIRMED' || nom.feeApproved) ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                              <span style={{
                                width: '154px',
                                height: '24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                boxSizing: 'border-box'
                              }}>
                                {nom.grossPrize ? '✓ Đã Quyết Toán' : '✓ Sẵn Sàng Thi Đấu'}
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
                                  width: '154px',
                                  height: '28px',
                                  background: 'rgba(212, 175, 55, 0.12)',
                                  border: '1px solid var(--brass)',
                                  color: 'var(--brass)',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <span>✏️</span>
                                <span>{nom.grossPrize ? 'Sửa Thưởng' : 'Nhập Kết Quả & Thưởng'}</span>
                              </button>
                            </div>
                          ) : nom.status === 'REJECTED' ? (
                            <span style={{
                              width: '154px',
                              height: '28px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '5px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontSize: '11px',
                              fontWeight: 700,
                              boxSizing: 'border-box'
                            }} title={nom.rejectionReason || ''}>
                              ✕ Đã Từ Chối
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
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
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newTournForm.date}
                      onChange={(e) => setNewTournForm({ ...newTournForm, date: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="date"
                      value={parseDateToYMD(newTournForm.date)}
                      onChange={(e) => {
                        if (e.target.value) {
                          const dmy = formatYMDToDMY(e.target.value);
                          setNewTournForm(prev => ({
                            ...prev,
                            date: dmy,
                            regCloseDate: prev.regCloseDate || dmy
                          }));
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        width: '28px',
                        height: '28px',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      title="Bấm để chọn ngày từ lịch"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        pointerEvents: 'none',
                        fontSize: '14px',
                        zIndex: 1,
                        opacity: 0.85
                      }}
                    >
                      📅
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Hạn Chót Đăng Ký
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newTournForm.regCloseDate}
                      onChange={(e) => setNewTournForm({ ...newTournForm, regCloseDate: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="date"
                      value={parseDateToYMD(newTournForm.regCloseDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewTournForm(prev => ({
                            ...prev,
                            regCloseDate: formatYMDToDMY(e.target.value)
                          }));
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        width: '28px',
                        height: '28px',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      title="Bấm để chọn ngày từ lịch"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        pointerEvents: 'none',
                        fontSize: '14px',
                        zIndex: 1,
                        opacity: 0.85
                      }}
                    >
                      📅
                    </span>
                  </div>
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

      {/* ===================== MODAL 1B: CHỈNH SỬA / CẬP NHẬT GIẢI ĐẤU NỘI BỘ ===================== */}
      {showEditTournModal && editTournForm && (
        <div
          onClick={() => setShowEditTournModal(false)}
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
                <span>✏️</span> Cập Nhật Giải Đấu Nội Bộ Nền Tảng
              </h3>
              <button
                type="button"
                onClick={() => setShowEditTournModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTournament}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                  Tên Giải Đấu *
                </label>
                <input
                  type="text"
                  required
                  value={editTournForm.name}
                  onChange={(e) => setEditTournForm({ ...editTournForm, name: e.target.value })}
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
                    value={editTournForm.track}
                    onChange={(e) => setEditTournForm({ ...editTournForm, track: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Mặt Sân Thi Đấu
                  </label>
                  <select
                    value={editTournForm.surface}
                    onChange={(e) => setEditTournForm({ ...editTournForm, surface: e.target.value })}
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
                    value={editTournForm.distance}
                    onChange={(e) => setEditTournForm({ ...editTournForm, distance: e.target.value })}
                    placeholder="2.400m"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Ngày Diễn Ra
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editTournForm.date}
                      onChange={(e) => setEditTournForm({ ...editTournForm, date: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="date"
                      value={parseDateToYMD(editTournForm.date)}
                      onChange={(e) => {
                        if (e.target.value) {
                          const dmy = formatYMDToDMY(e.target.value);
                          setEditTournForm(prev => ({
                            ...prev,
                            date: dmy,
                            regCloseDate: prev.regCloseDate || dmy
                          }));
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        width: '28px',
                        height: '28px',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      title="Bấm để chọn ngày từ lịch"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        pointerEvents: 'none',
                        fontSize: '14px',
                        zIndex: 1,
                        opacity: 0.85
                      }}
                    >
                      📅
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Hạn Chót Đăng Ký
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editTournForm.regCloseDate}
                      onChange={(e) => setEditTournForm({ ...editTournForm, regCloseDate: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="date"
                      value={parseDateToYMD(editTournForm.regCloseDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditTournForm(prev => ({
                            ...prev,
                            regCloseDate: formatYMDToDMY(e.target.value)
                          }));
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        width: '28px',
                        height: '28px',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      title="Bấm để chọn ngày từ lịch"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        pointerEvents: 'none',
                        fontSize: '14px',
                        zIndex: 1,
                        opacity: 0.85
                      }}
                    >
                      📅
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Tổng Quỹ Tiền Thưởng (VND)
                  </label>
                  <input
                    type="number"
                    value={editTournForm.totalPurse}
                    onChange={(e) => setEditTournForm({ ...editTournForm, totalPurse: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                    Lệ Phí Tham Gia (VND)
                  </label>
                  <input
                    type="number"
                    value={editTournForm.entryFee}
                    onChange={(e) => setEditTournForm({ ...editTournForm, entryFee: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* CẤU HÌNH TỶ LỆ HOA HỒNG (5% HOẶC 8%) */}
              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--brass)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--brass)', marginBottom: '6px' }}>
                  ⚙️ CẤU HÌNH TỶ LỆ HOA HỒNG NỀN TẢNG (5% – 8%)
                </label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--paper)' }}>
                    <input
                      type="radio"
                      name="editCommissionRate"
                      value="0.05"
                      checked={Number(editTournForm.commissionRate) === 0.05}
                      onChange={() => setEditTournForm({ ...editTournForm, commissionRate: 0.05 })}
                    />
                    <span><b>5%</b> (Ví dụ thưởng 500tr: Nền tảng 25tr, Chủ ngựa 475tr)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--paper)' }}>
                    <input
                      type="radio"
                      name="editCommissionRate"
                      value="0.08"
                      checked={Number(editTournForm.commissionRate) === 0.08}
                      onChange={() => setEditTournForm({ ...editTournForm, commissionRate: 0.08 })}
                    />
                    <span><b>8%</b> (Ví dụ thưởng 500tr: Nền tảng 40tr, Chủ ngựa 460tr)</span>
                  </label>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontStyle: 'italic' }}>
                  * Khi cập nhật, thông tin giải đấu và tỷ lệ hoa hồng sẽ lập tức đồng bộ sang giao diện Chủ sở hữu theo thời gian thực.
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', marginBottom: '5px' }}>
                  Thể Lệ Giải & Điều Khoản Cam Kết
                </label>
                <textarea
                  rows={3}
                  value={editTournForm.rulesAndTerms}
                  onChange={(e) => setEditTournForm({ ...editTournForm, rulesAndTerms: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditTournModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper-dim)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                >
                  ✓ Lưu Cập Nhật Giải Đấu
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
              <div>Chiến mã: <b style={{ color: 'var(--brass)' }}>{settleModalData.nomination?.horseName}</b> · Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{settleModalData.nomination?.ownerName || 'Chủ ngựa'}</b></div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                Giải đấu: {settleModalData.nomination?.raceName} ({settleModalData.nomination?.tournamentType === 'INTERNAL' ? 'Nội bộ Nền tảng' : 'Giải ngoài'}) · Ngày thi đấu: <b>{settleModalData.nomination?.date}</b>
              </div>
              {(() => {
                const tStatus = getTournamentTimeStatus(settleModalData.nomination?.date);
                if (tStatus.isUpcoming) {
                  return (
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#F59E0B' }}>
                      ⏳ Lưu ý: Giải đấu này diễn ra ngày <b>{tStatus.raceDateFormatted}</b> (chưa tới ngày thi đấu). Hệ thống sẽ tự động trừ hoa hồng {((settleModalData.nomination?.commissionRate || 0.05)*100).toFixed(0)}% và chuyển ngay tiền thực nhận sang tài khoản của Chủ sở hữu.
                    </div>
                  );
                }
                return null;
              })()}
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

      {/* ===================== MODAL 4: XEM XÉT KẾT QUẢ ĐUA & QUYẾT TOÁN CHO NGƯỜI CHIẾN THẮNG ===================== */}
      {reviewTournModal.isOpen && reviewTournModal.tournament && (() => {
        const targetTourn = reviewTournModal.tournament;
        const registeredHorses = adminNominations.filter(n =>
          (n.raceName && targetTourn && (n.raceName.trim().toLowerCase() === targetTourn.name.trim().toLowerCase() || targetTourn.name.trim().toLowerCase().includes(n.raceName.trim().toLowerCase()))) ||
          (n.raceId && targetTourn && String(n.raceId) === String(targetTourn.id))
        );

        return (
          <div
            onClick={() => setReviewTournModal({ isOpen: false, tournament: null })}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(5px)',
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
                borderRadius: '16px',
                width: '100%',
                maxWidth: '860px',
                padding: '24px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {/* HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🏆</span>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--brass)', fontWeight: 800 }}>
                      Xem Xét Kết Quả & Quyết Toán Thưởng Giải Nội Bộ
                    </h3>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--paper)', fontWeight: 700, marginTop: '4px' }}>
                    {targetTourn.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                    {targetTourn.track} · {targetTourn.distance} ({targetTourn.surface}) · Ngày thi đấu: <b>{targetTourn.date}</b>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewTournModal({ isOpen: false, tournament: null })}
                  style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* TỔNG QUAN QUỸ THƯỞNG & HOA HỒNG */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng Quỹ Tiền Thưởng</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brass)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                    {formatVND(targetTourn.totalPurse)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>Hạng 1 (50% Quỹ): <b>{formatVND(targetTourn.totalPurse * 0.5)}</b></div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Tỷ Lệ Hoa Hồng Nền Tảng</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                    Trích {((Number(targetTourn.commissionRate) || 0.05) * 100).toFixed(0)}% Thưởng
                  </div>
                  <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>Chủ ngựa nhận <b>{(100 - (Number(targetTourn.commissionRate) || 0.05) * 100).toFixed(0)}%</b> tiền thưởng</div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Chiến Mã Tham Dự</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--paper)', marginTop: '4px' }}>
                    {registeredHorses.length} chiến mã
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>Đã đăng ký tranh tài</div>
                </div>
              </div>

              {/* DANH SÁCH CHIẾN MÃ ĐÃ ĐĂNG KÝ TRONG GIẢI */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Danh Sách Chiến Mã Đăng Ký Tranh Tài</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)', fontWeight: 400 }}>
                    * Admin xem xét kết quả sau đua, chọn Người chiến thắng chung cuộc và thao tác chuyển tiền thưởng
                  </span>
                </div>

                {registeredHorses.length === 0 ? (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--line)', borderRadius: '10px', padding: '36px 20px', textAlign: 'center', color: 'var(--paper-dim)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏁</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>Chưa có chiến mã nào đăng ký giải này</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '460px', margin: '4px auto 0', lineHeight: 1.5 }}>
                      Khi các Chủ sở hữu nộp hồ sơ ghi danh (hoặc nhờ Huấn luyện viên chỉ định chiến mã tham gia), danh sách các ngựa sẽ tự động xuất hiện tại đây để Admin thẩm định và trao giải.
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                          <th style={{ padding: '10px 14px', width: '28%' }}>Chiến Mã & Kỵ Mã</th>
                          <th style={{ padding: '10px 14px', width: '20%' }}>Chủ Sở Hữu</th>
                          <th style={{ padding: '10px 14px', width: '24%', textAlign: 'center' }}>Thứ Hạng Chung Cuộc</th>
                          <th style={{ padding: '10px 14px', width: '28%', textAlign: 'center' }}>Quyết Toán & Thao Tác Tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredHorses.map(nom => {
                          const isWinner = nom.finalRank === 1 || nom.rank?.includes('1');
                          const isSettled = nom.grossPrize && nom.grossPrize > 0;

                          return (
                            <tr
                              key={nom.id}
                              style={{
                                borderBottom: '1px solid var(--line)',
                                background: isWinner ? 'rgba(212, 175, 55, 0.06)' : 'transparent'
                              }}
                            >
                              <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '18px' }}>{isWinner ? '🏆' : '🏇'}</span>
                                  <div>
                                    <div style={{ fontWeight: 700, color: isWinner ? 'var(--brass)' : 'var(--paper)', fontSize: '13.5px' }}>
                                      {nom.horseName}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                      Nài: {nom.jockey?.replace('Chủ sở hữu tự bố trí', 'Tự bố trí') || 'Tự bố trí'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                <div style={{ fontWeight: 600, color: 'var(--paper)' }}>{nom.ownerName}</div>
                                <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Chủ sở hữu chiến mã</div>
                              </td>

                              <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                                {isWinner ? (
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '3px 10px',
                                      borderRadius: '6px',
                                      fontSize: '11.5px',
                                      fontWeight: 800,
                                      background: 'rgba(212, 175, 55, 0.2)',
                                      color: 'var(--brass)',
                                      border: '1px solid var(--brass)'
                                    }}>
                                      🏆 VÔ ĐỊCH (HẠNG 1)
                                    </span>
                                    <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 600 }}>
                                      Người chiến thắng chung cuộc
                                    </span>
                                  </div>
                                ) : isSettled ? (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--paper)',
                                    border: '1px solid var(--line)'
                                  }}>
                                    {nom.rank || `Hạng ${nom.finalRank}`}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                                    Chờ cập nhật kết quả đua
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                                {isSettled ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                                      Đã chuyển: +{formatVND(nom.netPayout || nom.grossPrize)}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>
                                      (Tổng {formatVND(nom.grossPrize)} - {((nom.commissionRate || 0.05)*100).toFixed(0)}% hoa hồng)
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSettleModalData({
                                          isOpen: true,
                                          nomination: nom,
                                          finalRank: nom.finalRank || 1,
                                          grossPrize: nom.grossPrize || Math.round(targetTourn.totalPurse * 0.5)
                                        });
                                      }}
                                      style={{
                                        marginTop: '2px',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: 'transparent',
                                        border: '1px solid var(--line)',
                                        color: 'var(--paper-dim)',
                                        fontSize: '10.5px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ✏️ Điều Chỉnh
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const winnerPrize = Math.round(targetTourn.totalPurse * 0.5); // 50% quỹ thưởng cho Hạng 1
                                        setSettleModalData({
                                          isOpen: true,
                                          nomination: nom,
                                          finalRank: 1,
                                          grossPrize: winnerPrize
                                        });
                                      }}
                                      style={{
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        background: 'var(--brass)',
                                        color: '#0A0D14',
                                        fontSize: '11.5px',
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                                      }}
                                      title="Chọn làm Người Chiến Thắng Chung Cuộc và quyết toán chuyển tiền"
                                    >
                                      <span>🏆</span> Chọn Vô Địch & Chuyển Tiền
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSettleModalData({
                                          isOpen: true,
                                          nomination: nom,
                                          finalRank: 2,
                                          grossPrize: Math.round(targetTourn.totalPurse * 0.25)
                                        });
                                      }}
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        background: 'transparent',
                                        border: '1px solid var(--line)',
                                        color: 'var(--paper-dim)',
                                        fontSize: '10.5px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Xếp thứ hạng khác...
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setReviewTournModal({ isOpen: false, tournament: null })}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

