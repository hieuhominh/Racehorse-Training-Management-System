import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getUsersApi, updateUserApi, deleteUserApi } from '../services/api';

// Dữ liệu mẫu đồng bộ với CSDL Microsoft SQL Server (database/RacehorseDB.sql)
export const SEED_USERS = [
  {
    user_id: 1,
    username: 'admin',
    full_name: 'Quản trị viên Hệ thống',
    email: 'admin@matruong.vn',
    phone: '0905678999',
    role: 'MANAGER',
    role_name: 'Quản lý Câu lạc bộ (Admin)',
    status: 'ACTIVE'
  },
  {
    user_id: 2,
    username: 'admin_quan',
    full_name: 'Ban Quản trị Mã Trường',
    email: 'quanly@matruong.vn',
    phone: '0905678901',
    role: 'MANAGER',
    role_name: 'Quản lý Câu lạc bộ',
    status: 'ACTIVE'
  },
  {
    user_id: 3,
    username: 'trainer_truong',
    full_name: 'Trần Văn Hùng',
    email: 'trainer@matruong.vn',
    phone: '0901234567',
    role: 'TRAINER',
    role_name: 'Huấn luyện viên Trưởng',
    status: 'ACTIVE'
  },
  {
    user_id: 4,
    username: 'vet_an',
    full_name: 'Bác sĩ Nguyễn An',
    email: 'vet@matruong.vn',
    phone: '0902345678',
    role: 'VET',
    role_name: 'Bác sĩ Thú y',
    status: 'ACTIVE'
  },
  {
    user_id: 5,
    username: 'groom_nam',
    full_name: 'Lê Hoàng Nam',
    email: 'groom@matruong.vn',
    phone: '0903456789',
    role: 'GROOM',
    role_name: 'Nhân viên Chăm sóc',
    status: 'ACTIVE'
  },
  {
    user_id: 6,
    username: 'owner_thanh',
    full_name: 'Phạm Tiến Thành',
    email: 'owner@matruong.vn',
    phone: '0904567890',
    role: 'OWNER',
    role_name: 'Chủ sở hữu Ngựa',
    status: 'ACTIVE'
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usersList, setUsersList] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_users_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let seq = 1;
          const normalized = parsed.map(u => {
            const num = Number(u.user_id);
            if (!num || num > 1000) {
              const assigned = seq;
              seq++;
              return { ...u, user_id: assigned };
            } else {
              seq = Math.max(seq, num + 1);
              return { ...u, user_id: num };
            }
          });
          return normalized;
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
          'TRAINER': 'Huấn luyện viên Trưởng',
          'VET': 'Bác sĩ Thú y',
          'GROOM': 'Nhân viên Chăm sóc',
          'OWNER': 'Chủ sở hữu Ngựa'
        };
        const backendMapped = res.data.map(u => ({
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
          const backendEmails = new Set(backendMapped.map(u => u.email?.toLowerCase()));
          const localOnly = prev.filter(u => u.email && !backendEmails.has(u.email.toLowerCase()));
          const merged = [...backendMapped, ...localOnly];
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

    // Danh sách tài khoản hệ thống chuẩn hóa (Hỗ trợ nhiều alias tiện dụng)
    const SYSTEM_ROLE_PRESETS = [
      {
        aliases: ['admin', 'admin@matruong.vn', 'quanly', 'manager', 'admin_quan', 'quanly@matruong.vn'],
        data: {
          user_id: 1,
          username: 'admin',
          full_name: 'Quản trị viên Hệ thống',
          email: 'admin@matruong.vn',
          phone: '0905678999',
          role: 'MANAGER',
          role_name: 'Quản lý Câu lạc bộ (Admin)',
          status: 'ACTIVE'
        }
      },
      {
        aliases: ['vet', 'vet_an', 'bacsi', 'vet@matruong.vn', 'bacsi@matruong.vn', 'doctor'],
        data: {
          user_id: 4,
          username: 'vet_an',
          full_name: 'Bác sĩ Nguyễn An',
          email: 'vet@matruong.vn',
          phone: '0902345678',
          role: 'VET',
          role_name: 'Bác sĩ Thú y',
          status: 'ACTIVE'
        }
      },
      {
        aliases: ['trainer', 'trainer_truong', 'hlv', 'trainer@matruong.vn', 'hlv@matruong.vn'],
        data: {
          user_id: 3,
          username: 'trainer_truong',
          full_name: 'Trần Văn Hùng',
          email: 'trainer@matruong.vn',
          phone: '0901234567',
          role: 'TRAINER',
          role_name: 'Huấn luyện viên Trưởng',
          status: 'ACTIVE'
        }
      },
      {
        aliases: ['groom', 'groom_nam', 'chamsoc', 'groom@matruong.vn'],
        data: {
          user_id: 5,
          username: 'groom_nam',
          full_name: 'Lê Hoàng Nam',
          email: 'groom@matruong.vn',
          phone: '0903456789',
          role: 'GROOM',
          role_name: 'Nhân viên Chăm sóc',
          status: 'ACTIVE'
        }
      },
      {
        aliases: ['owner', 'owner_thanh', 'chunga', 'owner@matruong.vn'],
        data: {
          user_id: 6,
          username: 'owner_thanh',
          full_name: 'Phạm Tiến Thành',
          email: 'owner@matruong.vn',
          phone: '0904567890',
          role: 'OWNER',
          role_name: 'Chủ sở hữu Ngựa',
          status: 'ACTIVE'
        }
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
  const registerUser = (userData) => {
    const requestedRole = (userData.role || 'OWNER').toUpperCase();
    const userRole = ['OWNER', 'TRAINER', 'VET', 'GROOM'].includes(requestedRole) ? requestedRole : 'OWNER';

    // Gửi thông tin sang Backend API
    registerApi({
      username: userData.username || (userData.email ? userData.email.split('@')[0] : 'user_new'),
      email: userData.email,
      password: userData.password || '123456',
      fullName: userData.full_name || 'Người dùng mới',
      phone: userData.phone || '0900000000',
      role: userRole
    }).catch(() => {});

    const roleMap = {
      'MANAGER': 'Quản lý Câu lạc bộ',
      'TRAINER': 'Huấn luyện viên Trưởng',
      'VET': 'Bác sĩ Thú y',
      'GROOM': 'Nhân viên Chăm sóc',
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
