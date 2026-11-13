import React, { useState, useEffect } from 'react';
import { getSupplyRequestsApi, checkAndSyncSupplyRequests, deduplicateSupplyRequests } from '../../services/api';

export default function GroomInventoryTab({ inventory = [], onRequestSupply }) {
  const [filterCat, setFilterCat] = useState('ALL'); // 'ALL' | 'FEED' | 'BEDDING' | 'MEDICAL' | 'TOOL'
  const [supplyRequests, setSupplyRequests] = useState(() => {
    try {
      const raw = localStorage.getItem('matruong_supply_requests');
      if (raw) return deduplicateSupplyRequests(JSON.parse(raw));
    } catch {}
    return [];
  });
  const [now, setNow] = useState(Date.now());

  // Đồng bộ danh sách yêu cầu cấp phát & lắng nghe sự kiện
  useEffect(() => {
    const fetchRequests = () => {
      getSupplyRequestsApi().then(data => {
        if (Array.isArray(data)) setSupplyRequests(deduplicateSupplyRequests(data));
      });
    };
    fetchRequests();

    const handleUpdate = () => fetchRequests();
    window.addEventListener('matruong_supply_requests_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('matruong_supply_requests_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Timer 1 giây để đếm ngược 5 phút khi Admin duyệt
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      checkAndSyncSupplyRequests();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (ms) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
    if (onRequestSupply) {
      onRequestSupply(item, percent);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header - Chuyên nghiệp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            Quản Lý Vật Tư & Lương Thực Chuồng Trại (Inventory Management)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Kiểm kê thức ăn, rơm mùn cưa đệm lót, thuốc thú y và dụng cụ chăm sóc. Khi lương thực dưới 15%, bấm yêu cầu để thông báo đến Admin. Khi Admin phê duyệt, hệ thống sẽ bắt đầu cấp phát và nạp đầy sau 5 phút.
          </p>
        </div>
      </div>

      {/* Filter bar */}
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
          const basePercent = getPercent(item);
          
          // Tìm yêu cầu cấp phát đang hoạt động cho vật tư này
          const activeReq = supplyRequests.find(r => 
            (r.supplyId === item.id || r.supplyName === item.name) && 
            (r.status === 'PENDING_ADMIN' || r.status === 'APPROVED')
          );

          let isPendingAdmin = false;
          let isApprovedDelivering = false;
          let countdownStr = '';
          let effectivePercent = basePercent;

          if (activeReq) {
            if (activeReq.status === 'PENDING_ADMIN') {
              isPendingAdmin = true;
            } else if (activeReq.status === 'APPROVED' && activeReq.approvedAt) {
              const elapsed = now - activeReq.approvedAt;
              const duration = activeReq.durationMs || (5 * 60 * 1000);
              const remainingMs = Math.max(0, duration - elapsed);
              if (remainingMs > 0) {
                isApprovedDelivering = true;
                countdownStr = formatCountdown(remainingMs);
                const progressRatio = Math.min(1, Math.max(0, elapsed / duration));
                effectivePercent = Math.min(100, Math.round(basePercent + (100 - basePercent) * progressRatio));
              }
            }
          }

          const isUnder15 = effectivePercent < 15;

          return (
            <div
              key={item.id}
              className="facility-card"
              style={{
                padding: '18px',
                background: 'var(--bg-card)',
                border: isApprovedDelivering
                  ? '1px solid #3B82F6'
                  : isPendingAdmin
                  ? '1px solid rgba(16, 185, 129, 0.6)'
                  : isUnder15
                  ? '1px solid #EF4444'
                  : (effectivePercent < 35 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)'),
                boxShadow: isApprovedDelivering
                  ? '0 0 14px rgba(59, 130, 246, 0.2)'
                  : isUnder15 && !activeReq
                  ? '0 0 14px rgba(239, 68, 68, 0.15)'
                  : 'none',
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
                {/* 1. Header tên & badge */}
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
                    background: isApprovedDelivering
                      ? 'rgba(59, 130, 246, 0.18)'
                      : isPendingAdmin
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isUnder15
                      ? 'rgba(239, 68, 68, 0.2)'
                      : (effectivePercent < 35 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)'),
                    color: isApprovedDelivering
                      ? '#60A5FA'
                      : isPendingAdmin
                      ? '#10B981'
                      : isUnder15
                      ? '#EF4444'
                      : (effectivePercent < 35 ? '#F59E0B' : '#10B981'),
                    border: `1px solid ${
                      isApprovedDelivering
                        ? '#3B82F6'
                        : isPendingAdmin
                        ? '#10B981'
                        : isUnder15
                        ? '#EF4444'
                        : (effectivePercent < 35 ? '#F59E0B' : '#10B981')
                    }`
                  }}>
                    {isApprovedDelivering
                      ? `Đang nạp (${effectivePercent}%)`
                      : isPendingAdmin
                      ? 'Chờ Admin duyệt'
                      : isUnder15
                      ? `Dưới 15% (${effectivePercent}%)`
                      : (item.statusLabel || `Đầy đủ (${effectivePercent}%)`)}
                  </span>
                </div>

                {/* 2. Thanh tiến trình phần trăm tồn kho */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                    <span>{isApprovedDelivering ? 'Tiến độ cấp phát:' : 'Tỷ lệ tồn kho:'}</span>
                    <b style={{
                      color: isApprovedDelivering ? '#3B82F6' : (isUnder15 ? '#EF4444' : (effectivePercent < 35 ? '#F59E0B' : '#10B981'))
                    }}>
                      {effectivePercent}% {isApprovedDelivering && `(còn ${countdownStr})`}
                    </b>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${effectivePercent}%`,
                      height: '100%',
                      background: isApprovedDelivering ? 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)' : (isUnder15 ? '#EF4444' : (effectivePercent < 35 ? '#F59E0B' : '#10B981')),
                      borderRadius: '3px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>

                {/* 3. Khối số liệu tồn kho thực tế */}
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
                  <div>Tồn kho thực tế: <b style={{
                    color: isApprovedDelivering ? '#3B82F6' : (isUnder15 ? '#EF4444' : 'var(--brass)'),
                    fontSize: '13.5px'
                  }}>
                    {isApprovedDelivering ? `${item.qty} → Đang nạp đầy ${item.maxQty || ''}` : item.qty}
                  </b></div>
                  <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px' }}>Mức an toàn tối thiểu: {item.minQty} ({item.unit})</div>
                  <div style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>
                    {isApprovedDelivering ? `Thời gian sẽ đầy: sau ${countdownStr}` : `Nhập kho gần nhất: ${item.lastRestocked}`}
                  </div>
                </div>
              </div>

              {/* 4. Footer nút hành động / trạng thái */}
              {isUnder15 && !activeReq ? (
                <button
                  type="button"
                  onClick={() => handleRequestClick(item, basePercent)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                  title="Gửi yêu cầu cấp phát khẩn cấp tới Quản trị viên (Admin)"
                >
                  + Yêu Cầu Cấp Phát Thêm
                </button>
              ) : isPendingAdmin ? (
                <button
                  type="button"
                  disabled={true}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: '1px solid #10B981',
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                  title="Yêu cầu đã gửi tới Admin. Đang chờ Admin duyệt để bắt đầu tính thời gian cấp phát."
                >
                  ✓ Đã gửi thông báo đến admin
                </button>
              ) : isApprovedDelivering ? (
                <button
                  type="button"
                  disabled={true}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3B82F6',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: '1px solid #3B82F6',
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                  title="Admin đã phê duyệt. Bắt đầu tính thời gian 5 phút, kho sẽ tự động đầy 100%!"
                >
                  ⏳ Đang Cấp Phát: {countdownStr} (Sẽ Đầy)
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
                  Tồn kho an toàn ({effectivePercent}%)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

