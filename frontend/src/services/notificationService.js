// Dịch vụ quản lý thông báo hệ thống liên thông giữa các Cổng (Owner, Trainer, Vet, Groom, Admin)
import {
  createNotificationApi,
  markNotificationReadApi,
  clearNotificationsApi
} from './api';

const STORAGE_KEY = 'matruong_system_notifications';
const READ_IDS_KEY = 'matruong_read_notification_ids';
const EVENT_NAME = 'matruong_notifications_updated';

/**
 * Lấy danh sách ID các thông báo đã đọc từ LocalStorage
 */
export function getReadNotificationIds() {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {}
  return new Set();
}

/**
 * Lưu danh sách ID các thông báo đã đọc
 */
export function saveReadNotificationIds(idsSet) {
  try {
    const arr = Array.from(idsSet);
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * Kiểm tra xem một thông báo đã được xem / đã đọc hay chưa
 */
export function isNotificationRead(notif, username = '') {
  if (!notif) return true;
  if (notif.isRead === true) return true;
  const readIds = getReadNotificationIds();
  if (readIds.has(String(notif.id))) return true;
  if (Array.isArray(notif.readBy)) {
    if (notif.readBy.includes('ALL')) return true;
    if (username && notif.readBy.includes(username)) return true;
  }
  return false;
}

const INITIAL_NOTIFICATIONS = [];

/**
 * Lấy danh sách thông báo từ LocalStorage (Đã đối soát bền vững với danh sách đã đọc)
 */
export function getSystemNotifications() {
  const readIds = getReadNotificationIds();
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) { list = parsed.filter(item => item.ownerKey !== 'owner_thanh' && item.ownerName !== 'Phạm Tiến Thành'); }
    } else {
      list = INITIAL_NOTIFICATIONS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  } catch {
    list = INITIAL_NOTIFICATIONS;
  }

  return list.map(item => {
    const idStr = String(item.id);
    const read = item.isRead === true || readIds.has(idStr) || (Array.isArray(item.readBy) && (item.readBy.includes('ALL') || item.readBy.length > 0));
    return {
      ...item,
      isRead: read,
      readBy: read && (!item.readBy || item.readBy.length === 0) ? ['ALL'] : (item.readBy || [])
    };
  });
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
  createNotificationApi(newNotif).catch(() => {});
  return newNotif;
}

/**
 * Thông báo khi Chủ sở hữu xóa chiến mã:
 * Gửi thông báo đến Huấn luyện viên, Bác sĩ, Người chăm sóc và Quản trị viên (Admin)
 */
export function notifyHorseDeleted(horse, ownerUser) {
  const ownerName = ownerUser?.full_name || 'Chủ sở hữu';
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
    ownerKey: ownerUser?.username || 'owner',
    recipientRoles: ['ADMIN', 'TRAINER', 'VET', 'GROOM']
  });
}

/**
 * Thông báo khi Chủ sở hữu gửi yêu cầu chỉ định Huấn luyện viên trưởng:
 * Gửi thông báo đến Huấn luyện viên, Admin và toàn hệ thống
 */
export function notifyTrainingRequested(horse, ownerUser, trainerSelection) {
  const ownerName = ownerUser?.full_name || horse?.ownerName || horse?.owner || 'Chủ sở hữu';
  const horseName = horse?.name || horse?.horseName || 'Chiến mã';
  const microchip = horse?.microchip || '';
  const stable = horse?.stable || horse?.stall || 'Ô A4';
  const trainerName = typeof trainerSelection === 'string'
    ? trainerSelection
    : (trainerSelection?.name || horse?.trainerName || horse?.trainer || 'Lê Trọng Nghĩa');

  return addSystemNotification({
    type: 'TRAINING_REQUEST',
    title: 'YÊU CẦU HUẤN LUYỆN CHIẾN MÃ',
    message: `Chủ sở hữu ${ownerName} đã gửi yêu cầu chỉ định ${trainerName} làm Huấn luyện viên trưởng cho chiến mã "${horseName}"${microchip ? ` (Chip: ${microchip})` : ''}${stable ? ` tại ${stable}` : ''}. Vui lòng thẩm định hồ sơ và xác nhận phục vụ.`,
    horseName,
    horseId: horse?.id,
    microchip,
    stable,
    ownerName,
    trainerName,
    ownerKey: ownerUser?.username || 'owner',
    recipientRoles: ['TRAINER', 'ADMIN', 'ALL']
  });
}

/**
 * Thông báo khi Chủ sở hữu chỉ định Chuyên viên chăm sóc (Groom):
 * Gửi thông báo đến Groom chuyên trách và Admin
 */
export function notifyGroomAssignmentRequested(horse, ownerUser, groomSelection) {
  const ownerName = ownerUser?.full_name || horse?.ownerName || horse?.owner || 'Chủ sở hữu';
  const horseName = horse?.name || horse?.horseName || 'Chiến mã';
  const microchip = horse?.microchip || '';
  const stable = horse?.stable || horse?.stall || 'Ô A1';
  const groomName = typeof groomSelection === 'string'
    ? groomSelection
    : (groomSelection?.name || horse?.groomName || horse?.groom || 'Lê Hoàng Nam');
  const groomUsername = typeof groomSelection === 'object' ? groomSelection?.username : 'groom_nam';

  return addSystemNotification({
    type: 'GROOM_REQUEST',
    title: 'YÊU CẦU TIẾP NHẬN CHĂM SÓC MỚI',
    message: `Chủ sở hữu ${ownerName} đã gửi gắm và chỉ định ${groomName} phụ trách chăm sóc chiến mã "${horseName}"${microchip ? ` (Chip: ${microchip})` : ''}${stable ? ` tại ${stable}` : ''}. Vui lòng xác nhận trước khi bắt đầu phục vụ.`,
    horseName,
    horseId: horse?.id,
    microchip,
    stable,
    ownerName,
    ownerKey: ownerUser?.username || 'owner',
    groomName,
    recipientUsername: groomUsername,
    recipientRoles: ['GROOM', 'ADMIN', 'ALL']
  });
}

/**
 * Thông báo khi Huấn luyện viên / Bác sĩ / Groom xác nhận tiếp nhận phục vụ:
 * Gửi thông báo trực tiếp đến Chủ sở hữu, chuyên viên và Admin
 */
export function notifyServiceConfirmed(horseOrAsgn, staffUser, role = 'TRAINER') {
  const horseName = horseOrAsgn?.horseName || horseOrAsgn?.name || 'Chiến mã';
  const microchip = horseOrAsgn?.microchip || '';
  const stable = horseOrAsgn?.stable || horseOrAsgn?.stall || 'Ô A1';
  const ownerName = horseOrAsgn?.ownerName || horseOrAsgn?.owner || 'Chủ sở hữu';
  const ownerKey = horseOrAsgn?.ownerKey || 'owner';
  const roleName = role === 'TRAINER' ? 'Huấn Luyện Viên' : role === 'VET' ? 'Bác Sĩ Thú Y' : 'Chuyên Viên Chăm Sóc (Groom)';
  const staffName = staffUser?.full_name || staffUser?.name ||
    (role === 'TRAINER' ? (horseOrAsgn?.trainerName || 'Lê Trọng Nghĩa') :
     role === 'VET' ? (horseOrAsgn?.vetName || 'BS. Trần Minh Hoàng') :
     (horseOrAsgn?.groomName || 'Lê Hoàng Nam'));

  const actionText = role === 'TRAINER' ? 'tiếp nhận huấn luyện' : role === 'VET' ? 'phụ trách y tế' : 'tiếp nhận chăm sóc';
  const detailText = role === 'GROOM'
    ? `Chuyên viên chăm sóc ${staffName} đã chính thức ĐỒNG Ý tiếp nhận chăm sóc cho chiến mã "${horseName}" của bạn tại chuồng trại. Quy trình khẩu phần ăn, vệ sinh ô chuồng và theo dõi thể chất đã chính thức bắt đầu!`
    : `${roleName} ${staffName} đã chính thức xác nhận ${actionText} cho chiến mã "${horseName}"${microchip ? ` (Chip: ${microchip})` : ''}${stable ? ` tại ${stable}` : ''}. Chủ sở hữu và ban chuyên môn có thể bắt đầu theo dõi tiến độ.`;

  return addSystemNotification({
    type: 'SERVICE_CONFIRMED',
    title: `${roleName.toUpperCase()} ĐÃ ĐỒNG Ý PHỤC VỤ`,
    message: detailText,
    horseName,
    horseId: horseOrAsgn?.id,
    microchip,
    stable,
    ownerName,
    ownerKey,
    staffName,
    role,
    recipientRoles: ['OWNER', 'TRAINER', 'VET', 'GROOM', 'ADMIN', 'ALL']
  });
}

/**
 * Thông báo khi Chuyên viên chăm sóc (Groom) từ chối / không đồng ý phục vụ:
 * Gửi thông báo đến Chủ sở hữu để chọn Groom khác
 */
export function notifyServiceRejected(horseOrAsgn, staffUser, role = 'GROOM', reason = '') {
  const horseName = horseOrAsgn?.horseName || horseOrAsgn?.name || 'Chiến mã';
  const microchip = horseOrAsgn?.microchip || '';
  const ownerName = horseOrAsgn?.ownerName || horseOrAsgn?.owner || 'Chủ sở hữu';
  const ownerKey = horseOrAsgn?.ownerKey || 'owner';
  const roleName = role === 'GROOM' ? 'Chuyên Viên Chăm Sóc (Groom)' : role === 'TRAINER' ? 'Huấn Luyện Viên' : 'Bác Sĩ Thú Y';
  const staffName = staffUser?.full_name || staffUser?.name || 'Lê Hoàng Nam';

  return addSystemNotification({
    type: 'SERVICE_REJECTED',
    title: `${roleName.toUpperCase()} TỪ CHỐI TIẾP NHẬN PHỤC VỤ`,
    message: `${roleName} ${staffName} không thể tiếp nhận chăm sóc cho chiến mã "${horseName}" của bạn vào lúc này${reason ? ` (Lý do: ${reason})` : ''}. Chiến mã đã được gỡ khỏi danh sách của Groom. Vui lòng vào mục Quản lý chiến mã để phân công chuyên viên khác.`,
    horseName,
    horseId: horseOrAsgn?.id,
    microchip,
    ownerName,
    ownerKey,
    staffName,
    role,
    recipientRoles: ['OWNER', 'ADMIN', 'ALL']
  });
}

/**
 * Đánh dấu một thông báo là đã đọc (Lưu vĩnh viễn theo ID)
 */
export function markNotificationAsRead(notifId, username) {
  const readIds = getReadNotificationIds();
  if (notifId) readIds.add(String(notifId));
  saveReadNotificationIds(readIds);

  const current = getSystemNotifications();
  const updated = current.map(n => {
    if (String(n.id) === String(notifId)) {
      const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
      if (username && !readBy.includes(username)) readBy.push(username);
      if (!readBy.includes('ALL')) readBy.push('ALL');
      return { ...n, isRead: true, readBy };
    }
    return n;
  });
  saveSystemNotifications(updated);
  markNotificationReadApi(notifId, username, false).catch(() => {});
  return updated;
}

/**
 * Đánh dấu tất cả thông báo là đã đọc cho người dùng hiện tại (Lưu vĩnh viễn)
 */
export function markAllNotificationsAsRead(username) {
  const current = getSystemNotifications();
  const readIds = getReadNotificationIds();
  current.forEach(n => {
    if (n.id) readIds.add(String(n.id));
  });
  saveReadNotificationIds(readIds);

  const updated = current.map(n => {
    const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
    if (username && !readBy.includes(username)) readBy.push(username);
    if (!readBy.includes('ALL')) readBy.push('ALL');
    return { ...n, isRead: true, readBy };
  });
  saveSystemNotifications(updated);
  markNotificationReadApi(null, username, true).catch(() => {});
  return updated;
}

/**
 * Xóa toàn bộ thông báo vĩnh viễn
 */
export function clearAllSystemNotifications() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
    window.dispatchEvent(new Event('storage'));
  } catch {}
  clearNotificationsApi().catch(() => {});
}

/**
 * Thông báo khi chuồng chuyển sang trạng thái bảo dưỡng (30 phút) và điều chuyển ngựa sang chuồng tạm:
 * Gửi thông báo tới Chủ sở hữu, Huấn luyện viên, Bác sĩ thú y, Chăm sóc (Groom) và Admin
 */
export function notifyStallMaintenanceStarted(stallCode, tempStallCode, horseName, durationMinutes = 30) {
  return addSystemNotification({
    type: 'STALL_MAINTENANCE',
    title: `BẢO TRÌ Ô CHUỒNG ${stallCode} & ĐIỀU CHUYỂN TẠM (${durationMinutes} PHÚT)`,
    message: `Ô chuồng ${stallCode} của chiến mã "${horseName}" bắt đầu quá trình bảo dưỡng, khử trùng định kỳ trong ${durationMinutes} phút. Chiến mã đã được tự động điều chuyển tạm thời sang ô chuồng ${tempStallCode}. Sau ${durationMinutes} phút, chiến mã sẽ tự động quay trở về ô chuồng ${stallCode}.`,
    horseName,
    stable: stallCode,
    tempStable: tempStallCode,
    durationMinutes,
    recipientRoles: ['OWNER', 'TRAINER', 'VET', 'GROOM', 'ADMIN', 'ALL']
  });
}

/**
 * Thông báo khi chuồng hoàn tất bảo dưỡng 30 phút và ngựa quay trở lại chuồng ban đầu:
 * Gửi thông báo tới Chủ sở hữu, Huấn luyện viên, Bác sĩ thú y, Chăm sóc (Groom) và Admin
 */
export function notifyStallMaintenanceCompleted(stallCode, tempStallCode, horseName) {
  return addSystemNotification({
    type: 'STALL_MAINTENANCE_COMPLETED',
    title: `HOÀN TẤT BẢO TRÌ Ô CHUỒNG ${stallCode}`,
    message: `Quá trình bảo dưỡng định kỳ cho ô chuồng ${stallCode} đã hoàn tất. Chiến mã "${horseName}" đã được đưa trở lại đúng ô chuồng ${stallCode} an toàn. Ô chuồng tạm ${tempStallCode} đã được giải phóng trở về trạng thái sẵn sàng.`,
    horseName,
    stable: stallCode,
    tempStable: tempStallCode,
    recipientRoles: ['OWNER', 'TRAINER', 'VET', 'GROOM', 'ADMIN', 'ALL']
  });
}


