import React, { useState, useMemo, useEffect } from 'react';
import { GROOM_SHIFTS, GROOM_TEAM_MEMBERS, PREDEFINED_GROOM_TASK_TEMPLATES } from '../../services/groomService';

export default function GroomScheduleModal({
  isOpen,
  onClose,
  onAddTask,
  horses = [],
  groomTeam = [] // Danh sách nhân sự Groom thời gian thực bao gồm người mới do Admin thêm
}) {
  const effectiveGroomTeam = useMemo(() => {
    if (Array.isArray(groomTeam) && groomTeam.length > 0) return groomTeam;
    return GROOM_TEAM_MEMBERS;
  }, [groomTeam]);

  const [selectedShift, setSelectedShift] = useState('MORNING');
  const [assignedGroomId, setAssignedGroomId] = useState('groom_dung');
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [dateKey, setDateKey] = useState('TODAY'); // 'TODAY' | 'TOMORROW'
  const [time, setTime] = useState('08:30');
  const [type, setType] = useState('FEEDING');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null); // Mẫu công việc đang được chọn (đứng im hiệu ứng)

  const currentGroom = effectiveGroomTeam.find(g => g.id === assignedGroomId) || effectiveGroomTeam[0];

  // Groom phục vụ hết tất cả các ngựa của các chủ sở hữu -> Hiển thị toàn bộ chiến mã đang có trong hệ thống
  const allAvailableHorses = horses || [];

  // Tự động chọn chiến mã đầu tiên nếu chưa chọn
  useEffect(() => {
    if (allAvailableHorses.length > 0) {
      const exists = allAvailableHorses.some(h => String(h.id) === String(selectedHorseId));
      if (!exists) {
        setSelectedHorseId(allAvailableHorses[0].id);
      }
    } else {
      setSelectedHorseId('');
    }
  }, [allAvailableHorses, selectedHorseId]);

  if (!isOpen) return null;

  const currentHorse = allAvailableHorses.find(h => String(h.id) === String(selectedHorseId)) || allAvailableHorses[0] || null;

  // Áp dụng mẫu công việc thường quy có sẵn
  const handleApplyTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.title);
    setDesc(tpl.desc);
    setType(tpl.type);
    setTime(tpl.defaultTime);
    setSelectedShift(tpl.shift);

    // Gợi ý nhân viên phù hợp với ca của template (nhân viên có thật trong hệ thống)
    if (tpl.shift === 'MORNING') setAssignedGroomId('groom_dung');
    else if (tpl.shift === 'AFTERNOON') setAssignedGroomId('groom_thao');
    else if (tpl.shift === 'NIGHT') setAssignedGroomId('groom_dung');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!currentHorse) {
      alert('Chưa có chiến mã nào trong hệ thống để phân công ca trực!');
      return;
    }

    const shiftObj = GROOM_SHIFTS.find(s => s.id === selectedShift);

    const newTask = {
      id: `TASK-${dateKey}-${Date.now()}`,
      dateKey,
      shift: selectedShift,
      shiftLabel: `${shiftObj?.name || 'Ca trực'} (${shiftObj?.timeRange || ''})`,
      time,
      horseId: currentHorse ? currentHorse.id : 'EQ-VN-2026',
      horseName: currentHorse ? currentHorse.name : 'Chiến mã',
      stall: currentHorse ? currentHorse.stall : 'Ô A1',
      type,
      title: title.trim(),
      desc: desc.trim() || 'Nhiệm vụ chăm sóc do Chủ nhóm Groom phân công.',
      status: 'PENDING',
      groom: currentGroom.name,
      groomId: currentGroom.id,
      createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)',
      templateId: selectedTemplateId
    };

    if (onAddTask) {
      onAddTask(newTask);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100, overflowX: 'hidden' }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '92%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--brass)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 20px var(--brass-glow)',
          background: 'var(--bg-card)',
          boxSizing: 'border-box'
        }}
      >
        {/* HEADER MODAL - CÂN BẰNG & SẮC NÉT */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--line)',
          borderTop: '3px solid var(--brass)',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Phân Ca & Lên Lịch Công Việc Chăm Sóc
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--brass)',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--brass)',
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.03em'
              }}>
                QUYỀN CHỦ NHÓM GROOM
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--paper-dim)' }}>
              Chủ nhóm phân chia ca trực, điều phối nhân sự Groom và giao nhiệm vụ chi tiết.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--paper-dim)',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0
            }}
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* BODY MODAL SCROLLABLE - KHÔNG CUỘN NGANG */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 22px',
            flex: 1,
            boxSizing: 'border-box'
          }}
        >
          {/* 1. MẪU CÔNG VIỆC THƯỜNG QUY CÓ SẴN (PRESETS) - LƯỚI 2 CỘT CÂN XỨNG HOÀN HẢO */}
          <div style={{
            background: 'rgba(212, 175, 55, 0.04)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b style={{ fontSize: '11.5px', color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Mẫu công việc thường quy có sẵn (Bấm để điền nhanh):
              </b>
              <span style={{ fontSize: '10.5px', color: 'var(--paper-dim)' }}>
                8 quy chuẩn chuồng trại
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
              {PREDEFINED_GROOM_TASK_TEMPLATES.map(tpl => {
                const isSelected = selectedTemplateId === tpl.id;

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: isSelected ? '1.5px solid var(--brass)' : '1px solid var(--line)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--brass)' : 'var(--paper)',
                      boxShadow: isSelected ? '0 0 10px rgba(212, 175, 55, 0.25)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minWidth: 0,
                      height: '36px',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTemplateId !== tpl.id) {
                        e.currentTarget.style.borderColor = 'var(--brass)';
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTemplateId !== tpl.id) {
                        e.currentTarget.style.borderColor = 'var(--line)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }
                    }}
                  >
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      minWidth: 0,
                      textAlign: 'left'
                    }}>
                      {tpl.shortTitle || tpl.title}
                    </span>
                    {isSelected && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--brass)',
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        ✓ Đã chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. THIẾT LẬP CA LÀM VIỆC & NHÂN SỰ PHÂN CÔNG (2 CỘT ĐỀU ĐẶN 1:1) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px', boxSizing: 'border-box' }}>
            {/* Chọn Ca làm việc */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
                Ca làm việc (Shift) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              >
                {GROOM_SHIFTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.timeRange})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Nhân sự Groom dưới quyền */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
                Giao cho nhân viên Groom <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={assignedGroomId}
                onChange={(e) => setAssignedGroomId(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              >
                {effectiveGroomTeam.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.isLead ? 'Chủ nhóm' : g.shiftName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. CHIẾN MÃ, NGÀY & GIỜ THỰC HIỆN (3 CỘT CÂN ĐỐI 1:1:1) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px', boxSizing: 'border-box' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
                Chiến mã & Ô chuồng phụ trách <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={selectedHorseId}
                onChange={(e) => setSelectedHorseId(e.target.value)}
                disabled={allAvailableHorses.length === 0}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              >
                {allAvailableHorses.length === 0 ? (
                  <option value="">(Chưa có chiến mã trong hệ thống)</option>
                ) : (
                  allAvailableHorses.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.stall}) — Chủ: {h.owner}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
                Ngày áp dụng lịch <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              >
                <option value="TODAY">Hôm Nay ({new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})</option>
                <option value="TOMORROW">Ngày Mai (Lên lịch trước)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
                Giờ thực hiện <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  color: 'var(--paper)',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* 4. TIÊU ĐỀ NHIỆM VỤ */}
          <div style={{ marginBottom: '12px', boxSizing: 'border-box' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
              Nội dung công việc cần làm trong ca <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cho ăn cỏ khô Alfalfa, nạo móng guốc, xịt chân sau tập..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                color: 'var(--paper)',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 5. MÔ TẢ QUY TRÌNH */}
          <div style={{ marginBottom: '6px', boxSizing: 'border-box' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--paper)', marginBottom: '5px' }}>
              Hướng dẫn & Quy trình Groom cần tuân thủ:
            </label>
            <textarea
              rows="2"
              placeholder="Ghi rõ định lượng khẩu phần, dụng cụ cần dùng, lưu ý an toàn cho nhân viên Groom..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: '100%',
                height: '64px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                color: 'var(--paper)',
                border: '1px solid var(--line)',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.45
              }}
            />
          </div>
        </form>

        {/* FOOTER MODAL - ĐỐI XỨNG & ĐỒNG BỘ */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--line)',
          padding: '12px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
            Nhiệm vụ sẽ hiển thị trực tiếp trên tài khoản của: <b style={{ color: 'var(--paper)' }}>{currentGroom.name}</b>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--paper-dim)',
                border: '1px solid var(--line)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                padding: '8px 22px',
                borderRadius: '6px',
                background: 'var(--brass)',
                color: '#0A0D14',
                fontWeight: 800,
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                letterSpacing: '0.02em'
              }}
            >
              Lưu & Ban Hành Lịch Ca Trực
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
