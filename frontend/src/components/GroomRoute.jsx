import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Nhân viên Chăm sóc (Role: GROOM hoặc MANAGER/ADMIN).
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu đã đăng nhập nhưng không có quyền GROOM hoặc ADMIN: Tự động điều hướng về Trang chủ chính (/)
 */
export default function GroomRoute({ children }) {
  const { currentUser } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Cho phép GROOM và ADMIN/MANAGER truy cập
  const hasAccess = 
    currentUser.role === 'GROOM' || 
    currentUser.role_code === 'GROOM' || 
    currentUser.role === 'MANAGER' || 
    currentUser.role === 'ADMIN';

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  // 3. Đúng quyền: Hiển thị nội dung
  return children;
}
