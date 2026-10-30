import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import PaymentModal from '../components/PaymentModal';
import {
  registerOwnerHorseApi,
  updateOwnerHorseApi,
  deleteOwnerHorseApi,
  getSystemTournamentNominationsApi,
  registerRaceTournamentApi,
  updateRaceNominationStatusApi
} from '../services/api';

// Minimalist High-End SVG Icons for Owner Portal (Strict 3-Color Palette)
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
      dam: 'Northern Dancer (USA)',
      foaled: '2022 (4 tuổi)'
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
      dam: 'First Down Dash (USA)',
      foaled: '2021 (5 tuổi)'
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
      dam: 'Sea The Stars (IRE)',
      foaled: '2023 (3 tuổi)'
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

export default function OwnerPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_owner');
      if (['horses', 'training', 'races', 'finance', 'vet', 'membership'].includes(saved)) {
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
  const ownerKey = currentUser?.user_id || currentUser?.username || currentUser?.email || 'new_owner';
  const isDemoVip = currentUser?.username === 'owner_thanh' || currentUser?.email === 'owner@matruong.vn';

  // Quản lý gói Hội viên: 'FREE' (Horse 0 Đồng) hoặc 'PREMIUM' (Horse Premium VIP)
  const [membershipTier, setMembershipTier] = useState(() => {
    try {
      const stored = localStorage.getItem(`matruong_owner_tier_${ownerKey}`);
      if (stored) return stored;
      return isDemoVip ? 'PREMIUM' : 'FREE';
    } catch {
      return isDemoVip ? 'PREMIUM' : 'FREE';
    }
  });

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

  // Xử lý kích hoạt / đổi gói: Nếu chọn gói VIP thì chuyển sang giao dịch thanh toán
  const handleSelectTier = (newTier) => {
    if (newTier === 'PREMIUM') {
      setShowMembershipModal(false);
      setShowPaymentModal(true);
      return;
    }
    setMembershipTier('FREE');
    try {
      localStorage.setItem(`matruong_owner_tier_${ownerKey}`, 'FREE');
    } catch {}
    showToast('Đã chuyển về gói Horse 0 Đồng (Cơ bản).', 'GÓI HỘI VIÊN', 'info');
    setShowMembershipModal(false);
  };

  const handlePaymentSuccess = (receipt) => {
    setMembershipTier('PREMIUM');
    try {
      localStorage.setItem(`matruong_owner_tier_${ownerKey}`, 'PREMIUM');
      const key = `matruong_owner_payments_${ownerKey}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([receipt, ...existing]));
    } catch {}
  };

  // State 1: Danh sách ngựa của Chủ sở hữu (Lưu riêng theo từng tài khoản)
  const [myHorses, setMyHorses] = useState(() => {
    try {
      const stored = localStorage.getItem(`matruong_owner_horses_${ownerKey}`);
      if (stored) {
        // Tự động làm sạch URL ảnh cũ bị lỗi (404)
        const sanitized = stored.replace(/photo-1598974357801-cbca10065444/g, 'photo-1534447677768-be436bb09401');
        const parsed = JSON.parse(sanitized);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fixed = parsed.map(item => {
            if (item && item.name === 'Bạch Long' && (!item.avatar || item.avatar.includes('photo-1598974357801-cbca10065444'))) {
              return { ...item, avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80' };
            }
            return item;
          });
          localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(fixed));
          return fixed;
        }
      }
      return isDemoVip ? DEMO_HORSES_VIP : [];
    } catch {
      return isDemoVip ? DEMO_HORSES_VIP : [];
    }
  });

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

  // Đồng bộ lưu localStorage khi state thay đổi
  useEffect(() => {
    localStorage.setItem(`matruong_owner_horses_${ownerKey}`, JSON.stringify(myHorses));
  }, [myHorses, ownerKey]);

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
                item.trainerFeedback !== matched.trainerFeedback ||
                item.reviewedBy !== matched.reviewedBy ||
                item.reviewedAt !== matched.reviewedAt
              ) {
                hasChanges = true;
                return {
                  ...item,
                  nominationStatus: matched.nominationStatus,
                  trainerFeedback: matched.trainerFeedback,
                  reviewedBy: matched.reviewedBy,
                  reviewedAt: matched.reviewedAt
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
  const [showAddHorseModal, setShowAddHorseModal] = useState(false);
  const [showRaceRegisterModal, setShowRaceRegisterModal] = useState(false);
  const [selectedTournamentToRegister, setSelectedTournamentToRegister] = useState(null);

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
    trainer: 'Trần Văn Hùng (HLV Trưởng)',
    stable: 'Ô A1 (Khu Huấn luyện)',
    sire: '',
    dam: '',
    avatar: 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=600&q=80'
  }));

  // Form State: Đăng ký giải đấu
  const [raceRegForm, setRaceRegForm] = useState({
    tournamentId: '',
    horseId: '',
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
        horseId: myHorses.length > 0 ? myHorses[0].id : ''
      }));
    } else {
      setSelectedTournamentToRegister(OPEN_TOURNAMENTS[0]);
      setRaceRegForm(prev => ({
        ...prev,
        tournamentId: OPEN_TOURNAMENTS[0].id,
        horseId: myHorses.length > 0 ? myHorses[0].id : ''
      }));
    }
    setShowRaceRegisterModal(true);
  };

  const PRESET_HORSE_AVATARS = [
    { label: 'Hắc mã', url: 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=600&q=80' },
    { label: 'Xích thố', url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80' },
    { label: 'Bạch mã', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80' },
    { label: 'Kim quy', url: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=600&q=80' }
  ];

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
      groom: 'Lê Hoàng Nam (Groom Phụ trách)',
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

    // Gọi API Đăng ký ngựa của Chủ sở hữu
    registerOwnerHorseApi(ownerKey, newHorse).catch(() => {});

    setMyHorses(prev => [newHorse, ...prev]);

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
    microchip: '',
    ownershipShare: 100,
    trainer: 'Trần Văn Hùng (HLV Trưởng)',
    stable: 'Ô A1 (Khu Huấn luyện)',
    sire: '',
    dam: '',
    avatar: ''
  });

  const handleOpenEditHorseModal = (horse) => {
    setEditingHorse(horse);
    setEditHorseForm({
      id: horse.id,
      name: horse.name || '',
      englishName: horse.englishName || '',
      breed: horse.breed || 'Thoroughbred',
      gender: horse.gender || 'Ngựa đực (Stallion)',
      microchip: horse.microchip || '',
      ownershipShare: horse.ownershipShare || 100,
      trainer: horse.trainer || 'Trần Văn Hùng (HLV Trưởng)',
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
      microchip: editHorseForm.microchip.trim() || editingHorse.microchip,
      ownershipShare: Number(editHorseForm.ownershipShare) || 100,
      ownershipType: Number(editHorseForm.ownershipShare) === 100 ? 'Độc quyền (100%)' : `Đồng sở hữu (${editHorseForm.ownershipShare}%)`,
      trainer: editHorseForm.trainer,
      stable: editHorseForm.stable,
      avatar: editHorseForm.avatar || editingHorse.avatar,
      pedigree: {
        ...editingHorse.pedigree,
        sire: editHorseForm.sire.trim() || editingHorse.pedigree?.sire || 'Đang cập nhật',
        dam: editHorseForm.dam.trim() || editingHorse.pedigree?.dam || 'Đang cập nhật'
      }
    };

    updateOwnerHorseApi(ownerKey, updatedHorse).catch(() => {});
    setMyHorses(prev => prev.map(h => h.id === editingHorse.id ? updatedHorse : h));
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

    deleteOwnerHorseApi(ownerKey, deletingHorse.id).catch(() => {});
    setMyHorses(prev => prev.filter(h => h.id !== deletingHorse.id));
    setShowDeleteHorseModal(false);
    showToast(`Đã hoàn tất xóa chiến mã "${deletingHorse.name}" khỏi chuồng nuôi dưỡng!`, 'XÓA THÀNH CÔNG', 'info');
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

    const selectedHorse = myHorses.find(h => String(h.id) === String(raceRegForm.horseId)) || myHorses[0];
    const tournament = OPEN_TOURNAMENTS.find(t => t.id === raceRegForm.tournamentId) || selectedTournamentToRegister || OPEN_TOURNAMENTS[0];

    // Kiểm tra đã đăng ký chưa
    const alreadyRegistered = raceNominations.some(r => r.raceName === tournament.name && r.horseName === selectedHorse.name);
    if (alreadyRegistered) {
      showToast(`Chiến mã "${selectedHorse.name}" đã được đăng ký tham gia giải này rồi!`, 'ĐÃ TỒN TẠI', 'warning');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newNomination = {
      id: `RN-REG-${Date.now().toString().slice(-4)}`,
      raceName: tournament.name,
      track: tournament.track,
      horseName: selectedHorse.name,
      ownerName: currentUser?.full_name || 'Chủ sở hữu',
      ownerKey: ownerKey,
      distance: `${tournament.distance} (${tournament.surface})`,
      date: tournament.date,
      estimatedPurse: tournament.totalPurse,
      nominationStatus: 'PENDING_TRAINER', // Chờ HLV trưởng phê duyệt
      jockey: raceRegForm.jockey || 'Chưa chỉ định',
      notes: `Chủ sở hữu đăng ký. Kỵ mã: ${raceRegForm.jockey || 'Chưa chỉ định'}. ${raceRegForm.notes || ''}`,
      registeredAt: timeStr,
      trainerFeedback: '',
      reviewedBy: null,
      reviewedAt: null
    };

    // Gọi API Ghi danh giải đấu của Chủ sở hữu
    registerRaceTournamentApi(ownerKey, newNomination).catch(() => {});

    setRaceNominations(prev => [newNomination, ...prev]);
    setShowRaceRegisterModal(false);
    showToast(`Đã gửi đơn ghi danh chiến mã "${selectedHorse.name}"! Đang chờ Huấn luyện viên trưởng phê duyệt.`, 'GHI DANH GIẢI ĐUA', 'info');
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
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '280px', minWidth: '280px' }}>
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
            title="Quyết Toán Tài Chính & Tiền Thưởng Giải Đua"
          >
            <span className="portal-nav-icon"><IconWallet size={18} /></span>
            <span className="portal-nav-label">Đối soát tài chính</span>
            <span className="portal-nav-badge">{statements.length}</span>
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

            {/* NÚT ĐỔI GÓI CHUYỂN RA BÊN NGOÀI USER BADGE */}
            <button
              type="button"
              onClick={() => setShowMembershipModal(true)}
              title="Quản lý & thay đổi gói quyền lợi thành viên"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: membershipTier === 'PREMIUM' ? 'rgba(212, 175, 55, 0.1)' : 'var(--brass)',
                color: membershipTier === 'PREMIUM' ? 'var(--brass)' : '#0A0D14',
                border: membershipTier === 'PREMIUM' ? '1px solid var(--brass)' : 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: membershipTier === 'PREMIUM' ? 'none' : '0 2px 8px rgba(212, 175, 55, 0.25)'
              }}
            >
              <IconCrown size={13} color={membershipTier === 'PREMIUM' ? 'var(--brass)' : '#0A0D14'} />
              <span>{membershipTier === 'PREMIUM' ? 'Đổi gói' : 'Nâng cấp VIP'}</span>
            </button>
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
                    onClick={() => setShowAddHorseModal(true)}
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
                    <span>+ Đăng ký chiến mã mới</span>
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
                  onClick={() => setShowAddHorseModal(true)}
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
                  <span>+ Đăng ký ngựa mới</span>
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
                    onClick={() => setShowAddHorseModal(true)}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
                  {myHorses.map((h) => (
                    <div key={h.id} className="facility-card" style={{ padding: '20px' }}>
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{h.name}</b>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', margin: '2px 0 0' }}>{h.englishName} · {h.breed}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: h.status === 'ELIGIBLE' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                                color: h.status === 'ELIGIBLE' ? 'var(--brass)' : 'var(--paper-dim)',
                                border: `1px solid ${h.status === 'ELIGIBLE' ? 'var(--brass)' : 'var(--line)'}`
                              }}>
                                {h.statusText}
                              </span>
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
                          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', fontFamily: 'monospace', marginTop: '4px' }}>{h.microchip}</div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                          <span style={{ color: 'var(--paper-dim)' }}>Tỷ lệ sở hữu: </span>
                          <b style={{ color: 'var(--paper)' }}>{h.ownershipShare}%</b>
                        </div>
                        <div>
                          <span style={{ color: 'var(--paper-dim)' }}>Vị trí: </span>
                          <b style={{ color: 'var(--paper)' }}>{h.stable}</b>
                        </div>
                        <div>
                          <span style={{ color: 'var(--paper-dim)' }}>HLV phụ trách: </span>
                          <span style={{ color: 'var(--paper)' }}>{h.trainer ? h.trainer.split('(')[0] : 'Chờ chỉ định'}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--paper-dim)' }}>Groom: </span>
                          <span style={{ color: 'var(--paper)' }}>{h.groom ? h.groom.split('(')[0] : 'Chờ chỉ định'}</span>
                        </div>
                      </div>

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

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1.2fr',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={() => setSelectedHorsePedigree(h)}
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
          {/* TAB 2: TIẾN ĐỘ HUẤN LUYỆN (TRAINING & TELEMETRY) */}
          {/* ========================================================================= */}
          {activeTab === 'training' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Chỉ Số Viễn Trắc & Đánh Giá Huấn Luyện (Training Telemetry)</h2>
                <p className="pane-desc">Thông số nhịp tim, tốc độ nước rút và nhận xét phong độ trực tiếp từ Huấn luyện viên trưởng.</p>
              </div>

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
                    onClick={() => setShowAddHorseModal(true)}
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
                  {trainingTelemetry.map((t) => (
                    <div key={t.id} className="facility-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{t.horseName}</b>
                          <span style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginLeft: '10px' }}>{t.stable} · Buổi tập: {t.sessionDate}</span>
                        </div>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--brass)',
                          border: '1px solid var(--brass)'
                        }}>
                          CỰ LY: {t.distanceMeters}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>TỐC ĐỘ BỨT PHÁ MAX</div>
                          <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.maxSpeed}</b>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>TỐC ĐỘ TRUNG BÌNH</div>
                          <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.avgSpeed}</b>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>NHỊP TIM ĐỈNH / HỒI PHỤC</div>
                          <b style={{ fontSize: '15px', color: 'var(--paper)' }}>{t.peakHeartRate}</b>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>ĐIỂM SẴN SÀNG THI ĐẤU</div>
                          <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{t.readinessScore}</b>
                        </div>
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.45, background: 'rgba(212, 175, 55, 0.05)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                        <b>Nhận xét của HLV Trưởng:</b> {t.trainerFeedback}
                      </div>
                    </div>
                  ))}
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
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

                        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div>Ngày đua: <b style={{ color: 'var(--paper)' }}>{tourn.date}</b></div>
                          <div>Tổng thưởng: <b style={{ color: 'var(--brass)' }}>{formatVND(tourn.totalPurse)}</b></div>
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
                      const isPendingTrainer = r.nominationStatus === 'PENDING_TRAINER' || r.nominationStatus === 'PENDING' || (!isApproved && !isWithdrawn && !isRejected);

                      return (
                        <div key={r.id} className="facility-card" style={{ padding: '22px', border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{r.raceName}</b>
                              <div style={{ fontSize: '12.5px', color: 'var(--brass)', fontWeight: 600, marginTop: '2px' }}>
                                Chiến mã: {r.horseName} · <span style={{ color: 'var(--paper-dim)' }}>{r.distance} ({r.track})</span>
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
                                ? '✓ HLV TRƯỞNG ĐÃ PHÊ DUYỆT' 
                                : isRejected
                                ? '✗ HLV YÊU CẦU RÈN THÊM'
                                : isWithdrawn 
                                ? 'ĐÃ RÚT LUI' 
                                : '⏳ CHỜ HLV TRƯỞNG PHÊ DUYỆT'}
                            </span>
                          </div>

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
                              <b style={{ color: '#10B981' }}>HLV Trưởng ({r.reviewedBy || 'Trần Văn Hùng'}):</b> {r.trainerFeedback || 'Chiến mã đạt 100% phong độ thể lực, chỉ số viễn trắc ổn định. Đã phê duyệt cấp phép xuất phát chính thức.'}
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
          {/* TAB 4: QUYẾT TOÁN & ĐỐI SOÁT TÀI CHÍNH (FINANCIAL STATEMENTS) */}
          {/* ========================================================================= */}
          {activeTab === 'finance' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Đối Soát Tài Chính & Tiền Thưởng (Purse & Statements)</h2>
                <p className="pane-desc">Minh bạch thu nhập tiền thưởng giải đua, chi phí nuôi dưỡng và quyết toán hàng tháng.</p>
              </div>

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
                <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                      ⚡ Kích Hoạt Premium 1-Chạm
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
                      Hạ cấp về gói 0 Đồng
                    </button>
                  )}
                </div>
              </div>

              {/* Bảng so sánh 2 gói: Horse 0 Đồng vs Horse Premium */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
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
                      {membershipTier === 'FREE' ? 'Gói Bạn Đang Dùng' : 'Hạ Cấp Về Gói 0 Đồng'}
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
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brass)', margin: '0 0 16px', fontFamily: 'var(--display)' }}>
                      9.900.000 VNĐ <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>/ THÁNG</span>
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
                      {membershipTier === 'PREMIUM' ? 'Đặc Quyền VIP Đang Hoạt Động ✓' : '⚡ Kích Hoạt Gói Premium Ngay'}
                    </button>
                  </div>
                </div>
              </div>
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
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--line-strong)',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <IconCamera size={16} color="var(--brass)" />
                  <span>Hình ảnh nhận diện chiến mã</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '74px', height: '74px', flexShrink: 0 }}>
                    <img
                      src={horseForm.avatar || 'https://images.unsplash.com/photo-1576773689115-5cd2b0223523?auto=format&fit=crop&w=600&q=80'}
                      alt="Ảnh chiến mã"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid var(--brass)',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <label
                        htmlFor="horse-avatar-file-input"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'var(--brass)',
                          color: '#0A0D14',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          borderRadius: '5px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(212, 175, 55, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>📁 Chọn ảnh từ thiết bị</span>
                      </label>
                      <input
                        id="horse-avatar-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleHorseImageUpload}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                        (JPG, PNG, WEBP tự động tối ưu)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Hoặc chọn mẫu:</span>
                      {PRESET_HORSE_AVATARS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHorseForm(prev => ({ ...prev, avatar: p.url }))}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: horseForm.avatar === p.url ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-card)',
                            border: `1px solid ${horseForm.avatar === p.url ? 'var(--brass)' : 'var(--line)'}`,
                            color: horseForm.avatar === p.url ? 'var(--brass)' : 'var(--paper-dim)',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    <option value="Thoroughbred">Thoroughbred (Thuần chủng Anh)</option>
                    <option value="Quarter Horse">Quarter Horse (Nước rút cự ly ngắn)</option>
                    <option value="Arabian">Arabian (Ả Rập sức bền)</option>
                    <option value="Standardbred">Standardbred (Đua xe kéo nước kiệu)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Giới tính & Tuổi
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
                    <option value="Ngựa đực (Stallion)">Ngựa đực (Stallion - 3 tuổi)</option>
                    <option value="Ngựa đực thiến (Gelding)">Ngựa đực thiến (Gelding - 4 tuổi)</option>
                    <option value="Ngựa cái (Mare)">Ngựa cái (Mare - 3 tuổi)</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Chọn HLV Trưởng gửi gắm
                  </label>
                  <select
                    value={horseForm.trainer}
                    onChange={(e) => setHorseForm({ ...horseForm, trainer: e.target.value })}
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
                    <option value="Trần Văn Hùng (HLV Trưởng)">Trần Văn Hùng (HLV Trưởng)</option>
                    <option value="Lê Trọng Nghĩa (HLV Cự Ly Dài)">Lê Trọng Nghĩa (HLV Cự Ly Dài)</option>
                    <option value="Phạm Quốc Anh (HLV Nước Rút)">Phạm Quốc Anh (HLV Nước Rút)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Vị trí ô chuồng đăng ký
                  </label>
                  <select
                    value={horseForm.stable}
                    onChange={(e) => setHorseForm({ ...horseForm, stable: e.target.value })}
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
                    <option value="Ô A1 (Khu Huấn luyện A)">Ô A1 (Khu Huấn luyện A)</option>
                    <option value="Ô A3 (Khu Huấn luyện A)">Ô A3 (Khu Huấn luyện A)</option>
                    <option value="Ô B1 (Khu Chuồng trại VIP)">Ô B1 (Khu Chuồng trại VIP)</option>
                    <option value="Ô B2 (Khu Chuồng trại VIP)">Ô B2 (Khu Chuồng trại VIP)</option>
                  </select>
                </div>
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
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--line-strong)',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <IconCamera size={16} color="var(--brass)" />
                  <span>Hình ảnh nhận diện chiến mã</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '74px', height: '74px', flexShrink: 0 }}>
                    <img
                      src={editHorseForm.avatar || editingHorse.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
                      alt="Ảnh chiến mã"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid var(--brass)',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <label
                        htmlFor="edit-horse-avatar-file-input"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'var(--brass)',
                          color: '#0A0D14',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          borderRadius: '5px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(212, 175, 55, 0.25)'
                        }}
                      >
                        <span>📁 Đổi ảnh từ máy</span>
                      </label>
                      <input
                        id="edit-horse-avatar-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleEditHorseImageUpload}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                        (Tự động nén & tối ưu)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Chọn mẫu:</span>
                      {PRESET_HORSE_AVATARS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditHorseForm(prev => ({ ...prev, avatar: p.url }))}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: editHorseForm.avatar === p.url ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-card)',
                            border: `1px solid ${editHorseForm.avatar === p.url ? 'var(--brass)' : 'var(--line)'}`,
                            color: editHorseForm.avatar === p.url ? 'var(--brass)' : 'var(--paper-dim)',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    <option value="Thoroughbred">Thoroughbred (Thuần chủng Anh)</option>
                    <option value="Quarter Horse">Quarter Horse (Nước rút cự ly ngắn)</option>
                    <option value="Arabian">Arabian (Ả Rập sức bền)</option>
                    <option value="Standardbred">Standardbred (Đua xe kéo nước kiệu)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Giới tính & Tuổi
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
                    <option value="Ngựa đực thiến (Gelding)">Ngựa đực thiến (Gelding)</option>
                    <option value="Ngựa cái (Mare)">Ngựa cái (Mare)</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                    Chọn HLV Trưởng gửi gắm
                  </label>
                  <select
                    value={editHorseForm.trainer}
                    onChange={(e) => setEditHorseForm({ ...editHorseForm, trainer: e.target.value })}
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
                    <option value="Trần Văn Hùng (HLV Trưởng)">Trần Văn Hùng (HLV Trưởng)</option>
                    <option value="Lê Trọng Nghĩa (HLV Cự Ly Dài)">Lê Trọng Nghĩa (HLV Cự Ly Dài)</option>
                    <option value="Phạm Quốc Anh (HLV Nước Rút)">Phạm Quốc Anh (HLV Nước Rút)</option>
                  </select>
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
                    <option value="Ô A1">Ô A1 (Khu Huấn luyện A)</option>
                    <option value="Ô A2">Ô A2 (Khu Huấn luyện A)</option>
                    <option value="Ô A3">Ô A3 (Khu Huấn luyện A)</option>
                    <option value="Ô A4">Ô A4 (Khu Huấn luyện A)</option>
                    <option value="Ô B1">Ô B1 (Khu Chuồng trại VIP)</option>
                    <option value="Ô B2">Ô B2 (Khu Chuồng trại VIP)</option>
                  </select>
                </div>
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
                    {myHorses.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.breed} - {h.statusText})
                      </option>
                    ))}
                  </select>
                </div>

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
                    Xác Nhận Ghi Danh Thi Đấu
                  </button>
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
                <span style={{ color: 'var(--paper)' }}>-{formatVND(selectedStatementModal.boardingCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Phí khám & tiêm phòng:</span>
                <span style={{ color: 'var(--paper)' }}>-{formatVND(selectedStatementModal.vetCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Phí hoa hồng HLV:</span>
                <span style={{ color: 'var(--paper)' }}>-{formatVND(selectedStatementModal.trainerCommission)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <b>Thực nhận ròng:</b>
                <b style={{ color: 'var(--brass)' }}>{formatVND(selectedStatementModal.netPayable)}</b>
              </div>
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
      {/* MODAL 4: XEM PHẢ HỆ CHIẾN MÃ (PEDIGREE MODAL) */}
      {/* ========================================================================= */}
      {selectedHorsePedigree && (
        <div className="modal-overlay" onClick={() => setSelectedHorsePedigree(null)}>
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
                Phả Hệ: {selectedHorsePedigree.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedHorsePedigree(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 14px' }}>
              {selectedHorsePedigree.breed} · {selectedHorsePedigree.ownershipType}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Dòng bố (Sire): <b style={{ color: 'var(--brass)' }}>{selectedHorsePedigree.pedigree?.sire}</b></div>
              <div>Dòng mẹ (Dam): <b style={{ color: 'var(--brass)' }}>{selectedHorsePedigree.pedigree?.dam}</b></div>
              <div>Năm sinh: <b style={{ color: 'var(--paper)' }}>{selectedHorsePedigree.pedigree?.foaled}</b></div>
              <div>Chip vi mạch: <span style={{ fontFamily: 'monospace', color: 'var(--paper)' }}>{selectedHorsePedigree.microchip}</span></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedHorsePedigree(null)}
                style={{
                  padding: '7px 16px',
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
                    {membershipTier === 'FREE' ? 'Đang Dùng Gói Này' : 'Chuyển Về 0 Đồng'}
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
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brass)', marginBottom: '14px', fontFamily: 'var(--display)' }}>
                    {billingCycle === 'year' ? '89.000.000 VNĐ' : '9.900.000 VNĐ'}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper-dim)' }}>{billingCycle === 'year' ? ' / NĂM' : ' / THÁNG'}</span>
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
                    {membershipTier === 'PREMIUM' ? 'Đặc Quyền VIP Đang Kích Hoạt ✓' : '⚡ Kích Hoạt Gói Premium Ngay'}
                  </button>
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
    </div>
  );
}
