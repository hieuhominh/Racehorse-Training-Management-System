import React from 'react';

export default function Ticker({ onOpenAuth }) {
  return (
    <div className="ticker">
      <div className="wrap">
        <div className="meet">
          <b>Mùa giải 2026</b>
          <span>Vòng loại Đại Nam — còn 12 ngày · 38 chiến mã đang trong giáo án</span>
        </div>
        <nav>
          <a href="/ho-tro.html">Hỗ trợ</a>
          <a href="/tai-lieu.html">Tài liệu</a>
          <a 
            href="/dang-nhap.html"
            onClick={(e) => {
              if (onOpenAuth) {
                e.preventDefault();
                onOpenAuth('login');
              }
            }}
          >
            Đăng nhập
          </a>
        </nav>
      </div>
    </div>
  );
}
