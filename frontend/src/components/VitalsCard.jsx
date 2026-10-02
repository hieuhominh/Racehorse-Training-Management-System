import React, { useState, useEffect } from 'react';

export default function VitalsCard() {
  const [heartRate, setHeartRate] = useState(186);
  const [speed, setSpeed] = useState(58.4);
  const [distance, setDistance] = useState(1200);

  // Nhẹ nhàng mô phỏng chỉ số biến động thực tế của buổi tập
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(prev => Math.min(192, Math.max(180, prev + (Math.random() > 0.5 ? 1 : -1))));
      setSpeed(prev => +(Math.min(62, Math.max(55, prev + (Math.random() * 0.4 - 0.2)))).toFixed(1));
      setDistance(prev => prev + 5);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="vitals" aria-label="Dữ liệu buổi tập đang diễn ra">
      <div className="vitals-head">
        <div className="who">
          HẮC PHONG <small>Đường chạy số 2 · mặt sân cát</small>
        </div>
        <div className="live">
          <span className="dot"></span>Đang chạy
        </div>
      </div>
      <svg className="trace" viewBox="0 0 520 78" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 52 L34 52 L42 30 L50 62 L58 44 L96 44 L104 20 L112 66 L120 44 L160 44 L168 24 L176 64 L184 42 L228 42 L236 14 L244 68 L252 40 L296 40 L304 18 L312 66 L320 38 L364 38 L372 10 L380 70 L388 36 L432 36 L440 16 L448 64 L456 34 L520 34"/>
      </svg>
      <div className="readouts">
        <div>
          <b>{heartRate}</b>
          <span>NHỊP TIM / PHÚT</span>
        </div>
        <div>
          <b>{speed.toString().replace('.', ',')}</b>
          <span>KM/GIỜ</span>
        </div>
        <div>
          <b>{distance}</b>
          <span>MÉT ĐÃ CHẠY</span>
        </div>
      </div>
      <div className="vitals-foot">
        <span className="flag"></span>
        Nhịp tim vượt ngưỡng an toàn 8 phút liên tục. Hệ thống đề nghị giảm tải và báo bác sĩ thú y trực.
      </div>
    </div>
  );
}
