// Quản lý dịch vụ Đặt lịch tập luyện chung giữa Chủ sở hữu ngựa và Huấn luyện viên
// Tích hợp kiểm tra nghiêm ngặt Quyền phủ quyết y tế (Medical Safety Veto của Bác sĩ Thú y)
// Logic chống trùng lịch (Ưu tiên người đặt trước), Khung giờ 06:00 - 18:00 & Nghỉ trưa 11:45 - 13:00
import { addSystemNotification } from './notificationService';
import { getServiceAssignments, FIXED_TRAINERS_LIST } from './serviceAssignment';
import {
  getJointTrainingSessionsApi,
  bookJointTrainingSessionApi,
  confirmJointTrainingSessionApi,
  rejectJointTrainingSessionApi,
  cancelJointTrainingSessionApi
} from './api';

const STORAGE_KEY = 'matruong_joint_training_sessions';
const EVENT_NAME = 'matruong_joint_training_updated';

/**
 * Danh sách toàn bộ khung giờ tập chuẩn từ 06:00 đến 18:00
 * Có thời gian nghỉ trưa cố định từ 11:45 đến 13:00 (Khóa bảo dưỡng sân bãi)
 */
export const TRAINING_TIME_SLOTS = [
  { id: '06:00 - 07:00', label: '06:00 - 07:00', desc: 'Sáng sớm - Bứt tốc cự ly', isLunch: false },
  { id: '07:00 - 08:00', label: '07:00 - 08:00', desc: 'Sáng sớm - Rèn sức bền', isLunch: false },
  { id: '08:00 - 09:00', label: '08:00 - 09:00', desc: 'Buổi sáng - Kỹ thuật sải chân', isLunch: false },
  { id: '09:00 - 10:00', label: '09:00 - 10:00', desc: 'Buổi sáng - Xuất phát máy', isLunch: false },
  { id: '10:00 - 11:00', label: '10:00 - 11:00', desc: 'Buổi sáng - Chạy vòng cua', isLunch: false },
  { id: '11:00 - 11:45', label: '11:00 - 11:45', desc: 'Trưa sớm - Thả lỏng & Hồi phục', isLunch: false },
  { id: '11:45 - 13:00', label: '11:45 - 13:00', desc: '🍽️ Nghỉ trưa & Bảo dưỡng bãi tập (Khóa)', isLunch: true },
  { id: '13:00 - 14:00', label: '13:00 - 14:00', desc: 'Đầu chiều - Thể lực nền', isLunch: false },
  { id: '14:00 - 15:00', label: '14:00 - 15:00', desc: 'Buổi chiều - Bài tập sân cỏ', isLunch: false },
  { id: '15:00 - 16:00', label: '15:00 - 16:00', desc: 'Buổi chiều - Bài tập sân cát', isLunch: false },
  { id: '16:00 - 17:00', label: '16:00 - 17:00', desc: 'Chiều mát - Nước rút 400m', isLunch: false },
  { id: '17:00 - 18:00', label: '17:00 - 18:00', desc: 'Hoàng hôn - Hạ nhiệt & Đi bộ', isLunch: false },
];

/**
 * Chuẩn hóa chuỗi ngày tháng về định dạng YYYY-MM-DD để so sánh chính xác tuyệt đối
 */
export function normalizeDate(d) {
  if (!d) return '';
  const str = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}
  return str;
}

/**
 * Lấy phần tiền tố giờ (VD: '06:00 - 07:00') từ chuỗi giờ có kèm mô tả
 */
export function extractSlotPrefix(timeStr) {
  if (!timeStr) return '';
  const match = String(timeStr).match(/(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
  if (match) return match[1].replace(/\s+/g, ' ').trim();
  return String(timeStr).split(' (')[0].trim();
}

// Danh sách buổi tập chung mẫu khởi điểm
const INITIAL_JOINT_SESSIONS = [];

let isJointSyncing = false;

/**
 * Lấy danh sách toàn bộ các buổi hẹn tập luyện chung (hỗ trợ nền tự động đồng bộ API)
 */
export function getJointTrainingSessions() {
  let list = INITIAL_JOINT_SESSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.filter(item => item.ownerKey !== 'owner_thanh' && item.ownerName !== 'Phạm Tiến Thành');
    }
  } catch {}

  if (!isJointSyncing && typeof window !== 'undefined') {
    isJointSyncing = true;
    getJointTrainingSessionsApi().then(apiList => {
      isJointSyncing = false;
      if (Array.isArray(apiList) && apiList.length > 0) {
        const rawLocal = localStorage.getItem(STORAGE_KEY);
        const localList = rawLocal ? JSON.parse(rawLocal) : [];
        const mergedMap = new Map();
        apiList.forEach(s => mergedMap.set(String(s.id), s));
        localList.forEach(s => {
          if (!mergedMap.has(String(s.id))) mergedMap.set(String(s.id), s);
        });
        const merged = Array.from(mergedMap.values());
        if (JSON.stringify(merged) !== rawLocal) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event(EVENT_NAME));
        }
      }
    }).catch(() => {
      isJointSyncing = false;
    });
  }

  return list;
}

/**
 * Lưu danh sách các buổi hẹn tập luyện chung và phát sự kiện đồng bộ thời gian thực
 */
export function saveJointTrainingSessions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_NAME));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving joint training sessions:', err);
  }
}

/**
 * Lấy danh sách các slot đã bị đặt trước cho 1 HLV cụ thể vào 1 ngày cụ thể
 * Ưu tiên người đặt trước: Bất kỳ lịch nào có trạng thái PENDING hoặc CONFIRMED
 * đều được tính là đã có người đặt trước để bôi đen và không cho người khác đặt trùng.
 */
export function getBookedSlotsForTrainer(trainerUsername, sessionDate) {
  if (!trainerUsername || !sessionDate) return [];
  const targetDate = normalizeDate(sessionDate);
  const allSessions = getJointTrainingSessions();

  return allSessions.filter(s => {
    // Cả PENDING (đang chờ duyệt) và CONFIRMED (đã duyệt) đều tính là đã có người đặt trước
    if (s.status !== 'PENDING' && s.status !== 'CONFIRMED') return false;
    const effectiveTrainer = s.transferStatus === 'TRANSFERRED' && s.substituteTrainerUsername
      ? s.substituteTrainerUsername
      : s.trainerUsername;
    if (effectiveTrainer !== trainerUsername) return false;
    return normalizeDate(s.sessionDate) === targetDate;
  });
}

/**
 * Kiểm tra xem 1 slot có thể đặt được không
 * Trả về { available: boolean, isLunch: boolean, isBooked: boolean, bookedSession: object | null, reason: string }
 */
export function getSlotBookingStatus(slotId, trainerUsername, sessionDate) {
  const slotObj = TRAINING_TIME_SLOTS.find(s => s.id === slotId) || { id: slotId, isLunch: false };
  if (slotObj.isLunch || slotId.includes('11:45 - 13:00')) {
    return {
      available: false,
      isLunch: true,
      isBooked: false,
      hasPending: false,
      bookedSession: null,
      reason: 'Khoảng thời gian 11:45 - 13:00 là giờ nghỉ trưa & bảo dưỡng bãi tập'
    };
  }

  const bookedList = getBookedSlotsForTrainer(trainerUsername, sessionDate);
  const slotPrefix = extractSlotPrefix(slotId);
  const bookedSession = bookedList.find(s => extractSlotPrefix(s.sessionTime) === slotPrefix);

  if (bookedSession) {
    const isPending = bookedSession.status === 'PENDING';
    return {
      available: false,
      isLunch: false,
      isBooked: true,
      hasPending: isPending,
      bookedSession: bookedSession,
      reason: isPending
        ? `Đã có chủ sở hữu (${bookedSession.ownerName}) đặt trước - Ưu tiên người đặt trước`
        : `HLV đã xác nhận giữ chỗ cho chủ sở hữu ${bookedSession.ownerName}`
    };
  }

  return {
    available: true,
    isLunch: false,
    isBooked: false,
    hasPending: false,
    bookedSession: null,
    reason: 'Còn trống'
  };
}

/**
 * Kiểm tra trạng thái Khóa Y Tế của chiến mã trên toàn bộ hệ thống
 * (Đảm bảo nếu Bác sĩ Thú y cấm tập thì không được tập luyện chung hay đi thi đấu)
 */
export function checkHorseVetLockStatus(horseIdentifier) {
  if (!horseIdentifier) return { isLocked: false, reason: '', horseName: '' };
  const rawKey = String(horseIdentifier).trim();
  const key = rawKey.toLowerCase();

  // 0. Quét tìm trong Bảng Khóa Y Tế Toàn Cục (Global Active Vet Locks)
  try {
    const rawActive = localStorage.getItem('matruong_vet_active_locks');
    if (rawActive) {
      const activeMap = JSON.parse(rawActive);
      if (activeMap && typeof activeMap === 'object') {
        const entry = activeMap[key] || activeMap[rawKey];
        if (entry) {
          if (entry.isLocked === false) {
            // Đã được Bác sĩ dỡ khóa y tế một cách tường minh
            return { isLocked: false, reason: '', horseName: entry.horseName || horseIdentifier };
          }
          if (entry.isLocked) {
            return {
              isLocked: true,
              reason: entry.reason || 'Bác sĩ Thú y kích hoạt Lệnh Khóa Y Tế (Tạm cấm tập luyện & thi đấu)',
              horseName: entry.horseName || horseIdentifier
            };
          }
        }
      }
    }
  } catch {}

  // 1. Quét tìm trong danh sách Thú y quản lý
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey === 'matruong_vet_horses_managed' || (storageKey && storageKey.startsWith('matruong_vet_horses_'))) {
        const rawVet = localStorage.getItem(storageKey);
        if (rawVet) {
          const list = JSON.parse(rawVet);
          if (Array.isArray(list)) {
            const found = list.find(h =>
              (h.id && String(h.id).toLowerCase() === key) ||
              (h.microchip && h.microchip.toLowerCase() === key) ||
              (h.name && h.name.toLowerCase() === key)
            );
            if (found) {
              if (found.locked || found.isLockedByVet || found.status === 'INJURED') {
                return {
                  isLocked: true,
                  reason: found.lockReason || found.statusText || 'Bác sĩ Thú y kích hoạt Lệnh Khóa Y Tế (Tạm cấm tập luyện & thi đấu)',
                  horseName: found.name || horseIdentifier
                };
              }
            }
          }
        }
      }
    }
  } catch {}

  // 2. Quét tìm trong Thể lực tàu ngựa của Huấn luyện viên
  try {
    const rawTrainer = localStorage.getItem('matruong_trainer_horses_managed');
    if (rawTrainer) {
      const list = JSON.parse(rawTrainer);
      if (Array.isArray(list)) {
        const found = list.find(h =>
          (h.id && String(h.id).toLowerCase() === key) ||
          (h.microchip && h.microchip.toLowerCase() === key) ||
          (h.name && h.name.toLowerCase() === key)
        );
        if (found && (found.isLockedByVet || found.locked || found.status === 'INJURED')) {
          return {
            isLocked: true,
            reason: found.vetNotice || found.lockReason || found.statusText || 'Khóa tập bởi Thú y do có dấu hiệu chấn thương',
            horseName: found.name || horseIdentifier
          };
        }
      }
    }
  } catch {}

  // 3. Quét trong danh mục chiến mã chung (racehorse_api_horses)
  try {
    const rawGlobal = localStorage.getItem('racehorse_api_horses');
    if (rawGlobal) {
      const list = JSON.parse(rawGlobal);
      if (Array.isArray(list)) {
        const found = list.find(h =>
          (h.id && String(h.id).toLowerCase() === key) ||
          (h.chipId && h.chipId.toLowerCase() === key) ||
          (h.microchip && h.microchip.toLowerCase() === key) ||
          (h.name && h.name.toLowerCase() === key)
        );
        if (found && (found.locked || found.status === 'INJURED' || found.status === 'LOCKED')) {
          return {
            isLocked: true,
            reason: found.desc || found.statusText || 'Tạm khóa y tế do Thú y chỉ định',
            horseName: found.name || horseIdentifier
          };
        }
      }
    }
  } catch {}

  return { isLocked: false, reason: '', horseName: '' };
}

/**
 * Chủ sở hữu đặt lịch tập luyện chung với Huấn luyện viên
 * Logic:
 *  - Nghiêm cấm đặt nếu chiến mã bị Thú y khóa y tế
 *  - Khóa khung giờ nghỉ trưa 11:45 - 13:00
 *  - Ưu tiên người đặt trước: nếu HLV đã có người đặt khung giờ đó vào ngày đó, chặn không cho đặt
 */
export function bookJointTrainingSession({
  horse,
  trainer,
  sessionDate,
  sessionTime,
  goal,
  ownerNotes,
  ownerUser
}) {
  // 1. Kiểm tra nghiêm ngặt Quyền phủ quyết của Bác sĩ Thú Y
  const lockStatus = checkHorseVetLockStatus(horse.microchip || horse.id || horse.name);
  if (lockStatus.isLocked) {
    return {
      success: false,
      isBlockedByVet: true,
      error: `Chiến mã "${horse.name}" đang bị Bác sĩ Thú y KHÓA Y TẾ / CẤM TẬP (${lockStatus.reason})! Phải đợi Bác sĩ Thú y kiểm tra và dỡ bỏ lệnh khóa thì mới được phép đặt lịch tập luyện chung.`
    };
  }

  // 2. Kiểm tra khung giờ nghỉ trưa (11:45 - 13:00)
  if (sessionTime.includes('11:45 - 13:00') || sessionTime.includes('Nghỉ trưa')) {
    return {
      success: false,
      error: 'Khung giờ 11:45 - 13:00 là thời gian nghỉ trưa và bảo dưỡng bãi tập của trường đua, không nhận lịch tập!'
    };
  }

  // 3. Kiểm tra logic trùng lịch: Ưu tiên người đặt trước
  const slotPrefix = extractSlotPrefix(sessionTime);
  const slotStatus = getSlotBookingStatus(slotPrefix, trainer.username, sessionDate);
  if (slotStatus.isBooked) {
    const bookedBy = slotStatus.bookedSession?.ownerName ? ` (đặt bởi ${slotStatus.bookedSession.ownerName})` : '';
    return {
      success: false,
      isConflict: true,
      error: `Khung giờ ${slotPrefix} ngày ${sessionDate} của HLV ${trainer.name} ĐÃ CÓ NGƯỜI ĐẶT TRƯỚC${bookedBy}! Theo quy định ưu tiên người đặt trước, khung giờ này đã bị bôi đen và không thể đặt nữa. Vui lòng chọn khung giờ trống khác.`
    };
  }

  const list = getJointTrainingSessions();
  const ownerKey = (ownerUser?.username || ownerUser?.email || String(ownerUser?.user_id || 'owner')).toLowerCase();
  const ownerName = ownerUser?.full_name || 'Chủ sở hữu chiến mã';

  const newSession = {
    id: Date.now(),
    horseId: horse.id,
    horseName: horse.name,
    microchip: horse.microchip || '',
    stall: horse.stable || 'Ô A1',
    avatar: horse.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80',
    ownerName: ownerName,
    ownerKey: ownerKey,
    trainerUsername: trainer.username,
    trainerName: trainer.name,
    trainerTitle: trainer.title || 'Huấn luyện viên',
    sessionDate: sessionDate || new Date().toISOString().split('T')[0],
    sessionTime: sessionTime || '06:00 - 07:00 (Sáng sớm - Bứt tốc cự ly)',
    goal: goal || 'Quan sát và phối hợp tập luyện chung cùng Huấn luyện viên',
    ownerNotes: ownerNotes || '',
    status: 'PENDING', // 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
    trainerFeedback: '',
    confirmedAt: null,
    createdAt: new Date().toLocaleString('vi-VN')
  };

  const nextList = [newSession, ...list];
  saveJointTrainingSessions(nextList);

  // Gửi lên Backend API
  bookJointTrainingSessionApi(newSession).catch(err => {
    console.warn('API joint booking sync notice (cached locally):', err);
  });

  // Gửi thông báo đến Huấn Luyện Viên
  try {
    addSystemNotification({
      type: 'JOINT_TRAINING_REQUESTED',
      title: 'YÊU CẦU ĐẶT LỊCH TẬP CHUNG TỪ CHỦ SỞ HỮU',
      content: `Chủ sở hữu ${ownerName} đã đặt lịch tập luyện chung cho chiến mã "${horse.name}" cùng Huấn Luyện Viên ${trainer.name} vào ngày ${newSession.sessionDate} (${newSession.sessionTime}).`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      horseName: horse.name,
      microchip: horse.microchip,
      ownerName: ownerName,
      trainerUsername: trainer.username,
      sessionId: newSession.id
    });
  } catch (err) {
    console.error('Error notifying joint training request:', err);
  }

  return { success: true, session: newSession };
}

/**
 * Huấn Luyện Viên xác nhận tiếp nhận buổi tập luyện chung
 */
export function confirmJointTrainingSession(sessionId, feedback = '', trainerUser = null) {
  const list = getJointTrainingSessions();
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index === -1) {
    return { success: false, error: 'Không tìm thấy thông tin lịch tập chung.' };
  }

  const target = list[index];

  // Kiểm tra nếu chiến mã bị khóa y tế trước khi HLV bấm duyệt
  const lockStatus = checkHorseVetLockStatus(target.microchip || target.horseId || target.horseName);
  if (lockStatus.isLocked) {
    return {
      success: false,
      isBlockedByVet: true,
      error: `Không thể xác nhận buổi tập! Chiến mã "${target.horseName}" vừa bị Bác sĩ Thú y kích hoạt Lệnh Khóa Y Tế (${lockStatus.reason}). Cần chờ Thú y mở khóa an toàn!`
    };
  }

  const trainerName = trainerUser?.full_name || target.trainerName;
  const nowStr = new Date().toLocaleString('vi-VN');
  const defaultFeedback = feedback.trim() || `Huấn Luyện Viên ${trainerName} đã xác nhận tiếp nhận buổi tập luyện chung đúng kế hoạch. Bố trí sân tập và chuẩn bị cảm biến thể lực sẵn sàng.`;

  const updatedSession = {
    ...target,
    status: 'CONFIRMED',
    trainerFeedback: defaultFeedback,
    confirmedAt: nowStr,
    confirmedBy: trainerUser?.username || target.trainerUsername
  };

  list[index] = updatedSession;
  saveJointTrainingSessions(list);

  // Cập nhật trạng thái duyệt lên Backend API
  confirmJointTrainingSessionApi(sessionId, defaultFeedback, trainerUser).catch(err => {
    console.warn('API confirm joint session notice (cached locally):', err);
  });

  // Gửi thông báo đến Chủ sở hữu chiến mã
  try {
    addSystemNotification({
      type: 'JOINT_TRAINING_CONFIRMED',
      title: 'HLV ĐÃ XÁC NHẬN LỊCH TẬP LUYỆN CHUNG',
      content: `Huấn Luyện Viên ${trainerName} đã chính thức xác nhận tiếp nhận buổi tập luyện chung với chiến mã "${target.horseName}" vào ngày ${target.sessionDate} (${target.sessionTime}). Lời nhắn: "${defaultFeedback}"`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      horseName: target.horseName,
      microchip: target.microchip,
      ownerKey: target.ownerKey,
      trainerName: trainerName,
      sessionId: target.id
    });

    // Nếu HLV tiếp nhận buổi tập tạm thời không phải HLV chính của chiến mã, gửi báo cáo về đúng HLV chính
    const asgns = getServiceAssignments() || [];
    const asgn = asgns.find(a => 
      (a.microchip && target.microchip && a.microchip.trim().toLowerCase() === target.microchip.trim().toLowerCase()) ||
      (a.horseName && target.horseName && a.horseName.trim().toLowerCase() === target.horseName.trim().toLowerCase())
    );
    const primaryTrainerUser = asgn?.trainerUsername;
    const primaryTrainerName = asgn?.trainerName;
    const actingTrainerUser = trainerUser?.username || target.trainerUsername;

    if (primaryTrainerUser && primaryTrainerUser.toLowerCase() !== (actingTrainerUser || '').toLowerCase()) {
      addSystemNotification({
        type: 'TEMP_TRAINING_REPORT',
        title: `BÁO CÁO TẬP LUYỆN TẠM THỜI: ${target.horseName}`,
        content: `HLV phối hợp ${trainerName} vừa xác nhận và hoàn tất buổi huấn luyện tạm thời cho chiến mã "${target.horseName}" (HLV chính phụ trách: ${primaryTrainerName || 'Bạn'}) vào ngày ${target.sessionDate} (${target.sessionTime}). Nội dung báo cáo / Phản hồi: "${defaultFeedback}".`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        recipientUsername: primaryTrainerUser,
        recipientRoles: ['TRAINER'],
        horseName: target.horseName,
        microchip: target.microchip,
        actingTrainerName: trainerName,
        primaryTrainerName: primaryTrainerName,
        sessionId: target.id
      });
    }
  } catch (err) {
    console.error('Error notifying joint training confirmed:', err);
  }

  return { success: true, session: updatedSession };
}

/**
 * Huấn Luyện Viên từ chối hoặc yêu cầu đổi lịch
 */
export function rejectJointTrainingSession(sessionId, reason = '', trainerUser = null) {
  const list = getJointTrainingSessions();
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index === -1) {
    return { success: false, error: 'Không tìm thấy lịch tập cần phản hồi.' };
  }

  const target = list[index];
  const trainerName = trainerUser?.full_name || target.trainerName;
  const nowStr = new Date().toLocaleString('vi-VN');

  const updatedSession = {
    ...target,
    status: 'REJECTED',
    trainerFeedback: reason.trim() || 'HLV bận lịch thi đấu hoặc trùng khung giờ bài tập nặng, vui lòng chọn ngày khác.',
    rejectedAt: nowStr
  };

  list[index] = updatedSession;
  saveJointTrainingSessions(list);

  // Cập nhật trạng thái từ chối lên Backend API
  rejectJointTrainingSessionApi(sessionId, reason, trainerUser).catch(err => {
    console.warn('API reject joint session notice (cached locally):', err);
  });

  try {
    addSystemNotification({
      type: 'JOINT_TRAINING_REJECTED',
      title: 'HLV PHẢN HỒI LỊCH TẬP LUYỆN CHUNG',
      content: `Huấn Luyện Viên ${trainerName} đã phản hồi về buổi tập ngày ${target.sessionDate} của chiến mã "${target.horseName}": "${updatedSession.trainerFeedback}"`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      horseName: target.horseName,
      ownerKey: target.ownerKey,
      trainerName: trainerName,
      sessionId: target.id
    });
  } catch (err) {}

  return { success: true, session: updatedSession };
}

/**
 * Chủ sở hữu hủy buổi hẹn
 */
export function cancelJointTrainingSession(sessionId) {
  const list = getJointTrainingSessions();
  const nextList = list.filter(s => String(s.id) !== String(sessionId));
  saveJointTrainingSessions(nextList);

  // Hủy trên Backend API
  cancelJointTrainingSessionApi(sessionId).catch(err => {
    console.warn('API cancel joint session notice (cached locally):', err);
  });

  return nextList;
}

/**
 * Xóa tất cả các buổi hẹn tập luyện chung trên toàn hệ thống (Làm trống bãi tập)
 */
export function clearAllJointTrainingSessions() {
  saveJointTrainingSessions([]);
  return { success: true };
}

/**
 * Xóa tất cả các buổi hẹn tập luyện của một chủ sở hữu cụ thể
 */
export function clearAllMyJointTrainingSessions(ownerKey = null, ownerName = null) {
  const list = getJointTrainingSessions();
  const filtered = list.filter(s => {
    if (ownerKey && String(s.ownerKey) === String(ownerKey)) return false;
    if (ownerName && s.ownerName === ownerName) return false;
    return true;
  });
  saveJointTrainingSessions(filtered);
  return { success: true, count: list.length - filtered.length };
}

/**
 * Tự động kiểm tra và thực hiện Reset lịch trống lúc 18:00 tối mỗi ngày
 * Logic nghiệp vụ:
 *  - Giờ hoạt động huấn luyện là từ 06:00 đến 18:00 (18h tối).
 *  - Tới tầm 18h tối, chu kỳ tập luyện trong ngày hoàn tất.
 *  - Hệ thống tự động hoàn tất các lịch tập trong ngày (hoặc các ngày trước đó),
 *    gỡ bỏ bôi đen toàn bộ các khung giờ và đưa bảng lịch về TRẠNG THÁI TRỐNG
 *    để Chủ sở hữu ngựa có thể tiếp tục đặt lịch mới cho chu kỳ tiếp theo.
 */
export function checkAndAutoResetScheduleAt1800() {
  try {
    const allSessions = getJointTrainingSessions();
    const now = new Date();
    const todayStr = normalizeDate(now.toISOString().split('T')[0]);
    const currentHour = now.getHours();

    let hasChanges = false;
    const updatedList = allSessions.map(session => {
      // Chỉ xét các lịch đang chiếm giữ slot (PENDING hoặc CONFIRMED)
      if (session.status !== 'PENDING' && session.status !== 'CONFIRMED') {
        return session;
      }

      const sessionDateNorm = normalizeDate(session.sessionDate);

      // Trường hợp 1: Lịch của những ngày trong quá khứ (< today) -> Tự động hoàn tất
      const isPastDay = sessionDateNorm < todayStr;

      // Trường hợp 2: Lịch của ngày hôm nay và đã qua 18h tối (currentHour >= 18) -> Tự động reset
      const isTodayPast18 = (sessionDateNorm === todayStr && currentHour >= 18);

      if (isPastDay || isTodayPast18) {
        hasChanges = true;
        return {
          ...session,
          status: 'COMPLETED',
          completedAt: new Date().toLocaleString('vi-VN'),
          resetAt1800: true,
          trainerFeedback: session.trainerFeedback || 'Đã hoàn tất ngày tập (sau 18:00). Hệ thống đã reset lịch trống cho Chủ sở hữu đặt lịch mới.'
        };
      }

      return session;
    });

    if (hasChanges) {
      saveJointTrainingSessions(updatedList);
      try {
        addSystemNotification({
          type: 'JOINT_TRAINING_18H_RESET',
          title: 'HỆ THỐNG ĐÃ RESET LỊCH TẬP LÚC 18:00',
          content: 'Đã tới mốc 18:00 tối: Bảng lịch tập luyện đã được tự động làm trống, bỏ bôi đen và sẵn sàng đón nhận lượt đặt lịch mới!',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN')
        });
      } catch {}
      return { resetOccurred: true, updatedList };
    }
  } catch (err) {
    console.error('Error in checkAndAutoResetScheduleAt1800:', err);
  }
  return { resetOccurred: false };
}

/**
 * Reset chủ động lịch trống (Mô phỏng hoặc thực thi mốc 18:00)
 * Cho phép Chủ sở hữu hoặc HLV kích hoạt reset ngay lập tức các lịch đang bôi đen
 * của ngày được chọn để mở lại toàn bộ slot trống.
 */
export function manualResetSchedule1800(targetDate = null, trainerUsername = null) {
  const allSessions = getJointTrainingSessions();
  const targetDateNorm = targetDate ? normalizeDate(targetDate) : null;

  let resetCount = 0;
  const updatedList = allSessions.map(session => {
    if (session.status !== 'PENDING' && session.status !== 'CONFIRMED') {
      return session;
    }

    const sessionDateNorm = normalizeDate(session.sessionDate);

    // Nếu chỉ định ngày, kiểm tra trùng ngày
    if (targetDateNorm && sessionDateNorm !== targetDateNorm) {
      return session;
    }

    // Nếu chỉ định HLV, kiểm tra trùng HLV
    if (trainerUsername && session.trainerUsername !== trainerUsername) {
      return session;
    }

    resetCount++;
    return {
      ...session,
      status: 'COMPLETED',
      completedAt: new Date().toLocaleString('vi-VN'),
      resetAt1800: true,
      trainerFeedback: session.trainerFeedback || 'Buổi tập đã hoàn tất chu kỳ ngày. Khung giờ được giải phóng trống lúc 18:00.'
    };
  });

  saveJointTrainingSessions(updatedList);

  try {
    addSystemNotification({
      type: 'JOINT_TRAINING_18H_RESET',
      title: 'ĐÃ RESET LỊCH TẬP (MỐC 18:00)',
      content: `Đã reset giải phóng ${resetCount} khung giờ bị bôi đen${targetDate ? ` ngày ${targetDate}` : ''}. Tất cả khung giờ đã được mở trống để Chủ sở hữu đặt lịch mới.`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN')
    });
  } catch {}

  return { success: true, resetCount };
}

/**
 * =========================================================================
 * LOGIC BUỔI TẬP TẠM THỜI / CHUYỂN GIAO CHO HUẤN LUYỆN VIÊN KHÁC KHI HLV CHÍNH BẬN
 * =========================================================================
 */

/**
 * Lấy danh sách các HLV có thể hỗ trợ tập thay vào ngày & giờ cụ thể (Kiểm tra trống lịch)
 */
export function getAvailableSubstituteTrainers(sessionDate, sessionTime, currentTrainerUsername = '') {
  const normDate = normalizeDate(sessionDate);
  const slotPrefix = extractSlotPrefix(sessionTime);
  const cleanCurrent = (currentTrainerUsername || '').trim().toLowerCase();

  return (FIXED_TRAINERS_LIST || [])
    .filter(t => t.username.toLowerCase() !== cleanCurrent)
    .map(trainer => {
      const bookedList = getBookedSlotsForTrainer(trainer.username, normDate);
      const isBooked = bookedList.some(s => extractSlotPrefix(s.sessionTime) === slotPrefix);
      return {
        ...trainer,
        isAvailable: !isBooked,
        reason: isBooked ? `Đã có buổi tập vào khung ${slotPrefix}` : 'Đang trống lịch'
      };
    });
}

/**
 * HLV chính bận việc -> Chuyển giao / Nhờ HLV khác hỗ trợ buổi tập
 * Bắt buộc đưa ra bài tập / giáo án chỉ định để Chủ sở hữu và HLV thay thế tập theo
 */
export function delegateJointTrainingSession({
  sessionId,
  substituteTrainerUsername,
  assignedWorkout,
  transferReason = '',
  currentTrainerUser = null
}) {
  const list = getJointTrainingSessions();
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index === -1) {
    return { success: false, error: 'Không tìm thấy buổi tập cần chuyển giao.' };
  }

  const target = list[index];
  if (!assignedWorkout || !assignedWorkout.trim()) {
    return { success: false, error: 'Vui lòng đưa ra nội dung bài tập chỉ định để Chủ sở hữu và HLV thay thế tập theo.' };
  }

  const subTrainer = (FIXED_TRAINERS_LIST || []).find(t => t.username === substituteTrainerUsername);
  if (!subTrainer) {
    return { success: false, error: 'Không tìm thấy Huấn luyện viên thay thế được chọn.' };
  }

  // Kiểm tra HLV thay thế có trống lịch không
  const availableList = getAvailableSubstituteTrainers(target.sessionDate, target.sessionTime, target.trainerUsername);
  const targetAvail = availableList.find(t => t.username === substituteTrainerUsername);
  if (targetAvail && !targetAvail.isAvailable) {
    return { success: false, error: `HLV ${subTrainer.name} đã bận lịch trong khung giờ này (${target.sessionTime}). Vui lòng chọn HLV khác đang trống lịch.` };
  }

  const currentTrainerName = currentTrainerUser?.full_name || target.trainerName;
  const currentTrainerUserStr = currentTrainerUser?.username || target.trainerUsername;
  const nowStr = new Date().toLocaleString('vi-VN');
  const cleanWorkout = assignedWorkout.trim();
  const cleanReason = transferReason.trim() || 'HLV chính bận lịch công tác đột xuất, nhờ đồng nghiệp hỗ trợ.';

  const updatedSession = {
    ...target,
    transferStatus: 'PENDING_TRANSFER',
    originalTrainerUsername: currentTrainerUserStr,
    originalTrainerName: currentTrainerName,
    delegatedToTrainerUsername: subTrainer.username,
    delegatedToTrainerName: subTrainer.name,
    assignedWorkout: cleanWorkout,
    transferReason: cleanReason,
    transferRequestedAt: nowStr
  };

  list[index] = updatedSession;
  saveJointTrainingSessions(list);

  // Gửi thông báo trực tiếp đến HLV được nhờ hỗ trợ
  try {
    addSystemNotification({
      type: 'SUBSTITUTE_REQUEST',
      title: `YÊU CẦU HỖ TRỢ BUỔI TẬP TẠM THỜI: ${target.horseName}`,
      content: `HLV chính ${currentTrainerName} bận việc và nhờ bạn hỗ trợ buổi tập cho chiến mã "${target.horseName}" (Chủ sở hữu: ${target.ownerName}) vào ngày ${target.sessionDate} (${target.sessionTime}).\nLý do: "${cleanReason}".\nBài tập do HLV chính chỉ định: "${cleanWorkout}".\nVui lòng vào mục Lịch hẹn để xác nhận hỗ trợ!`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      recipientUsername: subTrainer.username,
      recipientRoles: ['TRAINER'],
      horseName: target.horseName,
      microchip: target.microchip,
      ownerName: target.ownerName,
      ownerKey: target.ownerKey,
      sessionId: target.id,
      assignedWorkout: cleanWorkout,
      originalTrainerName: currentTrainerName,
      delegatedToTrainerName: subTrainer.name
    });
  } catch (err) {
    console.error('Error sending substitute request notification:', err);
  }

  return { success: true, session: updatedSession, substituteTrainer: subTrainer };
}

/**
 * HLV được nhờ tự xác nhận tiếp nhận buổi tập tạm thời
 * Hệ thống sẽ tự động thông báo đến Chủ sở hữu ngựa để đổi sang HLV thay thế và tập theo bài tập do HLV chính giao
 */
export function confirmSubstituteJointSession(sessionId, substituteTrainerUser, responseNote = '') {
  const list = getJointTrainingSessions();
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index === -1) {
    return { success: false, error: 'Không tìm thấy buổi tập cần xác nhận.' };
  }

  const target = list[index];
  const subTrainerName = substituteTrainerUser?.full_name || substituteTrainerUser?.name || target.delegatedToTrainerName || 'HLV Hỗ Trợ';
  const subTrainerUser = substituteTrainerUser?.username || target.delegatedToTrainerUsername;
  const nowStr = new Date().toLocaleString('vi-VN');
  const defaultNote = responseNote.trim() || `HLV ${subTrainerName} đã sẵn sàng tiếp nhận buổi tập và sẽ hướng dẫn theo đúng bài tập của HLV chính.`;

  const updatedSession = {
    ...target,
    status: 'CONFIRMED',
    transferStatus: 'TRANSFERRED',
    isSubstitute: true,
    substituteTrainerUsername: subTrainerUser,
    substituteTrainerName: subTrainerName,
    substituteConfirmedAt: nowStr,
    substituteNote: defaultNote,
    // Cập nhật người phụ trách trực tiếp để khóa lịch trên sân
    actingTrainerUsername: subTrainerUser,
    actingTrainerName: subTrainerName
  };

  list[index] = updatedSession;
  saveJointTrainingSessions(list);

  try {
    // 1. Thông báo đến CHỦ SỞ HỮU NGỰA: Đổi sang HLV thay thế và đưa ra bài tập do HLV chính giao để tập theo
    addSystemNotification({
      type: 'TRAINER_SUBSTITUTED',
      title: `THÔNG BÁO ĐỔI HLV TẠM THỜI: ${target.horseName}`,
      content: `Do HLV chính ${target.originalTrainerName || target.trainerName} bận việc, buổi tập ngày ${target.sessionDate} (${target.sessionTime}) của chiến mã "${target.horseName}" sẽ do HLV ${subTrainerName} hỗ trợ thay thế tạm thời. HLV chính đã bàn giao bài tập: "${target.assignedWorkout || 'Bài tập rèn thể lực chuyên môn'}". Bạn và chiến mã sẽ tập theo bài tập này dưới sự hướng dẫn của HLV ${subTrainerName}.`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      recipientRoles: ['OWNER'],
      recipientUsername: target.ownerUsername || target.ownerKey,
      ownerKey: target.ownerKey,
      horseName: target.horseName,
      microchip: target.microchip,
      sessionId: target.id,
      originalTrainerName: target.originalTrainerName || target.trainerName,
      substituteTrainerName: subTrainerName,
      assignedWorkout: target.assignedWorkout
    });

    // 2. Thông báo ngược lại cho HLV CHÍNH để an tâm
    if (target.originalTrainerUsername) {
      addSystemNotification({
        type: 'SUBSTITUTE_ACCEPTED',
        title: `HLV ${subTrainerName} ĐÃ ĐỒNG Ý HỖ TRỢ TẬP THAY: ${target.horseName}`,
        content: `HLV ${subTrainerName} đã xác nhận tiếp nhận buổi tập ngày ${target.sessionDate} (${target.sessionTime}) cho chiến mã "${target.horseName}". Chủ sở hữu đã nhận thông báo để tập theo đúng bài tập bạn đã bàn giao: "${target.assignedWorkout}".`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        recipientRoles: ['TRAINER'],
        recipientUsername: target.originalTrainerUsername,
        horseName: target.horseName,
        microchip: target.microchip,
        sessionId: target.id,
        substituteTrainerName: subTrainerName,
        assignedWorkout: target.assignedWorkout
      });
    }
  } catch (err) {
    console.error('Error sending substitute confirmed notification:', err);
  }

  return { success: true, session: updatedSession };
}

/**
 * HLV được nhờ từ chối yêu cầu hỗ trợ tập thay
 */
export function rejectSubstituteJointSession(sessionId, substituteTrainerUser, reason = '') {
  const list = getJointTrainingSessions();
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index === -1) {
    return { success: false, error: 'Không tìm thấy buổi tập.' };
  }

  const target = list[index];
  const subTrainerName = substituteTrainerUser?.full_name || substituteTrainerUser?.name || 'HLV';
  const cleanReason = reason.trim() || 'HLV bận lịch chuyên môn khác không thể hỗ trợ.';

  const updatedSession = {
    ...target,
    transferStatus: 'TRANSFER_REJECTED',
    transferRejectReason: cleanReason
  };

  list[index] = updatedSession;
  saveJointTrainingSessions(list);

  try {
    if (target.originalTrainerUsername) {
      addSystemNotification({
        type: 'SUBSTITUTE_REJECTED',
        title: `HLV ${subTrainerName} TỪ CHỐI TẬP THAY: ${target.horseName}`,
        content: `HLV ${subTrainerName} không thể tiếp nhận buổi tập ngày ${target.sessionDate} (${target.sessionTime}) cho chiến mã "${target.horseName}". Lý do: "${cleanReason}". Vui lòng chọn HLV khác hoặc sắp xếp lại lịch.`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        recipientRoles: ['TRAINER'],
        recipientUsername: target.originalTrainerUsername,
        sessionId: target.id
      });
    }
  } catch (err) {
    console.error('Error sending substitute rejected notification:', err);
  }

  return { success: true, session: updatedSession };
}
