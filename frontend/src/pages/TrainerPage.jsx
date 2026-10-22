import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { getTrainingProgramsApi } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

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

export default function TrainerPage() {
  const { currentUser, logout } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'programs' | 'sessions' | 'review'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

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
  const [programs, setPrograms] = useState([
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
  ]);

  // Nạp giáo án từ API Backend khi khởi động
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

    return () => { isMounted = false; };
  }, []);

  // 3. Danh sách buổi tập & chỉ số Telemetry (Training Sessions)
  const [sessions, setSessions] = useState([
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
  ]);

  // Bộ lọc theo chiến mã & trạng thái bài tập
  const [filterHorse, setFilterHorse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
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
  const [newProgramData, setNewProgramData] = useState({
    title: '',
    horseName: 'Hắc Phong',
    phase: 'Nước rút (Sprint)',
    targetDistance: 1600,
    surface: 'SAND (Sân cát)',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

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
    setPrograms([newProg, ...programs]);
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
    setSessions([newSess, ...sessions]);
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
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const nextStatus = s.status === 'COMPLETED' ? 'INCOMPLETE' : 'COMPLETED';
        const statusText = nextStatus === 'COMPLETED' ? 'Hoàn thành' : 'Không hoàn thành';
        showToast(`Đã đổi bài tập của ${s.horseName} sang: ${statusText}`);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
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
        </nav>

        <div className="portal-sidebar-footer">
          <div className="portal-sys-badge">
            <div className="portal-sys-dot" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '12px' }}>Mã Trường OS</div>
              <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>v2.4 Trainer Portal</div>
            </div>
          </div>
          <Link to="/" className="portal-public-link" style={{ marginTop: '12px' }}>
            <IconGlobe size={15} />
            <span>{t('trainerPublicLink')}</span>
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
              <IconMenu size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title">
                {activeTab === 'vitals' && t('trainerTitleVitals')}
                {activeTab === 'programs' && t('trainerTitlePrograms')}
                {activeTab === 'sessions' && t('trainerTitleSessions')}
                {activeTab === 'review' && t('trainerTitleReview')}
              </h2>
              <div className="portal-page-subtitle">
                {activeTab === 'vitals' && t('trainerSubVitals')}
                {activeTab === 'programs' && t('trainerSubPrograms')}
                {activeTab === 'sessions' && t('trainerSubSessions')}
                {activeTab === 'review' && t('trainerSubReview')}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`facility-card-badge ${badgeClass}`}>
                            <IconHorse size={14} color="var(--brass)" />
                            <span>{horse.stall} • {horse.breed.toUpperCase()}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>
                            {horse.microchip}
                          </span>
                        </div>

                        <h3 className="facility-card-title">{horse.name}</h3>
                        <p className="facility-card-desc">{horse.desc}</p>

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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="facility-card-badge badge-gold">
                          <IconClipboard size={14} color="var(--brass)" />
                          <span>{prog.phase.toUpperCase()}</span>
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
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

    </div>
  );
}
