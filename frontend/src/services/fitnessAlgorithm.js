/**
 * Equine Telemetry & Exercise Physiology Algorithm Engine
 * Thuật toán viễn trắc thể lực & sinh lý vận động chiến mã đua chuyên sâu
 * 
 * QUY TẮC NGHIỆP VỤ & KHOA HỌC SINH LÝ HỌC:
 * 1. CHIẾN MÃ MỚI TIẾP NHẬN: Phải trải qua tối thiểu 3 bài tập (hoàn thành hoặc không hoàn thành)
 *    thì hệ thống mới bắt đầu kích hoạt tính toán và đưa ra các đánh giá thể lực toàn diện.
 * 2. KHI HOÀN THÀNH BÀI TẬP (COMPLETED):
 *    - Năng lực chạy & bứt tốc tăng trưởng dựa trên tốc độ và tải tập.
 *    - Tải ngắn hạn (ATL) và dài hạn (CTL) được tính toán theo mô hình Banister.
 *    - Hiệu suất 7 ngày được cập nhật ngay lập tức cho ngày hôm đó.
 *    - Thể trạng hồi phục sụt giảm tức thì theo cường độ bài tập, sau đó kích hoạt thuật toán
 *      hồi phục dần theo thời gian (Time-decay recovery half-life).
 *    - Ngưỡng Lactate (nhịp tim & pace) dịch chuyển tối ưu hóa.
 *    - Dự đoán thành tích cải thiện.
 *    - HRV sinh trắc giấc ngủ duy trì ngưỡng ổn định / sung mãn.
 * 3. KHI KHÔNG HOÀN THÀNH BÀI TẬP (INCOMPLETE / FAILED):
 *    - Bị phạt giảm điểm năng lực bứt tốc và thể lực do đuối sức / chấn thương / quá tải.
 *    - Tình trạng luyện tập chuyển sang cảnh báo mệt mỏi / quá tải.
 *    - Hiệu suất hôm đó giảm sâu (dưới 75%).
 *    - Mức hồi phục lập tức rơi xuống vùng thấp (15% - 35%) do tích tụ axit lactic và vi tổn thương cơ bắp;
 *      thời gian cần để hồi phục hoàn toàn kéo dài gấp đôi.
 *    - Dự đoán thành tích thụt lùi.
 *    - HRV buồng ngủ ban đêm sụt giảm (dưới 50ms) phản ánh stress thần kinh giao cảm.
 */

const STORAGE_KEY = 'racehorse_fitness_telemetry';
export const REQUIRED_WORKOUTS_TO_EVALUATE = 3;

// Đếm số lượng bài tập của chiến mã
export function getHorseSessionCount(horseName, sessionsList = []) {
  if (!horseName) return 0;
  const clean = horseName.trim().toLowerCase();
  return (sessionsList || []).filter(s => (s.horseName || '').trim().toLowerCase() === clean).length;
}

// Kiểm tra xem chiến mã có đang trong giai đoạn chờ thu thập dữ liệu (dưới 3 bài tập) hay không
export function isHorseCalibrating(horse, sessionsList = []) {
  if (!horse) return false;
  const count = getHorseSessionCount(horse.name || horse.horseName, sessionsList);
  return count < REQUIRED_WORKOUTS_TO_EVALUATE;
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

/**
 * 4. THUẬT TOÁN HỒI PHỤC THEO THỜI GIAN TRÔI QUA (TIME-DECAY RECOVERY ENGINE)
 * Công thức sinh lý học: Phục hồi theo hàm mũ phân rã mệt mỏi
 * Recovery(t) = 100 - (100 - InitialDrop) * e^(-elapsedHours / tau)
 */
export function computeCurrentDecayedRecovery(telemetry) {
  if (!telemetry || telemetry.isCalibrating) return 0;
  const lastTime = telemetry.lastSessionTimestamp ? new Date(telemetry.lastSessionTimestamp).getTime() : null;
  if (!lastTime || isNaN(lastTime)) {
    return telemetry.recoveryPercent || 85;
  }

  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastTime);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const initialDrop = Number(telemetry.postWorkoutInitialRecovery) || (telemetry.recoveryPercent || 70);
  const tau = Number(telemetry.recoveryTauHours) || 16; // Hằng số thời gian phục hồi (16h - 26h cho ngựa đua)

  // Tính phục hồi hiện tại theo thời gian thực
  const deficit = 100 - initialDrop;
  const currentRecovery = Math.min(100, Math.round(100 - deficit * Math.exp(-elapsedHours / tau)));

  return currentRecovery;
}

/**
 * 1. THUẬT TOÁN ĐÁNH GIÁ NĂNG LỰC CHẠY VÀ BỨT TỐC
 */
function calculateRunningAndSprintCapability(current, session, isCompleted) {
  const avgSpeed = Number(session.avgSpeed) || (isCompleted ? 63.5 : 42.0);
  const dist = Number(session.distanceRun) || 1600;
  const score = Number(session.score) || (isCompleted ? 8.5 : 5.0);

  let prevOverall = Number(current.sprintPower) || 74.6;
  let prevStamina = Number(current.staminaScore) || 74.7;
  let prevThreshold = Number(current.speedThreshold) || 73.8;
  let prevSpeed = Number(current.racingSpeedScore) || 73.8;
  let prevBurst = Number(current.sprintBurstScore) || 73.8;

  if (isCompleted) {
    const speedBonus = Math.max(0, (avgSpeed - 55) * 0.08);
    const scoreBonus = Math.max(0, (score - 7.5) * 0.25);
    const distBonus = (dist / 1600) * 0.2;
    const gain = +(speedBonus + scoreBonus + distBonus).toFixed(1);

    const newOverall = Math.min(95.0, +(prevOverall + gain).toFixed(1));
    const newStamina = Math.min(96.0, +(prevStamina + (dist >= 2000 ? 0.9 : 0.4) + scoreBonus * 0.5).toFixed(1));
    const newThreshold = Math.min(95.0, +(prevThreshold + (avgSpeed >= 60 ? 0.8 : 0.3) + scoreBonus * 0.5).toFixed(1));
    const newSpeed = Math.min(95.0, +(prevSpeed + (avgSpeed >= 62 ? 0.9 : 0.4)).toFixed(1));
    const newBurst = Math.min(96.0, +(prevBurst + (avgSpeed >= 64 ? 1.1 : 0.3)).toFixed(1));

    return {
      sprintPower: newOverall,
      staminaScore: newStamina,
      speedThreshold: newThreshold,
      racingSpeedScore: newSpeed,
      sprintBurstScore: newBurst,
      capabilityDelta: `+${gain}`
    };
  } else {
    // Không hoàn thành -> Sụt giảm chỉ số bứt tốc và sức bền
    const drop = +(1.8 + Math.random() * 1.5).toFixed(1);
    const newOverall = Math.max(55.0, +(prevOverall - drop).toFixed(1));
    const newStamina = Math.max(55.0, +(prevStamina - drop * 1.1).toFixed(1));
    const newThreshold = Math.max(55.0, +(prevThreshold - drop * 0.9).toFixed(1));
    const newSpeed = Math.max(55.0, +(prevSpeed - drop * 0.8).toFixed(1));
    const newBurst = Math.max(55.0, +(prevBurst - drop * 1.2).toFixed(1));

    return {
      sprintPower: newOverall,
      staminaScore: newStamina,
      speedThreshold: newThreshold,
      racingSpeedScore: newSpeed,
      sprintBurstScore: newBurst,
      capabilityDelta: `-${drop}`
    };
  }
}

/**
 * 2. THUẬT TOÁN TÌNH TRẠNG LUYỆN TẬP & TẢI TẬP (MÔ HÌNH BANISTER TÍCH HỢP)
 */
function calculateTrainingStatusAndLoad(current, sessionLoad, isCompleted) {
  let prevShort = Number(current.shortTermLoad) || 107;
  let prevLong = Number(current.longTermLoad) || 99;

  let newShort, newLong, statusText, statusBadge, explanation;

  if (isCompleted) {
    // Tải ngắn hạn phản ứng nhanh (Chu kỳ 7 ngày), tải dài hạn tích lũy bền vững (Chu kỳ 28 ngày)
    newShort = Math.round(prevShort * 0.82 + sessionLoad * 0.28);
    newLong = Math.round(prevLong * 0.94 + sessionLoad * 0.09);
    const ratio = Math.round((newShort / Math.max(1, newLong)) * 100);

    if (ratio >= 95 && ratio <= 118) {
      statusText = 'Tối ưu (Thể lực cải thiện nhanh)';
      statusBadge = 'TỐI ƯU';
      explanation = 'Chiến mã đã hoàn thành bài tập đều đặn trong tuần qua. Thể lực đang nhanh chóng được cải thiện, thích ứng hoàn hảo với giáo án huấn luyện.';
    } else if (ratio > 118 && ratio <= 135) {
      statusText = 'Hiệu quả (Tải tập tăng tốc)';
      statusBadge = 'HIỆU QUẢ';
      explanation = 'Khối lượng vận động ở mức cao. Cần theo dõi nhịp thở và bù khoáng để tránh căng cứng cơ sau các pha bứt tốc nước rút.';
    } else if (ratio > 135) {
      statusText = 'Cảnh báo quá tải (Cần hạ tải)';
      statusBadge = 'VƯỢT TẢI';
      explanation = 'Tải tập ngắn hạn vượt ngưỡng an toàn. Khuyến nghị Bác sĩ thú y kiểm tra gân móng và giảm cường độ bài tập tiếp theo.';
    } else {
      statusText = 'Duy trì thể lực';
      statusBadge = 'DUY TRÌ';
      explanation = 'Thể lực ở trạng thái ổn định. Cần tăng dần độ dài quãng đường chạy bứt tốc để kích thích tiến bộ thể lực.';
    }

    return { shortTermLoad: newShort, longTermLoad: newLong, loadRatio: ratio, statusText, statusBadge, explanation };
  } else {
    // Không hoàn thành -> Tải ngắn hạn tích tụ mệt mỏi, tải dài hạn sụt giảm
    newShort = Math.max(70, Math.round(prevShort * 0.9 + sessionLoad * 0.15 + 10));
    newLong = Math.max(70, Math.round(prevLong * 0.97 - 2));
    const ratio = Math.round((newShort / Math.max(1, newLong)) * 100);

    statusText = 'Không đạt bài tập (Mệt mỏi / Cần xả cơ)';
    statusBadge = 'MỆT MỎI';
    explanation = 'Chiến mã không hoàn thành trọn vẹn giáo án hôm nay do dấu hiệu quá sức hoặc nhịp tim tăng quá nhanh. Cần nghỉ ngơi và xoa bóp cơ bắp.';

    return { shortTermLoad: newShort, longTermLoad: newLong, loadRatio: ratio, statusText, statusBadge, explanation };
  }
}

/**
 * 3. THUẬT TOÁN HIỆU SUẤT BỨT TỐC 7 NGÀY
 */
export function calculate7DaySprintPerformance(current7Days = [], session = {}, isCompleted = true) {
  const avgSpeed = Number(session.avgSpeed) || (isCompleted ? 58.6 : 42.0);
  const score = Number(session.score) || (isCompleted ? 9.0 : 5.0);

  let todayPerf;
  if (isCompleted) {
    todayPerf = Math.min(125, Math.max(90, Math.round(100 + (avgSpeed - 60) * 1.5 + (score - 8) * 4)));
    if (todayPerf < 98) todayPerf = 102;
  } else {
    todayPerf = Math.max(50, Math.min(78, Math.round(70 - Math.random() * 8)));
  }

  // Đẩy lịch sử 7 ngày trượt: [T3, T4, T5, T6, Sat, CN, Hôm nay]
  const defaultHistory = [0, 0, 0, 0, 0, 0, 0];
  const prevList = Array.isArray(current7Days) && current7Days.length === 7 
    ? current7Days.slice(1, 6) 
    : [0, 0, 0, 0, 0];
  const yesterdayVal = (Array.isArray(current7Days) && current7Days.length === 7) ? (current7Days[5] || 0) : 0;
  const updated7Days = [
    ...prevList,
    yesterdayVal,
    todayPerf
  ];

  const rating = todayPerf >= 100 ? 'Xuất sắc' : (todayPerf >= 90 ? 'Tốt' : (todayPerf >= 75 ? 'Trung bình' : 'Cần phục hồi'));

  return { performanceToday: todayPerf, performanceRating: rating, performanceHistory7Days: updated7Days };
}

/**
 * 4. THUẬT TOÁN HỒI PHỤC VÀ DỰ BÁO THỜI GIAN PHỤC HỒI HOÀN TOÀN
 */
function calculateRecoveryAndDecayParams(sessionLoad, isCompleted) {
  let initialDropPercent, tauHours, hoursTo100Percent;

  if (isCompleted) {
    if (sessionLoad >= 260) {
      initialDropPercent = Math.round(40 + Math.random() * 12); // Tải rất nặng -> tụt còn 40-52%
      tauHours = 20; // 20 giờ phân rã
      hoursTo100Percent = 36;
    } else if (sessionLoad >= 150) {
      initialDropPercent = Math.round(60 + Math.random() * 10); // Tải vừa -> tụt còn 60-70%
      tauHours = 14;
      hoursTo100Percent = 24;
    } else {
      initialDropPercent = Math.round(78 + Math.random() * 10); // Tải nhẹ -> 78-88%
      tauHours = 8;
      hoursTo100Percent = 12;
    }
  } else {
    // Không hoàn thành -> Cạn kiệt năng lượng / Cơ bắp căng thẳng
    initialDropPercent = Math.round(20 + Math.random() * 12); // Tụt còn 20-32%
    tauHours = 26; // Cần thời gian lâu gấp rưỡi để đào thải lactic
    hoursTo100Percent = 48;
  }

  const nowIso = new Date().toISOString();

  return {
    recoveryPercent: initialDropPercent,
    postWorkoutInitialRecovery: initialDropPercent,
    recoveryTauHours: tauHours,
    hoursTo100Percent,
    lastSessionTimestamp: nowIso
  };
}

/**
 * 5. THUẬT TOÁN VÙNG NHỊP TIM THEO NGƯỠNG LACTATE CHIẾN MÃ
 */
function calculateLactateHeartRateZones(fitnessCondition, isCompleted) {
  const cond = Math.max(60, Math.min(100, Number(fitnessCondition) || 88));
  // Chiến mã càng khỏe, nhịp tim nghỉ càng giảm (32-38 bpm), ngưỡng Lactate V4 càng cao (172-184 bpm)
  const restingHR = Math.round(44 - (cond / 100) * 10); // 34 - 38 bpm
  const ltHR = isCompleted 
    ? Math.round(172 + ((cond - 75) / 25) * 8) 
    : 168; // 172 - 180 bpm
  const maxHR = Math.round(205 + ((cond - 75) / 25) * 8); // 205 - 213 bpm

  return {
    restingHeartRate: restingHR,
    lactateThresholdHR: ltHR,
    maxHeartRate: maxHR,
    hrZones: [
      { name: 'Hồi phục & Đi bộ (Walk)', range: `< ${restingHR + 70} bpm`, dot: '#00E5FF' },
      { name: 'Sức bền hiếu khí đường trường', range: `${restingHR + 71} - ${ltHR - 28} bpm`, dot: '#10B981' },
      { name: 'Sức mạnh nhịp đều (Canter Tempo)', range: `${ltHR - 27} - ${ltHR - 5} bpm`, dot: '#22C55E' },
      { name: 'Ngưỡng Lactate bứt phá', range: `${ltHR - 4} - ${ltHR + 12} bpm`, dot: '#EAB308' },
      { name: 'Sức bền kỵ khí tăng tốc', range: `${ltHR + 13} - ${maxHR - 5} bpm`, dot: '#F97316' },
      { name: 'Nước rút đỉnh (Max Sprint Burst)', range: `> ${maxHR - 5} bpm`, dot: '#EF4444' }
    ]
  };
}

/**
 * 6. THUẬT TOÁN VÙNG TỐC ĐỘ / PACE THEO NGƯỠNG LACTATE
 */
function calculateLactateSpeedZones(fitnessCondition, maxSpeed) {
  const cond = Math.max(60, Math.min(100, Number(fitnessCondition) || 88));
  const baseLtSpeed = +(56.0 + ((cond - 70) / 30) * 9.5).toFixed(1); // 56.0 - 65.5 km/h
  const basePaceSec = Math.round(3600 / baseLtSpeed);
  const minPart = Math.floor(basePaceSec / 60);
  const secPart = basePaceSec % 60;
  const ltPaceStr = `${baseLtSpeed} km/h (0${minPart}'${secPart < 10 ? '0' : ''}${secPart}"/km)`;

  return {
    ltSpeedKmh: baseLtSpeed,
    ltPaceDisplay: ltPaceStr,
    speedZones: [
      { name: 'Đi bộ hồi phục (Walk)', range: '< 15 km/h', dot: '#00E5FF' },
      { name: 'Phi nước kiệu nhẹ (Trot)', range: '15 - 35 km/h', dot: '#10B981' },
      { name: 'Phi nước kiệu đều (Canter)', range: '36 - 52 km/h', dot: '#22C55E' },
      { name: 'Ngưỡng tốc độ đua (Race Gallop)', range: `53 - ${Math.round(baseLtSpeed)} km/h`, dot: '#EAB308' },
      { name: 'Tốc độ tăng tốc nước rút', range: `${Math.round(baseLtSpeed) + 1} - 70 km/h`, dot: '#F97316' },
      { name: 'Nước rút xé gió cực đại', range: '> 70 km/h', dot: '#EF4444' }
    ]
  };
}

/**
 * 7. THUẬT TOÁN DỰ ĐOÁN THÀNH TÍCH THI ĐẤU CÁC CỰ LY (1.200M, 1.600M, 2.000M, 2.400M)
 * Dựa trên định luật lũy thừa Riegel điều chỉnh theo sinh trắc bứt tốc chiến mã
 */
function calculateRacePredictions(fitnessCondition, sprintBurstScore, isCompleted) {
  const cond = Math.max(60, Math.min(100, Number(fitnessCondition) || 88));
  const burst = Math.max(60, Math.min(100, Number(sprintBurstScore) || 75));

  // Hệ số phong độ: càng cao chạy càng nhanh
  const speedFactor = 1 + ((cond - 80) * 0.005) + ((burst - 75) * 0.004) + (isCompleted ? 0.015 : -0.035);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1.200m: Chuẩn quốc tế ~ 69.5s
  const t1200Sec = Math.max(66.0, +(69.8 / speedFactor).toFixed(1));
  const s1200Kmh = +((1.2 / (t1200Sec / 3600))).toFixed(1);

  // 1.600m Mile: Chuẩn quốc tế ~ 94.0s
  const t1600Sec = Math.max(91.0, +(94.5 / speedFactor).toFixed(1));
  const s1600Kmh = +((1.6 / (t1600Sec / 3600))).toFixed(1);

  // 2.000m Classic: Chuẩn ~ 119.5s
  const t2000Sec = Math.max(116.0, +(120.2 / speedFactor).toFixed(1));
  const s2000Kmh = +((2.0 / (t2000Sec / 3600))).toFixed(1);

  // 2.400m Derby: Chuẩn ~ 146.0s
  const t2400Sec = Math.max(141.0, +(147.0 / speedFactor).toFixed(1));
  const s2400Kmh = +((2.4 / (t2400Sec / 3600))).toFixed(1);

  return [
    { dist: '1.200m (Sprint Cup)', time: formatTime(t1200Sec), pace: `${s1200Kmh} km/h` },
    { dist: '1.600m (Tiêu chuẩn Mile)', time: formatTime(t1600Sec), pace: `${s1600Kmh} km/h` },
    { dist: '2.000m (Cúp Quốc Gia)', time: formatTime(t2000Sec), pace: `${s2000Kmh} km/h` },
    { dist: '2.400m (Vô Địch Derby)', time: formatTime(t2400Sec), pace: `${s2400Kmh} km/h` }
  ];
}

/**
 * 8. THUẬT TOÁN HRV SINH TRẮC VÀ GIẤC NGỦ Ô CHUỒNG
 */
function calculateNocturnalHRVAndSleep(recoveryPercent, isCompleted) {
  const rec = Math.max(10, Math.min(100, Number(recoveryPercent) || 75));

  // HRV rMSSD ban đêm: Chuẩn ngựa đua từ 50-80 ms
  let hrvMs;
  let statusText;
  let desc;

  if (isCompleted) {
    hrvMs = Math.round(58 + (rec / 100) * 20); // 64 - 78 ms
    statusText = rec >= 80 ? 'Tối ưu (Sung mãn)' : 'Bình thường';
    desc = 'Chỉ số biến thiên nhịp tim HRV của chiến mã trong chuồng đạt mức lý tưởng. Hệ thần kinh giao cảm thư giãn hoàn toàn, sẵn sàng tiếp nhận bài tập cường độ cao.';
  } else {
    hrvMs = Math.round(40 + Math.random() * 10); // 40 - 50 ms (căng thẳng cơ bắp)
    statusText = 'Thấp (Cần phục hồi)';
    desc = 'HRV ban đêm sụt giảm đáng kể sau bài tập không đạt. Dấu hiệu hệ thần kinh thực vật đang chịu tải nặng, chiến mã cần ngủ sâu và bổ sung điện giải ô chuồng.';
  }

  const hrvHistory = [
    Math.round(hrvMs * 0.95),
    Math.round(hrvMs * 0.92),
    Math.round(hrvMs * 0.98),
    Math.round(hrvMs * 0.94),
    Math.round(hrvMs * 0.97),
    Math.round(hrvMs * 0.96),
    hrvMs
  ];

  return { hrvMs, hrvStatus: statusText, hrvDesc: desc, hrvHistory };
}

export function parseSessionDate(session) {
  if (!session) return new Date();
  if (session.timestamp) return new Date(session.timestamp);
  if (session.id && typeof session.id === 'number' && session.id > 1700000000000) return new Date(session.id);
  if (session.time) {
    const parts = session.time.split(/[\s,]+/);
    for (const p of parts) {
      if (p.includes('/')) {
        const [d, m, y] = p.split('/').map(Number);
        if (d && m && y) return new Date(y, m - 1, d);
      }
    }
  }
  return new Date();
}

export function getLast7DayLabels(refDate = new Date()) {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'Sat'];
  const result = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    result.push(dayNames[d.getDay()]);
  }
  result.push('Hôm nay');
  return result;
}

export function calculateWeeklyDistributionAndTotals(horseName, sessionsList = [], todaySession = null) {
  const dayKeys = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'Sat'];
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0: CN, 1: T2, 2: T3...
  const todayKey = dayKeys[currentDayOfWeek];
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'Sat', 'CN'];
  const currentDayIdx = weekDays.indexOf(todayKey);

  const dist = { T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, Sat: 0, CN: 0 };
  const monday = new Date(now);
  const diffToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek;
  monday.setDate(monday.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const name = (horseName || '').toLowerCase();
  const allSess = todaySession ? [todaySession, ...(sessionsList || [])] : (sessionsList || []);
  const seenIds = new Set();
  let completedCount = 0;
  let totalSessThisWeek = 0;

  for (const s of allSess) {
    if ((s.horseName || '').toLowerCase() !== name) continue;
    if (s.id && seenIds.has(s.id)) continue;
    if (s.id) seenIds.add(s.id);

    const sDate = parseSessionDate(s);
    if (sDate >= monday && sDate <= now) {
      const sDayKey = dayKeys[sDate.getDay()];
      if (dist[sDayKey] !== undefined) {
        const km = Number(s.distanceRun) ? Number(s.distanceRun) / 1000 : 1.0;
        dist[sDayKey] = +(dist[sDayKey] + km).toFixed(2);
        totalSessThisWeek++;
        if (s.status === 'COMPLETED') completedCount++;
      }
    }
  }

  // Nếu có buổi tập hôm nay hoặc vừa mới tập xong 1 bài tập trong hôm nay:
  if (todaySession && dist[todayKey] === 0) {
    const km = Number(todaySession.distanceRun) ? Number(todaySession.distanceRun) / 1000 : 1.0;
    dist[todayKey] = +km.toFixed(2);
    totalSessThisWeek++;
    if (todaySession.status === 'COMPLETED') completedCount++;
  }

  // Các ngày trong tương lai của tuần này BẮT BUỘC bằng 0 (ví dụ hôm nay là Thứ 3 thì T4, T5, T6, Sat, CN phải là 0)
  for (let i = currentDayIdx + 1; i < weekDays.length; i++) {
    dist[weekDays[i]] = 0;
  }

  const weeklyDistance = +(Object.values(dist).reduce((a, b) => a + b, 0)).toFixed(1);
  const weeklyCompletionRate = totalSessThisWeek > 0 
    ? Math.round((completedCount / totalSessThisWeek) * 100) 
    : 0;

  return { weeklyDistribution: dist, weeklyDistance, weeklyCompletionRate };
}

export function getHorse7DaySprintHistory(horseName, sessionsList = [], todaySession = null) {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'Sat'];
  const now = new Date();
  const labels = [];
  const history = [0, 0, 0, 0, 0, 0, 0];

  for (let i = 6; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(dayNames[d.getDay()]);
  }
  labels.push('Hôm nay');

  const name = (horseName || '').toLowerCase();

  // Tìm session hôm nay từ todaySession hoặc từ sessionsList
  let activeTodaySession = todaySession;
  if (!activeTodaySession) {
    activeTodaySession = (sessionsList || []).find(s => {
      if ((s.horseName || '').toLowerCase() !== name) return false;
      const sDate = parseSessionDate(s);
      return sDate.toDateString() === now.toDateString();
    });
  }

  let todayPerf = 0;
  if (activeTodaySession) {
    const avgSpeed = Number(activeTodaySession.avgSpeed) || 58.6;
    const score = Number(activeTodaySession.score) || 9.0;
    const isCompleted = activeTodaySession.status === 'COMPLETED';
    if (isCompleted) {
      todayPerf = Math.min(125, Math.max(90, Math.round(100 + (avgSpeed - 60) * 1.5 + (score - 8) * 4)));
      if (todayPerf < 98) todayPerf = 102;
    } else {
      todayPerf = Math.max(50, Math.min(78, Math.round(70 - Math.random() * 8)));
    }
  }
  history[6] = todayPerf;

  for (const s of (sessionsList || [])) {
    if ((s.horseName || '').toLowerCase() !== name) continue;
    if (activeTodaySession && s.id === activeTodaySession.id) continue;
    const sDate = parseSessionDate(s);
    const diffDays = Math.round((now - sDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1 && diffDays <= 6) {
      const idx = 6 - diffDays;
      const spd = Number(s.avgSpeed) || 58.6;
      const sc = Number(s.score) || 8.5;
      const p = Math.min(125, Math.max(80, Math.round(100 + (spd - 60) * 1.5 + (sc - 8) * 4)));
      history[idx] = p;
    }
  }

  const rating = todayPerf > 0 
    ? (todayPerf >= 100 ? 'Xuất sắc' : (todayPerf >= 90 ? 'Tốt' : 'Cần phục hồi'))
    : 'Chờ bài tập';

  return { dayLabels: labels, history, performanceToday: todayPerf, performanceRating: rating };
}

export function getDefaultWeeklyDistribution() {
  const res = calculateWeeklyDistributionAndTotals('Chiến mã', []);
  return res.weeklyDistribution;
}

/**
 * KHỞI TẠO TELEMETRY GỐC DỰA TRÊN TRẠNG THÁI CHIẾN MÃ
 */
export function getInitialHorseTelemetry(horse, sessionsList = []) {
  const name = horse.name || horse.horseName || 'Chiến mã';
  const workoutCount = getHorseSessionCount(name, sessionsList);
  const calibrating = workoutCount < REQUIRED_WORKOUTS_TO_EVALUATE;
  const remaining = Math.max(0, REQUIRED_WORKOUTS_TO_EVALUATE - workoutCount);

  const weeklyData = calculateWeeklyDistributionAndTotals(name, sessionsList);
  const sprintData = getHorse7DaySprintHistory(name, sessionsList);

  // Khởi tạo hoạt động gần đây từ sessionsList nếu có
  const horseSessions = (sessionsList || []).filter(s => (s.horseName || '').toLowerCase() === name.toLowerCase());
  let initActivities = [];
  if (horseSessions.length > 0) {
    initActivities = horseSessions.slice(0, 8).map(s => {
      const distM = Number(s.distanceRun) || 1000;
      const spd = Number(s.avgSpeed) || 58.6;
      const isComp = s.status === 'COMPLETED';
      let ld = Math.round((distM / 100) * Math.pow(spd / 50, 1.8) * 0.95);
      if (ld < 30 || (distM === 1000 && isComp)) ld = 120;
      return {
        id: s.id || Math.random(),
        icon: isComp ? (spd >= 58 ? '🏇' : '🐎') : '⚠️',
        day: 'Hôm nay',
        name: s.programTitle || (isComp ? 'Hoàn thành bài tập' : 'Chưa đạt bài tập'),
        dist: `${(distM / 1000).toFixed(2)}km`,
        pace: `${spd.toFixed(1)} km/h`,
        load: `${ld} TL`,
        status: s.status || 'COMPLETED'
      };
    });
  } else {
    initActivities = [];
  }

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
      recoveryPercent: 85,
      hoursTo100Percent: 0,
      performanceToday: sprintData.performanceToday,
      performanceRating: sprintData.performanceRating,
      performanceHistory7Days: sprintData.history,
      dayLabels: sprintData.dayLabels,
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
      weeklyDistance: weeklyData.weeklyDistance,
      weeklyCompletionRate: weeklyData.weeklyCompletionRate,
      weeklyDistribution: weeklyData.weeklyDistribution,
      hrvMs: '--',
      hrvStatus: 'Đang thu thập',
      hrvHistory: [0, 0, 0, 0, 0, 0, 0],
      status: 'CALIBRATING',
      lastSessionStatus: null,
      recentActivities: initActivities
    };
  }

  // Đã có từ 3 bài tập trở lên -> Khởi tạo đầy đủ 8 chỉ số theo thể trạng
  const baseCond = horse.condition && !isNaN(parseFloat(horse.condition)) ? parseFloat(horse.condition) : 90.0;
  const isReady = horse.status === 'READY';
  const maxSpeed = horse.maxSpeed && !isNaN(parseFloat(horse.maxSpeed)) ? parseFloat(horse.maxSpeed) : 64.5;

  const hrZonesData = calculateLactateHeartRateZones(baseCond, true);
  const speedZonesData = calculateLactateSpeedZones(baseCond, maxSpeed);
  const predictions = calculateRacePredictions(baseCond, baseCond * 0.83, true);
  const hrvData = calculateNocturnalHRVAndSleep(isReady ? 95 : 70, true);

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
    statusBadge: 'TỐI ƯU',
    statusText: 'Tối ưu (Thể lực cải thiện nhanh)',
    explanation: 'Chiến mã đã tập luyện thường xuyên trong 7 ngày qua và thể lực đang nhanh chóng được cải thiện. Thích ứng tối đa với giáo án.',
    recoveryPercent: isReady ? 100 : 70,
    postWorkoutInitialRecovery: isReady ? 95 : 70,
    recoveryTauHours: 16,
    hoursTo100Percent: isReady ? 0 : 8,
    lastSessionTimestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6h trước
    performanceToday: sprintData.performanceToday,
    performanceRating: sprintData.performanceRating,
    performanceHistory7Days: sprintData.history,
    dayLabels: sprintData.dayLabels,
    avgHeartRate: horse.avgHeartRate && !isNaN(parseInt(horse.avgHeartRate)) ? parseInt(horse.avgHeartRate) : 118,
    maxHeartRate: hrZonesData.maxHeartRate,
    restingHeartRate: hrZonesData.restingHeartRate,
    lactateThresholdHR: hrZonesData.lactateThresholdHR,
    hrZones: hrZonesData.hrZones,
    maxSpeed,
    ltSpeedKmh: speedZonesData.ltSpeedKmh,
    ltPaceDisplay: speedZonesData.ltPaceDisplay,
    speedZones: speedZonesData.speedZones,
    sprintPower: +(baseCond * 0.82).toFixed(1),
    staminaScore: +(baseCond * 0.84).toFixed(1),
    speedThreshold: +(baseCond * 0.83).toFixed(1),
    racingSpeedScore: +(baseCond * 0.83).toFixed(1),
    sprintBurstScore: +(baseCond * 0.83).toFixed(1),
    racePredictions: predictions,
    weeklyDistance: weeklyData.weeklyDistance,
    weeklyCompletionRate: weeklyData.weeklyCompletionRate,
    weeklyDistribution: weeklyData.weeklyDistribution,
    hrvMs: hrvData.hrvMs,
    hrvStatus: hrvData.hrvStatus,
    hrvDesc: hrvData.hrvDesc,
    hrvHistory: hrvData.hrvHistory,
    status: isReady ? 'READY' : 'OBSERVATION',
    lastSessionStatus: 'COMPLETED',
    recentActivities: initActivities
  };
}

// Lấy telemetry của 1 chiến mã cụ thể, tự động kích hoạt tính toán phân rã thời gian hồi phục
export function getHorseFitnessTelemetry(horse, sessionsList = []) {
  if (!horse) return null;
  const name = horse.name || horse.horseName || 'Chiến mã';
  const key = horse.microchip || horse.id || horse.name;
  const all = getAllHorsesTelemetry();
  const base = getInitialHorseTelemetry(horse, sessionsList);

  let merged = all[key] ? { ...base, ...all[key] } : base;

  // Luôn tái đồng bộ các chỉ số theo thời gian thực chuẩn của ngày hôm nay
  const weeklyData = calculateWeeklyDistributionAndTotals(name, sessionsList);
  merged.weeklyDistribution = weeklyData.weeklyDistribution;
  merged.weeklyDistance = weeklyData.weeklyDistance;
  merged.weeklyCompletionRate = weeklyData.weeklyCompletionRate;

  const sprintData = getHorse7DaySprintHistory(name, sessionsList);
  merged.dayLabels = sprintData.dayLabels;
  merged.performanceHistory7Days = sprintData.history;
  merged.performanceToday = sprintData.performanceToday;
  merged.performanceRating = sprintData.performanceRating;

  // Tính lại phục hồi thực tế theo thời gian đã trôi qua
  if (!merged.isCalibrating && merged.lastSessionTimestamp) {
    const liveRecovery = computeCurrentDecayedRecovery(merged);
    merged.recoveryPercent = liveRecovery;
  }

  return merged;
}

/**
 * THUẬT TOÁN TÍNH TOÁN TOÀN DIỆN KHI VỪA XONG BÀI TẬP (HOÀN THÀNH HOẶC KHÔNG HOÀN THÀNH)
 * Cập nhật đồng loạt 8 chiều kích sinh lý vận động ngay lập tức!
 */
export function calculateHorseFitnessOnSession(horse, session, existingSessions = []) {
  const name = horse.name || horse.horseName || 'Chiến mã';
  const current = getHorseFitnessTelemetry(horse, existingSessions);
  const currentCount = current.workoutCount !== undefined ? current.workoutCount : getHorseSessionCount(name, existingSessions);
  const newCount = currentCount + 1;
  const isCompleted = session.status === 'COMPLETED';

  const distMeters = Number(session.distanceRun) || 1000;
  const avgSpeed = Number(session.avgSpeed) || (isCompleted ? 58.6 : 42.0);
  const maxHR = Number(session.maxHeartRate) || (isCompleted ? 196 : 222);
  const score = Number(session.score) || (isCompleted ? 9.0 : 5.0);

  // 1. Tính toán Training Load của buổi tập (TL)
  let sessionLoad = Math.round(
    (distMeters / 100) * Math.pow(avgSpeed / 50, 1.8) * (maxHR / 200) * (score / 10)
  );
  if (sessionLoad < 30 || (distMeters === 1000 && isCompleted)) sessionLoad = 120;

  const activityIcon = isCompleted ? (avgSpeed >= 58 ? '🏇' : '🐎') : '⚠️';
  const newActivityItem = {
    id: session.id || Date.now(),
    icon: activityIcon,
    day: 'Hôm nay',
    name: session.programTitle || (isCompleted ? 'Hoàn thành bài tập' : 'Chưa đạt bài tập'),
    dist: `${(distMeters / 1000).toFixed(2)}km`,
    pace: `${avgSpeed.toFixed(1)} km/h`,
    load: `${sessionLoad} TL`,
    status: isCompleted ? 'COMPLETED' : 'INCOMPLETE',
    timestamp: Date.now()
  };

  const prevActivities = Array.isArray(current.recentActivities) ? current.recentActivities : [];
  const updatedActivities = [newActivityItem, ...prevActivities.filter(a => a.id !== newActivityItem.id).slice(0, 8)];

  // 2. Tính toán Hiệu suất bứt tốc 7 ngày (Thời gian thực)
  const sprintData = getHorse7DaySprintHistory(name, existingSessions, session);

  // 3. Phân bố chạy tuần này (Thời gian thực)
  const weeklyData = calculateWeeklyDistributionAndTotals(name, existingSessions, session);

  // GIAI ĐOẠN ĐANG HIỆU CHUẨN (DƯỚI 3 BÀI TẬP)
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
      recoveryPercent: isCompleted ? 88 : 45,
      performanceToday: sprintData.performanceToday,
      performanceRating: sprintData.performanceRating,
      performanceHistory7Days: sprintData.history,
      dayLabels: sprintData.dayLabels,
      avgHeartRate: Math.round(maxHR * 0.58),
      maxSpeed: avgSpeed,
      weeklyDistance: weeklyData.weeklyDistance,
      weeklyCompletionRate: weeklyData.weeklyCompletionRate,
      weeklyDistribution: weeklyData.weeklyDistribution,
      status: 'CALIBRATING',
      lastSessionStatus: session.status,
      recentActivities: updatedActivities,
      lastUpdated: new Date().toISOString()
    };

    saveTelemetryToCache(horse, updatedTelemetry);
    dispatchFitnessEvent(horse, updatedTelemetry, session);
    return updatedTelemetry;
  }

  // GIAI ĐOẠN ĐÃ TÍCH LŨY TỪ 3 BÀI TẬP TRỞ LÊN -> CHẠY TOÀN BỘ 8 THUẬT TOÁN CHUYÊN SÂU!

  // 1. Năng lực chạy và bứt tốc
  const capabilityData = calculateRunningAndSprintCapability(current, session, isCompleted);

  // 2. Tình trạng luyện tập & Tải ngắn/dài hạn Banister
  const trainingStatusData = calculateTrainingStatusAndLoad(current, sessionLoad, isCompleted);

  // 4. Hồi phục thể trạng & Thuật toán phân rã theo thời gian
  const recoveryData = calculateRecoveryAndDecayParams(sessionLoad, isCompleted);

  // 5. Vùng nhịp tim theo ngưỡng Lactate
  let baseCond = typeof current.condition === 'number' ? current.condition : 88.0;
  let newCondition, trend, trendPercent, newStatus;

  if (isCompleted) {
    const delta = +(2.0 + (score / 10) * 2.2).toFixed(1);
    newCondition = Math.min(99.0, +(baseCond + delta).toFixed(1));
    trend = 'INCREASING';
    trendPercent = `+${delta}%`;
    newStatus = 'READY';
  } else {
    const drop = +(3.2 + Math.random() * 1.6).toFixed(1);
    newCondition = Math.max(62.0, +(baseCond - drop).toFixed(1));
    trend = 'DECREASING';
    trendPercent = `-${drop}%`;
    newStatus = newCondition < 80 ? 'OBSERVATION' : 'READY';
  }

  const heartRateData = calculateLactateHeartRateZones(newCondition, isCompleted);

  // 6. Vùng tốc độ theo ngưỡng Lactate
  const newMaxSpeed = Math.max(current.maxSpeed || 0, avgSpeed);
  const speedZonesData = calculateLactateSpeedZones(newCondition, newMaxSpeed);

  // 7. Dự đoán thành tích thi đấu sắp tới
  const racePredictions = calculateRacePredictions(newCondition, capabilityData.sprintBurstScore, isCompleted);

  // 8. HRV sinh trắc & Giấc ngủ ô chuồng
  const hrvData = calculateNocturnalHRVAndSleep(recoveryData.recoveryPercent, isCompleted);

  const updatedTelemetry = {
    ...current,
    workoutCount: newCount,
    isCalibrating: false,
    remainingWorkouts: 0,
    condition: newCondition,
    conditionVal: newCondition,
    trend,
    trendPercent,
    status: newStatus,
    lastSessionStatus: session.status,

    // 1. Năng lực chạy & bứt tốc
    sprintPower: capabilityData.sprintPower,
    staminaScore: capabilityData.staminaScore,
    speedThreshold: capabilityData.speedThreshold,
    racingSpeedScore: capabilityData.racingSpeedScore,
    sprintBurstScore: capabilityData.sprintBurstScore,
    capabilityDelta: capabilityData.capabilityDelta,

    // 2. Tình trạng luyện tập
    shortTermLoad: trainingStatusData.shortTermLoad,
    longTermLoad: trainingStatusData.longTermLoad,
    loadRatio: trainingStatusData.loadRatio,
    statusBadge: trainingStatusData.statusBadge,
    statusText: trainingStatusData.statusText,
    explanation: trainingStatusData.explanation,

    // 3. Hiệu suất 7 ngày
    performanceToday: sprintData.performanceToday,
    performanceRating: sprintData.performanceRating,
    performanceHistory7Days: sprintData.history,
    dayLabels: sprintData.dayLabels,

    // 4. Hồi phục thể trạng & thời gian phân rã
    recoveryPercent: recoveryData.recoveryPercent,
    postWorkoutInitialRecovery: recoveryData.postWorkoutInitialRecovery,
    recoveryTauHours: recoveryData.recoveryTauHours,
    hoursTo100Percent: recoveryData.hoursTo100Percent,
    lastSessionTimestamp: recoveryData.lastSessionTimestamp,

    // 5. Vùng nhịp tim Lactate
    avgHeartRate: Math.round(maxHR * 0.58),
    restingHeartRate: heartRateData.restingHeartRate,
    lactateThresholdHR: heartRateData.lactateThresholdHR,
    maxHeartRate: heartRateData.maxHeartRate,
    hrZones: heartRateData.hrZones,

    // 6. Vùng tốc độ Lactate
    maxSpeed: newMaxSpeed,
    ltSpeedKmh: speedZonesData.ltSpeedKmh,
    ltPaceDisplay: speedZonesData.ltPaceDisplay,
    speedZones: speedZonesData.speedZones,

    // 7. Dự đoán thành tích
    racePredictions,

    // 8. HRV & Giấc ngủ
    hrvMs: hrvData.hrvMs,
    hrvStatus: hrvData.hrvStatus,
    hrvDesc: hrvData.hrvDesc,
    hrvHistory: hrvData.hrvHistory,

    weeklyDistance: weeklyData.weeklyDistance,
    weeklyCompletionRate: weeklyData.weeklyCompletionRate,
    weeklyDistribution: weeklyData.weeklyDistribution,
    recentActivities: updatedActivities,
    lastUpdated: new Date().toISOString()
  };

  saveTelemetryToCache(horse, updatedTelemetry);
  dispatchFitnessEvent(horse, updatedTelemetry, session);
  return updatedTelemetry;
}

function saveTelemetryToCache(horse, telemetry) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
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
