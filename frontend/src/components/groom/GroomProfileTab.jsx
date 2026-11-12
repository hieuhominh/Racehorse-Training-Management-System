import React from 'react';

export default function GroomProfileTab({ currentUser }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '780px' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
          👤 Hồ Sơ Nhân Viên Chăm Sóc (My Profile)
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
          Thông tin phân công nhiệm vụ, chứng chỉ nghề nghiệp và khu vực phụ trách tại Trường đua Phú Thọ.
        </p>
      </div>

      <div className="facility-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--brass)',
            color: '#0A0D14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 800,
            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)'
          }}>
            GN
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--paper)' }}>
                {currentUser?.full_name || 'Lê Hoàng Nam'}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--brass)',
                background: 'rgba(212, 175, 55, 0.12)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                GROOM TRỰC BAN
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginTop: '4px' }}>
              {currentUser?.title || 'Trưởng nhóm Chăm sóc chuồng trại Block A'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
              Email: <b style={{ color: 'var(--paper)' }}>{currentUser?.email || 'groom@matruong.vn'}</b> · SĐT: <b style={{ color: 'var(--paper)' }}>{currentUser?.phone || '0903456789'}</b>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          background: 'var(--bg-secondary)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--line)',
          marginBottom: '20px',
          fontSize: '12.5px'
        }}>
          <div>
            <span style={{ color: 'var(--paper-dim)' }}>Khu vực phụ trách:</span>
            <div style={{ fontWeight: 700, color: 'var(--brass)', marginTop: '2px' }}>Block A (Ô A1 - Ô A6)</div>
          </div>
          <div>
            <span style={{ color: 'var(--paper-dim)' }}>Ca làm việc cố định:</span>
            <div style={{ fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>Ca Sáng (05:00 - 13:00)</div>
          </div>
          <div>
            <span style={{ color: 'var(--paper-dim)' }}>Kinh nghiệm chuyên môn:</span>
            <div style={{ fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>6 năm chăm sóc ngựa đua thuần chủng</div>
          </div>
          <div>
            <span style={{ color: 'var(--paper-dim)' }}>Bác sĩ phối hợp:</span>
            <div style={{ fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>BS. Nguyễn An (Thú Y Trưởng)</div>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--brass)' }}>
            📜 Chứng Chỉ Chuyên Môn & Đào Tạo
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.7 }}>
            <li>Chứng chỉ Sơ cấp cứu chấn thương móng & gân ngựa đua (Equine First Aid - Hong Kong Jockey Club).</li>
            <li>Chứng chỉ Dinh dưỡng & Kiểm soát thể trọng ngựa đua quốc tế (FEI Equine Nutrition Standard).</li>
            <li>Chứng chỉ An toàn sinh học & Khử trùng chuồng trại cách ly dịch bệnh gia súc lớn.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

