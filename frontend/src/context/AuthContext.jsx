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

export const DEFAULT_DEMO_OWNER = {
  user_id: 11,
  username: 'owner_thanh',
  full_name: 'Phạm Tiến Thành',
  email: 'owner@matruong.vn',
  phone: '0904567890',
  role: 'OWNER',
  role_name: 'Chủ sở hữu Ngựa (VIP)',
  status: 'ACTIVE'
};

export const FIXED_TRAINERS = FIXED_CORE_STAFF.filter(s => s.role === 'TRAINER');
export const FIXED_VETS = FIXED_CORE_STAFF.filter(s => s.role === 'VET');
export const FIXED_GROOMS = FIXED_CORE_STAFF.filter(s => s.role === 'GROOM');
export const FIXED_ADMIN = FIXED_CORE_STAFF.find(s => s.role === 'MANAGER');

export const SEED_USERS = [...FIXED_CORE_STAFF, DEFAULT_DEMO_OWNER];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usersList, setUsersList] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_users_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Chỉ giữ lại các tài khoản OWNER đã đăng ký từ trước, và kết hợp với 10 nhân sự cốt cán cố định
          const storedOwners = parsed.filter(u => u.role === 'OWNER' && u.username !== 'owner_thanh');
          return [...FIXED_CORE_STAFF, DEFAULT_DEMO_OWNER, ...storedOwners];
        }
      }
      return SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_auth_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
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
    if (currentUser) {
      localStorage.setItem('matruong_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('matruong_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('matruong_users_list', JSON.stringify(usersList));
  }, [usersList]);

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
          const merged = [...FIXED_CORE_STAFF, DEFAULT_DEMO_OWNER, ...Array.from(combinedOwnersMap.values())];
          localStorage.setItem('matruong_users_list', JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(() => {});
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

    // Danh sách tài khoản hệ thống chuẩn hóa (1 Admin, 3 HLV, 3 Bác sĩ, 3 Groom và Chủ sở hữu mẫu)
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
      },
      // 5. Chủ sở hữu mẫu
      {
        aliases: ['owner', 'owner_thanh', 'chunga', 'owner@matruong.vn'],
        data: DEFAULT_DEMO_OWNER
      }
    ];

    const systemPreset = SYSTEM_ROLE_PRESETS.find(p => p.aliases.includes(cleanUser));

    // 1. Thử gọi API Backend Tomcat
    try {
      const apiRes = await loginApi(usernameOrEmail, password);
      if (apiRes && apiRes.success && apiRes.user) {
        const u = apiRes.user;
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
          full_name: u.fullName || u.full_name,
          email: u.email,
          phone: u.phone,
          role: u.roleCode || u.role,
          role_name: roleMap[u.roleCode || u.role] || u.roleCode || u.role,
          status: u.status || 'ACTIVE',
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

    // Kiểm tra đăng nhập cho các tài khoản hệ thống khi offline (Mật khẩu hợp lệ: 123 hoặc 123456)
    if (systemPreset) {
      if (cleanPass === '123' || cleanPass === '123456') {
        setCurrentUser(systemPreset.data);
        return { success: true, user: systemPreset.data };
      }
    }

    // 2. Fallback sang dữ liệu cục bộ (Lấy trực tiếp từ localStorage để luôn có tài khoản vừa đăng ký)
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

    const found = activeUsers.find(
      u => (u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser)
    );

    if (!found) {
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' };
    }

    if (found.status && found.status !== 'ACTIVE') {
      return { success: false, error: 'Tài khoản này hiện đang bị tạm khóa!' };
    }

    // Kiểm tra mật khẩu (hỗ trợ mật khẩu riêng đã tạo hoặc mật khẩu seed 123/123456)
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
    }).catch(() => {});

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
      status: 'ACTIVE'
    };

    // Cập nhật ngay vào localStorage để hàm login gọi tức thì có thể tìm thấy ngay
    const updatedUsers = [...currentUsers.filter(u => u.email?.toLowerCase() !== cleanEmail), newUser];
    localStorage.setItem('matruong_users_list', JSON.stringify(updatedUsers));
    setUsersList(updatedUsers);

    return newUser;
  };

  // Cập nhật người dùng (dành cho Admin)
  const updateUser = (userId, updatedFields) => {
    updateUserApi(userId, updatedFields).catch(() => {});
    setUsersList(prev => prev.map(u => Number(u.user_id) === Number(userId) ? { ...u, ...updatedFields } : u));
    if (currentUser && Number(currentUser.user_id) === Number(userId)) {
      setCurrentUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  // Xóa / Vô hiệu hóa người dùng (Tạm khóa)
  const toggleUserStatus = (userId) => {
    if (Number(userId) === 1) return;
    setUsersList(prev => {
      const nextList = prev.map(u => {
        if (Number(u.user_id) === Number(userId)) {
          const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          updateUserApi(userId, { status: nextStatus }).catch(() => {});
          return { ...u, status: nextStatus };
        }
        return u;
      });
      return nextList;
    });
  };

  // Xóa vĩnh viễn người dùng khỏi danh sách (dành cho Admin)
  const deleteUser = (userId) => {
    if (Number(userId) === 1) return;
    deleteUserApi(userId).catch(() => {});
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
      usersList,
      isAdmin,
      login,
      logout,
      registerUser,
      updateUser,
      deleteUser,
      toggleUserStatus
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
