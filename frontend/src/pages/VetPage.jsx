// Cổng Bác sĩ Thú y - Racehorse System (VET Portal)
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  getHorsesApi,
  toggleHorseLockApi,
  getVetActiveLocksApi,
  getIncidentsApi,
  updateIncidentStatusApi,
  getVetPrescriptionsApi,
  createVetPrescriptionApi,
  getVetClearanceListApi,
  updateVetClearanceApi,
  getVaccinationSchedulesApi,
  recordVaccinationApi,
  isTestOrMockHorse
} from '../services/api';
import {
  getServiceAssignments,
  confirmServiceAssignment,
  rejectServiceAssignment,
  lookupFullHorseInfo,
  isVetMatch,
  findVetObject
} from '../services/serviceAssignment';
import NotificationBell from '../components/NotificationBell';
import ConfirmedHorseProfileModal from '../components/ConfirmedHorseProfileModal';
import HorsePedigreeViewModal from '../components/HorsePedigreeViewModal';
import { getSystemNotifications, addSystemNotification } from '../services/notificationService';

// Minimalist High-End SVG Icons for Veterinary Medical Portal
const IconHorse = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19l2-7 4-1 3-5h4l-2 5 4 3-1 4-3 1-2 5-3-1-1-4z" />
  </svg>
);

const IconStethoscope = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

const IconAlert = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSyringe = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 2 4 4" />
    <path d="m17 7 3-3" />
    <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
    <path d="m9 11 4 4" />
    <path d="m5 19-3 3" />
    <path d="m14 4 6 6" />
  </svg>
);

const IconClipboardCheck = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

const IconPill = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

// Dữ liệu mẫu y tế khởi tạo mặc định rỗng để người dùng đăng ký mới hoàn toàn
const DEFAULT_SEED_HORSES = [];
const DEFAULT_SEED_INCIDENTS = [];
const DEFAULT_SEED_VACCINES = [];
const DEFAULT_SEED_PRESCRIPTIONS = [];
const DEFAULT_SEED_CLEARANCE = [];

// =========================================================================
// QUY CHUẨN Y KHOA THÚ Y: PHÂN LOẠI & LỊCH TRÌNH VACCINE NGỰA (FEI / AAEP)
// =========================================================================
export const VACCINE_DEFINITIONS = {
  // A. NHÓM VACCINE CỐT LÕI (CORE VACCINES) - BẮT BUỘC
  TETANUS: {
    key: 'TETANUS',
    name: 'Uốn ván (Tetanus)',
    scientificName: 'Clostridium tetani Toxoid',
    category: 'CORE',
    categoryLabel: 'Cốt lõi (Core)',
    primaryDoses: 2,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 12,
    defaultDose: '1.0 ml',
    route: 'Tiêm bắp sâu (IM)',
    scheduleNote: 'Tiêm nhắc lại hằng năm (12 tháng). Tiêm nhắc khẩn cấp khi ngựa có vết thương sâu hoặc rách móng.'
  },
  RABIES: {
    key: 'RABIES',
    name: 'Bệnh dại (Rabies)',
    scientificName: 'Inactivated Rabies Virus',
    category: 'CORE',
    categoryLabel: 'Cốt lõi (Core)',
    primaryDoses: 1,
    primaryIntervalWeeks: 0,
    boosterIntervalMonths: 12,
    defaultDose: '2.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Nhắc lại hằng năm (12 tháng) theo hướng dẫn vaccine quốc tế.'
  },
  ENCEPHALOMYELITIS: {
    key: 'ENCEPHALOMYELITIS',
    name: 'Viêm não ngựa (Equine Encephalomyelitis)',
    scientificName: 'Eastern / Western Encephalomyelitis (EEE/WEE)',
    category: 'CORE',
    categoryLabel: 'Cốt lõi (Core)',
    primaryDoses: 2,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 12,
    defaultDose: '1.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Tiêm nhắc lại hằng năm vào đầu mùa xuân/hạ trước mùa muỗi ở vùng có nguy cơ.'
  },
  WEST_NILE: {
    key: 'WEST_NILE',
    name: 'Virus West Nile (West Nile Virus - WNV)',
    scientificName: 'West Nile Virus Inactivated / Recombinant',
    category: 'CORE',
    categoryLabel: 'Cốt lõi (Core)',
    primaryDoses: 2,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 6,
    defaultDose: '1.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Lịch nhắc lại 4–6 tháng tùy vùng nguy cơ dịch tễ muỗi truyền bệnh và hướng dẫn sản phẩm.'
  },

  // B. NHÓM VACCINE THEO NGUY CƠ (RISK-BASED VACCINES)
  INFLUENZA: {
    key: 'INFLUENZA',
    name: 'Cúm ngựa (Equine Influenza)',
    scientificName: 'Equine Influenza Virus (EIV)',
    category: 'RISK',
    categoryLabel: 'Theo nguy cơ (Risk-based)',
    primaryDoses: 2,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 6,
    defaultDose: '1.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Nhắc lại mỗi 6 tháng cho chiến mã tham gia thi đấu và di chuyển thường xuyên.'
  },
  HERPESVIRUS: {
    key: 'HERPESVIRUS',
    name: 'Viêm mũi phế quản truyền nhiễm (Equine Herpesvirus - EHV-1/EHV-4)',
    scientificName: 'Equine Rhinopneumonitis (EHV-1 / EHV-4)',
    category: 'RISK',
    categoryLabel: 'Theo nguy cơ (Risk-based)',
    primaryDoses: 2,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 6,
    defaultDose: '2.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Phòng ngừa bệnh đường hô hấp và thần kinh EHM. Nhắc lại mỗi 6 tháng.'
  },
  STRANGLES: {
    key: 'STRANGLES',
    name: 'Bệnh viêm hạch hô hấp (Strangles)',
    scientificName: 'Streptococcus equi subspecies equi',
    category: 'RISK',
    categoryLabel: 'Theo nguy cơ (Risk-based)',
    primaryDoses: 3,
    primaryIntervalWeeks: 3,
    boosterIntervalMonths: 6,
    defaultDose: '2.0 ml',
    route: 'Tiêm bắp (IM) / Xịt niêm mạc mũi',
    scheduleNote: 'Liệu trình ban đầu 2–3 mũi cách 3 tuần, sau đó nhắc lại mỗi 6–12 tháng.'
  },
  BOTULISM: {
    key: 'BOTULISM',
    name: 'Ngộ độc Botulinum (Equine Botulism)',
    scientificName: 'Clostridium botulinum Type B Toxoid',
    category: 'RISK',
    categoryLabel: 'Theo nguy cơ (Risk-based)',
    primaryDoses: 3,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 12,
    defaultDose: '2.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Liệu trình ban đầu gồm 3 mũi cách nhau 4 tuần, sau đó chuyển sang nhắc lại hằng năm.'
  },
  POTOMAC_FEVER: {
    key: 'POTOMAC_FEVER',
    name: 'Sốt ngựa Potomac (Potomac Horse Fever - PHF)',
    scientificName: 'Neorickettsia risticii Inactivated',
    category: 'RISK',
    categoryLabel: 'Theo nguy cơ (Risk-based)',
    primaryDoses: 2,
    primaryIntervalWeeks: 4,
    boosterIntervalMonths: 6,
    defaultDose: '1.0 ml',
    route: 'Tiêm bắp (IM)',
    scheduleNote: 'Liệu trình ban đầu 2 mũi cách 3–4 tuần, nhắc lại 6–12 tháng trước mùa côn trùng nước.'
  }
};

// Thứ tự lộ trình tiêm chủng tuần tự chuẩn y khoa (Mũi khởi đầu tiêm Uốn ván trước, cách 1 tháng tiêm tiếp vắc xin kế tiếp)
export const VACCINE_ROADMAP_ORDER = [
  'TETANUS',           // 1. Uốn ván (Khởi đầu bắt buộc đầu tiên)
  'RABIES',            // 2. Bệnh dại (Sau 1 tháng)
  'ENCEPHALOMYELITIS', // 3. Viêm não ngựa (Sau 2 tháng)
  'WEST_NILE',         // 4. Virus West Nile (Sau 3 tháng)
  'INFLUENZA',         // 5. Cúm ngựa (Sau 4 tháng)
  'HERPESVIRUS',       // 6. Viêm mũi phế quản EHV-1/4 (Sau 5 tháng)
  'STRANGLES',         // 7. Viêm hạch hô hấp (Sau 6 tháng)
  'BOTULISM',          // 8. Ngộ độc Botulinum (Sau 7 tháng)
  'POTOMAC_FEVER'      // 9. Sốt ngựa Potomac (Sau 8 tháng)
];

const parseDMY = (str) => {
  if (!str) return null;
  const parts = String(str).split('/');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatDMY = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const calcNextDueDate = (baseDateStr, intervalType, intervalValue) => {
  const base = parseDMY(baseDateStr) || new Date();
  const next = new Date(base.getTime());
  if (intervalType === 'WEEKS') {
    next.setDate(next.getDate() + intervalValue * 7);
  } else if (intervalType === 'MONTHS') {
    next.setMonth(next.getMonth() + intervalValue);
  }
  return formatDMY(next);
};

const evalVaccineAlertStatus = (v) => {
  if (v.lastReaction && v.lastReaction !== 'NONE') {
    return 'ADVERSE_REACTION';
  }
  if (v.isWaitingTurn) {
    return 'WAITING_TURN';
  }
  if (!v.primaryCompleted) {
    return 'INCOMPLETE_PRIMARY';
  }
  if (!v.dueDate) return 'UP_TO_DATE';

  const due = parseDMY(v.dueDate);
  if (!due) return 'UP_TO_DATE';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 14) return 'DUE_SOON';
  return 'UP_TO_DATE';
};

export default function VetPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTab = urlParams.get('tab');
      if (paramTab && ['horses', 'triage', 'vaccines', 'prescriptions'].includes(paramTab)) {
        return paramTab;
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && ['horses', 'triage', 'vaccines', 'prescriptions'].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('matruong_tab_vet');
      return ['horses', 'triage', 'vaccines', 'prescriptions'].includes(saved) ? saved : 'horses';
    } catch {
      return 'horses';
    }
  }); // 'horses' | 'triage' | 'vaccines' | 'prescriptions'

  // Lưu activeTab vào localStorage và URL để khi F5 / refresh vẫn giữ nguyên đúng trang hiện tại
  useEffect(() => {
    try {
      if (activeTab) {
        localStorage.setItem('matruong_tab_vet', activeTab);
        const url = new URL(window.location);
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState({}, '', url);
        }
      }
    } catch {}
  }, [activeTab]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Xác định xem đây có phải là tài khoản Bác sĩ Thú y MỚI ĐƯỢC DUYỆT hay không
  // (Nếu là tài khoản mới, toàn bộ dữ liệu mẫu khởi tạo từ con số 0)
  const isNewAccount = useMemo(() => {
    if (!currentUser) return false;
    const seedUsernames = ['vet_an', 'admin', 'admin_quan', 'trainer_truong', 'groom_nam'];
    const isSeed = seedUsernames.includes(currentUser.username?.toLowerCase()) || currentUser.email === 'vet@matruong.vn';
    return !isSeed && (currentUser.isNewAccount || currentUser.approvedAt || Number(currentUser.user_id) > 6);
  }, [currentUser]);

  // 1. Danh sách chiến mã y tế
  const [horses, setHorses] = useState(() => {
    if (isNewAccount) {
      try {
        const stored = localStorage.getItem(`matruong_vet_horses_${currentUser.user_id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
    return DEFAULT_SEED_HORSES;
  });

  // 2. Danh sách Sự cố y tế lâm sàng (Khởi tạo từ 0 nếu là tài khoản mới)
  const [incidents, setIncidents] = useState(() => {
    if (isNewAccount) {
      try {
        const stored = localStorage.getItem(`matruong_vet_incidents_${currentUser.user_id}`);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            return list.filter(i => {
              const hName = (i.horseName || i.horse || '').toLowerCase();
              const title = (i.title || i.symptoms || '').toLowerCase();
              return !isTestOrMockHorse(hName) && !isTestOrMockHorse(title) && !hName.includes('vui vẻ') && !title.includes('vui vẻ');
            });
          }
        }
      } catch {}
      return [];
    }
    return DEFAULT_SEED_INCIDENTS;
  });

  // 3. Sổ tiêm chủng Vaccine (Theo dõi thời gian thực chuẩn y khoa AAEP/FEI)
  const [vaccines, setVaccines] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_vet_vaccines');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Lịch sử tiêm chủng thực tế (Vaccination History)
  const [vaccinationHistory, setVaccinationHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('matruong_vet_vaccination_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Sub-tab và bộ lọc cho Sổ tiêm chủng (Mặc định là mục Cần Tiêm & Khẩn Cấp)
  const [vaccineSubTab, setVaccineSubTab] = useState('ACTIVE_QUEUE'); // 'ACTIVE_QUEUE' | 'WAITING_QUEUE' | 'CORE' | 'RISK' | 'ALL' | 'HISTORY'
  const [vaccineHorseFilter, setVaccineHorseFilter] = useState('ALL');
  const [vaccineAlertFilter, setVaccineAlertFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'INCOMPLETE_PRIMARY' | 'ADVERSE_REACTION'

  // Modal ghi nhận mũi tiêm thực tế chuẩn y khoa
  const [showRecordVaccineModal, setShowRecordVaccineModal] = useState(false);
  const [recordVaccineForm, setRecordVaccineForm] = useState({
    horseId: '',
    horseName: '',
    stall: '',
    microchip: '',
    vaccineKey: 'TETANUS',
    customVaccineName: '',
    customCategory: 'RISK',
    doseStage: 'PRIMARY_1', // 'PRIMARY_1' | 'PRIMARY_2' | 'PRIMARY_3' | 'BOOSTER' | 'EMERGENCY_BOOSTER'
    administeredDate: formatDMY(new Date()),
    nextDueDate: calcNextDueDate(formatDMY(new Date()), 'MONTHS', 12),
    noNextDue: false,
    batchNumber: 'LOT-TT26-01',
    dose: '1.0 ml',
    route: 'Tiêm bắp sâu (IM)',
    administeredBy: '',
    reaction: 'NONE', // 'NONE' | 'LOCAL_SWELLING' | 'MILD_FEVER' | 'LETHARGY' | 'ANAPHYLAXIS'
    reactionNotes: '',
    notes: ''
  });

  // Đồng bộ Sổ Tiêm Chủng theo thời gian thực và Lộ trình tiêm chủng tuần tự (Sequential Roadmap):
  // 1. Mũi khởi đầu tiêm Uốn ván (Tetanus) trước tiên.
  // 2. Cách 1 tháng tiêm tiếp vắc xin kế tiếp (Bệnh dại, Viêm não, West Nile...).
  // 3. Vắc xin chưa tới lượt sẽ ở bên mục riêng (Lộ trình chờ đến lượt), nhường chỗ cho Vắc xin cần tiêm trước và Vắc xin khẩn cấp / Điều trị.
  useEffect(() => {
    if (!horses || horses.length === 0) return;

    setVaccines(prevList => {
      const updated = [...prevList];
      let hasChanges = false;

      horses.forEach(h => {
        const horseIdStr = String(h.id);
        const horseName = h.name || 'Chiến mã';
        const rawStall = h.stable || h.stall || 'A1';
        const stallClean = rawStall.replace(/^(Ô|Chuồng)\s*/i, '').trim();
        const stallDisplay = `Ô ${stallClean}`;
        const microchip = h.microchip || h.chipId || 'N/A';

        // Lấy toàn bộ lịch sử tiêm của chiến mã này
        const horseAllDoses = (vaccinationHistory || []).filter(hist =>
          (String(hist.horseId) === horseIdStr || hist.horseName?.toLowerCase() === horseName.toLowerCase())
        );

        // Tìm vị trí vaccine chưa hoàn thành liệu trình đầu tiên trong lộ trình
        let firstPendingIdx = -1;
        for (let i = 0; i < VACCINE_ROADMAP_ORDER.length; i++) {
          const rKey = VACCINE_ROADMAP_ORDER[i];
          const rDef = VACCINE_DEFINITIONS[rKey];
          const rDoses = horseAllDoses.filter(d => d.vaccineKey === rKey);
          const rDone = rDoses.length >= (rDef?.primaryDoses || 1);
          if (!rDone) {
            firstPendingIdx = i;
            break;
          }
        }

        Object.keys(VACCINE_DEFINITIONS).forEach(vKey => {
          const def = VACCINE_DEFINITIONS[vKey];
          const existingIdx = updated.findIndex(item => String(item.horseId) === horseIdStr && item.vaccineKey === vKey);

          // Tìm xem ngựa này đã có lịch sử tiêm cho vaccine này chưa
          const horseDoses = horseAllDoses.filter(hist => hist.vaccineKey === vKey);
          const completedCount = horseDoses.length;
          const primaryDone = completedCount >= def.primaryDoses;
          const lastDose = completedCount > 0 ? horseDoses[0] : null;
          const roadmapIdx = VACCINE_ROADMAP_ORDER.indexOf(vKey);

          let targetStage = 'PRIMARY_1';
          let targetStageLabel = 'Mũi 1 khởi đầu';
          let nextDue = formatDMY(new Date());
          let isWaitingTurn = false;
          let isCurrentTurn = false;
          let roadmapNote = def.scheduleNote;

          if (completedCount > 0) {
            // Trường hợp A: Đã tiêm ít nhất 1 mũi của loại này
            if (primaryDone) {
              targetStage = 'BOOSTER';
              targetStageLabel = 'Mũi nhắc lại định kỳ';
              nextDue = calcNextDueDate(lastDose?.administeredDate || formatDMY(new Date()), 'MONTHS', def.boosterIntervalMonths);
              isWaitingTurn = false;
              isCurrentTurn = false;
              roadmapNote = `Đã hoàn tất liệu trình ban đầu (${completedCount}/${def.primaryDoses} mũi). Tiêm nhắc lại hằng năm.`;
            } else {
              targetStage = completedCount === 1 ? 'PRIMARY_2' : 'PRIMARY_3';
              targetStageLabel = `Mũi ${completedCount + 1} khởi đầu`;
              nextDue = calcNextDueDate(lastDose?.administeredDate || formatDMY(new Date()), 'WEEKS', def.primaryIntervalWeeks);
              isWaitingTurn = false;
              isCurrentTurn = true;
              roadmapNote = `Đang trong liệu trình ban đầu (Mũi ${completedCount + 1}/${def.primaryDoses} mũi). Giãn cách ${def.primaryIntervalWeeks} tuần.`;
            }
          } else {
            // Trường hợp B: Chưa từng tiêm mũi nào của loại này
            targetStage = 'PRIMARY_1';
            targetStageLabel = def.primaryDoses > 1 ? 'Mũi 1 khởi đầu' : 'Mũi khởi đầu';

            if (roadmapIdx === 0) {
              // 1. Uốn ván (TETANUS) là vaccine khởi đầu đầu tiên bắt buộc
              isWaitingTurn = false;
              isCurrentTurn = true;
              nextDue = formatDMY(new Date());
              roadmapNote = 'Lộ trình Bước 1/9: Mũi khởi đầu bắt buộc tiêm trước tiên khi ngựa nhập hệ thống.';
            } else if (roadmapIdx > 0) {
              // 2. Các vaccine tiếp theo trong lộ trình (cách 1 tháng sau vaccine trước)
              if (roadmapIdx === firstPendingIdx) {
                // Vaccine này đang đến lượt tiếp theo sau vaccine trước
                const prevKey = VACCINE_ROADMAP_ORDER[roadmapIdx - 1];
                const prevDoses = horseAllDoses.filter(d => d.vaccineKey === prevKey);
                const prevAdminDate = prevDoses[0]?.administeredDate || horseAllDoses[0]?.administeredDate || formatDMY(new Date());

                // Tính hạn kế tiếp = ngày tiêm vaccine trước + 1 tháng (30 ngày)
                const candidateDue = calcNextDueDate(prevAdminDate, 'MONTHS', 1);
                const dueObj = parseDMY(candidateDue);
                const nowObj = new Date();
                nowObj.setHours(0, 0, 0, 0);

                if (dueObj && dueObj <= nowObj) {
                  // Đã đủ 1 tháng -> Đến lượt tiêm ngay!
                  isWaitingTurn = false;
                  isCurrentTurn = true;
                  nextDue = candidateDue;
                  roadmapNote = `Đã đến lượt tiêm (+1 tháng sau mũi ${VACCINE_DEFINITIONS[prevKey]?.name || 'trước'}).`;
                } else {
                  // Chưa đủ 1 tháng -> Chờ theo lộ trình giãn cách 1 tháng
                  isWaitingTurn = true;
                  isCurrentTurn = false;
                  nextDue = candidateDue;
                  roadmapNote = `Chờ đủ 1 tháng sau mũi ${VACCINE_DEFINITIONS[prevKey]?.name || 'Uốn ván'} (Dự kiến: ${candidateDue}).`;
                }
              } else if (firstPendingIdx >= 0 && roadmapIdx > firstPendingIdx) {
                // Vaccine này đứng sau các vaccine đang chờ phía trước
                isWaitingTurn = true;
                isCurrentTurn = false;
                const monthOffset = roadmapIdx - firstPendingIdx;
                nextDue = calcNextDueDate(formatDMY(new Date()), 'MONTHS', monthOffset);
                roadmapNote = `Lộ trình Bước ${roadmapIdx + 1}/9: Dự kiến tiêm sau ${monthOffset} tháng (Giãn cách 1 tháng tuần tự).`;
              } else {
                // Mặc định an toàn
                isWaitingTurn = true;
                isCurrentTurn = false;
                nextDue = calcNextDueDate(formatDMY(new Date()), 'MONTHS', roadmapIdx);
                roadmapNote = `Lộ trình Bước ${roadmapIdx + 1}/9: Chờ đến lượt theo quy chuẩn giãn cách 1 tháng.`;
              }
            }
          }

          const recordData = {
            id: `SCH-${h.id}-${vKey}`,
            horseId: horseIdStr,
            horseName: horseName,
            stall: stallDisplay,
            microchip: microchip,
            vaccineKey: vKey,
            vaccineName: def.name,
            scientificName: def.scientificName,
            category: def.category,
            categoryLabel: def.categoryLabel,
            primaryDosesRequired: def.primaryDoses,
            completedDosesCount: completedCount,
            primaryCompleted: primaryDone,
            currentStage: targetStage,
            currentStageLabel: targetStageLabel,
            dose: def.defaultDose,
            route: def.route,
            lastAdministeredDate: lastDose?.administeredDate || null,
            lastBatchNumber: lastDose?.batchNumber || null,
            lastAdministeredBy: lastDose?.administeredBy || null,
            lastReaction: lastDose?.reaction || 'NONE',
            reactionNotes: lastDose?.reactionNotes || '',
            dueDate: nextDue,
            scheduleNote: roadmapNote,
            isWaitingTurn: isWaitingTurn,
            isCurrentTurn: isCurrentTurn,
            roadmapIndex: roadmapIdx
          };

          recordData.status = evalVaccineAlertStatus(recordData);

          if (existingIdx >= 0) {
            updated[existingIdx] = { ...updated[existingIdx], ...recordData };
          } else {
            updated.push(recordData);
            hasChanges = true;
          }
        });
      });

      if (hasChanges) {
        try {
          localStorage.setItem('matruong_vet_vaccines', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, [horses, vaccinationHistory]);

  // Các danh sách phân loại hàng chờ
  const activeQueueVaccines = useMemo(() => vaccines.filter(v => !v.isWaitingTurn), [vaccines]);
  const waitingQueueVaccines = useMemo(() => vaccines.filter(v => v.isWaitingTurn), [vaccines]);

  // Các cảnh báo tự động về tiêm chủng (Vaccination Alerts - tính trên các mũi cần tiêm/đã tiêm thực tế)
  const overdueVaccines = useMemo(() => vaccines.filter(v => !v.isWaitingTurn && v.status === 'OVERDUE'), [vaccines]);
  const dueSoonVaccines = useMemo(() => vaccines.filter(v => !v.isWaitingTurn && v.status === 'DUE_SOON'), [vaccines]);
  const incompletePrimaryVaccines = useMemo(() => vaccines.filter(v => !v.isWaitingTurn && v.status === 'INCOMPLETE_PRIMARY'), [vaccines]);
  const adverseReactionDoses = useMemo(() => vaccinationHistory.filter(h => h.reaction && h.reaction !== 'NONE'), [vaccinationHistory]);

  const filteredVaccines = useMemo(() => {
    return vaccines.filter(v => {
      // Bộ lọc Sub-Tab
      if (vaccineSubTab === 'ACTIVE_QUEUE' && v.isWaitingTurn) return false;
      if (vaccineSubTab === 'WAITING_QUEUE' && !v.isWaitingTurn) return false;
      if (vaccineSubTab === 'CORE' && v.category !== 'CORE') return false;
      if (vaccineSubTab === 'RISK' && v.category !== 'RISK') return false;

      // Lọc theo chiến mã
      if (vaccineHorseFilter !== 'ALL' && String(v.horseId) !== String(vaccineHorseFilter) && v.horseName !== vaccineHorseFilter) {
        return false;
      }

      // Lọc theo cảnh báo
      if (vaccineAlertFilter === 'OVERDUE' && v.status !== 'OVERDUE') return false;
      if (vaccineAlertFilter === 'DUE_SOON' && v.status !== 'DUE_SOON') return false;
      if (vaccineAlertFilter === 'INCOMPLETE_PRIMARY' && v.status !== 'INCOMPLETE_PRIMARY') return false;
      if (vaccineAlertFilter === 'ADVERSE_REACTION' && v.lastReaction === 'NONE') return false;

      return true;
    });
  }, [vaccines, vaccineSubTab, vaccineHorseFilter, vaccineAlertFilter]);

  const filteredHistory = useMemo(() => {
    return vaccinationHistory.filter(h => {
      if (vaccineHorseFilter !== 'ALL' && String(h.horseId) !== String(vaccineHorseFilter) && h.horseName !== vaccineHorseFilter) {
        return false;
      }
      if (vaccineAlertFilter === 'ADVERSE_REACTION' && (!h.reaction || h.reaction === 'NONE')) {
        return false;
      }
      return true;
    });
  }, [vaccinationHistory, vaccineHorseFilter, vaccineAlertFilter]);

  // 4. Đơn thuốc & Phác đồ điều trị
  const [prescriptions, setPrescriptions] = useState(() => {
    if (isNewAccount) {
      try {
        const stored = localStorage.getItem(`matruong_vet_prescriptions_${currentUser.user_id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
    return DEFAULT_SEED_PRESCRIPTIONS;
  });

  // 5. Cấp chứng nhận y tế thi đấu
  const [raceClearanceList, setRaceClearanceList] = useState(() => {
    if (isNewAccount) {
      try {
        const stored = localStorage.getItem(`matruong_vet_clearance_${currentUser.user_id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
    return DEFAULT_SEED_CLEARANCE;
  });

  // Đồng bộ lưu trữ localStorage theo từng tài khoản mới
  useEffect(() => {
    setHorses(prev => prev.filter(h => h.owner !== 'Phạm Tiến Thành' && h.ownerName !== 'Phạm Tiến Thành'));
    try {
      const managed = localStorage.getItem('matruong_vet_horses_managed');
      if (managed) {
        const parsed = JSON.parse(managed);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(h => h.owner !== 'Phạm Tiến Thành' && h.ownerName !== 'Phạm Tiến Thành');
          localStorage.setItem('matruong_vet_horses_managed', JSON.stringify(filtered));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isNewAccount && currentUser?.user_id) {
      localStorage.setItem(`matruong_vet_incidents_${currentUser.user_id}`, JSON.stringify(incidents));
    }
  }, [incidents, isNewAccount, currentUser]);

  useEffect(() => {
    if (isNewAccount && currentUser?.user_id) {
      localStorage.setItem(`matruong_vet_prescriptions_${currentUser.user_id}`, JSON.stringify(prescriptions));
    }
  }, [prescriptions, isNewAccount, currentUser]);

  useEffect(() => {
    if (isNewAccount && currentUser?.user_id) {
      localStorage.setItem(`matruong_vet_horses_${currentUser.user_id}`, JSON.stringify(horses));
    }
  }, [horses, isNewAccount, currentUser]);

  // Mô phỏng tiếp nhận một ca sự cố lâm sàng mới phát sinh sau khi tài khoản được xác nhận
  const handleSimulateNewIncident = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const newInc = {
      id: `INC-${Date.now().toString().slice(-6)}`,
      stallCode: 'A1',
      horseName: '',
      chipId: '982-000-348-192-001',
      symptoms: ['Thở dốc sau tập tốc độ', 'Nghi ngờ rạn nhẹ móng chân trước'],
      severity: 'HIGH',
      description: `Ca báo cáo sự cố được Groom gửi lên lúc ${timeStr}. Sau bài tập nước rút cự ly 2.000m, chiến mã dậm chân liên tục và thân nhiệt tăng 38.9°C. Cần Bác sĩ Thú y thăm khám trực tiếp tại chuồng.`,
      imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Groom Lê Hoàng Nam (Trực chuồng A)',
      timestamp: timeStr,
      status: 'pending_vet',
      vetDiagnosis: '',
      actionTaken: ''
    };
    setIncidents(prev => [newInc, ...prev]);
    showToast(
      `Đã tiếp nhận ca sự cố lâm sàng mới từ Groom (Mã phiếu: ${newInc.id})!`,
      'TIẾP NHẬN CA LÂM SÀNG MỚI',
      'info'
    );
  };

  // Modal Xử lý ca sự cố
  const [selectedIncidentModal, setSelectedIncidentModal] = useState(null);
  const [incidentActionInput, setIncidentActionInput] = useState('');
  const [incidentDiagnosisInput, setIncidentDiagnosisInput] = useState('');

  // Modal Kê đơn thuốc mới
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [newRxData, setNewRxData] = useState({
    horseName: '',
    stall: 'Ô A3',
    diagnosis: '',
    medication: '',
    dosage: '',
    frequency: '1 lần/ngày',
    restrictions: 'Cấm tập nặng, theo dõi nhiệt độ hàng ngày.'
  });

  // Modal Khóa Y Tế Khẩn Cấp
  const [lockModalTarget, setLockModalTarget] = useState(null);
  const [lockReasonInput, setLockReasonInput] = useState('');

  // Nạp dữ liệu đồng bộ từ API Backend khi khởi động
  useEffect(() => {
    let isMounted = true;
    // Đối với tài khoản mới kích hoạt, bắt đầu từ số 0 (không nạp dữ liệu demo cũ)
    if (isNewAccount) return;

    getHorsesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setHorses(prev => {
          if (!Array.isArray(prev)) return prev;
          const apiMap = new Map(res.data.map(h => [h.id, h]));
          return prev.map(h => {
            const apiHorse = apiMap.get(h.id);
            if (apiHorse) {
              return {
                ...h,
                locked: Boolean(apiHorse.locked),
                status: apiHorse.locked ? 'INJURED' : (h.status || 'ELIGIBLE'),
                statusText: apiHorse.locked ? 'Khóa y tế: Thú y cấm tập' : (h.statusText || 'Khỏe mạnh')
              };
            }
            return h;
          });
        });
      }
    }).catch(() => {});

    getIncidentsApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        const sanitized = res.data.map((item, idx) => ({
          id: item.id || `INC-${1000 + idx}`,
          stallCode: item.stallCode || item.stall || 'A1',
          horseName: item.horseName || item.horse || 'Chiến mã',
          chipId: item.chipId || item.microchip || 'N/A',
          symptoms: Array.isArray(item.symptoms) ? item.symptoms : (typeof item.symptoms === 'string' ? [item.symptoms] : ['Theo dõi thể trạng']),
          severity: item.severity || 'HIGH',
          description: item.description || item.note || 'Báo cáo sự cố cần bác sĩ khám nghiệm.',
          imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80',
          reportedBy: item.reportedBy || 'Groom phụ trách',
          timestamp: item.timestamp || 'Gần đây',
          status: item.status || 'pending_vet',
          vetDiagnosis: item.vetDiagnosis || '',
          actionTaken: item.actionTaken || ''
        }));
        setIncidents(sanitized);
      }
    }).catch(() => {});

    getVetPrescriptionsApi().then(res => {
      if (isMounted && res && Array.isArray(res) && res.length > 0) {
        setPrescriptions(res);
      }
    }).catch(() => {});

    getVetClearanceListApi().then(res => {
      if (isMounted && res && Array.isArray(res) && res.length > 0) {
        setRaceClearanceList(res);
      }
    }).catch(() => {});

    getVaccinationSchedulesApi().then(res => {
      if (isMounted && res && Array.isArray(res) && res.length > 0) {
        setVaccines(res);
      }
    }).catch(() => {});

    getVetActiveLocksApi().catch(() => {});

    return () => { isMounted = false; };
  }, [isNewAccount]);

  // Lắng nghe sự cố y tế lâm sàng thời gian thực từ Groom phát động
  useEffect(() => {
    const handleIncidentsSync = (e) => {
      getIncidentsApi().then(res => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const sanitized = res.data.filter(item => {
            const hName = (item.horseName || item.horse || '').toLowerCase();
            const title = (item.title || item.symptoms || '').toLowerCase();
            const desc = (item.desc || item.description || '').toLowerCase();
            if (isTestOrMockHorse(hName) || isTestOrMockHorse(title)) return false;
            if (hName.includes('vui vẻ') || title.includes('vui vẻ') || desc.includes('vui vẻ')) return false;
            if (item.stall === 'Ô C2' && (hName === '' || hName.includes('vui vẻ'))) return false;
            return true;
          }).map((item, idx) => ({
            id: item.id || `INC-${1000 + idx}`,
            stallCode: item.stallCode || item.stall || 'A1',
            stall: item.stall || `Ô ${item.stallCode || 'A1'}`,
            horseName: item.horseName || item.horse || 'Chiến mã',
            horseId: item.horseId || 'EQ-VN-2026',
            chipId: item.chipId || item.microchip || 'N/A',
            symptoms: Array.isArray(item.symptoms) ? item.symptoms : (typeof item.symptoms === 'string' ? [item.symptoms] : ['Theo dõi thể trạng']),
            severity: item.severity || 'HIGH',
            description: item.desc || item.description || item.note || 'Báo cáo sự cố cần bác sĩ khám nghiệm.',
            vitalSigns: item.vitalSigns || null,
            firstAidActions: item.firstAidActions || [],
            imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80',
            reportedBy: item.reportedBy || 'Groom phụ trách',
            timestamp: item.reportedAt || item.timestamp || 'Vừa xong',
            status: item.status || 'pending_vet',
            vetDiagnosis: item.vetDiagnosis || '',
            actionTaken: item.actionTaken || ''
          }));
          setIncidents(sanitized);

          if (e?.detail && (e.detail.severity || e.detail.horseName)) {
            showToast(
              `Có ca báo động khẩn cấp mới từ Groom: ${e.detail.horseName || 'Chiến mã'} (${e.detail.stall || 'Ô chuồng'}) - ${e.detail.symptoms || 'Cần khám khẩn'}!`,
              'BÁO ĐỘNG SỨC KHỎE',
              'warning'
            );
          }
        }
      }).catch(() => {});
    };

    window.addEventListener('matruong_incidents_updated', handleIncidentsSync);
    window.addEventListener('storage', handleIncidentsSync);
    return () => {
      window.removeEventListener('matruong_incidents_updated', handleIncidentsSync);
      window.removeEventListener('storage', handleIncidentsSync);
    };
  }, []);

  // State: Phân công y tế từ Chủ sở hữu (3 Bác sĩ thú y cố định)
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

  // Lắng nghe khi Chủ sở hữu cập nhật phả hệ chiến mã để đồng bộ thời gian thực
  useEffect(() => {
    const handlePedigreeUpdate = () => {
      setServiceAssignments(getServiceAssignments());
      setConfirmedHorseModal(prev => {
        if (!prev) return null;
        return lookupFullHorseInfo(prev.name || prev.microchip) || prev;
      });
      setSelectedPedigreeHorse(prev => {
        if (!prev) return null;
        return lookupFullHorseInfo(prev.name || prev.microchip) || prev;
      });
    };
    window.addEventListener('matruong_pedigree_updated', handlePedigreeUpdate);
    window.addEventListener('storage', handlePedigreeUpdate);
    return () => {
      window.removeEventListener('matruong_pedigree_updated', handlePedigreeUpdate);
      window.removeEventListener('storage', handlePedigreeUpdate);
    };
  }, []);

  // Lắng nghe sự kiện Chủ sở hữu xóa chiến mã -> Tự động dọn sạch mọi dữ liệu liên quan bên Cổng Thú Y
  useEffect(() => {
    const handleHorsePurged = (e) => {
      const { horseId, horseName, microchip } = e?.detail || {};
      const isMatch = (item) => {
        if (!item) return false;
        if (horseId && (String(item.id) === String(horseId) || String(item.horseId) === String(horseId))) return true;
        if (horseName) {
          const hn = String(horseName).trim().toLowerCase();
          if (item.name && String(item.name).trim().toLowerCase() === hn) return true;
          if (item.horseName && String(item.horseName).trim().toLowerCase() === hn) return true;
          if (item.horse && typeof item.horse === 'string' && item.horse.trim().toLowerCase() === hn) return true;
        }
        if (microchip) {
          const mc = String(microchip).trim().toLowerCase();
          if (item.microchip && String(item.microchip).trim().toLowerCase() === mc) return true;
          if (item.chipId && String(item.chipId).trim().toLowerCase() === mc) return true;
        }
        return false;
      };

      setHorses(prev => prev.filter(h => !isMatch(h)));
      setVaccines(prev => prev.filter(v => !isMatch(v)));
      setVaccinationHistory(prev => prev.filter(vh => !isMatch(vh)));
      setPrescriptions(prev => prev.filter(rx => !isMatch(rx)));
      setIncidents(prev => prev.filter(inc => !isMatch(inc)));
    };

    window.addEventListener('matruong_horse_deleted', handleHorsePurged);
    return () => window.removeEventListener('matruong_horse_deleted', handleHorsePurged);
  }, []);

  // Bộ lọc & Tìm kiếm danh bạ Hồ sơ chiến mã (tab 'horses')
  const [horseSearchTerm, setHorseSearchTerm] = useState('');
  const [horseFilterStatus, setHorseFilterStatus] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'LOCKED'
  const [horseFilterBreed, setHorseFilterBreed] = useState('ALL');

  // Danh sách toàn bộ chiến mã do Chủ sở hữu chỉ định cho Bác sĩ thú y
  const assignedVetHorses = useMemo(() => {
    const isMyVet = (vetUsername, vetName) => isVetMatch(currentUser, vetUsername, vetName);
    const map = new Map();

    // 1. Quét từ bảng phân công dịch vụ serviceAssignments
    (serviceAssignments || []).forEach(asgn => {
      if (!asgn || !asgn.horseName || isTestOrMockHorse(asgn.horseName) || String(asgn.horseName).toLowerCase().includes('vui vẻ')) return;
      if (isMyVet(asgn.vetUsername, asgn.vetName)) {
        const key = (asgn.microchip || asgn.horseName || String(asgn.id)).trim().toLowerCase();
        const full = lookupFullHorseInfo(asgn.horseName || asgn.microchip) || {};
        const stallCode = asgn.stable ? (asgn.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || asgn.stable.split('(')[0].trim()) : (full.stable || 'Ô A1');
        map.set(key, {
          id: full.id || asgn.id || Date.now(),
          name: asgn.horseName,
          microchip: asgn.microchip || full.microchip || 'MC-VN-2026-092',
          stall: stallCode,
          stable: stallCode,
          breed: full.breed || asgn.breed || 'Thoroughbred thuần chủng',
          gender: full.gender || asgn.gender || 'Ngựa đực (Stallion)',
          age: full.age || asgn.age || '3 tuổi',
          owner: asgn.ownerName || full.ownerName || 'Chủ sở hữu',
          ownerName: asgn.ownerName || full.ownerName || 'Chủ sở hữu',
          ownershipShare: full.ownershipShare || asgn.ownershipShare || 100,
          ownershipType: full.ownershipType || asgn.ownershipType || 'Toàn phần',
          status: full.locked ? 'INJURED' : (full.status || 'ELIGIBLE'),
          statusText: full.locked ? 'Khóa y tế: Thú y cấm tập' : (full.statusText || 'Đủ điều kiện thể lực'),
          locked: Boolean(full.locked),
          lockReason: full.lockReason || '',
          restingHeartRate: full.restingHeartRate || '38 bpm',
          tempCelsius: full.tempCelsius || 38.0,
          respirationRate: full.respirationRate || '14 lần/phút',
          lastExamDate: full.lastExamDate || new Date().toLocaleDateString('vi-VN'),
          avatar: full.avatar || asgn.avatar,
          pedigree: full.pedigree || asgn.pedigree,
          vetStatus: asgn.vetStatus || 'PENDING',
          trainerName: asgn.trainerName || full.trainerName || 'Trần Văn Hùng',
          groomName: asgn.groomName || full.groomName || 'Lê Hoàng Nam',
          assignmentData: asgn
        });
      }
    });

    // 2. Quét từ toàn bộ kho ngựa của các Chủ sở hữu trong localStorage (matruong_owner_horses_*)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('matruong_owner_horses_')) {
          if (k.includes('owner_thanh') || k.endsWith('_6') || k.endsWith('_11')) continue;
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach(oh => {
                if (!oh || !oh.name || isTestOrMockHorse(oh.name) || String(oh.name).toLowerCase().includes('vui vẻ')) return;
                const vU = oh.vetUsername;
                const vN = oh.vet || oh.vetName;
                if (isMyVet(vU, vN)) {
                  const key = (oh.microchip || oh.name || String(oh.id)).trim().toLowerCase();
                  if (!map.has(key)) {
                    const full = lookupFullHorseInfo(oh.name || oh.microchip) || oh;
                    const stallCode = oh.stable ? (oh.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || oh.stable.split('(')[0].trim()) : 'Ô A1';
                    map.set(key, {
                      id: oh.id || Date.now(),
                      name: oh.name,
                      microchip: oh.microchip || 'MC-VN-2026-092',
                      stall: stallCode,
                      stable: stallCode,
                      breed: full.breed || oh.breed || 'Thoroughbred thuần chủng',
                      gender: full.gender || oh.gender || 'Ngựa đực (Stallion)',
                      age: full.age || oh.age || '3 tuổi',
                      owner: oh.ownerName || oh.owner || 'Chủ sở hữu',
                      ownerName: oh.ownerName || oh.owner || 'Chủ sở hữu',
                      ownershipShare: full.ownershipShare || oh.ownershipShare || 100,
                      ownershipType: full.ownershipType || oh.ownershipType || 'Toàn phần',
                      status: full.locked ? 'INJURED' : (oh.status || 'ELIGIBLE'),
                      statusText: full.locked ? 'Khóa y tế: Thú y cấm tập' : (oh.statusText || 'Đủ điều kiện thể lực'),
                      locked: Boolean(full.locked || oh.locked),
                      lockReason: full.lockReason || oh.lockReason || '',
                      restingHeartRate: oh.restingHeartRate || '38 bpm',
                      tempCelsius: oh.tempCelsius || 38.0,
                      respirationRate: oh.respirationRate || '14 lần/phút',
                      lastExamDate: oh.lastExamDate || new Date().toLocaleDateString('vi-VN'),
                      avatar: full.avatar || oh.avatar,
                      pedigree: full.pedigree || oh.pedigree,
                      vetStatus: oh.vetStatus || 'PENDING',
                      trainerName: oh.trainer || oh.trainerName || 'Trần Văn Hùng',
                      groomName: oh.groom || oh.groomName || 'Lê Hoàng Nam',
                      assignmentData: oh
                    });
                  }
                }
              });
            }
          }
        }
      }
    } catch {}

    return Array.from(map.values());
  }, [serviceAssignments, currentUser]);

  // Tự động đồng bộ các chiến mã do Chủ sở hữu chỉ định vào danh bạ horses
  useEffect(() => {
    if (assignedVetHorses.length > 0) {
      setHorses(prev => {
        return assignedVetHorses.map(ah => {
          const match = (prev || []).find(p =>
            (p.microchip && ah.microchip && p.microchip.toLowerCase() === ah.microchip.toLowerCase()) ||
            (p.name && ah.name && p.name.toLowerCase() === ah.name.toLowerCase())
          );
          if (match && typeof match.locked === 'boolean') {
            return {
              ...ah,
              locked: match.locked,
              status: match.locked ? 'INJURED' : ah.status,
              statusText: match.locked ? 'Khóa y tế: Thú y cấm tập' : ah.statusText,
              lockReason: match.lockReason || ah.lockReason
            };
          }
          return ah;
        });
      });
    } else {
      setHorses([]);
    }
  }, [assignedVetHorses]);

  const pendingVetAssignments = useMemo(() => {
    return assignedVetHorses.filter(a => a.vetStatus === 'PENDING');
  }, [assignedVetHorses]);

  // Lọc danh sách sự cố y tế chỉ dành cho các chiến mã do Bác sĩ này phụ trách
  const filteredIncidents = useMemo(() => {
    const uName = (currentUser?.username || '').trim().toLowerCase();
    if (uName === 'admin' || uName === 'admin_quan') {
      return (incidents || []).filter(i => {
        const hName = (i.horseName || i.horse || '').toLowerCase();
        return !hName.includes('vui vẻ') && !isTestOrMockHorse(hName);
      });
    }

    const myHorseNames = new Set(assignedVetHorses.map(h => (h.name || '').trim().toLowerCase()));
    const myHorseChips = new Set(assignedVetHorses.map(h => (h.microchip || '').trim().toLowerCase()));

    return (incidents || []).filter(inc => {
      const hName = (inc.horseName || inc.horse || '').trim().toLowerCase();
      const chip = (inc.chipId || inc.microchip || '').trim().toLowerCase();
      if (hName.includes('vui vẻ') || isTestOrMockHorse(hName)) return false;
      return myHorseNames.has(hName) || (chip && myHorseChips.has(chip));
    });
  }, [incidents, assignedVetHorses, currentUser]);

  const breedOptions = useMemo(() => {
    const set = new Set();
    horses.forEach(h => {
      const full = lookupFullHorseInfo(h.name || h.microchip) || h;
      if (full.breed) set.add(full.breed);
      else if (h.breed) set.add(h.breed);
    });
    return Array.from(set);
  }, [horses]);

  const filteredHorseProfiles = useMemo(() => {
    return horses.filter(h => {
      const full = lookupFullHorseInfo(h.name || h.microchip) || h;
      const term = horseSearchTerm.trim().toLowerCase();
      if (term) {
        const matchName = (h.name && h.name.toLowerCase().includes(term));
        const matchChip = (h.microchip && h.microchip.toLowerCase().includes(term));
        const matchOwner = ((h.ownerName || h.owner || full.ownerName || '').toLowerCase().includes(term));
        const matchStall = ((h.stable || full.stable || '').toLowerCase().includes(term));
        const matchBreed = ((h.breed || full.breed || '').toLowerCase().includes(term));
        if (!matchName && !matchChip && !matchOwner && !matchStall && !matchBreed) return false;
      }
      if (horseFilterStatus === 'ELIGIBLE' && (h.locked || h.status === 'INJURED')) return false;
      if (horseFilterStatus === 'LOCKED' && !h.locked && h.status !== 'INJURED') return false;
      if (horseFilterBreed !== 'ALL') {
        const breed = (h.breed || full.breed || '').toLowerCase();
        if (!breed.includes(horseFilterBreed.toLowerCase())) return false;
      }
      return true;
    });
  }, [horses, horseSearchTerm, horseFilterStatus, horseFilterBreed]);

  // Lắng nghe thông báo khi chiến mã bị xóa từ phía Chủ sở hữu
  useEffect(() => {
    const handleNotificationUpdate = () => {
      const list = getSystemNotifications();
      const latest = list[0];
      if (latest && latest.type === 'HORSE_DELETED') {
        const deletedName = (latest.horseName || '').toLowerCase();
        const deletedChip = (latest.microchip || '').toLowerCase();
        setHorses(prev => prev.filter(h => 
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

  const handleConfirmVetService = (asgn) => {
    const vetUser = asgn.vetUsername || currentUser?.username || 'vet_an';
    const updated = confirmServiceAssignment(asgn.horseName || asgn.microchip, 'VET', vetUser);
    setServiceAssignments(updated);

    const fullHorse = lookupFullHorseInfo(asgn.horseName || asgn.microchip);

    // Bổ sung chiến mã vào danh sách hồ sơ y tế nếu chưa có
    setHorses(prev => {
      const exists = prev.some(h => 
        (h.name && h.name.toLowerCase() === fullHorse.name.toLowerCase()) ||
        (h.microchip && fullHorse.microchip && h.microchip.toLowerCase() === fullHorse.microchip.toLowerCase())
      );
      let next;
      if (exists) {
        next = prev.map(h => {
          if ((h.name && h.name.toLowerCase() === fullHorse.name.toLowerCase()) ||
              (h.microchip && fullHorse.microchip && h.microchip.toLowerCase() === fullHorse.microchip.toLowerCase())) {
            return {
              ...h,
              owner: fullHorse.ownerName,
              ownerName: fullHorse.ownerName,
              avatar: fullHorse.avatar || h.avatar,
              breed: fullHorse.breed || h.breed,
              stable: fullHorse.stable || h.stable
            };
          }
          return h;
        });
      } else {
        const stallCode = fullHorse.stable ? (fullHorse.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || fullHorse.stable.split('(')[0].trim()) : 'Ô A1';
        next = [
          {
            id: fullHorse.id || Date.now(),
            microchip: fullHorse.microchip || 'MC-VN-NEW',
            name: fullHorse.name,
            breed: fullHorse.breed || 'Thoroughbred',
            stable: stallCode,
            owner: fullHorse.ownerName || 'Chủ sở hữu',
            ownerName: fullHorse.ownerName || 'Chủ sở hữu',
            status: 'ELIGIBLE',
            statusText: 'Đủ điều kiện thể lực',
            locked: false,
            lockReason: '',
            lastExamDate: new Date().toLocaleDateString('vi-VN'),
            restingHeartRate: '38 bpm',
            tempCelsius: 38.0,
            avatar: fullHorse.avatar
          },
          ...prev
        ];
      }
      try {
        localStorage.setItem('matruong_vet_horses_managed', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Mở popup toàn bộ Profile chi tiết của ngựa chủ sở hữu
    setConfirmedHorseModal(fullHorse);

    showToast(`Đã xác nhận phụ trách y tế chiến mã "${fullHorse.name}" của Chủ sở hữu ${fullHorse.ownerName}!`, 'BÁC SĨ XÁC NHẬN Y TẾ', 'success');
  };

  const handleRejectVetService = (asgn) => {
    const vetUser = currentUser?.username || asgn.vetUsername || 'vet';
    const updated = rejectServiceAssignment(asgn.horseName || asgn.microchip, 'VET', vetUser, 'Bác sĩ Thú y từ chối tiếp nhận');
    setServiceAssignments(updated);
    setHorses(prev => prev.filter(h =>
      (h.name && h.name.toLowerCase() !== (asgn.horseName || '').toLowerCase()) &&
      (!asgn.microchip || !h.microchip || h.microchip.toLowerCase() !== asgn.microchip.toLowerCase())
    ));
    showToast(`Đã từ chối tiếp nhận phục vụ y tế cho chiến mã "${asgn.horseName}"!`, 'TỪ CHỐI TIẾP NHẬN', 'warning');
  };

  // Xử lý Khóa / Mở khóa Y tế (Quyền phủ quyết Y tế - Medical Safety Veto)
  const handleToggleLock = (horse, customReason = '') => {
    const nextLocked = !horse.locked;
    const reason = customReason || (nextLocked ? 'Khám nghiệm Thú y phát hiện dấu hiệu bất thường, kích hoạt phong tỏa y tế!' : '');

    // Đồng bộ với API Backend
    toggleHorseLockApi(horse.id, nextLocked, reason, horse.name).catch(() => {});

    setHorses(prev => {
      const next = prev.map(h => {
        if (h.id === horse.id || (h.name && h.name.toLowerCase() === horse.name.toLowerCase())) {
          return {
            ...h,
            locked: nextLocked,
            lockReason: nextLocked ? reason : '',
            status: nextLocked ? 'INJURED' : 'ELIGIBLE',
            statusText: nextLocked ? 'Khóa y tế Thú y' : 'Đủ điều kiện thi đấu / Tập luyện'
          };
        }
        return h;
      });
      try {
        localStorage.setItem('matruong_vet_horses_managed', JSON.stringify(next));
        if (isNewAccount && currentUser?.user_id) {
          localStorage.setItem(`matruong_vet_horses_${currentUser.user_id}`, JSON.stringify(next));
        }
      } catch {}
      return next;
    });

    // Cập nhật Bảng Khóa Y Tế Toàn Cục (matruong_vet_active_locks) để đồng bộ tuyệt đối tới mọi vai trò
    try {
      const rawActive = localStorage.getItem('matruong_vet_active_locks');
      const activeMap = rawActive ? JSON.parse(rawActive) : {};
      const hNameKey = (horse.name || '').trim().toLowerCase();
      const hChipKey = (horse.microchip || horse.chipId || '').trim().toLowerCase();
      const hIdKey = horse.id ? String(horse.id).trim().toLowerCase() : '';

      const lockEntry = {
        isLocked: nextLocked,
        reason: nextLocked ? reason : '',
        horseName: horse.name,
        microchip: horse.microchip,
        updatedAt: new Date().toISOString(),
        vetName: currentUser?.full_name || 'Bác sĩ Thú y'
      };

      if (hNameKey) activeMap[hNameKey] = lockEntry;
      if (hChipKey) activeMap[hChipKey] = lockEntry;
      if (hIdKey) activeMap[hIdKey] = lockEntry;

      localStorage.setItem('matruong_vet_active_locks', JSON.stringify(activeMap));
    } catch (err) {
      console.error('Error saving matruong_vet_active_locks:', err);
    }

    // Cập nhật trạng thái phê duyệt giải đua tương ứng
    setRaceClearanceList(prev => {
      const next = prev.map(rc => {
        if (rc.horseName.toLowerCase() === horse.name.toLowerCase()) {
          return {
            ...rc,
            vetStatus: nextLocked ? 'REJECTED_INJURY' : 'CLEARED',
            notes: nextLocked ? `LỆNH KHÓA Y TẾ KÍCH HOẠT: ${reason}` : 'Đã được Bác sĩ Thú y gỡ bỏ lệnh khóa, cho phép thi đấu & tập luyện.'
          };
        }
        return rc;
      });
      try {
        localStorage.setItem('matruong_vet_race_clearance', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Đồng bộ trạng thái khóa y tế sang danh sách của HLV & Chủ sở hữu
    try {
      // 1. Huấn luyện viên
      const rawTrainer = localStorage.getItem('matruong_trainer_horses_managed');
      if (rawTrainer) {
        const trHorses = JSON.parse(rawTrainer);
        if (Array.isArray(trHorses)) {
          const updatedTr = trHorses.map(th => {
            if (
              (th.id && String(th.id) === String(horse.id)) ||
              (th.microchip && horse.microchip && th.microchip.toLowerCase() === horse.microchip.toLowerCase()) ||
              (th.name && th.name.toLowerCase() === horse.name.toLowerCase())
            ) {
              return {
                ...th,
                isLockedByVet: nextLocked,
                locked: nextLocked,
                status: nextLocked ? 'INJURED' : 'READY',
                statusText: nextLocked ? 'Khóa tập bởi Thú y' : 'Sẵn sàng thi đấu / Tập luyện',
                vetNotice: nextLocked ? reason : null
              };
            }
            return th;
          });
          localStorage.setItem('matruong_trainer_horses_managed', JSON.stringify(updatedTr));
        }
      }

      // 2. Toàn bộ danh sách của Chủ sở hữu
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('matruong_owner_horses_')) {
          const rawOwn = localStorage.getItem(k);
          if (rawOwn) {
            const ownHorses = JSON.parse(rawOwn);
            if (Array.isArray(ownHorses)) {
              const updatedOwn = ownHorses.map(oh => {
                if (
                  (oh.id && String(oh.id) === String(horse.id)) ||
                  (oh.microchip && horse.microchip && oh.microchip.toLowerCase() === horse.microchip.toLowerCase()) ||
                  (oh.name && oh.name.toLowerCase() === horse.name.toLowerCase())
                ) {
                  return {
                    ...oh,
                    isLockedByVet: nextLocked,
                    locked: nextLocked,
                    lockReason: nextLocked ? reason : '',
                    status: nextLocked ? 'INJURED' : 'ELIGIBLE',
                    statusText: nextLocked ? (reason ? `Khóa y tế: ${reason}` : 'Khóa y tế Thú y') : 'Đủ chuẩn thi đấu'
                  };
                }
                return oh;
              });
              localStorage.setItem(k, JSON.stringify(updatedOwn));
            }
          }
        }
      }

      // 3. Gửi thông báo hệ thống liên thông
      addSystemNotification({
        type: nextLocked ? 'VET_LOCK_ACTIVATED' : 'VET_LOCK_RELEASED',
        title: nextLocked ? 'LỆNH KHÓA Y TẾ THÚ Y ĐÃ KÍCH HOẠT' : 'ĐÃ DỠ BỎ LỆNH KHÓA Y TẾ - CHO PHÉP TẬP TIẾP & THI ĐẤU',
        content: nextLocked
          ? `Bác sĩ Thú y ${currentUser?.full_name || 'Nguyễn An'} đã kích hoạt Lệnh Khóa Y Tế đối với chiến mã "${horse.name}". Chiến mã bị tạm cấm tập luyện & cấm thi đấu. Lý do: "${reason}".`
          : `Bác sĩ Thú y ${currentUser?.full_name || 'Nguyễn An'} đã kiểm tra và dỡ bỏ lệnh phong tỏa y tế cho chiến mã "${horse.name}". Chiến mã đủ điều kiện trở lại tập luyện và thi đấu bình thường!`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        horseName: horse.name,
        microchip: horse.microchip,
        isLocked: nextLocked,
        reason: reason
      });

      window.dispatchEvent(new CustomEvent('matruong_vet_lock_updated', {
        detail: { horseId: horse.id, horseName: horse.name, microchip: horse.microchip, locked: nextLocked, reason }
      }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error broadcasting vet lock:', e);
    }

    showToast(
      nextLocked
        ? `ĐÃ KÍCH HOẠT KHÓA Y TẾ THÚ Y cho chiến mã ${horse.name}! Toàn bộ bài tập và đăng ký thi đấu bị phong tỏa cho đến khi Thú y kiểm tra và dỡ khóa.`
        : `ĐÃ MỞ KHÓA Y TẾ cho ${horse.name}. Bác sĩ Thú y xác nhận chiến mã đủ điều kiện an toàn để trở lại tập luyện và đi thi đấu!`,
      nextLocked ? 'LỆNH KHÓA AN TOÀN Y TẾ' : 'MỞ KHÓA THI ĐẤU & TẬP LUYỆN',
      nextLocked ? 'error' : 'success'
    );

    setLockModalTarget(null);
    setLockReasonInput('');
  };

  // Mở modal xác nhận khóa y tế
  const handleOpenLockModal = (horse) => {
    if (horse.locked) {
      // Đang khóa -> Bấm để mở khóa ngay
      handleToggleLock(horse, '');
    } else {
      setLockModalTarget(horse);
      setLockReasonInput('Đau mỏi cơ gân chân sau tập luyện');
    }
  };

  // Bác sĩ xác nhận tiếp nhận thông tin ca báo động và đang trực tiếp đến chuồng khám
  const handleAcceptIncident = (targetIncident) => {
    const inc = targetIncident || selectedIncidentModal;
    if (!inc) return;

    const vetName = currentUser?.full_name || 'BS. Trần Minh Hoàng';
    const horseName = inc.horseName || 'Chiến mã';
    const stall = inc.stallCode || inc.stall || '';
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - Hôm nay';

    let ownerName = inc.ownerName || '';
    let ownerKey = inc.ownerKey || '';
    try {
      const asgns = JSON.parse(localStorage.getItem('matruong_service_assignments') || '[]');
      const matched = asgns.find(a =>
        (a.horseName && horseName && a.horseName.toLowerCase() === horseName.toLowerCase()) ||
        (a.microchip && inc.horseId && a.microchip === inc.horseId)
      );
      if (matched) {
        if (!ownerName) ownerName = matched.ownerName || '';
        if (!ownerKey) ownerKey = matched.ownerKey || '';
      }
    } catch {}

    const updatedFields = {
      status: 'in_review',
      statusText: 'Bác sĩ Thú y đã tiếp nhận & đang đến ô chuồng',
      acceptedByVet: vetName,
      acceptedAt: nowTimeStr,
      ownerName: ownerName || inc.ownerName || '',
      ownerKey: ownerKey || inc.ownerKey || ''
    };

    setIncidents(prev => prev.map(item => {
      if (item.id === inc.id) {
        return {
          ...item,
          ...updatedFields
        };
      }
      return item;
    }));

    updateIncidentStatusApi(inc.id, updatedFields).catch(() => {});

    try {
      addSystemNotification({
        type: 'INCIDENT_ACCEPTED',
        title: `BÁC SĨ ĐANG ĐẾN KHÁM: ${horseName.toUpperCase()}`,
        message: `${vetName} đã xác nhận tiếp nhận ca báo động ${inc.id} và đang trực tiếp đến ô chuồng ${stall} để thăm khám cho ${horseName}.`,
        horseName: horseName,
        stall: stall,
        ownerKey: ownerKey,
        ownerName: ownerName,
        vetName: vetName,
        incidentId: inc.id,
        recipientRoles: ['GROOM', 'OWNER', 'VET', 'ADMIN', 'ALL']
      });
    } catch {}

    showToast(
      `Đã xác nhận tiếp nhận ca ${inc.id}. Hệ thống đã gửi thông báo đến Groom và Chủ sở hữu (${ownerName || 'Chủ ngựa'})!`,
      'BÁC SĨ ĐANG ĐẾN KHÁM',
      'success'
    );

    if (selectedIncidentModal && selectedIncidentModal.id === inc.id) {
      setSelectedIncidentModal(prev => ({
        ...prev,
        ...updatedFields
      }));
    }
  };

  // Hoàn tất thăm khám, chẩn đoán và ban hành y lệnh phác đồ
  const handleResolveIncident = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedIncidentModal) return;

    const diagnosis = incidentDiagnosisInput || 'Bác sĩ thú y đã trực tiếp thăm khám và kiểm tra thể trạng tại chuồng.';
    const action = incidentActionInput || 'Đã áp dụng phác đồ điều trị, hạ sốt/giảm đau và ổn định thể trạng.';

    setIncidents(prev => prev.map(inc => {
      if (inc.id === selectedIncidentModal.id) {
        return {
          ...inc,
          status: 'resolved',
          vetDiagnosis: diagnosis,
          actionTaken: action
        };
      }
      return inc;
    }));

    updateIncidentStatusApi(selectedIncidentModal.id, {
      status: 'resolved',
      vetDiagnosis: diagnosis,
      actionTaken: action
    }).catch(() => {});

    try {
      addSystemNotification({
        type: 'INCIDENT_RESOLVED',
        title: `KẾT QUẢ THĂM KHÁM: ${selectedIncidentModal.horseName?.toUpperCase()}`,
        message: `BS. ${currentUser?.full_name || 'Bác sĩ Thú y'} đã hoàn tất thăm khám cho ${selectedIncidentModal.horseName}. Chẩn đoán: "${diagnosis}". Phác đồ: "${action}".`,
        horseName: selectedIncidentModal.horseName,
        stall: selectedIncidentModal.stallCode || selectedIncidentModal.stall,
        recipientRoles: ['GROOM', 'OWNER', 'ADMIN', 'ALL']
      });
    } catch {}

    showToast(
      `Đã hoàn tất xử lý & ban hành phác đồ cho ${selectedIncidentModal.horseName}!`,
      'XỬ LÝ LÂM SÀNG THÀNH CÔNG',
      'success'
    );
    setSelectedIncidentModal(null);
    setIncidentDiagnosisInput('');
    setIncidentActionInput('');
  };

  // Đặt nhanh thời gian tiêm lại (Hạn tiêm mũi kế tiếp / Tiêm nhắc)
  const handleQuickSetNextDue = (intervalType, intervalValue) => {
    const baseDate = recordVaccineForm.administeredDate || formatDMY(new Date());
    const nextStr = calcNextDueDate(baseDate, intervalType, intervalValue);
    setRecordVaccineForm(prev => ({
      ...prev,
      nextDueDate: nextStr,
      noNextDue: false
    }));
  };

  // Mở modal ghi nhận mũi tiêm chuẩn y khoa
  const handleOpenRecordVaccine = (scheduleItem = null) => {
    const defaultHorse = scheduleItem
      ? horses.find(h => String(h.id) === String(scheduleItem.horseId)) || { id: scheduleItem.horseId, name: scheduleItem.horseName, stall: scheduleItem.stall, microchip: scheduleItem.microchip }
      : (horses.length > 0 ? horses[0] : null);

    const defaultKey = scheduleItem?.vaccineKey || 'TETANUS';
    const isOther = defaultKey === 'OTHER';
    const def = isOther ? null : (VACCINE_DEFINITIONS[defaultKey] || VACCINE_DEFINITIONS.TETANUS);

    const rawStall = defaultHorse?.stable || defaultHorse?.stall || 'A1';
    const stallClean = rawStall.replace(/^(Ô|Chuồng)\s*/i, '').trim();

    const todayStr = formatDMY(new Date());
    let defaultNextDue = calcNextDueDate(todayStr, 'MONTHS', 12);
    if (def) {
      if (scheduleItem?.currentStage === 'PRIMARY_1' && def.primaryDoses > 1) {
        defaultNextDue = calcNextDueDate(todayStr, 'WEEKS', def.primaryIntervalWeeks || 4);
      } else if (def.boosterIntervalMonths) {
        defaultNextDue = calcNextDueDate(todayStr, 'MONTHS', def.boosterIntervalMonths);
      }
    }

    setRecordVaccineForm({
      horseId: defaultHorse ? String(defaultHorse.id) : '',
      horseName: defaultHorse ? defaultHorse.name : '',
      stall: `Ô ${stallClean}`,
      microchip: defaultHorse ? (defaultHorse.microchip || defaultHorse.chipId || 'N/A') : '',
      vaccineKey: defaultKey,
      customVaccineName: isOther ? (scheduleItem?.vaccineName || '') : '',
      customCategory: 'RISK',
      doseStage: scheduleItem?.currentStage || 'PRIMARY_1',
      administeredDate: todayStr,
      nextDueDate: defaultNextDue,
      noNextDue: false,
      batchNumber: isOther ? `LOT-MED-2026-${Math.floor(10 + Math.random() * 90)}` : `LOT-${defaultKey.slice(0, 3)}-2026-${Math.floor(10 + Math.random() * 90)}`,
      dose: def?.defaultDose || '1.0 ml',
      route: def?.route || 'Tiêm bắp sâu (IM)',
      administeredBy: currentUser?.full_name || 'BS. Trần Minh Hoàng',
      reaction: 'NONE',
      reactionNotes: '',
      notes: ''
    });
    setShowRecordVaccineModal(true);
  };

  // Lưu mũi tiêm thực tế vào lịch sử tiêm chủng và cập nhật thời gian thực
  const handleSaveVaccinationRecord = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!recordVaccineForm.horseId && !recordVaccineForm.horseName) {
      showToast('Vui lòng chọn chiến mã để thực hiện tiêm chủng!', 'THIẾU THÔNG TIN', 'error');
      return;
    }

    const isOther = recordVaccineForm.vaccineKey === 'OTHER';
    if (isOther && !recordVaccineForm.customVaccineName?.trim()) {
      showToast('Vui lòng nhập tên Vaccine / Sinh phẩm điều trị khác!', 'THIẾU TÊN VACCINE', 'error');
      return;
    }

    if (!recordVaccineForm.batchNumber?.trim()) {
      showToast('Vui lòng nhập Số Lô sản xuất (Batch / Lot Number) của vaccine!', 'THIẾU SỐ LÔ', 'error');
      return;
    }

    const def = isOther ? null : (VACCINE_DEFINITIONS[recordVaccineForm.vaccineKey] || VACCINE_DEFINITIONS.TETANUS);
    const vacName = isOther
      ? recordVaccineForm.customVaccineName.trim()
      : def.name;
    const vacCat = isOther ? recordVaccineForm.customCategory : def.category;
    const vacCatLabel = vacCat === 'CORE' ? 'Cốt lõi (Core)' : 'Theo nguy cơ (Risk-based)';
    const nextDueStr = recordVaccineForm.noNextDue ? '' : (recordVaccineForm.nextDueDate?.trim() || '');

    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const recordId = `HIST-${Date.now()}`;

    let stageLabel = 'Mũi 1 khởi đầu';
    if (recordVaccineForm.doseStage === 'PRIMARY_2') stageLabel = 'Mũi 2 khởi đầu';
    else if (recordVaccineForm.doseStage === 'PRIMARY_3') stageLabel = 'Mũi 3 khởi đầu';
    else if (recordVaccineForm.doseStage === 'BOOSTER') stageLabel = 'Mũi nhắc lại định kỳ';
    else if (recordVaccineForm.doseStage === 'EMERGENCY_BOOSTER') stageLabel = 'Tiêm nhắc khẩn cấp vết thương';

    const newHistoryEntry = {
      id: recordId,
      time: nowTimeStr,
      administeredDate: recordVaccineForm.administeredDate || formatDMY(new Date()),
      nextDueDate: nextDueStr,
      horseId: String(recordVaccineForm.horseId),
      horseName: recordVaccineForm.horseName,
      stall: recordVaccineForm.stall,
      microchip: recordVaccineForm.microchip,
      vaccineKey: recordVaccineForm.vaccineKey,
      vaccineName: vacName,
      scientificName: isOther ? 'Sinh phẩm điều trị chuyên biệt' : def.scientificName,
      category: vacCat,
      categoryLabel: vacCatLabel,
      doseStage: recordVaccineForm.doseStage,
      stageLabel: stageLabel,
      batchNumber: recordVaccineForm.batchNumber.trim().toUpperCase(),
      dose: recordVaccineForm.dose || '1.0 ml',
      route: recordVaccineForm.route || 'Tiêm bắp (IM)',
      administeredBy: recordVaccineForm.administeredBy || (currentUser?.full_name || 'Bác sĩ Thú y'),
      reaction: recordVaccineForm.reaction,
      reactionNotes: recordVaccineForm.reactionNotes || '',
      notes: recordVaccineForm.notes || ''
    };

    // 0. Gửi lưu hồ sơ tiêm chủng xuống API Backend
    recordVaccinationApi(newHistoryEntry).catch(err => {
      console.warn('Đồng bộ API mũi tiêm backend cảnh báo:', err);
    });

    // 1. Cập nhật Lịch sử tiêm chủng
    setVaccinationHistory(prev => {
      const updated = [newHistoryEntry, ...prev];
      try {
        localStorage.setItem('matruong_vet_vaccination_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Đồng bộ cập nhật vào Bảng Sổ Lịch Tiêm Chủng (vaccines) theo thời gian thực
    setVaccines(prev => {
      const horseIdStr = String(recordVaccineForm.horseId);
      const vKey = recordVaccineForm.vaccineKey;
      const idx = prev.findIndex(item => String(item.horseId) === horseIdStr && (item.vaccineKey === vKey || (isOther && item.vaccineName === vacName)));

      const updatedRow = {
        id: idx >= 0 ? prev[idx].id : `SCH-${horseIdStr}-${Date.now()}`,
        horseId: horseIdStr,
        horseName: recordVaccineForm.horseName,
        stall: recordVaccineForm.stall,
        microchip: recordVaccineForm.microchip,
        vaccineKey: vKey,
        vaccineName: vacName,
        scientificName: isOther ? 'Sinh phẩm điều trị chuyên biệt' : def.scientificName,
        category: vacCat,
        categoryLabel: vacCatLabel,
        primaryDosesRequired: isOther ? 1 : def.primaryDoses,
        completedDosesCount: (idx >= 0 ? prev[idx].completedDosesCount : 0) + 1,
        primaryCompleted: isOther ? true : ((idx >= 0 ? prev[idx].completedDosesCount + 1 : 1) >= def.primaryDoses),
        currentStage: recordVaccineForm.doseStage,
        currentStageLabel: stageLabel,
        dose: recordVaccineForm.dose,
        route: recordVaccineForm.route,
        lastAdministeredDate: recordVaccineForm.administeredDate || formatDMY(new Date()),
        lastBatchNumber: recordVaccineForm.batchNumber.trim().toUpperCase(),
        lastAdministeredBy: recordVaccineForm.administeredBy || (currentUser?.full_name || 'Bác sĩ Thú y'),
        lastReaction: recordVaccineForm.reaction,
        reactionNotes: recordVaccineForm.reactionNotes || '',
        dueDate: nextDueStr,
        scheduleNote: isOther ? 'Thời gian tiêm lại được Bác sĩ chỉ định theo phác đồ điều trị riêng.' : def.scheduleNote
      };
      updatedRow.status = evalVaccineAlertStatus(updatedRow);

      let nextList = [];
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = updatedRow;
      } else {
        nextList = [updatedRow, ...prev];
      }
      try {
        localStorage.setItem('matruong_vet_vaccines', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    // 3. Gửi thông báo hệ thống trực tiếp cho vai trò Groom
    try {
      addSystemNotification({
        type: 'VACCINE_COMPLETED',
        title: `THÔNG BÁO TIÊM CHỦNG: ${recordVaccineForm.horseName.toUpperCase()} (${recordVaccineForm.stall})`,
        message: `Bác sĩ Thú y (${newHistoryEntry.administeredBy}) đã hoàn tất tiêm vaccine ${vacName} (${stageLabel}, Lô: ${newHistoryEntry.batchNumber}, Liều: ${newHistoryEntry.dose}) cho chiến mã ${recordVaccineForm.horseName}. Dặn dò Groom: "${recordVaccineForm.notes || 'Groom theo dõi sát thân nhiệt và biểu hiện thể trạng tại ô chuồng trong 24 giờ, hạn chế bài tập nặng.'}". Hạn tiêm lại: ${nextDueStr || 'Theo dõi thêm'}.`,
        horseName: recordVaccineForm.horseName,
        stall: recordVaccineForm.stall,
        severity: recordVaccineForm.reaction && recordVaccineForm.reaction !== 'NONE' ? 'HIGH' : 'MEDIUM',
        recipientRoles: ['GROOM']
      });
    } catch (err) {
      console.error('Lỗi phát thông báo tiêm chủng cho Groom:', err);
    }

    // 4. Đồng bộ tạo Y lệnh chăm sóc thú y vào tab Chỉ Định Thú Y của Groom
    try {
      const existingInstRaw = localStorage.getItem('matruong_groom_vet_instructions');
      let currentInst = existingInstRaw ? JSON.parse(existingInstRaw) : [];
      if (!Array.isArray(currentInst)) currentInst = [];

      const newInstruction = {
        id: `ORD-VAC-${Date.now().toString().slice(-4)}`,
        horseName: recordVaccineForm.horseName,
        stall: recordVaccineForm.stall,
        doctor: newHistoryEntry.administeredBy,
        createdDate: newHistoryEntry.administeredDate,
        groomConfirmed: false,
        isLocked: false,
        instructions: [
          `Vaccine đã tiêm: ${vacName} (${stageLabel}) - Số Lô: ${newHistoryEntry.batchNumber}`,
          `Đường tiêm: ${newHistoryEntry.route} · Liều lượng: ${newHistoryEntry.dose}`,
          `Phản ứng sau tiêm: ${recordVaccineForm.reaction === 'NONE' ? 'Bình thường, không có tác dụng phụ' : `Ghi nhận phản ứng: ${recordVaccineForm.reactionNotes || recordVaccineForm.reaction}`}`,
          `Dặn dò Groom chăm sóc: ${recordVaccineForm.notes || 'Theo dõi thân nhiệt tại chuồng trong 24 giờ tới, cho ngựa nghỉ ngơi bài tập nặng.'}`,
          `Hạn tiêm mũi kế tiếp: ${nextDueStr || 'Bác sĩ theo dõi và chỉ định thêm'}`
        ]
      };

      const updatedInst = [newInstruction, ...currentInst];
      localStorage.setItem('matruong_groom_vet_instructions', JSON.stringify(updatedInst));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('matruong_vet_instructions_updated'));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Lỗi lưu y lệnh chăm sóc cho Groom:', err);
    }

    // 5. Phát thông báo khẩn nếu phát hiện phản ứng bất thường
    if (recordVaccineForm.reaction && recordVaccineForm.reaction !== 'NONE') {
      try {
        addSystemNotification({
          type: 'INCIDENT_REPORTED',
          title: `CẢNH BÁO PHẢN ỨNG VACCINE: ${recordVaccineForm.horseName.toUpperCase()}`,
          message: `Chiến mã ${recordVaccineForm.horseName} ghi nhận phản ứng sau tiêm vaccine ${vacName} (Số lô: ${newHistoryEntry.batchNumber}): "${recordVaccineForm.reactionNotes || recordVaccineForm.reaction}". Yêu cầu Bác sĩ và Groom theo dõi sát!`,
          horseName: recordVaccineForm.horseName,
          stall: recordVaccineForm.stall,
          severity: 'HIGH',
          recipientRoles: ['VET', 'GROOM', 'OWNER', 'ADMIN', 'ALL']
        });
      } catch {}
    }

    setShowRecordVaccineModal(false);
    showToast(
      `Đã ghi nhận thành công mũi tiêm ${vacName} cho chiến mã ${recordVaccineForm.horseName}! Thời gian tiêm lại: ${nextDueStr || 'Theo dõi thêm'}.`,
      'TIÊM CHỦNG THÀNH CÔNG',
      'success'
    );
  };

  // Kê đơn thuốc mới
  const handleCreatePrescription = (e) => {
    e.preventDefault();
    const newRx = {
      id: `RX-2026-00${prescriptions.length + 1}`,
      horseName: newRxData.horseName,
      stall: newRxData.stall,
      diagnosis: newRxData.diagnosis || 'Viêm cơ vận động thể thao',
      medications: [
        { name: newRxData.medication || 'Phenylbutazone Gel', dosage: newRxData.dosage || '10ml', frequency: newRxData.frequency }
      ],
      restrictions: newRxData.restrictions,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'ACTIVE'
    };
    const updatedRx = [newRx, ...prescriptions];
    setPrescriptions(updatedRx);
    try {
      localStorage.setItem('matruong_vet_prescriptions', JSON.stringify(updatedRx));
    } catch {}
    createVetPrescriptionApi(newRx).catch(() => {});

    showToast(`Đã xuất đơn thuốc điều trị #${newRx.id} cho ${newRx.horseName}`, 'KÊ ĐƠN THÀNH CÔNG', 'info');
    setShowAddRxModal(false);
    setNewRxData({
      horseName: '',
      stall: 'Ô A3',
      diagnosis: '',
      medication: '',
      dosage: '',
      frequency: '1 lần/ngày',
      restrictions: 'Cấm tập nặng, theo dõi nhiệt độ hàng ngày.'
    });
  };

  // Ký duyệt y tế cho phép thi đấu (Vet Clearance)
  const handleApproveClearance = (item) => {
    setRaceClearanceList(prev => {
      const next = prev.map(rc => {
        if (rc.id === item.id) {
          return {
            ...rc,
            vetStatus: 'CLEARED',
            notes: `Bác sĩ Thú y ${currentUser?.full_name || 'Nguyễn An'} đã ký số xác nhận: Đủ 100% điều kiện y tế thi đấu.`
          };
        }
        return rc;
      });
      try {
        localStorage.setItem('matruong_vet_race_clearance', JSON.stringify(next));
      } catch {}
      return next;
    });
    updateVetClearanceApi({ id: item.id, vetStatus: 'CLEARED' }).catch(() => {});
    showToast(`Đã cấp chứng nhận y tế thi đấu cho chiến mã ${item.horseName}!`, 'VET CLEARANCE APPROVED', 'info');
  };

  // Từ chối tư cách thi đấu do rủi ro chấn thương
  const handleRejectClearance = (item) => {
    setRaceClearanceList(prev => {
      const next = prev.map(rc => {
        if (rc.id === item.id) {
          return {
            ...rc,
            vetStatus: 'REJECTED_INJURY',
            notes: `TỪ CHỐI BỞI BÁC SĨ THÚ Y: Phát hiện rủi ro cơ gân khi gắng sức. Đình chỉ thi đấu giải ${item.raceName}.`
          };
        }
        return rc;
      });
      try {
        localStorage.setItem('matruong_vet_race_clearance', JSON.stringify(next));
      } catch {}
      return next;
    });
    updateVetClearanceApi({ id: item.id, vetStatus: 'REJECTED_INJURY' }).catch(() => {});
    showToast(`Đã bác bỏ tư cách thi đấu của ${item.horseName} để bảo vệ an toàn sinh mạng chiến mã!`, 'VET VETO ACTIVE', 'warning');
  };

  // Bộ lọc danh sách ngựa
  const filteredHorses = useMemo(() => {
    if (!Array.isArray(horses)) return [];
    return horses.filter(h => {
      if (!h) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = String(h.name || '').toLowerCase();
      const microchip = String(h.microchip || h.chipId || '').toLowerCase();
      const stable = String(h.stable || h.stall || '').toLowerCase();
      return name.includes(q) || microchip.includes(q) || stable.includes(q);
    });
  }, [horses, searchQuery]);

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
            <IconStethoscope size={22} color="#14100A" />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>Bác sĩ Thú y (Veterinary)</p>
          </div>
        </div>

        <nav className="portal-nav">
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'horses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('horses'); setSidebarOpen(false); }}
            title="Danh Bạ & Hồ Sơ Y Bạ Toàn Bộ Đàn Chiến Mã"
          >
            <span className="portal-nav-icon"><IconHorse size={18} /></span>
            <span className="portal-nav-label">Hồ sơ chiến mã</span>
            <span className="portal-nav-badge">{horses.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'triage' ? 'active' : ''}`}
            onClick={() => { setActiveTab('triage'); setSidebarOpen(false); }}
            title="Tiếp nhận & Xử lý Sự cố Lâm sàng"
          >
            <span className="portal-nav-icon"><IconAlert size={18} /></span>
            <span className="portal-nav-label">Tiếp nhận sự cố</span>
            {filteredIncidents.filter(i => i.status === 'pending_vet').length > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {filteredIncidents.filter(i => i.status === 'pending_vet').length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'vaccines' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vaccines'); setSidebarOpen(false); }}
            title="Sổ Tiêm Chủng Vaccine & Chăm Sóc Định Kỳ"
          >
            <span className="portal-nav-label">Sổ tiêm chủng</span>
            {(overdueVaccines.length > 0 || adverseReactionDoses.length > 0) ? (
              <span className="portal-nav-badge" style={{ background: '#EF4444', color: '#FFFFFF', fontWeight: 700 }}>
                {overdueVaccines.length + adverseReactionDoses.length}
              </span>
            ) : dueSoonVaccines.length > 0 ? (
              <span className="portal-nav-badge" style={{ background: '#F59E0B', color: '#0A0D14', fontWeight: 700 }}>
                {dueSoonVaccines.length}
              </span>
            ) : (
              <span className="portal-nav-badge">{vaccines.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('prescriptions'); setSidebarOpen(false); }}
            title="Đơn Thuốc & Phác Đồ Điều Trị Lâm Sàng (Rx)"
          >
            <span className="portal-nav-icon"><IconPill size={18} /></span>
            <span className="portal-nav-label">Đơn thuốc & Phác đồ</span>
            <span className="portal-nav-badge">{prescriptions.length}</span>
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
              <IconStethoscope size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>CỔNG BÁC SĨ THÚ Y</span>
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
                  VETERINARY MEDICINE
                </span>
              </h2>
              <div className="portal-page-subtitle">
                Veterinary Clinical Hospital & Equine Healthcare System
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <NotificationBell role="VET" currentUser={currentUser} />
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                BS
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentUser?.full_name || 'Bác sĩ Nguyễn An'}</div>
                <div className="portal-user-role">Bác sĩ Thú y Trưởng khoa</div>
              </div>
            </div>
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
          {/* TAB 0: DANH BẠ & HỒ SƠ CHIẾN MÃ Y TẾ (HORSE PROFILES & MEDICAL RECORDS) */}
          {/* ========================================================================= */}
          {activeTab === 'horses' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '20px' }}>
                <div>
                  <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Hồ Sơ & Danh Bạ Chiến Mã Y Tế</span>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--brass)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      fontWeight: 700
                    }}>
                      {horses.length} Chiến mã
                    </span>
                  </h2>
                  <p className="pane-desc">
                    Quản lý toàn bộ hồ sơ chiến mã do Chủ sở hữu ủy thác: phả hệ 3 đời, chủ sở hữu, thẻ định danh RFID và hồ sơ bệnh án theo dõi thể lực.
                  </p>
                </div>
              </div>

              {/* Bốn thẻ thống kê KPI nhanh - Cân bằng, chuẩn y khoa thể thao, không icon */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid var(--brass)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Tổng Ngựa Phụ Trách
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--brass)', marginTop: '6px', fontFamily: 'var(--display, sans-serif)' }}>
                    {horses.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>chiến mã</span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid #10B981',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Đủ Điều Kiện (FIT)
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', marginTop: '6px', fontFamily: 'var(--display, sans-serif)' }}>
                    {horses.filter(h => !h.locked && h.status !== 'INJURED').length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>sẵn sàng</span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid #EF4444',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Đang Khóa Y Tế (VETO)
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#EF4444', marginTop: '6px', fontFamily: 'var(--display, sans-serif)' }}>
                    {horses.filter(h => h.locked || h.status === 'INJURED').length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>cấm tập</span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid #F59E0B',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Yêu Cầu Chờ Tiếp Nhận
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#F59E0B', marginTop: '6px', fontFamily: 'var(--display, sans-serif)' }}>
                    {pendingVetAssignments.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>yêu cầu</span>
                  </div>
                </div>
              </div>

              {/* Khối Yêu Cầu Chờ Bác Sĩ Xác Nhận nếu có - Thiết kế phẳng, không icon */}
              {pendingVetAssignments.length > 0 && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderLeft: '4px solid #10B981',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Yêu Cầu Chỉ Định Bác Sĩ Thú Y Chờ Xác Nhận ({pendingVetAssignments.length})
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0A0D14', background: '#10B981', padding: '3px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      Cần tiếp nhận
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '10px' }}>
                    {pendingVetAssignments.map(asgn => (
                      <div
                        key={asgn.id || asgn.microchip}
                        style={{
                          background: 'var(--card-inner-bg)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <b style={{ color: 'var(--paper)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {asgn.horseName}
                            </b>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brass)', background: 'rgba(212, 175, 55, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                              {asgn.stable || 'Ô A1'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                const full = lookupFullHorseInfo(asgn.horseName || asgn.microchip);
                                setConfirmedHorseModal(full || asgn);
                              }}
                              style={{
                                color: '#FB923C',
                                background: 'rgba(249, 115, 22, 0.14)',
                                border: '1px solid rgba(249, 115, 22, 0.55)',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Xem hồ sơ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectVetService(asgn)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmVetService(asgn)}
                              style={{
                                background: '#10B981',
                                color: '#0A0D14',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Xác nhận phục vụ
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                          Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{asgn.ownerName || 'Chủ sở hữu'}</b> · Mã RFID: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{asgn.microchip || '--'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thanh Tìm Kiếm & Bộ Lọc Nâng Cao - Cân bằng, chiều cao đồng bộ 38px, không icon */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  minWidth: '260px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  height: '38px',
                  boxSizing: 'border-box'
                }}>
                  <input
                    type="text"
                    value={horseSearchTerm}
                    onChange={(e) => setHorseSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên chiến mã, mã chip RFID, chủ sở hữu, chuồng..."
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--paper)',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                  {horseSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setHorseSearchTerm('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--paper-dim)', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Lọc theo trạng thái */}
                  <div style={{
                    display: 'flex',
                    background: 'var(--surface-subtle)',
                    borderRadius: '6px',
                    padding: '2px',
                    border: '1px solid var(--input-border)',
                    height: '38px',
                    boxSizing: 'border-box',
                    alignItems: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => setHorseFilterStatus('ALL')}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: horseFilterStatus === 'ALL' ? 'var(--brass)' : 'transparent',
                        color: horseFilterStatus === 'ALL' ? '#0A0D14' : 'var(--paper-dim)',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Tất cả ({horses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHorseFilterStatus('ELIGIBLE')}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: horseFilterStatus === 'ELIGIBLE' ? '#10B981' : 'transparent',
                        color: horseFilterStatus === 'ELIGIBLE' ? '#0A0D14' : 'var(--paper-dim)',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Đủ điều kiện ({horses.filter(h => !h.locked && h.status !== 'INJURED').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHorseFilterStatus('LOCKED')}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: horseFilterStatus === 'LOCKED' ? '#EF4444' : 'transparent',
                        color: horseFilterStatus === 'LOCKED' ? '#FFFFFF' : 'var(--paper-dim)',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Khóa y tế ({horses.filter(h => h.locked || h.status === 'INJURED').length})
                    </button>
                  </div>

                  {/* Lọc theo giống - Chiều cao chuẩn 38px, xóa triệt để minHeight 85px */}
                  {breedOptions.length > 0 && (
                    <select
                      value={horseFilterBreed}
                      onChange={(e) => setHorseFilterBreed(e.target.value)}
                      style={{
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="ALL">Tất cả giống loài</option>
                      {breedOptions.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Lưới danh thiếp Hồ Sơ Chiến Mã - Cân bằng, sắc nét, không icon */}
              {filteredHorseProfiles.length === 0 ? (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--line)',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--paper-dim)'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--paper)' }}>
                    Không tìm thấy chiến mã nào phù hợp
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc danh bạ.
                  </div>
                  <button
                    type="button"
                    onClick={() => { setHorseSearchTerm(''); setHorseFilterStatus('ALL'); setHorseFilterBreed('ALL'); }}
                    style={{
                      marginTop: '14px',
                      padding: '7px 16px',
                      borderRadius: '4px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px'
                }}>
                  {filteredHorseProfiles.map(h => {
                    const full = lookupFullHorseInfo(h.name || h.microchip) || h;
                    const defaultAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
                    const avatarSrc = h.avatar || full.avatar || defaultAvatar;
                    const isLocked = Boolean(h.locked || h.status === 'INJURED');

                    return (
                      <div
                        key={h.id || h.microchip}
                        style={{
                          background: 'var(--bg-card)',
                          border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.45)' : 'var(--line)'}`,
                          borderRadius: '8px',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                          gap: '12px'
                        }}
                      >
                        {/* Header của thẻ: Avatar + Tên + Chuồng + Trạng thái */}
                        <div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                            <img
                              src={avatarSrc}
                              alt={h.name}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.5)' : 'var(--line)'}`,
                                background: 'var(--card-inner-bg)',
                                flexShrink: 0
                              }}
                              onError={(e) => { e.target.src = defaultAvatar; }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                  <h3
                                    style={{
                                      margin: 0,
                                      fontSize: '15px',
                                      fontWeight: 800,
                                      color: 'var(--paper)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                    title={h.name}
                                  >
                                    {h.name}
                                  </h3>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'var(--brass)',
                                    background: 'rgba(212, 175, 55, 0.12)',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}>
                                    {h.stable || full.stable || 'Ô A1'}
                                  </span>
                                </div>

                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  letterSpacing: '0.04em',
                                  background: isLocked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                  color: isLocked ? '#EF4444' : '#10B981',
                                  border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
                                }}>
                                  {isLocked ? 'KHÓA Y TẾ' : 'ĐỦ ĐIỀU KIỆN'}
                                </span>
                              </div>

                              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {h.breed || full.breed || 'Thoroughbred'} · {full.gender || 'Ngựa đực'} · {full.age || '3 tuổi'}
                              </div>

                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                Mã Chip RFID: <span style={{ fontFamily: 'monospace', color: 'var(--paper)', fontWeight: 600 }}>{h.microchip || full.microchip || '--'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Thông tin Chủ sở hữu & Tỷ lệ */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11.5px',
                            marginBottom: '8px',
                            padding: '6px 10px',
                            background: 'var(--card-inner-bg)',
                            borderRadius: '4px',
                            border: '1px solid var(--line)'
                          }}>
                            <span>Chủ sở hữu: <b style={{ color: 'var(--brass)', fontWeight: 700 }}>{h.ownerName || h.owner || full.ownerName || 'Chủ sở hữu'}</b></span>
                            <span style={{ color: 'var(--paper)', fontWeight: 600 }}>
                              {full.ownershipShare ? `${full.ownershipShare}%` : '100%'} sở hữu
                            </span>
                          </div>

                          {/* Trạng thái xác nhận phụ trách y tế - KHÔNG ICON */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                            marginBottom: '8px',
                            padding: '5px 10px',
                            background: h.vetStatus === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            borderRadius: '4px',
                            border: `1px solid ${h.vetStatus === 'PENDING' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                          }}>
                            <span style={{
                              color: h.vetStatus === 'PENDING' ? '#F59E0B' : '#10B981',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em'
                            }}>
                              {h.vetStatus === 'PENDING' ? 'Chủ sở hữu chỉ định · Chờ Bác sĩ xác nhận' : 'Đã tiếp nhận phụ trách y tế'}
                            </span>
                            {h.vetStatus === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmVetService(h.assignmentData || h)}
                                style={{
                                  background: '#10B981',
                                  color: '#0A0D14',
                                  border: 'none',
                                  padding: '3px 10px',
                                  borderRadius: '3px',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Xác nhận
                              </button>
                            )}
                          </div>

                          {/* Dòng máu & Phả hệ tóm tắt */}
                          <div style={{
                            background: 'var(--card-inner-bg)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            fontSize: '11.5px',
                            marginBottom: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--paper-dim)' }}>Dòng bố (Sire):</span>
                              <span style={{ color: 'var(--paper)', fontWeight: 600 }}>{full.pedigree?.sire || 'Đang cập nhật'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--paper-dim)' }}>Dòng mẹ (Dam):</span>
                              <span style={{ color: 'var(--paper)', fontWeight: 600 }}>{full.pedigree?.dam || 'Đang cập nhật'}</span>
                            </div>
                          </div>

                          {/* Chỉ số sinh hiệu lâm sàng - 3 cột đều đặn tuyệt đối */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '6px',
                            fontSize: '11px',
                            padding: '6px 8px',
                            background: 'var(--card-inner-bg)',
                            borderRadius: '4px',
                            border: '1px solid var(--line)'
                          }}>
                            <div>
                              <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Thân nhiệt</span>
                              <b style={{ color: 'var(--paper)', fontSize: '12px' }}>{h.tempCelsius ? `${h.tempCelsius}°C` : '38.0°C'}</b>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Nhịp tim</span>
                              <b style={{ color: 'var(--paper)', fontSize: '12px' }}>{h.restingHeartRate || '38 bpm'}</b>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Nhịp thở</span>
                              <b style={{ color: 'var(--paper)', fontSize: '12px' }}>{h.respirationRate || '14 l/p'}</b>
                            </div>
                          </div>
                        </div>

                        {/* Hàng 3 nút thao tác chuẩn - Cân bằng, chiều cao 34px, không icon */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmedHorseModal(full)}
                            style={{
                              height: '34px',
                              padding: '0 8px',
                              borderRadius: '4px',
                              background: 'rgba(249, 115, 22, 0.14)',
                              border: '1px solid rgba(249, 115, 22, 0.55)',
                              color: '#FB923C',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.14)'; }}
                          >
                            Xem hồ sơ
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPedigreeHorse(full)}
                            style={{
                              height: '34px',
                              padding: '0 8px',
                              borderRadius: '4px',
                              background: 'rgba(212, 175, 55, 0.1)',
                              border: '1px solid rgba(212, 175, 55, 0.35)',
                              color: 'var(--brass)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Gia phả hệ
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleLock(h)}
                            style={{
                              height: '34px',
                              padding: '0 8px',
                              borderRadius: '4px',
                              background: isLocked ? 'var(--brass)' : 'transparent',
                              border: isLocked ? '1px solid var(--brass)' : '1px solid rgba(239, 68, 68, 0.45)',
                              color: isLocked ? '#0A0D14' : '#EF4444',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isLocked ? 'Mở khóa' : 'Khóa y tế'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: TRIAGE & TIẾP NHẬN SỰ CỐ KHẨN CẤP */}
          {/* ========================================================================= */}
          {activeTab === 'triage' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Tiếp nhận & Xử lý Sự cố Lâm sàng (Clinical Incident Triage)</h2>
                  <p className="pane-desc">Các ca báo động bất thường từ nhân viên Groom và HLV gửi lên theo thời gian thực.</p>
                </div>
                {isNewAccount && (
                  <button
                    type="button"
                    onClick={handleSimulateNewIncident}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(232, 107, 44, 0.35)'
                    }}
                    title="Mô phỏng nhân viên Groom gửi lên 1 ca sự cố sau khi tài khoản được duyệt"
                  >
                    Tiếp nhận ca sự cố mới từ Groom
                  </button>
                )}
              </div>

              {/* Banner giải thích nghiệp vụ tài khoản mới bắt đầu từ 0 */}
              {isNewAccount && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(232, 107, 44, 0.10)',
                  border: '1.5px solid rgba(232, 107, 44, 0.35)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--brass)' }}>
                        Tài khoản Bác sĩ Thú y mới được xác nhận: Mọi chỉ số khởi tạo từ số 0
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px', lineHeight: 1.5 }}>
                        Tài khoản mới không kế thừa số liệu demo cũ. Khi có ca tiếp nhận mới sau thời điểm được kích hoạt, dữ liệu sẽ chạy tự động theo báo cáo thực tế.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateNewIncident}
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(232, 107, 44, 0.15)',
                      border: '1px solid var(--brass)',
                      color: 'var(--brass)',
                      borderRadius: '5px',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Mô phỏng ca tiếp nhận
                  </button>
                </div>
              )}

              {/* Khối Yêu Cầu Phục Vụ Thú Y Chờ Bác Sĩ Xác Nhận */}
              {(() => {
                const isMyVetHorse = (a) => isVetMatch(currentUser, a.vetUsername, a.vetName);
                const pendingVetAssignments = serviceAssignments.filter(a => isMyVetHorse(a) && a.vetStatus === 'PENDING');
                if (pendingVetAssignments.length === 0) return null;

                return (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    borderRadius: '10px',
                    padding: '18px 22px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Yêu Cầu Bác Sĩ Thú Y Phụ Trách Chờ Xác Nhận ({pendingVetAssignments.length})
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                            Chủ sở hữu đã chỉ định Bác sĩ thú y phụ trách y tế & dinh dưỡng. Vui lòng bấm xác nhận để tiếp nhận vào danh sách theo dõi lâm sàng.
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0A0D14', background: '#10B981', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>
                        {pendingVetAssignments.length} Yêu cầu mới
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '14px' }}>
                      {pendingVetAssignments.map(asgn => (
                        <div
                          key={asgn.id || asgn.microchip}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
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
                          {/* Dòng 1: Tên & Nút xác nhận */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', minHeight: '34px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, marginRight: '6px' }}>
                              <b
                                style={{
                                  color: '#FFFFFF',
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
                                {asgn.stable || 'Ô A2'}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: '#10B981',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                Chờ xác nhận
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const full = lookupFullHorseInfo(asgn.horseName || asgn.microchip);
                                  setConfirmedHorseModal(full || asgn);
                                }}
                                style={{
                                  color: '#FB923C',
                                  background: 'rgba(249, 115, 22, 0.14)',
                                  border: '1px solid rgba(249, 115, 22, 0.55)',
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Xem hồ sơ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectVetService(asgn)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  padding: '5px 12px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmVetService(asgn)}
                                style={{
                                  background: '#10B981',
                                  color: '#0A0D14',
                                  border: 'none',
                                  padding: '5px 12px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Xác Nhận Phục Vụ
                              </button>
                            </div>
                          </div>

                          {/* Dòng 2: Thông tin chi tiết */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--line)',
                            fontSize: '12px'
                          }}>
                            <div style={{ color: 'var(--paper-dim)' }}>
                              Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{asgn.ownerName || 'Chủ sở hữu'}</b> · Chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{asgn.microchip || '--'}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#10B981' }}>
                              Bác sĩ được chỉ định: <b>{asgn.vetName || 'BS. Trần Minh Hoàng'}</b>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Chỉ số nhanh - 3 thẻ cân bằng, chuẩn y khoa, không icon */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid var(--brass)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--brass)', textTransform: 'uppercase' }}>
                    Chờ Bác Sĩ Khám Gấp
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--brass)', marginTop: '6px', fontFamily: 'var(--display)' }}>
                    {filteredIncidents.filter(i => i.status === 'pending_vet').length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>ca</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                    Cần thăm khám trực tiếp tại ô chuồng
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid #38BDF8',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#38BDF8', textTransform: 'uppercase' }}>
                    Đang Theo Dõi Điều Trị
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#38BDF8', marginTop: '6px', fontFamily: 'var(--display)' }}>
                    {filteredIncidents.filter(i => i.status === 'in_review').length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>ca</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                    Có phác đồ chăm sóc ban đầu
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderTop: '3px solid #10B981',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#10B981', textTransform: 'uppercase' }}>
                    Đã Xử Lý Ổn Định
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', marginTop: '6px', fontFamily: 'var(--display)' }}>
                    {filteredIncidents.filter(i => i.status === 'resolved').length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--paper-dim)' }}>ca</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                    Bác sĩ Thú y đã ký duyệt hoàn tất
                  </div>
                </div>
              </div>

              {/* Danh sách thẻ sự cố lâm sàng - Thiết kế cân bằng, chuyên nghiệp, không icon */}
              {filteredIncidents.length === 0 ? (
                <div style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--line)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '10px 0 20px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--paper)', fontWeight: 800 }}>
                    Hiện không có sự cố lâm sàng nào cần xử lý (0 ca)
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--paper-dim)', maxWidth: '520px', lineHeight: 1.5 }}>
                    Hệ thống tự động phân luồng sự cố theo quyền hạn của từng Bác sĩ thú y phụ trách. Khi nhân viên Groom hoặc HLV báo cáo bất thường, sự cố sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 540px), 1fr))', gap: '16px' }}>
                {filteredIncidents.map((inc) => {
                  const isPending = inc.status === 'pending_vet';
                  const isInReview = inc.status === 'in_review';
                  const isCritical = inc.severity === 'CRITICAL';
                  const isHigh = inc.severity === 'HIGH';

                  const badgeColor = isCritical ? '#EF4444' : isHigh ? '#F59E0B' : '#38BDF8';
                  const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.12)' : isHigh ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)';

                  return (
                    <div
                      key={inc.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${isPending ? (isCritical ? 'rgba(239, 68, 68, 0.45)' : 'rgba(232, 107, 44, 0.4)') : 'var(--line)'}`,
                        borderTop: `3px solid ${isCritical ? '#EF4444' : isPending ? 'var(--brass)' : '#10B981'}`,
                        borderRadius: '8px',
                        padding: '16px 18px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Dòng 1: Header của sự cố (Mã ca + Mức độ + Trạng thái + Thời gian) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}`,
                            letterSpacing: '0.04em'
                          }}>
                            {isCritical ? 'KHẨN CẤP' : isHigh ? 'ƯU TIÊN CAO' : 'TIÊU CHUẨN'}
                          </span>
                          <b style={{ color: 'var(--paper)', fontSize: '13.5px', fontFamily: 'monospace' }}>{inc.id}</b>
                          {isPending && (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#EF4444',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}>
                              Chờ BS Khám
                            </span>
                          )}
                          {isInReview && (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#F59E0B',
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}>
                              Đang Thăm Khám
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>{inc.timestamp || 'Gần đây'}</span>
                      </div>

                      {/* Dòng 2: Thông tin chiến mã + Người báo cáo + Triệu chứng */}
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        {inc.imageUrl && (
                          <img
                            src={inc.imageUrl}
                            alt="Ảnh hiện trường"
                            style={{
                              width: '68px',
                              height: '68px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid var(--line)',
                              background: 'var(--card-inner-bg)'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brass)' }}>
                              {inc.horseName}
                            </h4>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--paper)',
                              background: 'var(--card-inner-bg)',
                              border: '1px solid var(--line)',
                              padding: '1px 7px',
                              borderRadius: '3px'
                            }}>
                              {inc.stall || `Ô chuồng ${inc.stallCode || 'A2'}`}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                            Báo cáo bởi: <b style={{ color: 'var(--paper)' }}>{inc.reportedBy}</b>
                          </div>
                          {Array.isArray(inc.symptoms) && inc.symptoms.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                              {inc.symptoms.map((sym, idx) => (
                                <span key={idx} style={{
                                  fontSize: '11px',
                                  background: 'rgba(232, 107, 44, 0.08)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  color: 'var(--brass)',
                                  border: '1px solid rgba(232, 107, 44, 0.22)',
                                  fontWeight: 600
                                }}>
                                  {sym}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dòng 3: Khung mô tả chi tiết từ Groom - Có tiêu đề rõ ràng */}
                      {inc.description && (
                        <div style={{
                          background: 'var(--card-inner-bg)',
                          border: '1px solid var(--line)',
                          borderLeft: '3px solid var(--brass)',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          lineHeight: 1.5
                        }}>
                          <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Ghi chú mô tả hiện trường:
                          </div>
                          <div style={{ color: 'var(--paper)', fontWeight: 500 }}>
                            "{inc.description}"
                          </div>
                        </div>
                      )}

                      {/* Dòng 4: Chỉ số sinh tồn sơ bộ do Groom ghi nhận nếu có */}
                      {inc.vitalSigns && (
                        <div style={{
                          background: 'var(--card-inner-bg)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '8px',
                          fontSize: '11px'
                        }}>
                          <div>
                            <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Thân nhiệt</span>
                            <b style={{ color: Number((inc.vitalSigns.temp || '').replace(/[^0-9.]/g, '')) > 38.5 ? '#EF4444' : 'var(--paper)', fontSize: '12px' }}>
                              {inc.vitalSigns.temp || 'N/A'}
                            </b>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Nhịp thở</span>
                            <b style={{ color: 'var(--paper)', fontSize: '12px' }}>{inc.vitalSigns.respRate || 'N/A'}</b>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Niêm mạc</span>
                            <b style={{ color: 'var(--paper)', fontSize: '12px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                              {inc.vitalSigns.mucousColor?.split(' ')[0] || 'N/A'}
                            </b>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)', display: 'block', fontSize: '10px' }}>Tiếng ruột</span>
                            <b style={{ color: 'var(--paper)', fontSize: '12px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                              {inc.vitalSigns.gutSounds?.split(' ')[0] || 'N/A'}
                            </b>
                          </div>
                        </div>
                      )}

                      {/* Thao tác sơ cứu Groom đã thực hiện */}
                      {inc.firstAidActions && inc.firstAidActions.length > 0 && (
                        <div style={{
                          fontSize: '11.5px',
                          color: '#10B981',
                          background: 'rgba(16, 185, 129, 0.08)',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.25)'
                        }}>
                          <b>Sơ cứu hiện trường đã làm:</b> {inc.firstAidActions.join(' · ')}
                        </div>
                      )}

                      {/* Chẩn đoán của Bác sĩ nếu đã xử lý */}
                      {inc.vetDiagnosis && (
                        <div style={{
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.25)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <b style={{ color: 'var(--brass)' }}>Chẩn đoán BS Thú y:</b> {inc.vetDiagnosis}
                          {inc.actionTaken && <div style={{ color: 'var(--paper-dim)', marginTop: '4px' }}>• Xử lý: {inc.actionTaken}</div>}
                        </div>
                      )}

                      {/* Dòng 5: Hàng nút bấm thao tác - Cân đối, chuẩn chiều cao 34px, không kéo dãn */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: 'auto',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--line)',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            const matched = horses.find(h => String(h?.name || '').toLowerCase() === String(inc?.horseName || '').toLowerCase());
                            if (matched) handleOpenLockModal(matched);
                          }}
                          style={{
                            height: '34px',
                            padding: '0 14px',
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            fontWeight: 600,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                          title="Kích hoạt lệnh cấm tập nặng ngay lập tức"
                        >
                          Khóa Y Tế
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleAcceptIncident(inc)}
                            style={{
                              height: '34px',
                              padding: '0 14px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              fontWeight: 700,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xác nhận tiếp nhận thông tin và di chuyển đến ô chuồng khám"
                          >
                            Tiếp Nhận Ca
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIncidentModal(inc);
                            setIncidentDiagnosisInput(inc.vetDiagnosis || '');
                            setIncidentActionInput(inc.actionTaken || '');
                          }}
                          style={{
                            height: '34px',
                            padding: '0 18px',
                            background: isPending ? 'var(--brass)' : 'var(--card-inner-bg)',
                            color: isPending ? '#0A0D14' : 'var(--paper)',
                            fontWeight: 700,
                            borderRadius: '4px',
                            border: isPending ? 'none' : '1px solid var(--line)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            boxShadow: isPending ? '0 2px 8px rgba(232, 107, 44, 0.3)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isPending ? 'Xác Nhận & Thăm Khám' : 'Cập nhật diễn biến'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SỔ TIÊM CHỦNG VACCINE & CHĂM SÓC ĐỊNH KỲ (PREVENTIVE MEDICINE) */}
          {/* ========================================================================= */}
          {activeTab === 'vaccines' && (
            <div className="tab-pane">
              {/* Header Tab & Nút Ghi Nhận Tiêm */}
              <div className="pane-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h2 className="pane-title">Sổ Tiêm Chủng Vaccine & Chăm Sóc Định Kỳ (Preventive Medicine)</h2>
                  <p className="pane-desc">
                    Quản lý phân nhóm Vaccine Cốt Lõi (Core) & Theo Nguy Cơ (Risk-based), kiểm soát liệu trình ban đầu, lịch tiêm nhắc và nhật ký số lô thời gian thực.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenRecordVaccine(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Ghi Nhận Mũi Tiêm Thực Tế
                </button>
              </div>

              {/* 4 Khối Cảnh Báo Tự Động (Vaccination Alerts) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div
                  onClick={() => setVaccineAlertFilter(vaccineAlertFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                  style={{
                    background: vaccineAlertFilter === 'OVERDUE' ? 'rgba(239, 68, 68, 0.18)' : 'var(--bg-card)',
                    border: `1.5px solid ${vaccineAlertFilter === 'OVERDUE' ? '#EF4444' : 'var(--line)'}`,
                    borderTop: '3px solid #EF4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Cảnh Báo Quá Hạn Tiêm
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
                    {overdueVaccines.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>mũi trễ hạn</span>
                  </div>
                </div>

                <div
                  onClick={() => setVaccineAlertFilter(vaccineAlertFilter === 'DUE_SOON' ? 'ALL' : 'DUE_SOON')}
                  style={{
                    background: vaccineAlertFilter === 'DUE_SOON' ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-card)',
                    border: `1.5px solid ${vaccineAlertFilter === 'DUE_SOON' ? '#F59E0B' : 'var(--line)'}`,
                    borderTop: '3px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Sắp Đến Ngày Tiêm Nhắc
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                    {dueSoonVaccines.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>trong 14 ngày</span>
                  </div>
                </div>

                <div
                  onClick={() => setVaccineAlertFilter(vaccineAlertFilter === 'INCOMPLETE_PRIMARY' ? 'ALL' : 'INCOMPLETE_PRIMARY')}
                  style={{
                    background: vaccineAlertFilter === 'INCOMPLETE_PRIMARY' ? 'rgba(217, 119, 6, 0.18)' : 'var(--bg-card)',
                    border: `1.5px solid ${vaccineAlertFilter === 'INCOMPLETE_PRIMARY' ? '#D97706' : 'var(--line)'}`,
                    borderTop: '3px solid #D97706',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Chưa Hoàn Tất Liệu Trình Ban Đầu
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                    {incompletePrimaryVaccines.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>cần tiêm đủ mũi</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setVaccineAlertFilter(vaccineAlertFilter === 'ADVERSE_REACTION' ? 'ALL' : 'ADVERSE_REACTION');
                    setVaccineSubTab('HISTORY');
                  }}
                  style={{
                    background: vaccineAlertFilter === 'ADVERSE_REACTION' ? 'rgba(236, 72, 153, 0.18)' : 'var(--bg-card)',
                    border: `1.5px solid ${vaccineAlertFilter === 'ADVERSE_REACTION' ? '#EC4899' : 'var(--line)'}`,
                    borderTop: '3px solid #EC4899',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Phản Ứng Bất Thường Sau Tiêm
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#EC4899', marginTop: '4px' }}>
                    {adverseReactionDoses.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>ca cần theo dõi</span>
                  </div>
                </div>
              </div>

              {/* Thanh Điều Hướng Sub-Tab & Bộ Lọc Nhanh */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--line)'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setVaccineSubTab('ACTIVE_QUEUE'); setVaccineAlertFilter('ALL'); }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: vaccineSubTab === 'ACTIVE_QUEUE' && vaccineAlertFilter === 'ALL' ? 'var(--brass)' : 'var(--bg-card)',
                      color: vaccineSubTab === 'ACTIVE_QUEUE' && vaccineAlertFilter === 'ALL' ? '#0A0D14' : 'var(--paper)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Cần Tiêm & Khẩn Cấp ({activeQueueVaccines.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVaccineSubTab('WAITING_QUEUE'); setVaccineAlertFilter('ALL'); }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: vaccineSubTab === 'WAITING_QUEUE' && vaccineAlertFilter === 'ALL' ? 'var(--brass)' : 'var(--bg-card)',
                      color: vaccineSubTab === 'WAITING_QUEUE' && vaccineAlertFilter === 'ALL' ? '#0A0D14' : 'var(--paper)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Lộ Trình Chờ Đến Lượt (+1 Tháng) ({waitingQueueVaccines.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVaccineSubTab('CORE'); setVaccineAlertFilter('ALL'); }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: vaccineSubTab === 'CORE' ? 'var(--brass)' : 'var(--bg-card)',
                      color: vaccineSubTab === 'CORE' ? '#0A0D14' : 'var(--paper)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Vaccine Cốt Lõi (Core)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVaccineSubTab('RISK'); setVaccineAlertFilter('ALL'); }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: vaccineSubTab === 'RISK' ? 'var(--brass)' : 'var(--bg-card)',
                      color: vaccineSubTab === 'RISK' ? '#0A0D14' : 'var(--paper)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Vaccine Theo Nguy Cơ (Risk)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVaccineSubTab('ALL'); setVaccineAlertFilter('ALL'); }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: vaccineSubTab === 'ALL' && vaccineAlertFilter === 'ALL' ? 'var(--brass)' : 'var(--bg-card)',
                      color: vaccineSubTab === 'ALL' && vaccineAlertFilter === 'ALL' ? '#0A0D14' : 'var(--paper)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Tất Cả Lịch Tiêm ({vaccines.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => { setVaccineSubTab('HISTORY'); }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: vaccineSubTab === 'HISTORY' ? 'var(--brass)' : 'var(--bg-card)',
                      color: vaccineSubTab === 'HISTORY' ? '#0A0D14' : 'var(--paper)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Sổ Lịch Sử Tiêm Chủng ({vaccinationHistory.length} Mũi Thực Tế)
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={vaccineHorseFilter}
                    onChange={(e) => setVaccineHorseFilter(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--paper)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">Tất cả chiến mã ({horses.length})</option>
                    {horses.map(h => (
                      <option key={h.id} value={h.name}>{h.name} ({h.stable || h.stall || 'Chuồng'})</option>
                    ))}
                  </select>

                  {vaccineAlertFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setVaccineAlertFilter('ALL')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Bỏ Lọc Cảnh Báo
                    </button>
                  )}
                </div>
              </div>

              {/* BẢNG DỮ LIỆU: LỊCH TIÊM CHỦNG HOẶC LỊCH SỬ TIÊM CHỦNG */}
              {vaccineSubTab !== 'HISTORY' ? (
                <>
                  {vaccineSubTab === 'WAITING_QUEUE' && (
                    <div style={{
                      marginBottom: '14px',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#818CF8', letterSpacing: '0.02em' }}>
                        LỘ TRÌNH TIÊM CHỦNG TUẦN TỰ (GIÃN CÁCH 1 THÁNG)
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--paper)', lineHeight: 1.5 }}>
                        Chiến mã tiêm khởi đầu bằng <b>Uốn ván (Tetanus)</b> trước tiên. Sau mỗi 1 tháng sẽ chuyển sang tiêm mũi khởi đầu của vaccine kế tiếp (Bệnh dại, Viêm não ngựa, Virus West Nile...). Các vaccine dưới đây đang trong thời gian chờ giãn cách chuẩn y khoa. Bác sĩ có thể bấm <b>Kích Hoạt Tiêm Sớm</b> nếu có chỉ định đặc biệt khi khám lâm sàng.
                      </span>
                    </div>
                  )}

                  <div className="facility-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--line)', borderRadius: '8px', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px', tableLayout: 'auto' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '12px 14px', width: '15%' }}>Chiến mã</th>
                          <th style={{ padding: '12px 10px', width: '11%' }}>Phân nhóm</th>
                          <th style={{ padding: '12px 12px', width: '22%' }}>Tên Vaccine & Quy chuẩn</th>
                          <th style={{ padding: '12px 10px', width: '14%' }}>Liệu trình hiện tại</th>
                          <th style={{ padding: '12px 10px', width: '11%' }}>Đường tiêm</th>
                          <th style={{ padding: '12px 10px', width: '11%' }}>Hạn kế tiếp</th>
                          <th style={{ padding: '12px 10px', width: '12%' }}>Trạng thái</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right', width: '11%' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVaccines.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: 'var(--paper-dim)' }}>
                              {vaccineSubTab === 'WAITING_QUEUE'
                                ? 'Không có vaccine nào đang trong danh sách chờ lộ trình.'
                                : vaccineSubTab === 'ACTIVE_QUEUE'
                                ? 'Hiện không có vaccine nào cần tiêm gấp hoặc khẩn cấp.'
                                : 'Không có lịch tiêm nào khớp với bộ lọc hiện tại.'}
                            </td>
                          </tr>
                        ) : (
                          filteredVaccines.map((v) => {
                            const isCore = v.category === 'CORE';
                            const isWaitingTurn = Boolean(v.isWaitingTurn);
                            const isEmergency = Boolean(v.isEmergency) || v.currentStage === 'EMERGENCY_BOOSTER' || v.vaccineKey === 'OTHER';
                            const isOverdue = v.status === 'OVERDUE';
                            const isDueSoon = v.status === 'DUE_SOON';
                            const isIncomplete = v.status === 'INCOMPLETE_PRIMARY';
                            const isAdverse = v.status === 'ADVERSE_REACTION';
                            const isValidImmunity = !isWaitingTurn && !isOverdue && !isDueSoon && !isIncomplete && !isAdverse && !isEmergency;

                            let badgeText = 'MIỄN DỊCH HỢP LỆ';
                            let badgeBg = 'rgba(16, 185, 129, 0.12)';
                            let badgeColor = '#10B981';
                            let badgeBorder = 'rgba(16, 185, 129, 0.35)';

                            if (isWaitingTurn) {
                              badgeText = 'CHỜ THEO LỘ TRÌNH (+1 THÁNG)';
                              badgeBg = 'rgba(99, 102, 241, 0.12)';
                              badgeColor = '#818CF8';
                              badgeBorder = 'rgba(99, 102, 241, 0.35)';
                            } else if (isAdverse) {
                              badgeText = 'PHẢN ỨNG BẤT THƯỜNG';
                              badgeBg = 'rgba(236, 72, 153, 0.15)';
                              badgeColor = '#EC4899';
                              badgeBorder = 'rgba(236, 72, 153, 0.45)';
                            } else if (isEmergency) {
                              badgeText = 'KHẨN CẤP / ĐẶC HIỆU';
                              badgeBg = 'rgba(239, 68, 68, 0.15)';
                              badgeColor = '#EF4444';
                              badgeBorder = 'rgba(239, 68, 68, 0.45)';
                            } else if (isOverdue) {
                              badgeText = 'QUÁ HẠN TIÊM';
                              badgeBg = 'rgba(239, 68, 68, 0.15)';
                              badgeColor = '#EF4444';
                              badgeBorder = 'rgba(239, 68, 68, 0.45)';
                            } else if (isDueSoon) {
                              badgeText = 'SẮP ĐẾN HẠN';
                              badgeBg = 'rgba(245, 158, 11, 0.15)';
                              badgeColor = '#F59E0B';
                              badgeBorder = 'rgba(245, 158, 11, 0.45)';
                            } else if (isIncomplete) {
                              badgeText = 'LIỆU TRÌNH BAN ĐẦU';
                              badgeBg = 'rgba(217, 119, 6, 0.15)';
                              badgeColor = '#D97706';
                              badgeBorder = 'rgba(217, 119, 6, 0.45)';
                            }

                            return (
                              <tr key={v.id} style={{ borderBottom: '1px solid var(--line)', background: isEmergency ? 'rgba(239, 68, 68, 0.04)' : isOverdue ? 'rgba(239, 68, 68, 0.02)' : isIncomplete ? 'rgba(217, 119, 6, 0.02)' : isWaitingTurn ? 'rgba(99, 102, 241, 0.02)' : 'transparent' }}>
                                <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                  <b style={{ color: 'var(--brass)', fontSize: '13px', display: 'block' }}>{v.horseName}</b>
                                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{v.stall} · {v.microchip}</span>
                                </td>

                                <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                  <span style={{
                                    padding: '2px 7px',
                                    borderRadius: '3px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    background: isCore ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                    color: isCore ? '#F59E0B' : '#60A5FA',
                                    border: `1px solid ${isCore ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`
                                  }}>
                                    {isCore ? 'CỐT LÕI (CORE)' : 'THEO NGUY CƠ (RISK)'}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                                  <b style={{ color: 'var(--paper)', fontSize: '13px', display: 'block' }}>{v.vaccineName}</b>
                                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>
                                    {v.scientificName}
                                  </span>
                                  <span style={{ fontSize: '10.5px', color: 'var(--paper-dim)', display: 'block', marginTop: '2px', lineHeight: 1.35 }}>
                                    {v.scheduleNote}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                  <b style={{ color: 'var(--paper)', fontSize: '12px', display: 'block' }}>{v.currentStageLabel}</b>
                                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                                    Đã tiêm: {v.completedDosesCount} / {v.primaryDosesRequired} mũi ban đầu
                                  </span>
                                </td>

                                <td style={{ padding: '12px 10px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--paper)' }}>
                                  <div>{v.dose}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>{v.route}</div>
                                </td>

                                <td style={{ padding: '12px 10px', verticalAlign: 'middle', fontSize: '12px' }}>
                                  <b style={{ color: isOverdue ? '#EF4444' : isDueSoon ? '#F59E0B' : isWaitingTurn ? '#818CF8' : 'var(--paper)' }}>
                                    {v.dueDate || 'Hôm nay'}
                                  </b>
                                  {v.lastAdministeredDate && (
                                    <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                      Lần trước: {v.lastAdministeredDate}
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    background: badgeBg,
                                    color: badgeColor,
                                    border: `1px solid ${badgeBorder}`
                                  }}>
                                    {badgeText}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                                  {isWaitingTurn ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRecordVaccine(v)}
                                      title="Kích hoạt tiêm sớm nếu có chỉ định đặc biệt từ Bác sĩ Thú y"
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        background: 'transparent',
                                        color: 'var(--brass)',
                                        border: '1px solid var(--brass)',
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brass)'; e.currentTarget.style.color = '#FFFFFF'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--brass)'; }}
                                    >
                                      Kích Hoạt Tiêm Sớm
                                    </button>
                                  ) : !isValidImmunity ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRecordVaccine(v)}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        background: isEmergency ? '#EF4444' : 'var(--brass)',
                                        color: '#FFFFFF',
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxShadow: isEmergency ? '0 2px 6px rgba(239, 68, 68, 0.35)' : '0 2px 6px rgba(245, 158, 11, 0.3)'
                                      }}
                                    >
                                      {isEmergency ? 'Tiêm Khẩn Cấp' : 'Tiêm Ngay'}
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: 'var(--paper-dim)', userSelect: 'none' }}>
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* BẢNG SỔ LỊCH SỬ TIÊM CHỦNG THỰC TẾ (VACCINATION HISTORY) */
                <div className="facility-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--line)', borderRadius: '8px', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px', tableLayout: 'auto' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '12px 14px', width: '13%' }}>Ngày tiêm thực tế</th>
                        <th style={{ padding: '12px 12px', width: '14%' }}>Chiến mã</th>
                        <th style={{ padding: '12px 12px', width: '18%' }}>Tên Vaccine</th>
                        <th style={{ padding: '12px 10px', width: '12%' }}>Liệu trình</th>
                        <th style={{ padding: '12px 10px', width: '12%' }}>Số Lô (Batch No)</th>
                        <th style={{ padding: '12px 10px', width: '11%' }}>Liều & Đường tiêm</th>
                        <th style={{ padding: '12px 10px', width: '11%' }}>Người thực hiện</th>
                        <th style={{ padding: '12px 12px', width: '14%' }}>Phản ứng sau tiêm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: 'var(--paper-dim)' }}>
                            Chưa có dữ liệu mũi tiêm thực tế nào được ghi nhận. Bấm nút "Ghi Nhận Mũi Tiêm Thực Tế" để bắt đầu quy trình.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((h) => {
                          const hasAdverse = h.reaction && h.reaction !== 'NONE';

                          let reactionLabel = 'Bình thường';
                          let reactionColor = '#10B981';
                          if (h.reaction === 'LOCAL_SWELLING') {
                            reactionLabel = 'Sưng nhẹ tại vết tiêm';
                            reactionColor = '#F59E0B';
                          } else if (h.reaction === 'MILD_FEVER') {
                            reactionLabel = 'Sốt nhẹ (< 38.5°C)';
                            reactionColor = '#F59E0B';
                          } else if (h.reaction === 'LETHARGY') {
                            reactionLabel = 'Ủ rũ / Kém ăn';
                            reactionColor = '#F59E0B';
                          } else if (h.reaction === 'ANAPHYLAXIS') {
                            reactionLabel = 'Dị ứng cấp tính (Nguy hiểm)';
                            reactionColor = '#EF4444';
                          }

                          return (
                            <tr key={h.id} style={{ borderBottom: '1px solid var(--line)', background: hasAdverse ? 'rgba(236, 72, 153, 0.03)' : 'transparent' }}>
                              <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                <b style={{ color: 'var(--paper)', fontSize: '12.5px', display: 'block' }}>{h.administeredDate}</b>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{h.time || ''}</span>
                              </td>

                              <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                                <b style={{ color: 'var(--brass)', fontSize: '13px', display: 'block' }}>{h.horseName}</b>
                                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{h.stall} · {h.microchip}</span>
                              </td>

                              <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                                <b style={{ color: 'var(--paper)', fontSize: '12.5px', display: 'block' }}>{h.vaccineName}</b>
                                <span style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>{h.categoryLabel}</span>
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--paper)' }}>
                                {h.stageLabel}
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '11.5px',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--paper)',
                                  border: '1px solid var(--line)',
                                  fontWeight: 600
                                }}>
                                  {h.batchNumber}
                                </span>
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--paper)' }}>
                                <div>{h.dose}</div>
                                <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{h.route}</div>
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--paper)' }}>
                                {h.administeredBy}
                              </td>

                              <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: `${reactionColor}18`,
                                  color: reactionColor,
                                  border: `1px solid ${reactionColor}40`,
                                  display: 'inline-block'
                                }}>
                                  {reactionLabel}
                                </span>
                                {h.reactionNotes && (
                                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                                    {h.reactionNotes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ĐƠN THUỐC & PHÁC ĐỒ ĐIỀU TRỊ */}
          {/* ========================================================================= */}
          {activeTab === 'prescriptions' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Đơn Thuốc & Phác Đồ Điều Trị (Clinical Prescriptions - Rx)</h2>
                  <p className="pane-desc">Quản lý các loại thuốc đặc trị, kháng viêm, điện giải và phác đồ vật lý trị liệu.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRxModal(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + Kê đơn thuốc mới
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="facility-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brass)', border: '1px solid var(--line-strong)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          {rx.id}
                        </span>
                        <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{rx.horseName}</b>
                        <span style={{ color: 'var(--paper-dim)', fontSize: '13px' }}>({rx.stall})</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>Ngày kê toa: {rx.date}</span>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ color: 'var(--paper-dim)', fontSize: '13px' }}>Chẩn đoán y khoa: </span>
                      <b style={{ color: 'var(--paper)', fontSize: '13.5px' }}>{rx.diagnosis}</b>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px' }}>DANH MỤC THUỐC & LIỀU DÙNG:</div>
                      {Array.isArray(rx.medications) && rx.medications.map((m, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '4px 0', borderBottom: idx !== rx.medications.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                          <b style={{ color: 'var(--paper)' }}>{idx + 1}. {m.name}</b>
                          <span style={{ color: 'var(--paper-dim)' }}>Liều: {m.dosage} ({m.frequency})</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--paper)', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '10px 12px', borderRadius: '6px' }}>
                      ⚠️ <b>Chế độ vận động & hạn chế:</b> {rx.restrictions}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TIẾP NHẬN BÁO ĐỘNG & THĂM KHÁM LÂM SÀNG */}
      {/* ========================================================================= */}
      {selectedIncidentModal && (
        <div className="modal-overlay" onClick={() => setSelectedIncidentModal(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '720px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              background: 'var(--bg-card, #20362B)',
              padding: '26px 30px',
              border: selectedIncidentModal.severity === 'CRITICAL' ? '1.5px solid #EF4444' : '1.5px solid rgba(232, 107, 44, 0.45)',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(232, 237, 232, 0.15)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase' }}>
                    Phiếu Tiếp Nhận Báo Động & Thăm Khám Y Tế
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: selectedIncidentModal.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: selectedIncidentModal.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                    border: `1px solid ${selectedIncidentModal.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'}`
                  }}>
                    {selectedIncidentModal.severity}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                  Mã tiếp nhận: <b style={{ color: 'var(--brass)', fontFamily: 'monospace' }}>{selectedIncidentModal.id}</b> · Báo cáo lúc: {selectedIncidentModal.timestamp}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncidentModal(null)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Thông tin Groom ghi nhận tại hiện trường */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '18px 20px', borderRadius: '12px', border: '1px solid rgba(232, 237, 232, 0.15)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'rgba(232, 237, 232, 0.7)' }}>Chiến mã:</span><b style={{ color: 'var(--brass)', fontSize: '14.5px' }}>{selectedIncidentModal.horseName}</b></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'rgba(232, 237, 232, 0.7)' }}>Vị trí:</span><b style={{ color: '#FFFFFF', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>{selectedIncidentModal.stall || `Ô chuồng ${selectedIncidentModal.stallCode}`}</b></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'rgba(232, 237, 232, 0.7)' }}>Người lập báo động:</span><b style={{ color: '#FFFFFF' }}>{selectedIncidentModal.reportedBy}</b></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'rgba(232, 237, 232, 0.7)' }}>Trạng thái:</span><b style={{ color: selectedIncidentModal.status === 'resolved' ? '#10B981' : '#FBBF24', background: selectedIncidentModal.status === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${selectedIncidentModal.status === 'resolved' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`, fontSize: '12px' }}>
                  {selectedIncidentModal.status === 'resolved' ? 'Đã hoàn tất khám' : (selectedIncidentModal.status === 'in_review' ? 'Đang tiếp nhận thăm khám' : 'Chờ Bác sĩ khám')}
                </b></div>
              </div>

              {/* Chỉ số sinh tồn nếu có */}
              {selectedIncidentModal.vitalSigns && (
                <div style={{
                  background: 'var(--card-inner-bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>Thân nhiệt:</span>
                    <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.temp}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>Nhịp thở:</span>
                    <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.respRate}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>Niêm mạc:</span>
                    <div style={{ fontWeight: 600, color: 'var(--paper)', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.mucousColor}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--paper-dim)', fontSize: '11px' }}>Nhu động ruột:</span>
                    <div style={{ fontWeight: 600, color: 'var(--paper)', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.gutSounds}</div>
                  </div>
                </div>
              )}

              {/* Triệu chứng và sơ cứu */}
              <div style={{ fontSize: '13px', color: 'var(--paper)', marginBottom: '10px' }}>
                <span style={{ color: 'var(--paper-dim)', marginRight: '6px' }}>Triệu chứng:</span><span style={{ background: 'rgba(232, 107, 44, 0.15)', color: 'var(--brass)', padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(232, 107, 44, 0.35)', fontWeight: 700, fontSize: '12.5px' }}>{Array.isArray(selectedIncidentModal.symptoms) ? selectedIncidentModal.symptoms.join(' · ') : selectedIncidentModal.symptoms}</span>
              </div>

              {selectedIncidentModal.firstAidActions && selectedIncidentModal.firstAidActions.length > 0 && (
                <div style={{ fontSize: '11.5px', color: '#10B981', marginBottom: '8px' }}>
                  <b>Sơ cứu hiện trường Groom đã làm:</b> {selectedIncidentModal.firstAidActions.join(' · ')}
                </div>
              )}

              <div style={{ fontSize: '13px', color: 'var(--paper)', lineHeight: 1.55, background: 'var(--card-inner-bg)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid var(--brass)', marginTop: '12px' }}>
                <b style={{ color: 'var(--brass)' }}>Mô tả của Groom:</b> {selectedIncidentModal.description}
              </div>
            </div>

            {/* Thanh xác nhận tiếp nhận nhanh */}
            {selectedIncidentModal.status === 'pending_vet' ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#FBBF24', lineHeight: 1.45, fontWeight: 500 }}>
                  Xác nhận tiếp nhận thông tin để Groom và Chủ sở hữu biết Bác sĩ đang trực tiếp đến ô chuồng.
                </div>
                <button
                  type="button"
                  onClick={() => handleAcceptIncident(selectedIncidentModal)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#F59E0B',
                    color: '#0A0D14',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Xác Nhận Đang Đến Khám
                </button>
              </div>
            ) : selectedIncidentModal.status === 'in_review' ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ fontSize: '13px', color: '#10B981', lineHeight: 1.45, fontWeight: 500 }}>
                  Bác sĩ {selectedIncidentModal.acceptedByVet || currentUser?.full_name || 'Thú y'} đã xác nhận tiếp nhận ca khám. Groom và Chủ sở hữu đã nhận thông báo Bác sĩ đang trực tiếp đến ô chuồng.
                </div>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)' }}>
                  ĐANG ĐẾN KHÁM
                </span>
              </div>
            ) : null}

            <form onSubmit={handleResolveIncident}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px' }}>
                  Chẩn đoán lâm sàng của Bác sĩ Thú y: <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows="3"
                  value={incidentDiagnosisInput}
                  onChange={(e) => setIncidentDiagnosisInput(e.target.value)}
                  placeholder="Ví dụ: Đau bụng nhẹ do ăn quá nhanh / Viêm bao gân cổ chân độ 1 / Trầy xước mô mềm không tổn thương khớp..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--input-border)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '80px',
                    background: 'var(--input-bg)',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px' }}>
                  Biện pháp xử lý, Phác đồ điều trị & Y lệnh cho Groom: <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows="3"
                  value={incidentActionInput}
                  onChange={(e) => setIncidentActionInput(e.target.value)}
                  placeholder="Ví dụ: Tiêm giảm đau chống co thắt Buscopan 20ml, cho nhịn ăn tinh 12h, Groom tiếp tục dắt đi bộ chậm 15 phút mỗi 2 tiếng và theo dõi nhu động ruột..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--input-border)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '80px',
                    background: 'var(--input-bg)',
                    color: 'var(--paper)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '16px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedIncidentModal(null)}
                  style={{ padding: '9px 20px', borderRadius: '6px', background: 'var(--card-inner-bg)', color: 'var(--paper-dim)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s ease' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: '6px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.02em', boxShadow: '0 3px 12px rgba(232, 107, 44, 0.35)', transition: 'all 0.15s ease' }}
                >
                  Xác Nhận & Ban Hành Phác Đồ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KHÓA AN TOÀN Y TẾ (COMPACT & CLEAN) */}
      {/* ========================================================================= */}
      {lockModalTarget && (
        <div className="modal-overlay" onClick={() => setLockModalTarget(null)} style={{ zIndex: 1150 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '92%',
              padding: '24px 28px',
              borderRadius: '16px',
              background: 'var(--bg-card, #20362B)',
              border: '1.5px solid #EF4444',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(239, 68, 68, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(232, 237, 232, 0.15)', paddingBottom: '14px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                <span>🔒 Khóa Y Tế · {lockModalTarget.name}</span>
                <span style={{ fontSize: '12px', color: '#FFFFFF', background: 'rgba(255, 255, 255, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  Ô {lockModalTarget.stable}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setLockModalTarget(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', color: '#FCA5A5', fontSize: '13px', lineHeight: 1.5 }}>
              ⚠️ <b>Quyền phủ quyết Y tế:</b> Lệnh này sẽ đình chỉ việc tập luyện và cấm thi đấu ngay lập tức trên toàn hệ thống cho đến khi Thú y gỡ khóa.
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                Lý do kích hoạt khóa y tế: <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                rows="3"
                value={lockReasonInput}
                onChange={(e) => setLockReasonInput(e.target.value)}
                placeholder="Nhập lý do chấn thương hoặc cách ly y tế..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(232, 237, 232, 0.22)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(232, 237, 232, 0.15)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setLockModalTarget(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleToggleLock(lockModalTarget, lockReasonInput)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                Xác nhận khóa y tế
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KÊ ĐƠN THUỐC MỚI */}
      {/* ========================================================================= */}
      {showAddRxModal && (
        <div className="modal-overlay" onClick={() => setShowAddRxModal(false)} style={{ zIndex: 1100 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '580px',
              width: '92%',
              borderRadius: '16px',
              background: 'var(--bg-card, #20362B)',
              padding: '26px 30px',
              border: '1.5px solid rgba(232, 107, 44, 0.45)',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(232, 237, 232, 0.15)', paddingBottom: '14px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)' }}>💊</span> Kê Đơn Thuốc & Phác Đồ Điều Trị Mới (Rx)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRxModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrescription}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Chiến mã: <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={newRxData.horseName}
                    onChange={(e) => {
                      const h = horses.find(item => item.name === e.target.value);
                      setNewRxData({ ...newRxData, horseName: e.target.value, stall: h ? `Ô ${h.stable}` : 'Ô A1' });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid rgba(232, 237, 232, 0.22)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {horses.map(h => (
                      <option key={h.id} value={h.name} style={{ background: '#1B2C24', color: '#FFFFFF' }}>
                        {h.name} (Ô {h.stable})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Tên thuốc / Chế phẩm: <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newRxData.medication}
                    onChange={(e) => setNewRxData({ ...newRxData, medication: e.target.value })}
                    placeholder="VD: Phenylbutazone 20%"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid rgba(232, 237, 232, 0.22)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  Chẩn đoán: <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newRxData.diagnosis}
                  onChange={(e) => setNewRxData({ ...newRxData, diagnosis: e.target.value })}
                  placeholder="VD: Viêm màng hoạt dịch khớp gối trái"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Liều dùng: <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newRxData.dosage}
                    onChange={(e) => setNewRxData({ ...newRxData, dosage: e.target.value })}
                    placeholder="VD: 10ml tiêm bắp"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid rgba(232, 237, 232, 0.22)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Tần suất: <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={newRxData.frequency}
                    onChange={(e) => setNewRxData({ ...newRxData, frequency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid rgba(232, 237, 232, 0.22)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="1 lần/ngày" style={{ background: '#1B2C24', color: '#FFFFFF' }}>1 lần/ngày</option>
                    <option value="2 lần/ngày (sáng/tối)" style={{ background: '#1B2C24', color: '#FFFFFF' }}>2 lần/ngày (sáng/tối)</option>
                    <option value="3 lần/ngày" style={{ background: '#1B2C24', color: '#FFFFFF' }}>3 lần/ngày</option>
                    <option value="Cách ngày 1 lần" style={{ background: '#1B2C24', color: '#FFFFFF' }}>Cách ngày 1 lần</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  Chế độ vận động & Lưu ý y lệnh:
                </label>
                <textarea
                  rows="3"
                  value={newRxData.restrictions}
                  onChange={(e) => setNewRxData({ ...newRxData, restrictions: e.target.value })}
                  placeholder="Ghi chú về chế độ vận động, cấm tập nặng hoặc cách ly..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(232, 237, 232, 0.15)', paddingTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddRxModal(false)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#E8EDE8',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 800,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: '0 4px 14px rgba(232, 107, 44, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Lưu & Xuất Đơn Thuốc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ===================== MODAL GHI NHẬN MŨI TIÊM THỰC TẾ ===================== */}
      {showRecordVaccineModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-card, #1E3329)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '740px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px 26px',
            boxShadow: 'var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.55))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ghi Nhận Mũi Tiêm Vaccine Thực Tế
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Ghi nhật ký mũi tiêm chuẩn y khoa, quản lý số lô sản xuất và lập lịch tiêm nhắc kế tiếp theo thời gian thực.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordVaccineModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveVaccinationRecord}>
              {/* KHỐI 1: ĐỐI TƯỢNG VÀ LOẠI VACCINE TIÊM CHỦNG */}
              <div style={{
                background: 'var(--card-inner-bg, rgba(255, 255, 255, 0.02))',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass, #F59E0B)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  1. Đối tượng & Loại Vaccine tiêm chủng
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Chiến mã tiếp nhận tiêm: <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={recordVaccineForm.horseName}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const h = horses.find(item => item.name === selectedName);
                        const rawStall = h?.stable || h?.stall || 'A1';
                        const stallClean = rawStall.replace(/^(Ô|Chuồng)\s*/i, '').trim();
                        setRecordVaccineForm(prev => ({
                          ...prev,
                          horseId: h ? String(h.id) : '',
                          horseName: selectedName,
                          stall: `Ô ${stallClean}`,
                          microchip: h ? (h.microchip || h.chipId || 'N/A') : ''
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    >
                      <option value="">-- Chọn chiến mã --</option>
                      {horses.map(h => (
                        <option key={h.id} value={h.name}>
                          {h.name} ({h.stable || h.stall || 'Chuồng'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Vị trí ô chuồng & Mã Chip RFID:
                    </label>
                    <div style={{
                      padding: '9px 12px',
                      borderRadius: '5px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      fontSize: '12.5px',
                      color: 'var(--paper)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {recordVaccineForm.stall || 'Chưa chọn'} · <span style={{ fontFamily: 'monospace' }}>{recordVaccineForm.microchip || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Loại Vaccine tiêm chủng: <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={recordVaccineForm.vaccineKey}
                      onChange={(e) => {
                        const vKey = e.target.value;
                        if (vKey === 'OTHER') {
                          setRecordVaccineForm(prev => ({
                            ...prev,
                            vaccineKey: 'OTHER',
                            batchNumber: `LOT-OTH-2026-${Math.floor(10 + Math.random() * 90)}`
                          }));
                        } else {
                          const def = VACCINE_DEFINITIONS[vKey] || VACCINE_DEFINITIONS.TETANUS;
                          setRecordVaccineForm(prev => ({
                            ...prev,
                            vaccineKey: vKey,
                            dose: def.defaultDose,
                            route: def.route,
                            batchNumber: `LOT-${vKey.slice(0, 3)}-2026-${Math.floor(10 + Math.random() * 90)}`
                          }));
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    >
                      <optgroup label="A. Vaccine Cốt Lõi (Core Vaccines)">
                        <option value="TETANUS">Uốn ván (Tetanus)</option>
                        <option value="RABIES">Bệnh dại (Rabies)</option>
                        <option value="ENCEPHALOMYELITIS">Viêm não ngựa (Equine Encephalomyelitis)</option>
                        <option value="WEST_NILE">Virus West Nile (West Nile Virus - WNV)</option>
                      </optgroup>
                      <optgroup label="B. Vaccine Theo Nguy Cơ (Risk-based Vaccines)">
                        <option value="INFLUENZA">Cúm ngựa (Equine Influenza)</option>
                        <option value="HERPESVIRUS">Viêm mũi phế quản truyền nhiễm (EHV-1/EHV-4)</option>
                        <option value="STRANGLES">Bệnh viêm hạch hô hấp (Strangles)</option>
                        <option value="BOTULISM">Ngộ độc Botulinum (Equine Botulism)</option>
                        <option value="POTOMAC_FEVER">Sốt ngựa Potomac (Potomac Horse Fever - PHF)</option>
                      </optgroup>
                      <optgroup label="C. Vaccine & Sinh Phẩm Khác">
                        <option value="OTHER">Khác (Vaccine & Sinh phẩm điều trị đặc hiệu khác...)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Liệu trình / Giai đoạn: <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={recordVaccineForm.doseStage}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, doseStage: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    >
                      <option value="PRIMARY_1">Mũi 1 khởi đầu (Liệu trình ban đầu)</option>
                      <option value="PRIMARY_2">Mũi 2 khởi đầu (Liệu trình ban đầu)</option>
                      <option value="PRIMARY_3">Mũi 3 khởi đầu (Liệu trình ban đầu)</option>
                      <option value="BOOSTER">Mũi tiêm nhắc định kỳ (Booster Schedule)</option>
                      <option value="EMERGENCY_BOOSTER">Tiêm nhắc khẩn cấp (Vết thương hở / Dịch tễ)</option>
                    </select>
                  </div>
                </div>

                {/* Nếu chọn Loại Vaccine Khác: hiển thị form nhập bổ sung */}
                {recordVaccineForm.vaccineKey === 'OTHER' && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px dashed var(--brass, #F59E0B)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass, #F59E0B)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Chỉ định Vaccine / Sinh phẩm điều trị đặc hiệu khác:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', marginBottom: '4px' }}>
                          Tên Vaccine / Sinh phẩm điều trị: <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={recordVaccineForm.customVaccineName}
                          onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, customVaccineName: e.target.value }))}
                          placeholder="Ví dụ: Vaccine Rotavirus ngừa tiêu chảy sơ sinh, Kháng độc tố Tetanus Antitoxin..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            border: '1px solid var(--input-border)',
                            background: 'var(--input-bg)',
                            color: 'var(--paper)',
                            fontSize: '12.5px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', marginBottom: '4px' }}>
                          Nhóm phân loại:
                        </label>
                        <select
                          value={recordVaccineForm.customCategory}
                          onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, customCategory: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            border: '1px solid var(--input-border)',
                            background: 'var(--input-bg)',
                            color: 'var(--paper)',
                            fontSize: '12.5px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="RISK">Theo nguy cơ (Risk-based)</option>
                          <option value="CORE">Cốt lõi (Core)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 2: THỜI GIAN TIÊM LẠI (HẠN TIÊM MŨI KẾ TIẾP / TIÊM NHẮC) */}
              <div style={{
                background: 'var(--card-inner-bg, rgba(255, 255, 255, 0.02))',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass, #F59E0B)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    2. Thời gian tiêm lại & Lập lịch theo dõi kế tiếp
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                    Tự động đồng bộ vào Sổ theo dõi lịch tiêm
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Hạn tiêm mũi kế tiếp (DD/MM/YYYY):
                    </label>
                    <input
                      type="text"
                      disabled={recordVaccineForm.noNextDue}
                      value={recordVaccineForm.noNextDue ? '' : recordVaccineForm.nextDueDate}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, nextDueDate: e.target.value }))}
                      placeholder={recordVaccineForm.noNextDue ? 'Không hẹn lịch tiêm lại' : 'DD/MM/YYYY (Ví dụ: 13/11/2027)'}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: recordVaccineForm.noNextDue ? 'var(--bg-secondary)' : 'var(--input-bg)',
                        color: recordVaccineForm.noNextDue ? 'var(--paper-dim)' : 'var(--paper)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--paper-dim)', marginBottom: '6px' }}>
                      Phím chọn nhanh thời gian tiêm lại:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={recordVaccineForm.noNextDue}
                        onClick={() => handleQuickSetNextDue('WEEKS', 3)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--paper)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: recordVaccineForm.noNextDue ? 'not-allowed' : 'pointer',
                          opacity: recordVaccineForm.noNextDue ? 0.5 : 1
                        }}
                      >
                        +3 tuần
                      </button>
                      <button
                        type="button"
                        disabled={recordVaccineForm.noNextDue}
                        onClick={() => handleQuickSetNextDue('WEEKS', 4)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--paper)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: recordVaccineForm.noNextDue ? 'not-allowed' : 'pointer',
                          opacity: recordVaccineForm.noNextDue ? 0.5 : 1
                        }}
                      >
                        +4 tuần
                      </button>
                      <button
                        type="button"
                        disabled={recordVaccineForm.noNextDue}
                        onClick={() => handleQuickSetNextDue('MONTHS', 6)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--paper)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: recordVaccineForm.noNextDue ? 'not-allowed' : 'pointer',
                          opacity: recordVaccineForm.noNextDue ? 0.5 : 1
                        }}
                      >
                        +6 tháng
                      </button>
                      <button
                        type="button"
                        disabled={recordVaccineForm.noNextDue}
                        onClick={() => handleQuickSetNextDue('MONTHS', 12)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--paper)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: recordVaccineForm.noNextDue ? 'not-allowed' : 'pointer',
                          opacity: recordVaccineForm.noNextDue ? 0.5 : 1
                        }}
                      >
                        +1 năm
                      </button>
                    </div>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--paper-dim)' }}>
                  <input
                    type="checkbox"
                    checked={recordVaccineForm.noNextDue}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRecordVaccineForm(prev => ({
                        ...prev,
                        noNextDue: checked,
                        nextDueDate: checked ? '' : (prev.nextDueDate || calcNextDueDate(prev.administeredDate || formatDMY(new Date()), 'MONTHS', 12))
                      }));
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Không cần hẹn lịch tiêm lại (Mũi điều trị đơn lẻ hoặc chưa cần hẹn trước)</span>
                </label>
              </div>

              {/* KHỐI 3: CHI TIẾT THỰC THI & KIỂM SOÁT Y KHOA */}
              <div style={{
                background: 'var(--card-inner-bg, rgba(255, 255, 255, 0.02))',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass, #F59E0B)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  3. Chi tiết thực hiện & Kiểm soát phản ứng
                </div>

                {/* Ngày tiêm & Số lô sản xuất */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Ngày tiêm thực tế (DD/MM/YYYY): <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={recordVaccineForm.administeredDate}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, administeredDate: e.target.value }))}
                      placeholder="13/11/2026"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Số Lô Vaccine (Batch / Lot Number): <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={recordVaccineForm.batchNumber}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="Ví dụ: LOT-TE2026-88A"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Liều lượng, Đường tiêm & Bác sĩ thực hiện */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Liều lượng:
                    </label>
                    <input
                      type="text"
                      value={recordVaccineForm.dose}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, dose: e.target.value }))}
                      placeholder="1.0 ml"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Đường tiêm:
                    </label>
                    <input
                      type="text"
                      value={recordVaccineForm.route}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, route: e.target.value }))}
                      placeholder="Tiêm bắp sâu (IM)"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Bác sĩ thực hiện:
                    </label>
                    <input
                      type="text"
                      value={recordVaccineForm.administeredBy}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, administeredBy: e.target.value }))}
                      placeholder="BS. Trần Minh Hoàng"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Phản ứng sau tiêm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Phản ứng sau tiêm (Adverse Reaction):
                    </label>
                    <select
                      value={recordVaccineForm.reaction}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, reaction: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: recordVaccineForm.reaction === 'NONE' ? '#10B981' : '#EF4444',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="NONE">Bình thường (Không có phản ứng phụ)</option>
                      <option value="LOCAL_SWELLING">Sưng nhẹ cục bộ tại vị trí tiêm</option>
                      <option value="MILD_FEVER">Sốt nhẹ thoáng qua (&lt; 38.5°C)</option>
                      <option value="LETHARGY">Ủ rũ / Kém ăn thoáng qua</option>
                      <option value="ANAPHYLAXIS">Dị ứng cấp tính / Cần can thiệp khẩn</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                      Chi tiết phản ứng & xử trí:
                    </label>
                    <input
                      type="text"
                      value={recordVaccineForm.reactionNotes}
                      onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, reactionNotes: e.target.value }))}
                      placeholder="Ví dụ: Chườm mát vị trí tiêm 15 phút..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '5px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--paper)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Ghi chú chuyên môn */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                    Ghi chú chuyên môn & Dặn dò chăm sóc:
                  </label>
                  <textarea
                    rows="2"
                    value={recordVaccineForm.notes}
                    onChange={(e) => setRecordVaccineForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ghi nhận thể trạng trước tiêm, kiểm tra thân nhiệt bình thường 38°C, dặn Groom cho nghỉ bài tập nặng 24 giờ..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--paper)',
                      fontSize: '12.5px',
                      lineHeight: 1.45,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Footer nút bấm */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowRecordVaccineModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '5px',
                    background: 'var(--card-inner-bg)',
                    color: 'var(--paper)',
                    border: '1px solid var(--line)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '5px',
                    background: 'var(--brass)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  Xác Nhận Lưu Mũi Tiêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profile Chiến Mã của Chủ Sở Hữu khi Bác Sĩ xác nhận */}
      {confirmedHorseModal && (
        <ConfirmedHorseProfileModal
          horse={confirmedHorseModal}
          role="VET"
          onClose={() => setConfirmedHorseModal(null)}
          onConfirmService={(h) => {
            const targetAsgn = h.assignmentData || h;
            handleConfirmVetService(targetAsgn);
          }}
          onAction={(h) => {
            setConfirmedHorseModal(null);
            handleOpenLockModal(h);
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
    </div>
  );
}
