import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getRolePortalPath } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Nhân viên Chăm sóc (Role: GROOM).
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu không phải GROOM: Tự động điều hướng về Cổng của vai trò người dùng đó
 */
export default function GroomRoute({ children }) {
  const { currentUser } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Chỉ cho phép GROOM truy cập; các vai trò khác về Cổng của họ
  const r = (currentUser.role || currentUser.role_code || '').toUpperCase();
  if (r !== 'GROOM') {
    return <Navigate to={getRolePortalPath(currentUser)} replace />;
  }

  // 3. Đúng quyền: Hiển thị nội dung
  return children;
}
