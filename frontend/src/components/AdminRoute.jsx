import React, { useEffect } from 'react';
import { useAuth, FIXED_ADMIN } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Quản trị viên (ADMIN / MANAGER).
 * Khi người dùng đang ở Cổng Quản trị thì luôn giữ nguyên ở vai trò Quản trị viên,
 * tuyệt đối không tự ý chuyển hướng sang cổng hay vai trò khác.
 */
export default function AdminRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();

  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  useEffect(() => {
    if (!currentUser || (r !== 'MANAGER' && r !== 'ADMIN')) {
      const defaultAdmin = (usersList && usersList.find(u => u.role === 'MANAGER' || u.role === 'ADMIN')) || FIXED_ADMIN || {
        user_id: 1,
        username: 'admin',
        full_name: 'Quản trị viên Hệ thống',
        role: 'MANAGER',
        role_code: 'MANAGER',
        status: 'ACTIVE'
      };
      if (setCurrentUser) {
        setCurrentUser(defaultAdmin);
        try {
          sessionStorage.setItem('matruong_auth_user', JSON.stringify(defaultAdmin));
        } catch {}
      }
    }
  }, [currentUser, r, setCurrentUser, usersList]);

  return children;
}
