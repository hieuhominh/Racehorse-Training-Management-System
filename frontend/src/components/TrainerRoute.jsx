import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getRolePortalPath } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Huấn luyện viên Trưởng (Role: TRAINER).
 * Tuân thủ chuẩn Protected Route của React Router:
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu đã đăng nhập nhưng không phải TRAINER: Tự động điều hướng về Cổng của vai trò người dùng đó
 */
export default function TrainerRoute({ children }) {
  const { currentUser, usersList } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP: Lập tức chuyển hướng về Trang chủ chính
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Trường hợp TÀI KHOẢN BỊ KHÓA TRUY CẬP: Tuyệt đối không cho phép vào cổng
  const currentInList = usersList?.find(u => Number(u.user_id) === Number(currentUser.user_id) || u.username === currentUser.username);
  const effectiveStatus = currentInList?.status || currentUser.status || 'ACTIVE';
  if (effectiveStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  // 3. Chỉ cho phép vai trò TRAINER truy cập; các vai trò khác về Cổng của họ
  const r = (currentUser.role || currentUser.role_code || '').toUpperCase();
  if (r !== 'TRAINER') {
    return <Navigate to={getRolePortalPath(currentUser)} replace />;
  }

  // 4. Đúng vai trò Huấn luyện viên và tài khoản Hoạt động: Hiển thị nội dung
  return children;
}
