import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getUsersApi, updateUserApi, deleteUserApi } from '../services/api';

// Dữ liệu mẫu đồng bộ với CSDL Microsoft SQL Server (database/RacehorseDB.sql)
// Quy chuẩn cố định: 1 Quản trị viên (Admin), 3 Huấn luyện viên chính, 3 Bác sĩ thú y chính, 3 Nhân viên chăm sóc (Groom)
export const FIXED_CORE_STAFF = [
  {
    user_id: 1,
    username: 'admin',
    full_name: 'Quản trị viên Hệ thống',
    email: 'admin@matruong.vn',
    phone: '0905678999',
    role: 'MANAGER',
    role_name: 'Quản trị viên (Admin)',
    status: 'ACTIVE'
  },
  // 3 Huấn luyện viên chính
  {
    user_id: 2,
    username: 'trainer_truong',
    full_name: 'Trần Văn Hùng',
    title: 'HLV Trưởng - Cự ly Dài & Tổng thể',
    email: 'trainer@matruong.vn',
    phone: '0901234567',
    role: 'TRAINER',
    role_name: 'HLV Trần Văn Hùng (HLV Trưởng)',
    status: 'ACTIVE'
  },
  {
    user_id: 3,
    username: 'trainer_nghia',
    full_name: 'Lê Trọng Nghĩa',
    title: 'HLV Chuyên Cự Ly Dài & Sân Cỏ',
    email: 'trainer_nghia@matruong.vn',
    phone: '0901234568',
    role: 'TRAINER',
    role_name: 'HLV Lê Trọng Nghĩa (Cự Ly Dài)',
    status: 'ACTIVE'
  },
  {
    user_id: 4,
    username: 'trainer_anh',
    full_name: 'Phạm Quốc Anh',
    title: 'HLV Nước Rút & Kỹ Thuật Bứt Tốc',
    email: 'trainer_anh@matruong.vn',
    phone: '0901234569',
    role: 'TRAINER',
    role_name: 'HLV Phạm Quốc Anh (Nước Rút)',
    status: 'ACTIVE'
  },
  // 3 Bác sĩ Thú y chính
  {
    user_id: 5,
    username: 'vet_an',
    full_name: 'BS. Nguyễn An',
    title: 'Trưởng khoa Thú y & Chẩn đoán hình ảnh',
    email: 'vet@matruong.vn',
    phone: '0902345678',
    role: 'VET',
    role_name: 'BS. Nguyễn An (Thú Y Trưởng)',
    status: 'ACTIVE'
  },
  {
    user_id: 6,
    username: 'vet_hoang',
    full_name: 'BS. Trần Minh Hoàng',
    title: 'Chuyên gia Cơ Xương Khớp & Chấn Thương',
    email: 'vet_hoang@matruong.vn',
    phone: '0902345679',
    role: 'VET',
    role_name: 'BS. Trần Minh Hoàng (Cơ Xương Khớp)',
    status: 'ACTIVE'
  },
  {
    user_id: 7,
    username: 'vet_linh',
    full_name: 'BS. Lê Mai Linh',
    title: 'Chuyên khoa Dinh Dưỡng & Kiểm Dịch',
    email: 'vet_linh@matruong.vn',
    phone: '0902345680',
    role: 'VET',
    role_name: 'BS. Lê Mai Linh (Dinh Dưỡng & Vi Sinh)',
    status: 'ACTIVE'
  },
  // 3 Người chăm sóc chính
  {
    user_id: 8,
    username: 'groom_nam',
    full_name: 'Lê Hoàng Nam',
    title: 'Trưởng nhóm Chăm sóc Block A',
    email: 'groom@matruong.vn',
    phone: '0903456789',
    role: 'GROOM',
    role_name: 'Lê Hoàng Nam (Groom Block A)',
    status: 'ACTIVE'
  },
  {
    user_id: 9,
    username: 'groom_dung',
    full_name: 'Vũ Tiến Dũng',
    title: 'Chăm sóc & Vệ sinh móng Block B',
    email: 'groom_dung@matruong.vn',
    phone: '0903456790',
    role: 'GROOM',
    role_name: 'Vũ Tiến Dũng (Groom Block B)',
    status: 'ACTIVE'
  },
  {
    user_id: 10,
    username: 'groom_thao',
    full_name: 'Nguyễn Thu Thảo',
    title: 'Chăm sóc phục hồi & Dinh dưỡng Block C',
    email: 'groom_thao@matruong.vn',
    phone: '0903456791',
    role: 'GROOM',
    role_name: 'Nguyễn Thu Thảo (Groom Block C)',
    status: 'ACTIVE'
  }
];

export const FIXED_TRAINERS = FIXED_CORE_STAFF.filter(s => s.role === 'TRAINER');
export const FIXED_VETS = FIXED_CORE_STAFF.filter(s => s.role === 'VET');
export const FIXED_GROOMS = FIXED_CORE_STAFF.filter(s => s.role === 'GROOM');
export const FIXED_ADMIN = FIXED_CORE_STAFF.find(s => s.role === 'MANAGER');

export const SEED_USERS = [...FIXED_CORE_STAFF];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usersList, setUsersList] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_users_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Bảo lưu toàn bộ thông tin nhân sự đã chỉnh sửa, đối chiếu với FIXED_CORE_STAFF
          const mergedStaff = FIXED_CORE_STAFF.map(core => {
            const found = parsed.find(u => Number(u.user_id) === Number(core.user_id) || (u.username && u.username.toLowerCase() === core.username.toLowerCase()));
            return found ? { ...core, ...found } : core;
          });
          // Nhân sự mới do Admin tạo thêm (không thuộc core)
          const customStaff = parsed.filter(u => u.role !== 'OWNER' && !FIXED_CORE_STAFF.some(core => Number(core.user_id) === Number(u.user_id)));
          // Các tài khoản chủ sở hữu đã đăng ký (tự động kích hoạt ACTIVE nếu đang PENDING)
          const storedOwners = parsed.filter(u => u.role === 'OWNER' && u.username !== 'owner_thanh').map(u => ({
            ...u,
            status: u.status === 'PENDING' ? 'ACTIVE' : u.status,
            approvedAt: u.status === 'PENDING' ? (u.approvedAt || new Date().toISOString()) : u.approvedAt
          }));
          const fullList = [...mergedStaff, ...customStaff, ...storedOwners];
          try {
            localStorage.setItem('matruong_users_list', JSON.stringify(fullList));
          } catch {}
          return fullList;
        }
      }
      return SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Dọn dẹp session vĩnh viễn trong localStorage để khi npm run dev / mở tab mới luôn bắt đầu ở trang Home với tư cách Khách
      localStorage.removeItem('matruong_auth_user');
      const stored = sessionStorage.getItem('matruong_auth_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed?.username === 'owner_thanh') {
        sessionStorage.removeItem('matruong_auth_user');
        return null;
      }

      // Kiểm tra trạng thái tài khoản trong danh sách mới nhất
      const userListRaw = localStorage.getItem('matruong_users_list');
      if (userListRaw) {
        const uList = JSON.parse(userListRaw);
        if (Array.isArray(uList)) {
          const matched = uList.find(u => Number(u.user_id) === Number(parsed.user_id) || u.username === parsed.username);
          if (matched) {
            if (matched.username !== 'admin' && matched.status && matched.status !== 'ACTIVE') {
              sessionStorage.removeItem('matruong_auth_user');
              return null;
            }
            return { ...parsed, ...matched, status: matched.status };
          }
        }
      }

      const match = SEED_USERS.find(u => u.username === parsed?.username || u.email === parsed?.email);
      if (match && (!parsed.user_id || Number(parsed.user_id) > 1000)) {
        return { ...parsed, user_id: match.user_id };
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('matruong_auth_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('matruong_auth_user');
        localStorage.removeItem('matruong_auth_user');
      }
    } catch { }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('matruong_users_list', JSON.stringify(usersList));
  }, [usersList]);

  // Đồng bộ trạng thái người dùng trong thời gian thực khi Admin khóa/mở tài khoản từ tab/cửa sổ khác
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Chỉ phản hồi các sự kiện storage thực từ tab trình duyệt khác
      if (e && e.key && e.key !== 'matruong_users_list') return;
      try {
        const stored = localStorage.getItem('matruong_users_list');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setUsersList(list);
            if (currentUser && currentUser.username !== 'admin') {
              const matched = list.find(u => Number(u.user_id) === Number(currentUser.user_id) || u.username === currentUser.username);
              if (matched) {
                if (matched.status !== 'ACTIVE') {
                  // Tài khoản bị khóa: Tự động kết thúc phiên làm việc
                  setCurrentUser(null);
                  sessionStorage.removeItem('matruong_auth_user');
                  localStorage.removeItem('matruong_auth_user');
                } else if (matched.status !== currentUser.status) {
                  setCurrentUser(prev => prev ? { ...prev, status: matched.status } : null);
                }
              }
            }
          }
        }
      } catch { }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  // Nạp danh sách người dùng từ API Backend khi khởi động (merge với danh sách cục bộ để không mất user đã đăng ký)
  useEffect(() => {
    getUsersApi().then(res => {
      if (res.isFromBackend && Array.isArray(res.data) && res.data.length > 0) {
        const roleMap = {
          'MANAGER': 'Quản lý Câu lạc bộ',
          'TRAINER': 'Huấn luyện viên',
          'VET': 'Bác sĩ Thú y',
          'GROOM': 'Nhân viên Chăm sóc',
          'OWNER': 'Chủ sở hữu Ngựa'
        };
        const backendOwners = res.data
          .filter(u => u.roleCode === 'OWNER' && u.username !== 'owner_thanh')
          .map(u => ({
            user_id: u.userId,
            username: u.username,
            full_name: u.fullName,
            email: u.email,
            phone: u.phone,
            role: u.roleCode,
            role_name: roleMap[u.roleCode] || u.roleCode,
            status: u.status
          }));

        setUsersList(prev => {
          const prevOwners = prev.filter(u => u.role === 'OWNER' && u.username !== 'owner_thanh');
          const combinedOwnersMap = new Map();
          [...prevOwners, ...backendOwners].forEach(o => combinedOwnersMap.set(o.username || o.email, o));

          // Giữ lại toàn bộ chỉnh sửa của nhân sự trong `prev`
          const currentStaff = prev.filter(u => u.role !== 'OWNER');
          const staffMap = new Map();
          FIXED_CORE_STAFF.forEach(s => staffMap.set(Number(s.user_id), s));
          currentStaff.forEach(s => {
            const existing = staffMap.get(Number(s.user_id)) || {};
            staffMap.set(Number(s.user_id), { ...existing, ...s });
          });

          const merged = [...Array.from(staffMap.values()), ...Array.from(combinedOwnersMap.values())];
          try {
            localStorage.setItem('matruong_users_list', JSON.stringify(merged));
          } catch { }
          return merged;
        });
      }
    }).catch(() => { });
  }, []);

  // Đăng nhập kết hợp Smart Aliases, Backend API & Fallback
  const login = async (usernameOrEmail, password) => {
    const cleanUser = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').toString().trim();

    if (!cleanUser) {
      return { success: false, error: 'Vui lòng nhập tên đăng nhập hoặc email.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Vui lòng nhập mật khẩu.' };
    }

    // Danh sách tài khoản hệ thống chuẩn hóa (1 Admin, 3 HLV, 3 Bác sĩ, 3 Groom)
    const SYSTEM_ROLE_PRESETS = [
      // 1. Quản trị viên
      {
        aliases: ['admin', 'admin@matruong.vn', 'quanly', 'manager', 'admin_quan'],
        data: FIXED_CORE_STAFF[0]
      },
      // 2. 3 Huấn luyện viên chính
      {
        aliases: ['trainer_truong', 'trainer', 'hlv', 'trainer@matruong.vn', 'hlv@matruong.vn'],
        data: FIXED_CORE_STAFF[1]
      },
      {
        aliases: ['trainer_nghia', 'hlv_nghia', 'trainer_nghia@matruong.vn'],
        data: FIXED_CORE_STAFF[2]
      },
      {
        aliases: ['trainer_anh', 'hlv_anh', 'trainer_anh@matruong.vn'],
        data: FIXED_CORE_STAFF[3]
      },
      // 3. 3 Bác sĩ Thú y chính
      {
        aliases: ['vet_an', 'vet', 'bacsi', 'vet@matruong.vn', 'bacsi@matruong.vn', 'doctor'],
        data: FIXED_CORE_STAFF[4]
      },
      {
        aliases: ['vet_hoang', 'bacsi_hoang', 'vet_hoang@matruong.vn'],
        data: FIXED_CORE_STAFF[5]
      },
      {
        aliases: ['vet_linh', 'bacsi_linh', 'vet_linh@matruong.vn'],
        data: FIXED_CORE_STAFF[6]
      },
      // 4. 3 Người chăm sóc chính
      {
        aliases: ['groom_nam', 'groom', 'chamsoc', 'groom@matruong.vn'],
        data: FIXED_CORE_STAFF[7]
      },
      {
        aliases: ['groom_dung', 'chamsoc_dung', 'groom_dung@matruong.vn'],
        data: FIXED_CORE_STAFF[8]
      },
      {
        aliases: ['groom_thao', 'chamsoc_thao', 'groom_thao@matruong.vn'],
        data: FIXED_CORE_STAFF[9]
      }
    ];

    const systemPreset = SYSTEM_ROLE_PRESETS.find(p => p.aliases.includes(cleanUser));

    // Nạp danh sách người dùng cục bộ mới nhất từ localStorage (hoặc usersList / SEED_USERS)
    let activeUsers = [];
    try {
      const stored = localStorage.getItem('matruong_users_list');
      if (stored) {
        activeUsers = JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    if (!Array.isArray(activeUsers) || activeUsers.length === 0) {
      activeUsers = usersList && usersList.length > 0 ? usersList : SEED_USERS;
    }

    // 1. Thử gọi API Backend Tomcat
    try {
      const apiRes = await loginApi(usernameOrEmail, password);
      if (apiRes && apiRes.success && apiRes.user) {
        const u = apiRes.user;
        const localMatched = activeUsers.find(
          au => (au.username?.toLowerCase() === u.username?.toLowerCase() || Number(au.user_id) === Number(u.userId || u.user_id))
        );
        let resolvedStatus = localMatched?.status || u.status || 'ACTIVE';

        // Kiểm tra xem tài khoản có bị khóa không
        if (resolvedStatus === 'INACTIVE' || resolvedStatus === 'SUSPENDED' || resolvedStatus === 'LOCKED') {
          return {
            success: false,
            error: 'Tài khoản của bạn đã bị Quản trị viên (Admin) tạm khóa quyền truy cập. Vui lòng liên hệ Admin để được mở khóa!'
          };
        }
        if (resolvedStatus === 'PENDING') {
          // Người dùng đăng ký mới được tự động kích hoạt, không cần Admin phê duyệt
          resolvedStatus = 'ACTIVE';
        }
        if (resolvedStatus === 'REJECTED') {
          return {
            success: false,
            error: 'Yêu cầu đăng ký tài khoản của bạn đã bị từ chối bởi Quản trị viên.'
          };
        }

        const roleMap = {
          'MANAGER': 'Quản lý Câu lạc bộ',
          'TRAINER': 'Huấn luyện viên Trưởng',
          'VET': 'Bác sĩ Thú y',
          'GROOM': 'Nhân viên Chăm sóc',
          'OWNER': 'Chủ sở hữu Ngựa'
        };
        const appUser = {
          user_id: u.userId || u.user_id,
          username: u.username,
          full_name: localMatched?.full_name || u.fullName || u.full_name,
          email: u.email,
          phone: localMatched?.phone || u.phone,
          role: u.roleCode || u.role,
          role_name: roleMap[u.roleCode || u.role] || u.roleCode || u.role,
          status: resolvedStatus,
          token: u.token || null
        };
        setCurrentUser(appUser);
        return { success: true, user: appUser };
      }
      if (apiRes && apiRes.isFromBackend && !apiRes.success) {
        return { success: false, error: apiRes.error || 'Tài khoản hoặc mật khẩu không chính xác.' };
      }
    } catch {
      // Backend offline -> Tiếp tục fallback
    }

    // 2. Fallback sang dữ liệu cục bộ: Tìm tài khoản phù hợp
    let found = activeUsers.find(
      u => (u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser)
    );

    // Nếu không khớp trực tiếp tên đăng nhập/email, kiểm tra qua systemPreset (aliases: trainer, hlv, vet, doctor, groom...)
    if (!found && systemPreset) {
      found = activeUsers.find(u => Number(u.user_id) === Number(systemPreset.data.user_id) || u.username === systemPreset.data.username) || systemPreset.data;
    }

    if (!found) {
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
    }

    // 3. KIỂM TRA TRẠNG THÁI KHÓA TRUY CẬP (Bắt buộc kiểm tra TRƯỚC KHI cho phép đăng nhập)
    if (found.status === 'INACTIVE' || found.status === 'SUSPENDED' || found.status === 'LOCKED' || (found.status && found.status !== 'ACTIVE' && found.status !== 'PENDING' && found.status !== 'REJECTED')) {
      return {
        success: false,
        error: 'Tài khoản của bạn đã bị Quản trị viên (Admin) tạm khóa quyền truy cập. Vui lòng liên hệ Admin để được mở khóa!'
      };
    }

    if (found.status === 'PENDING') {
      // Tự động kích hoạt ngay lập tức mà không cần Admin phê duyệt
      found.status = 'ACTIVE';
      found.approvedAt = new Date().toISOString();
      try {
        const uList = JSON.parse(localStorage.getItem('matruong_users_list') || '[]');
        const updated = uList.map(x => (x.username === found.username || x.email === found.email) ? { ...x, status: 'ACTIVE', approvedAt: found.approvedAt } : x);
        localStorage.setItem('matruong_users_list', JSON.stringify(updated));
      } catch {}
    }

    if (found.status === 'REJECTED') {
      return {
        success: false,
        error: 'Yêu cầu đăng ký tài khoản của bạn đã bị từ chối bởi Quản trị viên.'
      };
    }

    // 4. Kiểm tra mật khẩu (hỗ trợ mật khẩu riêng đã tạo hoặc mật khẩu seed 123/123456)
    const isPasswordCorrect = found.password
      ? (String(found.password) === cleanPass || cleanPass === '123' || cleanPass === '123456')
      : (cleanPass === '123' || cleanPass === '123456');

    if (!isPasswordCorrect) {
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
    }

    const { password: _removedPassword, ...safeUser } = found;
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
  };

  // Đăng xuất
  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('matruong_auth_user');
      localStorage.removeItem('matruong_auth_user');
    } catch { }
  };

  // Đăng ký tài khoản mới kết hợp Backend API & Đồng bộ tức thì localStorage
  // Quy tắc hệ thống: Nhân sự (1 Admin, 3 HLV, 3 BS, 3 Groom) đã cố định; người dùng đăng ký mới luôn là Chủ sở hữu ngựa (OWNER)
  const registerUser = (userData) => {
    const userRole = 'OWNER';

    // Gửi thông tin sang Backend API
    registerApi({
      username: userData.username || (userData.email ? userData.email.split('@')[0] : 'owner_new'),
      email: userData.email,
      password: userData.password || '123456',
      fullName: userData.full_name || 'Chủ sở hữu mới',
      phone: userData.phone || '0900000000',
      role: 'OWNER'
    }).catch(() => { });

    const roleMap = {
      'OWNER': 'Chủ sở hữu Ngựa'
    };

    // Đọc danh sách hiện tại từ localStorage
    let currentUsers = [];
    try {
      const stored = localStorage.getItem('matruong_users_list');
      if (stored) {
        currentUsers = JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    if (!Array.isArray(currentUsers) || currentUsers.length === 0) {
      currentUsers = usersList && usersList.length > 0 ? usersList : SEED_USERS;
    }

    const maxId = currentUsers.reduce((max, u) => Math.max(max, Number(u.user_id) || 0), 0);
    const nextId = maxId + 1;
    const cleanEmail = userData.email.trim().toLowerCase();

    const newUser = {
      user_id: nextId,
      username: userData.username || cleanEmail.split('@')[0],
      password: userData.password || '123456',
      full_name: userData.full_name || 'Người dùng mới',
      email: cleanEmail,
      phone: userData.phone || '0900000000',
      role: userRole,
      role_name: userData.role_name || roleMap[userRole] || 'Chủ sở hữu Ngựa',
      status: 'ACTIVE', // Tự động kích hoạt tức thì, không cần admin phê duyệt
      isNewAccount: true,
      registeredAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    // Cập nhật ngay vào localStorage để hàm login gọi tức thì có thể tìm thấy ngay
    const updatedUsers = [...currentUsers.filter(u => u.email?.toLowerCase() !== cleanEmail), newUser];
    localStorage.setItem('matruong_users_list', JSON.stringify(updatedUsers));
    setUsersList(updatedUsers);

    return newUser;
  };

  // Phê duyệt tài khoản mới (dành cho Admin)
  const approveUser = (userId) => {
    const approvedTime = new Date().toISOString();
    updateUserApi(userId, { status: 'ACTIVE', approvedAt: approvedTime }).catch(() => { });
    setUsersList(prev => {
      const nextList = prev.map(u => {
        if (Number(u.user_id) === Number(userId)) {
          return { ...u, status: 'ACTIVE', approvedAt: approvedTime };
        }
        return u;
      });
      try {
        localStorage.setItem('matruong_users_list', JSON.stringify(nextList));
      } catch { }
      return nextList;
    });
  };

  // Từ chối phê duyệt tài khoản (dành cho Admin)
  const rejectUser = (userId, reason = '') => {
    updateUserApi(userId, { status: 'REJECTED', rejectReason: reason }).catch(() => { });
    setUsersList(prev => {
      const nextList = prev.map(u => {
        if (Number(u.user_id) === Number(userId)) {
          return { ...u, status: 'REJECTED', rejectReason: reason };
        }
        return u;
      });
      try {
        localStorage.setItem('matruong_users_list', JSON.stringify(nextList));
      } catch { }
      return nextList;
    });
  };

  // Cập nhật người dùng (dành cho Admin)
  const updateUser = (userId, updatedFields) => {
    updateUserApi(userId, updatedFields).catch(() => { });
    setUsersList(prev => {
      const nextList = prev.map(u => 
        (Number(u.user_id) === Number(userId) || Number(u.id) === Number(userId)) ? { ...u, ...updatedFields } : u
      );
      try {
        localStorage.setItem('matruong_users_list', JSON.stringify(nextList));
      } catch { }
      return nextList;
    });

    if (currentUser && (Number(currentUser.user_id) === Number(userId) || Number(currentUser.id) === Number(userId))) {
      setCurrentUser(prev => {
        const next = { ...prev, ...updatedFields };
        try {
          sessionStorage.setItem('matruong_auth_user', JSON.stringify(next));
        } catch { }
        return next;
      });
    }
  };

  // Xóa / Vô hiệu hóa người dùng (Tạm khóa / Mở khóa)
  const toggleUserStatus = (userId) => {
    if (Number(userId) === 1) return 'ACTIVE';

    // 1. Tìm thông tin người dùng hiện tại và tính toán nextStatus đồng bộ ngay lập tức
    let target = usersList.find(u => Number(u.user_id) === Number(userId) || (u.id && Number(u.id) === Number(userId)));
    if (!target) {
      try {
        const stored = JSON.parse(localStorage.getItem('matruong_users_list') || '[]');
        target = stored.find(u => Number(u.user_id) === Number(userId) || (u.id && Number(u.id) === Number(userId)));
      } catch {}
    }

    const currentStatus = target?.status || 'ACTIVE';
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // 2. Cập nhật state usersList và lưu ngay vào localStorage
    setUsersList(prev => {
      const nextList = prev.map(u => {
        if (Number(u.user_id) === Number(userId) || (u.id && Number(u.id) === Number(userId))) {
          return { ...u, status: nextStatus };
        }
        return u;
      });

      try {
        localStorage.setItem('matruong_users_list', JSON.stringify(nextList));
      } catch { }

      return nextList;
    });

    // 3. Đồng bộ với API Backend
    updateUserApi(userId, {
      user_id: userId,
      status: nextStatus,
      ...(target ? {
        full_name: target.full_name,
        email: target.email,
        phone: target.phone,
        role: target.role
      } : {})
    }).catch(() => { });

    // 4. Nếu người dùng đang đăng nhập chính là tài khoản bị khóa -> đăng xuất ngay lập tức
    if (currentUser && (Number(currentUser.user_id) === Number(userId) || Number(currentUser.id) === Number(userId))) {
      if (nextStatus !== 'ACTIVE') {
        setCurrentUser(null);
        try {
          sessionStorage.removeItem('matruong_auth_user');
          localStorage.removeItem('matruong_auth_user');
        } catch {}
      } else {
        setCurrentUser(prev => prev ? { ...prev, status: 'ACTIVE' } : null);
      }
    }

    // 5. Kích hoạt sự kiện storage và custom event để đồng bộ tức thì các tab
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('matruong_user_status_changed', { detail: { userId, status: nextStatus } }));
    } catch {}

    return nextStatus;
  };

  // Xóa vĩnh viễn người dùng khỏi danh sách (dành cho Admin)
  const deleteUser = (userId) => {
    if (Number(userId) === 1) return;
    deleteUserApi(userId).catch(() => { });
    setUsersList(prev => {
      const nextList = prev.filter(u => Number(u.user_id) !== Number(userId));
      try {
        localStorage.setItem('matruong_users_list', JSON.stringify(nextList));
      } catch {
        // Ignore storage error
      }
      return nextList;
    });
  };

  const isAdmin = currentUser && (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN');

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      usersList,
      isAdmin,
      login,
      logout,
      registerUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      approveUser,
      rejectUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Lấy đường dẫn cổng điều hành tương ứng chính xác với vai trò người dùng
 */
export function getRolePortalPath(user) {
  if (!user) return '/';
  if (user.status && user.status !== 'ACTIVE') return '/';
  const r = (user.role || user.role_code || '').toUpperCase();
  if (r === 'TRAINER') return '/trainer';
  if (r === 'VET') return '/vet';
  if (r === 'GROOM') return '/groom';
  if (r === 'OWNER') return '/owner';
  if (r === 'MANAGER' || r === 'ADMIN') return '/admin';
  return '/owner';
}
