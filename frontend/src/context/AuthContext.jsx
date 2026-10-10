import React, { createContext, useContext, useState, useEffect } from 'react';

// Dữ liệu mẫu đồng bộ với CSDL Microsoft SQL Server (database/RacehorseDB.sql)
export const SEED_USERS = [
  {
    user_id: 1,
    username: 'admin',
    password: '123',
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
    password: '123',
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
    password: '123',
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
    password: '123',
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
    password: '123',
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
    password: '123',
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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('matruong_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('matruong_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('matruong_users_list', JSON.stringify(usersList));
    // Đồng bộ currentUser nếu user_id được chuẩn hóa lại
    if (currentUser) {
      const match = usersList.find(u => u.username === currentUser.username || u.email === currentUser.email);
      if (match && match.user_id !== currentUser.user_id) {
        setCurrentUser(match);
      }
    }
  }, [usersList]);

  // Đăng nhập
  const login = (usernameOrEmail, password) => {
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const found = usersList.find(
      u => (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser)
    );

    if (!found) {
      return { success: false, error: 'Không tìm thấy tài khoản hoặc email này trong hệ thống!' };
    }

    if (found.status !== 'ACTIVE') {
      return { success: false, error: 'Tài khoản này hiện đang bị tạm khóa!' };
    }

    // Kiểm tra mật khẩu (hỗ trợ pass 123 hoặc pass riêng của user)
    if (found.password && found.password !== password && password !== '123' && password !== '123456') {
      return { success: false, error: 'Mật khẩu không chính xác! (Mật khẩu mặc định: 123)' };
    }

    setCurrentUser(found);
    return { success: true, user: found };
  };

  // Đăng xuất
  const logout = () => {
    setCurrentUser(null);
  };

  // Đăng ký nhanh tài khoản mới với ID tuần tự (#1, #2, #3, ...)
  const registerUser = (userData) => {
    const roleMap = {
      'MANAGER': 'Quản lý Câu lạc bộ',
      'TRAINER': 'Huấn luyện viên Trưởng',
      'VET': 'Bác sĩ Thú y',
      'GROOM': 'Nhân viên Chăm sóc',
      'OWNER': 'Chủ sở hữu Ngựa'
    };
    const userRole = (userData.role || 'OWNER').toUpperCase();
    const maxId = usersList.reduce((max, u) => Math.max(max, Number(u.user_id) || 0), 0);
    const nextId = maxId + 1;
    const newUser = {
      user_id: nextId,
      username: userData.username || (userData.email ? userData.email.split('@')[0] : `user_${nextId}`),
      password: userData.password || '123',
      full_name: userData.full_name || 'Người dùng mới',
      email: userData.email,
      phone: userData.phone || '0900000000',
      role: userRole,
      role_name: userData.role_name || roleMap[userRole] || 'Chủ sở hữu Ngựa',
      status: 'ACTIVE'
    };
    setUsersList(prev => [...prev, newUser]);
    return newUser;
  };

  // Cập nhật người dùng (dành cho Admin)
  const updateUser = (userId, updatedFields) => {
    setUsersList(prev => prev.map(u => Number(u.user_id) === Number(userId) ? { ...u, ...updatedFields } : u));
    if (currentUser && Number(currentUser.user_id) === Number(userId)) {
      setCurrentUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  // Xóa / Vô hiệu hóa người dùng
  const toggleUserStatus = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (Number(u.user_id) === Number(userId)) {
        return { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
      }
      return u;
    }));
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
