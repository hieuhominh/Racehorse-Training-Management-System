import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getRolePortalPath } from '../context/AuthContext';

/**
 * Route bảo vệ dành riêng cho Quản trị viên & Quản lý CLB (Role: ADMIN hoặc MANAGER).
 * - Nếu chưa đăng nhập: Tự động điều hướng về Trang chủ chính (/)
 * - Nếu không có quyền Quản trị: Tự động điều hướng về đúng Cổng của vai trò mình
 */
export default function AdminRoute({ children }) {
  const { currentUser, usersList } = useAuth();

  // 1. Trường hợp CHƯA ĐĂNG NHẬP: Chuyển hướng về Trang chủ
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Kiểm tra nếu tài khoản bị khóa truy cập
  const currentInList = usersList?.find(u => Number(u.user_id) === Number(currentUser.user_id) || u.username === currentUser.username);
  const effectiveStatus = currentInList?.status || currentUser.status || 'ACTIVE';
  if (currentUser.username !== 'admin' && effectiveStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  // 3. Kiểm tra vai trò: Nếu không phải ADMIN/MANAGER thì chuyển về Cổng của chính họ
  const r = (currentUser.role || currentUser.role_code || '').toUpperCase();
  if (r !== 'MANAGER' && r !== 'ADMIN') {
    return <Navigate to={getRolePortalPath(currentUser)} replace />;
  }

  return children;
}
