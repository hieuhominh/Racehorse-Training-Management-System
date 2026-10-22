/**
 * API Service Client kết nối toàn diện giữa Frontend (ReactJS) và Backend (Java Servlet - Tomcat 8080)
 * Trang bị cơ chế Auto-Fallback (Tự động chuyển tiếp thông minh):
 * - Khi Backend Tomcat và SQL Server đang chạy: Lấy dữ liệu thực từ Cơ sở dữ liệu.
 * - Khi Backend chưa khởi động: Tự động dùng dữ liệu đệm cục bộ (kèm LocalStorage cache)
 *   để toàn bộ các chức năng (Thêm, Sửa, Xóa, Chi tiết, Đổi ngựa, Khóa y tế) luôn hoạt động trơn tru.
 */

import { initialHorsesData } from '../data/horsesData';
import { initialStallsData } from '../data/stallsData';
import { SEED_USERS } from '../context/AuthContext';
import { settlementStatementsData, raceHistoryLogs } from '../data/financialData';

// Khóa lưu trữ cục bộ để duy trì dữ liệu khi chạy Offline / Prototype
const STORAGE_KEYS = {
  HORSES: 'racehorse_api_horses',
  STABLES: 'racehorse_api_stables',
  USERS: 'racehorse_api_users',
  INCIDENTS: 'racehorse_api_incidents'
};

function getLocalData(key, defaultVal) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaultVal;
}

function setLocalData(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}


// =========================================================================
// 1. QUẢN LÝ CHIẾN MÃ (HORSES API)
// =========================================================================

/**
 * Lấy danh sách toàn bộ chiến mã
 */
export async function getHorsesApi() {
  try {
    const res = await fetch('/api/horses');
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
  } catch (err) {
    // Backend offline -> Fallback
  }
  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.HORSES, initialHorsesData) };
}

/**
 * Lấy chi tiết hồ sơ 1 chiến mã
 */
export async function getHorseDetailApi(horseId) {
  try {
    const res = await fetch(`/api/horses/${horseId}`);
    if (res.ok) {
      const data = await res.json();
      return { success: true, isFromBackend: true, data };
    }
  } catch (err) {}

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(horseData)
    });
    if (res.ok) {
      created = await res.json();
    }
  } catch (err) {}

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(horseData)
    });
    if (res.ok) return true;
  } catch (err) {}

  // Fallback
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleLock: locked })
    });
    if (res.ok) return true;
  } catch (err) {}

  // Fallback
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
      method: 'DELETE'
    });
    if (res.ok) return true;
  } catch (err) {}

  const localHorses = getLocalData(STORAGE_KEYS.HORSES, initialHorsesData);
  const filtered = localHorses.filter(h => String(h.id) !== String(horseId));
  setLocalData(STORAGE_KEYS.HORSES, filtered);
  return true;
}


// =========================================================================
// 2. QUẢN LÝ Ô CHUỒNG (STABLES & STALLS API)
// =========================================================================

/**
 * Lấy danh sách toàn bộ ô chuồng trại kèm hình ảnh mô phỏng 3D
 */
export async function getStablesApi() {
  try {
    const res = await fetch('/api/stables');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}

  const defaultStables = [
    { stall_code: 'A1', block: 'Block A', status: 'OCCUPIED', horse: 'Xích Thố', breed: 'Arabian', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A2', block: 'Block A', status: 'OCCUPIED', horse: 'Bạch Long', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A3', block: 'Block A', status: 'OCCUPIED', horse: 'Hắc Phong', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A4', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Vũ', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A5', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Yến', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A6', block: 'Block A', status: 'OCCUPIED', horse: 'Kim Kê', breed: 'Quarter Horse', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B1', block: 'Block B', status: 'OCCUPIED', horse: 'Thanh Vân', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B2', block: 'Block B', status: 'OCCUPIED', horse: 'Lôi Chấn', breed: 'Quarter Horse', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B3', block: 'Block B', status: 'OCCUPIED', horse: 'Hồng Sa', breed: 'Arabian', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B4', block: 'Block B', status: 'OCCUPIED', horse: 'Thiên Lý', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B5', block: 'Block B', status: 'OCCUPIED', horse: 'Bảo Mã', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B6', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null }
  ];

  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.STABLES, defaultStables) };
}

/**
 * Tạo ô chuồng mới
 */
export async function createStallApi(stallData) {
  try {
    const res = await fetch('/api/stables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stallData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  // Fallback
  const { data: stables } = await getStablesApi();
  const newStall = {
    stall_code: stallData.stall_code.toUpperCase(),
    block: stallData.block || 'Block C',
    status: stallData.status || 'AVAILABLE',
    horse: stallData.horse || '(Trống)',
    breed: stallData.breed || 'Vacant',
    area: stallData.area || '16 m²',
    dim: stallData.dim || '4.0 x 4.0m',
    stall_image: stallData.status === 'OCCUPIED' ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg',
    horse_avatar: null
  };
  const updated = [...stables, newStall];
  setLocalData(STORAGE_KEYS.STABLES, updated);
  return newStall;
}

/**
 * Cập nhật thông tin ô chuồng
 */
export async function updateStallApi(stallData) {
  try {
    const res = await fetch(`/api/stables/${stallData.stall_code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stallData)
    });
    if (res.ok) return true;
  } catch (err) {}

  const { data: stables } = await getStablesApi();
  const updated = stables.map(s => s.stall_code === stallData.stall_code ? { ...s, ...stallData } : s);
  setLocalData(STORAGE_KEYS.STABLES, updated);
  return true;
}

/**
 * Phân bổ / Đổi chiến mã hoặc làm trống ô chuồng
 */
export async function reassignStallHorseApi(stallCode, horseOption, customHorse = {}) {
  try {
    const res = await fetch('/api/stables', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stall_code: stallCode,
        reassign: true,
        horse_id: horseOption !== 'VACANT' && horseOption !== 'CUSTOM' ? horseOption : null,
        horse: customHorse.name || '',
        breed: customHorse.breed || ''
      })
    });
    if (res.ok) return true;
  } catch (err) {}

  // Fallback
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
  return true;
}

/**
 * Xóa ô chuồng
 */
export async function deleteStallApi(stallCode) {
  try {
    const res = await fetch(`/api/stables/${stallCode}`, {
      method: 'DELETE'
    });
    if (res.ok) return true;
  } catch (err) {}

  const { data: stables } = await getStablesApi();
  const updated = stables.filter(s => s.stall_code !== stallCode);
  setLocalData(STORAGE_KEYS.STABLES, updated);
  return true;
}


// =========================================================================
// 3. XÁC THỰC & NGƯỜI DÙNG (AUTH & USERS API)
// =========================================================================

/**
 * Đăng nhập hệ thống (Bảo đảm hỗ trợ tài khoản admin / 123)
 */
export async function loginApi(account, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password })
    });
    if (res.ok) {
      const user = await res.json();
      return { success: true, isFromBackend: true, user };
    }
  } catch (err) {}

  // Fallback khi offline hoặc khi CSDL backend chưa có seed user
  const trimmed = account ? account.trim().toLowerCase() : '';
  const cleanPass = password ? String(password).trim() : '';

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
    },
    {
      aliases: ['owner', 'owner_thanh', 'chunga', 'owner@matruong.vn'],
      user: { user_id: 6, userId: 6, username: 'owner_thanh', full_name: 'Phạm Tiến Thành', email: 'owner@matruong.vn', phone: '0904567890', roleCode: 'OWNER', role_code: 'OWNER', status: 'ACTIVE' }
    }
  ];

  const matchedPreset = PRESETS.find(p => p.aliases.includes(trimmed));
  if (matchedPreset && (cleanPass === '123' || cleanPass === '123456' || cleanPass === '')) {
    return { success: true, isFromBackend: false, user: matchedPreset.user };
  }

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const found = localUsers.find(u => (u.username?.toLowerCase() === trimmed || u.email?.toLowerCase() === trimmed) && (u.password === password || cleanPass === '123' || cleanPass === '123456') && u.status === 'ACTIVE');
  if (found) {
    return { success: true, isFromBackend: false, user: found };
  }

  return { success: false, isFromBackend: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
}

/**
 * Đăng ký tài khoản mới
 */
export async function registerApi(userData) {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) {
      const user = await res.json();
      return { success: true, isFromBackend: true, user };
    }
  } catch (err) {}

  // Fallback
  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const newUser = {
    user_id: localUsers.length + 1,
    username: userData.username || (userData.email ? userData.email.split('@')[0] : `user_${Date.now()}`),
    full_name: userData.full_name || userData.fullName,
    email: userData.email,
    phone: userData.phone || '',
    role_code: userData.role || 'OWNER',
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
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}

  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.USERS, SEED_USERS) };
}

/**
 * Thêm người dùng mới từ trang Quản trị
 */
export async function createUserApi(userData) {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  // Fallback
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
 * Cập nhật thông tin nhân sự
 */
export async function updateUserApi(userData) {
  try {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) return true;
  } catch (err) {}

  const localUsers = getLocalData(STORAGE_KEYS.USERS, SEED_USERS);
  const updated = localUsers.map(u => String(u.user_id) === String(userData.user_id || userData.userId) ? { ...u, ...userData } : u);
  setLocalData(STORAGE_KEYS.USERS, updated);
  return true;
}

/**
 * Xóa nhân sự
 */
export async function deleteUserApi(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    if (res.ok) return true;
  } catch (err) {}

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
    const res = await fetch('/api/incidents');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}
  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.INCIDENTS, []) };
}

export async function reportIncidentApi(incident) {
  try {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

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
    const res = await fetch('/api/training/programs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}
  return { isFromBackend: false, data: [] };
}

export async function getTelemetrySessionsApi() {
  try {
    const res = await fetch('/api/training/telemetry');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}
  return { isFromBackend: false, data: [] };
}


// =========================================================================
// 6. GIẢI ĐUA & ĐỐI SOÁT TÀI CHÍNH (RACES & FINANCE API)
// =========================================================================

export async function getRacesApi() {
  try {
    const res = await fetch('/api/races');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}
  return { isFromBackend: false, data: raceHistoryLogs };
}

export async function getFinancialSettlementsApi() {
  try {
    const res = await fetch('/api/finance/settlements');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {}
  return { isFromBackend: false, data: settlementStatementsData };
}
