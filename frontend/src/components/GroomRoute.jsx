import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, FIXED_GROOMS } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Chăm Sóc (Groom).
 * - Khi CHƯA ĐĂNG NHẬP hoặc VỪA ĐĂNG XUẤT: Điều hướng về Trang chủ chính (/)
 * - Khi ĐÃ ĐĂNG NHẬP: Luôn giữ người dùng ở Cổng Groom, không bị chuyển hướng sang cổng khác.
 */
export default function GroomRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();
  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  // 1. Đặt Hook ở đầu component để tuân thủ tuyệt đối React Rules of Hooks
  useEffect(() => {
    if (currentUser && r !== 'GROOM') {
      const defaultGroom = (usersList && usersList.find(u => u.role === 'GROOM')) || (FIXED_GROOMS && FIXED_GROOMS[0]) || {
        user_id: 8,
        username: 'groom_nam',
        full_name: 'Lê Hoàng Nam',
        role: 'GROOM',
        role_code: 'GROOM',
        status: 'ACTIVE'
      };
      if (setCurrentUser) {
        setCurrentUser(defaultGroom);
        try {
          sessionStorage.setItem('matruong_auth_user', JSON.stringify(defaultGroom));
        } catch {}
      }
    }
  }, [currentUser, r, setCurrentUser, usersList]);

  // 2. Nếu chưa đăng nhập hoặc vừa bấm Đăng xuất -> Lập tức về Trang chủ
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 3. Tài khoản bị khóa -> Về Trang chủ
  const currentInList = usersList?.find(u => Number(u.user_id) === Number(currentUser.user_id) || u.username === currentUser.username);
  const effectiveStatus = currentInList?.status || currentUser.status || 'ACTIVE';
  if (currentUser.username !== 'admin' && effectiveStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  return children;
}
