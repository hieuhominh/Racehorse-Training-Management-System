import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  getTrainingProgramsApi, 
  saveTrainingProgramApi,
  deleteTrainingProgramApi,
  getTelemetrySessionsApi,
  recordTelemetryApi,
  getHorsesApi,
  getSystemTournamentNominationsApi,
  trainerReviewNominationApi,
  trainerAssignHorseNominationApi
} from '../services/api';
import { getServiceAssignments, confirmServiceAssignment, lookupFullHorseInfo, FIXED_TRAINERS_LIST } from '../services/serviceAssignment';
import NotificationBell from '../components/NotificationBell';
import ConfirmedHorseProfileModal from '../components/ConfirmedHorseProfileModal';
import HorsePedigreeViewModal from '../components/HorsePedigreeViewModal';
import RacehorseFitnessDetailModal from '../components/RacehorseFitnessDetailModal';
import { getSystemNotifications, notifyServiceConfirmed } from '../services/notificationService';
import {
  getJointTrainingSessions,
  confirmJointTrainingSession,
  rejectJointTrainingSession,
  checkHorseVetLockStatus,
  checkAndAutoResetScheduleAt1800,
  manualResetSchedule1800,
  getAvailableSubstituteTrainers,
  delegateJointTrainingSession,
  confirmSubstituteJointSession,
  rejectSubstituteJointSession
} from '../services/jointTrainingService';
import { 
  calculateHorseFitnessOnSession, 
  getHorseFitnessTelemetry, 
  getAllHorsesTelemetry,
  getHorseSessionCount, 
  deduplicateSessions,
  isHorseCalibrating, 
  REQUIRED_WORKOUTS_TO_EVALUATE 
} from '../services/fitnessAlgorithm';

// Danh sách chiến mã mặc định đầy đủ của HLV (Đầy đủ 5 chiến mã chuẩn, phong độ cao)
const EXCLUDED_MOCK_HORSES = [];
const isExcludedTrainerHorse = () => false;

export const DEFAULT_TRAINER_HORSES = [
  {
    id: 1,
    name: 'Hắc Phong',
    microchip: 'MC-VN-2022-001',
    stall: 'Ô A3',
    breed: 'Thoroughbred',
    age: '4 tuổi',
    owner: 'Hồ Minh Hiếu',
    ownerName: 'Hồ Minh Hiếu',
    status: 'WATCH',
    statusText: 'Cần theo dõi',
    isLockedByVet: false,
    avgHeartRate: 118,
    maxSpeed: 64.5,
    totalDistanceKm: 184,
    condition: '92%',
    trainingProgram: 'Tăng tốc nước rút 1.600m sân cát',
    desc: 'Chiến mã cự ly 1.600m, đang tập thích ứng nhịp chạy nước rút cao.'
  },
  {
    id: 2,
    name: 'Xích Thố',
    microchip: 'MC-VN-2021-014',
    stall: 'Ô A1',
    breed: 'Arabian',
    age: '5 tuổi',
    owner: 'Hồ Minh Hiếu',
    ownerName: 'Hồ Minh Hiếu',
    status: 'READY',
    statusText: 'Sẵn sàng thi đấu',
    isLockedByVet: false,
    avgHeartRate: 108,
    maxSpeed: 68.2,
    totalDistanceKm: 260,
    condition: '98%',
    trainingProgram: 'Xây dựng thể lực nền sức bền 2.400m',
    desc: 'Phong độ đỉnh cao, thể lực ổn định ở cự ly 2.400m sân cỏ.'
  },
  {
    id: 3,
    name: 'Phi Yến',
    microchip: 'MC-VN-2023-009',
    stall: 'Ô A5',
    breed: 'Thoroughbred',
    age: '3 tuổi',
    owner: 'Hồ Minh Hiếu',
    ownerName: 'Hồ Minh Hiếu',
    status: 'INJURED',
    statusText: 'Khóa tập bởi Thú y',
    isLockedByVet: true,
    vetNotice: 'Giãn gân chân trái - Cấm bài tập chạy nước rút và tải nặng!',
    avgHeartRate: 136,
    maxSpeed: 42.0,
    totalDistanceKm: 98,
    condition: '58%',
    trainingProgram: 'Phục hồi chức năng & thả lỏng cơ khớp',
    desc: 'Đang theo phác đồ vật lý trị liệu & đi bộ thả lỏng theo lệnh Bác sĩ Thú y.'
  },
  {
    id: 4,
    name: 'Lôi Chấn',
    microchip: 'MC-VN-2022-088',
    stall: 'Ô B2',
    breed: 'Quarter Horse',
    age: '4 tuổi',
    owner: 'Hồ Minh Hiếu',
    ownerName: 'Hồ Minh Hiếu',
    status: 'WATCH',
    statusText: 'Cách ly theo dõi',
    isLockedByVet: false,
    avgHeartRate: 122,
    maxSpeed: 59.8,
    totalDistanceKm: 142,
    condition: '84%',
    trainingProgram: 'Kỹ thuật mở máy xuất phát & chuyển làn',
    desc: 'Chiến mã cơ bắp, đang rèn kỹ thuật xuất phát máy và chuyển làn an toàn.'
  },
  {
    id: 5,
    name: 'Bạch Long',
    microchip: 'MC-VN-2024-003',
    stall: 'Ô A2',
    breed: 'Thoroughbred',
    age: '2 tuổi',
    owner: 'Hồ Minh Hiếu',
    ownerName: 'Hồ Minh Hiếu',
    status: 'READY',
    statusText: 'Đang phát triển tốt',
    isLockedByVet: false,
    avgHeartRate: 112,
    maxSpeed: 62.0,
    totalDistanceKm: 115,
    condition: '90%',
    trainingProgram: 'Làm quen nhịp chạy cự ly ngắn 1.000m',
    desc: 'Chiến mã trẻ tiếp thu nhanh, thể lực phát triển vượt kỳ vọng.'
  }
];

export const MOCK_HORSE_NAMES = ['hắc phong', 'xích thố', 'phi yến', 'lôi chấn', 'bạch long'];
export const isMockHorseName = (name) => {
  if (!name) return false;
  const n = String(name).trim().toLowerCase();
  return MOCK_HORSE_NAMES.some(m => n.includes(m));
};

export const DEFAULT_TRAINING_PROGRAMS = [];

export const DEFAULT_TRAINING_SESSIONS = [
  // XÍCH THỐ (3 bài tập đã hoàn thành -> Đủ dữ liệu đánh giá)
  {
    id: 101,
    time: '10/10/2026 06:30',
    horseName: 'Xích Thố',
    programTitle: 'Xây dựng thể lực nền sức bền 2.400m',
    distanceRun: 2400,
    avgSpeed: 64.2,
    maxHeartRate: 198,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 9.5,
    feedback: 'Sải chân cực kỳ đều đặn, nhịp thở ổn định khi qua khúc cua số 3, hoàn thành xuất sắc bài tập.'
  },
  {
    id: 102,
    time: '08/10/2026 07:00',
    horseName: 'Xích Thố',
    programTitle: 'Bứt phá nước rút 1.600m sân cỏ',
    distanceRun: 1600,
    avgSpeed: 66.5,
    maxHeartRate: 204,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 9.2,
    feedback: 'Khả năng bung sức đoạn 400m cuối đạt đỉnh phong độ.'
  },
  {
    id: 103,
    time: '06/10/2026 06:15',
    horseName: 'Xích Thố',
    programTitle: 'Phi nước kiệu dẻo dai 3.200m',
    distanceRun: 3200,
    avgSpeed: 52.0,
    maxHeartRate: 185,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 9.0,
    feedback: 'Giữ nhịp tim vùng hiếu khí hoàn hảo.'
  },

  // HẮC PHONG (3 bài tập -> Đủ dữ liệu)
  {
    id: 104,
    time: '09/10/2026 17:00',
    horseName: 'Hắc Phong',
    programTitle: 'Tăng tốc nước rút 1.600m sân cát',
    distanceRun: 1600,
    avgSpeed: 62.8,
    maxHeartRate: 216,
    isOverLimit: true,
    status: 'INCOMPLETE',
    score: 6.5,
    feedback: 'Tăng tốc tốt ở 400m cuối nhưng nhịp tim lên 216 bpm vượt ngưỡng. Đã cho dừng sớm để bảo đảm an toàn cơ bắp.'
  },
  {
    id: 105,
    time: '07/10/2026 06:45',
    horseName: 'Hắc Phong',
    programTitle: 'Rèn sức bền kỵ khí 2.000m',
    distanceRun: 2000,
    avgSpeed: 61.5,
    maxHeartRate: 202,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.5,
    feedback: 'Tương tác tốt với nài ngựa, thích nghi đường cát ẩm.'
  },
  {
    id: 106,
    time: '05/10/2026 07:30',
    horseName: 'Hắc Phong',
    programTitle: 'Tập xuất phát máy & tăng tốc 1.200m',
    distanceRun: 1200,
    avgSpeed: 63.8,
    maxHeartRate: 199,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 9.0,
    feedback: 'Bật cửa máy nhanh nhất đội.'
  },

  // BẠCH LONG (3 bài tập -> Đủ dữ liệu)
  {
    id: 107,
    time: '09/10/2026 07:15',
    horseName: 'Bạch Long',
    programTitle: 'Làm quen nhịp chạy cự ly ngắn',
    distanceRun: 1000,
    avgSpeed: 58.0,
    maxHeartRate: 192,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.8,
    feedback: 'Chiến mã trẻ tiếp thu bài rất nhanh, giữ thẳng lái tốt khi gặp áp lực bên cánh phải.'
  },
  {
    id: 108,
    time: '07/10/2026 08:00',
    horseName: 'Bạch Long',
    programTitle: 'Phi nước kiệu nhịp đều 2.400m',
    distanceRun: 2400,
    avgSpeed: 50.5,
    maxHeartRate: 182,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.6,
    feedback: 'Nhịp thở thông thoáng, bước chân dứt khoát.'
  },
  {
    id: 109,
    time: '05/10/2026 06:30',
    horseName: 'Bạch Long',
    programTitle: 'Bứt tốc nước rút 1.400m',
    distanceRun: 1400,
    avgSpeed: 62.0,
    maxHeartRate: 196,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.9,
    feedback: 'Đáp ứng tốt bài tăng tải cự ly trung bình.'
  },

  // LÔI CHẤN (3 bài tập -> Đủ dữ liệu)
  {
    id: 110,
    time: '09/10/2026 16:30',
    horseName: 'Lôi Chấn',
    programTitle: 'Tăng cường sức mạnh cơ hông 1.800m',
    distanceRun: 1800,
    avgSpeed: 60.0,
    maxHeartRate: 195,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.5,
    feedback: 'Cơ bắp phát triển săn chắc, giữ thăng bằng tốt.'
  },
  {
    id: 111,
    time: '07/10/2026 16:00',
    horseName: 'Lôi Chấn',
    programTitle: 'Tập chạy dốc & đường cát lún 2.000m',
    distanceRun: 2000,
    avgSpeed: 56.5,
    maxHeartRate: 199,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.4,
    feedback: 'Độ chịu lực của khớp gối và móng tốt.'
  },
  {
    id: 112,
    time: '05/10/2026 15:30',
    horseName: 'Lôi Chấn',
    programTitle: 'Chạy biến tốc 1.600m',
    distanceRun: 1600,
    avgSpeed: 61.2,
    maxHeartRate: 194,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 8.7,
    feedback: 'Hoàn thành bài tập đúng thời gian chỉ định.'
  },

  // PHI YẾN (3 bài tập -> Đủ dữ liệu, chấn thương đang theo dõi)
  {
    id: 113,
    time: '08/10/2026 08:00',
    horseName: 'Phi Yến',
    programTitle: 'Phục hồi chức năng & thả lỏng cơ khớp',
    distanceRun: 800,
    avgSpeed: 38.5,
    maxHeartRate: 165,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 7.0,
    feedback: 'Bài đi bộ thả lỏng theo đúng phác đồ bác sĩ thú y. Khớp gối trái đã bớt sưng đỏ.'
  },
  {
    id: 114,
    time: '06/10/2026 08:30',
    horseName: 'Phi Yến',
    programTitle: 'Thủy trị liệu & đi bộ máy',
    distanceRun: 600,
    avgSpeed: 25.0,
    maxHeartRate: 140,
    isOverLimit: false,
    status: 'COMPLETED',
    score: 7.5,
    feedback: 'Đáp ứng tốt với liệu trình giảm tải.'
  },
  {
    id: 115,
    time: '04/10/2026 09:00',
    horseName: 'Phi Yến',
    programTitle: 'Chạy nhẹ trên thảm cỏ nhân tạo',
    distanceRun: 1000,
    avgSpeed: 42.0,
    maxHeartRate: 172,
    isOverLimit: false,
    status: 'INCOMPLETE',
    score: 6.0,
    feedback: 'Có dấu hiệu nhói chân ở mét thứ 700, đã yêu cầu dừng bài tập lập tức.'
  }
];

// Loại bỏ trùng lặp giáo án huấn luyện (Deduplicate)
export const deduplicatePrograms = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(p => {
    if (!p) return false;
    const cleanTitle = (p.title || '').trim().toLowerCase();
    const cleanHorse = (p.horseName || p.horse || '').trim().toLowerCase();
    const cleanPhase = (p.phase || '').trim().toLowerCase();
    const dist = p.targetDistance || '';
    const surface = (p.surface || '').trim().toLowerCase();
    const semanticKey = `${cleanTitle}_${cleanHorse}_${cleanPhase}_${dist}_${surface}`;
    if (seen.has(semanticKey)) return false;
    seen.add(semanticKey);
    return true;
  });
};

// Tự động xóa các giáo án đã rèn xong sau mốc 00:00 ngày hôm sau
export const cleanExpiredProgramsAfterMidnight = (programList) => {
  if (!Array.isArray(programList)) return [];
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return programList.filter(prog => {
    // Nếu giáo án vẫn đang ACTIVE thì giữ nguyên
    if (!prog || prog.status === 'ACTIVE' || !prog.status) return true;

    // Nếu giáo án đã hoàn thành hoặc không hoàn thành:
    // Kiểm tra ngày hoàn thành
    const cDate = prog.completedDate;
    if (!cDate) return true;

    // Nếu ngày hoàn thành nhỏ hơn ngày hôm nay (đã qua 00:00 ngày hôm sau) -> XÓA khỏi giáo án
    if (cDate < todayStr) {
      return false;
    }
    return true;
  });
};

// Kiểm tra xem chiến mã có thuộc phụ trách chính của HLV hiện tại không
const isHorseOfCurrentTrainer = (item, uName, fName, assignmentsList) => {
  if (!uName) return false;
  const cleanU = (uName || '').trim().toLowerCase();
  const cleanF = (fName || '').trim().toLowerCase();

  const horseKey = (item.name || item.horseName || '').trim().toLowerCase();
  const chipKey = (item.microchip || item.chipId || '').trim().toLowerCase();

  // 1. Tra cứu trước trong bảng phân công chính thức serviceAssignments
  const matchedAsgn = (assignmentsList || []).find(a =>
    (chipKey && a.microchip && a.microchip.trim().toLowerCase() === chipKey) ||
    (horseKey && a.horseName && a.horseName.trim().toLowerCase() === horseKey)
  );

  if (matchedAsgn) {
    const asgnUser = (matchedAsgn.trainerUsername || '').trim().toLowerCase();
    const asgnName = (matchedAsgn.trainerName || '').trim().toLowerCase();
    if (asgnUser) return asgnUser === cleanU;
    if (asgnName) return asgnName === cleanF;
    return false;
  }

  // 2. Tra cứu trong kho của Chủ sở hữu
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('matruong_owner_horses_')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const h = list.find(x =>
              (chipKey && x.microchip && x.microchip.trim().toLowerCase() === chipKey) ||
              (horseKey && x.name && x.name.trim().toLowerCase() === horseKey)
            );
            if (h) {
              const trU = (h.trainerUsername || '').trim().toLowerCase();
              const trN = (h.trainer || h.trainerName || '').trim().toLowerCase();
              if (trU) return trU === cleanU;
              if (trN) return trN === cleanF;
              return false;
            }
          }
        }
      }
    }
  } catch {}

  // 3. Kiểm tra trực tiếp trên đối tượng (nếu có gắn trainerUsername)
  const itemTrUser = (item.trainerUsername || '').trim().toLowerCase();
  const itemTrName = (item.trainerName || item.trainer || '').trim().toLowerCase();
  if (itemTrUser) return itemTrUser === cleanU;
  if (itemTrName) return itemTrName === cleanF;

  return false;
};

// Minimalist, high-end SVG icons (0 emojis, strict professional aesthetic)
const IconCalendar = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconHorse = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19l2-7 4-1 3-5h4l-2 5 4 3-1 4-3 1-2 5-3-1-1-4z" />
  </svg>
);

const IconOverview = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const IconClipboard = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconTimer = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconStar = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconGlobe = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconMenu = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconTrophy = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function TrainerPage() {
  const { currentUser, logout } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_trainer');
      if (['horses', 'vitals', 'programs', 'joint_training', 'review', 'approvals'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'horses';
  }); // 'horses' | 'vitals' | 'programs' | 'review' | 'approvals'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_trainer_view_mode');
      if (['cards', 'table'].includes(saved)) return saved;
    } catch {}
    return 'cards';
  }); // 'cards' | 'table'

  const [fitnessDetailModalHorse, setFitnessDetailModalHorse] = useState(null);

  // 5. Danh sách đề cử giải đấu từ Chủ sở hữu ngựa
  const [nominations, setNominations] = useState([]);
  const [approvalFilter, setApprovalFilter] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_trainer_approval_filter');
      if (['ALL', 'PENDING', 'APPROVED', 'REJECTED'].includes(saved)) return saved;
    } catch {}
    return 'ALL';
  }); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  useEffect(() => {
    try {
      localStorage.setItem('matruong_tab_trainer', activeTab);
      localStorage.setItem('matruong_trainer_view_mode', viewMode);
      localStorage.setItem('matruong_trainer_approval_filter', approvalFilter);
    } catch {}
  }, [activeTab, viewMode, approvalFilter]);
  const [approvalSearch, setApprovalSearch] = useState('');
  const [rejectModalData, setRejectModalData] = useState({ isOpen: false, item: null, reason: '' });
  const [jointFilter, setJointFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'
  const [jointSearch, setJointSearch] = useState('');

  // Tải danh sách đề cử giải đấu & đồng bộ tức thời
  useEffect(() => {
    const fetchNominations = () => {
      getSystemTournamentNominationsApi().then(data => {
        if (Array.isArray(data)) setNominations(data);
      });
    };
    fetchNominations();

    const handleUpdate = () => fetchNominations();
    window.addEventListener('matruong_nomination_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('matruong_nomination_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const pendingCount = nominations.filter(n => n.nominationStatus === 'PENDING_TRAINER' || n.nominationStatus === 'PENDING').length;


  // Xử lý HLV duyệt đề cử thi đấu
  const handleTrainerApprove = async (item) => {
    const trainerName = currentUser?.full_name || 'HLV Trưởng';
    const feedback = 'Chiến mã đạt 100% phong độ thể lực, chỉ số viễn trắc ổn định. Đã phê duyệt cấp phép xuất phát chính thức.';
    
    await trainerReviewNominationApi(item.id, {
      status: 'APPROVED',
      feedback,
      trainerName
    });

    setNominations(prev => prev.map(n => n.id === item.id ? {
      ...n,
      nominationStatus: 'APPROVED',
      trainerFeedback: feedback,
      reviewedBy: trainerName,
      reviewedAt: 'Hôm nay'
    } : n));

    showToast(`Đã phê duyệt đề cử thi đấu cho "${item.horseName}" tham gia ${item.raceName}!`, 'HLV PHÊ DUYỆT', 'info');
  };

  // Mở modal từ chối / yêu cầu rèn thêm
  const handleOpenRejectModal = (item) => {
    setRejectModalData({
      isOpen: true,
      item,
      reason: 'Nhịp tim phục hồi sau bài tập cự ly dài chưa đạt chuẩn an toàn (< 190 bpm). Yêu cầu rèn thêm thể lực sân cát 2 tuần.'
    });
  };

  // Xác nhận từ chối / yêu cầu rèn thêm
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalData.item) return;

    const trainerName = currentUser?.full_name || 'HLV Trưởng';
    const reason = rejectModalData.reason.trim() || 'Yêu cầu hoàn thiện bài tập thể lực trước khi tham gia giải.';

    await trainerReviewNominationApi(rejectModalData.item.id, {
      status: 'REJECTED',
      feedback: reason,
      trainerName
    });

    setNominations(prev => prev.map(n => n.id === rejectModalData.item.id ? {
      ...n,
      nominationStatus: 'REJECTED',
      trainerFeedback: reason,
      reviewedBy: trainerName,
      reviewedAt: 'Hôm nay'
    } : n));

    showToast(`Đã gửi yêu cầu rèn luyện thêm cho chủ ngựa của "${rejectModalData.item.horseName}".`, 'YÊU CẦU RÈN THÊM', 'warning');
    setRejectModalData({ isOpen: false, item: null, reason: '' });
  };

  // State: Modal HLV Chỉ Định Ngựa Cho Giải Đấu (Khi chủ ngựa nhờ chọn)
  const [assignHorseModalData, setAssignHorseModalData] = useState(null);

  const handleOpenAssignHorseModal = (nom) => {
    let ownerHorses = [];
    try {
      if (nom.ownerKey) {
        const stored = localStorage.getItem(`matruong_owner_horses_${nom.ownerKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            ownerHorses = parsed;
          }
        }
      }
    } catch {}

    if (ownerHorses.length === 0) {
      ownerHorses = trainerHorses.map(h => ({
        id: h.id,
        name: h.name,
        breed: h.breed,
        stable: h.stall || 'Ô A2',
        maxSpeed: `${h.maxSpeed || 68} km/h`,
        avgHeartRate: `${h.avgHeartRate || 108} bpm`,
        condition: h.condition || '96%',
        isLockedByVet: h.isLockedByVet || false,
        statusText: h.isLockedByVet ? 'Đang khóa y tế' : 'Đủ chuẩn thi đấu',
        avatar: h.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
      }));
    }

    const firstReady = ownerHorses.find(h => !h.isLockedByVet && h.status !== 'RESTRICTED_CARE') || ownerHorses[0];

    const defaultFeedback = firstReady
      ? `HLV Trưởng đã thẩm định toàn diện: Chiến mã "${firstReady.name}" có chỉ số viễn trắc xuất sắc, phong độ 100%, sở trường tối ưu cự ly ${nom.distance || '2.400m'} tại ${nom.track || 'trường đua'}. Chỉ định xuất chiến chính thức!`
      : `HLV Trưởng thẩm định và chỉ định chiến mã tham gia giải đấu.`;

    setAssignHorseModalData({
      nom,
      availableHorses: ownerHorses,
      selectedHorseId: firstReady ? firstReady.id : (ownerHorses[0]?.id || ''),
      selectedHorseName: firstReady ? firstReady.name : (ownerHorses[0]?.name || ''),
      feedback: defaultFeedback,
      jockey: nom.jockey || 'Kỵ mã Nguyễn Văn Tài (Chỉ định số 1)'
    });
  };

  const handleConfirmAssignHorse = async (e) => {
    if (e) e.preventDefault();
    if (!assignHorseModalData || !assignHorseModalData.nom) return;

    const { nom, availableHorses, selectedHorseId, feedback, jockey } = assignHorseModalData;
    const selectedHorse = availableHorses.find(h => String(h.id) === String(selectedHorseId)) || availableHorses[0];
    if (!selectedHorse) {
      showToast('Vui lòng chọn một chiến mã!', 'CHƯA CHỌN NGỰA', 'warning');
      return;
    }

    const trainerName = currentUser?.full_name || 'HLV Trưởng Trần Văn Hùng';
    const horseName = selectedHorse.name;
    const horseStall = selectedHorse.stable || selectedHorse.stall || 'Ô A2';

    await trainerAssignHorseNominationApi(nom.id, {
      horseName,
      horseId: selectedHorse.id,
      horseStall,
      trainerFeedback: feedback,
      trainerName,
      jockey
    });

    const timeStr = 'Hôm nay';

    setNominations(prev => prev.map(n => n.id === nom.id ? {
      ...n,
      horseName,
      assignedHorseName: horseName,
      assignedHorseId: selectedHorse.id,
      assignedHorseStall: horseStall,
      trainerAssigned: true,
      delegatedToTrainer: true,
      nominationStatus: 'APPROVED',
      trainerFeedback: feedback,
      reviewedBy: trainerName,
      reviewedAt: timeStr,
      jockey
    } : n));

    showToast(`Đã chỉ định chiến mã "${horseName}" cho giải đấu thành công! Phía chủ sở hữu đã có thể thấy kết quả ngay.`, 'HLV CHỈ ĐỊNH THÀNH CÔNG', 'success');
    setAssignHorseModalData(null);
  };

  // State: Quản lý phân công phục vụ từ Chủ sở hữu (3 HLV cố định)
  const [serviceAssignments, setServiceAssignments] = useState(() => getServiceAssignments());

  useEffect(() => {
    const handleUpdate = () => setServiceAssignments(getServiceAssignments());
    window.addEventListener('matruong_service_assignment_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('matruong_service_assignment_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const [confirmedHorseModal, setConfirmedHorseModal] = useState(null);
  const [selectedPedigreeHorse, setSelectedPedigreeHorse] = useState(null);

  // Lắng nghe thông báo khi chiến mã bị xóa từ phía Chủ sở hữu
  useEffect(() => {
    const handleNotificationUpdate = () => {
      const list = getSystemNotifications();
      const latest = list[0];
      if (latest && latest.type === 'HORSE_DELETED') {
        const deletedName = (latest.horseName || '').toLowerCase();
        const deletedChip = (latest.microchip || '').toLowerCase();
        setTrainerHorses(prev => prev.filter(h => 
          (h.name && h.name.toLowerCase() !== deletedName) &&
          (!deletedChip || !h.microchip || h.microchip.toLowerCase() !== deletedChip)
        ));
      }
    };
    window.addEventListener('matruong_notifications_updated', handleNotificationUpdate);
    window.addEventListener('storage', handleNotificationUpdate);
    return () => {
      window.removeEventListener('matruong_notifications_updated', handleNotificationUpdate);
      window.removeEventListener('storage', handleNotificationUpdate);
    };
  }, []);

  const handleConfirmTrainerService = (asgn) => {
    const trainerUser = asgn.trainerUsername || currentUser?.username || 'trainer_truong';
    const updated = confirmServiceAssignment(asgn.horseName || asgn.microchip, 'TRAINER', trainerUser);
    setServiceAssignments(updated);

    const fullHorse = lookupFullHorseInfo(asgn.horseName || asgn.microchip);
    const stallCode = fullHorse?.stable ? (fullHorse.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || fullHorse.stable.split('(')[0].trim()) : 'Ô A1';

    // Bổ sung hoặc đưa ngay chiến mã lên đầu danh sách Thể lực tàu ngựa
    setTrainerHorses(prev => {
      const targetName = (fullHorse?.name || asgn.horseName).toLowerCase();
      const targetChip = (fullHorse?.microchip || asgn.microchip || '').toLowerCase();

      const existing = prev.find(h => 
        (h.name && h.name.toLowerCase() === targetName) ||
        (targetChip && h.microchip && h.microchip.toLowerCase() === targetChip)
      );

      const updatedOrNew = {
        ...(existing || {}),
        id: fullHorse?.id || existing?.id || Date.now(),
        name: fullHorse?.name || asgn.horseName,
        microchip: fullHorse?.microchip || asgn.microchip || 'MC-VN-2026-001',
        stall: stallCode,
        breed: fullHorse?.breed || existing?.breed || 'Thoroughbred',
        age: fullHorse?.age || existing?.age || '3 tuổi',
        owner: fullHorse?.ownerName || asgn.ownerName || 'Chủ sở hữu',
        ownerName: fullHorse?.ownerName || asgn.ownerName || 'Chủ sở hữu',
        status: existing?.status || 'CALIBRATING',
        statusText: existing?.statusText || 'Chờ hoàn thành 3 bài tập',
        isLockedByVet: existing?.isLockedByVet || false,
        avgHeartRate: existing?.avgHeartRate || '--',
        maxSpeed: existing?.maxSpeed || '--',
        totalDistanceKm: existing?.totalDistanceKm || 0,
        condition: existing?.condition || 'Chờ đánh giá (0/3)',
        trend: existing?.trend || 'CALIBRATING',
        trendPercent: existing?.trendPercent || 'Cần thêm 3 bài tập',
        shortTermLoad: existing?.shortTermLoad || '--',
        longTermLoad: existing?.longTermLoad || '--',
        loadRatio: existing?.loadRatio || '--',
        isCalibrating: existing?.isCalibrating !== undefined ? existing.isCalibrating : true,
        workoutCount: existing?.workoutCount || 0,
        trainingProgram: existing?.trainingProgram || 'Làm quen nhịp chạy & Thu thập viễn trắc',
        desc: existing?.desc || `Chiến mã của chủ sở hữu ${fullHorse?.ownerName || asgn.ownerName || 'Chủ sở hữu'}`,
        avatar: fullHorse?.avatar || existing?.avatar
      };

      const others = prev.filter(h =>
        (h.name && h.name.toLowerCase() !== targetName) &&
        (!targetChip || !h.microchip || h.microchip.toLowerCase() !== targetChip)
      );

      const next = [updatedOrNew, ...others];
      try {
        localStorage.setItem('matruong_trainer_horses_managed', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Phát thông báo tiếp nhận thành công lên toàn hệ thống (chuông thông báo)
    notifyServiceConfirmed(asgn, currentUser, 'TRAINER');

    // Mở hoặc cập nhật popup Profile sang trạng thái ĐÃ XÁC NHẬN để HLV có thể bấm "Theo dõi thể lực"
    if (fullHorse) {
      setConfirmedHorseModal({
        ...fullHorse,
        isPendingConfirmation: false,
        trainerStatus: 'CONFIRMED',
        assignmentData: { ...(asgn || {}), trainerStatus: 'CONFIRMED' }
      });
    }

    showToast(`Đã tiếp nhận huấn luyện "${asgn.horseName}"! Chiến mã đã hiện diện ngay tại Thể lực tàu ngựa.`, 'TIẾP NHẬN THÀNH CÔNG', 'success');
  };

  // 1. Danh sách chiến mã quản lý huấn luyện (Thể lực tàu ngựa)
  // State: Quản lý các buổi hẹn tập luyện chung với Chủ sở hữu
  const [jointSessions, setJointSessions] = useState(() => getJointTrainingSessions());
  const [selectedJointConfirmModal, setSelectedJointConfirmModal] = useState(null);
  const [jointFeedbackInput, setJointFeedbackInput] = useState('');
  const [selectedJointRejectModal, setSelectedJointRejectModal] = useState(null);
  const [jointRejectReasonInput, setJointRejectReasonInput] = useState('');

  // Đồng bộ thời gian thực lịch tập chung & trạng thái khóa y tế
  useEffect(() => {
    const handleSyncJoint = () => setJointSessions(getJointTrainingSessions());
    const handleVetLockSync = () => {
      try {
        const raw = localStorage.getItem('matruong_trainer_horses_managed');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setTrainerHorses(parsed);
        }
      } catch {}
    };
    window.addEventListener('matruong_joint_training_updated', handleSyncJoint);
    window.addEventListener('matruong_vet_lock_updated', handleVetLockSync);
    window.addEventListener('storage', handleSyncJoint);
    window.addEventListener('storage', handleVetLockSync);
    return () => {
      window.removeEventListener('matruong_joint_training_updated', handleSyncJoint);
      window.removeEventListener('matruong_vet_lock_updated', handleVetLockSync);
      window.removeEventListener('storage', handleSyncJoint);
      window.removeEventListener('storage', handleVetLockSync);
    };
  }, []);

  // Tự động kiểm tra cơ chế Reset lịch lúc 18h tối cho HLV
  useEffect(() => {
    checkAndAutoResetScheduleAt1800();
    const interval18h = setInterval(() => {
      checkAndAutoResetScheduleAt1800();
    }, 30000);
    return () => clearInterval(interval18h);
  }, []);

  const handleTrainerReset18h = () => {
    const res = manualResetSchedule1800(null, currentUser?.username);
    setJointSessions(getJointTrainingSessions());
    showToast(
      `Đã kích hoạt Reset lịch lúc 18:00! Toàn bộ lịch tập cũ đã được hoàn tất và mở bảng lịch trống để Chủ sở hữu đặt lịch mới.`,
      'RESET LỊCH TRỐNG 18:00',
      'success'
    );
  };

  const handleOpenJointConfirmModal = (session) => {
    setSelectedJointConfirmModal(session);
    setJointFeedbackInput(`HLV ${currentUser?.full_name || 'Trần Văn Hùng'} đã chuẩn bị đầy đủ thiết bị đo viễn trắc IoT và sân tập. Sẵn sàng đồng hành cùng Chủ sở hữu!`);
  };

  const handleConfirmJointSessionSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedJointConfirmModal) return;

    const res = confirmJointTrainingSession(selectedJointConfirmModal.id, jointFeedbackInput, currentUser);
    if (!res.success) {
      showToast(res.error, 'LỖI TIẾP NHẬN', 'error');
      return;
    }
    setJointSessions(getJointTrainingSessions());
    setSelectedJointConfirmModal(null);
    showToast(`Đã xác nhận tiếp nhận buổi tập luyện chung cho chiến mã "${selectedJointConfirmModal.horseName}"!`, 'XÁC NHẬN TẬP CHUNG THÀNH CÔNG', 'success');
  };

  const handleOpenJointRejectModal = (session) => {
    setSelectedJointRejectModal(session);
    setJointRejectReasonInput('HLV trùng lịch huấn luyện cự ly dài sáng nay, đề xuất chuyển sang buổi chiều 15:00 - 16:00.');
  };

  const handleConfirmJointRejectSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedJointRejectModal) return;

    const reason = jointRejectReasonInput.trim() || 'HLV bận lịch huấn luyện chuyên môn, đề xuất Chủ sở hữu chọn lại khung giờ khác.';
    rejectJointTrainingSession(selectedJointRejectModal.id, reason, currentUser);
    setJointSessions(getJointTrainingSessions());
    setSelectedJointRejectModal(null);
    showToast(`Đã gửi phản hồi từ chối / đổi giờ đến Chủ sở hữu ${selectedJointRejectModal.ownerName}!`, 'ĐÃ PHẢN HỒI LỊCH TẬP', 'info');
  };

  // Quản lý & Lọc lịch tập luyện chung cho Huấn luyện viên
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('ALL');

  // State: Chuyển giao buổi tập tạm thời cho HLV khác khi HLV chính bận
  const [delegateModalSession, setDelegateModalSession] = useState(null);
  const [delegateTargetTrainer, setDelegateTargetTrainer] = useState('');
  const [delegateAssignedWorkout, setDelegateAssignedWorkout] = useState('');
  const [delegateReason, setDelegateReason] = useState('');

  // State: HLV được nhờ xác nhận tiếp nhận buổi tập tạm thời
  const [substituteConfirmModalSession, setSubstituteConfirmModalSession] = useState(null);
  const [substituteResponseNote, setSubstituteResponseNote] = useState('');

  // Mặc định hiển thị TẤT CẢ các lịch đặt từ Chủ sở hữu để HLV không bao giờ bị bỏ sót
  const myJointSessions = jointSessions.filter(s => {
    if (selectedTrainerFilter === 'ALL') return true;
    return (
      s.trainerUsername === selectedTrainerFilter ||
      (s.trainerName || '').toLowerCase().includes(selectedTrainerFilter.toLowerCase()) ||
      s.delegatedToTrainerUsername === selectedTrainerFilter ||
      s.substituteTrainerUsername === selectedTrainerFilter
    );
  });

  const currentU = (currentUser?.username || '').trim().toLowerCase();
  const substituteRequestsCount = jointSessions.filter(s =>
    s.transferStatus === 'PENDING_TRANSFER' &&
    (s.delegatedToTrainerUsername || '').toLowerCase() === currentU
  ).length;

  const pendingJointCount = jointSessions.filter(s => s.status === 'PENDING').length;
  const confirmedJointCount = jointSessions.filter(s => s.status === 'CONFIRMED').length;
  const rejectedJointCount = jointSessions.filter(s => s.status === 'REJECTED').length;

  const handleOpenDelegateModal = (session) => {
    setDelegateModalSession(session);
    const availList = getAvailableSubstituteTrainers(session.sessionDate, session.sessionTime, currentU);
    const firstFree = availList.find(t => t.isAvailable) || availList[0];
    setDelegateTargetTrainer(firstFree?.username || 'trainer_truong');
    setDelegateAssignedWorkout(
      session.goal
        ? `Khởi động 10 phút -> Thực hiện bài tập chuyên môn: "${session.goal}". Duy trì tốc độ ổn định, theo dõi nhịp tim dưới 120 bpm -> Hạ nhiệt 15 phút.`
        : 'Khởi động đi bộ 10 phút -> Chạy cự ly 1.200m tốc độ 45km/h -> Hạ nhiệt thả lỏng 15 phút trên sân cỏ.'
    );
    setDelegateReason('HLV chính bận lịch đột xuất, nhờ đồng nghiệp hỗ trợ buổi tập này cho chủ ngựa.');
  };

  const handleSubmitDelegate = (e) => {
    e.preventDefault();
    if (!delegateModalSession) return;
    if (!delegateAssignedWorkout.trim()) {
      showToast('Vui lòng đưa ra bài tập chỉ định để Chủ sở hữu và HLV thay thế tập theo!', 'THIẾU BÀI TẬP', 'warning');
      return;
    }

    const res = delegateJointTrainingSession({
      sessionId: delegateModalSession.id,
      substituteTrainerUsername: delegateTargetTrainer,
      assignedWorkout: delegateAssignedWorkout,
      transferReason: delegateReason,
      currentTrainerUser: currentUser
    });

    if (!res.success) {
      showToast(res.error, 'LỖI CHUYỂN GIAO', 'error');
      return;
    }

    setJointSessions(getJointTrainingSessions());
    setDelegateModalSession(null);
    showToast(`Đã gửi yêu cầu nhờ HLV ${res.substituteTrainer?.name} hỗ trợ buổi tập thành công! Hệ thống đã gửi thông báo đến HLV được nhờ.`, 'ĐÃ GỬI YÊU CẦU', 'success');
  };

  const handleOpenSubstituteConfirmModal = (session) => {
    setSubstituteConfirmModalSession(session);
    setSubstituteResponseNote(`HLV ${currentUser?.full_name || 'Huấn luyện viên'} đã sẵn sàng tiếp nhận buổi tập và sẽ hướng dẫn chủ sở hữu theo đúng bài tập do HLV chính bàn giao.`);
  };

  const handleSubmitSubstituteConfirm = (e) => {
    e.preventDefault();
    if (!substituteConfirmModalSession) return;

    const res = confirmSubstituteJointSession(
      substituteConfirmModalSession.id,
      currentUser,
      substituteResponseNote
    );

    if (!res.success) {
      showToast(res.error, 'LỖI TIẾP NHẬN', 'error');
      return;
    }

    setJointSessions(getJointTrainingSessions());
    setSubstituteConfirmModalSession(null);
    showToast(`Đã xác nhận hỗ trợ buổi tập thành công! Chủ sở hữu và HLV chính đã nhận được thông báo để tập theo đúng bài tập chỉ định.`, 'TIẾP NHẬN THÀNH CÔNG', 'success');
  };

  const handleRejectSubstitute = (session) => {
    const reason = prompt('Nhập lý do bạn không thể hỗ trợ buổi tập này:', 'HLV bận lịch chuyên môn khác');
    if (reason === null) return;

    const res = rejectSubstituteJointSession(session.id, currentUser, reason);
    if (!res.success) {
      showToast(res.error, 'LỖI', 'error');
      return;
    }

    setJointSessions(getJointTrainingSessions());
    showToast('Đã gửi phản hồi từ chối hỗ trợ về cho HLV chính.', 'ĐÃ TỪ CHỐI', 'info');
  };

  const handleQuickConfirmJointSession = (session) => {
    const feedback = `HLV ${currentUser?.full_name || session.trainerName} đã xác nhận tiếp nhận buổi tập và CHÍNH THỨC GIỮ CHỖ. Chuẩn bị bãi tập và thiết bị đo IoT sẵn sàng.`;
    const res = confirmJointTrainingSession(session.id, feedback, currentUser);
    if (!res.success) {
      showToast(res.error, 'LỖI TIẾP NHẬN', 'error');
      return;
    }
    setJointSessions(getJointTrainingSessions());
    showToast(`Đã xác nhận & GIỮ CHỖ thành công cho chiến mã "${session.horseName}" của ${session.ownerName}!`, 'GIỮ CHỖ THÀNH CÔNG', 'success');
  };

  const [trainerHorses, setTrainerHorses] = useState(() => {
    try {
      let uName = '';
      const authRaw = sessionStorage.getItem('matruong_auth_user');
      if (authRaw) {
        const parsedAuth = JSON.parse(authRaw);
        uName = (parsedAuth.username || '').trim().toLowerCase();
      }

      const userKey = uName ? `matruong_trainer_horses_managed_${uName}` : 'matruong_trainer_horses_managed';
      const saved = localStorage.getItem(userKey) || localStorage.getItem('matruong_trainer_horses_managed');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_TRAINER_HORSES;
  });

  // Tự động đồng bộ các chiến mã đã xác nhận huấn luyện vào Thể lực tàu ngựa của HLV
  useEffect(() => {
    const uName = (currentUser?.username || '').trim().toLowerCase();
    const fName = (currentUser?.full_name || '').trim().toLowerCase();

    const isMyHorse = (a) => (
      !uName ||
      (a.trainerUsername && a.trainerUsername.trim().toLowerCase() === uName) ||
      (!a.trainerUsername && a.trainerName && a.trainerName.trim().toLowerCase() === fName)
    );
    const myConfirmedAssignments = (serviceAssignments || []).filter(a =>
      isMyHorse(a) && a.trainerStatus === 'CONFIRMED'
    );

    if (myConfirmedAssignments.length === 0) {
      // Khi chưa có chiến mã gán thêm, giữ nguyên đội hình 5 chiến mã mặc định đầy đủ
      setTrainerHorses(prev => (prev && prev.length > 0 ? prev : DEFAULT_TRAINER_HORSES));
      return;
    }

    const allTel = getAllHorsesTelemetry();
    setTrainerHorses(prev => {
      let next = (prev && prev.length > 0) ? [...prev] : [...DEFAULT_TRAINER_HORSES];
      let changed = false;

      myConfirmedAssignments.forEach(asgn => {
        const full = lookupFullHorseInfo(asgn.horseName || asgn.microchip);
        const stallCode = asgn.stable ? (asgn.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || asgn.stable.split('(')[0].trim()) : 'Ô A1';
        const targetName = (asgn.horseName || '').toLowerCase();
        const targetChip = (asgn.microchip || '').toLowerCase();
        const foundIndex = next.findIndex(h =>
          (h.name && h.name.toLowerCase() === targetName) ||
          (targetChip && h.microchip && h.microchip.toLowerCase() === targetChip)
        );

        const tel = allTel[asgn.microchip] || allTel[asgn.id] || allTel[asgn.horseName];
        if (foundIndex === -1) {
          changed = true;
          next.unshift({
            id: full?.id || asgn.id || Date.now(),
            name: asgn.horseName,
            microchip: asgn.microchip || 'MC-VN-2026-092',
            stall: stallCode,
            breed: full?.breed || 'Quarter Horse',
            age: full?.age || '3 tuổi',
            owner: asgn.ownerName || 'Hồ Minh Hiếu',
            ownerName: asgn.ownerName || 'Hồ Minh Hiếu',
            status: 'READY',
            statusText: 'Đã hoàn thành xuất sắc giáo án',
            isLockedByVet: false,
            avgHeartRate: 112,
            maxSpeed: 64.5,
            totalDistanceKm: 120,
            condition: tel?.condition ? (String(tel.condition).includes('%') ? tel.condition : `${tel.condition}%`) : '98%',
            trainingProgram: 'Nâng cao thể lực & Tốc độ bứt phá',
            desc: `Chiến mã của chủ sở hữu ${asgn.ownerName || 'Hồ Minh Hiếu'}`,
            avatar: full?.avatar,
            trainerUsername: uName,
            trainerName: fName
          });
        }
      });

      if (changed && uName) {
        try {
          localStorage.setItem(`matruong_trainer_horses_managed_${uName}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });  }, [serviceAssignments, currentUser]);

  useEffect(() => {
    const uName = (currentUser?.username || '').trim().toLowerCase();
    const fName = (currentUser?.full_name || '').trim().toLowerCase();
    if (!uName) return;

    // Dọn dẹp triệt để key dùng chung cũ và lọc key per-user
    try {
      localStorage.removeItem('matruong_trainer_horses_managed');
      const userKey = `matruong_trainer_horses_managed_${uName}`;
      const savedUserFleet = localStorage.getItem(userKey);
      if (savedUserFleet) {
        const parsed = JSON.parse(savedUserFleet);
        if (Array.isArray(parsed)) {
          const cleanUserFleet = parsed.filter(h =>
            !isExcludedTrainerHorse(h.name) &&
            !isExcludedTrainerHorse(h.horseName) &&
            !isExcludedTrainerHorse(h.microchip) &&
            h.owner !== 'Phạm Tiến Thành' &&
            h.ownerName !== 'Phạm Tiến Thành' &&
            isHorseOfCurrentTrainer(h, uName, fName, serviceAssignments)
          );
          localStorage.setItem(userKey, JSON.stringify(cleanUserFleet));
          setTrainerHorses(cleanUserFleet);
        }
      }

      const savedSess = localStorage.getItem('matruong_training_telemetry');
      if (savedSess) {
        const parsed = JSON.parse(savedSess);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(s => !isExcludedTrainerHorse(s.horseName));
          localStorage.setItem('matruong_training_telemetry', JSON.stringify(filtered));
          setSessions(filtered);
        }
      }
    } catch {}
  }, [currentUser]);

  // Tự động lưu trainerHorses vào localStorage theo từng HLV
  useEffect(() => {
    const uName = (currentUser?.username || '').trim().toLowerCase();
    if (!uName) return;
    try {
      const cleanToSave = trainerHorses.filter(h =>
        !isExcludedTrainerHorse(h.name) &&
        !isExcludedTrainerHorse(h.horseName) &&
        !isExcludedTrainerHorse(h.microchip)
      );
      localStorage.setItem(`matruong_trainer_horses_managed_${uName}`, JSON.stringify(cleanToSave));
    } catch {}
  }, [trainerHorses, currentUser]);

  // 2. Danh sách giáo án huấn luyện (Training Programs)
  const [programs, setPrograms] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_trainer_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Tự động kiểm tra và xóa các giáo án đã hoàn thành sau mốc 00:00 ngày hôm sau
  useEffect(() => {
    const checkMidnightCleanup = () => {
      setPrograms(prev => {
        const cleaned = cleanExpiredProgramsAfterMidnight(prev);
        if (cleaned.length !== prev.length) {
          try {
            localStorage.setItem('matruong_trainer_programs', JSON.stringify(cleaned));
          } catch {}
          return cleaned;
        }
        return prev;
      });
    };

    checkMidnightCleanup();
    const interval = setInterval(checkMidnightCleanup, 60000);
    return () => clearInterval(interval);
  }, []);

  // Tự động lưu programs vào localStorage khi có thay đổi (kể cả khi mảng rỗng)
  useEffect(() => {
    if (programs !== null && programs !== undefined) {
      try {
        localStorage.setItem('matruong_trainer_programs', JSON.stringify(programs));
      } catch {}
    }  }, [programs]);

  // Nạp giáo án & danh sách chiến mã từ API Backend khi khởi động
  useEffect(() => {
    let isMounted = true;
    getTrainingProgramsApi().then(res => {
      if (isMounted && res.isFromBackend && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((p, idx) => ({
          id: p.id || idx + 1,
          title: p.title,
          horseName: p.horse,
          phase: p.phase,
          targetDistance: p.targetDistance,
          surface: p.surface,
          startDate: '10/10/2026',
          endDate: '30/10/2026',
          status: p.status || 'ACTIVE'
        }));
        setPrograms(prev => {
          const existingIds = new Set(prev.map(p => String(p.id)));
          const existingKeys = new Set(prev.map(p => `${(p.horseName || '').toLowerCase()}_${(p.title || '').toLowerCase()}`));
          const toAdd = mapped.filter(p => !existingIds.has(String(p.id)) && !existingKeys.has(`${(p.horseName || '').toLowerCase()}_${(p.title || '').toLowerCase()}`));
          return [...prev, ...toAdd];
        });
      }
    }).catch(() => {});

    // Đồng bộ trạng thái khóa y tế chiến mã từ Backend
    getHorsesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setTrainerHorses(prev => {
          const apiMap = new Map(res.data.map(h => [h.name.toLowerCase(), h]));
          return prev.map(th => {
            const matched = apiMap.get(th.name.toLowerCase());
            if (matched) {
              const isLocked = Boolean(matched.locked);
              const rawStall = matched.stable ? (matched.stable.startsWith('Ô ') ? matched.stable : `Ô ${matched.stable}`) : th.stall;
              const cleanStall = (rawStall || 'Ô A1').split('•')[0].split('(')[0].trim();
              return {
                ...th,
                stall: cleanStall,
                breed: matched.breed || th.breed,
                isLockedByVet: isLocked,
                status: isLocked ? 'INJURED' : (matched.status === 'WATCH' ? 'WATCH' : 'READY'),
                statusText: isLocked ? 'Khóa tập bởi Thú y' : (matched.statusText || th.statusText),
                vetNotice: isLocked ? 'Lệnh phong tỏa y tế Thú y đang hiệu lực - Tạm đình chỉ bài tập nặng!' : null
              };
            }
            return th;
          });
        });
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // 3. Danh sách buổi tập & chỉ số Telemetry (Training Sessions)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_training_telemetry');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = deduplicateSessions(parsed);
          if (cleaned.length > 0) {
            localStorage.setItem('matruong_training_telemetry', JSON.stringify(cleaned));
            return cleaned;
          }
        }
      }
    } catch {}
    return DEFAULT_TRAINING_SESSIONS;
  });

  // Tự động kiểm tra và dọn dẹp các buổi tập trùng lặp trong localStorage khi mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('matruong_training_telemetry');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = deduplicateSessions(parsed);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('matruong_training_telemetry', JSON.stringify(cleaned));
            setSessions(cleaned);
          }
        }
      }
    } catch {}
  }, []);

  // Tự động lưu sessions vào localStorage khi có thay đổi
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      try {
        localStorage.setItem('matruong_training_telemetry', JSON.stringify(sessions));
      } catch {}
    }  }, [sessions]);

  // Đồng bộ telemetry từ Backend không ghi đè dữ liệu người dùng
  useEffect(() => {
    let isMounted = true;
    getTelemetrySessionsApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setSessions(prev => {
          const existingIds = new Set(prev.map(s => String(s.id)));
          const toAdd = res.data
            .filter(s => s && !existingIds.has(String(s.id)))
            .map((s, idx) => ({
              id: s.id || `be-${Date.now()}-${idx}`,
              time: s.time || s.sessionTime || new Date().toLocaleString('vi-VN'),
              horseName: s.horseName || s.horse || 'Chiến mã',
              programTitle: s.programTitle || s.status || 'Bài tập rèn luyện',
              distanceRun: s.distanceRun !== undefined ? s.distanceRun : (s.distance || 1200),
              avgSpeed: s.avgSpeed !== undefined ? s.avgSpeed : (s.speed || 55.0),
              maxHeartRate: s.maxHeartRate !== undefined ? s.maxHeartRate : (s.heartRate || 180),
              isOverLimit: s.isOverLimit !== undefined ? s.isOverLimit : Boolean(s.alert),
              status: s.status === 'Chạy nước rút' ? 'COMPLETED' : (s.status || 'COMPLETED'),
              score: s.score !== undefined ? s.score : 8.5,
              feedback: s.feedback || 'Hoàn thành bài tập.'
            }));
          if (toAdd.length === 0) return prev;
          const merged = [...prev, ...toAdd];
          try {
            localStorage.setItem('matruong_training_telemetry', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Bộ lọc theo chiến mã & trạng thái bài tập
  const [filterHorse, setFilterHorse] = useState(() => {
    try {
      return localStorage.getItem('matruong_trainer_filter_horse') || 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [filterStatus, setFilterStatus] = useState(() => {
    try {
      return localStorage.getItem('matruong_trainer_filter_status') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('matruong_trainer_filter_horse', filterHorse);
      localStorage.setItem('matruong_trainer_filter_status', filterStatus);
    } catch {}
  }, [filterHorse, filterStatus]);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Danh sách bài tập sau lọc
  const filteredSessions = sessions.filter(sess => {
    const matchHorse = filterHorse === 'ALL' || sess.horseName === filterHorse;
    const matchStatus = filterStatus === 'ALL' || (sess.status || 'COMPLETED') === filterStatus;
    return matchHorse && matchStatus;
  });

  // Modal lập giáo án mới
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false);
  const [newProgramData, setNewProgramData] = useState(() => ({
    title: '',
    horseName: '',
    phase: 'Nước rút (Sprint)',
    targetDistance: 1600,
    surface: 'SAND (Sân cát)',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetHeartRate: '< 205 bpm',
    jockeyNotes: ''
  }));

  // Đồng bộ horseName với chiến mã đầu tiên trong đội hình thực tế
  useEffect(() => {
    if (trainerHorses && trainerHorses.length > 0) {
      setNewProgramData(prev => {
        if (!prev.horseName || !trainerHorses.some(h => h.name === prev.horseName)) {
          return { ...prev, horseName: trainerHorses[0].name };
        }
        return prev;
      });
    }
  }, [trainerHorses]);

  const handleOpenAddProgramModal = () => {
    const defaultHorse = (trainerHorses && trainerHorses[0]?.name) || '';
    setNewProgramData({
      title: '',
      horseName: defaultHorse,
      phase: 'Nước rút (Sprint)',
      targetDistance: 1600,
      surface: 'SAND (Sân cát)',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      targetHeartRate: '< 205 bpm',
      jockeyNotes: ''
    });
    setShowAddProgramModal(true);
  };

  // Modal ghi nhận buổi tập mới
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    horseName: 'Hắc Phong',
    programTitle: 'Tăng tốc nước rút 1.600m sân cát',
    distanceRun: 1600,
    avgSpeed: 60.5,
    maxHeartRate: 200,
    status: 'COMPLETED',
    score: 8.5,
    feedback: ''
  });

  // Trạng thái chạy bài tập trực quan & 2 giai đoạn (Đang chạy bài -> Đánh giá & ghi chú)
  const [activeRunningSession, setActiveRunningSession] = useState(null);

  // Định dạng đồng hồ đếm thời gian
  const formatWorkoutTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Bộ đếm thời gian & mô phỏng viễn trắc khi ngựa đang trong thời gian chạy bài
  useEffect(() => {
    if (!activeRunningSession || activeRunningSession.phase !== 'RUNNING') return;
    const interval = setInterval(() => {
      setActiveRunningSession(prev => {
        if (!prev || prev.phase !== 'RUNNING') return prev;
        const newSecs = prev.elapsedSeconds + 1;
        const speedWave = Math.sin(newSecs * 0.4) * 2.8 + (Math.random() * 1.4 - 0.7);
        const liveSpeed = +(Math.max(48, Math.min(68, 59.5 + speedWave))).toFixed(1);
        const baseHr = 172 + Math.min(26, Math.floor(newSecs * 0.8));
        const liveHr = Math.min(215, Math.max(165, baseHr + Math.floor(Math.random() * 5 - 2)));
        const metersPerSec = (liveSpeed * 1000) / 3600;
        const liveDist = Math.min(prev.targetDistance, Math.round(prev.currentDistance + metersPerSec * 2.2));

        return {
          ...prev,
          elapsedSeconds: newSecs,
          currentSpeed: liveSpeed,
          currentHeartRate: liveHr,
          currentDistance: liveDist
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRunningSession?.phase]);

  // Bắt đầu chạy bài tập từ giáo án
  const handleStartWorkout = (prog) => {
    const targetDist = Number(prog.targetDistance) || 1600;
    const targetHorse = trainerHorses.find(h => (h.name || '').toLowerCase() === (prog.horseName || '').toLowerCase())
      || allHorses.find(h => (h.name || '').toLowerCase() === (prog.horseName || '').toLowerCase())
      || {
        name: prog.horseName,
        stall: 'Ô A1',
        microchip: 'MC-VN-2024-001',
        breed: 'Quarter Horse',
        avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'
      };

    setActiveRunningSession({
      phase: 'RUNNING', // Giai đoạn 1: Ngựa đang trong thời gian chạy bài
      program: prog,
      horse: targetHorse,
      startTime: Date.now(),
      elapsedSeconds: 0,
      currentSpeed: 58.6,
      currentHeartRate: 174,
      currentDistance: 0,
      targetDistance: targetDist,
      status: 'COMPLETED',
      finalDuration: '00:00',
      finalDistance: targetDist,
      avgSpeed: 59.8,
      maxHeartRate: 196,
      score: 9.0,
      evaluation: '',
      recoveryNotes: ''
    });
  };

  // Hoàn thành hoặc Không hoàn thành bài tập -> Chuyển sang phần đánh giá & ghi chú
  const handleFinishRunningSession = (isCompleted) => {
    setActiveRunningSession(prev => {
      if (!prev) return null;
      const mins = Math.floor(prev.elapsedSeconds / 60);
      const secs = prev.elapsedSeconds % 60;
      const durationStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const finalDist = isCompleted ? prev.targetDistance : Math.max(120, prev.currentDistance);
      const finalSpeed = prev.currentSpeed || 59.5;
      const finalHr = prev.currentHeartRate || 188;
      const defaultScore = isCompleted ? 9.0 : 5.5;
      const defaultEval = isCompleted
        ? `Chiến mã ${prev.horse.name} đã hoàn thành xuất sắc toàn bộ ${finalDist}m bài tập "${prev.program.title}". Sải chân mượt mà, bứt tốc mạnh mẽ ở giai đoạn nước rút, thể trạng duy trì phong độ tối ưu.`
        : `Chiến mã ${prev.horse.name} dừng bài tập ở cự ly ${finalDist}m / ${prev.targetDistance}m. Nhịp thở có dấu hiệu dốc và nhịp tim tăng nhanh, Huấn luyện viên chủ động cho dừng lại an toàn để tránh quá tải cơ gân.`;
      const defaultRecovery = isCompleted
        ? 'Dắt thả lỏng 15 phút, chườm lạnh 4 cổ chân 20 phút, bổ sung điện giải và khẩu phần dinh dưỡng giàu yến mạch phục hồi gân cơ.'
        : 'Đưa ngay về chuồng tĩnh dưỡng, theo dõi hạ nhịp tim sau 15-30 phút, kiểm tra nhiệt độ móng & gân khoeo, báo bác sĩ thú y nếu có biểu hiện cứng cơ.';

      return {
        ...prev,
        phase: 'EVALUATING', // Giai đoạn 2: Đánh giá và ghi chú
        status: isCompleted ? 'COMPLETED' : 'INCOMPLETE',
        finalDuration: durationStr,
        finalDistance: finalDist,
        avgSpeed: finalSpeed,
        maxHeartRate: finalHr,
        score: defaultScore,
        evaluation: defaultEval,
        recoveryNotes: defaultRecovery
      };
    });
  };

  // Lưu đánh giá và cập nhật thể lực
  const handleSaveEvaluatedSession = (e) => {
    if (e) e.preventDefault();
    if (!activeRunningSession) return;

    const finishedStatus = activeRunningSession.status; // 'COMPLETED' hoặc 'INCOMPLETE'
    const targetProg = activeRunningSession.program;
    const targetHorseName = (activeRunningSession.horse?.name || '').trim().toLowerCase();
    const targetTitle = (targetProg?.title || '').trim().toLowerCase();

    const isOverLimit = Number(activeRunningSession.maxHeartRate) > 210;
    const combinedFeedback = `${activeRunningSession.evaluation}${activeRunningSession.recoveryNotes ? ` | [Dặn dò phục hồi]: ${activeRunningSession.recoveryNotes}` : ''}`;

    const newSess = {
      id: Date.now(),
      time: new Date().toLocaleString('vi-VN'),
      horseName: activeRunningSession.horse.name,
      programTitle: activeRunningSession.program.title,
      distanceRun: Number(activeRunningSession.finalDistance),
      avgSpeed: Number(activeRunningSession.avgSpeed),
      maxHeartRate: Number(activeRunningSession.maxHeartRate),
      isOverLimit,
      status: finishedStatus,
      score: Number(activeRunningSession.score) || (finishedStatus === 'COMPLETED' ? 9.0 : 5.5),
      feedback: combinedFeedback
    };

    const updatedSessions = [newSess, ...sessions];
    setSessions(updatedSessions);
    try {
      localStorage.setItem('matruong_training_telemetry', JSON.stringify(updatedSessions));
    } catch {}
    recordTelemetryApi(newSess).catch(() => {});

    // Cập nhật trạng thái của giáo án trong danh sách giáo án huấn luyện (Chuyển sang Hoàn thành / Không hoàn thành bài tập)
    setPrograms(prev => {
      const nextProgs = prev.map(p => {
        const isMatch = (targetProg?.id && String(p.id) === String(targetProg.id)) ||
          ((p.title || '').trim().toLowerCase() === targetTitle &&
           (p.horseName || '').trim().toLowerCase() === targetHorseName);
        if (isMatch) {
          return {
            ...p,
            status: finishedStatus,
            completedAt: new Date().toLocaleDateString('vi-VN'),
            completedDate: new Date().toISOString().split('T')[0],
            completedTimestamp: Date.now(),
            lastScore: Number(activeRunningSession.score) || (finishedStatus === 'COMPLETED' ? 9.0 : 5.5)
          };
        }
        return p;
      });
      try {
        localStorage.setItem('matruong_trainer_programs', JSON.stringify(nextProgs));
      } catch {}
      return nextProgs;
    });

    window.dispatchEvent(new CustomEvent('trainer-programs-updated', {
      detail: { horseName: activeRunningSession.horse?.name, programId: targetProg?.id, status: finishedStatus }
    }));

    // Chạy thuật toán cập nhật viễn trắc thể lực tức thì
    applyFitnessAlgorithm(activeRunningSession.horse.name, newSess, updatedSessions);

    const statusText = finishedStatus === 'COMPLETED' ? 'hoàn thành bài tập' : 'không hoàn thành bài tập';
    showToast(`Đã ghi nhận ${statusText} & cập nhật thể lực cho ${activeRunningSession.horse.name}!`, 'ĐÃ LƯU ĐÁNH GIÁ', 'success');
    setActiveRunningSession(null);
    setActiveTab('programs');
  };

  // Modal chỉnh sửa nhận xét & chấm điểm bài tập
  const [showEditFeedbackModal, setShowEditFeedbackModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Xử lý tạo giáo án mới
  const handleCreateProgram = (e) => {
    e.preventDefault();
    if (isSubmittingProgram) return;

    const cleanTitle = (newProgramData.title || '').trim();
    if (!cleanTitle) {
      showToast('Vui lòng nhập tên giáo án!', 'THIẾU THÔNG TIN', 'error');
      return;
    }

    const assignedHorse = (newProgramData.horseName || (trainerHorses && trainerHorses[0]?.name) || 'Chiến mã').trim();
    setIsSubmittingProgram(true);

    const newProg = {
      id: Date.now(),
      title: cleanTitle,
      horseName: assignedHorse,
      horse: assignedHorse,
      phase: newProgramData.phase || 'Nước rút (Sprint)',
      targetDistance: Number(newProgramData.targetDistance) || 1600,
      surface: newProgramData.surface || 'SAND (Sân cát)',
      startDate: newProgramData.startDate || new Date().toISOString().split('T')[0],
      endDate: newProgramData.endDate || 'Chưa định',
      targetHeartRate: newProgramData.targetHeartRate || '< 205 bpm',
      jockeyNotes: newProgramData.jockeyNotes || '',
      status: 'ACTIVE'
    };

    setPrograms(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      const updated = [newProg, ...currentList.filter(p => String(p.id) !== String(newProg.id))];
      try {
        localStorage.setItem('matruong_trainer_programs', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const rawSaved = localStorage.getItem('matruong_trainer_programs');
      const curList = rawSaved ? JSON.parse(rawSaved) : [];
      const merged = [newProg, ...curList.filter(p => String(p.id) !== String(newProg.id))];
      localStorage.setItem('matruong_trainer_programs', JSON.stringify(merged));
    } catch {}

    saveTrainingProgramApi(newProg).catch(() => {});
    window.dispatchEvent(new CustomEvent('trainer-programs-updated', { detail: { horseName: assignedHorse, program: newProg } }));

    showToast(`Đã lưu giáo án mới cho ${assignedHorse}!`, 'THÀNH CÔNG', 'success');
    setShowAddProgramModal(false);
    setIsSubmittingProgram(false);
  };

  // State & Handler xóa giáo án bài tập
  const [deleteTargetProgram, setDeleteTargetProgram] = useState(null);

  const executeDeleteProgram = (progToDelete, progIndex = null) => {
    if (!progToDelete) return;
    const progId = progToDelete.id;
    const progTitle = progToDelete.title || 'Bài tập';
    const progHorse = progToDelete.horseName || 'chiến mã';

    setPrograms(prev => {
      let updated;
      if (typeof progIndex === 'number' && progIndex >= 0) {
        // Xóa chính xác theo vị trí đang click
        updated = prev.filter((_, idx) => idx !== progIndex);
      } else if (progId !== undefined && progId !== null && String(progId).trim() !== '') {
        // So sánh an toàn ép kiểu chuỗi
        updated = prev.filter(p => String(p.id) !== String(progId));
      } else {
        // Fallback theo title, horseName và phase
        updated = prev.filter(p => !(p.title === progTitle && p.horseName === progHorse && p.phase === progToDelete.phase));
      }

      try {
        localStorage.setItem('matruong_trainer_programs', JSON.stringify(updated));
      } catch {}

      return updated;
    });

    // Cập nhật ngay lập tức vào localStorage để chống desync giữa các tab/reload
    try {
      const saved = localStorage.getItem('matruong_trainer_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let updatedLocal;
          if (typeof progIndex === 'number' && progIndex >= 0) {
            updatedLocal = parsed.filter((_, idx) => idx !== progIndex);
          } else if (progId !== undefined && progId !== null && String(progId).trim() !== '') {
            updatedLocal = parsed.filter(p => String(p.id) !== String(progId));
          } else {
            updatedLocal = parsed.filter(p => !(p.title === progTitle && p.horseName === progHorse && p.phase === progToDelete.phase));
          }
          localStorage.setItem('matruong_trainer_programs', JSON.stringify(updatedLocal));
        }
      }
    } catch {}

    if (progId) {
      deleteTrainingProgramApi(progId).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('trainer-programs-updated', { detail: { horseName: progHorse, deletedId: progId } }));
    window.dispatchEvent(new Event('storage'));

    showToast(`Đã xóa bài tập "${progTitle}" của chiến mã ${progHorse}!`, 'ĐÃ XÓA BÀI TẬP', 'info');
    setDeleteTargetProgram(null);
  };

  const handleClearAllPrograms = () => {
    setPrograms([]);
    try {
      localStorage.setItem('matruong_trainer_programs', JSON.stringify([]));
    } catch {}
    showToast('Đã xóa sạch toàn bộ danh sách giáo án huấn luyện.', 'ĐÃ XÓA TẤT CẢ', 'info');
  };

  const handleDeleteProgramDirect = (prog, index) => {
    setDeleteTargetProgram({ ...prog, _index: index });
  };

  const handleConfirmDeleteProgram = () => {
    if (!deleteTargetProgram) return;
    executeDeleteProgram(deleteTargetProgram, deleteTargetProgram._index);
  };

  // Thuật toán cập nhật thể lực viễn trắc chiến mã tức thì khi xong/không xong bài tập
  const applyFitnessAlgorithm = (horseName, sessionObj, customSessions = null) => {
    const targetHorse = trainerHorses.find(h => (h.name || '').toLowerCase() === (horseName || '').toLowerCase())
      || allHorses.find(h => (h.name || '').toLowerCase() === (horseName || '').toLowerCase())
      || trainerHorses[0];
    if (targetHorse) {
      const sessList = customSessions || sessions;
      const computed = calculateHorseFitnessOnSession(targetHorse, sessionObj, sessList);
setTrainerHorses(prev => {
        const next = prev.map(h => {
          if ((h.name || '').toLowerCase() === (targetHorse.name || '').toLowerCase() || h.id === targetHorse.id) {
            const condStr = typeof computed.condition === 'number'
              ? `${computed.condition}%`
              : (String(computed.condition).includes('%') ? computed.condition : (computed.conditionVal ? `${computed.conditionVal}%` : computed.condition));
            return {
              ...h,
              condition: condStr,
              trend: computed.trend,
              trendPercent: computed.trendPercent,
              shortTermLoad: computed.shortTermLoad,
              longTermLoad: computed.longTermLoad,
              loadRatio: computed.loadRatio,
              recoveryPercent: computed.recoveryPercent,
              performanceToday: computed.performanceToday,
              maxSpeed: computed.maxSpeed,
              status: computed.status === 'READY' ? 'READY' : (parseFloat(computed.condition) < 80 ? 'OBSERVATION' : h.status)
            };
          }
          return h;
        });
        try {
          localStorage.setItem('matruong_trainer_horses_managed', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  // Lắng nghe sự kiện cập nhật viễn trắc từ Modal hoặc các dịch vụ khác
  useEffect(() => {
    const handleFitnessUpdate = (e) => {
      const { horse: updatedH, telemetry: computed } = e.detail || {};
      if (updatedH && computed) {
        setTrainerHorses(prev => {
          const next = prev.map(h => {
            if ((h.name || '').toLowerCase() === (updatedH.name || '').toLowerCase() || h.id === updatedH.id || h.microchip === updatedH.microchip) {
              const condStr = typeof computed.condition === 'number'
                ? `${computed.condition}%`
                : (String(computed.condition).includes('%') ? computed.condition : (computed.conditionVal ? `${computed.conditionVal}%` : computed.condition));
              return {
                ...h,
                condition: condStr,
                trend: computed.trend,
                trendPercent: computed.trendPercent,
                shortTermLoad: computed.shortTermLoad,
                longTermLoad: computed.longTermLoad,
                loadRatio: computed.loadRatio,
                recoveryPercent: computed.recoveryPercent,
                performanceToday: computed.performanceToday,
                maxSpeed: computed.maxSpeed,
                status: computed.status === 'READY' ? 'READY' : (parseFloat(computed.condition) < 80 ? 'OBSERVATION' : h.status)
              };
            }
            return h;
          });
          try {
            localStorage.setItem('matruong_trainer_horses_managed', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    };
    window.addEventListener('racehorse-fitness-updated', handleFitnessUpdate);
    return () => window.removeEventListener('racehorse-fitness-updated', handleFitnessUpdate);
  }, [trainerHorses]);

  // Xử lý ghi nhận buổi tập mới
  const handleCreateSession = (e) => {
    e.preventDefault();
    const heartRate = Number(newSessionData.maxHeartRate);
    const isOverLimit = heartRate > 210;

    const newSess = {
      id: Date.now(),
      time: new Date().toLocaleString('vi-VN'),
      horseName: newSessionData.horseName,
      programTitle: newSessionData.programTitle,
      distanceRun: Number(newSessionData.distanceRun),
      avgSpeed: Number(newSessionData.avgSpeed),
      maxHeartRate: heartRate,
      isOverLimit,
      status: newSessionData.status || 'COMPLETED',
      score: Number(newSessionData.score) || 8.0,
      feedback: newSessionData.feedback || 'Hoàn thành buổi tập theo kế hoạch đề ra.'
    };
    const updatedSessions = [newSess, ...sessions];
    setSessions(updatedSessions);
    try {
      localStorage.setItem('matruong_training_telemetry', JSON.stringify(updatedSessions));
    } catch {}
    recordTelemetryApi(newSess).catch(() => {});

    // Chạy thuật toán cập nhật viễn trắc thể lực tức thì
    applyFitnessAlgorithm(newSessionData.horseName, newSess);

    showToast(`Đã lưu bài tập mới cho ${newSessionData.horseName} (${newSess.status === 'COMPLETED' ? 'Hoàn thành' : 'Chưa hoàn thành'})`);
    setShowAddSessionModal(false);
    setNewSessionData({
      horseName: 'Hắc Phong',
      programTitle: 'Tăng tốc nước rút 1.600m sân cát',
      distanceRun: 1600,
      avgSpeed: 60.5,
      maxHeartRate: 200,
      status: 'COMPLETED',
      score: 8.5,
      feedback: ''
    });
  };

  // Chuyển đổi trạng thái Hoàn thành / Không hoàn thành 1-chạm
  const handleToggleSessionStatus = (sessionId) => {
    setSessions(prev => {
      let targetSession = null;
      const next = prev.map(s => {
        if (s.id === sessionId) {
          const nextStatus = s.status === 'COMPLETED' ? 'INCOMPLETE' : 'COMPLETED';
          const statusText = nextStatus === 'COMPLETED' ? 'Hoàn thành' : 'Không hoàn thành';
          showToast(`Đã đổi bài tập của ${s.horseName} sang: ${statusText}`);
          targetSession = { ...s, status: nextStatus };
          return targetSession;
        }
        return s;
      });
      try {
        localStorage.setItem('matruong_training_telemetry', JSON.stringify(next));
      } catch {}

      // Kích hoạt thuật toán cập nhật thể lực ngay lập tức
      if (targetSession) {
        applyFitnessAlgorithm(targetSession.horseName, targetSession);
      }

      return next;
    });
  };

  // Mở modal chấm điểm & ghi chú bài tập
  const handleOpenEvaluationModal = (sess) => {
    setSelectedSession({
      ...sess,
      status: sess.status || 'COMPLETED',
      score: sess.score !== undefined ? sess.score : 8.0,
      feedback: sess.feedback || ''
    });
    setShowEditFeedbackModal(true);
  };

  // Cập nhật trạng thái, điểm số & ghi chú bài tập
  const handleUpdateFeedback = (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    setSessions(prev => {
      const next = prev.map(s => s.id === selectedSession.id ? {
        ...s,
        status: selectedSession.status,
        score: Number(selectedSession.score),
        feedback: selectedSession.feedback
      } : s);
      try {
        localStorage.setItem('matruong_training_telemetry', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Kích hoạt thuật toán cập nhật thể lực ngay lập tức
    applyFitnessAlgorithm(selectedSession.horseName, selectedSession);

    const statusText = selectedSession.status === 'COMPLETED' ? 'Hoàn thành' : 'Không hoàn thành';
    showToast(`Đã lưu bài tập của ${selectedSession.horseName}: ${statusText} • Điểm ${selectedSession.score}/10`);
    setShowEditFeedbackModal(false);
    setSelectedSession(null);
  };

  const getInitials = (name) => {
    if (!name) return 'HL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="portal-layout">
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'var(--bg-card)',
          color: 'var(--paper)',
          padding: '14px 22px',
          borderRadius: '8px',
          fontSize: '13.5px',
          fontWeight: 600,
          boxShadow: 'var(--shadow)',
          zIndex: 10000000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid var(--brass)'
        }}>
          <span style={{ color: 'var(--brass)', fontWeight: 700 }}>•</span> {toastMsg}
        </div>
      )}

      {/* Mobile drawer backdrop */}
      <div
        className={`portal-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===================== SIDEBAR ===================== */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-brand">
          <div className="portal-brand-icon">
            <IconHorse size={22} color="var(--brass)" />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>{t('trainerBrandSub')}</p>
          </div>
        </div>

        <nav className="portal-nav">
          <button
            className={`portal-nav-item ${activeTab === 'horses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('horses'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconHorse size={18} /></span>
            <span className="portal-nav-label">{t('trainerTabHorses')}</span>
            <span className="portal-nav-badge">{trainerHorses.length}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'vitals' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vitals'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconOverview size={18} /></span>
            <span className="portal-nav-label">{t('trainerTabVitals')}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'programs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('programs'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconClipboard size={18} /></span>
            <span className="portal-nav-label">{t('trainerTabPrograms')}</span>
            <span className="portal-nav-badge">{programs.length}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'joint_training' ? 'active' : ''}`}
            onClick={() => { setActiveTab('joint_training'); setSidebarOpen(false); }}
            style={{ position: 'relative' }}
          >
            <span className="portal-nav-icon"><IconCalendar size={18} color={activeTab === 'joint_training' ? 'var(--brass)' : 'currentColor'} /></span>
            <span className="portal-nav-label">{lang === 'en' ? 'Joint Schedule' : 'Lịch Hẹn Tập Chung'}</span>
            {pendingJointCount > 0 && (
              <span className="portal-nav-badge" style={{ background: '#F59E0B', color: '#0A0D14', fontWeight: 800 }}>
                {pendingJointCount}
              </span>
            )}
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => { setActiveTab('review'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconStar size={18} /></span>
            <span className="portal-nav-label">{t('trainerTabReview')}</span>
          </button>

          <button
            className={`portal-nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => { setActiveTab('approvals'); setSidebarOpen(false); }}
            style={{ position: 'relative' }}
          >
            <span className="portal-nav-icon"><IconTrophy size={18} color={activeTab === 'approvals' ? 'var(--brass)' : 'currentColor'} /></span>
            <span className="portal-nav-label">{lang === 'en' ? 'Race Approvals' : 'Phê Duyệt Thi Đấu'}</span>
            {pendingCount > 0 ? (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14', fontWeight: 800 }}>
                {pendingCount}
              </span>
            ) : (
              <span className="portal-nav-badge">{nominations.length}</span>
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
              <IconMenu size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title">
                {activeTab === 'horses' && t('trainerTitleHorses')}
                {activeTab === 'vitals' && t('trainerTitleVitals')}
                {activeTab === 'programs' && t('trainerTitlePrograms')}
                {activeTab === 'joint_training' && (lang === 'en' ? 'Owner Training Appointments & Booking Review' : 'Lịch Hẹn Tập Luyện Chung Từ Chủ Sở Hữu Ngựa')}
                {activeTab === 'review' && t('trainerTitleReview')}
                {activeTab === 'approvals' && (lang === 'en' ? 'Tournament Nominations & Approvals' : 'Thẩm Định & Phê Duyệt Đăng Ký Thi Đấu')}
              </h2>
              <div className="portal-page-subtitle">
                {activeTab === 'horses' && t('trainerSubHorses')}
                {activeTab === 'vitals' && t('trainerSubVitals')}
                {activeTab === 'programs' && t('trainerSubPrograms')}
                {activeTab === 'joint_training' && (lang === 'en' ? 'Review owner booking requests, check vet clearances and confirm to officially reserve slots' : 'Tiếp nhận yêu cầu từ Chủ sở hữu ngựa, kiểm tra y tế thú y và bấm xác nhận để chính thức giữ chỗ bãi tập')}
                {activeTab === 'review' && t('trainerSubReview')}
                {activeTab === 'approvals' && (lang === 'en' ? 'Review horse owner nominations, evaluate cardiovascular fitness and authorize official barrier draw' : 'Thẩm định hồ sơ đăng ký giải đấu từ Chủ sở hữu ngựa, đánh giá thể lực & cấp phép xuất phát')}
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
            <NotificationBell role="TRAINER" currentUser={currentUser} />
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                {getInitials(currentUser?.full_name)}
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentUser?.full_name || (lang === 'en' ? 'Trainer' : 'Huấn Luyện Viên')}</div>
                <div className="portal-user-role">{currentUser?.role_name || (lang === 'en' ? 'Head Trainer' : 'Huấn Luyện Viên Trưởng')}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="portal-btn-logout"
              title={t('trainerLogout')}
            >
              {t('trainerLogout')}
            </button>
          </div>
        </header>

        {/* MAIN BODY PER TAB */}
        <main className="portal-main">
          {/* BANNER THÔNG BÁO NỔI BẬT: CÓ LỊCH HẸN CHỦ SỞ HỮU ĐANG CHỜ HLV XÁC NHẬN GIỮ CHỖ */}
          {pendingJointCount > 0 && activeTab !== 'joint_training' && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.16) 0%, rgba(212, 175, 55, 0.1) 100%)',
              border: '1.5px solid #F59E0B',
              borderRadius: '10px',
              padding: '12px 18px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🔔</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#F59E0B' }}>
                    BẠN CÓ {pendingJointCount} YÊU CẦU ĐẶT LỊCH TẬP CHUNG TỪ CHỦ SỞ HỮU ĐANG CHỜ XÁC NHẬN!
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                    Chủ sở hữu vừa gửi yêu cầu. Huấn luyện viên cần bấm <b>"Xác nhận & Giữ chỗ"</b> thì mới chính thức khóa lịch bãi tập cho chủ ngựa.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('joint_training')}
                style={{
                  padding: '8px 18px',
                  background: '#F59E0B',
                  color: '#0A0D14',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)'
                }}
              >
                Xem & Xác Nhận Giữ Chỗ Ngay →
              </button>
            </div>
          )}

          {/* Quick KPI Header Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="facility-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'en' ? 'TOTAL RACEHORSES' : 'TỔNG CHIẾN MÃ HUẤN LUYỆN'}
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px' }}>
                {trainerHorses.length} {lang === 'en' ? 'horses' : 'con'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {lang === 'en' ? 'Tracked with biometrics' : 'Theo dõi telemetry định kỳ'}
              </div>
            </div>

            <div className="facility-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'en' ? 'RACE READY' : 'ĐỦ ĐIỀU KIỆN XUẤT TRẬN'}
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--brass)', margin: '6px 0 2px' }}>
                {trainerHorses.filter(h => h.status === 'READY').length} {lang === 'en' ? 'horses' : 'con'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {lang === 'en' ? 'Cleared for racing cup' : 'Sẵn sàng đăng ký giải đua'}
              </div>
            </div>

            <div className="facility-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'en' ? 'LOCKED BY VET' : 'KHÓA TẬP BỞI THÚ Y'}
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px' }}>
                {trainerHorses.filter(h => h.isLockedByVet).length} {lang === 'en' ? 'horses' : 'con'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {lang === 'en' ? 'Heavy sprint restricted' : 'Cấm bài chạy nước rút nặng'}
              </div>
            </div>

            <div className="facility-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'en' ? 'COMPLETED SESSIONS' : 'BUỔI TẬP ĐÃ HOÀN TẤT'}
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--brass)', margin: '6px 0 2px' }}>
                {sessions.length} {lang === 'en' ? 'workouts' : 'lượt'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                {lang === 'en' ? 'Safe telemetry telemetry logs' : 'Dữ liệu lưu vết an toàn'}
              </div>
            </div>
          </div>

          {/* ===================== TAB 1: DANH SÁCH NGỰA ĐUA (HỒ SƠ CỦA CHỦ SỞ HỮU) ===================== */}
          {activeTab === 'horses' && (
            <div>
              {pendingCount > 0 && (
                <div
                  onClick={() => setActiveTab('approvals')}
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid var(--brass)',
                    borderRadius: '8px',
                    padding: '14px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <IconTrophy size={24} color="var(--brass)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>
                        {pendingCount} đề cử giải đấu từ Chủ sở hữu ngựa đang chờ Huấn luyện viên trưởng phê duyệt
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                        Đánh giá chỉ số thể lực, nhịp tim và cấp phép xuất phát chính thức.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      border: 'none',
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Thẩm định ngay →
                  </button>
                </div>
              )}

              {/* Khối Xác Nhận Phục Vụ & Nhật Ký Hoạt Động Tiếp Nhận */}
              {(() => {
                const uName = (currentUser?.username || '').trim().toLowerCase();
                const fName = (currentUser?.full_name || '').trim().toLowerCase();
                const isMyHorse = (a) => (
                  (a.trainerUsername && a.trainerUsername.trim().toLowerCase() === uName) ||
                  (!a.trainerUsername && a.trainerName && a.trainerName.trim().toLowerCase() === fName)
                );
                const pendingAssignments = serviceAssignments.filter(a => isMyHorse(a) && a.trainerStatus === 'PENDING');
                const confirmedAssignments = serviceAssignments.filter(a => isMyHorse(a) && a.trainerStatus === 'CONFIRMED');
                if (pendingAssignments.length === 0 && confirmedAssignments.length === 0) return null;

                return (
                  <>
                    {/* 1. KHỐI CHỜ XÁC NHẬN: Khi HLV bấm Xác nhận xong thì ô này biến mất */}
                    {pendingAssignments.length > 0 && (
                      <div style={{
                        background: 'rgba(212, 175, 55, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.45)',
                        borderRadius: '10px',
                        padding: '18px 22px',
                        marginBottom: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>🏇</span>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brass)' }}>
                                Yêu Cầu Huấn Luyện Chờ Xác Nhận ({pendingAssignments.length})
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                                Chủ sở hữu đã chỉ định bạn làm Huấn luyện viên trưởng. Vui lòng kiểm tra hồ sơ và bấm xác nhận để tiếp nhận vào đàn huấn luyện.
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0A0D14', background: 'var(--brass)', padding: '4px 12px', borderRadius: '12px' }}>
                            {pendingAssignments.length} Yêu cầu mới
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '14px' }}>
                          {pendingAssignments.map(asgn => {
                            const stallCode = asgn.stable ? (asgn.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || asgn.stable.split('(')[0].trim()) : 'Ô A1';
                            const vetClean = asgn.vetName ? asgn.vetName.replace(/^(BS|Bác sĩ)\.?\s*/i, '').trim() : 'Nguyễn An';
                            const groomClean = asgn.groomName ? asgn.groomName.replace(/^(Groom|Chăm sóc)\.?\s*/i, '').trim() : 'Lê Hoàng Nam';

                            return (
                              <div
                                key={asgn.id || asgn.microchip}
                                style={{
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid rgba(212, 175, 55, 0.4)',
                                  borderRadius: '10px',
                                  padding: '14px 18px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  height: '100%',
                                  gap: '10px',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                                }}
                              >
                                {/* Dòng 1: Tên chiến mã, ô chuồng & Nút thao tác (Cố định 1 hàng cân bằng) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', minHeight: '34px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, marginRight: '6px' }}>
                                    <b
                                      style={{
                                        color: 'var(--paper)',
                                        fontSize: '15px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '220px'
                                      }}
                                      title={asgn.horseName}
                                    >
                                      {asgn.horseName}
                                    </b>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: 'var(--brass)',
                                      background: 'rgba(212, 175, 55, 0.12)',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(212, 175, 55, 0.25)',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}>
                                      {stallCode}
                                    </span>
                                    <span style={{
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      color: '#F59E0B',
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      border: '1px solid rgba(245, 158, 11, 0.3)',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}>
                                      Chờ xác nhận
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const full = lookupFullHorseInfo(asgn.horseName || asgn.microchip);
                                        setConfirmedHorseModal({
                                          ...(full || {}),
                                          name: full?.name || asgn.horseName,
                                          microchip: full?.microchip || asgn.microchip,
                                          stable: full?.stable || asgn.stable,
                                          ownerName: full?.ownerName || asgn.ownerName,
                                          isPendingConfirmation: true,
                                          trainerStatus: 'PENDING',
                                          assignmentData: asgn
                                        });
                                      }}
                                      style={{
                                        background: 'transparent',
                                        color: 'var(--brass)',
                                        border: '1px solid var(--brass)',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease'
                                      }}
                                      title="Xem hồ sơ định danh chiến mã và thông tin chủ sở hữu"
                                    >
                                      Xem hồ sơ
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleConfirmTrainerService(asgn)}
                                      style={{
                                        background: 'var(--brass)',
                                        color: '#0A0D14',
                                        border: 'none',
                                        padding: '5px 12px',
                                        borderRadius: '5px',
                                        fontSize: '11.5px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      ✓ Xác Nhận Phục Vụ
                                    </button>
                                  </div>
                                </div>

                                {/* Dòng 2 & 3: Thông tin chi tiết phân cách đều */}
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid var(--line)',
                                  fontSize: '12px'
                                }}>
                                  <div style={{ color: 'var(--paper-dim)' }}>
                                    Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{asgn.ownerName}</b> · Chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{asgn.microchip}</span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ color: 'var(--paper-dim)', fontSize: '11.5px' }}>Đội ngũ cùng phục vụ:</span>
                                    <span style={{
                                      background: 'var(--bg-card)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid var(--line)',
                                      color: 'var(--paper)',
                                      fontWeight: 600,
                                      fontSize: '11.5px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🩺 BS. {vetClean}
                                    </span>
                                    <span style={{
                                      background: 'var(--bg-card)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid var(--line)',
                                      color: 'var(--paper)',
                                      fontWeight: 600,
                                      fontSize: '11.5px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      🌾 Groom {groomClean}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. NHẬT KÝ HOẠT ĐỘNG HUẤN LUYỆN */}
                    {confirmedAssignments.length > 0 && (
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        marginBottom: '20px',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>📋</span>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>
                                Nhật Ký Hoạt Động Tiếp Nhận Huấn Luyện ({confirmedAssignments.length})
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                                Lịch sử xác nhận tiếp nhận chiến mã từ Chủ sở hữu và đồng bộ vào danh sách Thể lực tàu ngựa.
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#10B981',
                            background: 'rgba(16, 185, 129, 0.12)',
                            padding: '3px 10px',
                            borderRadius: '12px'
                          }}>
                            {confirmedAssignments.length} Chiến mã đã tiếp nhận
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {confirmedAssignments.map(asgn => {
                            const stallCode = asgn.stable ? (asgn.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || asgn.stable.split('(')[0].trim()) : 'Ô A1';
                            const vetClean = asgn.vetName ? asgn.vetName.replace(/^(BS|Bác sĩ)\.?\s*/i, '').trim() : 'Nguyễn An';
                            const groomClean = asgn.groomName ? asgn.groomName.replace(/^(Groom|Chăm sóc)\.?\s*/i, '').trim() : 'Lê Hoàng Nam';

                            return (
                              <div
                                key={asgn.id || asgn.microchip}
                                style={{
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--line)',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '12px',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: '#10B981',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    ✓ ĐÃ TIẾP NHẬN
                                  </span>

                                  <div>
                                    <div style={{ fontSize: '13.5px', color: 'var(--paper)', lineHeight: 1.4 }}>
                                      HLV <b style={{ color: 'var(--brass)' }}>{currentUser?.full_name || 'Trần Văn Hùng'}</b> đã tiếp nhận chiến mã <b style={{ color: 'var(--paper)', fontSize: '14px' }}>{asgn.horseName}</b> (<span style={{ color: 'var(--brass)', fontWeight: 600 }}>{stallCode}</span> · Chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{asgn.microchip}</span>) từ Chủ sở hữu <b style={{ color: 'var(--paper)' }}>{asgn.ownerName}</b>.
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span>Thời gian: {asgn.trainerConfirmedAt || 'Gần đây'}</span>
                                      <span>·</span>
                                      <span>Phối hợp: 🩺 BS. {vetClean} · 🌾 Groom {groomClean}</span>
                                      <span>·</span>
                                      <span style={{ color: '#10B981', fontWeight: 600 }}>Đã hiện diện ở Thể lực tàu ngựa</span>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const full = lookupFullHorseInfo(asgn.horseName || asgn.microchip);
                                      setConfirmedHorseModal(full);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      color: 'var(--brass)',
                                      border: '1px solid var(--brass)',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title="Xem hồ sơ định danh chiến mã và thông tin chủ sở hữu"
                                  >
                                    Xem hồ sơ
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* THANH ĐIỀU HƯỚNG BỘ LỌC CỦA DANH SÁCH NGỰA ĐUA */}
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button className="portal-pill-btn active">
                    {lang === 'en' ? 'All Racehorses' : 'Tất cả ngựa đua'} <span className="pill-count">{trainerHorses.length}</span>
                  </button>
                  <button className="portal-pill-btn" onClick={() => setActiveTab('vitals')}>
                    {lang === 'en' ? 'Fleet Fitness Evaluation →' : 'Xem Đánh Giá Thể Lực →'}
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    className={`portal-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    {lang === 'en' ? 'Card Grid' : 'Lưới Thẻ'}
                  </button>
                  <button
                    className={`portal-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    {lang === 'en' ? 'Data Table' : 'Bảng Thông Số'}
                  </button>
                </div>
              </div>

              {/* LƯỚI THẺ HỒ SƠ NGỰA ĐUA CỦA CHỦ SỞ HỮU */}
              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {trainerHorses.map(horse => {
                    const workoutCount = getHorseSessionCount(horse.name, sessions);
                    const isCalibrating = workoutCount < REQUIRED_WORKOUTS_TO_EVALUATE;
                    const displayStatus = isCalibrating 
                      ? (lang === 'en' ? `New Intake (${workoutCount}/3 workouts)` : `Mới tiếp nhận (${workoutCount}/3 bài tập)`)
                      : (horse.status === 'READY'
                        ? (lang === 'en' ? 'Ready for Race' : 'Sẵn sàng thi đấu')
                        : (lang === 'en' ? 'Under Observation' : 'Cần theo dõi'));
                    const badgeClass = isCalibrating ? 'badge-slate' : (horse.status === 'READY' ? 'badge-gold' : 'badge-slate');
                    const cleanStall = (horse.stall || horse.stable || 'Ô A1').split('•')[0].split('(')[0].trim();
                    const horseAvatar = horse.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';

                    return (
                      <div key={horse.id} className="facility-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className={`facility-card-badge ${badgeClass}`} style={{ whiteSpace: 'nowrap', flexShrink: 0, maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cleanStall}>
                            <IconHorse size={14} color="var(--brass)" />
                            <span>{cleanStall}</span>
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--paper-dim)',
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            background: 'var(--bg-secondary)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--line)',
                            letterSpacing: '0.03em'
                          }}>
                            {horse.microchip}
                          </span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', marginBottom: '4px' }}>
                            <img
                              src={horseAvatar}
                              alt={horse.name}
                              style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 className="facility-card-title" style={{ margin: 0 }}>{horse.name}</h3>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: 'var(--brass)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  background: 'rgba(212, 175, 55, 0.08)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(212, 175, 55, 0.2)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {horse.breed}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--line)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                              Chủ sở hữu: <b style={{ color: 'var(--brass)' }}>{horse.owner || horse.ownerName || 'Chủ sở hữu'}</b>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                              {horse.age || '3 tuổi'}
                            </span>
                          </div>

                          <p className="facility-card-desc" style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            color: 'var(--paper-dim)',
                            lineHeight: 1.5,
                            minHeight: '36px',
                            height: '36px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {horse.desc || `Chiến mã thuần chủng đang trong chế độ rèn luyện thể lực và viễn trắc.`}
                          </p>
                        </div>

                        {/* Cảnh báo thú y nếu có */}
                        {horse.isLockedByVet && (
                          <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--line)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            color: 'var(--paper-dim)',
                            lineHeight: 1.4,
                            fontWeight: 600,
                            marginBottom: '10px'
                          }}>
                            <span style={{ color: 'var(--brass)', fontWeight: 700 }}>{lang === 'en' ? 'VET WARNING:' : 'CẢNH BÁO THÚ Y:'}</span> {horse.vetNotice}
                          </div>
                        )}

                        <div className="facility-card-bullets">
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'Accumulated distance:' : 'Quãng đường tích lũy:'} <b>{horse.totalDistanceKm || 120} km</b></span>
                          </div>
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'Status:' : 'Trạng thái:'} <b style={{ color: horse.status === 'READY' ? 'var(--brass)' : 'var(--paper)' }}>{displayStatus}</b></span>
                          </div>
                        </div>

                        {/* Các nút hành động chính của thẻ ngựa (Cân bằng 50/50: Xem hồ sơ & Gia phả hệ) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const full = lookupFullHorseInfo(horse.name || horse.microchip);
                              setConfirmedHorseModal(full || horse);
                            }}
                            style={{
                              height: '38px',
                              background: 'transparent',
                              border: '1px solid var(--brass)',
                              color: 'var(--brass)',
                              padding: '0 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title="Xem hồ sơ thông tin chi tiết của chiến mã & chủ sở hữu"
                          >
                            Xem hồ sơ
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const full = lookupFullHorseInfo(horse.name || horse.microchip);
                              setSelectedPedigreeHorse(full || horse);
                            }}
                            style={{
                              height: '38px',
                              background: 'var(--brass)',
                              border: 'none',
                              color: '#0A0D14',
                              padding: '0 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            title="Xem cây phả hệ gia phả 3 đời do chủ sở hữu cung cấp và cập nhật"
                          >
                            Gia phả hệ
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
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Racehorse' : 'Chiến Mã'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Owner' : 'Chủ Sở Hữu'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall' : 'Ô Chuồng'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Breed & Age' : 'Giống & Tuổi'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Status' : 'Trạng Thái'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Actions' : 'Thao Tác'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainerHorses.map(horse => {
                        const displayStatus = horse.status === 'READY'
                          ? (lang === 'en' ? 'Ready for Race' : 'Sẵn sàng thi đấu')
                          : (lang === 'en' ? 'Under Observation' : 'Cần theo dõi');
                        return (
                          <tr key={horse.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--paper)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div>{horse.name}</div>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{horse.microchip}</div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <b style={{ color: 'var(--brass)', fontSize: '13px' }}>{horse.owner || horse.ownerName || 'Chủ sở hữu'}</b>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{horse.stall}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>
                              <div>{horse.breed}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>{horse.age}</div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                background: horse.status === 'READY' ? 'rgba(201, 162, 39, 0.12)' : 'var(--bg-secondary)',
                                color: horse.status === 'READY' ? 'var(--brass)' : 'var(--paper-dim)',
                                border: horse.status === 'READY' ? '1px solid var(--brass)' : '1px solid var(--line)'
                              }}>
                                {displayStatus}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const full = lookupFullHorseInfo(horse.name || horse.microchip);
                                  setConfirmedHorseModal(full || horse);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'transparent',
                                  color: 'var(--brass)',
                                  border: '1px solid var(--brass)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                title="Xem hồ sơ thông tin chi tiết của chiến mã & chủ sở hữu"
                              >
                                Xem hồ sơ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const full = lookupFullHorseInfo(horse.name || horse.microchip);
                                  setSelectedPedigreeHorse(full || horse);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                                title="Xem cây phả hệ gia phả 3 đời do chủ sở hữu cung cấp và cập nhật"
                              >
                                Gia phả hệ
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

          {/* ===================== TAB 2: THỂ LỰC TÀU NGỰA (ĐÁNH GIÁ THỂ LỰC TĂNG / GIẢM SAU KHI TẬP) ===================== */}
          {activeTab === 'vitals' && (
            <div>
              {/* KHỐI TỔNG QUAN ĐÁNH GIÁ BIẾN THIÊN THỂ LỰC TOÀN ĐÀN */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📈</span>
                      <span>Đánh Giá Thể Lực Tàu Ngựa Sau Tập Luyện</span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                      Hệ thống tự động so sánh nhịp tim, tốc độ bứt phá và tải tập luyện (Load Ratio) để xác định thể lực từng chiến mã đang tăng hay giảm sau bài tập.
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)' }}>
                    Cập nhật viễn trắc hôm nay
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 700 }}>▲ THỂ LỰC ĐANG TĂNG</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                      {trainerHorses.filter(h => !h.isLockedByVet && (parseFloat(h.condition) >= 90 || h.status === 'READY')).length} chiến mã
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                      Thích nghi tốt, thể lực cải thiện rõ rệt
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontSize: '11.5px', color: '#F59E0B', fontWeight: 700 }}>● THỂ LỰC ỔN ĐỊNH</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                      {trainerHorses.filter(h => !h.isLockedByVet && parseFloat(h.condition) < 90 && parseFloat(h.condition) >= 80).length} chiến mã
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                      Duy trì phong độ chuẩn bị thi đấu
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 700 }}>▼ THỂ LỰC GIẢM / MỆT MỎI</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                      {trainerHorses.filter(h => h.isLockedByVet || parseFloat(h.condition) < 80).length} chiến mã
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                      Tích lũy mệt mỏi, cần phác đồ xả cơ & giảm tải
                    </div>
                  </div>
                </div>
              </div>

              {/* THANH ĐIỀU HƯỚNG BỘ LỌC CỦA THỂ LỰC TÀU NGỰA */}
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button className="portal-pill-btn active">
                    {lang === 'en' ? 'All Horses' : 'Tất cả đàn ngựa'} <span className="pill-count">{trainerHorses.length}</span>
                  </button>
                  <button className="portal-pill-btn" onClick={() => setActiveTab('programs')}>
                    {lang === 'en' ? 'Curriculums' : 'Giáo án'} <span className="pill-count">{programs.length}</span>
                  </button>
                  <button className="portal-pill-btn" onClick={() => setActiveTab('sessions')}>
                    {lang === 'en' ? 'Workouts' : 'Buổi tập'} <span className="pill-count">{sessions.length}</span>
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    className={`portal-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    {lang === 'en' ? 'Card Grid' : 'Lưới Thẻ'}
                  </button>
                  <button
                    className={`portal-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    {lang === 'en' ? 'Data Table' : 'Bảng Thông Số'}
                  </button>
                </div>
              </div>

              {/* LƯỚI THẺ THỂ LỰC TÀU NGỰA (ĐÁNH GIÁ TĂNG / GIẢM) */}
              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {trainerHorses.map(horse => {
                    const workoutCount = getHorseSessionCount(horse.name, sessions);
                    const isCalibrating = workoutCount < REQUIRED_WORKOUTS_TO_EVALUATE;
                    const remainingWorkouts = Math.max(0, REQUIRED_WORKOUTS_TO_EVALUATE - workoutCount);

                    const fullInfo = lookupFullHorseInfo(horse.name || horse.microchip);
                    const cleanStall = (horse.stall || horse.stable || 'Ô A1').split('•')[0].split('(')[0].trim();
                    const horseAvatar = horse.avatar || fullInfo?.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                    const condVal = parseFloat(horse.condition) || 88;
                    const isIncreasing = !isCalibrating && !horse.isLockedByVet && (horse.trend === 'INCREASING' || condVal >= 88);
                    const isStable = !isCalibrating && !horse.isLockedByVet && (horse.trend === 'STABLE' || (condVal >= 80 && condVal < 88));
                    const trendPercent = horse.trendPercent || (isIncreasing ? '+4.2%' : (isStable ? '+0.5%' : '-2.8%'));
                    const shortTerm = horse.shortTermLoad || 107;
                    const longTerm = horse.longTermLoad || 99;
                    const loadRatio = horse.loadRatio || 108;

                    return (
                      <div key={horse.id} className="facility-card" style={{ border: isCalibrating ? '1px dashed rgba(245, 158, 11, 0.45)' : (isIncreasing ? '1px solid rgba(16, 185, 129, 0.4)' : (isStable ? '1px solid var(--line)' : '1px solid rgba(239, 68, 68, 0.4)')) }}>
                        {/* Header của thẻ: Ô chuồng & Huy hiệu Đánh giá Thể lực Tăng / Giảm */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="facility-card-badge badge-gold" style={{ whiteSpace: 'nowrap' }} title={cleanStall}>
                            <IconHorse size={14} color="var(--brass)" />
                            <span>{cleanStall}</span>
                          </span>

                          {/* Huy hiệu Thể lực TĂNG / GIẢM / ĐANG HIỆU CHUẨN */}
                          {isCalibrating ? (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#F59E0B',
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              ⏳ Cần thêm {remainingWorkouts} bài tập
                            </span>
                          ) : (
                            <>
                              {isIncreasing && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: '#10B981',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ▲ Thể lực đang TĂNG ({trendPercent})
                                </span>
                              )}
                              {isStable && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: '#F59E0B',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ● Thể lực ỔN ĐỊNH ({trendPercent})
                                </span>
                              )}
                              {!isIncreasing && !isStable && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: '#EF4444',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ▼ Thể lực đang GIẢM ({trendPercent})
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Tên chiến mã, Ảnh nhận diện & Mã vi chip */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <img
                              src={horseAvatar}
                              alt={horse.name}
                              style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid var(--line)',
                                flexShrink: 0
                              }}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--paper)', letterSpacing: '0.01em' }}>
                                  {horse.name}
                                </h3>
                                <span style={{
                                  fontSize: '11px',
                                  color: 'var(--brass)',
                                  fontFamily: 'monospace',
                                  background: 'var(--bg-secondary)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--line)',
                                  letterSpacing: '0.04em',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {horse.microchip}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  color: 'var(--brass)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em',
                                  background: 'rgba(212, 175, 55, 0.08)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(212, 175, 55, 0.2)'
                                }}>
                                  {horse.breed || 'Thoroughbred'}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                  {horse.age || '3 tuổi'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '6px' }}>
                            Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{horse.owner || horse.ownerName || 'Chủ sở hữu'}</b>
                          </div>
                          <p style={{
                            fontSize: '12px',
                            color: 'var(--paper-dim)',
                            lineHeight: 1.5,
                            margin: '0 0 10px',
                            minHeight: '36px',
                            height: '36px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {horse.desc || `Chiến mã thuần chủng đang trong chế độ rèn luyện thể lực và viễn trắc.`}
                          </p>
                        </div>

                        {/* Cảnh báo thú y nếu có */}
                        {horse.isLockedByVet && (
                          <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            color: '#FCA5A5',
                            lineHeight: 1.4,
                            fontWeight: 600,
                            marginBottom: '10px'
                          }}>
                            <span>⚠️ {lang === 'en' ? 'VET WARNING:' : 'CẢNH BÁO THÚ Y:'}</span> {horse.vetNotice}
                          </div>
                        )}

                        {/* Khối Thông Số Thể Lực & Tải Luyện Tập Hợp Nhất (Cân Bằng Chuẩn) */}
                        <div style={{
                          background: isCalibrating ? 'rgba(245, 158, 11, 0.04)' : 'var(--bg-secondary)',
                          border: isCalibrating ? '1px dashed rgba(245, 158, 11, 0.35)' : '1px solid var(--line)',
                          borderRadius: '8px',
                          padding: '12px 10px',
                          margin: '8px 0 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          {/* Hàng 1: Viễn trắc Tim mạch & Tốc độ */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nhịp Tim TB</div>
                              <div style={{ fontSize: '13.5px', fontWeight: 800, color: isCalibrating ? '#64748B' : 'var(--paper)', marginTop: '2px' }}>
                                {isCalibrating ? '-- bpm' : `${horse.avgHeartRate} bpm`}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tốc Độ Đỉnh</div>
                              <div style={{ fontSize: '13.5px', fontWeight: 800, color: isCalibrating ? '#64748B' : 'var(--paper)', marginTop: '2px' }}>
                                {isCalibrating ? '-- km/h' : `${horse.maxSpeed} km/h`}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phong Độ</div>
                              <div style={{ fontSize: '13.5px', fontWeight: 800, color: isCalibrating ? '#F59E0B' : (isIncreasing ? '#10B981' : (isStable ? 'var(--brass)' : '#EF4444')), marginTop: '2px' }}>
                                {isCalibrating ? `Chờ đánh giá (${workoutCount}/3)` : horse.condition}
                              </div>
                            </div>
                          </div>

                          {/* Đường phân cách mờ */}
                          <div style={{ height: '1px', background: 'var(--line)', opacity: 0.5 }} />

                          {/* Hàng 2: Tải Luyện Tập EvoLab */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tải Ngắn Hạn</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: isCalibrating ? '#64748B' : 'var(--paper)', marginTop: '2px' }}>
                                {isCalibrating ? '-- TL' : `${shortTerm} TL`}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tải Dài Hạn</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: isCalibrating ? '#64748B' : 'var(--paper)', marginTop: '2px' }}>
                                {isCalibrating ? '-- TL' : `${longTerm} TL`}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tỉ Lệ Tải</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: isCalibrating ? '#64748B' : (isIncreasing ? '#10B981' : (isStable ? '#F59E0B' : '#EF4444')), marginTop: '2px' }}>
                                {isCalibrating ? '-- %' : `${loadRatio}%`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NÚT BẤM THAO TÁC */}
                        <div style={{ marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => setFitnessDetailModalHorse(horse)}
                            style={{
                              width: '100%',
                              height: '38px',
                              background: 'var(--brass)',
                              color: '#0A0D14',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)',
                              whiteSpace: 'nowrap'
                            }}
                            title="Xem chi tiết các biểu đồ thể lực, nhịp tim và tải luyện tập như EvoLab"
                          >
                            Xem thêm chi tiết
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
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Racehorse' : 'Chiến Mã'}</th>
                        <th style={{ padding: '14px 18px' }}>Đánh Giá Thể Lực</th>
                        <th style={{ padding: '14px 18px' }}>Tải Ngắn/Dài Hạn</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Avg HR' : 'Nhịp Tim TB'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Peak Speed' : 'Tốc Độ Đỉnh'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Condition' : 'Phong Độ'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Actions' : 'Thao Tác'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainerHorses.map(horse => {
                        const workoutCount = getHorseSessionCount(horse.name, sessions);
                        const isCalibrating = workoutCount < REQUIRED_WORKOUTS_TO_EVALUATE;
                        const remainingWorkouts = Math.max(0, REQUIRED_WORKOUTS_TO_EVALUATE - workoutCount);
                        const fullInfo = lookupFullHorseInfo(horse.name || horse.microchip);
                        const horseAvatar = horse.avatar || fullInfo?.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                        const condVal = parseFloat(horse.condition) || 88;
                        const isIncreasing = !isCalibrating && !horse.isLockedByVet && condVal >= 88;
                        const isStable = !isCalibrating && !horse.isLockedByVet && condVal >= 80 && condVal < 88;

                        return (
                          <tr key={horse.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--paper)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={horseAvatar}
                                  alt={horse.name}
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--line)',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                                  }}
                                />
                                <div>
                                  <div>{horse.name}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{horse.stall} · {horse.microchip}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              {isCalibrating ? (
                                <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '12px', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 8px', borderRadius: '4px' }}>
                                  ⏳ Cần thêm {remainingWorkouts} bài tập
                                </span>
                              ) : isIncreasing ? (
                                <span style={{ color: '#10B981', fontWeight: 800, fontSize: '12px', background: 'rgba(16, 185, 129, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>
                                  ▲ TĂNG (+4.2%)
                                </span>
                              ) : isStable ? (
                                <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '12px', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>
                                  ● ỔN ĐỊNH (+0.5%)
                                </span>
                              ) : (
                                <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '12px', background: 'rgba(239, 68, 68, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>
                                  ▼ GIẢM (-2.8%)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 18px', fontSize: '12.5px' }}>
                              <div>Tải: <b style={{ color: 'var(--paper)' }}>{isCalibrating ? '--' : '107 / 99'}</b></div>
                              <div style={{ color: isCalibrating ? '#64748B' : '#10B981', fontSize: '11px', fontWeight: 700 }}>Tỉ lệ: {isCalibrating ? '-- %' : '108% (Tối ưu)'}</div>
                            </td>
                            <td style={{ padding: '14px 18px', color: isCalibrating ? '#64748B' : 'var(--paper)', fontWeight: 600 }}>{isCalibrating ? '-- bpm' : `${horse.avgHeartRate} bpm`}</td>
                            <td style={{ padding: '14px 18px', color: isCalibrating ? '#64748B' : 'var(--paper)', fontWeight: 600 }}>{isCalibrating ? '-- km/h' : `${horse.maxSpeed} km/h`}</td>
                            <td style={{ padding: '14px 18px', color: isCalibrating ? '#F59E0B' : (isIncreasing ? '#10B981' : 'var(--brass)'), fontWeight: 700 }}>
                              {isCalibrating ? `Chờ đánh giá (${workoutCount}/3)` : horse.condition}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <button
                                type="button"
                                onClick={() => setFitnessDetailModalHorse(horse)}
                                style={{
                                  padding: '6px 14px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Xem thêm chi tiết
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

          {/* ===================== TAB 2: GIÁO ÁN HUẤN LUYỆN ===================== */}
          {activeTab === 'programs' && (
            <div>
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button className="portal-pill-btn active">
                    {lang === 'en' ? 'All Curriculums' : 'Tất cả giáo án'} <span className="pill-count">{programs.length}</span>
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    className={`portal-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    {lang === 'en' ? 'Card Grid' : 'Lưới Thẻ'}
                  </button>
                  <button
                    className={`portal-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    {lang === 'en' ? 'Curriculums List' : 'Bảng Danh Sách'}
                  </button>
                  <button
                    onClick={handleOpenAddProgramModal}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {t('trainerBtnAddProgram')}
                  </button>
                  {programs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPrograms}
                      className="portal-view-btn"
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#EF4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'en' ? `Clear All (${programs.length})` : `Xóa tất cả (${programs.length})`}
                    </button>
                  )}
                </div>
              </div>

              {programs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '50px 24px',
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--line)',
                  borderRadius: '12px',
                  margin: '16px 0',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px' }}>
                    {lang === 'en' ? 'No Training Curriculums Available' : 'Chưa Có Giáo Án Huấn Luyện Nào'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    {lang === 'en'
                      ? 'All sample horse curriculums have been removed. Click the button below to create a tailored curriculum for your assigned racehorse.'
                      : 'Toàn bộ giáo án của các chiến mã mẫu đã được xóa sạch. Bấm nút bên dưới để lập giáo án huấn luyện mới cho chiến mã của bạn.'}
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddProgramModal}
                    style={{
                      padding: '10px 24px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    + {lang === 'en' ? 'Create New Curriculum' : 'Lập Giáo Án Huấn Luyện Mới'}
                  </button>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {programs.map((prog, progIdx) => (
                    <div key={prog.id || `prog-${progIdx}`} className="facility-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span className="facility-card-badge badge-gold" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <IconClipboard size={14} color="var(--brass)" />
                          <span>{prog.phase.toUpperCase()}</span>
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--paper-dim)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          background: 'var(--bg-secondary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)'
                        }}>
                          {prog.surface}
                        </span>
                      </div>

                      <h3 className="facility-card-title">{prog.title}</h3>
                      <p className="facility-card-desc">
                        {lang === 'en' ? 'Assigned runner:' : 'Chiến mã đảm nhận:'} <b style={{ color: 'var(--brass)' }}>{prog.horseName}</b>. {lang === 'en' ? 'Active standard applied.' : 'Áp dụng chuẩn chuyên nghiệp.'}
                      </p>

                      <div className="facility-card-bullets">
                        <div className="facility-bullet-item">
                          <span className="bullet-dot" />
                          <span>{lang === 'en' ? 'Duration:' : 'Thời gian:'} <b>{prog.startDate} → {prog.endDate}</b></span>
                        </div>
                      </div>

                      <div className="facility-specs-grid">
                        <div className="facility-spec-cell">
                          <span className="spec-label">{lang === 'en' ? 'Runner' : 'Chiến Mã'}</span>
                          <span className="spec-val" style={{ color: 'var(--paper)' }}>{prog.horseName}</span>
                        </div>
                        <div className="facility-spec-cell">
                          <span className="spec-label">{lang === 'en' ? 'Target Dist' : 'Cự ly mục tiêu'}</span>
                          <span className="spec-val">{prog.targetDistance} m</span>
                        </div>
                        <div className="facility-spec-cell">
                          <span className="spec-label">{lang === 'en' ? 'Surface' : 'Mặt sân'}</span>
                          <span className="spec-val">{prog.surface.split(' ')[0]}</span>
                        </div>
                      </div>

                      {(() => {
                        const isCompleted = prog.status === 'COMPLETED';
                        const isIncomplete = prog.status === 'INCOMPLETE';
                        return (
                          <div className="facility-price-box">
                            <div>
                              <div className="price-label">{lang === 'en' ? 'Curriculum Status' : 'Trạng thái giáo án'}</div>
                              <div className="price-value" style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: isCompleted ? '#10B981' : isIncomplete ? '#EF4444' : 'var(--brass)'
                              }}>
                                {isCompleted
                                  ? (lang === 'en' ? 'Workout Completed' : 'Hoàn thành bài tập')
                                  : isIncomplete
                                  ? (lang === 'en' ? 'Workout Incomplete' : 'Không hoàn thành bài tập')
                                  : (lang === 'en' ? 'Active Progression' : 'Đang thực hiện tích cực')}
                              </div>
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isCompleted
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isIncomplete
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(201, 162, 39, 0.12)',
                              color: isCompleted ? '#10B981' : isIncomplete ? '#EF4444' : 'var(--brass)',
                              border: isCompleted
                                ? '1px solid #10B981'
                                : isIncomplete
                                ? '1px solid #EF4444'
                                : '1px solid var(--brass)'
                            }}>
                              {isCompleted
                                ? (lang === 'en' ? 'COMPLETED' : 'HOÀN THÀNH')
                                : isIncomplete
                                ? (lang === 'en' ? 'INCOMPLETE' : 'CHƯA ĐẠT')
                                : 'ACTIVE'}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="facility-card-actions">
                        <div className="actions-left" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="facility-btn-action"
                            onClick={() => handleStartWorkout(prog)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: prog.status === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : prog.status === 'INCOMPLETE'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : undefined,
                              borderColor: prog.status === 'COMPLETED'
                                ? '#10B981'
                                : prog.status === 'INCOMPLETE'
                                ? '#EF4444'
                                : undefined,
                              color: prog.status === 'COMPLETED'
                                ? '#10B981'
                                : prog.status === 'INCOMPLETE'
                                ? '#EF4444'
                                : undefined
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            {prog.status === 'COMPLETED' || prog.status === 'INCOMPLETE'
                              ? (lang === 'en' ? 'Rerun' : '↺ Tập lại')
                              : (lang === 'en' ? 'Run Workout' : 'Chạy bài này')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProgramDirect(prog, progIdx)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '7px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xóa giáo án bài tập này"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Xóa
                          </button>
                        </div>
                        <span className="facility-link-action" style={{ cursor: 'default' }}>
                          {lang === 'en' ? `Target ${prog.targetDistance}m →` : `Cự ly ${prog.targetDistance}m →`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{lang === 'en' ? 'Horse' : 'Chiến mã'}</th>
                        <th style={{ padding: '12px 10px' }}>{lang === 'en' ? 'Curriculum Title' : 'Tên giáo án'}</th>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{lang === 'en' ? 'Phase' : 'Giai đoạn'}</th>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>{lang === 'en' ? 'Target Dist' : 'Cự ly mục tiêu'}</th>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{lang === 'en' ? 'Surface' : 'Mặt sân'}</th>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{lang === 'en' ? 'Duration' : 'Thời gian'}</th>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>{lang === 'en' ? 'Status' : 'Trạng thái'}</th>
                        <th style={{ padding: '12px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>{lang === 'en' ? 'Actions' : 'Thao tác'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.map((prog, progIdx) => (
                        <tr key={prog.id || `prog-row-${progIdx}`} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--paper)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {prog.horseName}
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--paper)', verticalAlign: 'middle' }}>
                            {prog.title}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {prog.phase}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--brass)', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {prog.targetDistance} m
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper-dim)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {prog.surface}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper-dim)', fontSize: '12px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {prog.startDate} <span style={{ color: 'var(--line-strong)', margin: '0 2px' }}>→</span> {prog.endDate}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const isCompleted = prog.status === 'COMPLETED';
                              const isIncomplete = prog.status === 'INCOMPLETE';
                              return (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: isCompleted
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : isIncomplete
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(212, 175, 55, 0.12)',
                                  color: isCompleted ? '#10B981' : isIncomplete ? '#EF4444' : 'var(--brass)',
                                  border: isCompleted
                                    ? '1px solid #10B981'
                                    : isIncomplete
                                    ? '1px solid #EF4444'
                                    : '1px solid var(--brass)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {isCompleted
                                    ? (lang === 'en' ? 'Completed' : 'Hoàn thành bài tập')
                                    : isIncomplete
                                    ? (lang === 'en' ? 'Incomplete' : 'Không hoàn thành bài tập')
                                    : (lang === 'en' ? 'Active' : 'Đang thực hiện')}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleStartWorkout(prog)}
                                style={{
                                  background: 'rgba(212, 175, 55, 0.15)',
                                  color: 'var(--brass)',
                                  border: '1px solid var(--brass)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Bắt đầu chạy bài tập này"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                {lang === 'en' ? 'Run' : 'Chạy bài này'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProgramDirect(prog, progIdx)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Xóa giáo án bài tập này"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: LỊCH HẸN TẬP LUYỆN CHUNG TỪ CHỦ SỞ HỮU ===================== */}
          {activeTab === 'joint_training' && (
            <div>
              {/* BANNER THÔNG BÁO CÓ YÊU CẦU NHỜ TẬP THAY */}
              {substituteRequestsCount > 0 && jointFilter !== 'SUBSTITUTE_REQUESTS' && (
                <div style={{
                  background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.16) 0%, rgba(212, 175, 55, 0.1) 100%)',
                  border: '1.5px solid #38BDF8',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🤝</span>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#38BDF8' }}>
                        BẠN CÓ {substituteRequestsCount} YÊU CẦU NHỜ HỖ TRỢ TẬP THAY TỪ ĐỒNG NGHIỆP!
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                        HLV chính bận việc và đã bàn giao bài tập cho bạn. Hãy bấm để tiếp nhận buổi tập và hướng dẫn Chủ sở hữu.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJointFilter('SUBSTITUTE_REQUESTS')}
                    style={{
                      padding: '7px 16px',
                      background: '#38BDF8',
                      color: '#0A0D14',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Xem Yêu Cầu ({substituteRequestsCount}) →
                  </button>
                </div>
              )}

              {/* THỐNG KÊ TỔNG QUAN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                <div className="facility-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    TỔNG YÊU CẦU ĐẶT LỊCH
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px' }}>
                    {myJointSessions.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Từ các Chủ sở hữu ngựa
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px', border: '1px solid #F59E0B', background: 'rgba(245, 158, 11, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                    CHỜ HLV XÁC NHẬN ĐỂ GIỮ CHỖ
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B', margin: '6px 0 2px' }}>
                    {pendingJointCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Cần HLV duyệt thì mới chính thức giữ chỗ
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                    ĐÃ XÁC NHẬN & ĐÃ GIỮ CHỖ
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981', margin: '6px 0 2px' }}>
                    {confirmedJointCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Khung giờ đã khóa an toàn trên sân
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>
                    ĐÃ TỪ CHỐI / ĐỔI GIỜ
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#EF4444', margin: '6px 0 2px' }}>
                    {rejectedJointCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Đã gửi phản hồi đến Chủ sở hữu
                  </div>
                </div>
              </div>

              {/* BỘ LỌC VÀ TÌM KIẾM */}
              <div className="portal-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${jointFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setJointFilter('ALL')}
                  >
                    Tất cả <span className="pill-count">{myJointSessions.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${jointFilter === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setJointFilter('PENDING')}
                  >
                    ⏳ Chờ duyệt giữ chỗ <span className="pill-count">{pendingJointCount}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${jointFilter === 'CONFIRMED' ? 'active' : ''}`}
                    onClick={() => setJointFilter('CONFIRMED')}
                  >
                    ✓ Đã giữ chỗ <span className="pill-count">{confirmedJointCount}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${jointFilter === 'SUBSTITUTE_REQUESTS' ? 'active' : ''}`}
                    onClick={() => setJointFilter('SUBSTITUTE_REQUESTS')}
                    style={substituteRequestsCount > 0 ? { borderColor: '#38BDF8', color: '#38BDF8', fontWeight: 800 } : {}}
                  >
                    🤝 Nhờ tập thay <span className="pill-count" style={substituteRequestsCount > 0 ? { background: '#38BDF8', color: '#fff' } : {}}>{substituteRequestsCount}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${jointFilter === 'REJECTED' ? 'active' : ''}`}
                    onClick={() => setJointFilter('REJECTED')}
                  >
                    ✕ Đã từ chối <span className="pill-count">{rejectedJointCount}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleTrainerReset18h}
                    title="Tới tầm 18:00 hàng ngày, toàn bộ lịch tập cũ sẽ tự động hoàn tất và mở bảng lịch trống. Bấm nút này để kích hoạt reset mốc 18:00 ngay lập tức."
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid var(--brass)',
                      color: 'var(--brass)',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Reset Lịch Trống (18:00)
                  </button>
                  <select
                    className="portal-input"
                    value={selectedTrainerFilter}
                    onChange={(e) => setSelectedTrainerFilter(e.target.value)}
                    style={{ padding: '7px 10px', fontSize: '12px', minWidth: '180px' }}
                  >
                    <option value="ALL">🏇 Tất cả HLV ({jointSessions.length})</option>
                    <option value="trainer_truong">Trần Văn Hùng (HLV Trưởng)</option>
                    <option value="trainer_nghia">Lê Trọng Nghĩa (Cự ly dài)</option>
                    <option value="trainer_anh">Phạm Quốc Anh (Nước rút)</option>
                  </select>
                  <input
                    type="text"
                    className="portal-input"
                    value={jointSearch}
                    onChange={(e) => setJointSearch(e.target.value)}
                    placeholder="Tìm theo tên ngựa, chủ..."
                    style={{ padding: '7px 12px', fontSize: '12.5px', minWidth: '190px' }}
                  />
                </div>
              </div>

              {/* DANH SÁCH CÁC YÊU CẦU ĐẶT LỊCH */}
              {(() => {
                const filtered = myJointSessions.filter(s => {
                  if (jointFilter === 'SUBSTITUTE_REQUESTS') {
                    return s.transferStatus === 'PENDING_TRANSFER' && (s.delegatedToTrainerUsername || '').toLowerCase() === currentU;
                  }
                  if (jointFilter !== 'ALL' && s.status !== jointFilter) return false;
                  if (jointSearch) {
                    const q = jointSearch.toLowerCase();
                    const matchHorse = (s.horseName || '').toLowerCase().includes(q);
                    const matchOwner = (s.ownerName || '').toLowerCase().includes(q);
                    const matchDate = (s.sessionDate || '').toLowerCase().includes(q);
                    return matchHorse || matchOwner || matchDate;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--paper-dim)'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🤝</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)' }}>
                        Không có yêu cầu đặt lịch nào trong danh mục này
                      </div>
                      <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
                        Khi Chủ sở hữu ngựa đặt lịch tập luyện chung với Huấn luyện viên, yêu cầu sẽ xuất hiện tại đây để bạn kiểm tra và xác nhận giữ chỗ.
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filtered.map(session => {
                      const isPending = session.status === 'PENDING';
                      const isConfirmed = session.status === 'CONFIRMED';
                      const isRejected = session.status === 'REJECTED';
                      const lockStatus = checkHorseVetLockStatus(session.microchip || session.horseId || session.horseName);
                      const isVetLocked = lockStatus.isLocked;

                      const isDelegatedToMe = (session.delegatedToTrainerUsername || '').toLowerCase() === currentU && session.transferStatus === 'PENDING_TRANSFER';
                      const isSubstitutedByMe = (session.substituteTrainerUsername || '').toLowerCase() === currentU && session.transferStatus === 'TRANSFERRED';
                      const isMyAssignedSession = (session.trainerUsername || '').toLowerCase() === currentU;
                      const isMyDelegatedOut = isMyAssignedSession && session.transferStatus === 'PENDING_TRANSFER';
                      const isMySessionTransferred = isMyAssignedSession && session.transferStatus === 'TRANSFERRED';

                      return (
                        <div
                          key={session.id}
                          style={{
                            background: 'var(--bg-card)',
                            border: isPending ? '1.5px solid #F59E0B' : isConfirmed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--line)',
                            borderRadius: '12px',
                            padding: '18px 20px',
                            boxShadow: isPending ? '0 4px 20px rgba(245, 158, 11, 0.12)' : 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                              <img
                                src={session.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80'}
                                alt={session.horseName}
                                style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--line)' }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--paper)', fontWeight: 800 }}>
                                    {session.horseName}
                                  </h3>
                                  <span style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--paper-dim)' }}>
                                    {session.stall || 'Ô A1'}
                                  </span>
                                  {session.microchip && (
                                    <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>
                                      RFID: {session.microchip}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--paper)', marginTop: '4px' }}>
                                  👤 Chủ sở hữu: <b style={{ color: 'var(--brass)' }}>{session.ownerName}</b>
                                </div>
                              </div>
                            </div>

                            {/* BADGE TRẠNG THÁI */}
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              {session.transferStatus === 'PENDING_TRANSFER' ? (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38BDF8',
                                  border: '1px solid rgba(56, 189, 248, 0.4)'
                                }}>
                                  {(session.delegatedToTrainerUsername || '').toLowerCase() === currentU
                                    ? '📩 YÊU CẦU NHỜ TẬP THAY'
                                    : `⏳ ĐANG NHỜ HLV ${session.delegatedToTrainerName}`}
                                </span>
                              ) : session.transferStatus === 'TRANSFERRED' ? (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}>
                                  🤝 HLV THAY THẾ TẠM THỜI
                                </span>
                              ) : isPending ? (
                                <span style={{
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#F59E0B',
                                  border: '1px solid rgba(245, 158, 11, 0.4)'
                                }}>
                                  ⏳ CẦN HLV DUYỆT ĐỂ GIỮ CHỖ
                                </span>
                              ) : isConfirmed ? (
                                <span style={{
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}>
                                  ✓ ĐÃ XÁC NHẬN & GIỮ CHỖ
                                </span>
                              ) : isRejected ? (
                                <span style={{
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.4)'
                                }}>
                                  ✕ ĐÃ TỪ CHỐI / ĐỔI GIỜ
                                </span>
                              ) : null}
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                Yêu cầu gửi: {session.createdAt || 'Gần đây'}
                              </div>
                            </div>
                          </div>

                          {/* THÔNG TIN KHUNG GIỜ VÀ MỤC TIÊU */}
                          <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                                📅 Ngày & Khung Giờ Yêu Cầu
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brass)', marginTop: '3px' }}>
                                {session.sessionDate} · {session.sessionTime}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                HLV Phụ trách: {session.trainerName}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                                🎯 Mục Tiêu Buổi Tập Chung
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper)', marginTop: '3px' }}>
                                {session.goal}
                              </div>
                              {session.ownerNotes && (
                                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px', fontStyle: 'italic' }}>
                                  "Ghi chú: {session.ownerNotes}"
                                </div>
                              )}
                            </div>
                          </div>

                          {/* CẢNH BÁO Y TẾ NẾU NGỰA BỊ KHÓA BỞI THÚ Y */}
                          {isVetLocked ? (
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#EF4444',
                              fontSize: '12px',
                              lineHeight: 1.45,
                              marginBottom: '12px'
                            }}>
                              ⛔ <b>CẢNH BÁO KHÓA Y TẾ:</b> Bác sĩ Thú y đang phong tỏa chiến mã này ({lockStatus.reason || 'Dấu hiệu chấn thương'}).
                              <br />
                              HLV không được phép bấm xác nhận tập luyện cho đến khi Bác sĩ Thú y mở khóa an toàn tại Cổng Thú Y!
                            </div>
                          ) : (
                            <div style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              color: '#10B981',
                              fontSize: '11.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '12px'
                            }}>
                              <span>✓</span> <b>Hồ sơ Thú y:</b> Thể lực & sức khỏe bình thường. Đủ điều kiện ra sân cùng Chủ sở hữu.
                            </div>
                          )}

                          {/* LỜI NHỜ HỖ TRỢ DÀNH CHO HLV ĐƯỢC NHỜ */}
                          {isDelegatedToMe && (
                            <div style={{
                              padding: '12px 14px',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1.5px solid #38BDF8',
                              color: 'var(--paper)',
                              fontSize: '12.5px',
                              marginBottom: '12px'
                            }}>
                              <div style={{ fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                📩 LỜI NHỜ TẬP THAY TỪ HLV CHÍNH ({session.originalTrainerName || session.trainerName}):
                              </div>
                              <div>
                                HLV chính bận việc đột xuất và nhờ bạn phụ trách buổi tập tạm thời này cùng Chủ sở hữu <b>{session.ownerName}</b>.
                              </div>
                              {session.transferReason && (
                                <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--paper-dim)' }}>
                                  Lý do: "{session.transferReason}"
                                </div>
                              )}
                              {session.assignedWorkout && (
                                <div style={{
                                  marginTop: '8px',
                                  padding: '8px 10px',
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid #38BDF8'
                                }}>
                                  <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '11.5px', marginBottom: '2px' }}>
                                    📋 BÀI TẬP / GIÁO ÁN CHỈ ĐỊNH ĐỂ TẬP THEO:
                                  </div>
                                  <div style={{ whiteSpace: 'pre-line' }}>{session.assignedWorkout}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* BÀI TẬP CHỈ ĐỊNH (KHI ĐÃ BÀN GIAO THAY THẾ) */}
                          {session.transferStatus === 'TRANSFERRED' && session.assignedWorkout && (
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              borderLeft: '3px solid #10B981',
                              color: 'var(--paper)',
                              fontSize: '12px',
                              marginBottom: '12px'
                            }}>
                              <div style={{ fontWeight: 800, color: '#10B981', marginBottom: '4px' }}>
                                📋 Bài tập chỉ định từ HLV chính ({session.originalTrainerName}):
                              </div>
                              <div style={{ whiteSpace: 'pre-line' }}>{session.assignedWorkout}</div>
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                                HLV thay thế: <b>{session.substituteTrainerName}</b> ({session.substituteResponseNote || 'Đã sẵn sàng hướng dẫn'})
                              </div>
                            </div>
                          )}

                          {/* LỜI DẶN CỦA HLV (NẾU ĐÃ PHẢN HỒI HOẶC DUYỆT) */}
                          {session.trainerFeedback && (
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: isConfirmed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              borderLeft: isConfirmed ? '3px solid #10B981' : '3px solid #EF4444',
                              color: 'var(--paper)',
                              fontSize: '12px',
                              marginBottom: '12px'
                            }}>
                              <b>{isConfirmed ? 'Lời dặn HLV khi giữ chỗ:' : 'Lý do từ chối / Đổi giờ:'}</b> {session.trainerFeedback}
                              {session.confirmedAt && (
                                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                                  Xác nhận lúc: {session.confirmedAt} (Bởi {session.confirmedBy || session.trainerName})
                                </div>
                              )}
                            </div>
                          )}

                          {/* CÁC NÚT THAO TÁC CHO HLV */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                            {/* NẾU LÀ YÊU CẦU NHỜ TẬP THAY GỬI ĐẾN MÌNH */}
                            {isDelegatedToMe && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRejectSubstitute(session)}
                                  className="portal-view-btn"
                                  style={{
                                    padding: '8px 16px',
                                    fontSize: '12.5px',
                                    color: '#EF4444',
                                    borderColor: 'rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  ✕ Từ Chối Hỗ Trợ
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenSubstituteConfirmModal(session)}
                                  style={{
                                    padding: '8px 18px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '12.5px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
                                  }}
                                >
                                  🤝 Nhận Tập Thay Theo Bài Tập
                                </button>
                              </>
                            )}

                            {/* NẾU LÀ BUỔI TẬP MỚI ĐẶT CẦN DUYỆT */}
                            {isPending && !isDelegatedToMe && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenJointRejectModal(session)}
                                  className="portal-view-btn"
                                  style={{
                                    padding: '8px 16px',
                                    fontSize: '12.5px',
                                    color: '#EF4444',
                                    borderColor: 'rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  ✕ Từ Chối / Đổi Giờ
                                </button>

                                <button
                                  type="button"
                                  disabled={isVetLocked}
                                  onClick={() => handleQuickConfirmJointSession(session)}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    background: isVetLocked ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    color: isVetLocked ? 'var(--paper-dim)' : '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '12.5px',
                                    border: 'none',
                                    cursor: isVetLocked ? 'not-allowed' : 'pointer',
                                    boxShadow: isVetLocked ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                                  }}
                                >
                                  {isVetLocked ? '⛔ Bị Khóa Y Tế' : '✓ Giữ Chỗ Ngay'}
                                </button>

                                <button
                                  type="button"
                                  disabled={isVetLocked}
                                  onClick={() => handleOpenJointConfirmModal(session)}
                                  style={{
                                    padding: '8px 18px',
                                    borderRadius: '6px',
                                    background: isVetLocked ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, var(--brass) 0%, #B89230 100%)',
                                    color: isVetLocked ? 'var(--paper-dim)' : '#120E04',
                                    fontWeight: 800,
                                    fontSize: '12.5px',
                                    border: 'none',
                                    cursor: isVetLocked ? 'not-allowed' : 'pointer',
                                    boxShadow: isVetLocked ? 'none' : '0 4px 14px rgba(212, 175, 55, 0.3)'
                                  }}
                                >
                                  {isVetLocked ? '⛔ Bị Khóa Y Tế' : '✍️ Dặn Dò & Giữ Chỗ'}
                                </button>
                              </>
                            )}

                            {/* NẾU ĐÃ CONFIRMED VÀ LÀ HLV CHÍNH -> CÓ NÚT CHUYỂN GIAO CHO HLV KHÁC NẾU BẬN */}
                            {isConfirmed && isMyAssignedSession && (!session.transferStatus || session.transferStatus === 'NONE') && (
                              <button
                                type="button"
                                onClick={() => handleOpenDelegateModal(session)}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '6px',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  color: '#38BDF8',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                🔄 Nhờ HLV Khác Tập Thay (Nếu Bận Việc)
                              </button>
                            )}

                            {/* NẾU HLV CHÍNH ĐÃ GỬI LỜI NHỜ VÀ ĐANG CHỜ PHẢN HỒI */}
                            {isMyDelegatedOut && (
                              <span style={{ fontSize: '12px', color: '#38BDF8', fontStyle: 'italic' }}>
                                ⏳ Đang chờ HLV {session.delegatedToTrainerName} xác nhận tiếp nhận...
                              </span>
                            )}

                            {/* NẾU ĐÃ CHUYỂN GIAO THÀNH CÔNG */}
                            {isMySessionTransferred && (
                              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                                ✓ Đã bàn giao cho HLV {session.substituteTrainerName} phụ trách buổi tập này
                              </span>
                            )}

                            {/* NẾU HLV HIỆN TẠI LÀ HLV THAY THẾ ĐÃ XÁC NHẬN */}
                            {isSubstitutedByMe && (
                              <button
                                type="button"
                                onClick={() => {
                                  showToast(`Buổi tập đã được bạn ghi nhận hướng dẫn theo bài tập của HLV chính (${session.originalTrainerName}). Báo cáo đã đồng bộ về hồ sơ chiến mã!`, 'ĐÃ HOÀN TẤT', 'success');
                                }}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Báo Cáo Buổi Tập Về HLV Chính
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          

          {/* ===================== TAB 4: ĐÁNH GIÁ & GHI CHÚ BÀI TẬP ===================== */}
          {activeTab === 'review' && (
            <div>
              <div className="portal-filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--paper-dim)', fontWeight: 600 }}>{t('trainerFilterHorse')}</span>
                    <select
                      value={filterHorse}
                      onChange={(e) => setFilterHorse(e.target.value)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        borderRadius: '6px',
                        padding: '7px 12px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="ALL">{lang === 'en' ? 'All racehorses' : 'Tất cả chiến mã'}</option>
                      {trainerHorses.map(h => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--paper-dim)', fontWeight: 600 }}>{t('trainerFilterStatus')}</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        borderRadius: '6px',
                        padding: '7px 12px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="ALL">{lang === 'en' ? 'All statuses' : 'Tất cả trạng thái'}</option>
                      <option value="COMPLETED">{t('trainerStatusCompleted')}</option>
                      <option value="INCOMPLETE">{t('trainerStatusIncomplete')}</option>
                    </select>
                  </div>
                </div>

                <div className="portal-view-tools">
                  <button
                    onClick={() => {
                      const prog = programs.find(p => p.horseName === filterHorse) || programs[0];
                      if (prog) handleStartWorkout(prog);
                      else setActiveTab('programs');
                    }}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    {lang === 'en' ? '+ Run Workout' : '+ Chạy Bài Tập Mới'}
                  </button>
                </div>
              </div>

              {filteredSessions.length === 0 ? (
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--paper-dim)',
                  border: '1px dashed var(--line)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <IconClipboard size={32} color="var(--paper-dim)" />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)' }}>
                    {lang === 'en' ? 'No matching workout sessions found' : 'Không tìm thấy bài tập nào phù hợp'}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    {lang === 'en' ? 'Please adjust filters or log a new workout session.' : 'Hãy điều chỉnh lại bộ lọc hoặc ghi nhận thêm bài tập.'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredSessions.map(sess => {
                    const isCompleted = sess.status === 'COMPLETED';
                    return (
                      <div
                        key={sess.id}
                        className="facility-card"
                        style={{
                          border: isCompleted ? '1px solid var(--line)' : '1px solid var(--line)',
                          padding: '22px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                          <div style={{ flex: 1, minWidth: '280px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--paper)' }}>
                                {sess.horseName}
                              </span>
                              <span style={{ fontSize: '12.5px', color: 'var(--paper-dim)' }}>• {sess.time}</span>
                              <span style={{
                                padding: '3px 8px',
                                background: isCompleted ? 'rgba(201, 162, 39, 0.12)' : 'var(--bg-secondary)',
                                color: isCompleted ? 'var(--brass)' : 'var(--paper-dim)',
                                border: isCompleted ? '1px solid var(--brass)' : '1px solid var(--line)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 700
                              }}>
                                {isCompleted ? (lang === 'en' ? 'COMPLETED' : 'ĐÃ HOÀN THÀNH') : (lang === 'en' ? 'INCOMPLETE' : 'CHƯA ĐẠT')}
                              </span>
                              <span style={{
                                padding: '3px 8px',
                                background: 'rgba(201, 162, 39, 0.12)',
                                color: 'var(--brass)',
                                borderRadius: '4px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                border: '1px solid var(--brass)'
                              }}>
                                {sess.score !== undefined ? sess.score : 8.0}/10
                              </span>
                            </div>

                            <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                              <span>{lang === 'en' ? 'Curriculum:' : 'Giáo án:'} <b style={{ color: 'var(--paper)' }}>{sess.programTitle}</b></span>
                              <span>|</span>
                              <span>{lang === 'en' ? 'Distance:' : 'Cự ly:'} <b style={{ color: 'var(--paper)' }}>{sess.distanceRun}m</b></span>
                              <span>|</span>
                              <span>{lang === 'en' ? 'Velocity:' : 'Tốc độ:'} <b style={{ color: 'var(--paper)' }}>{sess.avgSpeed} km/h</b></span>
                              <span>|</span>
                              <span>{lang === 'en' ? 'Heart Rate:' : 'Nhịp tim:'} <b style={{ color: sess.isOverLimit ? 'var(--brass)' : 'var(--paper)' }}>{sess.maxHeartRate} bpm</b></span>
                            </div>

                            <div style={{
                              background: 'var(--bg-secondary)',
                              borderLeft: isCompleted ? '3px solid var(--brass)' : '3px solid var(--line)',
                              borderTop: '1px solid var(--line)',
                              borderRight: '1px solid var(--line)',
                              borderBottom: '1px solid var(--line)',
                              padding: '12px 16px',
                              borderRadius: '0 8px 8px 0',
                              fontSize: '13.5px',
                              color: 'var(--paper)',
                              lineHeight: 1.6
                            }}>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px', fontWeight: 600 }}>
                                {lang === 'en' ? 'Head Trainer Technical Feedback & Notes:' : 'Nhận xét & Ghi chú của Huấn luyện viên:'}
                              </div>
                              <div>"{sess.feedback || (lang === 'en' ? 'No remarks logged.' : 'Chưa có ghi chú.')}"</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                            <button
                              onClick={() => handleToggleSessionStatus(sess.id)}
                              style={{
                                padding: '9px 16px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--line)',
                                color: 'var(--paper)',
                                borderRadius: '6px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {isCompleted ? (lang === 'en' ? 'Mark: Incomplete' : 'Đổi sang: Chưa đạt') : (lang === 'en' ? 'Mark: Completed' : 'Đổi sang: Hoàn thành')}
                            </button>

                            <button
                              onClick={() => handleOpenEvaluationModal(sess)}
                              style={{
                                padding: '9px 16px',
                                background: 'var(--brass)',
                                border: 'none',
                                color: '#14100A',
                                borderRadius: '6px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {lang === 'en' ? 'Edit Score & Notes' : 'Sửa điểm & Ghi chú'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 5: PHÊ DUYỆT ĐĂNG KÝ THI ĐẤU (CHỦ NGỰA ĐỀ CỬ) ===================== */}
          {activeTab === 'approvals' && (
            <div>
              {/* STATS OVERVIEW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                <div className="facility-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {lang === 'en' ? 'TOTAL NOMINATIONS' : 'TỔNG ĐỀ CỬ GIẢI ĐẤU'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--paper)', margin: '6px 0 2px' }}>
                    {nominations.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    {lang === 'en' ? 'From registered horse owners' : 'Từ các chủ sở hữu ngựa'}
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px', border: '1px solid var(--brass)', background: 'rgba(212, 175, 55, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--brass)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {lang === 'en' ? 'PENDING TRAINER REVIEW' : 'CHỜ HLV TRƯỞNG PHÊ DUYỆT'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brass)', margin: '6px 0 2px' }}>
                    {pendingCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    {lang === 'en' ? 'Requires physical clearance' : 'Cần thẩm định phong độ thể lực'}
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>
                    {lang === 'en' ? 'OFFICIALLY APPROVED' : 'ĐÃ PHÊ DUYỆT XUẤT PHÁT'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981', margin: '6px 0 2px' }}>
                    {nominations.filter(n => n.nominationStatus === 'APPROVED' || n.nominationStatus === 'CONFIRMED').length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    {lang === 'en' ? 'Eligible for official barrier draw' : 'Đủ điều kiện bốc thăm xuất phát'}
                  </div>
                </div>

                <div className="facility-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>
                    {lang === 'en' ? 'MORE TRAINING REQUIRED' : 'YÊU CẦU RÈN THÊM'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#EF4444', margin: '6px 0 2px' }}>
                    {nominations.filter(n => n.nominationStatus === 'REJECTED').length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    {lang === 'en' ? 'Pending stamina adjustments' : 'Chưa đạt chuẩn nhịp tim hoặc cự ly'}
                  </div>
                </div>
              </div>

              {/* FILTER BAR & SEARCH */}
              <div className="portal-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div className="portal-filter-pills">
                  <button
                    className={`portal-pill-btn ${approvalFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setApprovalFilter('ALL')}
                  >
                    {lang === 'en' ? 'All' : 'Tất cả'} <span className="pill-count">{nominations.length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${approvalFilter === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setApprovalFilter('PENDING')}
                  >
                    {lang === 'en' ? 'Pending' : 'Chờ HLV duyệt'} <span className="pill-count" style={{ background: 'var(--brass)', color: '#0A0D14' }}>{pendingCount}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${approvalFilter === 'APPROVED' ? 'active' : ''}`}
                    onClick={() => setApprovalFilter('APPROVED')}
                  >
                    {lang === 'en' ? 'Approved' : 'Đã duyệt'} <span className="pill-count">{nominations.filter(n => n.nominationStatus === 'APPROVED' || n.nominationStatus === 'CONFIRMED').length}</span>
                  </button>
                  <button
                    className={`portal-pill-btn ${approvalFilter === 'REJECTED' ? 'active' : ''}`}
                    onClick={() => setApprovalFilter('REJECTED')}
                  >
                    {lang === 'en' ? 'More Training' : 'Yêu cầu rèn thêm'} <span className="pill-count">{nominations.filter(n => n.nominationStatus === 'REJECTED').length}</span>
                  </button>
                </div>

                <div style={{ minWidth: '240px' }}>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Search by horse or owner...' : 'Tìm kiếm theo tên ngựa, chủ ngựa...'}
                    value={approvalSearch}
                    onChange={(e) => setApprovalSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* LIST OF NOMINATIONS */}
              {(() => {
                const filtered = nominations.filter(item => {
                  const isPending = item.nominationStatus === 'PENDING_TRAINER' || item.nominationStatus === 'PENDING';
                  const isApproved = item.nominationStatus === 'APPROVED' || item.nominationStatus === 'CONFIRMED';
                  const isRejected = item.nominationStatus === 'REJECTED';

                  if (approvalFilter === 'PENDING' && !isPending) return false;
                  if (approvalFilter === 'APPROVED' && !isApproved) return false;
                  if (approvalFilter === 'REJECTED' && !isRejected) return false;

                  if (approvalSearch.trim()) {
                    const q = approvalSearch.toLowerCase();
                    const matchHorse = (item.horseName || '').toLowerCase().includes(q);
                    const matchOwner = (item.ownerName || '').toLowerCase().includes(q);
                    const matchRace = (item.raceName || '').toLowerCase().includes(q);
                    return matchHorse || matchOwner || matchRace;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="facility-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                        <IconTrophy size={36} color="var(--paper-dim)" />
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)' }}>
                        {lang === 'en' ? 'No tournament nominations found' : 'Không tìm thấy hồ sơ đăng ký thi đấu nào'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                        {lang === 'en' ? 'Adjust your filter or wait for horse owners to submit new race entries.' : 'Hãy thay đổi bộ lọc hoặc chờ Chủ sở hữu ngựa nộp hồ sơ thi đấu mới.'}
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filtered.map(nom => {
                      const isPending = nom.nominationStatus === 'PENDING_TRAINER' || nom.nominationStatus === 'PENDING';
                      const isApproved = nom.nominationStatus === 'APPROVED' || nom.nominationStatus === 'CONFIRMED';
                      const isRejected = nom.nominationStatus === 'REJECTED';

                      const matchedHorse = trainerHorses.find(h => (nom.horseName || '').toLowerCase().includes((h.name || '').toLowerCase())) || trainerHorses[0];

                      return (
                        <div
                          key={nom.id}
                          className="facility-card"
                          style={{
                            padding: '24px',
                            border: isApproved 
                              ? '1px solid rgba(16, 185, 129, 0.4)' 
                              : isRejected 
                              ? '1px solid rgba(239, 68, 68, 0.4)' 
                              : '1px solid var(--brass)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--paper)' }}>
                                  {nom.raceName}
                                </span>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--line)',
                                  color: 'var(--brass)',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}>
                                  Mã: {nom.id}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                                {nom.track} · Cự ly: <b style={{ color: 'var(--paper)' }}>{nom.distance}</b> · Ngày đua: <b style={{ color: 'var(--brass)' }}>{nom.date}</b>
                              </div>
                            </div>

                            <span style={{
                              padding: '5px 14px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              letterSpacing: '0.03em',
                              background: isApproved 
                                ? 'rgba(16, 185, 129, 0.15)' 
                                : isRejected
                                ? 'rgba(239, 68, 68, 0.15)'
                                : nom.delegatedToTrainer && !nom.trainerAssigned
                                ? 'rgba(212, 175, 55, 0.25)'
                                : 'rgba(212, 175, 55, 0.15)',
                              color: isApproved 
                                ? '#10B981' 
                                : isRejected
                                ? '#EF4444'
                                : 'var(--brass)',
                              border: `1px solid ${isApproved ? '#10B981' : isRejected ? '#EF4444' : 'var(--brass)'}`
                            }}>
                              {isApproved 
                                ? (nom.trainerAssigned ? '✓ HLV ĐÃ CHỈ ĐỊNH CHIẾN MÃ' : '✓ HLV ĐÃ PHÊ DUYỆT XUẤT PHÁT') 
                                : isRejected
                                ? '✗ HLV YÊU CẦU RÈN THÊM'
                                : nom.delegatedToTrainer && !nom.trainerAssigned
                                ? '🎯 CHỦ NGỰA NHỜ HLV CHỈ ĐỊNH'
                                : '⏳ CHỜ HLV TRƯỞNG PHÊ DUYỆT'}
                            </span>
                          </div>

                          {/* THÔNG BÁO ỦY QUYỀN CHỌN NGỰA TỪ CHỦ SỞ HỮU */}
                          {nom.delegatedToTrainer && !nom.trainerAssigned && (
                            <div style={{
                              background: 'rgba(212, 175, 55, 0.1)',
                              border: '1.5px dashed var(--brass)',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              marginBottom: '14px',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div>
                                <div style={{ color: 'var(--brass)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>🎯</span> YÊU CẦU ỦY THÁC CHỈ ĐỊNH CHIẾN MÃ TỪ CHỦ SỞ HỮU
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '3px' }}>
                                  Chủ sở hữu <b>{nom.ownerName}</b> đã nhờ bạn đánh giá phong độ thể lực để chỉ định chiến mã tối ưu nhất cho cự ly <b>{nom.distance}</b> tại <b>{nom.track}</b>.
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignHorseModal(nom)}
                                style={{
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  fontWeight: 800,
                                  padding: '8px 18px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  fontSize: '12.5px',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.35)'
                                }}
                              >
                                🎯 Chọn & Chỉ Định Ngựa Ngay →
                              </button>
                            </div>
                          )}

                          {/* GRID THÔNG TIN CHIẾN MÃ & CHỦ NGỰA */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                            <div>
                              <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px', marginBottom: '2px' }}>Chiến mã đăng ký:</div>
                              <b style={{ color: 'var(--brass)', fontSize: '15px' }}>{nom.horseName}</b>
                              <span style={{ color: 'var(--paper-dim)', fontSize: '12px' }}> ({matchedHorse?.stall || 'Ô A2'})</span>
                            </div>
                            <div>
                              <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px', marginBottom: '2px' }}>Chủ sở hữu:</div>
                              <b style={{ color: 'var(--paper)' }}>{nom.ownerName || 'Chủ sở hữu'}</b>
                            </div>
                            <div>
                              <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px', marginBottom: '2px' }}>Kỵ mã chỉ định:</div>
                              <b style={{ color: 'var(--paper)' }}>{nom.jockey || 'Chưa chỉ định'}</b>
                            </div>
                            <div>
                              <div style={{ color: 'var(--paper-dim)', fontSize: '11.5px', marginBottom: '2px' }}>Tổng giải thưởng cúp:</div>
                              <b style={{ color: 'var(--brass)' }}>{typeof nom.estimatedPurse === 'number' ? nom.estimatedPurse.toLocaleString('vi-VN') + ' đ' : (nom.estimatedPurse || '800.000.000 đ')}</b>
                            </div>
                          </div>

                          {/* THẨM ĐỊNH THỂ LỰC & CHỈ SỐ SINH TRẮC HỌC TỪ HLV */}
                          <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '14px 16px', marginBottom: '14px', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🔬</span> {lang === 'en' ? 'Biometrics & Fitness Evaluation:' : 'Chỉ số Thể lực & Viễn trắc gần nhất:'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                              <div>
                                <span style={{ color: 'var(--paper-dim)' }}>Nhịp tim tải tập: </span>
                                <b style={{ color: (matchedHorse?.avgHeartRate || 108) > 190 ? '#EF4444' : '#10B981' }}>{matchedHorse?.avgHeartRate || 108} bpm</b>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}> (Ngưỡng: &le; 210)</span>
                              </div>
                              <div>
                                <span style={{ color: 'var(--paper-dim)' }}>Vận tốc max: </span>
                                <b style={{ color: 'var(--brass)' }}>{matchedHorse?.maxSpeed || 68.2} km/h</b>
                              </div>
                              <div>
                                <span style={{ color: 'var(--paper-dim)' }}>Thể trạng chung: </span>
                                <b style={{ color: 'var(--paper)' }}>{matchedHorse?.condition || '96%'}</b>
                              </div>
                              <div>
                                <span style={{ color: 'var(--paper-dim)' }}>Lệnh Khóa Y Tế: </span>
                                <b style={{ color: matchedHorse?.isLockedByVet ? '#EF4444' : '#10B981' }}>
                                  {matchedHorse?.isLockedByVet ? 'Đang Khóa Y Tế' : 'Không có (An toàn)'}
                                </b>
                              </div>
                            </div>
                          </div>

                          {/* GHI CHÚ CHỦ NGỰA & Ý KIẾN HLV */}
                          <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '14px', lineHeight: 1.5 }}>
                            <div><b>Ghi chú từ Chủ ngựa:</b> "{nom.notes || 'Chủ sở hữu đăng ký tham gia thi đấu chính thức.'}"</div>
                            {nom.trainerFeedback && (
                              <div style={{ marginTop: '6px', color: isApproved ? '#10B981' : '#EF4444' }}>
                                <b>Ý kiến phê duyệt của HLV ({nom.reviewedBy || 'Trần Văn Hùng'} - {nom.reviewedAt || 'Gần đây'}):</b> "{nom.trainerFeedback}"
                              </div>
                            )}
                          </div>

                          {/* ACTION BUTTONS */}
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(nom)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    background: 'transparent',
                                    color: '#EF4444',
                                    border: '1px solid #EF4444',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <IconX size={15} color="#EF4444" />
                                  <span>Yêu cầu rèn thêm</span>
                                </button>

                                {nom.delegatedToTrainer && !nom.trainerAssigned ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignHorseModal(nom)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '8px 20px',
                                      background: 'var(--brass)',
                                      color: '#0A0D14',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                                    }}
                                  >
                                    <span>🎯</span>
                                    <span>Đánh giá & Chỉ định chiến mã</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleTrainerApprove(nom)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '8px 20px',
                                      background: 'var(--brass)',
                                      color: '#0A0D14',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                                    }}
                                  >
                                    <IconCheck size={16} color="#0A0D14" />
                                    <span>Phê duyệt đủ điều kiện xuất phát</span>
                                  </button>
                                )}
                              </>
                            )}

                            {isApproved && nom.delegatedToTrainer && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignHorseModal(nom)}
                                style={{
                                  padding: '7px 16px',
                                  background: 'rgba(212, 175, 55, 0.1)',
                                  color: 'var(--brass)',
                                  border: '1px solid var(--brass)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <span>🎯</span> Đổi ngựa chỉ định
                              </button>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(nom)}
                                style={{
                                  padding: '7px 16px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--paper-dim)',
                                  border: '1px solid var(--line)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Thu hồi phê duyệt / Yêu cầu tập thêm
                              </button>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => handleTrainerApprove(nom)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 18px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <IconCheck size={15} color="#0A0D14" />
                                <span>Thẩm định lại & Cấp phép xuất phát</span>
                              </button>
                            )}
                          </div>
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

      {/* ===================== MODAL THÊM GIÁO ÁN MỚI CHUYÊN NGHIỆP, GỌN GÀNG, KHÔNG ICON (THEO MẪU THIẾT KẾ) ===================== */}
      {showAddProgramModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 10, 8, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 999999
        }} onClick={() => setShowAddProgramModal(false)}>
          <div style={{
            background: '#13211b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6)',
            boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{
              margin: '0 0 18px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.2px'
            }}>
              Lập Giáo Án Huấn Luyện Mới
            </h3>

            <form onSubmit={handleCreateProgram} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Tên giáo án
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rèn thể lực cự ly trung bình 1.800m"
                  value={newProgramData.title}
                  onChange={(e) => setNewProgramData({ ...newProgramData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0c1612',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#F1F5F9',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Chọn chiến mã áp dụng
                </label>
                <select
                  value={newProgramData.horseName || (trainerHorses && trainerHorses[0]?.name) || ''}
                  onChange={(e) => setNewProgramData({ ...newProgramData, horseName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0c1612',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#F1F5F9',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  {trainerHorses.map(h => (
                    <option key={h.id || h.microchip} value={h.name}>{h.name} ({h.microchip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Giai đoạn huấn luyện
                </label>
                <select
                  value={newProgramData.phase}
                  onChange={(e) => setNewProgramData({ ...newProgramData, phase: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0c1612',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#F1F5F9',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Nước rút (Sprint - Tốc độ cao)">Nước rút (Sprint - Tốc độ cao)</option>
                  <option value="Thể lực nền (Endurance)">Thể lực nền (Endurance)</option>
                  <option value="Kỹ thuật (Gate & Pace)">Kỹ thuật (Gate & Pace)</option>
                  <option value="Phục hồi (Recovery)">Phục hồi (Recovery)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                    Cự ly mục tiêu (m)
                  </label>
                  <input
                    type="number"
                    required
                    min="200"
                    max="5000"
                    step="50"
                    value={newProgramData.targetDistance}
                    onChange={(e) => setNewProgramData({ ...newProgramData, targetDistance: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#0c1612',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#F1F5F9',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                    Mặt sân tập
                  </label>
                  <select
                    value={newProgramData.surface}
                    onChange={(e) => setNewProgramData({ ...newProgramData, surface: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#0c1612',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#F1F5F9',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="SAND (Sân cát)">SAND (Sân cát)</option>
                    <option value="GRASS (Sân cỏ)">GRASS (Sân cỏ)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  style={{
                    padding: '12px',
                    background: '#1a2922',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProgram}
                  style={{
                    padding: '12px',
                    background: isSubmittingProgram ? '#94A3B8' : '#E86B2C',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    cursor: isSubmittingProgram ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingProgram ? 'Đang lưu...' : 'Lưu Giáo Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL CHẠY BÀI TẬP & ĐÁNH GIÁ GHI CHÚ 2 GIAI ĐOẠN ===================== */}
      {activeRunningSession && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--brass)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            color: 'var(--paper)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.15)'
          }}>

            {/* GIAI ĐOẠN 1: NGỰA ĐANG TRONG THỜI GIAN CHẠY BÀI */}
            {activeRunningSession.phase === 'RUNNING' && (
              <div>
                {/* Header status bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      border: '1px solid #10B981',
                      padding: '6px 14px',
                      borderRadius: '30px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      letterSpacing: '0.5px'
                    }}>
                      <span style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 10px #10B981',
                        animation: 'pulse 1.5s infinite'
                      }} />
                      {lang === 'en' ? 'WORKOUT IN PROGRESS' : 'NGỰA ĐANG TRONG THỜI GIAN CHẠY BÀI'}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveRunningSession(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--paper-dim)',
                      cursor: 'pointer',
                      fontSize: '20px',
                      lineHeight: '1'
                    }}
                    title="Đóng / Hủy"
                  >
                    ✕
                  </button>
                </div>

                {/* Chiến mã & Giáo án Header Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <img
                    src={activeRunningSession.horse.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'}
                    alt={activeRunningSession.horse.name}
                    style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--brass)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
                        {activeRunningSession.horse.name}
                      </h4>
                      <span style={{ fontSize: '12px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brass)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        {activeRunningSession.horse.stall || 'Ô Chuồng A4'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                        Chip: {activeRunningSession.horse.microchip || 'MC-VN-2022-088'}
                      </span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--paper-dim)' }}>
                      Bài tập: <b style={{ color: 'var(--brass)' }}>{activeRunningSession.program.title}</b>
                    </div>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--paper-dim)' }}>
                      <span>Mục tiêu: <b style={{ color: 'var(--paper)' }}>{activeRunningSession.targetDistance} m</b></span>
                      <span>•</span>
                      <span>Mặt sân: <b style={{ color: 'var(--paper)' }}>{activeRunningSession.program.surface}</b></span>
                      <span>•</span>
                      <span>Giai đoạn: <b style={{ color: 'var(--paper)' }}>{activeRunningSession.program.phase}</b></span>
                    </div>
                  </div>
                </div>

                {/* Đồng hồ bấm giờ thực tế (Live Stopwatch) */}
                <div style={{
                  textAlign: 'center',
                  background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 13, 20, 0.6) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '14px',
                  padding: '20px 16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--paper-dim)', marginBottom: '4px', fontWeight: 700 }}>
                    {lang === 'en' ? 'LIVE WORKOUT TIMER' : 'THỜI GIAN CHẠY THỰC TẾ'}
                  </div>
                  <div style={{
                    fontFamily: 'monospace, ui-monospace, Consolas',
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#10B981',
                    letterSpacing: '3px',
                    textShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                  }}>
                    {formatWorkoutTimer(activeRunningSession.elapsedSeconds)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                    Tín hiệu viễn trắc thu nhận trực tiếp từ cảm biến yên cương & định vị GPS
                  </div>
                </div>

                {/* 3 Thẻ Chỉ Số Telemetry Trực Tiếp */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {/* Nhịp tim */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#EF4444', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px' }}>❤️</span>
                      {lang === 'en' ? 'LIVE HEART RATE' : 'NHỊP TIM TỨC THÌ'}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: activeRunningSession.currentHeartRate > 210 ? '#EF4444' : 'var(--paper)' }}>
                      {activeRunningSession.currentHeartRate} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>bpm</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                      {activeRunningSession.currentHeartRate > 210 ? '⚠️ Cảnh báo ngưỡng cao' : 'Ngưỡng Lactate bứt tốc'}
                    </div>
                  </div>

                  {/* Vận tốc */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--brass)', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px' }}>⚡</span>
                      {lang === 'en' ? 'LIVE VELOCITY' : 'VẬN TỐC TỨC THÌ'}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)' }}>
                      {activeRunningSession.currentSpeed} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>km/h</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                      Sải chân duy trì tốc độ cao
                    </div>
                  </div>

                  {/* Quãng đường */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3B82F6', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px' }}>📍</span>
                      {lang === 'en' ? 'DISTANCE' : 'QUÃNG ĐƯỜNG'}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)' }}>
                      {activeRunningSession.currentDistance} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>/ {activeRunningSession.targetDistance} m</span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', height: '6px', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, Math.round((activeRunningSession.currentDistance / activeRunningSession.targetDistance) * 100))}%`,
                        background: '#3B82F6',
                        height: '100%',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Phần dưới: NÚT HOÀN THÀNH BÀI VÀ KHÔNG HOÀN THÀNH BÀI */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                    Xác nhận kết quả chạy bài tập để chuyển sang Đánh giá & Ghi chú chuyên môn:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <button
                      type="button"
                      onClick={() => handleFinishRunningSession(true)}
                      style={{
                        padding: '14px 20px',
                        background: '#10B981',
                        color: '#0A0D14',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {lang === 'en' ? 'Complete Workout' : 'Hoàn thành bài'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFinishRunningSession(false)}
                      style={{
                        padding: '14px 20px',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      {lang === 'en' ? 'Incomplete Workout' : 'Không hoàn thành bài'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GIAI ĐOẠN 2: ĐÁNH GIÁ VÀ GHI CHÚ */}
            {activeRunningSession.phase === 'EVALUATING' && (
              <form onSubmit={handleSaveEvaluatedSession}>
                {/* Header trạng thái sau khi chạy */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeRunningSession.status === 'COMPLETED' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        border: '1px solid #10B981',
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontSize: '13px',
                        fontWeight: 800
                      }}>
                        ✓ ĐÃ HOÀN THÀNH BÀI TẬP
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        border: '1px solid #EF4444',
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontSize: '13px',
                        fontWeight: 800
                      }}>
                        ✕ KHÔNG HOÀN THÀNH BÀI TẬP
                      </span>
                    )}
                    <span style={{ fontSize: '13px', color: 'var(--paper-dim)' }}>
                      Chiến mã: <b style={{ color: 'var(--paper)' }}>{activeRunningSession.horse.name}</b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRunningSession(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--paper-dim)', cursor: 'pointer', fontSize: '20px' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Hộp tổng kết thông số đã ghi nhận */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Thời gian chạy</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                      {activeRunningSession.finalDuration}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Quãng đường</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                      {activeRunningSession.finalDistance} m
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Vận tốc TB</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--paper)', marginTop: '2px' }}>
                      {activeRunningSession.avgSpeed} km/h
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Nhịp tim đỉnh</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: activeRunningSession.maxHeartRate > 210 ? '#EF4444' : 'var(--brass)', marginTop: '2px' }}>
                      {activeRunningSession.maxHeartRate} bpm
                    </div>
                  </div>
                </div>

                {/* Điểm đánh giá */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                      {lang === 'en' ? 'Performance Rating' : 'Điểm đánh giá phong độ (Thang 1.0 - 10.0)'}
                    </label>
                    <span style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--brass)',
                      border: '1px solid var(--brass)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 800
                    }}>
                      {activeRunningSession.score} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={activeRunningSession.score}
                    onChange={(e) => setActiveRunningSession({ ...activeRunningSession, score: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--brass)', cursor: 'pointer' }}
                  />
                </div>

                {/* Textarea 1: Đánh giá của Huấn luyện viên */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--paper)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    📝 {lang === 'en' ? 'Trainer Field Evaluation' : 'Đánh giá chuyên môn của Huấn luyện viên'}
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ghi nhận xét chi tiết về sức rướn, phong độ bứt tốc, độ bền sải chân, hoặc nguyên nhân nếu chưa hoàn thành..."
                    value={activeRunningSession.evaluation}
                    onChange={(e) => setActiveRunningSession({ ...activeRunningSession, evaluation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Textarea 2: Ghi chú phục hồi & Dặn dò thú y / groom */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--paper)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    🧊 {lang === 'en' ? 'Recovery Notes & Stable Directions' : 'Ghi chú & Dặn dò phục hồi chuồng trại / Thú y'}
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Dặn dò chuyên viên Groom và Bác sĩ Thú y: chườm lạnh gân cơ, ngâm chân, điện giải, dinh dưỡng yến mạch hoặc theo dõi hạ nhịp tim..."
                    value={activeRunningSession.recoveryNotes}
                    onChange={(e) => setActiveRunningSession({ ...activeRunningSession, recoveryNotes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Bottom Action buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveRunningSession(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'en' ? 'Cancel' : 'Hủy bỏ'}
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: 'var(--brass)',
                      border: 'none',
                      color: '#14100A',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {lang === 'en' ? 'Save Review & Update Fitness' : 'Lưu Đánh Giá & Cập Nhật Thể Lực'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ===================== MODAL ĐÁNH GIÁ ĐIỂM & GHI CHÚ BÀI TẬP ===================== */}
      {showEditFeedbackModal && selectedSession && (
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
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            color: 'var(--paper)',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: 'var(--paper)' }}>
                  {lang === 'en' ? 'Performance Review & Coaching Notes' : 'Đánh Giá & Ghi Chú Bài Tập'}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                  {lang === 'en' ? 'Runner:' : 'Chiến mã:'} <b style={{ color: 'var(--paper)' }}>{selectedSession.horseName}</b> • {selectedSession.time}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditFeedbackModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px', color: 'var(--paper-dim)', border: '1px solid var(--line)' }}>
              <div>{lang === 'en' ? 'Curriculum:' : 'Giáo án:'} <b style={{ color: 'var(--paper)' }}>{selectedSession.programTitle}</b></div>
              <div style={{ marginTop: '3px' }}>
                {lang === 'en' ? 'Distance:' : 'Cự ly:'} <b style={{ color: 'var(--paper)' }}>{selectedSession.distanceRun}m</b> • {lang === 'en' ? 'Velocity:' : 'Vận tốc:'} <b style={{ color: 'var(--paper)' }}>{selectedSession.avgSpeed} km/h</b> • {lang === 'en' ? 'HR:' : 'Tim:'} <b style={{ color: selectedSession.isOverLimit ? 'var(--brass)' : 'var(--paper)' }}>{selectedSession.maxHeartRate} bpm</b>
              </div>
            </div>

            <form onSubmit={handleUpdateFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  {lang === 'en' ? '1. Confirm Workout Completion:' : '1. Xác nhận hoàn thành bài tập:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSession({ ...selectedSession, status: 'COMPLETED' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedSession.status === 'COMPLETED' ? '1px solid var(--brass)' : '1px solid var(--line)',
                      background: selectedSession.status === 'COMPLETED' ? 'rgba(201, 162, 39, 0.12)' : 'var(--bg-secondary)',
                      color: selectedSession.status === 'COMPLETED' ? 'var(--brass)' : 'var(--paper-dim)',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{lang === 'en' ? 'Completed' : 'Hoàn thành bài tập'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSession({ ...selectedSession, status: 'INCOMPLETE' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedSession.status === 'INCOMPLETE' ? '1px solid var(--brass)' : '1px solid var(--line)',
                      background: selectedSession.status === 'INCOMPLETE' ? 'rgba(201, 162, 39, 0.12)' : 'var(--bg-secondary)',
                      color: selectedSession.status === 'INCOMPLETE' ? 'var(--brass)' : 'var(--paper-dim)',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{lang === 'en' ? 'Incomplete' : 'Không hoàn thành'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', fontWeight: 600 }}>
                    {lang === 'en' ? '2. Grade Performance (1.0 - 10.0 scale):' : '2. Chấm điểm đánh giá (Thang 1.0 - 10.0):'}
                  </label>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brass)' }}>
                    {selectedSession.score || 8.0}/10
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  required
                  value={selectedSession.score || ''}
                  onChange={(e) => setSelectedSession({ ...selectedSession, score: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[5.0, 6.0, 7.0, 8.0, 8.5, 9.0, 9.5, 10.0].map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setSelectedSession({ ...selectedSession, score: pt })}
                      style={{
                        padding: '4px 9px',
                        background: selectedSession.score === pt ? 'var(--brass)' : 'var(--bg-secondary)',
                        color: selectedSession.score === pt ? '#14100A' : 'var(--paper)',
                        border: selectedSession.score === pt ? '1px solid var(--brass)' : '1px solid var(--line)',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  {lang === 'en' ? '3. Coaching Remarks & Observations:' : '3. Ghi chú bài tập & Nhận xét của HLV:'}
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder={lang === 'en' ? 'Log detailed observations...' : 'Ghi nhận xét chi tiết...'}
                  value={selectedSession.feedback || ''}
                  onChange={(e) => setSelectedSession({ ...selectedSession, feedback: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditFeedbackModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Save Review & Notes' : 'Lưu Đánh Giá & Ghi Chú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL YÊU CẦU RÈN THÊM / TỪ CHỐI ===================== */}
      {rejectModalData.isOpen && rejectModalData.item && (
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
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            color: 'var(--paper)',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--paper)' }}>
              {lang === 'en' ? 'Require Additional Conditioning / Reject Entry' : 'Yêu Cầu Rèn Thêm / Chưa Cấp Phép Thi Đấu'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', marginBottom: '16px', lineHeight: 1.5 }}>
              Chiến mã: <b style={{ color: 'var(--brass)' }}>{rejectModalData.item.horseName}</b> · Giải: <b style={{ color: 'var(--paper)' }}>{rejectModalData.item.raceName}</b>
            </p>

            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Nhận xét chuyên môn & Lý do của Huấn luyện viên trưởng:
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Ghi rõ lý do thể lực chưa đạt (ví dụ: nhịp tim phục hồi cao, cần tăng thêm bài chạy 2.000m sân cát)..."
                  value={rejectModalData.reason}
                  onChange={(e) => setRejectModalData({ ...rejectModalData, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* GỢI Ý LÝ DO NHANH */}
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '6px' }}>Gợi ý lý do chuyên môn nhanh:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Nhịp tim phục hồi sau cự ly 1.800m còn cao (> 190 bpm).',
                    'Cần bổ sung thêm 2 tuần rèn sức bền nền trên sân cát.',
                    'Phong độ nước rút cuối chưa ổn định, cần rèn kỹ thuật bứt tốc.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectModalData({ ...rejectModalData, reason: preset })}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper-dim)',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalData({ isOpen: false, item: null, reason: '' })}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: '#EF4444', border: 'none', color: '#ffffff', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Xác nhận yêu cầu rèn thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL HLV CHỈ ĐỊNH CHIẾN MÃ CHO GIẢI ĐẤU (KHI ĐƯỢC CHỦ NGỰA ỦY THÁC) */}
      {/* ========================================================================= */}
      {assignHorseModalData && (
        <div className="modal-overlay" onClick={() => setAssignHorseModalData(null)} style={{ zIndex: 9999999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              maxWidth: '640px',
              width: '95%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px 26px',
              border: '1.5px solid var(--brass)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🎯</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--brass)' }}>
                  HLV Chỉ Định Chiến Mã Cho Giải Đấu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignHorseModalData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Thông tin giải đấu & chủ ngựa */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '12.5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Giải thi đấu:</span>
                <b style={{ color: 'var(--brass)' }}>{assignHorseModalData.nom.raceName}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Cự ly & Mặt sân:</span>
                <b style={{ color: 'var(--paper)' }}>{assignHorseModalData.nom.distance} · {assignHorseModalData.nom.track}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Chủ sở hữu ủy thác:</span>
                <b style={{ color: 'var(--paper)' }}>{assignHorseModalData.nom.ownerName}</b>
              </div>
            </div>

            <form onSubmit={handleConfirmAssignHorse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--paper)', display: 'block', marginBottom: '8px' }}>
                  Chọn chiến mã của chủ sở hữu để chỉ định xuất trận: <span style={{ color: 'var(--brass)' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {assignHorseModalData.availableHorses.map(horse => {
                    const isSelected = String(assignHorseModalData.selectedHorseId) === String(horse.id);
                    const isLocked = horse.isLockedByVet || horse.status === 'RESTRICTED_CARE';
                    return (
                      <div
                        key={horse.id}
                        onClick={() => {
                          if (isLocked) return;
                          const feedback = `HLV Trưởng đã thẩm định toàn diện: Chiến mã "${horse.name}" có chỉ số viễn trắc xuất sắc, phong độ 100%, sở trường tối ưu cự ly ${assignHorseModalData.nom.distance} tại ${assignHorseModalData.nom.track}. Chỉ định xuất chiến chính thức!`;
                          setAssignHorseModalData({
                            ...assignHorseModalData,
                            selectedHorseId: horse.id,
                            selectedHorseName: horse.name,
                            feedback
                          });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                          border: `1.5px solid ${isSelected ? 'var(--brass)' : isLocked ? 'rgba(239, 68, 68, 0.3)' : 'var(--line)'}`,
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.6 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="assignedHorse"
                          checked={isSelected}
                          disabled={isLocked}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--brass)', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <b style={{ color: isSelected ? 'var(--brass)' : 'var(--paper)', fontSize: '14px' }}>
                              {horse.name}
                            </b>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isLocked ? '#EF4444' : '#10B981',
                              background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {horse.statusText || (isLocked ? 'Khóa y tế' : 'Đủ chuẩn')}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                            {horse.breed || 'Thoroughbred'} · Vị trí: <b>{horse.stable || horse.stall || 'Ô A2'}</b> · Vận tốc max: <b>{horse.maxSpeed || '68 km/h'}</b>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                  Kỵ mã (Jockey) điều khiển
                </label>
                <select
                  value={assignHorseModalData.jockey}
                  onChange={(e) => setAssignHorseModalData({ ...assignHorseModalData, jockey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontSize: '12.5px'
                  }}
                >
                  <option value="Kỵ mã Nguyễn Văn Tài (Chỉ định số 1)">Kỵ mã Nguyễn Văn Tài (Chỉ định số 1 - Chuyên cự ly dài)</option>
                  <option value="Kỵ mã Trần Quốc Bảo (Chuyên nước rút)">Kỵ mã Trần Quốc Bảo (Chuyên cự ly ngắn & nước rút)</option>
                  <option value="Kỵ mã Lê Anh Khoa (Kinh nghiệm cúp Derby)">Kỵ mã Lê Anh Khoa (Kinh nghiệm cúp Derby)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)', display: 'block', marginBottom: '4px' }}>
                  Lời phê chuyên môn & Nhận định chiến thuật của HLV Trưởng: <span style={{ color: 'var(--brass)' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={assignHorseModalData.feedback}
                  onChange={(e) => setAssignHorseModalData({ ...assignHorseModalData, feedback: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    lineHeight: 1.45,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setAssignHorseModalData(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ✕ Hủy bỏ
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
                    boxShadow: '0 2px 10px rgba(212, 175, 55, 0.35)'
                  }}
                >
                  ✓ Xác Nhận Chỉ Định Chiến Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profile Chiến Mã của Chủ Sở Hữu khi HLV xác nhận */}
      {confirmedHorseModal && (
        <ConfirmedHorseProfileModal
          horse={confirmedHorseModal}
          role="TRAINER"
          onClose={() => setConfirmedHorseModal(null)}
          onConfirmService={(h) => {
            const targetAsgn = h.assignmentData || h;
            handleConfirmTrainerService(targetAsgn);
          }}
          onAction={(h) => {
            setConfirmedHorseModal(null);
            setActiveTab('vitals');
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
          onOpenPedigree={(h) => {
            const full = lookupFullHorseInfo(h.name || h.microchip);
            setSelectedPedigreeHorse(full || h);
          }}
        />
      )}

      {/* Modal Cây Phả Hệ Gia Phả 3 Đời do Chủ sở hữu cung cấp & cập nhật */}
      {selectedPedigreeHorse && (
        <HorsePedigreeViewModal
          horse={selectedPedigreeHorse}
          isOpen={!!selectedPedigreeHorse}
          onClose={() => setSelectedPedigreeHorse(null)}
          onOpenProfile={(h) => {
            const full = lookupFullHorseInfo(h.name || h.microchip);
            setConfirmedHorseModal(full || h);
          }}
        />
      )}

      {/* Modal Đánh Giá Thể Lực & Telemetry Chuyên Sâu EvoLab */}
      {fitnessDetailModalHorse && (
        <RacehorseFitnessDetailModal
          isTrainer={true}
          horse={fitnessDetailModalHorse}
          sessions={sessions}
          onClose={() => setFitnessDetailModalHorse(null)}
          onUpdateHorse={(updatedH) => {
            setTrainerHorses(prev => prev.map(h => (h.microchip === updatedH.microchip || h.id === updatedH.id || (h.name || '').toLowerCase() === (updatedH.name || '').toLowerCase()) ? { ...h, ...updatedH } : h));
          }}
        />
      )}

      {/* Modal Xác Nhận Xóa Giáo Án Huấn Luyện (Thiết Kế Tinh Gọn) */}
      {deleteTargetProgram && (
        <div
          onClick={() => setDeleteTargetProgram(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
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
              background: '#161F1D',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '20px 22px',
              width: '100%',
              maxWidth: '390px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🗑️</span>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: 'var(--paper)' }}>
                  Xóa bài tập?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetProgram(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '2px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa bài tập <b style={{ color: 'var(--brass)' }}>"{deleteTargetProgram.title}"</b> của chiến mã <b style={{ color: 'var(--paper)' }}>{deleteTargetProgram.horseName}</b> khỏi giáo án huấn luyện?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteTargetProgram(null)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper-dim)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProgram}
                style={{
                  padding: '8px 18px',
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)'
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL TIẾP NHẬN & XÁC NHẬN GIỮ CHỖ CHO CHỦ SỞ HỮU ===================== */}
      {selectedJointConfirmModal && (
        <div
          onClick={() => setSelectedJointConfirmModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #121820)',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '14px',
              padding: '22px 24px',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.2)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--line)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', color: '#10B981' }}>✓</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
                  Xác Nhận Buổi Tập & Giữ Chỗ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJointConfirmModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >✕</button>
            </div>

            <form onSubmit={handleConfirmJointSessionSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--paper)' }}>
                    Chiến mã: <span style={{ color: 'var(--brass)' }}>{selectedJointConfirmModal.horseName}</span> · Chủ sở hữu: <b>{selectedJointConfirmModal.ownerName}</b>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                    📅 Khung giờ: <b>{selectedJointConfirmModal.sessionDate} ({selectedJointConfirmModal.sessionTime})</b>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                    🎯 Mục tiêu: {selectedJointConfirmModal.goal}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', fontWeight: 700, marginBottom: '6px' }}>
                    Lời dặn gửi Chủ sở hữu (Chuẩn bị bãi tập, giờ đón tiếp tại khán đài, thiết bị viễn trắc):
                  </label>
                  <textarea
                    rows={3}
                    className="portal-input"
                    value={jointFeedbackInput}
                    onChange={(e) => setJointFeedbackInput(e.target.value)}
                    placeholder="Ví dụ: Đã chuẩn bị cảm biến IoT viễn trắc nhịp tim và bố trí sân cỏ tự nhiên. Hẹn gặp Chủ sở hữu lúc 06:45 tại khán đài A..."
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ fontSize: '11.5px', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  ✓ <b>Chính sách giữ chỗ:</b> Ngay khi bấm xác nhận, khung giờ này sẽ được <b>CHÍNH THỨC GIỮ CHỖ</b> cho Chủ sở hữu {selectedJointConfirmModal.ownerName}. Các chủ sở hữu khác sẽ thấy khung giờ này bị tô đen và không thể đặt trùng.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedJointConfirmModal(null)}
                    style={{
                      padding: '8px 18px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 22px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, var(--brass) 0%, #B89230 100%)',
                      color: '#120E04',
                      fontWeight: 800,
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)'
                    }}
                  >
                    ✓ Xác Nhận & Giữ Chỗ Ngay
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL TỪ CHỐI / ĐỀ XUẤT ĐỔI LỊCH CHO CHỦ SỞ HỮU ===================== */}
      {selectedJointRejectModal && (
        <div
          onClick={() => setSelectedJointRejectModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #121820)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '14px',
              padding: '22px 24px',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.2)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--line)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', color: '#EF4444' }}>✕</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
                  Từ Chối / Đề Xuất Đổi Giờ Tập
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJointRejectModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >✕</button>
            </div>

            <form onSubmit={handleConfirmJointRejectSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Thông tin buổi tập */}
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--paper)' }}>
                    Chiến mã: <span style={{ color: 'var(--brass)' }}>{selectedJointRejectModal.horseName}</span> · Chủ sở hữu: <b>{selectedJointRejectModal.ownerName}</b>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                    📅 Lịch yêu cầu: <b>{selectedJointRejectModal.sessionDate} ({selectedJointRejectModal.sessionTime})</b>
                  </div>
                </div>

                {/* Gợi ý lý do nhanh */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', fontWeight: 600, marginBottom: '6px' }}>
                    Gợi ý lý do nhanh (bấm để chọn):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'Trùng lịch huấn luyện cự ly dài sáng nay, đề xuất chuyển sang 15:00 - 16:00',
                      'Bãi tập đang bảo dưỡng bề mặt cỏ, đề xuất chuyển sang khung giờ chiều',
                      'Chiến mã vừa tập nặng hôm qua, đề xuất dời sang ngày mai để phục hồi cơ',
                      'HLV bận thẩm định giải đấu, đề xuất chuyển sang 16:00 - 17:00'
                    ].map((reasonText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setJointRejectReasonInput(reasonText)}
                        style={{
                          background: jointRejectReasonInput === reasonText ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                          border: jointRejectReasonInput === reasonText ? '1px solid #EF4444' : '1px solid var(--line)',
                          color: jointRejectReasonInput === reasonText ? '#EF4444' : 'var(--paper)',
                          fontSize: '11px',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          lineHeight: 1.3
                        }}
                      >
                        {reasonText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nhập lý do tùy chỉnh */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', fontWeight: 700, marginBottom: '6px' }}>
                    Nội dung phản hồi gửi Chủ sở hữu:
                  </label>
                  <textarea
                    rows={3}
                    className="portal-input"
                    value={jointRejectReasonInput}
                    onChange={(e) => setJointRejectReasonInput(e.target.value)}
                    placeholder="Nhập lý do hoặc hướng dẫn chủ sở hữu chọn khung giờ phù hợp khác..."
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ fontSize: '11px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  ⚠️ Khi gửi phản hồi từ chối, khung giờ này sẽ được giải phóng và thông báo phản hồi sẽ gửi trực tiếp đến Chủ sở hữu {selectedJointRejectModal.ownerName}.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedJointRejectModal(null)}
                    style={{
                      padding: '8px 18px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 22px',
                      borderRadius: '6px',
                      background: '#EF4444',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                    }}
                  >
                    ✕ Gửi Phản Hồi Cho Chủ Sở Hữu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: CHUYỂN GIAO BUỔI TẬP TẠM THỜI (HLV CHÍNH BẬN VIỆC) */}
      {delegateModalSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔄 Chuyển Giao Buổi Tập Tạm Thời
              </h3>
              <button
                type="button"
                onClick={() => setDelegateModalSession(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--paper-dim)', marginTop: 0, marginBottom: '16px', lineHeight: 1.5 }}>
              Khi bạn bận việc đột xuất, hãy chọn Huấn luyện viên đang <b>trống lịch</b> trong khung giờ này và giao <b>bài tập chỉ định</b> để Chủ sở hữu và HLV thay thế tập theo.
            </p>

            <form onSubmit={handleSubmitDelegate}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px' }}>
                <div>🏇 <b>Chiến mã:</b> {delegateModalSession.horseName} (Chủ sở hữu: <b>{delegateModalSession.ownerName}</b>)</div>
                <div style={{ marginTop: '4px' }}>📅 <b>Khung giờ:</b> {delegateModalSession.sessionDate} · {delegateModalSession.sessionTime}</div>
                <div style={{ marginTop: '4px' }}>🎯 <b>Mục tiêu ban đầu:</b> {delegateModalSession.goal}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                  Chọn Huấn Luyện Viên Thay Thế (Kiểm tra theo lịch trống):
                </label>
                <select
                  value={delegateTargetTrainer}
                  onChange={(e) => setDelegateTargetTrainer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '13px'
                  }}
                >
                  {getAvailableSubstituteTrainers(delegateModalSession.sessionDate, delegateModalSession.sessionTime, currentU).map(tr => (
                    <option key={tr.username} value={tr.username} disabled={!tr.isAvailable}>
                      {tr.name}{!tr.isAvailable ? ` (Bận: ${tr.conflictReason || 'Đã kín lịch'})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                  Lý do bận việc / chuyển giao:
                </label>
                <input
                  type="text"
                  value={delegateReason}
                  onChange={(e) => setDelegateReason(e.target.value)}
                  placeholder="Ví dụ: Bận họp chuyên môn đột xuất / Tập huấn trọng tài..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38BDF8', marginBottom: '6px' }}>
                  📋 Bài tập & Giáo án chỉ định (Bắt buộc - HLV thay thế và Chủ sở hữu sẽ tập theo bài này):
                </label>
                <textarea
                  rows={4}
                  value={delegateAssignedWorkout}
                  onChange={(e) => setDelegateAssignedWorkout(e.target.value)}
                  placeholder="Ví dụ: Khởi động đi bộ thả lỏng 15 phút, sau đó phi nước kiệu (Trot) 800m nhịp tim dưới 140 bpm, kết thúc hạ nhiệt chải lông..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDelegateModalSession(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  📤 Gửi Lời Nhờ HLV & Giao Bài Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HLV ĐƯỢC NHỜ XÁC NHẬN TIẾP NHẬN BUỔI TẬP */}
      {substituteConfirmModalSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤝 Xác Nhận Hỗ Trợ Buổi Tập Thay
              </h3>
              <button
                type="button"
                onClick={() => setSubstituteConfirmModalSession(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px' }}>
              <div>🏇 <b>Chiến mã:</b> {substituteConfirmModalSession.horseName} (Chủ sở hữu: <b>{substituteConfirmModalSession.ownerName}</b>)</div>
              <div style={{ marginTop: '4px' }}>📅 <b>Khung giờ:</b> {substituteConfirmModalSession.sessionDate} · {substituteConfirmModalSession.sessionTime}</div>
              <div style={{ marginTop: '4px' }}>👨‍🏫 <b>HLV chính giao việc:</b> {substituteConfirmModalSession.originalTrainerName || substituteConfirmModalSession.trainerName}</div>
              {substituteConfirmModalSession.transferReason && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--paper-dim)' }}>
                  Lý do nhờ: "{substituteConfirmModalSession.transferReason}"
                </div>
              )}
            </div>

            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              borderLeft: '3px solid #38BDF8',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                📋 BÀI TẬP CHỈ ĐỊNH TỪ HLV CHÍNH (BẮT BUỘC TẬP THEO):
              </div>
              <div style={{ fontSize: '13px', color: 'var(--paper)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {substituteConfirmModalSession.assignedWorkout || 'Tập kỹ thuật theo thể trạng chiến mã.'}
              </div>
            </div>

            <form onSubmit={handleSubmitSubstituteConfirm}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                  Lời nhắn / Phản hồi gửi đến Chủ sở hữu & HLV chính:
                </label>
                <textarea
                  rows={3}
                  value={substituteResponseNote}
                  onChange={(e) => setSubstituteResponseNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ fontSize: '11.5px', color: '#10B981', marginBottom: '16px', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '6px' }}>
                📢 Ngay khi bạn bấm xác nhận, hệ thống sẽ tự động gửi thông báo đến <b>Chủ sở hữu {substituteConfirmModalSession.ownerName}</b> để thông báo buổi tập sẽ do bạn ({currentUser?.full_name}) hướng dẫn theo đúng bài tập trên!
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSubstituteConfirmModalSession(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Tiếp Nhận Buổi Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
