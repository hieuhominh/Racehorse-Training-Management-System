import React, { useState } from 'react';

export default function GroomInventoryTab({ inventory = [], onRequestSupply }) {
  const [filterCat, setFilterCat] = useState('ALL'); // 'ALL' | 'FEED' | 'BEDDING' | 'MEDICAL' | 'TOOL'
  const [requestedMap, setRequestedMap] = useState({});

  const filtered = inventory.filter(item => {
    if (filterCat !== 'ALL' && item.category !== filterCat) return false;
    return true;
  });

  const getPercent = (item) => {
    if (typeof item.percent === 'number') return item.percent;
    const cur = parseFloat(String(item.qty || '').replace(/[^0-9.]/g, '')) || 0;
    const max = parseFloat(String(item.maxQty || '').replace(/[^0-9.]/g, '')) || (parseFloat(String(item.minQty || '').replace(/[^0-9.]/g, '')) * 3.5) || 100;
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
  };

  const handleRequestClick = (item, percent) => {
    if (requestedMap[item.id]) return;
    setRequestedMap(prev => ({ ...prev, [item.id]: true }));
    if (onRequestSupply) {
      onRequestSupply(item, percent);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header - Chuyên nghiệp, tuyệt đối không có icon emoji */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            Quản Lý Vật Tư & Lương Thực Chuồng Trại (Inventory Management)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Kiểm kê thức ăn, rơm mùn cưa đệm lót, thuốc thú y và dụng cụ chăm sóc. Khi lương thực dưới 15%, nút yêu cầu cấp phát sẽ tự động kích hoạt để gửi Admin.
          </p>
        </div>
      </div>

      {/* Filter bar - Tuyệt đối không có icon emoji */}
      <div className="facility-card" style={{ padding: '14px 18px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--paper-dim)', marginRight: '6px' }}>Danh mục:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'FEED', label: 'Thức Ăn & Cỏ' },
            { id: 'BEDDING', label: 'Đệm Lót Rơm / Mùn Cưa' },
            { id: 'MEDICAL', label: 'Y Tế & Chăm Sóc' },
            { id: 'TOOL', label: 'Dụng Cụ Móng & Chải' }
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
          const percent = getPercent(item);
          // Quy chuẩn: Lương thực hoặc vật tư dưới 15% mới kích hoạt nút yêu cầu cấp phát
          const isUnder15 = percent < 15;
          const isRequested = !!requestedMap[item.id];

          return (
            <div
              key={item.id}
              className="facility-card"
              style={{
                padding: '18px',
                background: 'var(--bg-card)',
                border: isUnder15 ? '1px solid #EF4444' : (percent < 35 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)'),
                boxShadow: isUnder15 ? '0 0 14px rgba(239, 68, 68, 0.15)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '260px',
                height: '100%',
                boxSizing: 'border-box',
                borderRadius: '8px'
              }}
            >
              <div>
                {/* 1. Header tên & badge - Cố định minHeight để thẳng hàng ngang */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '44px', marginBottom: '10px', gap: '8px' }}>
                  <b style={{ fontSize: '14px', color: 'var(--paper)', flex: 1, lineHeight: 1.35 }}>
                    {item.name}
                  </b>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: isUnder15 ? 'rgba(239, 68, 68, 0.2)' : (percent < 35 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)'),
                    color: isUnder15 ? '#EF4444' : (percent < 35 ? '#F59E0B' : '#10B981'),
                    border: `1px solid ${isUnder15 ? '#EF4444' : (percent < 35 ? '#F59E0B' : '#10B981')}`
                  }}>
                    {isUnder15 ? `Dưới 15% (${percent}%)` : (item.statusLabel || `Đầy đủ (${percent}%)`)}
                  </span>
                </div>

                {/* 2. Thanh tiến trình phần trăm tồn kho - Thẳng hàng hoàn hảo */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                    <span>Tỷ lệ tồn kho:</span>
                    <b style={{ color: isUnder15 ? '#EF4444' : (percent < 35 ? '#F59E0B' : '#10B981') }}>{percent}%</b>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: isUnder15 ? '#EF4444' : (percent < 35 ? '#F59E0B' : '#10B981'),
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* 3. Khối số liệu tồn kho thực tế - Chiều cao chuẩn hóa */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  marginBottom: '14px',
                  minHeight: '84px',
                  justifyContent: 'center'
                }}>
                  <div>Tồn kho thực tế: <b style={{ color: isUnder15 ? '#EF4444' : 'var(--brass)', fontSize: '13.5px' }}>{item.qty}</b></div>
                  <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px' }}>Mức an toàn tối thiểu: {item.minQty} ({item.unit})</div>
                  <div style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>Nhập kho gần nhất: {item.lastRestocked}</div>
                </div>
              </div>

              {/* 4. Footer đồng chiều cao 38px, thẳng hàng tuyệt đối, không rớt dòng */}
              {isUnder15 ? (
                <button
                  type="button"
                  disabled={isRequested}
                  onClick={() => handleRequestClick(item, percent)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    background: isRequested ? 'rgba(16, 185, 129, 0.15)' : '#EF4444',
                    color: isRequested ? '#10B981' : '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: isRequested ? '1px solid #10B981' : 'none',
                    cursor: isRequested ? 'default' : 'pointer',
                    boxShadow: isRequested ? 'none' : '0 2px 10px rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                  title={isRequested ? 'Yêu cầu đã được chuyển tới Admin' : 'Gửi yêu cầu cấp phát khẩn cấp tới Admin'}
                >
                  {isRequested ? '✓ Đã Gửi Yêu Cầu Đến Admin' : '+ Yêu Cầu Cấp Phát Thêm'}
                </button>
              ) : (
                <div style={{
                  width: '100%',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 10px',
                  fontSize: '12px',
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}>
                  Tồn kho an toàn ({percent}%)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

