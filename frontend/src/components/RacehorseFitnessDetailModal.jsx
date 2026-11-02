import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  getHorseFitnessTelemetry, 
  calculateHorseFitnessOnSession, 
  REQUIRED_WORKOUTS_TO_EVALUATE,
  computeCurrentDecayedRecovery 
} from '../services/fitnessAlgorithm';
import EquineRecoveryIcon from './EquineRecoveryIcon';

export default function RacehorseFitnessDetailModal({ horse, onClose, onUpdateHorse, sessions = [] }) {
  if (!horse) return null;

  const [telemetry, setTelemetry] = useState(() => getHorseFitnessTelemetry(horse, sessions));
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'evolab' | 'activities' | 'calendar'
  const [personalBestFilter, setPersonalBestFilter] = useState('season');
  const [weeklyMetric, setWeeklyMetric] = useState('distance');
  const [isSimulating, setIsSimulating] = useState(false);

  // Lắng nghe sự kiện cập nhật viễn trắc theo thời gian thực (Real-time reactivity)
  useEffect(() => {
    const handleFitnessUpdate = (e) => {
      const { horse: updatedH, telemetry: newTelem } = e.detail || {};
      const thisKey = horse.microchip || horse.id || horse.name;
      const updatedKey = updatedH?.microchip || updatedH?.id || updatedH?.name;
      if (thisKey === updatedKey && newTelem) {
        setTelemetry(newTelem);
      }
    };
    window.addEventListener('racehorse-fitness-updated', handleFitnessUpdate);
    return () => window.removeEventListener('racehorse-fitness-updated', handleFitnessUpdate);
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

  // Hàm kích hoạt thuật toán tính toán tức thì khi huấn luyện viên ghi nhận bài tập
  const triggerSessionAlgorithm = (status) => {
    setIsSimulating(true);
    const nextWorkoutNum = (telemetry.workoutCount || 0) + 1;
    const mockSession = {
      id: Date.now(),
      status,
      horseName: horse.name,
      distanceRun: 1600,
      avgSpeed: status === 'COMPLETED' ? 64.5 : 42.0,
      maxHeartRate: status === 'COMPLETED' ? 204 : 222,
      score: status === 'COMPLETED' ? 9.0 : 4.5,
      programTitle: status === 'COMPLETED' 
        ? `Bài tập kiểm tra thể lực #${nextWorkoutNum} (1.600m)` 
        : `Bài tập kiểm tra #${nextWorkoutNum} (Không hoàn thành)`
    };

    const updated = calculateHorseFitnessOnSession(horse, mockSession, sessions);
    setTelemetry(updated);

    if (onUpdateHorse) {
      onUpdateHorse({
        ...horse,
        condition: updated.condition,
        trend: updated.trend,
        trendPercent: updated.trendPercent,
        status: updated.status,
        maxSpeed: updated.maxSpeed,
        isCalibrating: updated.isCalibrating,
        workoutCount: updated.workoutCount
      });
    }

    setTimeout(() => setIsSimulating(false), 450);
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
  const avatar = horse.avatar || horse.horse_avatar || defaultAvatar;
  const horseName = horse.name || horse.horseName || 'Chiến mã';
  const ownerName = horse.ownerName || horse.owner || 'Phạm Tiến Thành';
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
                { key: 'evolab', label: 'Thông số EvoLab' },
                { key: 'activities', label: 'D.sách hoạt động' },
                { key: 'calendar', label: 'Lịch' }
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

        {/* ===================== THANH THUẬT TOÁN KÍCH HOẠT NHANH (REAL-TIME TEST) ===================== */}
        <div style={{
          background: isCalibrating ? 'rgba(245, 158, 11, 0.09)' : 'rgba(212, 175, 55, 0.08)',
          borderBottom: isCalibrating ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(212, 175, 55, 0.2)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{isCalibrating ? '⏳' : '⚡'}</span>
            <div>
              <span style={{ color: isCalibrating ? '#F59E0B' : 'var(--paper)', fontWeight: 700 }}>
                {isCalibrating
                  ? `Chiến mã mới tiếp nhận (Tiến độ: ${telemetry.workoutCount || 0}/3 bài tập):`
                  : 'Thuật toán viễn trắc thể lực sinh lý chiến mã:'}
              </span>
              <span style={{ color: 'var(--paper-dim)', marginLeft: '6px' }}>
                {isCalibrating
                  ? `Chưa có thông tin thể lực. Cần hoàn thành đủ 3 bài tập (hoàn thành hay không hoàn thành) để kích hoạt đánh giá (còn thiếu ${telemetry.remainingWorkouts} bài).`
                  : 'Cập nhật tức thì biểu đồ và 12 chỉ số khi ghi nhận kết quả bài tập.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => triggerSessionAlgorithm('COMPLETED')}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11.5px',
                cursor: isSimulating ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
              }}
              title="Ghi nhận bài tập hoàn thành xuất sắc"
            >
              <span>{isCalibrating ? `✓ Ghi nhận bài tập ${(telemetry.workoutCount || 0) + 1} (Hoàn thành)` : '✓ Hoàn thành bài tập'}</span>
              <span style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: '3px', fontSize: '10.5px' }}>
                {isCalibrating ? `${(telemetry.workoutCount || 0) + 1}/3` : '+ Thể lực'}
              </span>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => triggerSessionAlgorithm('INCOMPLETE')}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11.5px',
                cursor: isSimulating ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
              }}
              title="Ghi nhận bài tập chưa đạt / bỏ cuộc giữa chừng"
            >
              <span>{isCalibrating ? `✕ Ghi nhận bài tập ${(telemetry.workoutCount || 0) + 1} (Không hoàn thành)` : '✕ Không hoàn thành'}</span>
              <span style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: '3px', fontSize: '10.5px' }}>
                {isCalibrating ? `${(telemetry.workoutCount || 0) + 1}/3` : '- Thể lực'}
              </span>
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
                        Hôm nay: <span style={{ color: isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? 'var(--brass)' : '#EF4444') }}>{isCalibrating ? '--' : `${telemetry.performanceToday}%`}</span>
                      </div>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#10B981' : '#EF4444'),
                        background: isCalibrating ? 'rgba(245, 158, 11, 0.15)' : (isFitnessIncreasing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                        border: isCalibrating ? '1px solid rgba(245, 158, 11, 0.3)' : (isFitnessIncreasing ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'),
                        padding: '3px 10px',
                        borderRadius: '12px'
                      }}>
                        {isCalibrating ? `Đang thu thập (${telemetry.workoutCount || 0}/3)` : (isFitnessIncreasing ? 'Xuất sắc' : 'Cần phục hồi')}
                      </span>
                    </div>
                  </div>

                  {/* Bar Chart 7 ngày */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', paddingBottom: '4px' }}>
                      {(() => {
                        const days = ['T3', 'T4', 'T5', 'T6', 'Sat', 'CN', 'Hôm nay'];
                        const hist = Array.isArray(telemetry.performanceHistory7Days) && telemetry.performanceHistory7Days.length === 7
                          ? telemetry.performanceHistory7Days
                          : [88, 0, 92, 0, 101, 85, telemetry.performanceToday || 101];

                        return days.map((dayLabel, idx) => {
                          const val = hist[idx] || 0;
                          const hasVal = !isCalibrating && val > 0;
                          const heightPx = isCalibrating 
                            ? (idx === 6 && (telemetry.workoutCount || 0) > 0 ? 35 : 0) 
                            : Math.min(85, Math.round((val / 125) * 85));

                          return (
                            <div key={dayLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                              <div style={{ width: '18px', height: '85px', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
                                {(hasVal || (isCalibrating && heightPx > 0)) && (
                                  <div style={{
                                    width: '100%',
                                    height: `${heightPx}px`,
                                    background: isCalibrating 
                                      ? '#F59E0B' 
                                      : (val >= 95 ? 'linear-gradient(180deg, #00E5FF 0%, #10B981 100%)' : 'linear-gradient(180deg, #F59E0B 0%, #EF4444 100%)'),
                                    borderRadius: '3px',
                                    transition: 'height 0.4s ease'
                                  }} />
                                )}
                              </div>
                              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{dayLabel}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', textAlign: 'right', marginTop: '4px' }}>
                      {isCalibrating ? 'Cần 3 bài tập để hiển thị biểu đồ' : 'Chuẩn đua: 90% — 120%'}
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

                  {(!telemetry.recentActivities || telemetry.recentActivities.length === 0) ? (
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
                        {telemetry.recentActivities.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '7px 4px', color: '#E2E8F0', whiteSpace: 'nowrap' }}>
                              <span style={{ marginRight: '6px', fontSize: '13px' }}>{row.icon}</span>
                              <b style={{ color: row.day === 'Hôm nay' ? 'var(--brass)' : '#94A3B8' }}>{row.day}</b>
                            </td>
                            <td style={{ padding: '7px 4px', color: '#F1F5F9', fontWeight: 600 }}>{row.dist}</td>
                            <td style={{ padding: '7px 4px', color: '#94A3B8' }}>{row.pace}</td>
                            <td style={{ padding: '7px 4px', color: row.status === 'INCOMPLETE' ? '#EF4444' : 'var(--brass)', fontWeight: 700, textAlign: 'right' }}>
                              {row.load}
                            </td>
                          </tr>
                        ))}
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
                      Tổng khoảng cách: <b style={{ color: '#F8FAFC' }}>{isCalibrating ? `${((telemetry.workoutCount || 0) * 1.6).toFixed(2)} km` : `${telemetry.weeklyDistance} km`}</b> · Tỉ lệ hoàn thành: <b style={{ color: isCalibrating ? '#F59E0B' : (isFitnessIncreasing ? '#10B981' : '#F59E0B') }}>{isCalibrating ? `${Math.round(((telemetry.workoutCount || 0) / 3) * 100)}%` : `${telemetry.weeklyCompletionRate}%`}</b>
                    </div>
                  </div>

                  {/* Bar Chart hàng tuần */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '95px', paddingBottom: '4px' }}>
                      {[
                        { day: 'T2', km: isCalibrating ? '0' : '8.0', h: isCalibrating ? '0px' : '60px' },
                        { day: 'T3', km: isCalibrating ? '0' : '8.0', h: isCalibrating ? '0px' : '60px' },
                        { day: 'T4', km: isCalibrating ? '0' : '7.8', h: isCalibrating ? '0px' : '58px' },
                        { day: 'T5', km: isCalibrating ? '0' : '8.2', h: isCalibrating ? '0px' : '62px' },
                        { day: 'T6', km: isCalibrating ? '0' : '5.87', h: isCalibrating ? '0px' : '42px' },
                        { day: 'Sat', km: '0', h: '0px' },
                        { day: 'CN', km: '0', h: '0px' }
                      ].map(col => (
                        <div key={col.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                          <div style={{ width: '20px', height: '70px', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '3px' }}>
                            {parseFloat(col.km) > 0 && (
                              <div style={{
                                width: '100%',
                                height: col.h,
                                background: '#1E6F9F',
                                borderRadius: '3px'
                              }} />
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>{col.day}</span>
                        </div>
                      ))}
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
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', marginBottom: '10px' }}>
                    Giáo án bài tập sắp tới
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '6px 4px' }}>Ngày</th>
                        <th style={{ padding: '6px 4px' }}>Bài tập huấn luyện</th>
                        <th style={{ padding: '6px 4px' }}>Khối lượng</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right' }}>Tải dự kiến</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { day: 'Hôm nay', title: 'Phi nước đại tăng tốc (Gallop Sprint)', volume: '1.600m', load: '220 TL' },
                        { day: 'Hôm nay', title: 'Đi bộ máy & Ngâm lạnh chân', volume: '30 min', load: '20 TL' },
                        { day: 'Ngày mai', title: 'Tập xuất phát máy (Gate Drill)', volume: '6 lượt', load: '95 TL' },
                        { day: 'T4', title: 'Phi nước kiệu dẻo dai (Canter Tempo)', volume: '3.200m', load: '140 TL' }
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '6px 4px', color: '#94A3B8' }}>{item.day}</td>
                          <td style={{ padding: '6px 4px', color: '#F1F5F9', fontWeight: 600 }}>{item.title}</td>
                          <td style={{ padding: '6px 4px', color: '#94A3B8' }}>{item.volume}</td>
                          <td style={{ padding: '6px 4px', color: 'var(--brass)', fontWeight: 700, textAlign: 'right' }}>{item.load}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

          {activeSubTab === 'evolab' && (
            <div style={{ padding: '30px', textAlign: 'center', background: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: 'var(--brass)', fontSize: '16px', margin: '0 0 8px' }}>Chỉ Số Chuyên Sâu Sinh Lý Ngựa Đua EvoLab</h4>
              <p style={{ color: '#94A3B8', fontSize: '13px', maxWidth: '600px', margin: '0 auto' }}>
                Hệ thống đang tích hợp cảm biến viễn trắc đo nồng độ axit lactic trong máu sau khi cán đích, VO2Max ngựa đua (đạt chuẩn 160 ml/kg/min) và áp lực nhịp đập tim mạch theo thời gian thực.
              </p>
            </div>
          )}

          {activeSubTab === 'activities' && (
            <div style={{ padding: '30px', textAlign: 'center', background: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: 'var(--brass)', fontSize: '16px', margin: '0 0 8px' }}>Nhật Ký & Toàn Bộ Buổi Tập Của Chiến Mã</h4>
              <p style={{ color: '#94A3B8', fontSize: '13px', maxWidth: '600px', margin: '0 auto' }}>
                Toàn bộ dữ liệu telemetry từ thiết bị GPS gắn yên và đai đo nhịp tim của {horseName} được lưu trữ và mã hóa an toàn trên hệ thống.
              </p>
            </div>
          )}

          {activeSubTab === 'calendar' && (
            <div style={{ padding: '30px', textAlign: 'center', background: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: 'var(--brass)', fontSize: '16px', margin: '0 0 8px' }}>Lịch Huấn Luyện & Chu Kỳ Điểm Rơi Phong Độ</h4>
              <p style={{ color: '#94A3B8', fontSize: '13px', maxWidth: '600px', margin: '0 auto' }}>
                Kế hoạch phân bổ tải luyện tập trong tháng dành riêng cho {horseName} nhằm đạt điểm rơi phong độ cao nhất tại giải đấu sắp tới.
              </p>
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
