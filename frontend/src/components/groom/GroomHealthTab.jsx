import React, { useState } from 'react';

export default function GroomHealthTab({ horses = [], onOpenReportModal }) {
  const [healthLogs, setHealthLogs] = useState([
    { id: 'HL-01', horseName: 'Hắc Phong (Ô A1)', time: '07:15', temp: '38.2°C', pulse: '40 bpm', respiration: '12 lần/phút', appetite: 'Bình thường', stool: 'Khuôn tốt, màu vàng sẫm', observation: 'Đi khập khiễng nhẹ chân trước phải sau khi ra khỏi chuồng. Đã phát cảnh báo lên Thú Y.' },
    { id: 'HL-02', horseName: 'Xích Thố (Ô A2)', time: '06:45', temp: '38.6°C', pulse: '44 bpm', respiration: '16 lần/phút', appetite: 'Ăn hết', stool: 'Bình thường', observation: 'Khớp cổ chân sau bên trái sưng nóng 2.5cm. Đã thực hiện chườm lạnh Cryo và cho uống thuốc theo y lệnh BS. An.' },
    { id: 'HL-03', horseName: 'Bạch Long (Ô A3)', time: '08:00', temp: '38.4°C', pulse: '42 bpm', respiration: '15 lần/phút', appetite: 'Bỏ ăn 50%', stool: 'Phân khô cứng, ít hơn thường lệ', observation: 'Có biểu hiện cào móng, ngoái nhìn bụng. Đang theo dõi sát nguy cơ Colic.' },
    { id: 'HL-04', horseName: 'Phi Yến (Ô A4)', time: '07:30', temp: '37.8°C', pulse: '36 bpm', respiration: '10 lần/phút', appetite: 'Rất tốt', stool: 'Bình thường', observation: 'Thể trạng tốt, niêm mạc hồng hào, phản xạ nhanh nhẹn.' },
    { id: 'HL-05', horseName: 'Lôi Chấn (Ô A5)', time: '07:00', temp: '37.9°C', pulse: '38 bpm', respiration: '11 lần/phút', appetite: 'Rất tốt', stool: 'Bình thường', observation: 'Gân cơ săn chắc, móng guốc sạch sẽ sẵn sàng cho bài tập.' },
    { id: 'HL-06', horseName: 'Kim Sa (Ô A6)', time: '06:30', temp: '38.8°C', pulse: '46 bpm', respiration: '18 lần/phút', appetite: 'Ăn chậm', stool: 'Bình thường', observation: 'Ô cách ly: Dịch mũi trong, ho hắt hơi 2 lần khi thời tiết lạnh sáng sớm.' }
  ]);

  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    horseName: 'Hắc Phong (Ô A1)',
    temp: '38.0°C',
    pulse: '38 bpm',
    respiration: '12 lần/phút',
    appetite: 'Bình thường',
    stool: 'Bình thường',
    observation: ''
  });

  const handleAddLog = (e) => {
    e.preventDefault();
    const newLog = {
      id: `HL-${Date.now()}`,
      time: 'Vừa xong',
      horseName: logForm.horseName,
      temp: logForm.temp,
      pulse: logForm.pulse,
      respiration: logForm.respiration,
      appetite: logForm.appetite,
      stool: logForm.stool,
      observation: logForm.observation || 'Ghi nhận kiểm tra thường nhật, không phát hiện bất thường.'
    };
    setHealthLogs([newLog, ...healthLogs]);
    setShowLogModal(false);
    setLogForm({
      horseName: 'Hắc Phong (Ô A1)',
      temp: '38.0°C',
      pulse: '38 bpm',
      respiration: '12 lần/phút',
      appetite: 'Bình thường',
      stool: 'Bình thường',
      observation: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            🩺 Theo Dõi Sức Khỏe Hằng Ngày (Health Monitoring)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Ghi nhận thân nhiệt, nhịp thở, độ ngon miệng, nước tiểu, phân và biểu hiện bất thường hằng ngày.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'var(--brass)',
            color: '#0A0D14',
            fontWeight: 700,
            fontSize: '12.5px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          + Ghi Nhận Chỉ Số Sức Khỏe
        </button>
      </div>

      {/* Banner Nguyên tắc Phân quyền (RBAC Policy Banner) */}
      <div style={{
        background: 'rgba(212, 175, 55, 0.08)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '8px',
        padding: '14px 18px',
        fontSize: '12.5px',
        lineHeight: 1.5,
        color: 'var(--paper)'
      }}>
        <div style={{ fontWeight: 800, color: 'var(--brass)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚖️ NGUYÊN TẮC GIỚI HẠN QUYỀN HẠN CỦA GROOM:</span>
        </div>
        <div>
          • Groom được phép: <b>Quan sát, đo chỉ số sinh tồn cơ bản và ghi nhận dấu hiệu bất thường</b>.<br />
          • Groom <b>TUYỆT ĐỐI KHÔNG</b> được tự chẩn đoán bệnh, không được tự kê đơn hay thay đổi phác đồ điều trị.<br />
          • Groom <b>KHÔNG</b> được chỉnh sửa hồ sơ bệnh án chính thức hoặc tự ý thay đổi trạng thái sức khỏe chính thức của chiến mã.<br />
          • Mọi triệu chứng bất thường phải được gửi qua phiếu Báo Cáo Sự Cố để Bác sĩ Thú y trực tiếp thẩm định.
        </div>
      </div>

      {/* Bảng nhật ký sức khỏe */}
      <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Chiến Mã</th>
              <th style={{ padding: '12px 14px' }}>Thời Gian</th>
              <th style={{ padding: '12px 14px' }}>Thân Nhiệt</th>
              <th style={{ padding: '12px 14px' }}>Nhịp Tim & Thở</th>
              <th style={{ padding: '12px 14px' }}>Mức Ngon Miệng</th>
              <th style={{ padding: '12px 14px' }}>Phân & Nước Tiểu</th>
              <th style={{ padding: '12px 14px' }}>Quan Sát Dấu Hiệu (Groom Note)</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {healthLogs.map((log) => {
              const tempVal = Number(log.temp.replace('°C', ''));
              const isHighTemp = tempVal > 38.5;

              return (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--paper)' }}>{log.horseName}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--paper-dim)' }}>{log.time}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <b style={{ color: isHighTemp ? '#EF4444' : 'var(--paper)' }}>{log.temp}</b>
                    {isHighTemp && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>(Sốt nhẹ)</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--paper-dim)' }}>
                    <div>{log.pulse}</div>
                    <div style={{ fontSize: '11px' }}>{log.respiration}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: log.appetite.includes('Bỏ ăn') ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                      color: log.appetite.includes('Bỏ ăn') ? '#EF4444' : 'var(--paper)',
                      border: `1px solid ${log.appetite.includes('Bỏ ăn') ? '#EF4444' : 'var(--line)'}`
                    }}>
                      {log.appetite}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--paper-dim)', fontSize: '11.5px' }}>
                    {log.stool}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--paper)', fontSize: '12px', maxWidth: '280px', lineHeight: 1.4 }}>
                    {log.observation}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onOpenReportModal && onOpenReportModal({ horseName: log.horseName })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: 'transparent',
                        color: 'var(--brass)',
                        border: '1px solid var(--brass)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Báo Thú Y
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal ghi nhận chỉ số */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%', padding: '22px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: 'var(--brass)' }}>
              🩺 Ghi Nhận Chỉ Số Thể Chất & Dấu Hiệu Quan Sát
            </h3>
            <form onSubmit={handleAddLog}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Chiến mã *</label>
                <select
                  value={logForm.horseName}
                  onChange={(e) => setLogForm({ ...logForm, horseName: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                >
                  <option value="Hắc Phong (Ô A1)">Hắc Phong (Ô A1)</option>
                  <option value="Xích Thố (Ô A2)">Xích Thố (Ô A2)</option>
                  <option value="Bạch Long (Ô A3)">Bạch Long (Ô A3)</option>
                  <option value="Phi Yến (Ô A4)">Phi Yến (Ô A4)</option>
                  <option value="Lôi Chấn (Ô A5)">Lôi Chấn (Ô A5)</option>
                  <option value="Kim Sa (Ô A6)">Kim Sa (Ô A6)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Thân nhiệt</label>
                  <input
                    type="text"
                    value={logForm.temp}
                    onChange={(e) => setLogForm({ ...logForm, temp: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Nhịp tim</label>
                  <input
                    type="text"
                    value={logForm.pulse}
                    onChange={(e) => setLogForm({ ...logForm, pulse: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Nhịp thở</label>
                  <input
                    type="text"
                    value={logForm.respiration}
                    onChange={(e) => setLogForm({ ...logForm, respiration: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Mức ăn</label>
                  <select
                    value={logForm.appetite}
                    onChange={(e) => setLogForm({ ...logForm, appetite: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  >
                    <option value="Rất tốt (100%)">Rất tốt (100%)</option>
                    <option value="Bình thường (90-95%)">Bình thường (90-95%)</option>
                    <option value="Ăn chậm">Ăn chậm</option>
                    <option value="Bỏ ăn 50%">Bỏ ăn 50%</option>
                    <option value="Bỏ ăn hoàn toàn">Bỏ ăn hoàn toàn (Báo động!)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Phân & Nước tiểu</label>
                  <input
                    type="text"
                    value={logForm.stool}
                    onChange={(e) => setLogForm({ ...logForm, stool: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Quan sát dấu hiệu cụ thể (Không tự chẩn đoán)</label>
                <textarea
                  rows="2"
                  value={logForm.observation}
                  onChange={(e) => setLogForm({ ...logForm, observation: e.target.value })}
                  placeholder="Mô tả cụ thể biểu hiện mắt, mũi, móng, tư thế đứng/nằm..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--paper-dim)', border: '1px solid var(--line)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 18px', borderRadius: '6px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Lưu Ghi Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

