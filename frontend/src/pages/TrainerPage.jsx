import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function TrainerPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'programs' | 'sessions' | 'review'

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
      statusColor: '#F59E0B',
      isLockedByVet: false,
      avgHeartRate: 118,
      maxSpeed: 64.5,
      totalDistanceKm: 184,
      condition: '92%'
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
      statusColor: '#10B981',
      isLockedByVet: false,
      avgHeartRate: 108,
      maxSpeed: 68.2,
      totalDistanceKm: 260,
      condition: '98%'
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
      statusColor: '#EF4444',
      isLockedByVet: true,
      vetNotice: 'Giãn gân chân trái - Cấm bài tập chạy nước rút và tải nặng!',
      avgHeartRate: 136,
      maxSpeed: 42.0,
      totalDistanceKm: 98,
      condition: '58%'
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
      statusColor: '#8B5CF6',
      isLockedByVet: false,
      avgHeartRate: 122,
      maxSpeed: 59.8,
      totalDistanceKm: 142,
      condition: '84%'
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
      statusColor: '#10B981',
      isLockedByVet: false,
      avgHeartRate: 112,
      maxSpeed: 62.0,
      totalDistanceKm: 115,
      condition: '90%'
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
      status: 'COMPLETED', // Hoàn thành
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
      maxHeartRate: 216, // Vượt ngưỡng an toàn 210 bpm!
      isOverLimit: true,
      status: 'INCOMPLETE', // Không hoàn thành
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
      status: 'COMPLETED', // Hoàn thành
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
      status: 'COMPLETED', // Hoàn thành
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
    showToast(`✓ Đã tạo giáo án mới cho ${newProgramData.horseName}`);
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
    showToast(`✓ Đã lưu bài tập mới cho ${newSessionData.horseName} (${newSess.status === 'COMPLETED' ? 'Hoàn thành' : 'Chưa hoàn thành'})`);
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
        showToast(`✓ Đã đổi bài tập của ${s.horseName} sang: ${statusText}`);
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
    showToast(`✓ Đã lưu bài tập của ${selectedSession.horseName}: ${statusText} • Điểm ${selectedSession.score}/10`);
    setShowEditFeedbackModal(false);
    setSelectedSession(null);
  };

  return (
    <div style={{ backgroundColor: '#090B10', color: '#FFFFFF', minHeight: '100vh', paddingBottom: '70px' }}>
      
      {/* 1. HEADER BANNER DÀNH RIÊNG CHO TRAINER */}
      <div style={{
        background: 'linear-gradient(180deg, #101626 0%, #090B10 100%)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        padding: 'clamp(18px, 3.5vw, 28px) clamp(16px, 4vw, 40px)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60A5FA',
                border: '1px solid #3B82F6',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em'
              }}>
                🏇 HUẤN LUYỆN VIÊN TRƯỞNG (HEAD TRAINER)
              </span>
              <span style={{ fontSize: '13px', color: '#9DA6A0' }}>
                Đang trực tuyến: <b style={{ color: '#FFFFFF' }}>{currentUser?.full_name}</b> (@{currentUser?.username})
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--display, serif)', fontSize: 'clamp(22px, 3.5vw, 30px)', color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '0.02em' }}>
              Trung Tâm Quản Lý Huấn Luyện Chiến Mã
            </h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
              Lập giáo án cự ly & mặt sân, giám sát nhịp tim viễn trắc (telemetry), cảnh báo quá tải và chấm điểm phong độ đàn ngựa.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                padding: '8px 14px',
                background: 'rgba(232, 227, 215, 0.08)',
                border: '1px solid rgba(232, 227, 215, 0.2)',
                borderRadius: '6px',
                color: '#E8E3D7',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              ← Trang chủ
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '6px',
                color: '#FF8885',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)' }}>

        {/* 2. THỐNG KÊ NHANH (QUICK KPI CARDS) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div style={{ background: '#101524', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>TỔNG CHIẾN MÃ HUẤN LUYỆN</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: '6px 0 2px' }}>{trainerHorses.length} con</div>
            <div style={{ fontSize: '12px', color: '#60A5FA' }}>Theo dõi định kỳ 24/7</div>
          </div>

          <div style={{ background: '#101524', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ĐỦ ĐIỀU KIỆN XUẤT TRẬN</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#10B981', margin: '6px 0 2px' }}>
              {trainerHorses.filter(h => h.status === 'READY').length} con
            </div>
            <div style={{ fontSize: '12px', color: '#34D399' }}>Sẵn sàng đăng ký giải đua</div>
          </div>

          <div style={{ background: '#101524', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>KHÓA TẬP BỞI BÁC SĨ THÚ Y</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#EF4444', margin: '6px 0 2px' }}>
              {trainerHorses.filter(h => h.isLockedByVet).length} con
            </div>
            <div style={{ fontSize: '12px', color: '#F87171' }}>Cấm bài chạy nước rút nặng</div>
          </div>

          <div style={{ background: '#101524', border: '1px solid rgba(201, 162, 39, 0.3)', borderRadius: '10px', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>BUỔI TẬP ĐÃ HOÀN TẤT</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brass, #C9A227)', margin: '6px 0 2px' }}>
              {sessions.length} lượt
            </div>
            <div style={{ fontSize: '12px', color: '#E8E3D7' }}>Dữ liệu lưu vết Telemetry</div>
          </div>
        </div>

        {/* Toast thông báo nhanh */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            boxShadow: '0 12px 30px rgba(0,0,0,0.85)',
            zIndex: 10000000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ fontSize: '18px' }}>✓</span> {toastMsg}
          </div>
        )}

        {/* 3. THANH ĐIỀU HƯỚNG TABS NGHIỆP VỤ HLV */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(232, 227, 215, 0.12)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {[
            { id: 'vitals', label: '1. Thể Lực & Trạng Thái Tàu Ngựa', icon: '📊' },
            { id: 'programs', label: '2. Giáo Án Huấn Luyện (Programs)', icon: '📋' },
            { id: 'sessions', label: '3. Buổi Tập & Telemetry Nhịp Tim', icon: '⏱️' },
            { id: 'review', label: '4. Đánh Giá Điểm & Ghi Chú Bài Tập', icon: '⭐' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 18px',
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #3B82F6' : '3px solid transparent',
                color: activeTab === tab.id ? '#60A5FA' : '#94A3B8',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ===================== TAB 1: THỂ LỰC & TIẾN ĐỘ TÀU NGỰA ===================== */}
        {activeTab === 'vitals' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', margin: '0 0 6px', color: '#FFFFFF' }}>
                Bảng Giám Sát Thể Lực Toàn Bộ Tàu Ngựa
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                Dữ liệu đo lường nhịp tim, vận tốc tối đa và chỉ định của Bác sĩ Thú y trước khi phân công bài tập.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {trainerHorses.map(horse => (
                <div
                  key={horse.id}
                  style={{
                    background: '#101422',
                    border: horse.isLockedByVet ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>{horse.name}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        Chip: <b>{horse.microchip}</b> • {horse.stall} • {horse.age}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: `${horse.statusColor}20`,
                      color: horse.statusColor,
                      border: `1px solid ${horse.statusColor}50`
                    }}>
                      {horse.statusText}
                    </span>
                  </div>

                  {/* Cảnh báo thú y nếu có */}
                  {horse.isLockedByVet && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #EF4444',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '12.5px',
                      color: '#FF8885',
                      lineHeight: 1.4
                    }}>
                      🚨 <b>CẢNH BÁO BÁC SĨ THÚ Y:</b> {horse.vetNotice}
                    </div>
                  )}

                  {/* Chỉ số thể lực */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#090B10', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Nhịp tim TB</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#60A5FA', marginTop: '2px' }}>{horse.avgHeartRate} bpm</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tốc độ đỉnh</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#34D399', marginTop: '2px' }}>{horse.maxSpeed} km/h</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Phong độ</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brass, #C9A227)', marginTop: '2px' }}>{horse.condition}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#94A3B8' }}>
                    <span>Quãng đường tích lũy: <b style={{ color: '#E8E3D7' }}>{horse.totalDistanceKm} km</b></span>
                    <button
                      onClick={() => {
                        setNewSessionData(prev => ({ ...prev, horseName: horse.name }));
                        setShowAddSessionModal(true);
                      }}
                      disabled={horse.isLockedByVet}
                      style={{
                        padding: '6px 12px',
                        background: horse.isLockedByVet ? '#2A2A2A' : '#3B82F6',
                        color: horse.isLockedByVet ? '#666' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: horse.isLockedByVet ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {horse.isLockedByVet ? 'Đang bị khóa' : '+ Lên bài tập'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: GIÁO ÁN HUẤN LUYỆN ===================== */}
        {activeTab === 'programs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: '#FFFFFF' }}>
                  Kế Hoạch & Giáo Án Huấn Luyện (Training Programs)
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                  Thiết kế theo cự ly, giai đoạn, khối lượng và loại mặt sân (Cỏ - GRASS, Cát - SAND).
                </p>
              </div>
              <button
                onClick={() => setShowAddProgramModal(true)}
                style={{
                  padding: '9px 18px',
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>+</span> Lập Giáo Án Mới
              </button>
            </div>

            <div style={{ background: '#101422', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#0B0E17', borderBottom: '1px solid rgba(232, 227, 215, 0.12)', color: '#94A3B8' }}>
                    <th style={{ padding: '14px 18px' }}>Chiến mã</th>
                    <th style={{ padding: '14px 18px' }}>Tên giáo án</th>
                    <th style={{ padding: '14px 18px' }}>Giai đoạn</th>
                    <th style={{ padding: '14px 18px' }}>Cự ly mục tiêu</th>
                    <th style={{ padding: '14px 18px' }}>Mặt sân</th>
                    <th style={{ padding: '14px 18px' }}>Thời gian áp dụng</th>
                    <th style={{ padding: '14px 18px' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map(prog => (
                    <tr key={prog.id} style={{ borderBottom: '1px solid rgba(232, 227, 215, 0.06)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#60A5FA' }}>
                        {prog.horseName}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#FFFFFF' }}>
                        {prog.title}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#E8E3D7' }}>
                        {prog.phase}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--brass, #C9A227)', fontWeight: 600 }}>
                        {prog.targetDistance} m
                      </td>
                      <td style={{ padding: '14px 18px', color: '#94A3B8' }}>
                        {prog.surface}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#94A3B8', fontSize: '12.5px' }}>
                        {prog.startDate} → {prog.endDate}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                          Đang thực hiện
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: BUỔI TẬP & TELEMETRY ===================== */}
        {activeTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: '#FFFFFF' }}>
                  Nhật Ký Buổi Tập & Chỉ Số Viễn Trắc Telemetry
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                  Theo dõi dữ liệu chạy thực tế, cảnh báo quá tải nhịp tim (&gt; 210 bpm) và xác nhận kết quả bài tập.
                </p>
              </div>
              <button
                onClick={() => setShowAddSessionModal(true)}
                style={{
                  padding: '9px 18px',
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>+</span> Ghi Nhận Buổi Tập
              </button>
            </div>

            <div style={{ background: '#101422', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#0B0E17', borderBottom: '1px solid rgba(232, 227, 215, 0.12)', color: '#94A3B8' }}>
                    <th style={{ padding: '14px 18px' }}>Thời gian</th>
                    <th style={{ padding: '14px 18px' }}>Chiến mã & Giáo án</th>
                    <th style={{ padding: '14px 18px' }}>Quãng đường</th>
                    <th style={{ padding: '14px 18px' }}>Vận tốc TB</th>
                    <th style={{ padding: '14px 18px' }}>Nhịp tim</th>
                    <th style={{ padding: '14px 18px' }}>Cảnh báo</th>
                    <th style={{ padding: '14px 18px' }}>Trạng thái bài tập</th>
                    <th style={{ padding: '14px 18px' }}>Điểm đánh giá</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(sess => {
                    const isCompleted = sess.status === 'COMPLETED';
                    return (
                      <tr key={sess.id} style={{ borderBottom: '1px solid rgba(232, 227, 215, 0.06)' }}>
                        <td style={{ padding: '14px 18px', color: '#94A3B8', fontSize: '12.5px' }}>
                          {sess.time}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#60A5FA' }}>{sess.horseName}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>{sess.programTitle}</div>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#E8E3D7' }}>
                          {sess.distanceRun} m
                        </td>
                        <td style={{ padding: '14px 18px', color: '#34D399', fontWeight: 600 }}>
                          {sess.avgSpeed} km/h
                        </td>
                        <td style={{ padding: '14px 18px', color: sess.isOverLimit ? '#EF4444' : '#E8E3D7', fontWeight: 700 }}>
                          {sess.maxHeartRate} bpm
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {sess.isOverLimit ? (
                            <span style={{
                              padding: '4px 8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#FF8885',
                              border: '1px solid #EF4444',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ⚠️ QUÁ TẢI (&gt;210)
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 8px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10B981',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600
                            }}>
                              ✓ Bình thường
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <button
                            onClick={() => handleToggleSessionStatus(sess.id)}
                            title="Nhấp để đổi trạng thái bài tập"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: isCompleted ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                              color: isCompleted ? '#34D399' : '#F87171',
                              border: isCompleted ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isCompleted ? '✓ Hoàn thành' : '✗ Chưa đạt'}
                          </button>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 8px',
                            background: 'rgba(201, 162, 39, 0.2)',
                            color: 'var(--brass, #C9A227)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            ⭐ {sess.score !== undefined ? sess.score : 8.0}/10
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenEvaluationModal(sess)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid #3B82F6',
                              color: '#93C5FD',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            📝 Đánh giá & Ghi chú
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

        {/* ===================== TAB 4: CHẤM ĐIỂM & GHI CHÚ BÀI TẬP ===================== */}
        {activeTab === 'review' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: '#FFFFFF' }}>
                  Đánh Giá Điểm & Ghi Chú Bài Tập Theo Chiến Mã
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                  HLV có thể xác nhận bài tập hoàn thành/không hoàn thành, chấm điểm phong độ (1-10 ⭐) và lưu nhật ký ghi chú.
                </p>
              </div>
              <button
                onClick={() => setShowAddSessionModal(true)}
                style={{
                  padding: '9px 18px',
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>+</span> Ghi Nhận Bài Tập Mới
              </button>
            </div>

            {/* BỘ LỌC CHIẾN MÃ & TRẠNG THÁI BÀI TẬP */}
            <div style={{
              background: '#101422',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Lọc theo chiến mã:</span>
                <select
                  value={filterHorse}
                  onChange={(e) => setFilterHorse(e.target.value)}
                  style={{
                    background: '#090B10',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '13px'
                  }}
                >
                  <option value="ALL">Tất cả chiến mã</option>
                  {trainerHorses.map(h => (
                    <option key={h.id} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Trạng thái bài tập:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    background: '#090B10',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '13px'
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="COMPLETED">✓ Đã hoàn thành (COMPLETED)</option>
                  <option value="INCOMPLETE">✗ Không hoàn thành (INCOMPLETE)</option>
                </select>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                <span style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  Tổng: <b>{sessions.length}</b> bài tập
                </span>
                <span style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  Hoàn thành: <b>{sessions.filter(s => s.status === 'COMPLETED').length}</b>
                </span>
                <span style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  Chưa đạt: <b>{sessions.filter(s => s.status === 'INCOMPLETE').length}</b>
                </span>
              </div>
            </div>

            {/* DANH SÁCH BÀI TẬP VÀ ĐÁNH GIÁ GHI CHÚ */}
            {filteredSessions.length === 0 ? (
              <div style={{
                background: '#101422',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                border: '1px dashed rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>Không tìm thấy bài tập nào phù hợp</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Hãy chọn lại bộ lọc hoặc tạo bài tập mới.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredSessions.map(sess => {
                  const isCompleted = sess.status === 'COMPLETED';
                  return (
                    <div
                      key={sess.id}
                      style={{
                        background: '#101422',
                        border: isCompleted ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '10px',
                        padding: '22px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '18px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        {/* HÀNG TIÊU ĐỀ: TÊN CHIẾN MÃ, THỜI GIAN, BADGE TRẠNG THÁI & ĐIỂM */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '17px', fontWeight: 700, color: '#60A5FA' }}>
                            {sess.horseName}
                          </span>
                          <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>• {sess.time}</span>
                          
                          {/* BADGE TRẠNG THÁI HOÀN THÀNH / KHÔNG HOÀN THÀNH */}
                          <span style={{
                            padding: '4px 10px',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isCompleted ? '#34D399' : '#F87171',
                            border: isCompleted ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isCompleted ? '✓ ĐÃ HOÀN THÀNH BÀI TẬP' : '✗ KHÔNG HOÀN THÀNH'}
                          </span>

                          {/* BADGE ĐIỂM ĐÁNH GIÁ */}
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(201, 162, 39, 0.2)',
                            color: 'var(--brass, #C9A227)',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            border: '1px solid rgba(201, 162, 39, 0.4)'
                          }}>
                            ⭐ Điểm: {sess.score !== undefined ? sess.score : 8.0}/10
                          </span>
                        </div>

                        {/* THÔNG TIN BÀI TẬP VÀ CHỈ SỐ */}
                        <div style={{ fontSize: '13.5px', color: '#CBD5E1', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                          <span>Giáo án: <b style={{ color: '#F1F5F9' }}>{sess.programTitle}</b></span>
                          <span style={{ color: '#94A3B8' }}>|</span>
                          <span>Cự ly: <b style={{ color: '#E8E3D7' }}>{sess.distanceRun}m</b></span>
                          <span style={{ color: '#94A3B8' }}>|</span>
                          <span>Tốc độ: <b style={{ color: '#34D399' }}>{sess.avgSpeed} km/h</b></span>
                          <span style={{ color: '#94A3B8' }}>|</span>
                          <span>Nhịp tim: <b style={{ color: sess.isOverLimit ? '#EF4444' : '#E8E3D7' }}>{sess.maxHeartRate} bpm</b></span>
                        </div>

                        {/* KHUNG GHI CHÚ BÀI TẬP CỦA HUẤN LUYỆN VIÊN */}
                        <div style={{
                          background: '#090B10',
                          borderLeft: isCompleted ? '4px solid #3B82F6' : '4px solid #EF4444',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '12px 16px',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '13.5px',
                          color: '#E2E8F0',
                          lineHeight: 1.6
                        }}>
                          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📝 Ghi chú bài tập & Nhận xét của HLV:</span>
                          </div>
                          <div>"{sess.feedback || 'Chưa có ghi chú cho bài tập này.'}"</div>
                        </div>
                      </div>

                      {/* KHỐI NÚT THAO TÁC CỦA HLV */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'stretch', justifyContent: 'center' }}>
                        {/* NÚT CHUYỂN TRẠNG THÁI NHANH */}
                        <button
                          onClick={() => handleToggleSessionStatus(sess.id)}
                          style={{
                            padding: '9px 16px',
                            background: isCompleted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: isCompleted ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.5)',
                            color: isCompleted ? '#F87171' : '#34D399',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isCompleted ? '✗ Đổi sang: Chưa đạt' : '✓ Đổi sang: Hoàn thành'}
                        </button>

                        {/* NÚT MỞ MODAL ĐÁNH GIÁ ĐIỂM & GHI CHÚ */}
                        <button
                          onClick={() => handleOpenEvaluationModal(sess)}
                          style={{
                            padding: '9px 16px',
                            background: '#3B82F6',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          ⭐ Đánh giá điểm & Sửa ghi chú
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ===================== MODAL THÊM GIÁO ÁN MỚI ===================== */}
      {showAddProgramModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: '#0F1320',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Lập Giáo Án Huấn Luyện Mới</h3>
            <form onSubmit={handleCreateProgram} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tên giáo án</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rèn thể lực cự ly trung bình 1.800m"
                  value={newProgramData.title}
                  onChange={(e) => setNewProgramData({ ...newProgramData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Chọn chiến mã áp dụng</label>
                <select
                  value={newProgramData.horseName}
                  onChange={(e) => setNewProgramData({ ...newProgramData, horseName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  {trainerHorses.map(h => (
                    <option key={h.id} value={h.name}>{h.name} ({h.microchip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Giai đoạn huấn luyện</label>
                <select
                  value={newProgramData.phase}
                  onChange={(e) => setNewProgramData({ ...newProgramData, phase: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="Nước rút (Sprint)">Nước rút (Sprint - Tốc độ cao)</option>
                  <option value="Thể lực nền (Endurance)">Thể lực nền (Endurance - Sức bền)</option>
                  <option value="Kỹ thuật (Gate & Pace)">Kỹ thuật (Gate & Pace - Bứt tốc & mở máy)</option>
                  <option value="Phục hồi (Recovery)">Phục hồi (Recovery - Vận động nhẹ)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Cự ly mục tiêu (m)</label>
                  <input
                    type="number"
                    required
                    value={newProgramData.targetDistance}
                    onChange={(e) => setNewProgramData({ ...newProgramData, targetDistance: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Mặt sân tập</label>
                  <select
                    value={newProgramData.surface}
                    onChange={(e) => setNewProgramData({ ...newProgramData, surface: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  >
                    <option value="SAND (Sân cát)">SAND (Sân cát)</option>
                    <option value="GRASS (Sân cỏ)">GRASS (Sân cỏ)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: '#3B82F6', border: 'none', color: '#FFFFFF', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Lưu Giáo Án
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
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: '#0F1320',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Ghi Nhận Buổi Tập & Telemetry Mới</h3>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Chiến mã tập luyện</label>
                <select
                  value={newSessionData.horseName}
                  onChange={(e) => setNewSessionData({ ...newSessionData, horseName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  {trainerHorses.map(h => (
                    <option key={h.id} value={h.name}>{h.name} ({h.microchip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tên bài tập / Giáo án</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rèn sức bền 2.000m sân cát"
                  value={newSessionData.programTitle}
                  onChange={(e) => setNewSessionData({ ...newSessionData, programTitle: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Quãng đường chạy (m)</label>
                  <input
                    type="number"
                    required
                    value={newSessionData.distanceRun}
                    onChange={(e) => setNewSessionData({ ...newSessionData, distanceRun: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Vận tốc TB (km/h)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newSessionData.avgSpeed}
                    onChange={(e) => setNewSessionData({ ...newSessionData, avgSpeed: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Nhịp tim tối đa (bpm)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ngưỡng an toàn <= 210"
                    value={newSessionData.maxHeartRate}
                    onChange={(e) => setNewSessionData({ ...newSessionData, maxHeartRate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Trạng thái bài tập</label>
                  <select
                    value={newSessionData.status}
                    onChange={(e) => setNewSessionData({ ...newSessionData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  >
                    <option value="COMPLETED">✓ Hoàn thành bài tập</option>
                    <option value="INCOMPLETE">✗ Không hoàn thành bài tập</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Chấm điểm đánh giá (1.0 - 10.0 ⭐)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  required
                  value={newSessionData.score}
                  onChange={(e) => setNewSessionData({ ...newSessionData, score: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Ghi chú bài tập & Nhận xét của HLV</label>
                <textarea
                  rows="3"
                  placeholder="Ghi nhận xét về phong độ, độ giãn bước, sức bền hoặc lý do nếu bài tập chưa hoàn thành..."
                  value={newSessionData.feedback}
                  onChange={(e) => setNewSessionData({ ...newSessionData, feedback: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: '#3B82F6', border: 'none', color: '#FFFFFF', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Lưu Bài Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL ĐÁNH GIÁ ĐIỂM, TRẠNG THÁI & GHI CHÚ BÀI TẬP ===================== */}
      {showEditFeedbackModal && selectedSession && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 999999
        }}>
          <div style={{
            background: '#0F1320',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            color: '#FFFFFF',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: '#FFFFFF' }}>
                  Đánh Giá & Ghi Chú Bài Tập
                </h3>
                <div style={{ fontSize: '13px', color: '#60A5FA', fontWeight: 600 }}>
                  Chiến mã: {selectedSession.horseName} • {selectedSession.time}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditFeedbackModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* TÓM TẮT BÀI TẬP */}
            <div style={{ background: '#090B10', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12.5px', color: '#94A3B8', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div>Giáo án: <b style={{ color: '#E2E8F0' }}>{selectedSession.programTitle}</b></div>
              <div style={{ marginTop: '3px' }}>Cự ly: <b style={{ color: '#E2E8F0' }}>{selectedSession.distanceRun}m</b> • Vận tốc: <b style={{ color: '#34D399' }}>{selectedSession.avgSpeed} km/h</b> • Tim: <b style={{ color: selectedSession.isOverLimit ? '#EF4444' : '#E2E8F0' }}>{selectedSession.maxHeartRate} bpm</b></div>
            </div>

            <form onSubmit={handleUpdateFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. CHỌN HOÀN THÀNH HOẶC KHÔNG HOÀN THÀNH */}
              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  1. Xác nhận hoàn thành bài tập:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSession({ ...selectedSession, status: 'COMPLETED' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedSession.status === 'COMPLETED' ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selectedSession.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : '#090B10',
                      color: selectedSession.status === 'COMPLETED' ? '#34D399' : '#94A3B8',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>✓</span>
                    <span>Hoàn thành</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSession({ ...selectedSession, status: 'INCOMPLETE' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedSession.status === 'INCOMPLETE' ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selectedSession.status === 'INCOMPLETE' ? 'rgba(239, 68, 68, 0.2)' : '#090B10',
                      color: selectedSession.status === 'INCOMPLETE' ? '#F87171' : '#94A3B8',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>✗</span>
                    <span>Không hoàn thành</span>
                  </button>
                </div>
              </div>

              {/* 2. CHẤM ĐIỂM ĐÁNH GIÁ (1 - 10) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
                    2. Chấm điểm đánh giá (Thang 1.0 - 10.0 ⭐):
                  </label>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brass, #C9A227)' }}>
                    ⭐ {selectedSession.score || 8.0}/10
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
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                
                {/* DẢI NÚT CHỌN ĐIỂM NHANH */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[5.0, 6.0, 7.0, 8.0, 8.5, 9.0, 9.5, 10.0].map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setSelectedSession({ ...selectedSession, score: pt })}
                      style={{
                        padding: '4px 9px',
                        background: selectedSession.score === pt ? '#C9A227' : 'rgba(255, 255, 255, 0.06)',
                        color: selectedSession.score === pt ? '#000' : '#CBD5E1',
                        border: 'none',
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

              {/* 3. GHI CHÚ BÀI TẬP */}
              <div>
                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  3. Ghi chú bài tập & Nhận xét của HLV:
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Ghi nhận xét chi tiết về thể trạng, nhịp bước, phản ứng với khẩu lệnh, hoặc lý do chưa hoàn thành bài tập..."
                  value={selectedSession.feedback || ''}
                  onChange={(e) => setSelectedSession({ ...selectedSession, feedback: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#05070C', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditFeedbackModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'rgba(232, 227, 215, 0.1)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: '#3B82F6', border: 'none', color: '#FFFFFF', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Lưu Đánh Giá & Ghi Chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
