import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Chủ sở hữu Ngựa (OWNER).
 * - Khi CHƯA ĐĂNG NHẬP hoặc VỪA ĐĂNG XUẤT: Điều hướng về Trang chủ chính (/)
 * - Khi ĐÃ ĐĂNG NHẬP: Luôn giữ người dùng ở Cổng Chủ sở hữu, không bị chuyển hướng sang cổng khác.
 */
export default function OwnerRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();
  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  // 1. Đặt Hook ở đầu component để tuân thủ tuyệt đối React Rules of Hooks
  useEffect(() => {
    if (currentUser && r !== 'OWNER') {
      const defaultOwner = (usersList && usersList.find(u => u.role === 'OWNER')) || {
        user_id: 100,
        username: 'owner',
        full_name: 'Chủ sở hữu Ngựa',
        role: 'OWNER',
        role_code: 'OWNER',
        status: 'ACTIVE'
      };
      if (setCurrentUser) {
        setCurrentUser(defaultOwner);
        try {
          sessionStorage.setItem('matruong_auth_user', JSON.stringify(defaultOwner));
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
