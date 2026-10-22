import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Bác sĩ Thú y (Role: VET hoặc MANAGER/ADMIN).
 * Tuân thủ chuẩn Protected Route của React Router:
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu đã đăng nhập nhưng không có quyền VET hoặc ADMIN: Tự động điều hướng về Trang chủ chính (/)
 */
export default function VetRoute({ children }) {
  const { currentUser } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Cho phép VET và ADMIN/MANAGER truy cập
  const hasAccess = currentUser.role === 'VET' || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  // 3. Đúng quyền: Hiển thị nội dung
  return children;
}
