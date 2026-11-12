import React from 'react';

export default function GroomVetInstructionsTab({ instructions = [], onConfirmInstruction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            💉 Chỉ Định Thú Y & Y Lệnh Chăm Sóc (Veterinary Instructions)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Các hướng dẫn y tế và phác đồ điều trị được Bác sĩ Thú y phê duyệt giao cho Groom thực hiện tại chuồng.
          </p>
        </div>

        {/* Cảnh báo quyền hạn */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '11.5px',
          color: 'var(--brass)',
          maxWidth: '460px'
        }}>
          <b>⚠️ Nguyên tắc điều trị:</b> Groom chỉ được cho uống thuốc hoặc chăm sóc y tế khi có chỉ định văn bản của Bác sĩ Thú y. Tuyệt đối không tự ý dùng thuốc.
        </div>
      </div>

      {/* Danh sách y lệnh */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {instructions.map((ord) => (
          <div
            key={ord.id}
            className="facility-card"
            style={{
              padding: '20px',
              background: 'var(--bg-card)',
              borderLeft: ord.isLocked ? '4px solid #EF4444' : '4px solid var(--brass)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: 'var(--brass)',
                    border: '1px solid var(--line-strong)'
                  }}>
                    {ord.id}
                  </span>
                  <b style={{ fontSize: '16px', color: 'var(--paper)' }}>
                    {ord.horseName} ({ord.stall})
                  </b>
                  {ord.isLocked && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#EF4444',
                      border: '1px solid #EF4444'
                    }}>
                      🔒 KHÓA HUẤN LUYỆN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                  Người ban hành: <b style={{ color: 'var(--paper)' }}>{ord.doctor}</b> · Ngày lập: {ord.createdDate}
                </div>
              </div>

              <div>
                {ord.groomConfirmed ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    ✓ Groom Đã Xác Nhận Tiếp Nhận
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConfirmInstruction && onConfirmInstruction(ord.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '5px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Tiếp Nhận Y Lệnh
                  </button>
                )}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              marginBottom: '10px'
            }}>
              <b style={{ fontSize: '13.5px', color: 'var(--brass)', display: 'block', marginBottom: '8px' }}>
                Phác đồ: {ord.title}
              </b>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.6 }}>
                {ord.instructions.map((ins, idx) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

