import React, { useState } from 'react';

export default function GroomHorsesTab({ horses = [], onOpenHorseModal, onOpenReportModal }) {
  const [selectedBlock, setSelectedBlock] = useState('ALL'); // 'ALL' | 'Block A' | 'Block B' | 'Block C'
  const [searchKey, setSearchKey] = useState('');

  const filtered = horses.filter(h => {
    if (selectedBlock !== 'ALL' && h.block !== selectedBlock) return false;
    if (searchKey) {
      const q = searchKey.toLowerCase();
      return h.name?.toLowerCase().includes(q) || h.horseId?.toLowerCase().includes(q) || h.stall?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            🐴 Quản Lý Chiến Mã (Horse Management)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Danh sách chiến mã được phân công trực ban theo ô chuồng, quản lý thể chất, khẩu phần ăn và lịch kiểm tra sức khỏe.
          </p>
        </div>

        {/* Khối cảnh báo quyền hạn (RBAC Guardrail) */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '11.5px',
          color: 'var(--brass)',
          maxWidth: '460px',
          lineHeight: 1.4
        }}>
          <b>🛡️ Lưu ý phân quyền:</b> Groom được quan sát và ghi nhận thể trạng. Bệnh án và trạng thái sức khỏe chính thức do Bác sĩ Thú y độc quyền ban hành.
        </div>
      </div>

      {/* Filter bar */}
      <div className="facility-card" style={{ padding: '16px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <input
            type="text"
            placeholder="Tìm theo tên chiến mã, ID chip hoặc số ô chuồng..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12.5px',
              minWidth: '260px',
              flex: 1
            }}
          />

          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--line)', padding: '2px' }}>
            {['ALL', 'Block A', 'Block B', 'Block C'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBlock(b)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: selectedBlock === b ? 700 : 500,
                  background: selectedBlock === b ? 'var(--brass)' : 'transparent',
                  color: selectedBlock === b ? '#0A0D14' : 'var(--paper-dim)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {b === 'ALL' ? 'Tất Cả Khu Chuồng' : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid danh sách chiến mã hoặc Empty State */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px dashed var(--line)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🐴</div>
          <b style={{ color: 'var(--paper)', fontSize: '15px', display: 'block', marginBottom: '6px' }}>
            Chưa có chiến mã nào trong danh sách phục vụ của Groom
          </b>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--paper-dim)', maxWidth: '520px', display: 'inline-block', lineHeight: 1.5 }}>
            Khi Chủ sở hữu chỉ định bạn chăm sóc chiến mã và bạn nhấn <b>[✓ Đồng Ý Tiếp Nhận]</b>, chiến mã sẽ xuất hiện tại đây để bạn bắt đầu theo dõi thể chất, khẩu phần ăn và lịch trình chăm sóc.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '16px'
        }}>
        {filtered.map((h) => {
          const isInjured = h.healthStatus === 'INJURED';
          const isIsolated = h.healthStatus === 'ISOLATED';
          const isMonitoring = h.healthStatus === 'MONITORING';

          return (
            <div
              key={h.id}
              className="facility-card"
              style={{
                padding: '18px',
                background: 'var(--bg-card)',
                border: isInjured ? '1px solid rgba(239, 68, 68, 0.45)' : isIsolated ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div>
                {/* Header card */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <img
                    src={h.avatar}
                    alt={h.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid var(--line)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <b style={{ fontSize: '15.5px', color: 'var(--paper)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.name}
                      </b>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--brass)',
                        background: 'rgba(212, 175, 55, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        flexShrink: 0
                      }}>
                        {h.stall}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                      Mã: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{h.horseId}</span> · {h.breed}
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: isInjured ? 'rgba(239, 68, 68, 0.15)' : isIsolated ? 'rgba(139, 92, 246, 0.15)' : isMonitoring ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isInjured ? '#EF4444' : isIsolated ? '#A78BFA' : isMonitoring ? '#F59E0B' : '#10B981',
                        border: `1px solid ${isInjured ? '#EF4444' : isIsolated ? '#8B5CF6' : isMonitoring ? '#F59E0B' : '#10B981'}`
                      }}>
                        {h.healthStatus === 'FIT' ? '🟢 Đủ ĐK Sức Khỏe (FIT)' : h.healthStatus === 'MONITORING' ? '🟡 Cần Theo Dõi (MONITORING)' : h.healthStatus === 'INJURED' ? '🔴 Bị Chấn Thương (INJURED)' : '🟣 Đang Cách Ly (ISOLATED)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 thông số thể chất */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  background: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '12px'
                }}>
                  <div>Cân nặng: <b style={{ color: 'var(--paper)' }}>{h.weight}</b></div>
                  <div>Thân nhiệt: <b style={{ color: Number(h.temp?.replace('°C', '')) > 38.5 ? '#EF4444' : 'var(--paper)' }}>{h.temp}</b></div>
                  <div>Nhịp tim: <b style={{ color: 'var(--paper)' }}>{h.pulse}</b></div>
                  <div>Tuổi & Giới tính: <b style={{ color: 'var(--paper)' }}>{h.age}T · {h.gender}</b></div>
                </div>

                {/* Thông tin chủ sở hữu & Bác sĩ */}
                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                  <div>👤 <span style={{ color: 'var(--paper-dim)' }}>Chủ sở hữu:</span> <b style={{ color: 'var(--brass)' }}>{h.owner}</b> · BS: <b>{h.vet}</b></div>
                </div>

                {h.notes && (
                  <div style={{
                    fontSize: '11.5px',
                    color: 'var(--paper-dim)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '8px 10px',
                    borderRadius: '5px',
                    marginBottom: '14px',
                    lineHeight: 1.4
                  }}>
                    <b>Ghi chú Groom:</b> {h.notes}
                  </div>
                )}
              </div>

              {/* Hàng nút bấm */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => onOpenHorseModal && onOpenHorseModal(h)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Xem Hồ Sơ Chi Tiết
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReportModal && onOpenReportModal({ stallCode: h.stall, horseName: h.name })}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Báo sự cố
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

