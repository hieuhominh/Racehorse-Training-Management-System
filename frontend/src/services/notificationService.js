// Dịch vụ quản lý thông báo hệ thống liên thông giữa các Cổng (Owner, Trainer, Vet, Groom, Admin)
const STORAGE_KEY = 'matruong_system_notifications';
const EVENT_NAME = 'matruong_notifications_updated';

/**
 * Lấy danh sách thông báo từ LocalStorage
 */
export function getSystemNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Lưu danh sách thông báo và phát tín hiệu cho tất cả các cổng
 */
export function saveSystemNotifications(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving system notifications:', err);
  }
}

/**
 * Tạo một thông báo hệ thống mới
 */
export function addSystemNotification(notifData) {
  const current = getSystemNotifications();
  const newNotif = {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
    timestamp: Date.now(),
    type: notifData.type || 'INFO',
    title: notifData.title || 'Thông báo hệ thống',
    message: notifData.message || '',
    horseName: notifData.horseName || '',
    horseId: notifData.horseId || null,
    microchip: notifData.microchip || '',
    stable: notifData.stable || '',
    ownerName: notifData.ownerName || '',
    ownerKey: notifData.ownerKey || '',
    recipientRoles: notifData.recipientRoles || ['ADMIN', 'TRAINER', 'VET', 'GROOM'],
    readBy: []
  };

  const updated = [newNotif, ...current.slice(0, 49)]; // Giữ tối đa 50 thông báo gần nhất
  saveSystemNotifications(updated);
  return newNotif;
}

/**
 * Thông báo khi Chủ sở hữu xóa chiến mã:
 * Gửi thông báo đến Huấn luyện viên, Bác sĩ, Người chăm sóc và Quản trị viên (Admin)
 */
export function notifyHorseDeleted(horse, ownerUser) {
  const ownerName = ownerUser?.full_name || 'Phạm Tiến Thành';
  const horseName = horse?.name || 'Chiến mã';
  const microchip = horse?.microchip || '';
  const stable = horse?.stable || '';

  return addSystemNotification({
    type: 'HORSE_DELETED',
    title: 'CHIẾN MÃ ĐÃ BỊ XÓA KHỎI HỆ THỐNG',
    message: `Chủ sở hữu ${ownerName} đã xóa chiến mã "${horseName}"${microchip ? ` (Chip: ${microchip})` : ''}${stable ? ` tại ô chuồng ${stable}` : ''} khỏi trang trại. Đội ngũ chuyên trách và Admin vui lòng cập nhật lại hồ sơ.`,
    horseName,
    horseId: horse?.id,
    microchip,
    stable,
    ownerName,
    ownerKey: ownerUser?.username || 'owner_thanh',
    recipientRoles: ['ADMIN', 'TRAINER', 'VET', 'GROOM']
  });
}

/**
 * Đánh dấu một thông báo là đã đọc
 */
export function markNotificationAsRead(notifId, username) {
  const current = getSystemNotifications();
  const updated = current.map(n => {
    if (n.id === notifId) {
      const readBy = Array.isArray(n.readBy) ? n.readBy : [];
      if (!readBy.includes(username)) {
        return { ...n, readBy: [...readBy, username] };
      }
    }
    return n;
  });
  saveSystemNotifications(updated);
  return updated;
}

/**
 * Đánh dấu tất cả thông báo là đã đọc cho người dùng hiện tại
 */
export function markAllNotificationsAsRead(username) {
  const current = getSystemNotifications();
  const updated = current.map(n => {
    const readBy = Array.isArray(n.readBy) ? n.readBy : [];
    if (!readBy.includes(username)) {
      return { ...n, readBy: [...readBy, username] };
    }
    return n;
  });
  saveSystemNotifications(updated);
  return updated;
}

/**
 * Xóa toàn bộ thông báo
 */
export function clearAllSystemNotifications() {
  saveSystemNotifications([]);
}

