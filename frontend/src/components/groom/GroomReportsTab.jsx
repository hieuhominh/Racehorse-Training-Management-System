import React, { useState } from 'react';

export default function GroomReportsTab({ reports = [], onSubmitDailyReport }) {
  const [reportList, setReportList] = useState([
    {
      id: 'REP-2026-11-12-SANG',
      date: '12/11/2026',
      shift: 'Ca Sáng (05:00 - 13:00)',
      author: 'Lê Hoàng Nam (Groom Block A)',
      completedTasksCount: '15/24 nhiệm vụ',
      horsesStatusSummary: 'Các chiến mã trong chuồng duy trì thể trạng tốt, ăn hết khẩu phần và hoàn thành lịch vận động.',
      suppliesConsumed: '24kg Cỏ Alfalfa, 8kg Yến mạch, 2 bao mùn cưa, bổ sung khoáng chất.',
      handoverNotes: 'Ca chiều 13:00 lưu ý đón ngựa sau buổi tập để hạ nhiệt xịt lạnh chân. Kiểm tra lại mức phao nước tự động.'
    },
    {
      id: 'REP-2026-11-11-TOI',
      date: '11/11/2026',
      shift: 'Ca Chiều - Tối (13:00 - 21:00)',
      author: 'Vũ Tiến Dũng (Groom Block B)',
      completedTasksCount: '22/22 nhiệm vụ',
      horsesStatusSummary: 'Toàn bộ 6 chiến mã an toàn trong chuồng, chốt then an toàn lúc 20:30.',
      suppliesConsumed: '20kg Cỏ khô, 6kg Cám đậm đặc, 1 chai xịt Blue Kote.',
      handoverNotes: 'Đã bổ sung nước đầy máng tự động, không có tiếng động lạ trong đêm.'
    }
  ]);

  const [filterShift, setFilterShift] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    shift: 'Ca Sáng (05:00 - 13:00)',
    horsesStatusSummary: '',
    suppliesConsumed: '',
    handoverNotes: ''
  });

  const handleCreateReport = (e) => {
    e.preventDefault();
    const created = {
      id: `REP-${Date.now()}`,
      date: '12/11/2026',
      shift: newReport.shift,
      author: 'Lê Hoàng Nam (Groom Block A)',
      completedTasksCount: '15/24 nhiệm vụ',
      horsesStatusSummary: newReport.horsesStatusSummary || '6/6 chiến mã được chăm sóc theo quy chuẩn.',
      suppliesConsumed: newReport.suppliesConsumed || 'Tiêu hao thức ăn và vật tư đệm lót bình thường.',
      handoverNotes: newReport.handoverNotes || 'Bàn giao ca đầy đủ, không có sự cố ngoài ý muốn.'
    };
    setReportList([created, ...reportList]);
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

              <span style={{
                padding: '3px 10px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                Tiến độ: {rep.completedTasksCount}
              </span>
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

      {/* Modal lập báo cáo */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', padding: '22px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: 'var(--brass)' }}>
              Lập Báo Cáo Chăm Sóc & Bàn Giao Ca
            </h3>
            <form onSubmit={handleCreateReport}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Ca trực</label>
                <select
                  value={newReport.shift}
                  onChange={(e) => setNewReport({ ...newReport, shift: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                >
                  <option value="Ca Sáng (05:00 - 13:00)">Ca Sáng (05:00 - 13:00)</option>
                  <option value="Ca Chiều (13:00 - 21:00)">Ca Chiều (13:00 - 21:00)</option>
                  <option value="Ca Đêm (21:00 - 05:00)">Ca Đêm (21:00 - 05:00)</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Tình trạng chiến mã trong ca *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Ghi nhận tổng quát ăn uống, vận động, chấn thương phát sinh..."
                  value={newReport.horsesStatusSummary}
                  onChange={(e) => setNewReport({ ...newReport, horsesStatusSummary: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px', resize: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Vật tư & Thức ăn tiêu hao</label>
                <input
                  type="text"
                  placeholder="VD: 24kg Cỏ Alfalfa, 8kg yến mạch, 2 bao mùn cưa..."
                  value={newReport.suppliesConsumed}
                  onChange={(e) => setNewReport({ ...newReport, suppliesConsumed: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Nội dung bàn giao ca sau</label>
                <textarea
                  rows="2"
                  placeholder="Dặn dò ca sau về ngựa cần theo dõi, giờ uống thuốc, ngâm đá..."
                  value={newReport.handoverNotes}
                  onChange={(e) => setNewReport({ ...newReport, handoverNotes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--paper-dim)', border: '1px solid var(--line)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 18px', borderRadius: '6px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Lưu & Bàn Giao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

