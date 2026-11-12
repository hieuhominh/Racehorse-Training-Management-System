import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Chủ sở hữu Ngựa (OWNER).
 * Khi người dùng đang ở Cổng Chủ sở hữu thì luôn giữ nguyên ở vai trò Chủ sở hữu,
 * tuyệt đối không tự ý chuyển hướng sang cổng hay vai trò khác.
 */
export default function OwnerRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();

  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  useEffect(() => {
    if (!currentUser || r !== 'OWNER') {
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

  return children;
}
