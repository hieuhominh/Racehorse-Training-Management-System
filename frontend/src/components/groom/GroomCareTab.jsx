import React, { useState } from 'react';

export default function GroomCareTab({ stalls = [], onCleanBedding, onOpenReportModal }) {
  const [activeCareSubtab, setActiveCareSubtab] = useState('stalls'); // 'stalls' | 'ice_bath' | 'hoof' | 'nutrition'
  const [feedLogs, setFeedLogs] = useState([
    { id: 'FL-01', horse: 'Hắc Phong (Ô A1)', hayKg: '4 kg Alfalfa', grainKg: '2 kg Yến mạch', waterL: '35L (Đầy)', intakeRate: '100% (Hết sạch)', note: 'Ăn khỏe, uống tốt.' },
    { id: 'FL-02', horse: 'Xích Thố (Ô A2)', hayKg: '3.5 kg Cỏ khô', grainKg: '1 kg Cám kiểm soát', waterL: '30L (Bình thường)', intakeRate: '95% (Khẩu phần kiểm soát)', note: 'Theo dõi thể trọng theo y lệnh.' },
    { id: 'FL-03', horse: 'Bạch Long (Ô A3)', hayKg: '3.5 kg Cỏ Alfalfa ẩm', grainKg: '1.5 kg Yến mạch ngâm', waterL: '18L (Thấp)', intakeRate: '50% (Bỏ ăn một nửa)', note: 'Bỏ ăn sáng, có biểu hiện cào móng.' },
    { id: 'FL-04', horse: 'Phi Yến (Ô A4)', hayKg: '4 kg Cỏ khô', grainKg: '2 kg Cám đậm đặc', waterL: '38L (Tốt)', intakeRate: '100% (Hết sạch)', note: 'Bổ sung điện giải sau tập.' },
    { id: 'FL-05', horse: 'Lôi Chấn (Ô A5)', hayKg: '4.5 kg Cỏ Alfalfa', grainKg: '2.5 kg Yến mạch', waterL: '42L (Rất tốt)', intakeRate: '100% (Hết sạch)', note: 'Sức ăn sung mãn.' },
    { id: 'FL-06', horse: 'Kim Sa (Ô A6)', hayKg: '3 kg Cỏ tươi xắt', grainKg: '1 kg Thức ăn hấp', waterL: '25L (Ô cách ly)', intakeRate: '85% (Ăn chậm)', note: 'Kèm men vi sinh đường ruột.' }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
          🧹 Chăm Sóc Ngựa & Chuồng Trại (Daily Care & Stable Husbandry)
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
          Vệ sinh chuồng trại, kiểm tra máng nước, ngâm chân đá Cryo, kiểm tra móng guốc và quản lý khẩu phần ăn hằng ngày.
        </p>
      </div>

      {/* Subtabs con */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveCareSubtab('stalls')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: activeCareSubtab === 'stalls' ? 700 : 500,
            background: activeCareSubtab === 'stalls' ? 'var(--brass)' : 'transparent',
            color: activeCareSubtab === 'stalls' ? '#0A0D14' : 'var(--paper-dim)',
            border: activeCareSubtab === 'stalls' ? 'none' : '1px solid var(--line)',
            cursor: 'pointer'
          }}
        >
          🏠 Vệ Sinh Ô Chuồng & Đệm Lót
        </button>
        <button
          type="button"
          onClick={() => setActiveCareSubtab('ice_bath')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: activeCareSubtab === 'ice_bath' ? 700 : 500,
            background: activeCareSubtab === 'ice_bath' ? 'var(--brass)' : 'transparent',
            color: activeCareSubtab === 'ice_bath' ? '#0A0D14' : 'var(--paper-dim)',
            border: activeCareSubtab === 'ice_bath' ? 'none' : '1px solid var(--line)',
            cursor: 'pointer'
          }}
        >
          ❄️ Ngâm Chân Đá Cryo & Làm Mát Gân
        </button>
        <button
          type="button"
          onClick={() => setActiveCareSubtab('hoof')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: activeCareSubtab === 'hoof' ? 700 : 500,
            background: activeCareSubtab === 'hoof' ? 'var(--brass)' : 'transparent',
            color: activeCareSubtab === 'hoof' ? '#0A0D14' : 'var(--paper-dim)',
            border: activeCareSubtab === 'hoof' ? 'none' : '1px solid var(--line)',
            cursor: 'pointer'
          }}
        >
          蹄 Chải Lông & Kiểm Tra Móng
        </button>
        <button
          type="button"
          onClick={() => setActiveCareSubtab('nutrition')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: activeCareSubtab === 'nutrition' ? 700 : 500,
            background: activeCareSubtab === 'nutrition' ? 'var(--brass)' : 'transparent',
            color: activeCareSubtab === 'nutrition' ? '#0A0D14' : 'var(--paper-dim)',
            border: activeCareSubtab === 'nutrition' ? 'none' : '1px solid var(--line)',
            cursor: 'pointer'
          }}
        >
          🌾 Khẩu Phần Ăn & Nước Uống
        </button>
      </div>

      {/* Subtab 1: Vệ sinh ô chuồng */}
      {activeCareSubtab === 'stalls' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '16px'
        }}>
          {stalls.map((s) => (
            <div key={s.code} className="facility-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--brass)',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}>
                      {s.code}
                    </span>
                    <b style={{ color: 'var(--paper)', fontSize: '14.5px' }}>
                      {s.horseName || 'Ô trống'}
                    </b>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                    Dọn gần nhất: <b style={{ color: 'var(--paper)' }}>{s.lastCleaned}</b>
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '12px'
                }}>
                  <div>Đệm lót hiện tại: <b style={{ color: 'var(--brass)' }}>{s.bedding}</b></div>
                  <div>Máng nước tự động: <b style={{ color: '#10B981' }}>{s.waterLevel}</b></div>
                  <div>Nhiệt độ & Độ ẩm: <b style={{ color: 'var(--paper)' }}>{s.temp} · {s.humidity}</b></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => onCleanBedding && onCleanBedding(s.code)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Đã Dọn & Thay Đệm Lót
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReportModal && onOpenReportModal({ stallCode: s.code, horseName: s.horseName })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Báo sự cố
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: Ngâm chân đá cryo */}
      {activeCareSubtab === 'ice_bath' && (
        <div className="facility-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: 'var(--brass)' }}>
            ❄️ Quy Trình Ngâm Chân Nước Đá Cryo Sau Giờ Tập
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
            Ngâm chân đá lạnh trong 20 phút ngay sau khi kết thúc buổi tập tốc độ giúp co mạch gân cơ, ngăn ngừa viêm bao hoạt dịch và rút ngắn thời gian hồi phục thể lực.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <b style={{ color: 'var(--paper)' }}>Xích Thố (Ô A2)</b>
                <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '11px' }}>Y LỆNH BÁC SĨ</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '10px' }}>
                Chườm lạnh khớp cổ chân sau bên trái 20 phút (Ca sáng 09:30, Ca chiều 14:00, Ca tối 19:00).
              </div>
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>✓ Đã hoàn thành ca sáng 09:30</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <b style={{ color: 'var(--paper)' }}>Lôi Chấn (Ô A5)</b>
                <span style={{ color: 'var(--brass)', fontWeight: 700, fontSize: '11px' }}>SAU TẬP 14:30</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '10px' }}>
                Chuẩn bị 2 ủng đá Cryo sẵn sàng đón ngựa lúc 14:30 sau buổi tập cự ly 1.600m.
              </div>
              <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>🕒 Đang chờ đón ngựa</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Chải lông & Kiểm tra móng */}
      {activeCareSubtab === 'hoof' && (
        <div className="facility-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: 'var(--paper)' }}>
            蹄 Quy Trình Chải Lông & Kiểm Tra Móng Guốc (Hoof Care)
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            1. Dùng dao Hoof pick nạo sạch đất cát, sỏi dăm bám kẽ móng guốc. 2. Kiểm tra độ lỏng móng sắt. 3. Chải sạch bụi cát bằng lược Curry.
          </p>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12.5px' }}>
            <b style={{ color: 'var(--brass)' }}>Lưu ý an toàn:</b> Luôn đứng nghiêng góc 45° so với vai hoặc hông ngựa, vuốt nhẹ dọc chân trước khi nhấc móng để tránh ngựa bị giật mình.
          </div>
        </div>
      )}

      {/* Subtab 4: Khẩu phần ăn & nước uống */}
      {activeCareSubtab === 'nutrition' && (
        <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Chiến Mã</th>
                <th style={{ padding: '12px 16px' }}>Cỏ Khô Alfalfa</th>
                <th style={{ padding: '12px 16px' }}>Yến Mạch & Cám</th>
                <th style={{ padding: '12px 16px' }}>Mức Uống Nước</th>
                <th style={{ padding: '12px 16px' }}>Tỷ Lệ Ăn Hết</th>
                <th style={{ padding: '12px 16px' }}>Ghi Chú Ca Trực</th>
              </tr>
            </thead>
            <tbody>
              {feedLogs.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--brass)' }}>{f.horse}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--paper)' }}>{f.hayKg}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--paper)' }}>{f.grainKg}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--paper-dim)' }}>{f.waterL}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: f.intakeRate.includes('100%') ? 'rgba(16, 185, 129, 0.12)' : f.intakeRate.includes('50%') ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                      color: f.intakeRate.includes('100%') ? '#10B981' : f.intakeRate.includes('50%') ? '#EF4444' : 'var(--paper)',
                      border: `1px solid ${f.intakeRate.includes('50%') ? '#EF4444' : 'var(--line)'}`
                    }}>
                      {f.intakeRate}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--paper-dim)', fontSize: '11.5px' }}>{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

