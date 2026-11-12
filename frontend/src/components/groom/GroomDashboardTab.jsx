import React, { useState } from 'react';
import { GROOM_TEAM_MEMBERS } from '../../services/groomService';

export default function GroomDashboardTab({
  horses = [],
  tasks = [],
  alerts = [],
  onUpdateTaskStatus,
  onOpenReportModal,
  onOpenHorseModal,
  onNavigateTab,
  onOpenScheduleModal,
  onDeleteTask,
  currentGroomUser = GROOM_TEAM_MEMBERS[0]
}) {
  const isLead = currentGroomUser?.isLead !== false;

  // Bộ lọc xem tiến độ theo ngày và theo nhân viên
  const [selectedDate, setSelectedDate] = useState('TODAY'); // 'TODAY' | 'YESTERDAY' | 'TOMORROW'
  const [selectedStaff, setSelectedStaff] = useState(isLead ? 'ALL' : currentGroomUser.id);
  const [horseViewMode, setHorseViewMode] = useState('CARD'); // 'CARD' | 'TABLE'

  // Nếu là Nhân viên Groom thì bắt buộc chỉ xem công việc của riêng mình
  const effectiveStaff = isLead ? selectedStaff : currentGroomUser.id;

  // Lọc tasks theo Ngày và theo Nhân viên để tính toán tiến độ thời gian thực
  const dateSpecificTasks = tasks.filter(t => {
    const taskDate = t.dateKey || 'TODAY';
    if (taskDate !== selectedDate) return false;

    if (effectiveStaff !== 'ALL') {
      const matchId = t.groomId === effectiveStaff;
      const matchName = t.groom?.toLowerCase().includes(
        GROOM_TEAM_MEMBERS.find(g => g.id === effectiveStaff)?.name.toLowerCase() || ''
      );
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  // 4.1. Thống kê số liệu tiến độ theo thời gian thực
  const totalHorses = horses.length;
  const totalTasks = dateSpecificTasks.length;
  const completedTasks = dateSpecificTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = dateSpecificTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pendingTasks = dateSpecificTasks.filter(t => t.status === 'PENDING').length;
  const overdueTasks = dateSpecificTasks.filter(t => t.status === 'OVERDUE').length;

  const monitoringHorses = horses.filter(h => h.healthStatus === 'MONITORING' || h.healthStatus === 'INJURED' || h.healthStatus === 'ISOLATED').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Hiển thị toàn bộ chiến mã trong hệ thống vì Groom phục vụ tất cả ngựa của các chủ sở hữu
  const filteredHorses = horses;

  // Helper render trạng thái sức khỏe của ngựa
  const renderHealthBadge = (status) => {
    switch (status) {
      case 'FIT':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            FIT: Đủ ĐK Sức Khỏe
          </span>
        );
      case 'MONITORING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
            MONITORING: Cần Theo Dõi
          </span>
        );
      case 'INJURED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.25)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
            INJURED: Bị Chấn Thương
          </span>
        );
      case 'ISOLATED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(139, 92, 246, 0.15)',
            color: '#A78BFA',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }} />
            ISOLATED: Đang Cách Ly
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ========================================================================= */}
      {/* 4.5. KHU VỰC CẢNH BÁO QUAN TRỌNG (EMERGENCY ALERTS) - LÀM NỔI BẬT ĐẦU TRANG */}
      {/* ========================================================================= */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              fontSize: '18px',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              🚨
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>KHU VỰC CẢNH BÁO SỨC KHỎE & AN TOÀN CHUỒNG TRẠI</span>
                {criticalAlerts > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FFF',
                    background: '#EF4444',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                  }}>
                    {criticalAlerts} KHẨN CẤP
                  </span>
                )}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                Các bất thường lâm sàng (bỏ ăn, đau bụng colic, khập khiễng, sưng chân, vết thương, y lệnh mới, lệnh khóa huấn luyện).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onOpenReportModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                background: '#EF4444',
                color: '#FFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}
            >
              <span>+</span> Phát Báo Động Thú Y
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('incidents')}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--paper)',
                border: '1px solid var(--line)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Xem Tất Cả Sự Cố ({alerts.length})
            </button>
          </div>
        </div>

        {/* Danh sách cảnh báo quan trọng hoặc Empty State */}
        {alerts.length === 0 ? (
          <div style={{
            padding: '28px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px dashed var(--line)'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '8px' }}>🛡️</div>
            <b style={{ color: 'var(--paper)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              {horses.length === 0
                ? 'Chưa có chiến mã nào trong danh sách phục vụ của Groom'
                : 'Tất cả chiến mã đang an toàn - Không ghi nhận bất thường'}
            </b>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--paper-dim)', maxWidth: '520px', display: 'inline-block', lineHeight: 1.5 }}>
              {horses.length === 0
                ? 'Khi Chủ sở hữu gửi gắm chiến mã và bạn nhấn [✓ Đồng Ý Tiếp Nhận], toàn bộ thông tin cảnh báo sức khỏe, hành vi bất thường và y lệnh thú y sẽ được hiển thị tại đây.'
                : 'Các chiến mã do bạn phụ trách chăm sóc hiện đang có thể trạng ổn định, ăn uống bình thường và không có cảnh báo chấn thương nguy hiểm.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '12px' }}>
            {alerts.slice(0, 6).map((alt) => {
              const isCritical = alt.severity === 'CRITICAL';
              return (
                <div
                  key={alt.id}
                  style={{
                    background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                    border: isCritical ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isCritical ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: isCritical ? '#EF4444' : alt.severity === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
                          color: isCritical ? '#FFF' : alt.severity === 'HIGH' ? '#F59E0B' : 'var(--paper-dim)',
                          border: isCritical ? 'none' : alt.severity === 'HIGH' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--line)'
                        }}>
                          {alt.severity}
                        </span>
                        <b style={{ fontSize: '13px', color: isCritical ? '#FCA5A5' : 'var(--paper)' }}>
                          {alt.horseName} ({alt.stall})
                        </b>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
                        {alt.time}
                      </span>
                    </div>

                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: isCritical ? '#EF4444' : 'var(--brass)', marginBottom: '4px' }}>
                      {alt.title}
                    </div>

                    <p style={{ margin: '0 0 8px', fontSize: '11.8px', color: 'var(--paper-dim)', lineHeight: 1.4 }}>
                      {alt.desc}
                    </p>
                  </div>

                  <div style={{
                    borderTop: '1px dashed var(--line)',
                    paddingTop: '8px',
                    marginTop: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: isCritical ? '#EF4444' : 'var(--paper-dim)', fontWeight: 600 }}>
                      ⚡ {alt.actionRequired}
                    </span>
                    {alt.reportedToVet && (
                      <span style={{ color: '#10B981', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '6px' }}>
                        ✓ Đã Báo Thú Y
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4.1. CÁC THẺ THỐNG KÊ (KPI STATS CARDS) - 8 CHỈ SỐ THEO ĐÚNG YÊU CẦU */}
      {/* ========================================================================= */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📊 Tổng Quan Thống Kê Ca Trực Hôm Nay
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
            Cập nhật tự động thời gian thực
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Card 1: Tổng số chiến mã */}
          <div className="facility-card" style={{ padding: '14px 16px', borderTop: '3px solid var(--brass)', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass)', textTransform: 'uppercase' }}>
              Chiến Mã Phân Công
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {totalHorses} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>con</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Block A (Khu 1-6)</div>
          </div>

          {/* Card 2: Tổng số công việc */}
          <div className="facility-card" style={{ padding: '14px 16px', borderTop: '3px solid var(--line-strong)', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--paper)', textTransform: 'uppercase' }}>
              Tổng Công Việc
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {totalTasks} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>nhiệm vụ</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Ca trực 24 giờ</div>
          </div>

          {/* Card 3: Đã hoàn thành */}
          <div className="facility-card" style={{ padding: '14px 16px', borderTop: '3px solid #10B981', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
              Đã Hoàn Thành
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {completedTasks} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>({completionPercent}%)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Đạt tiến độ chuẩn</div>
          </div>

          {/* Card 4: Đang thực hiện */}
          <div className="facility-card" style={{ padding: '14px 16px', borderTop: '3px solid var(--brass)', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass)', textTransform: 'uppercase' }}>
              Đang Thực Hiện
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--brass)', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {inProgressTasks} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>việc</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Đang diễn ra ở chuồng</div>
          </div>

          {/* Card 5: Đang chờ */}
          <div className="facility-card" style={{ padding: '14px 16px', borderTop: '3px solid var(--paper-dim)', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>
              Đang Chờ
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--paper)', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {pendingTasks} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>việc</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>Theo lịch sắp tới</div>
          </div>

          {/* Card 6: Quá hạn (Làm nổi bật) */}
          <div className="facility-card" style={{
            padding: '14px 16px',
            borderTop: '3px solid #EF4444',
            background: overdueTasks > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
            boxShadow: overdueTasks > 0 ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>
              Quá Hạn Xử Lý
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#EF4444', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {overdueTasks} <span style={{ fontSize: '12px', fontWeight: 500, color: '#EF4444' }}>việc</span>
            </div>
            <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>Cần giải quyết ngay</div>
          </div>

          {/* Card 7: Chiến mã cần theo dõi */}
          <div className="facility-card" style={{ padding: '14px 16px', borderTop: '3px solid #F59E0B', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>
              Cần Theo Dõi Sức Khỏe
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#F59E0B', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {monitoringHorses} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--paper-dim)' }}>con</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
              {horses.length > 0 ? horses.map(h => h.name).slice(0, 2).join(', ') : 'Theo dõi định kỳ'}
            </div>
          </div>

          {/* Card 8: Sự cố nghiêm trọng chưa xử lý */}
          <div className="facility-card" style={{
            padding: '14px 16px',
            borderTop: '3px solid #EF4444',
            background: criticalAlerts > 0 ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card)',
            boxShadow: criticalAlerts > 0 ? '0 0 15px rgba(239, 68, 68, 0.25)' : 'none'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>
              Sự Cố Nghiêm Trọng
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#EF4444', margin: '4px 0 2px', fontFamily: 'var(--display)' }}>
              {criticalAlerts} <span style={{ fontSize: '12px', fontWeight: 500, color: '#EF4444' }}>ca</span>
            </div>
            <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>Chờ BS Thú Y khám</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4.2. TIẾN ĐỘ CÔNG VIỆC TRONG NGÀY (WORK PROGRESS BAR & FILTERS) */}
      {/* ========================================================================= */}
      <section className="facility-card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--paper)' }}>
              📈 Tiến Độ Công Việc Trong Ngày
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
              Tổng công việc: <b>{totalTasks}</b> · Đã hoàn thành: <b>{completedTasks}</b> · Đang làm: <b>{inProgressTasks}</b> · Đang chờ: <b>{pendingTasks}</b> · Quá hạn: <b style={{ color: '#EF4444' }}>{overdueTasks}</b>
            </p>
          </div>

          {/* Bộ lọc xem theo ngày và theo nhân viên */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Lọc theo ngày */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--line)', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setSelectedDate('YESTERDAY')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: selectedDate === 'YESTERDAY' ? 700 : 500,
                  background: selectedDate === 'YESTERDAY' ? 'var(--brass)' : 'transparent',
                  color: selectedDate === 'YESTERDAY' ? '#0A0D14' : 'var(--paper-dim)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Hôm Qua
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate('TODAY')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: selectedDate === 'TODAY' ? 700 : 500,
                  background: selectedDate === 'TODAY' ? 'var(--brass)' : 'transparent',
                  color: selectedDate === 'TODAY' ? '#0A0D14' : 'var(--paper-dim)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Hôm Nay (12/11)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate('TOMORROW')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: selectedDate === 'TOMORROW' ? 700 : 500,
                  background: selectedDate === 'TOMORROW' ? 'var(--brass)' : 'transparent',
                  color: selectedDate === 'TOMORROW' ? '#0A0D14' : 'var(--paper-dim)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Ngày Mai
              </button>
            </div>

            {/* Lọc theo nhân viên */}
            {isLead ? (
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Chủ nhóm lọc xem tiến độ theo từng nhân viên chăm sóc"
              >
                <option value="ALL">Tất cả nhân viên Groom</option>
                {GROOM_TEAM_MEMBERS.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.title})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3B82F6',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                Tiến độ riêng: {currentGroomUser.name}
              </div>
            )}
          </div>
        </div>

        {/* Thanh tiến độ phân đoạn trực quan (Segmented Progress Bar) */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            height: '14px',
            width: '100%',
            background: 'var(--bg-secondary)',
            borderRadius: '7px',
            display: 'flex',
            overflow: 'hidden',
            border: '1px solid var(--line)'
          }}>
            {/* Hoàn thành (xanh) */}
            <div
              style={{
                width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                background: '#10B981',
                transition: 'width 0.4s ease'
              }}
              title={`Hoàn thành: ${completedTasks}/${totalTasks} (${completionPercent}%)`}
            />
            {/* Đang thực hiện (vàng brass) */}
            <div
              style={{
                width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%`,
                background: 'var(--brass)',
                transition: 'width 0.4s ease'
              }}
              title={`Đang làm: ${inProgressTasks}/${totalTasks}`}
            />
            {/* Quá hạn (đỏ) */}
            <div
              style={{
                width: `${totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0}%`,
                background: '#EF4444',
                transition: 'width 0.4s ease'
              }}
              title={`Quá hạn: ${overdueTasks}/${totalTasks}`}
            />
          </div>
        </div>

        {/* Chú thích tiến độ & Tỷ lệ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--paper-dim)', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} />
              Hoàn thành: <b style={{ color: '#10B981' }}>{completedTasks} ({completionPercent}%)</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--brass)' }} />
              Đang làm: <b style={{ color: 'var(--brass)' }}>{inProgressTasks}</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--paper-dim)' }} />
              Đang chờ: <b style={{ color: 'var(--paper)' }}>{pendingTasks}</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} />
              Quá hạn: <b style={{ color: '#EF4444' }}>{overdueTasks}</b>
            </span>
          </div>

          <div style={{ fontWeight: 800, color: completionPercent === 100 ? '#10B981' : 'var(--brass)', fontSize: '12.5px' }}>
            Tỷ Lệ Hoàn Thành: {completionPercent}%
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4.3. DANH SÁCH CHIẾN MÃ ĐƯỢC PHÂN CÔNG (CARD HOẶC TABLE VIEW) */}
      {/* ========================================================================= */}
      <section className="facility-card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--paper)' }}>
              🐎 Danh Sách Chiến Mã Được Phân Công ({filteredHorses.length})
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
              Giám sát tình trạng sức khỏe (FIT, MONITORING, INJURED, ISOLATED), lịch cho ăn và nhiệm vụ kế tiếp.
            </p>
          </div>

          {/* Nút chuyển đổi Card / Table */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--line)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setHorseViewMode('CARD')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: horseViewMode === 'CARD' ? 700 : 500,
                background: horseViewMode === 'CARD' ? 'var(--brass)' : 'transparent',
                color: horseViewMode === 'CARD' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>🎴</span> Dạng Thẻ (Card)
            </button>
            <button
              type="button"
              onClick={() => setHorseViewMode('TABLE')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: horseViewMode === 'TABLE' ? 700 : 500,
                background: horseViewMode === 'TABLE' ? 'var(--brass)' : 'transparent',
                color: horseViewMode === 'TABLE' ? '#0A0D14' : 'var(--paper-dim)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>📋</span> Dạng Bảng (Table)
            </button>
          </div>
        </div>

        {/* 1. DẠNG THẺ (CARD VIEW) */}
        {horseViewMode === 'CARD' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '16px'
          }}>
            {filteredHorses.map((h) => (
              <div
                key={h.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: h.healthStatus === 'INJURED'
                    ? '1px solid rgba(239, 68, 68, 0.45)'
                    : h.healthStatus === 'ISOLATED'
                      ? '1px solid rgba(139, 92, 246, 0.4)'
                      : '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: h.healthStatus === 'INJURED' ? '0 0 12px rgba(239, 68, 68, 0.12)' : 'none'
                }}
              >
                <div>
                  {/* Hàng 1: Avatar, Tên, Mã chip, Chuồng & Badge sức khỏe */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <img
                      src={h.avatar}
                      alt={h.name}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid var(--line)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <b style={{
                          fontSize: '15px',
                          color: 'var(--paper)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={h.name}>
                          {h.name}
                        </b>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: 'var(--brass)',
                          background: 'rgba(212, 175, 55, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(212, 175, 55, 0.25)',
                          flexShrink: 0
                        }}>
                          {h.stall}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                        ID: <span style={{ fontFamily: 'monospace', color: 'var(--paper)' }}>{h.horseId}</span> · {h.breed} ({h.age} tuổi)
                      </div>

                      <div style={{ marginTop: '6px' }}>
                        {renderHealthBadge(h.healthStatus)}
                      </div>
                    </div>
                  </div>

                  {/* Hàng 2: Bảng thông tin ca trực */}
                  <div style={{
                    background: 'var(--bg-card)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '12px',
                    border: '1px solid var(--line)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Kiểm tra gần nhất:</span>
                      <b style={{ color: 'var(--paper)' }}>{h.lastHealthCheck}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Lịch ăn kế tiếp:</span>
                      <b style={{ color: 'var(--brass)' }}>{h.nextFeeding}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Việc cần làm tiếp:</span>
                      <b style={{ color: '#10B981' }}>{h.nextTask}</b>
                    </div>
                  </div>

                  {/* Ghi chú thể chất */}
                  {h.notes && (
                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--paper-dim)',
                      lineHeight: 1.4,
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 10px',
                      borderRadius: '5px',
                      marginBottom: '12px'
                    }}>
                      <b style={{ color: 'var(--paper)' }}>Ghi chú Groom:</b> {h.notes}
                    </div>
                  )}
                </div>

                {/* Hàng nút bấm */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => onOpenHorseModal && onOpenHorseModal(h)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '5px',
                      background: 'transparent',
                      color: 'var(--brass)',
                      border: '1px solid var(--brass)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Xem Hồ Sơ Chi Tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenReportModal && onOpenReportModal({ stallCode: h.stall, horseName: h.name })}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '5px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Báo sự cố
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. DẠNG BẢNG (TABLE VIEW) */}
        {horseViewMode === 'TABLE' && (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Chiến Mã</th>
                  <th style={{ padding: '12px 14px' }}>Mã ID / Chuồng</th>
                  <th style={{ padding: '12px 14px' }}>Giống / Tuổi</th>
                  <th style={{ padding: '12px 14px' }}>Trạng Thái Sức Khỏe</th>
                  <th style={{ padding: '12px 14px' }}>Khám Gần Nhất</th>
                  <th style={{ padding: '12px 14px' }}>Lịch Ăn Tiếp Theo</th>
                  <th style={{ padding: '12px 14px' }}>Công Việc Tiếp Theo</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHorses.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={h.avatar} alt={h.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                        <b style={{ color: 'var(--paper)', fontSize: '13.5px' }}>{h.name}</b>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'monospace', color: 'var(--paper)' }}>{h.horseId}</div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brass)' }}>{h.stall}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--paper-dim)' }}>
                      <div>{h.breed}</div>
                      <div style={{ fontSize: '11px' }}>{h.age} tuổi ({h.gender})</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {renderHealthBadge(h.healthStatus)}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--paper)' }}>
                      {h.lastHealthCheck}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--brass)', fontWeight: 600 }}>
                      {h.nextFeeding}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>
                      {h.nextTask}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onOpenHorseModal && onOpenHorseModal(h)}
                        style={{
                          background: 'transparent',
                          color: 'var(--brass)',
                          border: '1px solid var(--brass)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Hồ Sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

