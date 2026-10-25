import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  getHorsesApi,
  getRacesApi,
  getFinancialSettlementsApi
} from '../services/api';

// Minimalist High-End SVG Icons for Owner Portal
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

export default function OwnerPage() {
  const { currentUser, logout } = useAuth();
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('horses'); // 'horses' | 'training' | 'races' | 'finance' | 'vet'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStatementModal, setSelectedStatementModal] = useState(null);
  const [selectedHorsePedigree, setSelectedHorsePedigree] = useState(null);

  // 1. Danh sách chiến mã thuộc quyền sở hữu của Chủ ngựa (Phạm Tiến Thành)
  const [myHorses, setMyHorses] = useState([
    {
      id: 1,
      name: 'Bạch Long',
      englishName: 'White Dragon',
      breed: 'Thoroughbred',
      microchip: 'MC-VN-2024-003',
      stable: 'Ô A2',
      ownershipShare: 100, // 100% độc quyền
      ownershipType: 'Độc quyền (Sole Owner)',
      trainer: 'Trần Văn Hùng (HLV Trưởng)',
      groom: 'Lê Hoàng Nam (Groom Block A)',
      status: 'ELIGIBLE',
      statusText: 'Đủ chuẩn thi đấu',
      winCount: 4,
      totalStarts: 6,
      totalPrizeEarned: 580000000,
      avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=600&q=80',
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
      ownershipShare: 100,
      ownershipType: 'Độc quyền (Sole Owner)',
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
      ownershipShare: 50, // Syndicate 50%
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
  ]);

  // 2. Dữ liệu Viễn trắc & Đánh giá huấn luyện mới nhất từ HLV Trưởng
  const [trainingTelemetry, setTrainingTelemetry] = useState([
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
    },
    {
      id: 3,
      horseName: 'Phi Yến',
      stable: 'Ô A5',
      sessionDate: '22/10/2026',
      maxSpeed: 'Đi bộ thả lỏng',
      avgSpeed: '8.0 km/h',
      peakHeartRate: '98 bpm',
      recoveryHeartRate: '56 bpm',
      distanceMeters: '800 m',
      readinessScore: '6.5 / 10 (Đang hồi phục)',
      trainerFeedback: 'Tuân thủ nghiêm ngặt phác đồ thú y, chỉ cho đi bộ dắt tay mặt đất mềm. Gân chân đang giảm sưng.'
    }
  ]);

  // 3. Danh sách Giải đua & Phê duyệt đề cử (Race Nominations)
  const [raceNominations, setRaceNominations] = useState([
    {
      id: 'RN-2026-01',
      raceName: 'Giải Vô Địch Cúp Derby Mùa Thu 2026',
      track: 'Trường đua Quốc tế Phú Thọ',
      horseName: 'Bạch Long',
      distance: '2.400m (Sân cỏ Grass)',
      date: '15/11/2026',
      estimatedPurse: 800000000,
      nominationStatus: 'APPROVED', // 'APPROVED' | 'WITHDRAWN' | 'PENDING'
      notes: 'HLV Trần Văn Hùng đề cử vào lượt chạy số 3 (Barrier 3).'
    },
    {
      id: 'RN-2026-02',
      raceName: 'Cúp Nước Rút Tốc Độ Sprint Cup 1.200m',
      track: 'Trường đua Cát Thể Thao',
      horseName: 'Lôi Chấn',
      distance: '1.200m (Sân cát Dirt)',
      date: '28/11/2026',
      estimatedPurse: 450000000,
      nominationStatus: 'PENDING',
      notes: 'Cần Chủ ngựa xác nhận đăng ký thi đấu trước 30/10/2026.'
    },
    {
      id: 'RN-2026-03',
      raceName: 'Giải Trẻ Cúp Mùa Thu Futurity',
      track: 'Trường đua Quốc tế Phú Thọ',
      horseName: 'Phi Yến',
      distance: '1.400m',
      date: '10/11/2026',
      estimatedPurse: 350000000,
      nominationStatus: 'WITHDRAWN',
      notes: 'Đã rút lui do lệnh Khóa Y Tế thú y bảo vệ an toàn gân chân.'
    }
  ]);

  // 4. Bảng Kê Đối Soát Tài Chính Hàng Tháng (Financial Settlements & Purse)
  const [statements, setStatements] = useState([
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
    },
    {
      id: 'STMT-2026-11-EST',
      period: 'Tháng 11/2026 (Tạm tính)',
      date: '01/11/2026',
      horseName: 'Phi Yến (50%)',
      chipId: 'MC-VN-2023-009',
      totalPrizeEarned: 0,
      boardingCost: 14000000,
      vetCost: 12000000,
      trainerCommission: 0,
      netPayable: -26000000,
      status: 'PENDING',
      statusText: 'Chờ đối soát cuối kỳ'
    }
  ]);

  // 5. Nhật ký Y tế & Thú y Minh bạch (Veterinary Health Transparency)
  const [healthLogs, setHealthLogs] = useState([
    {
      id: 1,
      horseName: 'Phi Yến (Ô A5)',
      issue: 'Giãn gân trước trái cấp độ 2',
      diagnosisBy: 'Bác sĩ Nguyễn An (Trưởng khoa)',
      medications: 'Phenylbutazone 20% tiêm IV + Băng ép Cryo',
      status: 'UNDER_TREATMENT',
      statusText: 'Đang điều trị tích cực',
      date: '09/10/2026',
      vetNote: 'Đã kích hoạt Lệnh Khóa Y Tế. Tình trạng tiến triển khả quan, dự kiến hồi phục 100% sau 3 tuần.'
    },
    {
      id: 2,
      horseName: 'Bạch Long (Ô A2)',
      issue: 'Kiểm tra sinh hiệu định kỳ & Gọt móng',
      diagnosisBy: 'Bác sĩ Nguyễn An',
      medications: 'Vaccine Cúm ngựa (Equine Influenza)',
      status: 'CLEARED',
      statusText: 'Khỏe mạnh xuất sắc',
      date: '10/10/2026',
      vetNote: 'Thể lực hoàn hảo, cơ bắp săn chắc, nhịp tim nghỉ 37 bpm. Đủ 100% điều kiện tranh giải.'
    },
    {
      id: 3,
      horseName: 'Lôi Chấn (Ô A4)',
      issue: 'Tiêm phòng định kỳ Viêm não thể EHV',
      diagnosisBy: 'Bác sĩ Nguyễn An',
      medications: 'Vaccine EHV 1.5ml IM',
      status: 'CLEARED',
      statusText: 'Khỏe mạnh xuất sắc',
      date: '12/10/2026',
      vetNote: 'Sức khỏe bình thường, phản ứng sau tiêm an toàn không sốt.'
    }
  ]);

  // Đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Đã đăng xuất khỏi Cổng Chủ Sở Hữu.', 'ĐĂNG XUẤT', 'info');
  };

  // Thao tác duyệt / từ chối đề cử giải đua 1-chạm
  const handleToggleNomination = (id, newStatus) => {
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
    showToast(`Đã cập nhật quyết định: ${label}!`, 'QUYẾT ĐỊNH CHỦ NGỰA', 'info');
  };

  // Tính tổng số tiền thưởng & số dư quỹ
  const totalPrizeAll = useMemo(() => {
    return myHorses.reduce((sum, h) => sum + h.totalPrizeEarned, 0);
  }, [myHorses]);

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
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
            title="Giải Đua & Phê Duyệt Tham Gia"
          >
            <span className="portal-nav-icon"><IconTrophy size={18} /></span>
            <span className="portal-nav-label">Phê duyệt giải đua</span>
            {raceNominations.filter(r => r.nominationStatus === 'PENDING').length > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {raceNominations.filter(r => r.nominationStatus === 'PENDING').length} chờ
              </span>
            )}
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
                Portfolio Equity, Race Purses, Training Telemetry & Boarding Statements
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                PT
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentUser?.full_name || 'Phạm Tiến Thành'}</div>
                <div className="portal-user-role">Chủ sở hữu Ngựa (VIP Owner)</div>
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
                2 Độc quyền (100%) · 1 Syndicate (50%)
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
                1,25 <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>TỶ VNĐ</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                Tổng doanh thu giải đua mùa 2026
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
                +820 <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>TRIỆU VNĐ</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                Sau khi trừ phí chuồng & HLV
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ĐÀN NGỰA SỞ HỮU (MY HORSES) */}
          {/* ========================================================================= */}
          {activeTab === 'horses' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Đàn Ngựa Thuộc Quyền Sở Hữu (Racehorse Portfolio)</h2>
                <p className="pane-desc">Thông tin định danh, tỷ lệ cổ phần sở hữu, ô chuồng và ê-kíp phụ trách.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
                {myHorses.map((h) => (
                  <div key={h.id} className="facility-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                      <img
                        src={h.avatar}
                        alt={h.name}
                        style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{h.name}</b>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: h.status === 'ELIGIBLE' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                            color: h.status === 'ELIGIBLE' ? 'var(--brass)' : 'var(--paper-dim)',
                            border: `1px solid ${h.status === 'ELIGIBLE' ? 'var(--brass)' : 'var(--line)'}`
                          }}>
                            {h.statusText}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--paper-dim)', margin: '3px 0' }}>{h.englishName} · {h.breed}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', fontFamily: 'monospace' }}>{h.microchip}</div>
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
                        <span style={{ color: 'var(--paper-dim)' }}>Thành tích: </span>
                        <b style={{ color: 'var(--paper)' }}>{h.winCount}/{h.totalStarts} Nhất</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--paper-dim)' }}>Tiền thưởng: </span>
                        <b style={{ color: 'var(--brass)' }}>{formatVND(h.totalPrizeEarned)}</b>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)', borderTop: '1px solid var(--line)', paddingTop: '10px', marginBottom: '12px' }}>
                      HLV: <b style={{ color: 'var(--paper)' }}>{h.trainer}</b> · Groom: <b style={{ color: 'var(--paper)' }}>{h.groom}</b>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedHorsePedigree(h)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--paper)',
                        border: '1px solid var(--line)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Xem phả hệ & chi tiết lý lịch
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TIẾN ĐỘ HUẤN LUYỆN & VIỄN TRẮC (TRAINING & TELEMETRY) */}
          {/* ========================================================================= */}
          {activeTab === 'training' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Tiến Độ Huấn Luyện & Viễn Trắc (Telemetry & Performance)</h2>
                <p className="pane-desc">Báo cáo chỉ số gắng sức, nhịp tim hồi phục và đánh giá phong độ từ HLV Trưởng.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {trainingTelemetry.map((t) => (
                  <div key={t.id} className="facility-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{t.horseName}</b>
                        <span style={{ color: 'var(--paper-dim)', fontSize: '12.5px' }}>({t.stable})</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>Buổi tập: {t.sessionDate}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '6px', marginBottom: '12px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Tốc độ đỉnh</div>
                        <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.maxSpeed}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Tốc độ trung bình</div>
                        <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.avgSpeed}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Nhịp tim tối đa</div>
                        <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{t.peakHeartRate}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Hồi phục sau 15p</div>
                        <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{t.recoveryHeartRate}</b>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Độ sẵn sàng</div>
                        <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{t.readinessScore}</b>
                      </div>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.45, background: 'rgba(212, 175, 55, 0.05)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                      <b>Nhận xét của HLV Trưởng:</b> {t.trainerFeedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PHÊ DUYỆT GIẢI ĐUA (RACE NOMINATIONS) */}
          {/* ========================================================================= */}
          {activeTab === 'races' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Phê Duyệt Đăng Ký Giải Đua (Race Nominations)</h2>
                <p className="pane-desc">Quyền quyết định tối cao của Chủ ngựa: Phê duyệt lượt chạy hoặc rút lui bảo vệ thể lực.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {raceNominations.map((r) => {
                  const isApproved = r.nominationStatus === 'APPROVED';
                  const isWithdrawn = r.nominationStatus === 'WITHDRAWN';
                  const isPending = r.nominationStatus === 'PENDING';

                  return (
                    <div key={r.id} className="facility-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <b style={{ fontSize: '16px', color: 'var(--paper)' }}>{r.raceName}</b>
                          <div style={{ fontSize: '12.5px', color: 'var(--brass)', fontWeight: 600, marginTop: '2px' }}>
                            {r.horseName} · <span style={{ color: 'var(--paper-dim)' }}>{r.distance} ({r.track})</span>
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isApproved ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                          color: isApproved ? 'var(--brass)' : 'var(--paper-dim)',
                          border: `1px solid ${isApproved ? 'var(--brass)' : 'var(--line)'}`
                        }}>
                          {isApproved ? 'ĐÃ DUYỆT THAM GIA' : isWithdrawn ? 'ĐÃ RÚT LUI' : 'CHỜ CHỦ NGỰA DUYỆT'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                        <div>Ngày thi đấu: <b style={{ color: 'var(--paper)' }}>{r.date}</b></div>
                        <div>Tổng giải thưởng dự kiến: <b style={{ color: 'var(--brass)' }}>{formatVND(r.estimatedPurse)}</b></div>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '14px' }}>
                        Ghi chú: {r.notes}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        {isPending ? (
                          <>
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
                              Từ chối & Rút lui
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleNomination(r.id, 'APPROVED')}
                              style={{
                                padding: '7px 18px',
                                borderRadius: '6px',
                                background: 'var(--brass)',
                                color: '#0A0D14',
                                fontWeight: 700,
                                border: 'none',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Phê duyệt tham gia
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleNomination(r.id, isApproved ? 'WITHDRAWN' : 'APPROVED')}
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
                            Đổi quyết định: {isApproved ? 'Rút lui giải' : 'Duyệt tham gia'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT SAO KÊ TÀI CHÍNH (COMPACT & CLEAN) */}
      {/* ========================================================================= */}
      {selectedStatementModal && (
        <div className="modal-overlay" onClick={() => setSelectedStatementModal(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
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
      {/* MODAL 2: XEM PHẢ HỆ CHIẾN MÃ (PEDIGREE MODAL) */}
      {/* ========================================================================= */}
      {selectedHorsePedigree && (
        <div className="modal-overlay" onClick={() => setSelectedHorsePedigree(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
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
    </div>
  );
}
