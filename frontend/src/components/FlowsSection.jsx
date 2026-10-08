import React from 'react';
import { Link } from 'react-router-dom';
import { flowsData } from '../data/flowsData';

export default function FlowsSection() {
  return (
    <section>
      <div className="wrap">
        <div className="sec-head">
          <h2>Năm luồng nghiệp vụ</h2>
          <p>
            Ba luồng lõi chạy suốt vòng đời một chiến mã, từ lúc nhập tàu đến ngày ra sân. Hai luồng còn lại mở rộng sang sinh hoạt hằng ngày và thành tích thi đấu.
          </p>
        </div>

        {flowsData.map((flow) => (
          <div key={flow.no} className="flow">
            <div className="no">{flow.no}</div>
            <div>
              <h3>{flow.title}</h3>
              <div className="vn">{flow.vn}</div>
              <p>{flow.desc}</p>
            </div>
            <div className="meta">
              <span className={`badge ${flow.isReq ? 'req' : 'opt'}`}>{flow.badge}</span>
              <Link to={flow.link}>{flow.linkText}</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
