import React, { useState } from 'react';

export default function OwnerTournamentsTab({
  OPEN_TOURNAMENTS = [],
  raceNominations = [],
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

          <div className="portal-cards-grid" style={{ display: 'grid', gap: '14px' }}>
            {internalTournaments.map(tourn => (
              <div key={tourn.id} className="facility-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <b style={{ fontSize: '15px', color: 'var(--paper)', lineHeight: 1.3 }}>{tourn.name}</b>
                    <span style={{
                      padding: '2px 8px',
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

                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '8px' }}>
                    {tourn.track} · {tourn.surface} · Đơn vị tổ chức: <b>{tourn.organizerName || 'Ban Quản Trị Nền Tảng'}</b>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.4, margin: '0 0 12px' }}>
                    {tourn.description}
                  </p>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    marginBottom: '10px'
                  }}>
                    <div>Ngày thi đấu: <b style={{ color: 'var(--paper)', display: 'block' }}>{tourn.date}</b></div>
                    <div>Tổng giải thưởng: <b style={{ color: 'var(--brass)', display: 'block', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatVND(tourn.totalPurse)}</b></div>
                    <div>Hoa hồng nền tảng: <b style={{ color: '#F59E0B', display: 'block' }}>{Math.round((tourn.commissionRate || 0.05) * 100)}% (Chủ nhận {100 - Math.round((tourn.commissionRate || 0.05) * 100)}%)</b></div>
                    <div>Lệ phí đăng ký: <b style={{ color: 'var(--paper)', display: 'block', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatVND(tourn.entryFee || 5000000)}</b></div>
                  </div>

                  {/* QUYỀN LỢI KHÁN ĐÀI */}
                  <div style={{
                    marginBottom: '14px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
                    border: `1px solid ${membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.3)' : 'var(--line)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11.5px',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <span style={{ color: 'var(--paper-dim)' }}>Quyền lợi khán đài:</span>
                    {membershipTier === 'PREMIUM' ? (
                      <span style={{ color: 'var(--brass)', fontWeight: 700 }}>VIP Lounge & Paddock Pass</span>
                    ) : (
                      <span style={{ color: 'var(--paper)', fontWeight: 600 }}>Khán đài tiêu chuẩn</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenRaceRegister && handleOpenRaceRegister(tourn)}
                  style={{
                    width: '100%',
                    padding: '9px',
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
              </div>
            ))}
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

          <div className="portal-cards-grid" style={{ display: 'grid', gap: '14px' }}>
            {externalTournaments.map(tourn => (
              <div key={tourn.id} className="facility-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <b style={{ fontSize: '15px', color: 'var(--paper)', lineHeight: 1.3 }}>{tourn.name}</b>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      border: '1px solid #10B981',
                      whiteSpace: 'nowrap'
                    }}>
                      GIẢI ĐẤU NGOÀI ĐỘC LẬP
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '8px' }}>
                    {tourn.track} · {tourn.surface} · Đơn vị tổ chức ngoài: <b>{tourn.organizerName}</b>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.4, margin: '0 0 12px' }}>
                    {tourn.description}
                  </p>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    marginBottom: '10px'
                  }}>
                    <div>Cự ly: <b style={{ color: 'var(--paper)', display: 'block' }}>{tourn.distance}</b></div>
                    <div>Ngày thi đấu: <b style={{ color: 'var(--paper)', display: 'block' }}>{tourn.date}</b></div>
                    <div>Tổng giải thưởng: <b style={{ color: '#10B981', display: 'block', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatVND(tourn.totalPurse)}</b></div>
                    <div>Tỷ lệ hoa hồng: <b style={{ color: '#10B981', display: 'block' }}>0% (Chủ nhận 100%)</b></div>
                  </div>

                  {/* CƠ CẤU GIẢI THƯỞNG CHI TIẾT THEO THỨ HẠNG */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    marginBottom: '12px'
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

                <button
                  type="button"
                  onClick={() => {
                    const firstHorse = myHorses[0];
                    if (setExternalRecordForm) {
                      setExternalRecordForm({
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
                        notes: 'Tham gia giải ngoài độc lập'
                      });
                    }
                    if (setShowExternalRecordModal) setShowExternalRecordModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px',
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
              </div>
            ))}
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

                // 4 chỉ số tài chính chuẩn mực
                const grossPrize = Number(r.grossPrize || r.estimatedPurse) || 0;
                const commRate = isExternal ? 0.00 : (Number(r.commissionRate) !== undefined ? Number(r.commissionRate) : 0.05);
                const commAmount = Number(r.commissionAmount !== undefined ? r.commissionAmount : Math.round(grossPrize * commRate)) || 0;
                const netPayout = Number(r.netPayout !== undefined ? r.netPayout : (grossPrize - commAmount)) || 0;

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
                              <span>⏳</span> Chiến mã: <i>Đang nhờ HLV {r.targetTrainer || 'Trần Văn Hùng'} tuyển chọn</i>
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

                    {/* BẢNG ĐỐI SOÁT 4 CHỈ SỐ TÀI CHÍNH MINH BẠCH */}
                    {grossPrize > 0 && (
                      <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '10px'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>1. Tiền Thưởng Trước Khấu Trừ</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--paper)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                            {formatVND(grossPrize)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>2. Tỷ Lệ Hoa Hồng</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: isExternal ? '#10B981' : '#F59E0B', marginTop: '2px' }}>
                            {isExternal ? '0% (Miễn thu)' : `${Math.round(commRate * 100)}%`}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>3. Hoa Hồng Nền Tảng</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: commAmount > 0 ? '#EF4444' : '#10B981', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                            {commAmount > 0 ? `- ${formatVND(commAmount)}` : '0 ₫'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>4. Thực Nhận Của Chủ Ngựa</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                            {formatVND(netPayout)}
                          </div>
                        </div>
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

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleToggleNomination && handleToggleNomination(r.id, 'WITHDRAWN')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: 'transparent',
                            color: 'var(--paper-dim)',
                            border: '1px solid var(--line)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Rút đơn đăng ký
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
    </div>
  );
}

