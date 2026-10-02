import React, { useState } from 'react';
import { stallsData, scheduleData } from '../data/stallsData';

export default function StableSection() {
  const [selectedStall, setSelectedStall] = useState(stallsData.find(s => s.code === 'A3'));

  return (
    <section style={{ background: 'var(--ink-2)', borderBlock: '1px solid var(--line)' }}>
      <div className="wrap">
        {/* Split 1: Stalls Map */}
        <div className="split">
          <div className="art">
            <div className="stalls">
              {stallsData.map((stall) => {
                let extraClass = '';
                if (stall.status === 'watch') extraClass = ' watch';
                if (stall.status === 'hurt') extraClass = ' hurt';
                if (stall.status === 'quar') extraClass = ' quar';
                if (stall.status === 'empty') extraClass = ' empty';
                const isSelected = selectedStall && selectedStall.code === stall.code;

                return (
                  <div 
                    key={stall.code} 
                    className={`stall${extraClass}`}
                    onClick={() => setSelectedStall(stall)}
                    style={{ 
                      cursor: 'pointer', 
                      borderColor: isSelected ? 'var(--brass)' : undefined,
                      transform: isSelected ? 'scale(1.05)' : undefined,
                      transition: 'transform 0.15s, border-color 0.15s'
                    }}
                    title={`${stall.code}: ${stall.horse} (${stall.label})`}
                  >
                    <i></i>
                    {stall.code}
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--ok)' }}></i>Đủ điều kiện</span>
              <span><i style={{ background: 'var(--brass)' }}></i>Cần theo dõi</span>
              <span><i style={{ background: 'var(--alert)' }}></i>Chấn thương</span>
              <span><i style={{ background: '#6F7BA8' }}></i>Cách ly</span>
            </div>

            {selectedStall && (
              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', fontSize: '13px' }}>
                <b style={{ color: 'var(--brass)' }}>Chuồng {selectedStall.code}:</b> {selectedStall.horse} — <span style={{ opacity: 0.85 }}>{selectedStall.label}</span>
              </div>
            )}
          </div>

          <div>
            <h2>Nhìn một lần biết cả tàu ngựa</h2>
            <p>
              Sơ đồ chuồng trại đổi màu theo trạng thái sức khỏe do bác sĩ thú y cập nhật. Chạm vào một ô là mở thẳng bệnh án, lịch tiêm phòng và diễn biến phục hồi của con ngựa đó.
            </p>
            <ul>
              <li>Bốn trạng thái chuẩn: đủ điều kiện, cần theo dõi, chấn thương, cách ly</li>
              <li>Ngựa bị khóa huấn luyện tự động biến mất khỏi danh sách xếp bài tập nặng</li>
              <li>Vị trí tổn thương đánh dấu trên mô hình cơ — xương 3D, lưu theo từng lần tái khám</li>
              <li>Nhắc tự động lịch tiêm phòng, tẩy giun và kiểm tra móng</li>
            </ul>
          </div>
        </div>

        {/* Split 2: Daily Schedule */}
        <div className="split rev">
          <div className="art">
            <div className="sched">
              {scheduleData.map((item, idx) => (
                <div key={idx} className="row">
                  <span className="t">{item.time}</span>
                  <div className={`bar ${item.barClass}`}>{item.title}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2>Giáo án xuống tới từng bữa ăn</h2>
            <p>
              HLV trưởng đặt mục tiêu cho giai đoạn, hệ thống rải thành lịch ngày cho từng người phụ trách. Nhân viên chăm sóc chỉ thấy đúng việc của mình và tích hoàn thành ngay trên điện thoại.
            </p>
            <ul>
              <li>Giáo án theo cự ly, khối lượng và mặt sân cho từng giai đoạn</li>
              <li>Lịch tập, lượt chạy thử và người phụ trách gắn liền một dòng công việc</li>
              <li>Cảnh báo vượt ngưỡng thể lực gửi thẳng cho HLV và thú y trực</li>
              <li>Chủ ngựa xem lại video buổi đua thử và nhận xét sau mỗi buổi</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
