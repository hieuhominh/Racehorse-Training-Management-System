// Admin Portal - Racehorse Training & Stall Management (Synchronized)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import {
  getSystemNotifications,
  notifyStallMaintenanceStarted,
  notifyStallMaintenanceCompleted
} from '../services/notificationService';
import { initialHorsesData } from '../data/horsesData';
import {
  getHorsesApi,
  createHorseApi,
  toggleHorseLockApi,
  getStablesApi,
  createStallApi,
  updateStallApi,
  reassignStallHorseApi,
  deleteStallApi,
  getStallRequestsApi,
  approveStallRequestApi,
  rejectStallRequestApi,
  getActiveStallMaintenances,
  saveActiveStallMaintenances,
  checkAndExpireStallMaintenances
} from '../services/api';
import {
  getPersonnelReports,
  updateReportAdminReview,
  deletePersonnelReport,
  REPORT_TARGET_ROLES,
  REPORT_SEVERITIES,
  REPORT_STATUSES
} from '../services/reportService';
import { getServiceAssignments } from '../services/serviceAssignment';

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

const IconReport = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
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
  const { currentUser, usersList, updateUser, deleteUser, toggleUserStatus, registerUser, logout, approveUser, rejectUser } = useAuth();

  const handleApproveUser = (u) => {
    approveUser(u.user_id);
    showToast(
      lang === 'en'
        ? `Successfully approved account for ${u.full_name} (${u.role_name || u.role})!`
        : `Đã phê duyệt tài khoản ${u.full_name} (${u.role_name || u.role}) thành công! Thành viên đã có thể đăng nhập.`,
      'PHÊ DUYỆT THÀNH VIÊN MỚI',
      'info'
    );
  };

  const handleRejectUser = (u) => {
    rejectUser(u.user_id, 'Admin rejected registration');
    showToast(
      lang === 'en'
        ? `Rejected application for ${u.full_name}.`
        : `Đã từ chối đơn đăng ký của ${u.full_name}.`,
      'TỪ CHỐI DUYỆT',
      'warning'
    );
  };
  const { t, lang, toggleLang } = useLanguage();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const isDark = theme !== 'light';
  const navigate = useNavigate();

  const handleToggleUserStatus = (u) => {
    const isCurrentlyActive = u.status === 'ACTIVE';
    const nextStatus = toggleUserStatus(u.user_id);
    const willBeActive = nextStatus === 'ACTIVE' || !isCurrentlyActive;
    showToast(
      willBeActive
        ? `Đã mở khóa tài khoản cho ${u.full_name} (@${u.username}) thành công! Nhân sự này hiện có thể đăng nhập bình thường.`
        : `Đã tạm khóa quyền truy cập của ${u.full_name} (@${u.username}). Nhân sự này sẽ không thể đăng nhập cho đến khi được mở khóa.`,
      willBeActive ? 'MỞ KHÓA TÀI KHOẢN' : 'KHÓA TRUY CẬP NHÂN SỰ',
      willBeActive ? 'success' : 'warning'
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_admin');
      if (['overview', 'horses', 'stables', 'users', 'audit'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_admin_view_mode');
      if (['cards', 'table'].includes(saved)) return saved;
    } catch {}
    return 'cards';
  }); // 'cards' | 'table'
  const [horseFilter, setHorseFilter] = useState(() => {
    try {
      return localStorage.getItem('matruong_admin_horse_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [userFilter, setUserFilter] = useState(() => {
    try {
      return localStorage.getItem('matruong_admin_user_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [stableFilter, setStableFilter] = useState(() => {
    try {
      return localStorage.getItem('matruong_admin_stable_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [stableTierTab, setStableTierTab] = useState(() => {
    try {
      return localStorage.getItem('matruong_admin_stable_tier_tab') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('matruong_tab_admin', activeTab);
      localStorage.setItem('matruong_admin_view_mode', viewMode);
      localStorage.setItem('matruong_admin_horse_filter', horseFilter);
      localStorage.setItem('matruong_admin_user_filter', userFilter);
      localStorage.setItem('matruong_admin_stable_filter', stableFilter);
      localStorage.setItem('matruong_admin_stable_tier_tab', stableTierTab);
    } catch {}
  }, [activeTab, viewMode, horseFilter, userFilter, stableFilter, stableTierTab]);

  // State: Quản lý Khiếu Nại & Báo Cáo Nhân Sự (HLV, Bác Sĩ, Chăm Sóc)
  const [personnelReports, setPersonnelReports] = useState(() => getPersonnelReports());
  const [reportRoleFilter, setReportRoleFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [selectedReportForReview, setSelectedReportForReview] = useState(null);
  const [adminReviewStatus, setAdminReviewStatus] = useState('INVESTIGATING');
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [adminReviewAction, setAdminReviewAction] = useState('');
  const [adminReviewFeedback, setAdminReviewFeedback] = useState('');

  // Đồng bộ thời gian thực Báo cáo nhân sự
  useEffect(() => {
    const handleSyncReports = () => setPersonnelReports(getPersonnelReports());
    window.addEventListener('matruong_personnel_reports_updated', handleSyncReports);
    window.addEventListener('storage', handleSyncReports);
    return () => {
      window.removeEventListener('matruong_personnel_reports_updated', handleSyncReports);
      window.removeEventListener('storage', handleSyncReports);
    };
  }, []);

  const pendingReportsCount = personnelReports.filter(r => r.status === 'PENDING').length;

  const handleOpenReviewModal = (report) => {
    setSelectedReportForReview(report);
    setAdminReviewStatus(report.status === 'PENDING' ? 'INVESTIGATING' : report.status);
    setAdminReviewNotes(report.adminNotes || '');
    setAdminReviewAction(report.adminAction || '');
    setAdminReviewFeedback(report.adminFeedback || '');
  };

  const handleSaveAdminReview = (e) => {
    if (e) e.preventDefault();
    if (!selectedReportForReview) return;

    const res = updateReportAdminReview(selectedReportForReview.id, {
      status: adminReviewStatus,
      adminNotes: adminReviewNotes,
      adminAction: adminReviewAction,
      adminFeedback: adminReviewFeedback,
      adminUser: currentUser
    });

    if (res.success) {
      setPersonnelReports(getPersonnelReports());
      setSelectedReportForReview(null);
      showToast('Đã lưu kết quả thẩm tra & gửi phản hồi chính thức đến Chủ sở hữu!', 'XỬ LÝ KHIẾU NẠI THÀNH CÔNG', 'success');
    }
  };

  const handleDeleteReport = (reportId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi khiếu nại này khỏi hệ thống?')) return;
    deletePersonnelReport(reportId);
    setPersonnelReports(getPersonnelReports());
    showToast('Đã xóa bản ghi khiếu nại.', 'ĐÃ XÓA', 'info');
  };

  // State danh sách ngựa quản lý
  const [horses, setHorses] = useState([]);

  // State danh sách chuồng trại kèm hình ảnh chuồng trại mô phỏng 3D (Horse Barn 3D Simulation) chuẩn quốc tế
  const [stables, setStables] = useState([
    { stall_code: 'A1', block: 'Block A', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A2', block: 'Block A', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A3', block: 'Block A', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A4', block: 'Block A', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A5', block: 'Block A', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'A6', block: 'Block A', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '18 m²', dim: '4.2 x 4.2m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B1', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B2', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B3', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B4', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B5', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null },
    { stall_code: 'B6', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null }
  ]);

  // Modal thêm nhân sự mới
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'TRAINER',
    password: '123'
  });

  // Modal sửa thông tin nhân sự & Hồ sơ nghiệp vụ
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [editUserModalTab, setEditUserModalTab] = useState('all');

  // Modal xác nhận sửa thông tin
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);

  // Modal xóa nhân sự (Xác nhận một lần)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  // Modal tạo ô chuồng mới
  const [showAddStallModal, setShowAddStallModal] = useState(false);
  const [newStallData, setNewStallData] = useState({
    stall_code: '',
    block: 'Block C',
    tier: 'STANDARD',
    status: 'AVAILABLE',
    area: '16 m²',
    dim: '4.0 x 4.0m',
    horse: '',
    breed: 'Thoroughbred',
    stall_image: ''
  });

  // Modal xóa ô chuồng
  const [showDeleteStallModal, setShowDeleteStallModal] = useState(false);
  const [deleteTargetStall, setDeleteTargetStall] = useState(null);

  // Modal đổi chiến mã cho ô chuồng
  const [showChangeHorseModal, setShowChangeHorseModal] = useState(false);
  const [changeHorseStall, setChangeHorseStall] = useState(null);
  const [selectedHorseOption, setSelectedHorseOption] = useState('');
  const [customHorseName, setCustomHorseName] = useState('');
  const [customHorseBreed, setCustomHorseBreed] = useState('Thoroughbred');

  // Quản lý Yêu cầu cấp & đổi ô chuồng từ Chủ sở hữu
  const [stallRequests, setStallRequests] = useState([]);
  const [stallReqFilter, setStallReqFilter] = useState('PENDING');
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Modal xem chi tiết chiến mã
  const [viewingHorseDetail, setViewingHorseDetail] = useState(null);

  // Modal thêm ngựa mới
  const [showAddHorseModal, setShowAddHorseModal] = useState(false);
  const [newHorseData, setNewHorseData] = useState({
    name: '',
    microchip: '',
    breed: 'Thoroughbred',
    gender: 'Ngựa đực (Stallion)',
    stable: 'B6',
    owner: ''
  });

  // Nhật ký hệ thống Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '10/10/2026 00:25', user: 'vet_an (Bác sĩ Thú y)', action: 'KHÓA HUẤN LUYỆN KHẨN CẤP', detail: 'Khóa bài tập nặng cho chiến mã khi phát hiện chấn thương gân' },
    { id: 2, time: '10/10/2026 00:15', user: 'admin (Ban Quản lý)', action: 'ĐỒNG BỘ CSDL HỆ THỐNG', detail: 'Nạp lại schema 10 bảng dữ liệu chuẩn Microsoft SQL Server 2019' },
    { id: 3, time: '09/10/2026 18:30', user: 'trainer_truong (HLV Trưởng)', action: 'LẬP GIÁO ÁN HUẤN LUYỆN', detail: 'Thiết kế bài chạy nước rút 1,600m sân cát theo giáo án chuẩn' },
    { id: 4, time: '09/10/2026 14:00', user: 'groom_nam (Chăm sóc chuồng)', action: 'CHECKLIST DINH DƯỠNG', detail: 'Hoàn tất bữa chiều và ngâm chân đá lạnh cho đàn ngựa' },
    { id: 5, time: '09/10/2026 10:00', user: 'admin (Ban Quản lý)', action: 'PHÊ DUYỆT NGÂN SÁCH GIẢI', detail: 'Duyệt kinh phí 500.000.000 ₫ cho Giải Đua Vô địch Đại Nam 2026' }
  ]);

  // Nạp danh sách ngựa và chuồng từ API Backend (kết hợp LocalStorage persistence)
  useEffect(() => {
    let isMounted = true;
    const fixAvatar = (url) => {
      if (!url || typeof url !== 'string' || url.includes('photo-1598974357801-cbca10065444')) {
        return 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80';
      }
      return url;
    };

    const loadHorses = () => {
      const MOCK_NAMES = ['Xích Thố', 'Bạch Long', 'Hắc Phong', 'Kim Mã', 'Phi Yến', 'Thần Mã', 'Phi Vũ', 'Kim Kê', 'Thanh Vân', 'Lôi Chấn', 'Hồng Sa', 'Thiên Lý', 'Bảo Mã'];
      
      // Quét tất cả chiến mã thực tế từ các chủ sở hữu đã đăng ký
      const ownerHorses = [];
      try {
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('matruong_owner_horses_')) {
              const raw = localStorage.getItem(k);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  list.forEach(h => {
                    if (h && !MOCK_NAMES.includes(h.name) && !ownerHorses.some(ex => ex.id === h.id || (ex.microchip && ex.microchip === h.microchip))) {
                      ownerHorses.push({
                        ...h,
                        owner: h.ownerName || h.owner || 'Chủ sở hữu',
                        stable: h.stable ? (String(h.stable).match(/[A-Z0-9]+/i)?.[0] || h.stable) : '(Chưa phân bổ)',
                        avatar: fixAvatar(h.avatar)
                      });
                    }
                  });
                }
              }
            }
          }
        }
      } catch {}

      getHorsesApi().then(res => {
        if (isMounted) {
          const apiList = (res && Array.isArray(res.data)) ? res.data : [];
          const cleanApi = apiList.filter(h => h && !MOCK_NAMES.includes(h.name));
          const combined = [...ownerHorses];
          cleanApi.forEach(h => {
            if (!combined.some(ex => ex.id === h.id || (ex.chipId && ex.chipId === h.chipId) || (ex.microchip && ex.microchip === h.microchip))) {
              combined.push({
                ...h,
                owner: h.ownerName || h.owner || 'Chủ sở hữu',
                stable: h.stable ? (String(h.stable).match(/[A-Z0-9]+/i)?.[0] || h.stable) : '(Chưa phân bổ)',
                avatar: fixAvatar(h.avatar)
              });
            }
          });
          setHorses(combined);
        }
      }).catch(() => {
        if (isMounted) setHorses(ownerHorses);
      });
    };

    const loadStables = () => {
      const MOCK_HORSE_NAMES = ['xích thố', 'bạch long', 'hắc phong', 'kim mã', 'phi yến', 'thần mã', 'phi vũ', 'kim kê', 'thanh vân', 'lôi chấn', 'hồng sa', 'thiên lý', 'bảo mã'];

      // Quét tất cả chiến mã thực tế từ các chủ sở hữu đã đăng ký (đồng thời xóa sạch ngựa mock)
      const assignedHorsesMap = {};
      try {
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('matruong_owner_horses_')) {
              const raw = localStorage.getItem(k);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  // Xóa sạch ngựa mock không có chủ hoặc dữ liệu mẫu bên chủ sở hữu
                  const cleanList = list.filter(h => h && h.name && !MOCK_HORSE_NAMES.includes(h.name.trim().toLowerCase()));
                  if (cleanList.length !== list.length) {
                    localStorage.setItem(k, JSON.stringify(cleanList));
                  }
                  cleanList.forEach(h => {
                    if (h && h.stable) {
                      const m = String(h.stable).match(/[A-Z0-9]+/i);
                      if (m) {
                        const code = m[0].toUpperCase();
                        assignedHorsesMap[code] = h;
                      }
                    }
                  });
                }
              }
            }
          }
        }
      } catch {}

      getStablesApi().then(res => {
        if (isMounted && res && Array.isArray(res.data)) {
          setStables(res.data.map(s => {
            const assignedHorse = assignedHorsesMap[s.stall_code];
            const isAssignedValid = assignedHorse && assignedHorse.name && !MOCK_HORSE_NAMES.includes(assignedHorse.name.trim().toLowerCase());
            const horseNameLower = (s.horse || '').trim().toLowerCase();
            const isStallMock = MOCK_HORSE_NAMES.includes(horseNameLower);

            const hasResident = isAssignedValid || (!isStallMock && s.horse && s.horse !== '(Trống)' && s.status === 'OCCUPIED');

            let finalStatus = s.status || 'AVAILABLE';
            if (s.status === 'MAINTENANCE') {
              finalStatus = 'MAINTENANCE';
            } else if (s.status === 'AVAILABLE') {
              finalStatus = 'AVAILABLE';
            } else if (s.status === 'OCCUPIED' || hasResident) {
              finalStatus = 'OCCUPIED';
            } else {
              finalStatus = 'AVAILABLE';
            }

            const isOccupied = finalStatus === 'OCCUPIED';
            const isMaintenance = finalStatus === 'MAINTENANCE';

            const horseName = isOccupied
              ? (s.horse && s.horse !== '(Trống)' ? s.horse : (isAssignedValid ? assignedHorse.name : 'Đang nuôi dưỡng'))
              : isMaintenance
                ? (s.horse && s.horse !== '(Trống)' ? s.horse : (isAssignedValid ? assignedHorse.name : '(Trống)'))
                : '(Trống)';

            const horseBreed = isOccupied
              ? (isAssignedValid ? (assignedHorse.breed || 'Thoroughbred') : (s.breed && s.breed !== 'Vacant' ? s.breed : 'Thuần chủng'))
              : 'Vacant';

            const horseAvatar = (isOccupied || isMaintenance) && isAssignedValid
              ? (assignedHorse.avatar || assignedHorse.horse_avatar || null)
              : (s.horse_avatar || null);

            const stallImg = s.stall_image || (isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg');

            return {
              ...s,
              status: finalStatus,
              horse: horseName,
              breed: horseBreed,
              horse_avatar: horseAvatar ? fixAvatar(horseAvatar) : null,
              stall_image: stallImg,
              temp_relocated_to: s.temp_relocated_to || null,
              is_temp_stall: s.is_temp_stall || false,
              temp_for_stall: s.temp_for_stall || null,
              maintenance_start: s.maintenance_start || null,
              maintenance_end: s.maintenance_end || null
            };
          }));
        }
      }).catch(() => {});
    };

    const loadStallRequests = () => {
      getStallRequestsApi().then(res => {
        if (isMounted && res && Array.isArray(res.data)) {
          setStallRequests(res.data);
          setStallReqFilter(prev => {
            if (prev === 'ALL' || prev === 'PENDING') {
              const hasPending = res.data.some(r => r.status === 'PENDING');
              if (!hasPending && res.data.some(r => r.status === 'APPROVED')) {
                return 'APPROVED';
              }
              return 'PENDING';
            }
            return prev;
          });
        }
      }).catch(() => {});
    };

    loadHorses();
    loadStables();
    loadStallRequests();

    const handleStablesUpdated = () => {
      loadStables();
      loadHorses();
      loadStallRequests();
    };

    const handleRequestsUpdated = () => {
      loadStallRequests();
      loadStables();
      loadHorses();
    };

    window.addEventListener('matruong_stables_updated', handleStablesUpdated);
    window.addEventListener('matruong_horses_updated', loadHorses);
    window.addEventListener('matruong_stall_requests_updated', handleRequestsUpdated);
    window.addEventListener('storage', handleStablesUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('matruong_stables_updated', handleStablesUpdated);
      window.removeEventListener('matruong_horses_updated', loadHorses);
      window.removeEventListener('matruong_stall_requests_updated', handleRequestsUpdated);
      window.removeEventListener('storage', handleStablesUpdated);
    };
  }, []);

  // Đồng hồ đếm ngược thời gian thực cho các ô chuồng đang bảo dưỡng (30 phút)
  const [currentClock, setCurrentClock] = useState(Date.now());

  const formatRemainingTime = (endTime, now) => {
    if (!endTime) return '30:00';
    const diffSec = Math.max(0, Math.ceil((endTime - now) / 1000));
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentClock(now);

      // Tự động kiểm tra và hoàn tất trả chuồng khi hết 30 phút bảo dưỡng
      const expired = checkAndExpireStallMaintenances();
      if (expired.length > 0) {
        expired.forEach(rec => {
          notifyStallMaintenanceCompleted(rec.stallCode, rec.tempStallCode, rec.horseName);
          setAuditLogs(prev => [
            {
              id: Date.now() + Math.random(),
              time: new Date().toLocaleString('vi-VN'),
              user: 'Hệ thống tự động (Auto System)',
              action: 'HOÀN TẤT BẢO DƯỠNG (30 PHÚT)',
              detail: `Ô chuồng ${rec.stallCode} đã kết thúc 30 phút bảo dưỡng. Chiến mã "${rec.horseName}" tự động quay về ô ${rec.stallCode}. Giải phóng ô tạm ${rec.tempStallCode}. Đã thông báo Chủ sở hữu, HLV, Bác sĩ & Groom.`
            },
            ...prev
          ]);
          showToast(
            lang === 'en'
              ? `Stall ${rec.stallCode} 30-min maintenance finished! Horse "${rec.horseName}" returned home.`
              : `Bảo dưỡng 30 phút ô ${rec.stallCode} đã hoàn tất! Chiến mã "${rec.horseName}" đã tự động quay về ô chuồng ban đầu.`,
            lang === 'en' ? 'MAINTENANCE COMPLETED' : 'HOÀN TẤT BẢO DƯỠNG',
            'success'
          );
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lang]);

  // Lắng nghe thông báo khi Chủ sở hữu xóa chiến mã
  useEffect(() => {
    const handleNotificationUpdate = () => {
      const list = getSystemNotifications();
      const latest = list[0];
      if (latest && latest.type === 'HORSE_DELETED') {
        const deletedName = latest.horseName || '';
        const ownerName = latest.ownerName || 'Chủ sở hữu';
        const stallCode = latest.stable || '';
        const chip = latest.microchip || '';

        // 1. Thêm sự kiện vào Audit Logs
        setAuditLogs(prev => [
          {
            id: Date.now() + Math.random(),
            time: latest.time || new Date().toLocaleString('vi-VN'),
            user: `${ownerName} (Chủ sở hữu)`,
            action: 'XÓA CHIẾN MÃ KHỎI HỆ THỐNG',
            detail: `Chủ nuôi đã xóa chiến mã "${deletedName}" (Chip: ${chip || 'N/A'}${stallCode ? `, Vị trí: ${stallCode}` : ''}). Hệ thống đã tự động giải phóng ô chuồng và gửi thông báo tới HLV, Thú Y, Groom và Admin.`
          },
          ...prev
        ]);

        // 2. Giải phóng ô chuồng nếu có
        if (stallCode || deletedName) {
          const rawCode = stallCode.match(/[A-Z0-9]+/i)?.[0] || stallCode;
          setStables(prev => prev.map(s => {
            const matchStall = rawCode && s.stall_code.toLowerCase().includes(rawCode.toLowerCase());
            const matchHorse = s.horse && deletedName && s.horse.toLowerCase().trim() === deletedName.toLowerCase().trim();
            if (matchStall || matchHorse) {
              return {
                ...s,
                status: 'AVAILABLE',
                horse: '(Trống)',
                breed: 'Vacant',
                horse_avatar: null
              };
            }
            return s;
          }));
        }

        // 3. Xóa khỏi danh sách horses của Admin
        setHorses(prev => prev.filter(h => {
          const matchId = latest.horseId && String(h.id) === String(latest.horseId);
          const matchChip = chip && h.microchip && h.microchip.toLowerCase() === chip.toLowerCase();
          const matchName = deletedName && h.name && h.name.toLowerCase().trim() === deletedName.toLowerCase().trim();
          return !(matchId || matchChip || matchName);
        }));
      }
    };

    window.addEventListener('matruong_notifications_updated', handleNotificationUpdate);
    window.addEventListener('storage', handleNotificationUpdate);
    return () => {
      window.removeEventListener('matruong_notifications_updated', handleNotificationUpdate);
      window.removeEventListener('storage', handleNotificationUpdate);
    };
  }, []);

  // Thao tác khóa / mở y tế cho ngựa
  const handleToggleHorseLock = (horseId) => {
    const target = horses.find(item => item.id === horseId);
    const nextLocked = target ? !target.locked : false;

    // Gửi yêu cầu cập nhật qua API
    toggleHorseLockApi(horseId, nextLocked).catch(() => {});

    setHorses(prev => prev.map(h => {
      if (h.id === horseId) {
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
    setViewingHorseDetail(prev => {
      if (!prev || prev.id !== horseId) return prev;
      return {
        ...prev,
        locked: nextLocked,
        status: nextLocked ? 'INJURED' : 'ELIGIBLE',
        statusText: nextLocked ? 'Khóa y tế Thú y' : 'Đủ điều kiện thi đấu',
        statusColor: nextLocked ? '#EF4444' : '#10B981'
      };
    });
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

  // Hàm hỗ trợ dịch thông tin chiến mã linh hoạt đa ngôn ngữ (VI/EN)
  const getHorseLocalized = (h, currentLang) => {
    if (!h) return {};
    const isEn = currentLang === 'en';

    // Trạng thái y tế / sức khỏe
    const statusMap = {
      'ELIGIBLE': { vi: 'Đủ điều kiện thi đấu', en: 'Fit for Official Racing' },
      'WATCH': { vi: 'Cần theo dõi thể lực', en: 'Under Observation' },
      'INJURED': { vi: 'Chấn thương gân', en: 'Tendon Strain (Rest Required)' },
      'QUARANTINE': { vi: 'Cách ly theo dõi', en: 'Veterinary Quarantine' },
      'RECOVERING': { vi: 'Đang hồi phục', en: 'Post-Race Recovery' }
    };

    let statusText = h.statusText;
    if (h.locked) {
      statusText = isEn ? 'Restricted: Veterinary Medical Lock' : 'Tạm khóa y tế / Cách ly';
    } else if (h.status && statusMap[h.status]) {
      statusText = isEn ? statusMap[h.status].en : statusMap[h.status].vi;
    } else if (isEn) {
      if (statusText?.includes('Đủ điều kiện')) statusText = 'Fit for Official Racing';
      else if (statusText?.includes('theo dõi')) statusText = 'Under Observation';
      else if (statusText?.includes('Chấn thương')) statusText = 'Tendon Strain (Rest Required)';
      else if (statusText?.includes('Cách ly')) statusText = 'Veterinary Quarantine';
      else statusText = 'Normal Condition';
    }

    // Giới tính
    const rawGender = (h.gender || '').toLowerCase();
    let genderDisplay = isEn ? 'Stallion' : 'Ngựa đực';
    if (rawGender.includes('thiến') || rawGender.includes('gelding')) {
      genderDisplay = isEn ? 'Gelding' : 'Ngựa thiến';
    } else if (rawGender.includes('cái') || rawGender.includes('mare')) {
      genderDisplay = isEn ? 'Mare' : 'Ngựa cái';
    } else if (rawGender.includes('đực') || rawGender.includes('stallion')) {
      genderDisplay = isEn ? 'Stallion' : 'Ngựa đực';
    }

    // Giống loài
    let breedDisplay = h.breed || 'Thoroughbred';
    if (breedDisplay.toLowerCase().includes('thoroughbred')) {
      breedDisplay = isEn ? 'Thoroughbred' : 'Thoroughbred Thuần chủng';
    } else if (breedDisplay.toLowerCase().includes('arabian')) {
      breedDisplay = isEn ? 'Arabian' : 'Ả Rập (Arabian)';
    } else if (breedDisplay.toLowerCase().includes('quarter')) {
      breedDisplay = isEn ? 'Quarter Horse' : 'Quarter Horse';
    }

    // Tên tiếng Anh đối ứng
    const englishNameMap = {
      'Hắc Phong': 'Black Wind',
      'Xích Thố': 'Red Hare Legend',
      'Phi Yến': 'Swift Swallow',
      'Lôi Chấn': 'Thunder Colt',
      'Bạch Long': 'White Dragon',
      'Phi Vũ': 'Flying Feather',
      'Kim Kê': 'Golden Rooster',
      'Thanh Vân': 'Azure Cloud',
      'Hồng Sa': 'Red Sand',
      'Thiên Lý': 'Thousand Leagues',
      'Bảo Mã': 'Precious Steed'
    };
    const englishName = h.englishName || englishNameMap[h.name] || h.name;

    // Nhận định / Mô tả song ngữ
    const descMap = {
      'Hắc Phong': {
        vi: 'Chiến mã cự ly 1.600m, thể lực sung mãn, đang theo dõi tải nhịp tim cao.',
        en: '1,600m turf specialist, peak stamina, closely monitored for elevated heart rate load.'
      },
      'Xích Thố': {
        vi: 'Sức bền tuyệt hảo 2.400m sân cỏ, đã vượt qua kiểm định y tế Thú y.',
        en: 'Outstanding 2,400m endurance, officially cleared by Veterinary Board.'
      },
      'Phi Yến': {
        vi: 'Bác sĩ Thú y kích hoạt lệnh khóa do giãn gân chân trái. Cấm tập nặng.',
        en: 'Veterinary lockdown active due to left hind tendon strain. High-intensity workouts suspended.'
      },
      'Lôi Chấn': {
        vi: 'Đang theo dõi kiểm dịch dịch tễ tại khu cách ly Block B. Sức khỏe ổn định.',
        en: 'Under routine epidemiological quarantine protocol in Block B. Vital signs stable.'
      }
    };
    const desc = isEn
      ? (descMap[h.name]?.en || h.descEn || h.desc)
      : (descMap[h.name]?.vi || h.desc);

    // Thành tích đua
    const winsCountMap = {
      'Hắc Phong': { vi: '12 trận (7 Nhất, 3 Nhì, 1 Ba)', en: '12 starts (7 Wins, 3 Places, 1 Show)' },
      'Xích Thố': { vi: '14 trận (9 Nhất, 3 Nhì, 1 Ba)', en: '14 starts (9 Wins, 3 Places, 1 Show)' },
      'Phi Yến': { vi: '8 trận (4 Nhất, 2 Nhì, 1 Ba)', en: '8 starts (4 Wins, 2 Places, 1 Show)' },
      'Lôi Chấn': { vi: '9 trận (5 Nhất, 2 Nhì, 0 Ba)', en: '9 starts (5 Wins, 2 Places, 0 Show)' }
    };
    const winsCount = isEn
      ? (winsCountMap[h.name]?.en || '10 starts (6 Wins, 2 Places, 1 Show)')
      : (winsCountMap[h.name]?.vi || h.winsCount || '10 trận (6 Nhất, 2 Nhì, 1 Ba)');

    // Tiền thưởng
    const earningsMap = {
      'Hắc Phong': { vi: '1.920.000.000 VNĐ', en: '$82,000 USD (~1.92B VND)' },
      'Xích Thố': { vi: '2.450.000.000 VNĐ', en: '$104,000 USD (~2.45B VND)' },
      'Phi Yến': { vi: '1.150.000.000 VNĐ', en: '$49,000 USD (~1.15B VND)' },
      'Lôi Chấn': { vi: '1.380.000.000 VNĐ', en: '$59,000 USD (~1.38B VND)' }
    };
    const totalEarnings = isEn
      ? (earningsMap[h.name]?.en || '$78,500 USD (~1.85B VND)')
      : (earningsMap[h.name]?.vi || h.totalEarnings || '1.850.000.000 VNĐ');

    // HLV & Groom & Chủ sở hữu
    const trainer = isEn
      ? (h.trainer || 'Head Trainer Pham Hoang Nam').replace('HLV', 'Head Trainer')
      : (h.trainer || 'HLV Phạm Hoàng Nam');

    const groom = isEn
      ? (h.groom || 'Groom Care Team Nguyen Van Nam').replace('Groom', 'Groom Attendant')
      : (h.groom || 'Groom Nguyễn Văn Nam');

    const owner = isEn
      ? (h.owner || 'Horse Owner')
      : (h.owner || 'Chủ sở hữu');

    return {
      statusText,
      genderDisplay,
      breedDisplay,
      englishName,
      desc,
      winsCount,
      totalEarnings,
      trainer,
      groom,
      owner
    };
  };

  // Mở modal xem chi tiết chiến mã
  const handleOpenHorseDetail = (h) => {
    const extra = initialHorsesData.find(item =>
      item.name.toLowerCase() === h.name.toLowerCase() ||
      (item.chipId && h.microchip && item.chipId.replace(/[^0-9]/g, '').slice(-4) === h.microchip.replace(/[^0-9]/g, '').slice(-4))
    ) || {};

    const fullDetail = {
      ...h,
      englishName: extra.englishName || h.name,
      yob: extra.yob || 2021,
      age: extra.age || (2026 - (extra.yob || 2021)),
      color: extra.color || 'Hồng mã tiêu chuẩn',
      height: extra.height || '16.2 hh (165 cm)',
      weight: extra.weight || '495 kg',
      trainer: extra.trainer || 'HLV Phạm Hoàng Nam',
      groom: extra.groom || 'Groom Nguyễn Văn Nam',
      winsCount: extra.winsCount || '10 trận (6 Nhất, 2 Nhì, 1 Ba)',
      totalEarnings: extra.totalEarnings || '1.850.000.000 VNĐ',
      maxSpeed: '66.8 km/h',
      heartRateRest: '38 bpm',
      heartRateMax: '218 bpm',
      dietPlan: '3.5kg Ngũ cốc yến mạch + 5kg Cỏ Alfalfa + Điện giải Vitamin',
      pedigreeOrigin: extra.pedigree?.g1?.origin || 'Trang trại Đua Ngựa Đại Nam',
      sire: extra.pedigree?.g2?.sire?.name || 'Storm Cat II (USA)',
      dam: extra.pedigree?.g2?.dam?.name || 'Golden Velvet (IRE)'
    };
    setViewingHorseDetail(fullDetail);
  };

  // Thêm nhân sự mới
  const handleCreateUser = (e) => {
    e.preventDefault();
    const roleMap = {
      TRAINER: 'Huấn luyện viên',
      VET: 'Bác sĩ Thú y',
      GROOM: 'Nhân viên Chăm sóc',
      MANAGER: 'Ban Quản lý'
    };
    const chosenRole = newUserData.role || 'TRAINER';
    registerUser({
      ...newUserData,
      role: chosenRole,
      role_name: roleMap[chosenRole] || 'Nhân sự'
    });
    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'TẠO NHÂN SỰ MỚI',
        detail: `Thêm nhân sự mới ${newUserData.full_name} (@${newUserData.username}, vai trò: ${roleMap[chosenRole] || chosenRole})`
      },
      ...prev
    ]);
    setShowAddUserModal(false);
    setNewUserData({ username: '', full_name: '', email: '', phone: '', role: 'TRAINER', password: '123' });
    showToast(
      lang === 'en' ? `Created staff account "${newUserData.full_name}" successfully!` : `Đã tạo tài khoản nhân sự "${newUserData.full_name}" thành công!`,
      lang === 'en' ? 'STAFF CREATED' : 'TẠO NHÂN SỰ THÀNH CÔNG',
      'success'
    );
  };

  // Lấy danh sách chiến mã và chủ sở hữu mà nhân sự đang phục vụ
  const getStaffAssignedHorsesAndOwners = (staffUser) => {
    if (!staffUser) return [];
    const uName = (staffUser.username || '').trim().toLowerCase();
    const fName = (staffUser.full_name || '').trim().toLowerCase();
    const role = (staffUser.role || '').toUpperCase();

    // Chỉ nhân sự chuyên trách (HLV, Bác sĩ, Groom) mới có danh sách chiến mã phụ trách
    if (role !== 'TRAINER' && role !== 'VET' && role !== 'GROOM') {
      return [];
    }

    const resultMap = new Map();

    // 1. Quét từ danh sách phân công chính thức getServiceAssignments()
    try {
      const assignments = getServiceAssignments() || [];
      assignments.forEach(item => {
        if (!item || !item.horseName) return;
        const matchTrainer = (role === 'TRAINER') && (
          (item.trainerUsername && item.trainerUsername.trim().toLowerCase() === uName) ||
          (!item.trainerUsername && item.trainerName && item.trainerName.trim().toLowerCase() === fName)
        );
        const matchVet = (role === 'VET') && (
          (item.vetUsername && item.vetUsername.trim().toLowerCase() === uName) ||
          (!item.vetUsername && item.vetName && item.vetName.trim().toLowerCase() === fName)
        );
        const matchGroom = (role === 'GROOM') && (
          (item.groomUsername && item.groomUsername.trim().toLowerCase() === uName) ||
          (!item.groomUsername && item.groomName && item.groomName.trim().toLowerCase() === fName)
        );

        if (matchTrainer || matchVet || matchGroom) {
          const rawStatus = matchTrainer
            ? (item.trainerStatus || (item.trainerConfirmed ? 'CONFIRMED' : 'PENDING'))
            : matchVet
            ? (item.vetStatus || (item.vetConfirmed ? 'CONFIRMED' : 'PENDING'))
            : (item.groomStatus || (item.groomConfirmed ? 'CONFIRMED' : 'PENDING'));

          const serviceStatus = (rawStatus === 'CONFIRMED') ? 'CONFIRMED' : 'PENDING';

          const horseKey = (item.horseName || item.microchip || String(item.id)).trim().toLowerCase();
          resultMap.set(horseKey, {
            id: item.id || horseKey,
            horseName: item.horseName,
            microchip: item.microchip || 'MC-VN-2026-001',
            breed: item.breed || 'Quarter Horse',
            stable: item.stable || 'Block A',
            avatar: item.avatar || null,
            gender: item.gender || 'Chiến mã đực',
            age: item.age || '4 tuổi',
            ownerName: item.ownerName || 'Chủ sở hữu',
            ownerKey: item.ownerKey || 'owner',
            status: serviceStatus,
            scope: role === 'TRAINER'
              ? 'HLV chuyên trách: Luyện tập thể lực & bứt tốc'
              : role === 'VET'
              ? 'Bác sĩ thú y: Khám sức khỏe & theo dõi dinh dưỡng'
              : 'Groom chuyên trách: Vệ sinh ô chuồng & móng ngựa'
          });
        }
      });
    } catch {}

    // 2. Quét từ các kho của chủ sở hữu: matruong_owner_horses_*
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('matruong_owner_horses_')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const ownerUsername = k.replace('matruong_owner_horses_', '');
                list.forEach(h => {
                  if (!h || !h.name) return;
                  const hName = (h.name || '').trim().toLowerCase();
                  const trUser = (h.trainerUsername || '').trim().toLowerCase();
                  const trName = (h.trainer || h.trainerName || '').trim().toLowerCase();
                  const vtUser = (h.vetUsername || '').trim().toLowerCase();
                  const vtName = (h.vet || h.vetName || '').trim().toLowerCase();
                  const grUser = (h.groomUsername || '').trim().toLowerCase();
                  const grName = (h.groom || h.groomName || '').trim().toLowerCase();

                  const matchTrainer = (role === 'TRAINER') && (
                    (trUser && trUser === uName) ||
                    (!trUser && trName && trName === fName)
                  );
                  const matchVet = (role === 'VET') && (
                    (vtUser && vtUser === uName) ||
                    (!vtUser && vtName && vtName === fName)
                  );
                  const matchGroom = (role === 'GROOM') && (
                    (grUser && grUser === uName) ||
                    (!grUser && grName && grName === fName)
                  );

                  if (matchTrainer || matchVet || matchGroom) {
                    if (!resultMap.has(hName)) {
                      const rawStatus = matchTrainer
                        ? (h.trainerStatus || (h.trainerConfirmed ? 'CONFIRMED' : 'PENDING'))
                        : matchVet
                        ? (h.vetStatus || (h.vetConfirmed ? 'CONFIRMED' : 'PENDING'))
                        : (h.groomStatus || (h.groomConfirmed ? 'CONFIRMED' : 'PENDING'));

                      const serviceStatus = (rawStatus === 'CONFIRMED') ? 'CONFIRMED' : 'PENDING';

                      resultMap.set(hName, {
                        id: h.id || hName,
                        horseName: h.name,
                        microchip: h.microchip || 'MC-VN-2026-002',
                        breed: h.breed || 'Quarter Horse',
                        stable: h.stable || 'Block C',
                        avatar: h.avatar || null,
                        gender: h.gender || 'Chiến mã đực',
                        age: h.age || '4 tuổi',
                        ownerName: h.ownerName || h.owner || ownerUsername,
                        ownerKey: ownerUsername,
                        status: serviceStatus,
                        scope: role === 'TRAINER'
                          ? 'HLV chuyên trách: Luyện tập thể lực & bứt tốc'
                          : role === 'VET'
                          ? 'Bác sĩ thú y: Khám sức khỏe & theo dõi dinh dưỡng'
                          : 'Groom chuyên trách: Vệ sinh ô chuồng & móng ngựa'
                      });
                    }
                  }
                });
              }
            }
          }
        }
      }
    } catch {}

    // 3. Bổ sung thông tin người dùng từ usersList và vị trí ô chuồng
    return Array.from(resultMap.values()).map(item => {
      const ownerUser = (usersList || []).find(u =>
        (u.username && u.username.toLowerCase() === item.ownerKey.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase() === item.ownerName.toLowerCase())
      );
      let currentStable = item.stable;
      if (stables && Array.isArray(stables)) {
        const foundStall = stables.find(s => s.horse && s.horse.toLowerCase() === item.horseName.toLowerCase());
        if (foundStall) {
          currentStable = `Ô ${foundStall.stall_code} (${foundStall.block})`;
        }
      }
      return {
        ...item,
        stable: currentStable,
        ownerFullName: ownerUser?.full_name || item.ownerName,
        ownerPhone: ownerUser?.phone || '0988 123 456',
        ownerEmail: ownerUser?.email || `${item.ownerKey}@matruong.vn`
      };
    });
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
    setEditUserModalTab('all');
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

    // Đồng bộ nếu username hoặc họ tên nhân sự thay đổi trong bảng phân công
    const originalUser = (usersList || []).find(u => Number(u.user_id) === Number(editUserData.user_id));
    if (originalUser) {
      const oldUName = (originalUser.username || '').trim().toLowerCase();
      const oldFName = (originalUser.full_name || '').trim().toLowerCase();
      const newUName = (editUserData.username || '').trim();
      const newFName = (editUserData.full_name || '').trim();

      if (oldUName !== newUName.toLowerCase() || oldFName !== newFName.toLowerCase()) {
        try {
          const rawAssignments = localStorage.getItem('matruong_service_assignments');
          if (rawAssignments) {
            const parsed = JSON.parse(rawAssignments);
            if (Array.isArray(parsed)) {
              const updated = parsed.map(asgn => {
                const next = { ...asgn };
                if ((asgn.trainerUsername || '').toLowerCase() === oldUName || (asgn.trainerName || '').toLowerCase() === oldFName) {
                  next.trainerUsername = newUName;
                  next.trainerName = newFName;
                }
                if ((asgn.vetUsername || '').toLowerCase() === oldUName || (asgn.vetName || '').toLowerCase() === oldFName) {
                  next.vetUsername = newUName;
                  next.vetName = newFName;
                }
                if ((asgn.groomUsername || '').toLowerCase() === oldUName || (asgn.groomName || '').toLowerCase() === oldFName) {
                  next.groomUsername = newUName;
                  next.groomName = newFName;
                }
                return next;
              });
              localStorage.setItem('matruong_service_assignments', JSON.stringify(updated));
              window.dispatchEvent(new Event('matruong_service_assignment_updated'));
            }
          }
        } catch {}
      }
    }

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

    showToast(
      lang === 'en'
        ? `Updated staff profile "${editUserData.full_name}" successfully!`
        : `Đã lưu cập nhật thông tin nhân sự "${editUserData.full_name}" thành công!`,
      lang === 'en' ? 'PROFILE UPDATED' : 'CẬP NHẬT THÀNH CÔNG',
      'success'
    );

    setShowConfirmEditModal(false);
    setShowEditUserModal(false);
    setEditUserData(null);
  };

  // Mở modal xóa nhân sự
  const handleOpenDeleteUser = (user) => {
    if (user.username === 'admin') {
      showToast(
        lang === 'en' ? 'Cannot delete the primary Administrator account!' : 'Không thể xóa tài khoản Quản trị viên chính!',
        lang === 'en' ? 'RESTRICTED ACTION' : 'HẠN CHẾ BẢO MẬT',
        'warning'
      );
      return;
    }
    setDeleteTargetUser(user);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa vĩnh viễn (1 lần)
  const handleConfirmDeleteUser = () => {
    if (!deleteTargetUser) return;
    const targetId = deleteTargetUser.user_id;
    const targetName = deleteTargetUser.full_name;
    const targetUsername = deleteTargetUser.username;
    const targetRole = deleteTargetUser.role_name || deleteTargetUser.role;

    // Không cho phép xóa 10 nhân sự cốt cán cố định
    const fixedUsernames = ['admin', 'trainer_truong', 'trainer_nghia', 'trainer_anh', 'vet_an', 'vet_hoang', 'vet_linh', 'groom_nam', 'groom_dung', 'groom_thao'];
    if (targetId <= 10 || fixedUsernames.includes(targetUsername)) {
      showToast(
        lang === 'en'
          ? 'Cannot delete fixed club core staff (1 Admin, 3 Trainers, 3 Vets, 3 Grooms)!'
          : 'Không thể xóa 10 nhân sự cố định của câu lạc bộ (1 Admin, 3 HLV, 3 BS Thú y, 3 Groom)!',
        lang === 'en' ? 'FIXED STAFF' : 'NHÂN SỰ CỐ ĐỊNH',
        'warning'
      );
      setShowDeleteModal(false);
      setDeleteTargetUser(null);
      return;
    }

    deleteUser(targetId);

    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'XÓA NHÂN SỰ',
        detail: `Đã xóa tài khoản nhân sự #${targetId} (${targetName} - @${targetUsername}, vai trò: ${targetRole})`
      },
      ...prev
    ]);

    showToast(
      lang === 'en' ? `Deleted staff ${targetName} (@${targetUsername})` : `Đã xóa nhân sự ${targetName} (@${targetUsername}) khỏi hệ thống`,
      lang === 'en' ? 'STAFF REMOVED' : 'ĐÃ XÓA NHÂN SỰ',
      'info'
    );

    setShowDeleteModal(false);
    setDeleteTargetUser(null);
  };

  // Hủy bỏ xóa
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetUser(null);
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
    // Đồng bộ với API Backend
    createHorseApi(newHorse).catch(() => {});

    setHorses(prev => [...prev, { ...newHorse, avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80' }]);
    setStables(prev => prev.map(s => s.stall_code === newHorseData.stable ? { ...s, status: 'OCCUPIED', horse: newHorseData.name, breed: newHorseData.breed, stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' } : s));
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
    setNewHorseData({ name: '', microchip: '', breed: 'Thoroughbred', gender: 'Ngựa đực (Stallion)', stable: 'B6', owner: '' });
  };

  // Thay đổi trạng thái chuồng
  const handleToggleStable = (stallCode) => {
    const target = stables.find(s => s.stall_code === stallCode);
    if (!target) return;

    const hasAssignedHorse = Boolean(target.horse && target.horse !== '(Trống)');
    const activeMap = getActiveStallMaintenances();

    // 1. TRƯỜNG HỢP Ô CHUỒNG ĐÃ ĐƯỢC GÁN CHIẾN MÃ:
    // Tuyệt đối không chuyển sang "Còn trống" (AVAILABLE) vì đã có ngựa được gán vào trước đó!
    // Chỉ được chuyển đổi giữa: OCCUPIED (Đang nuôi dưỡng) <-> MAINTENANCE (Đang bảo dưỡng 30 phút)
    if (hasAssignedHorse) {
      if (target.status === 'OCCUPIED') {
        // Chuyển sang MAINTENANCE (Bảo dưỡng 30 phút):
        // Tự động tìm ô chuồng đang trống để chuyển tạm chiến mã
        const availableTempStall = stables.find(s =>
          s.stall_code !== stallCode &&
          s.status === 'AVAILABLE' &&
          (!s.horse || s.horse === '(Trống)') &&
          !activeMap[s.stall_code]
        );

        if (!availableTempStall) {
          showToast(
            lang === 'en'
              ? 'Cannot maintain stall: No vacant stall available to temporarily house the horse!'
              : 'Không thể bảo dưỡng: Hiện không còn ô chuồng trống nào để điều chuyển tạm thời cho chiến mã!',
            lang === 'en' ? 'NO VACANT STALL' : 'KHÔNG CÒN CHUỒNG TRỐNG',
            'warning'
          );
          return;
        }

        const tempCode = availableTempStall.stall_code;
        const durationMinutes = 30;
        const startTime = Date.now();
        const endTime = startTime + durationMinutes * 60 * 1000;

        // Lưu thông tin ca bảo dưỡng 30 phút
        const maintRecord = {
          stallCode: target.stall_code,
          tempStallCode: tempCode,
          horseName: target.horse,
          horseBreed: target.breed || 'Thuần chủng',
          horseAvatar: target.horse_avatar || null,
          startTime,
          durationMs: durationMinutes * 60 * 1000,
          endTime
        };
        activeMap[target.stall_code] = maintRecord;
        saveActiveStallMaintenances(activeMap);

        // Gửi thông báo liên thông cho: Chủ sở hữu ngựa, HLV, Bác sĩ thú y, Chăm sóc (Groom) và Admin
        notifyStallMaintenanceStarted(target.stall_code, tempCode, target.horse, durationMinutes);

        // Ghi Audit Logs hệ thống
        setAuditLogs(prev => [
          {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleString('vi-VN'),
            user: `${currentUser?.username || 'admin'} (Admin)`,
            action: 'BẢO DƯỠNG Ô CHUỒNG (30 PHÚT)',
            detail: `Bắt đầu bảo dưỡng ô ${target.stall_code} trong 30 phút. Chiến mã "${target.horse}" tự động chuyển sang ô tạm ${tempCode}. Đã thông báo Chủ sở hữu, HLV, Bác sĩ & Groom.`
          },
          ...prev
        ]);

        const updatedStalls = stables.map(s => {
          if (s.stall_code === target.stall_code) {
            return {
              ...s,
              status: 'MAINTENANCE',
              horse: target.horse, // Tên chiến mã CỐ ĐỊNH, không bị mất!
              temp_relocated_to: tempCode,
              maintenance_start: startTime,
              maintenance_end: endTime
            };
          }
          if (s.stall_code === tempCode) {
            return {
              ...s,
              status: 'OCCUPIED',
              horse: target.horse,
              breed: target.breed || 'Thuần chủng',
              horse_avatar: target.horse_avatar || null,
              is_temp_stall: true,
              temp_for_stall: target.stall_code,
              maintenance_end: endTime
            };
          }
          return s;
        });

        setStables(updatedStalls);
        try {
          localStorage.setItem('racehorse_api_stables', JSON.stringify(updatedStalls));
          localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
          window.dispatchEvent(new Event('matruong_stables_updated'));
        } catch {}

        showToast(
          lang === 'en'
            ? `Stall ${target.stall_code} set to Maintenance (30m). Horse "${target.horse}" relocated to ${tempCode}. Notifications sent!`
            : `Đã chuyển ô ${target.stall_code} sang Bảo dưỡng (30 phút). Chiến mã "${target.horse}" tạm chuyển sang ô ${tempCode}. Đã thông báo cho Chủ sở hữu, HLV, Bác sĩ & Groom!`,
          lang === 'en' ? 'MAINTENANCE STARTED' : 'BẢO DƯỠNG Ô CHUỒNG',
          'success'
        );
      } else {
        // Đang MAINTENANCE -> Chuyển lại về OCCUPIED (kết thúc bảo dưỡng)
        const record = activeMap[target.stall_code];
        const tempCode = record ? record.tempStallCode : target.temp_relocated_to;

        if (record) {
          delete activeMap[target.stall_code];
          saveActiveStallMaintenances(activeMap);
        }

        if (tempCode) {
          notifyStallMaintenanceCompleted(target.stall_code, tempCode, target.horse);
        }

        setAuditLogs(prev => [
          {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleString('vi-VN'),
            user: `${currentUser?.username || 'admin'} (Admin)`,
            action: 'HOÀN TẤT BẢO DƯỠNG Ô CHUỒNG',
            detail: `Kết thúc bảo dưỡng ô ${target.stall_code}. Chiến mã "${target.horse}" đã quay về ô chuồng ban đầu. Đã giải phóng ô tạm ${tempCode || ''}.`
          },
          ...prev
        ]);

        const updatedStalls = stables.map(s => {
          if (s.stall_code === target.stall_code) {
            return {
              ...s,
              status: 'OCCUPIED',
              horse: target.horse, // Tên chiến mã CỐ ĐỊNH!
              temp_relocated_to: null,
              maintenance_start: null,
              maintenance_end: null
            };
          }
          if (tempCode && s.stall_code === tempCode) {
            return {
              ...s,
              status: 'AVAILABLE',
              horse: '(Trống)',
              breed: 'Vacant',
              horse_avatar: null,
              is_temp_stall: false,
              temp_for_stall: null,
              maintenance_end: null
            };
          }
          return s;
        });

        setStables(updatedStalls);
        try {
          localStorage.setItem('racehorse_api_stables', JSON.stringify(updatedStalls));
          localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
          window.dispatchEvent(new Event('matruong_stables_updated'));
        } catch {}

        showToast(
          lang === 'en'
            ? `Stall ${target.stall_code} maintenance finished! Horse "${target.horse}" returned home.`
            : `Đã hoàn tất bảo dưỡng ô ${target.stall_code}. Chiến mã "${target.horse}" đã quay về ô chuồng ban đầu!`,
          lang === 'en' ? 'MAINTENANCE ENDED' : 'HOÀN TẤT BẢO DƯỠNG',
          'success'
        );
      }
    } else {
      // 2. Ô CHUỒNG TRỐNG (chưa có ngựa): Luân chuyển giữa AVAILABLE <-> MAINTENANCE
      const nextStatus = target.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      const updatedStalls = stables.map(s => {
        if (s.stall_code === target.stall_code) {
          return {
            ...s,
            status: nextStatus,
            horse: '(Trống)',
            breed: 'Vacant'
          };
        }
        return s;
      });

      setStables(updatedStalls);
      updateStallApi(target.stall_code, {
        status: nextStatus,
        horse: '(Trống)',
        breed: 'Vacant'
      }).catch(() => {});

      const nextStName = nextStatus === 'MAINTENANCE'
        ? (lang === 'en' ? 'Maintenance' : 'Bảo dưỡng')
        : (lang === 'en' ? 'Available' : 'Còn trống');

      showToast(
        lang === 'en' ? `Stall ${stallCode} status: ${nextStName}` : `Đã chuyển ô chuồng ${stallCode} sang: ${nextStName}`,
        lang === 'en' ? 'STATUS UPDATED' : 'CẬP NHẬT TRẠNG THÁI',
        'success'
      );
    }
  };

  // Khởi tạo ô chuồng mới
  const handleCreateStall = (e) => {
    e.preventDefault();
    const code = newStallData.stall_code.trim().toUpperCase();
    if (!code) {
      showToast(
        lang === 'en' ? 'Please enter a valid stall code!' : 'Vui lòng nhập mã ô chuồng hợp lệ!',
        lang === 'en' ? 'DATA WARNING' : 'CẢNH BÁO DỮ LIỆU',
        'warning'
      );
      return;
    }

    if (stables.some(s => s.stall_code.toUpperCase() === code)) {
      showToast(
        lang === 'en' ? `Stall code ${code} already exists! Please choose another code.` : `Mã ô chuồng ${code} đã tồn tại! Vui lòng chọn mã khác.`,
        lang === 'en' ? 'DUPLICATE STALL' : 'TRÙNG MÃ Ô CHUỒNG',
        'warning'
      );
      return;
    }

    const isOccupied = newStallData.status === 'OCCUPIED';
    const horseName = isOccupied ? (newStallData.horse.trim() || 'Chiến mã mới') : '(Trống)';
    const breedName = isOccupied ? (newStallData.breed || 'Thoroughbred') : 'Vacant';
    const isVipTier = newStallData.tier ? newStallData.tier === 'VIP' : (newStallData.block === 'Block VIP' || code.startsWith('VIP') || code.startsWith('A') || code.startsWith('B'));

    const newStall = {
      stall_code: code,
      stallCode: code,
      block: newStallData.block,
      tier: isVipTier ? 'VIP' : 'STANDARD',
      is_vip: isVipTier,
      status: newStallData.status,
      horse: horseName,
      breed: breedName,
      area: newStallData.area || '16 m²',
      dim: newStallData.dim || '4.0 x 4.0m',
      stall_image: newStallData.stall_image || (isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg'),
      horse_avatar: isOccupied ? 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' : null
    };

    // Gửi yêu cầu tới Backend API
    createStallApi(newStall).catch(() => {});

    setStables(prev => {
      const updated = [...prev, newStall];
      try {
        localStorage.setItem('racehorse_api_stables', JSON.stringify(updated));
        localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
        window.dispatchEvent(new Event('matruong_stables_updated'));
      } catch {}
      return updated;
    });

    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'TẠO Ô CHUỒNG MỚI',
        detail: `Khởi tạo thành công ô chuồng mới ${newStall.stall_code} (${newStall.block}, phân hạng ${newStall.tier === 'VIP' ? 'VIP' : 'Thường'}, quy cách ${newStall.dim}, diện tích ${newStall.area})`
      },
      ...prev
    ]);

    showToast(
      lang === 'en' ? `Stall ${code} (${newStall.tier}) created successfully!` : `Đã tạo thành công ô chuồng mới ${code} (${newStall.block} - Phân hạng: ${newStall.tier === 'VIP' ? 'VIP' : 'Thường'})!`,
      lang === 'en' ? 'STALL CREATED' : 'TẠO CHUỒNG THÀNH CÔNG',
      'info'
    );

    setShowAddStallModal(false);
    setNewStallData({
      stall_code: '',
      block: 'Block C',
      tier: 'STANDARD',
      status: 'AVAILABLE',
      area: '16 m²',
      dim: '4.0 x 4.0m',
      horse: '',
      breed: 'Thoroughbred',
      stall_image: ''
    });
  };

  // Mở modal xóa ô chuồng
  const handleOpenDeleteStall = (stall) => {
    setDeleteTargetStall(stall);
    setShowDeleteStallModal(true);
  };

  // Xác nhận xóa ô chuồng
  const handleConfirmDeleteStall = () => {
    if (!deleteTargetStall) return;
    const targetCode = deleteTargetStall.stall_code;
    const targetBlock = deleteTargetStall.block;
    const targetHorse = deleteTargetStall.horse;
    const isOccupied = deleteTargetStall.status === 'OCCUPIED';

    // Gửi yêu cầu xóa tới Backend API
    deleteStallApi(targetCode).catch(() => {});

    // Xóa khỏi danh sách stables
    setStables(prev => {
      const updated = prev.filter(s => s.stall_code !== targetCode);
      try {
        localStorage.setItem('racehorse_api_stables', JSON.stringify(updated));
        localStorage.setItem('matruong_stables_timestamp', String(Date.now()));
        window.dispatchEvent(new Event('matruong_stables_updated'));
      } catch {}
      return updated;
    });

    // Nếu có ngựa cư trú, chuyển ngựa đó về trạng thái chờ phân bổ
    if (isOccupied && targetHorse && targetHorse !== '(Trống)') {
      setHorses(prev => prev.map(h => (h.stable === targetCode || h.name.toLowerCase() === targetHorse.toLowerCase()) ? { ...h, stable: '(Chưa phân bổ)' } : h));
    }

    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'XÓA Ô CHUỒNG',
        detail: `Đã xóa ô chuồng ${targetCode} (${targetBlock})${isOccupied ? ` - Chiến mã ${targetHorse} được đưa về trạng thái chờ phân bổ.` : ''}`
      },
      ...prev
    ]);

    showToast(
      lang === 'en' ? `Deleted barn stall ${targetCode} successfully` : `Đã xóa ô chuồng ${targetCode} (${targetBlock}) thành công`,
      lang === 'en' ? 'STALL REMOVED' : 'ĐÃ XÓA Ô CHUỒNG',
      'info'
    );

    setShowDeleteStallModal(false);
    setDeleteTargetStall(null);
  };

  // Admin tải lên / cập nhật hình ảnh ô chuồng
  const handleUploadStallImage = (stallCode, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)!', 'LỖI ĐỊNH DẠNG', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setStables(prev => {
          const next = prev.map(s => s.stall_code === stallCode ? { ...s, stall_image: optimizedDataUrl } : s);
          try {
            localStorage.setItem('racehorse_api_stables', JSON.stringify(next));
            window.dispatchEvent(new Event('matruong_stables_updated'));
          } catch {}
          return next;
        });

        updateStallApi({ stall_code: stallCode, stall_image: optimizedDataUrl }).catch(() => {});

        showToast(
          lang === 'en' ? `Updated photo for Stall ${stallCode} successfully!` : `Đã cập nhật hình ảnh cho ô chuồng ${stallCode} thành công!`,
          lang === 'en' ? 'PHOTO UPDATED' : 'CẬP NHẬT ẢNH CHUỒNG',
          'success'
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Admin tải lên hình ảnh cho ô chuồng mới khi khởi tạo
  const handleUploadNewStallImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)!', 'LỖI ĐỊNH DẠNG', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setNewStallData(prev => ({ ...prev, stall_image: optimizedDataUrl }));
        showToast(
          lang === 'en' ? 'Stall photo uploaded successfully!' : 'Đã tải ảnh chuồng lên thành công!',
          lang === 'en' ? 'PHOTO UPLOADED' : 'TẢI ẢNH THÀNH CÔNG',
          'success'
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Xử lý phê duyệt yêu cầu cấp/đổi ô chuồng từ Chủ sở hữu
  const handleApproveStallRequest = async (reqId) => {
    try {
      const ok = await approveStallRequestApi(reqId, currentUser?.name || 'Admin Quản Trị');
      if (ok) {
        showToast(
          lang === 'en' ? 'Stall request approved successfully!' : 'Đã phê duyệt thành công! Ô chuồng mới đã được kích hoạt và ô cũ đã được giải phóng.',
          lang === 'en' ? 'APPROVED' : 'PHÊ DUYỆT THÀNH CÔNG',
          'success'
        );
      }
    } catch {
      showToast('Có lỗi xảy ra khi phê duyệt!', 'LỖI', 'error');
    }
  };

  const handleOpenRejectModal = (req) => {
    setRejectingRequest(req);
    setRejectReasonInput('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectStallRequest = async () => {
    if (!rejectingRequest) return;
    try {
      const ok = await rejectStallRequestApi(rejectingRequest.id, rejectReasonInput, currentUser?.name || 'Admin Quản Trị');
      if (ok) {
        showToast(
          lang === 'en' ? 'Stall request rejected.' : 'Đã từ chối yêu cầu cấp / đổi ô chuồng. Ô chuồng xin cấp đã được trả về trạng thái trống.',
          lang === 'en' ? 'REJECTED' : 'ĐÃ TỪ CHỐI',
          'info'
        );
        setShowRejectModal(false);
        setRejectingRequest(null);
      }
    } catch {
      showToast('Có lỗi xảy ra khi từ chối!', 'LỖI', 'error');
    }
  };

  // Mở modal thay đổi chiến mã
  const handleOpenChangeHorse = (stall) => {
    setChangeHorseStall(stall);
    if (stall.status === 'OCCUPIED' && stall.horse && stall.horse !== '(Trống)') {
      const matched = horses.find(h => h.name.toLowerCase() === stall.horse.toLowerCase());
      if (matched) {
        setSelectedHorseOption(String(matched.id));
      } else {
        setSelectedHorseOption('CUSTOM');
        setCustomHorseName(stall.horse);
        setCustomHorseBreed(stall.breed || 'Thoroughbred');
      }
    } else {
      setSelectedHorseOption('VACANT');
      setCustomHorseName('');
    }
    setShowChangeHorseModal(true);
  };

  // Lưu thay đổi chiến mã cho ô chuồng
  const handleSaveChangeHorse = (e) => {
    e.preventDefault();
    if (!changeHorseStall) return;

    const stallCode = changeHorseStall.stall_code;

    if (selectedHorseOption === 'VACANT') {
      // Làm trống ô chuồng qua API
      reassignStallHorseApi(stallCode, '', 'Vacant').catch(() => {});

      // Làm trống ô chuồng
      setStables(prev => prev.map(s => {
        if (s.stall_code === stallCode) {
          return {
            ...s,
            status: 'AVAILABLE',
            horse: '(Trống)',
            breed: 'Vacant',
            stall_image: '/images/stall_simulation_vacant.jpg',
            horse_avatar: null
          };
        }
        return s;
      }));

      // Nếu có ngựa trước đó trong ô này, cập nhật stable của ngựa
      setHorses(prev => prev.map(h => h.stable === stallCode ? { ...h, stable: '(Chưa phân bổ)' } : h));

      setAuditLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleString('vi-VN'),
          user: `${currentUser?.username || 'admin'} (Admin)`,
          action: 'LÀM TRỐNG Ô CHUỒNG',
          detail: `Đã đưa ô chuồng ${stallCode} về trạng thái trống sẵn sàng đón nhận chiến mã mới.`
        },
        ...prev
      ]);

      showToast(
        lang === 'en' ? `Stall ${stallCode} is now vacant & available` : `Ô chuồng ${stallCode} hiện đã trống và sẵn sàng phân bổ`,
        lang === 'en' ? 'STALL VACATED' : 'CHUỒNG ĐÃ TRỐNG',
        'info'
      );
    } else if (selectedHorseOption === 'CUSTOM') {
      const hName = customHorseName.trim() || 'Chiến mã mới';
      const hBreed = customHorseBreed || 'Thoroughbred';

      // Phân bổ qua API
      reassignStallHorseApi(stallCode, hName, hBreed).catch(() => {});

      setStables(prev => prev.map(s => {
        if (s.stall_code === stallCode) {
          return {
            ...s,
            status: 'OCCUPIED',
            horse: hName,
            breed: hBreed,
            stall_image: '/images/stall_simulation_occupied.jpg',
            horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80'
          };
        }
        return s;
      }));

      setAuditLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleString('vi-VN'),
          user: `${currentUser?.username || 'admin'} (Admin)`,
          action: 'THAY ĐỔI CHIẾN MÃ Ô CHUỒNG',
          detail: `Đã phân bổ chiến mã mới ${hName} (${hBreed}) vào ô chuồng ${stallCode}`
        },
        ...prev
      ]);

      showToast(
        lang === 'en' ? `Assigned horse ${hName} to stall ${stallCode}` : `Đã phân bổ chiến mã ${hName} vào ô chuồng ${stallCode}`,
        lang === 'en' ? 'HORSE ASSIGNED' : 'PHÂN BỔ CHIẾN MÃ',
        'info'
      );
    } else {
      // Chọn từ danh sách horses
      const chosenHorse = horses.find(h => String(h.id) === String(selectedHorseOption));
      if (chosenHorse) {
        const oldStallOfHorse = chosenHorse.stable;

        // Phân bổ qua API
        reassignStallHorseApi(stallCode, chosenHorse.name, chosenHorse.breed, chosenHorse.microchip).catch(() => {});

        // Cập nhật stables:
        // 1. Ô chuồng cũ của con ngựa này (nếu khác ô hiện tại) sẽ thành AVAILABLE
        // 2. Ô chuồng mới này sẽ thành OCCUPIED với chosenHorse
        setStables(prev => prev.map(s => {
          if (s.stall_code === stallCode) {
            return {
              ...s,
              status: 'OCCUPIED',
              horse: chosenHorse.name,
              breed: chosenHorse.breed,
              stall_image: '/images/stall_simulation_occupied.jpg',
              horse_avatar: chosenHorse.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80'
            };
          }
          if (oldStallOfHorse && oldStallOfHorse !== stallCode && s.stall_code === oldStallOfHorse) {
            return {
              ...s,
              status: 'AVAILABLE',
              horse: '(Trống)',
              breed: 'Vacant',
              stall_image: '/images/stall_simulation_vacant.jpg',
              horse_avatar: null
            };
          }
          return s;
        }));

        // Cập nhật stable của chosenHorse
        setHorses(prev => prev.map(h => h.id === chosenHorse.id ? { ...h, stable: stallCode } : h));

        setAuditLogs(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleString('vi-VN'),
            user: `${currentUser?.username || 'admin'} (Admin)`,
            action: 'THAY ĐỔI CHIẾN MÃ Ô CHUỒNG',
            detail: `Đã chuyển chiến mã ${chosenHorse.name} (${chosenHorse.microchip}) sang ô chuồng ${stallCode}`
          },
          ...prev
        ]);

        showToast(
          lang === 'en' ? `Moved ${chosenHorse.name} to stall ${stallCode}` : `Đã chuyển chiến mã ${chosenHorse.name} sang ô chuồng ${stallCode}`,
          lang === 'en' ? 'HORSE REASSIGNED' : 'ĐỔI CHIẾN MÃ THÀNH CÔNG',
          'info'
        );
      }
    }

    setShowChangeHorseModal(false);
    setChangeHorseStall(null);
  };

  // Lọc dữ liệu ngựa
  const filteredHorses = horses.filter(h => {
    if (horseFilter === 'ALL') return true;
    if (horseFilter === 'ELIGIBLE') return h.status === 'ELIGIBLE' && !h.locked;
    if (horseFilter === 'WATCH') return h.status === 'WATCH';
    if (horseFilter === 'LOCKED') return h.locked || h.status === 'INJURED' || h.status === 'QUARANTINE';
    return true;
  });

  // Danh sách nhân sự nội bộ (Loại trừ Chủ sở hữu ngựa khỏi phân công nhân sự)
  const isOwnerUser = (u) => {
    const roleUpper = String(u.role || '').toUpperCase();
    return roleUpper === 'OWNER';
  };
  const staffList = usersList.filter(u => !isOwnerUser(u));

  // Lọc dữ liệu nhân sự (chỉ hiển thị nhân sự, không có Chủ sở hữu ngựa)
  const filteredUsers = staffList.filter(u => {
    if (userFilter === 'PENDING') return u.status === 'PENDING';
    if (userFilter === 'ALL') return true;
    return u.role === userFilter;
  });

  // Hàm xác định ô chuồng là VIP hay Tiêu chuẩn
  const isVipStall = (s) => {
    if (!s) return false;
    if (s.tier === 'VIP' || s.is_vip === true) return true;
    if (s.tier === 'STANDARD' || s.tier === 'NORMAL' || s.is_vip === false) return false;
    const code = String(s.stall_code || '').toUpperCase();
    const block = String(s.block || '').toUpperCase();
    return block.includes('VIP') || block.includes('BLOCK A') || block.includes('BLOCK B') || code.startsWith('VIP') || code.startsWith('A') || code.startsWith('B');
  };

  // Lọc chuồng theo trạng thái và phân hạng VIP / Tiêu Chuẩn
  const filteredStables = stables.filter(s => {
    if (stableFilter !== 'ALL' && s.status !== stableFilter) return false;
    if (stableTierTab === 'VIP' && !isVipStall(s)) return false;
    if (stableTierTab === 'STANDARD' && isVipStall(s)) return false;
    return true;
  });

  const vipStablesTotal = stables.filter(s => isVipStall(s)).length;
  const stdStablesTotal = stables.filter(s => !isVipStall(s)).length;

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
            {staffList.some(u => u.status === 'PENDING') ? (
              <span className="portal-nav-badge" style={{ background: '#E86B2C', color: '#fff', fontWeight: 800 }}>
                {staffList.filter(u => u.status === 'PENDING').length} {lang === 'en' ? 'pending' : 'chờ duyệt'}
              </span>
            ) : (
              <span className="portal-nav-badge">{staffList.length}</span>
            )}
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('audit'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconAudit /></span>
            <span className="portal-nav-label">{t('adminTabAudit')}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
            title="Khiếu Nại & Báo Cáo Nhân Sự từ Chủ Sở Hữu"
          >
            <span className="portal-nav-icon"><IconReport /></span>
            <span className="portal-nav-label">Khiếu Nại & Báo Cáo</span>
            {pendingReportsCount > 0 ? (
              <span className="portal-nav-badge" style={{ background: '#EF4444', color: '#fff', fontWeight: 800 }}>
                {pendingReportsCount} mới
              </span>
            ) : (
              <span className="portal-nav-badge">{personnelReports.length}</span>
            )}
          </button>
        </nav>
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
                {activeTab === 'reports' && 'Quản Lý Báo Cáo & Khiếu Nại Nhân Sự'}
              </h2>
              <div className="portal-page-subtitle">
                {activeTab === 'overview' && t('adminSubOverview')}
                {activeTab === 'horses' && t('adminSubHorses')}
                {activeTab === 'stables' && t('adminSubStables')}
                {activeTab === 'users' && t('adminSubUsers')}
                {activeTab === 'audit' && t('adminSubAudit')}
                {activeTab === 'reports' && 'Tiếp nhận, thẩm tra và xử lý phản ánh của Chủ sở hữu về Huấn luyện viên, Bác sĩ Thú y & Nhân viên chăm sóc'}
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
            <NotificationBell role="ADMIN" currentUser={currentUser} />
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
                    {t('adminFilterUsers')} <span className="pill-count">{staffList.length}</span>
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
                    {staffList.length} {lang === 'en' ? 'staff members' : 'nhân sự'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', fontWeight: 500 }}>
                    {lang === 'en' ? 'Delegated across staff functional tiers' : 'Định biên các bộ phận chuyên môn'}
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
                    {horses.length === 0 ? (
                      <div style={{ padding: '16px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px dashed var(--line)', color: 'var(--paper-dim)', fontSize: '12.5px', textAlign: 'center' }}>
                        Hiện chưa có cảnh báo y tế hoặc lịch thi đấu khẩn cấp. Toàn bộ ô chuồng đã sẵn sàng đón chiến mã mới.
                      </div>
                    ) : (
                      horses.slice(0, 3).map((h, idx) => (
                        <div key={h.id || idx} style={{ padding: '12px 14px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)' }}>
                          <div style={{ fontWeight: 600, color: h.locked ? '#EF4444' : 'var(--brass)', fontSize: '13px' }}>
                            {h.locked ? 'Khóa y tế: ' : 'Trạng thái: '}Ngựa {h.name} {h.stable ? `(Ô ${h.stable})` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                            {h.locked ? (h.lockReason || 'Bác sĩ thú y kích hoạt lệnh khóa y tế bảo đảm sức khỏe.') : `Chiến mã đạt thể trạng ${h.statusText || 'ổn định'}, thuộc chủ sở hữu ${h.owner || 'Chủ nuôi'}.`}
                          </div>
                        </div>
                      ))
                    )}
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
                filteredHorses.length === 0 ? (
                  <div style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px dashed var(--line)',
                    color: 'var(--paper-dim)',
                    width: '100%',
                    gridColumn: '1 / -1'
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brass)', fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em' }}>EQUINE</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      {lang === 'en' ? 'No racehorses registered yet' : 'Chưa có chiến mã nào trong hệ thống'}
                    </div>
                    <div style={{ fontSize: '13px', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                      {lang === 'en'
                        ? 'Horses registered by Owners or newly added by Admin will appear here in real-time.'
                        : 'Chiến mã do Chủ sở hữu đăng ký mới hoặc Quản trị viên thêm vào sẽ tự động hiển thị và đồng bộ tại đây.'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddHorseModal(true)}
                      className="portal-view-btn"
                      style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700, margin: '0 auto' }}
                    >
                      {t('adminBtnAddHorse')}
                    </button>
                  </div>
                ) : (
                <div className="portal-cards-grid">
                  {filteredHorses.map((h) => {
                    const badgeClass = h.breed === 'Thoroughbred' ? 'badge-gold' : 'badge-slate';
                    const genderDisplay = h.gender.includes('đực')
                      ? (lang === 'en' ? 'Stallion' : 'Đực')
                      : h.gender.includes('thiến')
                        ? (lang === 'en' ? 'Gelding' : 'Thiến')
                        : (lang === 'en' ? 'Mare' : 'Cái');
                    return (
                      <div key={h.id} className="facility-card" style={{ padding: '16px', overflow: 'hidden' }}>
                        {/* Ảnh chiến mã chính xác do Chủ sở hữu cập nhật */}
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: '180px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          marginBottom: '14px',
                          background: '#161B22',
                          border: '1px solid var(--line)'
                        }}>
                          <img
                            src={h.avatar || h.horse_avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'}
                            alt={h.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px'
                          }}>
                            <span className={`facility-card-badge ${badgeClass}`} style={{ margin: 0, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}>
                              <span>{h.breed.toUpperCase()}</span>
                            </span>
                          </div>
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#F3F4F6',
                            fontFamily: 'monospace',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}>
                            {h.microchip}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h3 className="facility-card-title">{h.name}</h3>
                        <p className="facility-card-desc">{h.desc || `Chiến mã thuần chủng được nuôi dưỡng tại ô ${h.stable}`}</p>
                        
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
                            <span className="spec-val" style={{ fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.ownerName || h.owner || 'Chủ sở hữu'}>
                              {h.ownerName || h.owner || 'Chủ sở hữu'}
                            </span>
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
                )
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
                      {filteredHorses.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--paper-dim)' }}>
                            {lang === 'en' ? 'No racehorses registered yet. Click "Add Horse" to begin.' : 'Chưa có chiến mã nào trong hệ thống. Bấm "Thêm ngựa mới" để bắt đầu.'}
                          </td>
                        </tr>
                      ) : (
                        filteredHorses.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={h.avatar || h.horse_avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=150&q=80'}
                                alt={h.name}
                                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=150&q=80'; }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--brass)', fontSize: '15px' }}>{h.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>{h.microchip}</div>
                              </div>
                            </div>
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
                          <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>{h.ownerName || h.owner || 'Chủ sở hữu'}</td>
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
                      )))
                    }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: STABLES ===================== */}
          {activeTab === 'stables' && (
            <div>
              {/* ========================================================================= */}
              {/* KHỐI QUẢN LÝ: YÊU CẦU PHÊ DUYỆT CẤP & ĐỔI Ô CHUỒNG TỪ CHỦ SỞ HỮU */}
              {/* ========================================================================= */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line-strong)',
                borderRadius: '10px',
                padding: '18px 20px',
                marginBottom: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {lang === 'en' ? 'Stall Allocation & Relocation Requests' : 'Yêu Cầu Phê Duyệt Cấp & Đổi Ô Chuồng'}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                      {lang === 'en'
                        ? 'Review and approve stall allocations. Approving a relocation instantly vacates the prior stall.'
                        : 'Thẩm định và phê duyệt phân bổ ô chuồng. Khi duyệt đổi chuồng, ô cũ sẽ lập tức được giải phóng cho chủ sở hữu khác.'}
                    </div>
                  </div>

                  {/* Pills lọc trạng thái yêu cầu */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setStallReqFilter('PENDING')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: `1px solid ${stallRequests.filter(r => r.status === 'PENDING').length > 0 ? '#F59E0B' : 'var(--line)'}`,
                        background: stallReqFilter === 'PENDING' ? '#F59E0B' : 'rgba(245, 158, 11, 0.1)',
                        color: stallReqFilter === 'PENDING' ? '#14100A' : '#F59E0B',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'en' ? 'Pending' : 'Chờ duyệt'} ({stallRequests.filter(r => r.status === 'PENDING').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStallReqFilter('APPROVED')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: '1px solid var(--line)',
                        background: stallReqFilter === 'APPROVED' ? '#10B981' : 'var(--bg-secondary)',
                        color: stallReqFilter === 'APPROVED' ? '#FFFFFF' : 'var(--paper)',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'en' ? 'Approved' : 'Đã duyệt'} ({stallRequests.filter(r => r.status === 'APPROVED').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStallReqFilter('REJECTED')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: '1px solid var(--line)',
                        background: stallReqFilter === 'REJECTED' ? '#EF4444' : 'var(--bg-secondary)',
                        color: stallReqFilter === 'REJECTED' ? '#FFFFFF' : 'var(--paper)',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'en' ? 'Rejected' : 'Từ chối'} ({stallRequests.filter(r => r.status === 'REJECTED').length})
                    </button>
                  </div>
                </div>

                {/* Danh sách yêu cầu */}
                {(() => {
                  const filteredRequests = stallRequests.filter(r => {
                    if (stallReqFilter === 'PENDING') return r.status === 'PENDING';
                    if (stallReqFilter === 'APPROVED') return r.status === 'APPROVED';
                    if (stallReqFilter === 'REJECTED') return r.status === 'REJECTED';
                    return true;
                  });

                  if (filteredRequests.length === 0) {
                    return (
                      <div style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--paper-dim)',
                        fontSize: '13px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        border: '1px dashed var(--line)'
                      }}>
                        {stallReqFilter === 'PENDING'
                          ? (lang === 'en' ? 'No pending stall requests at this moment.' : 'Hiện tại không có yêu cầu cấp hoặc đổi ô chuồng nào đang chờ phê duyệt.')
                          : (lang === 'en' ? 'No requests match the selected filter.' : 'Không có yêu cầu nào phù hợp với bộ lọc đã chọn.')}
                      </div>
                    );
                  }

                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <th style={{ padding: '8px 12px' }}>Thời Gian</th>
                            <th style={{ padding: '8px 12px' }}>Chủ Sở Hữu</th>
                            <th style={{ padding: '8px 12px' }}>Chiến Mã</th>
                            <th style={{ padding: '8px 12px' }}>Phân Loại</th>
                            <th style={{ padding: '8px 12px' }}>Vị Trí Yêu Cầu</th>
                            <th style={{ padding: '8px 12px' }}>Lý Do</th>
                            <th style={{ padding: '8px 12px' }}>Trạng Thái</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map(req => {
                            const isPending = req.status === 'PENDING';
                            const isApproved = req.status === 'APPROVED';
                            const isChange = req.type === 'CHANGE' || !!req.currentStall;

                            return (
                              <tr key={req.id} style={{ borderBottom: '1px solid var(--line)', background: isPending ? 'rgba(212, 175, 55, 0.04)' : 'transparent' }}>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--paper-dim)' }}>
                                  {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Vừa xong'}
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                  <b style={{ color: 'var(--paper)' }}>{req.ownerName || req.ownerUsername || 'Chủ sở hữu'}</b>
                                  {req.ownerUsername && <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>@{req.ownerUsername}</div>}
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img
                                      src={req.horseAvatar || '/images/default_horse.jpg'}
                                      alt={req.horseName}
                                      style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--line)' }}
                                      onError={(e) => { e.target.src = '/images/default_horse.jpg'; }}
                                    />
                                    <div>
                                      <b style={{ color: 'var(--brass)' }}>{req.horseName}</b>
                                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{req.horseBreed || 'Thoroughbred'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                  {isChange ? (
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      color: '#F59E0B',
                                      border: '1px solid rgba(245, 158, 11, 0.3)'
                                    }}>
                                      Đổi Ô Chuồng
                                    </span>
                                  ) : (
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      background: 'rgba(59, 130, 246, 0.12)',
                                      color: '#3B82F6',
                                      border: '1px solid rgba(59, 130, 246, 0.3)'
                                    }}>
                                      Cấp Chuồng Mới
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                  {isChange ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: 'var(--paper-dim)', textDecoration: 'line-through' }}>
                                        Ô {req.currentStall || '?'}
                                      </span>
                                      <span style={{ color: 'var(--paper-dim)' }}>→</span>
                                      <b style={{ color: 'var(--brass)', fontSize: '13.5px' }}>
                                        Ô {req.requestedStall}
                                      </b>
                                    </div>
                                  ) : (
                                    <b style={{ color: 'var(--brass)', fontSize: '13.5px' }}>
                                      Ô {req.requestedStall}
                                    </b>
                                  )}
                                </td>
                                <td style={{ padding: '10px 12px', maxWidth: '220px', color: 'var(--paper-dim)', fontSize: '12px' }}>
                                  {req.reason || 'Đăng ký vào chuồng'}
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                  {isPending && (
                                    <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                      Chờ Phê Duyệt
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span style={{ color: '#10B981', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                      Đã Phê Duyệt
                                    </span>
                                  )}
                                  {req.status === 'REJECTED' && (
                                    <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }} title={req.rejectReason || ''}>
                                      Đã Từ Chối
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {isPending ? (
                                    <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveStallRequest(req.id)}
                                        style={{
                                          padding: '5px 12px',
                                          background: '#10B981',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.03em',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                        title="Phê duyệt gán chuồng cho ngựa (nhả ô cũ nếu đổi)"
                                      >
                                        Phê Duyệt
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRejectModal(req)}
                                        style={{
                                          padding: '5px 10px',
                                          background: 'rgba(239, 68, 68, 0.15)',
                                          color: '#EF4444',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.03em',
                                          cursor: 'pointer'
                                        }}
                                        title="Từ chối yêu cầu"
                                      >
                                        Từ Chối
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                      {req.approvedBy || req.rejectedBy || 'Đã xử lý'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* 1. THANH ĐIỀU HƯỚNG PHÂN KHU CHUỒNG (TIER TABS: SIÊU GỌN, ĐỘ TƯƠNG PHẢN CAO CHO CẢ SÁNG & TỐI) */}
              <div style={{
                display: 'inline-flex',
                gap: '6px',
                marginBottom: '10px',
                background: isDark ? 'var(--bg-secondary)' : '#EAE4D8',
                padding: '4px',
                borderRadius: '8px',
                border: isDark ? '1px solid var(--line)' : '1px solid #D1C5B4',
                flexWrap: 'wrap',
                maxWidth: '100%',
                boxShadow: isDark ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.06)'
              }}>
                <button
                  type="button"
                  onClick={() => setStableTierTab('ALL')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: stableTierTab === 'ALL'
                      ? (isDark ? '1.5px solid var(--brass)' : '1.5px solid #C2410C')
                      : (isDark ? '1px solid transparent' : '1px solid #CBD5E1'),
                    background: stableTierTab === 'ALL'
                      ? (isDark ? 'var(--bg-card)' : '#FFFFFF')
                      : (isDark ? 'transparent' : '#FFFFFF'),
                    color: stableTierTab === 'ALL'
                      ? (isDark ? 'var(--brass)' : '#9A3412')
                      : (isDark ? 'var(--paper-dim)' : '#334155'),
                    fontWeight: 800,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: stableTierTab === 'ALL' ? (isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)') : 'none'
                  }}
                >
                  <span>{lang === 'en' ? 'All' : 'Tất cả'}</span>
                  <span style={{
                    background: stableTierTab === 'ALL'
                      ? (isDark ? 'var(--brass)' : '#C2410C')
                      : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                    color: stableTierTab === 'ALL' ? '#FFFFFF' : (isDark ? 'var(--paper-dim)' : '#475569'),
                    padding: '1px 5px',
                    borderRadius: '5px',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>{stables.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStableTierTab('VIP')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: stableTierTab === 'VIP'
                      ? (isDark ? '1.5px solid #F59E0B' : '2px solid #B45309')
                      : (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #D97706'),
                    background: stableTierTab === 'VIP'
                      ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7')
                      : (isDark ? 'rgba(245, 158, 11, 0.05)' : '#FFFFFF'),
                    color: isDark
                      ? (stableTierTab === 'VIP' ? '#FBBF24' : '#F59E0B')
                      : '#78350F',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: stableTierTab === 'VIP' ? (isDark ? 'none' : '0 1px 3px rgba(180,83,9,0.2)') : 'none'
                  }}
                >
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    background: isDark ? '#F59E0B' : '#B45309',
                    color: '#FFFFFF',
                    borderRadius: '3px'
                  }}>VIP</span>
                  <span>{lang === 'en' ? 'VIP Stalls' : 'Chuồng VIP'}</span>
                  <span style={{
                    background: isDark ? '#F59E0B' : '#B45309',
                    color: '#FFFFFF',
                    padding: '1px 5px',
                    borderRadius: '5px',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>{vipStablesTotal}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStableTierTab('STANDARD')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: stableTierTab === 'STANDARD'
                      ? (isDark ? '1.5px solid #3B82F6' : '2px solid #1D4ED8')
                      : (isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #3B82F6'),
                    background: stableTierTab === 'STANDARD'
                      ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE')
                      : (isDark ? 'rgba(59, 130, 246, 0.05)' : '#FFFFFF'),
                    color: isDark
                      ? (stableTierTab === 'STANDARD' ? '#93C5FD' : '#60A5FA')
                      : '#1E3A8A',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: stableTierTab === 'STANDARD' ? (isDark ? 'none' : '0 1px 3px rgba(29,78,216,0.2)') : 'none'
                  }}
                >
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    background: isDark ? '#3B82F6' : '#1D4ED8',
                    color: '#FFFFFF',
                    borderRadius: '3px'
                  }}>TIÊU CHUẨN</span>
                  <span>{lang === 'en' ? 'Standard Stalls' : 'Chuồng Tiêu Chuẩn'}</span>
                  <span style={{
                    background: isDark ? '#3B82F6' : '#1D4ED8',
                    color: '#FFFFFF',
                    padding: '1px 5px',
                    borderRadius: '5px',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>{stdStablesTotal}</span>
                </button>
              </div>

              {/* 2. THANH LỌC TRẠNG THÁI & CÔNG CỤ XEM */}
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${stableFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStableFilter('ALL')}
                  >
                    {lang === 'en' ? 'All Stalls' : 'Tất cả'} <span className="pill-count">{filteredStables.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${stableFilter === 'AVAILABLE' ? 'active' : ''}`}
                    onClick={() => setStableFilter('AVAILABLE')}
                  >
                    {lang === 'en' ? 'Available' : 'Còn trống'} <span className="pill-count">{filteredStables.filter(s => s.status === 'AVAILABLE').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${stableFilter === 'OCCUPIED' ? 'active' : ''}`}
                    onClick={() => setStableFilter('OCCUPIED')}
                  >
                    {lang === 'en' ? 'Occupied' : 'Đã lấp đầy'} <span className="pill-count">{filteredStables.filter(s => s.status === 'OCCUPIED').length}</span>
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
                    onClick={() => {
                      const nextCode = 'C' + (stables.filter(s => s.block === 'Block C').length + 1);
                      setNewStallData({
                        stall_code: nextCode,
                        block: 'Block C',
                        tier: 'STANDARD',
                        status: 'AVAILABLE',
                        area: '16 m²',
                        dim: '4.0 x 4.0m',
                        horse: '',
                        breed: 'Thoroughbred',
                        stall_image: ''
                      });
                      setShowAddStallModal(true);
                    }}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {lang === 'en' ? '+ Add New Stall' : '+ Tạo ô chuồng mới'}
                  </button>
                </div>
              </div>

              {/* 3. HIỂN THỊ DANH SÁCH Ô CHUỒNG TÁCH BIỆT CHỖ RIÊNG CHO VIP VÀ TIÊU CHUẨN */}
              {(() => {
                const vipStallsList = filteredStables.filter(s => isVipStall(s));
                const stdStallsList = filteredStables.filter(s => !isVipStall(s));

                const renderStallCard = (s) => {
                  const isOccupied = s.status === 'OCCUPIED';
                  const isAvailable = s.status === 'AVAILABLE';
                  const isVip = isVipStall(s);
                  const badgeClass = isOccupied ? 'badge-gold' : 'badge-slate';

                  return (
                    <div key={s.stall_code} className="facility-card" style={{ padding: '16px', overflow: 'hidden' }}>
                      {/* Ảnh ô chuồng (3D Simulation hoặc ảnh do Admin tải lên) */}
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '175px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '14px',
                        background: '#161B22',
                        border: '1px solid var(--line)'
                      }}>
                        <img
                          src={s.stall_image || (isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg')}
                          alt={`Ô Chuồng ${s.stall_code}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.src = isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg';
                          }}
                        />

                        {/* PHẦN GHI LÊN TRÊN: Badge Phân Hạng VIP / Tiêu Chuẩn & Block */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          alignItems: 'flex-start'
                        }}>
                          {isVip ? (
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(180, 83, 9, 0.95))',
                              color: '#1A0E02',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              letterSpacing: '0.04em',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                              border: '1px solid rgba(251, 191, 36, 0.6)'
                            }}>
                              {lang === 'en' ? 'VIP EQUINE STALL' : 'CHUỒNG VIP (PREMIUM)'}
                            </span>
                          ) : (
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(30, 64, 175, 0.95))',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              letterSpacing: '0.04em',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                              border: '1px solid rgba(147, 197, 253, 0.6)'
                            }}>
                              {lang === 'en' ? 'STANDARD (FREE TIER)' : 'CHUỒNG TIÊU CHUẨN (GÓI CƠ BẢN)'}
                            </span>
                          )}

                          <span className={`facility-card-badge ${badgeClass}`} style={{ margin: 0, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)', fontSize: '10px' }}>
                            <span>{s.block.toUpperCase()}</span>
                          </span>
                        </div>

                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          display: 'flex',
                          gap: '6px'
                        }}>
                          <label
                            style={{
                              cursor: 'pointer',
                              background: 'rgba(0,0,0,0.75)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: 'var(--brass)',
                              border: '1px solid rgba(212,175,55,0.4)',
                              backdropFilter: 'blur(8px)',
                              display: 'flex',
                              alignItems: 'center',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              transition: 'all 0.15s ease'
                            }}
                            title="Cập nhật ảnh ô chuồng"
                          >
                            <span>{lang === 'en' ? 'Edit photo' : 'Đổi ảnh'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleUploadStallImage(s.stall_code, e)}
                            />
                          </label>
                          <span style={{
                            background: 'rgba(0,0,0,0.7)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#F3F4F6',
                            fontWeight: 700,
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}>
                            {s.stall_code}
                          </span>
                        </div>

                        {/* Nếu ô chuồng đang nuôi dưỡng ngựa hoặc đang bảo trì có ngựa cố định, hiển thị thumbnail nhỏ của chiến mã ở góc dưới */}
                        {(isOccupied || (s.status === 'MAINTENANCE' && s.horse && s.horse !== '(Trống)')) && (
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(10, 13, 20, 0.85)',
                            padding: '3px 10px 3px 4px',
                            borderRadius: '20px',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(212,175,55,0.3)'
                          }}>
                            {s.horse_avatar ? (
                              <img
                                src={s.horse_avatar}
                                alt={s.horse}
                                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'var(--brass)',
                                color: '#14100A',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                fontSize: '10px',
                                fontWeight: 800
                              }}>
                                {s.horse.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span style={{ fontSize: '11.5px', color: 'var(--brass)', fontWeight: 700 }}>{s.horse}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h3 className="facility-card-title" style={{ margin: 0 }}>
                          {lang === 'en' ? `Barn Stall ${s.stall_code}` : `Ô Chuồng ${s.stall_code}`}
                        </h3>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isVip
                            ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7')
                            : (isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE'),
                          color: isVip
                            ? (isDark ? '#FBBF24' : '#78350F')
                            : (isDark ? '#93C5FD' : '#1E3A8A'),
                          border: isVip
                            ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #D97706')
                            : (isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #2563EB')
                        }}>
                          {isVip ? (lang === 'en' ? 'VIP Equine' : 'Hạng VIP') : (lang === 'en' ? 'Standard' : 'Tiêu Chuẩn')}
                        </span>
                      </div>

                      <p className="facility-card-desc">
                        {isOccupied
                          ? (s.is_temp_stall
                              ? (lang === 'en'
                                  ? `Temporarily housing racehorse ${s.horse} while stall ${s.temp_for_stall} is maintained.`
                                  : `Đang tiếp nhận lưu trú tạm thời cho chiến mã ${s.horse} trong thời gian ô ${s.temp_for_stall} bảo dưỡng 30 phút.`)
                              : (lang === 'en' ? `Housing racehorse ${s.horse}. Premium equine amenities.` : `Đang nuôi dưỡng chiến mã ${s.horse}. Chuẩn tiện nghi cao cấp.`))
                          : isAvailable
                            ? (lang === 'en' ? 'Clean empty stall ready for horse intake.' : 'Ô chuồng trống sạch sẽ, sẵn sàng phân bổ.')
                            : (lang === 'en'
                                ? `Under 30-minute maintenance. Horse ${s.horse} temporarily housed in Stall ${s.temp_relocated_to || 'temp'}.`
                                : `Đang bảo dưỡng định kỳ (30 phút). Chiến mã ${s.horse} tạm trú tại Ô ${s.temp_relocated_to || 'tạm'}.`)}
                      </p>

                      <div className="facility-card-bullets">
                        <div className="facility-bullet-item">
                          <span className="bullet-dot" />
                          <span>
                            {lang === 'en' ? 'Resident horse:' : 'Chiến mã lưu trú:'}{' '}
                            <b style={{ color: (isOccupied || !isAvailable) && s.horse !== '(Trống)' ? 'var(--brass)' : 'var(--paper-dim)' }}>
                              {s.horse && s.horse !== '(Trống)' ? s.horse : '(Trống)'}
                            </b>
                            {s.temp_relocated_to && (
                              <span style={{ fontSize: '11px', color: '#E86B2C', marginLeft: '6px', fontWeight: 600 }}>
                                (Tạm trú tại Ô {s.temp_relocated_to})
                              </span>
                            )}
                            {s.is_temp_stall && s.temp_for_stall && (
                              <span style={{ fontSize: '11px', color: '#3B82F6', marginLeft: '6px', fontWeight: 600 }}>
                                (Lưu trú tạm từ Ô {s.temp_for_stall})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="facility-bullet-item">
                          <span className="bullet-dot" />
                          <span>{lang === 'en' ? 'Barn block:' : 'Khu chuồng:'} <b>{s.block}</b></span>
                        </div>
                      </div>

                      {/* ĐỔI CHỮ "TIÊU CHUẨN" THÀNH "PHÂN HẠNG" */}
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
                          <span className="spec-label" style={{ color: 'var(--brass)', fontWeight: 700 }}>
                            {lang === 'en' ? 'Classification' : 'Phân hạng'}
                          </span>
                          <span
                            className="spec-val"
                            title={isVip ? 'VIP' : (lang === 'en' ? 'Standard' : 'Tiêu chuẩn')}
                            style={{
                              color: isVip
                                ? (isDark ? '#FBBF24' : '#78350F')
                                : (isDark ? '#93C5FD' : '#1E3A8A'),
                              fontWeight: 800
                            }}
                          >
                            {isVip ? 'VIP' : (lang === 'en' ? 'Standard' : 'Tiêu chuẩn')}
                          </span>
                        </div>
                      </div>

                      <div className="facility-price-box">
                        <div>
                          <div className="price-label">{lang === 'en' ? 'Stall Status' : 'Trạng thái ô'}</div>
                          <div
                            className="price-value"
                            style={{
                              fontSize: '14.5px',
                              color: isOccupied ? (s.is_temp_stall ? '#3B82F6' : 'var(--brass)') : isAvailable ? '#10B981' : '#E86B2C'
                            }}
                          >
                            {isOccupied
                              ? (s.is_temp_stall
                                  ? (lang === 'en' ? 'Temporary Housing' : 'Lưu trú tạm thời')
                                  : (lang === 'en' ? 'Currently Occupied' : 'Đang nuôi dưỡng'))
                              : isAvailable
                                ? (lang === 'en' ? 'Available & Ready' : 'Còn trống sẵn sàng')
                                : (lang === 'en' ? 'Under Maintenance (30m)' : 'Bảo dưỡng định kỳ (30p)')}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isOccupied
                            ? (s.is_temp_stall ? 'rgba(59, 130, 246, 0.15)' : 'rgba(212, 175, 55, 0.12)')
                            : isAvailable
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(232, 107, 44, 0.15)',
                          color: isOccupied
                            ? (s.is_temp_stall ? '#3B82F6' : 'var(--brass)')
                            : isAvailable
                              ? '#10B981'
                              : '#E86B2C',
                          border: isOccupied
                            ? (s.is_temp_stall ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(212, 175, 55, 0.3)')
                            : isAvailable
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(232, 107, 44, 0.4)'
                        }}>
                          {isOccupied
                            ? (s.is_temp_stall ? (lang === 'en' ? 'TEMP STALL' : 'CHUỒNG TẠM') : (lang === 'en' ? 'OCCUPIED' : 'LẤP ĐẦY'))
                            : isAvailable
                              ? (lang === 'en' ? 'VACANT' : 'TRỐNG')
                              : (lang === 'en' ? 'MAINTENANCE (30M)' : 'BẢO TRÌ (30P)')}
                        </span>
                      </div>

                      {/* Đồng hồ đếm ngược thời gian thực cho bảo dưỡng và chuồng tạm */}
                      {s.maintenance_end && (
                        <div style={{
                          marginTop: '8px',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          background: s.status === 'MAINTENANCE' ? 'rgba(232, 107, 44, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          border: s.status === 'MAINTENANCE' ? '1px solid rgba(232, 107, 44, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: s.status === 'MAINTENANCE' ? '#E86B2C' : '#60A5FA',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <span>⏱</span>
                            {s.status === 'MAINTENANCE'
                              ? (lang === 'en' ? 'Maintenance time left:' : 'Thời gian bảo dưỡng còn lại:')
                              : (lang === 'en' ? `Auto-return to Stall ${s.temp_for_stall} in:` : `Tự động về ô ${s.temp_for_stall} sau:`)}
                          </span>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: s.status === 'MAINTENANCE' ? '#FFA500' : '#93C5FD'
                          }}>
                            {formatRemainingTime(s.maintenance_end, currentClock)}
                          </span>
                        </div>
                      )}

                      <div className="facility-card-actions">
                        <div className="actions-left" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="facility-btn-action"
                            onClick={() => handleToggleStable(s.stall_code)}
                          >
                            {lang === 'en' ? 'Toggle Status' : 'Đổi trạng thái'}
                          </button>
                          <button
                            className="facility-btn-action"
                            onClick={() => handleOpenChangeHorse(s)}
                            style={{ borderColor: 'rgba(212,175,55,0.4)', color: 'var(--brass)' }}
                          >
                            {isOccupied ? 'Đổi ngựa' : 'Gán ngựa'}
                          </button>
                          <label
                            className="facility-btn-action"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Admin: Cập nhật hình ảnh chuồng"
                          >
                            <span>{lang === 'en' ? 'Upload photo' : 'Cập nhật ảnh'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleUploadStallImage(s.stall_code, e)}
                            />
                          </label>
                        </div>
                        <span className="facility-link-action" style={{ cursor: 'default' }}>
                          {s.block} →
                        </span>
                      </div>
                    </div>
                  );
                };

                const renderTableRows = (list) => {
                  return list.map(s => {
                    const isOccupied = s.status === 'OCCUPIED';
                    const isAvailable = s.status === 'AVAILABLE';
                    const isVip = isVipStall(s);
                    return (
                      <tr key={s.stall_code} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--paper)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={s.stall_image || (isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg')}
                              alt={s.stall_code}
                              style={{ width: '48px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                              onError={(e) => { e.target.src = isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg'; }}
                            />
                            <div>
                              <div>{lang === 'en' ? 'Stall ' : 'Ô '}{s.stall_code}</div>
                              <label style={{ fontSize: '11px', color: 'var(--brass)', cursor: 'pointer', display: 'inline-block', marginTop: '2px', fontWeight: 600 }}>
                                <span>{lang === 'en' ? 'Edit photo' : 'Đổi ảnh'}</span>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadStallImage(s.stall_code, e)} />
                              </label>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{s.block}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isVip
                              ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7')
                              : (isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE'),
                            color: isVip
                              ? (isDark ? '#FBBF24' : '#78350F')
                              : (isDark ? '#93C5FD' : '#1E3A8A'),
                            border: isVip
                              ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #D97706')
                              : (isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #2563EB')
                          }}>
                            {isVip ? 'VIP' : (lang === 'en' ? 'Standard' : 'Tiêu Chuẩn')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: (isOccupied || !isAvailable) && s.horse !== '(Trống)' ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {(isOccupied || !isAvailable) && s.horse_avatar && (
                              <img
                                src={s.horse_avatar}
                                alt={s.horse}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div>{s.horse && s.horse !== '(Trống)' ? s.horse : '(Trống)'}</div>
                              {s.temp_relocated_to && (
                                <div style={{ fontSize: '11px', color: '#E86B2C', fontWeight: 600 }}>
                                  Tạm trú tại Ô {s.temp_relocated_to} ({formatRemainingTime(s.maintenance_end, currentClock)})
                                </div>
                              )}
                              {s.is_temp_stall && s.temp_for_stall && (
                                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>
                                  Chuyển tạm từ Ô {s.temp_for_stall} ({formatRemainingTime(s.maintenance_end, currentClock)})
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: isOccupied
                              ? (s.is_temp_stall ? 'rgba(59, 130, 246, 0.15)' : 'rgba(212, 175, 55, 0.12)')
                              : isAvailable
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(232, 107, 44, 0.15)',
                            color: isOccupied
                              ? (s.is_temp_stall ? '#3B82F6' : 'var(--brass)')
                              : isAvailable
                                ? '#10B981'
                                : '#E86B2C',
                            border: isOccupied
                              ? (s.is_temp_stall ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(212, 175, 55, 0.3)')
                              : isAvailable
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : '1px solid rgba(232, 107, 44, 0.4)'
                          }}>
                            {isOccupied
                              ? (s.is_temp_stall ? (lang === 'en' ? 'TEMP STALL' : 'CHUỒNG TẠM') : (lang === 'en' ? 'Occupied' : 'Đang nuôi dưỡng'))
                              : isAvailable
                                ? (lang === 'en' ? 'Available' : 'Còn trống')
                                : (lang === 'en' ? 'Maintenance (30m)' : 'Bảo dưỡng (30p)')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleToggleStable(s.stall_code)}
                              style={{
                                padding: '5px 10px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--line)',
                                borderRadius: '4px',
                                color: 'var(--paper)',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              {lang === 'en' ? 'Toggle' : 'Đổi trạng thái'}
                            </button>
                            <button
                              onClick={() => handleOpenChangeHorse(s)}
                              style={{
                                padding: '5px 10px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid rgba(212,175,55,0.4)',
                                borderRadius: '4px',
                                color: 'var(--brass)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              {isOccupied ? 'Đổi ngựa' : 'Gán ngựa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                };

                if (viewMode === 'cards') {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* KHU VỰC 1: CHUỒNG VIP (DÀNH CHO HỘI VIÊN VIP) */}
                      {(stableTierTab === 'ALL' || stableTierTab === 'VIP') && (
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '9px 15px',
                            background: isDark
                              ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.14) 0%, rgba(20, 24, 33, 0.8) 100%)'
                              : 'linear-gradient(90deg, #FEF3C7 0%, #FFFFFF 100%)',
                            border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #FCD34D',
                            borderLeft: isDark ? '4px solid #F59E0B' : '4px solid #B45309',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, background: isDark ? '#F59E0B' : '#B45309', color: '#FFFFFF', padding: '1px 5px', borderRadius: '3px' }}>VIP</span>
                                <h3 style={{ margin: 0, fontSize: '14.5px', color: isDark ? '#FBBF24' : '#78350F', fontWeight: 800 }}>
                                  {lang === 'en' ? 'VIP EQUINE STALLS ZONE (RESERVED FOR VIP)' : 'KHU VỰC CHUỒNG VIP (DÀNH CHO HỘI VIÊN VIP)'}
                                </h3>
                              </div>
                              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                                {lang === 'en'
                                  ? 'Premium stalls 16 - 18 m² with specialized amenities, allocated exclusively for VIP tier equine members.'
                                  : 'Hệ thống ô chuồng tiện nghi cao cấp 16 - 18 m², kiểm soát vi khí hậu dành riêng cho chủ sở hữu gói VIP.'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '11.5px',
                                padding: '3px 8px',
                                borderRadius: '14px',
                                background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                color: isDark ? '#FBBF24' : '#78350F',
                                border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #F59E0B',
                                fontWeight: 700
                              }}>
                                {vipStallsList.length} {lang === 'en' ? 'Stalls' : 'ô chuồng'}
                              </span>
                            </div>
                          </div>

                          {vipStallsList.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--paper-dim)', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}>
                              {lang === 'en' ? 'No VIP stalls match the current status filter.' : 'Không có ô chuồng VIP nào khớp với bộ lọc trạng thái hiện tại.'}
                            </div>
                          ) : (
                            <div className="portal-cards-grid">
                              {vipStallsList.map(s => renderStallCard(s))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* KHU VỰC 2: CHUỒNG TIÊU CHUẨN (DÀNH CHO NGƯỜI KHÔNG MUA VIP / GÓI CƠ BẢN) */}
                      {(stableTierTab === 'ALL' || stableTierTab === 'STANDARD') && (
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '9px 15px',
                            background: isDark
                              ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.14) 0%, rgba(20, 24, 33, 0.8) 100%)'
                              : 'linear-gradient(90deg, #DBEAFE 0%, #FFFFFF 100%)',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #93C5FD',
                            borderLeft: isDark ? '4px solid #3B82F6' : '4px solid #1D4ED8',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, background: isDark ? '#3B82F6' : '#1D4ED8', color: '#FFFFFF', padding: '1px 5px', borderRadius: '3px' }}>TIÊU CHUẨN</span>
                                <h3 style={{ margin: 0, fontSize: '14.5px', color: isDark ? '#93C5FD' : '#1E3A8A', fontWeight: 800 }}>
                                  {lang === 'en' ? 'STANDARD STALLS ZONE (FOR BASIC / NON-VIP OWNERS)' : 'KHU VỰC CHUỒNG TIÊU CHUẨN (DÀNH CHO NGƯỜI KHÔNG MUA VIP)'}
                                </h3>
                              </div>
                              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                                {lang === 'en'
                                  ? 'Standard facility stalls 14 m² allocated for basic free-tier horse owners who have not subscribed to VIP.'
                                  : 'Hệ thống ô chuồng tiêu chuẩn 14 m² sạch sẽ, sẵn sàng phân bổ cho chủ sở hữu ngựa gói cơ bản chưa mua VIP.'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '11.5px',
                                padding: '3px 8px',
                                borderRadius: '14px',
                                background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
                                color: isDark ? '#93C5FD' : '#1E3A8A',
                                border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #3B82F6',
                                fontWeight: 700
                              }}>
                                {stdStallsList.length} {lang === 'en' ? 'Stalls' : 'ô chuồng'}
                              </span>
                            </div>
                          </div>

                          {stdStallsList.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--paper-dim)', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}>
                              {lang === 'en' ? 'No standard stalls match the current status filter.' : 'Không có ô chuồng tiêu chuẩn nào khớp với bộ lọc trạng thái hiện tại.'}
                            </div>
                          ) : (
                            <div className="portal-cards-grid">
                              {stdStallsList.map(s => renderStallCard(s))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {(stableTierTab === 'ALL' || stableTierTab === 'VIP') && (
                      <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                        <div style={{
                          padding: '12px 18px',
                          background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                          borderBottom: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FCD34D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontWeight: 800, color: isDark ? '#FBBF24' : '#78350F', fontSize: '14px' }}>
                            {lang === 'en' ? 'VIP EQUINE STALLS' : 'BẢNG DANH SÁCH: KHU CHUỒNG VIP (DÀNH CHO VIP)'}
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? '#FBBF24' : '#78350F', fontWeight: 700 }}>{vipStallsList.length} ô chuồng</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Code' : 'Mã Ô Chuồng'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Barn Block' : 'Khu Vực'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Classification' : 'Phân Hạng'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Resident Runner' : 'Chiến Mã Đang Ở'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Status' : 'Trạng Thái'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Action' : 'Thao Tác'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {renderTableRows(vipStallsList)}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(stableTierTab === 'ALL' || stableTierTab === 'STANDARD') && (
                      <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                        <div style={{
                          padding: '12px 18px',
                          background: isDark ? 'rgba(59, 130, 246, 0.12)' : '#DBEAFE',
                          borderBottom: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #BFDBFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontWeight: 800, color: isDark ? '#93C5FD' : '#1E3A8A', fontSize: '14px' }}>
                            {lang === 'en' ? 'STANDARD STALLS' : 'BẢNG DANH SÁCH: KHU CHUỒNG TIÊU CHUẨN (KHÔNG MUA VIP)'}
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? '#93C5FD' : '#1E3A8A', fontWeight: 700 }}>{stdStallsList.length} ô chuồng</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Code' : 'Mã Ô Chuồng'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Barn Block' : 'Khu Vực'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Classification' : 'Phân Hạng'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Resident Runner' : 'Chiến Mã Đang Ở'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Status' : 'Trạng Thái'}</th>
                              <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Action' : 'Thao Tác'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {renderTableRows(stdStallsList)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===================== TAB 4: USERS & RBAC ===================== */}

          {/* ===================== TAB 4: USERS & RBAC ===================== */}
          {activeTab === 'users' && (
            <div>
              {/* Cảnh báo tài khoản nhân sự mới chờ Admin xét duyệt */}
              {staffList.some(u => u.status === 'PENDING') && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'rgba(232, 107, 44, 0.12)',
                  border: '1.5px solid rgba(232, 107, 44, 0.5)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(232, 107, 44, 0.15)',
                      color: '#E86B2C',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}>!</span>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#E86B2C', letterSpacing: '0.02em' }}>
                        {lang === 'en' 
                          ? `${staffList.filter(u => u.status === 'PENDING').length} new staff applications awaiting your approval`
                          : `Có ${staffList.filter(u => u.status === 'PENDING').length} yêu cầu đăng ký tài khoản nhân sự mới đang chờ bạn xét duyệt`}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginTop: '3px', lineHeight: 1.5 }}>
                        {lang === 'en'
                          ? 'Once approved by Admin, new staff accounts begin with fresh zero data, reflecting actual clinical reports in real time.'
                          : 'Tài khoản nhân sự mới sau khi được phê duyệt sẽ được phân quyền và bắt đầu làm việc theo chuyên môn.'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserFilter('PENDING')}
                    style={{
                      padding: '9px 18px',
                      background: '#E86B2C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(232, 107, 44, 0.35)'
                    }}
                  >
                    {lang === 'en' ? 'Review & Approve →' : 'Xem danh sách chờ duyệt →'}
                  </button>
                </div>
              )}

              {/* Top Filter Bar */}
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${userFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setUserFilter('ALL')}
                  >
                    {lang === 'en' ? 'All Staff' : 'Tất cả nhân sự'} <span className="pill-count">{staffList.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setUserFilter('PENDING')}
                    style={staffList.some(u => u.status === 'PENDING') ? {
                      borderColor: '#E86B2C',
                      color: userFilter === 'PENDING' ? '#fff' : '#E86B2C',
                      background: userFilter === 'PENDING' ? '#E86B2C' : 'rgba(232, 107, 44, 0.12)',
                      fontWeight: 700
                    } : {}}
                  >
                    {lang === 'en' ? 'Pending Approval' : 'Chờ Phê Duyệt'} <span className="pill-count" style={{ background: '#E86B2C', color: '#fff' }}>{staffList.filter(u => u.status === 'PENDING').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'TRAINER' ? 'active' : ''}`}
                    onClick={() => setUserFilter('TRAINER')}
                  >
                    {lang === 'en' ? 'Trainers' : 'Huấn Luyện Viên'} <span className="pill-count">{staffList.filter(u => u.role === 'TRAINER').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'VET' ? 'active' : ''}`}
                    onClick={() => setUserFilter('VET')}
                  >
                    {lang === 'en' ? 'Veterinarians' : 'Bác Sĩ Thú Y'} <span className="pill-count">{staffList.filter(u => u.role === 'VET').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${userFilter === 'GROOM' ? 'active' : ''}`}
                    onClick={() => setUserFilter('GROOM')}
                  >
                    {lang === 'en' ? 'Stable Grooms' : 'Chăm Sóc Groom'} <span className="pill-count">{staffList.filter(u => u.role === 'GROOM').length}</span>
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
                          {lang === 'en' ? 'Account:' : 'Tài khoản:'} <b style={{ color: 'var(--paper)' }}>@{u.username}</b>
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
                              {u.status === 'PENDING' ? (lang === 'en' ? 'Pending Approval' : 'Chờ phê duyệt') : u.status === 'ACTIVE' ? (lang === 'en' ? 'Active' : 'Hoạt động') : (lang === 'en' ? 'Suspended' : 'Tạm khóa')}
                            </span>
                          </div>
                        </div>

                        <div className="facility-price-box">
                          <div>
                            <div className="price-label">{lang === 'en' ? 'Access Status' : 'Trạng thái tài khoản'}</div>
                            <div className="price-value" style={{ fontSize: '14.5px', color: 'var(--paper)' }}>
                              {u.status === 'PENDING' ? (lang === 'en' ? 'Pending Approval' : 'Chờ Admin duyệt') : u.status === 'ACTIVE' ? (lang === 'en' ? 'Active Account' : 'Đang hoạt động') : (lang === 'en' ? 'Access Suspended' : 'Tạm khóa truy cập')}
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
                          <div className="actions-left" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {u.status === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveUser(u)}
                                  style={{
                                    padding: '6px 14px',
                                    background: '#E86B2C',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                  title="Phê duyệt kích hoạt tài khoản này"
                                >
                                  {lang === 'en' ? 'Approve' : 'Phê duyệt'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectUser(u)}
                                  style={{
                                    padding: '6px 10px',
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    borderRadius: '5px',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                  title="Từ chối yêu cầu đăng ký"
                                >
                                  {lang === 'en' ? 'Reject' : 'Từ chối'}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="facility-btn-action"
                                  onClick={() => handleOpenEditUser(u)}
                                >
                                  {lang === 'en' ? 'Edit' : 'Sửa'}
                                </button>
                                {u.username !== 'admin' && (
                                  <>
                                    <button
                                      type="button"
                                      className={`facility-btn-action ${u.status === 'ACTIVE' ? 'btn-danger' : ''}`}
                                      style={u.status !== 'ACTIVE' ? {
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        border: '1px solid rgba(16, 185, 129, 0.45)',
                                        color: '#10B981',
                                        fontWeight: 700
                                      } : {}}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleUserStatus(u);
                                      }}
                                    >
                                      {u.status === 'ACTIVE' ? (lang === 'en' ? 'Lock' : 'Khóa') : (lang === 'en' ? 'Unlock' : 'Mở')}
                                    </button>
                                    <button
                                      className="facility-btn-action"
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        color: '#EF4444',
                                        fontWeight: 600
                                      }}
                                      onClick={() => handleOpenDeleteUser(u)}
                                      title={lang === 'en' ? 'Delete this staff member' : 'Xóa nhân sự này'}
                                    >
                                      {lang === 'en' ? 'Delete' : 'Xóa'}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          <button className="facility-link-action"
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
                                {u.status === 'PENDING' ? (lang === 'en' ? 'Pending Approval' : 'Chờ phê duyệt') : u.status === 'ACTIVE' ? (lang === 'en' ? 'Active' : 'Hoạt động') : (lang === 'en' ? 'Suspended' : 'Tạm khóa')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {u.status === 'PENDING' ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveUser(u)}
                                      style={{
                                        padding: '5px 12px',
                                        background: '#E86B2C',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                      title="Phê duyệt kích hoạt tài khoản"
                                    >
                                      {lang === 'en' ? 'Approve' : 'Phê duyệt'}
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(u)}
                                      style={{
                                        padding: '5px 10px',
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        color: '#EF4444',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                      title="Từ chối duyệt"
                                    >
                                      {lang === 'en' ? 'Reject' : 'Từ chối'}
                                    </button>
                                  </>
                                ) : (
                                  <>
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
                                      <>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleUserStatus(u);
                                          }}
                                          style={{
                                            padding: '5px 12px',
                                            background: u.status === 'ACTIVE' ? 'var(--bg-secondary)' : 'rgba(16, 185, 129, 0.15)',
                                            border: u.status === 'ACTIVE' ? '1px solid var(--line)' : '1px solid rgba(16, 185, 129, 0.45)',
                                            color: u.status === 'ACTIVE' ? 'var(--paper-dim)' : '#10B981',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: u.status === 'ACTIVE' ? 500 : 700,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {u.status === 'ACTIVE' ? (lang === 'en' ? 'Suspend' : 'Khóa') : (lang === 'en' ? 'Reactivate' : 'Mở')}
                                        </button>
                                        <button
                                          onClick={() => handleOpenDeleteUser(u)}
                                          style={{
                                            padding: '5px 12px',
                                            background: 'rgba(239, 68, 68, 0.12)',
                                            border: '1px solid rgba(239, 68, 68, 0.35)',
                                            color: '#EF4444',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                          title={lang === 'en' ? 'Permanently delete this staff' : 'Xóa nhân sự này'}
                                        >
                                          {lang === 'en' ? 'Delete' : 'Xóa'}
                                        </button>
                                      </>
                                    )}
                                  </>
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

          {/* ===================== TAB 6: KHIẾU NẠI & BÁO CÁO NHÂN SỰ ===================== */}
          {activeTab === 'reports' && (
            <div>
              {/* THỐNG KÊ TỔNG QUAN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                <div className="facility-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    TỔNG SỐ KHIẾU NẠI
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px' }}>
                    {personnelReports.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Từ các Chủ sở hữu gửi lên
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px', border: '1px solid #F59E0B', background: 'rgba(245, 158, 11, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                    CHỜ ADMIN TIẾP NHẬN
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B', margin: '6px 0 2px' }}>
                    {personnelReports.filter(r => r.status === 'PENDING').length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Cần xác minh & mở thẩm tra
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px', border: '1px solid #3B82F6', background: 'rgba(59, 130, 246, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase' }}>
                    ĐANG THẨM TRA & GIẢI TRÌNH
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#3B82F6', margin: '6px 0 2px' }}>
                    {personnelReports.filter(r => r.status === 'INVESTIGATING').length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Yêu cầu nhân sự báo cáo giải trình
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                    ĐÃ GIẢI QUYẾT & KỶ LUẬT
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981', margin: '6px 0 2px' }}>
                    {personnelReports.filter(r => r.status === 'RESOLVED').length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Đã có kết luận & phản hồi cho Chủ
                  </div>
                </div>
              </div>

              {/* BỘ LỌC VÀ TÌM KIẾM */}
              <div className="portal-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div className="portal-filter-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    type="button"
                    className={`portal-pill-btn ${reportRoleFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setReportRoleFilter('ALL')}
                  >
                    Tất cả <span className="pill-count">{personnelReports.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`portal-pill-btn ${reportRoleFilter === 'TRAINER' ? 'active' : ''}`}
                    onClick={() => setReportRoleFilter('TRAINER')}
                  >
                    HLV <span className="pill-count">{personnelReports.filter(r => r.targetRole === 'TRAINER').length}</span>
                  </button>
                  <button
                    type="button"
                    className={`portal-pill-btn ${reportRoleFilter === 'VET' ? 'active' : ''}`}
                    onClick={() => setReportRoleFilter('VET')}
                  >
                    Thú Y <span className="pill-count">{personnelReports.filter(r => r.targetRole === 'VET').length}</span>
                  </button>
                  <button
                    type="button"
                    className={`portal-pill-btn ${reportRoleFilter === 'CARETAKER' ? 'active' : ''}`}
                    onClick={() => setReportRoleFilter('CARETAKER')}
                  >
                    Chăm Sóc <span className="pill-count">{personnelReports.filter(r => r.targetRole === 'CARETAKER').length}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="portal-input"
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    style={{ padding: '7px 10px', fontSize: '12px', minWidth: '170px' }}
                  >
                    <option value="ALL">Tất cả trạng thái ({personnelReports.length})</option>
                    <option value="PENDING">Chờ Admin tiếp nhận</option>
                    <option value="INVESTIGATING">Đang thẩm tra</option>
                    <option value="RESOLVED">Đã giải quyết</option>
                    <option value="DISMISSED">Bác bỏ</option>
                  </select>

                  <input
                    type="text"
                    className="portal-input"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Tìm theo chủ, nhân sự, ngựa, tiêu đề..."
                    style={{ padding: '7px 12px', fontSize: '12.5px', minWidth: '220px' }}
                  />
                </div>
              </div>

              {/* BẢNG DANH SÁCH BÁO CÁO KHIẾU NẠI */}
              {(() => {
                const filteredReports = personnelReports.filter(report => {
                  if (reportRoleFilter !== 'ALL' && report.targetRole !== reportRoleFilter) return false;
                  if (reportStatusFilter !== 'ALL' && report.status !== reportStatusFilter) return false;
                  if (reportSearch.trim()) {
                    const q = reportSearch.toLowerCase().trim();
                    const text = `${report.ownerName} ${report.targetName} ${report.targetTitle} ${report.horseName} ${report.title} ${report.content}`.toLowerCase();
                    if (!text.includes(q)) return false;
                  }
                  return true;
                });

                if (filteredReports.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '50px 20px',
                      background: 'var(--bg-card)',
                      border: '1px dashed var(--line)',
                      borderRadius: '12px',
                      margin: '10px 0'
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brass)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em' }}>REPORT</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)' }}>
                        Hiện chưa có khiếu nại nhân sự nào
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0', lineHeight: 1.5 }}>
                        Toàn bộ hoạt động huấn luyện, y tế và chăm sóc ngựa đang diễn ra thuận lợi. Khi Chủ sở hữu gửi phản ánh hoặc khiếu nại mới, thông tin sẽ lập tức hiển thị tại đây để Admin thẩm tra và xử lý.
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="table-responsive custom-scrollbar" style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                    <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                          <th style={{ padding: '14px 16px', width: '135px', whiteSpace: 'nowrap' }}>Mã & Ngày gửi</th>
                          <th style={{ padding: '14px 16px', width: '160px', whiteSpace: 'nowrap' }}>Chủ sở hữu khiếu nại</th>
                          <th style={{ padding: '14px 16px', minWidth: '190px' }}>Đối tượng bị báo cáo</th>
                          <th style={{ padding: '14px 16px', width: '150px', whiteSpace: 'nowrap' }}>Chiến mã liên quan</th>
                          <th style={{ padding: '14px 16px', minWidth: '220px' }}>Danh mục & Mức độ</th>
                          <th style={{ padding: '14px 16px', minWidth: '280px' }}>Tiêu đề & Nội dung</th>
                          <th style={{ padding: '14px 16px', width: '170px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                          <th style={{ padding: '14px 16px', width: '170px', textAlign: 'right', whiteSpace: 'nowrap' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map(report => {
                          const roleMeta = REPORT_TARGET_ROLES[report.targetRole] || { label: report.targetRole, icon: '', color: 'var(--paper)' };
                          const sevMeta = REPORT_SEVERITIES.find(s => s.id === report.severity) || REPORT_SEVERITIES[1];
                          const statMeta = REPORT_STATUSES.find(s => s.id === report.status) || REPORT_STATUSES[0];

                          return (
                            <tr key={report.id} style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.15s ease' }}>
                              {/* Mã & Ngày gửi */}
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 700, color: 'var(--brass)', fontFamily: 'monospace', fontSize: '12.5px' }}>
                                  #{report.id}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                                  {report.createdAt}
                                </div>
                              </td>

                              {/* Chủ sở hữu */}
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13.5px' }}>
                                  {report.ownerName}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                                  SĐT: {report.ownerPhone}
                                </div>
                              </td>

                              {/* Đối tượng bị báo cáo */}
                              <td style={{ padding: '14px 16px', minWidth: '190px' }}>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: roleMeta.color,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: `1px solid ${roleMeta.color}40`,
                                  marginBottom: '5px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <span>{roleMeta.icon}</span>
                                  <span>{roleMeta.label}</span>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13.5px', lineHeight: 1.3 }}>
                                  {report.targetName}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', lineHeight: 1.3, marginTop: '2px' }}>
                                  {report.targetTitle}
                                </div>
                              </td>

                              {/* Chiến mã */}
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13.5px' }}>
                                  Chiến mã: {report.horseName}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                                  {report.stall}
                                </div>
                              </td>

                              {/* Danh mục & Mức độ */}
                              <td style={{ padding: '14px 16px', minWidth: '220px' }}>
                                <div style={{
                                  display: 'inline-block',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: sevMeta.color,
                                  background: sevMeta.badgeBg,
                                  border: `1px solid ${sevMeta.color}50`,
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  marginBottom: '5px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {sevMeta.label.split(' (')[0]}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.4 }}>
                                  {report.category}
                                </div>
                              </td>

                              {/* Tiêu đề & Nội dung tóm tắt */}
                              <td style={{ padding: '14px 16px', minWidth: '280px' }}>
                                <div style={{
                                  fontWeight: 700,
                                  color: 'var(--paper)',
                                  marginBottom: '4px',
                                  lineHeight: 1.4,
                                  fontSize: '13.5px',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}>
                                  {report.title}
                                </div>
                                <div style={{
                                  fontSize: '12px',
                                  color: 'var(--paper-dim)',
                                  lineHeight: 1.45,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}>
                                  {report.content}
                                </div>
                                {report.adminFeedback && (
                                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)', lineHeight: 1.4 }}>
                                    Phản hồi: {report.adminFeedback}
                                  </div>
                                )}
                              </td>

                              {/* Trạng thái */}
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  color: statMeta.color,
                                  background: statMeta.badgeBg,
                                  border: `1px solid ${statMeta.color}50`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {statMeta.label}
                                </span>
                              </td>

                              {/* Thao tác */}
                              <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReviewModal(report)}
                                    style={{
                                      padding: '6px 14px',
                                      background: 'rgba(212, 175, 55, 0.15)',
                                      border: '1px solid var(--brass)',
                                      color: 'var(--brass)',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Thẩm Tra & Xử Lý
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReport(report.id)}
                                    style={{
                                      padding: '6px 10px',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: '#EF4444',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                    title="Xóa bản ghi khiếu nại"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

        </main>
      </div>

      {/* ===================== MODAL THÊM NGƯỜI DÙNG ===================== */}
      {showAddUserModal && (
        <div
          onClick={() => setShowAddUserModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 999999,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow)',
              cursor: 'default'
            }}
          >
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
                  {lang === 'en' ? 'RBAC Role (Staff Only)' : 'Vai trò Nhân sự (RBAC Role)'}
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="TRAINER">{lang === 'en' ? 'Head Trainer' : 'Huấn luyện viên Trưởng (Trainer)'}</option>
                  <option value="VET">{lang === 'en' ? 'Veterinarian (Vet)' : 'Bác sĩ Thú y (Veterinarian)'}</option>
                  <option value="GROOM">{lang === 'en' ? 'Groom / Caretaker' : 'Nhân viên Chăm sóc (Groom)'}</option>
                  <option value="MANAGER">{lang === 'en' ? 'Club Manager' : 'Ban Quản lý Câu lạc bộ (Manager)'}</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px', lineHeight: 1.4 }}>
                  {lang === 'en'
                    ? '* Create new staff account for club operations (Trainer, Vet, Groom, Manager).'
                    : '* Tạo mới tài khoản nhân sự phục vụ vận hành chuồng trại và huấn luyện (HLV, Bác sĩ thú y, Groom, Quản lý).'}
                </div>
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

      {/* ===================== MODAL CHỈNH SỬA THÔNG TIN NHÂN SỰ & HỒ SƠ PHỤC VỤ (GỌN GÀNG) ===================== */}
      {showEditUserModal && editUserData && (() => {
        const staffHorses = getStaffAssignedHorsesAndOwners(editUserData);
        const uniqueOwners = Array.from(new Set(staffHorses.map(h => h.ownerKey))).length;
        const activeStalls = staffHorses.map(h => h.stable).filter(Boolean);

        // Màu sắc biểu trưng theo vai trò
        const roleColorMap = {
          'TRAINER': { bg: 'rgba(245, 158, 11, 0.14)', text: '#F59E0B', border: '#F59E0B', label: 'Huấn luyện viên Trưởng (Trainer)' },
          'VET': { bg: 'rgba(59, 130, 246, 0.14)', text: '#3B82F6', border: '#3B82F6', label: 'Bác sĩ Thú y (Veterinarian)' },
          'GROOM': { bg: 'rgba(16, 185, 129, 0.14)', text: '#10B981', border: '#10B981', label: 'Nhân viên Chăm sóc (Groom)' },
          'MANAGER': { bg: 'rgba(168, 85, 247, 0.14)', text: '#A855F7', border: '#A855F7', label: 'Ban Quản lý (Club Manager)' },
          'OWNER': { bg: 'rgba(201, 162, 39, 0.14)', text: 'var(--brass)', border: 'var(--brass)', label: 'Chủ sở hữu Ngựa (Owner)' }
        };
        const currentRoleStyle = roleColorMap[editUserData.role] || roleColorMap['TRAINER'];

        // Lấy chữ viết tắt tên nhân sự
        const initials = (editUserData.full_name || 'NS')
          .split(' ')
          .filter(Boolean)
          .slice(-2)
          .map(w => w[0].toUpperCase())
          .join('');

        return (
          <div
            onClick={() => { setShowEditUserModal(false); setEditUserData(null); }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 999998,
              cursor: 'pointer'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '920px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '18px 22px',
                color: 'var(--paper)',
                boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* TOP HEADER: Gọn gàng kèm tóm tắt chỉ số */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: currentRoleStyle.bg,
                      border: `1.5px solid ${currentRoleStyle.border}`,
                      color: currentRoleStyle.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 800
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--paper)' }}>
                        {editUserData.full_name}
                      </h3>
                      <span style={{ fontSize: '11px', background: 'rgba(201, 162, 39, 0.12)', color: 'var(--brass)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--brass)', fontWeight: 700 }}>
                        ID: #{editUserData.user_id}
                      </span>
                      <span style={{ color: currentRoleStyle.text, fontWeight: 600, background: currentRoleStyle.bg, padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        {currentRoleStyle.label}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: editUserData.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                        fontWeight: 600,
                        fontSize: '11.5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: editUserData.status === 'ACTIVE' ? '#10B981' : '#EF4444' }} />
                        {editUserData.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--paper-dim)' }}>
                      <span>@{editUserData.username}</span>
                      <span>•</span>
                      <span>🏇 <b>{staffHorses.length}</b> chiến mã</span>
                      <span>•</span>
                      <span>👑 <b>{uniqueOwners}</b> chủ ngựa</span>
                      <span>•</span>
                      <span>📍 <b>{activeStalls.slice(0, 2).join(', ') || 'Block A & B'}</b></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowEditUserModal(false); setEditUserData(null); }}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper-dim)',
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Đóng modal"
                >
                  ✕
                </button>
              </div>

              {/* MAIN CONTENT: 2 CỘT CÂN BẰNG & ĐỒNG BỘ CHIỀU CAO */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.25fr)',
                gap: '16px',
                alignItems: 'stretch'
              }}>
                {/* CỘT TRÁI: FORM SỬA THÔNG TIN TÀI KHOẢN (CÂN BẰNG CHIỀU CAO) */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--line)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👤</span> {lang === 'en' ? 'Account Details' : 'Thông tin tài khoản & Vai trò'}
                  </div>

                  <form onSubmit={handleRequestSaveEditUser} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, marginTop: '10px', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                            {lang === 'en' ? 'Full Name *' : 'Họ và tên *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={editUserData.full_name}
                            onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                            style={{ width: '100%', padding: '7px 9px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '12.5px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                            {lang === 'en' ? 'Username *' : 'Username *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={editUserData.username}
                            onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                            style={{ width: '100%', padding: '7px 9px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px', fontWeight: 600 }}>Email *</label>
                          <input
                            type="email"
                            required
                            value={editUserData.email}
                            onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                            style={{ width: '100%', padding: '7px 9px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '12.5px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                            {lang === 'en' ? 'Phone *' : 'Số điện thoại *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={editUserData.phone}
                            onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                            style={{ width: '100%', padding: '7px 9px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                            {lang === 'en' ? 'RBAC Role *' : 'Vai trò RBAC *'}
                          </label>
                          <select
                            value={editUserData.role}
                            onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                            style={{ width: '100%', padding: '7px 8px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '12px' }}
                          >
                            <option value="TRAINER">{lang === 'en' ? 'Trainer' : 'HLV Trưởng'}</option>
                            <option value="VET">{lang === 'en' ? 'Veterinarian' : 'Bác sĩ Thú y'}</option>
                            <option value="GROOM">{lang === 'en' ? 'Groom' : 'Chăm sóc (Groom)'}</option>
                            <option value="MANAGER">{lang === 'en' ? 'Club Manager' : 'Ban Quản lý'}</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                            {lang === 'en' ? 'Status' : 'Trạng thái tài khoản'}
                          </label>
                          <select
                            value={editUserData.status}
                            onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                            style={{ width: '100%', padding: '7px 8px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '5px', boxSizing: 'border-box', fontSize: '12px' }}
                          >
                            <option value="ACTIVE">{lang === 'en' ? 'Active' : 'Hoạt động (ACTIVE)'}</option>
                            <option value="INACTIVE">{lang === 'en' ? 'Suspended' : 'Tạm khóa (INACTIVE)'}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      <button
                        type="button"
                        onClick={() => { setShowEditUserModal(false); setEditUserData(null); }}
                        style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--line)', color: 'var(--paper-dim)', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, fontSize: '12.5px' }}
                      >
                        {lang === 'en' ? 'Cancel' : 'Hủy'}
                      </button>
                      <button
                        type="submit"
                        style={{ flex: 1.2, padding: '9px', background: 'var(--brass)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '5px', cursor: 'pointer', fontSize: '12.5px' }}
                      >
                        {lang === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* CỘT PHẢI: DANH SÁCH CHIẾN MÃ & CHỦ SỞ HỮU (CÂN BẰNG CHIỀU CAO) */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--line)', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏇</span> {lang === 'en' ? 'Assigned Horses' : 'Chiến mã & Chủ sở hữu phục vụ'} ({staffHorses.length})
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 500, textTransform: 'none' }}>
                      Chuyên trách nghiệp vụ
                    </span>
                  </div>

                  {staffHorses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', marginTop: '10px', paddingRight: '2px' }}>
                      {staffHorses.map((h, idx) => (
                        <div
                          key={h.id || idx}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: '9px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          {/* Hàng 1: Chiến mã + Chuồng + Xác nhận/Chờ xác nhận */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '16px', flexShrink: 0 }}>🐎</span>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: 800, color: 'var(--brass)', fontSize: '13.5px' }}>{h.horseName}</span>
                                <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginLeft: '6px' }}>
                                  ({h.breed} • {h.age})
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'var(--brass)',
                                background: 'rgba(201, 162, 39, 0.12)',
                                border: '1px solid var(--brass)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                📍 {h.stable}
                              </span>
                              {h.status === 'CONFIRMED' ? (
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  color: '#10B981',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ✓ ĐÃ XÁC NHẬN
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  color: '#F59E0B',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ⏳ CHỜ XÁC NHẬN
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hàng 2: Chủ sở hữu chiến mã */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11.5px',
                            background: 'var(--bg-secondary)',
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid var(--line)',
                            flexWrap: 'wrap',
                            gap: '4px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ color: 'var(--paper-dim)' }}>Chủ ngựa:</span>
                              <b style={{ color: 'var(--paper)' }}>{h.ownerFullName}</b>
                              <span style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>@{h.ownerKey}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--paper-dim)' }}>
                              <span>📞 <b style={{ color: 'var(--paper)' }}>{h.ownerPhone}</b></span>
                              <span>✉️ {h.ownerEmail}</span>
                            </div>
                          </div>

                          {/* Hàng 3: Nghiệp vụ */}
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>★ {h.scope}</span>
                            <span>Chip: {h.microchip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px dashed var(--line)',
                      borderRadius: '8px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      color: 'var(--paper-dim)',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '10px'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>🐎</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '3px' }}>
                        Chưa có phân công chiến mã
                      </div>
                      <div style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
                        Nhân sự này hiện chưa được chủ sở hữu nào chỉ định phân công phục vụ.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL XÁC NHẬN SỬA THÔNG TIN ===================== */}
      {showConfirmEditModal && editUserData && (
        <div
          onClick={() => setShowConfirmEditModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000000,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--brass)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '28px 24px',
              color: 'var(--paper)',
              textAlign: 'center',
              boxShadow: 'var(--shadow)',
              cursor: 'default'
            }}
          >
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

      {/* ===================== MODAL XÓA NHÂN SỰ (XÁC NHẬN MỘT LẦN) ===================== */}
      {showDeleteModal && deleteTargetUser && (
        <div
          onClick={() => { setShowDeleteModal(false); setDeleteTargetUser(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000000,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '12px',
            width: '100%',
            maxWidth: '450px',
            padding: '28px 24px',
            color: 'var(--paper)',
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#EF4444'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--paper)', margin: '0 0 10px' }}>
              {lang === 'en' ? 'Confirm Delete Staff' : 'Xác nhận xóa nhân sự'}
            </h3>

            <p style={{ fontSize: '14.5px', color: 'var(--paper)', lineHeight: '1.5', margin: '0 0 16px', fontWeight: 500 }}>
              {lang === 'en'
                ? 'Are you sure you want to delete this staff member?'
                : 'Bạn có chắc chắn muốn xóa nhân sự này không?'}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Staff ID: ' : 'Mã ID: '}<b style={{ color: 'var(--paper)' }}>#{deleteTargetUser.user_id}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Full Name: ' : 'Họ và tên: '}<b style={{ color: 'var(--paper)' }}>{deleteTargetUser.full_name}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Username: ' : 'Tài khoản: '}<b style={{ color: 'var(--paper)' }}>@{deleteTargetUser.username}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Role: ' : 'Vai trò: '}<b style={{ color: 'var(--paper)' }}>{deleteTargetUser.role_name || deleteTargetUser.role}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)' }}>
                Email: <b style={{ color: 'var(--paper)' }}>{deleteTargetUser.email}</b>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#EF4444',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              {lang === 'en'
                ? 'Warning: This action cannot be undone. System access will be permanently revoked.'
                : 'Cảnh báo: Hành động này không thể hoàn tác. Quyền truy cập hệ thống của tài khoản sẽ bị xóa bỏ vĩnh viễn.'}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleCancelDelete}
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
                onClick={handleConfirmDeleteUser}
                style={{
                  flex: 1.2,
                  padding: '11px',
                  background: '#DC2626',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                }}
              >
                {lang === 'en' ? 'Yes, Delete' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL TẠO Ô CHUỒNG MỚI ===================== */}
      {showAddStallModal && (
        <div
          onClick={() => setShowAddStallModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 999999,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px 28px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow)',
              cursor: 'default'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(201, 162, 39, 0.15)',
                  color: 'var(--brass)'
                }}>
                  <IconStable />
                </span>
                <h3 style={{ fontSize: '19px', margin: 0, color: 'var(--paper)', fontWeight: 800 }}>
                  {lang === 'en' ? 'Create New Barn Stall' : 'Khởi Tạo Ô Chuồng Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStallModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: '0 0 18px', lineHeight: '1.4' }}>
              {lang === 'en'
                ? 'Register a new barn stall unit into the facility network with customizable photo or standard 3D simulation.'
                : 'Thêm mới ô chuồng nuôi dưỡng chiến mã vào trang trại với tùy chọn tải ảnh thực tế hoặc dùng mô phỏng 3D.'}
            </p>

            <form onSubmit={handleCreateStall} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                    {lang === 'en' ? 'Stall Code *' : 'Mã ô chuồng *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'e.g. C1, B7, VIP-1' : 'Ví dụ: C6, B2, A1'}
                    value={newStallData.stall_code}
                    onChange={(e) => {
                      const codeVal = e.target.value.toUpperCase();
                      const isVipCode = codeVal.startsWith('A') || codeVal.startsWith('B') || codeVal.startsWith('VIP');
                      setNewStallData(prev => ({
                        ...prev,
                        stall_code: codeVal,
                        tier: isVipCode ? 'VIP' : prev.tier
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                    {lang === 'en' ? 'Barn Block / Zone *' : 'Khu vực chuồng *'}
                  </label>
                  <select
                    value={newStallData.block}
                    onChange={(e) => {
                      const blk = e.target.value;
                      const isVipBlock = blk === 'Block VIP' || blk === 'Block A' || blk === 'Block B';
                      setNewStallData({
                        ...newStallData,
                        block: blk,
                        tier: isVipBlock ? 'VIP' : 'STANDARD'
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontWeight: 600,
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="Block A">{lang === 'en' ? 'Block A (Main VIP)' : 'Block A (Huấn luyện VIP)'}</option>
                    <option value="Block B">{lang === 'en' ? 'Block B (Standard VIP)' : 'Block B (Tiêu chuẩn VIP)'}</option>
                    <option value="Block C">{lang === 'en' ? 'Block C (Standard)' : 'Block C (Chuồng thường)'}</option>
                    <option value="Block VIP">{lang === 'en' ? 'Block VIP (Suite)' : 'Block VIP (Đặc quyền VIP)'}</option>
                    <option value="Khu Y Tế">{lang === 'en' ? 'Vet Clinic & Care' : 'Khu Y Tế & Khám bệnh'}</option>
                  </select>
                </div>
              </div>

              {/* Phân hạng ô chuồng: Thường vs VIP (Cân bằng & thẩm mỹ cao) */}
              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  {lang === 'en' ? 'Stall Tier Classification *' : 'Phân Hạng Ô Chuồng (VIP / Tiêu Chuẩn) *'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setNewStallData({ ...newStallData, tier: 'STANDARD' })}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: newStallData.tier === 'STANDARD'
                        ? (isDark ? '2px solid #3B82F6' : '2px solid #1D4ED8')
                        : '1px solid var(--line)',
                      background: newStallData.tier === 'STANDARD'
                        ? (isDark ? 'rgba(59, 130, 246, 0.16)' : '#DBEAFE')
                        : 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: newStallData.tier === 'STANDARD' ? (isDark ? 'none' : '0 1px 3px rgba(29,78,216,0.15)') : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        background: isDark ? '#3B82F6' : '#1D4ED8',
                        color: '#FFFFFF',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        TIÊU CHUẨN
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: newStallData.tier === 'STANDARD'
                          ? (isDark ? '#93C5FD' : '#1E3A8A')
                          : 'var(--paper)'
                      }}>
                        {lang === 'en' ? 'Standard' : 'Chuồng Thường'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                      {lang === 'en' ? 'All horse owners' : 'Tất cả chủ sở hữu'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStallData({ ...newStallData, tier: 'VIP' })}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: newStallData.tier === 'VIP'
                        ? (isDark ? '2px solid #F59E0B' : '2px solid #B45309')
                        : '1px solid var(--line)',
                      background: newStallData.tier === 'VIP'
                        ? (isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7')
                        : 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: newStallData.tier === 'VIP' ? (isDark ? 'none' : '0 1px 3px rgba(180,83,9,0.15)') : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        background: isDark ? '#F59E0B' : '#B45309',
                        color: '#FFFFFF',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        VIP
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: newStallData.tier === 'VIP'
                          ? (isDark ? '#FBBF24' : '#78350F')
                          : 'var(--paper)'
                      }}>
                        {lang === 'en' ? 'VIP Stall' : 'Chuồng VIP'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                      {lang === 'en' ? 'Exclusive to VIP members' : 'Dành riêng gói VIP'}
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                    {lang === 'en' ? 'Floor Area' : 'Diện tích ô chuồng'}
                  </label>
                  <select
                    value={newStallData.area}
                    onChange={(e) => setNewStallData({ ...newStallData, area: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="14 m²">{lang === 'en' ? '14 m² (Standard A)' : '14 m² (Tiêu chuẩn A)'}</option>
                    <option value="16 m²">{lang === 'en' ? '16 m² (Spacious B)' : '16 m² (Rộng rãi B)'}</option>
                    <option value="18 m²">{lang === 'en' ? '18 m² (Premium C)' : '18 m² (Cao cấp C)'}</option>
                    <option value="20 m²">{lang === 'en' ? '20 m² (VIP Suite)' : '20 m² (VIP Suite)'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                    {lang === 'en' ? 'Dimensions' : 'Kích thước thiết kế'}
                  </label>
                  <select
                    value={newStallData.dim}
                    onChange={(e) => setNewStallData({ ...newStallData, dim: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontSize: '13.5px'
                    }}
                  >
                    <option value="3.8 x 3.8m">3.8 × 3.8m</option>
                    <option value="4.0 x 4.0m">4.0 × 4.0m</option>
                    <option value="4.2 x 4.2m">4.2 × 4.2m</option>
                    <option value="4.5 x 4.5m">4.5 × 4.5m</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                  {lang === 'en' ? 'Initial Status' : 'Trạng thái ban đầu'}
                </label>
                <select
                  value={newStallData.status}
                  onChange={(e) => setNewStallData({ ...newStallData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="AVAILABLE">{lang === 'en' ? 'AVAILABLE (Vacant, clean & ready)' : 'AVAILABLE (Trống, sạch sẽ sẵn sàng phân bổ)'}</option>
                  <option value="OCCUPIED">{lang === 'en' ? 'OCCUPIED (Housing a racehorse)' : 'OCCUPIED (Đang có chiến mã ở)'}</option>
                </select>
              </div>

              {newStallData.status === 'OCCUPIED' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      {lang === 'en' ? 'Racehorse Name' : 'Tên chiến mã đang ở'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'e.g. Bạch Mã Hoàng Tử' : 'Ví dụ: Bạch Mã Hoàng Tử'}
                      value={newStallData.horse}
                      onChange={(e) => setNewStallData({ ...newStallData, horse: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      {lang === 'en' ? 'Horse Breed' : 'Giống ngựa'}
                    </label>
                    <select
                      value={newStallData.breed}
                      onChange={(e) => setNewStallData({ ...newStallData, breed: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                    >
                      <option value="Thoroughbred">Thoroughbred (Thuần chủng Anh)</option>
                      <option value="Arabian">Arabian (Ả Rập)</option>
                      <option value="Quarter Horse">Quarter Horse (Ngựa chạy cự ly ngắn)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Hình ảnh ô chuồng: Admin tải ảnh thực tế hoặc dùng ảnh 3D mô phỏng */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--line)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12.5px', color: 'var(--paper)', fontWeight: 700, display: 'block' }}>
                      {lang === 'en' ? 'Stall Photo / Architectural Image' : 'Hình ảnh ô chuồng'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                      {newStallData.stall_image
                        ? (lang === 'en' ? 'Custom uploaded stall photo' : 'Đã tải ảnh thực tế tùy chỉnh')
                        : (lang === 'en' ? 'Standard 3D simulation preview' : 'Ảnh 3D mô phỏng kiến trúc tự động')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {newStallData.stall_image && (
                      <button
                        type="button"
                        onClick={() => setNewStallData(prev => ({ ...prev, stall_image: '' }))}
                        style={{
                          padding: '5px 9px',
                          fontSize: '11px',
                          borderRadius: '5px',
                          background: 'transparent',
                          border: '1px solid var(--line)',
                          color: 'var(--paper-dim)',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {lang === 'en' ? 'Reset to 3D' : 'Dùng ảnh 3D'}
                      </button>
                    )}

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        background: 'var(--brass)',
                        color: '#14100A',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        transition: 'all 0.15s ease'
                      }}
                      title="Chọn ảnh chuồng từ máy tính"
                    >
                      <span>{newStallData.stall_image ? (lang === 'en' ? 'Change photo' : 'Đổi ảnh khác') : (lang === 'en' ? '+ Upload Photo' : '+ Tải ảnh chuồng lên')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUploadNewStallImage}
                      />
                    </label>
                  </div>
                </div>

                <div style={{
                  position: 'relative',
                  height: '110px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  background: '#0B111A'
                }}>
                  <img
                    src={newStallData.stall_image || (newStallData.status === 'OCCUPIED' ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg')}
                    alt="Stall Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: newStallData.stall_image ? '#10B981' : 'var(--brass)'
                  }}>
                    <span>{newStallData.stall_image ? '✓ Ảnh thực tế tải lên' : 'Mô phỏng 3D chuẩn'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStallModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13.5px'
                  }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.4,
                    padding: '11px',
                    background: 'var(--brass)',
                    border: 'none',
                    color: '#14100A',
                    fontWeight: 800,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(201, 162, 39, 0.3)'
                  }}
                >
                  {lang === 'en' ? 'Create Stall' : 'Tạo Ô Chuồng Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL XÓA Ô CHUỒNG ===================== */}
      {showDeleteStallModal && deleteTargetStall && (
        <div
          onClick={() => { setShowDeleteStallModal(false); setDeleteTargetStall(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000000,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            padding: '28px 24px',
            color: 'var(--paper)',
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#EF4444'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--paper)', margin: '0 0 10px' }}>
              {lang === 'en' ? 'Confirm Delete Stall' : 'Xác nhận xóa ô chuồng'}
            </h3>

            <p style={{ fontSize: '14.5px', color: 'var(--paper)', lineHeight: '1.5', margin: '0 0 16px', fontWeight: 500 }}>
              {lang === 'en'
                ? `Are you sure you want to delete Barn Stall ${deleteTargetStall.stall_code}?`
                : `Bạn có chắc chắn muốn xóa ô chuồng ${deleteTargetStall.stall_code} (${deleteTargetStall.block}) không?`}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Stall Code: ' : 'Mã ô chuồng: '}<b style={{ color: 'var(--paper)' }}>{deleteTargetStall.stall_code}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Barn Block: ' : 'Phân khu: '}<b style={{ color: 'var(--paper)' }}>{deleteTargetStall.block}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)', marginBottom: '5px' }}>
                {lang === 'en' ? 'Dimensions & Area: ' : 'Kích thước & Diện tích: '}<b style={{ color: 'var(--paper)' }}>{deleteTargetStall.dim} · {deleteTargetStall.area}</b>
              </div>
              <div style={{ color: 'var(--paper-dim)' }}>
                {lang === 'en' ? 'Current Resident: ' : 'Chiến mã lưu trú: '}
                <b style={{ color: deleteTargetStall.status === 'OCCUPIED' ? 'var(--brass)' : 'var(--paper)' }}>
                  {deleteTargetStall.horse} {deleteTargetStall.status === 'OCCUPIED' ? `(${deleteTargetStall.breed})` : ''}
                </b>
              </div>
            </div>

            {deleteTargetStall.status === 'OCCUPIED' && deleteTargetStall.horse !== '(Trống)' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#EF4444',
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                {lang === 'en'
                  ? `Notice: Horse "${deleteTargetStall.horse}" currently in this stall will be marked as "Unassigned" and awaiting a new stall.`
                  : `Lưu ý: Chiến mã "${deleteTargetStall.horse}" đang ở ô này sẽ được chuyển về trạng thái "Chưa phân bổ" để bạn xếp chuồng mới.`}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { setShowDeleteStallModal(false); setDeleteTargetStall(null); }}
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
                onClick={handleConfirmDeleteStall}
                style={{
                  flex: 1.2,
                  padding: '11px',
                  background: '#DC2626',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                }}
              >
                {lang === 'en' ? 'Yes, Delete Stall' : 'Xác nhận xóa chuồng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL THAY ĐỔI CHIẾN MÃ Ô CHUỒNG ===================== */}
      {showChangeHorseModal && changeHorseStall && (
        <div
          onClick={() => { setShowChangeHorseModal(false); setChangeHorseStall(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000000,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow)',
              cursor: 'default'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(201, 162, 39, 0.15)',
                color: 'var(--brass)'
              }}>
                <IconHorse />
              </span>
              <h3 style={{ fontSize: '19px', margin: 0, color: 'var(--paper)', fontWeight: 700 }}>
                {lang === 'en' ? `Reassign Horse · Stall ${changeHorseStall.stall_code}` : `Thay Đổi Chiến Mã · Ô ${changeHorseStall.stall_code}`}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: '0 0 16px', lineHeight: '1.4' }}>
              {lang === 'en'
                ? `Update or vacate resident racehorse for Barn Stall ${changeHorseStall.stall_code} (${changeHorseStall.block}).`
                : `Phân bổ, chuyển đổi hoặc làm trống chiến mã cư trú tại ô chuồng ${changeHorseStall.stall_code} (${changeHorseStall.block}).`}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Stall Specs:' : 'Quy cách chuồng:'}</span>
                <b style={{ color: 'var(--paper)' }}>{changeHorseStall.block} · {changeHorseStall.area} ({changeHorseStall.dim})</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Current Resident:' : 'Chiến mã hiện tại:'}</span>
                <b style={{ color: changeHorseStall.status === 'OCCUPIED' ? 'var(--brass)' : 'var(--paper)' }}>
                  {changeHorseStall.horse} {changeHorseStall.status === 'OCCUPIED' ? `(${changeHorseStall.breed})` : ''}
                </b>
              </div>
            </div>

            <form onSubmit={handleSaveChangeHorse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  {lang === 'en' ? 'Select Racehorse Assignment' : 'Chọn chiến mã phân bổ'}
                </label>
                <select
                  value={selectedHorseOption}
                  onChange={(e) => setSelectedHorseOption(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }}
                >
                  <option value="VACANT">
                    {lang === 'en' ? 'Vacant Stall (No horse / Empty stall)' : 'Làm trống ô chuồng (Không gán chiến mã)'}
                  </option>
                  <optgroup label={lang === 'en' ? 'Active Racehorses' : 'Danh sách chiến mã hiện có'}>
                    {horses.map(h => (
                      <option key={h.id} value={String(h.id)}>
                        {h.name} ({h.breed} · Chip: {h.microchip} · Chuồng: {h.stable})
                      </option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">
                    {lang === 'en' ? 'Add custom / new horse name...' : 'Nhập tên chiến mã mới khác...'}
                  </option>
                </select>
              </div>

              {selectedHorseOption === 'CUSTOM' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                      {lang === 'en' ? 'Racehorse Name *' : 'Tên chiến mã mới *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'en' ? 'e.g. Hoàng Kim Mã' : 'Ví dụ: Hoàng Kim Mã'}
                      value={customHorseName}
                      onChange={(e) => setCustomHorseName(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                      {lang === 'en' ? 'Breed' : 'Giống ngựa'}
                    </label>
                    <select
                      value={customHorseBreed}
                      onChange={(e) => setCustomHorseBreed(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                    >
                      <option value="Thoroughbred">Thoroughbred (Thuần chủng)</option>
                      <option value="Arabian">Arabian (Ả Rập)</option>
                      <option value="Quarter Horse">Quarter Horse</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => { setShowChangeHorseModal(false); setChangeHorseStall(null); }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.3,
                    padding: '11px',
                    background: 'var(--brass)',
                    border: 'none',
                    color: '#14100A',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {lang === 'en' ? 'Save Changes' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL TỪ CHỐI YÊU CẦU CẤP / ĐỔI Ô CHUỒNG ===================== */}
      {showRejectModal && rejectingRequest && (
        <div
          onClick={() => { setShowRejectModal(false); setRejectingRequest(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000000,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow)',
              cursor: 'default'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: "18px", color: "#EF4444", fontWeight: 700 }}>&times;</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--paper)' }}>
                Từ Chối Yêu Cầu Ô Chuồng
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Bạn đang từ chối yêu cầu cấp / đổi sang <b>Ô {rejectingRequest.requestedStall}</b> cho chiến mã <b>{rejectingRequest.horseName}</b> (Chủ sở hữu: {rejectingRequest.ownerName}). Ô chuồng này sẽ được trả về trạng thái trống.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--paper)', marginBottom: '6px' }}>
                Lý Do Từ Chối:
              </label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Nhập lý do từ chối để thông báo tới Chủ sở hữu..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectingRequest(null); }}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--paper-dim)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectStallRequest}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL THÊM CHIẾN MÃ ===================== */}
      {showAddHorseModal && (
        <div
          onClick={() => setShowAddHorseModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 999999,
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow)',
              cursor: 'default'
            }}
          >
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
                  {stables.map(s => (
                    <option key={s.stall_code} value={s.stall_code}>
                      {lang === 'en' ? `Stall ${s.stall_code}` : `Ô ${s.stall_code}`} ({s.block} - {s.status === 'AVAILABLE' ? (lang === 'en' ? 'Vacant' : 'Đang trống') : (lang === 'en' ? `Occupied: ${s.horse}` : `Có ngựa: ${s.horse}`)})
                    </option>
                  ))}
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

      {/* ===================== MODAL XEM CHI TIẾT CHIẾN MÃ ===================== */}
      {viewingHorseDetail && (() => {
        const currentHorse = horses.find(item => item.id === viewingHorseDetail.id) || viewingHorseDetail;
        const loc = getHorseLocalized(currentHorse, lang);
        const detail = { ...viewingHorseDetail, ...currentHorse, ...loc };

        return (
          <div
            onClick={() => setViewingHorseDetail(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000000,
              cursor: 'pointer'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                color: 'var(--paper)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                position: 'relative',
                cursor: 'default'
              }}
            >
              {/* Header Banner với ảnh ngựa */}
              <div style={{ position: 'relative', height: '210px', width: '100%', overflow: 'hidden' }}>
                <img
                  src={detail.avatar}
                  alt={detail.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.92) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        background: 'var(--brass)',
                        color: '#14100A',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em'
                      }}>
                        {detail.breedDisplay.toUpperCase()}
                      </span>
                      <span style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(6px)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontFamily: 'monospace'
                      }}>
                        {detail.microchip}
                      </span>
                    </div>

                    {/* Nút đổi ngôn ngữ & Nút đóng modal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={toggleLang}
                        style={{
                          background: 'rgba(0,0,0,0.65)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          color: '#ffffff',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backdropFilter: 'blur(4px)'
                        }}
                        title={lang === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
                      >
                        {lang === 'en' ? 'EN' : 'VI'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingHorseDetail(null)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 700
                        }}
                      >&times;</button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {lang === 'en' ? 'Assigned to Barn Stall ' : 'Đang lưu trú Ô '}{detail.stable}
                    </div>
                    <h2 style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 800, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {lang === 'en' ? detail.englishName : detail.name}
                    </h2>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                      {lang === 'en' ? detail.name : detail.englishName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thân Modal */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Mô tả */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: 'var(--paper)',
                  lineHeight: 1.6
                }}>
                  <b style={{ color: 'var(--brass)' }}>{lang === 'en' ? 'Evaluation Notes:' : 'Nhận định tổng quan:'} </b>
                  {detail.desc}
                </div>

                {/* Grid 4 Chỉ số Thể chất */}
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--paper-dim)', fontWeight: 700 }}>
                    {lang === 'en' ? 'Physical Biometrics & Stature' : 'Sinh Trắc Học & Thể Chất'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Age / YOB' : 'Tuổi / Năm sinh'}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                        {detail.age} {lang === 'en' ? 'yo' : 'tuổi'} ({detail.yob})
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Gender' : 'Giới tính'}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                        {detail.genderDisplay}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Weight' : 'Cân nặng'}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                        {detail.weight}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Height' : 'Chiều cao'}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                        {detail.height}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quản lý Chuồng & Nhân sự */}
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--paper-dim)', fontWeight: 700 }}>
                    {lang === 'en' ? 'Stabling, Ownership & Team' : 'Chuồng Nuôi Dưỡng & Ekip Phụ Trách'}
                  </h4>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--line)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Assigned Barn Stall:' : 'Ô chuồng phân bổ:'}</span>
                      <b style={{ color: 'var(--brass)' }}>{lang === 'en' ? 'Stall ' : 'Ô '}{detail.stable}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Owner / Syndicate:' : 'Chủ sở hữu:'}</span>
                      <b style={{ color: 'var(--paper)' }}>{detail.owner}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Head Trainer:' : 'Huấn luyện viên trưởng:'}</span>
                      <b style={{ color: 'var(--paper)' }}>{detail.trainer}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Groom Nutrition Care:' : 'Nhóm Groom chăm sóc:'}</span>
                      <b style={{ color: 'var(--paper)' }}>{detail.groom}</b>
                    </div>
                  </div>
                </div>

                {/* Thành tích thi đấu & Phả hệ */}
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--paper-dim)', fontWeight: 700 }}>
                    {lang === 'en' ? 'Racing Record & Pedigree' : 'Thành Tích Giải Đua & Dòng Dõi Phả Hệ'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Track Performance' : 'Thành tích trường đua'}</div>
                      <div style={{ fontWeight: 700, color: 'var(--paper)', marginTop: '4px' }}>
                        {detail.winsCount}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brass)', marginTop: '4px' }}>
                        {lang === 'en' ? 'Total Earnings:' : 'Tiền thưởng:'} {detail.totalEarnings}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{lang === 'en' ? 'Bloodline / Pedigree' : 'Dòng giống phụ mẫu'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '4px' }}>
                        ♂ {lang === 'en' ? 'Sire:' : 'Bố:'} <b>{detail.sire}</b>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '2px' }}>
                        ♀ {lang === 'en' ? 'Dam:' : 'Mẹ:'} <b>{detail.dam}</b>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tình trạng y tế & Toggle Khóa */}
                <div style={{
                  background: detail.locked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${detail.locked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: detail.locked ? '#EF4444' : '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>
                      {lang === 'en' ? 'Veterinary Medical Clearance' : 'Kiểm Định Y Tế Thú Y'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                      {detail.statusText}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleHorseLock(detail.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: detail.locked ? '#10B981' : '#EF4444',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    {detail.locked
                      ? (lang === 'en' ? 'Clear Lock' : 'Mở khóa thi đấu')
                      : (lang === 'en' ? 'Lock (Vet)' : 'Khóa y tế')}
                  </button>
                </div>

                {/* Nút đóng */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setViewingHorseDetail(null)}
                    style={{
                      padding: '10px 24px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13.5px'
                    }}
                  >
                    {lang === 'en' ? 'Close' : 'Đóng'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL THẨM TRA & XỬ LÝ KHIẾU NẠI NHÂN SỰ ===================== */}
      {selectedReportForReview && (
        <div
          onClick={() => setSelectedReportForReview(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0F1523',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '660px',
              maxHeight: '92vh',
              overflowY: 'auto',
              color: '#F1F5F9',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 175, 55, 0.12)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 22px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 21, 35, 0) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(212, 175, 55, 0.14)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--brass)',
                  letterSpacing: '0.05em'
                }}>
                  AUDIT
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                    Thẩm Tra & Xử Lý Khiếu Nại Nhân Sự
                  </h3>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                    Hồ sơ <b style={{ color: 'var(--brass)' }}>#{selectedReportForReview.id}</b> · Gửi lúc {selectedReportForReview.createdAt}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportForReview(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94A3B8',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >&times;</button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAdminReview} style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Card tóm tắt vụ việc & nội dung phản ánh (Gọn gàng, liền mạch) */}
              <div style={{
                background: '#141A29',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {/* Header tóm tắt */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#EF4444',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Bị phản ánh: {REPORT_TARGET_ROLES[selectedReportForReview.targetRole]?.label || selectedReportForReview.targetRole}
                    </span>
                    <b style={{ color: '#F1F5F9', fontSize: '13.5px' }}>{selectedReportForReview.targetName}</b>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>({selectedReportForReview.targetTitle})</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    Chủ sở hữu: <b style={{ color: '#F1F5F9' }}>{selectedReportForReview.ownerName}</b> · Chiến mã: <b style={{ color: 'var(--brass)' }}>{selectedReportForReview.horseName}</b>
                  </div>
                </div>

                {/* Nội dung phản ánh có scroll nhẹ nếu quá dài */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Nội dung phản ánh từ Chủ sở hữu:
                  </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    maxHeight: '105px',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      fontWeight: 700,
                      color: 'var(--brass)',
                      fontSize: '13px',
                      marginBottom: '4px',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}>
                      {selectedReportForReview.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#CBD5E1',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}>
                      {selectedReportForReview.content}
                    </div>
                    {selectedReportForReview.evidenceNote && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#94A3B8',
                        fontStyle: 'italic',
                        borderTop: '1px dashed rgba(255,255,255,0.08)',
                        paddingTop: '4px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}>
                        Bằng chứng / Ghi chú: {selectedReportForReview.evidenceNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cập nhật trạng thái & Gợi ý nhanh */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12.5px', color: '#E2E8F0', fontWeight: 700 }}>
                    Trạng thái thẩm tra & xử lý <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Bấm chọn nhanh phương án để tự động điền
                  </span>
                </div>

                <select
                  value={adminReviewStatus}
                  onChange={(e) => setAdminReviewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '9px 34px 9px 12px',
                    background: '#141A29 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394A3B8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E") no-repeat calc(100% - 12px) center',
                    appearance: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    color: adminReviewStatus === 'RESOLVED' ? '#10B981' : (adminReviewStatus === 'INVESTIGATING' ? '#38BDF8' : (adminReviewStatus === 'DISMISSED' ? '#EF4444' : '#F59E0B')),
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                >
                  <option value="INVESTIGATING" style={{ background: '#141A29', color: '#38BDF8' }}>Đang thẩm tra & Yêu cầu giải trình</option>
                  <option value="RESOLVED" style={{ background: '#141A29', color: '#10B981' }}>✅ Đã giải quyết & Xử lý kỷ luật</option>
                  <option value="DISMISSED" style={{ background: '#141A29', color: '#EF4444' }}>Bác bỏ khiếu nại (Không đủ căn cứ)</option>
                  <option value="PENDING" style={{ background: '#141A29', color: '#F59E0B' }}>Chờ tiếp nhận hồ sơ</option>
                </select>

                {/* Gợi ý phương án nhanh dạng chip gọn gàng */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    {
                      tag: 'Yêu cầu giải trình 24h',
                      status: 'INVESTIGATING',
                      action: 'Yêu cầu nhân sự giải trình bằng văn bản trong 24h & tạm đình chỉ buổi tập',
                      feedback: 'Ban Quản Trị đã tiếp nhận phản ánh và yêu cầu nhân sự giải trình chi tiết trong 24h. Chúng tôi sẽ thông báo kết quả kỷ luật sớm nhất tới bạn.'
                    },
                    {
                      tag: 'Nhắc nhở & Chấn chỉnh',
                      status: 'RESOLVED',
                      action: 'Phê bình nghiêm khắc, nhắc nhở quy trình phục vụ và lập biên bản nội bộ',
                      feedback: 'Ban Quản Trị đã làm việc trực tiếp, tiến hành nhắc nhở và chấn chỉnh nghiêm túc nhân sự. Cảm ơn Chủ sở hữu đã phản ánh để nâng cao chất lượng phục vụ.'
                    },
                    {
                      tag: 'Kỷ luật & Trừ thi đua',
                      status: 'RESOLVED',
                      action: 'Phạt trừ điểm thi đua tháng và bố trí nhân sự khác có chuyên môn cao hơn phụ trách',
                      feedback: 'Ban Quản Trị đã thi hành kỷ luật trừ thi đua đối với nhân sự và điều phối nhân sự mới thay thế theo đúng yêu cầu của Chủ sở hữu.'
                    },
                    {
                      tag: 'Hòa giải & Xin lỗi',
                      status: 'RESOLVED',
                      action: 'Tổ chức đối thoại trực tiếp, nhân sự đã nhận khuyết điểm và xin lỗi Chủ sở hữu',
                      feedback: 'Nhân sự đã nhận trách nhiệm, nhận khuyết điểm và gửi lời xin lỗi chân thành tới Chủ sở hữu. Ban Quản Trị cam kết không để tái diễn sự việc.'
                    },
                    {
                      tag: 'Bác bỏ (Bất khả kháng)',
                      status: 'DISMISSED',
                      action: 'Bác bỏ khiếu nại sau khi trích xuất camera chuồng và nhật ký viễn trắc (sự việc bất khả kháng)',
                      feedback: 'Qua trích xuất camera và dữ liệu viễn trắc khách quan, Ban Quản Trị xác minh nhân sự đã xử lý đúng quy trình ứng phó tình huống bất khả kháng.'
                    }
                  ].map((preset, idx) => {
                    const isActive = adminReviewAction === preset.action;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAdminReviewStatus(preset.status);
                          setAdminReviewAction(preset.action);
                          setAdminReviewFeedback(preset.feedback);
                        }}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: isActive ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          border: isActive ? '1px solid var(--brass)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isActive ? 'var(--brass)' : '#CBD5E1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {preset.tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Biện pháp xử lý */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#E2E8F0', fontWeight: 700, marginBottom: '5px' }}>
                  Biện pháp xử lý / Kỷ luật nội bộ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminReviewAction}
                  onChange={(e) => setAdminReviewAction(e.target.value)}
                  placeholder="Ví dụ: Phạt trừ điểm thi đua nhân viên, thay đổi HLV phụ trách..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    background: '#141A29',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Lời kết luận & Phản hồi chính thức */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#E2E8F0', fontWeight: 700, marginBottom: '5px' }}>
                  Lời kết luận & Phản hồi chính thức gửi Chủ sở hữu <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={adminReviewFeedback}
                  onChange={(e) => setAdminReviewFeedback(e.target.value)}
                  placeholder="Nhập nội dung phản hồi chính thức từ Ban Quản Trị gửi đến Chủ sở hữu chiến mã..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    background: '#141A29',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    lineHeight: '1.45',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Ghi chú nội bộ Admin */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                  Ghi chú thẩm tra nội bộ (Chỉ Admin thấy)
                </label>
                <input
                  type="text"
                  value={adminReviewNotes}
                  onChange={(e) => setAdminReviewNotes(e.target.value)}
                  placeholder="Ghi chú hồ sơ nhân viên, trích xuất camera hoặc biên bản đối chất..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    background: '#141A29',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#94A3B8',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReportForReview(null)}
                  style={{
                    padding: '9px 18px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#CBD5E1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: 'none',
                    color: '#0F172A',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>Lưu Kết Luận & Gửi Phản Hồi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
