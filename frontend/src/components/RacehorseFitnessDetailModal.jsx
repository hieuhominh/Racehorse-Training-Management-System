import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  getHorseFitnessTelemetry, 
  REQUIRED_WORKOUTS_TO_EVALUATE,
  computeCurrentDecayedRecovery 
} from '../services/fitnessAlgorithm';
import EquineRecoveryIcon from './EquineRecoveryIcon';

export default function RacehorseFitnessDetailModal({ horse, onClose, onUpdateHorse, sessions = [], isTrainer: isTrainerProp }) {
  const [telemetry, setTelemetry] = useState(() => getHorseFitnessTelemetry(horse || {}, sessions));
  const isTrainer = isTrainerProp !== undefined
    ? isTrainerProp
    : (typeof window !== 'undefined' && (window.location.pathname.includes('trainer') || window.location.pathname.includes('huan-luyen')));

  const [trainerPrograms, setTrainerPrograms] = useState(() => {
    try {
      const raw = localStorage.getItem('matruong_trainer_programs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [newWorkoutData, setNewWorkoutData] = useState({
    title: 'Phi nước đại tăng tốc (Gallop Sprint)',
    phase: 'Nước rút (Sprint)',
    dayLabel: 'Hôm nay',
    targetDistance: 1600,
    volume: '1.600m',
    load: '220 TL',
    note: ''
  });
  const [workoutToast, setWorkoutToast] = useState('');

  // Lắng nghe đồng bộ bài tập từ HLV theo thời gian thực (Real-time sync)
  useEffect(() => {
    const handleProgramsUpdate = () => {
      try {
        const raw = localStorage.getItem('matruong_trainer_programs');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setTrainerPrograms(parsed);
        }
      } catch {}
    };
    window.addEventListener('storage', handleProgramsUpdate);
    window.addEventListener('trainer-programs-updated', handleProgramsUpdate);
    return () => {
      window.removeEventListener('storage', handleProgramsUpdate);
      window.removeEventListener('trainer-programs-updated', handleProgramsUpdate);
    };
  }, []);

  const horseName = (horse.name || horse.horseName || '').trim();
  const horseUpcomingWorkouts = trainerPrograms.filter(p => 
    (p.horseName || '').trim().toLowerCase() === horseName.toLowerCase()
  );

  const formatDayLabel = (item) => {
    if (item.dayLabel) return item.dayLabel;
    if (item.day) return item.day;
    if (item.startDate) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let target;
        if (item.startDate.includes('/')) {
          const parts = item.startDate.split('/');
          target = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          const parts = item.startDate.split('-');
          target = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        target.setHours(0, 0, 0, 0);
        const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hôm nay';
        if (diff === 1) return 'Ngày mai';
        if (diff === 2) return 'Ngày kia';
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'Sat'];
        return days[target.getDay()] || item.startDate;
      } catch {
        return item.startDate;
      }
    }
    return 'Kế tiếp';
  };

  const formatVolume = (item) => {
    if (item.volume) return item.volume;
    if (item.targetDistance) return `${Number(item.targetDistance).toLocaleString('vi-VN')}m`;
    if (item.duration) return `${item.duration} min`;
    return '1.600m';
  };

  const formatLoad = (item) => {
    if (item.load) return String(item.load).includes('TL') ? item.load : `${item.load} TL`;
    if (item.estimatedLoad) return `${item.estimatedLoad} TL`;
    if (item.targetDistance) {
      const d = Number(item.targetDistance);
      const tl = Math.round((d / 100) * 1.25 + 20);
      return `${tl} TL`;
    }
    return '120 TL';
  };

  const handleSaveWorkout = (e) => {
    e.preventDefault();
    const newProg = {
      id: Date.now(),
      title: newWorkoutData.title.trim() || 'Bài tập huấn luyện mới',
      horseName: horseName,
      phase: newWorkoutData.phase || 'Nước rút (Sprint)',
      dayLabel: newWorkoutData.dayLabel || 'Hôm nay',
      startDate: new Date().toISOString().split('T')[0],
      targetDistance: Number(newWorkoutData.targetDistance) || 1600,
      volume: newWorkoutData.volume || `${Number(newWorkoutData.targetDistance) || 1600}m`,
      load: newWorkoutData.load.includes('TL') ? newWorkoutData.load : `${newWorkoutData.load} TL`,
      estimatedLoad: parseInt(newWorkoutData.load) || 120,
      note: newWorkoutData.note || '',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const nextPrograms = [newProg, ...trainerPrograms];
    setTrainerPrograms(nextPrograms);
    try {
      localStorage.setItem('matruong_trainer_programs', JSON.stringify(nextPrograms));
    } catch {}

    window.dispatchEvent(new CustomEvent('trainer-programs-updated', { detail: { horseName, program: newProg } }));
    window.dispatchEvent(new Event('storage'));

    setShowAddWorkoutModal(false);
    setWorkoutToast(`Đã cập nhật bài tập kế tiếp cho Chủ ngựa của ${horseName}!`);
    setTimeout(() => setWorkoutToast(''), 4000);
  };

  const handleDeleteWorkout = (progId) => {
    const nextPrograms = trainerPrograms.filter(p => p.id !== progId);
    setTrainerPrograms(nextPrograms);
    try {
      localStorage.setItem('matruong_trainer_programs', JSON.stringify(nextPrograms));
    } catch {}

    window.dispatchEvent(new CustomEvent('trainer-programs-updated', { detail: { horseName, deletedId: progId } }));
    window.dispatchEvent(new Event('storage'));

    setWorkoutToast(`Đã gỡ bài tập khỏi kế hoạch của ${horseName}!`);
    setTimeout(() => setWorkoutToast(''), 3000);
  };

  const WORKOUT_PRESETS = [
    { title: 'Phi nước đại tăng tốc (Gallop Sprint)', phase: 'Nước rút (Sprint)', volume: '1.600m', targetDistance: 1600, load: '220 TL', dayLabel: 'Hôm nay' },
    { title: 'Đi bộ máy & Ngâm lạnh chân', phase: 'Phục hồi (Recovery)', volume: '30 min', targetDistance: 0, load: '20 TL', dayLabel: 'Hôm nay' },
    { title: 'Tập xuất phát máy (Gate Drill)', phase: 'Kỹ thuật (Gate & Pace)', volume: '6 lượt', targetDistance: 600, load: '95 TL', dayLabel: 'Ngày mai' },
    { title: 'Phi nước kiệu dẻo dai (Canter Tempo)', phase: 'Thể lực nền (Endurance)', volume: '3.200m', targetDistance: 3200, load: '140 TL', dayLabel: 'T4' },
    { title: 'Nước rút bứt phá chặng cuối', phase: 'Nước rút (Sprint)', volume: '1.200m', targetDistance: 1200, load: '185 TL', dayLabel: 'Hôm nay' },
    { title: 'Chạy việt dã rèn sức bền sân cỏ', phase: 'Thể lực nền (Endurance)', volume: '2.400m', targetDistance: 2400, load: '160 TL', dayLabel: 'Ngày mai' }
  ];
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'activities'
  const [personalBestFilter, setPersonalBestFilter] = useState('season');
  const [weeklyMetric, setWeeklyMetric] = useState('distance');
  const [selectedActivityMonth, setSelectedActivityMonth] = useState('CURRENT_MONTH');

  // Lấy toàn bộ các buổi tập / rèn luyện đã hoàn thành của chiến mã này từ nguồn chuẩn duy nhất
  const getAllHorseWorkoutSessions = () => {
    const list = [];
    const seen = new Set();
    const cleanHorse = (horse?.name || horse?.horseName || '').trim().toLowerCase();

    // 1. Chỉ lấy từ nguồn chuẩn duy nhất matruong_training_telemetry
    let rawList = [];
    try {
      const rawTelem = localStorage.getItem('matruong_training_telemetry');
      if (rawTelem) {
        const parsed = JSON.parse(rawTelem);
        if (Array.isArray(parsed) && parsed.length > 0) rawList = parsed;
      }
    } catch {}

    if (rawList.length === 0 && Array.isArray(sessions) && sessions.length > 0) {
      rawList = sessions;
    }

    rawList.forEach(s => {
      if (!s) return;
      const sHorse = String(s.horseName || s.horse || '').trim().toLowerCase();
      if (sHorse && cleanHorse && sHorse !== cleanHorse && !sHorse.includes(cleanHorse) && !cleanHorse.includes(sHorse)) return;

      const cleanTitle = (s.programTitle || s.name || s.title || 'Rèn luyện tốc độ').trim();
      const timeStr = String(s.time || s.completedAt || '').trim();
      const dist = Number(s.distanceRun) || 1600;

      // Khóa chống trùng lặp: Nếu cùng bài tập và cùng chuỗi thời gian timeStr
      const timeKey = timeStr ? `${cleanTitle.toLowerCase()}_${timeStr}` : null;
      const semanticKey = `${cleanTitle.toLowerCase()}_${dist}_${Number(s.avgSpeed || 0).toFixed(1)}_${s.maxHeartRate || ''}`;

      if (timeKey && seen.has(timeKey)) return;
      if (seen.has(semanticKey)) return;
      if (s.id && seen.has(String(s.id))) return;

      if (s.id) seen.add(String(s.id));
      if (timeKey) seen.add(timeKey);
      seen.add(semanticKey);

      const isComp = s.status === 'COMPLETED';
      const speed = Number(s.avgSpeed) || 58.5;
      const hr = Number(s.maxHeartRate) || (isComp ? 196 : 218);
      const loadStr = s.load || `${Math.round((dist / 100) * 1.25 + 20)} TL`;

      list.push({
        id: s.id || Date.now(),
        title: cleanTitle || (isComp ? 'Rèn luyện tốc độ hoàn thành' : 'Rèn luyện chưa đạt'),
        time: timeStr || new Date().toLocaleString('vi-VN'),
        distanceRun: dist,
        avgSpeed: speed,
        maxHeartRate: hr,
        load: loadStr,
        status: s.status || 'COMPLETED',
        score: s.score || (isComp ? 9.0 : 5.5),
        feedback: s.feedback || s.evaluation || ''
      });
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.time || a.id || 0).getTime() || 0;
      const timeB = new Date(b.time || b.id || 0).getTime() || 0;
      return timeB - timeA;
    });
  };

  const [workoutSessionsList, setWorkoutSessionsList] = useState(() => getAllHorseWorkoutSessions());

  // Tự động làm sạch telemetry trùng lặp trong localStorage ngay khi mở modal
  useEffect(() => {
    try {
      const raw = localStorage.getItem('matruong_training_telemetry');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set();
          const cleaned = parsed.filter(s => {
            if (!s) return false;
            const h = String(s.horseName || s.horse || '').trim().toLowerCase();
            const t = String(s.programTitle || s.title || s.name || '').trim().toLowerCase();
            const tm = String(s.time || s.completedAt || '').trim();
            const key = `${h}_${t}_${tm}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('matruong_training_telemetry', JSON.stringify(cleaned));
            setWorkoutSessionsList(getAllHorseWorkoutSessions());
          }
        }
      }
    } catch {}
  }, [horse]);

  const handleDeleteSession = (sessId) => {
    try {
      const raw = localStorage.getItem('matruong_training_telemetry');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter(s => String(s.id) !== String(sessId));
          localStorage.setItem('matruong_training_telemetry', JSON.stringify(updated));
        }
      }
    } catch {}
    setWorkoutSessionsList(prev => prev.filter(s => String(s.id) !== String(sessId)));
    window.dispatchEvent(new Event('storage'));
  };

  const handleClearAllSessions = () => {
    try {
      const raw = localStorage.getItem('matruong_training_telemetry');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleanHorse = (horse?.name || horse?.horseName || '').trim().toLowerCase();
          const updated = parsed.filter(s => {
            const h = String(s.horseName || s.horse || '').trim().toLowerCase();
            return h && cleanHorse && !h.includes(cleanHorse) && !cleanHorse.includes(h);
          });
          localStorage.setItem('matruong_training_telemetry', JSON.stringify(updated));
        }
      }
    } catch {}
    setWorkoutSessionsList([]);
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    const handleSyncWorkouts = () => {
      setWorkoutSessionsList(getAllHorseWorkoutSessions());
    };
    handleSyncWorkouts();
    window.addEventListener('racehorse-fitness-updated', handleSyncWorkouts);
    window.addEventListener('trainer-programs-updated', handleSyncWorkouts);
    window.addEventListener('storage', handleSyncWorkouts);
    return () => {
      window.removeEventListener('racehorse-fitness-updated', handleSyncWorkouts);
      window.removeEventListener('trainer-programs-updated', handleSyncWorkouts);
      window.removeEventListener('storage', handleSyncWorkouts);
    };
  }, [horse, sessions, telemetry]);

  const filteredMonthSessions = workoutSessionsList.filter(s => {
    if (selectedActivityMonth === 'ALL') return true;
    const t = String(s.time || '');
    if (t.includes('11/2026') || t.includes('2026-11') || t === 'Hôm nay') return true;
    return true; // Mặc định hiển thị chu kỳ hoạt động tháng này
  });

  const monthStats = {
    total: filteredMonthSessions.length,
    completed: filteredMonthSessions.filter(s => s.status === 'COMPLETED').length,
    incomplete: filteredMonthSessions.filter(s => s.status === 'INCOMPLETE').length,
    rate: filteredMonthSessions.length > 0
      ? Math.round((filteredMonthSessions.filter(s => s.status === 'COMPLETED').length / filteredMonthSessions.length) * 100)
      : 100,
    totalDistanceKm: (filteredMonthSessions.reduce((acc, s) => acc + (Number(s.distanceRun) || 1600), 0) / 1000).toFixed(2),
    topSpeed: filteredMonthSessions.length > 0
      ? Math.max(...filteredMonthSessions.map(s => Number(s.avgSpeed) || 0), 59.8).toFixed(1)
      : (telemetry.maxSpeed || 59.8)
  };

  // Lắng nghe sự kiện cập nhật viễn trắc theo thời gian thực (Real-time reactivity)
  useEffect(() => {
    if (horse) {
      setTelemetry(getHorseFitnessTelemetry(horse, sessions));
    }
  }, [horse, sessions]);

  useEffect(() => {
    if (!horse) return;
    const handleFitnessUpdate = (e) => {
      const { horse: updatedH, telemetry: newTelem } = e.detail || {};
      const thisName = String(horse.name || horse.horseName || '').trim().toLowerCase();
      const thisChip = String(horse.microchip || horse.id || '').trim().toLowerCase();

      const upName = String(updatedH?.name || updatedH?.horseName || (typeof updatedH === 'string' ? updatedH : '')).trim().toLowerCase();
      const upChip = String(updatedH?.microchip || updatedH?.id || '').trim().toLowerCase();

      const isMatch = (thisName && upName && thisName === upName) ||
                      (thisChip && upChip && thisChip === upChip);

      if (isMatch) {
        if (newTelem) {
          setTelemetry(newTelem);
        } else {
          setTelemetry(getHorseFitnessTelemetry(horse));
        }
      }
    };

    const handleStorageUpdate = () => {
      if (horse) {
        setTelemetry(getHorseFitnessTelemetry(horse));
      }
    };

    window.addEventListener('racehorse-fitness-updated', handleFitnessUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('racehorse-fitness-updated', handleFitnessUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [horse]);

  // Tự động tính toán phục hồi theo thời gian thực (Time-decay recovery)
  useEffect(() => {
    if (!telemetry || telemetry.isCalibrating) return;
    const interval = setInterval(() => {
      const live = computeCurrentDecayedRecovery(telemetry);
      if (live !== telemetry.recoveryPercent) {
        setTelemetry(prev => ({ ...prev, recoveryPercent: live }));
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [telemetry]);

  if (!horse) return null;

  const defaultAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
  const avatar = horse.avatar || horse.horse_avatar || defaultAvatar;
  const ownerName = horse.ownerName || horse.owner || 'Chủ sở hữu';
  const stallCode = horse.stall || horse.stable || 'Ô A1';
  const microchip = horse.microchip || 'MC-VN-2026-001';
  const breed = horse.breed || 'Thoroughbred (Thuần chủng)';

  const isCalibrating = !!telemetry.isCalibrating;
  const isFitnessIncreasing = telemetry.trend === 'INCREASING';
  const isFitnessStable = telemetry.trend === 'STABLE';
  const recoveryColor = isCalibrating ? '#F59E0B' : (telemetry.recoveryPercent >= 80 ? '#00E5FF' : (telemetry.recoveryPercent >= 50 ? '#10B981' : '#EF4444'));

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 999999,
        cursor: 'pointer'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0B0F19',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
          color: '#E2E8F0',
          cursor: 'default',
          overflow: 'hidden'
        }}
      >
        {/* ===================== HEADER PHONG CÁCH EVOLAB ===================== */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0E1322',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Avatar & Tên chiến mã */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={avatar}
              alt={horseName}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1.5px solid var(--brass)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <b style={{ fontSize: '17px', color: '#FFFFFF', letterSpacing: '0.02em' }}>{horseName}</b>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brass)',
                  background: 'rgba(212, 175, 55, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(212, 175, 55, 0.3)'
                }}>
                  {stallCode}
                </span>

                {isCalibrating ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#F59E0B',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    ⏳ Đang hiệu chuẩn ({telemetry.workoutCount || 0}/3 bài tập)
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isFitnessIncreasing ? '#10B981' : (isFitnessStable ? '#F59E0B' : '#EF4444'),
                    background: isFitnessIncreasing ? 'rgba(16, 185, 129, 0.12)' : (isFitnessStable ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                    border: isFitnessIncreasing ? '1px solid rgba(16, 185, 129, 0.3)' : (isFitnessStable ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'),
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {isFitnessIncreasing ? `▲ Thể lực TĂNG (${telemetry.trendPercent})` : (isFitnessStable ? `● Thể lực ỔN ĐỊNH (${telemetry.trendPercent})` : `▼ Thể lực GIẢM (${telemetry.trendPercent})`)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                {breed} · Chip: <span style={{ fontFamily: 'monospace', color: 'var(--brass)' }}>{microchip}</span> · Chủ sở hữu: <b style={{ color: '#F8FAFC' }}>{ownerName}</b>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { key: 'overview', label: 'Tổng quan' },
                { key: 'activities', label: 'D.sách hoạt động' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSubTab(tab.key)}
                  style={{
                    background: activeSubTab === tab.key ? 'var(--brass)' : 'transparent',
                    color: activeSubTab === tab.key ? '#0A0D14' : '#94A3B8',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: activeSubTab === tab.key ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Nút đóng */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94A3B8',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                marginLeft: '6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===================== MODAL BODY SCROLLABLE ===================== */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {activeSubTab === 'overview' && (
            <>
              {/* BANNER THÔNG BÁO CHIẾN MÃ MỚI TIẾP NHẬN NẾU CHƯA ĐỦ 3 BÀI TẬP */}
              {isCalibrating && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px dashed rgba(245, 158, 11, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '26px' }}>⏳</span>
                    <div>
                      <b style={{ color: '#F59E0B', fontSize: '13.5px' }}>
                        Dữ Liệu Thể Lực Đang Thu Thập (Tiến độ: {telemetry.workoutCount || 0}/3 bài tập)
                      </b>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
                        Chiến mã vừa được chủ sở hữu gửi phục vụ. Theo quy chuẩn y sinh học, hệ thống cần tối thiểu <b>3 bài tập hoàn thành hoặc không hoàn thành</b> để thuật toán EvoLab tổng hợp nhịp tim, tốc độ bứt phá và chu kỳ hồi phục chính xác.
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#F59E0B',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    whiteSpace: 'nowrap'
                  }}>
                    Cần thêm: {telemetry.remainingWorkouts || 3} bài tập
                  </div>
                </div>
              )}

              {/* ===== HÀNG 1: 3 WIDGETS ĐẦU TIÊN ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                
                {/* 1. Năng lực chạy & bứt tốc chiến mã */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Năng lực chạy & bứt tốc chiến mã</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                    </div>
                  </div>

                  {/* Half Gauge Arc */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginTop: '4px' }}>
                    <svg width="180" height="95" viewBox="0 0 180 95">
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke={isCalibrating ? 'rgba(245, 158, 11, 0.4)' : 'url(#gaugeGradHorse)'}
                        strokeWidth="10"
                        strokeDasharray="220"
                        strokeDashoffset={isCalibrating ? 220 : Math.max(20, Math.round(220 - (telemetry.sprintPower / 100) * 220))}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gaugeGradHorse" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EAB308" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: 'absolute', bottom: '2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: isCalibrating ? '#F59E0B' : '#FFFFFF', lineHeight: 1 }}>
                        {isCalibrating ? '--' : telemetry.sprintPower}
                      </div>
                      <div style={{ fontSize: '10.5px', color: isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#10B981' : '#EF4444'), fontWeight: 600, marginTop: '2px' }}>
                        {isCalibrating ? `Chờ đủ 3 bài tập (${telemetry.workoutCount || 0}/3)` : (isFitnessIncreasing ? `▲ Thể lực tăng ${telemetry.trendPercent}` : `▼ Thể lực giảm ${telemetry.trendPercent}`)}
                      </div>
                    </div>
                  </div>

                  {/* 4 Chỉ số thành phần của ngựa đua */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {[
                      { label: 'Sức bền cơ học', sub: "01'02\" - 01'13\"/km (~58 km/h)", val: isCalibrating ? '--' : telemetry.staminaScore, pct: isCalibrating ? 0 : Math.min(100, telemetry.staminaScore) },
                      { label: 'Ngưỡng bứt phá', sub: "00'55\" - 01'02\"/km (~64 km/h)", val: isCalibrating ? '--' : telemetry.speedThreshold, pct: isCalibrating ? 0 : Math.min(100, telemetry.speedThreshold) },
                      { label: 'Tốc độ thi đấu', sub: "00'50\" - 00'55\"/km (~68 km/h)", val: isCalibrating ? '--' : telemetry.racingSpeedScore, pct: isCalibrating ? 0 : Math.min(100, telemetry.racingSpeedScore) },
                      { label: 'Nước rút đích', sub: "< 00'50\"/km (> 72 km/h)", val: isCalibrating ? '--' : telemetry.sprintBurstScore, pct: isCalibrating ? 0 : Math.min(100, telemetry.sprintBurstScore) }
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11.5px', marginBottom: '3px' }}>
                          <div>
                            <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{item.label}</span>
                            <span style={{ color: '#64748B', fontSize: '10.5px', marginLeft: '6px' }}>{item.sub}</span>
                          </div>
                          <span style={{ color: isCalibrating ? '#64748B' : '#F1F5F9', fontWeight: 700 }}>{item.val}</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.pct}%`, height: '100%', background: isCalibrating ? '#475569' : (isFitnessIncreasing ? 'linear-gradient(90deg, #F59E0B, var(--brass))' : 'linear-gradient(90deg, #EF4444, #F59E0B)'), borderRadius: '2px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Tình trạng luyện tập chiến mã */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Tình trạng luyện tập chiến mã</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#10B981' : (isFitnessStable ? '#F59E0B' : '#EF4444')) }}>
                        {isCalibrating 
                          ? `Đang hiệu chuẩn (${telemetry.workoutCount || 0}/3 bài tập)`
                          : (telemetry.statusText || (isFitnessIncreasing ? 'Tối ưu (Thể lực tăng mạnh)' : 'Cảnh báo (Mệt mỏi / Quá tải)'))}
                      </div>
                      <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.55, marginTop: '8px' }}>
                        {isCalibrating
                          ? 'Chiến mã mới tiếp nhận phục vụ. Huấn luyện viên trưởng cần cho chiến mã chạy hoàn thành hoặc không hoàn thành đủ 3 bài tập để đo đạc chỉ số tim mạch, tốc độ sải chân và tải luyện tập.'
                          : (telemetry.explanation || (isFitnessIncreasing
                            ? 'Chiến mã thích ứng hoàn hảo với giáo án huấn luyện. Tải ngắn hạn kích hoạt tốt quá trình trao đổi chất cơ bắp mà không gây tổn thương gân móng.'
                            : 'Chiến mã chưa hoàn thành trọn vẹn khối lượng bài tập hoặc có dấu hiệu mệt mỏi. Cần hạ tải, theo dõi cơ bắp và cho đi bộ xả cơ.'))}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    marginTop: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Tải ngắn hạn</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: isCalibrating ? '#64748B' : '#FFFFFF', marginTop: '2px' }}>
                        {isCalibrating ? '-- TL' : telemetry.shortTermLoad}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Tải dài hạn</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: isCalibrating ? '#64748B' : '#FFFFFF', marginTop: '2px' }}>
                        {isCalibrating ? '-- TL' : telemetry.longTermLoad}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Tỉ lệ tải</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: isCalibrating ? '#64748B' : (isFitnessIncreasing ? '#10B981' : '#EF4444'), marginTop: '2px' }}>
                        {isCalibrating ? '-- %' : `${telemetry.loadRatio}%`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Hiệu suất chạy 7 ngày của chiến mã */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Hiệu suất bứt tốc 7 ngày</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
                        Hôm nay: <span style={{ color: Number(telemetry.performanceToday) > 0 ? (Number(telemetry.performanceToday) >= 90 ? 'var(--brass)' : '#EF4444') : '#94A3B8' }}>
                          {Number(telemetry.performanceToday) > 0 ? `${telemetry.performanceToday}%` : '--'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: Number(telemetry.performanceToday) > 0
                          ? (Number(telemetry.performanceToday) >= 100 ? '#10B981' : (Number(telemetry.performanceToday) >= 90 ? 'var(--brass)' : '#EF4444'))
                          : '#94A3B8',
                        background: Number(telemetry.performanceToday) > 0
                          ? (Number(telemetry.performanceToday) >= 100 ? 'rgba(16, 185, 129, 0.15)' : (Number(telemetry.performanceToday) >= 90 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(239, 68, 68, 0.15)'))
                          : 'rgba(148, 163, 184, 0.1)',
                        border: Number(telemetry.performanceToday) > 0
                          ? (Number(telemetry.performanceToday) >= 100 ? '1px solid rgba(16, 185, 129, 0.3)' : (Number(telemetry.performanceToday) >= 90 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'))
                          : '1px solid rgba(148, 163, 184, 0.25)',
                        padding: '3px 10px',
                        borderRadius: '12px'
                      }}>
                        {Number(telemetry.performanceToday) > 0 ? (telemetry.performanceRating || 'Tốt') : 'Chờ bài tập'}
                      </span>
                    </div>
                  </div>

                  {/* Bar Chart 7 ngày */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', paddingBottom: '4px' }}>
                      {(() => {
                        const days = telemetry.dayLabels || ['T4', 'T5', 'T6', 'Sat', 'CN', 'T2', 'Hôm nay'];
                        const hist = Array.isArray(telemetry.performanceHistory7Days) && telemetry.performanceHistory7Days.length === 7
                          ? telemetry.performanceHistory7Days
                          : [0, 0, 0, 0, 0, 0, Number(telemetry.performanceToday) || 0];

                        return days.map((dayLabel, idx) => {
                          const val = hist[idx] || 0;
                          const heightPx = val > 0 ? Math.min(85, Math.max(12, Math.round((val / 125) * 85))) : 0;

                          return (
                            <div key={dayLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                              <div style={{ width: '18px', height: '85px', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
                                {heightPx > 0 && (
                                  <div style={{
                                    width: '100%',
                                    height: `${heightPx}px`,
                                    background: val >= 95 
                                      ? 'linear-gradient(180deg, #00E5FF 0%, #10B981 100%)' 
                                      : 'linear-gradient(180deg, #F59E0B 0%, #EF4444 100%)',
                                    borderRadius: '3px',
                                    transition: 'height 0.4s ease'
                                  }} />
                                )}
                              </div>
                              <span style={{ fontSize: '10px', color: dayLabel === 'Hôm nay' ? 'var(--brass)' : '#94A3B8', fontWeight: dayLabel === 'Hôm nay' ? 700 : 400 }}>
                                {dayLabel}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', textAlign: 'right', marginTop: '4px' }}>
                      Chuẩn đua: 90% — 120%
                    </div>
                  </div>
                </div>

              </div>

              {/* ===== HÀNG 2: HOẠT ĐỘNG GẦN ĐÂY, HỒI PHỤC CHIẾN MÃ, HOẠT ĐỘNG HÀNG TUẦN ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>

                {/* 4. Hoạt động gần đây */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Hoạt động & Bài tập gần đây</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--brass)' }}>Đồng bộ GPS yên ngựa</span>
                  </div>

                  {workoutSessionsList.length === 0 ? (
                    <div style={{ padding: '28px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                      Chưa có bài tập nào được ghi nhận cho chiến mã này.<br />
                      <span style={{ color: '#F59E0B', fontWeight: 600 }}>Cần thực hiện tối thiểu 3 bài tập.</span>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '6px 4px' }}>Ngày</th>
                          <th style={{ padding: '6px 4px' }}>Khối lượng tập</th>
                          <th style={{ padding: '6px 4px' }}>Tốc độ viễn trắc</th>
                          <th style={{ padding: '6px 4px', textAlign: 'right' }}>Tải bài tập</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workoutSessionsList.slice(0, 5).map((row, idx) => {
                          const isComp = row.status === 'COMPLETED';
                          const distKm = `${((Number(row.distanceRun) || 1600) / 1000).toFixed(2)}km`;
                          const speedStr = `${(Number(row.avgSpeed) || 60.1).toFixed(1)} km/h`;
                          const loadStr = row.load || '40 TL';
                          const icon = isComp ? '🏇' : '⚠️';

                          return (
                            <tr key={row.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '7px 4px', color: '#E2E8F0', whiteSpace: 'nowrap' }}>
                                <span style={{ marginRight: '6px', fontSize: '13px' }}>{icon}</span>
                                <b style={{ color: 'var(--brass)' }}>Hôm nay</b>
                              </td>
                              <td style={{ padding: '7px 4px', color: '#F1F5F9', fontWeight: 600 }}>{distKm}</td>
                              <td style={{ padding: '7px 4px', color: '#94A3B8' }}>{speedStr}</td>
                              <td style={{ padding: '7px 4px', color: isComp ? 'var(--brass)' : '#EF4444', fontWeight: 700, textAlign: 'right' }}>
                                {loadStr}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 5. Hồi phục chiến mã */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Hồi phục thể trạng chiến mã</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                      {isCalibrating ? 'Chờ đo nhịp buồng ngủ' : `Nhịp tim buồng ngủ: ${telemetry.restingHeartRate} bpm`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '12px 0' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <EquineRecoveryIcon recoveryPercent={telemetry.recoveryPercent} isCalibrating={isCalibrating} size={70} />
                    </div>

                    <div style={{ fontSize: '32px', fontWeight: 800, color: isCalibrating ? '#F59E0B' : '#FFFFFF', lineHeight: 1 }}>
                      {isCalibrating ? '-- %' : `${telemetry.recoveryPercent}%`}
                    </div>
                    <div style={{ fontSize: '12px', color: recoveryColor, fontWeight: 700, marginTop: '4px' }}>
                      {isCalibrating 
                        ? `Chờ phân tích sau đủ 3 bài tập (${telemetry.workoutCount || 0}/3)`
                        : (telemetry.recoveryPercent >= 90 ? 'Hồi phục hoàn toàn (100%)' : (telemetry.recoveryPercent >= 65 ? 'Đang trong chu kỳ hồi phục tích cực' : 'Cần nghỉ ngơi / Mệt mỏi sau bài tập'))}
                    </div>
                    {!isCalibrating && (
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                        {telemetry.recoveryPercent >= 95 
                          ? '✓ Sẵn sàng cho bài tập bứt tốc cự ly đầy đủ'
                          : `Dự kiến phục hồi 100%: ~${telemetry.hoursTo100Percent || 18} giờ`}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '2px' }}>
                      <div style={{ flex: 1, background: '#EF4444', opacity: !isCalibrating && telemetry.recoveryPercent < 40 ? 1 : 0.25 }} />
                      <div style={{ flex: 1, background: '#F59E0B', opacity: isCalibrating || (telemetry.recoveryPercent >= 40 && telemetry.recoveryPercent < 70) ? 1 : 0.25 }} />
                      <div style={{ flex: 1, background: '#10B981', opacity: !isCalibrating && telemetry.recoveryPercent >= 70 && telemetry.recoveryPercent < 90 ? 1 : 0.25 }} />
                      <div style={{ flex: 1, background: '#00E5FF', opacity: !isCalibrating && telemetry.recoveryPercent >= 90 ? 1 : 0.25 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', marginTop: '6px' }}>
                      <span>Mệt mỏi cơ bắp</span>
                      <span style={{ color: recoveryColor, fontWeight: 600 }}>
                        {isCalibrating ? `Đang hiệu chuẩn (${telemetry.workoutCount || 0}/3)` : (telemetry.recoveryPercent >= 80 ? 'Sảng khoái / Sẵn sàng bài tập nặng' : 'Đang xả cơ & tái tạo năng lượng')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Hoạt động hàng tuần */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Hoạt động chạy tuần này</span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                      </div>
                      <select
                        value={weeklyMetric}
                        onChange={(e) => setWeeklyMetric(e.target.value)}
                        style={{
                          background: '#0B0F19',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#E2E8F0',
                          fontSize: '11px',
                          borderRadius: '4px',
                          padding: '3px 8px'
                        }}
                      >
                        <option value="distance">Khoảng cách (km)</option>
                        <option value="duration">Thời lượng tập</option>
                        <option value="load">Tải luyện tập</option>
                      </select>
                    </div>

                    <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#94A3B8' }}>
                      Tổng khoảng cách: <b style={{ color: '#F8FAFC' }}>{telemetry.weeklyDistance !== undefined ? telemetry.weeklyDistance : 0} km</b> · Tỉ lệ hoàn thành: <b style={{ color: '#10B981' }}>{telemetry.weeklyCompletionRate !== undefined ? telemetry.weeklyCompletionRate : 0}%</b>
                    </div>
                  </div>

                  {/* Bar Chart hàng tuần */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '95px', paddingBottom: '4px' }}>
                      {(() => {
                        const distObj = telemetry.weeklyDistribution || {
                          T2: 0,
                          T3: 0,
                          T4: 0,
                          T5: 0,
                          T6: 0,
                          Sat: 0,
                          CN: 0
                        };
                        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'Sat', 'CN'];
                        const dayKeysMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'Sat'];
                        const todayKeyNow = dayKeysMap[new Date().getDay()];
                        const maxKm = Math.max(3, ...Object.values(distObj).map(Number));

                        return days.map(dayKey => {
                          const kmVal = Number(distObj[dayKey]) || 0;
                          const heightPx = kmVal > 0 ? Math.min(65, Math.max(22, Math.round((kmVal / maxKm) * 65))) : 0;
                          const isToday = dayKey === todayKeyNow;

                          return (
                            <div key={dayKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                              <div style={{
                                width: '20px',
                                height: '70px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                background: isToday ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '3px',
                                border: isToday ? '1px dashed rgba(212, 175, 55, 0.35)' : 'none'
                              }}>
                                {heightPx > 0 && (
                                  <div style={{
                                    width: '100%',
                                    height: `${heightPx}px`,
                                    background: isToday ? 'linear-gradient(180deg, #00E5FF 0%, #1E6F9F 100%)' : '#1E6F9F',
                                    borderRadius: '3px',
                                    transition: 'height 0.4s ease'
                                  }} />
                                )}
                              </div>
                              <span style={{ fontSize: '10px', color: isToday ? 'var(--brass)' : '#94A3B8', fontWeight: isToday ? 700 : 400 }}>
                                {dayKey}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

              </div>

              {/* ===== HÀNG 3: VÙNG NHỊP TIM NGỰA, VÙNG PACE NGỰA, BÀI TẬP SẮP TỚI ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>

                {/* 7. Vùng nhịp tim theo ngưỡng Lactate */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Vùng nhịp tim theo ngưỡng Lactate chiến mã</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Ngưỡng Lactate</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{isCalibrating ? '--' : telemetry.lactateThresholdHR} <span style={{ fontSize: '11px', color: '#94A3B8' }}>bpm</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Nhịp tim tối đa</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{isCalibrating ? '--' : telemetry.maxHeartRate} <span style={{ fontSize: '11px', color: '#94A3B8' }}>bpm</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Nhịp tim nghỉ</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{isCalibrating ? '--' : telemetry.restingHeartRate} <span style={{ fontSize: '11px', color: '#94A3B8' }}>bpm</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
                    {(telemetry.hrZones || [
                      { dot: '#00E5FF', name: 'Đi bộ / Xả cơ thả lỏng', range: '< 110 bpm' },
                      { dot: '#10B981', name: 'Sức bền hiếu khí đường trường', range: '110 - 145 bpm' },
                      { dot: '#22C55E', name: 'Sức mạnh nhịp đều (Canter Tempo)', range: '146 - 170 bpm' },
                      { dot: '#EAB308', name: 'Ngưỡng Lactate bứt phá', range: '171 - 195 bpm' },
                      { dot: '#F97316', name: 'Sức bền kỵ khí tăng tốc', range: '196 - 210 bpm' },
                      { dot: '#EF4444', name: 'Nước rút đỉnh (Max Sprint Burst)', range: '> 210 bpm' }
                    ]).map(zone => (
                      <div key={zone.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: zone.dot }} />
                          <span style={{ color: '#E2E8F0' }}>{zone.name}</span>
                        </div>
                        <span style={{ color: '#94A3B8', fontWeight: 600 }}>{isCalibrating ? '--' : zone.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. Vùng pace & tốc độ theo ngưỡng Lactate */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Vùng tốc độ theo ngưỡng Lactate</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                  </div>

                  <div style={{ margin: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>Tốc độ ngưỡng Lactate (LT Pace)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brass)' }}>
                      {isCalibrating ? 'Chờ đủ 3 bài tập' : (telemetry.ltPaceDisplay || '64.2 km/h (00\'56"/km)')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
                    {(telemetry.speedZones || [
                      { dot: '#00E5FF', name: 'Đi bộ hồi phục (Walk)', range: '< 15 km/h' },
                      { dot: '#10B981', name: 'Phi nước kiệu nhẹ (Trot)', range: '15 - 35 km/h' },
                      { dot: '#22C55E', name: 'Phi nước kiệu đều (Canter)', range: '36 - 52 km/h' },
                      { dot: '#EAB308', name: 'Ngưỡng tốc độ đua (Race Gallop)', range: '53 - 64 km/h' },
                      { dot: '#F97316', name: 'Tốc độ tăng tốc nước rút', range: '65 - 70 km/h' },
                      { dot: '#EF4444', name: 'Nước rút xé gió cực đại', range: '> 70 km/h' }
                    ]).map(zone => (
                      <div key={zone.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: zone.dot }} />
                          <span style={{ color: '#E2E8F0' }}>{zone.name}</span>
                        </div>
                        <span style={{ color: '#94A3B8', fontWeight: 600 }}>{isCalibrating ? '--' : zone.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 9. Bài tập sắp tới */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {workoutToast && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(16, 185, 129, 0.95)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      ✓ {workoutToast}
                    </div>
                  )}

                  <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap' }}>
                        Giáo án bài tập sắp tới
                      </div>
                      {!isTrainer && (
                        <span style={{
                          fontSize: '10.5px',
                          color: 'var(--brass)',
                          background: 'rgba(212, 175, 55, 0.12)',
                          border: '1px solid rgba(212, 175, 55, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⚡ Đồng bộ từ HLV
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>HLV phụ trách:</span>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{horse.trainer || 'Lê Trọng Nghĩa'}</span>
                      {isTrainer && <span style={{ color: 'var(--brass)', fontSize: '10px' }}>(Bạn đang quản lý)</span>}
                    </div>
                  </div>

                  {horseUpcomingWorkouts.length === 0 ? (
                    <div style={{
                      padding: '26px 16px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                      margin: '4px 0'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>📋</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#E2E8F0', marginBottom: '4px' }}>
                        Chưa có bài tập kế tiếp
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', maxWidth: '340px', margin: '0 auto', lineHeight: '1.5' }}>
                        {isTrainer 
                          ? `Chưa có bài tập kế tiếp được lên lịch cho ${horseName}.`
                          : `Huấn Luyện Viên (${horse.trainer || 'HLV phụ trách'}) đang thiết lập giáo án tiếp theo cho chiến mã này. Bài tập mới sẽ tự động hiển thị tại đây.`
                        }
                      </div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '6px 4px', whiteSpace: 'nowrap' }}>Ngày</th>
                          <th style={{ padding: '6px 4px' }}>Bài tập huấn luyện</th>
                          <th style={{ padding: '6px 4px', whiteSpace: 'nowrap' }}>Khối lượng</th>
                          <th style={{ padding: '6px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>Tải dự kiến</th>
                          {isTrainer && <th style={{ padding: '6px 4px', textAlign: 'center', width: '28px' }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {horseUpcomingWorkouts.map((item, idx) => {
                          const dayLabel = formatDayLabel(item);
                          const isToday = dayLabel === 'Hôm nay';
                          return (
                            <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '6px 4px', color: isToday ? 'var(--brass)' : '#94A3B8', fontWeight: isToday ? 700 : 400 }}>
                                {dayLabel}
                              </td>
                              <td style={{ padding: '6px 4px', color: '#F1F5F9', fontWeight: 600 }}>
                                <div>{item.title}</div>
                                {item.phase && (
                                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                                    {item.phase}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '6px 4px', color: '#94A3B8' }}>{formatVolume(item)}</td>
                              <td style={{ padding: '6px 4px', color: 'var(--brass)', fontWeight: 700, textAlign: 'right' }}>
                                {formatLoad(item)}
                              </td>
                              {isTrainer && (
                                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWorkout(item.id)}
                                    title="Hủy bài tập này"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#EF4444',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      padding: '2px 4px',
                                      opacity: 0.65
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.65'}
                                  >
                                    🗑️
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* MODAL CẬP NHẬT BÀI TẬP DÀNH CHO HUẤN LUYỆN VIÊN */}
                  {showAddWorkoutModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0, 0, 0, 0.78)',
                      backdropFilter: 'blur(5px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000000,
                      padding: '16px'
                    }}>
                      <div style={{
                        background: '#131826',
                        border: '1px solid var(--brass)',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '22px',
                        color: '#F1F5F9',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.2)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#FFFFFF', fontWeight: 800 }}>
                              🏇 Cập Nhật Bài Tập Kế Tiếp Cho Chủ Ngựa
                            </h3>
                            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                              Chiến mã: <b style={{ color: 'var(--brass)' }}>{horseName}</b> • Hiển thị tức thì bên Chủ sở hữu
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddWorkoutModal(false)}
                            style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Gợi ý chọn nhanh preset */}
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                            ⚡ Gợi ý bài tập mẫu (1-chạm):
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {WORKOUT_PRESETS.map((p, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNewWorkoutData({
                                  title: p.title,
                                  phase: p.phase,
                                  dayLabel: p.dayLabel,
                                  targetDistance: p.targetDistance,
                                  volume: p.volume,
                                  load: p.load,
                                  note: ''
                                })}
                                style={{
                                  background: newWorkoutData.title === p.title ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                  color: newWorkoutData.title === p.title ? 'var(--brass)' : '#CBD5E1',
                                  border: newWorkoutData.title === p.title ? '1px solid var(--brass)' : '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '10.5px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {p.title.split('(')[0]} ({p.volume})
                              </button>
                            ))}
                          </div>
                        </div>

                        <form onSubmit={handleSaveWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                              Tên bài tập huấn luyện *
                            </label>
                            <input
                              type="text"
                              required
                              value={newWorkoutData.title}
                              onChange={(e) => setNewWorkoutData({ ...newWorkoutData, title: e.target.value })}
                              placeholder="Ví dụ: Phi nước đại tăng tốc (Gallop Sprint)"
                              style={{ width: '100%', padding: '8px 10px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                                Ngày áp dụng
                              </label>
                              <select
                                value={newWorkoutData.dayLabel}
                                onChange={(e) => setNewWorkoutData({ ...newWorkoutData, dayLabel: e.target.value })}
                                style={{ width: '100%', padding: '8px 10px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                              >
                                <option value="Hôm nay">Hôm nay</option>
                                <option value="Ngày mai">Ngày mai</option>
                                <option value="T2">Thứ 2 (T2)</option>
                                <option value="T3">Thứ 3 (T3)</option>
                                <option value="T4">Thứ 4 (T4)</option>
                                <option value="T5">Thứ 5 (T5)</option>
                                <option value="T6">Thứ 6 (T6)</option>
                                <option value="Sat">Thứ 7 (Sat)</option>
                                <option value="CN">Chủ nhật (CN)</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                                Giai đoạn huấn luyện
                              </label>
                              <select
                                value={newWorkoutData.phase}
                                onChange={(e) => setNewWorkoutData({ ...newWorkoutData, phase: e.target.value })}
                                style={{ width: '100%', padding: '8px 10px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                              >
                                <option value="Nước rút (Sprint)">Nước rút (Sprint)</option>
                                <option value="Thể lực nền (Endurance)">Thể lực nền (Endurance)</option>
                                <option value="Kỹ thuật (Gate & Pace)">Kỹ thuật (Gate & Pace)</option>
                                <option value="Phục hồi (Recovery)">Phục hồi (Recovery)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                                Khối lượng bài tập *
                              </label>
                              <input
                                type="text"
                                required
                                value={newWorkoutData.volume}
                                onChange={(e) => setNewWorkoutData({ ...newWorkoutData, volume: e.target.value })}
                                placeholder="Ví dụ: 1.600m, 30 min, 6 lượt"
                                style={{ width: '100%', padding: '8px 10px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                                Tải dự kiến (Training Load) *
                              </label>
                              <input
                                type="text"
                                required
                                value={newWorkoutData.load}
                                onChange={(e) => setNewWorkoutData({ ...newWorkoutData, load: e.target.value })}
                                placeholder="Ví dụ: 220 TL, 140 TL"
                                style={{ width: '100%', padding: '8px 10px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--brass)', fontWeight: 700, borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '11.5px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                              Chỉ đạo / Nhận xét của HLV gửi Chủ ngựa (Tùy chọn)
                            </label>
                            <input
                              type="text"
                              value={newWorkoutData.note}
                              onChange={(e) => setNewWorkoutData({ ...newWorkoutData, note: e.target.value })}
                              placeholder="Ví dụ: Tăng nhịp guồng chân chặng cuối, ngâm lạnh chân sau khi tập"
                              style={{ width: '100%', padding: '8px 10px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                              type="button"
                              onClick={() => setShowAddWorkoutModal(false)}
                              style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              style={{ flex: 1, padding: '9px', background: 'var(--brass)', border: 'none', color: '#0F172A', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✅ Lưu & Gửi Cho Chủ Ngựa
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ===== HÀNG 4: KỶ LỤC CHIẾN MÃ, DỰ ĐOÁN THÀNH TÍCH ĐUA, HRV Ô CHUỒNG ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>

                {/* 10. Kỷ lục đua & bứt tốc của chiến mã */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>
                      Kỷ lục thi đấu & bứt tốc
                    </div>
                    <select
                      value={personalBestFilter}
                      onChange={(e) => setPersonalBestFilter(e.target.value)}
                      style={{
                        background: '#0B0F19',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#E2E8F0',
                        fontSize: '11px',
                        borderRadius: '4px',
                        padding: '3px 8px'
                      }}
                    >
                      <option value="season">Mùa giải 2026</option>
                      <option value="4w">4 tuần gần nhất</option>
                      <option value="all">Toàn bộ sự nghiệp</option>
                    </select>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '6px 4px' }}>Cự ly đua</th>
                        <th style={{ padding: '6px 4px' }}>Thời gian kỷ lục</th>
                        <th style={{ padding: '6px 4px' }}>Tốc độ TB</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right' }}>Ngày xác lập</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { dist: '1.000m (Sprint bứt phá)', rec: isCalibrating ? '--' : '00:57.4', pace: isCalibrating ? '--' : '62.7 km/h', date: isCalibrating ? 'Chờ đo' : '22/10/2026' },
                        { dist: '1.200m (Cự ly ngắn)', rec: isCalibrating ? '--' : '01:09.8', pace: isCalibrating ? '--' : '61.9 km/h', date: isCalibrating ? 'Chờ đo' : '15/10/2026' },
                        { dist: '1.600m (Cự ly trung bình)', rec: isCalibrating ? '--' : '01:34.2', pace: isCalibrating ? '--' : '61.1 km/h', date: isCalibrating ? 'Chờ đo' : '08/10/2026' },
                        { dist: '2.000m (Classic kinh điển)', rec: isCalibrating ? '--' : '01:59.6', pace: isCalibrating ? '--' : '60.2 km/h', date: isCalibrating ? 'Chờ đo' : '28/09/2026' },
                        { dist: '2.400m (Turf đường cỏ dài)', rec: isCalibrating ? '--' : '02:26.5', pace: isCalibrating ? '--' : '59.0 km/h', date: isCalibrating ? 'Chờ đo' : '14/09/2026' }
                      ].map((pb, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '6px 4px', color: '#94A3B8' }}>{pb.dist}</td>
                          <td style={{ padding: '6px 4px', color: '#FFFFFF', fontWeight: 700 }}>{pb.rec}</td>
                          <td style={{ padding: '6px 4px', color: 'var(--brass)' }}>{pb.pace}</td>
                          <td style={{ padding: '6px 4px', color: '#64748B', textAlign: 'right' }}>{pb.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 11. Dự đoán thành tích các cự ly thi đấu */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Dự đoán thành tích thi đấu sắp tới</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '6px 4px' }}>Cự ly giải đấu</th>
                        <th style={{ padding: '6px 4px' }}>Thời gian dự đoán</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right' }}>Tốc độ trung bình</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(telemetry.racePredictions || [
                        { dist: '1.200m (Sprint Cup)', time: isCalibrating ? '--' : '01:08.5', pace: isCalibrating ? '--' : '63.1 km/h' },
                        { dist: '1.600m (Tiêu chuẩn Mile)', time: isCalibrating ? '--' : '01:33.2', pace: isCalibrating ? '--' : '61.8 km/h' },
                        { dist: '2.000m (Cúp Quốc Gia)', time: isCalibrating ? '--' : '01:58.4', pace: isCalibrating ? '--' : '60.9 km/h' },
                        { dist: '2.400m (Vô Địch Derby)', time: isCalibrating ? '--' : '02:25.1', pace: isCalibrating ? '--' : '59.5 km/h' }
                      ]).map((pred, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 4px', color: '#F1F5F9', fontWeight: 600 }}>{pred.dist}</td>
                          <td style={{ padding: '8px 4px', color: '#00E5FF', fontWeight: 700 }}>{isCalibrating ? '--' : pred.time}</td>
                          <td style={{ padding: '8px 4px', color: 'var(--brass)', textAlign: 'right' }}>{isCalibrating ? '--' : pred.pace}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 12. HRV sinh trắc & Giấc ngủ ô chuồng */}
                <div style={{
                  background: '#131826',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>HRV sinh trắc & Giấc ngủ ô chuồng</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>ⓘ</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', margin: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Trạng thái phục hồi</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#10B981' : '#F59E0B') }}>
                          {isCalibrating ? `Đang đo (${telemetry.workoutCount || 0}/3)` : (telemetry.hrvStatus || (isFitnessIncreasing ? 'Tối ưu' : 'Bình thường'))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Tr.bình đêm qua</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{isCalibrating ? '--' : telemetry.hrvMs} <span style={{ fontSize: '10px', color: '#94A3B8' }}>ms</span></div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Phạm vi chuẩn</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#94A3B8' }}>50-78 <span style={{ fontSize: '10px' }}>ms</span></div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.45 }}>
                      {isCalibrating
                        ? 'Cảm biến IoT gắn ô chuồng đang thu thập dữ liệu nhịp thở ban đêm. Cần tích lũy đủ 3 buổi tập kèm giấc ngủ đêm để chuẩn hóa HRV.'
                        : (telemetry.hrvDesc || (isFitnessIncreasing
                          ? 'Chỉ số biến thiên nhịp tim HRV của chiến mã trong chuồng đạt mức lý tưởng. Hệ thần kinh giao cảm thư giãn hoàn toàn, sẵn sàng tiếp nhận bài tập cường độ cao.'
                          : 'HRV đang biến động nhẹ. Chiến mã cần được bổ sung vi khoáng, xông hơi bù khoáng và kiểm tra chất lượng giấc ngủ ô chuồng.'))}
                    </div>
                  </div>

                  {/* Sparkline Line Chart */}
                  <div style={{ marginTop: '12px' }}>
                    {(() => {
                      const hrvArr = Array.isArray(telemetry.hrvHistory) && telemetry.hrvHistory.length === 7
                        ? telemetry.hrvHistory
                        : [60, 54, 68, 52, 62, 59, typeof telemetry.hrvMs === 'number' ? telemetry.hrvMs : 64];

                      const coords = hrvArr.map((val, i) => {
                        const cx = 15 + i * 40;
                        const clamped = Math.max(30, Math.min(90, Number(val) || 60));
                        const cy = Math.round(52 - ((clamped - 30) / 60) * 42);
                        return [cx, cy];
                      });
                      const ptsStr = coords.map(([x, y]) => `${x},${y}`).join(' ');

                      return (
                        <svg width="100%" height="60" viewBox="0 0 280 60" style={{ overflow: 'visible' }}>
                          <polyline
                            fill="none"
                            stroke={isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#00E5FF' : '#F59E0B')}
                            strokeWidth="2.5"
                            points={ptsStr}
                          />
                          {coords.map(([cx, cy], i) => (
                            <circle key={i} cx={cx} cy={cy} r="3.5" fill={isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#00E5FF' : '#F59E0B')} />
                          ))}
                        </svg>
                      );
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748B', marginTop: '4px' }}>
                      <span>10/27</span>
                      <span>10/28</span>
                      <span>10/29</span>
                      <span>10/30</span>
                      <span>10/31</span>
                      <span>11/01</span>
                      <span style={{ color: isCalibrating ? '#F59E0B' : '#00E5FF', fontWeight: 700 }}>Hôm nay</span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {activeSubTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Tab & Bộ lọc tháng */}
              <div style={{
                background: '#131826',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h4 style={{ color: 'var(--brass)', fontSize: '16px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📋</span>
                    <span>Danh Sách Hoạt Động & Nhật Ký Huấn Luyện Cả Tháng</span>
                  </h4>
                  <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
                    Theo dõi đầy đủ lịch sử các buổi rèn tốc độ, thể lực, xuất phát máy và phục hồi của <b>{horseName}</b> trong tháng.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Chu kỳ:</span>
                  <select
                    value={selectedActivityMonth}
                    onChange={(e) => setSelectedActivityMonth(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: '#0E1322',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      color: 'var(--paper)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="CURRENT_MONTH">Tháng 11/2026 (Tháng này)</option>
                    <option value="ALL">Toàn bộ các chu kỳ</option>
                  </select>
                </div>
              </div>

              {/* 4 THẺ THỐNG KÊ KPI TRONG THÁNG */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#131826', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Tổng buổi rèn tháng</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--paper)' }}>
                    {monthStats.total} <span style={{ fontSize: '12px', color: '#94A3B8' }}>buổi</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brass)', marginTop: '2px' }}>
                    {monthStats.completed} hoàn thành · {monthStats.incomplete} chưa đạt
                  </div>
                </div>

                <div style={{ background: '#131826', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Tỷ lệ hoàn thành</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>{monthStats.rate}%</div>
                  <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>Đạt chuẩn mục tiêu</div>
                </div>

                <div style={{ background: '#131826', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Quãng đường tích lũy</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#38BDF8' }}>
                    {monthStats.totalDistanceKm} <span style={{ fontSize: '12px', color: '#94A3B8' }}>km</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Ghi nhận từ GPS</div>
                </div>

                <div style={{ background: '#131826', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Vận tốc cao nhất</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brass)' }}>
                    {monthStats.topSpeed} <span style={{ fontSize: '12px', color: '#94A3B8' }}>km/h</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Bứt phá nước rút</div>
                </div>
              </div>

              {/* DANH SÁCH CHI TIẾT CÁC BUỔI TẬP RÈN TRONG THÁNG */}
              <div style={{
                background: '#131826',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <b style={{ color: 'var(--paper)', fontSize: '14px' }}>
                    Nhật ký các buổi rèn chi tiết ({filteredMonthSessions.length} bài)
                  </b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Đồng bộ thời gian thực từ cảm biến viễn trắc</span>
                    {filteredMonthSessions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSessions}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#EF4444',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Xóa tất cả nhật ký buổi rèn của chiến mã này"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                </div>

                {filteredMonthSessions.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏇</div>
                    Chưa có buổi rèn nào được ghi nhận cho chiến mã trong chu kỳ này.<br />
                    <span style={{ fontSize: '12px', color: 'var(--brass)' }}>Khi Huấn luyện viên rèn xong bài tập trong giáo án, toàn bộ kết quả telemetry sẽ tự động chuyển về đây.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredMonthSessions.map((sess, idx) => {
                      const isComp = sess.status === 'COMPLETED';
                      return (
                        <div key={sess.id || idx} style={{
                          background: '#0E1322',
                          border: isComp ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                          borderRadius: '8px',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>{isComp ? '🏇' : '⚠️'}</span>
                              <b style={{ color: 'var(--paper)', fontSize: '13.5px' }}>{sess.title}</b>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{sess.time}</span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: isComp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isComp ? '#10B981' : '#EF4444',
                                border: isComp ? '1px solid #10B981' : '1px solid #EF4444'
                              }}>
                                {isComp ? '✓ Hoàn thành bài tập' : '✕ Không hoàn thành bài tập'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(sess.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#EF4444',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Xóa buổi rèn này khỏi nhật ký"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            fontSize: '12px'
                          }}>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Cự ly hoàn thành</span>
                              <b style={{ color: 'var(--paper)' }}>{sess.distanceRun} m</b>
                            </div>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Vận tốc trung bình</span>
                              <b style={{ color: '#38BDF8' }}>{Number(sess.avgSpeed).toFixed(1)} km/h</b>
                            </div>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Nhịp tim tối đa</span>
                              <b style={{ color: Number(sess.maxHeartRate) > 210 ? '#EF4444' : '#10B981' }}>
                                {sess.maxHeartRate} bpm
                              </b>
                            </div>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Tải bài tập (TL)</span>
                              <b style={{ color: 'var(--brass)' }}>{sess.load}</b>
                            </div>
                            <div>
                              <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Điểm chuyên môn</span>
                              <b style={{ color: '#F59E0B' }}>{sess.score} / 10.0</b>
                            </div>
                          </div>

                          {sess.feedback && (
                            <div style={{
                              marginTop: '2px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              background: isComp ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              borderLeft: isComp ? '3px solid #10B981' : '3px solid #EF4444',
                              color: 'var(--paper)',
                              fontSize: '11.5px',
                              lineHeight: 1.5
                            }}>
                              <b style={{ color: isComp ? '#10B981' : '#EF4444' }}>Đánh giá của Huấn luyện viên:</b> {sess.feedback}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===================== FOOTER ===================== */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0E1322',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#64748B'
        }}>
          <div>
            Hệ thống phân tích thể lực viễn trắc chiến mã EvoLab Equine v4.2 · Quy chuẩn đánh giá tối thiểu 3 bài tập
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--brass)',
              color: '#0A0D14',
              border: 'none',
              padding: '6px 18px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
