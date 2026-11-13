import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  getHorsesApi,
  toggleHorseLockApi,
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
import { getServiceAssignments, confirmServiceAssignment, lookupFullHorseInfo } from '../services/serviceAssignment';
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

const IconBone = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 10c.7-.7 1.6-1 2.5-1a3.5 3.5 0 1 0-3.5 3.5c0 .9.3 1.8 1 2.5l-6 6c-.7-.7-1.6-1-2.5-1a3.5 3.5 0 1 0 3.5-3.5c0-.9-.3-1.8-1-2.5l6-6z" />
  </svg>
);

const IconShieldLock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
    <path d="M10 11V9a2 2 0 1 1 4 0v2" />
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

// Dữ liệu giải phẫu cơ thể chiến mã (Musculoskeletal Anatomy Zones)
const ANATOMY_PARTS = [
  { id: 'HOOF', nameVi: 'Móng & Guốc (Hoof & Sole)', nameEn: 'Hoof & Sole', risk: 'HIGH', descVi: 'Vùng dễ bị rạn nứt móng, áp xe móng chân hoặc xước guốc khi chạy sân cát', descEn: 'High impact zone prone to hoof cracking, abscess, or bruising from track surfaces' },
  { id: 'FETLOCK', nameVi: 'Gân gót & Khớp cổ chân (Fetlock & Tendon)', nameEn: 'Fetlock Joint & Tendon', risk: 'CRITICAL', descVi: 'Vùng dây chằng treo Suspensory Ligament, nguy cơ giãn gân cấp tính khi bứt tốc', descEn: 'Critical suspensory ligament site prone to acute flexor tendon strain during sprint finish' },
  { id: 'KNEE', nameVi: 'Khớp gối trước (Carpus / Front Knee)', nameEn: 'Carpal Knee Joint', risk: 'MEDIUM', descVi: 'Khớp chịu lực chính khi hạ chân, theo dõi tràn dịch bao hoạt dịch', descEn: 'Primary weight-bearing joint, monitor for synovial effusion or micro-fractures' },
  { id: 'SHOULDER', nameVi: 'Cơ vai & Ngực (Shoulder & Chest)', nameEn: 'Shoulder & Pectoral Muscle', risk: 'LOW', descVi: 'Vùng cơ sải chân, kiểm tra co rút cơ sau bài chạy cự ly dài 2.400m', descEn: 'Stride power muscles, check for post-endurance lactic acid cramping' },
  { id: 'BACK', nameVi: 'Cột sống & Lưng (Thoracolumbar Spine)', nameEn: 'Thoracolumbar Spine', risk: 'MEDIUM', descVi: 'Khung xương chịu tải của Jockey, kiểm tra co thắt cơ lưng', descEn: 'Jockey load bearing region, palpate for thoracic spine spasm or saddle soreness' },
  { id: 'RESPIRATORY', nameVi: 'Hệ hô hấp & Phổi (Respiratory & Lungs)', nameEn: 'Upper Airway & Lungs', risk: 'HIGH', descVi: 'Đánh giá tiếng thở rít, nội soi kiểm tra xuất huyết phổi do gắng sức (EIPH)', descEn: 'Scope for Exercise-Induced Pulmonary Hemorrhage (EIPH) and dorsal displacement' },
  { id: 'GI_TRACT', nameVi: 'Hệ tiêu hóa & Bụng (Colic / Abdomen)', nameEn: 'GI Tract & Colic Screen', risk: 'CRITICAL', descVi: 'Dấu hiệu đau bụng Colic cấp tính, nghe âm nhu động ruột 4 góc bụng', descEn: 'Acute colic auscultation in four quadrants, check for gut hypomotility' }
];

// Dữ liệu mẫu y tế khởi tạo mặc định rỗng để người dùng đăng ký mới hoàn toàn
const DEFAULT_SEED_HORSES = [];
const DEFAULT_SEED_INCIDENTS = [];
const DEFAULT_SEED_VACCINES = [];
const DEFAULT_SEED_PRESCRIPTIONS = [];
const DEFAULT_SEED_CLEARANCE = [];

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
      if (paramTab && ['horses', 'triage', 'anatomy', 'lockout', 'vaccines', 'prescriptions', 'clearance'].includes(paramTab)) {
        return paramTab;
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && ['horses', 'triage', 'anatomy', 'lockout', 'vaccines', 'prescriptions', 'clearance'].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('matruong_tab_vet');
      return ['horses', 'triage', 'anatomy', 'lockout', 'vaccines', 'prescriptions', 'clearance'].includes(saved) ? saved : 'horses';
    } catch {
      return 'horses';
    }
  }); // 'horses' | 'triage' | 'anatomy' | 'lockout' | 'vaccines' | 'prescriptions' | 'clearance'

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
  const [selectedAnatomy, setSelectedAnatomy] = useState(() => {
    try {
      const savedId = localStorage.getItem('matruong_vet_anatomy_id');
      const found = ANATOMY_PARTS.find(p => String(p.id) === String(savedId));
      return found || ANATOMY_PARTS[1];
    } catch {
      return ANATOMY_PARTS[1];
    }
  }); // Mặc định là Fetlock (Gân gót)

  // Lưu selectedAnatomy vào localStorage để khi F5 giữ đúng vị trí giải phẫu đang chọn
  useEffect(() => {
    try {
      if (selectedAnatomy?.id) {
        localStorage.setItem('matruong_vet_anatomy_id', String(selectedAnatomy.id));
      }
    } catch {}
  }, [selectedAnatomy]);
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

  // 3. Sổ tiêm chủng Vaccine
  const [vaccines, setVaccines] = useState(() => {
    if (isNewAccount) {
      try {
        const stored = localStorage.getItem(`matruong_vet_vaccines_${currentUser.user_id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
    return DEFAULT_SEED_VACCINES;
  });

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

  // Bộ lọc & Tìm kiếm danh bạ Hồ sơ chiến mã (tab 'horses')
  const [horseSearchTerm, setHorseSearchTerm] = useState('');
  const [horseFilterStatus, setHorseFilterStatus] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'LOCKED'
  const [horseFilterBreed, setHorseFilterBreed] = useState('ALL');

  const pendingVetAssignments = useMemo(() => {
    const uName = (currentUser?.username || '').trim().toLowerCase();
    const fName = (currentUser?.full_name || '').trim().toLowerCase();
    const isMyVetHorse = (a) => (
      (a.vetUsername && a.vetUsername.trim().toLowerCase() === uName) ||
      (!a.vetUsername && a.vetName && a.vetName.trim().toLowerCase() === fName)
    );
    return serviceAssignments.filter(a => isMyVetHorse(a) && a.vetStatus === 'PENDING');
  }, [serviceAssignments, currentUser]);

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

  // Xử lý Khóa / Mở khóa Y tế (Quyền phủ quyết Y tế - Medical Safety Veto)
  const handleToggleLock = (horse, customReason = '') => {
    const nextLocked = !horse.locked;
    const reason = customReason || (nextLocked ? 'Khám nghiệm Thú y phát hiện dấu hiệu bất thường, kích hoạt phong tỏa y tế!' : '');

    // Đồng bộ với API Backend
    toggleHorseLockApi(horse.id, nextLocked).catch(() => {});

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
      } catch {}
      return next;
    });

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

    setIncidents(prev => prev.map(item => {
      if (item.id === inc.id) {
        return {
          ...item,
          status: 'in_review',
          statusText: 'Bác sĩ Thú y đã tiếp nhận & đang đến ô chuồng'
        };
      }
      return item;
    }));

    updateIncidentStatusApi(inc.id, {
      status: 'in_review',
      statusText: 'Bác sĩ Thú y đã tiếp nhận & đang đến ô chuồng'
    }).catch(() => {});

    try {
      addSystemNotification({
        type: 'INCIDENT_ACCEPTED',
        title: `TIẾP NHẬN THĂM KHÁM: ${inc.horseName?.toUpperCase()}`,
        message: `BS. ${currentUser?.full_name || 'Bác sĩ Thú y'} đã xác nhận tiếp nhận ca báo động ${inc.id} và đang đến ô chuồng ${inc.stallCode || inc.stall || ''} để thăm khám trực tiếp.`,
        horseName: inc.horseName,
        stall: inc.stallCode || inc.stall,
        recipientRoles: ['GROOM', 'OWNER', 'ADMIN', 'ALL']
      });
    } catch {}

    showToast(
      `Đã xác nhận tiếp nhận ca ${inc.id}. Hệ thống đã gửi thông báo đến Groom phụ trách!`,
      'TIẾP NHẬN THĂM KHÁM',
      'success'
    );

    if (selectedIncidentModal && selectedIncidentModal.id === inc.id) {
      setSelectedIncidentModal(prev => ({ ...prev, status: 'in_review' }));
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

  // Hoàn tất mũi tiêm vaccine 1-chạm
  const handleMarkVaccineDone = (vacId) => {
    setVaccines(prev => {
      const next = prev.map(v => {
        if (v.id === vacId) {
          return { ...v, status: 'UP_TO_DATE', dueDate: '15/04/2027', dose: v.dose || '2.0 ml', vetInCharge: v.vetInCharge || (currentUser?.full_name || 'Bác sĩ Thú y') };
        }
        return v;
      });
      try {
        localStorage.setItem('matruong_vet_vaccines', JSON.stringify(next));
      } catch {}
      return next;
    });
    recordVaccinationApi({ id: vacId, status: 'UP_TO_DATE' }).catch(() => {});
    showToast('Đã xác nhận tiêm chủng & gia hạn lịch tiêm phòng thành công!', 'TIÊM CHỦNG ĐÃ LƯU', 'info');
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
            {incidents.filter(i => i.status === 'pending_vet').length > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {incidents.filter(i => i.status === 'pending_vet').length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'anatomy' ? 'active' : ''}`}
            onClick={() => { setActiveTab('anatomy'); setSidebarOpen(false); }}
            title="Bản đồ Giải phẫu Cơ xương khớp"
          >
            <span className="portal-nav-icon"><IconBone size={18} /></span>
            <span className="portal-nav-label">Bản đồ giải phẫu</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'lockout' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lockout'); setSidebarOpen(false); }}
            title="Quyền Khóa Y Tế Thú Y (Medical Safety Veto)"
          >
            <span className="portal-nav-icon"><IconShieldLock size={18} /></span>
            <span className="portal-nav-label">Khóa y tế (Veto)</span>
            <span className="portal-nav-badge">
              {horses.filter(h => h.locked).length} khóa
            </span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'vaccines' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vaccines'); setSidebarOpen(false); }}
            title="Sổ Tiêm Chủng Vaccine & Tẩy Giun Định Kỳ"
          >
            <span className="portal-nav-icon"><IconSyringe size={18} /></span>
            <span className="portal-nav-label">Sổ tiêm chủng</span>
            <span className="portal-nav-badge">{vaccines.length}</span>
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

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'clearance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('clearance'); setSidebarOpen(false); }}
            title="Phê Duyệt Y Tế Tham Gia Thi Đấu"
          >
            <span className="portal-nav-icon"><IconClipboardCheck size={18} /></span>
            <span className="portal-nav-label">Phê duyệt thi đấu</span>
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
                Veterinary Clinical Hospital & Medical Safety Lockout Protocol
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

              {/* Bốn thẻ thống kê KPI nhanh - Phong cách tối giản chuyên nghiệp */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Tổng Ngựa Phụ Trách
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brass)', marginTop: '4px' }}>
                    {horses.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>chiến mã</span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Đủ Điều Kiện (FIT)
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {horses.filter(h => !h.locked && h.status !== 'INJURED').length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>sẵn sàng</span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Đang Khóa Y Tế (VETO)
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
                    {horses.filter(h => h.locked || h.status === 'INJURED').length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>cấm tập</span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Yêu Cầu Chờ Tiếp Nhận
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                    {pendingVetAssignments.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>yêu cầu</span>
                  </div>
                </div>
              </div>

              {/* Khối Yêu Cầu Chờ Bác Sĩ Xác Nhận nếu có */}
              {pendingVetAssignments.length > 0 && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                      Yêu Cầu Chỉ Định Bác Sĩ Thú Y Chờ Xác Nhận ({pendingVetAssignments.length})
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0A0D14', background: '#10B981', padding: '2px 8px', borderRadius: '4px' }}>
                      Cần tiếp nhận
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '10px' }}>
                    {pendingVetAssignments.map(asgn => (
                      <div
                        key={asgn.id || asgn.microchip}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '6px',
                          padding: '14px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <b style={{ color: 'var(--paper)', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {asgn.horseName}
                            </b>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brass)', background: 'rgba(212, 175, 55, 0.1)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                              {asgn.stable || 'Ô A2'}
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
              
                                color: 'var(--brass)',
                                border: '1px solid rgba(212, 175, 55, 0.4)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Xem hồ sơ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmVetService(asgn)}
                              style={{
                                background: '#10B981',
                                color: '#0A0D14',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Xác nhận
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                          Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{asgn.ownerName || 'Chủ sở hữu'}</b> · Chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{asgn.microchip || '--'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thanh Tìm Kiếm & Bộ Lọc Nâng Cao */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    value={horseSearchTerm}
                    onChange={(e) => setHorseSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên ngựa, mã chip, chủ sở hữu, chuồng..."
                    style={{
                      width: '100%',
    
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                  {horseSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setHorseSearchTerm('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--paper-dim)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Lọc theo trạng thái */}
                  <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '6px', padding: '2px', border: '1px solid var(--line)' }}>
                    <button
                      type="button"
                      onClick={() => setHorseFilterStatus('ALL')}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '4px',
                        border: 'none',
                        background: horseFilterStatus === 'ALL' ? 'var(--brass)' : 'transparent',
                        color: horseFilterStatus === 'ALL' ? '#0A0D14' : 'var(--paper-dim)',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Tất cả ({horses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHorseFilterStatus('ELIGIBLE')}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '4px',
                        border: 'none',
                        background: horseFilterStatus === 'ELIGIBLE' ? '#10B981' : 'transparent',
                        color: horseFilterStatus === 'ELIGIBLE' ? '#0A0D14' : 'var(--paper-dim)',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Đủ điều kiện ({horses.filter(h => !h.locked && h.status !== 'INJURED').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHorseFilterStatus('LOCKED')}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '4px',
                        border: 'none',
                        background: horseFilterStatus === 'LOCKED' ? '#EF4444' : 'transparent',
                        color: horseFilterStatus === 'LOCKED' ? '#FFFFFF' : 'var(--paper-dim)',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Khóa y tế ({horses.filter(h => h.locked || h.status === 'INJURED').length})
                    </button>
                  </div>

                  {/* Lọc theo giống */}
                  {breedOptions.length > 0 && (
                    <select
                      value={horseFilterBreed}
                      onChange={(e) => setHorseFilterBreed(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                        background: 'var(--bg-primary)',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        outline: 'none',
                        cursor: 'pointer'
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

              {/* Lưới danh thiếp Hồ Sơ Chiến Mã */}
              {filteredHorseProfiles.length === 0 ? (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--line)',
                  borderRadius: '8px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: 'var(--paper-dim)'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>
                    Không tìm thấy chiến mã nào phù hợp
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.
                  </div>
                  <button
                    type="button"
                    onClick={() => { setHorseSearchTerm(''); setHorseFilterStatus('ALL'); setHorseFilterBreed('ALL'); }}
                    style={{
                      marginTop: '12px',
                      padding: '5px 12px',
                      borderRadius: '4px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '14px'
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
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.35)' : 'var(--line)'}`,
                          borderRadius: '10px',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.18)'
                        }}
                      >
                        {/* Header của thẻ: Avatar + Tên + Chuồng + Trạng thái */}
                        <div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                            <img
                              src={avatarSrc}
                              alt={h.name}
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.5)' : 'var(--line-strong, #334155)'}`,
                                flexShrink: 0
                              }}
                              onError={(e) => { e.target.src = defaultAvatar; }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                  <h3
                                    style={{
                                      margin: 0,
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      color: 'var(--brass)',
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
                                    background: 'rgba(212, 175, 55, 0.1)',
                                    border: '1px solid rgba(212, 175, 55, 0.25)',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}>
                                    {h.stable || full.stable || 'Ô A1'}
                                  </span>
                                </div>

                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  color: isLocked ? '#EF4444' : '#10B981',
                                  border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                }}>
                                  {isLocked ? 'KHÓA Y TẾ' : 'ĐỦ ĐIỀU KIỆN'}
                                </span>
                              </div>

                              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {h.breed || full.breed || 'Thoroughbred'} · {full.gender || 'Ngựa đực'} · {full.age || '3 tuổi'}
                              </div>

                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                Mã Chip: <span style={{ fontFamily: 'monospace', color: 'var(--paper)', fontWeight: 600 }}>{h.microchip || full.microchip || '--'}</span>
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
                            color: 'var(--paper-dim)'
                          }}>
                            <span>Chủ sở hữu: <b style={{ color: 'var(--paper)', fontWeight: 600 }}>{h.ownerName || h.owner || full.ownerName || 'Chủ sở hữu'}</b></span>
                            <span style={{ color: 'var(--brass)', fontWeight: 600 }}>
                              {full.ownershipShare ? `${full.ownershipShare}%` : '100%'} sở hữu
                            </span>
                          </div>

                          {/* Dòng máu & Phả hệ tóm tắt */}
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            fontSize: '11.5px',
                            marginBottom: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
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

                          {/* Chỉ số sinh hiệu */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            fontSize: '11.5px',
                            marginBottom: '12px',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--line)'
                          }}>
                            <div style={{ color: 'var(--paper-dim)' }}>
                              Nhịp tim: <b style={{ color: 'var(--paper)', fontWeight: 600 }}>{h.restingHeartRate || '38 bpm'}</b>
                            </div>
                            <div style={{ color: 'var(--paper-dim)', textAlign: 'right' }}>
                              Thân nhiệt: <b style={{ color: 'var(--paper)', fontWeight: 600 }}>{h.tempCelsius ? `${h.tempCelsius}°C` : '38.0°C'}</b>
                            </div>
                          </div>
                        </div>

                        {/* Hàng 3 nút thao tác chuẩn */}
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmedHorseModal(full)}
                            style={{
                              flex: 1,
                              padding: '7px 8px',
                              borderRadius: '5px',
            
                              border: '1px solid var(--line-strong, #334155)',
                              color: '#FFFFFF',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Xem hồ sơ
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPedigreeHorse(full)}
                            style={{
                              flex: 1,
                              padding: '7px 8px',
                              borderRadius: '5px',
                              background: 'rgba(212, 175, 55, 0.08)',
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
                              padding: '7px 12px',
                              borderRadius: '5px',
                              background: isLocked ? 'var(--brass)' : 'transparent',
                              border: isLocked ? '1px solid var(--brass)' : '1px solid rgba(239, 68, 68, 0.4)',
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
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'var(--brass)',
                      color: '#14100A',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(232, 107, 44, 0.35)'
                    }}
                    title="Mô phỏng nhân viên Groom gửi lên 1 ca sự cố sau khi tài khoản được duyệt"
                  >
                    <span>+</span> Tiếp nhận ca sự cố mới từ Groom
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
                    <span style={{ fontSize: '22px' }}>🩺</span>
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
                      padding: '6px 12px',
                      background: 'rgba(232, 107, 44, 0.15)',
                      border: '1px solid var(--brass)',
                      color: 'var(--brass)',
                      borderRadius: '5px',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Mô phỏng ca tiếp nhận →
                  </button>
                </div>
              )}

              {/* Khối Yêu Cầu Phục Vụ Thú Y Chờ Bác Sĩ Xác Nhận */}
              {(() => {
                const uName = (currentUser?.username || '').trim().toLowerCase();
                const fName = (currentUser?.full_name || '').trim().toLowerCase();
                const isMyVetHorse = (a) => (
                  (a.vetUsername && a.vetUsername.trim().toLowerCase() === uName) ||
                  (!a.vetUsername && a.vetName && a.vetName.trim().toLowerCase() === fName)
                );
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
                        <span style={{ fontSize: '20px' }}>🩺</span>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>
                            Yêu Cầu Bác Sĩ Thú Y Phụ Trách Chờ Xác Nhận ({pendingVetAssignments.length})
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                            Chủ sở hữu đã chỉ định Bác sĩ thú y phụ trách y tế & dinh dưỡng. Vui lòng bấm xác nhận để tiếp nhận vào danh sách theo dõi lâm sàng.
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0A0D14', background: '#10B981', padding: '4px 12px', borderRadius: '12px' }}>
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
                
                                  color: 'var(--brass)',
                                  border: '1px solid rgba(212, 175, 55, 0.4)',
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
                                ✓ Xác Nhận Phụ Trách Y Tế
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

              {/* Chỉ số nhanh (3 thẻ ngang cân đối chuẩn SaaS Dashboard theo đúng 3 màu chủ đạo) */}
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
                      CHỜ BÁC SĨ KHÁM GẤP
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brass)', boxShadow: '0 0 8px var(--brass-glow)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brass)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                    {incidents.filter(i => i.status === 'pending_vet').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Cần thăm khám trực tiếp tại ô chuồng
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
                      ĐANG THEO DÕI ĐIỀU TRỊ
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-dim)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                    {incidents.filter(i => i.status === 'in_review').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Có phác đồ chăm sóc ban đầu
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
                      ĐÃ XỬ LÝ ỔN ĐỊNH
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-muted)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                    {incidents.filter(i => i.status === 'resolved').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Bác sĩ Thú y đã ký duyệt hoàn tất
                  </div>
                </div>
              </div>

              {/* Danh sách thẻ sự cố */}
              {incidents.length === 0 ? (
                <div style={{
                  padding: '50px 24px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  border: '1.5px dashed var(--line-strong)',
                  borderRadius: '16px',
              background: 'var(--bg-card, #20362B)',
              padding: '26px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  margin: '10px 0 24px'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(232, 107, 44, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brass)',
                    fontSize: '30px'
                  }}>
                    🩺
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--paper)', fontWeight: 800 }}>
                      Hiện chưa có ca sự cố lâm sàng nào cần xử lý (0 CA)
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--paper-dim)', maxWidth: '560px', lineHeight: 1.6 }}>
                      Tài khoản Bác sĩ Thú y của bạn vừa được Quản trị viên (Admin) phê duyệt thành công. Vì đây là tài khoản mới, dữ liệu xuất phát từ 0. Khi có ca báo cáo mới từ nhân viên Groom và HLV gửi lên sau thời điểm này, dữ liệu sẽ tự động đồng bộ theo thời gian thực.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateNewIncident}
                    style={{
                      marginTop: '6px',
                      padding: '10px 20px',
                      background: 'var(--brass)',
                      color: '#14100A',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(232, 107, 44, 0.35)'
                    }}
                  >
                    + Mô phỏng tiếp nhận ca sự cố mới từ Groom
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '18px' }}>
                {incidents.map((inc) => {
                  const isPending = inc.status === 'pending_vet';
                  const isInReview = inc.status === 'in_review';
                  const isCritical = inc.severity === 'CRITICAL';
                  const isHigh = inc.severity === 'HIGH';

                  const badgeColor = isCritical ? '#EF4444' : isHigh ? '#F59E0B' : '#3B82F6';
                  const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)';

                  return (
                    <div
                      key={inc.id}
                      className="facility-card"
                      style={{
                        borderColor: isPending ? (isCritical ? '#EF4444' : 'var(--brass)') : 'var(--line)',
                        boxShadow: isPending ? (isCritical ? '0 0 16px rgba(239, 68, 68, 0.3)' : '0 0 16px var(--brass-glow)') : 'none',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}`,
                            letterSpacing: '0.04em'
                          }}>
                            {inc.severity}
                          </span>
                          <b style={{ color: 'var(--paper)', fontSize: '13.5px' }}>{inc.id}</b>
                          {isPending && (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#EF4444',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              padding: '2px 6px',
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
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đang Thăm Khám
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{inc.timestamp}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                        {inc.imageUrl && (
                          <img
                            src={inc.imageUrl}
                            alt="Ảnh hiện trường"
                            style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--line)' }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brass)' }}>
                            {inc.horseName} · <span style={{ color: 'var(--paper)' }}>{inc.stall || `Ô chuồng ${inc.stallCode}`}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', margin: '3px 0' }}>
                            Báo cáo bởi: <b style={{ color: 'var(--paper)' }}>{inc.reportedBy}</b>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {Array.isArray(inc.symptoms) && inc.symptoms.map((sym, idx) => (
                              <span key={idx} style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--paper)', border: '1px solid var(--line)' }}>
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Chỉ số sinh tồn sơ bộ do Groom ghi nhận */}
                      {inc.vitalSigns && (
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          marginBottom: '10px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          fontSize: '11px'
                        }}>
                          <div>
                            <span style={{ color: 'var(--paper-dim)' }}>Thân nhiệt:</span>
                            <div style={{ fontWeight: 700, color: Number((inc.vitalSigns.temp || '').replace(/[^0-9.]/g, '')) > 38.5 ? '#EF4444' : 'var(--paper)' }}>
                              {inc.vitalSigns.temp || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)' }}>Nhịp thở:</span>
                            <div style={{ fontWeight: 700, color: 'var(--paper)' }}>{inc.vitalSigns.respRate || 'N/A'}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)' }}>Niêm mạc:</span>
                            <div style={{ fontWeight: 600, color: 'var(--paper)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {inc.vitalSigns.mucousColor?.split(' ')[0] || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--paper-dim)' }}>Tiếng ruột:</span>
                            <div style={{ fontWeight: 600, color: 'var(--paper)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {inc.vitalSigns.gutSounds?.split(' ')[0] || 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mô tả chi tiết Groom */}
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--paper)', marginBottom: '12px', lineHeight: '1.45' }}>
                        {inc.description}
                      </div>

                      {/* Thao tác sơ cứu Groom đã thực hiện */}
                      {inc.firstAidActions && inc.firstAidActions.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#10B981', marginBottom: '12px', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                          <b>Sơ cứu hiện trường:</b> {inc.firstAidActions.join(' · ')}
                        </div>
                      )}

                      {/* Chẩn đoán của Bác sĩ nếu đã xử lý */}
                      {inc.vetDiagnosis && (
                        <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                          <b style={{ color: 'var(--brass)' }}>Chẩn đoán BS Thú y:</b> {inc.vetDiagnosis}
                          {inc.actionTaken && <div style={{ color: 'var(--paper-dim)', marginTop: '4px' }}>• Xử lý: {inc.actionTaken}</div>}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleAcceptIncident(inc)}
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              fontWeight: 700,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap'
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
                            flex: 1,
                            padding: '8px 14px',
                            background: isPending ? 'var(--brass)' : 'var(--bg-secondary)',
                            color: isPending ? '#000000' : 'var(--paper)',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: isPending ? 'none' : '1px solid var(--line)',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isPending ? 'Xác Nhận & Thăm Khám' : 'Cập nhật diễn biến'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const matched = horses.find(h => String(h?.name || '').toLowerCase() === String(inc?.horseName || '').toLowerCase());
                            if (matched) handleOpenLockModal(matched);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--paper-dim)',
                            border: '1px solid var(--line)',
                            fontWeight: 600,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                          }}
                          title="Kích hoạt lệnh cấm tập nặng ngay lập tức"
                        >
                          Khóa Y Tế
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
          {/* TAB 2: BẢN ĐỒ GIẢI PHẪU CƠ XƯƠNG KHỚP 3D */}
          {/* ========================================================================= */}
          {activeTab === 'anatomy' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Bản đồ Giải phẫu Cơ xương khớp (Musculoskeletal Anatomy)</h2>
                  <p className="pane-desc">Đánh dấu và theo dõi chính xác các vùng tổn thương, dây chằng và hệ cơ quan chịu tải.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                {/* Khung trực quan hóa các vùng giải phẫu */}
                <div className="facility-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--brass)' }}>
                    Sơ đồ Cơ quan & Vùng Chấn thương (Interactive Hotspots)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ANATOMY_PARTS.map((part) => {
                      const isSelected = selectedAnatomy?.id === part.id;
                      const isHighRisk = part.risk === 'CRITICAL' || part.risk === 'HIGH';

                      return (
                        <div
                          key={part.id}
                          onClick={() => setSelectedAnatomy(part)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? 'var(--brass)' : 'var(--line)'}`,
                            background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? 'var(--brass)' : 'var(--paper)' }}>
                              {part.nameVi}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                              {part.descVi}
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isHighRisk ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-card)',
                            color: isHighRisk ? 'var(--brass)' : 'var(--paper-dim)',
                            border: `1px solid ${isHighRisk ? 'var(--brass)' : 'var(--line)'}`,
                            whiteSpace: 'nowrap',
                            marginLeft: '12px'
                          }}>
                            {part.risk}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chi tiết ca bệnh giải phẫu được chọn */}
                <div className="facility-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--paper)' }}>
                    Hồ sơ Điều trị: <span style={{ color: 'var(--brass)' }}>{selectedAnatomy?.nameVi}</span>
                  </h3>

                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '18px 20px', borderRadius: '12px', border: '1px solid rgba(232, 237, 232, 0.15)', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>Mô tả bệnh học thể thao:</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--paper)', margin: '6px 0', lineHeight: '1.45' }}>
                      {selectedAnatomy?.descVi}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                      Tên y khoa quốc tế: <i>{selectedAnatomy?.nameEn}</i>
                    </div>
                  </div>

                  <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px', color: 'var(--paper)' }}>
                    Chiến mã đang ghi nhận tổn thương tại vùng này:
                  </h4>

                  {selectedAnatomy?.id === 'FETLOCK' ? (
                    <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b style={{ color: 'var(--brass)' }}>Phi Yến (Ô A5)</b>
                        <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>MC-VN-2023-009</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '4px' }}>
                        Giãn gân trước trái cấp độ 2 sau bài tập nước rút. Đang áp dụng lệnh Khóa Y Tế & Chườm đá lạnh Cryo.
                      </div>
                    </div>
                  ) : selectedAnatomy?.id === 'GI_TRACT' ? (
                    <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b style={{ color: 'var(--brass)' }}>Hắc Phong (Ô A3)</b>
                        <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>MC-VN-2022-001</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '4px' }}>
                        Nghi ngờ đau bụng nhẹ (Colic), nghe nhu động ruột giảm. Đang dùng Omeprazole và men vi sinh.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--paper-dim)', fontSize: '13px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--line)' }}>
                      Không có chiến mã nào đang bị tổn thương cấp tính tại vùng giải phẫu này.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRxModal(true);
                      setNewRxData(prev => ({ ...prev, diagnosis: `Tổn thương cơ xương khớp vùng ${selectedAnatomy?.nameVi}` }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '12px'
                    }}
                  >
                    + Lập phác đồ điều trị cho vùng này
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: QUYỀN KHÓA Y TẾ (MEDICAL SAFETY VETO) */}
          {/* ========================================================================= */}
          {activeTab === 'lockout' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Quyền Khóa Y Tế Thú Y (Medical Safety Lockout Protocol)</h2>
                  <p className="pane-desc">
                    Công cụ quyền lực nhất của Bác sĩ Thú y: Ngay lập tức đình chỉ mọi bài tập nặng và cấm thi đấu để bảo vệ sinh mạng chiến mã.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã chip..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      width: '240px'
                    }}
                  />
                </div>
              </div>

              {/* Bảng danh sách khóa y tế */}
              <div className="facility-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--line)', borderRadius: '10px', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'auto' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px', width: '16%' }}>Chiến mã</th>
                      <th style={{ padding: '12px 10px', width: '13%' }}>Chủ sở hữu</th>
                      <th style={{ padding: '12px 10px', width: '11%' }}>Mã Chip RFID</th>
                      <th style={{ padding: '12px 10px', width: '8%' }}>Ô Chuồng</th>
                      <th style={{ padding: '12px 10px', width: '11%' }}>Sinh hiệu</th>
                      <th style={{ padding: '12px 10px', width: '13%' }}>Tình trạng</th>
                      <th style={{ padding: '12px 10px', width: '14%' }}>Lý do / Phác đồ</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', width: '14%' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHorses.map((h) => {
                      const isLocked = h.locked;
                      const rawStall = h.stable || h.stall || 'A1';
                      const stallClean = rawStall.replace(/^(Ô|Chuồng)\s*/i, '').trim();

                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--line)', background: isLocked ? 'rgba(212, 175, 55, 0.04)' : 'transparent' }}>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {h.avatar && (
                                <img
                                  src={h.avatar}
                                  alt={h.name}
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: isLocked ? '2px solid var(--brass)' : '1px solid var(--line)' }}
                                  onError={(e) => {
                                    e.target.src = h.name === 'Bạch Long'
                                      ? 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
                                      : 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80';
                                  }}
                                />
                              )}
                              <div>
                                <b style={{ fontSize: '14px', color: 'var(--brass)', whiteSpace: 'nowrap' }}>{h.name}</b>
                                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>{h.breed}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <b style={{ color: 'var(--brass)', fontSize: '13px', whiteSpace: 'nowrap' }}>{h.owner || h.ownerName || 'Chủ sở hữu'}</b>
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--paper)', whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: '12.5px' }}>
                            {h.microchip || h.chipId || 'N/A'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--paper)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            Ô {stallClean}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            <div style={{ whiteSpace: 'nowrap' }}>Nhịp tim: <b style={{ color: 'var(--paper)' }}>{h.restingHeartRate || '38 bpm'}</b></div>
                            <div style={{ whiteSpace: 'nowrap', marginTop: '2px' }}>Thân nhiệt: <b style={{ color: 'var(--paper)' }}>{h.tempCelsius || '38.0'}°C</b></div>
                          </td>
                          <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              background: isLocked ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                              color: isLocked ? 'var(--brass)' : '#10B981',
                              border: `1px solid ${isLocked ? 'var(--brass)' : 'rgba(16, 185, 129, 0.35)'}`
                            }}>
                              {isLocked ? '🔒 KHÓA Y TẾ (VETO)' : '✓ ĐỦ ĐIỀU KIỆN (FIT)'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--paper)', maxWidth: '240px', minWidth: '180px', verticalAlign: 'middle', lineHeight: 1.45 }}>
                            {isLocked ? (
                              <span style={{ color: 'var(--brass)' }}>{h.lockReason || 'Khám nghiệm Thú y ghi nhận chấn thương.'}</span>
                            ) : (
                              <span style={{ color: 'var(--paper-dim)' }}>Sinh hiệu bình thường, không có lệnh cấm.</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const full = lookupFullHorseInfo(h.name || h.microchip);
                                  setConfirmedHorseModal(full);
                                }}
                                style={{
                                  width: '84px',
                                  height: '30px',
                
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '5px',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                
                                  color: 'var(--brass)',
                                  border: '1px solid var(--brass)',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  boxSizing: 'border-box',
                                  transition: 'all 0.2s ease'
                                }}
                                title="Xem chi tiết hồ sơ lâm sàng chiến mã"
                              >
                                Xem hồ sơ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenLockModal(h)}
                                style={{
                                  width: '124px',
                                  height: '30px',
                
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '5px',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  background: isLocked ? 'var(--brass)' : 'var(--bg-secondary)',
                                  color: isLocked ? '#0A0D14' : 'var(--paper)',
                                  border: isLocked ? 'none' : '1px solid var(--line)',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  boxSizing: 'border-box',
                                  boxShadow: isLocked ? '0 2px 8px rgba(212, 175, 55, 0.3)' : 'none',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {isLocked ? '🔓 MỞ KHÓA Y TẾ' : '🔒 KHÓA Y TẾ'}
                              </button>
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

          {/* ========================================================================= */}
          {/* TAB 4: SỔ TIÊM CHỦNG VACCINE & TẨY GIUN */}
          {/* ========================================================================= */}
          {activeTab === 'vaccines' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Sổ Tiêm Chủng Vaccine & Chăm Sóc Định Kỳ (Preventive Medicine)</h2>
                  <p className="pane-desc">Đếm ngược lịch tiêm phòng dịch tễ, tẩy giun và chu kỳ gọt móng theo chuẩn FEI quốc tế.</p>
                </div>
              </div>

              <div className="facility-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--line)', borderRadius: '10px', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'auto' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px', width: '15%' }}>Chiến mã</th>
                      <th style={{ padding: '12px 14px', width: '25%' }}>Loại Vaccine / Dịch vụ</th>
                      <th style={{ padding: '12px 10px', width: '13%' }}>Liều lượng</th>
                      <th style={{ padding: '12px 10px', width: '13%' }}>Hạn tiêm kế tiếp</th>
                      <th style={{ padding: '12px 10px', width: '12%' }}>Tình trạng</th>
                      <th style={{ padding: '12px 10px', width: '11%' }}>Bác sĩ phụ trách</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', width: '11%' }}>Xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccines.map((v) => {
                      const isCompleted = v.status === 'UP_TO_DATE' || v.status === 'COMPLETED';
                      const isOverdue = v.status === 'OVERDUE';
                      const isDueSoon = v.status === 'DUE_SOON';
                      const needsAttention = isOverdue || isDueSoon;
                      const statusText = isCompleted ? 'ĐÃ HOÀN TẤT' : isOverdue ? 'QUÁ HẠN TIÊM' : isDueSoon ? 'SẮP ĐẾN HẠN' : 'CHỜ TIÊM';
                      const badgeBg = isCompleted ? 'rgba(16, 185, 129, 0.12)' : isOverdue ? 'rgba(239, 68, 68, 0.12)' : isDueSoon ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)';
                      const badgeColor = isCompleted ? '#10B981' : isOverdue ? '#EF4444' : isDueSoon ? '#F59E0B' : '#60A5FA';
                      const badgeBorder = isCompleted ? 'rgba(16, 185, 129, 0.35)' : isOverdue ? 'rgba(239, 68, 68, 0.35)' : isDueSoon ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.35)';

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}><b style={{ color: 'var(--brass)', fontSize: '13.5px' }}>{v.horseName}</b></td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--paper)', verticalAlign: 'middle', lineHeight: 1.35 }}>{v.vaccineType}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper-dim)', verticalAlign: 'middle', fontSize: '12.5px' }}>{v.dose || '2.0 ml (Tiêm bắp)'}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600, color: (isOverdue || isDueSoon) ? 'var(--brass)' : 'var(--paper)', verticalAlign: 'middle', fontSize: '12.5px' }}>{v.dueDate || v.scheduledDate || '15/11/2026'}</td>
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
                              {statusText}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper-dim)', verticalAlign: 'middle', fontSize: '12px' }}>{v.vetInCharge || currentUser?.full_name || 'BS. Nguyễn An'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={() => handleMarkVaccineDone(v.id)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                ✓ Xác nhận tiêm
                              </button>
                            ) : (
                              <span style={{ color: '#10B981', fontWeight: 700, fontSize: '11.5px', whiteSpace: 'nowrap' }}>✓ Hợp lệ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

          {/* ========================================================================= */}
          {/* TAB 6: PHÊ DUYỆT Y TẾ THI ĐẤU (VET CLEARANCE) */}
          {/* ========================================================================= */}
          {activeTab === 'clearance' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Phê Duyệt Y Tế Thi Đấu (Vet Race Clearance)</h2>
                  <p className="pane-desc">
                    Bác sĩ Thú y thực hiện kiểm định thể lực cuối cùng trước khi cấp phép cho chiến mã bước vào ngày thi đấu chính thức.
                  </p>
                </div>
              </div>

              <div className="facility-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--line)', borderRadius: '10px', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'auto' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px', width: '15%' }}>Chiến mã</th>
                      <th style={{ padding: '12px 14px', width: '23%' }}>Giải Đua Đăng Ký</th>
                      <th style={{ padding: '12px 10px', width: '8%' }}>Cự ly</th>
                      <th style={{ padding: '12px 10px', width: '10%' }}>Ngày đua</th>
                      <th style={{ padding: '12px 10px', width: '16%' }}>Trạng thái Phê duyệt</th>
                      <th style={{ padding: '12px 12px', width: '17%' }}>Kết luận Bác sĩ Thú y</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', width: '12%' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raceClearanceList.map((rc) => {
                      const isCleared = rc.vetStatus === 'CLEARED';
                      const isRejected = rc.vetStatus === 'REJECTED_INJURY';
                      const isPending = !isCleared && !isRejected;
                      const statusLabel = isCleared ? 'ĐÃ ĐƯỢC CẤP PHÉP' : isRejected ? 'BÁC BỎ DO CHẤN THƯƠNG' : 'CHỜ KHÁM LÂM SÀNG';

                      return (
                        <tr key={rc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--brass)', verticalAlign: 'middle' }}>{rc.horseName}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--paper)', verticalAlign: 'middle', lineHeight: 1.35 }}>{rc.raceName}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper-dim)', verticalAlign: 'middle' }}>{rc.distance}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--paper-dim)', verticalAlign: 'middle' }}>{rc.date}</td>
                          <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              background: isPending ? 'rgba(212, 175, 55, 0.15)' : isCleared ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isPending ? 'var(--brass)' : isCleared ? '#10B981' : '#EF4444',
                              border: `1px solid ${isPending ? 'var(--brass)' : isCleared ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                            }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px', fontSize: '12px', color: 'var(--paper)', verticalAlign: 'middle', lineHeight: 1.45 }}>
                            {rc.notes}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                onClick={() => handleApproveClearance(rc)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  border: 'none',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '11.5px'
                                }}
                              >
                                Cấp phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectClearance(rc)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: '#FFFFFF',
                                  border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontSize: '11.5px'
                                }}
                              >
                                Từ chối
                              </button>
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
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'rgba(232, 237, 232, 0.7)', fontSize: '11px' }}>Thân nhiệt:</span>
                    <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.temp}</div>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(232, 237, 232, 0.7)', fontSize: '11px' }}>Nhịp thở:</span>
                    <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.respRate}</div>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(232, 237, 232, 0.7)', fontSize: '11px' }}>Niêm mạc:</span>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.mucousColor}</div>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(232, 237, 232, 0.7)', fontSize: '11px' }}>Nhu động ruột:</span>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '13px', marginTop: '2px' }}>{selectedIncidentModal.vitalSigns.gutSounds}</div>
                  </div>
                </div>
              )}

              {/* Triệu chứng và sơ cứu */}
              <div style={{ fontSize: '13px', color: '#FFFFFF', marginBottom: '10px' }}>
                <span style={{ color: 'rgba(232, 237, 232, 0.7)', marginRight: '6px' }}>Triệu chứng:</span><span style={{ background: 'rgba(232, 107, 44, 0.15)', color: 'var(--brass)', padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(232, 107, 44, 0.35)', fontWeight: 700, fontSize: '12.5px' }}>{Array.isArray(selectedIncidentModal.symptoms) ? selectedIncidentModal.symptoms.join(' · ') : selectedIncidentModal.symptoms}</span>
              </div>

              {selectedIncidentModal.firstAidActions && selectedIncidentModal.firstAidActions.length > 0 && (
                <div style={{ fontSize: '11.5px', color: '#10B981', marginBottom: '8px' }}>
                  <b>Sơ cứu hiện trường Groom đã làm:</b> {selectedIncidentModal.firstAidActions.join(' · ')}
                </div>
              )}

              <div style={{ fontSize: '13px', color: '#E8EDE8', lineHeight: 1.55, background: 'rgba(0, 0, 0, 0.25)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid var(--brass)', marginTop: '12px' }}>
                <b style={{ color: 'var(--brass)' }}>Mô tả của Groom:</b> {selectedIncidentModal.description}
              </div>
            </div>

            {/* Thanh xác nhận tiếp nhận nhanh */}
            {selectedIncidentModal.status === 'pending_vet' && (
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
            )}

            <form onSubmit={handleResolveIncident}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
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
                    border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
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
                    border: '1.5px solid rgba(232, 237, 232, 0.22)',
                    lineHeight: 1.55,
                    outline: 'none',
                    minHeight: '85px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(232, 237, 232, 0.15)', paddingTop: '18px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedIncidentModal(null)}
                  style={{ padding: '10px 22px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#E8EDE8', border: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.02em', boxShadow: '0 4px 14px rgba(232, 107, 44, 0.4)', transition: 'all 0.2s ease' }}
                >
                  XÁC NHẬN & BAN HÀNH PHÁC ĐỒ ĐIỀU TRỊ
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
            setActiveTab('lockout');
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
    </div>
  );
}
