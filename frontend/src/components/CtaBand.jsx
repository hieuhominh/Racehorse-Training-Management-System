import React from 'react';

export default function CtaBand({ onOpenAuth }) {
  return (
    <div className="band">
      <div className="wrap">
        <div>
          <h2>Sẵn sàng cho mùa giải tới</h2>
          <p>
            Đưa cả tàu ngựa lên hệ thống trong một buổi. Dữ liệu cũ nhập từ file, phân quyền theo vai trò có sẵn.
          </p>
        </div>
        <div className="hero-actions">
          <a 
            className="btn btn-solid" 
            href="/dang-ky.html"
            onClick={(e) => {
              if (onOpenAuth) {
                e.preventDefault();
                onOpenAuth('register');
              }
            }}
          >
            Tạo tài khoản câu lạc bộ
          </a>
          <a className="btn btn-ghost" href="/lien-he.html">Đặt lịch xem demo</a>
        </div>
      </div>
    </div>
  );
}
