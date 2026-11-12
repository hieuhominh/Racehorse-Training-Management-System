import React, { useState } from 'react';

export default function GroomReportsTab({ reports = [], onSubmitDailyReport }) {
  const [reportList, setReportList] = useState([
    {
      id: 'REP-2026-11-12-SANG',
      date: '12/11/2026',
      shift: 'Ca Sáng (05:00 - 13:00)',
      author: 'Lê Hoàng Nam (Groom Block A)',
      completedTasksCount: '15/24 nhiệm vụ',
      horsesStatusSummary: '6/6 chiến mã ổn định, Bạch Long bỏ 50% cỏ sáng, Xích Thố tiếp tục chườm đá khớp chân.',
      suppliesConsumed: '24kg Cỏ Alfalfa, 8kg Yến mạch, 2 bao mùn cưa, 1 gói Phenylbutazone.',
      handoverNotes: 'Ca chiều 13:00 lưu ý đón Lôi Chấn (Ô A5) sau bài tập 14:30 để ngâm đá Cryo. Kiểm tra lại phân của Bạch Long (Ô A3).'
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
    if (onSubmitDailyReport) onSubmitDailyReport(created);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            📝 Báo Cáo Chăm Sóc Hằng Ngày (Daily Reports & Handover)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Tổng hợp kết quả ca trực, lượng thức ăn tiêu hao và biên bản bàn giao ca cho nhân viên tiếp theo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
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
          + Lập Báo Cáo Bàn Giao Ca
        </button>
      </div>

      {/* Danh sách báo cáo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {reportList.map((rep) => (
          <div key={rep.id} className="facility-card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{rep.shift} · Ngày {rep.date}</b>
                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                  Người lập: <b style={{ color: 'var(--paper)' }}>{rep.author}</b> · Mã phiếu: {rep.id}
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '5px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                Tiến độ: {rep.completedTasksCount}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--paper)', lineHeight: 1.5 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px' }}>
                <b style={{ color: 'var(--brass)' }}>Tình trạng chiến mã trong ca:</b> {rep.horsesStatusSummary}
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px' }}>
                <b style={{ color: 'var(--paper-dim)' }}>Vật tư & Thức ăn tiêu hao:</b> {rep.suppliesConsumed}
              </div>
              <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--line)', padding: '10px 14px', borderRadius: '6px' }}>
                <b style={{ color: 'var(--brass)' }}>Dặn dò bàn giao ca sau:</b> {rep.handoverNotes}
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
              📝 Lập Báo Cáo Chăm Sóc & Bàn Giao Ca
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

