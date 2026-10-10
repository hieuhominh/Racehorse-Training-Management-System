import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { currentUser, usersList, updateUser, toggleUserStatus, registerUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState('overview');

  // State danh sách ngựa quản lý
  const [horses, setHorses] = useState([
    {
      id: 1,
      microchip: 'MC-VN-2022-001',
      name: 'Hắc Phong',
      breed: 'Thoroughbred',
      gender: 'Ngựa đực (Stallion)',
      stable: 'A3',
      owner: 'Phạm Tiến Thành',
      status: 'WATCH',
      statusText: 'Cần theo dõi',
      statusColor: '#F59E0B',
      locked: false
    },
    {
      id: 2,
      microchip: 'MC-VN-2021-014',
      name: 'Xích Thố',
      breed: 'Arabian',
      gender: 'Ngựa thiến (Gelding)',
      stable: 'A1',
      owner: 'Phạm Tiến Thành',
      status: 'ELIGIBLE',
      statusText: 'Đủ điều kiện thi đấu',
      statusColor: '#10B981',
      locked: false
    },
    {
      id: 3,
      microchip: 'MC-VN-2023-009',
      name: 'Phi Yến',
      breed: 'Thoroughbred',
      gender: 'Ngựa cái (Mare)',
      stable: 'A5',
      owner: 'Phạm Tiến Thành',
      status: 'INJURED',
      statusText: 'Chấn thương gân',
      statusColor: '#EF4444',
      locked: true
    },
    {
      id: 4,
      microchip: 'MC-VN-2022-088',
      name: 'Lôi Chấn',
      breed: 'Quarter Horse',
      gender: 'Ngựa đực (Stallion)',
      stable: 'B2',
      owner: 'Phạm Tiến Thành',
      status: 'QUARANTINE',
      statusText: 'Cách ly theo dõi',
      statusColor: '#8B5CF6',
      locked: true
    }
  ]);

  // State danh sách chuồng trại
  const [stables, setStables] = useState([
    { stall_code: 'A1', block: 'Block A', status: 'OCCUPIED', horse: 'Xích Thố' },
    { stall_code: 'A2', block: 'Block A', status: 'OCCUPIED', horse: 'Bạch Long' },
    { stall_code: 'A3', block: 'Block A', status: 'OCCUPIED', horse: 'Hắc Phong' },
    { stall_code: 'A4', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Vũ' },
    { stall_code: 'A5', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Yến' },
    { stall_code: 'A6', block: 'Block A', status: 'OCCUPIED', horse: 'Kim Kê' },
    { stall_code: 'B1', block: 'Block B', status: 'OCCUPIED', horse: 'Thanh Vân' },
    { stall_code: 'B2', block: 'Block B', status: 'OCCUPIED', horse: 'Lôi Chấn' },
    { stall_code: 'B3', block: 'Block B', status: 'OCCUPIED', horse: 'Hồng Sa' },
    { stall_code: 'B4', block: 'Block B', status: 'OCCUPIED', horse: 'Thiên Lý' },
    { stall_code: 'B5', block: 'Block B', status: 'OCCUPIED', horse: 'Bảo Mã' },
    { stall_code: 'B6', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)' }
  ]);

  // Modal thêm người dùng mới
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'TRAINER',
    password: '123'
  });

  // Modal sửa thông tin nhân sự
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserData, setEditUserData] = useState(null);

  // Modal xác nhận sửa thông tin
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);

  // Modal thêm ngựa mới
  const [showAddHorseModal, setShowAddHorseModal] = useState(false);
  const [newHorseData, setNewHorseData] = useState({
    name: '',
    microchip: '',
    breed: 'Thoroughbred',
    gender: 'Ngựa đực (Stallion)',
    stable: 'B6',
    owner: 'Phạm Tiến Thành'
  });

  // Nhật ký hệ thống Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '10/10/2026 00:25', user: 'vet_an (Bác sĩ Thú y)', action: 'KHÓA HUẤN LUYỆN KHẨN CẤP', detail: 'Khóa bài tập nặng chiến mã Phi Yến do giãn gân chân trái' },
    { id: 2, time: '10/10/2026 00:15', user: 'admin (Ban Quản lý)', action: 'ĐỒNG BỘ CSDL HỆ THỐNG', detail: 'Nạp lại schema 10 bảng dữ liệu chuẩn Microsoft SQL Server 2019' },
    { id: 3, time: '09/10/2026 18:30', user: 'trainer_truong (HLV Trưởng)', action: 'LẬP GIÁO ÁN HUẤN LUYỆN', detail: 'Thiết kế bài chạy nước rút 1,600m sân cát cho Hắc Phong' },
    { id: 4, time: '09/10/2026 14:00', user: 'groom_nam (Chăm sóc chuồng)', action: 'CHECKLIST DINH DƯỠNG', detail: 'Hoàn tất bữa chiều và ngâm chân đá lạnh cho đàn ngựa Block A' },
    { id: 5, time: '09/10/2026 10:00', user: 'admin (Ban Quản lý)', action: 'PHÊ DUYỆT NGÂN SÁCH GIẢI', detail: 'Duyệt kinh phí 500.000.000 ₫ cho Giải Đua Vô địch Đại Nam 2026' }
  ]);

  // Thêm người dùng mới
  const handleCreateUser = (e) => {
    e.preventDefault();
    const roleLabels = {
      'MANAGER': 'Quản lý Câu lạc bộ',
      'TRAINER': 'Huấn luyện viên Trưởng',
      'VET': 'Bác sĩ Thú y',
      'GROOM': 'Nhân viên Chăm sóc',
      'OWNER': 'Chủ sở hữu Ngựa'
    };
    registerUser({
      ...newUserData,
      role_name: roleLabels[newUserData.role] || newUserData.role
    });
    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'TẠO TÀI KHOẢN MỚI',
        detail: `Thêm nhân sự ${newUserData.full_name} (${newUserData.username}) với vai trò ${roleLabels[newUserData.role]}`
      },
      ...prev
    ]);
    setShowAddUserModal(false);
    setNewUserData({ username: '', full_name: '', email: '', phone: '', role: 'TRAINER', password: '123' });
  };

  // Mở modal sửa nhân sự
  const handleOpenEditUser = (user) => {
    setEditUserData({
      user_id: user.user_id,
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'OWNER',
      role_name: user.role_name || '',
      status: user.status || 'ACTIVE'
    });
    setShowEditUserModal(true);
  };

  // Khi bấm Lưu trong modal sửa -> hiển thị popup xác nhận
  const handleRequestSaveEditUser = (e) => {
    e.preventDefault();
    if (!editUserData.full_name?.trim() || !editUserData.username?.trim() || !editUserData.email?.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }
    setShowConfirmEditModal(true);
  };

  // Xác nhận sửa thông tin người dùng
  const handleConfirmSaveEditUser = () => {
    if (!editUserData) return;

    const roleLabels = {
      'MANAGER': 'Quản lý Câu lạc bộ',
      'TRAINER': 'Huấn luyện viên Trưởng',
      'VET': 'Bác sĩ Thú y',
      'GROOM': 'Nhân viên Chăm sóc',
      'OWNER': 'Chủ sở hữu Ngựa'
    };

    const updatedRoleName = roleLabels[editUserData.role] || editUserData.role_name || editUserData.role;

    updateUser(editUserData.user_id, {
      full_name: editUserData.full_name,
      username: editUserData.username,
      email: editUserData.email,
      phone: editUserData.phone,
      role: editUserData.role,
      role_name: updatedRoleName,
      status: editUserData.status
    });

    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'CẬP NHẬT NHÂN SỰ',
        detail: `Sửa thông tin nhân sự #${editUserData.user_id} (${editUserData.full_name} - @${editUserData.username})`
      },
      ...prev
    ]);

    setShowConfirmEditModal(false);
    setShowEditUserModal(false);
    setEditUserData(null);
  };

  // Thêm ngựa mới
  const handleCreateHorse = (e) => {
    e.preventDefault();
    const newHorse = {
      id: Date.now(),
      microchip: newHorseData.microchip || `MC-VN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: newHorseData.name,
      breed: newHorseData.breed,
      gender: newHorseData.gender,
      stable: newHorseData.stable,
      owner: newHorseData.owner,
      status: 'ELIGIBLE',
      statusText: 'Đủ điều kiện thi đấu',
      statusColor: '#10B981',
      locked: false
    };
    setHorses(prev => [...prev, newHorse]);
    // Cập nhật chuồng B6 thành occupied
    setStables(prev => prev.map(s => s.stall_code === newHorseData.stable ? { ...s, status: 'OCCUPIED', horse: newHorseData.name } : s));
    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser.username} (Admin)`,
        action: 'THÊM CHIẾN MÃ MỚI',
        detail: `Nhập hồ sơ chiến mã ${newHorse.name} (Chip: ${newHorse.microchip}) vào ô chuồng ${newHorse.stable}`
      },
      ...prev
    ]);
    setShowAddHorseModal(false);
    setNewHorseData({ name: '', microchip: '', breed: 'Thoroughbred', gender: 'Ngựa đực (Stallion)', stable: 'B6', owner: 'Phạm Tiến Thành' });
  };

  // Thay đổi trạng thái chuồng
  const handleToggleStable = (stallCode) => {
    setStables(prev => prev.map(s => {
      if (s.stall_code === stallCode) {
        const nextStatus = s.status === 'AVAILABLE' ? 'OCCUPIED' : s.status === 'OCCUPIED' ? 'MAINTENANCE' : 'AVAILABLE';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* 1. TOP HEADER BANNER QUẢN TRỊ */}
      <div style={{
        background: 'linear-gradient(180deg, #1A1510 0%, #0F0E0C 100%)',
        borderBottom: '1px solid rgba(201, 162, 39, 0.3)',
        padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3.5vw, 36px)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(201, 162, 39, 0.2)',
                color: 'var(--brass, #C9A227)',
                border: '1px solid var(--brass, #C9A227)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em'
              }}>
                👑 BAN QUẢN TRỊ & QUẢN LÝ CÂU LẠC BỘ
              </span>
              <span style={{ fontSize: '13px', color: '#9DA6A0' }}>
                Phiên đăng nhập: <b>{currentUser?.full_name}</b> ({currentUser?.username})
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--display, serif)', fontSize: 'clamp(22px, 3.5vw, 28px)', color: '#FFFFFF', margin: '8px 0 0', letterSpacing: '0.02em' }}>
              Trung Tâm Điều Hành Mã Trường
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                padding: '8px 14px',
                background: 'rgba(232, 227, 215, 0.08)',
                border: '1px solid rgba(232, 227, 215, 0.2)',
                borderRadius: '6px',
                color: '#E8E3D7',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              👁️ Xem Public
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'rgba(217, 83, 79, 0.2)',
                border: '1px solid #D9534F',
                borderRadius: '6px',
                color: '#FF8885',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG CÁC TAB CHỨC NĂNG CỦA ADMIN */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px clamp(16px, 3.5vw, 36px) 0',
        display: 'flex',
        borderBottom: '1px solid rgba(232, 227, 215, 0.12)',
        gap: '20px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'overview', label: '📊 Tổng quan & Báo cáo', desc: 'KPI đàn ngựa & cơ sở vật chất' },
          { id: 'users', label: '👥 Quản lý Nhân sự & RBAC', desc: 'Tài khoản 5 vai trò & phân quyền' },
          { id: 'horses', label: '🐎 Danh mục Chiến mã', desc: 'Hồ sơ, chip điện tử, khóa y tế' },
          { id: 'stables', label: '🏠 Quản lý Chuồng trại', desc: '12 ô chuồng Block A & B' },
          { id: 'audit', label: '📜 Nhật ký & Phê duyệt', desc: 'Lịch sử thao tác & ngân sách giải' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--brass, #C9A227)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--brass, #C9A227)' : '#9DA6A0',
              fontFamily: 'var(--body, sans-serif)',
              fontSize: '14.5px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '11px', color: '#68726B', marginTop: '2px', fontWeight: 400 }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* 3. NỘI DUNG TỪNG TAB */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px clamp(16px, 3.5vw, 36px)' }}>

        {/* ===================== TAB 1: TỔNG QUAN & BÁO CÁO ===================== */}
        {activeTab === 'overview' && (
          <div>
            {/* 4 Card KPI hàng đầu */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#141311', border: '1px solid rgba(201, 162, 39, 0.25)', borderRadius: '10px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9DA6A0', fontSize: '13px' }}>
                  <span>TỔNG ĐÀN CHIẾN MÃ</span>
                  <span style={{ fontSize: '20px' }}>🐎</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '10px 0 4px' }}>
                  {horses.length} con
                </div>
                <div style={{ fontSize: '12px', color: '#10B981' }}>
                  ● 2 Đủ điều kiện · 1 Theo dõi · 1 Chấn thương
                </div>
              </div>

              <div style={{ background: '#141311', border: '1px solid rgba(201, 162, 39, 0.25)', borderRadius: '10px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9DA6A0', fontSize: '13px' }}>
                  <span>CÔNG SUẤT CHUỒNG TRẠI</span>
                  <span style={{ fontSize: '20px' }}>🏠</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '10px 0 4px' }}>
                  {stables.filter(s => s.status === 'OCCUPIED').length} / {stables.length} ô
                </div>
                <div style={{ fontSize: '12px', color: 'var(--brass, #C9A227)' }}>
                  ● Tỉ lệ lấp đầy: 91.7% (1 chuồng trống sẵn sàng)
                </div>
              </div>

              <div style={{ background: '#141311', border: '1px solid rgba(201, 162, 39, 0.25)', borderRadius: '10px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9DA6A0', fontSize: '13px' }}>
                  <span>TỔNG NHÂN SỰ HỆ THỐNG</span>
                  <span style={{ fontSize: '20px' }}>👥</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '10px 0 4px' }}>
                  {usersList.length} tài khoản
                </div>
                <div style={{ fontSize: '12px', color: '#38BDF8' }}>
                  ● Đầy đủ 5 vai trò nghiệp vụ (RBAC kiểm soát)
                </div>
              </div>

              <div style={{ background: '#141311', border: '1px solid rgba(201, 162, 39, 0.25)', borderRadius: '10px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9DA6A0', fontSize: '13px' }}>
                  <span>QUỸ GIẢI ĐẤU & HOẠT ĐỘNG</span>
                  <span style={{ fontSize: '20px' }}>🏆</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brass, #C9A227)', margin: '10px 0 4px' }}>
                  500.000.000 ₫
                </div>
                <div style={{ fontSize: '12px', color: '#E8E3D7' }}>
                  ● Giải Vô địch Đại Nam 2026 (Đã duyệt)
                </div>
              </div>
            </div>

            {/* Bảng Cảnh báo khẩn cấp & Tóm tắt phân bổ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
              <div style={{ background: '#12110F', border: '1px solid rgba(232, 227, 215, 0.14)', borderRadius: '10px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--brass, #C9A227)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Cảnh Báo Trực Ban Điều Hành
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '14px' }}>🔒 Lệnh Khóa Huấn Luyện Y Tế: Ngựa "Phi Yến" (Ô A5)</div>
                    <div style={{ fontSize: '13px', color: '#C8C4B7', marginTop: '4px' }}>
                      Bác sĩ thú y đã kích hoạt khóa y tế do giãn dây chằng. HLV không thể xếp lịch thi đấu cho đến khi có xác nhận phục hồi.
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: '14px' }}>⚠️ Theo dõi thể lực nhịp tim: Ngựa "Hắc Phong" (Ô A3)</div>
                    <div style={{ fontSize: '13px', color: '#C8C4B7', marginTop: '4px' }}>
                      Buổi tập gần nhất đạt nhịp tim 210 bpm (vượt ngưỡng cảnh báo an toàn). Đã chuyển thông báo cho Groom tăng khẩu phần điện giải.
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', fontSize: '14px' }}>✓ Sẵn sàng thi đấu: Ngựa "Xích Thố" (Ô A1)</div>
                    <div style={{ fontSize: '13px', color: '#C8C4B7', marginTop: '4px' }}>
                      Đạt phong độ 9.2/10, Thú y đã duyệt chứng nhận kiểm dịch, đủ điều kiện dự Vòng loại Đại Nam.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#12110F', border: '1px solid rgba(232, 227, 215, 0.14)', borderRadius: '10px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '16px' }}>
                  📌 Quy Trình Nghiệp Vụ Tương Tác Giữa Các Vai Trò
                </h3>
                <div style={{ fontSize: '13.5px', color: '#9DA6A0', lineHeight: 1.7 }}>
                  <p>Hệ thống vận hành theo chu trình khép kín và tự động đối soát:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><b>Ban Quản lý (Admin)</b>: Cấp tài khoản, giám sát ngân sách, phân bổ ô chuồng.</li>
                    <li><b>Thú y (Vet)</b>: Độc quyền quyền <i>Khóa / Mở khóa y tế</i> để bảo vệ tính mạng ngựa đua.</li>
                    <li><b>HLV (Trainer)</b>: Lập giáo án và theo dõi telemetry chỉ số buổi chạy.</li>
                    <li><b>Groom (Chăm sóc)</b>: Báo cáo bữa ăn và sự cố thực tế chuồng trại.</li>
                    <li><b>Chủ ngựa (Owner)</b>: Theo dõi báo cáo minh bạch chi phí và kết quả giải.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: QUẢN LÝ NHÂN SỰ & RBAC ===================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', margin: 0 }}>Danh Sách Tài Khoản & Phân Quyền RBAC</h2>
                <p style={{ fontSize: '13px', color: '#9DA6A0', margin: '4px 0 0' }}>
                  Đồng bộ trực tiếp với bảng <code>Users</code> và <code>Roles</code> trong CSDL SQL Server 2019.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--brass, #C9A227)',
                  color: '#14100A',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                + Thêm Nhân Sự Mới
              </button>
            </div>

            <div style={{ background: '#12110F', border: '1px solid rgba(232, 227, 215, 0.12)', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#1A1815', borderBottom: '1px solid rgba(232, 227, 215, 0.12)', color: '#9DA6A0' }}>
                    <th style={{ padding: '14px 18px' }}>ID</th>
                    <th style={{ padding: '14px 18px' }}>Tài khoản / Họ Tên</th>
                    <th style={{ padding: '14px 18px' }}>Email & Điện thoại</th>
                    <th style={{ padding: '14px 18px' }}>Vai trò Nghiệp vụ (Role)</th>
                    <th style={{ padding: '14px 18px' }}>Trạng thái</th>
                    <th style={{ padding: '14px 18px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const roleBadgeColor = {
                      'MANAGER': '#EF4444',
                      'TRAINER': '#3B82F6',
                      'VET': '#10B981',
                      'GROOM': '#F59E0B',
                      'OWNER': '#8B5CF6'
                    }[u.role] || '#9DA6A0';

                    return (
                      <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(232, 227, 215, 0.06)' }}>
                        <td style={{ padding: '14px 18px', color: '#68726B' }}>#{u.user_id}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{u.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#9DA6A0' }}>@{u.username}</div>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#C8C4B7' }}>
                          <div>{u.email}</div>
                          <div style={{ fontSize: '12px', color: '#68726B' }}>{u.phone}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: `${roleBadgeColor}20`,
                            color: roleBadgeColor,
                            border: `1px solid ${roleBadgeColor}50`
                          }}>
                            {u.role_name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12.5px',
                            color: u.status === 'ACTIVE' ? '#10B981' : '#EF4444'
                          }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.status === 'ACTIVE' ? '#10B981' : '#EF4444' }} />
                            {u.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              title="Sửa thông tin nhân sự"
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(201, 162, 39, 0.15)',
                                border: '1px solid var(--brass, #C9A227)',
                                color: 'var(--brass, #C9A227)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              ✏️ Sửa
                            </button>
                            {u.username !== 'admin' && (
                              <button
                                onClick={() => toggleUserStatus(u.user_id)}
                                style={{
                                  padding: '6px 12px',
                                  background: u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  border: `1px solid ${u.status === 'ACTIVE' ? '#EF4444' : '#10B981'}`,
                                  color: u.status === 'ACTIVE' ? '#FF7675' : '#10B981',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: DANH MỤC CHIẾN MÃ ===================== */}
        {activeTab === 'horses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', margin: 0 }}>Danh Mục Quản Lý Chiến Mã Toàn Trại</h2>
                <p style={{ fontSize: '13px', color: '#9DA6A0', margin: '4px 0 0' }}>
                  Giám sát mã định danh điện tử, phân bổ ô chuồng và trạng thái khóa y tế.
                </p>
              </div>
              <button
                onClick={() => setShowAddHorseModal(true)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--brass, #C9A227)',
                  color: '#14100A',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                + Thêm Chiến Mã Mới
              </button>
            </div>

            <div style={{ background: '#12110F', border: '1px solid rgba(232, 227, 215, 0.12)', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#1A1815', borderBottom: '1px solid rgba(232, 227, 215, 0.12)', color: '#9DA6A0' }}>
                    <th style={{ padding: '14px 18px' }}>Mã Chip / Tên Ngựa</th>
                    <th style={{ padding: '14px 18px' }}>Giống loài & Giới tính</th>
                    <th style={{ padding: '14px 18px' }}>Chuồng phân bổ</th>
                    <th style={{ padding: '14px 18px' }}>Chủ sở hữu</th>
                    <th style={{ padding: '14px 18px' }}>Trạng thái Sức khỏe</th>
                    <th style={{ padding: '14px 18px' }}>Khóa Y Tế Thú Y</th>
                  </tr>
                </thead>
                <tbody>
                  {horses.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(232, 227, 215, 0.06)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brass, #C9A227)', fontSize: '15px' }}>{h.name}</div>
                        <div style={{ fontSize: '12px', color: '#68726B', fontFamily: 'monospace' }}>{h.microchip}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#C8C4B7' }}>
                        <div>{h.breed}</div>
                        <div style={{ fontSize: '12px', color: '#68726B' }}>{h.gender}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(232, 227, 215, 0.1)', borderRadius: '4px', fontWeight: 600 }}>
                          Ô {h.stable}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#C8C4B7' }}>{h.owner}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: `${h.statusColor}20`,
                          color: h.statusColor,
                          border: `1px solid ${h.statusColor}40`
                        }}>
                          {h.statusText}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {h.locked ? (
                          <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '12px' }}>
                            🔒 ĐANG KHÓA BỞI THÚ Y
                          </span>
                        ) : (
                          <span style={{ color: '#10B981', fontSize: '12px' }}>
                            ✓ Bình thường
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: QUẢN LÝ CHUỒNG TRẠI ===================== */}
        {activeTab === 'stables' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Sơ Đồ Phân Bổ Chuồng Trại (Block A & Block B)</h2>
              <p style={{ fontSize: '13px', color: '#9DA6A0', margin: '4px 0 0' }}>
                Quản lý hiện trạng 12 chuồng. Bấm vào nút hành động để chuyển trạng thái Sử dụng / Bảo trì.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {stables.map(s => {
                const isOccupied = s.status === 'OCCUPIED';
                const isAvailable = s.status === 'AVAILABLE';
                return (
                  <div key={s.stall_code} style={{
                    background: '#141311',
                    border: `1px solid ${isOccupied ? 'rgba(201, 162, 39, 0.4)' : isAvailable ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    borderRadius: '8px',
                    padding: '18px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{s.stall_code}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: isOccupied ? 'rgba(201, 162, 39, 0.2)' : isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isOccupied ? 'var(--brass, #C9A227)' : isAvailable ? '#10B981' : '#EF4444'
                      }}>
                        {isOccupied ? 'ĐANG DÙNG' : isAvailable ? 'CÒN TRỐNG' : 'BẢO TRÌ'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#68726B' }}>{s.block}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: isOccupied ? '#FFFFFF' : '#68726B', marginTop: '6px' }}>
                      Ngựa: {s.horse}
                    </div>

                    <button
                      onClick={() => handleToggleStable(s.stall_code)}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '6px 0',
                        background: 'rgba(232, 227, 215, 0.08)',
                        border: '1px solid rgba(232, 227, 215, 0.15)',
                        borderRadius: '4px',
                        color: '#E8E3D7',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      Đổi trạng thái
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: NHẬT KÝ & PHÊ DUYỆT ===================== */}
        {activeTab === 'audit' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Nhật Ký Thao Tác Hệ Thống (Audit Logs)</h2>
              <p style={{ fontSize: '13px', color: '#9DA6A0', margin: '4px 0 0' }}>
                Ghi nhận minh bạch mọi hành động tác nghiệp của các vai trò trong toàn bộ trang trại.
              </p>
            </div>

            <div style={{ background: '#12110F', border: '1px solid rgba(232, 227, 215, 0.12)', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#1A1815', borderBottom: '1px solid rgba(232, 227, 215, 0.12)', color: '#9DA6A0' }}>
                    <th style={{ padding: '14px 18px' }}>Thời gian</th>
                    <th style={{ padding: '14px 18px' }}>Người thực hiện</th>
                    <th style={{ padding: '14px 18px' }}>Hành động</th>
                    <th style={{ padding: '14px 18px' }}>Nội dung chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(232, 227, 215, 0.06)' }}>
                      <td style={{ padding: '14px 18px', color: '#68726B', whiteSpace: 'nowrap' }}>{log.time}</td>
                      <td style={{ padding: '14px 18px', color: '#FFFFFF', fontWeight: 600 }}>{log.user}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(201, 162, 39, 0.15)',
                          color: 'var(--brass, #C9A227)',
                          border: '1px solid rgba(201, 162, 39, 0.3)'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#C8C4B7' }}>{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ===================== MODAL THÊM NGƯỜI DÙNG ===================== */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: '#151311',
            border: '1px solid rgba(201, 162, 39, 0.4)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Thêm Nhân Sự / Người Dùng Mới</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Văn Bảo"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: trainer_bao"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="bao@matruong.vn"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0901234567"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Vai trò Nghiệp vụ (RBAC)</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="TRAINER">Huấn luyện viên Trưởng (Trainer)</option>
                  <option value="VET">Bác sĩ Thú y (Veterinarian)</option>
                  <option value="GROOM">Nhân viên Chăm sóc (Groom)</option>
                  <option value="OWNER">Chủ sở hữu Ngựa (Owner)</option>
                  <option value="MANAGER">Ban Quản lý Câu lạc bộ (Club Manager)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass, #C9A227)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Lưu Nhân Sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL CHỈNH SỬA THÔNG TIN NHÂN SỰ ===================== */}
      {showEditUserModal && editUserData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999998
        }}>
          <div style={{
            background: '#151311',
            border: '1px solid rgba(201, 162, 39, 0.45)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            color: '#FFFFFF',
            boxShadow: '0 20px 40px rgba(0,0,0,0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✏️</span> Sửa Thông Tin Nhân Sự
              </h3>
              <span style={{ fontSize: '12px', background: 'rgba(201, 162, 39, 0.15)', color: 'var(--brass, #C9A227)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(201, 162, 39, 0.3)', fontWeight: 600 }}>
                ID: #{editUserData.user_id}
              </span>
            </div>

            <form onSubmit={handleRequestSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Họ và tên nhân sự"
                  value={editUserData.full_name}
                  onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Vai trò Nghiệp vụ (RBAC Role)</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="TRAINER">Huấn luyện viên Trưởng (Trainer)</option>
                  <option value="VET">Bác sĩ Thú y (Veterinarian)</option>
                  <option value="GROOM">Nhân viên Chăm sóc (Groom)</option>
                  <option value="OWNER">Chủ sở hữu Ngựa (Owner)</option>
                  <option value="MANAGER">Ban Quản lý Câu lạc bộ (Club Manager)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Trạng thái tài khoản</label>
                <select
                  value={editUserData.status}
                  onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Tạm khóa (INACTIVE)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => { setShowEditUserModal(false); setEditUserData(null); }}
                  style={{ flex: 1, padding: '11px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', background: 'var(--brass, #C9A227)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL XÁC NHẬN SỬA THÔNG TIN ===================== */}
      {showConfirmEditModal && editUserData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000000
        }}>
          <div style={{
            background: '#1A1714',
            border: '2px solid var(--brass, #C9A227)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px 24px',
            color: '#FFFFFF',
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.9)'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(201, 162, 39, 0.15)', border: '1px solid var(--brass, #C9A227)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
              ⚠️
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
              Xác nhận sửa thông tin
            </h3>

            <p style={{ fontSize: '15px', color: '#E8E3D7', lineHeight: '1.5', margin: '0 0 16px', fontWeight: 500 }}>
              Bạn có chắc chắn sửa thông tin này không?
            </p>

            <div style={{ background: '#0F0E0C', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(232, 227, 215, 0.1)', marginBottom: '22px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ color: '#9DA6A0', marginBottom: '4px' }}>Nhân sự ID: <b style={{ color: '#FFFFFF' }}>#{editUserData.user_id}</b></div>
              <div style={{ color: '#9DA6A0', marginBottom: '4px' }}>Họ tên mới: <b style={{ color: '#FFFFFF' }}>{editUserData.full_name}</b></div>
              <div style={{ color: '#9DA6A0', marginBottom: '4px' }}>Email: <b style={{ color: '#FFFFFF' }}>{editUserData.email}</b></div>
              <div style={{ color: '#9DA6A0' }}>Số điện thoại: <b style={{ color: '#FFFFFF' }}>{editUserData.phone}</b></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmEditModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'rgba(232, 227, 215, 0.12)',
                  border: '1px solid rgba(232, 227, 215, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13.5px'
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveEditUser}
                style={{
                  flex: 1.2,
                  padding: '11px',
                  background: 'var(--brass, #C9A227)',
                  border: 'none',
                  color: '#14100A',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  boxShadow: '0 4px 12px rgba(201, 162, 39, 0.3)'
                }}
              >
                Có, xác nhận sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL THÊM CHIẾN MÃ ===================== */}
      {showAddHorseModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: '#151311',
            border: '1px solid rgba(201, 162, 39, 0.4)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Thêm Hồ Sơ Chiến Mã Mới</h3>
            <form onSubmit={handleCreateHorse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Tên chiến mã</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dạ Báo"
                  value={newHorseData.name}
                  onChange={(e) => setNewHorseData({ ...newHorseData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Giống loài</label>
                <select
                  value={newHorseData.breed}
                  onChange={(e) => setNewHorseData({ ...newHorseData, breed: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="Thoroughbred">Thoroughbred (Thuần chủng Anh)</option>
                  <option value="Arabian">Arabian (Ả Rập)</option>
                  <option value="Quarter Horse">Quarter Horse</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#9DA6A0', display: 'block', marginBottom: '4px' }}>Phân bổ vào ô chuồng</label>
                <select
                  value={newHorseData.stable}
                  onChange={(e) => setNewHorseData({ ...newHorseData, stable: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid rgba(232, 227, 215, 0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="B6">Ô B6 (Đang còn trống)</option>
                  <option value="A1">Ô A1</option>
                  <option value="B1">Ô B1</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddHorseModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass, #C9A227)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Lưu Chiến Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
