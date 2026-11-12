import React, { useState } from 'react';

export default function GroomTasksTab({ tasks = [], onUpdateTaskStatus, onAddTask }) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'FEEDING' | 'CLEANING' | 'GROOMING' | 'HEALTH_CHECK' | 'VET_CARE' | 'POST_TRAIN'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'OVERDUE'
  const [searchTerm, setSearchTerm] = useState('');

  // Modal tạo công việc mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    horseName: 'Hắc Phong',
    stall: 'Ô A1',
    time: '12:00',
    type: 'FEEDING',
    title: '',
    desc: ''
  });

  const filteredTasks = tasks.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchHorse = t.horseName?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchStall = t.stall?.toLowerCase().includes(q);
      return matchHorse || matchTitle || matchStall;
    }
    return true;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;
    const newTask = {
      id: `T-${Date.now()}`,
      time: newTaskForm.time,
      horseName: newTaskForm.horseName,
      stall: newTaskForm.stall,
      type: newTaskForm.type,
      title: newTaskForm.title,
      desc: newTaskForm.desc || 'Nhiệm vụ chăm sóc phát sinh trong ca trực.',
      status: 'PENDING',
      groom: 'Lê Hoàng Nam'
    };
    if (onAddTask) onAddTask(newTask);
    setShowAddModal(false);
    setNewTaskForm({
      horseName: 'Hắc Phong',
      stall: 'Ô A1',
      time: '12:00',
      type: 'FEEDING',
      title: '',
      desc: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            📋 Công Việc Hằng Ngày (My Daily Tasks)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Theo dõi, thực hiện và đánh dấu hoàn thành 24 nhiệm vụ chăm sóc theo từng mốc giờ trong ca trực.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
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
          + Thêm Công Việc Ca Trực
        </button>
      </div>

      {/* Thanh bộ lọc & tìm kiếm */}
      <div className="facility-card" style={{ padding: '16px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Ô tìm kiếm */}
          <input
            type="text"
            placeholder="Tìm theo tên ngựa, ô chuồng hoặc tên công việc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12.5px',
              minWidth: '260px',
              flex: 1
            }}
          />

          {/* Lọc loại công việc */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tất cả loại việc</option>
            <option value="FEEDING">🌾 Cho ăn & Uống nước</option>
            <option value="CLEANING">🧹 Vệ sinh chuồng & Đệm lót</option>
            <option value="GROOMING">🧼 Chải lông, tắm & Móng</option>
            <option value="HEALTH_CHECK">🩺 Kiểm tra sức khỏe</option>
            <option value="VET_CARE">💊 Y lệnh thú y</option>
            <option value="POST_TRAIN">❄️ Chăm sóc sau tập</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">🕒 Đang chờ</option>
            <option value="IN_PROGRESS">⏳ Đang thực hiện</option>
            <option value="COMPLETED">✓ Đã hoàn thành</option>
            <option value="OVERDUE">⚠️ Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Danh sách công việc */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--paper-dim)', fontSize: '13px' }}>
            Không tìm thấy công việc nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'COMPLETED';
            const isOverdue = t.status === 'OVERDUE';
            const inProgress = t.status === 'IN_PROGRESS';

            return (
              <div
                key={t.id}
                className="facility-card"
                style={{
                  padding: '16px 20px',
                  background: isOverdue ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
                  borderLeft: isOverdue ? '4px solid #EF4444' : inProgress ? '4px solid var(--brass)' : isDone ? '4px solid #10B981' : '4px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    width: '64px',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: isOverdue ? '#EF4444' : 'var(--brass)' }}>
                      {t.time}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>
                      {t.stall}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <b style={{ fontSize: '14.5px', color: 'var(--paper)' }}>
                        {t.title}
                      </b>
                      <span style={{ fontSize: '12px', color: 'var(--brass)', fontWeight: 600 }}>
                        · {t.horseName}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)', lineHeight: 1.45 }}>
                      {t.desc}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {isDone ? (
                    <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
                      ✓ Đã xong lúc {t.completedAt}
                    </span>
                  ) : inProgress ? (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.id, 'COMPLETED')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        background: '#10B981',
                        color: '#FFF',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Hoàn Thành
                    </button>
                  ) : isOverdue ? (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.id, 'COMPLETED')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        background: '#EF4444',
                        color: '#FFF',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Xử Lý Ngay
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        background: 'var(--brass)',
                        color: '#0A0D14',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Bắt Đầu Làm
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal tạo công việc mới */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '22px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: 'var(--brass)' }}>
              + Thêm Nhiệm Vụ Chăm Sóc Mới
            </h3>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Tên nhiệm vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bổ sung cỏ Alfalfa, thay rơm ô A1..."
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Chiến mã</label>
                  <select
                    value={newTaskForm.horseName}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, horseName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  >
                    <option value="Hắc Phong">Hắc Phong (Ô A1)</option>
                    <option value="Xích Thố">Xích Thố (Ô A2)</option>
                    <option value="Bạch Long">Bạch Long (Ô A3)</option>
                    <option value="Phi Yến">Phi Yến (Ô A4)</option>
                    <option value="Lôi Chấn">Lôi Chấn (Ô A5)</option>
                    <option value="Kim Sa">Kim Sa (Ô A6)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Giờ thực hiện</label>
                  <input
                    type="time"
                    value={newTaskForm.time}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, time: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper)', marginBottom: '4px' }}>Mô tả cụ thể</label>
                <textarea
                  rows="2"
                  value={newTaskForm.desc}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, desc: e.target.value })}
                  placeholder="Ghi chú quy trình thực hiện..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '12.5px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--paper-dim)', border: '1px solid var(--line)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 18px', borderRadius: '6px', background: 'var(--brass)', color: '#0A0D14', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Thêm Nhiệm Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

