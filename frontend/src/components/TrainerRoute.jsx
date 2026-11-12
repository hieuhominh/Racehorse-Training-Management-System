import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, FIXED_TRAINERS } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Huấn luyện viên (TRAINER).
 * - Khi CHƯA ĐĂNG NHẬP hoặc VỪA ĐĂNG XUẤT: Điều hướng về Trang chủ chính (/)
 * - Khi ĐÃ ĐĂNG NHẬP: Luôn giữ người dùng ở Cổng Huấn luyện viên, không bị chuyển hướng sang cổng khác.
 */
export default function TrainerRoute({ children }) {
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

  // 3. Nếu người dùng đang đăng nhập vai trò khác nhưng truy cập /trainer: Đồng bộ sang HLV để giữ ở Cổng Huấn luyện viên
  useEffect(() => {
    if (currentUser && r !== 'TRAINER') {
      const defaultTrainer = (usersList && usersList.find(u => u.role === 'TRAINER')) || (FIXED_TRAINERS && FIXED_TRAINERS[0]) || {
        user_id: 2,
        username: 'trainer_truong',
        full_name: 'Trần Văn Hùng',
        role: 'TRAINER',
        role_code: 'TRAINER',
        status: 'ACTIVE'
      };
      if (setCurrentUser) {
        setCurrentUser(defaultTrainer);
        try {
          sessionStorage.setItem('matruong_auth_user', JSON.stringify(defaultTrainer));
        } catch {}
      }
    }
  }, [currentUser, r, setCurrentUser, usersList]);

  return children;
}
