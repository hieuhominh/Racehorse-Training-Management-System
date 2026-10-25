import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Chủ sở hữu Ngựa (Role: OWNER hoặc MANAGER/ADMIN).
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu không có quyền OWNER hoặc ADMIN: Tự động điều hướng về Trang chủ chính (/)
 */
export default function OwnerRoute({ children }) {
  const { currentUser } = useAuth();

  // 1. Chưa đăng nhập
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Cho phép OWNER và ADMIN/MANAGER truy cập
  const hasAccess = 
    currentUser.role === 'OWNER' || 
    currentUser.role_code === 'OWNER' || 
    currentUser.role === 'MANAGER' || 
    currentUser.role === 'ADMIN';

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  // 3. Đúng quyền: Hiển thị nội dung
  return children;
}
