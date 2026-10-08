import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#000000', background: '#000000' }}>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <Link className="brand" to="/" style={{ marginBottom: '14px' }}>
              <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
                <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
              </svg>
              <span>
                <span className="name">MÃ TRƯỜNG</span>
                <span className="sub">RACEHORSE SYSTEM</span>
              </span>
            </Link>
            <p style={{ color: '#8F958F', maxWidth: '34ch' }}>
              Hệ thống quản lý huấn luyện ngựa đua cho câu lạc bộ và trang trại.
            </p>
          </div>
          <div>
            <h4>HUẤN LUYỆN</h4>
            <ul>
              <li><Link to="/ho-so-ngua">Danh sách ngựa</Link></li>
              <li><Link to="/ho-so-ngua">Giáo án &amp; Phả hệ</Link></li>
              <li><Link to="/thanh-tich">Lịch sử thành tích</Link></li>
              <li><Link to="/chuong-trai">Sơ đồ chuồng</Link></li>
            </ul>
          </div>
          <div>
            <h4>Y TẾ</h4>
            <ul>
              <li><Link to="/ho-so-ngua">Bệnh án &amp; Khám</Link></li>
              <li><Link to="/chuong-trai">Trạng thái sức khỏe</Link></li>
              <li><Link to="/chuong-trai">Checklist Groom</Link></li>
              <li><Link to="/ho-so-ngua">Khóa huấn luyện</Link></li>
            </ul>
          </div>
          <div>
            <h4>CHUỒNG TRẠI</h4>
            <ul>
              <li><Link to="/chuong-trai">Sơ đồ chuồng (A1-B6)</Link></li>
              <li><Link to="/chuong-trai">Khẩu phần &amp; Dinh dưỡng</Link></li>
              <li><Link to="/chuong-trai">Checklist công việc Groom</Link></li>
              <li><Link to="/chuong-trai">Lịch sinh hoạt hằng ngày</Link></li>
            </ul>
          </div>
          <div>
            <h4>CÂU LẠC BỘ</h4>
            <ul>
              <li><Link to="/thanh-tich">Đối soát chi phí &amp; Thưởng</Link></li>
              <li><Link to="/ho-so-ngua">Chủ sở hữu &amp; Tỉ lệ</Link></li>
              <li><Link to="/thanh-tich">Báo cáo cho chủ ngựa</Link></li>
              <li><Link to="/chuong-trai">Quản lý khu vực chuồng</Link></li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <span>© 2026 Mã Trường · Racehorse Training &amp; Management System</span>
          <span>
            <Link to="/">Điều khoản</Link> · <Link to="/">Bảo mật</Link> · <Link to="/">Liên hệ</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
