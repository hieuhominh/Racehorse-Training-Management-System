import React, { useState } from 'react';

export default function GroomIncidentsTab({ incidents = [], onOpenReportModal }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

  const filtered = incidents.filter(i => {
    const name = (i.horseName || i.horse || '').toLowerCase();
    const title = (i.title || i.symptoms || '').toLowerCase();
    const desc = (i.desc || i.description || '').toLowerCase();
    if (name.includes('vui vẻ') || title.includes('vui vẻ') || desc.includes('vui vẻ')) return false;
    if (i.stall === 'Ô C2' && (name === '' || name.includes('vui vẻ'))) return false;
    if (filterSeverity !== 'ALL' && i.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header - Chuyên nghiệp, tuyệt đối không có icon emoji */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            Báo Cáo Sự Cố Sức Khỏe & Chuồng Trại (Incident Reports)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Theo dõi tiến trình tiếp nhận và xử lý của Bác sĩ Thú y đối với các ca báo động lâm sàng do Groom phát hiện.
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--paper-dim)', fontSize: '13px' }}>
            Không có báo cáo sự cố nào phù hợp.
          </div>
        ) : (
          filtered.map((inc) => {
            const isCrit = inc.severity === 'CRITICAL';
            const isHigh = inc.severity === 'HIGH';

            // 1. Chuẩn hóa ô chuồng và tên ngựa
            const rawStall = inc.stall || (inc.stallCode ? `Ô ${inc.stallCode}` : '');
            const stallLabel = rawStall
              ? (rawStall.startsWith('Ô') ? rawStall : `Ô ${rawStall}`)
              : 'Ô chuồng';

            const horseDisplayName = inc.horseName || (inc.title && inc.title.includes('(') ? inc.title.split('(')[1].replace(')', '').trim() : 'Chiến mã');

            // 2. Chuẩn hóa triệu chứng phát hiện
            let symptomText = inc.symptoms;
            if (!symptomText && inc.title) {
              symptomText = inc.title.split(' (')[0].trim();
            }
            if (!symptomText) {
              symptomText = 'Bất thường lâm sàng tại chuồng';
            }

            // 3. Chuẩn hóa thời gian báo
            const timeText = inc.reportedAt || inc.time || inc.timestamp || 'Vừa xong';

            // 4. Bóc tách làm sạch mô tả và các chỉ số dính chùm cũ
            let rawDesc = inc.desc || inc.description || '';
            let extractedTemp = inc.vitalSigns?.temp || inc.temp || '';
            let extractedResp = inc.vitalSigns?.respRate || inc.respRate || '';
            let firstAids = Array.isArray(inc.firstAidActions) ? [...inc.firstAidActions] : [];

            // Tách sơ cứu nếu bị dính chùm dạng [Sơ cứu: ...]
            if (rawDesc.includes('[Sơ cứu:')) {
              const mFa = rawDesc.match(/\[Sơ cứu:\s*([^\]]+)\]/);
              if (mFa && mFa[1]) {
                const parsed = mFa[1].split(' · ').map(s => s.trim()).filter(Boolean);
                if (firstAids.length === 0) firstAids = parsed;
                rawDesc = rawDesc.replace(/\[Sơ cứu:[^\]]+\]/g, '').trim();
              }
            }

            // Tách thân nhiệt/nhịp thở nếu bị dính chùm dạng [Thân nhiệt: ...]
            if (rawDesc.includes('[Thân nhiệt:')) {
              const mVitals = rawDesc.match(/\[Thân nhiệt:\s*([^·]+)·\s*Nhịp thở:\s*([^\]]+)\]/);
              if (mVitals) {
                if (!extractedTemp) extractedTemp = mVitals[1].trim();
                if (!extractedResp) extractedResp = mVitals[2].trim();
                rawDesc = rawDesc.replace(/\[Thân nhiệt:[^\]]+\]/g, '').trim();
              }
            }

            // Làm sạch chuỗi thân nhiệt dính ở đầu nếu có
            if (rawDesc.includes('Dấu hiệu:')) {
              const splitDauHieu = rawDesc.split('Dấu hiệu:');
              const headPart = splitDauHieu[0];
              rawDesc = splitDauHieu[1].trim();

              if (!extractedTemp && headPart.includes('Thân nhiệt:')) {
                const tm = headPart.match(/Thân nhiệt:\s*([^·]+)/);
                if (tm) extractedTemp = tm[1].trim();
              }
            }

            const cleanDesc = rawDesc && rawDesc.trim()
              ? rawDesc.trim()
              : 'Groom phát hiện dấu hiệu bất thường lâm sàng tại chuồng và yêu cầu Bác sĩ Thú y kiểm tra.';

            return (
              <div
                key={inc.id}
                className="facility-card"
                style={{
                  padding: '18px 22px',
                  background: isCrit ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-card)',
                  border: isCrit ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--line)',
                  boxShadow: isCrit ? '0 0 16px rgba(239, 68, 68, 0.12)' : 'none',
                  borderRadius: '10px'
                }}
              >
                {/* Header thẻ sự cố */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: isCrit ? '#EF4444' : isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      color: isCrit ? '#FFF' : isHigh ? '#F59E0B' : 'var(--paper-dim)',
                      border: isCrit ? 'none' : isHigh ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)',
                      letterSpacing: '0.04em'
                    }}>
                      {inc.severity || 'MEDIUM'}
                    </span>
                    <b style={{ fontSize: '14.5px', color: 'var(--paper)' }}>Mã: {inc.id}</b>
                    <span style={{ color: 'var(--brass)', fontWeight: 700, fontSize: '13.5px' }}>
                      · {stallLabel} ({horseDisplayName})
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Báo lúc: <b style={{ color: 'var(--paper)' }}>{timeText}</b>
                  </span>
                </div>

                {/* Box nội dung chuyên nghiệp, mạch lạc */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: 'var(--paper)',
                  lineHeight: 1.6,
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: '1px solid var(--line)'
                }}>
                  {/* 1. Triệu chứng */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--paper-dim)', fontWeight: 600, minWidth: '150px' }}>Triệu chứng phát hiện:</span>
                    <b style={{ color: isCrit ? '#EF4444' : isHigh ? '#F59E0B' : 'var(--brass)', fontSize: '13px' }}>
                      {symptomText}
                    </b>
                  </div>

                  {/* 2. Chỉ số đo tại chuồng */}
                  {(extractedTemp || extractedResp) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--paper-dim)', fontWeight: 600, minWidth: '150px' }}>Chỉ số đo tại chuồng:</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {extractedTemp && (
                          <span style={{
                            background: 'var(--bg-card)',
                            padding: '2px 9px',
                            borderRadius: '4px',
                            border: '1px solid var(--line)',
                            fontSize: '11.5px',
                            color: Number(String(extractedTemp).replace(/[^0-9.]/g, '')) > 38.5 ? '#EF4444' : 'var(--paper)',
                            fontWeight: 700
                          }}>
                            Thân nhiệt: {extractedTemp}
                          </span>
                        )}
                        {extractedResp && (
                          <span style={{
                            background: 'var(--bg-card)',
                            padding: '2px 9px',
                            borderRadius: '4px',
                            border: '1px solid var(--line)',
                            fontSize: '11.5px',
                            color: 'var(--paper)',
                            fontWeight: 600
                          }}>
                            Nhịp thở: {extractedResp}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Mô tả thực tế */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--paper-dim)', fontWeight: 600, minWidth: '150px' }}>Mô tả thực tế tại chuồng:</span>
                    <span style={{ color: 'var(--paper)', flex: 1 }}>{cleanDesc}</span>
                  </div>

                  {/* 4. Sơ cứu ban đầu */}
                  {firstAids.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ color: 'var(--paper-dim)', fontWeight: 600, minWidth: '150px' }}>Sơ cứu ban đầu:</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {firstAids.map((fa, idx) => (
                          <span key={idx} style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {fa}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer thẻ sự cố */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'var(--paper-dim)' }}>
                    Trạng thái thẩm định Thú Y: <b style={{ color: inc.status === 'resolved' ? '#10B981' : (isCrit ? '#EF4444' : 'var(--brass)') }}>
                      {inc.statusText || (inc.status === 'pending_vet' ? 'Đang chờ BS Thú Y khám' : 'Đang điều trị')}
                    </b>
                  </span>
                  <span style={{ color: 'var(--paper-dim)' }}>
                    Người lập phiếu: <b style={{ color: 'var(--paper)' }}>{inc.reportedBy || 'Lê Hoàng Nam (Groom)'}</b>
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

