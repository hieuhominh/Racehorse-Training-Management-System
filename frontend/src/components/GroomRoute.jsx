import React, { useEffect } from 'react';
import { useAuth, FIXED_GROOMS } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Chăm Sóc (Groom).
 * Khi người dùng đang ở Cổng Groom thì luôn giữ nguyên ở vai trò Groom,
 * tuyệt đối không tự ý chuyển hướng sang cổng hay vai trò khác.
 */
export default function GroomRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();

  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  useEffect(() => {
    if (!currentUser || r !== 'GROOM') {
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

  return children;
}
