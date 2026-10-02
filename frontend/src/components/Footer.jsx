import React from 'react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#000000', background: '#000000' }}>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <a className="brand" href="/" style={{ marginBottom: '14px' }}>
              <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
                <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
              </svg>
              <span>
                <span className="name">MÃ TRƯỜNG</span>
                <span className="sub">RACEHORSE SYSTEM</span>
              </span>
            </a>
            <p style={{ color: '#8F958F', maxWidth: '34ch' }}>
              Hệ thống quản lý huấn luyện ngựa đua cho câu lạc bộ và trang trại.
            </p>
          </div>
          <div>
            <h4>HUẤN LUYỆN</h4>
            <ul>
              <li><a href="/huan-luyen.html">Giáo án</a></li>
              <li><a href="/lich-tap.html">Lịch tập hằng ngày</a></li>
              <li><a href="/chay-thu.html">Lượt chạy thử</a></li>
              <li><a href="/the-luc.html">Biểu đồ thể lực</a></li>
            </ul>
          </div>
          <div>
            <h4>Y TẾ</h4>
            <ul>
              <li><a href="/y-te.html">Bệnh án</a></li>
              <li><a href="/chan-thuong.html">Bản đồ chấn thương</a></li>
              <li><a href="/tiem-phong.html">Lịch tiêm phòng</a></li>
              <li><a href="/khoa-huan-luyen.html">Khóa huấn luyện</a></li>
            </ul>
          </div>
          <div>
            <h4>CHUỒNG TRẠI</h4>
            <ul>
              <li><a href="/chuong-trai.html">Sơ đồ chuồng</a></li>
              <li><a href="/khau-phan.html">Khẩu phần ăn</a></li>
              <li><a href="/su-co.html">Báo sự cố</a></li>
              <li><a href="/vat-tu.html">Vật tư</a></li>
            </ul>
          </div>
          <div>
            <h4>CÂU LẠC BỘ</h4>
            <ul>
              <li><a href="/quan-tri.html">Danh mục &amp; nhân sự</a></li>
              <li><a href="/phan-quyen.html">Phân quyền RBAC</a></li>
              <li><a href="/bao-cao.html">Báo cáo &amp; chi phí</a></li>
              <li><a href="/nhat-ky.html">Nhật ký hệ thống</a></li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <span>© 2026 Mã Trường · Racehorse Training &amp; Management System</span>
          <span>
            <a href="/dieu-khoan.html">Điều khoản</a> · <a href="/bao-mat.html">Bảo mật</a> · <a href="/lien-he.html">Liên hệ</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
