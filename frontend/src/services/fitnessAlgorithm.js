/**
 * Equine Telemetry & Exercise Physiology Algorithm Engine
 * Thuật toán viễn trắc thể lực & sinh lý vận động chiến mã đua
 * 
 * QUY TẮC NGHIỆP VỤ QUAN TRỌNG:
 * - Khi chủ sở hữu chiến mã vừa mới xin phục vụ / tiếp nhận, thông tin thể lực tàu ngựa CHƯA CÓ.
 * - Phải trải qua tối thiểu 3 bài tập (hoàn thành hoặc không hoàn thành) thì mới đủ dữ liệu
 *   viễn trắc để phân tích và đánh giá thể lực của ngựa (Tăng / Giảm, Tải ngắn/dài hạn, Phục hồi).
 */

const STORAGE_KEY = 'racehorse_fitness_telemetry';
export const REQUIRED_WORKOUTS_TO_EVALUATE = 3;

// Đếm số lượng bài tập của một chiến mã cụ thể
export function getHorseSessionCount(horseName, sessionsList = []) {
  if (!horseName) return 0;
  const clean = horseName.trim().toLowerCase();
  return (sessionsList || []).filter(s => (s.horseName || '').trim().toLowerCase() === clean).length;
}

// Kiểm tra xem chiến mã có đang trong giai đoạn chờ thu thập dữ liệu (dưới 3 bài tập) hay không
export function isHorseCalibrating(horse, sessionsList = []) {
  if (!horse) return false;
  // Nếu chiến mã được gắn cờ rõ ràng hoặc số bài tập dưới 3
  const count = getHorseSessionCount(horse.name || horse.horseName, sessionsList);
  return count < REQUIRED_WORKOUTS_TO_EVALUATE;
}

// Trả về dữ liệu gốc cho chiến mã dựa trên mã chip hoặc ID
export function getInitialHorseTelemetry(horse, sessionsList = []) {
  const name = horse.name || horse.horseName || 'Chiến mã';
  const workoutCount = getHorseSessionCount(name, sessionsList);
  const calibrating = workoutCount < REQUIRED_WORKOUTS_TO_EVALUATE;
  const remaining = Math.max(0, REQUIRED_WORKOUTS_TO_EVALUATE - workoutCount);

  if (calibrating) {
    return {
      horseId: horse.id,
      microchip: horse.microchip || 'MC-VN-2026-001',
      horseName: name,
      isCalibrating: true,
      workoutCount,
      requiredWorkouts: REQUIRED_WORKOUTS_TO_EVALUATE,
      remainingWorkouts: remaining,
      condition: 'Chờ đánh giá',
      conditionVal: 0,
      trend: 'CALIBRATING',
      trendPercent: `Cần ${remaining} bài tập`,
      shortTermLoad: '--',
      longTermLoad: '--',
      loadRatio: '--',
      recoveryPercent: 0,
      performanceToday: 0,
      avgHeartRate: '--',
      maxHeartRate: '--',
      restingHeartRate: 36,
      lactateThresholdHR: '--',
      maxSpeed: '--',
      sprintPower: 0,
      staminaScore: 0,
      speedThreshold: 0,
      racingSpeedScore: 0,
      sprintBurstScore: 0,
      weeklyDistance: 0,
      weeklyCompletionRate: 0,
      hrvMs: '--',
      status: 'CALIBRATING',
      lastSessionStatus: null,
      recentActivities: []
    };
  }

  // Đã có từ 3 bài tập trở lên -> Dữ liệu thể lực đầy đủ
  const baseCond = horse.condition && !isNaN(parseFloat(horse.condition)) ? parseFloat(horse.condition) : 88.5;
  const isReady = horse.status === 'READY';

  return {
    horseId: horse.id,
    microchip: horse.microchip || 'MC-VN-2026-001',
    horseName: name,
    isCalibrating: false,
    workoutCount,
    requiredWorkouts: REQUIRED_WORKOUTS_TO_EVALUATE,
    remainingWorkouts: 0,
    condition: baseCond,
    conditionVal: baseCond,
    trend: baseCond >= 85 ? 'INCREASING' : (baseCond >= 80 ? 'STABLE' : 'DECREASING'),
    trendPercent: baseCond >= 85 ? '+4.2%' : (baseCond >= 80 ? '+0.5%' : '-2.8%'),
    shortTermLoad: 107,
    longTermLoad: 99,
    loadRatio: 108,
    recoveryPercent: isReady ? 100 : 70,
    performanceToday: baseCond >= 85 ? 101 : 82,
    avgHeartRate: horse.avgHeartRate && !isNaN(parseInt(horse.avgHeartRate)) ? parseInt(horse.avgHeartRate) : 118,
    maxHeartRate: 205,
    restingHeartRate: 36,
    lactateThresholdHR: 178,
    maxSpeed: horse.maxSpeed && !isNaN(parseFloat(horse.maxSpeed)) ? parseFloat(horse.maxSpeed) : 64.5,
    sprintPower: (baseCond * 0.82).toFixed(1),
    staminaScore: (baseCond * 0.84).toFixed(1),
    speedThreshold: (baseCond * 0.83).toFixed(1),
    racingSpeedScore: (baseCond * 0.83).toFixed(1),
    sprintBurstScore: (baseCond * 0.83).toFixed(1),
    weeklyDistance: 37.87,
    weeklyCompletionRate: 100,
    hrvMs: 64,
    status: isReady ? 'READY' : 'OBSERVATION',
    lastSessionStatus: 'COMPLETED',
    recentActivities: [
      { icon: '🏇', day: 'Sat', name: 'Gallop Sprint 1.600m', dist: '1.60km', pace: '64.2 km/h (00\'56"/km)', load: '323 TL', status: 'COMPLETED' },
      { icon: '🐎', day: 'T6', name: 'Canter Tempo 3.200m', dist: '3.20km', pace: '51.5 km/h (01\'10"/km)', load: '145 TL', status: 'COMPLETED' },
      { icon: '🐴', day: 'T6', name: 'Đường cát Dirt 2.400m', dist: '2.40km', pace: '58.0 km/h (01\'02"/km)', load: '180 TL', status: 'COMPLETED' }
    ]
  };
}

// Lấy toàn bộ cache telemetry
export function getAllHorsesTelemetry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Lấy telemetry của 1 chiến mã cụ thể
export function getHorseFitnessTelemetry(horse, sessionsList = []) {
  if (!horse) return null;
  const key = horse.microchip || horse.id || horse.name;
  const all = getAllHorsesTelemetry();
  const base = getInitialHorseTelemetry(horse, sessionsList);

  if (all[key]) {
    // Nếu trong cache có nhưng sessions thực tế thay đổi
    return { ...base, ...all[key] };
  }
  return base;
}

/**
 * THUẬT TOÁN TÍNH TOÁN THỂ LỰC KHI GHI NHẬN BUỔI TẬP
 * 
 * Nếu chiến mã đang có dưới 3 bài tập:
 * - Ghi nhận thêm 1 bài tập.
 * - Nếu đạt mốc 3 bài tập -> KÍCH HOẠT TỔNG HỢP ĐÁNH GIÁ THỂ LỰC LẦN ĐẦU TIÊN!
 * 
 * Nếu đã có từ 3 bài tập trở lên:
 * - Cập nhật tăng/giảm thể lực dựa trên kết quả hoàn thành hay không hoàn thành.
 */
export function calculateHorseFitnessOnSession(horse, session, existingSessions = []) {
  const name = horse.name || horse.horseName || 'Chiến mã';
  const current = getHorseFitnessTelemetry(horse, existingSessions);
  const currentCount = current.workoutCount !== undefined ? current.workoutCount : getHorseSessionCount(name, existingSessions);
  const newCount = currentCount + 1;
  const isCompleted = session.status === 'COMPLETED';

  const distMeters = Number(session.distanceRun) || 1600;
  const avgSpeed = Number(session.avgSpeed) || (isCompleted ? 62.0 : 42.0);
  const maxHR = Number(session.maxHeartRate) || (isCompleted ? 202 : 220);
  const score = Number(session.score) || (isCompleted ? 8.5 : 5.0);

  // Tính Training Load của bài tập
  let sessionLoad = Math.round(
    (distMeters / 100) * Math.pow(avgSpeed / 50, 1.8) * (maxHR / 200) * (score / 10)
  );
  if (sessionLoad < 30) sessionLoad = isCompleted ? 120 : 40;

  const activityIcon = isCompleted ? (avgSpeed >= 60 ? '🏇' : '🐎') : '⚠️';
  const newActivityItem = {
    icon: activityIcon,
    day: 'Hôm nay',
    name: session.programTitle || (isCompleted ? 'Hoàn thành bài tập' : 'Chưa đạt bài tập'),
    dist: `${(distMeters / 1000).toFixed(2)}km`,
    pace: `${avgSpeed.toFixed(1)} km/h`,
    load: `${sessionLoad} TL`,
    status: isCompleted ? 'COMPLETED' : 'INCOMPLETE'
  };

  const updatedActivities = [newActivityItem, ...(current.recentActivities || []).filter(a => a.day !== 'Hôm nay').slice(0, 4)];

  // TRƯỜNG HỢP 1: VẪN CHƯA ĐỦ 3 BÀI TẬP (VÍ DỤ MỚI ĐƯỢC 1 HOẶC 2 BÀI)
  if (newCount < REQUIRED_WORKOUTS_TO_EVALUATE) {
    const remaining = REQUIRED_WORKOUTS_TO_EVALUATE - newCount;
    const updatedTelemetry = {
      ...current,
      workoutCount: newCount,
      isCalibrating: true,
      remainingWorkouts: remaining,
      condition: `Chờ đánh giá (${newCount}/3)`,
      trend: 'CALIBRATING',
      trendPercent: `Cần thêm ${remaining} bài tập`,
      shortTermLoad: sessionLoad,
      longTermLoad: '--',
      loadRatio: '--',
      recoveryPercent: isCompleted ? 80 : 35,
      performanceToday: isCompleted ? 95 : 70,
      avgHeartRate: Math.round(maxHR * 0.6),
      maxSpeed: avgSpeed,
      status: 'CALIBRATING',
      lastSessionStatus: session.status,
      recentActivities: updatedActivities,
      lastUpdated: new Date().toISOString()
    };

    saveTelemetryToCache(horse, updatedTelemetry);
    dispatchFitnessEvent(horse, updatedTelemetry, session);
    return updatedTelemetry;
  }

  // TRƯỜNG HỢP 2: ĐÃ ĐẠT ĐỦ TỪ 3 BÀI TẬP TRỞ LÊN -> TÍNH TOÁN ĐÁNH GIÁ ĐẦY ĐỦ!
  let baseCond = typeof current.condition === 'number' ? current.condition : 88.0;
  let newShortTerm = typeof current.shortTermLoad === 'number' ? current.shortTermLoad : 105;
  let newLongTerm = typeof current.longTermLoad === 'number' ? current.longTermLoad : 98;
  let newCondition, trend, trendPercent, newRecovery, newPerfToday, newStatus;

  if (isCompleted) {
    const delta = +(2.2 + (score / 10) * 2.3).toFixed(1);
    newCondition = Math.min(99, +(baseCond + delta).toFixed(1));
    newShortTerm = Math.round(newShortTerm * 0.85 + sessionLoad * 0.25);
    newLongTerm = Math.round(newLongTerm * 0.95 + sessionLoad * 0.08);
    newRecovery = Math.min(100, Math.max(70, Math.round(85 + (score - 8) * 5)));
    newPerfToday = Math.min(120, Math.round(100 + (score - 7.5) * 4));
    trend = 'INCREASING';
    trendPercent = `+${delta}%`;
    newStatus = 'READY';
  } else {
    const drop = +(3.5 + Math.random() * 1.8).toFixed(1);
    newCondition = Math.max(65, +(baseCond - drop).toFixed(1));
    newShortTerm = Math.max(80, Math.round(newShortTerm * 0.9 + 15));
    newLongTerm = Math.max(75, Math.round(newLongTerm - 2));
    newRecovery = Math.max(20, Math.round(35 - Math.random() * 10));
    newPerfToday = Math.max(68, Math.round(75 - Math.random() * 8));
    trend = 'DECREASING';
    trendPercent = `-${drop}%`;
    newStatus = newCondition < 80 ? 'OBSERVATION' : 'READY';
  }

  const newLoadRatio = Math.round((newShortTerm / Math.max(1, newLongTerm)) * 100);

  const updatedTelemetry = {
    ...current,
    workoutCount: newCount,
    isCalibrating: false,
    remainingWorkouts: 0,
    condition: newCondition,
    conditionVal: newCondition,
    trend,
    trendPercent,
    shortTermLoad: newShortTerm,
    longTermLoad: newLongTerm,
    loadRatio: newLoadRatio,
    recoveryPercent: newRecovery,
    performanceToday: newPerfToday,
    maxSpeed: Math.max(current.maxSpeed || 0, avgSpeed),
    avgHeartRate: Math.round(maxHR * 0.58),
    restingHeartRate: 36,
    lactateThresholdHR: 178,
    sprintPower: (newCondition * 0.82).toFixed(1),
    staminaScore: (newCondition * 0.84).toFixed(1),
    speedThreshold: (newCondition * 0.83).toFixed(1),
    racingSpeedScore: (newCondition * 0.83).toFixed(1),
    sprintBurstScore: (newCondition * 0.83).toFixed(1),
    hrvMs: isCompleted ? 65 : 48,
    weeklyDistance: 37.87,
    weeklyCompletionRate: isCompleted ? 100 : 75,
    status: newStatus,
    lastSessionStatus: session.status,
    recentActivities: updatedActivities,
    lastUpdated: new Date().toISOString()
  };

  saveTelemetryToCache(horse, updatedTelemetry);
  dispatchFitnessEvent(horse, updatedTelemetry, session);
  return updatedTelemetry;
}

function saveTelemetryToCache(horse, telemetry) {
  try {
    const all = getAllHorsesTelemetry();
    const key = horse.microchip || horse.id || horse.name;
    all[key] = telemetry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Lỗi lưu telemetry chiến mã:', err);
  }
}

function dispatchFitnessEvent(horse, telemetry, session) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('racehorse-fitness-updated', {
      detail: { horse, telemetry, session }
    }));
  }
}
