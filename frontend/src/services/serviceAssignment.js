// Quản lý việc Chủ sở hữu chỉ định Đội ngũ phục vụ (3 HLV, 3 BS Thú y, 3 Groom)
// và Xác nhận phục vụ từ phía từng nhân sự chuyên trách

const STORAGE_KEY = 'matruong_service_assignments';
const EVENT_NAME = 'matruong_service_assignment_updated';

// 3 HLV chính
export const FIXED_TRAINERS_LIST = [
  { username: 'trainer_truong', name: 'Trần Văn Hùng', title: 'HLV Trưởng - Cự ly Dài & Tổng thể' },
  { username: 'trainer_nghia', name: 'Lê Trọng Nghĩa', title: 'HLV Chuyên Cự Ly Dài & Sân Cỏ' },
  { username: 'trainer_anh', name: 'Phạm Quốc Anh', title: 'HLV Nước Rút & Kỹ Thuật Bứt Tốc' }
];

// 3 Bác sĩ thú y chính
export const FIXED_VETS_LIST = [
  { username: 'vet_an', name: 'BS. Nguyễn An', title: 'Trưởng khoa Thú y & Chẩn đoán hình ảnh' },
  { username: 'vet_hoang', name: 'BS. Trần Minh Hoàng', title: 'Chuyên gia Cơ Xương Khớp & Chấn Thương' },
  { username: 'vet_linh', name: 'BS. Lê Mai Linh', title: 'Chuyên khoa Dinh Dưỡng & Kiểm Dịch' }
];

// 3 Người chăm sóc chính
export const FIXED_GROOMS_LIST = [
  { username: 'groom_nam', name: 'Lê Hoàng Nam', title: 'Trưởng nhóm Chăm sóc Block A' },
  { username: 'groom_dung', name: 'Vũ Tiến Dũng', title: 'Chăm sóc & Vệ sinh móng Block B' },
  { username: 'groom_thao', name: 'Nguyễn Thu Thảo', title: 'Chăm sóc phục hồi & Dinh dưỡng Block C' }
];

const INITIAL_ASSIGNMENTS = [
  {
    id: 1,
    horseName: 'Bạch Long',
    microchip: 'MC-VN-2024-003',
    stable: 'Ô A2',
    ownerName: 'Phạm Tiến Thành',
    ownerKey: 'owner_thanh',
    trainerUsername: 'trainer_truong',
    trainerName: 'Trần Văn Hùng',
    trainerStatus: 'CONFIRMED',
    trainerConfirmedAt: '10/10/2026',
    vetUsername: 'vet_an',
    vetName: 'BS. Nguyễn An',
    vetStatus: 'CONFIRMED',
    vetConfirmedAt: '10/10/2026',
    groomUsername: 'groom_nam',
    groomName: 'Lê Hoàng Nam',
    groomStatus: 'CONFIRMED',
    groomConfirmedAt: '10/10/2026'
  },
  {
    id: 2,
    horseName: 'Lôi Chấn',
    microchip: 'MC-VN-2022-088',
    stable: 'Ô A4',
    ownerName: 'Phạm Tiến Thành',
    ownerKey: 'owner_thanh',
    trainerUsername: 'trainer_nghia',
    trainerName: 'Lê Trọng Nghĩa',
    trainerStatus: 'PENDING',
    trainerConfirmedAt: null,
    vetUsername: 'vet_hoang',
    vetName: 'BS. Trần Minh Hoàng',
    vetStatus: 'CONFIRMED',
    vetConfirmedAt: '11/10/2026',
    groomUsername: 'groom_dung',
    groomName: 'Vũ Tiến Dũng',
    groomStatus: 'PENDING',
    groomConfirmedAt: null
  },
  {
    id: 3,
    horseName: 'Phi Yến',
    microchip: 'MC-VN-2023-009',
    stable: 'Ô A5',
    ownerName: 'Phạm Tiến Thành',
    ownerKey: 'owner_thanh',
    trainerUsername: 'trainer_anh',
    trainerName: 'Phạm Quốc Anh',
    trainerStatus: 'PENDING',
    trainerConfirmedAt: null,
    vetUsername: 'vet_linh',
    vetName: 'BS. Lê Mai Linh',
    vetStatus: 'PENDING',
    vetConfirmedAt: null,
    groomUsername: 'groom_thao',
    groomName: 'Nguyễn Thu Thảo',
    groomStatus: 'CONFIRMED',
    groomConfirmedAt: '12/10/2026'
  }
];

export function getServiceAssignments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
  return INITIAL_ASSIGNMENTS;
}

export function saveServiceAssignments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_NAME));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving service assignments:', err);
  }
}

// Cập nhật hoặc thêm mới phân công từ phía Chủ sở hữu
export function assignOrUpdateServiceTeam(horse, staffSelection, ownerUser) {
  const list = getServiceAssignments();
  const horseKey = (horse.microchip || horse.name || String(horse.id)).toLowerCase();

  const foundIndex = list.findIndex(
    item => (item.microchip && item.microchip.toLowerCase() === horseKey) ||
            item.horseName.toLowerCase() === (horse.name || '').toLowerCase() ||
            String(item.id) === String(horse.id)
  );

  const trainerObj = FIXED_TRAINERS_LIST.find(t => t.username === staffSelection.trainerUsername || t.name === staffSelection.trainerName) || FIXED_TRAINERS_LIST[0];
  const vetObj = FIXED_VETS_LIST.find(v => v.username === staffSelection.vetUsername || v.name === staffSelection.vetName) || FIXED_VETS_LIST[0];
  const groomObj = FIXED_GROOMS_LIST.find(g => g.username === staffSelection.groomUsername || g.name === staffSelection.groomName) || FIXED_GROOMS_LIST[0];

  const nowStr = new Date().toLocaleDateString('vi-VN');

  if (foundIndex >= 0) {
    const old = list[foundIndex];
    const trainerChanged = old.trainerUsername !== trainerObj.username;
    const vetChanged = old.vetUsername !== vetObj.username;
    const groomChanged = old.groomUsername !== groomObj.username;

    list[foundIndex] = {
      ...old,
      horseName: horse.name || old.horseName,
      microchip: horse.microchip || old.microchip,
      stable: horse.stable || old.stable,
      trainerUsername: trainerObj.username,
      trainerName: trainerObj.name,
      trainerStatus: trainerChanged ? 'PENDING' : old.trainerStatus,
      trainerConfirmedAt: trainerChanged ? null : old.trainerConfirmedAt,
      vetUsername: vetObj.username,
      vetName: vetObj.name,
      vetStatus: vetChanged ? 'PENDING' : old.vetStatus,
      vetConfirmedAt: vetChanged ? null : old.vetConfirmedAt,
      groomUsername: groomObj.username,
      groomName: groomObj.name,
      groomStatus: groomChanged ? 'PENDING' : old.groomStatus,
      groomConfirmedAt: groomChanged ? null : old.groomConfirmedAt,
      lastUpdatedAt: nowStr
    };
  } else {
    list.push({
      id: horse.id || Date.now(),
      horseName: horse.name,
      microchip: horse.microchip || 'MC-VN-2026-001',
      stable: horse.stable || 'Ô A2',
      ownerName: ownerUser?.full_name || 'Chủ sở hữu',
      ownerKey: ownerUser?.username || 'owner_thanh',
      trainerUsername: trainerObj.username,
      trainerName: trainerObj.name,
      trainerStatus: 'PENDING',
      trainerConfirmedAt: null,
      vetUsername: vetObj.username,
      vetName: vetObj.name,
      vetStatus: 'PENDING',
      vetConfirmedAt: null,
      groomUsername: groomObj.username,
      groomName: groomObj.name,
      groomStatus: 'PENDING',
      groomConfirmedAt: null,
      assignedAt: nowStr
    });
  }

  saveServiceAssignments(list);
  return list;
}

// Nhân sự chuyên trách (HLV / Thú Y / Groom) xác nhận phục vụ
export function confirmServiceAssignment(horseIdentifier, roleType, staffUsername) {
  const list = getServiceAssignments();
  const key = String(horseIdentifier).toLowerCase();
  const nowStr = new Date().toLocaleDateString('vi-VN');

  let updated = false;
  const nextList = list.map(item => {
    const match = (item.microchip && item.microchip.toLowerCase() === key) ||
                  (item.horseName && item.horseName.toLowerCase() === key) ||
                  String(item.id) === key;
    if (!match) return item;

    if (roleType === 'TRAINER') {
      updated = true;
      return { ...item, trainerStatus: 'CONFIRMED', trainerConfirmedAt: nowStr, trainerConfirmedBy: staffUsername };
    }
    if (roleType === 'VET') {
      updated = true;
      return { ...item, vetStatus: 'CONFIRMED', vetConfirmedAt: nowStr, vetConfirmedBy: staffUsername };
    }
    if (roleType === 'GROOM') {
      updated = true;
      return { ...item, groomStatus: 'CONFIRMED', groomConfirmedAt: nowStr, groomConfirmedBy: staffUsername };
    }
    return item;
  });

  if (updated) {
    saveServiceAssignments(nextList);
  }
  return nextList;
}
