/**
 * API Service Client kết nối toàn diện giữa Frontend (ReactJS) và Backend (Java Servlet - Tomcat 8080)
 * Trang bị cơ chế Auto-Fallback (Tự động chuyển tiếp thông minh):
 * - Khi Backend Tomcat và SQL Server đang chạy: Lấy dữ liệu thực từ Cơ sở dữ liệu.
 * - Khi Backend chưa khởi động: Tự động dùng dữ liệu đệm cục bộ (kèm LocalStorage cache)
 *   để toàn bộ các chức năng (Thêm, Sửa, Xóa, Chi tiết, Đổi ngựa, Khóa y tế) luôn hoạt động trơn tru.
 */

import { initialHorsesData } from '../data/horsesData';
import { SEED_USERS } from '../context/AuthContext';
import { settlementStatementsData, raceHistoryLogs } from '../data/financialData';

// Khóa lưu trữ cục bộ để duy trì dữ liệu khi chạy Offline / Prototype
const STORAGE_KEYS = {
  HORSES: 'racehorse_api_horses',
  STABLES: 'racehorse_api_stables',
  USERS: 'racehorse_api_users',
  INCIDENTS: 'racehorse_api_incidents',
  STALL_REQUESTS: 'matruong_stall_requests'
};

// Tự động dọn sạch tất cả dữ liệu ngựa mock và giải phóng các ô chuồng
(function cleanAllMockData() {
  try {
    if (typeof localStorage === 'undefined') return;
    const MOCK_HORSE_NAMES = ['xích thố', 'bạch long', 'hắc phong', 'phi vũ', 'phi yến', 'kim kê', 'kim mã', 'thần mã', 'thanh vân', 'lôi chấn', 'hồng sa', 'thiên lý', 'bảo mã'];

    // 1. Dọn dẹp tất cả các key matruong_owner_horses_*
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('matruong_owner_horses_')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const clean = list.filter(h => h && h.name && !MOCK_HORSE_NAMES.includes(h.name.trim().toLowerCase()));
            localStorage.setItem(k, JSON.stringify(clean));
          }
        }
      }
    }

    // 2. Dọn dẹp racehorse_api_horses
    const horsesRaw = localStorage.getItem(STORAGE_KEYS.HORSES);
    if (horsesRaw) {
      const list = JSON.parse(horsesRaw);
      if (Array.isArray(list)) {
        const clean = list.filter(h => h && h.name && !MOCK_HORSE_NAMES.includes(h.name.trim().toLowerCase()));
        localStorage.setItem(STORAGE_KEYS.HORSES, JSON.stringify(clean));
      }
    }

    // 3. Dọn dẹp racehorse_api_stables
    const stablesRaw = localStorage.getItem(STORAGE_KEYS.STABLES);
    if (stablesRaw) {
      const list = JSON.parse(stablesRaw);
      if (Array.isArray(list)) {
        const cleanStables = list.map(s => {
          const horseName = (s.horse || '').trim().toLowerCase();
          if (MOCK_HORSE_NAMES.includes(horseName)) {
            return {
              ...s,
              status: 'AVAILABLE',
              horse: '(Trống)',
              breed: 'Vacant',
              horse_avatar: null,
              stall_image: '/images/stall_simulation_vacant.jpg'
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.STABLES, JSON.stringify(cleanStables));
      }
    }

    // 4. Dọn dẹp service assignments
    const srvRaw = localStorage.getItem('matruong_service_assignments');
    if (srvRaw) {
      const list = JSON.parse(srvRaw);
      if (Array.isArray(list)) {
        const clean = list.filter(a => a && a.horseName && !MOCK_HORSE_NAMES.includes(a.horseName.trim().toLowerCase()));
        localStorage.setItem('matruong_service_assignments', JSON.stringify(clean));
      }
    }

    // 5. Dọn dẹp groom stalls state
    const grStallRaw = localStorage.getItem('matruong_groom_stalls_state');
    if (grStallRaw) {
      const list = JSON.parse(grStallRaw);
      if (Array.isArray(list)) {
        const clean = list.map(s => {
          const horseName = (s.horseName || '').trim().toLowerCase();
          if (MOCK_HORSE_NAMES.includes(horseName)) {
            return {
              ...s,
              horseName: '(Trống)',
              breed: 'Vacant',
              microchip: 'N/A',
              status: 'OK'
            };
          }
          return s;
        });
        localStorage.setItem('matruong_groom_stalls_state', JSON.stringify(clean));
      }
    }
  } catch {}
})();

function getLocalData(key, defaultVal) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const sanitized = saved.replace(/photo-1598974357801-cbca10065444/g, 'photo-1535083783855-76ae62b2914e');
      if (sanitized !== saved) {
        localStorage.setItem(key, sanitized);
      }
      return JSON.parse(sanitized);
    }
  } catch {
    // Ignore storage read errors
  }
  return defaultVal;
}

function setLocalData(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
}

function getAuthHeaders(includeJson = false) {
  const headers = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const raw = sessionStorage.getItem('matruong_auth_user') || localStorage.getItem('matruong_auth_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // Ignore token parse errors
  }
  return headers;
}


// =========================================================================
// 1. QUẢN LÝ CHIẾN MÃ (HORSES API)
// =========================================================================

/**
 * Lấy danh sách toàn bộ chiến mã
 */
export async function getHorsesApi() {
  try {
    const res = await fetch('/api/horses', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          isFromBackend: true,
          data: data.map((h, idx) => {
            const existing = initialHorsesData.find(
              item => item.chipId === h.microchipId || item.name.toLowerCase() === h.name.toLowerCase()
            );

            if (existing) {
              return {
                ...existing,
                name: h.name,
                breed: h.breed,
                gender: h.gender,
                weight: `${h.weightKg} kg`,
                status: (h.healthStatus || '').toLowerCase() === 'good' || (h.healthStatus || '').toLowerCase() === 'eligible' ? 'eligible' : 'watch',
                locked: !!h.isTrainingLocked
              };
            }

            return {
              id: `H${String(h.horseId || idx + 1).padStart(3, '0')}`,
              chipId: h.microchipId,
              name: h.name,
              englishName: h.name,
              gender: h.gender,
              yob: h.dob ? new Date(h.dob).getFullYear() : 2022,
              age: h.dob ? (new Date().getFullYear() - new Date(h.dob).getFullYear()) : 4,
              breed: h.breed,
              color: 'Tiêu chuẩn',
              height: '16.2 hh',
              weight: `${h.weightKg} kg`,
              stall: 'Khu A',
              owner: 'CLB Mã Trường',
              trainer: 'HLV Trưởng',
              status: (h.healthStatus || '').toLowerCase() === 'good' || (h.healthStatus || '').toLowerCase() === 'eligible' ? 'eligible' : 'watch',
              statusLabel: (h.healthStatus || '').toLowerCase() === 'good' || (h.healthStatus || '').toLowerCase() === 'eligible' ? 'Đủ điều kiện thi đấu' : 'Cần theo dõi',
              winsCount: '10 trận',
              totalEarnings: '1.200.000.000 VNĐ',
              locked: !!h.isTrainingLocked,
              avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
              pedigree: {
                g1: { name: h.name, chipId: h.microchipId },
                g2: {
                  sire: { name: h.sireName || 'Đang cập nhật' },
                  dam: { name: h.damName || 'Đang cập nhật' }
                }
              }
            };
          })
        };
      }
    }
  } catch {
    // Backend offline
  }

  // Backend offline -> Fallback: Lấy danh sách chiến mã thực tế đã được đăng ký
  const ownerHorses = [];
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('matruong_owner_horses_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach(h => {
                if (h && !ownerHorses.some(ex => ex.id === h.id || (ex.microchip && ex.microchip === h.microchip))) {
                  ownerHorses.push({
                    id: h.id,
                    chipId: h.microchip || h.chipId,
                    name: h.name,
                    englishName: h.englishName || h.name,
                    gender: h.gender || 'Đực',
                    breed: h.breed || 'Thoroughbred',
                    stall: h.stable || 'Chưa phân bổ',
                    owner: h.ownerName || h.owner || 'Chủ sở hữu',
                    status: (h.status || 'eligible').toLowerCase() === 'eligible' ? 'eligible' : 'watch',
                    statusLabel: (h.status || 'eligible').toLowerCase() === 'eligible' ? 'Đủ điều kiện thi đấu' : 'Cần theo dõi',
                    locked: !!(h.locked || h.isLockedByVet),
                    avatar: h.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80'
                  });
                }
              });
            }
          }
        }
      }
    }
  } catch {}

  const rawSavedHorses = getLocalData(STORAGE_KEYS.HORSES, []);
  const MOCK_NAMES = ['Xích Thố', 'Bạch Long', 'Hắc Phong', 'Kim Mã', 'Phi Yến', 'Thần Mã', 'Phi Vũ', 'Kim Kê', 'Thanh Vân', 'Lôi Chấn', 'Hồng Sa', 'Thiên Lý', 'Bảo Mã'];
  const cleanSaved = Array.isArray(rawSavedHorses)
    ? rawSavedHorses.filter(h => h && !MOCK_NAMES.includes(h.name))
    : [];

  const combined = [...ownerHorses];
  cleanSaved.forEach(h => {
    if (!combined.some(ex => ex.id === h.id || (ex.chipId && ex.chipId === h.chipId))) {
      combined.push(h);
    }
  });

  setLocalData(STORAGE_KEYS.HORSES, combined);
  return { isFromBackend: false, data: combined };
}

/**
 * Lấy chi tiết hồ sơ 1 chiến mã
 */
export async function getHorseDetailApi(horseId) {
  try {
    const res = await fetch(`/api/horses/${horseId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, isFromBackend: true, data };
    }
  } catch {
    // Fallback
  }

  const localHorses = getLocalData(STORAGE_KEYS.HORSES, initialHorsesData);
  const found = localHorses.find(h => String(h.id) === String(horseId) || h.chipId === horseId || h.name === horseId);
  return { success: !!found, isFromBackend: false, data: found || null };
}

/**
 * Đăng ký chiến mã mới
 */
export async function createHorseApi(horseData) {
  let created = null;
  try {
    const res = await fetch('/api/horses', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(horseData)
    });
    if (res.ok) {
      created = await res.json();
    }
  } catch {
    // Fallback
  }

  // Cập nhật bộ nhớ cục bộ
  const localHorses = getLocalData(STORAGE_KEYS.HORSES, initialHorsesData);
  const newHorse = created || {
    id: horseData.id || `H${String(localHorses.length + 1).padStart(3, '0')}`,
    chipId: horseData.microchip || `MC-VN-2026-${String(localHorses.length + 10).padStart(3, '0')}`,
    name: horseData.name,
    englishName: horseData.englishName || horseData.name,
    breed: horseData.breed || 'Thoroughbred',
    gender: horseData.gender || 'Ngựa đực (Stallion)',
    stable: horseData.stable || 'A1',
    owner: horseData.owner || 'Chủ sở hữu CLB',
    trainer: horseData.trainer || 'HLV Trưởng Phạm Hoàng Nam',
    groom: horseData.groom || 'Nhóm Groom Chăm sóc',
    status: 'ELIGIBLE',
    statusText: 'Đủ chuẩn thi đấu',
    statusColor: '#10B981',
    locked: false,
    weight: '490 kg',
    height: '16.2 hh',
    winsCount: '0 trận',
    totalEarnings: '0 VNĐ',
    desc: horseData.desc || 'Chiến mã mới đăng ký vào hệ thống huấn luyện.',
    avatar: horseData.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'
  };

  const updatedList = [newHorse, ...localHorses.filter(h => h.id !== newHorse.id)];
  setLocalData(STORAGE_KEYS.HORSES, updatedList);
  return newHorse;
}

/**
 * Cập nhật thông tin chiến mã
 */
export async function updateHorseApi(horseData) {
  try {
    const res = await fetch(`/api/horses/${horseData.id || horseData.horseId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(horseData)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const localHorses = getLocalData(STORAGE_KEYS.HORSES, initialHorsesData);
  const updated = localHorses.map(h => String(h.id) === String(horseData.id) ? { ...h, ...horseData } : h);
  setLocalData(STORAGE_KEYS.HORSES, updated);
  return true;
}

/**
 * Khóa hoặc Mở khóa y tế chiến mã (Vet Lock/Unlock)
 */
export async function toggleHorseLockApi(horseId, locked) {
  try {
    const res = await fetch(`/api/horses/${horseId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ toggleLock: locked })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const localHorses = getLocalData(STORAGE_KEYS.HORSES, initialHorsesData);
  const updated = localHorses.map(h => {
    if (String(h.id) === String(horseId)) {
      return {
        ...h,
        locked: locked,
        statusText: locked ? 'Tạm khóa y tế' : 'Đủ chuẩn thi đấu',
        statusColor: locked ? '#EF4444' : '#10B981'
      };
    }
    return h;
  });
  setLocalData(STORAGE_KEYS.HORSES, updated);
  return true;
}

/**
 * Xóa chiến mã
 */
export async function deleteHorseApi(horseId) {
  try {
    const res = await fetch(`/api/horses/${horseId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const localHorses = getLocalData(STORAGE_KEYS.HORSES, initialHorsesData);
  const filtered = localHorses.filter(h => String(h.id) !== String(horseId));
  setLocalData(STORAGE_KEYS.HORSES, filtered);
  return true;
}


// =========================================================================
// 2. QUẢN LÝ Ô CHUỒNG (STABLES & STALLS API)
// =========================================================================

export const STALL_MAINTENANCES_KEY = 'matruong_stall_maintenances';

/**
 * Lấy danh sách các ca bảo dưỡng ô chuồng đang hoạt động
 */
export function getActiveStallMaintenances() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STALL_MAINTENANCES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Lưu danh sách các ca bảo dưỡng ô chuồng
 */
export function saveActiveStallMaintenances(maintenancesMap) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STALL_MAINTENANCES_KEY, JSON.stringify(maintenancesMap));
    localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
  } catch {}
}

/**
 * Kiểm tra và tự động giải phóng/hoàn trả ô chuồng khi hết thời hạn 30 phút bảo dưỡng
 */
export function checkAndExpireStallMaintenances() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const recordMap = getActiveStallMaintenances();
    const now = Date.now();
    const expiredList = [];
    const remainingMap = {};

    Object.entries(recordMap).forEach(([stallCode, record]) => {
      if (now >= record.endTime) {
        expiredList.push(record);
      } else {
        remainingMap[stallCode] = record;
      }
    });

    if (expiredList.length > 0) {
      saveActiveStallMaintenances(remainingMap);

      const localStables = getLocalData(STORAGE_KEYS.STABLES, []);
      const updated = localStables.map(s => {
        const code = (s.stall_code || s.stallCode || '').toUpperCase();
        const expMatchOriginal = expiredList.find(e => e.stallCode === code);
        if (expMatchOriginal) {
          return {
            ...s,
            status: 'OCCUPIED',
            horse: expMatchOriginal.horseName,
            breed: expMatchOriginal.horseBreed || 'Thuần chủng',
            horse_avatar: expMatchOriginal.horseAvatar || null,
            temp_relocated_to: null,
            maintenance_start: null,
            maintenance_end: null
          };
        }
        const expMatchTemp = expiredList.find(e => e.tempStallCode === code);
        if (expMatchTemp) {
          return {
            ...s,
            status: 'AVAILABLE',
            horse: '(Trống)',
            breed: 'Vacant',
            horse_avatar: null,
            is_temp_stall: false,
            temp_for_stall: null,
            maintenance_end: null
          };
        }
        return s;
      });

      setLocalData(STORAGE_KEYS.STABLES, updated);
      try {
        window.dispatchEvent(new Event('matruong_stables_updated'));
      } catch {}
    }

    return expiredList;
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách toàn bộ ô chuồng trại kèm hình ảnh mô phỏng 3D
 */
export async function getStablesApi() {
  const MOCK_HORSE_NAMES = ['xích thố', 'bạch long', 'hắc phong', 'phi vũ', 'phi yến', 'kim kê', 'kim mã', 'thần mã', 'thanh vân', 'lôi chấn', 'hồng sa', 'thiên lý', 'bảo mã'];

  // 0. Quét và giải phóng các ca bảo dưỡng đã quá 30 phút
  checkAndExpireStallMaintenances();
  const activeMaintenances = getActiveStallMaintenances();

  // Đồng bộ tức thì với các chiến mã thực tế đã được đăng ký và phân bổ chuồng từ các chủ sở hữu
  const assignedHorsesMap = {};
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('matruong_owner_horses_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              // Dọn sạch ngựa mock
              const clean = list.filter(h => h && h.name && !MOCK_HORSE_NAMES.includes(h.name.trim().toLowerCase()));
              if (clean.length !== list.length) {
                localStorage.setItem(k, JSON.stringify(clean));
              }
              clean.forEach(h => {
                if (h && h.stable) {
                  const m = String(h.stable).match(/[A-Z0-9]+/i);
                  if (m) {
                    assignedHorsesMap[m[0].toUpperCase()] = h;
                  }
                }
              });
            }
          }
        }
      }
    }
  } catch {}

  const defaultStables = [
    { stall_code: 'A1', block: 'Block A', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A2', block: 'Block A', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A3', block: 'Block A', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A4', block: 'Block A', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A5', block: 'Block A', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A6', block: 'Block A', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B1', block: 'Block B', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B2', block: 'Block B', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B3', block: 'Block B', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B4', block: 'Block B', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B5', block: 'Block B', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B6', block: 'Block B', tier: 'VIP', is_vip: true, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    // Chuồng tiêu chuẩn thông thường (Block C)
    { stall_code: 'C1', block: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'C2', block: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'C3', block: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'C4', block: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null }
  ];

  const localSavedStables = getLocalData(STORAGE_KEYS.STABLES, []);
  let rawList = defaultStables;

  try {
    const res = await fetch('/api/stables', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        rawList = data;
      } else {
        rawList = localSavedStables.length > 0 ? localSavedStables : defaultStables;
      }
    } else {
      rawList = localSavedStables.length > 0 ? localSavedStables : defaultStables;
    }
  } catch {
    rawList = localSavedStables.length > 0 ? localSavedStables : defaultStables;
  }

  // Merge thông minh: Kết hợp danh sách từ backend với danh sách chuồng mới tạo trong local
  const combinedMap = new Map();

  rawList.forEach(s => {
    const code = (s.stall_code || s.stallCode || '').toUpperCase();
    if (code) combinedMap.set(code, { ...s, stall_code: code, stallCode: code });
  });

  if (Array.isArray(localSavedStables)) {
    localSavedStables.forEach(s => {
      const code = (s.stall_code || s.stallCode || '').toUpperCase();
      if (!code) return;
      if (!combinedMap.has(code)) {
        combinedMap.set(code, { ...s, stall_code: code, stallCode: code });
      } else {
        const existing = combinedMap.get(code);
        combinedMap.set(code, {
          ...existing,
          ...s,
          stall_code: code,
          stallCode: code,
          tier: s.tier || existing.tier,
          is_vip: s.is_vip !== undefined ? s.is_vip : existing.is_vip,
          stall_image: s.stall_image || existing.stall_image
        });
      }
    });
  }

  const mergedList = Array.from(combinedMap.values());

  // Đảm bảo dữ liệu được chuẩn hóa trường, đồng bộ chiến mã thực tế và dọn sạch 100% ngựa mock
  let normalized = mergedList.map(s => {
    const code = (s.stall_code || s.stallCode || '').toUpperCase();
    const block = s.block || s.blockName || (code.startsWith('B') ? 'Block B' : code.startsWith('C') ? 'Block C' : 'Block A');
    
    let isVip = false;
    if (s.tier === 'VIP' || s.is_vip === true) {
      isVip = true;
    } else if (s.tier === 'STANDARD' || s.tier === 'NORMAL' || s.is_vip === false) {
      isVip = false;
    } else {
      isVip = block.includes('Block A') || block.includes('Block B') || block.includes('VIP') || code.startsWith('A') || code.startsWith('B') || code.startsWith('VIP');
    }

    const assigned = assignedHorsesMap[code];
    const isAssignedValid = assigned && assigned.name && !MOCK_HORSE_NAMES.includes(assigned.name.trim().toLowerCase());

    const activeMaint = activeMaintenances[code];
    const isTempFor = Object.values(activeMaintenances).find(m => m.tempStallCode === code);

    let stallStatus = 'AVAILABLE';
    let stallHorse = '(Trống)';
    let stallBreed = 'Vacant';
    let horseAvatar = null;
    let tempRelocatedTo = s.temp_relocated_to || null;
    let isTempStall = Boolean(s.is_temp_stall || isTempFor);
    let tempForStall = s.temp_for_stall || (isTempFor ? isTempFor.stallCode : null);
    let maintenanceStart = s.maintenance_start || (activeMaint ? activeMaint.startTime : null);
    let maintenanceEnd = s.maintenance_end || (activeMaint ? activeMaint.endTime : (isTempFor ? isTempFor.endTime : null));

    if (activeMaint) {
      // Chuồng đang trong ca bảo dưỡng 30 phút: Tên ngựa cố định và ghi nhận chuồng tạm
      stallStatus = 'MAINTENANCE';
      stallHorse = activeMaint.horseName;
      stallBreed = activeMaint.horseBreed || 'Thuần chủng';
      horseAvatar = activeMaint.horseAvatar || null;
      tempRelocatedTo = activeMaint.tempStallCode;
    } else if (isTempFor) {
      // Chuồng trống tạm thời tiếp nhận chiến mã của chuồng đang bảo dưỡng
      stallStatus = 'OCCUPIED';
      stallHorse = isTempFor.horseName;
      stallBreed = isTempFor.horseBreed || 'Thuần chủng';
      horseAvatar = isTempFor.horseAvatar || null;
    } else {
      if (s.status === 'MAINTENANCE') {
        stallStatus = 'MAINTENANCE';
        stallHorse = isAssignedValid ? assigned.name : (s.horse && s.horse !== '(Trống)' ? s.horse : '(Trống)');
        stallBreed = isAssignedValid ? (assigned.breed || 'Thuần chủng') : (s.breed || 'Vacant');
        horseAvatar = isAssignedValid ? (assigned.avatar || assigned.horse_avatar) : (s.horse_avatar || null);
      } else if (s.status === 'AVAILABLE') {
        stallStatus = 'AVAILABLE';
        stallHorse = '(Trống)';
        stallBreed = 'Vacant';
        horseAvatar = null;
      } else if (s.status === 'OCCUPIED' || isAssignedValid) {
        stallStatus = 'OCCUPIED';
        stallHorse = isAssignedValid ? assigned.name : (s.horse && s.horse !== '(Trống)' ? s.horse : 'Đang nuôi dưỡng');
        stallBreed = isAssignedValid ? (assigned.breed || 'Thoroughbred') : (s.breed && s.breed !== 'Vacant' ? s.breed : 'Thuần chủng');
        horseAvatar = isAssignedValid ? (assigned.avatar || assigned.horse_avatar || null) : (s.horse_avatar || null);
      } else {
        stallStatus = 'AVAILABLE';
        stallHorse = '(Trống)';
        stallBreed = 'Vacant';
        horseAvatar = null;
      }
    }

    const isOccupiedStall = stallStatus === 'OCCUPIED';
    const stallImg = s.stall_image && !s.stall_image.includes('simulation')
      ? s.stall_image
      : (isOccupiedStall ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg');

    return {
      stall_code: code,
      stallCode: code,
      block,
      blockName: block,
      tier: isVip ? 'VIP' : 'STANDARD',
      is_vip: isVip,
      status: stallStatus,
      horse: stallHorse,
      breed: stallBreed,
      horse_avatar: horseAvatar,
      stall_image: stallImg,
      temp_relocated_to: tempRelocatedTo,
      is_temp_stall: isTempStall,
      temp_for_stall: tempForStall,
      maintenance_start: maintenanceStart,
      maintenance_end: maintenanceEnd,
      area: s.area || (code.startsWith('A') ? '18 m²' : code.startsWith('B') ? '16 m²' : '14 m²'),
      dim: s.dim || (code.startsWith('A') ? '4.2 x 4.2m' : code.startsWith('B') ? '4.0 x 4.0m' : '3.6 x 3.6m')
    };
  });

  // Đảm bảo đủ các chuồng Block C
  if (!normalized.some(s => s.stall_code === 'C1')) {
    normalized = [
      ...normalized,
      { stall_code: 'C1', stallCode: 'C1', block: 'Block C', blockName: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
      { stall_code: 'C2', stallCode: 'C2', block: 'Block C', blockName: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
      { stall_code: 'C3', stallCode: 'C3', block: 'Block C', blockName: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
      { stall_code: 'C4', stallCode: 'C4', block: 'Block C', blockName: 'Block C', tier: 'STANDARD', is_vip: false, status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '14 m²', dim: '3.6 x 3.6m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null }
    ];
  }

  setLocalData(STORAGE_KEYS.STABLES, normalized);
  return { isFromBackend: false, data: normalized };
}

/**
 * Tạo ô chuồng mới
 */
export async function createStallApi(stallData) {
  const code = (stallData.stall_code || stallData.stallCode || '').trim().toUpperCase();
  const block = stallData.block || stallData.blockName || 'Block C';
  const isVip = stallData.tier === 'VIP' || stallData.is_vip === true || stallData.block === 'Block VIP' || code.startsWith('VIP');
  const isOccupied = stallData.status === 'OCCUPIED';

  const newStall = {
    stall_code: code,
    stallCode: code,
    block: block,
    blockName: block,
    tier: isVip ? 'VIP' : 'STANDARD',
    is_vip: isVip,
    status: stallData.status || 'AVAILABLE',
    horse: isOccupied ? (stallData.horse || 'Chiến mã mới') : '(Trống)',
    breed: isOccupied ? (stallData.breed || 'Thoroughbred') : 'Vacant',
    area: stallData.area || '16 m²',
    dim: stallData.dim || '4.0 x 4.0m',
    stall_image: stallData.stall_image || (isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg'),
    horse_avatar: isOccupied ? (stallData.horse_avatar || null) : null
  };

  try {
    await fetch('/api/stables', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(newStall)
    });
  } catch {
    // Fallback
  }

  const currentLocal = getLocalData(STORAGE_KEYS.STABLES, []);
  const filtered = currentLocal.filter(s => (s.stall_code || s.stallCode || '').toUpperCase() !== code);
  const updated = [...filtered, newStall];
  setLocalData(STORAGE_KEYS.STABLES, updated);
  try {
    localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
    window.dispatchEvent(new Event('matruong_stables_updated'));
  } catch {}

  return newStall;
}

/**
 * Cập nhật thông tin ô chuồng
 */
export async function updateStallApi(stallCodeOrData, maybeData) {
  let stallCode = '';
  let payload = {};

  if (typeof stallCodeOrData === 'string') {
    stallCode = stallCodeOrData.trim().toUpperCase();
    payload = maybeData || {};
  } else if (stallCodeOrData && typeof stallCodeOrData === 'object') {
    stallCode = (stallCodeOrData.stall_code || stallCodeOrData.stallCode || '').trim().toUpperCase();
    payload = stallCodeOrData;
  }

  if (!stallCode) return false;

  try {
    await fetch(`/api/stables/${stallCode}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ ...payload, stall_code: stallCode })
    });
  } catch {
    // Fallback
  }

  const currentLocal = getLocalData(STORAGE_KEYS.STABLES, []);
  let found = false;
  const updated = currentLocal.map(s => {
    if ((s.stall_code || s.stallCode || '').toUpperCase() === stallCode) {
      found = true;
      return { ...s, ...payload, stall_code: stallCode, stallCode };
    }
    return s;
  });

  if (!found) {
    updated.push({ stall_code: stallCode, stallCode, ...payload });
  }

  setLocalData(STORAGE_KEYS.STABLES, updated);

  if (horseOption === 'VACANT') {
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('matruong_owner_horses_')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                let changed = false;
                const updatedList = list.map(h => {
                  if (h && h.stable && String(h.stable).toUpperCase().includes(stallCode)) {
                    changed = true;
                    return { ...h, stable: '(Chưa phân bổ)' };
                  }
                  return h;
                });
                if (changed) {
                  localStorage.setItem(k, JSON.stringify(updatedList));
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  try {
    localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
    window.dispatchEvent(new Event('matruong_stables_updated'));
  } catch {}

  return true;
}

/**
 * Phân bổ / Đổi chiến mã hoặc làm trống ô chuồng
 */
export async function reassignStallHorseApi(stallCode, horseOption, customHorse = {}) {
  try {
    const res = await fetch('/api/stables', {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({
        stall_code: stallCode,
        reassign: true,
        horse_id: horseOption !== 'VACANT' && horseOption !== 'CUSTOM' ? horseOption : null,
        horse: customHorse.name || '',
        breed: customHorse.breed || ''
      })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const { data: stables } = await getStablesApi();
  const updated = stables.map(s => {
    if (s.stall_code === stallCode) {
      if (horseOption === 'VACANT') {
        return {
          ...s,
          status: 'AVAILABLE',
          horse: '(Trống)',
          breed: 'Vacant',
          stall_image: '/images/stall_simulation_vacant.jpg',
          horse_avatar: null
        };
      } else {
        return {
          ...s,
          status: 'OCCUPIED',
          horse: customHorse.name || s.horse,
          breed: customHorse.breed || s.breed,
          stall_image: '/images/stall_simulation_occupied.jpg',
          horse_avatar: customHorse.avatar || s.horse_avatar
        };
      }
    }
    return s;
  });
  setLocalData(STORAGE_KEYS.STABLES, updated);

  if (horseOption === 'VACANT') {
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('matruong_owner_horses_')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                let changed = false;
                const updatedList = list.map(h => {
                  if (h && h.stable && String(h.stable).toUpperCase().includes(stallCode)) {
                    changed = true;
                    return { ...h, stable: '(Chưa phân bổ)' };
                  }
                  return h;
                });
                if (changed) {
                  localStorage.setItem(k, JSON.stringify(updatedList));
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  try {
    localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
    window.dispatchEvent(new Event('matruong_stables_updated'));
  } catch {}
  return true;
}

/**
 * Xóa ô chuồng
 */
export async function deleteStallApi(stallCode) {
  const code = (stallCode || '').trim().toUpperCase();
  try {
    await fetch(`/api/stables/${code}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
  } catch {
    // Fallback
  }

  const currentLocal = getLocalData(STORAGE_KEYS.STABLES, []);
  const updated = currentLocal.filter(s => (s.stall_code || s.stallCode || '').toUpperCase() !== code);
  setLocalData(STORAGE_KEYS.STABLES, updated);

  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('matruong_owner_horses_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              let changed = false;
              const updatedList = list.map(h => {
                if (h && h.stable && String(h.stable).toUpperCase().includes(code)) {
                  changed = true;
                  return { ...h, stable: '(Chưa phân bổ)' };
                }
                return h;
              });
              if (changed) {
                localStorage.setItem(k, JSON.stringify(updatedList));
              }
            }
          }
        }
      }
    }
  } catch {}

  try {
    localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
    window.dispatchEvent(new Event('matruong_stables_updated'));
  } catch {}
  return true;
}

/**
 * =========================================================================
 * 2.1 QUẢN LÝ YÊU CẦU CẤP & ĐỔI Ô CHUỒNG (STALL REQUESTS & APPROVALS)
 * =========================================================================
 */

/**
 * Lấy danh sách yêu cầu cấp / đổi ô chuồng
 */
export async function getStallRequestsApi() {
  try {
    const res = await fetch('/api/stables/requests', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return { isFromBackend: true, data };
    }
  } catch {
    // Fallback
  }

  const list = getLocalData(STORAGE_KEYS.STALL_REQUESTS, []);
  return { isFromBackend: false, data: Array.isArray(list) ? list : [] };
}

/**
 * Tạo yêu cầu cấp mới hoặc đổi ô chuồng (từ Chủ sở hữu)
 */
export async function createStallRequestApi(requestData) {
  const newReq = {
    id: requestData.id || `SRQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    horseId: requestData.horseId,
    horseName: requestData.horseName,
    horseAvatar: requestData.horseAvatar || null,
    horseBreed: requestData.horseBreed || 'Thoroughbred',
    ownerUsername: requestData.ownerUsername || '',
    ownerName: requestData.ownerName || 'Chủ sở hữu',
    type: requestData.type || 'ASSIGN', // 'ASSIGN' (cấp chuồng mới) | 'CHANGE' (đổi chuồng)
    currentStall: requestData.currentStall || null, // Ô chuồng hiện tại nếu đổi
    requestedStall: requestData.requestedStall, // Mã ô chuồng xin cấp (VD: 'A1')
    requestedStallLabel: requestData.requestedStallLabel || `Ô ${requestData.requestedStall}`,
    reason: requestData.reason || '',
    status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/stables/requests', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(newReq)
    });
    if (res.ok) {
      const created = await res.json();
      return created;
    }
  } catch {
    // Fallback
  }

  const existing = getLocalData(STORAGE_KEYS.STALL_REQUESTS, []);
  // Loại bỏ các request pending cũ cùng ngựa và cùng ô nếu có
  const filtered = existing.filter(r => !(r.horseId === newReq.horseId && r.status === 'PENDING'));
  const updatedList = [newReq, ...filtered];
  setLocalData(STORAGE_KEYS.STALL_REQUESTS, updatedList);

  // Đánh dấu ô chuồng xin cấp là tạm giữ/đang chờ duyệt để người khác không chọn trùng
  const { data: stables } = await getStablesApi();
  const updatedStables = stables.map(s => {
    if (s.stall_code === newReq.requestedStall) {
      return {
        ...s,
        status: 'OCCUPIED',
        horse: `${newReq.horseName} (Chờ duyệt)`,
        breed: newReq.horseBreed,
        horse_avatar: newReq.horseAvatar,
        stall_image: '/images/stall_simulation_occupied.jpg'
      };
    }
    return s;
  });
  setLocalData(STORAGE_KEYS.STABLES, updatedStables);

  window.dispatchEvent(new Event('matruong_stables_updated'));
  window.dispatchEvent(new Event('matruong_stall_requests_updated'));
  window.dispatchEvent(new Event('storage'));

  return newReq;
}

/**
 * Phê duyệt yêu cầu cấp hoặc đổi ô chuồng (Admin)
 */
export async function approveStallRequestApi(requestId, adminName = 'Admin Quản Trị') {
  try {
    const res = await fetch(`/api/stables/requests/${requestId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include'
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const reqList = getLocalData(STORAGE_KEYS.STALL_REQUESTS, []);
  const req = reqList.find(r => String(r.id) === String(requestId));
  if (!req) return false;

  const { data: stables } = await getStablesApi();

  // 1. Nếu là yêu cầu ĐỔI CHUỒNG (type: 'CHANGE' hoặc có currentStall):
  // NHẢ Ô CHUỒNG CŨ TRỞ LẠI TRẠNG THÁI TRỐNG (AVAILABLE)
  let updatedStables = stables;
  if (req.currentStall) {
    const curCode = String(req.currentStall).toUpperCase().replace(/[^A-Z0-9]/g, '');
    updatedStables = updatedStables.map(s => {
      if (s.stall_code.toUpperCase() === curCode) {
        return {
          ...s,
          status: 'AVAILABLE',
          horse: '(Trống)',
          breed: 'Vacant',
          horse_avatar: null,
          stall_image: '/images/stall_simulation_vacant.jpg'
        };
      }
      return s;
    });
  }

  // 2. GÁN CHIẾN MÃ VÀO Ô CHUỒNG MỚI (OCCUPIED)
  const targetCode = String(req.requestedStall).toUpperCase().replace(/[^A-Z0-9]/g, '');
  updatedStables = updatedStables.map(s => {
    if (s.stall_code.toUpperCase() === targetCode) {
      return {
        ...s,
        status: 'OCCUPIED',
        horse: req.horseName,
        breed: req.horseBreed || 'Thoroughbred',
        horse_avatar: req.horseAvatar || s.horse_avatar,
        stall_image: '/images/stall_simulation_occupied.jpg'
      };
    }
    return s;
  });
  setLocalData(STORAGE_KEYS.STABLES, updatedStables);

  // 3. CẬP NHẬT TRẠNG THÁI YÊU CẦU
  const updatedReqList = reqList.map(r => {
    if (String(r.id) === String(requestId)) {
      return {
        ...r,
        status: 'APPROVED',
        approvedBy: adminName,
        approvedAt: new Date().toISOString()
      };
    }
    return r;
  });
  setLocalData(STORAGE_KEYS.STALL_REQUESTS, updatedReqList);

  // 4. ĐỒNG BỘ DỮ LIỆU NGỰA CỦA CHỦ SỞ HỮU TRÊN LOCALSTORAGE
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('matruong_owner_horses_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            let changed = false;
            const updatedHorses = list.map(h => {
              if (String(h.id) === String(req.horseId) || (h.name && h.name.toLowerCase() === req.horseName.toLowerCase())) {
                changed = true;
                return {
                  ...h,
                  stable: req.requestedStallLabel || `Ô ${req.requestedStall}`,
                  stallStatus: 'APPROVED',
                  stallApproved: true,
                  pendingStall: null
                };
              }
              return h;
            });
            if (changed) {
              localStorage.setItem(key, JSON.stringify(updatedHorses));
            }
          }
        }
      }
    }
  } catch {}

  // 5. PHÁT SỰ KIỆN CẬP NHẬT TOÀN HỆ THỐNG
  window.dispatchEvent(new Event('matruong_stables_updated'));
  window.dispatchEvent(new Event('matruong_horses_updated'));
  window.dispatchEvent(new Event('matruong_stall_requests_updated'));
  window.dispatchEvent(new Event('storage'));

  return true;
}

/**
 * Từ chối yêu cầu cấp hoặc đổi ô chuồng (Admin)
 */
export async function rejectStallRequestApi(requestId, reason = '', adminName = 'Admin Quản Trị') {
  try {
    const res = await fetch(`/api/stables/requests/${requestId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const reqList = getLocalData(STORAGE_KEYS.STALL_REQUESTS, []);
  const req = reqList.find(r => String(r.id) === String(requestId));
  if (!req) return false;

  const { data: stables } = await getStablesApi();

  // Nhả ô chuồng đã xin cấp trở lại trạng thái trống (AVAILABLE)
  const targetCode = String(req.requestedStall).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const updatedStables = stables.map(s => {
    if (s.stall_code.toUpperCase() === targetCode) {
      return {
        ...s,
        status: 'AVAILABLE',
        horse: '(Trống)',
        breed: 'Vacant',
        horse_avatar: null,
        stall_image: '/images/stall_simulation_vacant.jpg'
      };
    }
    return s;
  });
  setLocalData(STORAGE_KEYS.STABLES, updatedStables);

  // Cập nhật trạng thái yêu cầu
  const updatedReqList = reqList.map(r => {
    if (String(r.id) === String(requestId)) {
      return {
        ...r,
        status: 'REJECTED',
        rejectReason: reason || 'Ban Quản Trị không phê duyệt vị trí này',
        rejectedBy: adminName,
        rejectedAt: new Date().toISOString()
      };
    }
    return r;
  });
  setLocalData(STORAGE_KEYS.STALL_REQUESTS, updatedReqList);

  // Cập nhật ngựa trong localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('matruong_owner_horses_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            let changed = false;
            const updatedHorses = list.map(h => {
              if (String(h.id) === String(req.horseId) || (h.name && h.name.toLowerCase() === req.horseName.toLowerCase())) {
                changed = true;
                return {
                  ...h,
                  stallStatus: 'REJECTED',
                  pendingStall: null,
                  stallRejectReason: reason || 'Ban Quản Trị từ chối'
                };
              }
              return h;
            });
            if (changed) {
              localStorage.setItem(key, JSON.stringify(updatedHorses));
            }
          }
        }
      }
    }
  } catch {}

  window.dispatchEvent(new Event('matruong_stables_updated'));
  window.dispatchEvent(new Event('matruong_horses_updated'));
  window.dispatchEvent(new Event('matruong_stall_requests_updated'));
  window.dispatchEvent(new Event('storage'));

  return true;
}


// =========================================================================
// 3. XÁC THỰC & NGƯỜI DÙNG (AUTH & USERS API)
// =========================================================================

/**
 * Đăng nhập hệ thống
 */
export async function loginApi(account, password) {
  const trimmed = account ? String(account).trim().toLowerCase() : '';
  const cleanPass = password ? String(password).trim() : '';

  if (!trimmed || !cleanPass) {
    return { success: false, isFromBackend: false, error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' };
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ account: trimmed, password: cleanPass })
    });
    if (res.ok) {
      const user = await res.json();
      return { success: true, isFromBackend: true, user };
    }
    if (res.status === 401 || res.status === 403 || res.status === 400) {
      const errBody = await res.json().catch(() => ({}));
      return {
        success: false,
        isFromBackend: true,
        error: errBody.error || 'Tài khoản hoặc mật khẩu không chính xác.'
      };
    }
  } catch {
    // Backend offline -> Fallback
  }

  // Fallback khi offline
  const PRESETS = [
    {
      aliases: ['admin', 'admin@matruong.vn', 'quanly', 'admin_quan'],
      user: { user_id: 1, userId: 1, username: 'admin', full_name: 'Quản trị viên Hệ thống', email: 'admin@matruong.vn', phone: '0905678999', roleCode: 'MANAGER', role_code: 'MANAGER', status: 'ACTIVE' }
    },
    {
      aliases: ['vet', 'vet_an', 'bacsi', 'vet@matruong.vn'],
      user: { user_id: 4, userId: 4, username: 'vet_an', full_name: 'Bác sĩ Nguyễn An', email: 'vet@matruong.vn', phone: '0902345678', roleCode: 'VET', role_code: 'VET', status: 'ACTIVE' }
    },
    {
      aliases: ['trainer', 'trainer_truong', 'hlv', 'trainer@matruong.vn'],
      user: { user_id: 3, userId: 3, username: 'trainer_truong', full_name: 'Trần Văn Hùng', email: 'trainer@matruong.vn', phone: '0901234567', roleCode: 'TRAINER', role_code: 'TRAINER', status: 'ACTIVE' }
    },
    {
      aliases: ['groom', 'groom_nam', 'chamsoc', 'groom@matruong.vn'],
      user: { user_id: 5, userId: 5, username: 'groom_nam', full_name: 'Lê Hoàng Nam', email: 'groom@matruong.vn', phone: '0903456789', roleCode: 'GROOM', role_code: 'GROOM', status: 'ACTIVE' }
    }
  ];

  const matchedPreset = PRESETS.find(p => p.aliases.includes(trimmed));
  if (matchedPreset && (cleanPass === '123' || cleanPass === '123456')) {
    return { success: true, isFromBackend: false, user: matchedPreset.user };
  }

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const found = localUsers.find(
    u => (u.username?.toLowerCase() === trimmed || u.email?.toLowerCase() === trimmed) &&
      (u.password === password || cleanPass === '123' || cleanPass === '123456') &&
      u.status === 'ACTIVE'
  );
  if (found) {
    return { success: true, isFromBackend: false, user: found };
  }

  return { success: false, isFromBackend: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
}

/**
 * Đăng ký tài khoản mới (Chặn tự đăng ký quyền MANAGER/ADMIN)
 */
export async function registerApi(userData) {
  const requestedRole = String(userData.role || 'OWNER').toUpperCase();
  const safeRole = ['OWNER', 'TRAINER', 'VET', 'GROOM'].includes(requestedRole) ? requestedRole : 'OWNER';
  const payload = { ...userData, role: safeRole };

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const user = await res.json();
      return { success: true, isFromBackend: true, user };
    }
  } catch {
    // Fallback
  }

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const newUser = {
    user_id: localUsers.length + 1,
    username: payload.username || (payload.email ? payload.email.split('@')[0] : `user_${Date.now()}`),
    full_name: payload.full_name || payload.fullName,
    email: payload.email,
    phone: payload.phone || '',
    role_code: safeRole,
    role_name: 'Chủ sở hữu Ngựa',
    status: 'ACTIVE'
  };
  setLocalData(STORAGE_KEYS.USERS, [newUser, ...localUsers]);
  return { success: true, isFromBackend: false, user: newUser };
}

/**
 * Lấy danh sách toàn bộ người dùng cho Admin
 */
export async function getUsersApi() {
  try {
    const res = await fetch('/api/users', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch {
    // Fallback
  }

  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.USERS, SEED_USERS) };
}

/**
 * Thêm người dùng mới từ trang Quản trị
 */
export async function createUserApi(userData) {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const newUser = {
    user_id: localUsers.length + 1,
    username: userData.username,
    full_name: userData.full_name,
    email: userData.email,
    phone: userData.phone,
    role_code: userData.role,
    role_name: userData.role_name || userData.role,
    status: 'ACTIVE'
  };
  setLocalData(STORAGE_KEYS.USERS, [newUser, ...localUsers]);
  return newUser;
}

/**
 * Cập nhật thông tin nhân sự (Hỗ trợ cả (userId, updatedFields) và (userData))
 */
export async function updateUserApi(userIdOrData, updatedFields = null) {
  const payload = updatedFields && typeof userIdOrData !== 'object'
    ? { user_id: userIdOrData, userId: userIdOrData, ...updatedFields }
    : (userIdOrData || {});

  try {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const targetId = payload.user_id || payload.userId;
  const updated = localUsers.map(u => String(u.user_id) === String(targetId) ? { ...u, ...payload } : u);
  setLocalData(STORAGE_KEYS.USERS, updated);
  return true;
}

/**
 * Xóa nhân sự
 */
export async function deleteUserApi(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const updated = localUsers.filter(u => String(u.user_id) !== String(userId));
  setLocalData(STORAGE_KEYS.USERS, updated);
  return true;
}


// =========================================================================
// 4. SỰ CỐ & BẢO TRÌ (INCIDENTS API)
// =========================================================================

export async function getIncidentsApi() {
  try {
    const res = await fetch('/api/incidents', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch {
    // Fallback
  }
  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.INCIDENTS, []) };
}

export async function reportIncidentApi(incident) {
  try {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(incident)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const local = getLocalData(STORAGE_KEYS.INCIDENTS, []);
  const newIncident = { ...incident, id: Date.now() };
  setLocalData(STORAGE_KEYS.INCIDENTS, [newIncident, ...local]);
  return newIncident;
}


// =========================================================================
// 5. HUẤN LUYỆN & VIỄN TRẮC (TRAINING API)
// =========================================================================

export async function getTrainingProgramsApi() {
  try {
    const res = await fetch('/api/training/programs', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch {
    // Fallback
  }
  return { isFromBackend: false, data: [] };
}

export async function getTelemetrySessionsApi() {
  try {
    const res = await fetch('/api/training/telemetry', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch {
    // Fallback
  }
  return { isFromBackend: false, data: [] };
}


// =========================================================================
// 6. GIẢI ĐUA & ĐỐI SOÁT TÀI CHÍNH (RACES & FINANCE API)
// =========================================================================

export async function getRacesApi() {
  try {
    const res = await fetch('/api/races', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch {
    // Fallback
  }
  return { isFromBackend: false, data: raceHistoryLogs };
}

export async function getFinancialSettlementsApi() {
  try {
    const res = await fetch('/api/finance/settlements', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch {
    // Fallback
  }
  return { isFromBackend: false, data: settlementStatementsData };
}


// =========================================================================
// 7. VAI TRÒ 1: QUẢN TRỊ VIÊN / QUẢN LÝ (ADMIN / MANAGER API)
// =========================================================================

export async function getAdminOverviewApi() {
  try {
    const res = await fetch('/api/admin/overview', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const { data: horses } = await getHorsesApi();
  const { data: stables } = await getStablesApi();
  const { data: incidents } = await getIncidentsApi();
  const users = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);

  return {
    totalHorses: horses.length,
    eligibleHorses: horses.filter(h => !h.locked && h.status === 'eligible').length,
    lockedHorses: horses.filter(h => h.locked).length,
    totalStalls: stables.length,
    occupiedStalls: stables.filter(s => s.status === 'OCCUPIED').length,
    availableStalls: stables.filter(s => s.status === 'AVAILABLE').length,
    totalUsers: users.length,
    activeIncidents: incidents.filter(i => i.status !== 'RESOLVED').length,
    totalPrizePool: '3.500.000.000 VNĐ'
  };
}


// =========================================================================
// 8. VAI TRÒ 2: HUẤN LUYỆN VIÊN TRƯỞNG (TRAINER API)
// =========================================================================

export async function getTrainerHorsesApi(trainerId = 'TRAINER') {
  try {
    const res = await fetch(`/api/trainer/horses?trainerId=${trainerId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const { data: allHorses } = await getHorsesApi();
  return allHorses;
}

export async function saveTrainingProgramApi(programData) {
  try {
    const res = await fetch('/api/training/programs', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(programData)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const key = 'matruong_trainer_programs';
  const local = getLocalData(key, []);
  const progId = programData.id;

  // Chống nhân đôi giáo án trong fallback cache
  const existsIdx = local.findIndex(p => 
    (progId && String(p.id) === String(progId)) ||
    ((p.title || '').trim().toLowerCase() === (programData.title || '').trim().toLowerCase() &&
     (p.horseName || p.horse || '').trim().toLowerCase() === (programData.horseName || programData.horse || '').trim().toLowerCase() &&
     (p.phase || '').trim().toLowerCase() === (programData.phase || '').trim().toLowerCase())
  );

  if (existsIdx >= 0) {
    local[existsIdx] = { ...local[existsIdx], ...programData };
    setLocalData(key, local);
    return local[existsIdx];
  }

  const newProgram = { ...programData, id: progId || `PROG-${Date.now()}` };
  setLocalData(key, [newProgram, ...local]);
  return newProgram;
}

export async function deleteTrainingProgramApi(programId) {
  try {
    const res = await fetch(`/api/training/programs/${programId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const key = 'matruong_trainer_programs';
  const local = getLocalData(key, []);
  const updated = local.filter(p => String(p.id) !== String(programId));
  setLocalData(key, updated);
  return { success: true };
}

export async function recordTelemetryApi(telemetryData) {
  try {
    const res = await fetch('/api/training/telemetry', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(telemetryData)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const key = 'matruong_training_telemetry';
  const local = getLocalData(key, []);
  const teleId = telemetryData.id;

  // Chống nhân bản buổi tập trong fallback cache
  const exists = local.some(s =>
    (teleId && String(s.id) === String(teleId)) ||
    ((s.horseName || '').trim().toLowerCase() === (telemetryData.horseName || '').trim().toLowerCase() &&
     (s.programTitle || '').trim().toLowerCase() === (telemetryData.programTitle || '').trim().toLowerCase() &&
     String(s.time || '').trim() === String(telemetryData.time || '').trim())
  );

  if (exists) {
    return telemetryData;
  }

  const newEntry = { ...telemetryData, id: teleId || Date.now() };
  setLocalData(key, [newEntry, ...local]);
  return newEntry;
}

export async function getTrainerNominationsApi() {
  try {
    const res = await fetch('/api/trainer/nominations', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  return getLocalData('matruong_trainer_nominations', [
    {
      id: 'RN-TR-01',
      raceName: 'Giải Vô Địch Cúp Derby Mùa Thu 2026',
      horseName: 'Bạch Long',
      distance: '2.400m',
      status: 'APPROVED',
      trainerNotes: 'Chiến mã đạt phong độ 9.6/10. Đề cử làn chạy số 3.'
    },
    {
      id: 'RN-TR-02',
      raceName: 'Cúp Nước Rút Tốc Độ Sprint Cup 1.200m',
      horseName: 'Lôi Chấn',
      distance: '1.200m',
      status: 'PENDING',
      trainerNotes: 'Nước rút tốt, cần Chủ ngựa xác nhận kinh phí.'
    }
  ]);
}

export async function updateTrainerFeedbackApi(horseId, feedback) {
  try {
    const res = await fetch(`/api/trainer/feedback/${horseId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ feedback })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const key = `matruong_trainer_feedback_${horseId}`;
  setLocalData(key, { feedback, updatedAt: new Date().toISOString() });
  return true;
}


// =========================================================================
// 9. VAI TRÒ 3: BÁC SĨ THÚ Y (VETERINARY MEDICINE API)
// =========================================================================

export async function getVetMedicalLogsApi() {
  try {
    const res = await fetch('/api/vet/medical-logs', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  return getLocalData('matruong_vet_medical_logs', [
    {
      id: 1,
      horseName: 'Phi Yến',
      chipId: 'MC-VN-2023-009',
      issue: 'Giãn gân trước trái cấp độ 2',
      severity: 'CRITICAL',
      diagnosisBy: 'Bác sĩ Nguyễn An (Trưởng khoa)',
      medications: 'Phenylbutazone 20% tiêm IV + Băng ép Cryo',
      status: 'UNDER_TREATMENT',
      statusText: 'Đang điều trị tích cực',
      locked: true,
      date: '09/10/2026',
      vetNote: 'Đã kích hoạt Lệnh Khóa Y Tế. Cấm chạy nước rút tối thiểu 3 tuần.'
    },
    {
      id: 2,
      horseName: 'Bạch Long',
      chipId: 'MC-VN-2024-003',
      issue: 'Kiểm tra sinh hiệu định kỳ & Gọt móng',
      severity: 'NORMAL',
      diagnosisBy: 'Bác sĩ Nguyễn An',
      medications: 'Vaccine Cúm ngựa (Equine Influenza)',
      status: 'CLEARED',
      statusText: 'Khỏe mạnh xuất sắc',
      locked: false,
      date: '10/10/2026',
      vetNote: 'Thể lực hoàn hảo, nhịp tim nghỉ 37 bpm. Đủ điều kiện xuất phát.'
    }
  ]);
}

export async function createMedicalLogApi(logData) {
  try {
    const res = await fetch('/api/vet/medical-logs', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(logData)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const key = 'matruong_vet_medical_logs';
  const existing = await getVetMedicalLogsApi();
  const newLog = { ...logData, id: Date.now() };
  setLocalData(key, [newLog, ...existing]);
  return newLog;
}

export async function getVaccinationSchedulesApi() {
  try {
    const res = await fetch('/api/vet/vaccines', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  return getLocalData('matruong_vet_vaccines', [
    { id: 1, horseName: 'Xích Thố', vaccineType: 'Cúm ngựa (Equine Influenza) liều 2', scheduledDate: '15/11/2026', status: 'SCHEDULED' },
    { id: 2, horseName: 'Hắc Phong', vaccineType: 'Phòng uốn ván (Tetanus Toxoid)', scheduledDate: '20/11/2026', status: 'SCHEDULED' },
    { id: 3, horseName: 'Bạch Long', vaccineType: 'Viêm não ngựa (EHV-1)', scheduledDate: '05/12/2026', status: 'PENDING' }
  ]);
}

export async function recordVaccinationApi(vaccineData) {
  try {
    const res = await fetch('/api/vet/vaccines', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(vaccineData)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const key = 'matruong_vet_vaccines';
  const existing = await getVaccinationSchedulesApi();
  const created = { ...vaccineData, id: Date.now(), status: 'COMPLETED' };
  setLocalData(key, [created, ...existing]);
  return created;
}

export async function getVetHealthOverviewApi() {
  try {
    const res = await fetch('/api/vet/overview', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  return {
    totalChecked: 12,
    fitForRace: 10,
    medicalLocked: 1,
    inRehab: 1,
    emergencyAlerts: 0
  };
}


// =========================================================================
// 10. VAI TRÒ 4: NHÂN VIÊN CHĂM SÓC (GROOM PORTAL API)
// =========================================================================

export async function getGroomAssignmentsApi(groomId = 'groom_nam') {
  try {
    const res = await fetch(`/api/groom/assignments?groomId=${groomId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  return getLocalData('matruong_groom_assignments', [
    { stallCode: 'A1', horseName: 'Xích Thố', block: 'Block A', beddingStatus: 'CLEAN', lastMucked: '06:30 - Sáng nay', waterBucketClean: true },
    { stallCode: 'A2', horseName: 'Bạch Long', block: 'Block A', beddingStatus: 'CLEAN', lastMucked: '07:00 - Sáng nay', waterBucketClean: true },
    { stallCode: 'A3', horseName: 'Hắc Phong', block: 'Block A', beddingStatus: 'CLEAN', lastMucked: '07:15 - Sáng nay', waterBucketClean: true },
    { stallCode: 'A4', horseName: 'Lôi Chấn', block: 'Block A', beddingStatus: 'ATTENTION', lastMucked: 'Hôm qua', waterBucketClean: false },
    { stallCode: 'A5', horseName: 'Phi Yến', block: 'Block A', beddingStatus: 'CLEAN (Y TẾ)', lastMucked: '06:00 - Sáng nay', waterBucketClean: true }
  ]);
}

export async function getFeedingSchedulesApi() {
  try {
    const res = await fetch('/api/groom/feeding', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  return getLocalData('matruong_groom_feeding', [
    { id: 1, meal: 'Bữa Sáng (06:00)', ration: '3.5kg Yến mạch + 5kg Cỏ Timothy + Điện giải', status: 'COMPLETED', timeCompleted: '06:15' },
    { id: 2, meal: 'Bữa Trưa (11:30)', ration: '4kg Cỏ tươi Alfalfa + Men tiêu hóa', status: 'PENDING', timeCompleted: null },
    { id: 3, meal: 'Bữa Chiều Tối (17:00)', ration: '3kg Ngũ cốc đậm đặc + Bổ sung Canxi & Khớp', status: 'PENDING', timeCompleted: null }
  ]);
}

export async function updateFeedingStatusApi(scheduleId, isCompleted) {
  try {
    const res = await fetch(`/api/groom/feeding/${scheduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ isCompleted })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const key = 'matruong_groom_feeding';
  const schedules = await getFeedingSchedulesApi();
  const updated = schedules.map(s => s.id === scheduleId ? {
    ...s,
    status: isCompleted ? 'COMPLETED' : 'PENDING',
    timeCompleted: isCompleted ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null
  } : s);
  setLocalData(key, updated);
  return true;
}

export async function getCareLogsApi() {
  try {
    const res = await fetch('/api/groom/care-logs', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  return getLocalData('matruong_groom_care_logs', [
    { id: 1, task: 'Tắm xả cơ bắp bằng vòi lạnh & sấy khô', horseName: 'Bạch Long', groomName: 'Lê Hoàng Nam', date: '24/10/2026', status: 'DONE' },
    { id: 2, task: 'Vệ sinh hốc móng & thoa dầu móng chống nứt', horseName: 'Xích Thố', groomName: 'Lê Hoàng Nam', date: '24/10/2026', status: 'DONE' },
    { id: 3, task: 'Băng ép lạnh khớp gân theo chỉ định bác sĩ', horseName: 'Phi Yến', groomName: 'Lê Hoàng Nam', date: '24/10/2026', status: 'DONE' }
  ]);
}

export async function recordCareActivityApi(activityData) {
  try {
    const res = await fetch('/api/groom/care-logs', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(activityData)
    });
    if (res.ok) {
      const data = await res.json();
      const key = 'matruong_groom_care_logs';
      const list = getLocalData(key, []);
      setLocalData(key, [data, ...list]);
      return data;
    }
  } catch {}
  const key = 'matruong_groom_care_logs';
  const list = await getCareLogsApi();
  const newActivity = { ...activityData, id: Date.now(), status: 'DONE', date: new Date().toLocaleDateString('vi-VN') };
  setLocalData(key, [newActivity, ...list]);
  return newActivity;
}

export async function getSuppliesInventoryApi() {
  try {
    const res = await fetch('/api/groom/supplies', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  return getLocalData('matruong_groom_supplies', [
    { name: 'Rơm khô lót chuồng khử khuẩn', inStock: '45 bao', minAlert: '10 bao', status: 'SUFFICIENT' },
    { name: 'Cỏ khô Timothy nhập khẩu', inStock: '32 kiện', minAlert: '8 kiện', status: 'SUFFICIENT' },
    { name: 'Yến mạch dinh dưỡng thi đấu', inStock: '12 bao', minAlert: '5 bao', status: 'SUFFICIENT' },
    { name: 'Dầu móng dưỡng ẩm cao cấp', inStock: '4 chai', minAlert: '5 chai', status: 'LOW' }
  ]);
}

export async function requestSupplyRestockApi(supplyName, quantity) {
  try {
    const res = await fetch('/api/groom/supplies', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ supplyName, quantity })
    });
    if (res.ok) {
      const data = await res.json();
      const key = 'matruong_groom_restock_requests';
      const requests = getLocalData(key, []);
      setLocalData(key, [data, ...requests]);
      return data;
    }
  } catch {}
  const key = 'matruong_groom_restock_requests';
  const requests = getLocalData(key, []);
  const newReq = { id: Date.now(), supplyName, quantity, status: 'SUBMITTED', date: new Date().toLocaleDateString('vi-VN') };
  setLocalData(key, [newReq, ...requests]);
  return newReq;
}


// =========================================================================
// 11. VAI TRÒ 5: CHỦ SỞ HỮU NGỰA (RACEHORSE OWNER API)
// =========================================================================

export async function getOwnerHorsesApi(ownerKey) {
  try {
    const res = await fetch(`/api/owner/horses?ownerKey=${ownerKey}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  const storageKey = `matruong_owner_horses_${ownerKey}`;
  return getLocalData(storageKey, []);
}

export async function registerOwnerHorseApi(ownerKey, horseData) {
  try {
    const res = await fetch('/api/owner/horses', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ ownerKey, ...horseData })
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const storageKey = `matruong_owner_horses_${ownerKey}`;
  const existing = getLocalData(storageKey, []);
  const newHorse = {
    ...horseData,
    id: horseData.id || Date.now(),
    status: 'ELIGIBLE',
    statusText: 'Đủ chuẩn thi đấu',
    winCount: 0,
    totalStarts: 0,
    totalPrizeEarned: 0
  };
  const filtered = existing.filter(h =>
    String(h.id) !== String(newHorse.id) &&
    (!newHorse.microchip || (h.microchip || '').toLowerCase() !== (newHorse.microchip || '').toLowerCase()) &&
    (!newHorse.name || (h.name || '').toLowerCase() !== (newHorse.name || '').toLowerCase())
  );
  const nextList = [newHorse, ...filtered];
  setLocalData(storageKey, nextList);

  return newHorse;
}

export async function updateOwnerHorseApi(ownerKey, horseData) {
  try {
    const res = await fetch(`/api/owner/horses/${horseData.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ ownerKey, ...horseData })
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const storageKey = `matruong_owner_horses_${ownerKey}`;
  const existing = getLocalData(storageKey, []);
  let found = false;
  const updated = existing.map(h => {
    if (String(h.id) === String(horseData.id) || (h.microchip && horseData.microchip && h.microchip.toLowerCase() === horseData.microchip.toLowerCase())) {
      found = true;
      return { ...h, ...horseData };
    }
    return h;
  });
  if (!found) updated.unshift(horseData);
  const seen = new Set();
  const deduped = updated.filter(h => {
    const k = (h.microchip || h.id || h.name || '').toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  setLocalData(storageKey, deduped);

  return horseData;
}

export async function deleteOwnerHorseApi(ownerKey, horseId) {
  try {
    const res = await fetch(`/api/owner/horses/${horseId}?ownerKey=${ownerKey}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const storageKey = `matruong_owner_horses_${ownerKey}`;
  const existing = getLocalData(storageKey, []);
  const filtered = existing.filter(h => String(h.id) !== String(horseId));
  setLocalData(storageKey, filtered);


  return true;
}

export async function getOwnerTelemetryApi(ownerKey) {
  try {
    const res = await fetch('/api/training/telemetry', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  const key = `matruong_owner_telemetry_${ownerKey}`;
  return getLocalData(key, []);
}

export async function getOpenTournamentsApi() {
  try {
    const res = await fetch('/api/owner/tournaments', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  return [
    {
      id: 'TOURN-2026-01',
      name: 'Giải Vô Địch Cúp Derby Mùa Thu 2026 (Group 1)',
      track: 'Trường đua Quốc tế Phú Thọ',
      surface: 'Sân cỏ Tự nhiên (Turf)',
      distance: '2.400m',
      date: '15/11/2026',
      entryDeadline: '01/11/2026',
      totalPurse: 1500000000,
      entryFee: 10000000,
      description: 'Giải đấu danh giá nhất năm dành cho các chiến mã 3-5 tuổi.'
    },
    {
      id: 'TOURN-2026-02',
      name: 'Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)',
      track: 'Trường đua Cát Thể Thao',
      surface: 'Sân cát Nén (Dirt)',
      distance: '1.200m',
      date: '28/11/2026',
      entryDeadline: '10/11/2026',
      totalPurse: 800000000,
      entryFee: 5000000,
      description: 'Thử thách guồng chân tốc độ cực đại, yêu cầu bứt phá 60 km/h.'
    },
    {
      id: 'TOURN-2026-03',
      name: 'Giải Tranh Cúp Chiến Mã Trẻ Mùa Mới (Group 3)',
      track: 'Trường đua Quốc tế Phú Thọ',
      surface: 'Sân cỏ Tự nhiên (Turf)',
      distance: '1.600m',
      date: '08/12/2026',
      entryDeadline: '20/11/2026',
      totalPurse: 500000000,
      entryFee: 3000000,
      description: 'Dành riêng cho ngựa đua 3 tuổi mới gia nhập chuồng trại.'
    },
    {
      id: 'TOURN-2026-04',
      name: 'Cúp Mùa Đông Toàn Quốc Listed Cup',
      track: 'Trường đua Cao nguyên',
      surface: 'Sân cát Nén (Dirt)',
      distance: '1.800m',
      date: '24/12/2026',
      entryDeadline: '05/12/2026',
      totalPurse: 400000000,
      entryFee: 2500000,
      description: 'Giải đấu thử nghiệm sức bền thể lực cuối năm.'
    }
  ];
}

export async function getOwnerRacesApi(ownerKey) {
  try {
    const res = await fetch(`/api/owner/races?ownerKey=${ownerKey}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  const key = `matruong_owner_races_${ownerKey}`;
  return getLocalData(key, []);
}

const SYSTEM_NOMINATIONS_KEY = 'matruong_tournament_nominations_system';

export async function getSystemTournamentNominationsApi() {
  try {
    const res = await fetch('/api/trainer/nominations', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  const defaultSeed = [];

  let rawData = getLocalData(SYSTEM_NOMINATIONS_KEY, defaultSeed);
  if (Array.isArray(rawData)) {
    let changed = false;
    rawData = rawData.map(item => {
      if ((item.id === 'RN-2026-01' || item.id === 'RN-2026-02') && (item.ownerKey === 'owner_tuan' || item.ownerKey === 'owner_vu')) {
        changed = true;
        return { ...item, ownerKey: '6', ownerName: 'Chủ sở hữu' };
      }
      return item;
    });
    if (changed) {
      setLocalData(SYSTEM_NOMINATIONS_KEY, rawData);
    }
  }
  return rawData;
}

export async function trainerReviewNominationApi(nominationId, { status, feedback, trainerName, assignedHorseName, assignedHorseId, assignedHorseStall, jockey }) {
  try {
    const res = await fetch('/api/trainer/nominations/review', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ nominationId, status, feedback, trainerName, assignedHorseName, assignedHorseId, assignedHorseStall, jockey })
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const systemList = await getSystemTournamentNominationsApi();
  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  let targetNomination = null;
  const updatedSystem = systemList.map(item => {
    if (item.id === nominationId) {
      targetNomination = {
        ...item,
        horseName: assignedHorseName || item.horseName,
        assignedHorseName: assignedHorseName || item.assignedHorseName,
        assignedHorseId: assignedHorseId || item.assignedHorseId,
        assignedHorseStall: assignedHorseStall || item.assignedHorseStall,
        trainerAssigned: Boolean(assignedHorseName || item.trainerAssigned),
        nominationStatus: status,
        trainerFeedback: feedback || (status === 'APPROVED' ? 'Đạt chuẩn thể lực xuất phát' : 'Yêu cầu hoàn thiện bài tập thể lực'),
        reviewedBy: trainerName || 'HLV Trưởng',
        reviewedAt: timeStr,
        jockey: jockey || item.jockey || 'Chưa chỉ định'
      };
      return targetNomination;
    }
    return item;
  });

  setLocalData(SYSTEM_NOMINATIONS_KEY, updatedSystem);

  // Sync to all owner race caches in localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('matruong_owner_races_')) {
          const ownerList = getLocalData(key, []);
          if (Array.isArray(ownerList) && ownerList.length > 0) {
            let modified = false;
            const updatedOwnerList = ownerList.map(r => {
              const isMatch = r.id === nominationId || 
                (targetNomination && r.raceName === targetNomination.raceName && (r.horseName === targetNomination.horseName || r.id === nominationId));
              if (isMatch) {
                modified = true;
                return {
                  ...r,
                  horseName: assignedHorseName || r.horseName,
                  assignedHorseName: assignedHorseName || r.assignedHorseName,
                  assignedHorseId: assignedHorseId || r.assignedHorseId,
                  assignedHorseStall: assignedHorseStall || r.assignedHorseStall,
                  trainerAssigned: Boolean(assignedHorseName || r.trainerAssigned),
                  nominationStatus: status,
                  trainerFeedback: feedback || (status === 'APPROVED' ? 'Đạt chuẩn thể lực xuất phát' : 'Yêu cầu hoàn thiện bài tập thể lực'),
                  reviewedBy: trainerName || 'HLV Trưởng',
                  reviewedAt: timeStr,
                  jockey: jockey || r.jockey || 'Chưa chỉ định'
                };
              }
              return r;
            });
            if (modified) {
              setLocalData(key, updatedOwnerList);
            }
          }
        }
      }

      window.dispatchEvent(new CustomEvent('matruong_nomination_updated', {
        detail: { nominationId, status, feedback, trainerName, reviewedAt: timeStr, targetNomination }
      }));
    }
  } catch (err) {
    console.error('Error syncing owner race storage:', err);
  }

  return true;
}

export async function trainerAssignHorseNominationApi(nominationId, { horseName, horseId, horseStall, trainerFeedback, trainerName, jockey }) {
  return trainerReviewNominationApi(nominationId, {
    status: 'APPROVED',
    feedback: trainerFeedback,
    trainerName: trainerName || 'HLV Trưởng Trần Văn Hùng',
    assignedHorseName: horseName,
    assignedHorseId: horseId,
    assignedHorseStall: horseStall,
    jockey: jockey
  });
}

export async function registerRaceTournamentApi(ownerKey, nominationData) {
  try {
    const res = await fetch('/api/owner/races', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ ownerKey, ...nominationData })
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

  const key = `matruong_owner_races_${ownerKey}`;
  const list = getLocalData(key, []);
  const newNom = {
    ...nominationData,
    id: nominationData.id || `RN-REG-${Date.now().toString().slice(-4)}`,
    nominationStatus: 'PENDING_TRAINER',
    ownerKey: String(ownerKey)
  };
  setLocalData(key, [newNom, ...list]);

  const systemList = await getSystemTournamentNominationsApi();
  setLocalData(SYSTEM_NOMINATIONS_KEY, [newNom, ...systemList.filter(s => s.id !== newNom.id)]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('matruong_nomination_updated', {
      detail: { nominationId: newNom.id, nomination: newNom }
    }));
  }

  return newNom;
}

export async function updateRaceNominationStatusApi(ownerKey, nominationId, newStatus) {
  const key = `matruong_owner_races_${ownerKey}`;
  const list = getLocalData(key, []);
  const updated = list.map(r => r.id === nominationId ? { ...r, nominationStatus: newStatus } : r);
  setLocalData(key, updated);

  const systemList = await getSystemTournamentNominationsApi();
  const updatedSys = systemList.map(r => r.id === nominationId ? { ...r, nominationStatus: newStatus } : r);
  setLocalData(SYSTEM_NOMINATIONS_KEY, updatedSys);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('matruong_nomination_updated', {
      detail: { nominationId, status: newStatus }
    }));
  }

  return true;
}

export async function getOwnerFinancialStatementsApi(ownerKey) {
  try {
    const res = await fetch(`/api/owner/statements?ownerKey=${ownerKey}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback
  }

  const key = `matruong_owner_stmts_${ownerKey}`;
  return getLocalData(key, []);
}

export async function getOwnerVetLogsApi(ownerKey) {
  try {
    const res = await fetch('/api/vet/medical-logs', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  const key = `matruong_owner_health_${ownerKey}`;
  return getLocalData(key, []);
}


// =========================================================================
// 12. CÁC API BỔ SUNG: TOÀN DIỆN CHO VET, GROOM, TRAINING & SERVICE TEAM
// =========================================================================

// --- ĐƠN THUỐC THÚ Y (VET PRESCRIPTIONS) ---
export async function getVetPrescriptionsApi() {
  try {
    const res = await fetch('/api/vet/prescriptions', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  const key = 'matruong_vet_prescriptions';
  return getLocalData(key, [
    {
      id: 'RX-2026-001',
      horseName: 'Phi Yến',
      stall: 'Ô A5',
      diagnosis: 'Giãn gân trước trái độ 2 sau bứt tốc',
      medications: [
        { name: 'Phenylbutazone 20%', dosage: '10ml tiêm IV', frequency: '1 lần/ngày' },
        { name: 'Gel lạnh giảm đau Cryo', dosage: 'Thoa ngoài da', frequency: '2 lần/ngày' }
      ],
      restrictions: 'Cấm tập nặng, băng ép chân trái, theo dõi thân nhiệt.',
      date: '10/10/2026',
      status: 'ACTIVE'
    },
    {
      id: 'RX-2026-002',
      horseName: 'Hắc Phong',
      stall: 'Ô A3',
      diagnosis: 'Đầy hơi nhẹ đường tiêu hóa (Colic nhẹ)',
      medications: [
        { name: 'Omeprazole Paste', dosage: '1 ống uống buổi sáng', frequency: '1 lần/ngày' },
        { name: 'Men vi sinh Probiotics', dosage: 'Hòa vào nước uống', frequency: '2 lần/ngày' }
      ],
      restrictions: 'Cho ăn cỏ khô Alfalfa chia nhỏ, tạm ngưng cám viên đậm đặc.',
      date: '11/10/2026',
      status: 'ACTIVE'
    }
  ]);
}

export async function createVetPrescriptionApi(prescriptionData) {
  try {
    const res = await fetch('/api/vet/prescriptions', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(prescriptionData)
    });
    if (res.ok) return await res.json();
  } catch {}

  const key = 'matruong_vet_prescriptions';
  const existing = await getVetPrescriptionsApi();
  const newRx = {
    ...prescriptionData,
    id: prescriptionData.id || `RX-2026-00${existing.length + 1}`,
    date: prescriptionData.date || new Date().toLocaleDateString('vi-VN'),
    status: 'ACTIVE'
  };
  setLocalData(key, [newRx, ...existing]);
  return newRx;
}

// --- DUYỆT ĐỦ ĐIỀU KIỆN THI ĐẤU (VET RACE CLEARANCE) ---
export async function getVetClearanceListApi() {
  try {
    const res = await fetch('/api/vet/race-clearance', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  const key = 'matruong_vet_race_clearance';
  return getLocalData(key, []);
}

export async function updateVetClearanceApi(clearanceId, newStatus, notes) {
  try {
    const res = await fetch(`/api/vet/race-clearance/${clearanceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ vetStatus: newStatus, notes })
    });
    if (res.ok) return true;
  } catch {}

  const key = 'matruong_vet_race_clearance';
  const list = await getVetClearanceListApi();
  const updated = list.map(item => item.id === clearanceId ? { ...item, vetStatus: newStatus, notes: notes || item.notes } : item);
  setLocalData(key, updated);
  return true;
}

// --- GROOM CHECKLIST CA TRỰC HÀNG NGÀY ---
export async function getGroomRoutinesApi() {
  try {
    const res = await fetch('/api/groom/routines', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  const key = 'matruong_groom_routines';
  return getLocalData(key, [
    { id: 1, time: '06:00', title: 'Kiểm tra sinh hiệu buổi sáng', desc: 'Đo thân nhiệt & quan sát dáng đứng toàn bộ 5 ô chuồng Block A', completed: true },
    { id: 2, time: '06:30', title: 'Cấp khẩu phần ăn sáng', desc: 'Cân đo khẩu phần yến mạch & cỏ khô Timothy theo y bạ dinh dưỡng', completed: true },
    { id: 3, time: '07:30', title: 'Muck-out & thay đệm rơm', desc: 'Thu gom phân, phun khử khuẩn sàn và rải đệm rơm mới ô A1, A2, A3', completed: true },
    { id: 4, time: '09:00', title: 'Chải lông & bấm móng', desc: 'Chải mượt bờm lông, kiểm tra móng sắt trước giờ tập sân cỏ', completed: false },
    { id: 5, time: '11:30', title: 'Cấp nước điện giải & cỏ tươi', desc: 'Kiểm tra phao tự động và bổ sung muối khoáng máng nước', completed: false },
    { id: 6, time: '16:00', title: 'Tắm lạnh xả cơ sau bài tập', desc: 'Xịt nước lạnh gân chân, sấy khô và đắp mền giữ ấm ban đêm', completed: false }
  ]);
}

export async function toggleGroomRoutineApi(routineId, completed) {
  try {
    const res = await fetch(`/api/groom/routines/${routineId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ completed })
    });
    if (res.ok) return true;
  } catch {}

  const key = 'matruong_groom_routines';
  const list = await getGroomRoutinesApi();
  const updated = list.map(r => r.id === routineId ? { ...r, completed } : r);
  setLocalData(key, updated);
  return true;
}

// --- GROOM CẬP NHẬT TÌNH TRẠNG Ô CHUỒNG ---
export async function getGroomStallsApi() {
  try {
    const res = await fetch('/api/groom/stalls', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  const key = 'matruong_groom_stalls_state';
  return getLocalData(key, [
    { code: 'A1', horseName: null, breed: 'Trống', microchip: 'N/A', bedding: 'Mùn cưa sạch', waterLevel: '100%', temp: '26.5°C', lastCleaned: 'Sáng nay', status: 'AVAILABLE', note: 'Ô chuồng sạch sẽ sẵn sàng' },
    { code: 'A2', horseName: null, breed: 'Trống', microchip: 'N/A', bedding: 'Rơm khô mới', waterLevel: '100%', temp: '26.8°C', lastCleaned: 'Sáng nay', status: 'AVAILABLE', note: 'Ô chuồng sạch sẽ sẵn sàng' },
    { code: 'A3', horseName: null, breed: 'Trống', microchip: 'N/A', bedding: 'Mùn cưa sạch', waterLevel: '100%', temp: '27.1°C', lastCleaned: 'Sáng nay', status: 'AVAILABLE', note: 'Ô chuồng sạch sẽ sẵn sàng' },
    { code: 'A4', horseName: null, breed: 'Trống', microchip: 'N/A', bedding: 'Rơm khô sạch', waterLevel: '100%', temp: '26.6°C', lastCleaned: 'Sáng nay', status: 'AVAILABLE', note: 'Ô chuồng sạch sẽ sẵn sàng' }
  ]);
}

export async function updateGroomStallStatusApi(stallCode, updates) {
  try {
    const res = await fetch(`/api/groom/stalls/${stallCode}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    if (res.ok) return true;
  } catch {}

  const key = 'matruong_groom_stalls_state';
  const list = await getGroomStallsApi();
  const updated = list.map(s => s.code === stallCode ? { ...s, ...updates } : s);
  setLocalData(key, updated);
  return true;
}

// --- DỊCH VỤ PHÂN CÔNG ĐỘI NGŨ & XÁC NHẬN (SERVICE TEAM ASSIGNMENT) ---
export async function getServiceAssignmentsApi() {
  try {
    const res = await fetch('/api/service-assignments', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  const key = 'matruong_service_assignments';
  return getLocalData(key, []);
}

export async function saveServiceAssignmentApi(assignment) {
  try {
    const res = await fetch('/api/service-assignments', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(assignment)
    });
    if (res.ok) return await res.json();
  } catch {}

  const key = 'matruong_service_assignments';
  const list = await getServiceAssignmentsApi();
  const nextList = [assignment, ...list.filter(item => item.id !== assignment.id)];
  setLocalData(key, nextList);
  return assignment;
}

export async function confirmServiceAssignmentApi(horseIdentifier, roleType, staffUsername) {
  try {
    const res = await fetch('/api/service-assignments/confirm', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ horseIdentifier, roleType, staffUsername })
    });
    if (res.ok) return await res.json();
  } catch {}

  const key = 'matruong_service_assignments';
  const list = await getServiceAssignmentsApi();
  const nowStr = new Date().toLocaleDateString('vi-VN');
  const targetKey = String(horseIdentifier).toLowerCase();

  const nextList = list.map(item => {
    const match = (item.microchip && item.microchip.toLowerCase() === targetKey) ||
                  (item.horseName && item.horseName.toLowerCase() === targetKey) ||
                  String(item.id) === targetKey;
    if (!match) return item;

    if (roleType === 'TRAINER') {
      return { ...item, trainerStatus: 'CONFIRMED', trainerConfirmedAt: nowStr, trainerConfirmedBy: staffUsername };
    }
    if (roleType === 'VET') {
      return { ...item, vetStatus: 'CONFIRMED', vetConfirmedAt: nowStr, vetConfirmedBy: staffUsername };
    }
    if (roleType === 'GROOM') {
      return { ...item, groomStatus: 'CONFIRMED', groomConfirmedAt: nowStr, groomConfirmedBy: staffUsername };
    }
    return item;
  });

  setLocalData(key, nextList);
  return nextList;
}

// --- CẬP NHẬT CÂY PHẢ HỆ CHO CHIẾN MÃ (PEDIGREE UPDATE) ---
export async function updateHorsePedigreeApi(ownerKey, horseId, pedigreeData) {
  try {
    const res = await fetch(`/api/owner/horses/${horseId}/pedigree`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ ownerKey, pedigree: pedigreeData })
    });
    if (res.ok) return await res.json();
  } catch {}

  const storageKey = `matruong_owner_horses_${ownerKey}`;
  const existing = getLocalData(storageKey, []);
  const updated = existing.map(h => String(h.id) === String(horseId) ? { ...h, pedigree: pedigreeData } : h);
  setLocalData(storageKey, updated);
  return pedigreeData;
}

// =========================================================================
// 13. QUẢN LÝ THÔNG BÁO HỆ THỐNG LIÊN THÔNG (SYSTEM NOTIFICATIONS API)
// =========================================================================

export async function getNotificationsApi(role = 'ALL', username = '') {
  try {
    const params = new URLSearchParams();
    if (role && role !== 'ALL') params.append('role', role);
    if (username) params.append('username', username);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/notifications${queryString}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        try {
          const rawRead = localStorage.getItem('matruong_read_notification_ids');
          const readIds = rawRead ? new Set(JSON.parse(rawRead).map(String)) : new Set();
          return data.map(item => {
            const isRead = item.isRead === true || readIds.has(String(item.id)) || (Array.isArray(item.readBy) && (item.readBy.includes(username) || item.readBy.includes('ALL')));
            return {
              ...item,
              isRead,
              readBy: isRead && (!item.readBy || item.readBy.length === 0) ? ['ALL'] : (item.readBy || [])
            };
          });
        } catch {
          return data;
        }
      }
    }
  } catch {}
  return getLocalData('matruong_system_notifications', []);
}

export async function createNotificationApi(notifData) {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(notifData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return notifData;
}

export async function markNotificationReadApi(notifId, username, markAll = false) {
  try {
    const res = await fetch('/api/notifications/read', {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ id: notifId, username, markAll })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { success: true };
}

export async function clearNotificationsApi() {
  try {
    const res = await fetch('/api/notifications/clear', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { success: true };
}


// =========================================================================
// 14. QUẢN LÝ KHIẾU NẠI & BÁO CÁO NHÂN SỰ (PERSONNEL REPORTS API)
// =========================================================================

/**
 * Lấy danh sách khiếu nại & báo cáo nhân sự (kèm lọc theo chủ sở hữu)
 */
export async function getPersonnelReportsApi(ownerKey = '') {
  try {
    const url = ownerKey ? `/api/reports?ownerKey=${encodeURIComponent(ownerKey)}` : '/api/reports';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}

  const key = 'matruong_personnel_reports';
  const list = getLocalData(key, []);
  if (!ownerKey || ownerKey === 'ALL') return list;
  return list.filter(r => (r.ownerKey || '').toLowerCase() === ownerKey.toLowerCase());
}

/**
 * Chủ sở hữu gửi khiếu nại nhân sự mới
 */
export async function createPersonnelReportApi(reportData) {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(reportData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_personnel_reports';
  const list = getLocalData(key, []);
  const newReport = {
    ...reportData,
    id: reportData.id || Date.now(),
    createdAt: reportData.createdAt || new Date().toLocaleString('vi-VN'),
    status: reportData.status || 'PENDING'
  };
  const updatedList = [newReport, ...list.filter(item => String(item.id) !== String(newReport.id))];
  setLocalData(key, updatedList);
  return newReport;
}

/**
 * Ban Quản Trị tiếp nhận, cập nhật thẩm tra và kết luận xử lý khiếu nại
 */
export async function updateReportAdminReviewApi(reportId, reviewData) {
  try {
    const res = await fetch(`/api/reports/${reportId}/review`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(reviewData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_personnel_reports';
  const list = getLocalData(key, []);
  const index = list.findIndex(r => String(r.id) === String(reportId));
  if (index !== -1) {
    const nowStr = new Date().toLocaleString('vi-VN');
    const updated = {
      ...list[index],
      ...reviewData,
      status: reviewData.status || list[index].status,
      adminNotes: reviewData.adminNotes !== undefined ? reviewData.adminNotes : list[index].adminNotes,
      adminAction: reviewData.adminAction !== undefined ? reviewData.adminAction : list[index].adminAction,
      adminFeedback: reviewData.adminFeedback !== undefined ? reviewData.adminFeedback : list[index].adminFeedback,
      resolvedBy: reviewData.adminUser?.username || 'admin',
      resolvedAt: (reviewData.status === 'RESOLVED' || reviewData.status === 'DISMISSED') ? nowStr : list[index].resolvedAt
    };
    list[index] = updated;
    setLocalData(key, list);
    return updated;
  }
  return null;
}

/**
 * Xóa bản ghi khiếu nại khỏi hệ thống
 */
export async function deletePersonnelReportApi(reportId) {
  try {
    const res = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_personnel_reports';
  const list = getLocalData(key, []);
  const nextList = list.filter(r => String(r.id) !== String(reportId));
  setLocalData(key, nextList);
  return nextList;
}

// =========================================================================
// 15. ĐẶT LỊCH HUẤN LUYỆN CHUNG (JOINT TRAINING SESSIONS API)
// =========================================================================

/**
 * Lấy danh sách lịch hẹn huấn luyện chung giữa Chủ sở hữu và Huấn luyện viên
 */
export async function getJointTrainingSessionsApi(trainerUsername = '', sessionDate = '') {
  try {
    let url = '/api/training/joint-sessions';
    const params = [];
    if (trainerUsername) params.push(`trainerUsername=${encodeURIComponent(trainerUsername)}`);
    if (sessionDate) params.push(`sessionDate=${encodeURIComponent(sessionDate)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}

  const key = 'matruong_joint_training_sessions';
  const list = getLocalData(key, []);
  return list.filter(s => {
    if (trainerUsername && s.trainerUsername !== trainerUsername) return false;
    if (sessionDate && s.sessionDate !== sessionDate) return false;
    return true;
  });
}

/**
 * Chủ sở hữu đặt lịch hẹn tập luyện chung
 */
export async function bookJointTrainingSessionApi(sessionData) {
  try {
    const res = await fetch('/api/training/joint-sessions/book', {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(sessionData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_joint_training_sessions';
  const list = getLocalData(key, []);
  const newSession = {
    ...sessionData,
    id: sessionData.id || Date.now(),
    status: sessionData.status || 'PENDING',
    createdAt: sessionData.createdAt || new Date().toLocaleString('vi-VN')
  };
  const updatedList = [newSession, ...list.filter(s => String(s.id) !== String(newSession.id))];
  setLocalData(key, updatedList);
  return newSession;
}

/**
 * HLV phê duyệt & xác nhận buổi hẹn tập luyện chung
 */
export async function confirmJointTrainingSessionApi(sessionId, feedback = '', trainerUser = null) {
  try {
    const res = await fetch(`/api/training/joint-sessions/${sessionId}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ feedback, trainerUser })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_joint_training_sessions';
  const list = getLocalData(key, []);
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index !== -1) {
    const updated = {
      ...list[index],
      status: 'CONFIRMED',
      trainerFeedback: feedback,
      confirmedAt: new Date().toLocaleString('vi-VN'),
      confirmedBy: trainerUser?.username || 'trainer'
    };
    list[index] = updated;
    setLocalData(key, list);
    return updated;
  }
  return null;
}

/**
 * HLV từ chối buổi hẹn tập luyện chung kèm lý do
 */
export async function rejectJointTrainingSessionApi(sessionId, reason = '', trainerUser = null) {
  try {
    const res = await fetch(`/api/training/joint-sessions/${sessionId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ reason, trainerUser })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_joint_training_sessions';
  const list = getLocalData(key, []);
  const index = list.findIndex(s => String(s.id) === String(sessionId));
  if (index !== -1) {
    const updated = {
      ...list[index],
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedAt: new Date().toLocaleString('vi-VN'),
      rejectedBy: trainerUser?.username || 'trainer'
    };
    list[index] = updated;
    setLocalData(key, list);
    return updated;
  }
  return null;
}

/**
 * Hủy lịch hẹn tập luyện chung
 */
export async function cancelJointTrainingSessionApi(sessionId) {
  try {
    const res = await fetch(`/api/training/joint-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'matruong_joint_training_sessions';
  const list = getLocalData(key, []);
  const nextList = list.filter(s => String(s.id) !== String(sessionId));
  setLocalData(key, nextList);
  return nextList;
}

// =========================================================================
// 16. ĐÁNH GIÁ THỂ LỰC & CHỈ SỐ AI SỨC KHỎE CHIẾN MÃ (FITNESS TELEMETRY API)
// =========================================================================

/**
 * Lấy dữ liệu viễn trắc & thể lực của chiến mã
 */
export async function getHorseFitnessApi(horseIdOrChip) {
  try {
    const res = await fetch(`/api/horses/${encodeURIComponent(horseIdOrChip)}/fitness`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'racehorse_fitness_telemetry';
  const all = getLocalData(key, {});
  return all[horseIdOrChip] || null;
}

/**
 * Lưu kết quả đánh giá thể lực & sinh lý chiến mã
 */
export async function saveHorseFitnessAssessmentApi(horseIdOrChip, fitnessData) {
  try {
    const res = await fetch(`/api/horses/${encodeURIComponent(horseIdOrChip)}/fitness`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(fitnessData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const key = 'racehorse_fitness_telemetry';
  const all = getLocalData(key, {});
  all[horseIdOrChip] = fitnessData;
  setLocalData(key, all);
  return fitnessData;
}
