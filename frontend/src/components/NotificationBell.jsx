import React, { useState, useEffect, useRef } from 'react';
import {
  getSystemNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllSystemNotifications
} from '../services/notificationService';
import { getNotificationsApi } from '../services/api';

export default function NotificationBell({ role = 'TRAINER', currentUser }) {
  const [notifications, setNotifications] = useState(() => getSystemNotifications());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const username = currentUser?.username || 'user';
  const roleCode = (role || currentUser?.role_code || currentUser?.role || '').toUpperCase();

  // Lọc thông báo dành cho vai trò hiện tại
  const myNotifications = notifications.filter(n => {
    if (!n.recipientRoles || !Array.isArray(n.recipientRoles)) return true;
    return n.recipientRoles.includes(roleCode) || n.recipientRoles.includes('ALL');
  });

  const unreadCount = myNotifications.filter(n => !n.readBy || !n.readBy.includes(username)).length;

  useEffect(() => {
    getNotificationsApi(roleCode, username).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      }
    }).catch(() => {});
  }, [roleCode, username]);

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getSystemNotifications());
    };

    window.addEventListener('matruong_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('matruong_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(username);
    setNotifications(getSystemNotifications());
  };

  const handleClearAll = () => {
    clearAllSystemNotifications();
    setNotifications([]);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="portal-theme-btn"
        title="Thông báo hệ thống"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: isOpen ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-card)',
          border: isOpen ? '1px solid var(--brass)' : '1px solid var(--line)',
          color: unreadCount > 0 ? 'var(--brass)' : 'var(--paper)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#EF4444',
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 800,
            borderRadius: '10px',
            minWidth: '17px',
            height: '17px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: 0,
          width: '340px',
          maxWidth: '90vw',
          background: 'var(--bg-card)',
          border: '1px solid var(--line-strong)',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
          zIndex: 99999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>🔔</span>
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--paper)' }}>
                Thông Báo Hệ Thống
              </span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brass)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                Đã đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px 0' }}>
            {myNotifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--paper-dim)', fontSize: '12.5px' }}>
                <div style={{ fontSize: '26px', marginBottom: '6px' }}>📭</div>
                Hiện không có thông báo nào mới.
              </div>
            ) : (
              myNotifications.map(n => {
                const isRead = n.readBy && n.readBy.includes(username);
                const isHorseDeleted = n.type === 'HORSE_DELETED';
                const isTrainingRequest = n.type === 'TRAINING_REQUEST';
                const isServiceConfirmed = n.type === 'SERVICE_CONFIRMED';

                let tagText = '📢 THÔNG BÁO';
                let tagBg = 'rgba(212, 175, 55, 0.15)';
                let tagColor = 'var(--brass)';
                let borderLeftColor = '3px solid var(--brass)';

                if (isHorseDeleted) {
                  tagText = '⚠️ XÓA CHIẾN MÃ';
                  tagBg = 'rgba(239, 68, 68, 0.15)';
                  tagColor = '#EF4444';
                  borderLeftColor = '3px solid #EF4444';
                } else if (isTrainingRequest) {
                  tagText = '🏇 YÊU CẦU HUẤN LUYỆN';
                  tagBg = 'rgba(245, 158, 11, 0.15)';
                  tagColor = '#F59E0B';
                  borderLeftColor = '3px solid #F59E0B';
                } else if (isServiceConfirmed) {
                  tagText = '✅ TIẾP NHẬN THÀNH CÔNG';
                  tagBg = 'rgba(16, 185, 129, 0.15)';
                  tagColor = '#10B981';
                  borderLeftColor = '3px solid #10B981';
                }

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationAsRead(n.id, username);
                      setNotifications(getSystemNotifications());
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--line)',
                      background: isRead ? 'transparent' : 'rgba(212, 175, 55, 0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      borderLeft: borderLeftColor
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: tagBg,
                        color: tagColor
                      }}>
                        {tagText}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>
                        {n.time}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: isRead ? 500 : 700, color: 'var(--paper)', lineHeight: 1.4, marginBottom: '2px' }}>
                      {n.title}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', lineHeight: 1.35 }}>
                      {n.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {myNotifications.length > 0 && (
            <div style={{
              padding: '8px 14px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--bg-secondary)'
            }}>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Xóa tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

