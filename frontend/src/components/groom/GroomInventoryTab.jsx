import React, { useState } from 'react';

export default function GroomInventoryTab({ inventory = [], onRequestSupply }) {
  const [filterCat, setFilterCat] = useState('ALL'); // 'ALL' | 'FEED' | 'BEDDING' | 'MEDICAL' | 'TOOL'

  const filtered = inventory.filter(item => {
    if (filterCat !== 'ALL' && item.category !== filterCat) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            📦 Quản Lý Vật Tư Chuồng Trại (Inventory Management)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Kiểm kê thức ăn, rơm mùn cưa đệm lót, thuốc xịt sát trùng và dụng cụ chăm sóc trực ca.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="facility-card" style={{ padding: '14px 18px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--paper-dim)', marginRight: '6px' }}>Danh mục:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'FEED', label: '🌾 Thức Ăn & Cỏ' },
            { id: 'BEDDING', label: '🧹 Đệm Lót Rơm / Mùn Cưa' },
            { id: 'MEDICAL', label: '💊 Y Tế & Chăm Sóc' },
            { id: 'TOOL', label: '🛠️ Dụng Cụ Móng & Chải' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCat(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '5px',
                fontSize: '11.5px',
                fontWeight: filterCat === cat.id ? 700 : 500,
                background: filterCat === cat.id ? 'var(--brass)' : 'var(--bg-secondary)',
                color: filterCat === cat.id ? '#0A0D14' : 'var(--paper-dim)',
                border: '1px solid var(--line)',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách vật tư */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '16px'
      }}>
        {filtered.map((item) => {
          const isCritical = item.status === 'CRITICAL';
          const isLow = item.status === 'LOW';

          return (
            <div
              key={item.id}
              className="facility-card"
              style={{
                padding: '18px',
                background: 'var(--bg-card)',
                border: isCritical ? '1px solid #EF4444' : isLow ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <b style={{ fontSize: '14.5px', color: 'var(--paper)' }}>{item.name}</b>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: isCritical ? 'rgba(239, 68, 68, 0.2)' : isLow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                    color: isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981',
                    border: `1px solid ${isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981'}`
                  }}>
                    {item.statusLabel}
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  marginBottom: '12px'
                }}>
                  <div>Tồn kho thực tế: <b style={{ color: 'var(--brass)', fontSize: '14px' }}>{item.qty}</b></div>
                  <div style={{ color: 'var(--paper-dim)' }}>Mức an toàn tối thiểu: {item.minQty} ({item.unit})</div>
                  <div style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>Nhập kho gần nhất: {item.lastRestocked}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRequestSupply && onRequestSupply(item.name)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: isCritical || isLow ? 'var(--brass)' : 'var(--bg-secondary)',
                  color: isCritical || isLow ? '#0A0D14' : 'var(--paper)',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: isCritical || isLow ? 'none' : '1px solid var(--line)',
                  cursor: 'pointer'
                }}
              >
                + Yêu Cầu Cấp Phát Thêm
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

