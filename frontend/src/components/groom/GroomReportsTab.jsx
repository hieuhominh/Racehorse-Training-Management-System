import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'matruong_groom_daily_reports';

const DEFAULT_REPORTS = [
  {
    id: 'REP-2026-11-12-SANG',
    date: '12/11/2026',
    shift: 'Ca Sáng (05:00 - 13:00)',
    author: 'Lê Hoàng Nam (Groom Block A)',
    horsesStatusSummary: 'Các chiến mã trong chuồng duy trì thể trạng tốt, ăn hết khẩu phần và hoàn thành lịch vận động.',
    suppliesConsumed: '24kg Cỏ Alfalfa, 8kg Yến mạch, 2 bao mùn cưa, bổ sung khoáng chất.',
    handoverNotes: 'Ca chiều 13:00 lưu ý đón ngựa sau buổi tập để hạ nhiệt xịt lạnh chân. Kiểm tra lại mức phao nước tự động.'
  },
  {
    id: 'REP-2026-11-11-TOI',
    date: '11/11/2026',
    shift: 'Ca Chiều - Tối (13:00 - 21:00)',
    author: 'Vũ Tiến Dũng (Groom Block B)',
    horsesStatusSummary: 'Toàn bộ 6 chiến mã an toàn trong chuồng, chốt then an toàn lúc 20:30.',
    suppliesConsumed: '20kg Cỏ khô, 6kg Cám đậm đặc, 1 chai xịt Blue Kote.',
    handoverNotes: 'Đã bổ sung nước đầy máng tự động, không có tiếng động lạ trong đêm.'
  }
];

export default function GroomReportsTab({ reports = [], onSubmitDailyReport, currentUser, currentGroomUser }) {
  const [reportList, setReportList] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REPORTS;
  });

  const [filterShift, setFilterShift] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    shift: 'Ca Sáng (05:00 - 13:00)',
    horsesStatusSummary: '',
    suppliesConsumed: '',
    handoverNotes: ''
  });

  // Tự động lắng nghe và đồng bộ báo cáo từ LocalStorage thời gian thực
  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReportList(parsed);
          }
        }
      } catch {}
    };
    window.addEventListener('matruong_groom_reports_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('matruong_groom_reports_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const authorName = currentUser?.full_name 
    ? `${currentUser.full_name} (Groom Block A)` 
    : (currentGroomUser?.name ? `${currentGroomUser.name} (Groom)` : 'Lê Hoàng Nam (Groom Block A)');

  const handleCreateReport = (e) => {
    e.preventDefault();
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const created = {
      id: `REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      date: dateStr,
      time: timeStr,
      shift: newReport.shift,
      author: authorName,
      horsesStatusSummary: newReport.horsesStatusSummary || '6/6 chiến mã được chăm sóc theo quy chuẩn.',
      suppliesConsumed: newReport.suppliesConsumed || 'Tiêu hao thức ăn và vật tư đệm lót bình thường.',
      handoverNotes: newReport.handoverNotes || 'Bàn giao ca đầy đủ, không có sự cố ngoài ý muốn.'
    };

    const updated = [created, ...reportList];
    setReportList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('matruong_groom_reports_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setShowCreateModal(false);
    setNewReport({
      shift: 'Ca Sáng (05:00 - 13:00)',
      horsesStatusSummary: '',
      suppliesConsumed: '',
      handoverNotes: ''
    });
    if (onSubmitDailyReport) onSubmitDailyReport(created);
  };

  const filteredReports = reportList.filter((r) => {
    if (filterShift === 'ALL') return true;
    return r.shift.toLowerCase().includes(filterShift.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header bar gọn gàng */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-card)',
        padding: '14px 18px',
        borderRadius: '8px',
        border: '1px solid var(--line)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--paper)', letterSpacing: '0.2px' }}>
            Báo Cáo Chăm Sóc Hằng Ngày & Bàn Giao Ca (Daily Reports & Handover)
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
            Tổng hợp kết quả ca trực, lượng thức ăn tiêu hao và biên bản bàn giao ca cho nhân sự tiếp theo.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '7px 15px',
              borderRadius: '6px',
              background: 'var(--brass)',
              color: '#0A0D14',
              fontWeight: 700,
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            + Lập Báo Cáo Bàn Giao Ca
          </button>
        </div>
      </div>

      {/* Danh sách báo cáo dạng Card phân cột tinh gọn */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredReports.map((rep) => (
          <div
            key={rep.id}
            className="facility-card"
            style={{
              padding: '16px 18px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Header của từng thẻ báo cáo */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--brass)',
                  background: 'rgba(212, 175, 55, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}>
                  {rep.shift}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Ngày: <b style={{ color: 'var(--paper)' }}>{rep.date}</b>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--line)' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Người lập: <b style={{ color: 'var(--paper)' }}>{rep.author}</b>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--line)' }}>•</span>
                <span style={{ fontSize: '11px', color: 'var(--paper-dim)', opacity: 0.8 }}>
                  Mã: {rep.id}
                </span>
              </div>
            </div>

            {/* Thân thẻ phân 3 cột cân đối, gọn gàng */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {/* Cột 1: Tình trạng chiến mã */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  color: 'var(--brass)'
                }}>
                  Tình trạng chiến mã trong ca
                </span>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.5 }}>
                  {rep.horsesStatusSummary}
                </p>
              </div>

              {/* Cột 2: Tiêu hao vật tư */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  color: 'var(--paper-dim)'
                }}>
                  Vật tư & Thức ăn tiêu hao
                </span>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.5 }}>
                  {rep.suppliesConsumed}
                </p>
              </div>

              {/* Cột 3: Dặn dò bàn giao ca sau */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.04)',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderLeft: '3px solid var(--brass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  color: 'var(--brass)'
                }}>
                  Dặn dò bàn giao ca sau
                </span>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.5 }}>
                  {rep.handoverNotes}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal lập báo cáo chuyên nghiệp, gọn gàng, không icon */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '92%',
              padding: '24px',
              background: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Header Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--line)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--brass)', letterSpacing: '0.2px' }}>
                  Lập Báo Cáo Chăm Sóc & Bàn Giao Ca
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Ghi nhận tiến độ chăm sóc, vật tư tiêu hao và bàn giao công việc cho ca kế tiếp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--paper-dim)',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Dòng 1: Ca trực và Nhân sự lập phiếu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', marginBottom: '5px' }}>
                    Ca trực phụ trách
                  </label>
                  <select
                    value={newReport.shift}
                    onChange={(e) => setNewReport({ ...newReport, shift: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--line)',
                      color: 'var(--paper)',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  >
                    <option value="Ca Sáng (05:00 - 13:00)">Ca Sáng (05:00 - 13:00)</option>
                    <option value="Ca Chiều (13:00 - 21:00)">Ca Chiều (13:00 - 21:00)</option>
                    <option value="Ca Đêm (21:00 - 05:00)">Ca Đêm (21:00 - 05:00)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)', marginBottom: '5px' }}>
                    Nhân sự lập phiếu
                  </label>
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper-dim)',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: 'var(--paper)', fontWeight: 600 }}>{currentUser?.full_name || currentGroomUser?.name || 'Lê Hoàng Nam'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--brass)' }}>Đội Groom · Hôm nay</span>
                  </div>
                </div>
              </div>

              {/* Dòng 2: Tình trạng chiến mã trong ca */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)' }}>
                    Tình trạng chiến mã trong ca *
                  </label>
                  {/* Gợi ý nhanh */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Tất cả ổn định', 'Ăn hết khẩu phần'].map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setNewReport({
                          ...newReport,
                          horsesStatusSummary: newReport.horsesStatusSummary
                            ? `${newReport.horsesStatusSummary}. ${tag}`
                            : `${tag}.`
                        })}
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--paper-dim)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--line)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        + {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  required
                  rows="2"
                  placeholder="VD: Các chiến mã trong chuồng duy trì thể trạng tốt, ăn hết khẩu phần..."
                  value={newReport.horsesStatusSummary}
                  onChange={(e) => setNewReport({ ...newReport, horsesStatusSummary: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: 1.4
                  }}
                />
              </div>

              {/* Dòng 3: Vật tư & Thức ăn tiêu hao */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)' }}>
                    Vật tư & Thức ăn tiêu hao
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['20kg Cỏ Alfalfa', '8kg Yến mạch', '2 bao mùn cưa'].map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setNewReport({
                          ...newReport,
                          suppliesConsumed: newReport.suppliesConsumed
                            ? `${newReport.suppliesConsumed}, ${tag}`
                            : tag
                        })}
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--paper-dim)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--line)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        + {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="VD: 24kg Cỏ Alfalfa, 8kg Yến mạch, 2 bao mùn cưa..."
                  value={newReport.suppliesConsumed}
                  onChange={(e) => setNewReport({ ...newReport, suppliesConsumed: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Dòng 4: Nội dung bàn giao ca sau */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--paper)' }}>
                    Nội dung dặn dò bàn giao ca sau
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Kiểm tra phao nước', 'Hạ nhiệt xịt lạnh chân'].map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setNewReport({
                          ...newReport,
                          handoverNotes: newReport.handoverNotes
                            ? `${newReport.handoverNotes}. ${tag}`
                            : `${tag}.`
                        })}
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--brass)',
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        + {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  rows="2"
                  placeholder="VD: Ca chiều lưu ý đón ngựa sau buổi tập để hạ nhiệt xịt lạnh chân..."
                  value={newReport.handoverNotes}
                  onChange={(e) => setNewReport({ ...newReport, handoverNotes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderLeft: '3px solid var(--brass)',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: 1.4
                  }}
                />
              </div>

              {/* Footer Modal: Actions */}
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--line)'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--paper-dim)',
                    border: '1px solid var(--line)',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#0A0D14',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Xác Nhận & Bàn Giao Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

