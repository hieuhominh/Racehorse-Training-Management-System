import React from 'react';
import { rolesData } from '../data/rolesData';

export default function RolesSection() {
  return (
    <section className="roles" id="vai-tro" style={{ backgroundColor: '#000000', background: '#000000' }}>
      <div className="wrap">
        <div className="sec-head">
          <h2>Mỗi người một khung nhìn</h2>
          <p>
            Hệ thống mở đúng phần việc của bạn ngay khi đăng nhập. Không ai phải lội qua màn hình của người khác để tìm thông tin mình cần.
          </p>
        </div>
        <div className="role-grid">
          {rolesData.map((role, idx) => (
            <a key={idx} className="role" href={role.link}>
              <div className="tag">{role.tag}</div>
              <h3>{role.title}</h3>
              <div className="vn">{role.vn}</div>
              <ul>
                {role.duties.map((duty, dIdx) => (
                  <li key={dIdx}>{duty}</li>
                ))}
              </ul>
              <div className="go">{role.cta}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
