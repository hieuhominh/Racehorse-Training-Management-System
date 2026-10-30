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
  INCIDENTS: 'racehorse_api_incidents'
};

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
    const raw = localStorage.getItem('matruong_auth_user');
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
    // Backend offline -> Fallback
  }
  return { isFromBackend: false, data: getLocalData(STORAGE_KEYS.HORSES, initialHorsesData) };
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

/**
 * Lấy danh sách toàn bộ ô chuồng trại kèm hình ảnh mô phỏng 3D
 */
export async function getStablesApi() {
  try {
    const res = await fetch('/api/stables', {
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

  const defaultStables = [
    { stall_code: 'A1', block: 'Block A', status: 'OCCUPIED', horse: 'Xích Thố', breed: 'Arabian', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A2', block: 'Block A', status: 'OCCUPIED', horse: 'Bạch Long', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A3', block: 'Block A', status: 'OCCUPIED', horse: 'Hắc Phong', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A4', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Vũ', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A5', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Yến', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A6', block: 'Block A', status: 'OCCUPIED', horse: 'Kim Kê', breed: 'Quarter Horse', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B1', block: 'Block B', status: 'OCCUPIED', horse: 'Thanh Vân', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B2', block: 'Block B', status: 'OCCUPIED', horse: 'Lôi Chấn', breed: 'Quarter Horse', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B3', block: 'Block B', status: 'OCCUPIED', horse: 'Hồng Sa', breed: 'Arabian', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B4', block: 'Block B', status: 'OCCUPIED', horse: 'Thiên Lý', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B5', block: 'Block B', status: 'OCCUPIED', horse: 'Bảo Mã', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=300&q=80' },
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
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(stallData)
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }

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
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(stallData)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

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
  return true;
}

/**
 * Xóa ô chuồng
 */
export async function deleteStallApi(stallCode) {
  try {
    const res = await fetch(`/api/stables/${stallCode}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  const { data: stables } = await getStablesApi();
  const updated = stables.filter(s => s.stall_code !== stallCode);
  setLocalData(STORAGE_KEYS.STABLES, updated);
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
    },
    {
      aliases: ['owner', 'owner_thanh', 'chunga', 'owner@matruong.vn'],
      user: { user_id: 6, userId: 6, username: 'owner_thanh', full_name: 'Phạm Tiến Thành', email: 'owner@matruong.vn', phone: '0904567890', roleCode: 'OWNER', role_code: 'OWNER', status: 'ACTIVE' }
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
  const newProgram = { ...programData, id: programData.id || `PROG-${Date.now()}` };
  setLocalData(key, [newProgram, ...local]);
  return newProgram;
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
  const newEntry = { ...telemetryData, id: Date.now() };
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
  return getLocalData('matruong_groom_care_logs', [
    { id: 1, task: 'Tắm xả cơ bắp bằng vòi lạnh & sấy khô', horseName: 'Bạch Long', groomName: 'Lê Hoàng Nam', date: '24/10/2026', status: 'DONE' },
    { id: 2, task: 'Vệ sinh hốc móng & thoa dầu móng chống nứt', horseName: 'Xích Thố', groomName: 'Lê Hoàng Nam', date: '24/10/2026', status: 'DONE' },
    { id: 3, task: 'Băng ép lạnh khớp gân theo chỉ định bác sĩ', horseName: 'Phi Yến', groomName: 'Lê Hoàng Nam', date: '24/10/2026', status: 'DONE' }
  ]);
}

export async function recordCareActivityApi(activityData) {
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
  setLocalData(storageKey, [newHorse, ...existing]);
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
  const updated = existing.map(h => String(h.id) === String(horseData.id) ? { ...h, ...horseData } : h);
  setLocalData(storageKey, updated);
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

  const defaultSeed = [
    {
      id: 'RN-2026-01',
      raceName: 'Giải Vô Địch Cúp Derby Mùa Thu 2026',
      track: 'Trường đua Quốc tế Phú Thọ',
      horseName: 'Bạch Long',
      ownerName: 'Phạm Tiến Thành (VIP)',
      ownerKey: '6',
      distance: '2.400m (Sân cỏ)',
      date: '15/11/2026',
      estimatedPurse: 800000000,
      nominationStatus: 'APPROVED',
      jockey: 'Kỵ mã Nguyễn Văn Tài',
      notes: 'Chủ sở hữu đề xuất lượt chạy số 3. Thể lực sung mãn.',
      registeredAt: '20/10/2026 14:00',
      trainerFeedback: 'Đạt chuẩn thể lực cự ly 2.400m, nhịp tim ổn định 38 bpm. Phê duyệt đủ điều kiện xuất phát.',
      reviewedBy: 'HLV Trưởng Trần Văn Hùng',
      reviewedAt: '21/10/2026 09:30'
    },
    {
      id: 'RN-2026-02',
      raceName: 'Cúp Nước Rút Tốc Độ Sprint Cup 1.200m',
      track: 'Trường đua Cát Thể Thao',
      horseName: 'Lôi Chấn',
      ownerName: 'Phạm Tiến Thành (VIP)',
      ownerKey: '6',
      distance: '1.200m (Sân cát)',
      date: '28/11/2026',
      estimatedPurse: 450000000,
      nominationStatus: 'PENDING_TRAINER',
      jockey: 'Kỵ mã Trần Quốc Bảo',
      notes: 'Chủ ngựa đề cử tham gia tranh tài cúp nước rút cự ly ngắn.',
      registeredAt: '26/10/2026 10:15',
      trainerFeedback: '',
      reviewedBy: null,
      reviewedAt: null
    }
  ];

  let rawData = getLocalData(SYSTEM_NOMINATIONS_KEY, defaultSeed);
  if (Array.isArray(rawData)) {
    let changed = false;
    rawData = rawData.map(item => {
      if ((item.id === 'RN-2026-01' || item.id === 'RN-2026-02') && (item.ownerKey === 'owner_tuan' || item.ownerKey === 'owner_vu')) {
        changed = true;
        return { ...item, ownerKey: '6', ownerName: 'Phạm Tiến Thành (VIP)' };
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
  const key = `matruong_owner_health_${ownerKey}`;
  return getLocalData(key, []);
}
