import React, { useState } from 'react';
import { GROOM_SHIFTS, GROOM_TEAM_MEMBERS } from '../../services/groomService';

export default function GroomTasksTab({
  tasks = [],
  onUpdateTaskStatus,
  onOpenScheduleModal,
  onDeleteTask,
  currentGroomUser = GROOM_TEAM_MEMBERS[0] // Mặc định là Chủ nhóm
}) {
  const isLead = currentGroomUser?.isLead !== false; // true nếu là Chủ nhóm

  const [dateFilter, setDateFilter] = useState('TODAY'); // 'TODAY' | 'YESTERDAY' | 'TOMORROW' | 'ALL'
  const [filterShift, setFilterShift] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'
  const [filterStaff, setFilterStaff] = useState(isLead ? 'ALL' : currentGroomUser.id);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Nếu là Nhân viên Groom thì bắt buộc chỉ lọc theo cá nhân mình
  const effectiveStaffFilter = isLead ? filterStaff : currentGroomUser.id;

  const filteredTasks = tasks.filter(t => {
    // Lọc theo ngày
    if (dateFilter !== 'ALL') {
      const taskDate = t.dateKey || 'TODAY';
      if (taskDate !== dateFilter) return false;
    }

    // Lọc theo ca
    if (filterShift !== 'ALL' && t.shift !== filterShift) return false;

    // Lọc theo nhân sự
    if (effectiveStaffFilter !== 'ALL') {
      const matchId = t.groomId === effectiveStaffFilter;
      const matchName = t.groom === currentGroomUser.name;
      if (!matchId && !matchName) return false;
    }

    // Lọc theo loại công việc
    if (filterType !== 'ALL' && t.type !== filterType) return false;

    // Lọc theo trạng thái
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;

    // Tìm kiếm
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchHorse = t.horseName?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchStall = t.stall?.toLowerCase().includes(q);
      const matchGroom = t.groom?.toLowerCase().includes(q);
      return matchHorse || matchTitle || matchStall || matchGroom;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* BANNER PHÂN QUYỀN RÕ RÀNG */}
      {!isLead ? (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderLeft: '4px solid #3B82F6',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#3B82F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <b>Chế độ Nhân viên Groom ({currentGroomUser.name} - {currentGroomUser.shiftName}):</b> Bạn chỉ xem và thực hiện các nhiệm vụ được <b>Chủ nhóm Groom</b> phân công cho riêng bạn. Bạn không có quyền thêm hoặc xóa lịch công việc.
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.15)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
            VIỆC RIÊNG CỦA BẠN
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderLeft: '4px solid var(--brass)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          color: 'var(--brass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <b>Đặc quyền Chủ nhóm Groom ({currentGroomUser.name}):</b> Bạn có toàn quyền thiết lập ca trực, phân bổ nhân sự, tạo lịch công việc mới hoặc xóa các lịch công việc không còn cần thiết cho bản thân và các Groom dưới quyền.
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(212, 175, 55, 0.18)', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>
            QUYỀN ĐIỀU PHỐI & PHÂN CA
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            {isLead ? 'Lịch Công Việc & Phân Ca Nhân Sự Groom' : `Nhiệm Vụ Được Giao: ${currentGroomUser.name}`}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            {isLead
              ? 'Chủ nhóm Groom điều phối ca trực, theo dõi tiến độ nhân sự và kiểm soát toàn bộ công việc chăm sóc.'
              : `Danh sách nhiệm vụ do Chủ nhóm Groom phân công cho bạn trong ca trực (${filteredTasks.length} nhiệm vụ).`}
          </p>
        </div>

        {/* Nút Tạo lịch CHỈ HIỆN KHI LÀ CHỦ NHÓM GROOM */}
        {isLead && (
          <button
            type="button"
            onClick={onOpenScheduleModal}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              background: 'var(--brass)',
              color: '#0A0D14',
              fontWeight: 800,
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)'
            }}
          >
            + Phân Ca & Tạo Lịch Công Việc
          </button>
        )}
      </div>

      {/* Thanh bộ lọc & tìm kiếm */}
      <div className="facility-card" style={{ padding: '16px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Lọc theo ngày */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--line)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setDateFilter('YESTERDAY')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'YESTERDAY' ? 700 : 500,
                background: dateFilter === 'YESTERDAY' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'YESTERDAY' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Hôm Qua
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TODAY')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'TODAY' ? 700 : 500,
                background: dateFilter === 'TODAY' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'TODAY' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Hôm Nay
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TOMORROW')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'TOMORROW' ? 700 : 500,
                background: dateFilter === 'TOMORROW' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'TOMORROW' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Ngày Mai
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('ALL')}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'ALL' ? 700 : 500,
                background: dateFilter === 'ALL' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'ALL' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Tất Cả
            </button>
          </div>

          {/* Ô tìm kiếm */}
          <input
            type="text"
            placeholder="Tìm theo tên ngựa, ô chuồng, nội dung việc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12px',
              minWidth: '220px',
              flex: 1
            }}
          />

          {/* Lọc theo Nhân sự (CHỈ HIỆN VỚI CHỦ NHÓM) */}
          {isLead && (
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                color: 'var(--paper)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả nhân sự Groom</option>
              {GROOM_TEAM_MEMBERS.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.title})
                </option>
              ))}
            </select>
          )}

          {/* Lọc Ca làm việc */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tất cả các ca</option>
            {GROOM_SHIFTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.timeRange})
              </option>
            ))}
          </select>

          {/* Lọc trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Danh sách công việc */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '45px 20px',
            color: 'var(--paper-dim)',
            fontSize: '13px',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px dashed var(--line)'
          }}>
            Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.
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
                  background: isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-card)',
                  borderLeft: isOverdue ? '4px solid #EF4444' : inProgress ? '4px solid var(--brass)' : isDone ? '4px solid #10B981' : '4px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Khối thông tin giờ & ô chuồng */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    width: '74px',
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
                    <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                      {t.stall}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <b style={{ fontSize: '14px', color: 'var(--paper)' }}>
                        {t.title}
                      </b>
                      <span style={{ fontSize: '12px', color: 'var(--brass)', fontWeight: 700 }}>
                        · {t.horseName}
                      </span>
                      {t.shiftLabel && (
                        <span style={{
                          fontSize: '10.5px',
                          color: 'var(--paper-dim)',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--line)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {t.shiftLabel.split(' (')[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.45 }}>
                      {t.desc}
                    </div>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--paper-dim)', marginTop: '6px' }}>
                      <span>Phụ trách: <b style={{ color: 'var(--paper)' }}>{t.groom || 'Groom phụ trách'}</b></span>
                      {t.createdBy && (
                        <span style={{ color: 'var(--brass)' }}>· Phân công bởi: {t.createdBy}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Khối nút thao tác: Cập nhật tiến độ & Quyền xóa */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {isDone ? (
                    <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '5px 12px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      ✓ Đã xong ({t.completedAt || 'Vừa xong'})
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
                      ✓ Xác Nhận Hoàn Thành
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
                      Xử Lý & Hoàn Thành Ngay
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

                  {/* NÚT XÓA: CHỈ HIỂN THỊ KHI LÀ CHỦ NHÓM GROOM (HEAD GROOM) */}
                  {isLead && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn xóa lịch công việc: "${t.title}"?`)) {
                          onDeleteTask(t.id);
                        }
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Chủ nhóm xóa bỏ công việc này khỏi ca trực"
                    >
                      ✕ Xóa
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
