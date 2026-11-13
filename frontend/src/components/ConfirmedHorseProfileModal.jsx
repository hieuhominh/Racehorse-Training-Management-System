import React from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmedHorseProfileModal({ horse, role = 'TRAINER', onClose, onOpenPedigree, onAction, onConfirmService }) {
  if (!horse) return null;

  const roleCode = (role || 'TRAINER').toUpperCase();
  const statusField = roleCode === 'VET' ? 'vetStatus' : (roleCode === 'GROOM' ? 'groomStatus' : 'trainerStatus');

  const isPending = Boolean(
    horse.isPendingConfirmation ||
    horse[statusField] === 'PENDING' ||
    horse.assignmentData?.[statusField] === 'PENDING' ||
    horse.serviceStatus === 'PENDING'
  );

  const ownerDisplayName = horse.ownerName || horse.owner || 'Chủ sở hữu';

  const roleConfigs = {
    TRAINER: {
      pending: {
        title: 'Hồ Sơ Yêu Cầu Huấn Luyện Chiến Mã',
        badge: '🏇 YÊU CẦU HUẤN LUYỆN CHỜ XÁC NHẬN',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#F59E0B',
        desc: `Chủ sở hữu ${ownerDisplayName} đã gửi yêu cầu chỉ định bạn làm Huấn luyện viên trưởng. Vui lòng kiểm tra hồ sơ và bấm xác nhận để tiếp nhận vào đàn huấn luyện.`,
        actionText: 'Xác Nhận Phục Vụ'
      },
      confirmed: {
        title: 'Hồ Sơ Chiến Mã Tiếp Nhận Huấn Luyện',
        badge: '🏇 HLV ĐÃ XÁC NHẬN PHỤC VỤ',
        badgeBg: 'rgba(212, 175, 55, 0.15)',
        badgeColor: 'var(--brass)',
        desc: `Chiến mã thuộc quyền sở hữu của ${ownerDisplayName} đã chính thức liên kết vào cổng chuyên môn của bạn.`,
        actionText: 'Theo dõi thể lực'
      }
    },
    VET: {
      pending: {
        title: 'Hồ Sơ Yêu Cầu Y Tế & Kiểm Dịch',
        badge: '🩺 YÊU CẦU PHỤ TRÁCH Y TẾ CHỜ XÁC NHẬN',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#F59E0B',
        desc: `Chủ sở hữu ${ownerDisplayName} đã chỉ định bạn làm Bác sĩ thú y phụ trách. Vui lòng thẩm định hồ sơ và xác nhận phục vụ.`,
        actionText: 'Xác Nhận Phụ Trách Y Tế'
      },
      confirmed: {
        title: 'Hồ Sơ Y Tế & Kiểm Dịch Chiến Mã',
        badge: '🩺 BÁC SĨ ĐÃ XÁC NHẬN PHỤ TRÁCH Y TẾ',
        badgeBg: 'rgba(59, 130, 246, 0.15)',
        badgeColor: '#60A5FA',
        desc: `Chiến mã thuộc quyền sở hữu của ${ownerDisplayName} đã chính thức liên kết vào cổng thú y.`,
        actionText: 'Lập phác đồ y tế'
      }
    },
    GROOM: {
      pending: {
        title: 'Hồ Sơ Yêu Cầu Chăm Sóc & Nuôi Dưỡng',
        badge: '🌾 YÊU CẦU CHĂM SÓC CHỜ TIẾP NHẬN',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#F59E0B',
        desc: `Chủ sở hữu ${ownerDisplayName} đã chỉ định bạn làm Chuyên viên chăm sóc chuồng trại. Vui lòng tiếp nhận chiến mã.`,
        actionText: 'Xác Nhận Chăm Sóc'
      },
      confirmed: {
        title: 'Hồ Sơ Chăm Sóc & Nuôi Dưỡng Chuồng Trại',
        badge: '🌾 GROOM ĐÃ TIẾP NHẬN CHĂM SÓC',
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeColor: '#34D399',
        desc: `Chiến mã thuộc quyền sở hữu của ${ownerDisplayName} đã chính thức vào danh sách chăm sóc của bạn.`,
        actionText: 'Nhận chăm sóc'
      }
    }
  };

  const groupConfig = roleConfigs[roleCode] || roleConfigs.TRAINER;
  const config = isPending ? groupConfig.pending : groupConfig.confirmed;

  const defaultAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
  const avatar = horse.avatar || horse.horse_avatar || defaultAvatar;

  const sireName = horse.pedigree?.sire || horse.sire || 'Đang cập nhật';
  const damName = horse.pedigree?.dam || horse.dam || 'Đang cập nhật';

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 999999,
        cursor: 'pointer'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--brass)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          color: 'var(--paper)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          cursor: 'default',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--line)',
            color: 'var(--paper-dim)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}
        >
          ✕
        </button>

        {/* Badge & Title */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '4px',
            background: config.badgeBg,
            color: config.badgeColor,
            marginBottom: '8px',
            letterSpacing: '0.04em'
          }}>
            {config.badge}
          </span>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--paper)' }}>
            {config.title}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            {config.desc}
          </p>
        </div>

        {/* Horse Hero Card */}
        <div style={{
          display: 'flex',
          gap: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '16px',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <img
            src={avatar}
            alt={horse.name || horse.horseName}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '2px solid var(--brass)',
              flexShrink: 0
            }}
            onError={(e) => { e.target.src = defaultAvatar; }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--brass)' }}>
                {horse.name || horse.horseName}
              </h4>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: 'var(--brass)',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                {horse.stable || horse.stall || 'Ô A1'}
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)' }}>
              {horse.englishName && horse.englishName !== (horse.name || horse.horseName) ? `${horse.englishName} · ` : ''}
              {horse.breed || 'Thoroughbred'} · {horse.gender || 'Ngựa đực (Stallion)'}
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '4px' }}>
              Mã Vi Chip: <span style={{ fontFamily: 'monospace', color: 'var(--paper)', fontWeight: 700 }}>{horse.microchip}</span>
            </div>
          </div>
        </div>

        {/* Key Attributes Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Chủ Sở Hữu</div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brass)', marginTop: '2px' }}>
              {horse.ownerName || horse.owner || 'Chủ sở hữu'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Tỷ Lệ Sở Hữu</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
              {horse.ownershipShare ? `${horse.ownershipShare}%` : '100%'} ({horse.ownershipType || 'Độc quyền'})
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Dòng Bố (Sire)</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
              {sireName}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Dòng Mẹ (Dam)</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
              {damName}
            </div>
          </div>
        </div>

        {/* Service Team Coordination */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.05)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: roleCode === 'VET' ? '14px' : '20px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)', marginBottom: '6px' }}>
            🛡️ ĐỘI NGŨ CHUYÊN MÔN CÙNG PHỤC VỤ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--paper-dim)' }}>
            <div>🏇 Huấn Luyện Viên: <b style={{ color: 'var(--paper)' }}>{horse.trainerName || horse.trainer || 'Trần Văn Hùng'}</b></div>
            <div>🩺 Bác Sĩ Thú Y: <b style={{ color: 'var(--paper)' }}>{horse.vetName || horse.vet || 'BS. Nguyễn An'}</b></div>
            <div>🌾 Chuyên Viên Chăm Sóc: <b style={{ color: 'var(--paper)' }}>{horse.groomName || horse.groom || 'Lê Hoàng Nam'}</b></div>
          </div>
        </div>

        {/* Khối Thông Tin Y Tế & Sinh Hiệu Chuyên Sâu cho Bác Sĩ Thú Y */}
        {roleCode === 'VET' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Trạng thái thể lực lâm sàng */}
            <div style={{
              background: (horse.locked || horse.status === 'INJURED') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${(horse.locked || horse.status === 'INJURED') ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: (horse.locked || horse.status === 'INJURED') ? '#EF4444' : '#10B981' }}>
                  {(horse.locked || horse.status === 'INJURED') ? '🚨 LỆNH KHÓA Y TẾ (CẤM TẬP / THI ĐẤU)' : '✓ ĐỦ ĐIỀU KIỆN THỂ LỰC (FIT FOR RACING)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                  {(horse.locked || horse.status === 'INJURED')
                    ? (horse.lockReason || 'Khám nghiệm Thú y phát hiện dấu hiệu bất thường, kích hoạt phong tỏa y tế!')
                    : 'Chiến mã hoàn toàn khỏe mạnh, nhịp tim và thân nhiệt ổn định.'}
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: (horse.locked || horse.status === 'INJURED') ? '#EF4444' : '#10B981',
                color: '#FFF'
              }}>
                {(horse.locked || horse.status === 'INJURED') ? 'LOCKED' : 'READY'}
              </span>
            </div>

            {/* Bảng chỉ số sinh hiệu (Vital Signs) */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)', marginBottom: '8px' }}>
                🩺 CHỈ SỐ SINH HIỆU LÂM SÀNG TẠI CHUỒNG
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Thân nhiệt chuẩn</span>
                  <b style={{ color: 'var(--paper)', fontSize: '13px' }}>{horse.tempCelsius ? `${horse.tempCelsius}°C` : '38.0°C'}</b>
                  <span style={{ color: '#10B981', fontSize: '9.5px', display: 'block' }}>Chuẩn: 37.5 - 38.5°C</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Nhịp tim lúc nghỉ</span>
                  <b style={{ color: 'var(--paper)', fontSize: '13px' }}>{horse.restingHeartRate || '38 bpm'}</b>
                  <span style={{ color: '#10B981', fontSize: '9.5px', display: 'block' }}>Chuẩn: 28 - 44 bpm</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Nhịp thở nghỉ ngơi</span>
                  <b style={{ color: 'var(--paper)', fontSize: '13px' }}>{horse.respirationRate || '14 lần/phút'}</b>
                  <span style={{ color: '#10B981', fontSize: '9.5px', display: 'block' }}>Chuẩn: 8 - 16 l/p</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--paper-dim)', display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px dashed var(--line)', paddingTop: '6px' }}>
                <div>• Niêm mạc nướu: <b style={{ color: 'var(--paper)' }}>Hồng hào tự nhiên (Thời gian hồi máu mao mạch CRT &lt; 2s)</b></div>
                <div>• Âm ruột (Gut sounds): <b style={{ color: 'var(--paper)' }}>4/4 góc ruột có nhu động tích cực, không có dấu hiệu đau Colic</b></div>
                <div>• Tình trạng móng &amp; gân: <b style={{ color: 'var(--paper)' }}>Không sưng nóng gân, móng không nứt rạn</b></div>
              </div>
            </div>

            {/* Sổ Tiêm Chủng & Khẩu Phần Dinh Dưỡng */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '11.5px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass)', marginBottom: '4px' }}>💉 LỊCH TIÊM CHỦNG VẮC-XIN</div>
                <div style={{ color: 'var(--paper-dim)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>• Cúm ngựa: <span style={{ color: '#10B981', fontWeight: 600 }}>Đã tiêm hợp lệ</span></div>
                  <div>• Uốn ván: <span style={{ color: '#10B981', fontWeight: 600 }}>Đạt chuẩn</span></div>
                  <div>• Tẩy giun: <span style={{ color: 'var(--paper)', fontWeight: 600 }}>Định kỳ 3 tháng</span></div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '11.5px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass)', marginBottom: '4px' }}>🌾 KHẨU PHẦN DINH DƯỠNG</div>
                <div style={{ color: 'var(--paper-dim)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>• Cỏ Alfalfa &amp; Timothy: <span style={{ color: 'var(--paper)', fontWeight: 600 }}>12 kg/ngày</span></div>
                  <div>• Yến mạch &amp; Cám hạt: <span style={{ color: 'var(--paper)', fontWeight: 600 }}>4 kg/ngày</span></div>
                  <div>• Bổ sung điện giải: <span style={{ color: '#10B981', fontWeight: 600 }}>Sau buổi tập</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {onOpenPedigree && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPedigree(horse);
              }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--brass)',
                color: 'var(--brass)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              Gia phả hệ
            </button>
          )}
          {isPending ? (
            <button
              type="button"
              onClick={() => {
                if (onConfirmService) {
                  onConfirmService(horse.assignmentData || horse);
                } else if (onAction) {
                  onAction(horse);
                } else {
                  onClose();
                }
              }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '8px',
                background: 'var(--brass)',
                color: '#0A0D14',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
              }}
            >
              ✓ {config.actionText}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onAction) {
                  onAction(horse);
                } else {
                  onClose();
                }
              }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '8px',
                background: 'var(--brass)',
                color: '#0A0D14',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✓ {config.actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

