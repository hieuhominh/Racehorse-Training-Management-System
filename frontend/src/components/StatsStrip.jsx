import React from 'react';

export default function StatsStrip() {
  const stats = [
    { value: '38', label: 'chiến mã đang quản lý' },
    { value: '5', label: 'vai trò với quyền riêng biệt' },
    { value: '24/7', label: 'giám sát thể lực và cảnh báo' },
    { value: '100%', label: 'thao tác được ghi nhật ký' },
  ];

  return (
    <div className="strip">
      {stats.map((item, idx) => (
        <div key={idx}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
