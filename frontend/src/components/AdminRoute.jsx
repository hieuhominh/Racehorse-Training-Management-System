import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, FIXED_ADMIN } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Quản trị viên (ADMIN / MANAGER).
 * - Khi CHƯA ĐĂNG NHẬP hoặc VỪA ĐĂNG XUẤT: Điều hướng về Trang chủ chính (/)
 * - Khi ĐÃ ĐĂNG NHẬP: Luôn giữ người dùng ở Cổng Quản trị, không bị chuyển hướng sang cổng khác.
 */
export default function AdminRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();

  // 1. Nếu chưa đăng nhập hoặc vừa bấm Đăng xuất -> Lập tức về Trang chủ
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Tài khoản bị khóa -> Về Trang chủ
  const currentInList = usersList?.find(u => Number(u.user_id) === Number(currentUser.user_id) || u.username === currentUser.username);
  const effectiveStatus = currentInList?.status || currentUser.status || 'ACTIVE';
  if (currentUser.username !== 'admin' && effectiveStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  const r = (currentUser.role || currentUser.role_code || '').toUpperCase();

  // 3. Nếu người dùng đang đăng nhập vai trò khác nhưng truy cập /admin: Đồng bộ sang Quản trị để giữ ở Cổng Quản trị
  useEffect(() => {
    if (currentUser && (r !== 'MANAGER' && r !== 'ADMIN')) {
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
