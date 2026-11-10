import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getRolePortalPath } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Bác sĩ Thú y (Role: VET).
 * Tuân thủ chuẩn Protected Route của React Router:
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu đã đăng nhập nhưng không phải VET: Tự động điều hướng về Cổng của vai trò người dùng đó
 */
export default function VetRoute({ children }) {
  const { currentUser, usersList } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Trường hợp TÀI KHOẢN BỊ KHÓA TRUY CẬP: Tuyệt đối không cho phép vào cổng
  const currentInList = usersList?.find(u => Number(u.user_id) === Number(currentUser.user_id) || u.username === currentUser.username);
  const effectiveStatus = currentInList?.status || currentUser.status || 'ACTIVE';
  if (effectiveStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  // 3. Chỉ cho phép VET truy cập; các vai trò khác về Cổng của họ
  const r = (currentUser.role || currentUser.role_code || '').toUpperCase();
  if (r !== 'VET') {
    return <Navigate to={getRolePortalPath(currentUser)} replace />;
  }

  // 4. Đúng quyền: Hiển thị nội dung
  return children;
}
