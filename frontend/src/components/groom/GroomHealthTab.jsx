import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getGroomHealthLogsApi,
  createGroomHealthLogApi,
  updateGroomHealthLogApi,
  deleteGroomHealthLogApi
} from '../../services/api';

export default function GroomHealthTab({ horses = [], onOpenReportModal }) {
  const toastContext = useToast();
  const showToast = toastContext?.showToast || (() => {});

  // Chỉ lưu giữ các bản ghi do người dùng thực sự chủ động tạo, tuyệt đối không tự động sinh dữ liệu mẫu
  const [healthLogs, setHealthLogs] = useState(() => {
    try {
      const raw = localStorage.getItem('matruong_groom_health_logs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Lọc sạch toàn bộ các bản ghi tự động sinh cũ, chỉ giữ lại bản ghi do người dùng tự tạo
          return parsed.filter(log => log && log.userCreated === true);
        }
      }
    } catch {}
    return [];
  });

  // Tự động đồng bộ với Backend API khi khởi tạo và lắng nghe thay đổi thời gian thực
  useEffect(() => {
    let isMounted = true;
    getGroomHealthLogsApi().then(data => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setHealthLogs(data.filter(log => log && log.userCreated === true));
      }
    }).catch(() => {});

    const handleUpdate = () => {
      getGroomHealthLogsApi().then(data => {
        if (isMounted && Array.isArray(data)) {
          setHealthLogs(data.filter(log => log && log.userCreated === true));
        }
      }).catch(() => {});
    };

    window.addEventListener('matruong_health_logs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('matruong_health_logs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const defaultHorseName = horses.length > 0 ? `${horses[0].name} (${horses[0].stall || 'Ô chuồng'})` : '';

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);

  const [logForm, setLogForm] = useState({
    horseName: defaultHorseName,
    temp: '38.0',
    pulse: '38',
    respiration: '12',
    mucous: 'Hồng nhạt (Bình thường / Khỏe mạnh)',
    crt: 'Dưới 2 giây (Bình thường)',
    appetite: 'Rất tốt (Ăn hết 100%)',
    gutSounds: 'Âm sôi đều 4 góc bụng (Bình thường)',
    stool: 'Khuôn tốt, màu vàng sẫm tiêu chuẩn',
    urine: 'Vàng rơm trong, bài tiết bình thường',
    gait: 'Đi lại nhẹ nhàng, tì chân vững vàng',
    tendon: 'Gân mát, không sưng nóng, không đau',
    observation: ''
  });

  // Tìm thông tin chiến mã đang chọn trong form
  const selectedHorseInfo = useMemo(() => {
    if (!logForm.horseName) return horses[0] || null;
    const cleanName = logForm.horseName.split(' (')[0].trim().toLowerCase();
    return horses.find(h => (h.name || '').toLowerCase() === cleanName) || horses[0] || null;
  }, [logForm.horseName, horses]);

  // Cập nhật giá trị mặc định cho form khi mở modal ở chế độ tạo mới
  useEffect(() => {
    if (showLogModal && !editingLogId && horses.length > 0) {
      setLogForm(prev => ({
        ...prev,
        horseName: prev.horseName || `${horses[0].name} (${horses[0].stall || 'Ô chuồng'})`
      }));
    }
  }, [showLogModal, editingLogId, horses]);

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingLogId(null);
    setLogForm({
      horseName: defaultHorseName,
      temp: '38.0',
      pulse: '38',
      respiration: '12',
      mucous: 'Hồng nhạt (Bình thường / Khỏe mạnh)',
      crt: 'Dưới 2 giây (Bình thường)',
      appetite: 'Rất tốt (Ăn hết 100%)',
      gutSounds: 'Âm sôi đều 4 góc bụng (Bình thường)',
      stool: 'Khuôn tốt, màu vàng sẫm tiêu chuẩn',
      urine: 'Vàng rơm trong, bài tiết bình thường',
      gait: 'Đi lại nhẹ nhàng, tì chân vững vàng',
      tendon: 'Gân mát, không sưng nóng, không đau',
      observation: ''
    });
    setShowLogModal(true);
  };

  // Mở modal chỉnh sửa bản ghi đã có
  const handleEditLog = (log) => {
    setEditingLogId(log.id);
    const rawAppetiteVal = log.rawAppetite || log.appetite || 'Rất tốt (Ăn hết 100%)';
    const rawStoolVal = log.rawStool || (log.stool ? log.stool.split(' · ')[0] : 'Khuôn tốt, màu vàng sẫm tiêu chuẩn');
    const rawUrineVal = log.rawUrine || (log.stool && log.stool.includes('Nước tiểu: ') ? log.stool.split('Nước tiểu: ')[1] : 'Vàng rơm trong, bài tiết bình thường');

    setLogForm({
      horseName: log.horseName,
      temp: log.temp ? String(log.temp).replace('°C', '').trim() : '38.0',
      pulse: log.pulse ? String(log.pulse).replace(/[^0-9]/g, '').trim() : '38',
      respiration: log.respiration ? String(log.respiration).replace(/[^0-9]/g, '').trim() : '12',
      mucous: log.mucous || 'Hồng nhạt (Bình thường / Khỏe mạnh)',
      crt: log.crt || 'Dưới 2 giây (Bình thường)',
      appetite: rawAppetiteVal,
      gutSounds: log.gutSounds || 'Âm sôi đều 4 góc bụng (Bình thường)',
      stool: rawStoolVal,
      urine: rawUrineVal,
      gait: log.gait || 'Đi lại nhẹ nhàng, tì chân vững vàng',
      tendon: log.tendon || 'Gân mát, không sưng nóng, không đau',
      observation: log.observation || ''
    });
    setShowLogModal(true);
  };

  // Lưu bản ghi (Tạo mới hoặc Cập nhật)
  const handleSaveLog = (e) => {
    e.preventDefault();
    const finalHorseName = logForm.horseName || defaultHorseName;
    const cleanName = (finalHorseName || '').split(' (')[0].trim();
    const targetHorse = horses.find(h => (h.name || '').toLowerCase() === cleanName.toLowerCase()) || null;
    const vetName = targetHorse?.vet || 'BS. Thú Y phụ trách chính';
    const stallName = targetHorse?.stall || 'Ô chuồng';

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const detailObservation = logForm.observation.trim()
      ? logForm.observation.trim()
      : `Dáng đi: ${logForm.gait}. Gân chân: ${logForm.tendon}. Niêm mạc: ${logForm.mucous}. Nhu động ruột: ${logForm.gutSounds}.`;

    const logPayload = {
      horseName: finalHorseName,
      temp: logForm.temp ? `${logForm.temp}°C` : '38.0°C',
      pulse: logForm.pulse ? `${logForm.pulse} bpm` : '38 bpm',
      respiration: logForm.respiration ? `${logForm.respiration} lần/phút` : '12 lần/phút',
      appetite: logForm.appetite.split(' (')[0],
      rawAppetite: logForm.appetite,
      stool: `${logForm.stool.split(' (')[0]} · Nước tiểu: ${logForm.urine.split(' (')[0]}`,
      rawStool: logForm.stool,
      rawUrine: logForm.urine,
      mucous: logForm.mucous,
      crt: logForm.crt,
      gutSounds: logForm.gutSounds,
      gait: logForm.gait,
      tendon: logForm.tendon,
      observation: detailObservation
    };

    let updatedList = [];
    if (editingLogId) {
      // Chế độ chỉnh sửa - Chỉ lưu vào nhật ký theo dõi nội bộ của Groom, không gửi thông báo
      const updatedItem = {
        ...logPayload,
        time: `${hh}:${mm} (Đã sửa)`
      };
      updateGroomHealthLogApi(editingLogId, updatedItem).catch(() => {});
      updatedList = healthLogs.map(item => {
        if (item.id === editingLogId) {
          return {
            ...item,
            ...updatedItem
          };
        }
        return item;
      });

      showToast(`Đã cập nhật chỉ số sức khỏe của ${cleanName} vào nhật ký theo dõi!`, 'CẬP NHẬT THÀNH CÔNG', 'success');
    } else {
      // Chế độ tạo mới - Chỉ lưu vào nhật ký theo dõi nội bộ của Groom, không gửi thông báo
      const newLog = {
        id: `HL-${Date.now()}`,
        userCreated: true,
        time: `${hh}:${mm}`,
        ...logPayload
      };
      createGroomHealthLogApi(newLog).catch(() => {});
      updatedList = [newLog, ...healthLogs];

      showToast(`Đã lưu chỉ số sức khỏe của ${cleanName} vào nhật ký theo dõi ca trực!`, 'GHI NHẬN THÀNH CÔNG', 'success');
    }

    setHealthLogs(updatedList);
    try {
      localStorage.setItem('matruong_groom_health_logs', JSON.stringify(updatedList));
    } catch {}

    setShowLogModal(false);
    setEditingLogId(null);
  };

  // Nút Báo Thú Y: Khi có sự việc cấp bách hoặc sức khỏe không tốt, Groom bấm nút này để MỞ Phiếu Báo Động (chưa gửi liền).
  // Tuyệt đối không gửi thông báo ngay tại đây. Chỉ khi Groom bấm nút "PHÁT BÁO ĐỘNG & GỬI BÁC SĨ THÚ Y NGAY" trong modal thì mới chính thức gửi thông báo cho Bác sĩ.
  const handleNotifyVetDirect = (log) => {
    const cleanName = (log.horseName || '').split(' (')[0].trim();
    const targetHorse = horses.find(h => (h.name || '').toLowerCase() === cleanName.toLowerCase()) || null;

    // Tự động phân tích chỉ số để gợi ý mức độ cấp bách trong phiếu
    const tempNum = Number(String(log.temp || '').replace(/[^0-9.]/g, ''));
    const obsText = (log.observation || '').toLowerCase();
    const appetiteText = (log.appetite || '').toLowerCase();
    const isColic = obsText.includes('colic') || obsText.includes('đau bụng') || obsText.includes('lăn lê') || obsText.includes('cào móng');
    const isHighFever = tempNum >= 39.0;
    const isLameness = obsText.includes('khập khiễng') || obsText.includes('không chịu tì chân') || obsText.includes('sưng nóng');
    const isFeedRefusal = appetiteText.includes('bỏ ăn');

    let autoSeverity = 'MEDIUM';
    let autoSymptom = 'Bất thường lâm sàng khác...';

    if (isColic || tempNum >= 39.5) {
      autoSeverity = 'CRITICAL';
      autoSymptom = 'Dấu hiệu đau bụng Colic (nguy hiểm cấp tính)';
    } else if (isHighFever) {
      autoSeverity = 'CRITICAL';
      autoSymptom = 'Nghi ngờ sốt cao / Thở dốc / Đổ mồ hôi';
    } else if (isFeedRefusal) {
      autoSeverity = 'HIGH';
      autoSymptom = 'Ngựa bỏ ăn / Bỏ ăn trên 50%';
    } else if (isLameness) {
      autoSeverity = 'HIGH';
      autoSymptom = 'Đi khập khiễng / Không chịu tì chân';
    }

    const cleanObservation = log.observation && log.observation.trim()
      ? log.observation.trim()
      : 'Groom phát hiện dấu hiệu bất thường và yêu cầu Bác sĩ Thú y thăm khám trực tiếp.';

    // Chỉ mở modal Phiếu Báo Động Sự Cố Sức Khỏe & Thăm Khám Khẩn Cấp với dữ liệu đã điền sẵn
    if (onOpenReportModal) {
      onOpenReportModal({
        horseName: cleanName,
        stallCode: targetHorse?.stall ? targetHorse.stall.replace(/[^A-Z0-9]/gi, '') : 'C2',
        severity: autoSeverity,
        symptoms: autoSymptom,
        desc: cleanObservation,
        temp: log.temp ? String(log.temp).replace('°C', '').trim() : '38.0',
        respRate: log.respiration ? String(log.respiration).replace(/[^0-9]/g, '').trim() : '12'
      });
    }
  };

  const handleDeleteLog = (logId) => {
    deleteGroomHealthLogApi(logId).catch(() => {});
    const updated = healthLogs.filter(l => l.id !== logId);
    setHealthLogs(updated);
    try {
      localStorage.setItem('matruong_groom_health_logs', JSON.stringify(updated));
    } catch {}
  };

  const handleClearAllLogs = () => {
    deleteGroomHealthLogApi('ALL').catch(() => {});
    setHealthLogs([]);
    try {
      localStorage.setItem('matruong_groom_health_logs', JSON.stringify([]));
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--paper)' }}>
            Theo Dõi Sức Khỏe Hằng Ngày (Health Monitoring)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
            Ghi nhận thân nhiệt, nhịp thở, độ ngon miệng, nước tiểu, phân và biểu hiện bất thường hằng ngày.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {healthLogs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllLogs}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: 'transparent',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Xóa toàn bộ các bản ghi theo dõi sức khỏe"
            >
              ✕ Xóa Hết
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenCreateModal}
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
      </div>

      {/* Banner Nguyên tắc Phân quyền (RBAC Policy Banner) - Tuyệt đối không icon */}
      <div style={{
        background: 'rgba(212, 175, 55, 0.08)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '8px',
        padding: '14px 18px',
        fontSize: '12.5px',
        lineHeight: 1.5,
        color: 'var(--paper)'
      }}>
        <div style={{ fontWeight: 800, color: 'var(--brass)', marginBottom: '4px' }}>
          NGUYÊN TẮC GIỚI HẠN QUYỀN HẠN CỦA GROOM:
        </div>
        <div>
          • Groom được phép: <b>Quan sát, đo chỉ số sinh tồn cơ bản và ghi nhận dấu hiệu bất thường</b>.<br />
          • Groom <b>TUYỆT ĐỐI KHÔNG</b> được tự chẩn đoán bệnh, không được tự kê đơn hay thay đổi phác đồ điều trị.<br />
          • Groom <b>KHÔNG</b> được chỉnh sửa hồ sơ bệnh án chính thức hoặc tự ý thay đổi trạng thái sức khỏe chính thức của chiến mã.<br />
          • Mọi triệu chứng bất thường phải được gửi qua phiếu Báo Cáo Sự Cố để Bác sĩ Thú y trực tiếp thẩm định.
        </div>
      </div>

      {/* Bảng nhật ký sức khỏe - Cân bằng tỷ lệ các cột, không bị ngắt dòng tên chiến mã */}
      <div className="facility-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
        <table style={{ minWidth: '1080px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px', width: '190px', whiteSpace: 'nowrap' }}>Chiến Mã</th>
              <th style={{ padding: '12px 14px', width: '90px', whiteSpace: 'nowrap' }}>Thời Gian</th>
              <th style={{ padding: '12px 14px', width: '110px', whiteSpace: 'nowrap' }}>Thân Nhiệt</th>
              <th style={{ padding: '12px 14px', width: '130px', whiteSpace: 'nowrap' }}>Nhịp Tim & Thở</th>
              <th style={{ padding: '12px 14px', width: '140px', whiteSpace: 'nowrap' }}>Mức Ngon Miệng</th>
              <th style={{ padding: '12px 14px', minWidth: '180px' }}>Phân & Nước Tiểu</th>
              <th style={{ padding: '12px 14px', minWidth: '240px' }}>Quan Sát Dấu Hiệu (Groom Note)</th>
              <th style={{ padding: '12px 14px', width: '210px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {healthLogs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--paper-dim)' }}>
                  Chưa có ghi nhận theo dõi sức khỏe nào. Bấm <b style={{ color: 'var(--brass)' }}>"+ Ghi Nhận Chỉ Số Sức Khỏe"</b> để thêm mới.
                </td>
              </tr>
            ) : (
              healthLogs.map((log) => {
                const tempVal = Number(String(log.temp || '').replace('°C', ''));
                const isHighTemp = tempVal > 38.5;

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--paper)', whiteSpace: 'nowrap' }}>
                      {log.horseName}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
                      {log.time}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <b style={{ color: isHighTemp ? '#EF4444' : 'var(--paper)' }}>{log.temp}</b>
                      {isHighTemp && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>(Sốt nhẹ)</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--paper-dim)', whiteSpace: 'nowrap' }}>
                      <div>{log.pulse}</div>
                      <div style={{ fontSize: '11px' }}>{log.respiration}</div>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: log.appetite?.includes('Bỏ ăn') ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                        color: log.appetite?.includes('Bỏ ăn') ? '#EF4444' : 'var(--paper)',
                        border: `1px solid ${log.appetite?.includes('Bỏ ăn') ? '#EF4444' : 'var(--line)'}`
                      }}>
                        {log.appetite}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--paper-dim)', fontSize: '11.5px' }}>
                      {log.stool}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--paper)', fontSize: '12px', lineHeight: 1.45 }}>
                      {log.observation}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditLog(log)}
                          style={{
                            padding: '5px 11px',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'var(--brass)',
                            border: '1px solid var(--brass)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Chỉnh sửa bản ghi này"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotifyVetDirect(log)}
                          style={{
                            padding: '5px 11px',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Gửi thông báo đến Bác sĩ Thú y phụ trách chính"
                        >
                          Báo Thú Y
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Xóa bản ghi này"
                        >
                          ✕ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ghi nhận / chỉnh sửa chỉ số sức khỏe - Tuyệt đối không có icon */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)} style={{ zIndex: 999999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '740px',
              width: '92%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--line)',
              background: 'var(--bg-card)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 20px rgba(212, 175, 55, 0.15)',
              position: 'relative',
              zIndex: 1000000
            }}
          >
            {/* Header modal */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--line)',
              borderTop: '3px solid var(--brass)',
              padding: '16px 24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {editingLogId ? 'Chỉnh Sửa Chỉ Số Thể Chất & Dấu Hiệu Lâm Sàng' : 'Phiếu Ghi Nhận Chỉ Số Thể Chất & Dấu Hiệu Quan Sát'}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: editingLogId ? '#F59E0B' : 'var(--brass)',
                      background: editingLogId ? 'rgba(245, 158, 11, 0.15)' : 'rgba(212, 175, 55, 0.12)',
                      border: `1px solid ${editingLogId ? 'rgba(245, 158, 11, 0.4)' : 'rgba(212, 175, 55, 0.35)'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em'
                    }}>
                      {editingLogId ? 'CHẾ ĐỘ CHỈNH SỬA' : 'CLINICAL OBSERVATION'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                    {editingLogId
                      ? 'Điều chỉnh các chỉ số theo dõi thể chất trong nhật ký ca trực của Groom'
                      : 'Ghi nhận dấu hiệu lâm sàng, chỉ số sinh tồn và hành vi thực tế của chiến mã tại chuồng'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    color: 'var(--paper-dim)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0
                  }}
                  title="Đóng cửa sổ"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form body scrollable */}
            <form onSubmit={handleSaveLog} style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Chọn chiến mã & Thẻ tóm tắt */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                  Chiến mã theo dõi <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={logForm.horseName}
                  onChange={(e) => setLogForm({ ...logForm, horseName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: selectedHorseInfo ? '10px' : 0
                  }}
                >
                  {horses.length > 0 ? (
                    horses.map(h => {
                      const val = `${h.name} (${h.stall || 'Ô chuồng'})`;
                      return (
                        <option key={h.id} value={val}>{val} - {h.breed || 'Thuần chủng'}</option>
                      );
                    })
                  ) : (
                    <option value="">Không có chiến mã trong hệ thống</option>
                  )}
                </select>

                {selectedHorseInfo && (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--paper-dim)' }}>Chiến mã: </span>
                      <b style={{ color: 'var(--paper)' }}>{selectedHorseInfo.name}</b>
                      <span style={{ color: 'var(--brass)', fontWeight: 700, marginLeft: '8px' }}>{selectedHorseInfo.stall}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--paper-dim)' }}>Giống & Tuổi: </span>
                      <span style={{ color: 'var(--paper)' }}>{selectedHorseInfo.breed} · {selectedHorseInfo.age} tuổi</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--paper-dim)' }}>Bác sĩ phụ trách: </span>
                      <b style={{ color: '#10B981' }}>{selectedHorseInfo.vet || 'BS. Thú Y trực ban'}</b>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Chỉ số sinh tồn lâm sàng */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  1. CHỈ SỐ SINH TỒN LÂM SÀNG CƠ BẢN (VITAL SIGNS)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  {/* Thân nhiệt */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Thân nhiệt (°C) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="35"
                        max="42"
                        value={logForm.temp}
                        onChange={(e) => setLogForm({ ...logForm, temp: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          color: Number(logForm.temp) > 38.5 ? '#EF4444' : 'var(--paper)',
                          fontWeight: 700,
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '11px', color: 'var(--paper-dim)' }}>°C</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                      Chuẩn: 37.5 – 38.5°C
                    </div>
                  </div>

                  {/* Nhịp tim */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Nhịp tim (bpm) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="20"
                        max="120"
                        value={logForm.pulse}
                        onChange={(e) => setLogForm({ ...logForm, pulse: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          color: 'var(--paper)',
                          fontWeight: 700,
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '11px', color: 'var(--paper-dim)' }}>bpm</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                      Chuẩn: 36 – 44 bpm
                    </div>
                  </div>

                  {/* Nhịp thở */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Nhịp thở (lần/phút) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={logForm.respiration}
                        onChange={(e) => setLogForm({ ...logForm, respiration: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          color: 'var(--paper)',
                          fontWeight: 700,
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '11px', color: 'var(--paper-dim)' }}>bpm</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                      Chuẩn: 8 – 16 lần/phút
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Niêm mạc */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Niêm mạc nướu răng:
                    </label>
                    <select
                      value={logForm.mucous}
                      onChange={(e) => setLogForm({ ...logForm, mucous: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Hồng nhạt (Bình thường / Khỏe mạnh)">Hồng nhạt (Bình thường / Khỏe mạnh)</option>
                      <option value="Nhợt nhạt / Trắng bệch (Thiếu máu)">Nhợt nhạt / Trắng bệch (Nghi thiếu máu)</option>
                      <option value="Đỏ bầm / Sung huyết (Viêm nhiễm / Sốt)">Đỏ bầm / Sung huyết (Viêm / Sốt)</option>
                      <option value="Tím tái (Thiếu oxy cấp)">Tím tái (Thiếu oxy cấp - Nguy kịch)</option>
                    </select>
                  </div>

                  {/* Thời gian hồi màu mao mạch */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Thời gian hồi mao mạch (CRT):
                    </label>
                    <select
                      value={logForm.crt}
                      onChange={(e) => setLogForm({ ...logForm, crt: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Dưới 2 giây (Bình thường)">Dưới 2 giây (Tuần hoàn bình thường)</option>
                      <option value="Từ 2.5 - 3 giây (Mất nước nhẹ)">Từ 2.5 - 3 giây (Dấu hiệu mất nước nhẹ)</option>
                      <option value="Trên 3 giây (Trụy tuần hoàn / Sốc)">Trên 3 giây (Trụy tuần hoàn / Nguy cấp)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Tiêu hóa & Bài tiết */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  2. TIÊU HÓA, THỂ TRẠNG & BÀI TIẾT
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {/* Mức độ thèm ăn */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Mức độ ăn uống (Appetite):
                    </label>
                    <select
                      value={logForm.appetite}
                      onChange={(e) => setLogForm({ ...logForm, appetite: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Rất tốt (Ăn hết 100%)">Rất tốt (Ăn hết 100% khẩu phần)</option>
                      <option value="Bình thường (Ăn 90-95%)">Bình thường (Ăn 90 - 95%)</option>
                      <option value="Ăn chậm / Kén ăn">Ăn chậm / Kén ăn</option>
                      <option value="Bỏ ăn 50% (Bất thường)">Bỏ ăn 50% (Dấu hiệu bất thường)</option>
                      <option value="Bỏ ăn hoàn toàn (Khẩn cấp)">Bỏ ăn hoàn toàn (Báo động khẩn cấp)</option>
                    </select>
                  </div>

                  {/* Nhu động ruột */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Âm nhu động ruột (Nghe góc bụng):
                    </label>
                    <select
                      value={logForm.gutSounds}
                      onChange={(e) => setLogForm({ ...logForm, gutSounds: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Âm sôi đều 4 góc bụng (Bình thường)">Âm sôi đều 4 góc bụng (Bình thường)</option>
                      <option value="Giảm âm nhu động ruột (Nghi Colic)">Giảm âm nhu động ruột (Nghi Colic)</option>
                      <option value="Mất hoàn toàn tiếng ruột (Khẩn cấp)">Mất hoàn toàn tiếng ruột (Khẩn cấp)</option>
                      <option value="Co thắt dữ dội, sôi liên tục">Co thắt dữ dội, sôi ruột liên tục</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Phân chuồng */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Tình trạng phân chuồng:
                    </label>
                    <select
                      value={logForm.stool}
                      onChange={(e) => setLogForm({ ...logForm, stool: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Khuôn tốt, màu vàng sẫm tiêu chuẩn">Khuôn tốt, màu vàng sẫm tiêu chuẩn</option>
                      <option value="Khô cứng, viên nhỏ (Nghi táo bón)">Khô cứng, viên nhỏ (Nghi táo bón)</option>
                      <option value="Phân nhão / Lỏng (Nghi tiêu chảy)">Phân nhão / Lỏng (Nghi tiêu chảy)</option>
                      <option value="Chưa đi phân trong suốt ca">Chưa đi phân trong suốt ca</option>
                    </select>
                  </div>

                  {/* Nước tiểu */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Tình trạng nước tiểu:
                    </label>
                    <select
                      value={logForm.urine}
                      onChange={(e) => setLogForm({ ...logForm, urine: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Vàng rơm trong, bài tiết bình thường">Vàng rơm trong, bài tiết bình thường</option>
                      <option value="Vàng sẫm, đặc">Vàng sẫm, đậm đặc</option>
                      <option value="Đỏ bầm / Nghi có máu">Đỏ bầm / Nghi có máu</option>
                      <option value="Khó tiểu / Rặn tiểu ngắt quãng">Khó tiểu / Rặn tiểu ngắt quãng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Vận động & Tư thế tại chuồng */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  3. VẬN ĐỘNG, MÓNG GUỐC & TƯ THẾ TẠI CHUỒNG
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Tư thế dáng đi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Tư thế đứng & dáng đi:
                    </label>
                    <select
                      value={logForm.gait}
                      onChange={(e) => setLogForm({ ...logForm, gait: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Đi lại nhẹ nhàng, tì chân vững vàng">Đi lại nhẹ nhàng, tì chân vững vàng</option>
                      <option value="Đi khập khiễng nhẹ sau khi ra chuồng">Đi khập khiễng nhẹ sau khi ra chuồng</option>
                      <option value="Không chịu tì chân / Co chân lên">Không chịu tì chân / Co chân lên</option>
                      <option value="Cào móng, ngoái đầu nhìn bụng liên tục">Cào móng, ngoái đầu nhìn bụng liên tục</option>
                      <option value="Bất an, dậm chân, nằm lăn lê">Bất an, dậm chân, nằm lăn lê (Báo động Colic)</option>
                    </select>
                  </div>

                  {/* Tình trạng gân chân & móng */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                      Gân chân, khớp & móng guốc:
                    </label>
                    <select
                      value={logForm.tendon}
                      onChange={(e) => setLogForm({ ...logForm, tendon: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        color: 'var(--paper)',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Gân mát, không sưng nóng, không đau">Gân mát, không sưng nóng, không đau</option>
                      <option value="Khớp sưng nóng nhẹ / Hơi ấm">Khớp sưng nóng nhẹ / Hơi ấm</option>
                      <option value="Gân sưng phù, ấn đau rõ rệt">Gân sưng phù, ấn đau rõ rệt</option>
                      <option value="Trầy xước da, rỉ máu nhẹ">Trầy xước da, rỉ máu nhẹ</option>
                      <option value="Móng nứt / Giắt sỏi kẽ móng">Móng nứt / Giắt sỏi kẽ móng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Mô tả chi tiết */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '4px' }}>
                  Quan sát chi tiết thực tế tại chuồng (Không tự ý chẩn đoán bệnh)
                </label>
                <textarea
                  rows="3"
                  value={logForm.observation}
                  onChange={(e) => setLogForm({ ...logForm, observation: e.target.value })}
                  placeholder="Ghi nhận cụ thể ánh mắt, độ lanh lợi, dịch mũi, phản xạ khi chạm gân chân, mức độ hoàn thành bữa ăn..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--line)',
                    color: 'var(--paper)',
                    fontFamily: 'inherit',
                    fontSize: '12.5px',
                    resize: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.45
                  }}
                />
              </div>

              {/* Footer hành động */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--line)'
              }}>
                <span style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                  Dữ liệu được lưu vào nhật ký theo dõi ca trực của Groom. Khi có sự việc cấp bách, bấm "Báo Thú Y" để gửi thông báo cho Bác sĩ Thú y.
                </span>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: 'var(--paper-dim)',
                      border: '1px solid var(--line)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 22px',
                      borderRadius: '6px',
                      background: 'var(--brass)',
                      color: '#0A0D14',
                      fontWeight: 800,
                      border: 'none',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)'
                    }}
                  >
                    {editingLogId ? 'Cập Nhật Bản Ghi' : 'Lưu Ghi Nhận Chỉ Số Sức Khỏe'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

