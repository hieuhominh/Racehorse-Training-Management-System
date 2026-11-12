import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, FIXED_VETS } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Bác sĩ Thú y (VET).
 * - Khi CHƯA ĐĂNG NHẬP hoặc VỪA ĐĂNG XUẤT: Điều hướng về Trang chủ chính (/)
 * - Khi ĐÃ ĐĂNG NHẬP: Luôn giữ người dùng ở Cổng Thú Y, không bị chuyển hướng sang cổng khác.
 */
export default function VetRoute({ children }) {
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

  // 3. Nếu người dùng đang đăng nhập vai trò khác nhưng truy cập /vet: Đồng bộ sang Bác sĩ để giữ ở Cổng Thú Y
  useEffect(() => {
    if (currentUser && r !== 'VET') {
      const defaultVet = (usersList && usersList.find(u => u.role === 'VET')) || (FIXED_VETS && FIXED_VETS[0]) || {
        user_id: 5,
        username: 'vet_an',
        full_name: 'BS. Nguyễn An',
        role: 'VET',
        role_code: 'VET',
        status: 'ACTIVE'
      };
      if (setCurrentUser) {
        setCurrentUser(defaultVet);
        try {
          sessionStorage.setItem('matruong_auth_user', JSON.stringify(defaultVet));
        } catch {}
      }
    }
  }, [currentUser, r, setCurrentUser, usersList]);

  return children;
}
