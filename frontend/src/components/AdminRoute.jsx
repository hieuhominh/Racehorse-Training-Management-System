import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Quản trị viên & Quản lý CLB (Role: ADMIN hoặc MANAGER).
 * Tuân thủ chuẩn Protected Route của React Router:
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu không có quyền Quản trị: Tự động điều hướng về Trang chủ chính (/)
 * - Không hiển thị màn hình đăng nhập riêng lẻ cho từng vai trò.
 */
export default function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP: Lập tức chuyển hướng về Trang chủ chính
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Trường hợp ĐÃ ĐĂNG NHẬP nhưng không có quyền Quản trị: Chuyển hướng về Trang chủ chính
  if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // 3. Đúng vai trò Quản trị viên: Hiển thị nội dung
  return children;
}
