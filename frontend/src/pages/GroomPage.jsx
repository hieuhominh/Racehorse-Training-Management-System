import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  reportIncidentApi
} from '../services/api';
import { getServiceAssignments, confirmServiceAssignment } from '../services/serviceAssignment';

// Minimalist High-End SVG Icons for Groom Portal
const IconHorse = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" />
    <path d="M2 17l2-11c.2-1.1 1.2-2 2.3-2h3.4c1 0 1.9.7 2.2 1.6L13 9h4c1.7 0 3 1.3 3 3v2" />
    <circle cx="7" cy="8" r="1" />
  </svg>
);

const IconChecklist = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IconAlert = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconFeed = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10c0-3-1.3-5.7-3.4-7.5" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconSupplies = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const IconStall = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
  </svg>
);

export default function GroomPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_tab_groom');
      return ['stalls', 'checklist', 'incident', 'nutrition', 'supplies'].includes(saved) ? saved : 'stalls';
    } catch {
      return 'stalls';
    }
  }); // 'stalls' | 'checklist' | 'incident' | 'nutrition' | 'supplies'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('matruong_tab_groom', activeTab);
  }, [activeTab]);

  // 1. Dữ liệu các ô chuồng Groom phụ trách (Block A)
  const [assignedStalls, setAssignedStalls] = useState([
    {
      code: 'A1',
      zone: 'Block A',
      horseName: 'Xích Thố',
      breed: 'Thoroughbred',
      microchip: 'MC-VN-2023-001',
      status: 'NORMAL',
      bedding: 'Mùn cưa sạch',
      beddingStatus: 'GOOD',
      waterLevel: '100%',
      temp: '26.5°C',
      humidity: '65%',
      lastCleaned: '07:30 Sáng nay',
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80'
    },
    {
      code: 'A2',
      zone: 'Block A',
      horseName: 'Bạch Long',
      breed: 'Thoroughbred',
      microchip: 'MC-VN-2024-003',
      status: 'NORMAL',
      bedding: 'Rơm khô mới thay',
      beddingStatus: 'GOOD',
      waterLevel: '85%',
      temp: '26.8°C',
      humidity: '63%',
      lastCleaned: '08:00 Sáng nay',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
    },
    {
      code: 'A3',
      zone: 'Block A',
      horseName: 'Hắc Phong',
      breed: 'Arabian',
      microchip: 'MC-VN-2022-001',
      status: 'WATCH_HEALTH',
      bedding: 'Mùn cưa cần thay',
      beddingStatus: 'NEEDS_CLEAN',
      waterLevel: '60%',
      temp: '27.1°C',
      humidity: '68%',
      lastCleaned: 'Hôm qua',
      image: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80'
    },
    {
      code: 'A4',
      zone: 'Block A',
      horseName: 'Lôi Chấn',
      breed: 'Quarter Horse',
      microchip: 'MC-VN-2022-088',
      status: 'NORMAL',
      bedding: 'Rơm khô tiêu chuẩn',
      beddingStatus: 'GOOD',
      waterLevel: '95%',
      temp: '26.6°C',
      humidity: '64%',
      lastCleaned: '07:45 Sáng nay',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
    },
    {
      code: 'A5',
      zone: 'Block A',
      horseName: 'Phi Yến',
      breed: 'Thoroughbred',
      microchip: 'MC-VN-2023-009',
      status: 'RESTRICTED_CARE',
      bedding: 'Đệm cao su + Rơm mềm',
      beddingStatus: 'GOOD',
      waterLevel: '90%',
      temp: '26.4°C',
      humidity: '62%',
      lastCleaned: '08:15 Sáng nay',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
    },
    {
      code: 'A6',
      zone: 'Block A',
      horseName: '(Ô chuồng dự phòng)',
      breed: 'Trống',
      microchip: 'N/A',
      status: 'AVAILABLE',
      bedding: 'Đã sát trùng vôi bột',
      beddingStatus: 'GOOD',
      waterLevel: '100%',
      temp: '26.2°C',
      humidity: '60%',
      lastCleaned: 'Sáng nay',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  // 2. Checklist Chăm sóc Trực ca hàng ngày
  const [dailyRoutines, setDailyRoutines] = useState([
    {
      id: 1,
      time: '06:00',
      title: 'Bữa sáng & Cấp nước',
      desc: 'Cấp cỏ khô Alfalfa (4kg/con), yến mạch ngâm nở và kiểm tra phao nước tự động.',
      completed: true,
      completedAt: '06:25'
    },
    {
      id: 2,
      time: '08:00',
      title: 'Chải lông & Cạo móng',
      desc: 'Dùng lược Curry chải sạch bụi cát, dao Hoof pick nạo sạch sỏi đá bám kẽ móng guốc.',
      completed: true,
      completedAt: '08:40'
    },
    {
      id: 3,
      time: '11:30',
      title: 'Bữa trưa & Điện giải',
      desc: 'Khẩu phần cỏ tươi, cám đậm đặc và bổ sung điện giải chống mất nước do nắng nóng.',
      completed: true,
      completedAt: '11:45'
    },
    {
      id: 4,
      time: '15:30',
      title: 'Hạ nhiệt & Ngâm chân đá Cryo',
      desc: 'Đón ngựa sau giờ tập của HLV, xịt nước làm mát gân chân và mang ủng đá lạnh 20 phút.',
      completed: true,
      completedAt: '16:05'
    },
    {
      id: 5,
      time: '18:00',
      title: 'Bữa tối & Khóa an toàn ban đêm',
      desc: 'Cho ăn cỏ khô bữa tối, dọn sạch phân tồn đọng, khóa chốt an toàn cửa chuồng.',
      completed: false,
      completedAt: null
    }
  ]);

  // 3. Danh sách ca sự cố Groom đã báo cáo
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-9012',
      stallCode: 'A3',
      horseName: 'Hắc Phong',
      severity: 'HIGH',
      symptoms: 'Ngựa bỏ ăn, thở nhanh, cào chân',
      desc: 'Hắc Phong bỏ 2/3 khẩu phần cỏ Alfalfa buổi trưa, thở nhanh và dậm chân liên tục. Thân nhiệt 38.8°C.',
      reportedAt: '11:45 - 08/10/2026',
      status: 'pending_vet',
      statusText: 'Đang chờ BS Thú Y khám'
    },
    {
      id: 'INC-8819',
      stallCode: 'B4',
      horseName: 'Phi Vân',
      severity: 'MEDIUM',
      symptoms: 'Vết nứt nhẹ thành móng sau',
      desc: 'Phát hiện vết rạn móng nhẹ sau buổi tập. Đã vệ sinh sạch cát và chườm đá lạnh.',
      reportedAt: '09:15 - 08/10/2026',
      status: 'in_review',
      statusText: 'Thú Y đang theo dõi'
    }
  ]);

  // Modal báo cáo sự cố mới
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    stallCode: 'A3',
    horseName: 'Hắc Phong',
    severity: 'HIGH',
    symptoms: 'Bỏ ăn / Mệt mỏi',
    desc: ''
  });

  // 4. Nhật ký Dinh dưỡng & Thức ăn
  const [feedLogs] = useState([
    { id: 1, horse: 'Xích Thố (A1)', hayKg: '8 kg', grainKg: '3.5 kg', waterL: '45 L', intakeRate: '100% (Ăn hết)', note: 'Thể lực rất tốt' },
    { id: 2, horse: 'Bạch Long (A2)', hayKg: '7.5 kg', grainKg: '3.0 kg', waterL: '42 L', intakeRate: '100% (Ăn hết)', note: 'Bình thường' },
    { id: 3, horse: 'Hắc Phong (A3)', hayKg: '5.0 kg', grainKg: '1.5 kg', waterL: '30 L', intakeRate: '35% (Bỏ ăn trưa)', note: 'Đã báo Thú Y theo dõi tiêu hóa' },
    { id: 4, horse: 'Lôi Chấn (A4)', hayKg: '8 kg', grainKg: '3.5 kg', waterL: '44 L', intakeRate: '100% (Ăn hết)', note: 'Bình thường' },
    { id: 5, horse: 'Phi Yến (A5)', hayKg: '6 kg', grainKg: '2.0 kg', waterL: '38 L', intakeRate: '90% (Ăn tốt)', note: 'Khẩu phần giảm theo phác đồ thú y' }
  ]);

  // 5. Tủ vật tư & Dụng cụ chuồng trại
  const [suppliesList] = useState([
    { id: 1, name: 'Băng quấn chân bảo vệ gân', qty: '12 cuộn', status: 'GOOD', statusLabel: 'Đầy đủ' },
    { id: 2, name: 'Ủng đá lạnh phục hồi Cryo', qty: '8 bộ', status: 'GOOD', statusLabel: 'Đầy đủ' },
    { id: 3, name: 'Thuốc xịt sát trùng móng Blue Kote', qty: '3 chai', status: 'LOW', statusLabel: 'Sắp hết' },
    { id: 4, name: 'Đệm lót rơm tươi & mùn cưa', qty: '4 bao', status: 'LOW', statusLabel: 'Cần bổ sung' },
    { id: 5, name: 'Khoáng vi lượng dạng đá liếm', qty: '15 bánh', status: 'GOOD', statusLabel: 'Đầy đủ' }
  ]);

  // Đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Đã đăng xuất khỏi Cổng Groom.', 'ĐĂNG XUẤT', 'info');
  };

  // Toggle checklist item
  const handleToggleRoutine = (id) => {
    setDailyRoutines(prev => prev.map(r => {
      if (r.id === id) {
        const nextState = !r.completed;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return {
          ...r,
          completed: nextState,
          completedAt: nextState ? timeStr : null
        };
      }
      return r;
    }));
  };

  // Làm sạch đệm lót 1-chạm
  const handleCleanBedding = (stallCode) => {
    setAssignedStalls(prev => prev.map(s => {
      if (s.code === stallCode) {
        return {
          ...s,
          bedding: 'Mùn cưa mới thay',
          beddingStatus: 'GOOD',
          lastCleaned: 'Vừa xong'
        };
      }
      return s;
    }));
    showToast(`Đã ghi nhận hoàn tất dọn vệ sinh ô chuồng ${stallCode}!`, 'VỆ SINH Ô CHUỒNG', 'info');
  };

  // Gửi báo cáo sự cố lên Thú Y
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportData.desc.trim()) {
      showToast('Vui lòng nhập mô tả sự cố cụ thể.', 'THIẾU THÔNG TIN', 'warning');
      return;
    }

    const newInc = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      stallCode: reportData.stallCode,
      horseName: reportData.horseName,
      severity: reportData.severity,
      symptoms: reportData.symptoms,
      description: reportData.desc,
      reportedBy: currentUser?.full_name || 'Lê Hoàng Nam (Groom)',
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'pending_vet'
    };

    reportIncidentApi(newInc);
    setIncidents(prev => [
      {
        id: newInc.id,
        stallCode: newInc.stallCode,
        horseName: newInc.horseName,
        severity: newInc.severity,
        symptoms: newInc.symptoms,
        desc: newInc.description,
        reportedAt: 'Vừa xong',
        status: 'pending_vet',
        statusText: 'Đang chờ BS Thú Y khám'
      },
      ...prev
    ]);

    setShowReportModal(false);
    setReportData({
      stallCode: 'A1',
      horseName: 'Xích Thố',
      severity: 'HIGH',
      symptoms: 'Bỏ ăn / Mệt mỏi',
      desc: ''
    });
    showToast(`Đã phát tín hiệu báo động ca ${newInc.id} đến Bác sĩ Thú Y!`, 'BÁO ĐỘNG THÀNH CÔNG', 'info');
  };

  // State: Quản lý phân công chăm sóc từ Chủ sở hữu (3 Groom cố định)
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

  const handleConfirmGroomService = (asgn) => {
    const groomUser = currentUser?.username || 'groom_nam';
    const updated = confirmServiceAssignment(asgn.horseName, 'GROOM', groomUser);
    setServiceAssignments(updated);
    showToast(`Đã xác nhận nhận chăm sóc chiến mã "${asgn.horseName}" cho Chủ sở hữu ${asgn.ownerName}!`, 'GROOM XÁC NHẬN CHĂM SÓC', 'success');
  };

  // Tính tiến độ ca trực hôm nay
  const completedRoutinesCount = dailyRoutines.filter(r => r.completed).length;
  const routinePercent = Math.round((completedRoutinesCount / dailyRoutines.length) * 100);

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
            <IconHorse size={22} color="#14100A" />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>Chăm Sóc Groom (Husbandry)</p>
          </div>
        </div>

        <nav className="portal-nav">
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'stalls' ? 'active' : ''}`}
            onClick={() => { setActiveTab('stalls'); setSidebarOpen(false); }}
            title="Quản lý Ô Chuồng Phụ Trách"
          >
            <span className="portal-nav-icon"><IconStall size={18} /></span>
            <span className="portal-nav-label">Ô chuồng phụ trách</span>
            <span className="portal-nav-badge">{assignedStalls.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => { setActiveTab('checklist'); setSidebarOpen(false); }}
            title="Lịch Trực Nhật & Chăm Sóc Hàng Ngày"
          >
            <span className="portal-nav-icon"><IconChecklist size={18} /></span>
            <span className="portal-nav-label">Checklist ca trực</span>
            <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
              {completedRoutinesCount}/{dailyRoutines.length}
            </span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'incident' ? 'active' : ''}`}
            onClick={() => { setActiveTab('incident'); setSidebarOpen(false); }}
            title="Báo Cáo Sự Cố Chuồng Trại Cho Thú Y"
          >
            <span className="portal-nav-icon"><IconAlert size={18} /></span>
            <span className="portal-nav-label">Báo động sự cố</span>
            {incidents.filter(i => i.status === 'pending_vet').length > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {incidents.filter(i => i.status === 'pending_vet').length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => { setActiveTab('nutrition'); setSidebarOpen(false); }}
            title="Nhật Ký Dinh Dưỡng & Khẩu Phần Ăn"
          >
            <span className="portal-nav-icon"><IconFeed size={18} /></span>
            <span className="portal-nav-label">Thực đơn dinh dưỡng</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'supplies' ? 'active' : ''}`}
            onClick={() => { setActiveTab('supplies'); setSidebarOpen(false); }}
            title="Vật Tư & Dụng Cụ Chuồng Trại"
          >
            <span className="portal-nav-icon"><IconSupplies size={18} /></span>
            <span className="portal-nav-label">Vật tư & Dụng cụ</span>
            <span className="portal-nav-badge">
              {suppliesList.filter(s => s.status === 'LOW').length > 0 ? `${suppliesList.filter(s => s.status === 'LOW').length} thiếu` : suppliesList.length}
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
              <IconHorse size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>CỔNG NHÂN VIÊN CHĂM SÓC</span>
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
                Daily Equine Husbandry, Nutrition & Facility Duty Protocol
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                GN
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentUser?.full_name || 'Lê Hoàng Nam'}</div>
                <div className="portal-user-role">Groom Trực ban Block A</div>
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
          {/* 3 THẺ CHỈ SỐ NHANH (KPI STATS - CHUẨN 3 MÀU CHỦ ĐẠO & GỌN GÀNG) */}
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
                  Ô CHUỒNG PHỤ TRÁCH
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brass)', boxShadow: '0 0 8px var(--brass-glow)' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brass)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                {assignedStalls.length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>Ô CHUỒNG</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                Block A · Khu chuồng đua chính
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
                  TIẾN ĐỘ CA TRỰC HÔM NAY
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-dim)' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                {routinePercent}% <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>({completedRoutinesCount}/{dailyRoutines.length} ca)</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                Mốc tiếp theo: 18:00 Bữa tối
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
                  SỰ CỐ ĐÃ BÁO THÚ Y
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-muted)' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                {incidents.filter(i => i.status === 'pending_vet').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA CHỜ KHÁM</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                Hắc Phong (A3) · Đang chờ BS Thú Y
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: Ô CHUỒNG PHỤ TRÁCH */}
          {/* ========================================================================= */}
          {activeTab === 'stalls' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 className="pane-title">Ô Chuồng Phụ Trách (Assigned Stalls)</h2>
                  <p className="pane-desc">Theo dõi thực tế tình trạng chiến mã, đệm lót rơm và máng nước tự động.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  + Báo sự cố chuồng
                </button>
              </div>

              {/* Khối Xác Nhận Chăm Sóc Cho Nhân Viên Groom */}
              {(() => {
                const currentUsername = currentUser?.username || 'groom_nam';
                const assignedToMe = serviceAssignments.filter(a =>
                  a.groomUsername === currentUsername ||
                  (!a.groomUsername && currentUsername === 'groom_nam')
                );
                if (assignedToMe.length === 0) return null;

                const pendingAssignments = assignedToMe.filter(a => a.groomStatus === 'PENDING');

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
                        <span style={{ fontSize: '18px' }}>🌾</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>
                            Chiến Mã Được Chủ Sở Hữu Chỉ Định Chăm Sóc ({assignedToMe.length})
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                            {pendingAssignments.length > 0
                              ? `Có ${pendingAssignments.length} chiến mã mới đang chờ bạn xác nhận nhận chăm sóc.`
                              : `Bạn đã xác nhận phụ trách chăm sóc đầy đủ cho tất cả chiến mã được giao.`}
                          </div>
                        </div>
                      </div>
                      {pendingAssignments.length > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                          {pendingAssignments.length} Chờ xác nhận
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                      {assignedToMe.map(asgn => {
                        const isPending = asgn.groomStatus === 'PENDING';
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
                                Phối hợp: HLV {asgn.trainerName} · BS. {asgn.vetName}
                              </div>
                            </div>

                            <div style={{ flexShrink: 0 }}>
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmGroomService(asgn)}
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
                                  ✓ Nhận Chăm Sóc
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {assignedStalls.map((s) => (
                  <div key={s.code} className="facility-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--brass)',
                          fontWeight: 800,
                          fontSize: '14px',
                          border: '1px solid var(--line-strong)'
                        }}>
                          {s.code}
                        </span>
                        <div>
                          <b style={{ fontSize: '15px', color: 'var(--paper)' }}>{s.horseName}</b>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{s.breed} · {s.microchip}</div>
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: s.status === 'WATCH_HEALTH' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                        color: s.status === 'WATCH_HEALTH' ? 'var(--brass)' : 'var(--paper-dim)',
                        border: `1px solid ${s.status === 'WATCH_HEALTH' ? 'var(--brass)' : 'var(--line)'}`
                      }}>
                        {s.status === 'WATCH_HEALTH' ? 'CẦN CHÚ Ý' : s.status === 'RESTRICTED_CARE' ? 'KHÓA Y TẾ' : 'BÌNH THƯỜNG'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--paper-dim)' }}>Đệm lót: </span>
                        <b style={{ color: 'var(--paper)' }}>{s.bedding}</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--paper-dim)' }}>Máng nước: </span>
                        <b style={{ color: 'var(--paper)' }}>{s.waterLevel}</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--paper-dim)' }}>Nhiệt độ: </span>
                        <b style={{ color: 'var(--paper)' }}>{s.temp}</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--paper-dim)' }}>Dọn gần nhất: </span>
                        <b style={{ color: 'var(--paper)' }}>{s.lastCleaned}</b>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleCleanBedding(s.code)}
                        style={{
                          flex: 1,
                          padding: '7px 12px',
                          borderRadius: '6px',
                          background: 'var(--bg-secondary)',
                          color: 'var(--paper)',
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Đã dọn đệm lót
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReportData(prev => ({ ...prev, stallCode: s.code, horseName: s.horseName }));
                          setShowReportModal(true);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '6px',
                          background: 'transparent',
                          color: 'var(--brass)',
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Báo sự cố
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CHECKLIST CA TRỰC HÀNG NGÀY */}
          {/* ========================================================================= */}
          {activeTab === 'checklist' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Checklist Ca Trực Hàng Ngày (Daily Routine)</h2>
                <p className="pane-desc">Đánh dấu tiến độ thực tế theo từng mốc giờ trong ca trực.</p>
              </div>

              {/* Progress bar */}
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <b style={{ color: 'var(--paper)' }}>Tiến độ hoàn thành ca trực: {routinePercent}%</b>
                  <span style={{ color: 'var(--brass)', fontWeight: 700 }}>{completedRoutinesCount} / {dailyRoutines.length} nhiệm vụ</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${routinePercent}%`, height: '100%', background: 'var(--brass)', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dailyRoutines.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleToggleRoutine(r.id)}
                    className="facility-card"
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderLeft: r.completed ? '4px solid var(--brass)' : '4px solid var(--line)',
                      opacity: r.completed ? 0.9 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <input
                        type="checkbox"
                        checked={r.completed}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--brass)', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brass)' }}>{r.time}</span>
                          <b style={{ fontSize: '14.5px', color: r.completed ? 'var(--paper)' : 'var(--paper-dim)', textDecoration: r.completed ? 'none' : 'none' }}>
                            {r.title}
                          </b>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', marginTop: '4px' }}>
                          {r.desc}
                        </div>
                      </div>
                    </div>
                    {r.completed && (
                      <span style={{ fontSize: '11.5px', color: 'var(--brass)', fontWeight: 600, background: 'rgba(212, 175, 55, 0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                        ✓ Xong lúc {r.completedAt}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BÁO ĐỘNG SỰ CỐ KHẨN CẤP */}
          {/* ========================================================================= */}
          {activeTab === 'incident' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 className="pane-title">Báo Động Sự Cố Chuồng Trại (Incident Dispatch)</h2>
                  <p className="pane-desc">Phát tín hiệu trực tiếp cho Bác sĩ Thú y khi phát hiện ngựa bỏ ăn hoặc có dấu hiệu chấn thương.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  + Tạo báo động khẩn cấp
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incidents.map((inc) => (
                  <div key={inc.id} className="facility-card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--brass)',
                          border: '1px solid var(--line-strong)'
                        }}>
                          {inc.severity}
                        </span>
                        <b style={{ fontSize: '14px', color: 'var(--paper)' }}>Mã: {inc.id}</b>
                        <span style={{ color: 'var(--paper-dim)', fontSize: '13px' }}>· Ô {inc.stallCode} ({inc.horseName})</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{inc.reportedAt}</span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--paper)', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', marginBottom: '10px', lineHeight: 1.45 }}>
                      <b>Triệu chứng:</b> {inc.symptoms} — {inc.desc}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>
                        Trạng thái: <b style={{ color: 'var(--brass)' }}>{inc.statusText}</b>
                      </span>
                      <span style={{ color: 'var(--paper-dim)' }}>
                        Người báo cáo: <b>{currentUser?.full_name || 'Lê Hoàng Nam'}</b>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: THỰC ĐƠN DINH DƯỠNG & KHẨU PHẦN ĂN */}
          {/* ========================================================================= */}
          {activeTab === 'nutrition' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Thực Đơn Dinh Dưỡng & Khẩu Phần (Nutrition & Feeding)</h2>
                <p className="pane-desc">Định lượng cỏ khô Alfalfa, yến mạch ngâm nở và theo dõi tỷ lệ ăn hết của từng chiến mã.</p>
              </div>

              <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11.5px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Chiến mã (Ô chuồng)</th>
                      <th style={{ padding: '12px 16px' }}>Cỏ khô Alfalfa</th>
                      <th style={{ padding: '12px 16px' }}>Yến mạch & Cám</th>
                      <th style={{ padding: '12px 16px' }}>Lượng nước</th>
                      <th style={{ padding: '12px 16px' }}>Tỷ lệ ăn hết</th>
                      <th style={{ padding: '12px 16px' }}>Ghi chú ca trực</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedLogs.map((f) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--brass)' }}>{f.horse}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--paper)' }}>{f.hayKg}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--paper)' }}>{f.grainKg}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--paper-dim)' }}>{f.waterL}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: f.intakeRate.includes('100%') ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                            color: f.intakeRate.includes('100%') ? 'var(--brass)' : 'var(--paper-dim)',
                            border: `1px solid ${f.intakeRate.includes('100%') ? 'var(--brass)' : 'var(--line)'}`
                          }}>
                            {f.intakeRate}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--paper-dim)', fontSize: '12px' }}>{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: VẬT TƯ & DỤNG CỤ CHUỒNG TRẠI */}
          {/* ========================================================================= */}
          {activeTab === 'supplies' && (
            <div className="tab-pane">
              <div className="pane-header" style={{ marginBottom: '16px' }}>
                <h2 className="pane-title">Vật Tư & Dụng Cụ Chuồng Trại (Tack & Grooming Kit)</h2>
                <p className="pane-desc">Kiểm kê dụng cụ chải chuốt, đệm lót và yêu cầu cấp phát khi vật tư sắp hết.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {suppliesList.map((sup) => (
                  <div key={sup.id} className="facility-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <b style={{ fontSize: '14.5px', color: 'var(--paper)' }}>{sup.name}</b>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: sup.status === 'LOW' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                        color: sup.status === 'LOW' ? 'var(--brass)' : 'var(--paper-dim)',
                        border: `1px solid ${sup.status === 'LOW' ? 'var(--brass)' : 'var(--line)'}`
                      }}>
                        {sup.statusLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--paper-dim)', marginBottom: '14px' }}>
                      Tồn kho thực tế: <b style={{ color: 'var(--brass)' }}>{sup.qty}</b>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast(`Đã gửi yêu cầu cấp phát thêm ${sup.name} cho Quản lý!`, 'YÊU CẦU ĐÃ GỬI', 'info')}
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
                      + Yêu cầu cấp phát thêm
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BÁO CÁO SỰ CỐ KHẨN CẤP CHO BÁC SĨ THÚ Y (COMPACT & CLEAN) */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '90%',
              padding: '20px 22px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚨 Báo Động Sự Cố Chuồng</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Thông báo sẽ chuyển trực tiếp lên Cổng Bác sĩ Thú Y ngay lập tức.
            </p>

            <form onSubmit={handleSubmitReport}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--paper)', marginBottom: '4px' }}>
                    Ô chuồng:
                  </label>
                  <select
                    value={reportData.stallCode}
                    onChange={(e) => {
                      const found = assignedStalls.find(s => s.code === e.target.value);
                      setReportData({
                        ...reportData,
                        stallCode: e.target.value,
                        horseName: found ? found.horseName : ''
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper)',
                      fontSize: '12.5px'
                    }}
                  >
                    {assignedStalls.map(s => (
                      <option key={s.code} value={s.code}>{s.code} - {s.horseName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--paper)', marginBottom: '4px' }}>
                    Mức độ nghiêm trọng:
                  </label>
                  <select
                    value={reportData.severity}
                    onChange={(e) => setReportData({ ...reportData, severity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper)',
                      fontSize: '12.5px'
                    }}
                  >
                    <option value="CRITICAL">Khẩn cấp (Critical)</option>
                    <option value="HIGH">Cao (High - Cần khám ngay)</option>
                    <option value="MEDIUM">Trung bình (Theo dõi)</option>
                    <option value="LOW">Nhẹ (Trầy xước da)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--paper)', marginBottom: '4px' }}>
                  Triệu chứng phát hiện:
                </label>
                <input
                  type="text"
                  value={reportData.symptoms}
                  onChange={(e) => setReportData({ ...reportData, symptoms: e.target.value })}
                  placeholder="VD: Bỏ ăn, thở dốc, dậm chân, rạn móng..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '12.5px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--paper)', marginBottom: '4px' }}>
                  Mô tả chi tiết:
                </label>
                <textarea
                  rows="2"
                  value={reportData.desc}
                  onChange={(e) => setReportData({ ...reportData, desc: e.target.value })}
                  placeholder="Ghi nhận cụ thể tình trạng tại chuồng..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontFamily: 'inherit',
                    fontSize: '12.5px',
                    resize: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Gửi Thú Y ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
