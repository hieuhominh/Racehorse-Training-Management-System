import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Huấn luyện viên Trưởng (Role: TRAINER).
 * Tuân thủ chuẩn Protected Route của React Router:
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu đã đăng nhập nhưng không phải TRAINER: Tự động điều hướng về Trang chủ chính (/)
 * - Không hiển thị màn hình đăng nhập riêng lẻ cho từng vai trò.
 */
export default function TrainerRoute({ children }) {
  const { currentUser } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP: Lập tức chuyển hướng về Trang chủ chính
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Trường hợp ĐÃ ĐĂNG NHẬP nhưng không có quyền Huấn luyện viên: Chuyển hướng về Trang chủ chính
  if (currentUser.role !== 'TRAINER') {
    return <Navigate to="/" replace />;
  }

  // 3. Đúng vai trò Huấn luyện viên: Hiển thị nội dung
  return children;
}
