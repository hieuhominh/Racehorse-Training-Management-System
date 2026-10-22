import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

// Minimalist SVG Icons
const IconGlobe = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
  </svg>
);

const IconOverview = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const IconHorse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
  </svg>
);

const IconStable = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconAudit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export default function AdminPage() {
  const { currentUser, usersList, updateUser, toggleUserStatus, registerUser, logout } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [horseFilter, setHorseFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [stableFilter, setStableFilter] = useState('ALL');

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
      locked: false,
      desc: 'Chiến mã cự ly 1.600m, thể lực sung mãn, đang theo dõi tải nhịp tim cao.'
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
      locked: false,
      desc: 'Sức bền tuyệt hảo 2.400m sân cỏ, đã vượt qua kiểm định y tế Thú y.'
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
      locked: true,
      desc: 'Bác sĩ Thú y kích hoạt lệnh khóa do giãn gân chân trái. Cấm tập nặng.'
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
      locked: true,
      desc: 'Đang theo dõi kiểm dịch dịch tễ tại khu cách ly Block B. Sức khỏe ổn định.'
    }
  ]);

  // State danh sách chuồng trại
  const [stables, setStables] = useState([
    { stall_code: 'A1', block: 'Block A', status: 'OCCUPIED', horse: 'Xích Thố', area: '14 m²', dim: '3.8 x 3.8m' },
    { stall_code: 'A2', block: 'Block A', status: 'OCCUPIED', horse: 'Bạch Long', area: '14 m²', dim: '3.8 x 3.8m' },
    { stall_code: 'A3', block: 'Block A', status: 'OCCUPIED', horse: 'Hắc Phong', area: '14 m²', dim: '3.8 x 3.8m' },
    { stall_code: 'A4', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Vũ', area: '14 m²', dim: '3.8 x 3.8m' },
    { stall_code: 'A5', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Yến', area: '14 m²', dim: '3.8 x 3.8m' },
    { stall_code: 'A6', block: 'Block A', status: 'OCCUPIED', horse: 'Kim Kê', area: '14 m²', dim: '3.8 x 3.8m' },
    { stall_code: 'B1', block: 'Block B', status: 'OCCUPIED', horse: 'Thanh Vân', area: '16 m²', dim: '4.0 x 4.0m' },
    { stall_code: 'B2', block: 'Block B', status: 'OCCUPIED', horse: 'Lôi Chấn', area: '16 m²', dim: '4.0 x 4.0m' },
    { stall_code: 'B3', block: 'Block B', status: 'OCCUPIED', horse: 'Hồng Sa', area: '16 m²', dim: '4.0 x 4.0m' },
    { stall_code: 'B4', block: 'Block B', status: 'OCCUPIED', horse: 'Thiên Lý', area: '16 m²', dim: '4.0 x 4.0m' },
    { stall_code: 'B5', block: 'Block B', status: 'OCCUPIED', horse: 'Bảo Mã', area: '16 m²', dim: '4.0 x 4.0m' },
    { stall_code: 'B6', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', area: '16 m²', dim: '4.0 x 4.0m' }
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

  // Thao tác khóa / mở y tế cho ngựa
  const handleToggleHorseLock = (horseId) => {
    setHorses(prev => prev.map(h => {
      if (h.id === horseId) {
        const nextLocked = !h.locked;
        return {
          ...h,
          locked: nextLocked,
          status: nextLocked ? 'INJURED' : 'ELIGIBLE',
          statusText: nextLocked ? 'Khóa y tế Thú y' : 'Đủ điều kiện thi đấu',
          statusColor: nextLocked ? '#EF4444' : '#10B981'
        };
      }
      return h;
    }));
    const target = horses.find(item => item.id === horseId);
    if (target) {
      setAuditLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleString('vi-VN'),
          user: `${currentUser?.username || 'admin'} (Admin)`,
          action: target.locked ? 'MỞ KHÓA THI ĐẤU' : 'KHÓA Y TẾ THÚ Y',
          detail: `${target.locked ? 'Mở khóa thi đấu' : 'Khóa y tế khẩn cấp'} chiến mã ${target.name} (${target.microchip})`
        },
        ...prev
      ]);
    }
  };

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
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'CẢNH BÁO DỮ LIỆU', 'warning');
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
      locked: false,
      desc: 'Chiến mã mới bổ sung vào trang trại, sẵn sàng bài tập nhập môn.'
    };
    setHorses(prev => [...prev, newHorse]);
    setStables(prev => prev.map(s => s.stall_code === newHorseData.stable ? { ...s, status: 'OCCUPIED', horse: newHorseData.name } : s));
    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
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

  // Lọc dữ liệu ngựa
  const filteredHorses = horses.filter(h => {
    if (horseFilter === 'ALL') return true;
    if (horseFilter === 'ELIGIBLE') return h.status === 'ELIGIBLE' && !h.locked;
    if (horseFilter === 'WATCH') return h.status === 'WATCH';
    if (horseFilter === 'LOCKED') return h.locked || h.status === 'INJURED' || h.status === 'QUARANTINE';
    return true;
  });

  // Lọc dữ liệu người dùng
  const filteredUsers = usersList.filter(u => {
    if (userFilter === 'ALL') return true;
    return u.role === userFilter;
  });

  // Lọc chuồng
  const filteredStables = stables.filter(s => {
    if (stableFilter === 'ALL') return true;
    return s.status === stableFilter;
  });

  // Initials for avatar
  const getInitials = (name) => {
    if (!name) return 'QT';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="portal-layout">
      {/* Mobile drawer backdrop */}
      <div
        className={`portal-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===================== SIDEBAR ===================== */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-brand">
          <div className="portal-brand-icon" style={{ color: 'var(--brass)' }}>
            <IconShield />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>{t('adminBrandSub')}</p>
          </div>
        </div>

        <nav className="portal-nav">
          <button
            className={`portal-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconOverview /></span>
            <span className="portal-nav-label">{t('adminTabOverview')}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'horses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('horses'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconHorse /></span>
            <span className="portal-nav-label">{t('adminTabHorses')}</span>
            <span className="portal-nav-badge">{horses.length}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'stables' ? 'active' : ''}`}
            onClick={() => { setActiveTab('stables'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconStable /></span>
            <span className="portal-nav-label">{t('adminTabStables')}</span>
            <span className="portal-nav-badge">{stables.filter(s => s.status === 'AVAILABLE').length} {lang === 'en' ? 'free' : 'trống'}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconUsers /></span>
            <span className="portal-nav-label">{t('adminTabUsers')}</span>
            <span className="portal-nav-badge">{usersList.length}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('audit'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconAudit /></span>
            <span className="portal-nav-label">{t('adminTabAudit')}</span>
          </button>
        </nav>

        <div className="portal-sidebar-footer">
          <div className="portal-sys-badge">
            <div className="portal-sys-dot" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '12px' }}>Mã Trường OS</div>
              <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>v2.4 Enterprise</div>
            </div>
          </div>
          <Link to="/" className="portal-public-link" style={{ marginTop: '12px' }}>
            <IconGlobe size={15} />
            <span>{lang === 'en' ? 'View Public Site' : 'Xem trang Public'}</span>
          </Link>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="portal-content-wrap">
        
        {/* TOP BAR */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              className="portal-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở Menu"
            >
              <IconMenu />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title">
                {activeTab === 'overview' && t('adminTitleOverview')}
                {activeTab === 'horses' && t('adminTitleHorses')}
                {activeTab === 'stables' && t('adminTitleStables')}
                {activeTab === 'users' && t('adminTitleUsers')}
                {activeTab === 'audit' && t('adminTitleAudit')}
              </h2>
              <div className="portal-page-subtitle">
                {activeTab === 'overview' && t('adminSubOverview')}
                {activeTab === 'horses' && t('adminSubHorses')}
                {activeTab === 'stables' && t('adminSubStables')}
                {activeTab === 'users' && t('adminSubUsers')}
                {activeTab === 'audit' && t('adminSubAudit')}
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <button
              type="button"
              onClick={toggleLang}
              className="portal-theme-btn"
              title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                color: 'var(--paper)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <IconGlobe size={15} color="var(--brass)" />
              <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
            </button>
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                {getInitials(currentUser?.full_name)}
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentUser?.full_name || (lang === 'en' ? 'Administrator' : 'Quản Trị Viên')}</div>
                <div className="portal-user-role">{currentUser?.role_name || (lang === 'en' ? 'Facility Manager' : 'Ban Quản Trị & Quản Lý')}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="portal-btn-logout"
              title={lang === 'en' ? 'Logout from system' : 'Đăng xuất khỏi hệ thống'}
            >
              <span>{lang === 'en' ? 'Logout' : 'Đăng xuất'}</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY PER TAB */}
        <main className="portal-main">

          {/* ===================== TAB 1: OVERVIEW ===================== */}
          {activeTab === 'overview' && (
            <div>
              {/* Top Filter Bar */}
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button className="portal-pill-btn active">
                    {t('adminFilterAll')} <span className="pill-count">100%</span>
                  </button>
                  <button className="portal-pill-btn" onClick={() => setActiveTab('horses')}>
                    {t('adminFilterHorses')} <span className="pill-count">{horses.length}</span>
                  </button>
                  <button className="portal-pill-btn" onClick={() => setActiveTab('stables')}>
                    {t('adminFilterStables')} <span className="pill-count">{stables.length}</span>
                  </button>
                  <button className="portal-pill-btn" onClick={() => setActiveTab('users')}>
                    {t('adminFilterUsers')} <span className="pill-count">{usersList.length}</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '18px', marginBottom: '28px' }}>
                <div className="facility-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--paper-dim)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{lang === 'en' ? 'TOTAL RACEHORSES' : 'TỔNG ĐÀN CHIẾN MÃ'}</span>
                    <span style={{ color: 'var(--brass)' }}><IconHorse /></span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--paper)', margin: '12px 0 6px' }}>
                    {horses.length} {lang === 'en' ? 'horses' : 'con'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', fontWeight: 500 }}>
                    {lang === 'en' ? '2 Cleared · 1 Monitored · 1 Locked' : '2 Đủ điều kiện · 1 Theo dõi · 1 Tạm khóa'}
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--paper-dim)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{lang === 'en' ? 'BARN OCCUPANCY RATE' : 'CÔNG SUẤT CHUỒNG TRẠI'}</span>
                    <span style={{ color: 'var(--brass)' }}><IconStable /></span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--paper)', margin: '12px 0 6px' }}>
                    {stables.filter(s => s.status === 'OCCUPIED').length} / {stables.length} {lang === 'en' ? 'stalls' : 'ô'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--brass)', fontWeight: 500 }}>
                    {lang === 'en' ? 'Occupancy: 91.7% (1 stall vacant)' : 'Lấp đầy: 91.7% (1 chuồng trống)'}
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--paper-dim)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{lang === 'en' ? 'TOTAL STAFF USERS (RBAC)' : 'TỔNG NHÂN SỰ RBAC'}</span>
                    <span style={{ color: 'var(--brass)' }}><IconUsers /></span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--paper)', margin: '12px 0 6px' }}>
                    {usersList.length} {lang === 'en' ? 'accounts' : 'tài khoản'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', fontWeight: 500 }}>
                    {lang === 'en' ? 'Delegated across 5 functional tiers' : 'Phân quyền 5 nhóm chức năng'}
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--paper-dim)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{lang === 'en' ? 'PRIZE PURSE & OPS FUND' : 'QUỸ GIẢI ĐẤU & HOẠT ĐỘNG'}</span>
                    <span style={{ color: 'var(--brass)' }}><IconShield /></span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brass)', margin: '12px 0 6px' }}>
                    500.000.000 ₫
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', fontWeight: 500 }}>
                    {lang === 'en' ? 'National Championship 2026 (Approved)' : 'Giải Vô địch Quốc gia 2026 (Đã duyệt)'}
                  </div>
                </div>
              </div>

              {/* Status and business workflow */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px' }}>
                <div className="facility-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--brass)', marginBottom: '16px', fontWeight: 600 }}>
                    Thông Báo Trực Ban Điều Hành
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px 14px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--paper)', fontSize: '13px' }}>Khóa y tế: Ngựa Phi Yến (Ô A5)</div>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                        Bác sĩ thú y kích hoạt lệnh khóa y tế do giãn dây chằng. HLV tạm ngừng lịch tập cường độ cao.
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--paper)', fontSize: '13px' }}>Theo dõi thể lực: Ngựa Hắc Phong (Ô A3)</div>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                        Buổi tập gần nhất đạt nhịp tim 210 bpm. Đã thông báo cho Groom bổ sung điện giải và theo dõi nhịp thở.
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--brass)', fontSize: '13px' }}>Sẵn sàng thi đấu: Ngựa Xích Thố (Ô A1)</div>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                        Đạt phong độ tiêu chuẩn, hoàn tất kiểm định thú y và đủ điều kiện xuất trận.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--paper)', marginBottom: '16px', fontWeight: 600 }}>
                    Quy Trình Nghiệp Vụ Tương Tác
                  </h3>
                  <div style={{ fontSize: '13.5px', color: 'var(--paper-dim)', lineHeight: 1.75 }}>
                    <p style={{ margin: '0 0 10px' }}>Hệ thống vận hành theo chu trình khép kín và tự động đối soát:</p>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li><b style={{ color: 'var(--paper)' }}>Ban Quản lý (Admin)</b>: Cấp tài khoản, giám sát ngân sách, phân bổ ô chuồng.</li>
                      <li><b style={{ color: 'var(--paper)' }}>Thú y (Vet)</b>: Độc quyền quyền <i>Khóa / Mở khóa y tế</i> để bảo vệ tính mạng ngựa đua.</li>
                      <li><b style={{ color: 'var(--paper)' }}>HLV (Trainer)</b>: Lập giáo án và theo dõi telemetry chỉ số buổi chạy.</li>
                      <li><b style={{ color: 'var(--paper)' }}>Groom (Chăm sóc)</b>: Báo cáo bữa ăn và sự cố thực tế chuồng trại.</li>
                      <li><b style={{ color: 'var(--paper)' }}>Chủ ngựa (Owner)</b>: Theo dõi báo cáo minh bạch chi phí và kết quả giải.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: HORSES ===================== */}
          {activeTab === 'horses' && (
            <div>
              {/* Filter and View Mode Switcher */}
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${horseFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setHorseFilter('ALL')}
                  >
                    {lang === 'en' ? 'All Horses' : 'Tất cả'} <span className="pill-count">{horses.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${horseFilter === 'ELIGIBLE' ? 'active' : ''}`}
                    onClick={() => setHorseFilter('ELIGIBLE')}
                  >
                    {t('adminHorseEligible')} <span className="pill-count">{horses.filter(h => h.status === 'ELIGIBLE' && !h.locked).length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${horseFilter === 'WATCH' ? 'active' : ''}`}
                    onClick={() => setHorseFilter('WATCH')}
                  >
                    {t('adminHorseWatch')} <span className="pill-count">{horses.filter(h => h.status === 'WATCH').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${horseFilter === 'LOCKED' ? 'active' : ''}`}
                    onClick={() => setHorseFilter('LOCKED')}
                  >
                    {lang === 'en' ? 'Vet Locked' : 'Khóa Y Tế'} <span className="pill-count">{horses.filter(h => h.locked || h.status === 'INJURED').length}</span>
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    className={`portal-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    {lang === 'en' ? 'Card Grid' : 'Lưới thẻ'}
                  </button>
                  <button
                    className={`portal-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    {lang === 'en' ? 'Data Table' : 'Bảng dữ liệu'}
                  </button>
                  <button
                    onClick={() => setShowAddHorseModal(true)}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {t('adminBtnAddHorse')}
                  </button>
                </div>
              </div>

              {/* Card Grid View */}
              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {filteredHorses.map((h) => {
                    const badgeClass = h.breed === 'Thoroughbred' ? 'badge-gold' : 'badge-slate';
                    const genderDisplay = h.gender.includes('đực')
                      ? (lang === 'en' ? 'Stallion' : 'Đực')
                      : h.gender.includes('thiến')
                        ? (lang === 'en' ? 'Gelding' : 'Thiến')
                        : (lang === 'en' ? 'Mare' : 'Cái');
                    return (
                      <div key={h.id} className="facility-card">
                        {/* Top Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`facility-card-badge ${badgeClass}`}>
                            <span>{h.breed.toUpperCase()}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>
                            {h.microchip}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h3 className="facility-card-title">{h.name}</h3>
                        <p className="facility-card-desc">{h.desc}</p>
                        
                        <div className="facility-card-bullets">
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'RFID Microchip:' : 'Mã chip định danh:'} <b>{h.microchip}</b></span>
                          </div>
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'Assigned Barn Stall:' : 'Chuồng nuôi dưỡng:'} <b>{lang === 'en' ? 'Stall ' : 'Ô '}{h.stable}</b></span>
                          </div>
                        </div>

                        {/* 3-column specs grid */}
                        <div className="facility-specs-grid">
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Gender' : 'Giới tính'}</span>
                            <span className="spec-val">{genderDisplay}</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Stall' : 'Ô Chuồng'}</span>
                            <span className="spec-val" style={{ color: 'var(--brass)', fontWeight: 700 }}>{lang === 'en' ? 'Stall ' : 'Ô '}{h.stable}</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Owner' : 'Chủ sở hữu'}</span>
                            <span className="spec-val" style={{ fontSize: '11.5px' }}>{h.owner.split(' ').slice(-1)[0]}</span>
                          </div>
                        </div>

                        {/* Status/Price Box */}
                        <div className="facility-price-box">
                          <div>
                            <div className="price-label">{lang === 'en' ? 'Health Status' : 'Trạng thái sức khỏe'}</div>
                            <div className="price-value" style={{ fontSize: '15px', color: 'var(--paper)' }}>
                              {h.statusText}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: '4px',
                            background: 'var(--bg-primary)',
                            color: h.locked ? 'var(--paper-dim)' : 'var(--brass)',
                            border: '1px solid var(--line)'
                          }}>
                            {h.locked ? (lang === 'en' ? 'LOCKED' : 'TẠM KHÓA') : (lang === 'en' ? 'ACTIVE' : 'KHẢ DỤNG')}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="facility-card-actions">
                          <div className="actions-left">
                            <button
                              className="facility-btn-action"
                              onClick={() => showToast(lang === 'en' ? `Viewing file of ${h.name} (Chip: ${h.microchip})` : `Xem chi tiết hồ sơ mã ${h.name} (Chip: ${h.microchip})`, lang === 'en' ? 'HORSE PROFILE' : 'HỒ SƠ CHIẾN MÃ')}
                            >
                              {lang === 'en' ? 'View Details' : 'Xem chi tiết'}
                            </button>
                            <button
                              className={`facility-btn-action ${h.locked ? 'btn-danger' : ''}`}
                              onClick={() => {
                                handleToggleHorseLock(h.id);
                                showToast(h.locked ? (lang === 'en' ? `Training unlocked for ${h.name}` : `Đã mở khóa huấn luyện cho chiến mã ${h.name}`) : (lang === 'en' ? `Emergency veterinary lock enabled for ${h.name}` : `Đã khóa y tế khẩn cấp cho chiến mã ${h.name}`), lang === 'en' ? 'STATUS UPDATE' : 'CẬP NHẬT TRẠNG THÁI');
                              }}
                            >
                              {h.locked ? (lang === 'en' ? 'Unlock' : 'Mở khóa') : (lang === 'en' ? 'Lock (Vet)' : 'Khóa y tế')}
                            </button>
                          </div>
                          <button
                            className="facility-link-action"
                            onClick={() => showToast(lang === 'en' ? `Opening vet medical records and velocities of ${h.name}` : `Đang mở hồ sơ bệnh án thú y và chỉ số chạy của ${h.name}`, lang === 'en' ? 'VET & TELEMETRY RECORDS' : 'HỒ SƠ BỆNH ÁN & VẬN TỐC')}
                          >
                            {lang === 'en' ? 'Stall Info →' : 'Chi tiết ô →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'RFID Chip / Horse Name' : 'Mã Chip / Tên Ngựa'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Breed & Gender' : 'Giống loài & Giới tính'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Allocation' : 'Chuồng phân bổ'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Owner' : 'Chủ sở hữu'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Health Status' : 'Trạng thái Sức khỏe'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Vet Lock' : 'Khóa Y Tế Thú Y'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Action' : 'Hành động'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHorses.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--brass)', fontSize: '15px' }}>{h.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>{h.microchip}</div>
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>
                            <div>{h.breed}</div>
                            <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{h.gender}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', fontWeight: 600 }}>
                              {lang === 'en' ? 'Stall ' : 'Ô '}{h.stable}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>{h.owner}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background: 'var(--bg-secondary)',
                              color: 'var(--paper)',
                              border: '1px solid var(--line)'
                            }}>
                              {h.statusText}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            {h.locked ? (
                              <span style={{ color: 'var(--brass)', fontWeight: 600, fontSize: '12px' }}>
                                {lang === 'en' ? 'Vet Locked' : 'Tạm khóa y tế'}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--paper-dim)', fontSize: '12px' }}>
                                {lang === 'en' ? 'Normal' : 'Bình thường'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <button
                              onClick={() => handleToggleHorseLock(h.id)}
                              style={{
                                padding: '5px 12px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--line)',
                                color: 'var(--paper)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              {h.locked ? (lang === 'en' ? 'Unlock' : 'Mở Khóa') : (lang === 'en' ? 'Vet Lock' : 'Khóa Y Tế')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: STABLES ===================== */}
          {activeTab === 'stables' && (
            <div>
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${stableFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStableFilter('ALL')}
                  >
                    {lang === 'en' ? 'All 12 Stalls' : 'Tất cả 12 ô'} <span className="pill-count">{stables.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${stableFilter === 'AVAILABLE' ? 'active' : ''}`}
                    onClick={() => setStableFilter('AVAILABLE')}
                  >
                    {lang === 'en' ? 'Available' : 'Còn trống'} <span className="pill-count">{stables.filter(s => s.status === 'AVAILABLE').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${stableFilter === 'OCCUPIED' ? 'active' : ''}`}
                    onClick={() => setStableFilter('OCCUPIED')}
                  >
                    {lang === 'en' ? 'Occupied' : 'Đã lấp đầy'} <span className="pill-count">{stables.filter(s => s.status === 'OCCUPIED').length}</span>
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    className={`portal-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    {lang === 'en' ? 'Card Grid' : 'Lưới thẻ'}
                  </button>
                  <button
                    className={`portal-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    {lang === 'en' ? 'Data Table' : 'Bảng danh sách'}
                  </button>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {filteredStables.map(s => {
                    const isOccupied = s.status === 'OCCUPIED';
                    const isAvailable = s.status === 'AVAILABLE';
                    const badgeClass = isOccupied ? 'badge-gold' : 'badge-slate';

                    return (
                      <div key={s.stall_code} className="facility-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`facility-card-badge ${badgeClass}`}>
                            <span>{s.block.toUpperCase()}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                            {s.stall_code}
                          </span>
                        </div>

                        <h3 className="facility-card-title">{lang === 'en' ? `Barn Stall ${s.stall_code}` : `Ô Chuồng ${s.stall_code}`}</h3>
                        <p className="facility-card-desc">
                          {isOccupied
                            ? (lang === 'en' ? `Housing racehorse ${s.horse}. Premium equine amenities.` : `Đang nuôi dưỡng chiến mã ${s.horse}. Chuẩn tiện nghi cao cấp.`)
                            : (lang === 'en' ? 'Clean empty stall ready for horse intake.' : 'Ô chuồng trống sạch sẽ, sẵn sàng phân bổ.')}
                        </p>

                        <div className="facility-card-bullets">
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'Resident horse:' : 'Chiến mã lưu trú:'} <b style={{ color: isOccupied ? 'var(--brass)' : 'var(--paper-dim)' }}>{s.horse}</b></span>
                          </div>
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'Barn block:' : 'Khu chuồng:'} <b>{s.block}</b></span>
                          </div>
                        </div>

                        <div className="facility-specs-grid">
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Area' : 'Diện tích'}</span>
                            <span className="spec-val">{s.area || '14 m²'}</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Dimensions' : 'Kích thước'}</span>
                            <span className="spec-val">{s.dim || '3.8 x 3.8m'}</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Standard' : 'Tiêu chuẩn'}</span>
                            <span className="spec-val">Pro Stall</span>
                          </div>
                        </div>

                        <div className="facility-price-box">
                          <div>
                            <div className="price-label">{lang === 'en' ? 'Stall Status' : 'Trạng thái ô'}</div>
                            <div className="price-value" style={{ fontSize: '14.5px', color: isOccupied ? 'var(--brass)' : 'var(--paper)' }}>
                              {isOccupied
                                ? (lang === 'en' ? 'Currently Occupied' : 'Đang nuôi dưỡng')
                                : isAvailable
                                  ? (lang === 'en' ? 'Available & Ready' : 'Còn trống sẵn sàng')
                                  : (lang === 'en' ? 'Under Maintenance' : 'Đang bảo dưỡng')}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: '4px',
                            background: 'var(--bg-primary)',
                            color: isOccupied ? 'var(--brass)' : 'var(--paper-dim)',
                            border: '1px solid var(--line)'
                          }}>
                            {isOccupied
                              ? (lang === 'en' ? 'OCCUPIED' : 'LẤP ĐẦY')
                              : isAvailable
                                ? (lang === 'en' ? 'VACANT' : 'TRỐNG')
                                : (lang === 'en' ? 'SERVICE' : 'BẢO TRÌ')}
                          </span>
                        </div>

                        <div className="facility-card-actions">
                          <div className="actions-left">
                            <button
                              className="facility-btn-action"
                              onClick={() => handleToggleStable(s.stall_code)}
                            >
                              {lang === 'en' ? 'Toggle Status' : 'Đổi trạng thái'}
                            </button>
                          </div>
                          <span className="facility-link-action" style={{ cursor: 'default' }}>
                            {s.block} →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Code' : 'Mã Ô Chuồng'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Barn Block' : 'Khu Vực'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Resident Runner' : 'Chiến Mã Đang Ở'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Status' : 'Trạng Thái'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Action' : 'Thao Tác'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStables.map(s => {
                        const isOccupied = s.status === 'OCCUPIED';
                        const isAvailable = s.status === 'AVAILABLE';
                        return (
                          <tr key={s.stall_code} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--paper)' }}>{lang === 'en' ? 'Stall ' : 'Ô '}{s.stall_code}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{s.block}</td>
                            <td style={{ padding: '14px 18px', color: isOccupied ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: 600 }}>{s.horse}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                background: 'var(--bg-secondary)',
                                color: isOccupied ? 'var(--brass)' : 'var(--paper)',
                                border: '1px solid var(--line)'
                              }}>
                                {isOccupied ? (lang === 'en' ? 'Occupied' : 'Đang dùng') : isAvailable ? (lang === 'en' ? 'Available' : 'Còn trống') : (lang === 'en' ? 'Maintenance' : 'Bảo trì')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <button
                                onClick={() => handleToggleStable(s.stall_code)}
                                style={{
                                  padding: '5px 12px',
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--line)',
                                  borderRadius: '4px',
                                  color: 'var(--paper)',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                {lang === 'en' ? 'Toggle Status' : 'Đổi trạng thái'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 4: USERS & RBAC ===================== */}
          {activeTab === 'users' && (
            <div>
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${userFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setUserFilter('ALL')}
                  >
                    {lang === 'en' ? 'All Staff' : 'Tất cả'} <span className="pill-count">{usersList.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'TRAINER' ? 'active' : ''}`}
                    onClick={() => setUserFilter('TRAINER')}
                  >
                    {lang === 'en' ? 'Trainers' : 'Huấn Luyện Viên'} <span className="pill-count">{usersList.filter(u => u.role === 'TRAINER').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'VET' ? 'active' : ''}`}
                    onClick={() => setUserFilter('VET')}
                  >
                    {lang === 'en' ? 'Veterinarians' : 'Bác Sĩ Thú Y'} <span className="pill-count">{usersList.filter(u => u.role === 'VET').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'GROOM' ? 'active' : ''}`}
                    onClick={() => setUserFilter('GROOM')}
                  >
                    {lang === 'en' ? 'Stable Grooms' : 'Chăm Sóc Groom'} <span className="pill-count">{usersList.filter(u => u.role === 'GROOM').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'OWNER' ? 'active' : ''}`}
                    onClick={() => setUserFilter('OWNER')}
                  >
                    {lang === 'en' ? 'Horse Owners' : 'Chủ Ngựa'} <span className="pill-count">{usersList.filter(u => u.role === 'OWNER').length}</span>
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    className={`portal-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    {lang === 'en' ? 'Card Grid' : 'Lưới thẻ'}
                  </button>
                  <button
                    className={`portal-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    {lang === 'en' ? 'Data Table' : 'Bảng danh sách'}
                  </button>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {t('adminBtnAddUser')}
                  </button>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {filteredUsers.map((u) => {
                    const roleBadgeClass = u.role === 'MANAGER' ? 'badge-gold' : 'badge-slate';

                    return (
                      <div key={u.user_id} className="facility-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`facility-card-badge ${roleBadgeClass}`}>
                            <span>{u.role_name}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                            ID #{u.user_id}
                          </span>
                        </div>

                        <h3 className="facility-card-title">{u.full_name}</h3>
                        <p className="facility-card-desc">
                          {lang === 'en' ? 'Account:' : 'Tài khoản:'} <b style={{ color: 'var(--paper)' }}>@{u.username}</b>. {lang === 'en' ? 'Standardized RBAC management privileges.' : 'Quyền hạn thao tác RBAC chuẩn hóa.'}
                        </p>

                        <div className="facility-card-bullets">
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>Email: <b>{u.email}</b></span>
                          </div>
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>Hotline: <b>{u.phone || '0901234567'}</b></span>
                          </div>
                        </div>

                        <div className="facility-specs-grid">
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'User ID' : 'Mã ID'}</span>
                            <span className="spec-val">#{u.user_id}</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'RBAC Role' : 'Vai trò'}</span>
                            <span className="spec-val" style={{ fontSize: '11.5px' }}>{u.role}</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Status' : 'Trạng thái'}</span>
                            <span className="spec-val" style={{ color: u.status === 'ACTIVE' ? 'var(--brass)' : 'var(--paper-dim)' }}>
                              {u.status === 'ACTIVE' ? (lang === 'en' ? 'Active' : 'Hoạt động') : (lang === 'en' ? 'Suspended' : 'Tạm khóa')}
                            </span>
                          </div>
                        </div>

                        <div className="facility-price-box">
                          <div>
                            <div className="price-label">{lang === 'en' ? 'Access Status' : 'Trạng thái tài khoản'}</div>
                            <div className="price-value" style={{ fontSize: '14.5px', color: 'var(--paper)' }}>
                              {u.status === 'ACTIVE' ? (lang === 'en' ? 'Active Account' : 'Đang hoạt động') : (lang === 'en' ? 'Access Suspended' : 'Tạm khóa truy cập')}
                            </div>
                          </div>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: u.status === 'ACTIVE' ? 'var(--brass)' : 'var(--paper-dim)'
                          }} />
                        </div>

                        <div className="facility-card-actions">
                          <div className="actions-left">
                            <button
                              className="facility-btn-action"
                              onClick={() => handleOpenEditUser(u)}
                            >
                              {lang === 'en' ? 'Edit' : 'Sửa'}
                            </button>
                            {u.username !== 'admin' && (
                              <button
                                className={`facility-btn-action ${u.status === 'ACTIVE' ? 'btn-danger' : ''}`}
                                onClick={() => toggleUserStatus(u.user_id)}
                              >
                                {u.status === 'ACTIVE' ? (lang === 'en' ? 'Lock' : 'Khóa') : (lang === 'en' ? 'Unlock' : 'Mở')}
                              </button>
                            )}
                          </div>
                          <button
                            className="facility-link-action"
                            onClick={() => handleOpenEditUser(u)}
                          >
                            {lang === 'en' ? 'Profile →' : 'Hồ sơ →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                        <th style={{ padding: '14px 18px' }}>ID</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Account / Full Name' : 'Tài khoản / Họ Tên'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Email & Phone' : 'Email & Điện thoại'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'RBAC Role' : 'Vai trò Nghiệp vụ (Role)'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Status' : 'Trạng thái'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Actions' : 'Hành động'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        return (
                          <tr key={u.user_id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>#{u.user_id}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--paper)' }}>{u.full_name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>@{u.username}</div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>
                              <div>{u.email}</div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{u.phone}</div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: u.role === 'MANAGER' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                                color: u.role === 'MANAGER' ? 'var(--brass)' : 'var(--paper)',
                                border: '1px solid var(--line)'
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
                                color: u.status === 'ACTIVE' ? 'var(--brass)' : 'var(--paper-dim)'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.status === 'ACTIVE' ? 'var(--brass)' : 'var(--paper-dim)' }} />
                                {u.status === 'ACTIVE' ? (lang === 'en' ? 'Active' : 'Hoạt động') : (lang === 'en' ? 'Suspended' : 'Tạm khóa')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  title={lang === 'en' ? 'Edit staff profile' : 'Sửa thông tin nhân sự'}
                                  style={{
                                    padding: '5px 12px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--line)',
                                    color: 'var(--paper)',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                  }}
                                >
                                  {lang === 'en' ? 'Edit' : 'Sửa'}
                                </button>
                                {u.username !== 'admin' && (
                                  <button
                                    onClick={() => toggleUserStatus(u.user_id)}
                                    style={{
                                      padding: '5px 12px',
                                      background: 'var(--bg-secondary)',
                                      border: '1px solid var(--line)',
                                      color: 'var(--paper-dim)',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {u.status === 'ACTIVE' ? (lang === 'en' ? 'Suspend' : 'Khóa tài khoản') : (lang === 'en' ? 'Reactivate' : 'Mở khóa')}
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
              )}
            </div>
          )}

          {/* ===================== TAB 5: AUDIT LOGS ===================== */}
          {activeTab === 'audit' && (
            <div>
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button className="portal-pill-btn active">
                    {lang === 'en' ? 'All Audit Events' : 'Tất cả sự kiện'} <span className="pill-count">{auditLogs.length}</span>
                  </button>
                </div>
              </div>

              <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Timestamp' : 'Thời gian'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Actor / Operator' : 'Người thực hiện'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Action Type' : 'Hành động'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Transaction Details' : 'Nội dung chi tiết'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '14px 18px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>{log.time}</td>
                        <td style={{ padding: '14px 18px', color: 'var(--paper)', fontWeight: 600 }}>{log.user}</td>
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
                        <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{log.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ===================== MODAL THÊM NGƯỜI DÙNG ===================== */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            color: 'var(--paper)',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--paper)' }}>
              {lang === 'en' ? 'Add New Staff / User' : 'Thêm Nhân Sự / Người Dùng Mới'}
            </h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Full Name' : 'Họ và tên'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. David Miller' : 'Ví dụ: Hoàng Văn Bảo'}
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Username' : 'Tên đăng nhập (Username)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. trainer_miller' : 'Ví dụ: trainer_bao'}
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="bao@matruong.vn"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Phone Number' : 'Số điện thoại'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder={lang === 'en' ? 'e.g. 0901234567' : 'Ví dụ: 0901234567'}
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'RBAC Role' : 'Vai trò Nghiệp vụ (RBAC)'}
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="TRAINER">{lang === 'en' ? 'Head Trainer' : 'Huấn luyện viên Trưởng (Trainer)'}</option>
                  <option value="VET">{lang === 'en' ? 'Veterinarian (Vet)' : 'Bác sĩ Thú y (Veterinarian)'}</option>
                  <option value="GROOM">{lang === 'en' ? 'Groom / Caretaker' : 'Nhân viên Chăm sóc (Groom)'}</option>
                  <option value="OWNER">{lang === 'en' ? 'Horse Owner' : 'Chủ sở hữu Ngựa (Owner)'}</option>
                  <option value="MANAGER">{lang === 'en' ? 'Club Manager' : 'Ban Quản lý Câu lạc bộ (Club Manager)'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass, #C9A227)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Save User' : 'Lưu Nhân Sự'}
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
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999998
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            color: 'var(--paper)',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lang === 'en' ? 'Edit Staff Profile' : 'Sửa Thông Tin Nhân Sự'}
              </h3>
              <span style={{ fontSize: '12px', background: 'rgba(201, 162, 39, 0.12)', color: 'var(--brass)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--brass)', fontWeight: 600 }}>
                ID: #{editUserData.user_id}
              </span>
            </div>

            <form onSubmit={handleRequestSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Full Name' : 'Họ và tên'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'Staff full name' : 'Họ và tên nhân sự'}
                  value={editUserData.full_name}
                  onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Username' : 'Tên đăng nhập (Username)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Phone Number' : 'Số điện thoại'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder={lang === 'en' ? 'Phone number' : 'Số điện thoại'}
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'RBAC Role' : 'Vai trò Nghiệp vụ (RBAC Role)'}
                </label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="TRAINER">{lang === 'en' ? 'Head Trainer' : 'Huấn luyện viên Trưởng (Trainer)'}</option>
                  <option value="VET">{lang === 'en' ? 'Veterinarian (Vet)' : 'Bác sĩ Thú y (Veterinarian)'}</option>
                  <option value="GROOM">{lang === 'en' ? 'Groom / Caretaker' : 'Nhân viên Chăm sóc (Groom)'}</option>
                  <option value="OWNER">{lang === 'en' ? 'Horse Owner' : 'Chủ sở hữu Ngựa (Owner)'}</option>
                  <option value="MANAGER">{lang === 'en' ? 'Club Manager' : 'Ban Quản lý Câu lạc bộ (Club Manager)'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Account Status' : 'Trạng thái tài khoản'}
                </label>
                <select
                  value={editUserData.status}
                  onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="ACTIVE">{lang === 'en' ? 'Active (ACTIVE)' : 'Đang hoạt động (ACTIVE)'}</option>
                  <option value="INACTIVE">{lang === 'en' ? 'Suspended (INACTIVE)' : 'Tạm khóa (INACTIVE)'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => { setShowEditUserModal(false); setEditUserData(null); }}
                  style={{ flex: 1, padding: '11px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', background: 'var(--brass)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
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
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--brass)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px 24px',
            color: 'var(--paper)',
            textAlign: 'center',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(201, 162, 39, 0.12)', border: '1px solid var(--brass)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brass)' }}>
              <IconShield size={24} />
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--paper)', marginBottom: '12px' }}>
              {lang === 'en' ? 'Confirm Profile Changes' : 'Xác nhận sửa thông tin'}
            </h3>

            <p style={{ fontSize: '15px', color: 'var(--paper)', lineHeight: '1.5', margin: '0 0 16px', fontWeight: 500 }}>
              {lang === 'en' ? 'Are you sure you want to update this staff profile?' : 'Bạn có chắc chắn sửa thông tin này không?'}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '22px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '4px' }}>{lang === 'en' ? 'Staff ID: ' : 'Nhân sự ID: '}<b style={{ color: 'var(--paper)' }}>#{editUserData.user_id}</b></div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '4px' }}>{lang === 'en' ? 'New Name: ' : 'Họ tên mới: '}<b style={{ color: 'var(--paper)' }}>{editUserData.full_name}</b></div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '4px' }}>Email: <b style={{ color: 'var(--paper)' }}>{editUserData.email}</b></div>
              <div style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Phone: ' : 'Số điện thoại: '}<b style={{ color: 'var(--paper)' }}>{editUserData.phone}</b></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmEditModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13.5px'
                }}
              >
                {lang === 'en' ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveEditUser}
                style={{
                  flex: 1.2,
                  padding: '11px',
                  background: 'var(--brass)',
                  border: 'none',
                  color: '#14100A',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13.5px'
                }}
              >
                {lang === 'en' ? 'Yes, Confirm' : 'Có, xác nhận sửa'}
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
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            color: 'var(--paper)',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--paper)' }}>
              {lang === 'en' ? 'Register New Racehorse Profile' : 'Thêm Hồ Sơ Chiến Mã Mới'}
            </h3>
            <form onSubmit={handleCreateHorse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Horse Name' : 'Tên chiến mã'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. Night Cheetah' : 'Ví dụ: Dạ Báo'}
                  value={newHorseData.name}
                  onChange={(e) => setNewHorseData({ ...newHorseData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Breed' : 'Giống loài'}
                </label>
                <select
                  value={newHorseData.breed}
                  onChange={(e) => setNewHorseData({ ...newHorseData, breed: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="Thoroughbred">{lang === 'en' ? 'Thoroughbred' : 'Thoroughbred (Thuần chủng Anh)'}</option>
                  <option value="Arabian">{lang === 'en' ? 'Arabian' : 'Arabian (Ả Rập)'}</option>
                  <option value="Quarter Horse">Quarter Horse</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Assign Stall' : 'Phân bổ vào ô chuồng'}
                </label>
                <select
                  value={newHorseData.stable}
                  onChange={(e) => setNewHorseData({ ...newHorseData, stable: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="B6">{lang === 'en' ? 'Stall B6 (Vacant)' : 'Ô B6 (Đang còn trống)'}</option>
                  <option value="A1">{lang === 'en' ? 'Stall A1' : 'Ô A1'}</option>
                  <option value="B1">{lang === 'en' ? 'Stall B1' : 'Ô B1'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddHorseModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Save Horse' : 'Lưu Chiến Mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
