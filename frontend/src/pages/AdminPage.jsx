import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
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
  getAdminOverviewApi,
  getIncidentsApi
} from '../services/api';

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
  const { currentUser, usersList, updateUser, deleteUser, toggleUserStatus, registerUser, logout } = useAuth();
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
      desc: 'Chiến mã cự ly 1.600m, thể lực sung mãn, đang theo dõi tải nhịp tim cao.',
      avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80'
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
      desc: 'Sức bền tuyệt hảo 2.400m sân cỏ, đã vượt qua kiểm định y tế Thú y.',
      avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'
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
      desc: 'Bác sĩ Thú y kích hoạt lệnh khóa do giãn gân chân trái. Cấm tập nặng.',
      avatar: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80'
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
      desc: 'Đang theo dõi kiểm dịch dịch tễ tại khu cách ly Block B. Sức khỏe ổn định.',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
    }
  ]);

  // State danh sách chuồng trại kèm hình ảnh chuồng trại mô phỏng 3D (Horse Barn 3D Simulation) chuẩn quốc tế
  const [stables, setStables] = useState([
    { stall_code: 'A1', block: 'Block A', status: 'OCCUPIED', horse: 'Xích Thố', breed: 'Arabian', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A2', block: 'Block A', status: 'OCCUPIED', horse: 'Bạch Long', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A3', block: 'Block A', status: 'OCCUPIED', horse: 'Hắc Phong', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A4', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Vũ', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A5', block: 'Block A', status: 'OCCUPIED', horse: 'Phi Yến', breed: 'Thoroughbred', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'A6', block: 'Block A', status: 'OCCUPIED', horse: 'Kim Kê', breed: 'Quarter Horse', area: '14 m²', dim: '3.8 x 3.8m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B1', block: 'Block B', status: 'OCCUPIED', horse: 'Thanh Vân', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B2', block: 'Block B', status: 'OCCUPIED', horse: 'Lôi Chấn', breed: 'Quarter Horse', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B3', block: 'Block B', status: 'OCCUPIED', horse: 'Hồng Sa', breed: 'Arabian', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B4', block: 'Block B', status: 'OCCUPIED', horse: 'Thiên Lý', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B5', block: 'Block B', status: 'OCCUPIED', horse: 'Bảo Mã', breed: 'Thoroughbred', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_occupied.jpg', horse_avatar: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=300&q=80' },
    { stall_code: 'B6', block: 'Block B', status: 'AVAILABLE', horse: '(Trống)', breed: 'Vacant', area: '16 m²', dim: '4.0 x 4.0m', stall_image: '/images/stall_simulation_vacant.jpg', horse_avatar: null }
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

  // Modal xóa nhân sự (Xác nhận một lần)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  // Modal tạo ô chuồng mới
  const [showAddStallModal, setShowAddStallModal] = useState(false);
  const [newStallData, setNewStallData] = useState({
    stall_code: '',
    block: 'Block C',
    status: 'AVAILABLE',
    area: '16 m²',
    dim: '4.0 x 4.0m',
    horse: '',
    breed: 'Thoroughbred'
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

  // Nạp danh sách ngựa và chuồng từ API Backend (kết hợp LocalStorage persistence)
  useEffect(() => {
    let isMounted = true;
    const fixAvatar = (url) => {
      if (!url || typeof url !== 'string' || url.includes('photo-1598974357801-cbca10065444')) {
        return 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80';
      }
      return url;
    };

    getHorsesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setHorses(res.data.map(h => ({ ...h, avatar: fixAvatar(h.avatar) })));
      }
    }).catch(() => {});

    getStablesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setStables(res.data.map(s => ({
          ...s,
          horse_avatar: s.horse_avatar ? fixAvatar(s.horse_avatar) : null
        })));
      }
    }).catch(() => {});

    return () => { isMounted = false; };
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
      ? (h.owner === 'Phạm Tiến Thành' ? 'Pham Tien Thanh (Owner)' : (h.owner || 'Syndicate Owner'))
      : (h.owner || 'Phạm Tiến Thành');

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
    setNewHorseData({ name: '', microchip: '', breed: 'Thoroughbred', gender: 'Ngựa đực (Stallion)', stable: 'B6', owner: 'Phạm Tiến Thành' });
  };

  // Thay đổi trạng thái chuồng
  const handleToggleStable = (stallCode) => {
    setStables(prev => prev.map(s => {
      if (s.stall_code === stallCode) {
        const nextStatus = s.status === 'AVAILABLE' ? 'OCCUPIED' : s.status === 'OCCUPIED' ? 'MAINTENANCE' : 'AVAILABLE';
        const nextImage = nextStatus === 'OCCUPIED' ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg';
        updateStallApi(stallCode, { status: nextStatus, stall_image: nextImage }).catch(() => {});
        return { ...s, status: nextStatus, stall_image: nextImage };
      }
      return s;
    }));
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

    const newStall = {
      stall_code: code,
      block: newStallData.block,
      status: newStallData.status,
      horse: horseName,
      breed: breedName,
      area: newStallData.area || '16 m²',
      dim: newStallData.dim || '4.0 x 4.0m',
      stall_image: isOccupied ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg',
      horse_avatar: isOccupied ? 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80' : null
    };

    // Gửi yêu cầu tới Backend API
    createStallApi(newStall).catch(() => {});

    setStables(prev => [...prev, newStall]);

    setAuditLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleString('vi-VN'),
        user: `${currentUser?.username || 'admin'} (Admin)`,
        action: 'TẠO Ô CHUỒNG MỚI',
        detail: `Khởi tạo thành công ô chuồng mới ${newStall.stall_code} (${newStall.block}, quy cách ${newStall.dim}, diện tích ${newStall.area})`
      },
      ...prev
    ]);

    showToast(
      lang === 'en' ? `Stall ${code} created successfully!` : `Đã tạo thành công ô chuồng mới ${code} (${newStall.block})!`,
      lang === 'en' ? 'STALL CREATED' : 'TẠO CHUỒNG THÀNH CÔNG',
      'info'
    );

    setShowAddStallModal(false);
    setNewStallData({
      stall_code: '',
      block: 'Block C',
      status: 'AVAILABLE',
      area: '16 m²',
      dim: '4.0 x 4.0m',
      horse: '',
      breed: 'Thoroughbred'
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
    setStables(prev => prev.filter(s => s.stall_code !== targetCode));

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
                    {lang === 'en'
                      ? `Occupancy: ${stables.length > 0 ? ((stables.filter(s => s.status === 'OCCUPIED').length / stables.length) * 100).toFixed(1) : 0}% (${stables.filter(s => s.status === 'AVAILABLE').length} vacant)`
                      : `Lấp đầy: ${stables.length > 0 ? ((stables.filter(s => s.status === 'OCCUPIED').length / stables.length) * 100).toFixed(1) : 0}% (${stables.filter(s => s.status === 'AVAILABLE').length} chuồng trống)`}
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
                    const loc = getHorseLocalized(h, lang);
                    return (
                      <div key={h.id} className="facility-card" style={{ padding: '0 0 20px 0', overflow: 'hidden' }}>
                        {/* Hình ảnh banner chiến mã */}
                        <div
                          onClick={() => handleOpenHorseDetail(h)}
                          title={lang === 'en' ? 'Click to view horse details' : 'Bấm để xem chi tiết chiến mã'}
                          style={{
                            position: 'relative',
                            height: '175px',
                            width: '100%',
                            overflow: 'hidden',
                            background: 'var(--bg-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <img
                            src={h.avatar}
                            alt={h.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              transition: 'transform 0.4s ease'
                            }}
                            className="stall-horse-banner-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '14px 16px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                background: h.breed === 'Thoroughbred' ? 'rgba(201, 162, 39, 0.95)' : 'rgba(100, 116, 139, 0.85)',
                                backdropFilter: 'blur(6px)',
                                color: h.breed === 'Thoroughbred' ? '#14100A' : '#ffffff',
                                fontWeight: 800,
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                letterSpacing: '0.05em'
                              }}>
                                {loc.breedDisplay.toUpperCase()}
                              </span>
                              <span style={{
                                background: 'rgba(0, 0, 0, 0.7)',
                                backdropFilter: 'blur(6px)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                padding: '3px 9px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                fontFamily: 'monospace'
                              }}>
                                {h.microchip}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                  {lang === 'en' ? 'Stall ' : 'Ô '}{h.stable} · {loc.genderDisplay}
                                </span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                  {lang === 'en' ? loc.englishName : h.name}
                                </h4>
                              </div>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: h.locked ? '#EF4444' : h.status === 'WATCH' ? '#F59E0B' : '#10B981',
                                color: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                              }}>
                                {h.locked ? (lang === 'en' ? 'LOCKED' : 'TẠM KHÓA') : (lang === 'en' ? 'ELIGIBLE' : 'KHẢ DỤNG')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Chi tiết thông số */}
                        <div style={{ padding: '16px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h3
                            className="facility-card-title"
                            onClick={() => handleOpenHorseDetail(h)}
                            style={{ margin: 0, fontSize: '16px', cursor: 'pointer' }}
                            title={lang === 'en' ? 'Click to view horse details' : 'Bấm để xem chi tiết chiến mã'}
                          >
                            {lang === 'en' ? loc.englishName : h.name}
                            {lang === 'en' && loc.englishName !== h.name && (
                              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--paper-dim)', marginLeft: '6px' }}>({h.name})</span>
                            )}
                          </h3>
                          <p className="facility-card-desc" style={{ margin: 0, fontSize: '13px' }}>{loc.desc}</p>
                          
                          <div className="facility-card-bullets" style={{ margin: 0 }}>
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
                          <div className="facility-specs-grid" style={{ margin: 0 }}>
                            <div className="facility-spec-cell">
                              <span className="spec-label">{lang === 'en' ? 'Gender' : 'Giới tính'}</span>
                              <span className="spec-val">{loc.genderDisplay}</span>
                            </div>
                            <div className="facility-spec-cell">
                              <span className="spec-label">{lang === 'en' ? 'Stall' : 'Ô Chuồng'}</span>
                              <span className="spec-val" style={{ color: 'var(--brass)', fontWeight: 700 }}>{lang === 'en' ? 'Stall ' : 'Ô '}{h.stable}</span>
                            </div>
                            <div className="facility-spec-cell">
                              <span className="spec-label">{lang === 'en' ? 'Owner' : 'Chủ sở hữu'}</span>
                              <span className="spec-val" style={{ fontSize: '11.5px' }}>{loc.owner.split(' ').slice(-1)[0]}</span>
                            </div>
                          </div>

                          {/* Status/Price Box */}
                          <div className="facility-price-box" style={{ margin: 0 }}>
                            <div>
                              <div className="price-label">{lang === 'en' ? 'Health Status' : 'Trạng thái sức khỏe'}</div>
                              <div className="price-value" style={{ fontSize: '15px', color: 'var(--paper)' }}>
                                {loc.statusText}
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
                          <div className="facility-card-actions" style={{ margin: 0, paddingTop: '4px' }}>
                            <div className="actions-left">
                              <button
                                className="facility-btn-action"
                                onClick={() => handleOpenHorseDetail(h)}
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
                      {filteredHorses.map(h => {
                        const loc = getHorseLocalized(h, lang);
                        return (
                          <tr key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={h.avatar}
                                  alt={h.name}
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--line)',
                                    flexShrink: 0,
                                    background: 'var(--bg-secondary)'
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                                  }}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--brass)', fontSize: '15px' }}>
                                    {lang === 'en' ? loc.englishName : h.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>
                                    {lang === 'en' && loc.englishName !== h.name ? `${h.name} · ${h.microchip}` : h.microchip}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>
                              <div>{loc.breedDisplay}</div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{loc.genderDisplay}</div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', fontWeight: 600 }}>
                                {lang === 'en' ? 'Stall ' : 'Ô '}{h.stable}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>{loc.owner}</td>
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
                                {loc.statusText}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleOpenHorseDetail(h)}
                                style={{
                                  padding: '5px 12px',
                                  background: 'rgba(201, 162, 39, 0.15)',
                                  border: '1px solid var(--brass)',
                                  color: 'var(--brass)',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                {lang === 'en' ? 'Details' : 'Chi tiết'}
                              </button>
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

          {/* ===================== TAB 3: STABLES ===================== */}
          {activeTab === 'stables' && (
            <div>
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${stableFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStableFilter('ALL')}
                  >
                    {lang === 'en' ? 'All Stalls' : 'Tất cả ô chuồng'} <span className="pill-count">{stables.length}</span>
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
                  <button
                    onClick={() => {
                      const nextCode = `C${stables.filter(s => s.block === 'Block C').length + 1}`;
                      setNewStallData(prev => ({ ...prev, stall_code: nextCode }));
                      setShowAddStallModal(true);
                    }}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {lang === 'en' ? '+ Add New Stall' : '+ Tạo ô chuồng mới'}
                  </button>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {filteredStables.map(s => {
                    const isOccupied = s.status === 'OCCUPIED';
                    const isAvailable = s.status === 'AVAILABLE';

                    return (
                      <div key={s.stall_code} className="facility-card" style={{ padding: '0 0 20px 0', overflow: 'hidden' }}>
                        {/* Hình ảnh banner CÁI CHUỒNG NGỰA (Equine Stall / Barn) */}
                        <div style={{
                          position: 'relative',
                          height: '175px',
                          width: '100%',
                          overflow: 'hidden',
                          background: 'var(--bg-secondary)'
                        }}>
                          <img
                            src={s.stall_image}
                            alt={`Chuồng ${s.stall_code}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              transition: 'transform 0.4s ease'
                            }}
                            className="stall-horse-banner-img"
                            onError={(e) => {
                              e.target.src = '/images/stall_simulation_vacant.jpg';
                            }}
                          />
                          {/* Lớp phủ gradient và thông tin ô chuồng trên ảnh */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '14px 16px'
                          }}>
                            {/* Dòng trên: Badge Khu vực & Mã ô chuồng */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                background: isOccupied ? 'rgba(201, 162, 39, 0.95)' : 'rgba(100, 116, 139, 0.85)',
                                backdropFilter: 'blur(6px)',
                                color: isOccupied ? '#14100A' : '#ffffff',
                                fontWeight: 800,
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                letterSpacing: '0.05em'
                              }}>
                                {s.block.toUpperCase()}
                              </span>
                              <span style={{
                                background: 'rgba(0, 0, 0, 0.7)',
                                backdropFilter: 'blur(6px)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '12px',
                                padding: '3px 10px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }}>
                                {s.stall_code}
                              </span>
                            </div>

                            {/* Dòng dưới trên ảnh: Tên Ô Chuồng & Trạng thái ô */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                  {lang === 'en' ? `Pro Stall Specification · ${s.area}` : `Tiêu chuẩn Ô Chuồng · ${s.area}`}
                                </span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                  {lang === 'en' ? `Barn Stall ${s.stall_code}` : `Ô Chuồng ${s.stall_code}`}
                                </h4>
                              </div>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: isOccupied ? '#10B981' : isAvailable ? '#3B82F6' : '#EF4444',
                                color: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                              }}>
                                {isOccupied ? (lang === 'en' ? 'OCCUPIED' : 'CÓ CHIẾN MÃ') : isAvailable ? (lang === 'en' ? 'VACANT' : 'TRỐNG') : (lang === 'en' ? 'SERVICE' : 'BẢO TRÌ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Nội dung chi tiết của thẻ ô chuồng */}
                        <div style={{ padding: '16px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h3 className="facility-card-title" style={{ margin: 0, fontSize: '16px' }}>
                            {lang === 'en' ? `Barn Stall ${s.stall_code}` : `Ô Chuồng ${s.stall_code}`}
                          </h3>
                          <p className="facility-card-desc" style={{ margin: 0, fontSize: '13px', minHeight: '38px', lineHeight: '1.45' }}>
                            {isOccupied
                              ? (lang === 'en' ? `Housing racehorse ${s.horse}. Premium equine amenities.` : `Đang nuôi dưỡng chiến mã ${s.horse}. Chuẩn tiện nghi cao cấp.`)
                              : (lang === 'en' ? 'Clean empty stall ready for horse intake.' : 'Ô chuồng trống sạch sẽ, sẵn sàng phân bổ.')}
                          </p>

                          {/* Khối thông tin Chiến mã & Khu chuồng định dạng cân bằng, chống gãy chữ */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '10px 12px',
                            background: 'rgba(255, 255, 255, 0.025)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            margin: '2px 0'
                          }}>
                            {/* Hàng 1: Chiến mã lưu trú */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: '26px' }}>
                              <span style={{ fontSize: '12.5px', color: 'var(--paper-dim)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="bullet-dot" style={{ flexShrink: 0 }} />
                                {lang === 'en' ? 'Resident horse:' : 'Chiến mã lưu trú:'}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', overflow: 'hidden' }}>
                                {isOccupied && s.horse_avatar && (
                                  <img
                                    src={s.horse_avatar}
                                    alt={s.horse}
                                    style={{
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                      border: '1px solid var(--brass)'
                                    }}
                                    onError={(e) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80';
                                    }}
                                  />
                                )}
                                <b style={{ color: isOccupied ? 'var(--brass)' : 'var(--paper-dim)', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                                  {s.horse}
                                </b>
                              </div>
                            </div>

                            {/* Hàng 2: Khu chuồng & Giống loài */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12.5px', borderTop: '1px dashed var(--line)', paddingTop: '6px' }}>
                              <span style={{ color: 'var(--paper-dim)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="bullet-dot" style={{ flexShrink: 0 }} />
                                {lang === 'en' ? 'Barn block:' : 'Khu chuồng:'} <b style={{ color: 'var(--paper)' }}>{s.block}</b>
                              </span>
                              {isOccupied && s.breed && s.breed !== 'Vacant' && (
                                <span style={{
                                  fontSize: '11px',
                                  color: 'var(--paper-dim)',
                                  background: 'var(--bg-secondary)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--line)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {s.breed}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="facility-specs-grid" style={{ margin: 0 }}>
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

                          <div className="facility-price-box" style={{ margin: 0 }}>
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

                          <div className="facility-card-actions" style={{ margin: 0, paddingTop: '4px' }}>
                            <div className="actions-left" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                className="facility-btn-action"
                                onClick={() => handleOpenChangeHorse(s)}
                                style={{
                                  background: 'rgba(201, 162, 39, 0.15)',
                                  border: '1px solid var(--brass)',
                                  color: 'var(--brass)',
                                  fontWeight: 600
                                }}
                              >
                                {lang === 'en' ? 'Change Horse' : 'Đổi chiến mã'}
                              </button>
                              <button
                                className="facility-btn-action"
                                onClick={() => handleToggleStable(s.stall_code)}
                              >
                                {lang === 'en' ? 'Toggle Status' : 'Đổi trạng thái'}
                              </button>
                              <button
                                className="facility-btn-action"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  color: '#EF4444',
                                  fontWeight: 600
                                }}
                                onClick={() => handleOpenDeleteStall(s)}
                                title={lang === 'en' ? 'Delete stall' : 'Xóa ô chuồng'}
                              >
                                {lang === 'en' ? 'Delete' : 'Xóa'}
                              </button>
                            </div>
                            <span className="facility-link-action" style={{ cursor: 'default' }}>
                              {s.block} →
                            </span>
                          </div>
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
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall Image & Code' : 'Ảnh Chuồng & Mã Ô'}</th>
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
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={s.stall_image}
                                  alt={`Chuồng ${s.stall_code}`}
                                  style={{
                                    width: '54px',
                                    height: '42px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--line)',
                                    flexShrink: 0,
                                    background: 'var(--bg-secondary)'
                                  }}
                                  onError={(e) => {
                                    e.target.src = '/images/stall_simulation_vacant.jpg';
                                  }}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '14px' }}>
                                    {lang === 'en' ? 'Stall ' : 'Ô '}{s.stall_code}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                    {s.area} · Pro Stall
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{s.block}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isOccupied && s.horse_avatar && (
                                  <img
                                    src={s.horse_avatar}
                                    alt={s.horse}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '1px solid var(--line)',
                                      flexShrink: 0
                                    }}
                                    onError={(e) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80';
                                    }}
                                  />
                                )}
                                <div>
                                  <div style={{ color: isOccupied ? 'var(--brass)' : 'var(--paper-dim)', fontWeight: 700, fontSize: '13.5px' }}>
                                    {s.horse}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                    {isOccupied ? (s.breed || 'Thoroughbred') : (lang === 'en' ? 'Vacant Stall' : 'Ô trống sẵn sàng')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                background: isOccupied ? 'rgba(201, 162, 39, 0.12)' : isAvailable ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: isOccupied ? 'var(--brass)' : isAvailable ? '#3B82F6' : '#EF4444',
                                border: `1px solid ${isOccupied ? 'var(--brass)' : isAvailable ? '#3B82F6' : '#EF4444'}`
                              }}>
                                {isOccupied ? (lang === 'en' ? 'Occupied' : 'Đang dùng') : isAvailable ? (lang === 'en' ? 'Available' : 'Còn trống') : (lang === 'en' ? 'Maintenance' : 'Bảo trì')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleOpenChangeHorse(s)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'rgba(201, 162, 39, 0.15)',
                                    border: '1px solid var(--brass)',
                                    borderRadius: '6px',
                                    color: 'var(--brass)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {lang === 'en' ? 'Change Horse' : 'Đổi chiến mã'}
                                </button>
                                <button
                                  onClick={() => handleToggleStable(s.stall_code)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--line)',
                                    borderRadius: '6px',
                                    color: 'var(--paper)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {lang === 'en' ? 'Toggle Status' : 'Đổi trạng thái'}
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteStall(s)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    borderRadius: '6px',
                                    color: '#EF4444',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  title={lang === 'en' ? 'Delete stall' : 'Xóa ô chuồng'}
                                >
                                  {lang === 'en' ? 'Delete' : 'Xóa'}
                                </button>
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
                          <div className="actions-left" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              className="facility-btn-action"
                              onClick={() => handleOpenEditUser(u)}
                            >
                              {lang === 'en' ? 'Edit' : 'Sửa'}
                            </button>
                            {u.username !== 'admin' && (
                              <>
                                <button
                                  className={`facility-btn-action ${u.status === 'ACTIVE' ? 'btn-danger' : ''}`}
                                  onClick={() => toggleUserStatus(u.user_id)}
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
                                  <>
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
        <div
          onClick={() => { setShowEditUserModal(false); setEditUserData(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 999998,
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
              ⚠️ {lang === 'en'
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
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
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
                <IconStable />
              </span>
              <h3 style={{ fontSize: '19px', margin: 0, color: 'var(--paper)', fontWeight: 700 }}>
                {lang === 'en' ? 'Create New Barn Stall' : 'Khởi Tạo Ô Chuồng Mới'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: '0 0 18px', lineHeight: '1.4' }}>
              {lang === 'en'
                ? 'Register a new barn stall unit into the facility network with standard 3D simulation.'
                : 'Thêm mới ô chuồng nuôi dưỡng chiến mã vào hệ thống trang trại với mô hình 3D chuẩn hóa.'}
            </p>

            <form onSubmit={handleCreateStall} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    {lang === 'en' ? 'Stall Code *' : 'Mã ô chuồng *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'e.g. C1, B7, VIP-1' : 'Ví dụ: C1, B7, VIP-1'}
                    value={newStallData.stall_code}
                    onChange={(e) => setNewStallData({ ...newStallData, stall_code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    {lang === 'en' ? 'Barn Block / Zone' : 'Khu vực chuồng'}
                  </label>
                  <select
                    value={newStallData.block}
                    onChange={(e) => setNewStallData({ ...newStallData, block: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  >
                    <option value="Block A">{lang === 'en' ? 'Block A (Main Training)' : 'Block A (Huấn luyện chính)'}</option>
                    <option value="Block B">{lang === 'en' ? 'Block B (Standard Stalls)' : 'Block B (Chuồng tiêu chuẩn)'}</option>
                    <option value="Block C">{lang === 'en' ? 'Block C (Expansion Zone)' : 'Block C (Khu mở rộng mới)'}</option>
                    <option value="Block VIP">{lang === 'en' ? 'Block VIP (Equine Luxury)' : 'Block VIP (Chuồng cao cấp)'}</option>
                    <option value="Khu Y Tế">{lang === 'en' ? 'Vet Clinic & Quarantine' : 'Khu Y Tế & Cách Ly'}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    {lang === 'en' ? 'Floor Area' : 'Diện tích ô chuồng'}
                  </label>
                  <select
                    value={newStallData.area}
                    onChange={(e) => setNewStallData({ ...newStallData, area: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  >
                    <option value="14 m²">14 m² (Tiêu chuẩn A)</option>
                    <option value="16 m²">16 m² (Rộng rãi B)</option>
                    <option value="18 m²">18 m² (Cao cấp C)</option>
                    <option value="20 m²">20 m² (VIP Suite)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    {lang === 'en' ? 'Dimensions' : 'Kích thước thiết kế'}
                  </label>
                  <select
                    value={newStallData.dim}
                    onChange={(e) => setNewStallData({ ...newStallData, dim: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  >
                    <option value="3.8 x 3.8m">3.8 x 3.8m</option>
                    <option value="4.0 x 4.0m">4.0 x 4.0m</option>
                    <option value="4.2 x 4.2m">4.2 x 4.2m</option>
                    <option value="4.5 x 4.5m">4.5 x 4.5m</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  {lang === 'en' ? 'Initial Status' : 'Trạng thái ban đầu'}
                </label>
                <select
                  value={newStallData.status}
                  onChange={(e) => setNewStallData({ ...newStallData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="AVAILABLE">{lang === 'en' ? 'AVAILABLE (Vacant, clean & ready)' : 'AVAILABLE (Trống, sạch sẽ sẵn sàng phân bổ)'}</option>
                  <option value="OCCUPIED">{lang === 'en' ? 'OCCUPIED (Housing a racehorse)' : 'OCCUPIED (Đang có chiến mã ở)'}</option>
                </select>
              </div>

              {newStallData.status === 'OCCUPIED' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
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
                    <label style={{ fontSize: '12.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
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

              {/* Preview hình ảnh mô phỏng 3D */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                    {lang === 'en' ? '3D Architectural Simulation Preview' : 'Ảnh mô phỏng 3D kiến trúc tự động'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--brass)', fontWeight: 700 }}>
                    {newStallData.status === 'OCCUPIED' ? (lang === 'en' ? 'Occupied Box Stall' : 'Ô có chiến mã') : (lang === 'en' ? 'Standard Vacant Stall' : 'Ô chuồng chuẩn')}
                  </span>
                </div>
                <div style={{ height: '90px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <img
                    src={newStallData.status === 'OCCUPIED' ? '/images/stall_simulation_occupied.jpg' : '/images/stall_simulation_vacant.jpg'}
                    alt="Simulation Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStallModal(false)}
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
                ⚠️ {lang === 'en'
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
                    {lang === 'en' ? '🚫 Vacant Stall (No horse / Empty stall)' : '🚫 Làm trống ô chuồng (Không gán chiến mã)'}
                  </option>
                  <optgroup label={lang === 'en' ? 'Active Racehorses' : 'Danh sách chiến mã hiện có'}>
                    {horses.map(h => (
                      <option key={h.id} value={String(h.id)}>
                        🏇 {h.name} ({h.breed} · Chip: {h.microchip} · Chuồng: {h.stable})
                      </option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">
                    {lang === 'en' ? '✍️ Add custom / new horse name...' : '✍️ Nhập tên chiến mã mới khác...'}
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

              {/* Preview trạng thái và ảnh 3D sau khi đổi */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                    {lang === 'en' ? 'Resulting 3D Simulation' : 'Ảnh mô phỏng 3D sau thay đổi'}
                  </span>
                  <span style={{ fontSize: '11px', color: selectedHorseOption === 'VACANT' ? '#3B82F6' : 'var(--brass)', fontWeight: 700 }}>
                    {selectedHorseOption === 'VACANT' ? (lang === 'en' ? 'Vacant Stall Model' : 'Mô hình chuồng trống') : (lang === 'en' ? 'Occupied Stall Model' : 'Mô hình chuồng có chiến mã')}
                  </span>
                </div>
                <div style={{ height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <img
                    src={selectedHorseOption === 'VACANT' ? '/images/stall_simulation_vacant.jpg' : '/images/stall_simulation_occupied.jpg'}
                    alt="Simulation"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>

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
                        🌐 {lang === 'en' ? 'EN' : 'VI'}
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
                      >
                        ✕
                      </button>
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

    </div>
  );
}
