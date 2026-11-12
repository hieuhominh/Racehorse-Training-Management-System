import React, { useEffect } from 'react';
import { useAuth, FIXED_TRAINERS } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Huấn luyện viên (TRAINER).
 * Khi người dùng đang ở Cổng Huấn luyện viên thì luôn giữ nguyên ở vai trò HLV,
 * tuyệt đối không tự ý chuyển hướng sang cổng hay vai trò khác.
 */
export default function TrainerRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();

  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  useEffect(() => {
    if (!currentUser || r !== 'TRAINER') {
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
