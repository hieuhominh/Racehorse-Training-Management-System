import React from 'react';
import VitalsCard from './VitalsCard';
import StatsStrip from './StatsStrip';

export default function Hero({ onOpenAuth }) {
  return (
    <div className="hero" style={{ backgroundColor: '#000000', background: '#000000' }}>
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Hệ thống Quản lý Huấn luyện Ngựa đua</div>
            <h1>
              Mỗi sải chân<em>đều được ghi lại</em>
            </h1>
            <p className="lede">
              Giáo án, nhịp tim, bệnh án, khẩu phần và thành tích của cả tàu ngựa nằm trên một nền tảng. Huấn luyện viên, bác sĩ thú y, nhân viên chuồng trại và chủ ngựa cùng nhìn một dữ liệu.
            </p>
            <div className="hero-actions">
              <a 
                className="btn btn-solid" 
                href="/dang-nhap.html"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('login');
                  }
                }}
              >
                Vào hệ thống
              </a>
              <a className="btn btn-ghost" href="#vai-tro">Chọn vai trò của bạn</a>
            </div>
          </div>

          <VitalsCard />
        </div>

        <StatsStrip />
      </div>
    </div>
  );
}
