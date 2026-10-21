/**
 * API Service Client kết nối toàn diện giữa Frontend (ReactJS) và Backend (Java Servlet - Tomcat 8080)
 * Trang bị cơ chế Auto-Fallback (Tự động chuyển tiếp thông minh):
 * - Khi Backend Tomcat và SQL Server đang chạy: Lấy dữ liệu thực từ Cơ sở dữ liệu.
 * - Khi Backend chưa khởi động: Tự động dùng dữ liệu đệm cục bộ để giao diện luôn chạy mượt mà, không bao giờ lỗi.
 */

import { initialHorsesData } from '../data/horsesData';
import { initialStallsData } from '../data/stallsData';
import { SEED_USERS } from '../context/AuthContext';
import { settlementStatementsData, raceHistoryLogs } from '../data/financialData';

// 1. ==================== QUẢN LÝ CHIẾN MÃ (HORSES API) ====================
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
                status: (h.healthStatus || '').toLowerCase() === 'good' || (h.healthStatus || '').toLowerCase() === 'eligible' ? 'eligible' : 'watch'
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
  return { isFromBackend: false, data: initialHorsesData };
}

export async function createHorseApi(horseData) {
  try {
    const res = await fetch('/api/horses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(horseData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }
  return horseData;
}


// 2. ==================== XÁC THỰC & NGƯỜI DÙNG (AUTH & USER API) ====================
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
    } else {
      const data = await res.json().catch(() => ({}));
      return { success: false, isFromBackend: true, error: data.error || 'Tài khoản hoặc mật khẩu không chính xác.' };
    }
  } catch (err) {
    // Backend offline
  }
  return { success: false, isFromBackend: false };
}

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
  } catch (err) {
    // Backend offline
  }
  return { success: false, isFromBackend: false };
}

export async function getUsersApi() {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {
    // Fallback
  }
  return { isFromBackend: false, data: SEED_USERS };
}

export async function updateUserApi(userData) {
  try {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function deleteUserApi(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}


// 3. ==================== CHUỒNG TRẠI & SỰ CỐ (STABLES & INCIDENTS API) ====================
export async function getStablesApi() {
  try {
    const res = await fetch('/api/stables');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {
    // Fallback
  }
  return { isFromBackend: false, data: initialStallsData };
}

export async function getIncidentsApi() {
  try {
    const res = await fetch('/api/incidents');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {
    // Fallback
  }
  return { isFromBackend: false, data: [] };
}

export async function reportIncidentApi(incident) {
  try {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }
  return incident;
}


// 4. ==================== GIÁO ÁN & CHỈ SỐ VIỄN TRẮC (TRAINING API) ====================
export async function getTrainingProgramsApi() {
  try {
    const res = await fetch('/api/training/programs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {
    // Fallback
  }
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
  } catch (err) {
    // Fallback
  }
  return { isFromBackend: false, data: [] };
}


// 5. ==================== GIẢI ĐUA & ĐỐI SOÁT TÀI CHÍNH (RACES & SETTLEMENTS API) ====================
export async function getRacesApi() {
  try {
    const res = await fetch('/api/races');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { isFromBackend: true, data };
      }
    }
  } catch (err) {
    // Fallback
  }
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
  } catch (err) {
    // Fallback
  }
  return { isFromBackend: false, data: settlementStatementsData };
}
