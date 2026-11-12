import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import ConfirmedHorseProfileModal from '../components/ConfirmedHorseProfileModal';
import GroomIncidentReportModal from '../components/groom/GroomIncidentReportModal';
import GroomScheduleModal from '../components/groom/GroomScheduleModal';
import { reportIncidentApi } from '../services/api';
import { addSystemNotification } from '../services/notificationService';
import {
  getServiceAssignments,
  confirmServiceAssignment,
  rejectServiceAssignment,
  getGroomRealtimeHorses,
  lookupFullHorseInfo
} from '../services/serviceAssignment';
import {
  formatConfirmedHorseForGroom,
  generateRealtimeDailyTasks,
  GROOM_TEAM_MEMBERS,
  INITIAL_EMERGENCY_ALERTS,
  INITIAL_VET_INSTRUCTIONS,
  INITIAL_INVENTORY,
  getGroomData,
  saveGroomData,
  STORAGE_KEYS
} from '../services/groomService';

// Import các Tab chuyên trách
import GroomDashboardTab from '../components/groom/GroomDashboardTab';
import GroomTasksTab from '../components/groom/GroomTasksTab';
import GroomHorsesTab from '../components/groom/GroomHorsesTab';
import GroomCareTab from '../components/groom/GroomCareTab';
import GroomHealthTab from '../components/groom/GroomHealthTab';
import GroomIncidentsTab from '../components/groom/GroomIncidentsTab';
import GroomVetInstructionsTab from '../components/groom/GroomVetInstructionsTab';
import GroomInventoryTab from '../components/groom/GroomInventoryTab';
import GroomReportsTab from '../components/groom/GroomReportsTab';
import GroomNotificationsTab from '../components/groom/GroomNotificationsTab';
import GroomProfileTab from '../components/groom/GroomProfileTab';

// Minimalist High-End SVG Icons for Groom Portal
const IconDashboard = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconTasks = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IconHorse = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" />
    <path d="M2 17l2-11c.2-1.1 1.2-2 2.3-2h3.4c1 0 1.9.7 2.2 1.6L13 9h4c1.7 0 3 1.3 3 3v2" />
    <circle cx="7" cy="8" r="1" />
  </svg>
);

const IconCare = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
  </svg>
);

const IconHealth = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconAlert = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconVet = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20" />
    <path d="M2 12h20" />
  </svg>
);

const IconInventory = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconReport = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconNotification = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconProfile = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLogout = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function GroomPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Tab Sidebar hiện tại (Mặc định: 'dashboard')
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_groom');
      const validTabs = [
        'dashboard',
        'tasks',
        'horses',
        'care',
        'health',
        'incidents',
        'vet-instructions',
        'inventory',
        'reports',
        'notifications',
        'profile'
      ];
      return validTabs.includes(saved) ? saved : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('matruong_tab_groom', activeTab);
  }, [activeTab]);

  // =========================================================================
  // 1. ĐỒNG BỘ PHÂN CÔNG TỪ CHỦ SỞ HỮU THEO THỜI GIAN THỰC (REAL-TIME)
  // =========================================================================
  const [serviceAssignments, setServiceAssignments] = useState(() => getServiceAssignments());

  useEffect(() => {
    const handleUpdate = () => {
      const latest = getServiceAssignments();
      setServiceAssignments(latest);
    };

    window.addEventListener('matruong_service_assignment_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('matruong_notifications_updated', handleUpdate);

    return () => {
      window.removeEventListener('matruong_service_assignment_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('matruong_notifications_updated', handleUpdate);
    };
  }, []);

  // Phân quyền nhân sự Groom gắn chặt theo tài khoản đăng nhập (currentUser), tuyệt đối không cho phép tự ý đổi quyền
  const currentGroomUser = useMemo(() => {
    const uName = (currentUser?.username || '').trim().toLowerCase();
    const fName = (currentUser?.full_name || '').trim().toLowerCase();

    if (uName === 'groom_dung' || fName.includes('tiến dũng') || fName.includes('vũ tiến dũng')) {
      return GROOM_TEAM_MEMBERS.find(g => g.id === 'groom_dung') || GROOM_TEAM_MEMBERS[1];
    }
    if (uName === 'groom_thao' || fName.includes('thu thảo') || fName.includes('nguyễn thu thảo')) {
      return GROOM_TEAM_MEMBERS.find(g => g.id === 'groom_thao') || GROOM_TEAM_MEMBERS[2];
    }
    // Mặc định hoặc tài khoản groom_nam / groom là Chủ nhóm Groom (Lê Hoàng Nam)
    return GROOM_TEAM_MEMBERS[0];
  }, [currentUser]);

  // Xóa bỏ hoàn toàn key ACTIVE_ROLE cũ nếu có
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    } catch {}
  }, []);

  // Lọc dữ liệu chiến mã theo thời gian thực dành cho Groom:
  // - confirmedList: CHỈ NHỮNG CHIẾN MÃ DO GROOM PHỤ TRÁCH ĐỒNG Ý
  // - pendingList: Các yêu cầu gửi gắm từ chủ sở hữu đang chờ Groom đồng ý
  // - Những chiến mã không do Groom đồng ý (hoặc từ chối) BỊ XÓA HẾT KHỎI DANH SÁCH!
  const groomRealtime = getGroomRealtimeHorses(currentGroomUser, serviceAssignments);
  const pendingRequests = groomRealtime.pending; // Chờ Groom đồng ý
  const confirmedList = groomRealtime.confirmed; // ĐÃ ĐỒNG Ý TIẾP NHẬN

  // Chuyển đổi các chiến mã đã đồng ý thành dữ liệu chiến mã quản lý
  const confirmedHorses = confirmedList.map(a => formatConfirmedHorseForGroom(a));

  // Toàn bộ chiến mã được các Groom trong đội đồng ý tiếp nhận (để Chủ nhóm Groom phân ca theo đúng Groom phụ trách)
  const allTeamConfirmedHorses = useMemo(() => {
    return (serviceAssignments || [])
      .filter(a => a.groomStatus === 'CONFIRMED')
      .map(a => formatConfirmedHorseForGroom(a));
  }, [serviceAssignments]);

  // =========================================================================
  // 2. SINH CÔNG VIỆC HẰNG NGÀY & Ô CHUỒNG DỰA TRÊN CHIẾN MÃ ĐÃ ĐỒNG Ý
  // =========================================================================
  const [tasks, setTasks] = useState(() => generateRealtimeDailyTasks(confirmedHorses));
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Tự động đồng bộ tasks khi danh sách chiến mã đã đồng ý thay đổi
  useEffect(() => {
    setTasks(generateRealtimeDailyTasks(confirmedHorses));
  }, [confirmedList.length]);

  // Cảnh báo quan trọng (Alerts)
  const [alerts, setAlerts] = useState(() => getGroomData(STORAGE_KEYS.ALERTS, INITIAL_EMERGENCY_ALERTS));

  // Dọn dẹp cảnh báo và y lệnh của các chiến mã mock cũ không thuộc về ngựa Groom phụ trách
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(alt => {
            const name = (alt.horseName || '').toLowerCase();
            return !['bạch long', 'kim sa', 'hắc phong', 'xích thố', 'phi yến', 'lôi chấn'].some(ex => name.includes(ex));
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(cleaned));
            setAlerts(cleaned);
          }
        }
      }
    } catch {}
  }, []);

  // Y lệnh thú y
  const [vetInstructions, setVetInstructions] = useState(() => getGroomData(STORAGE_KEYS.VET_INSTRUCTIONS, INITIAL_VET_INSTRUCTIONS));

  // Vật tư
  const [inventory, setInventory] = useState(() => getGroomData(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY));

  // Các ô chuồng phụ trách chăm sóc toàn bộ chiến mã trong hệ thống
  const stallCodes = useMemo(() => {
    const set = new Set(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    confirmedHorses.forEach(h => {
      if (h.stall) {
        const m = h.stall.match(/[A-Z0-9]+/i);
        if (m) set.add(m[0].toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [confirmedHorses]);

  const [stalls, setStalls] = useState(() => {
    const set = new Set(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    confirmedHorses.forEach(h => {
      if (h.stall) {
        const m = h.stall.match(/[A-Z0-9]+/i);
        if (m) set.add(m[0].toUpperCase());
      }
    });
    return Array.from(set).sort().map((code) => {
      const assigned = confirmedHorses.find(h => (h.stall || '').toUpperCase().includes(code));
      return {
        code,
        horseName: assigned ? assigned.name : null,
        owner: assigned ? assigned.owner : null,
        bedding: assigned ? 'Mùn cưa sạch tiêu chuẩn' : 'Ô trống sẵn sàng',
        waterLevel: assigned ? '100% (Tự động)' : 'Đã súc rửa',
        temp: '26.5°C',
        humidity: '65%',
        lastCleaned: assigned ? 'Sáng nay' : 'Đã sát trùng'
      };
    });
  });

  // Đồng bộ ô chuồng theo thời gian thực khi có ngựa mới trong hệ thống
  useEffect(() => {
    setStalls(stallCodes.map((code) => {
      const assigned = confirmedHorses.find(h => (h.stall || '').toUpperCase().includes(code));
      return {
        code,
        horseName: assigned ? assigned.name : null,
        owner: assigned ? assigned.owner : null,
        bedding: assigned ? 'Mùn cưa sạch tiêu chuẩn' : 'Ô trống sẵn sàng',
        waterLevel: assigned ? '100% (Tự động)' : 'Đã súc rửa',
        temp: '26.5°C',
        humidity: '65%',
        lastCleaned: assigned ? 'Sáng nay' : 'Đã sát trùng'
      };
    }));
  }, [confirmedHorses.length, stallCodes]);

  // Modal Profile chiến mã
  const [selectedHorseModal, setSelectedHorseModal] = useState(null);

  // Modal Báo cáo sự cố khẩn cấp
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    stallCode: 'A1',
    horseName: '',
    severity: 'HIGH',
    symptoms: 'Ngựa bỏ ăn / Bỏ ăn trên 50%',
    desc: ''
  });

  // =========================================================================
  // 3. THAO TÁC TIẾP NHẬN HOẶC TỪ CHỐI CHIẾN MÃ CỦA CHỦ SỞ HỮU
  // =========================================================================
  // Groom Đồng Ý Tiếp Nhận Chăm Sóc -> Chiến mã lập tức xuất hiện trong danh sách & gửi thông báo đến Chủ sở hữu
  const handleAcceptHorse = (asgn) => {
    const groomUser = asgn.groomUsername || currentUser?.username || 'groom_nam';
    const updated = confirmServiceAssignment(asgn.horseName || asgn.microchip, 'GROOM', groomUser);
    setServiceAssignments(updated);
    showToast(`Đã đồng ý tiếp nhận chăm sóc chiến mã "${asgn.horseName}"! Đã gửi thông báo xác nhận đến Chủ sở hữu ${asgn.ownerName}.`, 'GROOM ĐỒNG Ý TIẾP NHẬN', 'success');
  };

  // Groom Không Đồng Ý / Từ Chối -> Chiến mã BỊ XÓA HẾT KHỎI DANH SÁCH & gửi thông báo từ chối đến Chủ sở hữu
  const handleRejectHorse = (asgn) => {
    const groomUser = asgn.groomUsername || currentUser?.username || 'groom_nam';
    const updated = rejectServiceAssignment(asgn.horseName || asgn.microchip, 'GROOM', groomUser, 'Groom không thể tiếp nhận chăm sóc lúc này');
    setServiceAssignments(updated);
    showToast(`Đã từ chối tiếp nhận chiến mã "${asgn.horseName}". Chiến mã đã được loại bỏ hoàn toàn khỏi danh sách của bạn và thông báo đến Chủ sở hữu ${asgn.ownerName}!`, 'ĐÃ TỪ CHỐI TIẾP NHẬN', 'info');
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return { ...t, status: newStatus, completedAt: newStatus === 'COMPLETED' ? timeStr : t.completedAt };
      }
      return t;
    }));
    showToast(newStatus === 'COMPLETED' ? 'Đã hoàn thành công việc!' : 'Đã chuyển trạng thái làm việc.', 'CÔNG VIỆC', 'info');
  };

  const handleAddTask = (newTask) => {
    if (!currentGroomUser.isLead) {
      showToast('Chỉ Chủ nhóm Groom mới có quyền phân ca và tạo lịch công việc!', 'TỪ CHỐI QUYỀN', 'error');
      return;
    }
    setTasks(prev => [newTask, ...prev]);
    showToast(`Chủ nhóm đã phân công: "${newTask.title}" cho ${newTask.groom}!`, 'PHÂN CA THÀNH CÔNG', 'success');
  };

  const handleDeleteTask = (taskId) => {
    if (!currentGroomUser.isLead) {
      showToast('Chỉ Chủ nhóm Groom mới có quyền xóa lịch công việc!', 'TỪ CHỐI QUYỀN', 'error');
      return;
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Đã xóa công việc khỏi lịch ca trực!', 'ĐÃ XÓA', 'info');
  };

  const handleCleanBedding = (stallCode) => {
    setStalls(prev => prev.map(s => s.code === stallCode ? { ...s, bedding: 'Mùn cưa mới thay', lastCleaned: 'Vừa xong' } : s));
    showToast(`Đã dọn vệ sinh ô chuồng ${stallCode}!`, 'VỆ SINH Ô CHUỒNG', 'success');
  };

  const handleConfirmInstruction = (instructionId) => {
    setVetInstructions(prev => prev.map(v => v.id === instructionId ? { ...v, groomConfirmed: true } : v));
    showToast('Groom đã xác nhận tuân thủ y lệnh Bác sĩ Thú y!', 'TIẾP NHẬN Y LỆNH', 'success');
  };

  const handleRequestSupply = (supplyName) => {
    showToast(`Đã gửi yêu cầu cấp phát "${supplyName}" đến Quản lý!`, 'CẤP PHÁT VẬT TƯ', 'info');
  };

  // Lắng nghe cập nhật từ Bác sĩ thú y theo thời gian thực
  useEffect(() => {
    const handleVetIncidentUpdate = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.INCIDENTS) || localStorage.getItem('matruong_incidents');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            setAlerts(prev => prev.map(a => {
              const matched = list.find(item => item.id === a.id || (item.horseName === a.horseName && item.symptoms === a.title?.split(' (')[0]));
              if (matched) {
                if (matched.status === 'resolved') {
                  return {
                    ...a,
                    status: 'RESOLVED',
                    actionRequired: `Bác sĩ Thú y đã hoàn tất thăm khám: ${matched.vetDiagnosis || 'Thể trạng ổn định'}. Phác đồ: ${matched.actionTaken || 'Đã áp dụng điều trị'}`
                  };
                } else if (matched.status === 'in_review') {
                  return {
                    ...a,
                    status: 'IN_TREATMENT',
                    actionRequired: 'Bác sĩ Thú y đã tiếp nhận thông tin và đang trực tiếp có mặt tại chuồng khám.'
                  };
                }
              }
              return a;
            }));
          }
        }
      } catch {}
    };

    window.addEventListener('matruong_incidents_updated', handleVetIncidentUpdate);
    window.addEventListener('storage', handleVetIncidentUpdate);
    return () => {
      window.removeEventListener('matruong_incidents_updated', handleVetIncidentUpdate);
      window.removeEventListener('storage', handleVetIncidentUpdate);
    };
  }, []);

  const handleSubmitReport = (reportPayload) => {
    const isCritical = reportPayload.severity === 'CRITICAL';
    const incidentId = `INC-${Date.now().toString().slice(-4)}`;

    const newInc = {
      id: incidentId,
      stallCode: reportPayload.stallCode,
      stall: reportPayload.stall,
      horseName: reportPayload.horseName || 'Chiến mã',
      horseId: reportPayload.horseId || 'EQ-VN-2026',
      severity: reportPayload.severity,
      symptoms: reportPayload.symptoms,
      desc: reportPayload.desc,
      description: reportPayload.desc,
      vitalSigns: {
        temp: reportPayload.temp,
        respRate: reportPayload.respRate,
        mucousColor: reportPayload.mucousColor,
        gutSounds: reportPayload.gutSounds
      },
      firstAidActions: reportPayload.firstAidActions || [],
      reportedAt: 'Vừa xong',
      reportedBy: currentUser?.full_name || 'Lê Hoàng Nam (Groom)',
      status: 'pending_vet',
      statusText: isCritical ? 'Khẩn cấp: Đang chờ BS Thú Y đến ngay' : 'Đang chờ BS Thú Y khám'
    };

    const firstAidText = (reportPayload.firstAidActions && reportPayload.firstAidActions.length > 0)
      ? ` [Sơ cứu: ${reportPayload.firstAidActions.join(' · ')}]`
      : '';

    const newAlert = {
      id: incidentId,
      type: isCritical ? 'COLIC_SIGNS' : 'ABNORMAL_BEHAVIOR',
      severity: reportPayload.severity,
      title: `${reportPayload.symptoms} (${reportPayload.horseName || 'Chiến mã'})`,
      horseName: reportPayload.horseName || 'Chiến mã',
      horseId: reportPayload.horseId || 'EQ-VN-2026',
      stall: reportPayload.stall,
      time: 'Vừa xong',
      desc: `${reportPayload.desc}${firstAidText} [Thân nhiệt: ${reportPayload.temp} · Nhịp thở: ${reportPayload.respRate}]`,
      actionRequired: isCritical
        ? 'KHẨN CẤP: Dắt ngựa đi bộ chậm, ngắt máng cỏ khô, chờ BS. Thú Y đến ngay!'
        : 'Chờ Bác sĩ Thú y kiểm tra trực tiếp tại chuồng.',
      status: isCritical ? 'CRITICAL_PENDING' : 'PENDING',
      reportedToVet: true
    };

    reportIncidentApi(newInc).catch(() => {});
    setAlerts(prev => [newAlert, ...prev]);

    // Bắn thông báo khẩn cấp hệ thống đến Bác sĩ Thú Y và Quản trị viên
    try {
      addSystemNotification({
        type: 'INCIDENT_REPORTED',
        title: `BÁO ĐỘNG SỨC KHỎE [${reportPayload.severity}]: ${reportPayload.horseName?.toUpperCase()} (${reportPayload.stall})`,
        message: `Groom ${currentUser?.full_name || 'Lê Hoàng Nam'} vừa phát báo động lâm sàng: "${reportPayload.symptoms}". Thân nhiệt: ${reportPayload.temp}. Yêu cầu Bác sĩ Thú y thăm khám khẩn cấp!`,
        horseName: reportPayload.horseName,
        horseId: reportPayload.horseId,
        stall: reportPayload.stall,
        severity: reportPayload.severity,
        recipientRoles: ['VET', 'ADMIN', 'GROOM', 'ALL']
      });
    } catch {}

    setShowReportModal(false);
    setReportFormData({ stallCode: 'A1', horseName: '', severity: 'HIGH', symptoms: 'Ngựa bỏ ăn / Bỏ ăn trên 50%', desc: '' });
    showToast(`Đã phát báo động sự cố "${newInc.id}" đến Bác sĩ Thú Y trực ban!`, 'BÁO ĐỘNG THÀNH CÔNG', 'success');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Đã đăng xuất an toàn khỏi Cổng Groom.', 'ĐĂNG XUẤT', 'info');
  };

  // LỌC CHẶT CHẼ THEO THỜI GIAN THỰC:
  // Chỉ hiển thị cảnh báo và y lệnh cho các chiến mã Groom ĐÃ ĐỒNG Ý TIẾP NHẬN PHỤC VỤ
  const confirmedHorseNames = new Set(confirmedHorses.map(h => (h.name || '').trim().toLowerCase()));
  const confirmedHorseIds = new Set(confirmedHorses.map(h => String(h.id || h.horseId || '').trim().toLowerCase()));

  const activeAlerts = alerts.filter(alt => {
    const altName = (alt.horseName || '').trim().toLowerCase();
    const altId = String(alt.horseId || alt.horseIdentifier || '').trim().toLowerCase();
    return (
      (altName && confirmedHorseNames.has(altName)) ||
      (altId && confirmedHorseIds.has(altId))
    );
  });

  const activeVetInstructions = vetInstructions.filter(inst => {
    const instName = (inst.horseName || '').trim().toLowerCase();
    const instId = String(inst.horseId || '').trim().toLowerCase();
    return (
      (instName && confirmedHorseNames.has(instName)) ||
      (instId && confirmedHorseIds.has(instId))
    );
  });

  // Tính số lượng badge hiển thị trên Sidebar
  const uncompletedTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;
  const pendingIncidentsCount = activeAlerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const unconfirmedVetOrdersCount = activeVetInstructions.filter(v => !v.groomConfirmed).length;

  return (
    <div className="portal-layout">
      {/* Mobile drawer backdrop */}
      <div
        className={`portal-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===================== 1. SIDEBAR NAVIGATION (12 MỤC CHUẨN) ===================== */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-brand">
          <div className="portal-brand-icon">
            <IconHorse size={22} color="#14100A" />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>Chăm Sóc Groom (Husbandry)</p>
          </div>
        </div>

        <nav className="portal-nav" style={{ overflowY: 'auto', flex: 1 }}>
          {/* 1. Tổng quan (Dashboard) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            title="Tổng quan toàn bộ ca trực trong ngày"
          >
            <span className="portal-nav-icon"><IconDashboard size={18} /></span>
            <span className="portal-nav-label">Tổng quan (Dashboard)</span>
          </button>

          {/* 2. Công việc hằng ngày (My Daily Tasks) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => { setActiveTab('tasks'); setSidebarOpen(false); }}
            title="Quản lý công việc hằng ngày của các chiến mã được đồng ý chăm sóc"
          >
            <span className="portal-nav-icon"><IconTasks size={18} /></span>
            <span className="portal-nav-label">Công việc hằng ngày</span>
            {uncompletedTasksCount > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {uncompletedTasksCount}
              </span>
            )}
          </button>

          {/* 3. Quản lý chiến mã (Horse Management) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'horses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('horses'); setSidebarOpen(false); }}
            title="Danh sách chiến mã do Groom đồng ý chăm sóc"
          >
            <span className="portal-nav-icon"><IconHorse size={18} /></span>
            <span className="portal-nav-label">Quản lý chiến mã</span>
            <span className="portal-nav-badge">{confirmedHorses.length}</span>
          </button>

          {/* 4. Chăm sóc ngựa (Daily Care) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'care' ? 'active' : ''}`}
            onClick={() => { setActiveTab('care'); setSidebarOpen(false); }}
            title="Vệ sinh chuồng, tắm rửa, cạo móng & ngâm đá"
          >
            <span className="portal-nav-icon"><IconCare size={18} /></span>
            <span className="portal-nav-label">Chăm sóc ngựa</span>
          </button>

          {/* 5. Theo dõi sức khỏe (Health Monitoring) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => { setActiveTab('health'); setSidebarOpen(false); }}
            title="Ghi nhận chỉ số thể chất & dấu hiệu bất thường"
          >
            <span className="portal-nav-icon"><IconHealth size={18} /></span>
            <span className="portal-nav-label">Theo dõi sức khỏe</span>
          </button>

          {/* 6. Báo cáo sự cố (Incident Reports) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => { setActiveTab('incidents'); setSidebarOpen(false); }}
            title="Lập và theo dõi báo cáo sự cố gửi Bác sĩ Thú y"
          >
            <span className="portal-nav-icon"><IconAlert size={18} /></span>
            <span className="portal-nav-label">Báo cáo sự cố</span>
            {pendingIncidentsCount > 0 && (
              <span className="portal-nav-badge" style={{ background: '#EF4444', color: '#FFF' }}>
                {pendingIncidentsCount}
              </span>
            )}
          </button>

          {/* 7. Chỉ định thú y (Veterinary Instructions) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'vet-instructions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vet-instructions'); setSidebarOpen(false); }}
            title="Y lệnh thuốc và chăm sóc y tế từ Bác sĩ Thú y"
          >
            <span className="portal-nav-icon"><IconVet size={18} /></span>
            <span className="portal-nav-label">Chỉ định thú y</span>
            {unconfirmedVetOrdersCount > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {unconfirmedVetOrdersCount}
              </span>
            )}
          </button>

          {/* 8. Quản lý vật tư (Inventory Management) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inventory'); setSidebarOpen(false); }}
            title="Kiểm kê thức ăn, rơm mùn cưa và dụng cụ chuồng"
          >
            <span className="portal-nav-icon"><IconInventory size={18} /></span>
            <span className="portal-nav-label">Quản lý vật tư</span>
          </button>

          {/* 9. Báo cáo hằng ngày (Daily Reports) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
            title="Lập nhật ký ca trực và bàn giao ca"
          >
            <span className="portal-nav-icon"><IconReport size={18} /></span>
            <span className="portal-nav-label">Báo cáo hằng ngày</span>
          </button>

          {/* 10. Thông báo (Notifications) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }}
            title="Thông báo y lệnh, khóa huấn luyện và lịch tập"
          >
            <span className="portal-nav-icon"><IconNotification size={18} /></span>
            <span className="portal-nav-label">Thông báo</span>
            <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
              {pendingRequests.length > 0 ? `${pendingRequests.length} mới` : '3'}
            </span>
          </button>

          {/* 11. Hồ sơ cá nhân (My Profile) */}
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            title="Thông tin cá nhân và chứng chỉ Groom"
          >
            <span className="portal-nav-icon"><IconProfile size={18} /></span>
            <span className="portal-nav-label">Hồ sơ cá nhân</span>
          </button>

          {/* 12. Đăng xuất (Logout) */}
          <button
            type="button"
            className="portal-nav-item"
            onClick={handleLogout}
            style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', color: '#EF4444' }}
            title="Đăng xuất khỏi Cổng Groom"
          >
            <span className="portal-nav-icon"><IconLogout size={18} color="#EF4444" /></span>
            <span className="portal-nav-label" style={{ color: '#EF4444', fontWeight: 700 }}>Đăng xuất</span>
          </button>
        </nav>
      </aside>

      {/* ===================== 2. MAIN CONTENT WRAPPER ===================== */}
      <div className="portal-content-wrap">
        {/* TOPBAR */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              type="button"
              className="portal-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở Menu"
            >
              <IconDashboard size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>CỔNG NHÂN VIÊN CHĂM SÓC NGỰA</span>
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
                  STABLE GROOM & CARE
                </span>
              </h2>
              <div className="portal-page-subtitle">
                Đồng bộ thời gian thực theo phân công của Chủ sở hữu · Chỉ quản lý chiến mã do Groom đồng ý tiếp nhận
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <NotificationBell role="GROOM" currentUser={currentUser} />
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                {currentGroomUser.name.split(' ').map(n => n[0]).slice(-2).join('')}
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentGroomUser.name}</div>
                <div className="portal-user-role" style={{ color: currentGroomUser.isLead ? 'var(--brass)' : '#3B82F6', fontWeight: 600 }}>
                  {currentGroomUser.title}
                </div>
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

        {/* WORKSPACE MAIN */}
        <main className="portal-main">
          {/* ========================================================================= */}
          {/* KHỐI YÊU CẦU TIẾP NHẬN CHĂM SÓC TỪ CHỦ SỞ HỮU (CHỜ GROOM ĐỒNG Ý THEO THỜI GIAN THỰC) */}
          {/* ========================================================================= */}
          {pendingRequests.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)',
              border: '1px solid var(--brass)',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '22px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🌾</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brass)' }}>
                      YÊU CẦU GỬI GẮM CHĂM SÓC MỚI TỪ CHỦ SỞ HỮU ({pendingRequests.length})
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                      Chủ sở hữu vừa gửi gắm chiến mã và chỉ định bạn chăm sóc. Nếu bạn <b>Đồng Ý</b>, chiến mã sẽ xuất hiện trong danh sách chăm sóc chính thức; nếu bạn <b>Không Đồng Ý</b>, chiến mã sẽ bị xóa khỏi danh sách.
                    </p>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#0A0D14',
                  background: 'var(--brass)',
                  padding: '3px 10px',
                  borderRadius: '12px'
                }}>
                  {pendingRequests.length} Yêu cầu chờ phê duyệt
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '12px' }}>
                {pendingRequests.map((asgn) => {
                  const stallCode = asgn.stable ? (asgn.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || asgn.stable.split('(')[0].trim()) : 'Ô A1';
                  return (
                    <div
                      key={asgn.id || asgn.microchip}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <b style={{ color: 'var(--paper)', fontSize: '15px' }}>{asgn.horseName}</b>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--brass)',
                            background: 'rgba(212, 175, 55, 0.12)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(212, 175, 55, 0.25)'
                          }}>
                            {stallCode}
                          </span>
                        </div>
                        <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                          Chủ ngựa: <b style={{ color: 'var(--paper)' }}>{asgn.ownerName || 'Chủ sở hữu'}</b>
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', display: 'flex', gap: '12px' }}>
                        <span>Giống: <b style={{ color: 'var(--paper)' }}>{asgn.breed || 'Thoroughbred'}</b></span>
                        <span>Mã chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{asgn.microchip}</span></span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid var(--line)' }}>
                        <button
                          type="button"
                          onClick={() => handleRejectHorse(asgn)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '5px',
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Không đồng ý tiếp nhận - Chiến mã sẽ bị xóa khỏi danh sách chăm sóc của bạn"
                        >
                          ✕ Không Đồng Ý (Xóa)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptHorse(asgn)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '5px',
                            background: 'var(--brass)',
                            color: '#0A0D14',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                          }}
                          title="Đồng ý tiếp nhận chăm sóc - Đưa chiến mã vào danh sách quản lý chính thức"
                        >
                          ✓ Đồng Ý Tiếp Nhận
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: TỔNG QUAN (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <GroomDashboardTab
              horses={confirmedHorses}
              tasks={tasks}
              alerts={activeAlerts}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenReportModal={() => setShowReportModal(true)}
              onOpenHorseModal={(h) => setSelectedHorseModal(h)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenScheduleModal={() => setShowScheduleModal(true)}
              onDeleteTask={handleDeleteTask}
              currentGroomUser={currentGroomUser}
            />
          )}

          {/* TAB 2: CÔNG VIỆC HẰNG NGÀY (MY DAILY TASKS) */}
          {activeTab === 'tasks' && (
            <GroomTasksTab
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenScheduleModal={() => setShowScheduleModal(true)}
              onDeleteTask={handleDeleteTask}
              currentGroomUser={currentGroomUser}
            />
          )}

          {/* TAB 3: QUẢN LÝ CHIẾN MÃ (HORSE MANAGEMENT) */}
          {activeTab === 'horses' && (
            <GroomHorsesTab
              horses={confirmedHorses}
              onOpenHorseModal={(h) => setSelectedHorseModal(h)}
              onOpenReportModal={(prefill) => {
                if (prefill) setReportFormData(prev => ({ ...prev, ...prefill }));
                setShowReportModal(true);
              }}
            />
          )}

          {/* TAB 4: CHĂM SÓC NGỰA (DAILY CARE) */}
          {activeTab === 'care' && (
            <GroomCareTab
              stalls={stalls}
              onCleanBedding={handleCleanBedding}
              onOpenReportModal={(prefill) => {
                if (prefill) setReportFormData(prev => ({ ...prev, ...prefill }));
                setShowReportModal(true);
              }}
            />
          )}

          {/* TAB 5: THEO DÕI SỨC KHỎE (HEALTH MONITORING) */}
          {activeTab === 'health' && (
            <GroomHealthTab
              horses={confirmedHorses}
              onOpenReportModal={(prefill) => {
                if (prefill) setReportFormData(prev => ({ ...prev, ...prefill }));
                setShowReportModal(true);
              }}
            />
          )}

          {/* TAB 6: BÁO CÁO SỰ CỐ (INCIDENT REPORTS) */}
          {activeTab === 'incidents' && (
            <GroomIncidentsTab
              incidents={activeAlerts}
              onOpenReportModal={() => setShowReportModal(true)}
            />
          )}

          {/* TAB 7: CHỈ ĐỊNH THÚ Y (VETERINARY INSTRUCTIONS) */}
          {activeTab === 'vet-instructions' && (
            <GroomVetInstructionsTab
              instructions={activeVetInstructions}
              onConfirmInstruction={handleConfirmInstruction}
            />
          )}

          {/* TAB 8: QUẢN LÝ VẬT TƯ (INVENTORY MANAGEMENT) */}
          {activeTab === 'inventory' && (
            <GroomInventoryTab
              inventory={inventory}
              onRequestSupply={handleRequestSupply}
            />
          )}

          {/* TAB 9: BÁO CÁO HẰNG NGÀY (DAILY REPORTS) */}
          {activeTab === 'reports' && (
            <GroomReportsTab
              onSubmitDailyReport={() => showToast('Đã lưu và bàn giao báo cáo ca trực!', 'BÁO CÁO CA TRỰC', 'success')}
            />
          )}

          {/* TAB 10: THÔNG BÁO (NOTIFICATIONS) */}
          {activeTab === 'notifications' && (
            <GroomNotificationsTab />
          )}

          {/* TAB 11: HỒ SƠ CÁ NHÂN (MY PROFILE) */}
          {activeTab === 'profile' && (
            <GroomProfileTab currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* ===================== MODAL: BÁO CÁO SỰ CỐ KHẨN CẤP CHO BÁC SĨ THÚ Y ===================== */}
      <GroomIncidentReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
        horses={confirmedHorses}
        stalls={stalls}
        prefill={reportFormData}
        currentUser={currentUser}
      />

      {/* ===================== MODAL: PROFILE CHI TIẾT CHIẾN MÃ ===================== */}
      {selectedHorseModal && (
        <ConfirmedHorseProfileModal
          horse={selectedHorseModal}
          role="GROOM"
          onClose={() => setSelectedHorseModal(null)}
        />
      )}

      {/* ===================== MODAL: PHÂN CA & TẠO LỊCH CÔNG VIỆC (CHỦ NHÓM GROOM) ===================== */}
      <GroomScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onAddTask={handleAddTask}
        horses={currentGroomUser.isLead ? allTeamConfirmedHorses : confirmedHorses}
      />
    </div>
  );
}
