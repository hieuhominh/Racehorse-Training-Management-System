import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import PaymentModal from '../components/PaymentModal';
import RacehorseFitnessDetailModal from '../components/RacehorseFitnessDetailModal';
import { getHorseFitnessTelemetry, isHorseCalibrating } from '../services/fitnessAlgorithm';
import {
  registerOwnerHorseApi,
  updateOwnerHorseApi,
  deleteOwnerHorseApi,
  getSystemTournamentNominationsApi,
  registerRaceTournamentApi,
  updateRaceNominationStatusApi,
  updateHorsePedigreeApi,
  getStablesApi
} from '../services/api';
import {
  getServiceAssignments,
  assignOrUpdateServiceTeam,
  confirmServiceAssignment,
  setServiceAssignmentStatus,
  removeServiceAssignmentByHorse,
  updateServiceAssignmentPedigree,
  FIXED_TRAINERS_LIST,
  FIXED_VETS_LIST,
  FIXED_GROOMS_LIST
} from '../services/serviceAssignment';
import { notifyHorseDeleted } from '../services/notificationService';
import {
  getJointTrainingSessions,
  bookJointTrainingSession,
  cancelJointTrainingSession,
  checkHorseVetLockStatus,
  TRAINING_TIME_SLOTS,
  getBookedSlotsForTrainer,
  getSlotBookingStatus,
  normalizeDate,
  extractSlotPrefix,
  checkAndAutoResetScheduleAt1800,
  manualResetSchedule1800
} from '../services/jointTrainingService';
import {
  getPersonnelReports,
  createPersonnelReport,
  PREDEFINED_PERSONNEL,
  REPORT_TARGET_ROLES,
  REPORT_CATEGORIES,
  REPORT_SEVERITIES,
  REPORT_STATUSES
} from '../services/reportService';

// Minimalist High-End SVG Icons for Owner Portal (Strict 3-Color Palette)
const IconCalendar = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconCrown = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const IconHorse = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" />
    <path d="M2 17l2-11c.2-1.1 1.2-2 2.3-2h3.4c1 0 1.9.7 2.2 1.6L13 9h4c1.7 0 3 1.3 3 3v2" />
    <circle cx="7" cy="8" r="1" />
  </svg>
);

const IconCamera = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconEdit = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconChart = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconTrophy = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const IconWallet = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <circle cx="16" cy="14" r="1" />
  </svg>
);

const IconShieldHeart = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8a2.5 2.5 0 0 0-2.5 2.5c0 2 2.5 4 2.5 4s2.5-2 2.5-4A2.5 2.5 0 0 0 12 8z" />
  </svg>
);

const IconReceipt = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
    <path d="M14 8H8" />
    <path d="M16 12H8" />
    <path d="M13 16H8" />
  </svg>
);

const IconReportAlert = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconPlus = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Danh mục các giải đấu đua ngựa mở đăng ký (Open Official Tournaments)
const OPEN_TOURNAMENTS = [
  {
    id: 'TOURN-2026-01',
    name: 'Giải Vô Địch Cúp Derby Mùa Thu 2026 (Group 1)',
    track: 'Trường đua Quốc tế Phú Thọ',
    surface: 'Sân cỏ Tự nhiên (Turf)',
    distance: '2.400m',
    date: '15/11/2026',
    entryDeadline: '01/11/2026',
    totalPurse: 1500000000,
    entryFee: 10000000,
    description: 'Giải đấu danh giá nhất năm dành cho các chiến mã 3-5 tuổi. Thể thức chạy nước rút cự ly dài 2.400m.'
  },
  {
    id: 'TOURN-2026-02',
    name: 'Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)',
    track: 'Trường đua Cát Thể Thao',
    surface: 'Sân cát Nén (Dirt)',
    distance: '1.200m',
    date: '28/11/2026',
    entryDeadline: '10/11/2026',
    totalPurse: 800000000,
    entryFee: 5000000,
    description: 'Thử thách guồng chân tốc độ cực đại, yêu cầu chiến mã bứt phá tối thiểu 60 km/h ngay sau cửa xuất phát.'
  },
  {
    id: 'TOURN-2026-03',
    name: 'Giải Tranh Cúp Chiến Mã Trẻ Mùa Mới (Group 3)',
    track: 'Trường đua Quốc tế Phú Thọ',
    surface: 'Sân cỏ Tự nhiên (Turf)',
    distance: '1.600m',
    date: '08/12/2026',
    entryDeadline: '20/11/2026',
    totalPurse: 500000000,
    entryFee: 3000000,
    description: 'Dành riêng cho ngựa đua 3 tuổi mới đăng ký gia nhập chuồng, cơ hội cọ xát và ghi điểm bảng xếp hạng.'
  },
  {
    id: 'TOURN-2026-04',
    name: 'Cúp Mùa Đông Toàn Quốc Listed Cup',
    track: 'Trường đua Cao nguyên',
    surface: 'Sân cát Nén (Dirt)',
    distance: '1.800m',
    date: '24/12/2026',
    entryDeadline: '05/12/2026',
    totalPurse: 400000000,
    entryFee: 2500000,
    description: 'Giải đấu thử nghiệm sức bền thể lực trong điều kiện thời tiết se lạnh cuối năm.'
  }
];

// Danh mục mẫu cho tài khoản Demo VIP (owner_thanh)
const DEMO_HORSES_VIP = [
  {
    id: 1,
    name: 'Bạch Long',
    englishName: 'White Dragon',
    breed: 'Thoroughbred',
    microchip: 'MC-VN-2024-003',
    stable: 'Ô A2',
    gender: 'Ngựa đực (Stallion)',
    ownershipShare: 100,
    ownershipType: 'Độc quyền (100%)',
    trainer: 'Trần Văn Hùng (HLV Trưởng)',
    groom: 'Lê Hoàng Nam (Groom Block A)',
    status: 'ELIGIBLE',
    statusText: 'Đủ chuẩn thi đấu',
    winCount: 4,
    totalStarts: 6,
    totalPrizeEarned: 580000000,
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    pedigree: {
      sire: 'Deep Impact (JPN)',
      sireOfSire: 'Sunday Silence (USA)',
      damOfSire: 'Wind in Her Hair (IRE)',
      sireAchievements: 'Huyền thoại 7 danh hiệu G1, Vô địch Japan Cup',
      dam: 'Northern Dancer (USA)',
      sireOfDam: 'Nearctic (CAN)',
      damOfDam: 'Natalma (USA)',
      damAchievements: 'Dòng máu cái vĩ đại nhất lịch sử đua ngựa thế giới',
      foaled: '2022 (4 tuổi)',
      bloodline: 'Sunday Silence × Northern Dancer (98.5% thuần chủng)',
      origin: 'Nhật Bản (JRA) & Hoa Kỳ',
      studBookNo: 'VTB-SB-2024-001'
    }
  },
  {
    id: 2,
    name: 'Lôi Chấn',
    englishName: 'Thunder Bolt',
    breed: 'Quarter Horse',
    microchip: 'MC-VN-2022-088',
    stable: 'Ô A4',
    gender: 'Ngựa đực thiến (Gelding)',
    ownershipShare: 100,
    ownershipType: 'Độc quyền (100%)',
    trainer: 'Trần Văn Hùng (HLV Trưởng)',
    groom: 'Lê Hoàng Nam (Groom Block A)',
    status: 'ELIGIBLE',
    statusText: 'Đủ chuẩn thi đấu',
    winCount: 3,
    totalStarts: 5,
    totalPrizeEarned: 420000000,
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80',
    pedigree: {
      sire: 'Corona Cartel (USA)',
      sireOfSire: 'Holland Ease (USA)',
      damOfSire: 'Corona Chick (USA)',
      sireAchievements: 'Vua nước rút Quarter Horse, Hall of Fame AQHA',
      dam: 'First Down Dash (USA)',
      sireOfDam: 'Dash For Cash (USA)',
      damOfDam: 'First Prize Rose (USA)',
      damAchievements: 'Dòng dõi vô địch All American Futurity danh giá',
      foaled: '2021 (5 tuổi)',
      bloodline: 'Corona Cartel × Dash For Cash',
      origin: 'Hoa Kỳ (AQHA Stud Book)',
      studBookNo: 'VTB-SB-2022-088'
    }
  },
  {
    id: 3,
    name: 'Phi Yến',
    englishName: 'Flying Swallow',
    breed: 'Thoroughbred',
    microchip: 'MC-VN-2023-009',
    stable: 'Ô A5',
    gender: 'Ngựa cái (Mare)',
    ownershipShare: 50,
    ownershipType: 'Đồng sở hữu (Syndicate 50%)',
    trainer: 'Trần Văn Hùng (HLV Trưởng)',
    groom: 'Lê Hoàng Nam (Groom Block A)',
    status: 'RESTRICTED_CARE',
    statusText: 'Đang khóa y tế: Giãn gân',
    winCount: 2,
    totalStarts: 4,
    totalPrizeEarned: 250000000,
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    pedigree: {
      sire: 'Frankel (GB)',
      sireOfSire: 'Galileo (IRE)',
      damOfSire: 'Kind (IRE)',
      sireAchievements: 'Bất bại 14/14 chặng đua G1, Chiến mã số 1 hành tinh',
      dam: 'Sea The Stars (IRE)',
      sireOfDam: 'Cape Cross (IRE)',
      damOfDam: 'Urban Sea (USA)',
      damAchievements: 'Vô địch Prix de l\'Arc de Triomphe & 2000 Guineas',
      foaled: '2023 (3 tuổi)',
      bloodline: 'Frankel (GB) × Sea The Stars (IRE)',
      origin: 'Anh Quốc (Weatherbys) & Ireland',
      studBookNo: 'VTB-SB-2023-009'
    }
  }
];

const DEMO_RACES_VIP = [
  {
    id: 'RN-2026-01',
    raceName: 'Giải Vô Địch Cúp Derby Mùa Thu 2026',
    track: 'Trường đua Quốc tế Phú Thọ',
    horseName: 'Bạch Long',
    distance: '2.400m (Sân cỏ)',
    date: '15/11/2026',
    estimatedPurse: 800000000,
    nominationStatus: 'APPROVED',
    notes: 'Chủ sở hữu đăng ký trực tiếp. Kỵ mã: Nguyễn Văn Tài',
    trainerFeedback: 'Đạt chuẩn thể lực cự ly 2.400m, nhịp tim ổn định 38 bpm. HLV Trưởng phê duyệt đủ điều kiện xuất phát.',
    reviewedBy: 'HLV Trưởng Trần Văn Hùng',
    reviewedAt: '21/10/2026 09:30'
  },
  {
    id: 'RN-2026-02',
    raceName: 'Cúp Nước Rút Tốc Độ Sprint Cup 1.200m',
    track: 'Trường đua Cát Thể Thao',
    horseName: 'Lôi Chấn',
    distance: '1.200m (Sân cát)',
    date: '28/11/2026',
    estimatedPurse: 450000000,
    nominationStatus: 'PENDING_TRAINER',
    notes: 'Chủ sở hữu đăng ký tham gia cúp nước rút. Đang chờ HLV trưởng thẩm định thể lực.',
    trainerFeedback: '',
    reviewedBy: null,
    reviewedAt: null
  }
];

const DEMO_STATEMENTS_VIP = [
  {
    id: 'STMT-2026-10',
    period: 'Tháng 10/2026',
    date: '20/10/2026',
    horseName: 'Bạch Long (100%)',
    chipId: 'MC-VN-2024-003',
    totalPrizeEarned: 350000000,
    boardingCost: 28000000,
    vetCost: 8000000,
    trainerCommission: 35000000,
    netPayable: 279000000,
    status: 'PAID',
    statusText: 'Đã quyết toán'
  },
  {
    id: 'STMT-2026-09',
    period: 'Tháng 09/2026',
    date: '20/09/2026',
    horseName: 'Lôi Chấn (100%)',
    chipId: 'MC-VN-2022-088',
    totalPrizeEarned: 220000000,
    boardingCost: 28000000,
    vetCost: 6500000,
    trainerCommission: 22000000,
    netPayable: 163500000,
    status: 'PAID',
    statusText: 'Đã quyết toán'
  }
];

const DEMO_HEALTH_VIP = [
  {
    id: 1,
    horseName: 'Bạch Long (Ô A2)',
    issue: 'Kiểm tra sinh hiệu định kỳ & Gọt móng',
    diagnosisBy: 'Bác sĩ Nguyễn An (Trưởng khoa)',
    medications: 'Vaccine Cúm ngựa (Equine Influenza)',
    status: 'CLEARED',
    statusText: 'Khỏe mạnh xuất sắc',
    date: '10/10/2026',
    vetNote: 'Thể lực hoàn hảo, cơ bắp săn chắc, nhịp tim nghỉ 37 bpm. Đủ 100% điều kiện tranh giải.'
  },
  {
    id: 2,
    horseName: 'Phi Yến (Ô A5)',
    issue: 'Giãn gân trước trái cấp độ 2',
    diagnosisBy: 'Bác sĩ Nguyễn An',
    medications: 'Phenylbutazone 20% tiêm IV + Băng ép Cryo',
    status: 'UNDER_TREATMENT',
    statusText: 'Đang điều trị tích cực',
    date: '09/10/2026',
    vetNote: 'Đã kích hoạt Lệnh Khóa Y Tế. Tình trạng tiến triển khả quan, dự kiến hồi phục 100% sau 3 tuần.'
  }
];

// Hàm lọc trùng lặp danh sách chiến mã theo Microchip, ID và Tên
export function deduplicateHorses(list) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenChips = new Set();
  const seenNames = new Set();

  return list.filter(item => {
    if (!item) return false;
    const idKey = (item.id !== undefined && item.id !== null) ? String(item.id).trim() : null;
    const chipKey = (item.microchip || item.chipId) ? String(item.microchip || item.chipId).trim().toLowerCase() : null;
    const nameKey = item.name ? String(item.name).trim().toLowerCase() : null;

    if (idKey && seenIds.has(idKey)) return false;
    if (chipKey && seenChips.has(chipKey)) return false;
    if (nameKey && seenNames.has(nameKey)) return false;

    if (idKey) seenIds.add(idKey);
    if (chipKey) seenChips.add(chipKey);
    if (nameKey) seenNames.add(nameKey);
    return true;
  });
}

export default function OwnerPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_owner');
      if (['horses', 'schedule', 'training', 'races', 'finance', 'vet', 'membership'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'horses';
  }); // 'horses' | 'training' | 'races' | 'finance' | 'vet' | 'membership'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('matruong_tab_owner', activeTab);
    } catch {}
  }, [activeTab]);

  // Kiểm tra tài khoản Demo hay tài khoản mới đăng ký
  const ownerKey = (currentUser?.username || currentUser?.email || String(currentUser?.user_id || 'new_owner')).toLowerCase();
  const isDemoVip = currentUser?.username === 'owner_thanh' || currentUser?.email === 'owner@matruong.vn';

  // Bản quyền Gói VIP (Được bảo lưu vĩnh viễn sau khi đã mua hoặc với tài khoản Demo)
  const [hasVipSubscription, setHasVipSubscription] = useState(() => {
    try {
      if (isDemoVip) return true;
      const stored = localStorage.getItem(`matruong_owner_has_vip_${ownerKey}`);
      if (stored === 'true') return true;
      const key = `matruong_owner_payments_${ownerKey}`;
      const payments = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(payments) && payments.some(p => p.packageName && p.packageName.includes('VIP'))) {
        return true;
      }
      const tier = localStorage.getItem(`matruong_owner_tier_${ownerKey}`);
      if (tier === 'PREMIUM') return true;
      return false;
    } catch {
      return isDemoVip;
    }
  });

  // Quản lý gói Hội viên đang kích hoạt: 'FREE' (Horse 0 Đồng) hoặc 'PREMIUM' (Horse Premium VIP)
  const [membershipTier, setMembershipTier] = useState(() => {
    try {
      const stored = localStorage.getItem(`matruong_owner_tier_${ownerKey}`);
      if (stored) return stored;
      return isDemoVip ? 'PREMIUM' : 'FREE';
    } catch {
      return isDemoVip ? 'PREMIUM' : 'FREE';
    }
  });

  // Tự động bảo lưu bản quyền VIP khi đã sở hữu
  useEffect(() => {
    try {
      if (hasVipSubscription) {
        localStorage.setItem(`matruong_owner_has_vip_${ownerKey}`, 'true');
      }
    } catch {}
  }, [hasVipSubscription, ownerKey]);

  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_owner_billing');
      if (['month', 'year'].includes(saved)) return saved;
    } catch {}
    return 'year';
  }); // 'month' | 'year'

  useEffect(() => {
    try {
      localStorage.setItem('matruong_owner_billing', billingCycle);
    } catch {}
  }, [billingCycle]);

  // Xử lý kích hoạt / đổi gói: Nếu đã sở hữu VIP thì khôi phục ngay không cần mua lại
  const handleSelectTier = (newTier) => {
    if (newTier === 'PREMIUM') {
      if (hasVipSubscription) {
        setMembershipTier('PREMIUM');
        try {
          localStorage.setItem(`matruong_owner_tier_${ownerKey}`, 'PREMIUM');
        } catch {}
        showToast('Đã khôi phục đặc quyền HORSE PREMIUM VIP của bạn! Gói hội viên vẫn còn hiệu lực.', 'KHÔI PHỤC VIP THÀNH CÔNG', 'info');
        setShowMembershipModal(false);
        return;
      }
      setShowMembershipModal(false);
      setShowPaymentModal(true);
      return;
    }

    // Hạ cấp hoặc chuyển tạm về FREE
    setMembershipTier('FREE');
    try {
      localStorage.setItem(`matruong_owner_tier_${ownerKey}`, 'FREE');
    } catch {}
    if (hasVipSubscription) {
      showToast('Đã chuyển tạm về chế độ gói Horse 0 Đồng. Bản quyền VIP của bạn vẫn được bảo lưu và có thể khôi phục bất cứ lúc nào mà không cần thanh toán lại!', 'BẢO LƯU GÓI VIP', 'info');
    } else {
      showToast('Đã chuyển về gói Horse 0 Đồng (Cơ bản).', 'GÓI HỘI VIÊN', 'info');
    }
    setShowMembershipModal(false);
  };

  // Quản lý Nhật ký Giao dịch & Thanh toán của Chủ sở hữu
  const [financeSubTab, setFinanceSubTab] = useState('transactions'); // 'transactions' | 'statements'
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedPaymentReceiptModal, setSelectedPaymentReceiptModal] = useState(null);

  const [paymentHistory, setPaymentHistory] = useState(() => {
    try {
      const key = `matruong_owner_payments_${ownerKey}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (isDemoVip) {
        return [
          {
            transactionId: 'TXN-VIP-889922',
            packageName: 'HORSE PREMIUM VIP (Gói 1 Năm)',
            billingCycle: '1 Năm (365 Ngày)',
            amount: 35000000,
            amountFormatted: '35.000.000 ₫',
            method: 'Ngân hàng Vietcombank (VietQR 24/7)',
            paidAt: '24/10/2026 14:32:10',
            ownerName: currentUser?.full_name || 'Trần Quang Thành',
            status: 'THÀNH CÔNG (PAID)'
          },
          {
            transactionId: 'TXN-VIP-771204',
            packageName: 'Phí đăng kiểm vi chip RFID & Giám định gen',
            billingCycle: 'Giao dịch 1 lần',
            amount: 5000000,
            amountFormatted: '5.000.000 ₫',
            method: 'Thẻ Quốc tế Visa ending *4242',
            paidAt: '15/09/2026 10:15:44',
            ownerName: currentUser?.full_name || 'Trần Quang Thành',
            status: 'THÀNH CÔNG (PAID)'
          }
        ];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Quản lý Modal Xem Chi Tiết Thể Lực & Viễn Trắc EvoLab (Đồng bộ với Huấn Luyện Viên)
  const [fitnessDetailModalHorse, setFitnessDetailModalHorse] = useState(null);

  // Quản lý Điều lệ mua hàng & Ký tên điện tử
  const [termsAndSignatureModal, setTermsAndSignatureModal] = useState(null);
  const [buyerSignature, setBuyerSignature] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' | 'type'
  const [typedSignName, setTypedSignName] = useState('');
  const signatureCanvasRef = useRef(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // Xử lý vẽ chữ ký tay trên Canvas
  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawingSignature(true);
  };

  const draw = (e) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawingSignature(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleConfirmSignatureAndShowInvoice = () => {
    if (!agreeTerms) {
      showToast('Vui lòng tích xác nhận đồng ý với Điều lệ mua hàng & Thỏa thuận dịch vụ VIP', 'CHƯA ĐỒNG Ý ĐIỀU LỆ', 'warning');
      return;
    }
    let sigData = '';
    if (signatureMode === 'draw') {
      if (!hasDrawnSignature) {
        showToast('Vui lòng vẽ chữ ký của bạn vào khung chữ ký trước khi xác nhận', 'CHƯA KÝ TÊN', 'warning');
        return;
      }
      const canvas = signatureCanvasRef.current;
      sigData = canvas ? canvas.toDataURL('image/png') : '';
    } else {
      if (!typedSignName.trim()) {
        showToast('Vui lòng nhập họ và tên để tạo chữ ký điện tử', 'CHƯA NHẬP TÊN', 'warning');
        return;
      }
      sigData = typedSignName.trim();
    }

    const updatedReceipt = {
      ...termsAndSignatureModal,
      signatureType: signatureMode,
      signatureData: sigData,
      signedAt: new Date().toLocaleString('vi-VN'),
      termsAgreed: true
    };

    setBuyerSignature(sigData);
    setTermsAndSignatureModal(null);
    setSelectedPaymentReceiptModal(updatedReceipt);
    showToast('Ký tên điều lệ thành công! Hóa đơn điện tử chi tiết đã được khởi tạo.', 'KÝ TÊN THÀNH CÔNG', 'info');
  };

  const handlePaymentSuccess = (receipt) => {
    setMembershipTier('PREMIUM');
    setHasVipSubscription(true);
    setPaymentHistory(prev => [receipt, ...prev]);
    setShowPaymentModal(false);
    setShowMembershipModal(false);
    // Chuyển sang màn hình Điều Lệ Mua Hàng & Ký Tên trước khi xem hóa đơn
    setTermsAndSignatureModal(receipt);
    setAgreeTerms(false);
    setHasDrawnSignature(false);
    setTypedSignName(currentUser?.full_name || receipt.ownerName || 'Hồ Minh Hiếu');
    try {
      localStorage.setItem(`matruong_owner_tier_${ownerKey}`, 'PREMIUM');
      localStorage.setItem(`matruong_owner_has_vip_${ownerKey}`, 'true');
      const key = `matruong_owner_payments_${ownerKey}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([receipt, ...existing]));
    } catch {}
  };

  // Đồng hồ thời gian thực (Real-time Clock)
  const [realTimeClock, setRealTimeClock] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setRealTimeClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Danh sách giáo án / bài tập từ Huấn luyện viên
  const [trainerWorkouts, setTrainerWorkouts] = useState(() => {
    try {
      const raw = localStorage.getItem('matruong_trainer_programs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    const handleSyncPrograms = () => {
      try {
        const raw = localStorage.getItem('matruong_trainer_programs');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setTrainerWorkouts(parsed);
        }
      } catch {}
    };
    window.addEventListener('storage', handleSyncPrograms);
    window.addEventListener('trainer-programs-updated', handleSyncPrograms);
    return () => {
      window.removeEventListener('storage', handleSyncPrograms);
      window.removeEventListener('trainer-programs-updated', handleSyncPrograms);
    };
  }, []);



  // State 1: Danh sách ngựa của Chủ sở hữu (Lưu riêng theo từng tài khoản, hỗ trợ đầy đủ xóa ngựa và F5)
  const [myHorses, setMyHorses] = useState(() => {
    try {
      let stored = localStorage.getItem(`matruong_owner_horses_${ownerKey}`);
      if (stored === null && isDemoVip) {
        stored = localStorage.getItem('matruong_owner_horses_owner_thanh') ??
                 localStorage.getItem('matruong_owner_horses_6') ??
                 localStorage.getItem('matruong_owner_horses_11');
      }

      if (stored !== null && stored !== undefined) {
        // Tự động làm sạch URL ảnh cũ bị lỗi (404)
        const sanitized = stored.replace(/photo-1598974357801-cbca10065444/g, 'photo-1534447677768-be436bb09401');
        const parsed = JSON.parse(sanitized);
        if (Array.isArray(parsed)) {
          const deduped = deduplicateHorses(parsed);
          const fixed = deduped.map(item => {
            if (item && item.name === 'Bạch Long' && (!item.avatar || item.avatar.includes('photo-1598974357801-cbca10065444'))) {
              return { ...item, avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80' };
            }
            return item;
          });
          localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(fixed));
          if (isDemoVip) {
            localStorage.setItem('matruong_owner_horses_owner_thanh', JSON.stringify(fixed));
            localStorage.setItem('matruong_owner_horses_6', JSON.stringify(fixed));
            localStorage.setItem('matruong_owner_horses_11', JSON.stringify(fixed));
          }
          return fixed;
        }
      }

      // Chỉ khởi tạo danh mục mẫu lần đầu tiên khi chưa từng lưu vào LocalStorage
      const initial = isDemoVip ? DEMO_HORSES_VIP : [];
      localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(initial));
      if (isDemoVip) {
        localStorage.setItem('matruong_owner_horses_owner_thanh', JSON.stringify(initial));
        localStorage.setItem('matruong_owner_horses_6', JSON.stringify(initial));
        localStorage.setItem('matruong_owner_horses_11', JSON.stringify(initial));
      }
      return initial;
    } catch {
      return isDemoVip ? DEMO_HORSES_VIP : [];
    }
  });

  // State: Quản lý lịch hẹn tập luyện chung với Huấn luyện viên
  const [jointSessions, setJointSessions] = useState(() => getJointTrainingSessions());
  const [showJointBookingModal, setShowJointBookingModal] = useState(false);
  const [jointBookingForm, setJointBookingForm] = useState(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return {
      horseId: '',
      trainerUsername: 'trainer_truong',
      sessionDate: tmr.toISOString().split('T')[0],
      sessionTime: '06:00 - 07:00 (Sáng sớm - Bứt tốc cự ly)',
      goal: 'Quan sát trực tiếp sải chân & kiểm tra thể lực cùng HLV',
      ownerNotes: ''
    };
  });

  // Tự động chọn chiến mã đầu tiên nếu form chưa chọn
  useEffect(() => {
    if (!jointBookingForm.horseId && myHorses.length > 0) {
      setJointBookingForm(prev => ({
        ...prev,
        horseId: String(myHorses[0].id)
      }));
    }
  }, [myHorses]);

  // Tự động chọn khung giờ hợp lệ nếu khung giờ hiện tại bị trùng lịch hoặc rơi vào giờ nghỉ trưa
  useEffect(() => {
    if (!jointBookingForm.trainerUsername || !jointBookingForm.sessionDate) return;
    const currentPrefix = extractSlotPrefix(jointBookingForm.sessionTime);
    const status = getSlotBookingStatus(currentPrefix, jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
    if (!status.available) {
      const nextAvailable = TRAINING_TIME_SLOTS.find(slot =>
        !slot.isLunch && getSlotBookingStatus(slot.id, jointBookingForm.trainerUsername, jointBookingForm.sessionDate).available
      );
      if (nextAvailable) {
        setJointBookingForm(prev => ({
          ...prev,
          sessionTime: `${nextAvailable.id} (${nextAvailable.desc})`
        }));
      }
    }
  }, [jointBookingForm.trainerUsername, jointBookingForm.sessionDate]);

  // Đồng bộ thời gian thực lịch tập chung
  useEffect(() => {
    const handleSyncJoint = () => setJointSessions(getJointTrainingSessions());
    window.addEventListener('matruong_joint_training_updated', handleSyncJoint);
    window.addEventListener('storage', handleSyncJoint);
    return () => {
      window.removeEventListener('matruong_joint_training_updated', handleSyncJoint);
      window.removeEventListener('storage', handleSyncJoint);
    };
  }, []);

  // Tự động kiểm tra cơ chế Reset lịch lúc 18h tối (kết thúc chu kỳ ngày tập 06:00 - 18:00)
  useEffect(() => {
    checkAndAutoResetScheduleAt1800();
    const interval18h = setInterval(() => {
      checkAndAutoResetScheduleAt1800();
    }, 30000);
    return () => clearInterval(interval18h);
  }, []);

  const handleReset18hSchedule = () => {
    const res = manualResetSchedule1800(jointBookingForm.sessionDate, jointBookingForm.trainerUsername);
    setJointSessions(getJointTrainingSessions());
    showToast(
      `Đã kích hoạt Reset lịch lúc 18:00! Toàn bộ các khung giờ ngày ${jointBookingForm.sessionDate} đã được mở trống, gỡ bỏ bôi đen và sẵn sàng nhận lượt đặt mới.`,
      'RESET LỊCH TRỐNG 18:00',
      'success'
    );
  };

  const handleOpenJointBookingModal = (horse = null) => {
    const defaultHorse = horse || (myHorses.length > 0 ? myHorses[0] : null);
    const defaultTrainer = defaultHorse?.trainer?.toLowerCase().includes('nghĩa')
      ? 'trainer_nghia'
      : defaultHorse?.trainer?.toLowerCase().includes('anh')
      ? 'trainer_anh'
      : 'trainer_truong';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setJointBookingForm({
      horseId: defaultHorse ? String(defaultHorse.id) : '',
      trainerUsername: defaultTrainer,
      sessionDate: tomorrowStr,
      sessionTime: '06:00 - 07:00 (Sáng sớm - Bứt tốc cự ly)',
      goal: 'Quan sát trực tiếp sải chân & kiểm tra thể lực cùng HLV',
      ownerNotes: ''
    });
    setActiveTab('schedule');
  };

  const handleSubmitJointBooking = (e) => {
    if (e) e.preventDefault();
    if (!jointBookingForm.horseId) {
      showToast('Vui lòng chọn chiến mã để đặt lịch tập!', 'CHƯA CHỌN NGỰA', 'warning');
      return;
    }

    const selectedHorse = myHorses.find(h => String(h.id) === String(jointBookingForm.horseId)) || myHorses[0];
    if (!selectedHorse) return;

    // Kiểm tra nghiêm ngặt Quyền phủ quyết y tế của Bác sĩ Thú y
    const lockStatus = checkHorseVetLockStatus(selectedHorse.microchip || selectedHorse.id || selectedHorse.name);
    if (lockStatus.isLocked || selectedHorse.isLockedByVet || selectedHorse.status === 'INJURED') {
      showToast(
        `Chiến mã "${selectedHorse.name}" đang bị Bác sĩ Thú y KHÓA Y TẾ / CẤM TẬP (${lockStatus.reason || 'Chấn thương thể lực'})! Phải chờ Bác sĩ Thú y kiểm tra và dỡ bỏ lệnh khóa thì mới được phép đặt lịch tập luyện chung.`,
        'CẤM TẬP DO KHÓA Y TẾ',
        'error'
      );
      return;
    }

    // Kiểm tra xem khung giờ có bị trùng lịch hoặc giờ nghỉ trưa không
    const slotPrefix = extractSlotPrefix(jointBookingForm.sessionTime);
    const slotStatus = getSlotBookingStatus(slotPrefix, jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
    if (slotStatus.isLunch) {
      showToast('Khung giờ 11:45 - 13:00 là thời gian nghỉ trưa & bảo dưỡng bãi tập, không thể đặt!', 'KHUNG GIỜ NGHỈ TRƯA', 'warning');
      return;
    }
    if (slotStatus.isBooked) {
      const bookedBy = slotStatus.bookedSession?.ownerName ? ` (${slotStatus.bookedSession.ownerName})` : '';
      showToast(`Khung giờ ${slotPrefix} ngày ${jointBookingForm.sessionDate} đã có người đặt trước${bookedBy}! Khung giờ này đã bị bôi đen và không thể đặt nữa. Vui lòng chọn khung giờ trống khác.`, 'TRÙNG LỊCH - ĐÃ CÓ NGƯỜI ĐẶT', 'warning');
      return;
    }

    const trObj = FIXED_TRAINERS_LIST.find(t => t.username === jointBookingForm.trainerUsername) || FIXED_TRAINERS_LIST[0];

    const result = bookJointTrainingSession({
      horse: selectedHorse,
      trainer: trObj,
      sessionDate: jointBookingForm.sessionDate,
      sessionTime: jointBookingForm.sessionTime,
      goal: jointBookingForm.goal,
      ownerNotes: jointBookingForm.ownerNotes,
      ownerUser: currentUser
    });

    if (!result.success) {
      showToast(result.error, 'LỖI ĐẶT LỊCH', 'error');
      return;
    }

    setJointSessions(getJointTrainingSessions());
    setShowJointBookingModal(false);
    showToast(`Đã gửi yêu cầu đặt lịch tập luyện chung cho chiến mã "${selectedHorse.name}" đến HLV ${trObj.name}!`, 'ĐẶT LỊCH THÀNH CÔNG', 'success');
    setActiveTab('schedule');
  };

  const handleCancelJointSession = (sessionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn tập luyện chung này?')) return;
    cancelJointTrainingSession(sessionId);
    setJointSessions(getJointTrainingSessions());
    showToast('Đã hủy lịch hẹn tập luyện chung.', 'ĐÃ HỦY LỊCH', 'info');
  };

  // State: Quản lý Khiếu nại & Báo cáo Nhân sự (HLV, Bác Sĩ, Chăm Sóc)
  const [personnelReports, setPersonnelReports] = useState(() => getPersonnelReports());
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [reportRoleFilter, setReportRoleFilter] = useState('ALL');
  const [reportForm, setReportForm] = useState({
    targetRole: 'TRAINER',
    targetPersonnelId: 'trainer_truong',
    horseId: '',
    category: 'Thái độ phục vụ & Ứng xử thiếu chuẩn mực',
    severity: 'MEDIUM',
    title: '',
    content: '',
    evidenceNote: ''
  });

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

  // Danh sách báo cáo của riêng Chủ sở hữu này
  const myReports = personnelReports.filter(r => {
    if (!currentUser) return true;
    const curKey = (currentUser.username || currentUser.email || String(currentUser.user_id || '')).toLowerCase();
    return r.ownerKey === curKey || r.ownerName === currentUser.full_name;
  });

  const handleOpenCreateReport = (preselectedRole = 'TRAINER') => {
    const firstPersonnel = PREDEFINED_PERSONNEL.find(p => p.role === preselectedRole) || PREDEFINED_PERSONNEL[0];
    setReportForm({
      targetRole: preselectedRole,
      targetPersonnelId: firstPersonnel.id,
      horseId: myHorses.length > 0 ? String(myHorses[0].id) : '',
      category: 'Thái độ phục vụ & Ứng xử thiếu chuẩn mực',
      severity: 'MEDIUM',
      title: '',
      content: '',
      evidenceNote: ''
    });
    setShowCreateReportModal(true);
  };

  const handleSubmitReport = (e) => {
    if (e) e.preventDefault();
    if (!reportForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề khiếu nại / phản ánh!', 'THIẾU TIÊU ĐỀ', 'warning');
      return;
    }
    if (!reportForm.content.trim()) {
      showToast('Vui lòng mô tả chi tiết nội dung sự việc!', 'THIẾU NỘI DUNG', 'warning');
      return;
    }

    const selectedHorse = myHorses.find(h => String(h.id) === String(reportForm.horseId)) || myHorses[0];

    const res = createPersonnelReport({
      ownerUser: currentUser,
      targetRole: reportForm.targetRole,
      targetPersonnelId: reportForm.targetPersonnelId,
      horse: selectedHorse,
      category: reportForm.category,
      severity: reportForm.severity,
      title: reportForm.title,
      content: reportForm.content,
      evidenceNote: reportForm.evidenceNote
    });

    if (res.success) {
      setPersonnelReports(getPersonnelReports());
      setShowCreateReportModal(false);
      showToast(
        'Khiếu nại của bạn đã được gửi trực tiếp tới Ban Quản Trị (Admin) để thẩm tra và giải quyết!',
        'GỬI KHIẾU NẠI THÀNH CÔNG',
        'success'
      );
      setActiveTab('reports');
    }
  };

  // State 2: Danh sách giải đua đã đăng ký / đề cử
  const [raceNominations, setRaceNominations] = useState(() => {
    try {
      let currentList = [];
      const stored = localStorage.getItem(`matruong_owner_races_${ownerKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) currentList = parsed;
      }
      if (isDemoVip) {
        if (currentList.length === 0) {
          currentList = [...DEMO_RACES_VIP];
        }
      } else {
        // Tài khoản chủ sở hữu mới / thường: Tuyệt đối không lấy dữ liệu mẫu VIP của người khác
        currentList = currentList.filter(item =>
          String(item.ownerKey) === String(ownerKey) &&
          item.ownerKey !== '6' &&
          item.ownerKey !== 'owner_thanh' &&
          item.horseName !== 'Bạch Long' &&
          item.horseName !== 'Lôi Chấn'
        );
      }

      // Hòa nhập tức thời dữ liệu duyệt mới nhất từ Huấn luyện viên trưởng nếu có
      const sysRaw = localStorage.getItem('matruong_system_race_nominations');
      if (sysRaw && currentList.length > 0) {
        const sysList = JSON.parse(sysRaw);
        if (Array.isArray(sysList) && sysList.length > 0) {
          currentList = currentList.map(item => {
            const matched = sysList.find(s => s.id === item.id || (s.horseName === item.horseName && s.raceName === item.raceName));
            if (matched) {
              return {
                ...item,
                nominationStatus: matched.nominationStatus || item.nominationStatus,
                trainerFeedback: matched.trainerFeedback !== undefined ? matched.trainerFeedback : item.trainerFeedback,
                reviewedBy: matched.reviewedBy || item.reviewedBy,
                reviewedAt: matched.reviewedAt || item.reviewedAt
              };
            }
            return item;
          });
        }
      }

      return currentList;
    } catch {
      return isDemoVip ? DEMO_RACES_VIP : [];
    }
  });

  // State 3: Dữ liệu Viễn trắc & Huấn luyện
  const [trainingTelemetry, setTrainingTelemetry] = useState(() => {
    try {
      const stored = localStorage.getItem(`matruong_owner_telemetry_${ownerKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return isDemoVip ? [
        {
          id: 1,
          horseName: 'Bạch Long',
          stable: 'Ô A2',
          sessionDate: '24/10/2026',
          maxSpeed: '64.8 km/h',
          avgSpeed: '58.2 km/h',
          peakHeartRate: '215 bpm',
          recoveryHeartRate: '72 bpm (sau 15p)',
          distanceMeters: '1.800 m',
          readinessScore: '9.6 / 10',
          trainerFeedback: 'Phong độ đỉnh cao, guồng chân bứt tốc đoạn nước rút rất dứt khoát. Sẵn sàng cho giải Cúp Derby.'
        },
        {
          id: 2,
          horseName: 'Lôi Chấn',
          stable: 'Ô A4',
          sessionDate: '23/10/2026',
          maxSpeed: '62.4 km/h',
          avgSpeed: '55.0 km/h',
          peakHeartRate: '208 bpm',
          recoveryHeartRate: '75 bpm (sau 15p)',
          distanceMeters: '1.400 m',
          readinessScore: '9.0 / 10',
          trainerFeedback: 'Khởi động tốt, sức bền ổn định trên sân cát khô. Duy trì cự ly trung bình.'
        }
      ] : [];
    } catch {
      return [];
    }
  });

  // State 4: Báo cáo tài chính
  const [statements] = useState(() => {
    try {
      const stored = localStorage.getItem(`matruong_owner_stmts_${ownerKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return isDemoVip ? DEMO_STATEMENTS_VIP : [];
    } catch {
      return [];
    }
  });

  // State 5: Nhật ký y tế
  const [healthLogs, setHealthLogs] = useState(() => {
    try {
      const stored = localStorage.getItem(`matruong_owner_health_${ownerKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return isDemoVip ? DEMO_HEALTH_VIP : [];
    } catch {
      return [];
    }
  });

  // Đảm bảo đồng bộ và chống nhân bản chiến mã khi chuyển đổi vai trò/tài khoản
  useEffect(() => {
    try {
      let stored = localStorage.getItem(`matruong_owner_horses_${ownerKey}`);
      if (stored === null && isDemoVip) {
        stored = localStorage.getItem('matruong_owner_horses_owner_thanh') ??
                 localStorage.getItem('matruong_owner_horses_6') ??
                 localStorage.getItem('matruong_owner_horses_11');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const deduped = deduplicateHorses(parsed);
          setMyHorses(deduped);
          if (deduped.length !== parsed.length) {
            localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(deduped));
          }
          return;
        }
      }
      if (isDemoVip) {
        setMyHorses(DEMO_HORSES_VIP);
      } else {
        setMyHorses([]);
      }
    } catch {}
  }, [ownerKey, isDemoVip]);

  // Đồng bộ lưu localStorage khi state thay đổi
  useEffect(() => {
    try {
      const deduped = deduplicateHorses(myHorses);
      localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(deduped));
      if (isDemoVip) {
        localStorage.setItem('matruong_owner_horses_owner_thanh', JSON.stringify(deduped));
        localStorage.setItem('matruong_owner_horses_6', JSON.stringify(deduped));
        localStorage.setItem('matruong_owner_horses_11', JSON.stringify(deduped));
      }
    } catch {}
  }, [myHorses, ownerKey, isDemoVip]);

  useEffect(() => {
    const listToSave = isDemoVip
      ? raceNominations
      : raceNominations.filter(item =>
          String(item.ownerKey) === String(ownerKey) &&
          item.ownerKey !== '6' &&
          item.ownerKey !== 'owner_thanh' &&
          item.horseName !== 'Bạch Long' &&
          item.horseName !== 'Lôi Chấn'
        );
    localStorage.setItem(`matruong_owner_races_${ownerKey}`, JSON.stringify(listToSave));
  }, [raceNominations, ownerKey, isDemoVip]);

  useEffect(() => {
    localStorage.setItem(`matruong_owner_telemetry_${ownerKey}`, JSON.stringify(trainingTelemetry));
  }, [trainingTelemetry, ownerKey]);

  useEffect(() => {
    localStorage.setItem(`matruong_owner_stmts_${ownerKey}`, JSON.stringify(statements));
  }, [statements, ownerKey]);

  useEffect(() => {
    localStorage.setItem(`matruong_owner_health_${ownerKey}`, JSON.stringify(healthLogs));
  }, [healthLogs, ownerKey]);

  // Đồng bộ thời gian thực trạng thái đề cử giải đua & phê duyệt của Huấn luyện viên trưởng
  useEffect(() => {
    let isMounted = true;
    const syncNominations = () => {
      getSystemTournamentNominationsApi().then(sysList => {
        if (!isMounted || !Array.isArray(sysList) || sysList.length === 0) return;

        setRaceNominations(prev => {
          let base = Array.isArray(prev) ? prev : [];
          if (!isDemoVip) {
            // Loại bỏ hoàn toàn các đề cử không thuộc tài khoản này
            base = base.filter(item =>
              String(item.ownerKey) === String(ownerKey) &&
              item.ownerKey !== '6' &&
              item.ownerKey !== 'owner_thanh' &&
              item.horseName !== 'Bạch Long' &&
              item.horseName !== 'Lôi Chấn'
            );
          } else if (base.length === 0) {
            base = [...DEMO_RACES_VIP];
          }

          let hasChanges = false;

          const updated = base.map(item => {
            const matched = sysList.find(s => s.id === item.id || (s.horseName === item.horseName && s.raceName === item.raceName));
            if (matched) {
              if (
                item.nominationStatus !== matched.nominationStatus ||
                item.horseName !== matched.horseName ||
                item.trainerAssigned !== matched.trainerAssigned ||
                item.trainerFeedback !== matched.trainerFeedback ||
                item.reviewedBy !== matched.reviewedBy ||
                item.reviewedAt !== matched.reviewedAt
              ) {
                hasChanges = true;
                return {
                  ...item,
                  horseName: matched.horseName,
                  assignedHorseName: matched.assignedHorseName,
                  assignedHorseId: matched.assignedHorseId,
                  assignedHorseStall: matched.assignedHorseStall,
                  trainerAssigned: matched.trainerAssigned,
                  delegatedToTrainer: matched.delegatedToTrainer,
                  nominationStatus: matched.nominationStatus,
                  trainerFeedback: matched.trainerFeedback,
                  reviewedBy: matched.reviewedBy,
                  reviewedAt: matched.reviewedAt,
                  jockey: matched.jockey || item.jockey
                };
              }
            }
            return item;
          });

          // Tự động kéo các đề cử giải mới của chủ sở hữu nếu có trong sysList mà chưa có trong state
          sysList.forEach(sysItem => {
            const isBelongsToOwner = isDemoVip
              ? (
                  String(sysItem.ownerKey) === String(ownerKey) ||
                  sysItem.ownerKey === 'owner_thanh' ||
                  sysItem.ownerKey === '6' ||
                  sysItem.ownerName?.includes('Thành') ||
                  sysItem.horseName === 'Bạch Long' ||
                  sysItem.horseName === 'Lôi Chấn'
                )
              : (
                  String(sysItem.ownerKey) === String(ownerKey) &&
                  sysItem.ownerKey !== '6' &&
                  sysItem.ownerKey !== 'owner_thanh' &&
                  sysItem.horseName !== 'Bạch Long' &&
                  sysItem.horseName !== 'Lôi Chấn'
                );

            const alreadyInList = updated.some(u => u.id === sysItem.id || (u.horseName === sysItem.horseName && u.raceName === sysItem.raceName));
            if (isBelongsToOwner && !alreadyInList) {
              hasChanges = true;
              updated.push(sysItem);
            }
          });

          if (updated.length !== prev.length || hasChanges) {
            return updated;
          }
          return prev;
        });
      }).catch(() => {});
    };

    syncNominations();

    const handleStorageEvent = (e) => {
      if (e.key === 'matruong_system_race_nominations' || (e.key && e.key.startsWith('matruong_owner_races_'))) {
        syncNominations();
      }
    };

    window.addEventListener('matruong_nomination_updated', syncNominations);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('focus', syncNominations);

    return () => {
      isMounted = false;
      window.removeEventListener('matruong_nomination_updated', syncNominations);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('focus', syncNominations);
    };
  }, [ownerKey, isDemoVip]);

  // Các Modal State
  const [selectedStatementModal, setSelectedStatementModal] = useState(null);
  const [selectedHorsePedigree, setSelectedHorsePedigree] = useState(null);
  const [pedigreeMode, setPedigreeMode] = useState('view'); // 'view' | 'edit'
  const [pedigreeFormData, setPedigreeFormData] = useState({
    sire: '',
    sireOfSire: '',
    damOfSire: '',
    sireAchievements: '',
    dam: '',
    sireOfDam: '',
    damOfDam: '',
    damAchievements: '',
    foaled: '',
    bloodline: '',
    origin: '',
    studBookNo: ''
  });

  // Mở Modal Phả hệ và chuẩn bị dữ liệu 3 thế hệ
  const handleOpenPedigreeModal = (horse) => {
    setSelectedHorsePedigree(horse);
    setPedigreeMode('view');
    setPedigreeFormData({
      sire: horse.pedigree?.sire || '',
      sireOfSire: horse.pedigree?.sireOfSire || '',
      damOfSire: horse.pedigree?.damOfSire || '',
      sireAchievements: horse.pedigree?.sireAchievements || '',
      dam: horse.pedigree?.dam || '',
      sireOfDam: horse.pedigree?.sireOfDam || '',
      damOfDam: horse.pedigree?.damOfDam || '',
      damAchievements: horse.pedigree?.damAchievements || '',
      foaled: horse.pedigree?.foaled || horse.gender?.match(/\d+\s*tuổi/)?.[0] || '2023 (3 tuổi)',
      bloodline: horse.pedigree?.bloodline || '',
      origin: horse.pedigree?.origin || '',
      studBookNo: horse.pedigree?.studBookNo || `VTB-SB-${horse.id || Date.now().toString().slice(-4)}`
    });
  };

  // Chủ sở hữu lưu cập nhật phả hệ cho ngựa
  const handleSavePedigree = (e) => {
    if (e) e.preventDefault();
    if (!selectedHorsePedigree) return;

    const updatedPedigree = {
      ...selectedHorsePedigree.pedigree,
      sire: pedigreeFormData.sire.trim() || 'Chưa cập nhật',
      sireOfSire: pedigreeFormData.sireOfSire.trim() || 'Chưa cập nhật',
      damOfSire: pedigreeFormData.damOfSire.trim() || 'Chưa cập nhật',
      sireAchievements: pedigreeFormData.sireAchievements.trim(),
      dam: pedigreeFormData.dam.trim() || 'Chưa cập nhật',
      sireOfDam: pedigreeFormData.sireOfDam.trim() || 'Chưa cập nhật',
      damOfDam: pedigreeFormData.damOfDam.trim() || 'Chưa cập nhật',
      damAchievements: pedigreeFormData.damAchievements.trim(),
      foaled: pedigreeFormData.foaled.trim() || selectedHorsePedigree.pedigree?.foaled || '2023',
      bloodline: pedigreeFormData.bloodline.trim(),
      origin: pedigreeFormData.origin.trim(),
      studBookNo: pedigreeFormData.studBookNo.trim()
    };

    const updatedHorse = {
      ...selectedHorsePedigree,
      pedigree: updatedPedigree
    };

    setMyHorses(prev => {
      const next = deduplicateHorses(prev.map(h => h.id === selectedHorsePedigree.id ? updatedHorse : h));
      try {
        localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    updateOwnerHorseApi(ownerKey, updatedHorse).catch(() => {});
    updateHorsePedigreeApi(ownerKey, updatedHorse.id, updatedPedigree).catch(() => {});
    updateServiceAssignmentPedigree(updatedHorse.name || updatedHorse.microchip, updatedPedigree);
    try {
      window.dispatchEvent(new CustomEvent('matruong_pedigree_updated', {
        detail: { horseIdentifier: updatedHorse.name || updatedHorse.microchip, pedigree: updatedPedigree }
      }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    setSelectedHorsePedigree(updatedHorse);
    setPedigreeMode('view');
    showToast(`Đã lưu và cập nhật cây phả hệ cho chiến mã "${updatedHorse.name}" thành công!`, 'CẬP NHẬT PHẢ HỆ THÀNH CÔNG', 'success');
  };

  // State: Đội ngũ nhân sự phục vụ (3 HLV, 3 BS Thú y, 3 Groom) và trạng thái xác nhận
  const [serviceAssignments, setServiceAssignments] = useState(() => getServiceAssignments());

  useEffect(() => {
    const handleUpdate = () => {
      setServiceAssignments(getServiceAssignments());
    };
    window.addEventListener('matruong_service_assignment_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('matruong_service_assignment_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // State: Modal Đổi Đội Ngũ Phục Vụ
  const [teamModalHorse, setTeamModalHorse] = useState(null);
  const [selectedTeamStaff, setSelectedTeamStaff] = useState({
    trainerUsername: 'trainer_truong',
    vetUsername: 'vet_an',
    groomUsername: 'groom_nam'
  });

  const handleOpenTeamModal = (horse) => {
    const current = serviceAssignments.find(a =>
      (a.microchip && a.microchip === horse.microchip) ||
      (a.horseName && a.horseName.toLowerCase() === horse.name?.toLowerCase()) ||
      String(a.id) === String(horse.id)
    );
    setTeamModalHorse(horse);
    setSelectedTeamStaff({
      trainerUsername: current?.trainerUsername || 'trainer_truong',
      vetUsername: current?.vetUsername || 'vet_an',
      groomUsername: current?.groomUsername || 'groom_nam'
    });
  };

  const handleSaveTeamModal = (e, autoConfirmAll = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!teamModalHorse) return;

    assignOrUpdateServiceTeam(teamModalHorse, selectedTeamStaff, currentUser);

    if (autoConfirmAll) {
      confirmServiceAssignment(teamModalHorse.name || teamModalHorse.microchip, 'TRAINER', selectedTeamStaff.trainerUsername);
      confirmServiceAssignment(teamModalHorse.name || teamModalHorse.microchip, 'VET', selectedTeamStaff.vetUsername);
      confirmServiceAssignment(teamModalHorse.name || teamModalHorse.microchip, 'GROOM', selectedTeamStaff.groomUsername);
    }

    const trObj = FIXED_TRAINERS_LIST.find(t => t.username === selectedTeamStaff.trainerUsername);
    const vtObj = FIXED_VETS_LIST.find(v => v.username === selectedTeamStaff.vetUsername);
    const gmObj = FIXED_GROOMS_LIST.find(g => g.username === selectedTeamStaff.groomUsername);

    setMyHorses(prev => {
      const mapped = prev.map(h => {
        if (h.id === teamModalHorse.id) {
          return {
            ...h,
            trainer: trObj ? trObj.name : h.trainer,
            vet: vtObj ? vtObj.name : h.vet,
            groom: gmObj ? gmObj.name : h.groom,
            trainerStatus: autoConfirmAll ? 'CONFIRMED' : h.trainerStatus,
            vetStatus: autoConfirmAll ? 'CONFIRMED' : h.vetStatus,
            groomStatus: autoConfirmAll ? 'CONFIRMED' : h.groomStatus,
            trainerConfirmed: autoConfirmAll ? true : h.trainerConfirmed,
            vetConfirmed: autoConfirmAll ? true : h.vetConfirmed,
            groomConfirmed: autoConfirmAll ? true : h.groomConfirmed
          };
        }
        return h;
      });
      const next = deduplicateHorses(mapped);
      try {
        localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (autoConfirmAll) {
      showToast(`Đã lưu đội ngũ và xác nhận phục vụ đủ cả 3 vai trò cho "${teamModalHorse.name}"! Trạng thái: ✓ Đã xác nhận.`, 'ĐÃ XÁC NHẬN ĐẦY ĐỦ', 'success');
    } else {
      showToast(`Đã chỉ định đội ngũ phục vụ mới cho "${teamModalHorse.name}"! HLV, Bác sĩ và Groom đã nhận yêu cầu xác nhận.`, 'ĐÃ CẬP NHẬT ĐỘI NGŨ', 'success');
    }
    setTeamModalHorse(null);
  };

  const handleToggleRoleConfirm = (horse, roleType, staffName) => {
    const asgn = serviceAssignments.find(a =>
      (horse.microchip && a.microchip && a.microchip.trim().toLowerCase() === horse.microchip.trim().toLowerCase()) ||
      (horse.name && a.horseName && a.horseName.trim().toLowerCase() === horse.name.trim().toLowerCase()) ||
      (horse.id && a.id && String(a.id) === String(horse.id))
    );

    let currentStatus = 'PENDING';
    if (roleType === 'TRAINER') currentStatus = asgn?.trainerStatus || horse.trainerStatus;
    else if (roleType === 'VET') currentStatus = asgn?.vetStatus || horse.vetStatus;
    else if (roleType === 'GROOM') currentStatus = asgn?.groomStatus || horse.groomStatus;

    const roleLabel = roleType === 'TRAINER' ? 'HLV' : roleType === 'VET' ? 'Bác sĩ Thú Y' : 'Groom Chăm Sóc';

    if (currentStatus === 'CONFIRMED') {
      const updated = setServiceAssignmentStatus(horse.name || horse.microchip, roleType, 'PENDING');
      setServiceAssignments(updated);
      showToast(`Đã chuyển trạng thái ${roleLabel} (${staffName}) của "${horse.name}" về ⏳ Chờ xác nhận.`, 'CẬP NHẬT TRẠNG THÁI', 'info');
    } else {
      const updated = confirmServiceAssignment(horse.name || horse.microchip, roleType, currentUser?.username || 'admin');
      setServiceAssignments(updated);
      showToast(`Đã xác nhận vai trò ${roleLabel} (${staffName}) phụ trách "${horse.name}" thành công! Trạng thái: ✓ Đã xác nhận.`, 'XÁC NHẬN THÀNH CÔNG', 'success');
    }
  };

  const [showAddHorseModal, setShowAddHorseModal] = useState(false);
  const [showRaceRegisterModal, setShowRaceRegisterModal] = useState(false);
  const [selectedTournamentToRegister, setSelectedTournamentToRegister] = useState(null);
  const [upgradePromptModal, setUpgradePromptModal] = useState(null); // Modal gợi ý nâng cấp VIP khi chạm giới hạn

  // Quản lý danh sách ô chuồng thực tế đồng bộ từ Backend/Admin
  const [allStables, setAllStables] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchStables = () => {
      getStablesApi().then(res => {
        if (isMounted && res && Array.isArray(res.data)) {
          setAllStables(res.data);
        }
      }).catch(() => {});
    };
    fetchStables();

    const handleStablesUpdate = () => {
      fetchStables();
    };

    window.addEventListener('matruong_stables_updated', handleStablesUpdate);
    window.addEventListener('storage', handleStablesUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('matruong_stables_updated', handleStablesUpdate);
      window.removeEventListener('storage', handleStablesUpdate);
    };
  }, []);

  const isStallVip = (stall) => {
    if (!stall) return false;
    if (stall.tier === 'VIP' || stall.is_vip === true) return true;
    const code = String(stall.stall_code || '').toUpperCase();
    const block = String(stall.block || '').toUpperCase();
    return block.includes('VIP') || block.includes('BLOCK A') || block.includes('BLOCK B') || code.startsWith('VIP') || code.startsWith('A') || code.startsWith('B');
  };

  const getStallDisplayName = (s) => {
    const code = s.stall_code || '';
    const block = s.block || '';
    const area = s.area || '';
    return `Ô ${code} (${block}${area ? ` - ${area}` : ''})`;
  };

  // Danh sách chuồng phân chia VIP / Chuồng Thường
  const availableVipStables = useMemo(() => {
    return allStables.filter(s => isStallVip(s));
  }, [allStables]);

  const availableStandardStables = useMemo(() => {
    return allStables.filter(s => !isStallVip(s));
  }, [allStables]);

  // Form State: Đăng ký ngựa mới
  const [horseForm, setHorseForm] = useState(() => ({
    name: '',
    englishName: '',
    breed: 'Thoroughbred',
    gender: 'Ngựa đực (Stallion)',
    foaledYear: '2023',
    age: '3 tuổi',
    coatColor: 'Ô (Đen bóng)',
    microchip: `MC-VN-2026-${Math.floor(100 + Math.random() * 900)}`,
    ownershipShare: 100,
    trainer: 'Trần Văn Hùng',
    vet: 'BS. Nguyễn An',
    groom: 'Lê Hoàng Nam',
    stable: membershipTier === 'PREMIUM'
      ? 'Ô A1 (Block A - 18 m²)'
      : 'Ô C1 (Block C - 14 m²)',
    sire: '',
    dam: '',
    avatar: 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=600&q=80'
  }));

  // Xử lý mở Modal Đăng Ký Chiến Mã (Ràng buộc tối đa 02 chiến mã đối với gói Free)
  const handleOpenAddHorseModal = () => {
    if (membershipTier !== 'PREMIUM' && myHorses.length >= 2) {
      showToast('Gói cơ bản (Horse 0 Đồng) chỉ cho phép tối đa 02 chiến mã!', 'GIỚI HẠN GÓI CƠ BẢN', 'warning');
      setUpgradePromptModal({
        title: 'Đã Đạt Giới Hạn Tối Đa 02 Chiến Mã',
        badge: 'GÓI HORSE 0 ĐỒNG',
        message: 'Tài khoản của bạn hiện đang quản lý đủ 02/02 chiến mã được cấp phép trong Gói Cơ Bản. Để nhập chuồng thêm chiến mã thứ 3, vui lòng nâng cấp lên gói HORSE PREMIUM VIP.',
        benefit: '✨ Đặc quyền VIP: Đăng ký & sở hữu không giới hạn số lượng chiến mã, ưu tiên ô chuồng VIP Block A/B.',
        actionText: 'Nâng Cấp Gói VIP Ngay'
      });
      return;
    }

    // Xác định ô chuồng mặc định
    let defaultStable = 'Ô C1 (Block C - 14 m²)';
    if (membershipTier === 'PREMIUM') {
      defaultStable = availableVipStables.length > 0 ? getStallDisplayName(availableVipStables[0]) : 'Ô A1 (Block A - 18 m²)';
    } else {
      defaultStable = availableStandardStables.length > 0 ? getStallDisplayName(availableStandardStables[0]) : 'Ô C1 (Block C - 14 m²)';
    }

    setHorseForm(prev => ({
      ...prev,
      name: '',
      englishName: '',
      microchip: `MC-VN-2026-${Math.floor(100 + Math.random() * 900)}`,
      stable: defaultStable
    }));
    setShowAddHorseModal(true);
  };

  // Xử lý chọn ô chuồng: Gói Free chỉ được chọn chuồng Thường
  const handleStableSelectChange = (e) => {
    const selected = e.target.value;
    if (membershipTier !== 'PREMIUM' && (selected.includes('VIP') || selected.includes('Block A') || selected.includes('Block B') || selected.startsWith('Ô A') || selected.startsWith('Ô B'))) {
      const fallback = availableStandardStables.length > 0 ? getStallDisplayName(availableStandardStables[0]) : 'Ô C1 (Block C - 14 m²)';
      setUpgradePromptModal({
        title: 'Ô Chuồng VIP Đặc Quyền',
        badge: 'ĐẶC QUYỀN VIP',
        message: 'Các ô chuồng VIP chỉ dành riêng cho hội viên VIP. Vui lòng nâng cấp tài khoản để sử dụng ô chuồng VIP.',
        benefit: '✨ Đặc quyền VIP: Không gian chuồng VIP rộng rãi chuẩn quốc tế, kiểm soát vi khí hậu và chế độ chăm sóc đặc biệt.',
        actionText: 'Nâng Cấp VIP Để Chọn Ô Chuồng Này'
      });
      setHorseForm(prev => ({
        ...prev,
        stable: fallback
      }));
      return;
    }
    setHorseForm(prev => ({ ...prev, stable: selected }));
  };

  // Form State: Đăng ký giải đấu
  const [raceRegForm, setRaceRegForm] = useState({
    tournamentId: '',
    horseId: '',
    selectionMode: 'OWNER_CHOICE', // 'OWNER_CHOICE' | 'DELEGATE_TRAINER'
    trainerName: 'Trần Văn Hùng (HLV Trưởng)',
    jockey: 'HLV chỉ định kỵ mã phù hợp nhất',
    targetPace: 'Chạy giữ nhịp & bứt phá 300m cuối',
    notes: 'Cam kết tuân thủ 100% điều lệ trường đua.'
  });

  // Mở modal đăng ký giải đấu
  const handleOpenRaceRegister = (tournament) => {
    if (tournament) {
      setSelectedTournamentToRegister(tournament);
      setRaceRegForm(prev => ({
        ...prev,
        tournamentId: tournament.id,
        selectionMode: 'OWNER_CHOICE',
        horseId: myHorses.length > 0 ? myHorses[0].id : ''
      }));
    } else {
      setSelectedTournamentToRegister(OPEN_TOURNAMENTS[0]);
      setRaceRegForm(prev => ({
        ...prev,
        tournamentId: OPEN_TOURNAMENTS[0].id,
        selectionMode: 'OWNER_CHOICE',
        horseId: myHorses.length > 0 ? myHorses[0].id : ''
      }));
    }
    setShowRaceRegisterModal(true);
  };

  const handleHorseImageUpload = (e) => {
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
        setHorseForm(prev => ({ ...prev, avatar: optimizedDataUrl }));
        showToast('Đã tải ảnh chiến mã thành công!', 'TẢI ẢNH XONG', 'info');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Xử lý tạo ngựa mới
  const handleCreateHorseSubmit = (e) => {
    e.preventDefault();
    if (!horseForm.name.trim()) {
      showToast('Vui lòng nhập tên chiến mã!', 'THIẾU THÔNG TIN', 'error');
      return;
    }

    const newHorse = {
      id: Date.now(),
      name: horseForm.name.trim(),
      englishName: horseForm.englishName.trim() || horseForm.name.trim(),
      breed: horseForm.breed,
      microchip: horseForm.microchip.trim() || `MC-VN-2026-${Math.floor(100 + Math.random() * 900)}`,
      stable: horseForm.stable,
      gender: horseForm.gender,
      ownershipShare: Number(horseForm.ownershipShare) || 100,
      ownershipType: Number(horseForm.ownershipShare) === 100 ? 'Độc quyền (100%)' : `Đồng sở hữu (${horseForm.ownershipShare}%)`,
      trainer: horseForm.trainer,
      vet: horseForm.vet || 'BS. Nguyễn An',
      groom: horseForm.groom || 'Lê Hoàng Nam',
      status: 'ELIGIBLE',
      statusText: 'Đủ chuẩn thi đấu',
      winCount: 0,
      totalStarts: 0,
      totalPrizeEarned: 0,
      avatar: horseForm.avatar,
      pedigree: {
        sire: horseForm.sire.trim() || 'Dòng thuần chủng F1',
        dam: horseForm.dam.trim() || 'Dòng thuần chủng M1',
        foaled: `${horseForm.foaledYear} (${horseForm.age})`
      }
    };

    // Chỉ định đội ngũ phục vụ (HLV, BS, Groom)
    const trObj = FIXED_TRAINERS_LIST.find(t => t.name === horseForm.trainer || t.username === horseForm.trainer) || FIXED_TRAINERS_LIST[0];
    const vtObj = FIXED_VETS_LIST.find(v => v.name === horseForm.vet || v.username === horseForm.vet) || FIXED_VETS_LIST[0];
    const gmObj = FIXED_GROOMS_LIST.find(g => g.name === horseForm.groom || g.username === horseForm.groom) || FIXED_GROOMS_LIST[0];

    assignOrUpdateServiceTeam(newHorse, {
      trainerUsername: trObj.username,
      vetUsername: vtObj.username,
      groomUsername: gmObj.username
    }, currentUser);

    // Gọi API Đăng ký ngựa của Chủ sở hữu
    registerOwnerHorseApi(ownerKey, newHorse).catch(() => {});

    setMyHorses(prev => {
      const filtered = prev.filter(h =>
        String(h.id) !== String(newHorse.id) &&
        (!newHorse.microchip || (h.microchip || '').toLowerCase() !== newHorse.microchip.toLowerCase()) &&
        (!newHorse.name || (h.name || '').toLowerCase() !== newHorse.name.toLowerCase())
      );
      const next = deduplicateHorses([newHorse, ...filtered]);
      try {
        localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(next));
        if (isDemoVip) {
          localStorage.setItem('matruong_owner_horses_owner_thanh', JSON.stringify(next));
          localStorage.setItem('matruong_owner_horses_6', JSON.stringify(next));
          localStorage.setItem('matruong_owner_horses_11', JSON.stringify(next));
        }
      } catch {}
      return next;
    });

    // Tạo bản ghi theo dõi thể lực khởi điểm
    setTrainingTelemetry(prev => [
      {
        id: Date.now(),
        horseName: newHorse.name,
        stable: newHorse.stable,
        sessionDate: new Date().toLocaleDateString('vi-VN'),
        maxSpeed: '52.0 km/h (Khởi điểm)',
        avgSpeed: '46.5 km/h',
        peakHeartRate: '190 bpm',
        recoveryHeartRate: '80 bpm',
        distanceMeters: '1.200 m',
        readinessScore: '8.5 / 10',
        trainerFeedback: `Chiến mã mới tiếp nhận vào chuồng. HLV ${horseForm.trainer.split('(')[0]} bắt đầu thiết lập giáo án thể lực.`
      },
      ...prev
    ]);

    // Tạo bản ghi y tế tiếp nhận chuồng
    setHealthLogs(prev => [
      {
        id: Date.now(),
        horseName: `${newHorse.name} (${newHorse.stable})`,
        issue: 'Khám kiểm dịch & Ghi nhận vi chip mới',
        diagnosisBy: 'Bác sĩ Nguyễn An (Trưởng khoa)',
        medications: 'Tiêm phòng cơ bản & Vitamin đề kháng',
        status: 'CLEARED',
        statusText: 'Đạt chuẩn kiểm dịch',
        date: new Date().toLocaleDateString('vi-VN'),
        vetNote: `Đã xác nhận mã vi chip ${newHorse.microchip}. Cơ bắp cân đối, đủ điều kiện vào chuồng nuôi dưỡng.`
      },
      ...prev
    ]);

    setShowAddHorseModal(false);
    // Reset form
    setHorseForm({
      name: '',
      englishName: '',
      breed: 'Thoroughbred',
      gender: 'Ngựa đực (Stallion)',
      foaledYear: '2023',
      age: '3 tuổi',
      coatColor: 'Ô (Đen bóng)',
      microchip: `MC-VN-2026-${Math.floor(100 + Math.random() * 900)}`,
      ownershipShare: 100,
      trainer: 'Trần Văn Hùng (HLV Trưởng)',
      stable: 'Ô A1 (Khu Huấn luyện)',
      sire: '',
      dam: '',
      avatar: 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=600&q=80'
    });

    showToast(`Đã đăng ký chiến mã "${newHorse.name}" vào chuồng thành công!`, 'ĐĂNG KÝ CHIẾN MÃ', 'info');
  };

  // State: Modal Chỉnh Sửa Thông Tin Chiến Mã
  const [showEditHorseModal, setShowEditHorseModal] = useState(false);
  const [editingHorse, setEditingHorse] = useState(null);
  const [editHorseForm, setEditHorseForm] = useState({
    id: null,
    name: '',
    englishName: '',
    breed: 'Thoroughbred',
    gender: 'Ngựa đực (Stallion)',
    age: '3 tuổi',
    foaledYear: '2023',
    microchip: '',
    ownershipShare: 100,
    trainer: 'Trần Văn Hùng',
    vet: 'BS. Nguyễn An',
    groom: 'Lê Hoàng Nam',
    stable: 'Ô A1 (Khu Huấn luyện)',
    sire: '',
    dam: '',
    avatar: ''
  });

  const handleOpenEditHorseModal = (horse) => {
    const current = serviceAssignments.find(a =>
      (a.microchip && a.microchip === horse.microchip) ||
      (a.horseName && a.horseName.toLowerCase() === horse.name?.toLowerCase()) ||
      String(a.id) === String(horse.id)
    );
    const currentAge = horse.age || (horse.pedigree?.foaled ? (horse.pedigree.foaled.match(/\((.*?)\)/)?.[1] || horse.pedigree.foaled) : '3 tuổi') || '3 tuổi';
    const cleanAge = currentAge.includes('tuổi') ? currentAge : `${currentAge} tuổi`;
    const foaledY = horse.pedigree?.foaled ? (horse.pedigree.foaled.match(/\b(20\d\d)\b/)?.[1] || '2023') : '2023';

    setEditingHorse(horse);
    setEditHorseForm({
      id: horse.id,
      name: horse.name || '',
      englishName: horse.englishName || '',
      breed: horse.breed || 'Thoroughbred',
      gender: horse.gender || 'Ngựa đực (Stallion)',
      age: cleanAge,
      foaledYear: foaledY,
      microchip: horse.microchip || '',
      ownershipShare: horse.ownershipShare || 100,
      trainer: current?.trainerName || (horse.trainer ? horse.trainer.split('(')[0].trim() : 'Trần Văn Hùng'),
      vet: current?.vetName || (horse.vet ? horse.vet.split('(')[0].trim() : 'BS. Nguyễn An'),
      groom: current?.groomName || (horse.groom ? horse.groom.split('(')[0].trim() : 'Lê Hoàng Nam'),
      stable: horse.stable || 'Ô A1',
      sire: horse.pedigree?.sire || '',
      dam: horse.pedigree?.dam || '',
      avatar: horse.avatar || ''
    });
    setShowEditHorseModal(true);
  };

  const handleEditHorseImageUpload = (e) => {
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
        setEditHorseForm(prev => ({ ...prev, avatar: optimizedDataUrl }));
        showToast('Đã tải ảnh mới thành công!', 'TẢI ẢNH XONG', 'info');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateHorseSubmit = (e) => {
    e.preventDefault();
    if (!editHorseForm.name.trim()) {
      showToast('Vui lòng nhập tên chiến mã!', 'THIẾU THÔNG TIN', 'error');
      return;
    }

    const updatedHorse = {
      ...editingHorse,
      name: editHorseForm.name.trim(),
      englishName: editHorseForm.englishName.trim() || editHorseForm.name.trim(),
      breed: editHorseForm.breed,
      gender: editHorseForm.gender,
      age: editHorseForm.age || editingHorse.age || '3 tuổi',
      microchip: editHorseForm.microchip.trim() || editingHorse.microchip,
      ownershipShare: Number(editHorseForm.ownershipShare) || 100,
      ownershipType: Number(editHorseForm.ownershipShare) === 100 ? 'Độc quyền (100%)' : `Đồng sở hữu (${editHorseForm.ownershipShare}%)`,
      trainer: editHorseForm.trainer,
      vet: editHorseForm.vet || editingHorse.vet || 'BS. Nguyễn An',
      groom: editHorseForm.groom || editingHorse.groom || 'Lê Hoàng Nam',
      stable: editHorseForm.stable,
      avatar: editHorseForm.avatar || editingHorse.avatar,
      pedigree: {
        ...editingHorse.pedigree,
        sire: editHorseForm.sire.trim() || editingHorse.pedigree?.sire || 'Đang cập nhật',
        dam: editHorseForm.dam.trim() || editingHorse.pedigree?.dam || 'Đang cập nhật',
        foaled: `${editHorseForm.foaledYear || '2023'} (${editHorseForm.age || '3 tuổi'})`
      }
    };

    // Đồng bộ lại đội ngũ phục vụ
    const trObj = FIXED_TRAINERS_LIST.find(t => t.name === editHorseForm.trainer || t.username === editHorseForm.trainer) || FIXED_TRAINERS_LIST[0];
    const vtObj = FIXED_VETS_LIST.find(v => v.name === editHorseForm.vet || v.username === editHorseForm.vet) || FIXED_VETS_LIST[0];
    const gmObj = FIXED_GROOMS_LIST.find(g => g.name === editHorseForm.groom || g.username === editHorseForm.groom) || FIXED_GROOMS_LIST[0];

    assignOrUpdateServiceTeam(updatedHorse, {
      trainerUsername: trObj.username,
      vetUsername: vtObj.username,
      groomUsername: gmObj.username
    }, currentUser);

    updateOwnerHorseApi(ownerKey, updatedHorse).catch(() => {});
    setMyHorses(prev => {
      const next = prev.map(h => String(h.id) === String(editingHorse.id) ? updatedHorse : h);
      const deduped = deduplicateHorses(next);
      try {
        localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(deduped));
        if (isDemoVip) {
          localStorage.setItem('matruong_owner_horses_owner_thanh', JSON.stringify(next));
          localStorage.setItem('matruong_owner_horses_6', JSON.stringify(next));
          localStorage.setItem('matruong_owner_horses_11', JSON.stringify(next));
        }
      } catch {}
      return next;
    });
    setShowEditHorseModal(false);
    showToast(`Đã cập nhật thông tin chiến mã "${updatedHorse.name}" thành công!`, 'CẬP NHẬT HỒ SƠ', 'success');
  };

  // State: Modal Xác Minh Xóa Chiến Mã
  const [showDeleteHorseModal, setShowDeleteHorseModal] = useState(false);
  const [deletingHorse, setDeletingHorse] = useState(null);
  const [deleteVerificationInput, setDeleteVerificationInput] = useState('');

  const handleOpenDeleteHorseModal = (horse) => {
    setDeletingHorse(horse);
    setDeleteVerificationInput('');
    setShowDeleteHorseModal(true);
  };

  const handleConfirmDeleteHorse = () => {
    if (!deletingHorse) return;

    if (deleteVerificationInput.trim().toLowerCase() !== deletingHorse.name.trim().toLowerCase()) {
      showToast(`Vui lòng nhập chính xác tên chiến mã "${deletingHorse.name}" để xác nhận xóa!`, 'XÁC MINH CHƯA ĐÚNG', 'warning');
      return;
    }

    const horseId = deletingHorse.id;
    const horseName = deletingHorse.name;

    // 1. Cập nhật state và lưu đồng bộ ngay lập tức vào tất cả các alias LocalStorage
    setMyHorses(prev => {
      const next = prev.filter(h =>
        String(h.id) !== String(horseId) &&
        (h.name || '').toLowerCase() !== (horseName || '').toLowerCase()
      );
      const deduped = deduplicateHorses(next);
      try {
        localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(deduped));
        if (isDemoVip) {
          localStorage.setItem('matruong_owner_horses_owner_thanh', JSON.stringify(next));
          localStorage.setItem('matruong_owner_horses_6', JSON.stringify(next));
          localStorage.setItem('matruong_owner_horses_11', JSON.stringify(next));
        }
      } catch {}
      return next;
    });

    // 2. Gửi lệnh xóa qua API Backend / Fallback
    deleteOwnerHorseApi(ownerKey, horseId).catch(() => {});

    // 3. Dọn dẹp telemetry của ngựa đã xóa nếu có
    setTrainingTelemetry(prev => {
      const next = prev.filter(t => t.horseName !== horseName);
      try {
        localStorage.setItem(`matruong_owner_telemetry_${ownerKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 4. Phát thông báo hệ thống liên thông tới Huấn luyện viên, Bác sĩ, Groom và Admin
    try {
      notifyHorseDeleted(deletingHorse, currentUser);
    } catch (e) {
      console.error('Lỗi phát thông báo xóa ngựa:', e);
    }

    // 5. Gỡ bỏ khỏi danh sách phân công dịch vụ
    try {
      removeServiceAssignmentByHorse(horseId);
      if (deletingHorse.microchip) removeServiceAssignmentByHorse(deletingHorse.microchip);
      if (horseName) removeServiceAssignmentByHorse(horseName);
    } catch (e) {
      console.error('Lỗi gỡ phân công dịch vụ:', e);
    }

    setShowDeleteHorseModal(false);
    showToast(`Đã hoàn tất xóa chiến mã "${horseName}" khỏi chuồng nuôi dưỡng!`, 'XÓA THÀNH CÔNG', 'info');
    setDeletingHorse(null);
    setDeleteVerificationInput('');
  };

  // Xử lý nộp đơn đăng ký giải đấu
  const handleRegisterRaceSubmit = (e) => {
    e.preventDefault();
    if (myHorses.length === 0) {
      showToast('Bạn chưa có chiến mã nào! Hãy đăng ký ngựa trước khi ghi danh giải đua.', 'CHƯA CÓ NGỰA', 'warning');
      return;
    }

    const isDelegated = raceRegForm.selectionMode === 'DELEGATE_TRAINER';
    const selectedHorse = isDelegated ? null : (myHorses.find(h => String(h.id) === String(raceRegForm.horseId)) || myHorses[0]);
    const tournament = OPEN_TOURNAMENTS.find(t => t.id === raceRegForm.tournamentId) || selectedTournamentToRegister || OPEN_TOURNAMENTS[0];

    // Kiểm tra đã đăng ký chưa & Kiểm tra Lệnh Khóa Y Tế Thú y
    if (!isDelegated) {
      const lockStatus = checkHorseVetLockStatus(selectedHorse.microchip || selectedHorse.id || selectedHorse.name);
      if (lockStatus.isLocked || selectedHorse.isLockedByVet || selectedHorse.status === 'INJURED') {
        showToast(
          `Chiến mã "${selectedHorse.name}" đang bị Bác sĩ Thú y KHÓA Y TẾ / CẤM THI ĐẤU (${lockStatus.reason || 'Chấn thương'})! Phải đợi Bác sĩ Thú y kiểm tra và dỡ bỏ lệnh khóa thì mới được cho đi thi đấu.`,
          'CẤM THI ĐẤU DO KHÓA Y TẾ',
          'error'
        );
        return;
      }
      const alreadyRegistered = raceNominations.some(r => r.raceName === tournament.name && r.horseName === selectedHorse.name);
      if (alreadyRegistered) {
        showToast(`Chiến mã "${selectedHorse.name}" đã được đăng ký tham gia giải này rồi!`, 'ĐÃ TỒN TẠI', 'warning');
        return;
      }
    } else {
      const alreadyDelegated = raceNominations.some(r => r.raceName === tournament.name && (r.delegatedToTrainer && !r.trainerAssigned));
      if (alreadyDelegated) {
        showToast(`Bạn đã gửi yêu cầu nhờ HLV chỉ định ngựa cho giải "${tournament.name}" rồi! Vui lòng chờ HLV phản hồi.`, 'ĐANG XỬ LÝ', 'warning');
        return;
      }
    }

    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newNomination = {
      id: `RN-REG-${Date.now().toString().slice(-4)}`,
      raceName: tournament.name,
      track: tournament.track,
      horseName: isDelegated ? 'Chờ HLV chỉ định ngựa' : selectedHorse.name,
      delegatedToTrainer: isDelegated,
      trainerAssigned: false,
      assignedHorseName: null,
      assignedHorseId: null,
      assignedHorseStall: null,
      targetTrainer: raceRegForm.trainerName || 'Trần Văn Hùng (HLV Trưởng)',
      ownerName: currentUser?.full_name || 'Chủ sở hữu',
      ownerKey: String(ownerKey),
      distance: `${tournament.distance} (${tournament.surface})`,
      date: tournament.date,
      estimatedPurse: tournament.totalPurse,
      nominationStatus: isDelegated ? 'PENDING_TRAINER_SELECTION' : 'PENDING_TRAINER',
      jockey: raceRegForm.jockey || 'HLV chỉ định kỵ mã phù hợp',
      notes: isDelegated
        ? `Chủ sở hữu nhờ HLV Trưởng (${raceRegForm.trainerName || 'Trần Văn Hùng'}) thẩm định và tuyển chọn chiến mã phù hợp nhất. ${raceRegForm.notes || ''}`
        : `Chủ sở hữu đăng ký chiến mã ${selectedHorse.name}. Kỵ mã: ${raceRegForm.jockey || 'Chưa chỉ định'}. ${raceRegForm.notes || ''}`,
      registeredAt: timeStr,
      trainerFeedback: '',
      reviewedBy: null,
      reviewedAt: null
    };

    // Gọi API Ghi danh giải đấu của Chủ sở hữu
    registerRaceTournamentApi(ownerKey, newNomination).catch(() => {});

    setRaceNominations(prev => [newNomination, ...prev]);
    setShowRaceRegisterModal(false);
    if (isDelegated) {
      showToast(`Đã gửi yêu cầu ủy thác đến Huấn luyện viên trưởng! HLV sẽ đối soát thể lực để chỉ định chiến mã tối ưu nhất.`, 'ỦY THÁC HLV THÀNH CÔNG', 'success');
    } else {
      showToast(`Đã gửi đơn ghi danh chiến mã "${selectedHorse.name}"! Đang chờ Huấn luyện viên trưởng phê duyệt.`, 'GHI DANH GIẢI ĐUA', 'info');
    }
    setActiveTab('races');
  };

  // Duyệt hoặc rút lui giải đấu
  const handleToggleNomination = (id, newStatus) => {
    // Gọi API cập nhật trạng thái giải đua của Chủ sở hữu
    updateRaceNominationStatusApi(ownerKey, id, newStatus).catch(() => {});

    setRaceNominations(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          nominationStatus: newStatus
        };
      }
      return r;
    }));
    const label = newStatus === 'APPROVED' ? 'Phê duyệt tham gia' : 'Rút lui giải đấu';
    showToast(`Đã cập nhật: ${label}!`, 'QUYẾT ĐỊNH CHỦ NGỰA', 'info');
  };

  // Tính tổng số tiền thưởng & số dư quỹ
  const totalPrizeAll = useMemo(() => {
    const list = Array.isArray(myHorses) ? myHorses : [];
    return list.reduce((sum, h) => sum + (Number(h?.totalPrizeEarned) || 0), 0);
  }, [myHorses]);

  const netFundBalance = useMemo(() => {
    const list = Array.isArray(myHorses) ? myHorses : [];
    if (list.length === 0) return 0;
    const prize = totalPrizeAll;
    const costs = list.length * 35000000; // Phí cơ bản
    return prize > costs ? prize - costs : 0;
  }, [totalPrizeAll, myHorses]);

  // Tính tổng số tiền chủ sở hữu đã thanh toán
  const totalPaidAmount = useMemo(() => {
    const list = Array.isArray(paymentHistory) ? paymentHistory : [];
    return list.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  }, [paymentHistory]);

  // Tìm kiếm nhật ký thanh toán
  const filteredPayments = useMemo(() => {
    if (!paymentSearch.trim()) return paymentHistory;
    const q = paymentSearch.toLowerCase().trim();
    return paymentHistory.filter(p =>
      (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
      (p.packageName && p.packageName.toLowerCase().includes(q)) ||
      (p.method && p.method.toLowerCase().includes(q)) ||
      (p.paidAt && p.paidAt.toLowerCase().includes(q))
    );
  }, [paymentHistory, paymentSearch]);

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(num) || 0);
  };

  // Đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Đã đăng xuất khỏi Cổng Chủ Sở Hữu.', 'ĐĂNG XUẤT', 'info');
  };

  return (
    <div className="portal-layout">
      {/* Mobile drawer backdrop */}
      <div
        className={`portal-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===================== 1. SIDEBAR NAVIGATION ===================== */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-brand">
          <div className="portal-brand-icon">
            <IconCrown size={22} color="#14100A" />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>Chủ Sở Hữu (Horse Owner)</p>
          </div>
        </div>

        <nav className="portal-nav">
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'horses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('horses'); setSidebarOpen(false); }}
            title="Đàn Ngựa Thuộc Quyền Sở Hữu"
          >
            <span className="portal-nav-icon"><IconHorse size={18} /></span>
            <span className="portal-nav-label">Đàn ngựa sở hữu</span>
            <span className="portal-nav-badge">{myHorses.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => { setActiveTab('schedule'); setSidebarOpen(false); }}
            title="Lịch Tập Luyện Theo Thời Gian Thực & Đặt Lịch Huấn Luyện Chung"
          >
            <span className="portal-nav-icon"><IconCalendar size={18} /></span>
            <span className="portal-nav-label">Lịch tập & Đặt lịch</span>
            <span className="portal-nav-badge" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brass)' }}>
              {jointSessions.length}
            </span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'training' ? 'active' : ''}`}
            onClick={() => { setActiveTab('training'); setSidebarOpen(false); }}
            title="Báo Cáo Huấn Luyện & Viễn Trắc Từ HLV"
          >
            <span className="portal-nav-icon"><IconChart size={18} /></span>
            <span className="portal-nav-label">Tiến độ huấn luyện</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'races' ? 'active' : ''}`}
            onClick={() => { setActiveTab('races'); setSidebarOpen(false); }}
            title="Giải Đua & Đăng Ký Thi Đấu"
          >
            <span className="portal-nav-icon"><IconTrophy size={18} /></span>
            <span className="portal-nav-label">Giải đua & Đăng ký</span>
            <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
              {OPEN_TOURNAMENTS.length} mở
            </span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('finance'); setSidebarOpen(false); }}
            title="Nhật Ký Giao Dịch, Thanh Toán & Quyết Toán Tiền Thưởng"
          >
            <span className="portal-nav-icon"><IconWallet size={18} /></span>
            <span className="portal-nav-label">Giao dịch & Tài chính</span>
            <span className="portal-nav-badge">{paymentHistory.length + statements.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'vet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vet'); setSidebarOpen(false); }}
            title="Minh Bạch Hồ Sơ Y Tế & Thú Y"
          >
            <span className="portal-nav-icon"><IconShieldHeart size={18} /></span>
            <span className="portal-nav-label">Minh bạch y tế</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'membership' ? 'active' : ''}`}
            onClick={() => { setActiveTab('membership'); setSidebarOpen(false); }}
            title="Đăng Ký Quyền Lợi & Gói Hội Viên"
          >
            <span className="portal-nav-icon"><IconCrown size={18} /></span>
            <span className="portal-nav-label">Hội viên & Gói quyền lợi</span>
            <span className="portal-nav-badge" style={{
              background: membershipTier === 'PREMIUM' ? 'var(--brass)' : 'var(--bg-secondary)',
              color: membershipTier === 'PREMIUM' ? '#0A0D14' : 'var(--paper-dim)',
              fontWeight: 800
            }}>
              {membershipTier === 'PREMIUM' ? 'PREMIUM' : 'FREE'}
            </span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
            title="Khiếu Nại & Báo Cáo Nhân Sự (HLV, Bác sĩ, Chăm sóc)"
          >
            <span className="portal-nav-icon"><IconReportAlert size={18} /></span>
            <span className="portal-nav-label">Khiếu nại & Báo cáo</span>
            {myReports.length > 0 && (
              <span className="portal-nav-badge" style={{
                background: myReports.some(r => r.status === 'PENDING') ? '#F59E0B' : 'rgba(212, 175, 55, 0.2)',
                color: myReports.some(r => r.status === 'PENDING') ? '#000' : 'var(--brass)',
                fontWeight: 700
              }}>
                {myReports.length}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* ===================== 2. MAIN CONTENT WRAPPER ===================== */}
      <div className="portal-content-wrap">
        {/* TOP BAR */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              type="button"
              className="portal-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở Menu"
            >
              <IconCrown size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>CỔNG CHỦ SỞ HỮU NGỰA</span>
                <span style={{
                  fontSize: '10.5px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  color: 'var(--brass)',
                  border: '1px solid var(--line-strong)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  RACEHORSE OWNER PORTAL
                </span>
              </h2>
              <div className="portal-page-subtitle">
                Đăng ký chiến mã, ghi danh giải đấu, quản lý cổ phần & đối soát minh bạch
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'VIP'}
              </div>
              <div className="portal-user-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="portal-user-name">{currentUser?.full_name || 'Chủ Sở Hữu Ngựa'}</div>
                  {membershipTier === 'PREMIUM' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(212, 175, 55, 0.12)',
                      color: 'var(--brass)',
                      border: '1px solid rgba(212, 175, 55, 0.6)',
                      borderRadius: '4px',
                      padding: '1px 6px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                      lineHeight: 1.3
                    }}>
                      <span style={{ fontSize: '9px' }}>👑</span> PREMIUM
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--paper-dim)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      padding: '1px 6px',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      lineHeight: 1.3
                    }}>
                      FREE 0Đ
                    </span>
                  )}
                </div>
                <div className="portal-user-role" style={{ marginTop: '2px' }}>Chủ sở hữu (Racehorse Owner)</div>
              </div>
            </div>

            {/* NÚT ĐỔI GÓI CHUYỂN RA BÊN NGOÀI USER BADGE - Tự động ẩn đi khi đã đăng ký / kích hoạt gói VIP */}
            {membershipTier !== 'PREMIUM' && (
              <button
                type="button"
                onClick={() => {
                  if (membershipTier === 'FREE' && hasVipSubscription) {
                    handleSelectTier('PREMIUM');
                  } else {
                    setShowMembershipModal(true);
                  }
                }}
                title={membershipTier === 'FREE' && hasVipSubscription ? "Nhấn để khôi phục đặc quyền VIP đã mua miễn phí" : "Quản lý & nâng cấp gói quyền lợi thành viên"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                }}
              >
                <span>
                  {hasVipSubscription
                    ? '👑 Khôi phục VIP'
                    : '👑 Nâng cấp VIP'}
                </span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="portal-btn-logout"
              title="Đăng xuất khỏi hệ thống"
            >
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="portal-main">
          {/* ========================================================================= */}
          {/* BANNER ONBOARDING KHI VỪA ĐĂNG KÝ / CHƯA CÓ DỮ LIỆU */}
          {/* ========================================================================= */}
          {myHorses.length === 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line-strong)',
              borderLeft: '4px solid var(--brass)',
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--brass)' }}><IconCrown size={20} /></span>
                    <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--paper)', fontWeight: 700 }}>
                      Chào mừng {currentUser?.full_name || 'Quý Chủ Ngựa'} gia nhập Câu lạc bộ Đua Ngựa!
                    </h3>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--paper-dim)', lineHeight: 1.5, maxWidth: '780px' }}>
                    Tài khoản của bạn vừa được khởi tạo thành công và hiện chưa có hồ sơ chiến mã nào. Hãy bắt đầu bằng cách <b>đăng ký chiến mã mới</b> vào chuồng trại của câu lạc bộ, sau đó <b>ghi danh vào các giải đua mở</b> để Huấn luyện viên trưởng thiết lập giáo án thể lực.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleOpenAddHorseModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 700,
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <IconPlus size={16} color="#0A0D14" />
                    <span>Đăng ký chiến mã mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTournamentToRegister(OPEN_TOURNAMENTS[0]);
                      setShowRaceRegisterModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 16px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper)',
                      fontWeight: 600,
                      border: '1px solid var(--line)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <IconTrophy size={16} color="var(--brass)" />
                    <span>Đăng ký giải đấu</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3 THẺ CHỈ SỐ NHANH (KPI STATS - 1 HÀNG NGANG CÂN ĐỐI CHUẨN 3 MÀU CHỦ ĐẠO) */}
          {/* ========================================================================= */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="facility-card" style={{
              padding: '18px 20px',
              borderTop: '2px solid var(--brass)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--brass)', textTransform: 'uppercase' }}>
                  CHIẾN MÃ SỞ HỮU
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brass)', boxShadow: '0 0 8px var(--brass-glow)' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brass)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                {myHorses.length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CHIẾN MÃ</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {myHorses.length === 0 ? 'Chưa đăng ký chiến mã nào' : `${myHorses.filter(h => h.ownershipShare === 100).length} Độc quyền · ${myHorses.filter(h => h.ownershipShare < 100).length} Đồng sở hữu`}
              </div>
            </div>

            <div className="facility-card" style={{
              padding: '18px 20px',
              borderTop: '2px solid var(--line-strong)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--paper)', textTransform: 'uppercase' }}>
                  TIỀN THƯỞNG TÍCH LŨY
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-dim)' }} />
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                {formatVND(totalPrizeAll)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {myHorses.length === 0 ? 'Sẽ cập nhật sau khi thi đấu' : 'Tổng thưởng từ các giải chính thức'}
              </div>
            </div>

            <div className="facility-card" style={{
              padding: '18px 20px',
              borderTop: '2px solid var(--line)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--paper-dim)', textTransform: 'uppercase' }}>
                  SỐ DƯ QUỸ RÒNG
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-muted)' }} />
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                {formatVND(netFundBalance)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {myHorses.length === 0 ? 'Chưa phát sinh giao dịch' : 'Khả dụng sau khi trừ chi phí nuôi & HLV'}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ĐÀN NGỰA SỞ HỮU (MY HORSES) */}
          {/* ========================================================================= */}
          {activeTab === 'horses' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 className="pane-title">Đàn Ngựa Thuộc Quyền Sở Hữu (Racehorse Portfolio)</h2>
                  <p className="pane-desc">Thông tin định danh, tỷ lệ cổ phần sở hữu, ô chuồng và ê-kíp phụ trách.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddHorseModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  <IconPlus size={16} color="#0A0D14" />
                  <span>Đăng ký ngựa mới</span>
                </button>
              </div>

              {myHorses.length === 0 ? (
                <div className="facility-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--brass)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <IconHorse size={30} color="var(--brass)" />
                  </div>
                  <h3 style={{ fontSize: '18px', color: 'var(--paper)', margin: '0 0 8px', fontWeight: 700 }}>
                    Bạn Chưa Có Chiến Mã Nào Trong Danh Mục
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Hãy đăng ký chiến mã đầu tiên của bạn để câu lạc bộ sắp xếp chuồng trại, chỉ định HLV trưởng và phân công kỵ mã luyện tập.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddHorseModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 22px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 700,
                      border: 'none',
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    <IconPlus size={16} color="#0A0D14" />
                    <span>Đăng Ký Chiến Mã Mới Ngay</span>
                  </button>
                </div>
              ) : (
                <div className="portal-cards-grid" style={{ display: 'grid', gap: '18px' }}>
                  {myHorses.map((h) => (
                    <div key={h.id} className="facility-card" style={{ padding: '18px 20px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                        <img
                          src={h.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
                          alt={h.name}
                          style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                          onError={(e) => {
                            e.target.src = h.name === 'Bạch Long'
                              ? 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
                              : 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <b
                              style={{
                                fontSize: '16px',
                                color: 'var(--brass)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0,
                                flex: 1
                              }}
                              title={h.name}
                            >
                              {h.name}
                            </b>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                              <button
                                type="button"
                                title="Chỉnh sửa thông tin chiến mã"
                                onClick={() => handleOpenEditHorseModal(h)}
                                style={{
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--line)',
                                  color: 'var(--paper-dim)',
                                  borderRadius: '5px',
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brass)'; e.currentTarget.style.borderColor = 'var(--brass)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--paper-dim)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                              >
                                <IconEdit size={13} color="currentColor" />
                              </button>
                              <button
                                type="button"
                                title="Xóa chiến mã (Yêu cầu xác minh)"
                                onClick={() => handleOpenDeleteHorseModal(h)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#EF4444',
                                  borderRadius: '5px',
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                              >
                                <IconTrash size={13} color="#EF4444" />
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--paper-dim)',
                              margin: '2px 0 6px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={`${h.englishName ? h.englishName + ' · ' : ''}${h.breed}`}
                          >
                            {h.englishName ? `${h.englishName} · ` : ''}{h.breed}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: h.status === 'ELIGIBLE' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                              color: h.status === 'ELIGIBLE' ? 'var(--brass)' : 'var(--paper-dim)',
                              border: `1px solid ${h.status === 'ELIGIBLE' ? 'var(--brass)' : 'var(--line)'}`,
                              whiteSpace: 'nowrap'
                            }}>
                              {h.statusText}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {h.microchip}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tỷ lệ sở hữu & Ô chuồng */}
                      <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: 'var(--paper-dim)' }}>Tỷ lệ sở hữu: </span>
                          <b style={{ color: 'var(--paper)' }}>{h.ownershipShare}%</b>
                        </div>
                        <div>
                          <span style={{ color: 'var(--paper-dim)' }}>Vị trí: </span>
                          <b style={{ color: 'var(--paper)' }}>{h.stable}</b>
                        </div>
                      </div>

                      {/* Đội ngũ phục vụ chuyên trách (HLV, Bác sĩ, Groom) & Trạng thái xác nhận */}
                      {(() => {
                        const asgn = serviceAssignments.find(a =>
                          (h.microchip && a.microchip && a.microchip.trim().toLowerCase() === h.microchip.trim().toLowerCase()) ||
                          (h.name && a.horseName && a.horseName.trim().toLowerCase() === h.name.trim().toLowerCase()) ||
                          (h.id && a.id && String(a.id) === String(h.id))
                        );
                        const trName = asgn?.trainerName || (h.trainer ? h.trainer.split('(')[0].trim() : 'Trần Văn Hùng');
                        const vtName = asgn?.vetName || (h.vet ? h.vet.split('(')[0].trim() : 'BS. Nguyễn An');
                        const gmName = asgn?.groomName || (h.groom ? h.groom.split('(')[0].trim() : 'Lê Hoàng Nam');
                        const trOk = asgn?.trainerStatus === 'CONFIRMED' || h.trainerStatus === 'CONFIRMED' || h.trainerConfirmed === true;
                        const vtOk = asgn?.vetStatus === 'CONFIRMED' || h.vetStatus === 'CONFIRMED' || h.vetConfirmed === true;
                        const gmOk = asgn?.groomStatus === 'CONFIRMED' || h.groomStatus === 'CONFIRMED' || h.groomConfirmed === true;

                        return (
                          <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            marginBottom: '14px',
                            border: '1px solid var(--line)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px dashed var(--line)', paddingBottom: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>🛡️</span> Đội Ngũ Phục Vụ Riêng
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenTeamModal(h)}
                                style={{
                                  background: 'rgba(212, 175, 55, 0.1)',
                                  border: '1px solid rgba(212, 175, 55, 0.4)',
                                  borderRadius: '4px',
                                  color: 'var(--brass)',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  cursor: 'pointer'
                                }}
                                title="Chỉ định hoặc thay đổi HLV, Bác sĩ và Groom phục vụ chiến mã"
                              >
                                🔄 Đổi Đội Ngũ
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* HLV */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--paper-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '6px' }}>
                                  🏇 HLV: <b style={{ color: 'var(--paper)' }}>{trName}</b>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleConfirm(h, 'TRAINER', trName)}
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: trOk ? '#10B981' : '#F59E0B',
                                    background: trOk ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                    border: `1px solid ${trOk ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title={trOk ? 'HLV đã xác nhận phục vụ. Bấm để chuyển về Chờ xác nhận nếu muốn.' : 'Đang chờ HLV xác nhận. Bấm để duyệt xác nhận ngay.'}
                                >
                                  {trOk ? '✓ Đã xác nhận' : '⏳ Chờ HLV xác nhận'}
                                </button>
                              </div>

                              {/* Bác sĩ */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--paper-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '6px' }}>
                                  🩺 Bác sĩ: <b style={{ color: 'var(--paper)' }}>{vtName}</b>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleConfirm(h, 'VET', vtName)}
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: vtOk ? '#10B981' : '#F59E0B',
                                    background: vtOk ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                    border: `1px solid ${vtOk ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title={vtOk ? 'Bác sĩ thú y đã xác nhận phụ trách. Bấm để chuyển về Chờ xác nhận nếu muốn.' : 'Đang chờ BS xác nhận. Bấm để duyệt xác nhận ngay.'}
                                >
                                  {vtOk ? '✓ Đã xác nhận' : '⏳ Chờ BS xác nhận'}
                                </button>
                              </div>

                              {/* Groom */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--paper-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '6px' }}>
                                  🌾 Groom: <b style={{ color: 'var(--paper)' }}>{gmName}</b>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleConfirm(h, 'GROOM', gmName)}
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: gmOk ? '#10B981' : '#F59E0B',
                                    background: gmOk ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                    border: `1px solid ${gmOk ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title={gmOk ? 'Groom đã xác nhận chăm sóc. Bấm để chuyển về Chờ xác nhận nếu muốn.' : 'Đang chờ Groom xác nhận. Bấm để duyệt xác nhận ngay.'}
                                >
                                  {gmOk ? '✓ Đã xác nhận' : '⏳ Chờ Groom xác nhận'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{
                        borderTop: '1px solid var(--line)',
                        paddingTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12.5px'
                        }}>
                          <div>
                            <span style={{ color: 'var(--paper-dim)' }}>Thắng giải: </span>
                            <b style={{ color: 'var(--brass)' }}>{h.winCount || 0} / {h.totalStarts || 0}</b>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)' }}>Tiền thưởng: </span>
                            <b style={{ color: 'var(--paper)' }}>{formatVND(h.totalPrizeEarned)}</b>
                          </div>
                        </div>

                        <div className="modal-responsive-grid-2" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={() => setFitnessDetailModalHorse(h)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              background: 'rgba(212, 175, 55, 0.12)',
                              color: 'var(--brass)',
                              border: '1px solid rgba(212, 175, 55, 0.4)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            title="Xem chi tiết thể lực, nhịp tim và tải luyện tập EvoLab như bên Huấn Luyện Viên"
                          >
                            <span>📊</span>
                            <span>Thể lực</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPedigreeModal(h)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--brass)',
                              border: '1px solid var(--line)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            Phả hệ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTournamentToRegister(OPEN_TOURNAMENTS[0]);
                              setRaceRegForm(prev => ({ ...prev, horseId: h.id }));
                              setShowRaceRegisterModal(true);
                            }}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '6px',
                              background: 'var(--brass)',
                              color: '#0A0D14',
                              fontWeight: 700,
                              border: 'none',
                              fontSize: '12px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(212, 175, 55, 0.2)'
                            }}
                          >
                            Ghi danh đua
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB DEDICATED: LỊCH TẬP LUYỆN THEO THỜI GIAN THỰC & ĐẶT LỊCH VỚI HLV     */}
          {/* ========================================================================= */}
          {activeTab === 'schedule' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span> Lịch Tập Luyện Thời Gian Thực & Đặt Lịch Cùng HLV
                </h2>
                <p className="pane-desc">
                  Một phía là lịch tập theo thời gian thực do Huấn luyện viên sắp xếp bài tập cho chiến mã. Bên góc phải nhỏ là nơi Chủ sở hữu đăng ký đặt lịch ra sân cùng HLV.
                </p>
              </div>

              {/* BỐ CỤC 2 PHÍA (SPLIT LAYOUT) */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* ===================================================================== */}
                {/* PHÍA TRÁI (CHÍNH): LỊCH THỜI GIAN THỰC & BÀI TẬP DO HLV SẮP XẾP     */}
                {/* ===================================================================== */}
                <div style={{ flex: '1 1 540px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* KHỐI 1: ĐỒNG HỒ THỜI GIAN THỰC & ĐỒNG BỘ TRƯỜNG ĐUA */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(20, 26, 38, 0.95), rgba(12, 17, 26, 0.95))',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 10px #10B981'
                        }} />
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Lịch Huấn Luyện Thời Gian Thực (Live IoT Sync)
                        </span>
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--paper)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                        {realTimeClock.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(212, 175, 55, 0.5)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Đồng hồ thời gian thực
                      </div>
                      <div style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'var(--brass)',
                        letterSpacing: '0.05em'
                      }}>
                        {realTimeClock.toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  {/* KHỐI 2: LỊCH TUẦN TRỰC QUAN 7 NGÀY (THỨ 2 ĐẾN CHỦ NHẬT) */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Lịch Hoạt Động Tuần Này (Thứ 2 — Chủ Nhật)</span>
                      <span style={{ fontSize: '11px', color: 'var(--brass)', fontWeight: 600 }}>Tuần 45/2026 · Trường đua Quốc Tế</span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '8px',
                      textAlign: 'center'
                    }}>
                      {[
                        { day: 'T2', date: '02/11', isToday: false },
                        { day: 'T3', date: '03/11', isToday: true },
                        { day: 'T4', date: '04/11', isToday: false },
                        { day: 'T5', date: '05/11', isToday: false },
                        { day: 'T6', date: '06/11', isToday: false },
                        { day: 'T7', date: '07/11', isToday: false },
                        { day: 'CN', date: '08/11', isToday: false },
                      ].map(d => (
                        <div
                          key={d.day}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '8px',
                            background: d.isToday ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                            border: d.isToday ? '1.5px solid var(--brass)' : '1px solid var(--line)',
                            boxShadow: d.isToday ? '0 0 12px rgba(212, 175, 55, 0.2)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '11.5px', fontWeight: d.isToday ? 800 : 600, color: d.isToday ? 'var(--brass)' : 'var(--paper-dim)' }}>
                            {d.day}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: d.isToday ? 'var(--paper)' : 'var(--paper-dim)', margin: '3px 0' }}>
                            {d.date}
                          </div>
                          {d.isToday ? (
                            <span style={{ fontSize: '9.5px', fontWeight: 800, background: 'var(--brass)', color: '#0A0D14', padding: '1px 5px', borderRadius: '3px' }}>
                              HÔM NAY
                            </span>
                          ) : (
                            <span style={{ fontSize: '9.5px', color: 'var(--paper-dim)' }}>Lịch tập</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KHỐI 3: DANH SÁCH BÀI TẬP DO HUẤN LUYỆN VIÊN SẮP XẾP THEO THỜI GIAN THỰC */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '18px 20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🏇</span>
                        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--paper)', fontWeight: 700 }}>
                          Thông Tin Bài Tập Do Huấn Luyện Viên Sắp Xếp
                        </h3>
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--brass)', fontWeight: 600 }}>
                        Lên lịch tự động bởi HLV phụ trách
                      </span>
                    </div>

                    {myHorses.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--paper-dim)', fontSize: '13px' }}>
                        Chưa có chiến mã nào để HLV sắp xếp bài tập. Vui lòng đăng ký chiến mã vào đàn trước.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {myHorses.map(horse => {
                          const lockStatus = checkHorseVetLockStatus(horse.microchip || horse.id || horse.name);
                          const isLocked = lockStatus.isLocked || horse.isLockedByVet;
                          
                          // Lấy giáo án từ TrainerPage hoặc tạo bài tập phù hợp với HLV phụ trách
                          const matchedProg = trainerWorkouts.find(p => (p.horseName || '').toLowerCase() === (horse.name || '').toLowerCase());
                          const defaultTitle = horse.trainer?.toLowerCase().includes('nghĩa')
                            ? 'Bài tập bứt tốc cự ly 1.600m & rèn sức bền sân cỏ'
                            : horse.trainer?.toLowerCase().includes('anh')
                            ? 'Luyện xuất phát máy & nước rút 400m chặng cuối'
                            : 'Nâng cao thể lực nền sức bền 2.400m & kiểm soát nhịp tim';

                          const workoutTitle = matchedProg?.title || defaultTitle;
                          const targetDistance = matchedProg?.targetDistance || (horse.trainer?.toLowerCase().includes('nghĩa') ? 1600 : 2400);
                          const surface = matchedProg?.surface || 'GRASS (Sân cỏ Tự Nhiên)';

                          return (
                            <div key={horse.id} style={{
                              background: 'var(--bg-primary)',
                              border: isLocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--line)',
                              borderRadius: '10px',
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <img
                                    src={horse.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80'}
                                    alt={horse.name}
                                    style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                                  />
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--paper)', fontWeight: 700 }}>
                                        {horse.name}
                                      </h4>
                                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                                        {horse.stable || 'Ô C2'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--brass)', marginTop: '2px', fontWeight: 600 }}>
                                      🏇 HLV Phụ trách: {horse.trainer || 'Trần Văn Hùng (HLV Trưởng)'}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  {isLocked ? (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      color: '#EF4444',
                                      border: '1px solid rgba(239, 68, 68, 0.4)'
                                    }}>
                                      🔒 Khóa Y Tế (Cấm Tập)
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#10B981',
                                      border: '1px solid rgba(16, 185, 129, 0.4)'
                                    }}>
                                      ● Đang Áp Dụng Hôm Nay
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Chi tiết giáo án do HLV bố trí */}
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--line)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '12.5px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}>
                                <div style={{ fontWeight: 700, color: 'var(--paper)' }}>
                                  📋 Bài tập: <span style={{ color: 'var(--brass)' }}>{workoutTitle}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', color: 'var(--paper-dim)', fontSize: '12px' }}>
                                  <span>Cự ly mục tiêu: <b style={{ color: 'var(--paper)' }}>{targetDistance}m</b></span>
                                  <span>Mặt sân: <b style={{ color: 'var(--paper)' }}>{surface}</b></span>
                                  <span>Khung giờ HLV xếp: <b style={{ color: 'var(--paper)' }}>Sáng sớm 06:30 - 08:30</b></span>
                                </div>
                              </div>

                              {/* Cảnh báo y tế nếu bị khóa */}
                              {isLocked && (
                                <div style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: '#EF4444',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  lineHeight: 1.4
                                }}>
                                  ⛔ <b>Lệnh cấm tập từ Thú Y:</b> {lockStatus.reason || 'Bác sĩ Thú y kích hoạt Khóa Y Tế'}. Phải đợi Bác sĩ Thú y kiểm tra và mở khóa tại Cổng Thú Y thì mới được tập tiếp!
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* KHỐI 4: LỊCH TẬP LUYỆN CHUNG TRÊN SÂN (HIỂN THỊ CHI TIẾT LỊCH CỦA BẠN & TÔ ĐEN KHÓA LỊCH CỦA NGƯỜI KHÁC) */}
                  {jointSessions.length > 0 && (
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '16px 18px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>🤝</span>
                          <h3 style={{ margin: 0, fontSize: '14.5px', color: 'var(--paper)', fontWeight: 700 }}>
                            Lịch Tập Luyện Chung Trên Bãi Tập (06:00 — 18:00)
                          </h3>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--brass)', fontWeight: 600 }}>
                          Ưu tiên người đặt trước · Lịch kín được bảo mật
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {jointSessions.map(session => {
                          const isMyBooking = (String(session.ownerKey) === String(ownerKey) || session.ownerName === currentUser?.full_name);
                          const isConfirmed = session.status === 'CONFIRMED';
                          const isPending = session.status === 'PENDING';

                          // Nếu là lịch của người khác: Tô đen và khóa không cho xem chi tiết
                          if (!isMyBooking) {
                            return (
                              <div key={session.id} style={{
                                background: '#020408',
                                border: '1px solid #1a202c',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                color: '#475569',
                                cursor: 'not-allowed',
                                userSelect: 'none',
                                opacity: 0.65
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🔒</span> KHUNG GIỜ ĐÃ KÍN (Đã có chủ sở hữu khác đặt trước)
                                  </span>
                                  <span style={{ fontSize: '11px', background: '#0b0f19', color: '#64748b', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                                    {session.sessionDate} · {extractSlotPrefix(session.sessionTime)}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>
                                  HLV phụ trách: <b>{session.trainerName}</b> · <i>[Thông tin chiến mã và yêu cầu riêng tư được bảo mật, không thể xem]</i>
                                </div>
                              </div>
                            );
                          }

                          // Nếu là lịch của chính chủ sở hữu đang đăng nhập: Hiển thị đầy đủ
                          return (
                            <div key={session.id} style={{
                              background: 'var(--bg-primary)',
                              border: isConfirmed ? '1px solid rgba(16, 185, 129, 0.4)' : isPending ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              fontSize: '12.5px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <b style={{ color: 'var(--paper)' }}>Chiến mã: {session.horseName}</b>
                                  <span style={{ fontSize: '11px', color: 'var(--brass)' }}>· HLV: {session.trainerName}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: isConfirmed ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                                    {session.sessionDate} ({session.sessionTime.split(' (')[0]})
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: isConfirmed ? '#10B981' : '#F59E0B'
                                  }}>
                                    {isConfirmed ? '✓ ĐÃ DUYỆT' : '⏳ CHỜ DUYỆT'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ color: 'var(--paper-dim)', fontSize: '12px' }}>
                                🎯 Mục tiêu: {session.goal}
                              </div>
                              {session.trainerFeedback && (
                                <div style={{ marginTop: '6px', padding: '6px 10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10B981', color: 'var(--paper)', fontSize: '11.5px' }}>
                                  <b>Lời dặn của HLV:</b> {session.trainerFeedback}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* ===================================================================== */}
                {/* PHÍA GÓC PHẢI NHỎ: NƠI ĐẶT LỊCH CỦA CHỦ SỞ HỮU                       */}
                {/* ===================================================================== */}
                <div style={{
                  width: '370px',
                  maxWidth: '100%',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* FORM ĐẶT LỊCH TRỰC TIẾP TRÊN TRANG (THIẾT KẾ TINH GỌN, CAO CẤP, CHỐNG TRÙNG LỊCH) */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    borderRadius: '10px',
                    padding: '13px 15px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                  }}>
                    {/* Header gọn gàng */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>✍️</span>
                        <h4 style={{ margin: 0, fontSize: '13.5px', color: 'var(--brass)', fontWeight: 800, letterSpacing: '0.01em' }}>
                          Đặt Lịch Tập Cùng HLV
                        </h4>
                      </div>
                      <span style={{ fontSize: '9.5px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        06:00 — 18:00
                      </span>
                    </div>

                    <form onSubmit={handleSubmitJointBooking} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Chọn chiến mã */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--paper)', fontWeight: 700 }}>
                            Chiến mã ra sân
                          </label>
                          <span style={{ fontSize: '10px', color: 'var(--paper-dim)' }}>Chọn từ đàn ngựa</span>
                        </div>
                        <select
                          className="portal-input"
                          value={jointBookingForm.horseId}
                          onChange={(e) => setJointBookingForm({ ...jointBookingForm, horseId: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', fontWeight: 600, padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px' }}
                        >
                          {myHorses.map(h => {
                            const lockStatus = checkHorseVetLockStatus(h.microchip || h.id || h.name);
                            const isLocked = lockStatus.isLocked || h.isLockedByVet;
                            return (
                              <option key={h.id} value={h.id}>
                                {h.name} ({h.stable || 'Ô A1'}) {isLocked ? '⛔ [Khóa Y Tế]' : '✓ [Sẵn sàng]'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Cảnh báo khóa y tế nếu có */}
                      {(() => {
                        const currHorse = myHorses.find(h => String(h.id) === String(jointBookingForm.horseId)) || myHorses[0];
                        if (!currHorse) return null;
                        const lockStatus = checkHorseVetLockStatus(currHorse.microchip || currHorse.id || currHorse.name);
                        if (lockStatus.isLocked || currHorse.isLockedByVet) {
                          return (
                            <div style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.45)',
                              color: '#EF4444',
                              fontSize: '10.5px',
                              lineHeight: 1.35
                            }}>
                              ⛔ <b>Khóa y tế:</b> {lockStatus.reason || 'Dấu hiệu chấn thương'}. Phải đợi BS Thú y mở khóa!
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Hàng 2: HLV & Ngày tập */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--paper)', fontWeight: 700, marginBottom: '3px' }}>
                            Huấn luyện viên
                          </label>
                          <select
                            className="portal-input"
                            value={jointBookingForm.trainerUsername}
                            onChange={(e) => setJointBookingForm({ ...jointBookingForm, trainerUsername: e.target.value })}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 7px', fontSize: '11px', borderRadius: '6px' }}
                          >
                            {FIXED_TRAINERS_LIST.map(t => (
                              <option key={t.username} value={t.username}>
                                🏇 {t.name.split(' (')[0]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--paper)', fontWeight: 700, marginBottom: '3px' }}>
                            Ngày tập
                          </label>
                          <input
                            type="date"
                            className="portal-input"
                            value={jointBookingForm.sessionDate}
                            onChange={(e) => setJointBookingForm({ ...jointBookingForm, sessionDate: e.target.value })}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '5.5px 7px', fontSize: '11px', borderRadius: '6px' }}
                          />
                        </div>
                      </div>

                      {/* Hàng 3: Khung giờ & Logic chống trùng lịch (Tô đen lịch đã đặt & giờ nghỉ trưa) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--paper)', fontWeight: 700 }}>
                            Khung giờ (06:00 — 18:00)
                          </label>
                          <span style={{ fontSize: '9.5px', color: '#F59E0B' }}>
                            🍽️ Nghỉ trưa 11:45 — 13:00 (Khóa)
                          </span>
                        </div>
                        <select
                          className="portal-input"
                          value={jointBookingForm.sessionTime}
                          onChange={(e) => setJointBookingForm({ ...jointBookingForm, sessionTime: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          {TRAINING_TIME_SLOTS.map(slot => {
                            const status = getSlotBookingStatus(slot.id, jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
                            const isLunch = slot.isLunch;
                            const isBooked = status.isBooked;
                            const valueStr = `${slot.id} (${slot.desc})`;
                            return (
                              <option
                                key={slot.id}
                                value={valueStr}
                                disabled={isLunch || isBooked}
                                style={{
                                  background: isLunch || isBooked ? '#000000' : '#141a24',
                                  color: isLunch ? '#78716c' : isBooked ? '#71717a' : '#F3F4F6'
                                }}
                              >
                                {isLunch
                                  ? '🍽️ 11:45 - 13:00 [NGHỈ TRƯA & BẢO DƯỠNG SÂN BÃI]'
                                  : isBooked
                                  ? `🔒 ${slot.label} [ĐÃ CÓ NGƯỜI ĐẶT TRƯỚC - BÔI ĐEN]`
                                  : `🟢 ${slot.label} (${slot.desc.split(' - ')[1] || slot.desc})`}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Trực quan hóa ma trận khung giờ: Slot đã đặt hoặc nghỉ trưa bị tô đen, không bấm xem được */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '6px 8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                            Sơ đồ giờ tập theo ngày:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <button
                              type="button"
                              onClick={handleReset18hSchedule}
                              title="Tới tầm 18:00 tối hệ thống tự động reset. Bấm nút này để kích hoạt reset toàn bộ slot trống lúc 18h ngay lập tức"
                              style={{
                                background: 'rgba(212, 175, 55, 0.16)',
                                border: '1px solid rgba(212, 175, 55, 0.45)',
                                color: 'var(--brass)',
                                borderRadius: '4px',
                                fontSize: '8.5px',
                                padding: '1.5px 5px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              🔄 Reset 18h
                            </button>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                              ⬛ Bôi đen = Đã đặt
                            </span>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '9px',
                          color: 'var(--paper-dim)',
                          marginBottom: '6px',
                          padding: '2px 6px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '4px'
                        }}>
                          <span>⏰ Tập: 06:00 - 18:00</span>
                          <span style={{ color: '#10B981' }}>✓ 18:00 tự động mở trống</span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '4px'
                        }}>
                          {TRAINING_TIME_SLOTS.map(slot => {
                            const status = getSlotBookingStatus(slot.id, jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
                            const isLunch = slot.isLunch;
                            const isBooked = status.isBooked;
                            const isSelected = extractSlotPrefix(jointBookingForm.sessionTime) === slot.id;

                            // Giờ nghỉ trưa: Tô đen có viền nét đứt vàng nhạt, không bấm được
                            if (isLunch) {
                              return (
                                <div
                                  key={slot.id}
                                  title="11:45 - 13:00 là thời gian nghỉ trưa & bảo dưỡng bãi tập"
                                  style={{
                                    gridColumn: 'span 2',
                                    padding: '4px 2px',
                                    background: '#040608',
                                    border: '1px dashed rgba(245, 158, 11, 0.3)',
                                    borderRadius: '4px',
                                    color: '#78716c',
                                    fontSize: '9.5px',
                                    textAlign: 'center',
                                    cursor: 'not-allowed',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    opacity: 0.65
                                  }}
                                >
                                  🍽️ 11:45-13:00 (Nghỉ trưa)
                                </div>
                              );
                            }

                            // Slot đã bị chủ sở hữu khác đặt trước: Tô đen hoàn toàn, không bấm xem được nữa
                            if (isBooked) {
                              return (
                                <div
                                  key={slot.id}
                                  title="Đã có người đặt trước (Ưu tiên người đặt trước) - Đã bôi đen và không thể đặt"
                                  style={{
                                    padding: '5px 2px',
                                    background: '#000000',
                                    border: '1px solid #27272a',
                                    borderRadius: '4px',
                                    color: '#52525b',
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    cursor: 'not-allowed',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    textDecoration: 'line-through',
                                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.95)'
                                  }}
                                >
                                  🔒 {slot.label.split(' - ')[0]}
                                </div>
                              );
                            }

                            // Slot trống: Cho phép chọn
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setJointBookingForm(prev => ({
                                  ...prev,
                                  sessionTime: `${slot.id} (${slot.desc})`
                                }))}
                                style={{
                                  padding: '4px 2px',
                                  background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                  border: isSelected ? '1.5px solid var(--brass)' : '1px solid var(--line)',
                                  borderRadius: '4px',
                                  color: isSelected ? 'var(--brass)' : 'var(--paper)',
                                  fontSize: '10px',
                                  fontWeight: isSelected ? 800 : 500,
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease'
                                }}
                              >
                                {slot.label.split(' - ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mục tiêu buổi tập */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--paper)', fontWeight: 700, marginBottom: '3px' }}>
                          Mục tiêu buổi tập
                        </label>
                        <select
                          className="portal-input"
                          value={jointBookingForm.goal}
                          onChange={(e) => setJointBookingForm({ ...jointBookingForm, goal: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '6px 6px', fontSize: '10.5px', borderRadius: '6px' }}
                        >
                          <option value="Quan sát trực tiếp sải chân & kiểm tra thể lực cùng HLV">🔍 Sải chân & thể lực</option>
                          <option value="Tập luyện kỹ thuật điều khiển phối hợp giữa chủ và ngựa">🏇 Phối hợp chủ - ngựa</option>
                          <option value="Kiểm tra phản xạ xuất phát máy & chạy vòng cua">⚡ Phản xạ xuất phát & cua</option>
                          <option value="Thử sức cự ly dài 2.400m sân cỏ tự nhiên">🌿 Cự ly dài 2.400m</option>
                          <option value="Luyện bứt tốc nước rút 400m cuối sân cát">💨 Nước rút 400m cuối</option>
                        </select>
                      </div>

                      {/* Hàng 4: Ghi chú dòng đơn gọn gàng */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--paper-dim)', fontWeight: 600, marginBottom: '2px' }}>
                          Ghi chú cho HLV (Tùy chọn)
                        </label>
                        <input
                          type="text"
                          className="portal-input"
                          value={jointBookingForm.ownerNotes}
                          onChange={(e) => setJointBookingForm({ ...jointBookingForm, ownerNotes: e.target.value })}
                          placeholder="Ví dụ: Đo sải chân ở góc cua số 3..."
                          style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', fontSize: '11px', borderRadius: '6px' }}
                        />
                      </div>

                      {/* Nút gửi đặt lịch */}
                      {(() => {
                        const currHorse = myHorses.find(h => String(h.id) === String(jointBookingForm.horseId)) || myHorses[0];
                        const isLocked = currHorse ? (checkHorseVetLockStatus(currHorse.microchip || currHorse.id || currHorse.name).isLocked || currHorse.isLockedByVet) : false;
                        const slotStatus = getSlotBookingStatus(extractSlotPrefix(jointBookingForm.sessionTime), jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
                        const isUnavailable = isLocked || !slotStatus.available;

                        return (
                          <button
                            type="submit"
                            disabled={isUnavailable}
                            style={{
                              marginTop: '3px',
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              background: isUnavailable ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, var(--brass) 0%, #B89230 100%)',
                              color: isUnavailable ? 'var(--paper-dim)' : '#120E04',
                              fontWeight: 800,
                              fontSize: '12px',
                              border: 'none',
                              cursor: isUnavailable ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              boxShadow: isUnavailable ? 'none' : '0 3px 10px rgba(212, 175, 55, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isLocked
                              ? '⛔ Đang Khóa Y Tế (Cấm Tập)'
                              : slotStatus.isLunch
                              ? '🍽️ Giờ Nghỉ Trưa (Không Nhận Lịch)'
                              : slotStatus.isBooked
                              ? '🔒 Khung Giờ Đã Kín (Người Đặt Trước)'
                              : '🤝 Gửi Yêu Cầu Đặt Lịch'}
                          </button>
                        );
                      })()}
                    </form>
                  </div>

                  {/* KHỐI CÁC YÊU CẦU ĐẶT LỊCH ĐÃ GỬI CỦA BẠN */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Yêu Cầu Đặt Lịch Của Bạn</span>
                      <span style={{ fontSize: '11px', color: 'var(--brass)' }}>
                        {jointSessions.filter(s => String(s.ownerKey) === String(ownerKey) || s.ownerName === currentUser?.full_name).length} lịch
                      </span>
                    </div>

                    {jointSessions.filter(s => String(s.ownerKey) === String(ownerKey) || s.ownerName === currentUser?.full_name).length === 0 ? (
                      <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--paper-dim)', fontSize: '12px' }}>
                        Chưa có lịch hẹn nào. Hãy gửi yêu cầu ở form phía trên!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {jointSessions.filter(s => String(s.ownerKey) === String(ownerKey) || s.ownerName === currentUser?.full_name).map(session => {
                          const isPending = session.status === 'PENDING';
                          const isConfirmed = session.status === 'CONFIRMED';

                          return (
                            <div key={session.id} style={{
                              background: 'var(--bg-primary)',
                              border: isPending ? '1px solid rgba(245, 158, 11, 0.4)' : isConfirmed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--line)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              fontSize: '12px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <b style={{ color: 'var(--paper)' }}>{session.horseName}</b>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  background: isPending ? 'rgba(245, 158, 11, 0.15)' : isConfirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isPending ? '#F59E0B' : isConfirmed ? '#10B981' : '#EF4444'
                                }}>
                                  {isPending ? '⏳ Chờ HLV duyệt' : isConfirmed ? '✓ Đã xác nhận' : 'HLV phản hồi'}
                                </span>
                              </div>
                              <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px' }}>
                                📅 {session.sessionDate} ({session.sessionTime})
                              </div>
                              <div style={{ color: 'var(--brass)', fontSize: '11px', marginTop: '2px' }}>
                                🏇 HLV: {session.trainerName}
                              </div>
                              {session.trainerFeedback && (
                                <div style={{ marginTop: '4px', padding: '4px 6px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '3px', color: 'var(--paper)', fontSize: '11px' }}>
                                  <b>HLV dặn:</b> {session.trainerFeedback}
                                </div>
                              )}
                              {isPending && (
                                <div style={{ marginTop: '6px', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelJointSession(session.id)}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      border: '1px solid var(--line)',
                                      background: 'transparent',
                                      color: 'var(--paper-dim)',
                                      fontSize: '10.5px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Hủy yêu cầu
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TIẾN ĐỘ HUẤN LUYỆN (TRAINING & TELEMETRY) */}
          {/* ========================================================================= */}
          {activeTab === 'training' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 className="pane-title">Chỉ Số Viễn Trắc & Lịch Huấn Luyện Chung (Training & Telemetry)</h2>
                  <p className="pane-desc">Chủ sở hữu có thể đặt lịch tập luyện chung với HLV, theo dõi nhịp tim viễn trắc và nhận xét phong độ trực tiếp.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenJointBookingModal()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🤝</span> + Đặt Lịch Tập Luyện Chung Với HLV
                </button>
              </div>

              {/* KHỐI LỊCH HẸN TẬP LUYỆN CHUNG CÙNG HUẤN LUYỆN VIÊN */}
              <div style={{
                marginBottom: '20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>📅</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--paper)', fontWeight: 700 }}>
                        Lịch Hẹn Tập Luyện Chung Cùng HLV & Chiến Mã
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                        Đồng hành trực tiếp tại trường đua cùng Huấn luyện viên để kiểm tra phản xạ, tốc độ nước rút và sự gắn kết với chiến mã.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenJointBookingModal()}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      background: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      color: 'var(--brass)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Đặt Lịch Mới
                  </button>
                </div>

                {jointSessions.filter(s => String(s.ownerKey) === String(ownerKey) || s.ownerName === currentUser?.full_name).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--paper-dim)', fontSize: '13px' }}>
                    Bạn chưa có lịch hẹn tập luyện chung nào. Bấm <b>"+ Đặt Lịch Mới"</b> để đăng ký một buổi ra sân cùng Huấn luyện viên!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                    {jointSessions.filter(s => String(s.ownerKey) === String(ownerKey) || s.ownerName === currentUser?.full_name).map(session => {
                      const isLocked = checkHorseVetLockStatus(session.microchip || session.horseName).isLocked;
                      const isPending = session.status === 'PENDING';
                      const isConfirmed = session.status === 'CONFIRMED';

                      return (
                        <div key={session.id} style={{
                          background: 'var(--bg-primary)',
                          border: isPending ? '1px solid rgba(245, 158, 11, 0.4)' : isConfirmed ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--line)',
                          borderRadius: '8px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <img
                                  src={session.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80'}
                                  alt={session.horseName}
                                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--paper)', fontWeight: 700 }}>
                                    {session.horseName}
                                  </h4>
                                  <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                                    HLV: <b style={{ color: 'var(--brass)' }}>{session.trainerName}</b>
                                  </span>
                                </div>
                              </div>

                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: isPending ? 'rgba(245, 158, 11, 0.15)' : isConfirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isPending ? '#F59E0B' : isConfirmed ? '#10B981' : '#EF4444',
                                border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.4)' : isConfirmed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                              }}>
                                {isPending ? '⏳ Chờ HLV duyệt' : isConfirmed ? '✓ HLV Đã xác nhận' : 'HLV phản hồi'}
                              </span>
                            </div>

                            {/* Cảnh báo khóa y tế */}
                            {isLocked && (
                              <div style={{
                                margin: '6px 0',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#EF4444',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span>🔒</span>
                                <span>Chiến mã đang bị Thú Y khóa! Phải chờ Thú y mở khóa mới được tập.</span>
                              </div>
                            )}

                            <div style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.5, margin: '8px 0' }}>
                              <div>📅 <b>Thời gian:</b> <span style={{ color: 'var(--paper)' }}>{session.sessionDate}</span> ({session.sessionTime})</div>
                              <div>🎯 <b>Mục tiêu:</b> <span style={{ color: 'var(--brass)' }}>{session.goal}</span></div>
                              {session.ownerNotes && (
                                <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                                  Ghi chú của bạn: "{session.ownerNotes}"
                                </div>
                              )}
                              {session.trainerFeedback && (
                                <div style={{ marginTop: '6px', padding: '6px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', borderLeft: '3px solid #10B981', fontSize: '11.5px', color: 'var(--paper)' }}>
                                  <b>Phản hồi từ HLV:</b> {session.trainerFeedback}
                                </div>
                              )}
                            </div>
                          </div>

                          {isPending && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleCancelJointSession(session.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--line)',
                                  background: 'transparent',
                                  color: 'var(--paper-dim)',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                Hủy yêu cầu
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BANNER PHÂN BIỆT BÁO CÁO TÓM TẮT vs IOT REAL-TIME */}
              {membershipTier !== 'PREMIUM' && (
                <div style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>📋</span>
                    <div>
                      <b style={{ fontSize: '13px', color: 'var(--brass)' }}>Chế Độ Báo Cáo Huấn Luyện Tóm Tắt (Gói 0 Đồng)</b>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                        Bạn đang nhận bản tóm tắt phong độ định kỳ cuối tuần. Nâng cấp VIP để mở khóa cảm biến IoT Real-time đo gia tốc & nhịp tim từng mét chạy.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpgradePromptModal({
                      title: 'Mở Khóa Viễn Trắc IoT Real-Time',
                      badge: 'ĐẶC QUYỀN VIP',
                      message: 'Chỉ số viễn trắc IoT (tốc độ từng chặng, gia tốc kế, biểu đồ nhịp tim thời gian thực và phân tích sải chân) là công cụ độc quyền của Gói HORSE PREMIUM VIP.',
                      benefit: '✨ HLV Trưởng có thể tinh chỉnh giáo án 1-kèm-1 và phát hiện sớm rủi ro quá tải thể lực của chiến mã.',
                      actionText: 'Nâng Cấp Gói VIP Ngay'
                    })}
                    style={{
                      padding: '7px 15px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ⚡ Mở Khóa IoT Real-Time
                  </button>
                </div>
              )}

              {trainingTelemetry.length === 0 ? (
                <div className="facility-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <IconChart size={32} color="var(--paper-dim)" />
                  <h3 style={{ fontSize: '16px', color: 'var(--paper)', margin: '12px 0 6px' }}>
                    Chưa Có Dữ Liệu Huấn Luyện
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '420px', margin: '0 auto 16px' }}>
                    Khi bạn đăng ký chiến mã vào câu lạc bộ, HLV trưởng sẽ tiến hành các buổi chạy thử sân và ghi nhận chỉ số viễn trắc tại đây.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddHorseModal}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 700,
                      border: 'none',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    + Đăng ký chiến mã ngay
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {trainingTelemetry.map((t) => {
                    const matchedHorse = myHorses.find(h =>
                      (h.name && h.name.toLowerCase() === t.horseName?.toLowerCase()) ||
                      String(h.id) === String(t.id) ||
                      String(h.id) === String(t.horseId)
                    ) || {
                      id: t.id || t.horseName,
                      name: t.horseName,
                      horseName: t.horseName,
                      stall: t.stable,
                      stable: t.stable,
                      avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80',
                      breed: 'Thoroughbred (Thuần chủng)',
                      microchip: 'MC-VN-2026-001',
                      maxSpeed: parseFloat(t.maxSpeed) || 52.0,
                      avgHeartRate: parseInt(t.peakHeartRate) || 190,
                      condition: t.readinessScore ? `${parseFloat(t.readinessScore) * 10}%` : '85%'
                    };
                    const telem = getHorseFitnessTelemetry(matchedHorse, jointSessions);
                    const isCalibrating = isHorseCalibrating(matchedHorse, jointSessions);

                    return (
                      <div key={t.id} className="facility-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <b style={{ fontSize: '16.5px', color: 'var(--brass)' }}>{t.horseName}</b>
                            <span style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginLeft: '10px' }}>{t.stable} · Buổi tập: {t.sessionDate}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: 'rgba(212, 175, 55, 0.15)',
                              color: 'var(--brass)',
                              border: '1px solid var(--brass)'
                            }}>
                              CỰ LY: {t.distanceMeters}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFitnessDetailModalHorse(matchedHorse)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: 'var(--brass)',
                                color: '#0A0D14',
                                fontWeight: 800,
                                border: 'none',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)',
                                whiteSpace: 'nowrap'
                              }}
                              title="Xem chi tiết các biểu đồ thể lực, nhịp tim và tải luyện tập như bên Huấn Luyện Viên"
                            >
                              <span>📊</span>
                              <span>Xem Thể Lực (EvoLab)</span>
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                          {/* Box 1: Tốc độ bứt phá */}
                          <div
                            style={{
                              background: 'var(--bg-secondary)',
                              padding: '10px 12px',
                              borderRadius: '6px',
                              cursor: membershipTier === 'PREMIUM' ? 'default' : 'pointer'
                            }}
                            onClick={() => {
                              if (membershipTier !== 'PREMIUM') {
                                setUpgradePromptModal({
                                  title: 'Mở Khóa Tốc Độ Bứt Phá Real-Time',
                                  badge: 'ĐẶC QUYỀN VIP',
                                  message: 'Cảm biến gia tốc IoT thời gian thực ghi nhận vận tốc tối đa tại từng khúc cua và cự ly bứt phá nước rút của chiến mã.',
                                  benefit: '✨ Đặc quyền VIP: Xem đồ thị tốc độ chi tiết từng giây chạy và phân tích góc nghiêng chân tiếp đất.',
                                  actionText: 'Nâng Cấp Gói VIP Ngay'
                                });
                              }
                            }}
                          >
                            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>TỐC ĐỘ BỨT PHÁ MAX</div>
                            {membershipTier === 'PREMIUM' ? (
                              <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.maxSpeed}</b>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--brass)', fontWeight: 700 }}>🔒 VIP IoT</span>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>(Bấm mở khóa)</span>
                              </div>
                            )}
                          </div>

                          {/* Box 2: Tốc độ trung bình */}
                          <div
                            style={{
                              background: 'var(--bg-secondary)',
                              padding: '10px 12px',
                              borderRadius: '6px',
                              cursor: membershipTier === 'PREMIUM' ? 'default' : 'pointer'
                            }}
                            onClick={() => {
                              if (membershipTier !== 'PREMIUM') {
                                setUpgradePromptModal({
                                  title: 'Mở Khóa Vận Tốc Trung Bình Real-Time',
                                  badge: 'ĐẶC QUYỀN VIP',
                                  message: 'Tốc độ trung bình theo từng phân đoạn 400m được tính toán tự động qua chip định vị vệ tinh GPS đa băng tần.',
                                  benefit: '✨ Đặc quyền VIP: Báo cáo phân tích chuyên sâu hiệu suất phân phối thể lực trong suốt hành trình đua.',
                                  actionText: 'Nâng Cấp Gói VIP Ngay'
                                });
                              }
                            }}
                          >
                            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>TỐC ĐỘ TRUNG BÌNH</div>
                            {membershipTier === 'PREMIUM' ? (
                              <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.avgSpeed}</b>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--brass)', fontWeight: 700 }}>🔒 VIP IoT</span>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>(Bấm mở khóa)</span>
                              </div>
                            )}
                          </div>

                          {/* Box 3: Nhịp tim */}
                          <div
                            style={{
                              background: 'var(--bg-secondary)',
                              padding: '10px 12px',
                              borderRadius: '6px',
                              cursor: membershipTier === 'PREMIUM' ? 'default' : 'pointer'
                            }}
                            onClick={() => {
                              if (membershipTier !== 'PREMIUM') {
                                setUpgradePromptModal({
                                  title: 'Mở Khóa Điện Tâm Đồ & Nhịp Tim Real-Time',
                                  badge: 'ĐẶC QUYỀN VIP',
                                  message: 'Vòng đeo đai ngực thông minh đo nhịp tim liên tục (bpm) khi vận động cực đại và thời gian phục hồi tim về mức nghỉ ngơi.',
                                  benefit: '✨ Đặc quyền VIP: Cảnh báo sớm hội chứng quá tải cơ tim và phòng ngừa đột quỵ khi thi đấu cường độ cao.',
                                  actionText: 'Nâng Cấp Gói VIP Ngay'
                                });
                              }
                            }}
                          >
                            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>NHỊP TIM ĐỈNH / HỒI PHỤC</div>
                            {membershipTier === 'PREMIUM' ? (
                              <b style={{ fontSize: '15px', color: 'var(--paper)' }}>{t.peakHeartRate}</b>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--brass)', fontWeight: 700 }}>🔒 VIP IoT</span>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>(Bấm mở khóa)</span>
                              </div>
                            )}
                          </div>

                          {/* Box 4: Điểm sẵn sàng thi đấu */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>ĐIỂM SẴN SÀNG THI ĐẤU</div>
                            <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{t.readinessScore}</b>
                          </div>
                        </div>

                        {/* KHỐI ĐỒNG BỘ THỂ LỰC & TẢI TẬP EVOLAB Y CHANG BÊN HLV */}
                        <div style={{
                          background: isCalibrating ? 'rgba(245, 158, 11, 0.04)' : 'var(--bg-secondary)',
                          border: isCalibrating ? '1px dashed rgba(245, 158, 11, 0.35)' : '1px solid var(--line)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          marginBottom: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📈</span> CHỈ SỐ THỂ LỰC & TẢI TẬP LUYỆN EVOLAB (ĐỒNG BỘ TỪ HLV TRƯỞNG)
                            </span>
                            <button
                              type="button"
                              onClick={() => setFitnessDetailModalHorse(matchedHorse)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--brass)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0
                              }}
                            >
                              Mở toàn bộ biểu đồ & nhật ký viễn trắc →
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', textAlign: 'center' }}>
                            <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Tải Ngắn Hạn (ATL)</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: isCalibrating ? '#64748B' : 'var(--paper)', marginTop: '2px' }}>
                                {isCalibrating ? '-- TL' : `${telem.shortTermLoad || 46} TL`}
                              </div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Tải Dài Hạn (CTL)</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: isCalibrating ? '#64748B' : 'var(--paper)', marginTop: '2px' }}>
                                {isCalibrating ? '-- TL' : `${telem.longTermLoad || 54} TL`}
                              </div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Tỉ Lệ Tải (Load Ratio)</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: isCalibrating ? '#64748B' : '#10B981', marginTop: '2px' }}>
                                {isCalibrating ? '-- %' : `${telem.loadRatio || 85}%`}
                              </div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Hồi Phục Thể Lực</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
                                {isCalibrating ? 'Đang hiệu chuẩn' : `${telem.recoveryPercent || 85}% (Sung mãn)`}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.45, background: 'rgba(212, 175, 55, 0.05)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                          <b>Nhận xét của HLV Trưởng:</b>{' '}
                          {membershipTier === 'PREMIUM' ? (
                            t.trainerFeedback
                          ) : (
                            <span>
                              Báo cáo tóm tắt cuối tuần: Chiến mã duy trì thể lực tốt, hoàn thành trọn vẹn cự ly bài tập.{' '}
                              <button
                                type="button"
                                onClick={() => setUpgradePromptModal({
                                  title: 'Giáo Án Huấn Luyện 1-Kèm-1 Với HLV Trưởng',
                                  badge: 'ĐẶC QUYỀN VIP',
                                  message: 'Chủ sở hữu gói VIP được trực tiếp trao đổi chiến thuật và nhận giáo án huấn luyện cá nhân hóa 1-kèm-1 trực tiếp từ HLV Trưởng Trần Văn Hùng.',
                                  benefit: '✨ Thiết lập bài tập chuyên biệt theo từng cự ly và trường đua để tối ưu cơ hội giật cúp vô địch.',
                                  actionText: 'Nâng Cấp Gói VIP Ngay'
                                })}
                                style={{ background: 'none', border: 'none', color: 'var(--brass)', fontWeight: 700, padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: '12.5px' }}
                              >
                                (Nâng cấp VIP để nhận giáo án 1-kèm-1)
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GIẢI ĐUA & ĐĂNG KÝ THI ĐẤU (RACES & NOMINATIONS) */}
          {/* ========================================================================= */}
          {activeTab === 'races' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 className="pane-title">Giải Đua Ngựa & Đăng Ký Thi Đấu (Race Entries & Tournaments)</h2>
                  <p className="pane-desc">Đăng ký chiến mã vào các giải đấu mở và phê duyệt hoặc rút lui đề cử tham gia giải đua.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenRaceRegister(OPEN_TOURNAMENTS[0])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  <IconTrophy size={16} color="#0A0D14" />
                  <span>+ Đăng ký giải đấu mới</span>
                </button>
              </div>

              {/* Phần 1: Các giải đấu đang mở ghi danh */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brass)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏆 CÁC GIẢI ĐẤU ĐANG MỞ ĐĂNG KÝ THI ĐẤU (OPEN OFFICIAL TOURNAMENTS)</span>
                </div>

                <div className="portal-cards-grid" style={{ display: 'grid', gap: '14px' }}>
                  {OPEN_TOURNAMENTS.map(tourn => (
                    <div key={tourn.id} className="facility-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <b style={{ fontSize: '15px', color: 'var(--paper)', lineHeight: 1.3 }}>{tourn.name}</b>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            background: 'rgba(212, 175, 55, 0.15)',
                            color: 'var(--brass)',
                            border: '1px solid var(--brass)',
                            whiteSpace: 'nowrap'
                          }}>
                            {tourn.distance}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '10px' }}>
                          {tourn.track} · {tourn.surface}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.4, margin: '0 0 12px' }}>
                          {tourn.description}
                        </p>

                        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div>Ngày đua: <b style={{ color: 'var(--paper)' }}>{tourn.date}</b></div>
                          <div>Tổng thưởng: <b style={{ color: 'var(--brass)' }}>{formatVND(tourn.totalPurse)}</b></div>
                        </div>

                        {/* QUYỀN LỢI KHÁN ĐÀI: TIÊU CHUẨN vs VIP LOUNGE */}
                        <div style={{
                          marginBottom: '14px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
                          border: `1px solid ${membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.3)' : 'var(--line)'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11.5px',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          <span style={{ color: 'var(--paper-dim)' }}>Quyền lợi khán đài:</span>
                          {membershipTier === 'PREMIUM' ? (
                            <span style={{ color: 'var(--brass)', fontWeight: 700 }}>
                              👑 VIP Lounge & Paddock Pass
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--paper)', fontWeight: 600 }}>🎟️ Khán đài tiêu chuẩn</span>
                              <button
                                type="button"
                                onClick={() => setUpgradePromptModal({
                                  title: 'Đặc Quyền VIP Lounge & Khu Paddock',
                                  badge: 'ĐẶC QUYỀN VIP',
                                  message: 'Gói 0 Đồng trang bị Vé khán đài tiêu chuẩn. Nâng cấp lên gói HORSE PREMIUM VIP để nhận Thẻ VIP Lounge cao cấp có điều hòa và lối đi riêng vào khu cách ly Paddock đồng hành cùng chiến mã trước giờ xuất phát.',
                                  benefit: '✨ Không gian xem đua chuẩn thượng lưu, tiệc teabreak và tiếp cận trực tiếp khu chuẩn bị thi đấu cùng Huấn luyện viên trưởng.',
                                  actionText: 'Nâng Cấp Gói VIP Ngay'
                                })}
                                style={{
                                  background: 'rgba(212, 175, 55, 0.15)',
                                  border: '1px solid var(--brass)',
                                  color: 'var(--brass)',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Nâng VIP
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenRaceRegister(tourn)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          background: 'var(--brass)',
                          color: '#0A0D14',
                          fontWeight: 700,
                          border: 'none',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <IconTrophy size={14} color="#0A0D14" />
                        <span>Đăng Ký Tham Gia Giải Này</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phần 2: Danh sách các giải mà chủ sở hữu đã đăng ký / đề cử */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  📋 DANH SÁCH GIẢI ĐẤU CỦA BẠN ({raceNominations.length})
                </div>

                {raceNominations.length === 0 ? (
                  <div className="facility-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--paper-dim)', margin: 0 }}>
                      Bạn chưa đăng ký giải đấu nào cho chiến mã. Hãy chọn một giải đấu mở ở trên và bấm <b>"Đăng Ký Tham Gia Giải Này"</b>.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {raceNominations.map((r) => {
                      const isApproved = r.nominationStatus === 'APPROVED' || r.nominationStatus === 'CONFIRMED';
                      const isWithdrawn = r.nominationStatus === 'WITHDRAWN';
                      const isRejected = r.nominationStatus === 'REJECTED' || r.nominationStatus === 'DECLINED';
                      const isDelegatedPending = r.delegatedToTrainer && !r.trainerAssigned && (r.nominationStatus === 'PENDING_TRAINER_SELECTION' || r.nominationStatus === 'PENDING_TRAINER');
                      const isPendingTrainer = !isDelegatedPending && (r.nominationStatus === 'PENDING_TRAINER' || r.nominationStatus === 'PENDING' || (!isApproved && !isWithdrawn && !isRejected));

                      return (
                        <div key={r.id} className="facility-card" style={{ padding: '22px', border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : isDelegatedPending ? '1.5px dashed var(--brass)' : '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{r.raceName}</b>
                              <div style={{ fontSize: '12.5px', marginTop: '2px' }}>
                                {isDelegatedPending ? (
                                  <span style={{ color: 'var(--brass)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                                    <span>🎯</span> Chiến mã: <i>Đang nhờ HLV {r.targetTrainer || 'Trần Văn Hùng'} tuyển chọn</i>
                                  </span>
                                ) : r.trainerAssigned ? (
                                  <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                                    <span>🎯</span> Chiến mã (HLV chỉ định): <b style={{ color: 'var(--brass)', fontSize: '13.5px' }}>{r.horseName}</b>
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--brass)', fontWeight: 600 }}>Chiến mã: {r.horseName}</span>
                                )} · <span style={{ color: 'var(--paper-dim)' }}>{r.distance} ({r.track})</span>
                              </div>
                            </div>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.03em',
                              background: isApproved 
                                ? 'rgba(16, 185, 129, 0.15)' 
                                : isRejected
                                ? 'rgba(239, 68, 68, 0.15)'
                                : isWithdrawn
                                ? 'var(--bg-secondary)'
                                : isDelegatedPending
                                ? 'rgba(212, 175, 55, 0.2)'
                                : 'rgba(212, 175, 55, 0.15)',
                              color: isApproved 
                                ? '#10B981' 
                                : isRejected
                                ? '#EF4444'
                                : isWithdrawn
                                ? 'var(--paper-dim)'
                                : 'var(--brass)',
                              border: `1px solid ${isApproved ? '#10B981' : isRejected ? '#EF4444' : isWithdrawn ? 'var(--line)' : 'var(--brass)'}`
                            }}>
                              {isApproved 
                                ? (r.trainerAssigned ? '✓ HLV ĐÃ CHỈ ĐỊNH NGỰA & PHÊ DUYỆT' : '✓ HLV TRƯỞNG ĐÃ PHÊ DUYỆT')
                                : isRejected
                                ? '✗ HLV YÊU CẦU RÈN THÊM'
                                : isWithdrawn 
                                ? 'ĐÃ RÚT LUI' 
                                : isDelegatedPending
                                ? '🎯 ĐANG CHỜ HLV CHỈ ĐỊNH NGỰA'
                                : '⏳ CHỜ HLV TRƯỞNG PHÊ DUYỆT'}
                            </span>
                          </div>

                          {/* KHỐI ỦY THÁC CHỜ HLV CHỈ ĐỊNH NGỰA */}
                          {isDelegatedPending && (
                            <div style={{
                              background: 'rgba(212, 175, 55, 0.08)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              borderRadius: '6px',
                              padding: '10px 14px',
                              fontSize: '12.5px',
                              color: 'var(--paper)',
                              marginBottom: '12px',
                              lineHeight: 1.5
                            }}>
                              <b style={{ color: 'var(--brass)' }}>🎯 Ủy thác chuyên môn:</b> Bạn đã chọn chế độ nhờ Huấn luyện viên trưởng ({r.targetTrainer || 'Trần Văn Hùng'}) đối soát phong độ thể lực và chỉ định chiến mã phù hợp nhất cho cự ly <b>{r.distance}</b> tại <b>{r.track}</b>. Ngay sau khi HLV xác nhận chỉ định, tên chiến mã và lời phê chiến thuật sẽ lập tức hiển thị tại đây.
                            </div>
                          )}

                          {/* KHỐI THÔNG BÁO TIẾN ĐỘ DUYỆT CỦA HUẤN LUYỆN VIÊN TRƯỞNG */}
                          {isPendingTrainer && (
                            <div style={{
                              background: 'rgba(212, 175, 55, 0.08)',
                              border: '1px solid rgba(212, 175, 55, 0.25)',
                              borderRadius: '6px',
                              padding: '10px 14px',
                              fontSize: '12.5px',
                              color: 'var(--paper)',
                              marginBottom: '12px',
                              lineHeight: 1.5
                            }}>
                              <b style={{ color: 'var(--brass)' }}>Đang thẩm định thể lực:</b> Hồ sơ đăng ký đã chuyển đến Huấn luyện viên trưởng. HLV sẽ kiểm tra chỉ số sinh trắc (nhịp tim, vận tốc tập luyện gần nhất) trước khi phê duyệt quyền xuất phát chính thức.
                            </div>
                          )}

                          {isApproved && (
                            <div style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              borderRadius: '6px',
                              padding: '10px 14px',
                              fontSize: '12.5px',
                              color: 'var(--paper)',
                              marginBottom: '12px',
                              lineHeight: 1.5
                            }}>
                              <b style={{ color: '#10B981' }}>
                                {r.trainerAssigned ? '🎯 HLV Trưởng Đã Tuyển Chọn & Phê Duyệt' : `HLV Trưởng (${r.reviewedBy || 'Trần Văn Hùng'}):`}
                              </b>{' '}
                              {r.trainerFeedback || `Chiến mã "${r.horseName}" đạt 100% phong độ thể lực, chỉ số viễn trắc ổn định. Đã chỉ định cấp phép xuất phát chính thức.`}
                            </div>
                          )}

                          {isRejected && (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '6px',
                              padding: '10px 14px',
                              fontSize: '12.5px',
                              color: 'var(--paper)',
                              marginBottom: '12px',
                              lineHeight: 1.5
                            }}>
                              <b style={{ color: '#EF4444' }}>Ý kiến HLV Trưởng ({r.reviewedBy || 'Trần Văn Hùng'}):</b> {r.trainerFeedback || 'Chiến mã cần rèn luyện thêm bài tập thể lực trên sân cát và theo dõi nhịp tim phục hồi trước khi thi đấu.'}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>Ngày thi đấu: <b style={{ color: 'var(--paper)' }}>{r.date}</b></div>
                            <div>Kỵ mã: <b style={{ color: 'var(--paper)' }}>{r.jockey || 'Chưa chỉ định'}</b></div>
                            <div>Tổng giải thưởng: <b style={{ color: 'var(--brass)' }}>{formatVND(r.estimatedPurse)}</b></div>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '14px' }}>
                            Ghi chú: {r.notes}
                          </div>

                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            {isPendingTrainer && (
                              <button
                                type="button"
                                onClick={() => handleToggleNomination(r.id, 'WITHDRAWN')}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  background: 'transparent',
                                  color: 'var(--paper-dim)',
                                  border: '1px solid var(--line)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Rút đơn đăng ký
                              </button>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => handleToggleNomination(r.id, 'PENDING_TRAINER')}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '6px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  fontWeight: 700,
                                  border: 'none',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                ⚡ Yêu cầu HLV thẩm định lại
                              </button>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleToggleNomination(r.id, 'WITHDRAWN')}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--paper)',
                                  border: '1px solid var(--line)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Hủy / Rút lui giải đấu
                              </button>
                            )}

                            {isWithdrawn && (
                              <button
                                type="button"
                                onClick={() => handleToggleNomination(r.id, 'PENDING_TRAINER')}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  fontWeight: 700,
                                  border: 'none',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Gửi đăng ký lại cho HLV
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: QUYẾT TOÁN & NHẬT KÝ GIAO DỊCH (FINANCIAL & TRANSACTION LOGS) */}
          {/* ========================================================================= */}
          {activeTab === 'finance' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="pane-title">Giao Dịch, Thanh Toán & Đối Soát Tài Chính</h2>
                  <p className="pane-desc">Theo dõi nhật ký thanh toán các gói hội viên VIP, phí dịch vụ và bảng kê quyết toán định kỳ.</p>
                </div>
                {(!hasVipSubscription && membershipTier !== 'PREMIUM') && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 700,
                      border: 'none',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(212, 175, 55, 0.25)'
                    }}
                  >
                    <IconReceipt size={16} color="#0A0D14" />
                    <span>+ Thanh Toán Gói VIP Ngay</span>
                  </button>
                )}
              </div>

              {/* KHỐI TỔNG QUAN TÀI CHÍNH */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '22px'
              }}>
                <div className="facility-card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    TỔNG TIỀN ĐÃ THANH TOÁN
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brass)', margin: '6px 0 2px', fontFamily: 'var(--display)' }}>
                    {formatVND(totalPaidAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    {paymentHistory.length} giao dịch thành công
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    TỔNG THƯỞNG GIẢI ĐUA
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', margin: '6px 0 2px', fontFamily: 'var(--display)' }}>
                    +{formatVND(totalPrizeAll)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Doanh thu giải đấu tích lũy
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    SỐ DƯ QUỸ RÒNG CHIẾN MÃ
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px', fontFamily: 'var(--display)' }}>
                    {formatVND(netFundBalance)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Sau khấu trừ phí chuồng & HLV
                  </div>
                </div>
              </div>

              {/* TABS ĐIỀU HƯỚNG PHỤ: NHẬT KÝ GIAO DỊCH vs BẢNG KÊ QUYẾT TOÁN */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('transactions')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: financeSubTab === 'transactions' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${financeSubTab === 'transactions' ? 'var(--brass)' : 'var(--line)'}`,
                    color: financeSubTab === 'transactions' ? 'var(--brass)' : 'var(--paper)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px'
                  }}
                >
                  <IconReceipt size={16} />
                  <span>Nhật Ký Giao Dịch & Thanh Toán ({paymentHistory.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFinanceSubTab('statements')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: financeSubTab === 'statements' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${financeSubTab === 'statements' ? 'var(--brass)' : 'var(--line)'}`,
                    color: financeSubTab === 'statements' ? 'var(--brass)' : 'var(--paper)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px'
                  }}
                >
                  <IconWallet size={16} />
                  <span>Bảng Kê Đối Soát Định Kỳ ({statements.length})</span>
                </button>
              </div>

              {/* NỘI DUNG 1: NHẬT KÝ GIAO DỊCH & HÓA ĐƠN THANH TOÁN */}
              {financeSubTab === 'transactions' && (
                <div>
                  {/* Thanh tìm kiếm nhanh giao dịch */}
                  <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <input
                        type="text"
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        placeholder="🔍 Tìm theo mã giao dịch, tên gói, phương thức..."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          color: 'var(--paper)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                      Hiển thị <b>{filteredPayments.length}</b> / {paymentHistory.length} giao dịch
                    </div>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <div className="facility-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                      <IconReceipt size={36} color="var(--paper-dim)" />
                      <h3 style={{ fontSize: '16px', color: 'var(--paper)', margin: '14px 0 6px' }}>
                        Chưa Có Giao Dịch Thanh Toán Nào
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '440px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                        Khi bạn thực hiện thanh toán gói hội viên VIP hoặc các dịch vụ tại trường đua, nhật ký và hóa đơn điện tử sẽ được lưu trữ minh bạch tại đây.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasVipSubscription) {
                            handleSelectTier('PREMIUM');
                          } else {
                            setShowPaymentModal(true);
                          }
                        }}
                        style={{
                          padding: '9px 20px',
                          borderRadius: '6px',
                          background: 'var(--brass)',
                          color: '#0A0D14',
                          fontWeight: 700,
                          border: 'none',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {hasVipSubscription ? '👑 Khôi Phục Đặc Quyền VIP (Miễn Phí)' : '⚡ Nâng Cấp Gói VIP Ngay'}
                      </button>
                    </div>
                  ) : (
                    <div className="facility-card" style={{ padding: 0, overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '700px' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            <th style={{ padding: '14px 18px' }}>Mã giao dịch</th>
                            <th style={{ padding: '14px 18px' }}>Khoản thanh toán</th>
                            <th style={{ padding: '14px 18px' }}>Phương thức</th>
                            <th style={{ padding: '14px 18px' }}>Thời gian</th>
                            <th style={{ padding: '14px 18px' }}>Số tiền</th>
                            <th style={{ padding: '14px 18px' }}>Trạng thái</th>
                            <th style={{ padding: '14px 18px', textAlign: 'right' }}>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((p, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '14px 18px' }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: 'var(--brass)',
                                  background: 'rgba(212, 175, 55, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  {p.transactionId}
                                </span>
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <b style={{ color: 'var(--paper)', display: 'block' }}>{p.packageName}</b>
                                <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>{p.billingCycle}</span>
                              </td>
                              <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>
                                {p.method}
                              </td>
                              <td style={{ padding: '14px 18px', color: 'var(--paper-dim)', fontSize: '12px' }}>
                                {p.paidAt}
                              </td>
                              <td style={{ padding: '14px 18px', fontWeight: 800, color: '#10B981', fontSize: '14px' }}>
                                {p.amountFormatted}
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}>
                                  ✓ {p.status || 'THÀNH CÔNG'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPaymentReceiptModal(p)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: '5px',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--paper)',
                                    border: '1px solid var(--line)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <span>📄</span>
                                  <span>Xem biên lai</span>
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

              {/* NỘI DUNG 2: BẢNG KÊ ĐỐI SOÁT & THƯỞNG GIẢI ĐỊNH KỲ */}
              {financeSubTab === 'statements' && (
                <div>
                  {statements.length === 0 ? (
                    <div className="facility-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                      <IconWallet size={32} color="var(--paper-dim)" />
                      <h3 style={{ fontSize: '16px', color: 'var(--paper)', margin: '12px 0 6px' }}>
                        Chưa Có Bảng Kê Đối Soát Tài Chính
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '440px', margin: '0 auto 16px' }}>
                        Bảng sao kê tiền thưởng giải đấu và chi phí chăm sóc chuồng trại sẽ tự động xuất hiện định kỳ vào ngày 20 hàng tháng.
                      </p>
                    </div>
                  ) : (
                    <div className="facility-card" style={{ padding: 0, overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '700px' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11.5px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '14px 18px' }}>Kỳ quyết toán</th>
                            <th style={{ padding: '14px 18px' }}>Chiến mã</th>
                            <th style={{ padding: '14px 18px' }}>Thưởng giải đua</th>
                            <th style={{ padding: '14px 18px' }}>Phí nuôi dưỡng</th>
                            <th style={{ padding: '14px 18px' }}>Phí thú y</th>
                            <th style={{ padding: '14px 18px' }}>Thực nhận ròng</th>
                            <th style={{ padding: '14px 18px' }}>Trạng thái</th>
                            <th style={{ padding: '14px 18px', textAlign: 'right' }}>Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statements.map((s) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--paper)' }}>{s.period}</td>
                              <td style={{ padding: '14px 18px', color: 'var(--brass)' }}>{s.horseName}</td>
                              <td style={{ padding: '14px 18px', color: 'var(--brass)', fontWeight: 600 }}>+{formatVND(s.totalPrizeEarned)}</td>
                              <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>-{formatVND(s.boardingCost)}</td>
                              <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>-{formatVND(s.vetCost)}</td>
                              <td style={{ padding: '14px 18px', fontWeight: 800, color: s.netPayable >= 0 ? 'var(--brass)' : 'var(--paper)' }}>
                                {formatVND(s.netPayable)}
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: s.status === 'PAID' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                                  color: s.status === 'PAID' ? 'var(--brass)' : 'var(--paper-dim)',
                                  border: `1px solid ${s.status === 'PAID' ? 'var(--brass)' : 'var(--line)'}`
                                }}>
                                  {s.statusText}
                                </span>
                              </td>
                              <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedStatementModal(s)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: '4px',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--paper)',
                                    border: '1px solid var(--line)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Xem sao kê
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: MINH BẠCH Y TẾ & THÚ Y (VET HEALTH TRANSPARENCY) */}
          {/* ========================================================================= */}
          {activeTab === 'vet' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Minh Bạch Y Tế & Sức Khỏe (Veterinary Health Transparency)</h2>
                <p className="pane-desc">Nhật ký khám nghiệm trực tiếp từ Bác sĩ Thú Y: tiêm phòng, phác đồ điều trị và cảnh báo.</p>
              </div>

              {healthLogs.length === 0 ? (
                <div className="facility-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <IconShieldHeart size={32} color="var(--paper-dim)" />
                  <h3 style={{ fontSize: '16px', color: 'var(--paper)', margin: '12px 0 6px' }}>
                    Chưa Có Hồ Sơ Thú Y
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '420px', margin: '0 auto 16px' }}>
                    Khi chiến mã được nhập chuồng, bác sĩ thú y sẽ kiểm dịch và lập sổ theo dõi y tế minh bạch tại đây.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {healthLogs.map((h) => (
                    <div key={h.id} className="facility-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <b style={{ fontSize: '15px', color: 'var(--brass)' }}>{h.horseName}</b>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: h.status === 'CLEARED' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                          color: h.status === 'CLEARED' ? 'var(--brass)' : 'var(--paper-dim)',
                          border: `1px solid ${h.status === 'CLEARED' ? 'var(--brass)' : 'var(--line)'}`
                        }}>
                          {h.statusText}
                        </span>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>Nội dung khám: <b style={{ color: 'var(--paper)' }}>{h.issue}</b></div>
                        <div>Bác sĩ phụ trách: <b style={{ color: 'var(--paper)' }}>{h.diagnosisBy}</b></div>
                        <div>Thuốc / Vaccine: <b style={{ color: 'var(--paper)' }}>{h.medications}</b></div>
                        <div>Ngày ghi nhận: <b style={{ color: 'var(--paper-dim)' }}>{h.date}</b></div>
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.45 }}>
                        <b>Ghi chú chuyên môn:</b> {h.vetNote}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: HỘI VIÊN & GÓI QUYỀN LỢI (MEMBERSHIP & PRIVILEGES) */}
          {/* ========================================================================= */}
          {activeTab === 'membership' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 className="pane-title">Gói Hội Viên & Đặc Quyền Chủ Sở Hữu (Membership Privileges)</h2>
                  <p className="pane-desc">Lựa chọn giải pháp tối ưu cho đàn chiến mã: Tiết kiệm chi phí lưu chuồng và tối đa hóa lợi nhuận tiền thưởng giải đua.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMembershipModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  <IconCrown size={16} color="#0A0D14" />
                  <span>{membershipTier === 'PREMIUM' ? 'Đổi chu kỳ thanh toán' : 'Nâng cấp gói Premium'}</span>
                </button>
              </div>

              {/* Thẻ trạng thái gói hiện tại */}
              <div style={{
                background: 'var(--bg-card)',
                border: `1.5px solid ${membershipTier === 'PREMIUM' ? 'var(--brass)' : 'var(--line)'}`,
                borderRadius: '8px',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    GÓI DỊCH VỤ HIỆN TẠI
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <b style={{ fontSize: '22px', color: membershipTier === 'PREMIUM' ? 'var(--brass)' : 'var(--paper)' }}>
                      {membershipTier === 'PREMIUM' ? '👑 HORSE PREMIUM (VIP ĐẶC QUYỀN)' : 'HORSE 0 ĐỒNG (TIÊU CHUẨN)'}
                    </b>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                      color: membershipTier === 'PREMIUM' ? 'var(--brass)' : 'var(--paper-dim)',
                      border: `1px solid ${membershipTier === 'PREMIUM' ? 'var(--brass)' : 'var(--line)'}`
                    }}>
                      {membershipTier === 'PREMIUM' ? 'ĐANG HIỆU LỰC' : 'MIỄN PHÍ'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                    {membershipTier === 'PREMIUM' 
                      ? 'Đặc quyền: Không giới hạn chiến mã, hoa hồng trích thưởng 5%, chuồng VIP Block A/B, IoT Real-time.' 
                      : 'Đang dùng gói cơ bản: Tối đa 2 chiến mã, hoa hồng trích thưởng giải 15%-20%, chuồng Block C.'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {membershipTier === 'FREE' ? (
                    <button
                      type="button"
                      onClick={() => handleSelectTier('PREMIUM')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '6px',
                        background: 'var(--brass)',
                        color: '#0A0D14',
                        fontWeight: 700,
                        border: 'none',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {hasVipSubscription ? '👑 Khôi Phục Đặc Quyền VIP' : '⚡ Kích Hoạt Premium VIP'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectTier('FREE')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--paper-dim)',
                        fontWeight: 600,
                        border: '1px solid var(--line)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {hasVipSubscription ? 'Chuyển tạm về gói 0 Đồng (Bảo lưu VIP)' : 'Hạ cấp về gói 0 Đồng'}
                    </button>
                  )}
                </div>
              </div>

              {/* Bảng so sánh 2 gói: Horse 0 Đồng vs Horse Premium */}
              <div className="portal-cards-grid" style={{ display: 'grid', gap: '20px' }}>
                {/* CỘT 1: HORSE 0 ĐỒNG */}
                <div className="facility-card" style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid var(--line-strong)',
                  background: 'var(--bg-card)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <b style={{ fontSize: '18px', color: 'var(--paper)' }}>Horse 0 Đồng</b>
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>TIÊU CHUẨN</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 14px' }}>
                      Dành cho chủ sở hữu mới gia nhập hoặc cổ phần Syndicate nhỏ lẻ.
                    </p>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--paper)', margin: '0 0 16px', fontFamily: 'var(--display)' }}>
                      0 VNĐ <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>/ TRỌN ĐỜI</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--paper)', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--paper-dim)' }}>•</span>
                        <div>Giới hạn: <b>Tối đa 02 chiến mã</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--paper-dim)' }}>•</span>
                        <div>Chuồng trại: <b>Ô tiêu chuẩn Block C (14 m²)</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--paper-dim)' }}>•</span>
                        <div>Báo cáo huấn luyện: <b>Tóm tắt cuối tuần</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--paper-dim)' }}>•</span>
                        <div>Hoa hồng trích thưởng giải: <b>CLB giữ 15% – 20%</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--paper-dim)' }}>•</span>
                        <div>Y tế & Khám bệnh: Khám kiểm dịch cơ bản</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--paper-dim)' }}>•</span>
                        <div>Khán đài trường đua: Vé khán đài tiêu chuẩn</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      disabled={membershipTier === 'FREE'}
                      onClick={() => handleSelectTier('FREE')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        background: membershipTier === 'FREE' ? 'var(--bg-secondary)' : 'transparent',
                        color: membershipTier === 'FREE' ? 'var(--paper-dim)' : 'var(--paper)',
                        border: '1px solid var(--line)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: membershipTier === 'FREE' ? 'default' : 'pointer'
                      }}
                    >
                      {membershipTier === 'FREE'
                        ? (hasVipSubscription ? 'Đang Bật Chế Độ 0Đ (Tạm Thời)' : 'Gói Bạn Đang Dùng')
                        : (hasVipSubscription ? 'Chuyển Tạm Về 0Đ (Bảo Lưu VIP)' : 'Hạ Cấp Về Gói 0 Đồng')}
                    </button>
                  </div>
                </div>

                {/* CỘT 2: HORSE PREMIUM (VIP) */}
                <div className="facility-card" style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid var(--brass)',
                  border: '1px solid var(--line-strong)',
                  background: 'var(--bg-card)',
                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.08)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconCrown size={20} color="var(--brass)" />
                        <b style={{ fontSize: '18px', color: 'var(--brass)' }}>Horse Premium</b>
                      </div>
                      <span style={{ fontSize: '11px', color: '#0A0D14', background: 'var(--brass)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>VIP ĐẶC QUYỀN</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 14px' }}>
                      Giải pháp cao cấp nhất cho chủ sở hữu độc quyền & trại ngựa chuyên nghiệp.
                    </p>
                    <div style={{ margin: '0 0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--paper-dim)', textDecoration: 'line-through' }}>89.000.000 VNĐ</span>
                        <span style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Ưu đãi đặc quyền -60%</span>
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brass)', fontFamily: 'var(--display)' }}>
                        35.000.000 VNĐ <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>/ NĂM</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--paper)', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Giới hạn: <b style={{ color: 'var(--brass)' }}>Không giới hạn số lượng chiến mã</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Chuồng trại: <b>Ô VIP Block A/B (16–18 m²) có đệm rơm khử khuẩn</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Viễn trắc: <b>IoT Real-time đo nhịp tim & gia tốc từng mét chạy</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Huấn luyện: <b>Chỉ định HLV Trưởng & thiết lập giáo án 1-kèm-1</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Hoa hồng giải đua: <b style={{ color: 'var(--brass)' }}>Chỉ thu 5% – 8% (Chủ nhận 92% – 95%)</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Chiết khấu: <b>Giảm 15% tổng hóa đơn lưu chuồng & chăm sóc</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Y tế: <b>Bác sĩ Thú y trưởng trực tiếp hội chẩn & miễn phí công khám</b></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--brass)' }}>✓</span>
                        <div>Trường đua: <b>Thẻ VIP Lounge & Quyền vào khu cách ly Paddock</b></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      disabled={membershipTier === 'PREMIUM'}
                      onClick={() => handleSelectTier('PREMIUM')}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '6px',
                        background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.15)' : 'var(--brass)',
                        color: membershipTier === 'PREMIUM' ? 'var(--brass)' : '#0A0D14',
                        border: membershipTier === 'PREMIUM' ? '1px solid var(--brass)' : 'none',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: membershipTier === 'PREMIUM' ? 'default' : 'pointer'
                      }}
                    >
                      {membershipTier === 'PREMIUM'
                        ? 'Đặc Quyền VIP Đang Hoạt Động ✓'
                        : hasVipSubscription
                        ? '👑 Khôi Phục Đặc Quyền VIP (Đã Sở Hữu)'
                        : '⚡ Kích Hoạt Gói Premium Ngay'}
                    </button>
                    {membershipTier === 'FREE' && hasVipSubscription && (
                      <div style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--brass)', marginTop: '6px', fontWeight: 600 }}>
                        ✓ Bạn đã sở hữu gói VIP, bấm để kích hoạt lại mà không cần thanh toán
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LỊCH SỬ GIAO DỊCH GÓI VIP */}
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--line)', paddingTop: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--brass)', fontSize: '18px' }}>🧾</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--paper)' }}>
                      Lịch Sử Giao Dịch Gói Hội Viên & Hóa Đơn
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('finance'); setFinanceSubTab('transactions'); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brass)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Xem toàn bộ nhật ký tài chính →
                  </button>
                </div>

                {paymentHistory.length === 0 ? (
                  <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: 'var(--paper-dim)' }}>
                    Bạn chưa thực hiện giao dịch thanh toán gói hội viên nào. Khi đăng ký gói VIP, hóa đơn điện tử sẽ tự động hiển thị tại đây.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {paymentHistory.slice(0, 3).map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <b style={{ fontSize: '13.5px', color: 'var(--paper)' }}>{p.packageName}</b>
                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                              ✓ ĐÃ THANH TOÁN
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                            Mã GD: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{p.transactionId}</span> · {p.method} · {p.paidAt}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <b style={{ fontSize: '15px', color: '#10B981' }}>{p.amountFormatted}</b>
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentReceiptModal(p)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '4px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--paper)',
                              border: '1px solid var(--line)',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Xem biên lai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: KHIẾU NẠI & BÁO CÁO NHÂN SỰ (STAFF INCIDENT & PERFORMANCE REPORTS) */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Khiếu Nại & Báo Cáo Nhân Sự</span>
                    <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 }}>
                      GỬI TRỰC TIẾP ADMIN
                    </span>
                  </h2>
                  <p className="pane-desc">
                    Quyền hạn Chủ sở hữu: Phản ánh trực tiếp tới Ban Quản Trị về Huấn Luyện Viên, Bác Sĩ Thú Y và Nhân Viên Chăm Sóc. Mọi khiếu nại đều được Admin thẩm tra độc lập và phản hồi minh bạch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCreateReport('TRAINER')}
                  style={{
                    padding: '9px 18px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(212, 175, 55, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>+ Gửi Khiếu Nại Mới</span>
                </button>
              </div>

              {/* 4 THỐNG KÊ KHIẾU NẠI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                    TỔNG KHIẾU NẠI ĐÃ GỬI
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)', margin: '4px 0 2px' }}>
                    {myReports.length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Bản ghi khiếu nại của bạn
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid #F59E0B', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                    CHỜ ADMIN TIẾP NHẬN
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#F59E0B', margin: '4px 0 2px' }}>
                    {myReports.filter(r => r.status === 'PENDING').length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Admin đang tiếp nhận hồ sơ
                  </div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid #3B82F6', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase' }}>
                    ĐANG THẨM TRA & GIẢI TRÌNH
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#3B82F6', margin: '4px 0 2px' }}>
                    {myReports.filter(r => r.status === 'INVESTIGATING').length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Đang yêu cầu nhân sự đối chất
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                    ĐÃ GIẢI QUYẾT XONG
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', margin: '4px 0 2px' }}>
                    {myReports.filter(r => r.status === 'RESOLVED').length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Đã có kết luận & biện pháp xử lý
                  </div>
                </div>
              </div>

              {/* BỘ LỌC ĐỐI TƯỢNG */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setReportRoleFilter('ALL')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reportRoleFilter === 'ALL' ? 'var(--brass)' : 'var(--bg-secondary)',
                      color: reportRoleFilter === 'ALL' ? '#0A0D14' : 'var(--paper)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    Tất cả ({myReports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportRoleFilter('TRAINER')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reportRoleFilter === 'TRAINER' ? 'var(--brass)' : 'var(--bg-secondary)',
                      color: reportRoleFilter === 'TRAINER' ? '#0A0D14' : 'var(--paper)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    🏇 Huấn Luyện Viên ({myReports.filter(r => r.targetRole === 'TRAINER').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportRoleFilter('VET')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reportRoleFilter === 'VET' ? 'var(--brass)' : 'var(--bg-secondary)',
                      color: reportRoleFilter === 'VET' ? '#0A0D14' : 'var(--paper)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    🩺 Bác Sĩ Thú Y ({myReports.filter(r => r.targetRole === 'VET').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportRoleFilter('CARETAKER')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reportRoleFilter === 'CARETAKER' ? 'var(--brass)' : 'var(--bg-secondary)',
                      color: reportRoleFilter === 'CARETAKER' ? '#0A0D14' : 'var(--paper)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    🌾 Nhân Viên Chăm Sóc ({myReports.filter(r => r.targetRole === 'CARETAKER').length})
                  </button>
                </div>
              </div>

              {/* DANH SÁCH BÁO CÁO KHIẾU NẠI */}
              {(() => {
                const filtered = myReports.filter(r => reportRoleFilter === 'ALL' || r.targetRole === reportRoleFilter);

                if (filtered.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '45px 20px',
                      background: 'var(--bg-secondary)',
                      border: '1px dashed var(--line)',
                      borderRadius: '10px'
                    }}>
                      <div style={{ fontSize: '38px', marginBottom: '10px' }}>🛡️</div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--paper)', fontWeight: 700 }}>
                        Chưa có khiếu nại nào được ghi nhận
                      </h4>
                      <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', maxWidth: '440px', margin: '6px auto 14px' }}>
                        Nếu bạn nhận thấy Huấn Luyện Viên, Bác Sĩ Thú Y hoặc Nhân Viên Chăm Sóc có dấu hiệu thiếu trách nhiệm, vi phạm giờ giấc hoặc ứng xử không đúng mực, hãy gửi báo cáo để Admin xử lý kịp thời.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateReport('TRAINER')}
                        style={{
                          padding: '8px 18px',
                          background: 'var(--brass)',
                          color: '#0A0D14',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        + Gửi Khiếu Nại Đầu Tiên
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filtered.map(report => {
                      const roleMeta = REPORT_TARGET_ROLES[report.targetRole] || { label: report.targetRole, icon: '👤', color: 'var(--paper)' };
                      const sevMeta = REPORT_SEVERITIES.find(s => s.id === report.severity) || REPORT_SEVERITIES[1];
                      const statMeta = REPORT_STATUSES.find(s => s.id === report.status) || REPORT_STATUSES[0];

                      return (
                        <div
                          key={report.id}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--line)',
                            borderRadius: '10px',
                            padding: '18px 20px',
                            boxShadow: 'var(--shadow)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                          }}
                        >
                          {/* Card Header: Role & Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: roleMeta.color,
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: `1px solid ${roleMeta.color}50`
                              }}>
                                {roleMeta.icon} {roleMeta.label.toUpperCase()}
                              </span>
                              <b style={{ fontSize: '14.5px', color: 'var(--paper)' }}>
                                {report.targetName}
                              </b>
                              <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                                ({report.targetTitle})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: sevMeta.color,
                                background: sevMeta.badgeBg,
                                border: `1px solid ${sevMeta.color}40`,
                                padding: '3px 8px',
                                borderRadius: '4px'
                              }}>
                                {sevMeta.label.split(' (')[0]}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: statMeta.color,
                                background: statMeta.badgeBg,
                                border: `1px solid ${statMeta.color}50`,
                                padding: '3px 8px',
                                borderRadius: '4px'
                              }}>
                                {statMeta.label}
                              </span>
                            </div>
                          </div>

                          {/* Thông tin sự việc */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'var(--paper-dim)' }}>
                            <span>Mã khiếu nại: <b style={{ color: 'var(--brass)', fontFamily: 'monospace' }}>#{report.id}</b> · Gửi lúc {report.createdAt}</span>
                            <span>Chiến mã liên quan: <b style={{ color: 'var(--paper)' }}>🏇 {report.horseName}</b> ({report.stall})</span>
                            <span>Danh mục: <b style={{ color: 'var(--paper)' }}>{report.category}</b></span>
                          </div>

                          {/* Nội dung phản ánh */}
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              fontWeight: 700,
                              color: 'var(--paper)',
                              fontSize: '13.5px',
                              marginBottom: '6px',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere'
                            }}>
                              {report.title}
                            </div>
                            <div style={{
                              fontSize: '12.5px',
                              color: 'var(--paper-dim)',
                              lineHeight: 1.55,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere'
                            }}>
                              {report.content}
                            </div>
                            {report.evidenceNote && (
                              <div style={{
                                marginTop: '8px',
                                fontSize: '11.5px',
                                color: 'var(--paper-dim)',
                                fontStyle: 'italic',
                                borderTop: '1px dashed var(--line)',
                                paddingTop: '6px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere'
                              }}>
                                📎 Bằng chứng / Ghi chú đính kèm: {report.evidenceNote}
                              </div>
                            )}
                          </div>

                          {/* KẾT LUẬN & PHẢN HỒI TỪ BAN QUẢN TRỊ (ADMIN) */}
                          {report.status === 'RESOLVED' || report.adminFeedback ? (
                            <div style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span>✓</span>
                                  <span>KẾT LUẬN & BIỆN PHÁP XỬ LÝ TỪ BAN QUẢN TRỊ (ADMIN)</span>
                                </span>
                                {report.resolvedAt && (
                                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                    Xử lý lúc {report.resolvedAt}
                                  </span>
                                )}
                              </div>
                              {report.adminAction && (
                                <div style={{ fontSize: '12.5px', color: 'var(--paper)' }}>
                                  <b>Biện pháp kỷ luật / chấn chỉnh:</b> {report.adminAction}
                                </div>
                              )}
                              <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.45 }}>
                                <b>Phản hồi gửi Chủ sở hữu:</b> "{report.adminFeedback || 'Ban Quản Trị đã tiến hành chấn chỉnh và bố trí phương án khắc phục triệt để.'}"
                              </div>
                            </div>
                          ) : report.status === 'INVESTIGATING' ? (
                            <div style={{
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              fontSize: '12px',
                              color: '#3B82F6',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>🔍</span>
                              <span>
                                <b>Admin đang tiến hành thẩm tra:</b> Đã lập hồ sơ xác minh và yêu cầu nhân sự {report.targetName} báo cáo giải trình. Kết quả xử lý sẽ sớm được thông báo tới bạn.
                              </span>
                            </div>
                          ) : (
                            <div style={{
                              background: 'rgba(245, 158, 11, 0.08)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              fontSize: '12px',
                              color: '#F59E0B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>⏳</span>
                              <span>
                                <b>Đang chờ Admin tiếp nhận:</b> Hồ sơ khiếu nại đã chuyển trực tiếp tới Ban Quản Trị mã trường để đối soát.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ĐĂNG KÝ CHIẾN MÃ MỚI (ADD / REGISTER HORSE MODAL) */}
      {/* ========================================================================= */}
      {showAddHorseModal && (
        <div className="modal-overlay" onClick={() => setShowAddHorseModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '560px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)' }}><IconHorse size={22} /></span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--brass)' }}>
                  Đăng Ký Chiến Mã Mới Vào Chuồng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddHorseModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 16px', lineHeight: 1.4 }}>
              Hệ thống sẽ cấp mã định danh vi chip RFID, bố trí ô chuồng và chỉ định Huấn luyện viên trưởng chăm sóc.
            </p>

            <form onSubmit={handleCreateHorseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Khu vực Đăng / Chọn Hình Ảnh Chiến Mã */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '6px 0' }}>
                <label
                  htmlFor="horse-avatar-file-input"
                  style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)'
                  }}
                  title="Bấm để đổi ảnh"
                >
                  <img
                    src={horseForm.avatar || 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=600&q=80'}
                    alt="Ảnh chiến mã"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label
                    htmlFor="horse-avatar-file-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: 'fit-content',
                      boxShadow: '0 2px 6px rgba(212, 175, 55, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <IconCamera size={15} color="#0A0D14" />
                    <span>Chọn ảnh chiến mã</span>
                  </label>
                  <input
                    id="horse-avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleHorseImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                    Hỗ trợ JPG, PNG hoặc WEBP
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tên chiến mã <span style={{ color: 'var(--brass)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={45}
                    placeholder="Ví dụ: Hắc Mã, Kim Quy..."
                    value={horseForm.name}
                    onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tên quốc tế (tiếng Anh)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Black Storm, Golden..."
                    value={horseForm.englishName}
                    onChange={(e) => setHorseForm({ ...horseForm, englishName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Giống ngựa
                  </label>
                  <select
                    value={horseForm.breed}
                    onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Thoroughbred">Thoroughbred (Thuần Anh)</option>
                    <option value="Quarter Horse">Quarter Horse (Nước rút)</option>
                    <option value="Arabian">Arabian (Ả Rập)</option>
                    <option value="Standardbred">Standardbred (Nước kiệu)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Giới tính
                  </label>
                  <select
                    value={horseForm.gender}
                    onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Ngựa đực (Stallion)">Ngựa đực (Stallion)</option>
                    <option value="Ngựa đực thiến (Gelding)">Ngựa thiến (Gelding)</option>
                    <option value="Ngựa cái (Mare)">Ngựa cái (Mare)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tuổi
                  </label>
                  <select
                    value={horseForm.age}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseInt(val) || 3;
                      setHorseForm(prev => ({
                        ...prev,
                        age: val,
                        foaledYear: String(2026 - num)
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="2 tuổi">2 tuổi</option>
                    <option value="3 tuổi">3 tuổi</option>
                    <option value="4 tuổi">4 tuổi</option>
                    <option value="5 tuổi">5 tuổi</option>
                    <option value="6 tuổi">6 tuổi</option>
                    <option value="7 tuổi">7 tuổi</option>
                    <option value="8 tuổi">8 tuổi</option>
                    <option value="9 tuổi">9 tuổi</option>
                    <option value="10 tuổi">10 tuổi</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Mã vi chip định danh RFID
                  </label>
                  <input
                    type="text"
                    value={horseForm.microchip}
                    onChange={(e) => setHorseForm({ ...horseForm, microchip: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--brass)',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tỷ lệ cổ phần sở hữu (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={horseForm.ownershipShare}
                    onChange={(e) => setHorseForm({ ...horseForm, ownershipShare: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Đội ngũ phục vụ chuyên trách: 3 HLV, 3 BS, 3 Groom */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.05)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🛡️ Chỉ Định Đội Ngũ Phục Vụ (3 HLV, 3 Bác Sĩ, 3 Groom Cố Định)
                </div>

                <div className="modal-responsive-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '4px', height: '18px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>🏇</span> Huấn Luyện Viên
                    </label>
                    <select
                      value={horseForm.trainer}
                      onChange={(e) => setHorseForm({ ...horseForm, trainer: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {FIXED_TRAINERS_LIST.map(t => (
                        <option key={t.username} value={t.name}>
                          {t.name} ({t.title.split('-')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '4px', height: '18px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>🩺</span> Bác Sĩ Thú Y
                    </label>
                    <select
                      value={horseForm.vet}
                      onChange={(e) => setHorseForm({ ...horseForm, vet: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {FIXED_VETS_LIST.map(v => (
                        <option key={v.username} value={v.name}>
                          {v.name} ({v.title.split('&')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '4px', height: '18px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>🌾</span> Người Chăm Sóc
                    </label>
                    <select
                      value={horseForm.groom}
                      onChange={(e) => setHorseForm({ ...horseForm, groom: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {FIXED_GROOMS_LIST.map(g => (
                        <option key={g.username} value={g.name}>
                          {g.name} ({g.title.split('&')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', fontStyle: 'italic' }}>
                  * Nhân sự được chọn sẽ nhận yêu cầu xác nhận phục vụ trong cổng quản trị chuyên môn của họ.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                  Vị trí ô chuồng đăng ký
                </label>
                  <select
                    value={horseForm.stable}
                    onChange={handleStableSelectChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {membershipTier === 'PREMIUM' ? (
                      <>
                        <optgroup label="── 👑 KHU CHUỒNG VIP ĐẶC QUYỀN (DÀNH CHO VIP) ──">
                          {availableVipStables.length > 0 ? (
                            availableVipStables.map(s => {
                              const name = getStallDisplayName(s);
                              return (
                                <option key={s.stall_code} value={name}>
                                  👑 {name}
                                </option>
                              );
                            })
                          ) : (
                            <option value="Ô A1 (Block A - 18 m²)">👑 Ô A1 (Block A - 18 m²)</option>
                          )}
                        </optgroup>
                        <optgroup label="── 🏷️ KHU CHUỒNG TIÊU CHUẨN ──">
                          {availableStandardStables.length > 0 ? (
                            availableStandardStables.map(s => {
                              const name = getStallDisplayName(s);
                              return (
                                <option key={s.stall_code} value={name}>
                                  🏷️ {name}
                                </option>
                              );
                            })
                          ) : (
                            <option value="Ô C1 (Block C - 14 m²)">🏷️ Ô C1 (Block C - 14 m²)</option>
                          )}
                        </optgroup>
                      </>
                    ) : (
                      <optgroup label="── 🏷️ KHU CHUỒNG TIÊU CHUẨN (GÓI CƠ BẢN) ──">
                        {availableStandardStables.length > 0 ? (
                          availableStandardStables.map(s => {
                            const name = getStallDisplayName(s);
                            return (
                              <option key={s.stall_code} value={name}>
                                {name}
                              </option>
                            );
                          })
                        ) : (
                          <>
                            <option value="Ô C1 (Block C - 14 m²)">Ô C1 (Block C - 14 m²)</option>
                            <option value="Ô C2 (Block C - 14 m²)">Ô C2 (Block C - 14 m²)</option>
                            <option value="Ô C3 (Block C - 14 m²)">Ô C3 (Block C - 14 m²)</option>
                          </>
                        )}
                      </optgroup>
                    )}
                  </select>
                  {membershipTier !== 'PREMIUM' ? (
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px', lineHeight: 1.3 }}>
                      ℹ️ Gói tiêu chuẩn: Bạn đang xem danh sách các ô chuồng thông thường. Để mở khóa chuồng VIP tiện nghi cao cấp, vui lòng nâng cấp gói VIP.
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '4px', lineHeight: 1.3 }}>
                      👑 Đặc quyền VIP: Bạn có quyền lựa chọn các ô chuồng VIP đặc quyền hoặc chuồng tiêu chuẩn tùy thích.
                    </div>
                  )}
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Dòng bố (Sire)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Deep Impact, Frankel..."
                    value={horseForm.sire}
                    onChange={(e) => setHorseForm({ ...horseForm, sire: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Dòng mẹ (Dam)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Northern Dancer, Sea The Stars..."
                    value={horseForm.dam}
                    onChange={(e) => setHorseForm({ ...horseForm, dam: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddHorseModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Xác Nhận Đăng Ký Chiến Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỈNH SỬA THÔNG TIN CHIẾN MÃ (EDIT HORSE MODAL) */}
      {/* ========================================================================= */}
      {showEditHorseModal && editingHorse && (
        <div className="modal-overlay" onClick={() => setShowEditHorseModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '560px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)' }}><IconEdit size={20} /></span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--brass)' }}>
                  Chỉnh Sửa Hồ Sơ: {editingHorse.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditHorseModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 16px', lineHeight: 1.4 }}>
              Cập nhật các thông số định danh, phân bổ ô chuồng và huấn luyện viên phụ trách.
            </p>

            <form onSubmit={handleUpdateHorseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Khu vực Đổi Hình Ảnh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '6px 0' }}>
                <label
                  htmlFor="edit-horse-avatar-file-input"
                  style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)'
                  }}
                  title="Bấm để đổi ảnh"
                >
                  <img
                    src={editHorseForm.avatar || editingHorse.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
                    alt="Ảnh chiến mã"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label
                    htmlFor="edit-horse-avatar-file-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: 'fit-content',
                      boxShadow: '0 2px 6px rgba(212, 175, 55, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <IconCamera size={15} color="#0A0D14" />
                    <span>Đổi ảnh từ máy</span>
                  </label>
                  <input
                    id="edit-horse-avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleEditHorseImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                    Hỗ trợ JPG, PNG hoặc WEBP
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tên chiến mã <span style={{ color: 'var(--brass)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={45}
                    value={editHorseForm.name}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tên quốc tế (tiếng Anh)
                  </label>
                  <input
                    type="text"
                    value={editHorseForm.englishName}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, englishName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Giống ngựa
                  </label>
                  <select
                    value={editHorseForm.breed}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, breed: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Thoroughbred">Thoroughbred (Thuần Anh)</option>
                    <option value="Quarter Horse">Quarter Horse (Nước rút)</option>
                    <option value="Arabian">Arabian (Ả Rập)</option>
                    <option value="Standardbred">Standardbred (Nước kiệu)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Giới tính
                  </label>
                  <select
                    value={editHorseForm.gender}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, gender: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Ngựa đực (Stallion)">Ngựa đực (Stallion)</option>
                    <option value="Ngựa đực thiến (Gelding)">Ngựa thiến (Gelding)</option>
                    <option value="Ngựa cái (Mare)">Ngựa cái (Mare)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tuổi
                  </label>
                  <select
                    value={editHorseForm.age}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseInt(val) || 3;
                      setEditHorseForm(prev => ({
                        ...prev,
                        age: val,
                        foaledYear: String(2026 - num)
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="2 tuổi">2 tuổi</option>
                    <option value="3 tuổi">3 tuổi</option>
                    <option value="4 tuổi">4 tuổi</option>
                    <option value="5 tuổi">5 tuổi</option>
                    <option value="6 tuổi">6 tuổi</option>
                    <option value="7 tuổi">7 tuổi</option>
                    <option value="8 tuổi">8 tuổi</option>
                    <option value="9 tuổi">9 tuổi</option>
                    <option value="10 tuổi">10 tuổi</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Mã vi chip định danh RFID
                  </label>
                  <input
                    type="text"
                    value={editHorseForm.microchip}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, microchip: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--brass)',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Tỷ lệ cổ phần sở hữu (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editHorseForm.ownershipShare}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, ownershipShare: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Đội ngũ phục vụ chuyên trách: 3 HLV, 3 BS, 3 Groom */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.05)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🛡️ Thay Đổi Đội Ngũ Phục Vụ (3 HLV, 3 Bác Sĩ, 3 Groom Cố Định)
                </div>

                <div className="modal-responsive-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '4px', height: '18px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>🏇</span> Huấn Luyện Viên
                    </label>
                    <select
                      value={editHorseForm.trainer}
                      onChange={(e) => setEditHorseForm({ ...editHorseForm, trainer: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {FIXED_TRAINERS_LIST.map(t => (
                        <option key={t.username} value={t.name}>
                          {t.name} ({t.title.split('-')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '4px', height: '18px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>🩺</span> Bác Sĩ Thú Y
                    </label>
                    <select
                      value={editHorseForm.vet}
                      onChange={(e) => setEditHorseForm({ ...editHorseForm, vet: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {FIXED_VETS_LIST.map(v => (
                        <option key={v.username} value={v.name}>
                          {v.name} ({v.title.split('&')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '4px', height: '18px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>🌾</span> Người Chăm Sóc
                    </label>
                    <select
                      value={editHorseForm.groom}
                      onChange={(e) => setEditHorseForm({ ...editHorseForm, groom: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {FIXED_GROOMS_LIST.map(g => (
                        <option key={g.username} value={g.name}>
                          {g.name} ({g.title.split('&')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                  Vị trí ô chuồng
                </label>
                <select
                  value={editHorseForm.stable}
                  onChange={(e) => setEditHorseForm({ ...editHorseForm, stable: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {membershipTier === 'PREMIUM' ? (
                    <>
                      <optgroup label="── 👑 KHU CHUỒNG VIP ĐẶC QUYỀN ──">
                        {availableVipStables.length > 0 ? (
                          availableVipStables.map(s => {
                            const val = `Ô ${s.stall_code}`;
                            return (
                              <option key={s.stall_code} value={val}>
                                👑 Ô {s.stall_code} ({s.block}{s.area ? ` - ${s.area}` : ''})
                              </option>
                            );
                          })
                        ) : (
                          <option value="Ô A1">👑 Ô A1 (Block A - VIP)</option>
                        )}
                      </optgroup>
                      <optgroup label="── 🏷️ KHU CHUỒNG TIÊU CHUẨN ──">
                        {availableStandardStables.length > 0 ? (
                          availableStandardStables.map(s => {
                            const val = `Ô ${s.stall_code}`;
                            return (
                              <option key={s.stall_code} value={val}>
                                🏷️ Ô {s.stall_code} ({s.block}{s.area ? ` - ${s.area}` : ''})
                              </option>
                            );
                          })
                        ) : (
                          <option value="Ô C1">🏷️ Ô C1 (Block C)</option>
                        )}
                      </optgroup>
                    </>
                  ) : (
                    <optgroup label="── 🏷️ KHU CHUỒNG TIÊU CHUẨN (GÓI CƠ BẢN) ──">
                      {availableStandardStables.length > 0 ? (
                        availableStandardStables.map(s => {
                          const val = `Ô ${s.stall_code}`;
                          return (
                            <option key={s.stall_code} value={val}>
                              Ô {s.stall_code} ({s.block}{s.area ? ` - ${s.area}` : ''})
                            </option>
                          );
                        })
                      ) : (
                        <>
                          <option value="Ô C1">Ô C1 (Block C)</option>
                          <option value="Ô C2">Ô C2 (Block C)</option>
                        </>
                      )}
                    </optgroup>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Dòng bố (Sire)
                  </label>
                  <input
                    type="text"
                    value={editHorseForm.sire}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, sire: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Dòng mẹ (Dam)
                  </label>
                  <input
                    type="text"
                    value={editHorseForm.dam}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, dam: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditHorseModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XÁC MINH BẢO MẬT XÓA CHIẾN MÃ (DELETE HORSE VERIFICATION MODAL) */}
      {/* ========================================================================= */}
      {showDeleteHorseModal && deletingHorse && (
        <div className="modal-overlay" onClick={() => setShowDeleteHorseModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '480px',
              width: '92%',
              padding: '24px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 700, color: '#EF4444' }}>
                  Xác Nhận Xóa Chiến Mã Khỏi Chuồng
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                  Hành động này không thể hoàn tác sau khi xác nhận
                </span>
              </div>
            </div>

            {/* Thông tin chiến mã sắp xóa */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <img
                src={deletingHorse.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
                alt={deletingHorse.name}
                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--paper)' }}>
                  {deletingHorse.name} <span style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 400 }}>({deletingHorse.englishName})</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                  Vị trí: <b style={{ color: 'var(--paper)' }}>{deletingHorse.stable}</b> · Vi chip: <span style={{ fontFamily: 'monospace' }}>{deletingHorse.microchip}</span>
                </div>
              </div>
            </div>

            {/* Bước xác minh bắt buộc */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px dashed rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '6px', lineHeight: 1.4 }}>
                Bước xác minh: Nhập chính xác tên <b style={{ color: '#EF4444' }}>"{deletingHorse.name}"</b> vào ô bên dưới để mở khóa quyền xóa:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteVerificationInput}
                onChange={(e) => setDeleteVerificationInput(e.target.value)}
                placeholder={`Nhập chính xác "${deletingHorse.name}"...`}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-card)',
                  border: deleteVerificationInput.trim().toLowerCase() === deletingHorse.name.trim().toLowerCase()
                    ? '1.5px solid #EF4444'
                    : '1px solid var(--line)',
                  borderRadius: '6px',
                  color: 'var(--paper)',
                  fontSize: '13.5px',
                  fontWeight: 600
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '6px' }}>
                {deleteVerificationInput.trim().toLowerCase() === deletingHorse.name.trim().toLowerCase()
                  ? <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Đã xác minh trùng khớp. Bạn có thể tiến hành xóa.</span>
                  : <span>*(Nút xác nhận xóa sẽ được kích hoạt khi tên nhập hoàn toàn chính xác)*</span>
                }
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteHorseModal(false)}
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
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteVerificationInput.trim().toLowerCase() !== deletingHorse.name.trim().toLowerCase()}
                onClick={handleConfirmDeleteHorse}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  background: deleteVerificationInput.trim().toLowerCase() === deletingHorse.name.trim().toLowerCase() ? '#EF4444' : 'rgba(239, 68, 68, 0.2)',
                  color: deleteVerificationInput.trim().toLowerCase() === deletingHorse.name.trim().toLowerCase() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: '13px',
                  cursor: deleteVerificationInput.trim().toLowerCase() === deletingHorse.name.trim().toLowerCase() ? 'pointer' : 'not-allowed',
                  boxShadow: deleteVerificationInput.trim().toLowerCase() === deletingHorse.name.trim().toLowerCase() ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🗑️ Xác Nhận Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ĐĂNG KÝ THAM GIA GIẢI ĐẤU (REGISTER FOR TOURNAMENT MODAL) */}
      {/* ========================================================================= */}
      {showRaceRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRaceRegisterModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '520px',
              width: '92%',
              padding: '24px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)' }}><IconTrophy size={22} /></span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--brass)' }}>
                  Ghi Danh Tham Gia Giải Đua
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRaceRegisterModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {myHorses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: '13.5px', color: 'var(--paper)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Bạn cần đăng ký ít nhất một chiến mã vào chuồng trước khi ghi danh tham gia giải đua.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowRaceRegisterModal(false);
                    setShowAddHorseModal(true);
                  }}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  + Đăng Ký Chiến Mã Ngay
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterRaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Chọn giải đấu muốn tham gia
                  </label>
                  <select
                    value={raceRegForm.tournamentId || (selectedTournamentToRegister?.id || OPEN_TOURNAMENTS[0].id)}
                    onChange={(e) => {
                      const found = OPEN_TOURNAMENTS.find(t => t.id === e.target.value);
                      setSelectedTournamentToRegister(found);
                      setRaceRegForm({ ...raceRegForm, tournamentId: e.target.value });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--brass)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {OPEN_TOURNAMENTS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.distance} - {formatVND(t.totalPurse)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--paper)', display: 'block', marginBottom: '8px' }}>
                    Chế độ chọn chiến mã tham dự <span style={{ color: 'var(--brass)' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setRaceRegForm({ ...raceRegForm, selectionMode: 'OWNER_CHOICE' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: raceRegForm.selectionMode !== 'DELEGATE_TRAINER' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                        border: `1.5px solid ${raceRegForm.selectionMode !== 'DELEGATE_TRAINER' ? 'var(--brass)' : 'var(--line)'}`,
                        color: raceRegForm.selectionMode !== 'DELEGATE_TRAINER' ? 'var(--brass)' : 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🏇</span> Chủ ngựa tự chọn
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', marginTop: '2px', fontWeight: 400 }}>
                        Chỉ định 1 chiến mã cụ thể
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRaceRegForm({ ...raceRegForm, selectionMode: 'DELEGATE_TRAINER' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: raceRegForm.selectionMode === 'DELEGATE_TRAINER' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                        border: `1.5px solid ${raceRegForm.selectionMode === 'DELEGATE_TRAINER' ? 'var(--brass)' : 'var(--line)'}`,
                        color: raceRegForm.selectionMode === 'DELEGATE_TRAINER' ? 'var(--brass)' : 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎯</span> Nhờ HLV chọn giúp
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', marginTop: '2px', fontWeight: 400 }}>
                        HLV chọn ngựa phong độ tốt nhất
                      </div>
                    </button>
                  </div>
                </div>

                {raceRegForm.selectionMode === 'DELEGATE_TRAINER' ? (
                  <div style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1.5px dashed var(--brass)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brass)', fontWeight: 700, fontSize: '13px' }}>
                      <span>🎯</span> Chế độ ủy thác chuyên môn cho HLV Trưởng
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--paper-dim)', margin: '4px 0 8px', lineHeight: 1.45 }}>
                      HLV Trưởng sẽ dựa vào cự ly <b>{selectedTournamentToRegister?.distance || '2.400m'}</b>, mặt sân <b>{selectedTournamentToRegister?.track || 'Trường đua Phú Thọ'}</b> và viễn trắc nhịp tim/vận tốc tập luyện của tất cả <b>{myHorses.length} chiến mã</b> của bạn để chọn chiến mã tối ưu nhất.
                    </p>
                    <div style={{ fontSize: '11.5px', color: 'var(--paper)' }}>
                      HLV nhận ủy thác: <b>{raceRegForm.trainerName || 'Trần Văn Hùng (HLV Trưởng)'}</b>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                      Chọn chiến mã của bạn để xuất chiến <span style={{ color: 'var(--brass)' }}>*</span>
                    </label>
                    <select
                      value={raceRegForm.horseId}
                      onChange={(e) => setRaceRegForm({ ...raceRegForm, horseId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {myHorses.map(h => {
                        const lCheck = checkHorseVetLockStatus(h.microchip || h.id || h.name);
                        const isLocked = lCheck.isLocked || h.isLockedByVet;
                        return (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.breed}) {isLocked ? '⛔ [KHÓA Y TẾ - CẤM ĐUA]' : '✓ [Đủ điều kiện]'}
                          </option>
                        );
                      })}
                    </select>

                    {/* Cảnh báo khóa y tế thi đấu */}
                    {(() => {
                      const selHorse = myHorses.find(h => String(h.id) === String(raceRegForm.horseId)) || myHorses[0];
                      if (!selHorse) return null;
                      const lockCheck = checkHorseVetLockStatus(selHorse.microchip || selHorse.id || selHorse.name);
                      if (lockCheck.isLocked || selHorse.isLockedByVet || selHorse.status === 'INJURED') {
                        return (
                          <div style={{
                            marginTop: '8px',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#EF4444',
                            fontSize: '12px',
                            lineHeight: 1.45
                          }}>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>⛔</span> CHIẾN MÃ ĐANG BỊ KHÓA Y TẾ THÚ Y (CẤM THI ĐẤU)!
                            </div>
                            <div><b>Lý do:</b> {lockCheck.reason || 'Dấu hiệu chấn thương hoặc kiểm dịch'}</div>
                            <div style={{ marginTop: '2px', color: 'var(--paper)' }}>
                              Chiến mã phải đợi Bác sĩ Thú y kiểm tra và dỡ bỏ lệnh khóa tại Cổng Thú Y thì mới được đăng ký thi đấu.
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--paper-dim)' }}>Cự ly & Địa điểm:</span>
                    <span style={{ color: 'var(--paper)' }}>{selectedTournamentToRegister?.distance || '2.400m'} · {selectedTournamentToRegister?.track || 'Trường đua Phú Thọ'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--paper-dim)' }}>Ngày thi đấu:</span>
                    <b style={{ color: 'var(--paper)' }}>{selectedTournamentToRegister?.date || '15/11/2026'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--paper-dim)' }}>Phí đăng ký tham gia:</span>
                    <b style={{ color: 'var(--brass)' }}>{formatVND(selectedTournamentToRegister?.entryFee || 5000000)}</b>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Chỉ định Kỵ mã (Jockey)
                  </label>
                  <select
                    value={raceRegForm.jockey}
                    onChange={(e) => setRaceRegForm({ ...raceRegForm, jockey: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="HLV Trần Văn Hùng chỉ định">HLV Trần Văn Hùng chỉ định kỵ mã phù hợp nhất</option>
                    <option value="Kỵ mã Nguyễn Văn Tấn (Chuyên nước rút)">Kỵ mã Nguyễn Văn Tấn (Chuyên nước rút)</option>
                    <option value="Kỵ mã Lê Anh Khoa (Chuyên đường dài)">Kỵ mã Lê Anh Khoa (Chuyên đường dài)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Ghi chú chiến thuật của Chủ sở hữu
                  </label>
                  <input
                    type="text"
                    value={raceRegForm.notes}
                    onChange={(e) => setRaceRegForm({ ...raceRegForm, notes: e.target.value })}
                    placeholder="Ghi chú chiến thuật, cam kết điều lệ..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRaceRegisterModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: 'var(--paper-dim)',
                      border: '1px solid var(--line)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  {(() => {
                    const isDelegated = raceRegForm.selectionMode === 'DELEGATE_TRAINER';
                    const selHorse = isDelegated ? null : (myHorses.find(h => String(h.id) === String(raceRegForm.horseId)) || myHorses[0]);
                    const isLocked = !isDelegated && selHorse ? (checkHorseVetLockStatus(selHorse.microchip || selHorse.id || selHorse.name).isLocked || selHorse.isLockedByVet) : false;

                    return (
                      <button
                        type="submit"
                        disabled={isLocked}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '6px',
                          background: isLocked ? 'rgba(255, 255, 255, 0.1)' : 'var(--brass)',
                          color: isLocked ? 'var(--paper-dim)' : '#0A0D14',
                          fontWeight: 700,
                          border: 'none',
                          fontSize: '13px',
                          cursor: isLocked ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isLocked ? '⛔ Đang Khóa Y Tế (Cấm Thi Đấu)' : 'Xác Nhận Ghi Danh Thi Đấu'}
                      </button>
                    );
                  })()}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHI TIẾT SAO KÊ TÀI CHÍNH */}
      {/* ========================================================================= */}
      {selectedStatementModal && (
        <div className="modal-overlay" onClick={() => setSelectedStatementModal(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '460px',
              width: '90%',
              padding: '22px 24px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--brass)' }}>
                Sao Kê: {selectedStatementModal.period}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStatementModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 14px' }}>
              Chiến mã: <b style={{ color: 'var(--paper)' }}>{selectedStatementModal.horseName}</b> · Chip: {selectedStatementModal.chipId}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Doanh thu giải thưởng:</span>
                <b style={{ color: 'var(--brass)' }}>+{formatVND(selectedStatementModal.totalPrizeEarned)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Phí nuôi dưỡng & chuồng:</span>
                <span style={{ color: 'var(--paper)' }}>
                  -{formatVND(selectedStatementModal.boardingCost)}
                  {membershipTier === 'PREMIUM' ? (
                    <span style={{ color: '#10B981', fontSize: '11px', marginLeft: '6px', fontWeight: 600 }}>(Đã giảm 15% VIP)</span>
                  ) : (
                    <span style={{ color: 'var(--paper-dim)', fontSize: '11px', marginLeft: '6px' }}>(0% chiết khấu)</span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Phí khám & tiêm phòng:</span>
                <span style={{ color: 'var(--paper)' }}>-{formatVND(selectedStatementModal.vetCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Phí hoa hồng CLB & HLV:</span>
                <span style={{ color: 'var(--paper)' }}>
                  -{formatVND(selectedStatementModal.trainerCommission)}
                  {membershipTier === 'PREMIUM' ? (
                    <span style={{ color: '#10B981', fontSize: '11px', marginLeft: '6px', fontWeight: 600 }}>(Chỉ thu 6% VIP)</span>
                  ) : (
                    <span style={{ color: '#EF4444', fontSize: '11px', marginLeft: '6px', fontWeight: 600 }}>(CLB giữ 18%)</span>
                  )}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <b>Thực nhận ròng:</b>
                <b style={{ color: 'var(--brass)' }}>{formatVND(selectedStatementModal.netPayable)}</b>
              </div>

              {/* GỢI Ý NÂNG CẤP VIP ĐỂ TĂNG THU NHẬP TIỀN THƯỞNG */}
              {membershipTier !== 'PREMIUM' && (
                <div style={{
                  marginTop: '6px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11.5px',
                  color: 'var(--brass)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>💡 Gói 0 Đồng trích 18% hoa hồng và 0% chiết khấu chuồng. Nâng cấp VIP để giữ 94% thưởng và giảm 15% phí nuôi!</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatementModal(null);
                      if (hasVipSubscription) {
                        handleSelectTier('PREMIUM');
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                    style={{
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {hasVipSubscription ? '👑 Khôi phục VIP' : 'Nâng cấp VIP'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  showToast('Đã xuất biên lai điện tử PDF thành công!', 'XUẤT HÓA ĐƠN', 'info');
                  setSelectedStatementModal(null);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Xuất file hóa đơn PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XEM & TỰ CẬP NHẬT CÂY PHẢ HỆ CHIẾN MÃ (PEDIGREE MODAL) */}
      {/* ========================================================================= */}
      {selectedHorsePedigree && (
        <div className="modal-overlay" onClick={() => setSelectedHorsePedigree(null)} style={{ zIndex: 9999999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '920px',
              width: '95%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px 26px',
              border: '1.5px solid var(--brass)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
              borderRadius: '12px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🧬</span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--brass)' }}>
                    Cây Phả Hệ Gia Phả 3 Đời: {selectedHorsePedigree.name}
                  </h3>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                  {selectedHorsePedigree.englishName ? `${selectedHorsePedigree.englishName} · ` : ''}{selectedHorsePedigree.breed} · {selectedHorsePedigree.gender} · Mã vi chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{selectedHorsePedigree.microchip}</span>
                </div>
              </div>

              {/* Chuyển đổi chế độ Xem Cây / Tự Cập Nhật */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '7px', border: '1px solid var(--line)' }}>
                  <button
                    type="button"
                    onClick={() => setPedigreeMode('view')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '5px',
                      background: pedigreeMode === 'view' ? 'var(--brass)' : 'transparent',
                      color: pedigreeMode === 'view' ? '#0A0D14' : 'var(--paper-dim)',
                      fontWeight: 700,
                      border: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>🌳</span> Sơ đồ cây phả hệ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPedigreeMode('edit')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '5px',
                      background: pedigreeMode === 'edit' ? 'var(--brass)' : 'transparent',
                      color: pedigreeMode === 'edit' ? '#0A0D14' : 'var(--paper-dim)',
                      fontWeight: 700,
                      border: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>✏️</span> Tự cập nhật phả hệ
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHorsePedigree(null)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper-dim)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                  title="Đóng modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CHẾ ĐỘ 1: XEM SƠ ĐỒ CÂY PHẢ HỆ 3 THẾ HỆ */}
            {/* ========================================================= */}
            {pedigreeMode === 'view' && (
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>↔️</span>
                  <span>Vuốt sang ngang để xem đầy đủ 3 thế hệ (Phụ hệ Sire, Mẫu hệ Dam & Ông Bà).</span>
                </div>
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '24px 20px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '800px',
                    gap: '0px'
                  }}>
                    {/* CỘT 1: THẾ HỆ 0 - CHIẾN MÃ (CHỦ THỂ) */}
                    <div style={{ width: '220px', flexShrink: 0, paddingRight: '12px' }}>
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--brass)',
                        borderRadius: '8px',
                        padding: '16px 14px',
                        boxShadow: '0 4px 14px rgba(212, 175, 55, 0.15)',
                        textAlign: 'center'
                      }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 8px', overflow: 'hidden', border: '2px solid var(--brass)' }}>
                          <img
                            src={selectedHorsePedigree.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
                            alt={selectedHorsePedigree.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 800, background: 'var(--brass)', color: '#0A0D14', padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.04em' }}>
                          CHIẾN MÃ (CHỦ THỂ)
                        </span>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brass)', marginTop: '8px' }}>
                          {selectedHorsePedigree.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                          {selectedHorsePedigree.englishName || selectedHorsePedigree.breed}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '6px' }}>
                          Vị trí: <b>{selectedHorsePedigree.stable}</b>
                        </div>
                      </div>
                    </div>

                    {/* BRACKET CỘT 1 -> CỘT 2 */}
                    <div style={{
                      width: '28px',
                      height: '270px',
                      position: 'relative',
                      flexShrink: 0
                    }}>
                      <div style={{ position: 'absolute', top: '50%', left: 0, width: '14px', height: '2px', background: 'var(--brass)', transform: 'translateY(-50%)' }} />
                      <div style={{ position: 'absolute', top: '25%', bottom: '25%', left: '14px', width: '2px', background: 'var(--brass)' }} />
                      <div style={{ position: 'absolute', top: '25%', left: '14px', width: '14px', height: '2px', background: 'var(--brass)' }} />
                      <div style={{ position: 'absolute', bottom: '25%', left: '14px', width: '14px', height: '2px', background: 'var(--brass)' }} />
                    </div>

                    {/* CỘT 2: THẾ HỆ 1 - CHA & MẸ (SIRE & DAM) */}
                    <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      {/* BỐ (SIRE) */}
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid #3B82F6',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.12)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '1px 7px', borderRadius: '4px' }}>
                            ♂ DÒNG BỐ (SIRE)
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>F1</span>
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--paper)' }}>
                          {selectedHorsePedigree.pedigree?.sire || 'Chưa cập nhật'}
                        </div>
                        {selectedHorsePedigree.pedigree?.sireAchievements && (
                          <div style={{ fontSize: '11px', color: '#93C5FD', marginTop: '4px', lineHeight: 1.3 }}>
                            🏆 {selectedHorsePedigree.pedigree.sireAchievements}
                          </div>
                        )}
                      </div>

                      {/* MẸ (DAM) */}
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid #F43F5E',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        boxShadow: '0 2px 8px rgba(244, 63, 94, 0.12)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(244, 63, 94, 0.2)', color: '#FB7185', padding: '1px 7px', borderRadius: '4px' }}>
                            ♀ DÒNG MẸ (DAM)
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>F1</span>
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--paper)' }}>
                          {selectedHorsePedigree.pedigree?.dam || 'Chưa cập nhật'}
                        </div>
                        {selectedHorsePedigree.pedigree?.damAchievements && (
                          <div style={{ fontSize: '11px', color: '#FDA4AF', marginTop: '4px', lineHeight: 1.3 }}>
                            🌸 {selectedHorsePedigree.pedigree.damAchievements}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BRACKET CỘT 2 -> CỘT 3 */}
                    <div style={{
                      width: '28px',
                      height: '350px',
                      position: 'relative',
                      flexShrink: 0
                    }}>
                      {/* Nhánh Bố -> Ông Bà Nội */}
                      <div style={{ position: 'absolute', top: '23%', left: 0, width: '14px', height: '2px', background: '#3B82F6', transform: 'translateY(-50%)' }} />
                      <div style={{ position: 'absolute', top: '11%', height: '24%', left: '14px', width: '2px', background: '#3B82F6' }} />
                      <div style={{ position: 'absolute', top: '11%', left: '14px', width: '14px', height: '2px', background: '#3B82F6' }} />
                      <div style={{ position: 'absolute', top: '35%', left: '14px', width: '14px', height: '2px', background: '#3B82F6' }} />

                      {/* Nhánh Mẹ -> Ông Bà Ngoại */}
                      <div style={{ position: 'absolute', bottom: '23%', left: 0, width: '14px', height: '2px', background: '#F43F5E', transform: 'translateY(50%)' }} />
                      <div style={{ position: 'absolute', bottom: '11%', height: '24%', left: '14px', width: '2px', background: '#F43F5E' }} />
                      <div style={{ position: 'absolute', bottom: '35%', left: '14px', width: '14px', height: '2px', background: '#F43F5E' }} />
                      <div style={{ position: 'absolute', bottom: '11%', left: '14px', width: '14px', height: '2px', background: '#F43F5E' }} />
                    </div>

                    {/* CỘT 3: THẾ HỆ 2 - ÔNG BÀ NỘI & NGOẠI (F2) */}
                    <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* ÔNG NỘI */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', padding: '9px 12px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                          ♂ Ông nội (Sire of Sire)
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                          {selectedHorsePedigree.pedigree?.sireOfSire || 'Chưa cập nhật'}
                        </div>
                      </div>

                      {/* BÀ NỘI */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '6px', padding: '9px 12px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FB7185', textTransform: 'uppercase' }}>
                          ♀ Bà nội (Dam of Sire)
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                          {selectedHorsePedigree.pedigree?.damOfSire || 'Chưa cập nhật'}
                        </div>
                      </div>

                      {/* ÔNG NGOẠI */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', padding: '9px 12px', marginTop: '8px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                          ♂ Ông ngoại (Sire of Dam)
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                          {selectedHorsePedigree.pedigree?.sireOfDam || 'Chưa cập nhật'}
                        </div>
                      </div>

                      {/* BÀ NGOẠI */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '6px', padding: '9px 12px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FB7185', textTransform: 'uppercase' }}>
                          ♀ Bà ngoại (Dam of Dam)
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                          {selectedHorsePedigree.pedigree?.damOfDam || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BẢNG TỔNG QUAN DÒNG DÕI HUYẾT THỐNG */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '18px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Sổ Phả Hệ Quốc Tế (Stud Book)
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brass)', marginTop: '2px', fontFamily: 'monospace' }}>
                      {selectedHorsePedigree.pedigree?.studBookNo || `VTB-SB-${selectedHorsePedigree.id || '2026'}`}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Năm Sinh & Độ Tuổi
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                      {selectedHorsePedigree.pedigree?.foaled || selectedHorsePedigree.gender}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Xuất Xứ Giống & Đăng Kiểm
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                      {selectedHorsePedigree.pedigree?.origin || 'Việt Nam (Trường đua Phú Thọ)'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Đặc Trưng Dòng Dõi
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brass)', marginTop: '2px' }}>
                      {selectedHorsePedigree.pedigree?.bloodline || 'Thuần chủng F1 thi đấu chính thức'}
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPedigreeMode('edit')}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 800,
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                    }}
                  >
                    <span>✏️</span> Tự Cập Nhật Phả Hệ Cho Ngựa Này
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedHorsePedigree(null)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper)',
                      border: '1px solid var(--line)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CHẾ ĐỘ 2: CHỦ SỞ HỮU TỰ CẬP NHẬT PHẢ HỆ (EDITING FORM) */}
            {/* ========================================================= */}
            {pedigreeMode === 'edit' && (
              <form onSubmit={handleSavePedigree}>
                <div style={{
                  background: 'rgba(212, 175, 55, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: 'var(--brass)',
                  lineHeight: 1.45
                }}>
                  💡 <b>Quyền chủ sở hữu:</b> Bạn có thể tự do nhập thông tin dòng dõi 3 thế hệ (Dòng Bố, Dòng Mẹ, Ông Bà Nội Ngoại, Sổ Phả Hệ và Thành tích). Sau khi lưu, hệ thống sẽ tự động cập nhật và vẽ lại cây phả hệ gia phả cho chiến mã.
                </div>

                {/* KHỐI 1: THÔNG TIN KHAI SINH & SỔ PHẢ HỆ */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brass)', marginBottom: '10px' }}>
                    1. Khai Sinh & Đăng Ký Sổ Phả Hệ (Stud Book)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Năm sinh / Tuổi
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.foaled}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, foaled: e.target.value })}
                        placeholder="Ví dụ: 2022 (4 tuổi)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Mã Sổ Phả Hệ (Stud Book No.)
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.studBookNo}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, studBookNo: e.target.value })}
                        placeholder="Ví dụ: VTB-SB-2024-001"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Quốc gia xuất xứ dòng máu
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.origin}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, origin: e.target.value })}
                        placeholder="Ví dụ: Nhật Bản (JRA) / Anh Quốc"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Đặc trưng dòng dõi huyết thống
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.bloodline}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, bloodline: e.target.value })}
                        placeholder="Ví dụ: Sunday Silence × Northern Dancer"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* KHỐI 2: NHÁNH DÒNG BỐ (PATERNAL LINE - SIRE ♂) */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#60A5FA', marginBottom: '10px' }}>
                    <span>♂</span> 2. Nhánh Dòng Bố (Paternal Line - Sire)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Tên Bố (Sire) <span style={{ color: 'var(--brass)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pedigreeFormData.sire}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, sire: e.target.value })}
                        placeholder="Ví dụ: Deep Impact (JPN)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Ông nội (Sire of Sire)
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.sireOfSire}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, sireOfSire: e.target.value })}
                        placeholder="Ví dụ: Sunday Silence (USA)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Bà nội (Dam of Sire)
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.damOfSire}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, damOfSire: e.target.value })}
                        placeholder="Ví dụ: Wind in Her Hair (IRE)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                      Thành tích / Danh hiệu nổi bật của nhánh Bố
                    </label>
                    <input
                      type="text"
                      value={pedigreeFormData.sireAchievements}
                      onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, sireAchievements: e.target.value })}
                      placeholder="Ví dụ: Vô địch 7 danh hiệu G1, Huyền thoại Japan Cup & Dubai Sheema"
                      style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* KHỐI 3: NHÁNH DÒNG MẸ (MATERNAL LINE - DAM ♀) */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#FB7185', marginBottom: '10px' }}>
                    <span>♀</span> 3. Nhánh Dòng Mẹ (Maternal Line - Dam)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Tên Mẹ (Dam) <span style={{ color: 'var(--brass)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pedigreeFormData.dam}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, dam: e.target.value })}
                        placeholder="Ví dụ: Northern Dancer (USA)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Ông ngoại (Sire of Dam)
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.sireOfDam}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, sireOfDam: e.target.value })}
                        placeholder="Ví dụ: Nearctic (CAN)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                        Bà ngoại (Dam of Dam)
                      </label>
                      <input
                        type="text"
                        value={pedigreeFormData.damOfDam}
                        onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, damOfDam: e.target.value })}
                        placeholder="Ví dụ: Natalma (USA)"
                        style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '3px' }}>
                      Thành tích / Danh hiệu nổi bật của nhánh Mẹ
                    </label>
                    <input
                      type="text"
                      value={pedigreeFormData.damAchievements}
                      onChange={(e) => setPedigreeFormData({ ...pedigreeFormData, damAchievements: e.target.value })}
                      placeholder="Ví dụ: Dòng giống mẫu tộc quý tộc, sinh nhiều nhà vô địch cúp Derby"
                      style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '5px', color: 'var(--paper)', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Nút lưu form */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPedigreeMode('view')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper-dim)',
                      border: '1px solid var(--line)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Hủy / Xem Cây Phả Hệ
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '8px 22px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 800,
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)'
                    }}
                  >
                    💾 Lưu Cập Nhật Phả Hệ
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: ĐĂNG KÝ / NÂNG CẤP GÓI HỘI VIÊN (MEMBERSHIP UPGRADE MODAL) */}
      {/* ========================================================================= */}
      {showMembershipModal && (
        <div className="modal-overlay" onClick={() => setShowMembershipModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '680px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)' }}><IconCrown size={22} /></span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--brass)' }}>
                  Đăng Ký Quyền Lợi & Gói Hội Viên Chủ Ngựa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMembershipModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 16px', lineHeight: 1.45 }}>
              Chủ động nâng cấp hoặc hạ cấp quyền lợi bất kỳ lúc nào. Không ràng buộc thời hạn tối thiểu.
            </p>

            {/* Bộ chọn chu kỳ đóng phí */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: '8px',
              width: 'fit-content',
              margin: '0 auto 20px',
              border: '1px solid var(--line)'
            }}>
              <button
                type="button"
                onClick={() => setBillingCycle('month')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  background: billingCycle === 'month' ? 'var(--bg-card)' : 'transparent',
                  color: billingCycle === 'month' ? 'var(--paper)' : 'var(--paper-dim)',
                  border: billingCycle === 'month' ? '1px solid var(--line)' : 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('year')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  background: billingCycle === 'year' ? 'var(--brass)' : 'transparent',
                  color: billingCycle === 'year' ? '#0A0D14' : 'var(--paper-dim)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Đóng Theo Năm</span>
                <span style={{ fontSize: '10px', background: billingCycle === 'year' ? '#0A0D14' : 'var(--brass)', color: billingCycle === 'year' ? 'var(--brass)' : '#0A0D14', padding: '1px 5px', borderRadius: '3px' }}>-25%</span>
              </button>
            </div>

            {/* Bảng so sánh 2 cột */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Gói 0 Đồng */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)', marginBottom: '4px' }}>
                    Horse 0 Đồng
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '12px' }}>
                    Gói khởi đầu miễn phí trọn đời
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--paper)', marginBottom: '14px', fontFamily: 'var(--display)' }}>
                    0 VNĐ
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--paper-dim)', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                    <div>• Tối đa <b>02 chiến mã</b></div>
                    <div>• Ô chuồng Block C tiêu chuẩn</div>
                    <div>• Báo cáo huấn luyện tóm tắt</div>
                    <div>• Trích thưởng giải: <b>CLB giữ 15% – 20%</b></div>
                    <div>• Không chiết khấu phí lưu chuồng</div>
                    <div>• Vé khán đài tiêu chuẩn</div>
                  </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <button
                    type="button"
                    disabled={membershipTier === 'FREE'}
                    onClick={() => handleSelectTier('FREE')}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '6px',
                      background: membershipTier === 'FREE' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      color: membershipTier === 'FREE' ? 'var(--paper-dim)' : 'var(--paper)',
                      border: '1px solid var(--line)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: membershipTier === 'FREE' ? 'default' : 'pointer'
                    }}
                  >
                    {membershipTier === 'FREE'
                      ? (hasVipSubscription ? 'Đang Dùng Chế Độ 0 Đồng (Bảo Lưu VIP)' : 'Đang Dùng Gói Này')
                      : (hasVipSubscription ? 'Chuyển Tạm Về 0 Đồng (Bảo Lưu VIP)' : 'Chuyển Về 0 Đồng')}
                  </button>
                </div>
              </div>

              {/* Gói Horse Premium */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.04)',
                border: '1.5px solid var(--brass)',
                borderRadius: '8px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '3px',
                  letterSpacing: '0.04em'
                }}>
                  KHUYÊN DÙNG (VIP)
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brass)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👑</span> Horse Premium
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '12px' }}>
                    Đặc quyền cao cấp & tối ưu thưởng
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--paper-dim)', textDecoration: 'line-through' }}>
                        {billingCycle === 'year' ? '89.000.000 VNĐ' : '9.900.000 VNĐ'}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {billingCycle === 'year' ? 'Ưu đãi đặc quyền -60%' : 'Ưu đãi -65%'}
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brass)', fontFamily: 'var(--display)' }}>
                      {billingCycle === 'year' ? '35.000.000 VNĐ' : '3.500.000 VNĐ'}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper-dim)' }}>{billingCycle === 'year' ? ' / NĂM' : ' / THÁNG'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--paper)', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                    <div>✓ <b style={{ color: 'var(--brass)' }}>Không giới hạn số lượng chiến mã</b></div>
                    <div>✓ Chuồng VIP Block A/B đệm rơm khử khuẩn</div>
                    <div>✓ <b>Viễn trắc IoT Real-time từng mét bứt tốc</b></div>
                    <div>✓ Chỉ định HLV Trưởng & giáo án 1-kèm-1</div>
                    <div>✓ <b style={{ color: 'var(--brass)' }}>Hoa hồng thưởng chỉ 5% (Chủ nhận 95%)</b></div>
                    <div>✓ <b>Giảm 15% tổng chi phí lưu chuồng</b></div>
                    <div>✓ Bác sĩ thú y trưởng trực tiếp hội chẩn</div>
                    <div>✓ Thẻ VIP Lounge & Vào khu cách ly Paddock</div>
                  </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <button
                    type="button"
                    disabled={membershipTier === 'PREMIUM'}
                    onClick={() => handleSelectTier('PREMIUM')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.2)' : 'var(--brass)',
                      color: membershipTier === 'PREMIUM' ? 'var(--brass)' : '#0A0D14',
                      border: membershipTier === 'PREMIUM' ? '1px solid var(--brass)' : 'none',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: membershipTier === 'PREMIUM' ? 'default' : 'pointer'
                    }}
                  >
                    {membershipTier === 'PREMIUM'
                      ? 'Đặc Quyền VIP Đang Kích Hoạt ✓'
                      : hasVipSubscription
                        ? '👑 Khôi Phục Đặc Quyền VIP (Đã Sở Hữu)'
                        : '⚡ Kích Hoạt Gói Premium Ngay'}
                  </button>
                  {hasVipSubscription && membershipTier === 'FREE' && (
                    <div style={{ fontSize: '11px', color: 'var(--brass)', textAlign: 'center', marginTop: '6px' }}>
                      (Gói VIP của bạn vẫn còn hiệu lực, khôi phục miễn phí)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowMembershipModal(false)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--paper)',
                  border: '1px solid var(--line)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: GIAO DỊCH THANH TOÁN GÓI HỘI VIÊN VIP (PAYMENT TRANSACTION MODAL) */}
      {/* ========================================================================= */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        packageData={{
          id: 'PREMIUM',
          name: 'Horse Premium VIP',
          cycle: billingCycle,
          amount: billingCycle === 'year' ? 35000000 : 3500000
        }}
        ownerInfo={{
          name: currentUser?.full_name || 'Chủ Sở Hữu Ngựa',
          email: currentUser?.email || '',
          phone: currentUser?.phone || '',
          ownerKey: ownerKey
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* ========================================================================= */}
      {/* MODAL 6.5: ĐIỀU LỆ MUA HÀNG & THỎA THUẬN KÝ TÊN ĐIỆN TỬ */}
      {/* ========================================================================= */}
      {termsAndSignatureModal && (
        <div className="modal-overlay" style={{ zIndex: 9999999 }}>
          <div
            className="modal-box custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '680px',
              width: '94%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1.5px solid var(--brass)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
              borderRadius: '12px'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--line-strong)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(232, 107, 44, 0.12)', border: '1px solid var(--brass)', color: 'var(--brass)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>
                📜 BƯỚC XÁC THỰC PHÁP LÝ & KÝ SỐ
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '19px', fontWeight: 800, color: 'var(--paper)' }}>
                ĐIỀU LỆ MUA HÀNG & THỎA THUẬN DỊCH VỤ VIP
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                Gói dịch vụ: <b style={{ color: 'var(--brass)' }}>{termsAndSignatureModal.packageName}</b> · Khách hàng: <b>{termsAndSignatureModal.ownerName}</b>
              </div>
            </div>

            {/* Khung nội dung 5 Điều lệ có thanh cuộn mượt */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '12.5px',
              lineHeight: 1.6,
              color: 'var(--paper)',
              maxHeight: '190px',
              overflowY: 'auto',
              marginBottom: '16px'
            }} className="custom-scrollbar">
              <div style={{ marginBottom: '12px' }}>
                <b style={{ color: 'var(--brass)' }}>ĐIỀU 1: QUYỀN HẠN & ĐẶC QUYỀN HỘI VIÊN VIP</b>
                <p style={{ margin: '4px 0 0', color: 'var(--paper-dim)' }}>
                  1.1. Chủ sở hữu kích hoạt Gói HORSE PREMIUM VIP có quyền sở hữu, đăng ký và nhập chuồng không giới hạn số lượng chiến mã.<br/>
                  1.2. Được phân bổ ưu tiên chuồng VIP Block A/B (16–18 m²) với đệm rơm sấy khử khuẩn, hệ thống thông gió tuần hoàn và camera giám sát trực tiếp 24/7.<br/>
                  1.3. Quyền truy cập độc quyền luồng viễn trắc IoT Telemetry từng mét bứt tốc, đồ thị nhịp tim thời gian thực và chỉ định HLV Trưởng & Thú y trưởng trực tiếp.
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <b style={{ color: 'var(--brass)' }}>ĐIỀU 2: TIÊU CHUẨN AN TOÀN, ĐẠO ĐỨC & Y TẾ THÚ Y</b>
                <p style={{ margin: '4px 0 0', color: 'var(--paper-dim)' }}>
                  2.1. Chủ sở hữu cam kết tuân thủ tuyệt đối chỉ định của Bác sĩ Thú y Trưởng khi có yêu cầu khóa huấn luyện khẩn cấp, giảm tải bài tập hoặc cách ly phòng dịch.<br/>
                  2.2. Nghiêm cấm tuyệt đối mọi hành vi sử dụng chất kích thích, Doping hoặc can thiệp phi thể thao trái với quy chuẩn Liên đoàn Đua ngựa Quốc tế (IFHA).
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <b style={{ color: 'var(--brass)' }}>ĐIỀU 3: CƠ CẤU PHÂN CHIA TIỀN THƯỞNG GIẢI ĐUA</b>
                <p style={{ margin: '4px 0 0', color: 'var(--paper-dim)' }}>
                  3.1. Chủ sở hữu nhận 95% tổng giá trị giải thưởng tiền mặt chính thức từ các giải đấu trong hệ thống Trường đua Phú Thọ.<br/>
                  3.2. 5% còn lại được trích nộp vào Quỹ phúc lợi chăm sóc nài ngựa (Jockey), đội ngũ Groom và bảo trì mặt đường chạy cỏ/cát.
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <b style={{ color: 'var(--brass)' }}>ĐIỀU 4: BẢO MẬT THÔNG TIN & QUYỀN THƯƠNG MẠI HÌNH ẢNH</b>
                <p style={{ margin: '4px 0 0', color: 'var(--paper-dim)' }}>
                  4.1. Trường đua Phú Thọ cam kết bảo mật 100% dữ liệu telemetry, chiến thuật chạy và hồ sơ phả hệ của chiến mã.<br/>
                  4.2. Chủ sở hữu nắm giữ trọn vẹn bản quyền thương mại, quyền chuyển nhượng và quảng bá hình ảnh liên quan đến chiến mã.
                </p>
              </div>

              <div>
                <b style={{ color: 'var(--brass)' }}>ĐIỀU 5: CAM KẾT THANH TOÁN & HIỆU LỰC HỢP ĐỒNG</b>
                <p style={{ margin: '4px 0 0', color: 'var(--paper-dim)' }}>
                  5.1. Thỏa thuận này có hiệu lực 01 Năm (365 ngày) kể từ ngày xác thực ký số điện tử thành công.<br/>
                  5.2. Trong trường hợp bất khả kháng hoặc chiến mã phải phẫu thuật điều trị dài hạn, thời hạn gói VIP sẽ được tự động bảo lưu tương ứng.
                </p>
              </div>
            </div>

            {/* Checkbox cam kết */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              background: agreeTerms ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.08)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1px solid ${agreeTerms ? '#10B981' : 'var(--line-strong)'}`,
              marginBottom: '16px',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ marginTop: '3px', transform: 'scale(1.2)', cursor: 'pointer', accentColor: 'var(--brass)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--paper)', lineHeight: 1.5 }}>
                Tôi là Chủ sở hữu <b>{termsAndSignatureModal.ownerName}</b>, cam kết đã đọc kỹ, thấu hiểu và đồng ý hoàn toàn với các Điều lệ mua hàng & Thỏa thuận dịch vụ VIP của Trường đua Quốc tế Phú Thọ.
              </span>
            </label>

            {/* Khung Ký Tên Điện Tử */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <b style={{ fontSize: '13px', color: 'var(--paper)' }}>
                  ✍️ Chữ ký điện tử của Bên Mua / Chủ sở hữu:
                </b>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      background: signatureMode === 'draw' ? 'var(--brass)' : 'transparent',
                      color: signatureMode === 'draw' ? '#0A0D14' : 'var(--paper-dim)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    Vẽ chữ ký
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('type')}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      background: signatureMode === 'type' ? 'var(--brass)' : 'transparent',
                      color: signatureMode === 'type' ? '#0A0D14' : 'var(--paper-dim)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    Ký theo tên
                  </button>
                </div>
              </div>

              {signatureMode === 'draw' ? (
                <div>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1.5px dashed #94A3B8',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <canvas
                      ref={signatureCanvasRef}
                      width={620}
                      height={110}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{
                        width: '100%',
                        height: '110px',
                        display: 'block',
                        cursor: 'crosshair',
                        touchAction: 'none'
                      }}
                    />
                    {!hasDrawnSignature && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94A3B8',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        fontStyle: 'italic'
                      }}>
                        Dùng chuột hoặc chạm ngón tay để vẽ chữ ký của bạn vào khung này...
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                      Chữ ký số sẽ được tự động đóng dấu vào hóa đơn VAT chính thức.
                    </span>
                    <button
                      type="button"
                      onClick={clearSignatureCanvas}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brass)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 6px'
                      }}
                    >
                      🔄 Xóa ký lại
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSignName}
                    onChange={(e) => setTypedSignName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ của bạn..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                    border: '1px solid #CBD5E1',
                    fontFamily: '"Brush Script MT", "Segoe Script", "Dancing Script", cursive',
                    fontSize: '26px',
                    color: '#0F172A',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {typedSignName || 'Chữ ký điện tử nghệ thuật'}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTermsAndSignatureModal(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--paper-dim)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSignatureAndShowInvoice}
                disabled={!agreeTerms}
                style={{
                  padding: '9px 24px',
                  borderRadius: '6px',
                  background: agreeTerms ? 'var(--brass)' : 'rgba(255, 255, 255, 0.1)',
                  color: agreeTerms ? '#0A0D14' : 'var(--paper-dim)',
                  fontWeight: 800,
                  border: 'none',
                  fontSize: '13px',
                  cursor: agreeTerms ? 'pointer' : 'not-allowed',
                  boxShadow: agreeTerms ? '0 2px 10px rgba(232, 107, 44, 0.35)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ✍️ Xác Nhận Ký Tên & Xuất Hóa Đơn Chi Tiết →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CHI TIẾT HÓA ĐƠN ĐIỆN TỬ CHUẨN DOANH NGHIỆP (PAYMENT RECEIPT INVOICE) */}
      {/* ========================================================================= */}
      {selectedPaymentReceiptModal && (
        <div className="modal-overlay" onClick={() => setSelectedPaymentReceiptModal(null)} style={{ zIndex: 9999999 }}>
          <div
            className="modal-box custom-scrollbar printable-invoice"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '720px',
              width: '95%',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '28px',
              border: '1.5px solid var(--brass)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px'
            }}
          >
            {/* Header Doanh Nghiệp & Mẫu Số Hóa Đơn */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid var(--line-strong)',
              paddingBottom: '14px',
              marginBottom: '16px',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              {/* Bên Bán */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brass)', letterSpacing: '0.02em', marginBottom: '3px' }}>
                  CÔNG TY CỔ PHẦN TRƯỜNG ĐUA QUỐC TẾ PHÚ THỌ
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
                  Mã số thuế: <b style={{ color: 'var(--paper)' }}>0312345678</b><br/>
                  Địa chỉ: Số 2 Lê Đại Hành, Phường 15, Quận 11, TP. Hồ Chí Minh<br/>
                  Hotline: 1900 6868 · Email: billing@matruong.vn · Website: matruong.vn
                </div>
              </div>

              {/* Thông tin hóa đơn điện tử */}
              <div style={{ textAlign: 'right', minWidth: '180px', fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                <div>Mẫu số: <b style={{ color: 'var(--paper)' }}>01GTKT0/001</b></div>
                <div>Ký hiệu: <b style={{ color: 'var(--paper)' }}>PT/26E</b></div>
                <div>Số hóa đơn: <b style={{ color: 'var(--brass)', fontFamily: 'monospace', fontSize: '13px' }}>{selectedPaymentReceiptModal.transactionId.replace('TXN-VIP-', 'HD-2026-')}</b></div>
                <div>Ngày lập: <span style={{ color: 'var(--paper)' }}>{selectedPaymentReceiptModal.paidAt}</span></div>
              </div>
            </div>

            {/* Tiêu đề Hóa Đơn & Con dấu trạng thái */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', color: '#10B981', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                ✓ ĐÃ THANH TOÁN THÀNH CÔNG (PAID)
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: 'var(--paper)', letterSpacing: '0.04em' }}>
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG (ĐIỆN TỬ)
              </h2>
              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', fontStyle: 'italic' }}>
                (Bản thể hiện chính thức của Hóa đơn điện tử theo chuẩn Nghị định 123/2020/NĐ-CP)
              </div>
            </div>

            {/* Thông tin Bên Mua Hàng */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '6px 16px'
            }}>
              <div>Họ tên người mua hàng: <b style={{ color: 'var(--paper)' }}>{selectedPaymentReceiptModal.ownerName}</b></div>
              <div>Đơn vị: <span style={{ color: 'var(--paper)' }}>Chủ sở hữu chiến mã VIP - Trường đua Phú Thọ</span></div>
              <div>Hình thức thanh toán: <b style={{ color: 'var(--brass)' }}>{selectedPaymentReceiptModal.method}</b></div>
              <div>Đồng tiền thanh toán: <b style={{ color: 'var(--paper)' }}>Việt Nam Đồng (VNĐ)</b></div>
            </div>

            {/* BẢNG KÊ CHI TIẾT DỊCH VỤ (ITEMIZED TABLE) */}
            <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ background: 'rgba(212, 175, 55, 0.15)', borderBottom: '1.5px solid var(--brass)' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '38px', color: 'var(--brass)' }}>STT</th>
                    <th style={{ padding: '8px 10px', color: 'var(--brass)' }}>Tên Dịch Vụ / Hàng Hóa</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '60px', color: 'var(--brass)' }}>ĐVT</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '45px', color: 'var(--brass)' }}>SL</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', width: '100px', color: 'var(--brass)' }}>Đơn Giá Gốc</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', width: '100px', color: 'var(--brass)' }}>Ưu Đãi VIP</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px', color: 'var(--brass)' }}>Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 6px', textAlign: 'center', color: 'var(--paper-dim)' }}>01</td>
                    <td style={{ padding: '10px 10px' }}>
                      <b style={{ color: 'var(--paper)', fontSize: '13px' }}>{selectedPaymentReceiptModal.packageName}</b>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                        • Không giới hạn số lượng chiến mã<br/>
                        • Chuồng VIP Block A/B đệm rơm sấy khử khuẩn<br/>
                        • Viễn trắc IoT telemetry real-time từng mét chạy<br/>
                        • Chỉ định HLV Trưởng & Bác sĩ Thú y trưởng trực tiếp<br/>
                        • Thẻ VIP Lounge & Vào khu cách ly Paddock
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--paper-dim)' }}>Gói (Năm)</td>
                    <td style={{ padding: '10px 6px', textAlign: 'center', color: 'var(--paper)' }}>01</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--paper-dim)', textDecoration: 'line-through' }}>89.000.000 đ</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#10B981', fontWeight: 600 }}>-54.000.000 đ</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--paper)', fontSize: '13px' }}>35.000.000 đ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BẢNG TỔNG CỘNG TIỀN & THUẾ VAT */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12.5px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Cộng tiền dịch vụ (chưa thuế GTGT):</span>
                <span>31.818.182 đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Thuế suất GTGT (VAT 10%):</span>
                <span>3.181.818 đ</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--line-strong)',
                paddingTop: '8px',
                fontSize: '15px'
              }}>
                <b style={{ color: 'var(--paper)' }}>TỔNG CỘNG TIỀN THANH TOÁN:</b>
                <b style={{ color: '#10B981', fontSize: '19px' }}>{selectedPaymentReceiptModal.amountFormatted}</b>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', fontStyle: 'italic', marginTop: '4px' }}>
                Số tiền viết bằng chữ: <b>Ba mươi lăm triệu đồng chẵn.</b>
              </div>
            </div>

            {/* KHU VỰC CHỮ KÝ HAI BÊN & CON DẤU MỘC ĐỎ */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              borderTop: '1px dashed var(--line)',
              paddingTop: '16px',
              marginBottom: '16px',
              alignItems: 'start'
            }}>
              {/* Bên Trái: Người Mua Hàng */}
              <div style={{ textAlign: 'center' }}>
                <b style={{ fontSize: '12px', color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  NGƯỜI MUA HÀNG / CHỦ SỞ HỮU
                </b>
                <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', fontStyle: 'italic', marginBottom: '8px' }}>
                  (Ký, ghi rõ họ tên & chứng thực số)
                </div>

                {/* Chữ ký của khách hàng */}
                <div style={{ minHeight: '65px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedPaymentReceiptModal.signatureData && selectedPaymentReceiptModal.signatureType === 'draw' ? (
                    <img
                      src={selectedPaymentReceiptModal.signatureData}
                      alt="Chữ ký người mua"
                      style={{ maxHeight: '55px', maxWidth: '160px', filter: 'brightness(1.2)' }}
                    />
                  ) : (
                    <div style={{
                      fontFamily: '"Brush Script MT", "Segoe Script", "Dancing Script", cursive',
                      fontSize: '26px',
                      color: '#10B981'
                    }}>
                      {selectedPaymentReceiptModal.signatureData || selectedPaymentReceiptModal.ownerName}
                    </div>
                  )}
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
                    ✓ Ký điện tử: {selectedPaymentReceiptModal.signedAt || selectedPaymentReceiptModal.paidAt}
                  </span>
                </div>

                <b style={{ fontSize: '13px', color: 'var(--paper)', display: 'block', marginTop: '4px' }}>
                  {selectedPaymentReceiptModal.ownerName}
                </b>
              </div>

              {/* Bên Phải: Đại Diện Trường Đua Phú Thọ & Con Dấu Đỏ */}
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <b style={{ fontSize: '12px', color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ĐẠI DIỆN TRƯỜNG ĐUA QUỐC TẾ PHÚ THỌ
                </b>
                <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', fontStyle: 'italic', marginBottom: '8px' }}>
                  (Thủ trưởng đơn vị ký số & đóng dấu)
                </div>

                {/* Chữ ký giám đốc và con dấu đỏ */}
                <div style={{ minHeight: '65px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                    fontSize: '24px',
                    color: '#DC2626',
                    zIndex: 2,
                    position: 'relative'
                  }}>
                    Trần Văn Hùng
                  </div>

                  {/* Con Dấu Mộc Đỏ Vector SVG */}
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '25%',
                    transform: 'rotate(-8deg)',
                    pointerEvents: 'none',
                    opacity: 0.88,
                    zIndex: 1
                  }}>
                    <svg width="88" height="88" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="3 1.5" />
                      <circle cx="50" cy="50" r="43" fill="none" stroke="#DC2626" strokeWidth="1.5" />
                      <path id="stamp-text-circle" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
                      <text fill="#DC2626" fontSize="6.8" fontWeight="900" letterSpacing="0.05em">
                        <textPath href="#stamp-text-circle" startOffset="50%" textAnchor="middle">
                          TRƯỜNG ĐUA PHÚ THỌ
                        </textPath>
                      </text>
                      <polygon points="50,38 52.5,45 60,45 54,49 56,56 50,52 44,56 46,49 40,45 47.5,45" fill="#DC2626" />
                      <text x="50" y="66" fill="#DC2626" fontSize="7" fontWeight="bold" textAnchor="middle">
                        ĐÃ THU TIỀN
                      </text>
                      <text x="50" y="76" fill="#DC2626" fontSize="5.5" fontWeight="600" textAnchor="middle">
                        MST: 0312345678
                      </text>
                    </svg>
                  </div>
                </div>

                <b style={{ fontSize: '13px', color: 'var(--paper)', display: 'block', marginTop: '4px' }}>
                  Trần Văn Hùng (Giám đốc Điều hành)
                </b>
              </div>
            </div>

            {/* Mã tra cứu & Chứng thực hóa đơn */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '11px',
              color: 'var(--paper-dim)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <div>🛡️ Tra cứu hóa đơn điện tử tại: <b style={{ color: 'var(--brass)' }}>https://tracuu.matruong.vn</b></div>
              <div>Mã bảo mật tra cứu: <b style={{ color: 'var(--paper)', fontFamily: 'monospace' }}>{selectedPaymentReceiptModal.transactionId}</b></div>
            </div>

            {/* Action buttons */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedPaymentReceiptModal(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--paper)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                style={{
                  padding: '9px 24px',
                  borderRadius: '6px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontWeight: 800,
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(232, 107, 44, 0.35)'
                }}
              >
                🖨️ In Hóa Đơn / Xuất PDF (Có Chữ Ký & Mộc Đỏ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: GỢI Ý NÂNG CẤP GÓI VIP (VIP UPGRADE PROMPT MODAL) */}
      {/* ========================================================================= */}
      {upgradePromptModal && (
        <div className="modal-overlay" onClick={() => setUpgradePromptModal(null)} style={{ zIndex: 99999999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '480px',
              width: '92%',
              padding: '24px 26px',
              border: '2px solid var(--brass)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '2px solid var(--brass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              fontSize: '26px'
            }}>
              👑
            </div>

            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              background: 'var(--brass)',
              color: '#0A0D14',
              padding: '2px 10px',
              borderRadius: '12px',
              letterSpacing: '0.04em',
              marginBottom: '10px'
            }}>
              {upgradePromptModal.badge || 'ĐẶC QUYỀN GÓI VIP'}
            </span>

            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
              {upgradePromptModal.title}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', lineHeight: 1.5, margin: '0 0 16px' }}>
              {upgradePromptModal.message}
            </p>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12.5px',
              color: 'var(--brass)',
              fontWeight: 600,
              textAlign: 'left',
              lineHeight: 1.45,
              marginBottom: '20px'
            }}>
              {upgradePromptModal.benefit}
            </div>

            <div className="modal-responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setUpgradePromptModal(null)}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--paper-dim)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✕ Để sau
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasVipSubscription) {
                    setUpgradePromptModal(null);
                    handleSelectTier('PREMIUM');
                  } else {
                    setUpgradePromptModal(null);
                    setShowPaymentModal(true);
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontWeight: 800,
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)',
                  letterSpacing: '0.01em'
                }}
              >
                {hasVipSubscription
                  ? '👑 Khôi Phục Đặc Quyền VIP (Miễn Phí)'
                  : (upgradePromptModal.actionText || '⚡ Nâng Cấp Gói VIP Ngay')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Chỉ định & Thay đổi Đội ngũ phục vụ chuyên trách */}
      {teamModalHorse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--brass)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  🛡️ ĐỘI NGŨ CHUYÊN TRÁCH CỐ ĐỊNH
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: 'var(--paper)' }}>
                  Chỉ Định Đội Ngũ: <span style={{ color: 'var(--brass)' }}>{teamModalHorse.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTeamModalHorse(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 18px', lineHeight: 1.5 }}>
              Bạn có toàn quyền lựa chọn hoặc thay đổi HLV, Bác sĩ và Groom phục vụ chiến mã này. Nhân sự được chọn sẽ nhận thông báo và truy cập để xác nhận phục vụ.
            </p>

            <form onSubmit={handleSaveTeamModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Chọn HLV */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>🏇</span> Huấn Luyện Viên Phụ Trách (1 trong 3 HLV chính):
                </label>
                <select
                  value={selectedTeamStaff.trainerUsername}
                  onChange={(e) => setSelectedTeamStaff({ ...selectedTeamStaff, trainerUsername: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {FIXED_TRAINERS_LIST.map(tr => (
                    <option key={tr.username} value={tr.username}>
                      {tr.name} — {tr.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Chọn Bác sĩ Thú y */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>🩺</span> Bác Sĩ Thú Y Phụ Trách (1 trong 3 Bác sĩ chính):
                </label>
                <select
                  value={selectedTeamStaff.vetUsername}
                  onChange={(e) => setSelectedTeamStaff({ ...selectedTeamStaff, vetUsername: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {FIXED_VETS_LIST.map(vt => (
                    <option key={vt.username} value={vt.username}>
                      {vt.name} — {vt.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Chọn Groom */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#C084FC', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span>🌾</span> Chuyên Viên Chăm Sóc (1 trong 3 Groom chính):
                </label>
                <select
                  value={selectedTeamStaff.groomUsername}
                  onChange={(e) => setSelectedTeamStaff({ ...selectedTeamStaff, groomUsername: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {FIXED_GROOMS_LIST.map(gm => (
                    <option key={gm.username} value={gm.username}>
                      {gm.name} — {gm.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setTeamModalHorse(null)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ✕ Hủy bỏ
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: 'var(--brass)',
                    fontWeight: 700,
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  title="Gửi yêu cầu phục vụ đến từng nhân sự và để ở trạng thái Chờ xác nhận"
                >
                  ⏳ Lưu & Chờ Xác Nhận
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveTeamModal(null, true)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 800,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)'
                  }}
                  title="Lưu đội ngũ và lập tức đánh dấu Đã xác nhận cho cả 3 vai trò (HLV, BS, Groom)"
                >
                  ✓ Xác Nhận Đủ 3 Vai Trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CHỦ SỞ HỮU ĐẶT LỊCH TẬP LUYỆN CHUNG VỚI HLV */}
      {showJointBookingModal && (
        <div className="modal-backdrop" onClick={() => setShowJointBookingModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Đặt Lịch Tập Luyện Chung Cùng Huấn Luyện Viên</h3>
              <button className="modal-close" onClick={() => setShowJointBookingModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitJointBooking}>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Chọn chiến mã */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    Chọn chiến mã ra sân:
                  </label>
                  <select
                    className="portal-input"
                    value={jointBookingForm.horseId}
                    onChange={(e) => setJointBookingForm({ ...jointBookingForm, horseId: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {myHorses.map(h => {
                      const lockStatus = checkHorseVetLockStatus(h.microchip || h.id || h.name);
                      const isLocked = lockStatus.isLocked || h.isLockedByVet;
                      return (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.stable || 'Ô A1'}) {isLocked ? '⛔ [ĐANG KHÓA Y TẾ - CẤM TẬP]' : '✓ [Đủ điều kiện]'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Kiểm tra và hiển thị cảnh báo đỏ nếu ngựa bị khóa y tế */}
                {(() => {
                  const currHorse = myHorses.find(h => String(h.id) === String(jointBookingForm.horseId)) || myHorses[0];
                  if (!currHorse) return null;
                  const lockStatus = checkHorseVetLockStatus(currHorse.microchip || currHorse.id || currHorse.name);
                  if (lockStatus.isLocked || currHorse.isLockedByVet) {
                    return (
                      <div style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#EF4444',
                        fontSize: '12.5px',
                        lineHeight: 1.5
                      }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span>⛔</span> CHIẾN MÃ ĐANG BỊ KHÓA Y TẾ BỞI BÁC SĨ THÚ Y!
                        </div>
                        <div><b>Lý do phong tỏa:</b> {lockStatus.reason || 'Dấu hiệu chấn thương hoặc kiểm dịch'}</div>
                        <div style={{ marginTop: '4px', fontSize: '11.5px', color: 'var(--paper)' }}>
                          ⚠️ <b>Quy định bắt buộc:</b> Bạn phải chờ Bác sĩ Thú y kiểm tra sức khỏe và xác nhận dỡ bỏ lệnh khóa y tế tại Cổng Thú Y thì mới được phép cho tập luyện hoặc thi đấu.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 2. Chọn Huấn Luyện Viên */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    Chọn Huấn luyện viên phụ trách:
                  </label>
                  <select
                    className="portal-input"
                    value={jointBookingForm.trainerUsername}
                    onChange={(e) => setJointBookingForm({ ...jointBookingForm, trainerUsername: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {FIXED_TRAINERS_LIST.map(t => (
                      <option key={t.username} value={t.username}>
                        🏇 {t.name} ({t.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Ngày tập & Khung giờ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px', fontWeight: 600 }}>
                      Ngày tập dự kiến:
                    </label>
                    <input
                      type="date"
                      className="portal-input"
                      value={jointBookingForm.sessionDate}
                      onChange={(e) => setJointBookingForm({ ...jointBookingForm, sessionDate: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px', fontWeight: 600 }}>
                      Khung giờ tập:
                    </label>
                    <select
                      className="portal-input"
                      value={jointBookingForm.sessionTime}
                      onChange={(e) => setJointBookingForm({ ...jointBookingForm, sessionTime: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    >
                      {TRAINING_TIME_SLOTS.map(slot => {
                        const status = getSlotBookingStatus(slot.id, jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
                        const isLunch = slot.isLunch;
                        const isBooked = status.isBooked;
                        const valueStr = `${slot.id} (${slot.desc})`;
                        return (
                          <option
                            key={slot.id}
                            value={valueStr}
                            disabled={isLunch || isBooked}
                            style={{
                              background: isLunch || isBooked ? '#000000' : '#141a24',
                              color: isLunch ? '#78716c' : isBooked ? '#71717a' : '#F3F4F6'
                            }}
                          >
                            {isLunch
                              ? '🍽️ 11:45 - 13:00 [NGHỈ TRƯA & BẢO DƯỠNG BÃI TẬP]'
                              : isBooked
                              ? `🔒 ${slot.label} [ĐÃ CÓ NGƯỜI ĐẶT TRƯỚC - BÔI ĐEN]`
                              : `🟢 ${slot.label} (${slot.desc.split(' - ')[1] || slot.desc})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Sơ đồ khung giờ trực quan trong modal: slot trùng/đặt trước bị bôi đen hoàn toàn */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '8px 10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                      Sơ đồ khung giờ trong ngày:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleReset18hSchedule}
                        title="Tới tầm 18:00 tối hệ thống tự động reset. Bấm nút này để kích hoạt reset toàn bộ slot trống lúc 18h ngay lập tức"
                        style={{
                          background: 'rgba(212, 175, 55, 0.16)',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          color: 'var(--brass)',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          padding: '2px 7px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        🔄 Reset lịch 18h
                      </button>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        ⬛ Bôi đen = Đã đặt trước
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: 'var(--paper-dim)',
                    marginBottom: '8px',
                    padding: '3px 8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '4px'
                  }}>
                    <span>⏰ Khung giờ hoạt động: <b>06:00 - 18:00</b></span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Tới 18:00 tự động reset mở lịch trống mới</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                    {TRAINING_TIME_SLOTS.map(slot => {
                      const status = getSlotBookingStatus(slot.id, jointBookingForm.trainerUsername, jointBookingForm.sessionDate);
                      const isLunch = slot.isLunch;
                      const isBooked = status.isBooked;
                      const isSelected = extractSlotPrefix(jointBookingForm.sessionTime) === slot.id;

                      if (isLunch) {
                        return (
                          <div
                            key={slot.id}
                            title="11:45 - 13:00: Nghỉ trưa & bảo dưỡng bãi tập"
                            style={{
                              gridColumn: 'span 2',
                              padding: '5px 2px',
                              background: '#040608',
                              border: '1px dashed rgba(245, 158, 11, 0.3)',
                              borderRadius: '4px',
                              color: '#78716c',
                              fontSize: '10px',
                              textAlign: 'center',
                              cursor: 'not-allowed',
                              userSelect: 'none',
                              pointerEvents: 'none',
                              opacity: 0.65
                            }}
                          >
                            🍽️ 11:45-13:00 (Nghỉ trưa)
                          </div>
                        );
                      }

                      if (isBooked) {
                        return (
                          <div
                            key={slot.id}
                            title="Đã có người đặt trước (Ưu tiên người đặt trước) - Đã bôi đen và không thể đặt"
                            style={{
                              padding: '5px 2px',
                              background: '#000000',
                              border: '1px solid #27272a',
                              borderRadius: '4px',
                              color: '#52525b',
                              fontSize: '10px',
                              fontWeight: 700,
                              textAlign: 'center',
                              cursor: 'not-allowed',
                              userSelect: 'none',
                              pointerEvents: 'none',
                              textDecoration: 'line-through',
                              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.95)'
                            }}
                          >
                            🔒 {slot.label.split(' - ')[0]}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setJointBookingForm(prev => ({
                            ...prev,
                            sessionTime: `${slot.id} (${slot.desc})`
                          }))}
                          style={{
                            padding: '5px 2px',
                            background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: isSelected ? '1.5px solid var(--brass)' : '1px solid var(--line)',
                            borderRadius: '4px',
                            color: isSelected ? 'var(--brass)' : 'var(--paper)',
                            fontSize: '10.5px',
                            fontWeight: isSelected ? 800 : 500,
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {slot.label.split(' - ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Mục tiêu buổi tập */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    Mục tiêu & Nội dung tập chung:
                  </label>
                  <select
                    className="portal-input"
                    value={jointBookingForm.goal}
                    onChange={(e) => setJointBookingForm({ ...jointBookingForm, goal: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Quan sát trực tiếp sải chân & kiểm tra thể lực cùng HLV">🔍 Quan sát trực tiếp sải chân & kiểm tra thể lực cùng HLV</option>
                    <option value="Tập luyện kỹ thuật điều khiển phối hợp giữa chủ và ngựa">🏇 Tập luyện kỹ thuật điều khiển phối hợp giữa chủ và ngựa</option>
                    <option value="Kiểm tra phản xạ xuất phát máy & chạy vòng cua">⚡ Kiểm tra phản xạ xuất phát máy & chạy vòng cua</option>
                    <option value="Thử sức cự ly dài 2.400m sân cỏ tự nhiên">🌿 Thử sức cự ly dài 2.400m sân cỏ tự nhiên</option>
                    <option value="Luyện bứt tốc nước rút 400m cuối sân cát">💨 Luyện bứt tốc nước rút 400m cuối sân cát</option>
                  </select>
                </div>

                {/* 5. Ghi chú gửi HLV */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    Ghi chú / Yêu cầu gửi Huấn luyện viên:
                  </label>
                  <textarea
                    rows={2}
                    className="portal-input"
                    value={jointBookingForm.ownerNotes}
                    onChange={(e) => setJointBookingForm({ ...jointBookingForm, ownerNotes: e.target.value })}
                    placeholder="Ví dụ: Tôi muốn HLV gắn thiết bị đo nhịp tim chuyên sâu và xem ngựa có bị dốc sức khi vào cua..."
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="portal-view-btn"
                  onClick={() => setShowJointBookingModal(false)}
                >
                  Đóng
                </button>
                {(() => {
                  const currHorse = myHorses.find(h => String(h.id) === String(jointBookingForm.horseId)) || myHorses[0];
                  const isLocked = currHorse ? (checkHorseVetLockStatus(currHorse.microchip || currHorse.id || currHorse.name).isLocked || currHorse.isLockedByVet) : false;
                  return (
                    <button
                      type="submit"
                      disabled={isLocked}
                      className="portal-view-btn"
                      style={{
                        background: isLocked ? 'rgba(255, 255, 255, 0.1)' : 'var(--brass)',
                        color: isLocked ? 'var(--paper-dim)' : '#14100A',
                        border: 'none',
                        fontWeight: 700,
                        cursor: isLocked ? 'not-allowed' : 'pointer'
                      }}
                      title={isLocked ? 'Chiến mã đang bị Khóa Y Tế - Không thể đặt lịch tập' : 'Gửi yêu cầu đặt lịch tập chung'}
                    >
                      {isLocked ? '⛔ Đang Khóa Y Tế (Cấm Tập)' : '🤝 Gửi Yêu Cầu Đặt Lịch'}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỦ SỞ HỮU TẠO KHIẾU NẠI & BÁO CÁO NHÂN SỰ GỬI ADMIN */}
      {/* ========================================================================= */}
      {showCreateReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div
            style={{
              background: '#0F1523',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 175, 55, 0.12)',
              color: '#F1F5F9',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 21, 35, 0) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(212, 175, 55, 0.14)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brass)',
                  flexShrink: 0
                }}>
                  <IconReportAlert size={22} color="var(--brass)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                    Gửi Khiếu Nại & Báo Cáo Nhân Sự
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                    Báo cáo trực tiếp đến Ban Quản Trị (Admin) để thẩm tra và xử lý minh bạch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateReportModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94A3B8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
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
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitReport} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nhóm đối tượng */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#E2E8F0', fontWeight: 700, marginBottom: '8px' }}>
                  Đối tượng bạn muốn phản ánh <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { role: 'TRAINER', label: 'Huấn Luyện Viên', subtitle: 'HLV Trưởng & Cự ly', icon: '🏇' },
                    { role: 'VET', label: 'Bác Sĩ Thú Y', subtitle: 'Khám & Hồ sơ y tế', icon: '🩺' },
                    { role: 'CARETAKER', label: 'Nhân Viên Chăm Sóc', subtitle: 'Chuồng trại & Khẩu phần', icon: '🌾' }
                  ].map(item => {
                    const isSelected = reportForm.targetRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => {
                          const firstInRole = PREDEFINED_PERSONNEL.find(p => p.role === item.role) || PREDEFINED_PERSONNEL[0];
                          setReportForm(prev => ({
                            ...prev,
                            targetRole: item.role,
                            targetPersonnelId: firstInRole.id
                          }));
                        }}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '10px',
                          background: isSelected 
                            ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.06) 100%)' 
                            : '#141A29',
                          border: isSelected ? '1.5px solid var(--brass)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isSelected ? 'var(--brass)' : '#CBD5E1',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 0 15px rgba(212, 175, 55, 0.15)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '20px', marginBottom: '2px' }}>{item.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: '12.5px' }}>{item.label}</span>
                        <span style={{ fontSize: '10.5px', color: isSelected ? '#FDE68A' : '#64748B' }}>{item.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nhân sự cụ thể & Chiến mã */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Nhân sự cụ thể <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={reportForm.targetPersonnelId}
                    onChange={(e) => setReportForm({ ...reportForm, targetPersonnelId: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 34px 10px 14px',
                      background: '#141A29 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394A3B8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E") no-repeat calc(100% - 12px) center',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {PREDEFINED_PERSONNEL.filter(p => p.role === reportForm.targetRole).map(person => {
                      const shortTitle = person.title.split('-')[0].split('&')[0].split('(')[0].trim();
                      return (
                        <option key={person.id} value={person.id} style={{ background: '#141A29', color: '#FFFFFF' }}>
                          {person.name} ({shortTitle})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Chiến mã liên quan
                  </label>
                  <select
                    value={reportForm.horseId}
                    onChange={(e) => setReportForm({ ...reportForm, horseId: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 34px 10px 14px',
                      background: '#141A29 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394A3B8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E") no-repeat calc(100% - 12px) center',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {myHorses.map(h => {
                      const stall = h.stallCode || h.stall || h.stable?.split('(')[0]?.trim() || 'Ô A1';
                      return (
                        <option key={h.id} value={h.id} style={{ background: '#141A29', color: '#FFFFFF' }}>
                          🏇 {h.name} ({stall})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Danh mục vi phạm & Mức độ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Danh mục vi phạm <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 34px 10px 14px',
                      background: '#141A29 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394A3B8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E") no-repeat calc(100% - 12px) center',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {REPORT_CATEGORIES.map((cat, idx) => (
                      <option key={idx} value={cat} style={{ background: '#141A29', color: '#FFFFFF' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Mức độ nghiêm trọng <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 34px 10px 14px',
                      background: '#141A29 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394A3B8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E") no-repeat calc(100% - 12px) center',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      color: reportForm.severity === 'CRITICAL' ? '#EF4444' : (reportForm.severity === 'HIGH' ? '#F97316' : (reportForm.severity === 'MEDIUM' ? '#F59E0B' : '#10B981')),
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option value="LOW" style={{ background: '#141A29', color: '#10B981' }}>🟢 Thông thường / Góp ý</option>
                    <option value="MEDIUM" style={{ background: '#141A29', color: '#F59E0B' }}>🟡 Cần chấn chỉnh & Giải trình</option>
                    <option value="HIGH" style={{ background: '#141A29', color: '#F97316' }}>🟠 Nghiêm trọng (Ảnh hưởng ngựa)</option>
                    <option value="CRITICAL" style={{ background: '#141A29', color: '#EF4444' }}>🔴 Khẩn cấp (Lập biên bản)</option>
                  </select>
                </div>
              </div>

              {/* Tiêu đề khiếu nại */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#E2E8F0', fontWeight: 700, marginBottom: '6px' }}>
                  Tiêu đề khiếu nại (Tóm tắt sự việc) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder="Ví dụ: HLV đến trễ buổi tập sáng không báo trước / Đệm rơm ô chuồng ẩm mốc..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    background: '#141A29',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Nội dung chi tiết */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#E2E8F0', fontWeight: 700, marginBottom: '6px' }}>
                  Nội dung phản ánh chi tiết sự việc <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportForm.content}
                  onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                  placeholder="Mô tả cụ thể thời gian, địa điểm, hành vi vi phạm hoặc thái độ phục vụ của nhân sự..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: '#141A29',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Bằng chứng đính kèm */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                  Bằng chứng đính kèm / Ghi chú (Ảnh chụp, camera, mốc thời gian)
                </label>
                <input
                  type="text"
                  value={reportForm.evidenceNote}
                  onChange={(e) => setReportForm({ ...reportForm, evidenceNote: e.target.value })}
                  placeholder="Ví dụ: Đã lưu video trích xuất camera chuồng lúc 15:30 ngày 02/11..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    background: '#141A29',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Banner quy trình xử lý */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>🛡️</span>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', lineHeight: '1.5' }}>
                  <b style={{ color: '#38BDF8' }}>Quy trình xử lý bảo mật:</b> Báo cáo được chuyển trực tiếp tới hộp thư Ban Quản Trị (Admin). Admin sẽ tiến hành trích xuất dữ liệu camera ô chuồng, kiểm tra viễn trắc huấn luyện và yêu cầu nhân sự giải trình minh bạch.
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateReportModal(false)}
                  style={{
                    padding: '10px 20px',
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
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: 'none',
                    color: '#0F172A',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>Gửi Khiếu Nại Cho Admin</span>
                  <span>➔</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: ĐÁNH GIÁ THỂ LỰC & TELEMETRY CHUYÊN SÂU EVOLAB (ĐỒNG BỘ VỚI HLV) */}
      {/* ========================================================================= */}
      {fitnessDetailModalHorse && (
        <RacehorseFitnessDetailModal
          isTrainer={false}
          horse={fitnessDetailModalHorse}
          sessions={jointSessions}
          onClose={() => setFitnessDetailModalHorse(null)}
          onUpdateHorse={(updatedH) => {
            setMyHorses(prev => prev.map(h => (h.microchip === updatedH.microchip || h.id === updatedH.id || (h.name || '').toLowerCase() === (updatedH.name || '').toLowerCase()) ? { ...h, ...updatedH } : h));
          }}
        />
      )}
    </div>
  );
}
