import React, { useState, useEffect } from 'react';

const COMMON_SYMPTOMS_LIST = [
  { id: 'FEEDING_REFUSAL', label: 'Ngựa bỏ ăn / Bỏ ăn trên 50%', severity: 'HIGH' },
  { id: 'COLIC_SIGNS', label: 'Dấu hiệu đau bụng Colic (nguy hiểm cấp tính)', severity: 'CRITICAL' },
  { id: 'LAMENESS', label: 'Đi khập khiễng / Không chịu tì chân', severity: 'HIGH' },
  { id: 'SWOLLEN_LEG', label: 'Khớp cổ chân / Gân bị sưng nóng', severity: 'HIGH' },
  { id: 'WOUND_BLEEDING', label: 'Vết thương ngoài da / Trầy xước rỉ máu', severity: 'MEDIUM' },
  { id: 'ABNORMAL_BEHAVIOR', label: 'Hành vi bất thường: Cắn gỗ & Dậm chân', severity: 'MEDIUM' },
  { id: 'HIGH_FEVER', label: 'Nghi ngờ sốt cao / Thở dốc / Đổ mồ hôi', severity: 'CRITICAL' },
  { id: 'OTHER', label: 'Bất thường lâm sàng khác...', severity: 'MEDIUM' }
];

const FIRST_AID_OPTIONS = [
  'Dắt đi bộ chậm (tránh ngựa nằm lăn Colic)',
  'Cách ly máng cỏ khô & ngắt phao nước',
  'Chườm đá lạnh nén khớp gân 20 phút',
  'Sát trùng oxy già & xịt sát khuẩn',
  'Đã treo biển cảnh báo trước cửa chuồng'
];

export default function GroomIncidentReportModal({
  isOpen,
  onClose,
  onSubmit,
  horses = [],
  stalls = [],
  prefill = null,
  currentUser
}) {
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [stallCode, setStallCode] = useState('A1');
  const [severity, setSeverity] = useState('HIGH'); // 'CRITICAL' | 'HIGH' | 'MEDIUM'
  const [selectedSymptom, setSelectedSymptom] = useState(COMMON_SYMPTOMS_LIST[0].label);
  const [temp, setTemp] = useState('38.5');
  const [respRate, setRespRate] = useState('24');
  const [mucousColor, setMucousColor] = useState('Hồng nhạt (Bình thường)');
  const [gutSounds, setGutSounds] = useState('Giảm nhu động ruột');
  const [selectedFirstAid, setSelectedFirstAid] = useState(['Dắt đi bộ chậm (tránh ngựa nằm lăn Colic)']);
  const [desc, setDesc] = useState('');

  // Mã tiếp nhận và thời điểm cố định cho cả phiên mở modal, tuyệt đối không nhảy số
  const [receiptCode, setReceiptCode] = useState('');
  const [reportTimeStr, setReportTimeStr] = useState('');

  // Chỉ khởi tạo khi modal được mở (isOpen = true), không reset khi người dùng đang bấm nút
  useEffect(() => {
    if (!isOpen) return;

    // 1. Sinh mã tiếp nhận duy nhất cho ca trực
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setReceiptCode(`EMG-${randomNum}`);

    // 2. Cố định thời điểm báo cáo
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setReportTimeStr(`${hh}:${mm} - Hôm nay`);

    // 3. Khởi tạo dữ liệu form ban đầu
    if (prefill) {
      if (prefill.stallCode) {
        const cleanStall = prefill.stallCode.replace(/[^A-Z0-9]/gi, '');
        setStallCode(cleanStall || 'A1');
      }
      if (prefill.horseName) {
        const found = horses.find(h => h.name?.toLowerCase().includes(prefill.horseName.toLowerCase()));
        if (found) {
          setSelectedHorseId(String(found.id));
          setStallCode(found.stall?.replace(/[^A-Z0-9]/gi, '') || 'A1');
        }
      } else if (horses.length > 0) {
        setSelectedHorseId(String(horses[0].id));
        setStallCode(horses[0].stall?.replace(/[^A-Z0-9]/gi, '') || 'A1');
      }
      setSeverity(prefill.severity || 'HIGH');
      setSelectedSymptom(prefill.symptoms || COMMON_SYMPTOMS_LIST[0].label);
      setDesc(prefill.desc || '');
      if (prefill.temp) setTemp(String(prefill.temp).replace('°C', '').trim());
      if (prefill.respRate) setRespRate(String(prefill.respRate).replace(/[^0-9]/g, '').trim());
    } else if (horses.length > 0) {
      setSelectedHorseId(String(horses[0].id));
      setStallCode(horses[0].stall?.replace(/[^A-Z0-9]/gi, '') || 'A1');
      setSeverity('HIGH');
      setSelectedSymptom(COMMON_SYMPTOMS_LIST[0].label);
      setDesc('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSelectedHorse = horses.find(h => String(h.id) === String(selectedHorseId)) || horses[0] || null;

  const handleSelectHorse = (e) => {
    const hid = e.target.value;
    setSelectedHorseId(hid);
    const target = horses.find(h => String(h.id) === String(hid));
    if (target && target.stall) {
      setStallCode(target.stall.replace(/[^A-Z0-9]/gi, '') || 'A1');
    }
  };

  const handleToggleFirstAid = (item) => {
    setSelectedFirstAid(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const finalHorseName = currentSelectedHorse ? currentSelectedHorse.name : 'Chiến mã';
    const finalHorseId = currentSelectedHorse ? (currentSelectedHorse.horseId || currentSelectedHorse.id) : 'EQ-VN-2026';
    const finalStall = currentSelectedHorse ? currentSelectedHorse.stall : `Ô ${stallCode}`;

    const reportPayload = {
      receiptCode: receiptCode || `EMG-${Date.now().toString().slice(-6)}`,
      stallCode,
      stall: finalStall,
      horseId: finalHorseId,
      horseName: finalHorseName,
      severity,
      symptoms: selectedSymptom,
      temp: temp ? `${temp}°C` : 'Chưa đo',
      respRate: respRate ? `${respRate} lần/phút` : 'Chưa đếm',
      mucousColor,
      gutSounds,
      firstAidActions: selectedFirstAid,
      desc: desc.trim() || 'Groom phát hiện dấu hiệu bất thường lâm sàng tại ô chuồng và yêu cầu Bác sĩ Thú y thăm khám khẩn cấp.'
    };

    if (onSubmit) onSubmit(reportPayload);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '92%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 24px rgba(239, 68, 68, 0.15)',
          background: 'var(--bg-card)',
          position: 'relative',
          zIndex: 1000000
        }}
      >
        {/* HEADER MODAL - CÂN ĐỐI, KHÔNG ICON EMOJI */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--line)',
          borderTop: '3px solid #EF4444',
          padding: '18px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Phiếu Báo Động Sự Cố Sức Khỏe & Thăm Khám Khẩn Cấp
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#EF4444',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  TRIAGE EMERGENCY
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--paper-dim)' }}>
                Kênh liên thông trực tiếp với Bác sĩ Thú y trực ban và Quản trị viên hệ thống
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
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

          {/* Dải metadata cân bằng */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '12px',
            color: 'var(--paper-dim)',
            flexWrap: 'wrap'
          }}>
            <div>
              <span>Người lập: </span>
              <b style={{ color: 'var(--paper)' }}>{currentUser?.full_name || 'Lê Hoàng Nam (Groom Block A)'}</b>
            </div>
            <div>
              <span>Thời điểm: </span>
              <b style={{ color: 'var(--brass)' }}>{reportTimeStr || 'Hôm nay'}</b>
            </div>
            <div>
              <span>Mã tiếp nhận: </span>
              <b style={{ color: '#10B981', fontFamily: 'monospace' }}>{receiptCode || 'EMG-673299'}</b>
            </div>
          </div>
        </div>

        {/* BODY MODAL SCROLLABLE */}
        <form onSubmit={handleFormSubmit} style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* BANNER PHÂN QUYỀN GROOM - KHÔNG ICON */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderLeft: '4px solid #F59E0B',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '18px',
            fontSize: '12px',
            color: '#F59E0B',
            lineHeight: 1.5
          }}>
            <b>Quy chuẩn phân quyền Groom:</b> Groom ghi nhận chính xác các dấu hiệu lâm sàng, hành vi và triệu chứng thực tế tại chuồng. <b>Groom tuyệt đối không tự chẩn đoán bệnh lý, không kê đơn hay tự ý dùng thuốc điều trị.</b> Bác sĩ Thú y sẽ trực tiếp thăm khám và ban hành phác đồ.
          </div>

          {/* 1. CHỌN CHIẾN MÃ & MỨC ĐỘ TRIAGE KHẨN CẤP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '16px', marginBottom: '18px' }}>
            {/* Cột chọn ngựa */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                Chiến mã & Ô chuồng phụ trách <span style={{ color: '#EF4444' }}>*</span>
              </label>
              {horses.length > 0 ? (
                <select
                  value={selectedHorseId}
                  onChange={handleSelectHorse}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}
                >
                  {horses.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.stall}) - {h.breed}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ marginBottom: '8px' }}>
                  <select
                    value={stallCode}
                    onChange={(e) => setStallCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper)',
                      fontSize: '12.5px'
                    }}
                  >
                    {['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map(code => (
                      <option key={code} value={code}>Ô chuồng {code} (Block A)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Thẻ tóm tắt thông tin ngựa */}
              {currentSelectedHorse && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <img
                    src={currentSelectedHorse.avatar}
                    alt={currentSelectedHorse.name}
                    style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0, fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ color: 'var(--paper)', fontSize: '13px' }}>{currentSelectedHorse.name}</b>
                      <span style={{ color: 'var(--brass)', fontWeight: 700 }}>{currentSelectedHorse.stall}</span>
                    </div>
                    <div style={{ color: 'var(--paper-dim)', marginTop: '2px' }}>
                      {currentSelectedHorse.breed} · {currentSelectedHorse.age} tuổi
                    </div>
                    <div style={{ color: '#10B981', marginTop: '2px', fontSize: '11px', fontWeight: 600 }}>
                      BS: {currentSelectedHorse.vet || 'BS. Nguyễn An'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cột chọn mức độ khẩn cấp (Triage) - CÂN ĐỐI, KHÔNG ICON */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
                Phân loại mức độ khẩn cấp (Clinical Triage) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {/* Nút CRITICAL */}
                <button
                  type="button"
                  onClick={() => setSeverity('CRITICAL')}
                  style={{
                    padding: '10px 10px',
                    borderRadius: '6px',
                    border: severity === 'CRITICAL' ? '2px solid #EF4444' : '1px solid var(--line)',
                    background: severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-secondary)',
                    color: severity === 'CRITICAL' ? '#FFFFFF' : 'var(--paper-dim)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '78px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '12px', color: '#EF4444', letterSpacing: '0.04em' }}>
                    CRITICAL
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: 1.3, color: 'var(--paper)' }}>
                    Cấp cứu khẩn (Colic, gãy nứt, sốt &gt; 39.5°C)
                  </div>
                  <div style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700, marginTop: '2px' }}>
                    BS có mặt &lt; 10 phút
                  </div>
                </button>

                {/* Nút HIGH */}
                <button
                  type="button"
                  onClick={() => setSeverity('HIGH')}
                  style={{
                    padding: '10px 10px',
                    borderRadius: '6px',
                    border: severity === 'HIGH' ? '2px solid #F59E0B' : '1px solid var(--line)',
                    background: severity === 'HIGH' ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-secondary)',
                    color: severity === 'HIGH' ? '#FFFFFF' : 'var(--paper-dim)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '78px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '12px', color: '#F59E0B', letterSpacing: '0.04em' }}>
                    HIGH
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: 1.3, color: 'var(--paper)' }}>
                    Mức độ cao (Khập khiễng, sưng nóng khớp)
                  </div>
                  <div style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 700, marginTop: '2px' }}>
                    Khám &lt; 1 giờ
                  </div>
                </button>

                {/* Nút MEDIUM */}
                <button
                  type="button"
                  onClick={() => setSeverity('MEDIUM')}
                  style={{
                    padding: '10px 10px',
                    borderRadius: '6px',
                    border: severity === 'MEDIUM' ? '2px solid #3B82F6' : '1px solid var(--line)',
                    background: severity === 'MEDIUM' ? 'rgba(59, 130, 246, 0.16)' : 'var(--bg-secondary)',
                    color: severity === 'MEDIUM' ? '#FFFFFF' : 'var(--paper-dim)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '78px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '12px', color: '#3B82F6', letterSpacing: '0.04em' }}>
                    MEDIUM
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: 1.3, color: 'var(--paper)' }}>
                    Trung bình (Trầy xước da, cắn gỗ máng ăn)
                  </div>
                  <div style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 700, marginTop: '2px' }}>
                    Khám trong ngày
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 2. DẤU HIỆU LÂM SÀNG PHÁT HIỆN ĐƯỢC - LƯỚI 2 CỘT CÂN ĐỐI, BỎ ICON */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px' }}>
              Dấu hiệu lâm sàng / Triệu chứng quan sát được <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {COMMON_SYMPTOMS_LIST.map(sym => {
                const isSelected = selectedSymptom === sym.label;
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => {
                      setSelectedSymptom(sym.label);
                      if (sym.severity === 'CRITICAL') setSeverity('CRITICAL');
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid var(--brass)' : '1px solid var(--line)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.14)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--brass)' : 'var(--paper)',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ lineHeight: 1.35 }}>{sym.label}</span>
                    {isSelected && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--brass)',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. CHỈ SỐ SINH TỒN SƠ BỘ ĐO TẠI CHUỒNG - BỎ ICON */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <b style={{ fontSize: '12px', color: 'var(--paper)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Chỉ số sinh tồn lâm sàng sơ bộ (Vital Signs Observation)
              </b>
              <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                Đo nhanh trước khi Bác sĩ Thú y có mặt
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {/* Thân nhiệt */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                  Thân nhiệt (°C):
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="42"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: '5px',
                      border: '1px solid var(--line)',
                      background: 'var(--bg-card)',
                      color: Number(temp) > 38.5 ? '#EF4444' : 'var(--paper)',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '8px', top: '8px', fontSize: '10.5px', color: 'var(--paper-dim)' }}>°C</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                  Chuẩn: 37.5 – 38.5°C
                </div>
              </div>

              {/* Nhịp thở */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                  Nhịp thở (lần/phút):
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-card)',
                    color: 'var(--paper)',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                  Chuẩn: 8 – 16 bpm
                </div>
              </div>

              {/* Niêm mạc */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                  Màu niêm mạc (Nướu):
                </label>
                <select
                  value={mucousColor}
                  onChange={(e) => setMucousColor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-card)',
                    color: 'var(--paper)',
                    fontSize: '11.5px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Hồng nhạt (Bình thường)">Hồng nhạt (Bình thường)</option>
                  <option value="Nhợt nhạt / Trắng bệch (Thiếu máu)">Nhợt nhạt / Trắng bệch</option>
                  <option value="Đỏ bầm / Sung huyết (Viêm/Sốt)">Đỏ bầm / Sung huyết</option>
                  <option value="Tím tái (Thiếu oxy cấp)">Tím tái (Nguy kịch)</option>
                </select>
                <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                  Quan sát nướu răng
                </div>
              </div>

              {/* Nhu động ruột */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--paper-dim)', marginBottom: '4px' }}>
                  Nhu động ruột (Colic):
                </label>
                <select
                  value={gutSounds}
                  onChange={(e) => setGutSounds(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-card)',
                    color: 'var(--paper)',
                    fontSize: '11.5px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Bình thường (Âm sôi đều 4 góc)">Bình thường (Sôi đều)</option>
                  <option value="Giảm nhu động ruột (Nghi Colic)">Giảm âm / Im ắng (Colic)</option>
                  <option value="Mất hoàn toàn nhu động ruột">Mất tiếng ruột (Khẩn cấp)</option>
                  <option value="Co thắt dữ dội (Sôi ruột liên tục)">Co thắt dữ dội</option>
                </select>
                <div style={{ fontSize: '10px', color: 'var(--paper-dim)', marginTop: '3px' }}>
                  Áp tai nghe góc bụng
                </div>
              </div>
            </div>
          </div>

          {/* 4. HÀNH ĐỘNG SƠ CỨU BAN ĐẦU GROOM ĐÃ THỰC HIỆN NGAY - BỎ DẤU + / ✓ */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '6px' }}>
              Thao tác sơ cứu ban đầu Groom đã thực hiện tại hiện trường:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {FIRST_AID_OPTIONS.map(opt => {
                const checked = selectedFirstAid.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleFirstAid(opt)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: checked ? '1px solid #10B981' : '1px solid var(--line)',
                      background: checked ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                      color: checked ? '#10B981' : 'var(--paper-dim)',
                      fontSize: '11.5px',
                      fontWeight: checked ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. MÔ TẢ CHI TIẾT HIỆN TRƯỜNG */}
          <div style={{ marginBottom: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '4px' }}>
              Mô tả chi tiết quan sát thực tế tại chuồng <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows="3"
              required
              placeholder="Ghi nhận rõ tư thế ngựa đứng/nằm (cào móng, ngoái đầu sườn), phản xạ khi sờ nắn gân chân, màu phân/nước tiểu, lượng ăn thừa buổi sáng..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                background: 'var(--bg-secondary)',
                color: 'var(--paper)',
                fontFamily: 'inherit',
                fontSize: '12.5px',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.45
              }}
            />
          </div>
        </form>

        {/* FOOTER MODAL - CÂN BẰNG, KHÔNG ICON */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--line)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', flex: 1, minWidth: '220px' }}>
            Phiếu báo động sẽ tự động gửi thông báo đến <b>Bác sĩ Thú y & Quản trị viên</b> theo thời gian thực.
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--paper-dim)',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              style={{
                height: '38px',
                padding: '0 22px',
                borderRadius: '6px',
                background: severity === 'CRITICAL' ? '#EF4444' : 'var(--brass)',
                color: severity === 'CRITICAL' ? '#FFFFFF' : '#0A0D14',
                fontWeight: 800,
                border: 'none',
                fontSize: '12.5px',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: severity === 'CRITICAL' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(212, 175, 55, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              Phát Báo Động
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
