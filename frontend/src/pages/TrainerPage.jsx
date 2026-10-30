import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  getTrainingProgramsApi, 
  saveTrainingProgramApi,
  getTelemetrySessionsApi,
  recordTelemetryApi,
  getHorsesApi,
  getSystemTournamentNominationsApi,
  trainerReviewNominationApi,
  trainerAssignHorseNominationApi
} from '../services/api';
import { getServiceAssignments, confirmServiceAssignment } from '../services/serviceAssignment';

// Minimalist, high-end SVG icons (0 emojis, strict professional aesthetic)
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
      if (['vitals', 'programs', 'sessions', 'review', 'approvals'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'vitals';
  }); // 'vitals' | 'programs' | 'sessions' | 'review' | 'approvals'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_trainer_view_mode');
      if (['cards', 'table'].includes(saved)) return saved;
    } catch {}
    return 'cards';
  }); // 'cards' | 'table'

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

  const handleConfirmTrainerService = (asgn) => {
    const trainerUser = currentUser?.username || 'trainer_truong';
    const updated = confirmServiceAssignment(asgn.horseName, 'TRAINER', trainerUser);
    setServiceAssignments(updated);
    showToast(`Đã xác nhận nhận huấn luyện chiến mã "${asgn.horseName}" cho Chủ sở hữu ${asgn.ownerName}!`, 'HLV XÁC NHẬN PHỤC VỤ', 'success');
  };

  // 1. Danh sách chiến mã quản lý huấn luyện
  const [trainerHorses, setTrainerHorses] = useState([
    {
      id: 1,
      name: 'Hắc Phong',
      microchip: 'MC-VN-2022-001',
      stall: 'Ô A3',
      breed: 'Thoroughbred',
      age: '4 tuổi',
      status: 'WATCH',
      statusText: 'Cần theo dõi',
      isLockedByVet: false,
      avgHeartRate: 118,
      maxSpeed: 64.5,
      totalDistanceKm: 184,
      condition: '92%',
      desc: 'Chiến mã cự ly 1.600m, đang tập thích ứng nhịp chạy nước rút cao.'
    },
    {
      id: 2,
      name: 'Xích Thố',
      microchip: 'MC-VN-2021-014',
      stall: 'Ô A1',
      breed: 'Arabian',
      age: '5 tuổi',
      status: 'READY',
      statusText: 'Sẵn sàng thi đấu',
      isLockedByVet: false,
      avgHeartRate: 108,
      maxSpeed: 68.2,
      totalDistanceKm: 260,
      condition: '98%',
      desc: 'Phong độ đỉnh cao, thể lực ổn định ở cự ly 2.400m sân cỏ.'
    },
    {
      id: 3,
      name: 'Phi Yến',
      microchip: 'MC-VN-2023-009',
      stall: 'Ô A5',
      breed: 'Thoroughbred',
      age: '3 tuổi',
      status: 'INJURED',
      statusText: 'Khóa tập bởi Thú y',
      isLockedByVet: true,
      vetNotice: 'Giãn gân chân trái - Cấm bài tập chạy nước rút và tải nặng!',
      avgHeartRate: 136,
      maxSpeed: 42.0,
      totalDistanceKm: 98,
      condition: '58%',
      desc: 'Đang theo phác đồ vật lý trị liệu & đi bộ thả lỏng theo lệnh Bác sĩ Thú y.'
    },
    {
      id: 4,
      name: 'Lôi Chấn',
      microchip: 'MC-VN-2022-088',
      stall: 'Ô B2',
      breed: 'Quarter Horse',
      age: '4 tuổi',
      status: 'WATCH',
      statusText: 'Cách ly theo dõi',
      isLockedByVet: false,
      avgHeartRate: 122,
      maxSpeed: 59.8,
      totalDistanceKm: 142,
      condition: '84%',
      desc: 'Chiến mã cơ bắp, đang rèn kỹ thuật xuất phát máy và chuyển làn an toàn.'
    },
    {
      id: 5,
      name: 'Bạch Long',
      microchip: 'MC-VN-2024-003',
      stall: 'Ô A2',
      breed: 'Thoroughbred',
      age: '2 tuổi',
      status: 'READY',
      statusText: 'Đang phát triển tốt',
      isLockedByVet: false,
      avgHeartRate: 112,
      maxSpeed: 62.0,
      totalDistanceKm: 115,
      condition: '90%',
      desc: 'Chiến mã trẻ tiếp thu nhanh, thể lực phát triển vượt kỳ vọng.'
    }
  ]);

  // 2. Danh sách giáo án huấn luyện (Training Programs)
  const [programs, setPrograms] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_trainer_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 1,
        title: 'Tăng tốc nước rút 1.600m sân cát',
        horseName: 'Hắc Phong',
        phase: 'Nước rút (Sprint)',
        targetDistance: 1600,
        surface: 'SAND (Sân cát)',
        startDate: '05/10/2026',
        endDate: '25/10/2026',
        status: 'ACTIVE'
      },
      {
        id: 2,
        title: 'Xây dựng thể lực nền sức bền 2.400m',
        horseName: 'Xích Thố',
        phase: 'Thể lực nền (Endurance)',
        targetDistance: 2400,
        surface: 'GRASS (Sân cỏ)',
        startDate: '01/10/2026',
        endDate: '30/10/2026',
        status: 'ACTIVE'
      },
      {
        id: 3,
        title: 'Phục hồi chức năng & thả lỏng cơ khớp',
        horseName: 'Phi Yến',
        phase: 'Phục hồi (Recovery)',
        targetDistance: 800,
        surface: 'SAND (Sân cát)',
        startDate: '08/10/2026',
        endDate: '20/10/2026',
        status: 'ACTIVE'
      },
      {
        id: 4,
        title: 'Kỹ thuật mở máy xuất phát & chuyển làn',
        horseName: 'Lôi Chấn',
        phase: 'Kỹ thuật (Gate & Pace)',
        targetDistance: 1200,
        surface: 'GRASS (Sân cỏ)',
        startDate: '06/10/2026',
        endDate: '22/10/2026',
        status: 'ACTIVE'
      }
    ];
  });

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
        setPrograms(prev => [...mapped, ...prev.slice(mapped.length)]);
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
              return {
                ...th,
                stall: matched.stable ? `Ô ${matched.stable}` : th.stall,
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
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
        id: 103,
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
        id: 104,
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
      }
    ];
  });

  useEffect(() => {
    let isMounted = true;
    getTelemetrySessionsApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setSessions(res.data);
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
  const [newProgramData, setNewProgramData] = useState(() => ({
    title: '',
    horseName: 'Hắc Phong',
    phase: 'Nước rút (Sprint)',
    targetDistance: 1600,
    surface: 'SAND (Sân cát)',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  }));

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

  // Modal chỉnh sửa nhận xét & chấm điểm bài tập
  const [showEditFeedbackModal, setShowEditFeedbackModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Xử lý tạo giáo án mới
  const handleCreateProgram = (e) => {
    e.preventDefault();
    const newProg = {
      id: Date.now(),
      title: newProgramData.title,
      horseName: newProgramData.horseName,
      phase: newProgramData.phase,
      targetDistance: Number(newProgramData.targetDistance),
      surface: newProgramData.surface,
      startDate: newProgramData.startDate,
      endDate: newProgramData.endDate || 'Chưa định',
      status: 'ACTIVE'
    };
    const updatedPrograms = [newProg, ...programs];
    setPrograms(updatedPrograms);
    try {
      localStorage.setItem('matruong_trainer_programs', JSON.stringify(updatedPrograms));
    } catch {}
    saveTrainingProgramApi(newProg).catch(() => {});

    showToast(`Đã tạo giáo án mới cho ${newProgramData.horseName}`);
    setShowAddProgramModal(false);
    setNewProgramData({
      title: '',
      horseName: 'Hắc Phong',
      phase: 'Nước rút (Sprint)',
      targetDistance: 1600,
      surface: 'SAND (Sân cát)',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

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
      const next = prev.map(s => {
        if (s.id === sessionId) {
          const nextStatus = s.status === 'COMPLETED' ? 'INCOMPLETE' : 'COMPLETED';
          const statusText = nextStatus === 'COMPLETED' ? 'Hoàn thành' : 'Không hoàn thành';
          showToast(`Đã đổi bài tập của ${s.horseName} sang: ${statusText}`);
          return { ...s, status: nextStatus };
        }
        return s;
      });
      try {
        localStorage.setItem('matruong_training_telemetry', JSON.stringify(next));
      } catch {}
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
    setSessions(prev => prev.map(s => s.id === selectedSession.id ? {
      ...s,
      status: selectedSession.status,
      score: Number(selectedSession.score),
      feedback: selectedSession.feedback
    } : s));
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
            className={`portal-nav-item ${activeTab === 'vitals' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vitals'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconOverview size={18} /></span>
            <span className="portal-nav-label">{t('trainerTabVitals')}</span>
            <span className="portal-nav-badge">{trainerHorses.length}</span>
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
            className={`portal-nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sessions'); setSidebarOpen(false); }}
          >
            <span className="portal-nav-icon"><IconTimer size={18} /></span>
            <span className="portal-nav-label">{t('trainerTabSessions')}</span>
            <span className="portal-nav-badge">{sessions.length}</span>
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
                {activeTab === 'vitals' && t('trainerTitleVitals')}
                {activeTab === 'programs' && t('trainerTitlePrograms')}
                {activeTab === 'sessions' && t('trainerTitleSessions')}
                {activeTab === 'review' && t('trainerTitleReview')}
                {activeTab === 'approvals' && (lang === 'en' ? 'Tournament Nominations & Approvals' : 'Thẩm Định & Phê Duyệt Đăng Ký Thi Đấu')}
              </h2>
              <div className="portal-page-subtitle">
                {activeTab === 'vitals' && t('trainerSubVitals')}
                {activeTab === 'programs' && t('trainerSubPrograms')}
                {activeTab === 'sessions' && t('trainerSubSessions')}
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

          {/* ===================== TAB 1: THỂ LỰC & TRẠNG THÁI ===================== */}
          {activeTab === 'vitals' && (
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

              {/* Khối Xác Nhận Phục Vụ Dành Cho HLV Được Chủ Ngựa Chỉ Định */}
              {(() => {
                const currentUsername = currentUser?.username || 'trainer_truong';
                const assignedToMe = serviceAssignments.filter(a =>
                  a.trainerUsername === currentUsername ||
                  (!a.trainerUsername && currentUsername === 'trainer_truong')
                );
                if (assignedToMe.length === 0) return null;

                const pendingAssignments = assignedToMe.filter(a => a.trainerStatus === 'PENDING');

                return (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🏇</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>
                            Chiến Mã Được Chủ Sở Hữu Chỉ Định Đảm Nhận Huấn Luyện ({assignedToMe.length})
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                            {pendingAssignments.length > 0 
                              ? `Có ${pendingAssignments.length} chiến mã đang chờ bạn xác nhận phục vụ.`
                              : `Tất cả chiến mã đã được bạn xác nhận tiếp nhận huấn luyện.`}
                          </div>
                        </div>
                      </div>
                      {pendingAssignments.length > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                          {pendingAssignments.length} Yêu cầu mới
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                      {assignedToMe.map(asgn => {
                        const isPending = asgn.trainerStatus === 'PENDING';
                        return (
                          <div
                            key={asgn.id || asgn.microchip}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: isPending ? '1px solid var(--brass)' : '1px solid var(--line)',
                              borderRadius: '6px',
                              padding: '12px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <b style={{ color: 'var(--paper)', fontSize: '14px' }}>{asgn.horseName}</b>
                                <span style={{ fontSize: '11px', color: 'var(--brass)', background: 'rgba(212, 175, 55, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                                  {asgn.stable || 'Ô A2'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                Chủ sở hữu: <b style={{ color: 'var(--paper)' }}>{asgn.ownerName}</b> · Chip: {asgn.microchip}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                                Đội ngũ cùng phục vụ: BS. {asgn.vetName} · Groom {asgn.groomName}
                              </div>
                            </div>

                            <div style={{ flexShrink: 0 }}>
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmTrainerService(asgn)}
                                  style={{
                                    background: 'var(--brass)',
                                    color: '#0A0D14',
                                    border: 'none',
                                    padding: '7px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                                  }}
                                >
                                  ✓ Xác Nhận Phục Vụ
                                </button>
                              ) : (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#10B981',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  ✓ Đã Xác Nhận
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

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

              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {trainerHorses.map(horse => {
                    const badgeClass = horse.status === 'READY' ? 'badge-gold' : 'badge-slate';
                    const displayStatus = horse.status === 'READY'
                      ? (lang === 'en' ? 'Ready for Race' : 'Sẵn sàng thi đấu')
                      : (lang === 'en' ? 'Under Observation' : 'Cần theo dõi');
                    return (
                      <div key={horse.id} className="facility-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span className={`facility-card-badge ${badgeClass}`} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <IconHorse size={14} color="var(--brass)" />
                            <span>{horse.stall}</span>
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
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <h3 className="facility-card-title">{horse.name}</h3>
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
                          <p className="facility-card-desc" style={{ marginTop: '4px', minHeight: 'auto' }}>{horse.desc}</p>
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
                            <span>{lang === 'en' ? 'Accumulated distance:' : 'Quãng đường tích lũy:'} <b>{horse.totalDistanceKm} km</b></span>
                          </div>
                          <div className="facility-bullet-item">
                            <span className="bullet-dot" />
                            <span>{lang === 'en' ? 'Age:' : 'Độ tuổi:'} <b>{horse.age}</b></span>
                          </div>
                        </div>

                        {/* 3-column specs */}
                        <div className="facility-specs-grid">
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Avg HR' : 'Nhịp tim TB'}</span>
                            <span className="spec-val" style={{ color: 'var(--paper)' }}>{horse.avgHeartRate} bpm</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Peak Speed' : 'Tốc độ đỉnh'}</span>
                            <span className="spec-val" style={{ color: 'var(--paper)' }}>{horse.maxSpeed} km/h</span>
                          </div>
                          <div className="facility-spec-cell">
                            <span className="spec-label">{lang === 'en' ? 'Condition' : 'Phong độ'}</span>
                            <span className="spec-val" style={{ color: 'var(--brass)' }}>{horse.condition}</span>
                          </div>
                        </div>

                        {/* Status/Price Box */}
                        <div className="facility-price-box">
                          <div>
                            <div className="price-label">{lang === 'en' ? 'Training Status' : 'Trạng thái thi đấu'}</div>
                            <div className="price-value" style={{ fontSize: '15px', color: horse.status === 'READY' ? 'var(--brass)' : 'var(--paper)' }}>
                              {displayStatus}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: horse.status === 'READY' ? 'rgba(201, 162, 39, 0.12)' : 'var(--bg-secondary)',
                            color: horse.status === 'READY' ? 'var(--brass)' : 'var(--paper-dim)',
                            border: horse.status === 'READY' ? '1px solid var(--brass)' : '1px solid var(--line)'
                          }}>
                            {horse.isLockedByVet ? (lang === 'en' ? 'LOCKED' : 'KHÓA') : (lang === 'en' ? 'READY' : 'SẴN SÀNG')}
                          </span>
                        </div>

                        <div className="facility-card-actions">
                          <div className="actions-left">
                            <button
                              className="facility-btn-action"
                              onClick={() => {
                                setNewSessionData(prev => ({ ...prev, horseName: horse.name }));
                                setShowAddSessionModal(true);
                              }}
                              disabled={horse.isLockedByVet}
                            >
                              {horse.isLockedByVet ? (lang === 'en' ? 'Locked' : 'Đang khóa') : (lang === 'en' ? '+ Add Workout' : '+ Lên bài tập')}
                            </button>
                          </div>
                          <button
                            className="facility-link-action"
                            onClick={() => {
                              setFilterHorse(horse.name);
                              setActiveTab('review');
                            }}
                          >
                            {lang === 'en' ? 'View Review →' : 'Xem đánh giá →'}
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
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Stall' : 'Ô Chuồng'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Avg HR' : 'Nhịp Tim TB'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Peak Speed' : 'Tốc Độ Đỉnh'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Condition' : 'Phong Độ'}</th>
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
                              <div>{horse.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{horse.microchip}</div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{horse.stall}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper)', fontWeight: 600 }}>{horse.avgHeartRate} bpm</td>
                            <td style={{ padding: '14px 18px', color: 'var(--paper)', fontWeight: 600 }}>{horse.maxSpeed} km/h</td>
                            <td style={{ padding: '14px 18px', color: 'var(--brass)', fontWeight: 700 }}>{horse.condition}</td>
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
                            <td style={{ padding: '14px 18px' }}>
                              <button
                                onClick={() => {
                                  setNewSessionData(prev => ({ ...prev, horseName: horse.name }));
                                  setShowAddSessionModal(true);
                                }}
                                disabled={horse.isLockedByVet}
                                style={{
                                  padding: '6px 12px',
                                  background: horse.isLockedByVet ? 'var(--bg-secondary)' : 'var(--brass)',
                                  color: horse.isLockedByVet ? 'var(--paper-dim)' : '#14100A',
                                  border: horse.isLockedByVet ? '1px solid var(--line)' : 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: horse.isLockedByVet ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {horse.isLockedByVet ? (lang === 'en' ? 'Locked' : 'Đang bị khóa') : (lang === 'en' ? '+ Workout' : '+ Lên bài tập')}
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
                    onClick={() => setShowAddProgramModal(true)}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {t('trainerBtnAddProgram')}
                  </button>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="portal-cards-grid">
                  {programs.map(prog => (
                    <div key={prog.id} className="facility-card">
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

                      <div className="facility-price-box">
                        <div>
                          <div className="price-label">{lang === 'en' ? 'Curriculum Status' : 'Trạng thái giáo án'}</div>
                          <div className="price-value" style={{ fontSize: '15px', color: 'var(--brass)' }}>
                            {lang === 'en' ? 'Active Progression' : 'Đang thực hiện tích cực'}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(201, 162, 39, 0.12)',
                          color: 'var(--brass)',
                          border: '1px solid var(--brass)'
                        }}>
                          ACTIVE
                        </span>
                      </div>

                      <div className="facility-card-actions">
                        <div className="actions-left">
                          <button
                            className="facility-btn-action"
                            onClick={() => {
                              setNewSessionData(prev => ({ ...prev, horseName: prog.horseName, programTitle: prog.title }));
                              setShowAddSessionModal(true);
                            }}
                          >
                            {lang === 'en' ? 'Run Workout' : 'Chạy bài này'}
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
                <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                  <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Horse' : 'Chiến mã'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Curriculum Title' : 'Tên giáo án'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Phase' : 'Giai đoạn'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Target Dist' : 'Cự ly mục tiêu'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Surface' : 'Mặt sân'}</th>
                        <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Duration' : 'Thời gian'}</th>
                        <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'en' ? 'Status' : 'Trạng thái'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.map(prog => (
                        <tr key={prog.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--paper)' }}>{prog.horseName}</td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--paper)' }}>{prog.title}</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>{prog.phase}</td>
                          <td style={{ padding: '14px 18px', color: 'var(--brass)', fontWeight: 600 }}>{prog.targetDistance} m</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{prog.surface}</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)', fontSize: '12.5px' }}>{prog.startDate} → {prog.endDate}</td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: 'rgba(201, 162, 39, 0.12)',
                              color: 'var(--brass)',
                              border: '1px solid var(--brass)'
                            }}>
                              {lang === 'en' ? 'Active' : 'Đang thực hiện'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: BUỔI TẬP & TELEMETRY ===================== */}
          {activeTab === 'sessions' && (
            <div>
              <div className="portal-filter-bar">
                <div className="portal-filter-pills">
                  <button className="portal-pill-btn active">
                    {lang === 'en' ? 'All Workouts' : 'Tất cả buổi tập'} <span className="pill-count">{sessions.length}</span>
                  </button>
                  <button
                    className="portal-pill-btn"
                    onClick={() => {
                      setFilterStatus('COMPLETED');
                      setActiveTab('review');
                    }}
                  >
                    {t('trainerStatusCompleted')} <span className="pill-count">{sessions.filter(s => s.status === 'COMPLETED').length}</span>
                  </button>
                  <button
                    className="portal-pill-btn"
                    onClick={() => {
                      setFilterStatus('INCOMPLETE');
                      setActiveTab('review');
                    }}
                  >
                    {t('trainerStatusIncomplete')} <span className="pill-count">{sessions.filter(s => s.status === 'INCOMPLETE').length}</span>
                  </button>
                </div>

                <div className="portal-view-tools">
                  <button
                    onClick={() => setShowAddSessionModal(true)}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {t('trainerBtnAddSession')}
                  </button>
                </div>
              </div>

              <div className="table-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Timestamp' : 'Thời gian'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Horse & Curriculum' : 'Chiến mã & Giáo án'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Distance' : 'Quãng đường'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Avg Speed' : 'Vận tốc TB'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Heart Rate' : 'Nhịp tim'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'en' ? 'Alert' : 'Cảnh báo'}</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'en' ? 'Workout Status' : 'Trạng thái bài tập'}</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'en' ? 'Score' : 'Điểm đánh giá'}</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'en' ? 'Actions' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(sess => {
                      const isCompleted = sess.status === 'COMPLETED';
                      return (
                        <tr key={sess.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                            {sess.time}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--paper)' }}>{sess.horseName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{sess.programTitle}</div>
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper)' }}>{sess.distanceRun} m</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper)', fontWeight: 600 }}>{sess.avgSpeed} km/h</td>
                          <td style={{ padding: '14px 18px', color: sess.isOverLimit ? 'var(--brass)' : 'var(--paper)', fontWeight: 700 }}>
                            {sess.maxHeartRate} bpm
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            {sess.isOverLimit ? (
                              <span style={{
                                padding: '4px 8px',
                                background: 'rgba(201, 162, 39, 0.12)',
                                color: 'var(--brass)',
                                border: '1px solid var(--brass)',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 700
                              }}>
                                {lang === 'en' ? 'Overload (>210)' : 'Quá tải (>210)'}
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 8px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--paper-dim)',
                                border: '1px solid var(--line)',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 600
                              }}>
                                {lang === 'en' ? 'Normal' : 'Bình thường'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleSessionStatus(sess.id)}
                              title={lang === 'en' ? 'Click to toggle status' : 'Nhấp để đổi trạng thái bài tập'}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: isCompleted ? 'rgba(201, 162, 39, 0.12)' : 'var(--bg-secondary)',
                                color: isCompleted ? 'var(--brass)' : 'var(--paper-dim)',
                                border: isCompleted ? '1px solid var(--brass)' : '1px solid var(--line)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {isCompleted ? (lang === 'en' ? 'Completed' : 'Hoàn thành') : (lang === 'en' ? 'Incomplete' : 'Chưa đạt')}
                            </button>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              background: 'rgba(201, 162, 39, 0.12)',
                              color: 'var(--brass)',
                              border: '1px solid var(--brass)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700
                            }}>
                              {sess.score !== undefined ? sess.score : 8.0}/10
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenEvaluationModal(sess)}
                              style={{
                                padding: '6px 12px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--line)',
                                color: 'var(--paper)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {lang === 'en' ? 'Review' : 'Đánh giá'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                    onClick={() => setShowAddSessionModal(true)}
                    className="portal-view-btn"
                    style={{ background: 'var(--brass)', color: '#14100A', borderColor: 'var(--brass)', fontWeight: 700 }}
                  >
                    {lang === 'en' ? '+ New Session' : '+ Ghi Nhận Mới'}
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

      {/* ===================== MODAL THÊM GIÁO ÁN MỚI ===================== */}
      {showAddProgramModal && (
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
              {lang === 'en' ? 'Create New Training Curriculum' : 'Lập Giáo Án Huấn Luyện Mới'}
            </h3>
            <form onSubmit={handleCreateProgram} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Curriculum Title' : 'Tên giáo án'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. Mid-distance Endurance 1,800m' : 'Ví dụ: Rèn thể lực cự ly trung bình 1.800m'}
                  value={newProgramData.title}
                  onChange={(e) => setNewProgramData({ ...newProgramData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Target Racehorse' : 'Chọn chiến mã áp dụng'}
                </label>
                <select
                  value={newProgramData.horseName}
                  onChange={(e) => setNewProgramData({ ...newProgramData, horseName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  {trainerHorses.map(h => (
                    <option key={h.id} value={h.name}>{h.name} ({h.microchip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Training Phase' : 'Giai đoạn huấn luyện'}
                </label>
                <select
                  value={newProgramData.phase}
                  onChange={(e) => setNewProgramData({ ...newProgramData, phase: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="Nước rút (Sprint)">{lang === 'en' ? 'Sprint (High-velocity bursts)' : 'Nước rút (Sprint - Tốc độ cao)'}</option>
                  <option value="Thể lực nền (Endurance)">{lang === 'en' ? 'Endurance (Aerobic stamina)' : 'Thể lực nền (Endurance - Sức bền)'}</option>
                  <option value="Kỹ thuật (Gate & Pace)">{lang === 'en' ? 'Gate & Pace (Breakout & steering)' : 'Kỹ thuật (Gate & Pace - Bứt tốc & mở máy)'}</option>
                  <option value="Phục hồi (Recovery)">{lang === 'en' ? 'Recovery (Low-strain walking)' : 'Phục hồi (Recovery - Vận động nhẹ)'}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'en' ? 'Target Distance (m)' : 'Cự ly mục tiêu (m)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newProgramData.targetDistance}
                    onChange={(e) => setNewProgramData({ ...newProgramData, targetDistance: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'en' ? 'Track Surface' : 'Mặt sân tập'}
                  </label>
                  <select
                    value={newProgramData.surface}
                    onChange={(e) => setNewProgramData({ ...newProgramData, surface: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  >
                    <option value="SAND (Sân cát)">{lang === 'en' ? 'SAND (Sand Track)' : 'SAND (Sân cát)'}</option>
                    <option value="GRASS (Sân cỏ)">{lang === 'en' ? 'TURF (Grass Track)' : 'GRASS (Sân cỏ)'}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Save Curriculum' : 'Lưu Giáo Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL GHI NHẬN BUỔI TẬP MỚI ===================== */}
      {showAddSessionModal && (
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
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--paper)' }}>
              {lang === 'en' ? 'Log Workout Session & Telemetry' : 'Ghi Nhận Buổi Tập & Telemetry Mới'}
            </h3>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Racehorse' : 'Chiến mã tập luyện'}
                </label>
                <select
                  value={newSessionData.horseName}
                  onChange={(e) => setNewSessionData({ ...newSessionData, horseName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  {trainerHorses.map(h => (
                    <option key={h.id} value={h.name}>{h.name} ({h.microchip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Curriculum / Workout Title' : 'Tên bài tập / Giáo án'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. Endurance build 2,000m sand' : 'Ví dụ: Rèn sức bền 2.000m sân cát'}
                  value={newSessionData.programTitle}
                  onChange={(e) => setNewSessionData({ ...newSessionData, programTitle: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'en' ? 'Distance Run (m)' : 'Quãng đường chạy (m)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newSessionData.distanceRun}
                    onChange={(e) => setNewSessionData({ ...newSessionData, distanceRun: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'en' ? 'Avg Velocity (km/h)' : 'Vận tốc TB (km/h)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newSessionData.avgSpeed}
                    onChange={(e) => setNewSessionData({ ...newSessionData, avgSpeed: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'en' ? 'Peak Heart Rate (bpm)' : 'Nhịp tim tối đa (bpm)'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={lang === 'en' ? 'Safe threshold <= 210' : 'Ngưỡng an toàn <= 210'}
                    value={newSessionData.maxHeartRate}
                    onChange={(e) => setNewSessionData({ ...newSessionData, maxHeartRate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'en' ? 'Workout Status' : 'Trạng thái bài tập'}
                  </label>
                  <select
                    value={newSessionData.status}
                    onChange={(e) => setNewSessionData({ ...newSessionData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                  >
                    <option value="COMPLETED">{lang === 'en' ? 'Workout Completed' : 'Hoàn thành bài tập'}</option>
                    <option value="INCOMPLETE">{lang === 'en' ? 'Workout Incomplete' : 'Không hoàn thành bài tập'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Performance Rating (1.0 - 10.0 scale)' : 'Chấm điểm đánh giá (thang điểm 1.0 - 10.0)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  required
                  value={newSessionData.score}
                  onChange={(e) => setNewSessionData({ ...newSessionData, score: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'en' ? 'Trainer Remarks & Field Notes' : 'Ghi chú bài tập & Nhận xét của HLV'}
                </label>
                <textarea
                  rows="3"
                  placeholder={lang === 'en' ? 'Note stride fluidity, breathing recovery or reason if incomplete...' : 'Ghi nhận xét về phong độ, độ giãn bước, sức bền hoặc lý do nếu bài tập chưa hoàn thành...'}
                  value={newSessionData.feedback}
                  onChange={(e) => setNewSessionData({ ...newSessionData, feedback: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--brass)', border: 'none', color: '#14100A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  {lang === 'en' ? 'Save Workout' : 'Lưu Bài Tập'}
                </button>
              </div>
            </form>
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

    </div>
  );
}
