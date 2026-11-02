import React from 'react';

/**
 * EquineRecoveryIcon - Biểu tượng trạng thái thể lực chiến mã biến đổi động theo % Recovery
 * 
 * 1. KHỎE MẠNH / SUNG MÃN (Recovery >= 85%):
 *    - Dáng chiến mã phi nước đại dũng mãnh, tung vó ngẩng cao đầu, bờm bay trong gió, vệt tốc độ bứt phá.
 *    - Màu: Xanh ngọc neon (#00E5FF) rực sáng.
 * 
 * 2. ĐANG HỒI PHỤC TÍCH CỰC (Recovery 50% - 84%):
 *    - Dáng chiến mã đi bộ thong thả thả lỏng, bước đều nhịp nhàng, hồi phục gân cơ.
 *    - Màu: Xanh lá cây (#10B981) tươi mát.
 * 
 * 3. MỆT MỎI / QUÁ TẢI (Recovery < 50%):
 *    - Dáng chiến mã mỏi mệt cúi đầu, tai rủ, có luồng hơi thở dốc và giọt mồ hôi sau bài tập nặng.
 *    - Màu: Đỏ cảnh báo (#EF4444) phát sáng cảnh giác.
 */
export default function EquineRecoveryIcon({ recoveryPercent = 100, isCalibrating = false, size = 68 }) {
  // Xác định trạng thái và màu sắc
  let state = 'FRESH';
  let color = '#00E5FF';

  if (isCalibrating) {
    state = 'CALIBRATING';
    color = '#F59E0B';
  } else if (recoveryPercent >= 85) {
    state = 'FRESH';
    color = '#00E5FF';
  } else if (recoveryPercent >= 50) {
    state = 'RECOVERING';
    color = '#10B981';
  } else {
    state = 'FATIGUED';
    color = '#EF4444';
  }

  // 1. TRẠNG THÁI KHỎE MẠNH / SUNG MÃN (>= 85%)
  // Dáng chiến mã phi nước đại thần tốc, đầu ngẩng kiêu hãnh, 4 vó bay lượn
  if (state === 'FRESH') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Chiến mã khỏe mạnh, sung mãn, sẵn sàng bứt tốc đỉnh cao">
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          style={{ filter: `drop-shadow(0 0 12px ${color}80)` }}
        >
          {/* Thân ngựa phi nước đại dũng mãnh */}
          <path
            d="M8 28C11 25 16 24 21 25C25 26 29 24 33 20C35 17 37 12 40 8C43 6 47 6 50 8C53 10 54 13 53 16C51 19 48 20 48 23C49 25 53 27 57 26C59 25 61 27 60 29C58 32 54 33 50 34C46 35 43 37 42 41L47 48C48 49 47 51 45 50L38 43C35 40 33 39 30 40C26 41 23 45 22 50L20 56C19 58 17 57 17 55L19 46C19 43 18 41 15 41C12 41 10 43 7 46C6 47 4 46 5 44L8 37C9 34 9 31 7 29L6 28C5 27 6 26 8 28Z"
            fill={color}
          />
          {/* Tai dựng vươn về phía trước */}
          <path d="M42 6L44 2L46 7Z" fill={color} />
          {/* Bờm ngựa tung bay trong gió cuồn cuộn */}
          <path
            d="M34 16C31 14 27 13 23 14M37 20C33 18 29 18 25 19M39 24C35 23 31 23 28 24"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Đuôi ngựa bay cao vút theo tốc độ */}
          <path
            d="M8 28C5 25 2 27 1 31C0 35 2 39 5 41"
            stroke={color}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Vệt năng lượng bứt phá (Speed burst rays) */}
          <line x1="57" y1="18" x2="63" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="58" y1="24" x2="64" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="55" y1="30" x2="61" y2="31" stroke={color} strokeWidth="2" strokeLinecap="round" />
          {/* Mắt ngựa tinh anh */}
          <circle cx="47" cy="11" r="1.2" fill="#0A0D14" />
        </svg>
      </div>
    );
  }

  // 2. TRẠNG THÁI ĐANG HỒI PHỤC (50% - 84%) HOẶC ĐANG HIỆU CHUẨN
  // Dáng chiến mã đi bộ thong thả, bước đều nhịp nhàng, cơ bắp thả lỏng
  if (state === 'RECOVERING' || state === 'CALIBRATING') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Chiến mã đang trong chu kỳ hồi phục tích cực, thả lỏng gân cơ">
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        >
          {/* Thân ngựa bước đi thong thả */}
          <path
            d="M10 38C14 35 19 34 26 35C30 31 34 24 38 18C41 13 44 11 48 12C52 13 54 16 53 19C51 21 48 22 47 24C49 26 53 27 52 30C49 32 45 32 42 34C39 37 39 41 41 46L43 56C43 58 41 58 40 56L37 47C35 44 33 43 30 44C27 45 25 48 24 53L23 57C22 58 20 57 20 55L22 47C21 44 19 43 17 44C15 45 13 47 11 50C10 51 8 50 9 48L10 38Z"
            fill={color}
          />
          {/* Tai ngựa tự nhiên */}
          <path d="M48 9L50 5L53 9Z" fill={color} />
          {/* Bờm ngựa gợn sóng nhẹ */}
          <path
            d="M36 17C33 17 30 18 28 20M38 22C35 22 32 23 30 25"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Đuôi ngựa buông rủ tự nhiên */}
          <path
            d="M10 38C8 42 8 47 9 53C9 55 11 55 11 53C11 48 12 44 13 40"
            fill={color}
          />
          {/* Mắt ngựa */}
          <circle cx="48" cy="14" r="1.2" fill="#0A0D14" />
        </svg>
      </div>
    );
  }

  // 3. TRẠNG THÁI MỆT MỎI / QUÁ TẢI (< 50%)
  // Dáng chiến mã cúi đầu gục xuống, tai rủ, thở dốc, cần nghỉ ngơi hồi phục
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Chiến mã mệt mỏi, tích tụ axit lactic sau bài tập, cần nghỉ ngơi ô chuồng">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        style={{ filter: `drop-shadow(0 0 10px ${color}90)` }}
      >
        {/* Thân ngựa trĩu xuống mệt mỏi */}
        <path
          d="M10 36C14 34 20 34 26 36C30 35 34 33 39 33C43 33 46 34 48 37C46 39 44 41 42 42C44 44 45 46 43 48C40 49 37 48 34 46C31 45 28 45 26 47L24 56C23 58 21 57 21 55L23 48C21 46 18 45 15 46L12 54C11 55 9 54 10 52L12 44C11 41 10 38 10 36Z"
          fill={color}
        />
        {/* Cổ và đầu ngựa cúi gục thấp xuống đất (Tired lowered head) */}
        <path
          d="M32 36C36 38 40 42 43 47C46 51 49 55 52 57C54 58 52 60 49 59C46 57 43 54 40 50C37 46 34 41 32 36Z"
          fill={color}
        />
        {/* Tai rủ cụp uể oải về phía sau */}
        <path d="M42 44L38 42L41 46Z" fill={color} />
        {/* Đuôi ngựa buông thõng mỏi mệt */}
        <path
          d="M10 36C8 41 7 48 8 56"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Luồng hơi thở dốc qua mũi (Exhaustion breath waves) */}
        <path
          d="M53 54C55 53 57 54 58 56M54 58C56 57 58 58 59 60"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Giọt mồ hôi rơi vì vận động nặng */}
        <circle cx="46" cy="38" r="1.5" fill={color} opacity="0.9" />
        <circle cx="49" cy="42" r="1.2" fill={color} opacity="0.7" />
        {/* Mắt ngựa nhắm hờ mệt mỏi */}
        <line x1="45" y1="49" x2="47" y2="50" stroke="#0A0D14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

