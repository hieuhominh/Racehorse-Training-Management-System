import React, { useEffect } from 'react';
import { useAuth, FIXED_VETS } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Cổng Bác sĩ Thú y (VET).
 * Khi người dùng đang ở Cổng Thú Y thì luôn giữ nguyên ở vai trò Bác sĩ Thú y,
 * tuyệt đối không tự ý chuyển hướng sang cổng hay vai trò khác.
 */
export default function VetRoute({ children }) {
  const { currentUser, setCurrentUser, usersList } = useAuth();

  const r = (currentUser?.role || currentUser?.role_code || '').toUpperCase();

  useEffect(() => {
    if (!currentUser || r !== 'VET') {
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
