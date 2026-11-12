import React, { useState, useEffect } from 'react';
import { getSystemNotifications } from '../../services/notificationService';

export default function GroomNotificationsTab({ notifications = [] }) {
  const [localNotifications, setLocalNotifications] = useState(() => {
    if (notifications && notifications.length > 0) return notifications;
    return getSystemNotifications().filter(n => {
      if (!n.recipientRoles || n.recipientRoles.includes('ALL') || n.recipientRoles.includes('GROOM')) {
        return true;
      }
      return false;
    });
  });

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setLocalNotifications(notifications);
    } else {
      const list = getSystemNotifications().filter(n => {
        if (!n.recipientRoles || n.recipientRoles.includes('ALL') || n.recipientRoles.includes('GROOM')) {
          return true;
        }
        return false;
      });
      setLocalNotifications(list);
    }
  }, [notifications]);

  useEffect(() => {
    const handleUpdate = () => {
      const list = getSystemNotifications().filter(n => {
        if (!n.recipientRoles || n.recipientRoles.includes('ALL') || n.recipientRoles.includes('GROOM')) {
          return true;
        }
        return false;
      });
      setLocalNotifications(list);
    };

    window.addEventListener('matruong_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('matruong_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header - Chuẩn mực, tuyệt đối không có icon emoji */}
      <div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
          Thông Báo Hệ Thống (Notifications)
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
          Các thông báo liên thông về y lệnh mới, lệnh khóa y tế, giờ tập từ Huấn luyện viên và cập nhật từ Bác sĩ Thú y.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {localNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--paper-dim)', fontSize: '13px' }}>
            Hiện chưa có thông báo hệ thống mới nào.
          </div>
        ) : (
          localNotifications.map((n) => {
            const isAlert = n.type === 'INCIDENT_REPORTED' || n.type === 'HEALTH_ALERT' || n.type === 'URGENT';
            const isVet = n.type === 'HEALTH_CHECK' || n.type === 'VET' || n.type === 'PRESCRIPTION';

            return (
              <div
                key={n.id}
                className="facility-card"
                style={{
                  padding: '16px 20px',
                  background: n.isRead ? 'var(--bg-card)' : 'rgba(212, 175, 55, 0.05)',
                  borderLeft: isAlert ? '4px solid #EF4444' : isVet ? '4px solid var(--brass)' : '4px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: '14px', color: isAlert ? '#EF4444' : 'var(--paper)' }}>
                      {n.title}
                    </b>
                    {!n.isRead && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brass)', background: 'rgba(212, 175, 55, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        MỚI
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
                    {n.message || n.desc}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
                  {n.time}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

