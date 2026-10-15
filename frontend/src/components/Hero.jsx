import React from 'react';
import VitalsCard from './VitalsCard';
import StatsStrip from './StatsStrip';

export default function Hero({ onOpenAuth }) {
  return (
    <div className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              Hệ thống Quản lý Huấn luyện Ngựa đua Chuyên nghiệp
            </div>
            <h1>
              Mỗi sải chân<em>đều được ghi lại</em>
            </h1>
            <p className="lede">
              Giáo án, nhịp tim viễn trắc, bệnh án thú y, khẩu phần dinh dưỡng và thành tích thi đấu của cả đàn ngựa được tích hợp trên một nền tảng thời gian thực.
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
