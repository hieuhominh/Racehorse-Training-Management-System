import React, { useState } from 'react';
import { getTournamentTimeStatus } from '../services/api';

export default function OwnerTournamentsTab({
  OPEN_TOURNAMENTS = [],
  raceNominations = [],
  setRaceNominations,
  myHorses = [],
  ownerKey = '',
  currentUser = null,
  membershipTier = 'FREE',
  formatVND = (v) => `${(v || 0).toLocaleString('vi-VN')} ₫`,
  handleOpenRaceRegister,
  handleToggleNomination,
  showToast,
  setShowExternalRecordModal,
  setExternalRecordForm
}) {
  const [subTab, setSubTab] = useState('INTERNAL'); // 'INTERNAL' | 'EXTERNAL' | 'MY_RACES'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
  const [selectedTournInfoModal, setSelectedTournInfoModal] = useState(null);
  const [transferModalData, setTransferModalData] = useState(null);
  const [transferForm, setTransferForm] = useState({
    newOwnerName: '',
    newOwnerPhone: '',
    newOwnerIdCard: '',
    note: ''
  });

  const handleConfirmTransfer = (e) => {
    e.preventDefault();
    if (!transferForm.newOwnerName.trim()) {
      if (showToast) showToast('Vui lòng nhập họ và tên người nhận chuyển nhượng.', 'THIẾU THÔNG TIN', 'error');
      return;
    }
    let cleanPhone = transferForm.newOwnerPhone.trim().replace(/^\+84\s?0?/, '0').replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('0') && cleanPhone.length === 9) cleanPhone = '0' + cleanPhone;
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      if (showToast) showToast('Số điện thoại người nhận không hợp lệ! Vui lòng nhập đúng 10 chữ số (ví dụ: 0335299265).', 'LỖI SỐ ĐIỆN THOẠI', 'error');
      return;
    }
    if (!transferForm.newOwnerIdCard.trim()) {
      if (showToast) showToast('Vui lòng nhập số CCCD/CMND người nhận chuyển nhượng.', 'THIẾU THÔNG TIN', 'error');
      return;
    }

    const { tournament, nomination } = transferModalData;
    const updatedNomination = {
      ...nomination,
      transferredTo: transferForm.newOwnerName.trim(),
      transferredPhone: cleanPhone,
      transferredIdCard: transferForm.newOwnerIdCard.trim(),
      transferNote: transferForm.note.trim(),
      transferDate: new Date().toLocaleDateString('vi-VN'),
      status: 'TRANSFERRED',
      nominationStatus: 'TRANSFERRED'
    };

    if (setRaceNominations) {
      setRaceNominations(prev => {
        const next = prev.map(item => {
          if ((nomination.id && item.id === nomination.id) ||
              (nomination.tournamentId && item.tournamentId === nomination.tournamentId && item.horseId === nomination.horseId)) {
            return updatedNomination;
          }
          return item;
        });
        try {
          localStorage.setItem(`saved_race_nominations_${ownerKey}`, JSON.stringify(next));
        } catch (err) {
          console.error(err);
        }
        return next;
      });
    }

    if (showToast) showToast(`Đã hoàn tất chuyển nhượng suất tham dự giải "${tournament?.name || nomination?.raceName}" cho ${transferForm.newOwnerName.trim()}!`, 'CHUYỂN NHƯỢNG THÀNH CÔNG', 'success');
    setTransferModalData(null);
    setTransferForm({ newOwnerName: '', newOwnerPhone: '', newOwnerIdCard: '', note: '' });
  };

  const internalTournaments = OPEN_TOURNAMENTS.filter(t => t.tournamentType === 'INTERNAL');
  const externalTournaments = OPEN_TOURNAMENTS.filter(t => t.tournamentType === 'EXTERNAL');

  const filteredNominations = raceNominations.filter(r => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'APPROVED') return r.nominationStatus === 'APPROVED' || r.nominationStatus === 'CONFIRMED' || r.status === 'APPROVED' || r.status === 'CONFIRMED';
    if (statusFilter === 'PENDING') return r.nominationStatus === 'PENDING' || r.nominationStatus === 'PENDING_TRAINER' || r.nominationStatus === 'PENDING_TRAINER_SELECTION' || r.status === 'PENDING';
    if (statusFilter === 'REJECTED') return r.nominationStatus === 'REJECTED' || r.nominationStatus === 'DECLINED' || r.status === 'REJECTED';
    return true;
  });

  return (
    <div className="tab-pane">
      {/* PANE HEADER */}
      <div className="pane-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="pane-title">Hệ Thống Giải Đấu & Đăng Ký Thi Đấu (Race Tournaments)</h2>
          <p className="pane-desc">Vận hành 2 mô hình giải đấu song song: Giải nội bộ Nền tảng và Giải đấu tự do bên ngoài.</p>
        </div>
      </div>

      {/* THANH CHUYỂN SUB-TABS 2 MÔ HÌNH */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: 'var(--bg-card)',
        padding: '6px',
        borderRadius: '8px',
        border: '1px solid var(--line)',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setSubTab('INTERNAL')}
          style={{
            flex: '1 1 auto',
            padding: '9px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'INTERNAL' ? 'var(--brass)' : 'transparent',
            color: subTab === 'INTERNAL' ? '#0A0D14' : 'var(--paper-dim)',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>🏆</span>
          <span>Giải Đấu Nền Tảng</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('EXTERNAL')}
          style={{
            flex: '1 1 auto',
            padding: '9px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'EXTERNAL' ? '#10B981' : 'transparent',
            color: subTab === 'EXTERNAL' ? '#0A0D14' : 'var(--paper-dim)',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>🌐</span>
          <span>Giải Đấu Ngoài</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('MY_RACES')}
          style={{
            flex: '1 1 auto',
            padding: '9px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'MY_RACES' ? 'var(--bg-secondary)' : 'transparent',
            color: subTab === 'MY_RACES' ? 'var(--paper)' : 'var(--paper-dim)',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📋</span>
          <span>Lịch Sử & Đối Soát Thưởng ({raceNominations.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: MÔ HÌNH B - GIẢI NỘI BỘ NỀN TẢNG */}
      {subTab === 'INTERNAL' && (
        <div>
          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '18px',
            fontSize: '12.5px',
            lineHeight: 1.5,
            color: 'var(--paper)'
          }}>
            <b style={{ color: 'var(--brass)' }}>🏆 Thể lệ & Quy tắc Doanh thu Giải Nền Tảng:</b> Giải đấu do Ban Điều Hành Nền Tảng trực tiếp tổ chức. Hoa hồng giải đấu trích nộp từ <b>5% – 8%</b> trên tổng tiền thưởng đoạt giải được công khai theo từng giải và thông báo trước khi Chủ ngựa chấp thuận ghi danh. Đơn đăng ký được Admin & Huấn luyện viên trưởng thẩm định điều kiện trước khi xếp lịch xuất phát.
          </div>

          <div className="portal-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            {internalTournaments.map(tourn => {
              const timeStatus = getTournamentTimeStatus(tourn);
              return (
                <div
                  key={tourn.id}
                  className="facility-card"
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', minHeight: '46px', marginBottom: '8px' }}>
                      <b style={{
                        fontSize: '15px',
                        color: 'var(--paper)',
                        lineHeight: 1.3,
                        flex: 1,
                        minHeight: '40px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {tourn.name}
                      </b>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: timeStatus.isRaceStarted
                            ? 'rgba(16, 185, 129, 0.15)'
                            : timeStatus.isRegClosed
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color: timeStatus.isRaceStarted
                            ? '#10B981'
                            : timeStatus.isRegClosed
                              ? '#EF4444'
                              : '#10B981',
                          border: `1px solid ${
                            timeStatus.isRaceStarted
                              ? '#10B981'
                              : timeStatus.isRegClosed
                                ? '#EF4444'
                                : '#10B981'
                          }`,
                          whiteSpace: 'nowrap'
                        }}>
                          {timeStatus.isRaceStarted
                            ? '🏁 ĐANG DIỄN RA / HOÀN THÀNH'
                            : timeStatus.isRegClosed
                              ? '🔒 ĐÃ ĐÓNG ĐĂNG KÝ'
                              : '🟢 ĐANG MỞ ĐĂNG KÝ'}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--brass)',
                          border: '1px solid var(--brass)',
                          whiteSpace: 'nowrap'
                        }}>
                          {tourn.distance}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: 'var(--paper-dim)',
                      minHeight: '34px',
                      lineHeight: 1.4,
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {tourn.track} · {tourn.surface} · Đơn vị tổ chức: <b>{tourn.organizerName || 'Ban Quản Trị Nền Tảng'}</b>
                    </div>

                    <p style={{
                      fontSize: '12px',
                      color: 'var(--paper-dim)',
                      lineHeight: 1.4,
                      margin: '0 0 12px',
                      minHeight: '36px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {tourn.description}
                    </p>

                    <div style={{
                      background: 'var(--bg-secondary)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      minHeight: '84px',
                      marginBottom: '10px',
                      boxSizing: 'border-box'
                    }}>
                      <div>Ngày thi đấu: <b style={{ color: 'var(--paper)', display: 'block' }}>{tourn.date}</b></div>
                      <div>
                        Hạn chót đăng ký: 
                        <b style={{ color: timeStatus.isRegClosed ? '#EF4444' : '#10B981', display: 'block' }}>
                          {tourn.regCloseDate || tourn.entryDeadline || timeStatus.regDeadlineFormatted} {timeStatus.isRegClosed ? '(Hết hạn)' : '(Đang mở)'}
                        </b>
                      </div>
                      <div>Tổng giải thưởng: <b style={{ color: 'var(--brass)', display: 'block', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatVND(tourn.totalPurse)}</b></div>
                      <div>Lệ phí tham gia: <b style={{ color: '#10B981', display: 'block' }}>5.000.000 ₫</b></div>
                    </div>

                    {/* QUYỀN LỢI KHÁN ĐÀI */}
                    <div style={{
                      marginBottom: '14px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
                      border: `1px solid ${membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.3)' : 'var(--line)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11.5px',
                      minHeight: '34px',
                      boxSizing: 'border-box'
                    }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Quyền lợi khán đài:</span>
                      {membershipTier === 'PREMIUM' ? (
                        <span style={{ color: 'var(--brass)', fontWeight: 700 }}>VIP Lounge & Paddock Pass</span>
                      ) : (
                        <span style={{ color: 'var(--paper)', fontWeight: 600 }}>Khán đài tiêu chuẩn</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    {(() => {
                      const userNomination = raceNominations.find(r => 
                        (r.tournamentId && String(r.tournamentId) === String(tourn.id)) ||
                        (r.raceName && r.raceName.toLowerCase().trim() === (tourn.name || '').toLowerCase().trim())
                      );

                      if (userNomination) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              background: userNomination.entryFeePaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              border: `1px solid ${userNomination.entryFeePaid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: userNomination.entryFeePaid ? '#10B981' : '#F59E0B',
                              textAlign: 'center'
                            }}>
                              {userNomination.status === 'TRANSFERRED' || userNomination.nominationStatus === 'TRANSFERRED'
                                ? `🔄 ĐÃ CHUYỂN NHƯỢNG (${userNomination.transferredTo || 'Người nhận'})`
                                : userNomination.entryFeePaid
                                  ? '✓ ĐÃ ĐĂNG KÝ (ĐÃ ĐÓNG PHÍ)'
                                  : '⏳ ĐÃ ĐĂNG KÝ (CHỜ ĐÓNG PHÍ)'}
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 500, marginTop: '2px' }}>
                                Chiến mã: <span style={{ color: 'var(--brass)', fontWeight: 700 }}>{userNomination.horseName || 'Chiến mã của bạn'}</span>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTournInfoModal({ tournament: tourn, nomination: userNomination })}
                                style={{
                                  height: '40px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--paper)',
                                  fontWeight: 700,
                                  border: '1px solid var(--line)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>ℹ️</span>
                                <span>Thông Tin Giải</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTransferModalData({ tournament: tourn, nomination: userNomination });
                                  setTransferForm({ newOwnerName: '', newOwnerPhone: '', newOwnerIdCard: '', note: '' });
                                }}
                                style={{
                                  height: '40px',
                                  borderRadius: '6px',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60A5FA',
                                  fontWeight: 700,
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>🔄</span>
                                <span>Chuyển Nhượng</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (timeStatus.isRaceStarted) {
                        return (
                          <button
                            type="button"
                            disabled={true}
                            title="Giải đấu nội bộ do Ban Quản Trị / Admin cập nhật kết quả và chuyển thưởng cho Chủ sở hữu."
                            style={{
                              width: '100%',
                              height: '42px',
                              padding: '0 12px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              fontWeight: 600,
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontSize: '12px',
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🏁</span>
                            <span>Đang Diễn Ra / Chờ Admin Cập Nhật</span>
                          </button>
                        );
                      }

                      if (timeStatus.isRegClosed) {
                        return (
                          <button
                            type="button"
                            disabled={true}
                            style={{
                              width: '100%',
                              height: '42px',
                              padding: '0 12px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--paper-dim)',
                              fontWeight: 600,
                              border: '1px solid var(--line)',
                              fontSize: '12px',
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🔒</span>
                            <span>Đã Đóng Đăng Ký (Hạn chót: {tourn.regCloseDate || tourn.entryDeadline || timeStatus.regDeadlineFormatted})</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenRaceRegister && handleOpenRaceRegister(tourn)}
                          style={{
                            width: '100%',
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            background: 'var(--brass)',
                            color: '#0A0D14',
                            fontWeight: 700,
                            border: 'none',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🏆</span>
                          <span>Đăng Ký Tham Gia Giải Này</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MÔ HÌNH A - GIẢI ĐẤU NGOÀI ĐỘC LẬP */}
      {subTab === 'EXTERNAL' && (
        <div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '18px',
            fontSize: '12.5px',
            lineHeight: 1.5,
            color: 'var(--paper)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ maxWidth: '750px' }}>
              <b style={{ color: '#10B981', fontSize: '13px' }}>🌐 Thể lệ & Quy tắc Doanh thu Giải Ngoài:</b>
              <p style={{ margin: '4px 0 0', color: 'var(--paper-dim)' }}>
                Chủ sở hữu tự do tìm kiếm, đăng ký và thanh toán trực tiếp với Ban tổ chức bên ngoài. <b>Nền tảng cam kết TUYỆT ĐỐI KHÔNG thu hoa hồng (0% phí hoa hồng)</b>. Chủ ngựa nhận trọn vẹn 100% tiền thưởng và được quyền lưu trữ, cập nhật thành tích chiến mã vào hệ thống.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstHorse = myHorses[0];
                if (setExternalRecordForm) {
                  setExternalRecordForm({
                    raceName: '',
                    organizerName: '',
                    horseId: firstHorse ? String(firstHorse.id) : '',
                    track: '',
                    surface: 'Sân cát tự nhiên',
                    distance: '1.600m',
                    date: '',
                    jockey: '',
                    rank: 'Hạng 1',
                    grossPrize: 100000000,
                    notes: ''
                  });
                }
                if (setShowExternalRecordModal) setShowExternalRecordModal(true);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                background: '#10B981',
                color: '#0A0D14',
                fontWeight: 700,
                border: 'none',
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              + Khai Báo Thành Tích Giải Ngoài
            </button>
          </div>

          <div className="portal-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            {externalTournaments.map(tourn => {
              const timeStatus = getTournamentTimeStatus(tourn.date);
              const existingExtRecord = (raceNominations || []).find(r => 
                (r.tournamentType === 'EXTERNAL' || r.isExternal) && 
                r.raceName === tourn.name
              );

              return (
                <div
                  key={tourn.id}
                  className="facility-card"
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxSizing: 'border-box',
                    border: existingExtRecord
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : timeStatus.isRegNotOpenYet
                        ? '1px solid rgba(245, 158, 11, 0.25)'
                        : timeStatus.isRegClosed && !timeStatus.isRaceStarted
                          ? '1px solid rgba(239, 68, 68, 0.25)'
                          : '1px solid rgba(16, 185, 129, 0.3)',
                    background: existingExtRecord ? 'rgba(245, 158, 11, 0.02)' : undefined
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', minHeight: '46px', marginBottom: '8px' }}>
                      <b style={{
                        fontSize: '15px',
                        color: 'var(--paper)',
                        lineHeight: 1.3,
                        flex: 1,
                        minHeight: '40px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {tourn.name}
                      </b>
                      {existingExtRecord ? (
                        <span style={{
                          flexShrink: 0,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid #F59E0B',
                          whiteSpace: 'nowrap'
                        }}>
                          {existingExtRecord.rank?.includes('Đăng Ký') ? '✓ ĐÃ ĐĂNG KÝ THAM GIA' : `✓ ĐÃ GHI NHẬN: ${existingExtRecord.rank?.split('(')[0]?.trim() || 'Thành tích'}`}
                        </span>
                      ) : timeStatus.isRegNotOpenYet ? (
                        <span style={{
                          flexShrink: 0,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid #F59E0B',
                          whiteSpace: 'nowrap'
                        }}>
                          ⏳ CHƯA MỞ ĐĂNG KÝ
                        </span>
                      ) : timeStatus.isRegClosed && !timeStatus.isRaceStarted ? (
                        <span style={{
                          flexShrink: 0,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          whiteSpace: 'nowrap'
                        }}>
                          🔒 ĐÃ ĐÓNG ĐĂNG KÝ
                        </span>
                      ) : timeStatus.isRegOpen ? (
                        <span style={{
                          flexShrink: 0,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid #10B981',
                          whiteSpace: 'nowrap'
                        }}>
                          🟢 ĐANG MỞ ĐĂNG KÝ
                        </span>
                      ) : (
                        <span style={{
                          flexShrink: 0,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid #10B981',
                          whiteSpace: 'nowrap'
                        }}>
                          🏁 ĐANG DIỄN RA / HOÀN THÀNH
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: 'var(--paper-dim)',
                      minHeight: '34px',
                      lineHeight: 1.4,
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {tourn.track} · {tourn.surface} · Đơn vị tổ chức ngoài: <b>{tourn.organizerName}</b>
                    </div>

                    <p style={{
                      fontSize: '12px',
                      color: 'var(--paper-dim)',
                      lineHeight: 1.4,
                      margin: '0 0 12px',
                      minHeight: '36px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {tourn.description}
                    </p>

                    <div style={{
                      background: 'var(--bg-secondary)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      minHeight: '84px',
                      marginBottom: '10px',
                      boxSizing: 'border-box'
                    }}>
                      <div>Cự ly: <b style={{ color: 'var(--paper)', display: 'block' }}>{tourn.distance}</b></div>
                      <div>Ngày thi đấu: <b style={{ color: 'var(--paper)', display: 'block' }}>{tourn.date}</b></div>
                      <div>Tổng giải thưởng: <b style={{ color: '#10B981', display: 'block', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatVND(tourn.totalPurse)}</b></div>
                      <div>Lệ phí nền tảng: <b style={{ color: '#10B981', display: 'block' }}>Miễn phí (0 ₫)</b></div>
                    </div>

                    {/* CƠ CẤU GIẢI THƯỞNG CHI TIẾT THEO THỨ HẠNG */}
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      minHeight: '84px',
                      marginBottom: '14px',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        🏆 Cơ cấu giải thưởng phân bổ theo thứ hạng:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 10px', color: 'var(--paper-dim)' }}>
                        <div>• Giải Nhất (50%): <b style={{ color: '#10B981', whiteSpace: 'nowrap' }}>{formatVND(Math.round(tourn.totalPurse * 0.5))}</b></div>
                        <div>• Giải Nhì (25%): <b style={{ color: '#10B981', whiteSpace: 'nowrap' }}>{formatVND(Math.round(tourn.totalPurse * 0.25))}</b></div>
                        <div>• Giải Ba (15%): <b style={{ color: '#10B981', whiteSpace: 'nowrap' }}>{formatVND(Math.round(tourn.totalPurse * 0.15))}</b></div>
                        <div>• Top 5 (5%): <b style={{ color: '#10B981', whiteSpace: 'nowrap' }}>{formatVND(Math.round(tourn.totalPurse * 0.05))}</b></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    {(() => {
                      const userNomination = (raceNominations || []).find(r => 
                        (r.tournamentId && String(r.tournamentId) === String(tourn.id)) ||
                        (r.raceName && r.raceName.toLowerCase().trim() === (tourn.name || '').toLowerCase().trim())
                      );

                      if (userNomination) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              background: userNomination.entryFeePaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              border: `1px solid ${userNomination.entryFeePaid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: userNomination.entryFeePaid ? '#10B981' : '#F59E0B',
                              textAlign: 'center'
                            }}>
                              {userNomination.status === 'TRANSFERRED' || userNomination.nominationStatus === 'TRANSFERRED'
                                ? `🔄 ĐÃ CHUYỂN NHƯỢNG (${userNomination.transferredTo || 'Người nhận'})`
                                : userNomination.entryFeePaid
                                  ? '✓ ĐÃ ĐĂNG KÝ (ĐÃ ĐÓNG PHÍ)'
                                  : '⏳ ĐÃ ĐĂNG KÝ (CHỜ ĐÓNG PHÍ)'}
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 500, marginTop: '2px' }}>
                                Chiến mã: <span style={{ color: 'var(--brass)', fontWeight: 700 }}>{userNomination.horseName || 'Chiến mã của bạn'}</span>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTournInfoModal({ tournament: tourn, nomination: userNomination })}
                                style={{
                                  height: '40px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--paper)',
                                  fontWeight: 700,
                                  border: '1px solid var(--line)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>ℹ️</span>
                                <span>Thông Tin Giải</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTransferModalData({ tournament: tourn, nomination: userNomination });
                                  setTransferForm({ newOwnerName: '', newOwnerPhone: '', newOwnerIdCard: '', note: '' });
                                }}
                                style={{
                                  height: '40px',
                                  borderRadius: '6px',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60A5FA',
                                  fontWeight: 700,
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>🔄</span>
                                <span>Chuyển Nhượng</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })() || (existingExtRecord ? (
                      <button
                        type="button"
                        onClick={() => {
                          const matchedHorse = myHorses.find(h => h.name === existingExtRecord.horseName || String(h.id) === String(existingExtRecord.horseId)) || myHorses[0];
                          if (setExternalRecordForm) {
                            setExternalRecordForm({
                              recordId: existingExtRecord.id,
                              isEditing: true,
                              raceName: tourn.name,
                              organizerName: tourn.organizerName || existingExtRecord.organizerName,
                              horseId: matchedHorse ? String(matchedHorse.id) : '',
                              track: tourn.track || existingExtRecord.track,
                              surface: tourn.surface || existingExtRecord.surface,
                              distance: tourn.distance || existingExtRecord.distance,
                              date: tourn.date || existingExtRecord.date,
                              jockey: existingExtRecord.jockey || '',
                              rank: existingExtRecord.rank || (timeStatus.isRaceStarted ? 'Hạng 1 (Giải Nhất - 50% Quỹ)' : 'Đăng Ký Tham Gia (Chờ Thi Đấu)'),
                              basePurse: tourn.totalPurse || existingExtRecord.basePurse,
                              grossPrize: existingExtRecord.grossPrize !== undefined ? existingExtRecord.grossPrize : (timeStatus.isRaceStarted ? Math.round((tourn.totalPurse || 0) * 0.5) : 0),
                              notes: existingExtRecord.notes || ''
                            });
                          }
                          if (setShowExternalRecordModal) setShowExternalRecordModal(true);
                        }}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          fontWeight: 700,
                          border: '1px solid #F59E0B',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>✏️</span>
                        <span>{timeStatus.isRaceStarted ? 'Thay Đổi Ghi Nhận Thành Tích' : 'Thay Đổi Đăng Ký Tham Gia'}</span>
                      </button>
                    ) : timeStatus.isRegNotOpenYet ? (
                      <button
                        type="button"
                        disabled={true}
                        title={`Giải đấu sẽ mở cổng đăng ký từ ngày ${timeStatus.regOpenDeadlineFormatted} (mở trước 1 tháng, đóng trước 1 tuần trước ngày thi đấu).`}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--paper-dim)',
                          fontWeight: 600,
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: 0.6
                        }}
                      >
                        <span>⏳</span>
                        <span>Chưa Mở Đăng Ký (Mở từ {timeStatus.regOpenDeadlineFormatted})</span>
                      </button>
                    ) : timeStatus.isRegClosed && !timeStatus.isRaceStarted ? (
                      <button
                        type="button"
                        disabled={true}
                        title={`Giải đấu đã đóng đăng ký tham gia (đóng trước 1 tuần). Ngày thi đấu: ${tourn.date}.`}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--paper-dim)',
                          fontWeight: 600,
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: 0.6
                        }}
                      >
                        <span>🔒</span>
                        <span>Đã Đóng Đăng Ký (Chờ ngày đua: {tourn.date})</span>
                      </button>
                    ) : timeStatus.isRegOpen ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRaceRegister && handleOpenRaceRegister(tourn)}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          fontWeight: 700,
                          border: '1px solid #10B981',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🌐</span>
                        <span>+ Đăng Ký Tham Gia Giải Này</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const firstHorse = myHorses[0];
                          if (setExternalRecordForm) {
                            setExternalRecordForm({
                              recordId: '',
                              isEditing: false,
                              raceName: tourn.name,
                              organizerName: tourn.organizerName,
                              horseId: firstHorse ? String(firstHorse.id) : '',
                              track: tourn.track,
                              surface: tourn.surface,
                              distance: tourn.distance,
                              date: tourn.date,
                              jockey: '',
                              rank: 'Hạng 1 (Giải Nhất - 50% Quỹ)',
                              basePurse: tourn.totalPurse,
                              grossPrize: tourn.totalPurse ? Math.round(tourn.totalPurse * 0.5) : 150000000,
                              notes: 'Ghi nhận thành tích giải ngoài độc lập'
                            });
                          }
                          if (setShowExternalRecordModal) setShowExternalRecordModal(true);
                        }}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          fontWeight: 700,
                          border: '1px solid #10B981',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🌐</span>
                        <span>+ Ghi Nhận Thành Tích Giải Này</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LỊCH SỬ THI ĐẤU & ĐỐI SOÁT TÀI CHÍNH */}
      {subTab === 'MY_RACES' && (
        <div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--paper)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span>DANH SÁCH GIẢI ĐẤU CỦA BẠN ({raceNominations.length})</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--line)',
                    background: statusFilter === st ? 'var(--brass)' : 'var(--bg-card)',
                    color: statusFilter === st ? '#0A0D14' : 'var(--paper-dim)'
                  }}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'APPROVED' ? 'Đã duyệt' : st === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                </button>
              ))}
            </div>
          </div>

          {filteredNominations.length === 0 ? (
            <div className="facility-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: 0 }}>
                Không có dữ liệu giải đấu nào theo bộ lọc. Hãy chuyển sang tab <b>Giải Đấu Nền Tảng</b> để đăng ký giải Nền tảng hoặc tab <b>Giải Đấu Ngoài</b> để ghi nhận giải đấu ngoài.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredNominations.map((r) => {
                const isApproved = r.nominationStatus === 'APPROVED' || r.nominationStatus === 'CONFIRMED' || r.status === 'APPROVED' || r.status === 'CONFIRMED';
                const isWithdrawn = r.nominationStatus === 'WITHDRAWN';
                const isRejected = r.nominationStatus === 'REJECTED' || r.nominationStatus === 'DECLINED' || r.status === 'REJECTED';
                const isDelegatedPending = r.delegatedToTrainer && !r.trainerAssigned && (r.nominationStatus === 'PENDING_TRAINER_SELECTION' || r.nominationStatus === 'PENDING_TRAINER');
                const isPending = !isApproved && !isWithdrawn && !isRejected && !isDelegatedPending;
                const isExternal = r.tournamentType === 'EXTERNAL' || r.isExternal;
                const rTimeStatus = getTournamentTimeStatus(r.date);

                // Chỉ tính thưởng khi giải đã thi đấu xong & có kết quả đoạt giải chính thức
                const hasSettledPrize = Boolean(r.isSettled || r.settled || (isApproved && r.rank && !r.rank.includes('Chờ') && Number(r.grossPrize) > 0));
                const grossPrize = hasSettledPrize ? (Number(r.grossPrize) || 0) : 0;
                const netPayout = grossPrize;
                const entryFeePaid = Boolean(r.entryFeePaid || r.isPaid);

                return (
                  <div key={r.id} className="facility-card" style={{
                    padding: '20px',
                    border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : isExternal ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--line)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: isExternal ? 'rgba(59, 130, 246, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                            color: isExternal ? '#3B82F6' : 'var(--brass)',
                            border: `1px solid ${isExternal ? '#3B82F6' : 'var(--brass)'}`
                          }}>
                            {isExternal ? '🌐 GIẢI ĐẤU NGOÀI' : '🏆 GIẢI ĐẤU NỀN TẢNG'}
                          </span>
                          {r.rank && (
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10B981',
                              border: '1px solid #10B981'
                            }}>
                              {r.rank}
                            </span>
                          )}
                          <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{r.raceName}</b>
                        </div>
                        <div style={{ fontSize: '12.5px', marginTop: '2px' }}>
                          {isDelegatedPending ? (
                            <span style={{ color: 'var(--brass)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                              <span>⏳</span> Chiến mã: <i>Đang nhờ {r.targetTrainer || 'HLV chính'} tuyển chọn</i>
                            </span>
                          ) : r.trainerAssigned ? (
                            <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                              <span>✓</span> Chiến mã (HLV chỉ định): <b style={{ color: 'var(--brass)', fontSize: '13.5px' }}>{r.horseName}</b>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--brass)', fontWeight: 600 }}>Chiến mã: {r.horseName}</span>
                          )} · <span style={{ color: 'var(--paper-dim)' }}>{r.distance} ({r.track || 'Trường đua'})</span>
                        </div>
                      </div>

                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        background: isApproved 
                          ? 'rgba(16, 185, 129, 0.15)' 
                          : isRejected
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isWithdrawn
                          ? 'var(--bg-secondary)'
                          : 'rgba(212, 175, 55, 0.15)',
                        color: isApproved 
                          ? '#10B981' 
                          : isRejected
                          ? '#EF4444'
                          : isWithdrawn
                          ? 'var(--paper-dim)'
                          : 'var(--brass)',
                        border: `1px solid ${isApproved ? '#10B981' : isRejected ? '#EF4444' : isWithdrawn ? 'var(--line)' : 'var(--brass)'}`
                      }}>
                        {isApproved 
                          ? (isExternal ? '✓ ĐÃ LƯU KẾT QUẢ GIẢI NGOÀI' : '✓ ADMIN & HLV ĐÃ PHÊ DUYỆT')
                          : isRejected
                          ? '✗ TỪ CHỐI THAM GIA'
                          : isWithdrawn 
                          ? 'ĐÃ RÚT LUI' 
                          : isDelegatedPending
                          ? '⏳ ĐANG CHỜ HLV CHỈ ĐỊNH NGỰA'
                          : '⏳ ĐANG THẨM ĐỊNH ĐIỀU KIỆN'}
                      </span>
                    </div>

                    {/* BẢNG ĐỐI SOÁT TIỀN THƯỞNG KHI GIẢI ĐÃ CÓ KẾT QUẢ ĐOẠT GIẢI (ĐÃ BỎ PHẦN HOA HỒNG NỀN TẢNG) */}
                    {grossPrize > 0 && (
                      <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Tiền Thưởng Đoạt Giải ({r.rank})</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--paper)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                            {formatVND(grossPrize)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Thực Nhận Của Chủ Ngựa</div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#10B981', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                            {formatVND(netPayout)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TRẠNG THÁI LỆ PHÍ THAM GIA GIẢI */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: 'var(--paper-dim)' }}>
                        Lệ phí tham gia giải đấu: <b style={{ color: 'var(--paper)' }}>5.000.000 ₫</b>
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '11px',
                        background: entryFeePaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: entryFeePaid ? '#10B981' : '#F59E0B',
                        border: `1px solid ${entryFeePaid ? '#10B981' : '#F59E0B'}`
                      }}>
                        {entryFeePaid ? '✓ Đã đóng lệ phí' : 'Chưa thanh toán lệ phí'}
                      </span>
                    </div>

                    {/* THÔNG BÁO TIẾN ĐỘ THI ĐẤU & PHÂN QUYỀN GIẢI NỘI BỘ (KHI CHƯA QUYẾT TOÁN) */}
                    {grossPrize <= 0 && isApproved && !isExternal && (
                      <div style={{
                        background: rTimeStatus.isUpcoming ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        border: `1px solid ${rTimeStatus.isUpcoming ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        marginBottom: '12px',
                        color: 'var(--paper)'
                      }}>
                        {rTimeStatus.isUpcoming ? (
                          <div>
                            <b style={{ color: '#F59E0B' }}>⏳ Chưa tới ngày thi đấu ({r.date}):</b> Giải đấu nội bộ chưa diễn ra. Khi giải bắt đầu và hoàn thành, <b>Ban Quản Trị (Admin) sẽ là người trực tiếp cập nhật kết quả, tự động trích {Math.round(commRate * 100)}% hoa hồng và chuyển toàn bộ tiền thưởng thực nhận vào tài khoản của bạn</b>. Chủ sở hữu không có quyền tự ý cập nhật số tiền ở giải nội bộ.
                          </div>
                        ) : (
                          <div>
                            <b style={{ color: '#10B981' }}>🏁 Đang diễn ra / Chờ Admin quyết toán thưởng:</b> Giải đấu đã khởi tranh. Đang chờ Ban Quản Trị (Admin) tổng kết bảng thành tích chính thức, khấu trừ hoa hồng {Math.round(commRate * 100)}% và giải ngân tiền thưởng trực tiếp cho bạn.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ý KIẾN / PHẢN HỒI */}
                    {isRejected && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '12.5px',
                        color: 'var(--paper)',
                        marginBottom: '12px',
                        lineHeight: 1.5
                      }}>
                        <b style={{ color: '#EF4444' }}>Lý do từ chối:</b> {r.rejectionReason || r.trainerFeedback || 'Chiến mã chưa đạt phong độ chuẩn thi đấu hoặc vướng kiểm dịch thú y.'}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>Ngày thi đấu: <b style={{ color: 'var(--paper)' }}>{r.date}</b> · Kỵ mã: <b style={{ color: 'var(--paper)' }}>{r.jockey || 'Chưa chỉ định'}</b></div>
                      <div>Ghi chú: {r.externalNotes || r.notes || 'Không có ghi chú'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {isPending && !entryFeePaid && (
                        <button
                          type="button"
                          onClick={() => handleToggleNomination && handleToggleNomination(r.id, 'WITHDRAWN')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Hủy đơn đăng ký
                        </button>
                      )}
                      {isPending && entryFeePaid && (
                        <button
                          type="button"
                          onClick={() => {
                            setTransferModalData({ tournament: { name: r.raceName }, nomination: r });
                            setTransferForm({ newOwnerName: '', newOwnerPhone: '', newOwnerIdCard: '', note: '' });
                          }}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3B82F6',
                            border: '1px solid #3B82F6',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Chuyển nhượng suất đua
                        </button>
                      )}
                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => handleToggleNomination && handleToggleNomination(r.id, 'PENDING')}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            background: 'var(--brass)',
                            color: '#0A0D14',
                            fontWeight: 700,
                            border: 'none',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Gửi thẩm định lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* MODAL XEM CHI TIẾT THÔNG TIN GIẢI ĐẤU */}
      {selectedTournInfoModal && (
        <div className="modal-overlay" onClick={() => setSelectedTournInfoModal(null)} style={{ zIndex: 999999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '620px',
              width: '92%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '10px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏆</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--brass)' }}>
                    Thông Tin Chi Tiết Giải Đấu
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    {selectedTournInfoModal.tournament?.tournamentType === 'INTERNAL' ? 'Giải đấu Nội Bộ Hệ Thống' : 'Giải Đấu Tự Do Bên Ngoài'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTournInfoModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
              >&times;</button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--paper)', fontWeight: 700 }}>
                {selectedTournInfoModal.tournament?.name}
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
                {selectedTournInfoModal.tournament?.description || 'Giải đấu tranh tài quy mô chuyên nghiệp với sự tham gia của các chiến mã xuất sắc nhất.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--paper-dim)' }}>Cự ly thi đấu:</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.tournament?.distance}</b></div>
                <div><span style={{ color: 'var(--paper-dim)' }}>Loại mặt sân:</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.tournament?.surface || selectedTournInfoModal.tournament?.track}</b></div>
                <div><span style={{ color: 'var(--paper-dim)' }}>Ngày thi đấu:</span> <b style={{ color: 'var(--brass)' }}>{selectedTournInfoModal.tournament?.date}</b></div>
                <div><span style={{ color: 'var(--paper-dim)' }}>Địa điểm:</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.tournament?.track || 'Trường đua Thể Thao Quốc Tế'}</b></div>
                <div><span style={{ color: 'var(--paper-dim)' }}>Tổng giải thưởng:</span> <b style={{ color: 'var(--brass)' }}>{formatVND(selectedTournInfoModal.tournament?.totalPurse)}</b></div>
                <div><span style={{ color: 'var(--paper-dim)' }}>Lệ phí tham gia:</span> <b style={{ color: '#10B981' }}>5.000.000 ₫</b></div>
              </div>
            </div>

            {selectedTournInfoModal.nomination && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#10B981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> THÔNG TIN CHIẾN MÃ CỦA BẠN ĐÃ ĐĂNG KÝ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><span style={{ color: 'var(--paper-dim)' }}>Chiến mã xuất chiến:</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.nomination.horseName}</b></div>
                  <div><span style={{ color: 'var(--paper-dim)' }}>Mã vi chip:</span> <b style={{ color: 'var(--brass)', fontFamily: 'monospace' }}>{selectedTournInfoModal.nomination.horseMicrochip || selectedTournInfoModal.nomination.chipId || 'Đã liên kết RFID'}</b></div>
                  <div><span style={{ color: 'var(--paper-dim)' }}>Huấn luyện viên:</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.nomination.trainerName || 'HLV chỉ định'}</b></div>
                  <div><span style={{ color: 'var(--paper-dim)' }}>Kỵ mã (Jockey):</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.nomination.jockey || 'Chủ nuôi chỉ định'}</b></div>
                  <div><span style={{ color: 'var(--paper-dim)' }}>Tình trạng lệ phí:</span> <b style={{ color: selectedTournInfoModal.nomination.entryFeePaid ? '#10B981' : '#F59E0B' }}>{selectedTournInfoModal.nomination.entryFeePaid ? 'Đã Thanh Toán (5.000.000 ₫)' : 'Chưa Thanh Toán'}</b></div>
                  <div><span style={{ color: 'var(--paper-dim)' }}>Ngày đăng ký:</span> <b style={{ color: 'var(--paper)' }}>{selectedTournInfoModal.nomination.registrationDate || 'Mới nhất'}</b></div>
                </div>
                {selectedTournInfoModal.nomination.transferredTo && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontSize: '11.5px' }}>
                    🔄 Suất tham gia này đã được chuyển nhượng cho: <b>{selectedTournInfoModal.nomination.transferredTo}</b> ({selectedTournInfoModal.nomination.transferredPhone})
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedTournInfoModal(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHUYỂN NHƯỢNG SUẤT ĐUA CHO NGƯỜI KHÁC */}
      {transferModalData && (
        <div className="modal-overlay" onClick={() => setTransferModalData(null)} style={{ zIndex: 999999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '520px',
              width: '92%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔄</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#60A5FA' }}>
                    Chuyển Nhượng Suất Tham Gia Giải Đấu
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Bàn giao quyền thi đấu và trách nhiệm chiến mã cho chủ sở hữu khác
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
              >&times;</button>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '16px', fontSize: '12px' }}>
              <div>Giải đấu: <b style={{ color: 'var(--brass)' }}>{transferModalData.tournament?.name || transferModalData.nomination?.raceName}</b></div>
              <div style={{ marginTop: '3px' }}>Chiến mã xuất trận: <b style={{ color: 'var(--paper)' }}>{transferModalData.nomination?.horseName}</b></div>
            </div>

            <form onSubmit={handleConfirmTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                  Họ và tên người nhận chuyển nhượng *
                </label>
                <input
                  type="text"
                  required
                  value={transferForm.newOwnerName}
                  onChange={(e) => setTransferForm({ ...transferForm, newOwnerName: e.target.value })}
                  placeholder="Ví dụ: Trần Quốc Toản"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Số điện thoại người nhận *
                  </label>
                  <input
                    type="tel"
                    required
                    value={transferForm.newOwnerPhone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/^\+84\s?0?/, '0').replace(/[^0-9]/g, '');
                      if (val.length > 10) val = val.slice(0, 10);
                      setTransferForm({ ...transferForm, newOwnerPhone: val });
                    }}
                    placeholder="0912345678"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '12.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Số CCCD / CMND người nhận *
                  </label>
                  <input
                    type="text"
                    required
                    value={transferForm.newOwnerIdCard}
                    onChange={(e) => setTransferForm({ ...transferForm, newOwnerIdCard: e.target.value })}
                    placeholder="079201009988"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '12.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                  Lý do / Ghi chú chuyển nhượng
                </label>
                <input
                  type="text"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  placeholder="Ví dụ: Ủy quyền tham dự giải theo hợp đồng liên danh"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#F59E0B',
                fontSize: '11.5px',
                lineHeight: 1.45
              }}>
                ⚠️ <b>Lưu ý quan trọng:</b> Sau khi chuyển nhượng, người nhận sẽ được cấp quyền tham gia và thụ hưởng quyền lợi giải đấu này. Thao tác không thể hoàn tác sau khi xác nhận.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setTransferModalData(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Xác Nhận Chuyển Nhượng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

