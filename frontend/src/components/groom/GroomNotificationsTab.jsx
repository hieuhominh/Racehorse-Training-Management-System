import React from 'react';

export default function GroomNotificationsTab({ notifications = [] }) {
  const mockNotifications = notifications.length > 0 ? notifications : [
    {
      id: 'NOTIF-01',
      title: '🚨 Lệnh tạm ngừng huấn luyện (Khóa Y Tế)',
      desc: 'BS. Nguyễn An đã ban hành lệnh khóa y tế đối với chiến mã Xích Thố (Ô A2). Groom tuyệt đối không dắt ngựa ra sân tập.',
      time: '07:00 Sáng nay',
      type: 'URGENT',
      isUnread: true
    },
    {
      id: 'NOTIF-02',
      title: '💊 Y lệnh điều trị mới từ Bác sĩ Thú Y',
      desc: 'Bác sĩ Thú y vừa kê đơn Gastrogard dạng gel cho Bạch Long (Ô A3). Vui lòng thực hiện bơm thuốc.',
      time: '08:30 Sáng nay',
      type: 'VET',
      isUnread: true
    },
    {
      id: 'NOTIF-03',
      title: '🏇 Thông báo giờ tập của HLV Lê Trọng Nghĩa',
      desc: 'HLV thông báo Lôi Chấn (Ô A5) sẽ tập nước rút lúc 14:00. Đề nghị Groom chuẩn bị ủng đá Cryo đón ngựa lúc 14:30.',
      time: '09:15 Sáng nay',
      type: 'TRAINER',
      isUnread: true
    },
    {
      id: 'NOTIF-04',
      title: '🌾 Nhập kho đệm lót mùn cưa mới',
      desc: 'Bộ phận hậu cần thông báo 20 bao mùn cưa mới đã về kho Block A. Groom có thể lấy sử dụng thay đệm lót.',
      time: 'Hôm qua 16:00',
      type: 'SYSTEM',
      isUnread: false
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
          🔔 Thông Báo Hệ Thống (Notifications)
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
          Các thông báo liên thông về y lệnh mới, lệnh khóa y tế, giờ tập từ Huấn luyện viên và cập nhật kho vật tư.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mockNotifications.map((n) => (
          <div
            key={n.id}
            className="facility-card"
            style={{
              padding: '16px 20px',
              background: n.isUnread ? 'rgba(212, 175, 55, 0.05)' : 'var(--bg-card)',
              borderLeft: n.type === 'URGENT' ? '4px solid #EF4444' : n.type === 'VET' ? '4px solid var(--brass)' : '4px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <b style={{ fontSize: '14.5px', color: n.type === 'URGENT' ? '#EF4444' : 'var(--paper)' }}>
                  {n.title}
                </b>
                {n.isUnread && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brass)', background: 'rgba(212, 175, 55, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    MỚI
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.45 }}>
                {n.desc}
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
              {n.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

