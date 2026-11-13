import React, { useState, useMemo, useEffect } from 'react';
import { GROOM_SHIFTS, GROOM_TEAM_MEMBERS } from '../../services/groomService';

export default function GroomTasksTab({
  tasks = [],
  onUpdateTaskStatus,
  onOpenScheduleModal,
  onDeleteTask,
  currentGroomUser = GROOM_TEAM_MEMBERS[0], // Mặc định là Chủ nhóm
  groomTeam = [] // Danh sách nhân sự Groom thời gian thực bao gồm người mới do Admin thêm
}) {
  const isLead = currentGroomUser?.isLead !== false; // true nếu là Chủ nhóm

  const effectiveGroomTeam = useMemo(() => {
    if (Array.isArray(groomTeam) && groomTeam.length > 0) return groomTeam;
    return GROOM_TEAM_MEMBERS;
  }, [groomTeam]);

  // Giữ lại bộ lọc ngày khi refresh (F5)
  const [dateFilter, setDateFilter] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_groom_date_filter');
      if (saved && ['TODAY', 'YESTERDAY', 'TOMORROW', 'ALL'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'TODAY';
  });

  // Theo dõi ngày hiện tại theo thời gian thực (tự động cập nhật vào 00h00)
  const [currentDateKey, setCurrentDateKey] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date();
      const key = `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
      if (key !== currentDateKey) {
        setCurrentDateKey(key);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentDateKey]);

  // Tính ngày thời gian thực (Real-time Date) - Tự động cập nhật ngày mới lúc 00h00
  const realTimeDates = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatDDMM = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}`;
    };

    const formatFullVN = (d) => {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[d.getDay()];
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dayName}, ${dd}/${mm}/${yyyy}`;
    };

    return {
      todayStr: formatDDMM(today),
      yesterdayStr: formatDDMM(yesterday),
      tomorrowStr: formatDDMM(tomorrow),
      todayFullVN: formatFullVN(today),
      getTaskDateStr: (dateKey) => {
        if (dateKey === 'YESTERDAY') return formatDDMM(yesterday);
        if (dateKey === 'TOMORROW') return formatDDMM(tomorrow);
        return formatDDMM(today);
      }
    };
  }, [currentDateKey]);

  const [filterShift, setFilterShift] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_groom_shift_filter');
      if (saved) return saved;
    } catch {}
    return 'ALL';
  });

  const [filterStaff, setFilterStaff] = useState(() => {
    if (!isLead) return currentGroomUser.id;
    try {
      const saved = localStorage.getItem('matruong_groom_staff_filter');
      if (saved) return saved;
    } catch {}
    return 'ALL';
  });

  const [filterType, setFilterType] = useState('ALL');

  const [filterStatus, setFilterStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_groom_status_filter');
      if (saved) return saved;
    } catch {}
    return 'ALL';
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Lưu các trạng thái bộ lọc vào localStorage để khi refresh trang không bị reset
  useEffect(() => {
    try {
      localStorage.setItem('matruong_groom_date_filter', dateFilter);
    } catch {}
  }, [dateFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('matruong_groom_shift_filter', filterShift);
    } catch {}
  }, [filterShift]);

  useEffect(() => {
    if (isLead) {
      try {
        localStorage.setItem('matruong_groom_staff_filter', filterStaff);
      } catch {}
    }
  }, [filterStaff, isLead]);

  useEffect(() => {
    try {
      localStorage.setItem('matruong_groom_status_filter', filterStatus);
    } catch {}
  }, [filterStatus]);

  // Nếu là Nhân viên Groom thì bắt buộc chỉ lọc theo cá nhân mình
  const effectiveStaffFilter = isLead ? filterStaff : currentGroomUser.id;

  // Lấy thông tin nhân viên đang được lọc cụ thể
  const selectedStaffMember = useMemo(() => {
    if (effectiveStaffFilter === 'ALL') return null;
    return effectiveGroomTeam.find(g => g.id === effectiveStaffFilter || g.username === effectiveStaffFilter);
  }, [effectiveStaffFilter, effectiveGroomTeam]);

  // Hàm kiểm tra một task có thuộc về nhân viên đang được lọc hay không
  const isTaskBelongToFilteredStaff = (t) => {
    if (effectiveStaffFilter === 'ALL') {
      // Nếu là Nhân viên Groom thông thường (không phải Chủ nhóm) -> chỉ xem việc của riêng mình
      if (!isLead) {
        const myName = currentGroomUser.name;
        const myId = currentGroomUser.id;
        const matchId = t.groomId === myId || t.groomId === currentGroomUser.username;
        const matchName = myName && (t.groom === myName || t.groom?.includes(myName));
        return Boolean(matchId || matchName);
      }
      // Chủ nhóm khi để 'ALL' thì thấy toàn bộ công việc ca trực
      return true;
    }

    // Khi lọc theo một nhân viên cụ thể -> CHỈ KHỚP ĐÚNG NHÂN VIÊN ĐÓ (không hiển thị việc của người khác hay của Chủ nhóm)
    const targetName = selectedStaffMember ? selectedStaffMember.name : null;
    const matchId = t.groomId === effectiveStaffFilter || (selectedStaffMember && t.groomId === selectedStaffMember.username);
    const matchName = targetName && (t.groom === targetName || t.groom?.includes(targetName));

    return Boolean(matchId || matchName);
  };

  // Thống kê nhanh theo nhiệm vụ
  const statusCounts = useMemo(() => {
    // Đếm theo tập nhiệm vụ áp dụng cho nhân sự hiện tại
    const scoped = tasks.filter(t => {
      if (dateFilter !== 'ALL') {
        const taskDate = t.dateKey || 'TODAY';
        if (taskDate !== dateFilter) return false;
      }
      return isTaskBelongToFilteredStaff(t);
    });

    return {
      all: scoped.length,
      inProgress: scoped.filter(t => t.dateKey !== 'TOMORROW' && t.status === 'IN_PROGRESS').length,
      pending: scoped.filter(t => t.dateKey === 'TOMORROW' || t.status === 'PENDING').length,
      overdue: scoped.filter(t => t.dateKey !== 'TOMORROW' && t.status === 'OVERDUE').length,
      completed: scoped.filter(t => t.dateKey !== 'TOMORROW' && t.status === 'COMPLETED').length
    };
  }, [tasks, dateFilter, effectiveStaffFilter, selectedStaffMember, isLead, currentGroomUser]);

  const filteredTasks = tasks.filter(t => {
    // Lọc theo ngày
    if (dateFilter !== 'ALL') {
      const taskDate = t.dateKey || 'TODAY';
      if (taskDate !== dateFilter) return false;
    }

    // Lọc theo ca
    if (filterShift !== 'ALL' && t.shift !== filterShift) return false;

    // Lọc theo nhân sự chuẩn xác
    if (!isTaskBelongToFilteredStaff(t)) return false;

    // Lọc theo loại công việc
    if (filterType !== 'ALL' && t.type !== filterType) return false;

    // Lọc theo trạng thái - Với công việc ngày mai thì luôn là ĐANG CHỜ (PENDING), không có ĐÃ XONG
    if (filterStatus !== 'ALL') {
      if (t.dateKey === 'TOMORROW') {
        if (filterStatus !== 'PENDING') return false;
      } else if (t.status !== filterStatus) {
        return false;
      }
    }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* BANNER PHÂN QUYỀN RÕ RÀNG */}
      {!isLead ? (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderLeft: '4px solid #3B82F6',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '12px',
          color: '#3B82F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <b>Chế độ Nhân viên Groom ({currentGroomUser.name} - {currentGroomUser.shiftName}):</b> Bạn đang xem các nhiệm vụ được <b>Chủ nhóm Groom</b> phân công trực tiếp cho bạn.
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            VIỆC RIÊNG CỦA BẠN
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderLeft: '4px solid var(--brass)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '12px',
          color: 'var(--brass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <b>Đặc quyền Chủ nhóm Groom ({currentGroomUser.name}):</b> Bạn có toàn quyền thiết lập ca trực, tạo lịch công việc mới hoặc xóa bỏ công việc cho toàn đội ngũ Groom.
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(212, 175, 55, 0.18)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
            ĐIỀU PHỐI & PHÂN CA
          </span>
        </div>
      )}

      {/* Header & Nút hành động */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
              {isLead ? 'Lịch Công Việc Hằng Ngày & Phân Ca Groom' : `Nhiệm Vụ Được Giao: ${currentGroomUser.name}`}
            </h2>
            <span style={{
              fontSize: '11px',
              color: 'var(--brass)',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📅 {realTimeDates.todayFullVN}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Theo trình tự: Cho ăn · Vệ sinh chuồng · Chải lông & tắm · Kiểm tra móng · Chăm sóc sau tập · Đo sức khỏe · Cho uống thuốc.
          </p>
        </div>

        {/* Nút Tạo lịch CHỈ HIỆN KHI LÀ CHỦ NHÓM GROOM */}
        {isLead && (
          <button
            type="button"
            onClick={onOpenScheduleModal}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--brass)',
              color: '#0A0D14',
              fontWeight: 800,
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(212, 175, 55, 0.3)'
            }}
          >
            + Phân Ca & Tạo Lịch Công Việc
          </button>
        )}
      </div>

      {/* MỤC RIÊNG CỦA CHỦ NHÓM: THEO DÕI NHANH TỪNG NHÂN VIÊN GROOM ĐANG LÀM GÌ & ĐÃ HOÀN THÀNH CHƯA */}
      {isLead && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                👥 Giám Sát Tiến Độ Từng Nhân Viên Groom
              </span>
              <span style={{ fontSize: '11px', color: 'var(--paper-dim)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                {effectiveGroomTeam.filter(m => !m.isLead).length} nhân sự dưới quyền
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
              {filterStaff !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => setFilterStaff('ALL')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brass)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    textDecoration: 'underline'
                  }}
                >
                  ✕ Đang lọc theo nhân viên (Bấm để xem tất cả)
                </button>
              ) : (
                'Bấm vào thẻ nhân viên để lọc nhanh danh sách'
              )}
            </div>
          </div>

          {/* Grid các nhân viên Groom */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px'
          }}>
            {effectiveGroomTeam.filter(m => !m.isLead).map(staff => {
              const staffTasks = tasks.filter(t => {
                if (dateFilter !== 'ALL' && (t.dateKey || 'TODAY') !== dateFilter) return false;
                return t.groomId === staff.id || t.groomId === staff.username || t.groom === staff.name || t.groom?.includes(staff.name);
              });
              const completed = staffTasks.filter(t => t.dateKey !== 'TOMORROW' && t.status === 'COMPLETED').length;
              const inProgress = staffTasks.find(t => t.dateKey !== 'TOMORROW' && t.status === 'IN_PROGRESS');
              const total = staffTasks.length;
              const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isSelected = filterStaff === staff.id;

              return (
                <div
                  key={staff.id}
                  onClick={() => setFilterStaff(isSelected ? 'ALL' : staff.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-secondary)',
                    border: isSelected ? '1.5px solid var(--brass)' : inProgress ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid var(--line)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Bấm để ${isSelected ? 'bỏ lọc' : 'xem công việc của ' + staff.name}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--paper)' }}>
                        {staff.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '1px' }}>
                        {staff.shiftName.split(' (')[0]}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: rate === 100 && total > 0 ? '#10B981' : 'var(--brass)'
                      }}>
                        {completed}/{total} xong ({rate}%)
                      </span>
                    </div>
                  </div>

                  {/* Thanh tiến độ mini */}
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${rate}%`,
                      height: '100%',
                      background: rate === 100 && total > 0 ? '#10B981' : 'var(--brass)'
                    }} />
                  </div>

                  {/* Đang làm gì */}
                  <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inProgress ? (
                      <span style={{ color: 'var(--brass)', fontWeight: 600 }}>
                        ⏳ Đang làm: {inProgress.title} ({inProgress.stall})
                      </span>
                    ) : total > 0 && completed === total ? (
                      <span style={{ color: '#10B981', fontWeight: 600 }}>
                        ✓ Đã xong hết công việc
                      </span>
                    ) : (
                      <span style={{ color: 'var(--paper-dim)' }}>
                        ⏱ Đang chờ công việc tiếp theo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thanh Quick Filter theo trạng thái & Bộ lọc chi tiết */}
      <div className="facility-card" style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--line)' }}>
        {/* Hàng 1: Quick Status Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '12px', color: 'var(--paper-dim)', fontWeight: 600, marginRight: '4px' }}>Trạng thái:</span>
          
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: filterStatus === 'ALL' ? 700 : 500,
              background: filterStatus === 'ALL' ? 'var(--brass)' : 'var(--bg-secondary)',
              color: filterStatus === 'ALL' ? '#0A0D14' : 'var(--paper-dim)',
              border: filterStatus === 'ALL' ? 'none' : '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            Tất Cả ({statusCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('IN_PROGRESS')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: filterStatus === 'IN_PROGRESS' ? 700 : 500,
              background: filterStatus === 'IN_PROGRESS' ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-secondary)',
              color: filterStatus === 'IN_PROGRESS' ? 'var(--brass)' : 'var(--paper-dim)',
              border: filterStatus === 'IN_PROGRESS' ? '1px solid var(--brass)' : '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            Đang Làm ({statusCounts.inProgress})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: filterStatus === 'PENDING' ? 700 : 500,
              background: filterStatus === 'PENDING' ? 'rgba(148, 163, 184, 0.2)' : 'var(--bg-secondary)',
              color: filterStatus === 'PENDING' ? '#CBD5E1' : 'var(--paper-dim)',
              border: filterStatus === 'PENDING' ? '1px solid #94A3B8' : '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            Đang Chờ ({statusCounts.pending})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('OVERDUE')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: filterStatus === 'OVERDUE' ? 700 : 500,
              background: filterStatus === 'OVERDUE' ? '#EF4444' : 'var(--bg-secondary)',
              color: filterStatus === 'OVERDUE' ? '#FFF' : statusCounts.overdue > 0 ? '#EF4444' : 'var(--paper-dim)',
              border: filterStatus === 'OVERDUE' ? 'none' : '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            Quá Hạn ({statusCounts.overdue})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('COMPLETED')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: filterStatus === 'COMPLETED' ? 700 : 500,
              background: filterStatus === 'COMPLETED' ? '#10B981' : 'var(--bg-secondary)',
              color: filterStatus === 'COMPLETED' ? '#FFF' : 'var(--paper-dim)',
              border: filterStatus === 'COMPLETED' ? 'none' : '1px solid var(--line)',
              cursor: 'pointer'
            }}
          >
            Đã Xong ({statusCounts.completed})
          </button>
        </div>

        {/* Hàng 2: Bộ lọc ngày, tìm kiếm, ca, nhân sự */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Lọc theo ngày - Hiển thị ngày thời gian thực */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--line)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setDateFilter('YESTERDAY')}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'YESTERDAY' ? 700 : 500,
                background: dateFilter === 'YESTERDAY' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'YESTERDAY' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
              title={`Hôm qua (${realTimeDates.yesterdayStr})`}
            >
              Hôm Qua ({realTimeDates.yesterdayStr})
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TODAY')}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'TODAY' ? 700 : 500,
                background: dateFilter === 'TODAY' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'TODAY' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
              title={`Hôm nay (${realTimeDates.todayStr})`}
            >
              Hôm Nay ({realTimeDates.todayStr})
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TOMORROW')}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: dateFilter === 'TOMORROW' ? 700 : 500,
                background: dateFilter === 'TOMORROW' ? 'var(--brass)' : 'transparent',
                color: dateFilter === 'TOMORROW' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
              title={`Ngày mai (${realTimeDates.tomorrowStr})`}
            >
              Ngày Mai ({realTimeDates.tomorrowStr})
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('ALL')}
              style={{
                padding: '5px 8px',
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
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12px',
              minWidth: '200px',
              flex: 1
            }}
          />

          {/* Lọc theo Nhân sự (CHỈ HIỆN VỚI CHỦ NHÓM) - Tự động cập nhật khi Admin thêm người mới */}
          {isLead && (
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                color: 'var(--paper)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả nhân sự Groom ({effectiveGroomTeam.length})</option>
              {effectiveGroomTeam.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.isLead ? 'Chủ nhóm' : g.title || g.shiftName})
                </option>
              ))}
            </select>
          )}

          {/* Lọc Ca làm việc */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              color: 'var(--paper)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tất cả ca trực</option>
            {GROOM_SHIFTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.timeRange})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách công việc dạng Card ngang cân đối và sắc nét */}
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
            {selectedStaffMember ? (
              <div>
                <b style={{ color: 'var(--paper)', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  Nhân viên {selectedStaffMember.name} hiện không có nhiệm vụ nào.
                </b>
                <span>
                  {dateFilter !== 'ALL'
                    ? `Chưa có nhiệm vụ được phân công trong mục ${dateFilter === 'TODAY' ? 'Hôm Nay' : dateFilter === 'TOMORROW' ? 'Ngày Mai' : 'Hôm Qua'}.`
                    : 'Nhân viên này hiện chưa được phân công nhiệm vụ nào.'}
                </span>
              </div>
            ) : (
              'Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.'
            )}
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isTomorrow = t.dateKey === 'TOMORROW';
            const isDone = !isTomorrow && t.status === 'COMPLETED';
            const isOverdue = !isTomorrow && (t.status === 'OVERDUE' || (t.status === 'PENDING' && t.dateKey === 'YESTERDAY'));
            const inProgress = !isTomorrow && t.status === 'IN_PROGRESS';

            return (
              <div
                key={t.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '84px minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 18px',
                  background: isOverdue ? 'rgba(239, 68, 68, 0.05)' : isDone ? 'rgba(16, 185, 129, 0.02)' : isTomorrow ? 'rgba(100, 116, 139, 0.03)' : 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  borderLeft: isTomorrow ? '4px solid #64748B' : isOverdue ? '4px solid #EF4444' : inProgress ? '4px solid var(--brass)' : isDone ? '4px solid #10B981' : '4px solid #475569',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                {/* Cột 1: Box Thời gian & Ô chuồng kèm Ngày gọn gàng */}
                <div style={{
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  padding: '7px 6px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '48px',
                  width: '84px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: isTomorrow ? 'var(--brass)' : isOverdue ? '#EF4444' : inProgress ? 'var(--brass)' : isDone ? '#10B981' : 'var(--brass)',
                    lineHeight: 1.15
                  }}>
                    {t.time}
                  </div>
                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--paper-dim)',
                    marginTop: '3px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {t.stall} <span style={{ color: isTomorrow ? '#94A3B8' : 'var(--brass)', fontWeight: 700 }}>· {realTimeDates.getTaskDateStr(t.dateKey)}</span>
                  </div>
                </div>

                {/* Cột 2: Thông tin công việc (Tiêu đề, chiến mã, ca, mô tả, nhân sự) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)' }}>
                      {t.title}
                    </span>
                    {t.horseName && (
                      <span style={{ fontSize: '12.5px', color: 'var(--brass)', fontWeight: 700 }}>
                        · {t.horseName}
                      </span>
                    )}

                    {/* Badge trạng thái nhỏ gọn - Ngày mai cố định ⏱ Lịch Ngày Mai */}
                    {isTomorrow ? (
                      <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(148, 163, 184, 0.12)', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '1px 7px', borderRadius: '4px', fontWeight: 600 }}>
                        ⏱ Lịch Ngày Mai
                      </span>
                    ) : isDone ? (
                      <span style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
                        ✓ Đã Hoàn Thành
                      </span>
                    ) : inProgress ? (
                      <span style={{ fontSize: '11px', color: 'var(--brass)', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
                        ⏳ Đang Thực Hiện
                      </span>
                    ) : isOverdue ? (
                      <span style={{ fontSize: '11px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
                        ⚠ Quá Hạn
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.25)', padding: '1px 7px', borderRadius: '4px', fontWeight: 600 }}>
                        ⏱ Đang Chờ
                      </span>
                    )}

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

                  {t.desc && (
                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.desc}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--paper-dim)', flexWrap: 'wrap' }}>
                    <span>Phụ trách: <b style={{ color: 'var(--paper)', fontWeight: 600 }}>{t.groom || 'Groom phụ trách'}</b></span>
                    {t.createdBy && (
                      <span>· Phân công bởi: <span style={{ color: 'var(--brass)', fontWeight: 600 }}>{t.createdBy}</span></span>
                    )}
                  </div>
                </div>

                {/* Cột 3: Cụm nút hành động - Cân bằng kích thước chuẩn hóa 100% */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  flexShrink: 0
                }}>
                  {/* CÁC CÔNG VIỆC VÀO NGÀY MAI: TUYỆT ĐỐI KHÔNG ĐƯỢC BẤM HOÀN THÀNH HOẶC BẮT ĐẦU */}
                  {isTomorrow ? (
                    <span
                      style={{
                        width: '168px',
                        height: '36px',
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#94A3B8',
                        fontWeight: 600,
                        background: 'rgba(148, 163, 184, 0.08)',
                        borderRadius: '6px',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        whiteSpace: 'nowrap',
                        cursor: 'not-allowed',
                        userSelect: 'none'
                      }}
                      title="Lịch dự kiến ngày mai. Không thể thực hiện hoặc xác nhận hoàn thành trước ngày!"
                    >
                      ⏱ Lịch Ngày Mai
                    </span>
                  ) : isDone ? (
                    <span style={{
                      width: '168px',
                      height: '36px',
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#10B981',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      ✓ Xong lúc {t.completedAt || '07:25'}
                    </span>
                  ) : inProgress ? (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.id, 'COMPLETED')}
                      style={{
                        width: '168px',
                        height: '36px',
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        background: '#10B981',
                        color: '#FFF',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      ✓ Xác Nhận Hoàn Thành
                    </button>
                  ) : isOverdue ? (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.id, 'COMPLETED')}
                      style={{
                        width: '168px',
                        height: '36px',
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        background: '#EF4444',
                        color: '#FFF',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)'
                      }}
                    >
                      Xử Lý Ngay
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                      style={{
                        width: '168px',
                        height: '36px',
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        background: 'var(--brass)',
                        color: '#0A0D14',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                      }}
                    >
                      Bắt Đầu Làm
                    </button>
                  )}

                  {/* NÚT XÓA: CHỈ HIỂN THỊ KHI LÀ CHỦ NHÓM GROOM (HEAD GROOM) - XÓA LIỀN KHÔNG POPUP */}
                  {isLead && (
                    <button
                      type="button"
                      onClick={() => onDeleteTask(t.id)}
                      style={{
                        width: '68px',
                        height: '36px',
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
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
