// Quản lý việc Chủ sở hữu chỉ định Đội ngũ phục vụ (3 HLV, 3 BS Thú y, 3 Groom)
// và Xác nhận phục vụ từ phía từng nhân sự chuyên trách
import { saveServiceAssignmentApi, confirmServiceAssignmentApi as confirmApi } from './api';
import { notifyTrainingRequested, notifyServiceConfirmed } from './notificationService';

const STORAGE_KEY = 'matruong_service_assignments';
const EVENT_NAME = 'matruong_service_assignment_updated';

// Đồng bộ trạng thái xác nhận vai trò vào danh sách ngựa của chủ sở hữu trong localStorage
export function syncHorseConfirmationToLocalStorage(horseNameOrMicrochip, roleType, status) {
  try {
    const key = String(horseNameOrMicrochip || '').trim().toLowerCase();
    if (!key) return;
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('matruong_owner_horses_')) {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            let changed = false;
            const updatedList = list.map(h => {
              const match = (h.microchip && h.microchip.trim().toLowerCase() === key) ||
                            (h.name && h.name.trim().toLowerCase() === key) ||
                            (h.id && String(h.id) === key);
              if (!match) return h;
              changed = true;
              const next = { ...h };
              if (roleType === 'TRAINER') {
                next.trainerStatus = status;
                next.trainerConfirmed = (status === 'CONFIRMED');
              } else if (roleType === 'VET') {
                next.vetStatus = status;
                next.vetConfirmed = (status === 'CONFIRMED');
              } else if (roleType === 'GROOM') {
                next.groomStatus = status;
                next.groomConfirmed = (status === 'CONFIRMED');
              }
              return next;
            });
            if (changed) {
              localStorage.setItem(storageKey, JSON.stringify(updatedList));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing horse confirmation to owner storage:', err);
  }
}

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

const INITIAL_ASSIGNMENTS = [];
const EXCLUDED_MOCK_NAMES = ['hắc phong', 'xích thố', 'phi yến', 'lôi chấn', 'bạch long'];

export function getServiceAssignments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => 
          item.ownerKey !== 'owner_thanh' && 
          item.ownerName !== 'Phạm Tiến Thành' && 
          item.ownerName !== 'Trần Đình Thanh' &&
          !EXCLUDED_MOCK_NAMES.some(ex => (item.horseName || '').toLowerCase().includes(ex))
        );
      }
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
  return INITIAL_ASSIGNMENTS;
}

export function saveServiceAssignments(list) {
  try {
    const cleanList = Array.isArray(list)
      ? list.filter(item => !EXCLUDED_MOCK_NAMES.some(ex => (item.horseName || '').toLowerCase().includes(ex)))
      : list;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
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
      breed: horse.breed || old.breed || 'Thoroughbred',
      gender: horse.gender || old.gender || 'Ngựa đực (Stallion)',
      age: horse.age || old.age || '3 tuổi',
      avatar: horse.avatar || old.avatar,
      pedigree: horse.pedigree || old.pedigree,
      ownershipShare: horse.ownershipShare || old.ownershipShare || 100,
      ownershipType: horse.ownershipType || old.ownershipType || 'Toàn phần',
      ownerName: ownerUser?.full_name || old.ownerName || 'Chủ sở hữu',
      ownerKey: ownerUser?.username || old.ownerKey || 'owner',
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
      breed: horse.breed || 'Thoroughbred',
      gender: horse.gender || 'Ngựa đực (Stallion)',
      age: horse.age || '3 tuổi',
      avatar: horse.avatar,
      pedigree: horse.pedigree,
      ownershipShare: horse.ownershipShare || 100,
      ownershipType: horse.ownershipType || 'Toàn phần',
      ownerName: ownerUser?.full_name || 'Chủ sở hữu',
      ownerKey: ownerUser?.username || 'owner',
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
  const targetItem = foundIndex >= 0 ? list[foundIndex] : list[list.length - 1];
  if (targetItem) {
    saveServiceAssignmentApi(targetItem).catch(() => {});
    // Gửi thông báo đến Huấn luyện viên khi Chủ sở hữu chỉ định/yêu cầu huấn luyện
    if (targetItem.trainerStatus === 'PENDING') {
      try {
        notifyTrainingRequested(horse, ownerUser, targetItem.trainerName);
      } catch (err) {
        console.error('Error notifying training requested:', err);
      }
    }
  }
  return list;
}

// Nhân sự chuyên trách (HLV / Thú Y / Groom) xác nhận phục vụ
export function confirmServiceAssignment(horseIdentifier, roleType, staffUsername) {
  confirmApi(horseIdentifier, roleType, staffUsername).catch(() => {});
  const list = getServiceAssignments();
  const key = String(horseIdentifier || '').trim().toLowerCase();
  const nowStr = new Date().toLocaleDateString('vi-VN');

  let updated = false;
  let confirmedItem = null;
  const nextList = list.map(item => {
    const match = (item.microchip && item.microchip.trim().toLowerCase() === key) ||
                  (item.horseName && item.horseName.trim().toLowerCase() === key) ||
                  (item.id && String(item.id) === key);
    if (!match) return item;

    if (roleType === 'TRAINER') {
      updated = true;
      confirmedItem = { ...item, trainerStatus: 'CONFIRMED', trainerConfirmedAt: nowStr, trainerConfirmedBy: staffUsername };
      return confirmedItem;
    }
    if (roleType === 'VET') {
      updated = true;
      confirmedItem = { ...item, vetStatus: 'CONFIRMED', vetConfirmedAt: nowStr, vetConfirmedBy: staffUsername };
      return confirmedItem;
    }
    if (roleType === 'GROOM') {
      updated = true;
      confirmedItem = { ...item, groomStatus: 'CONFIRMED', groomConfirmedAt: nowStr, groomConfirmedBy: staffUsername };
      return confirmedItem;
    }
    return item;
  });

  if (updated) {
    saveServiceAssignments(nextList);
    syncHorseConfirmationToLocalStorage(horseIdentifier, roleType, 'CONFIRMED');
    if (confirmedItem) {
      try {
        notifyServiceConfirmed(confirmedItem, { username: staffUsername }, roleType);
      } catch (err) {
        console.error('Error notifying service confirmed:', err);
      }
    }
  }
  return nextList;
}

// Chuyển đổi trạng thái phân công (CONFIRMED hoặc PENDING)
export function setServiceAssignmentStatus(horseIdentifier, roleType, newStatus = 'CONFIRMED', staffUsername = '') {
  const list = getServiceAssignments();
  const key = String(horseIdentifier || '').trim().toLowerCase();
  const nowStr = new Date().toLocaleDateString('vi-VN');

  let updated = false;
  const nextList = list.map(item => {
    const match = (item.microchip && item.microchip.trim().toLowerCase() === key) ||
                  (item.horseName && item.horseName.trim().toLowerCase() === key) ||
                  (item.id && String(item.id) === key);
    if (!match) return item;

    updated = true;
    if (roleType === 'TRAINER') {
      return {
        ...item,
        trainerStatus: newStatus,
        trainerConfirmedAt: newStatus === 'CONFIRMED' ? nowStr : null,
        trainerConfirmedBy: newStatus === 'CONFIRMED' ? (staffUsername || item.trainerUsername) : null
      };
    }
    if (roleType === 'VET') {
      return {
        ...item,
        vetStatus: newStatus,
        vetConfirmedAt: newStatus === 'CONFIRMED' ? nowStr : null,
        vetConfirmedBy: newStatus === 'CONFIRMED' ? (staffUsername || item.vetUsername) : null
      };
    }
    if (roleType === 'GROOM') {
      return {
        ...item,
        groomStatus: newStatus,
        groomConfirmedAt: newStatus === 'CONFIRMED' ? nowStr : null,
        groomConfirmedBy: newStatus === 'CONFIRMED' ? (staffUsername || item.groomUsername) : null
      };
    }
    return item;
  });

  if (updated) {
    saveServiceAssignments(nextList);
    syncHorseConfirmationToLocalStorage(horseIdentifier, roleType, newStatus);
  }
  return nextList;
}

// Xóa phân công dịch vụ khi chiến mã bị xóa
export function removeServiceAssignmentByHorse(horseIdentifier) {
  if (!horseIdentifier) return;
  const list = getServiceAssignments();
  const key = String(horseIdentifier).trim().toLowerCase();
  const nextList = list.filter(item => {
    const match = (item.microchip && item.microchip.toLowerCase() === key) ||
                  (item.horseName && item.horseName.toLowerCase() === key) ||
                  String(item.id) === key;
    return !match;
  });
  if (nextList.length !== list.length) {
    saveServiceAssignments(nextList);
  }
  return nextList;
}

// Cập nhật thông tin gia phả chiến mã từ Chủ sở hữu vào danh sách phân công dịch vụ
export function updateServiceAssignmentPedigree(horseIdentifier, pedigreeData) {
  if (!horseIdentifier || !pedigreeData) return;
  const list = getServiceAssignments();
  const key = String(horseIdentifier).trim().toLowerCase();

  let updated = false;
  const nextList = list.map(item => {
    const match = (item.microchip && item.microchip.trim().toLowerCase() === key) ||
                  (item.horseName && item.horseName.trim().toLowerCase() === key) ||
                  (item.id && String(item.id) === key);
    if (!match) return item;

    updated = true;
    return {
      ...item,
      pedigree: {
        ...(item.pedigree || {}),
        ...pedigreeData
      }
    };
  });

  if (updated) {
    saveServiceAssignments(nextList);
  }

  try {
    window.dispatchEvent(new CustomEvent('matruong_pedigree_updated', {
      detail: { horseIdentifier, pedigree: pedigreeData }
    }));
  } catch {}

  return nextList;
}

// Tìm kiếm hồ sơ đầy đủ của chiến mã và chủ sở hữu trên toàn bộ hệ thống
export function lookupFullHorseInfo(horseIdentifier) {
  if (!horseIdentifier) return null;
  const key = String(horseIdentifier).trim().toLowerCase();

  // 1. Quét tìm trong dữ liệu Chủ sở hữu lưu ở LocalStorage
  let foundOwnerHorse = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('matruong_owner_horses_')) {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const match = list.find(h =>
              (h.id && String(h.id).trim().toLowerCase() === key) ||
              (h.microchip && h.microchip.trim().toLowerCase() === key) ||
              (h.name && h.name.trim().toLowerCase() === key)
            );
            if (match) {
              foundOwnerHorse = match;
              break;
            }
          }
        }
      }
    }
  } catch {}

  // 2. Quét tìm trong danh sách phân công chuyên môn
  const assignments = getServiceAssignments();
  const matchAsgn = assignments.find(item =>
    (item.microchip && item.microchip.trim().toLowerCase() === key) ||
    (item.horseName && item.horseName.trim().toLowerCase() === key) ||
    (item.id && String(item.id).trim() === key)
  );

const DEFAULT_HORSE_PEDIGREES = {
  'hắc phong': {
    sire: 'Deep Impact (JPN)',
    sireOfSire: 'Sunday Silence (USA)',
    damOfSire: 'Wind in Her Hair (IRE)',
    sireAchievements: 'Huyền thoại 7 danh hiệu G1, Vô địch Japan Cup',
    dam: 'Northern Dancer (USA)',
    sireOfDam: 'Nearctic (CAN)',
    damOfDam: 'Natalma (USA)',
    damAchievements: 'Dòng máu cái vĩ đại nhất lịch sử đua ngựa thế giới',
    foaled: '2022 (4 tuổi)',
    bloodline: 'Sunday Silence × Northern Dancer (98.5% thuần chủng)',
    origin: 'Nhật Bản (JRA) & Hoa Kỳ',
    studBookNo: 'VTB-SB-2024-001'
  },
  'xích thố': {
    sire: 'Marwan Al Shaqab (QAT)',
    sireOfSire: 'Gazal Al Shaqab (QAT)',
    damOfSire: 'Little Liza Fame (USA)',
    sireAchievements: 'Vô địch World Champion Stallion 3 năm liên tiếp',
    dam: 'Al Adeed Al Shaqab (QAT)',
    sireOfDam: 'Ansata Halim Shah (USA)',
    damOfDam: 'Sundar Alisayyah (USA)',
    damAchievements: 'Huyền thoại dòng Arabian thuần chủng sa mạc',
    foaled: '2021 (5 tuổi)',
    bloodline: 'Al Shaqab Desert Arabian (100% thuần chủng)',
    origin: 'Qatar & UAE',
    studBookNo: 'VTB-SB-2021-014'
  },
  'phi yến': {
    sire: 'Frankel (GB)',
    sireOfSire: 'Galileo (IRE)',
    damOfSire: 'Kind (IRE)',
    sireAchievements: 'Bất bại 14/14 chặng đua G1, Chiến mã số 1 hành tinh',
    dam: 'Sea The Stars (IRE)',
    sireOfDam: 'Cape Cross (IRE)',
    damOfDam: 'Urban Sea (USA)',
    damAchievements: 'Vô địch Prix de l\'Arc de Triomphe & 2000 Guineas',
    foaled: '2023 (3 tuổi)',
    bloodline: 'Frankel (GB) × Sea The Stars (IRE)',
    origin: 'Anh Quốc (Weatherbys) & Ireland',
    studBookNo: 'VTB-SB-2023-009'
  },
  'lôi chấn': {
    sire: 'Corona Cartel (USA)',
    sireOfSire: 'Holland Ease (USA)',
    damOfSire: 'Corona Chick (USA)',
    sireAchievements: 'Vua nước rút Quarter Horse, Hall of Fame AQHA',
    dam: 'First Down Dash (USA)',
    sireOfDam: 'Dash For Cash (USA)',
    damOfDam: 'First Prize Rose (USA)',
    damAchievements: 'Dòng dõi vô địch All American Futurity danh giá',
    foaled: '2021 (5 tuổi)',
    bloodline: 'Corona Cartel × Dash For Cash',
    origin: 'Hoa Kỳ (AQHA Stud Book)',
    studBookNo: 'VTB-SB-2022-088'
  },
  'bạch long': {
    sire: 'Tapit (USA)',
    sireOfSire: 'Pulpit (USA)',
    damOfSire: 'Tap Your Heels (USA)',
    sireAchievements: 'Đứng đầu danh sách Sire Bắc Mỹ 3 lần liên tiếp',
    dam: 'Flightline (USA)',
    sireOfDam: 'Tapit (USA)',
    damOfDam: 'Feathered (USA)',
    damAchievements: 'Chiến mã số 1 thế giới Longines World\'s Best Racehorse',
    foaled: '2024 (2 tuổi)',
    bloodline: 'Tapit × A.P. Indy Lineage',
    origin: 'Hoa Kỳ (Keeneland)',
    studBookNo: 'VTB-SB-2024-003'
  },
  'chiến mã hiếu': {
    sire: 'Secretariat (USA)',
    sireOfSire: 'Bold Ruler (USA)',
    damOfSire: 'Somethingroyal (USA)',
    sireAchievements: 'Huyền thoại Triple Crown Hoa Kỳ với kỷ lục bất bại',
    dam: 'Zenyatta (USA)',
    sireOfDam: 'Street Cry (IRE)',
    damOfDam: 'Vertigineux (USA)',
    damAchievements: 'Chiến mã cái bất bại 19 chặng đua G1 danh giá',
    foaled: '2023 (3 tuổi)',
    bloodline: 'Secretariat × Street Cry',
    origin: 'Kentucky, Hoa Kỳ',
    studBookNo: 'VTB-SB-2026-662'
  }
};

  const defaultAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
  const horseName = foundOwnerHorse?.name || matchAsgn?.horseName || horseIdentifier;
  const microchip = foundOwnerHorse?.microchip || matchAsgn?.microchip || 'MC-VN-2026-001';
  const rawOwner = foundOwnerHorse?.ownerName || foundOwnerHorse?.owner || matchAsgn?.ownerName;
  const ownerName = (rawOwner && rawOwner !== 'Chủ sở hữu' && rawOwner !== 'Chủ nuôi') ? rawOwner : 'Hồ Minh Hiếu';
  const stable = foundOwnerHorse?.stable || matchAsgn?.stable || 'Ô A1';
  const breed = foundOwnerHorse?.breed || matchAsgn?.breed || 'Thoroughbred';
  const gender = foundOwnerHorse?.gender || matchAsgn?.gender || 'Ngựa đực (Stallion)';
  const age = foundOwnerHorse?.age || matchAsgn?.age || '3 tuổi';
  const avatar = foundOwnerHorse?.avatar || matchAsgn?.avatar || defaultAvatar;

  const fallbackPed = DEFAULT_HORSE_PEDIGREES[horseName.toLowerCase()] ||
                       DEFAULT_HORSE_PEDIGREES[String(microchip).toLowerCase()] || {
    sire: 'Storm Cat (USA)',
    sireOfSire: 'Storm Bird (CAN)',
    damOfSire: 'Terlingua (USA)',
    sireAchievements: 'Đầu dòng Sire xuất chúng hàng đầu thế giới',
    dam: 'Winning Colors (USA)',
    sireOfDam: 'Caro (IRE)',
    damOfDam: 'All Rainbows (USA)',
    damAchievements: 'Vô địch Kentucky Derby danh giá',
    foaled: age || '2023 (3 tuổi)',
    bloodline: 'Storm Cat × Caro (Thoroughbred F1)',
    origin: 'Hoa Kỳ (The Jockey Club)',
    studBookNo: `VTB-SB-${microchip ? microchip.replace(/\D/g, '').slice(-4) : '2026'}`
  };

  const rawPed = {
    ...(matchAsgn?.pedigree || {}),
    ...(foundOwnerHorse?.pedigree || {})
  };
  const pedigree = {
    ...fallbackPed,
    ...rawPed,
    sire: rawPed.sire || fallbackPed.sire,
    dam: rawPed.dam || fallbackPed.dam,
    sireOfSire: rawPed.sireOfSire || fallbackPed.sireOfSire,
    damOfSire: rawPed.damOfSire || fallbackPed.damOfSire,
    sireOfDam: rawPed.sireOfDam || fallbackPed.sireOfDam,
    damOfDam: rawPed.damOfDam || fallbackPed.damOfDam,
    sireAchievements: rawPed.sireAchievements !== undefined ? rawPed.sireAchievements : fallbackPed.sireAchievements,
    damAchievements: rawPed.damAchievements !== undefined ? rawPed.damAchievements : fallbackPed.damAchievements,
    studBookNo: rawPed.studBookNo || fallbackPed.studBookNo,
    foaled: rawPed.foaled || fallbackPed.foaled,
    origin: rawPed.origin || fallbackPed.origin,
    bloodline: rawPed.bloodline || fallbackPed.bloodline
  };

  const ownershipShare = foundOwnerHorse?.ownershipShare || matchAsgn?.ownershipShare || 100;

  return {
    ...(matchAsgn || {}),
    ...(foundOwnerHorse || {}),
    id: foundOwnerHorse?.id || matchAsgn?.id || key,
    name: horseName,
    horseName,
    ownerName,
    owner: ownerName,
    microchip,
    stable,
    stall: stable,
    breed,
    gender,
    age,
    avatar,
    pedigree,
    ownershipShare,
    ownershipType: foundOwnerHorse?.ownershipType || matchAsgn?.ownershipType || 'Toàn phần',
    trainerName: matchAsgn?.trainerName || foundOwnerHorse?.trainer || 'Trần Văn Hùng',
    vetName: matchAsgn?.vetName || foundOwnerHorse?.vet || 'BS. Nguyễn An',
    groomName: matchAsgn?.groomName || foundOwnerHorse?.groom || 'Lê Hoàng Nam',
    trainerStatus: matchAsgn?.trainerStatus || 'CONFIRMED',
    vetStatus: matchAsgn?.vetStatus || 'CONFIRMED',
    groomStatus: matchAsgn?.groomStatus || 'CONFIRMED'
  };
}
