import React, { useState } from 'react';

export default function GroomIncidentsTab({ incidents = [], onOpenReportModal }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

  const filtered = incidents.filter(i => {
    if (filterSeverity !== 'ALL' && i.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            🚨 Báo Cáo Sự Cố Sức Khỏe & Chuồng Trại (Incident Reports)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Tổng hợp và theo dõi tiến trình xử lý của Bác sĩ Thú y đối với các sự cố bất thường do Groom phát hiện.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenReportModal}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: '#EF4444',
            color: '#FFF',
            fontWeight: 700,
            fontSize: '12.5px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}
        >
          + Tạo Báo Cáo Sự Cố Mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="facility-card" style={{ padding: '14px 18px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--paper-dim)', marginRight: '6px' }}>Lọc mức độ:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: filterSeverity === sev ? 700 : 500,
                background: filterSeverity === sev
                  ? (sev === 'CRITICAL' ? '#EF4444' : 'var(--brass)')
                  : 'var(--bg-secondary)',
                color: filterSeverity === sev
                  ? (sev === 'CRITICAL' ? '#FFF' : '#0A0D14')
                  : 'var(--paper-dim)',
                border: '1px solid var(--line)',
                cursor: 'pointer'
              }}
            >
              {sev === 'ALL' ? 'Tất Cả' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách sự cố */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--paper-dim)', fontSize: '13px' }}>
            Không có báo cáo sự cố nào phù hợp.
          </div>
        ) : (
          filtered.map((inc) => {
            const isCrit = inc.severity === 'CRITICAL';
            const isHigh = inc.severity === 'HIGH';

            return (
              <div
                key={inc.id}
                className="facility-card"
                style={{
                  padding: '18px 20px',
                  background: isCrit ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
                  border: isCrit ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--line)',
                  boxShadow: isCrit ? '0 0 12px rgba(239, 68, 68, 0.12)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: isCrit ? '#EF4444' : isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      color: isCrit ? '#FFF' : isHigh ? '#F59E0B' : 'var(--paper-dim)',
                      border: isCrit ? 'none' : isHigh ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)'
                    }}>
                      {inc.severity}
                    </span>
                    <b style={{ fontSize: '15px', color: 'var(--paper)' }}>Mã: {inc.id}</b>
                    <span style={{ color: 'var(--brass)', fontWeight: 700, fontSize: '13.5px' }}>
                      · Ô {inc.stallCode} ({inc.horseName})
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Báo lúc: <b>{inc.reportedAt || inc.timestamp}</b>
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  color: 'var(--paper)',
                  lineHeight: 1.5,
                  marginBottom: '10px'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <b>Triệu chứng phát hiện:</b> <span style={{ color: isCrit ? '#EF4444' : 'var(--brass)' }}>{inc.symptoms}</span>
                  </div>
                  <div>
                    <b>Mô tả thực tế tại chuồng:</b> {inc.desc || inc.description}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'var(--paper-dim)' }}>
                    Trạng thái thẩm định Thú Y: <b style={{ color: inc.status === 'resolved' ? '#10B981' : 'var(--brass)' }}>
                      {inc.statusText || (inc.status === 'pending_vet' ? 'Đang chờ BS Thú Y khám' : 'Đang điều trị')}
                    </b>
                  </span>
                  <span style={{ color: 'var(--paper-dim)' }}>
                    Người lập phiếu: <b>{inc.reportedBy || 'Lê Hoàng Nam (Groom)'}</b>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

