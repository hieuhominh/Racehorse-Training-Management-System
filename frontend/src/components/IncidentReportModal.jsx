import React, { useState, useMemo } from 'react';

export default function IncidentReportModal({ isOpen, onClose, activeStall, stallsList, onSubmitIncident }) {
  if (!isOpen) return null;

  const [selectedStallCode, setSelectedStallCode] = useState(activeStall ? activeStall.code : 'A1');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['🥣 Ngựa bỏ ăn / Ăn kém', '🪵 Móng bị xước / Rạn guốc']);
  const [severity, setSeverity] = useState('HIGH'); // 'LOW' | 'MEDIUM' | 'HIGH'
  const [description, setDescription] = useState('Chiến mã có biểu hiện bỏ ăn chiều, ăn không hết 1/3 khẩu phần cỏ Alfalfa. Phát hiện vết xước nông ở móng trước bên trái, cần Thú y kiểm tra gấp.');
  const [attachedImage, setAttachedImage] = useState('https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=600&q=80');
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // Active Stall object preview
  const currentStallObj = useMemo(() => {
    return stallsList.find(s => s.code === selectedStallCode) || activeStall || stallsList[0];
  }, [stallsList, selectedStallCode, activeStall]);

  // Symptoms list with rich visual details
  const availableSymptoms = [
    { id: 'appetite', icon: '🥣', label: '🥣 Ngựa bỏ ăn / Ăn kém', desc: 'Không ăn hết khẩu phần sáng/chiều', category: 'Dinh dưỡng' },
    { id: 'fever', icon: '🌡️', label: '🌡️ Có dấu hiệu đau bụng / Sốt', desc: 'Thân nhiệt > 38.5°C, thở nhanh, dậm chân (Colic)', category: 'Thể trạng' },
    { id: 'hoof', icon: '🪵', label: '🪵 Móng bị xước / Rạn guốc', desc: 'Vết nứt móng, rỉ máu hoặc bong guốc', category: 'Chấn thương' },
    { id: 'tendon', icon: '🩹', label: '🩹 Đau gân / Sưng khớp', desc: 'Sưng nóng gân trước/sau sau buổi tập', category: 'Chấn thương' },
    { id: 'cough', icon: '💨', label: '💨 Ho / Chảy nước mũi', desc: 'Chảy nước mũi trong/đục, ho kéo dài', category: 'Hô hấp' },
    { id: 'other', icon: '🚨', label: '🚨 Sự cố chuồng trại khác', desc: 'Hỏng chốt cửa, mất điện/nước khu chuồng', category: 'Cơ sở vật chất' }
  ];

  // Preset sample actual photos for quick demo selection
  const samplePhotos = [
    { title: 'Ảnh 1: Vết xước móng trước', url: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=600&q=80' },
    { title: 'Ảnh 2: Khẩu phần cỏ còn thừa', url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80' },
    { title: 'Ảnh 3: Đo nhiệt độ & khám gân', url: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80' }
  ];

  const toggleSymptom = (label) => {
    if (selectedSymptoms.includes(label)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== label));
    } else {
      setSelectedSymptoms([...selectedSymptoms, label]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      alert('Vui lòng chọn ít nhất 1 triệu chứng sự cố!');
      return;
    }

    const newIncident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      stallCode: selectedStallCode,
      horseName: currentStallObj.horse || 'Chiến mã',
      chipId: currentStallObj.chipId || 'N/A',
      symptoms: selectedSymptoms,
      severity,
      description,
      imageUrl: attachedImage,
      reportedBy: currentStallObj.groom || 'Groom Nguyễn Văn Hùng',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
      status: 'pending_vet'
    };

    onSubmitIncident(newIncident);
    setIsSuccessToast(true);
    setTimeout(() => {
      setIsSuccessToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container incident-modal-container ultra-premium-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header incident-modal-header">
          <div>
            <div className="badge-row">
              <span className="badge badge-alert glow-alert-pulse">🚨 BÁO CÁO SỰ CỐ ĐỘT XUẤT TẠI CHUỒNG</span>
              <span className="badge badge-gold">GROOM & THÚ Y TRỰC</span>
            </div>
            <h2 className="modal-title">GỬI BÁO CÁO SỰ CỐ & PHÁT THÔNG BÁO KHẨN</h2>
            <p className="modal-sub">
              Ghi nhận các hiện tượng bất thường (bỏ ăn, sốt, xước móng, đau gân) kèm ảnh chụp thực tế để gửi Thú y trực thăm khám gấp.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="modal-body incident-modal-body">
          {isSuccessToast ? (
            <div className="incident-success-banner">
              <div className="success-icon-animated">🔔</div>
              <h3>ĐÃ GỬI BÁO CÁO SỰ CỐ & PHÁT THÔNG BÁO KHẨN!</h3>
              <p>Hệ thống đã gửi cảnh báo trực tiếp tới điện thoại Bác sĩ Thú y trực & HLV trưởng.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="incident-form">
              {/* TARGET STALL & HORSE VISUAL CONTEXT CARD */}
              <div className="stall-context-preview-card">
                <div className="context-left">
                  <label htmlFor="stall-selector-dropdown" className="context-label">
                    <strong>🏠 VỊ TRÍ Ô CHUỒNG CẦN BÁO CÁO:</strong>
                  </label>
                  <select
                    id="stall-selector-dropdown"
                    value={selectedStallCode}
                    onChange={(e) => setSelectedStallCode(e.target.value)}
                    className="form-select stall-hero-select"
                  >
                    {stallsList.map((s) => (
                      <option key={s.code} value={s.code}>
                        Chuồng {s.code} — {s.horse} ({s.chipId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="context-right-horse">
                  <img src={currentStallObj.avatar} alt={currentStallObj.horse} className="context-avatar" />
                  <div>
                    <h3 className="context-horse-name">{currentStallObj.horse}</h3>
                    <div className="context-chip">MÃ CHIP RFID: <code>{currentStallObj.chipId}</code></div>
                    <div className="context-groom">Groom phụ trách: {currentStallObj.groom}</div>
                  </div>
                </div>
              </div>

              {/* SEVERITY LEVEL SELECTOR CARDS (3 INTERACTIVE CHOICES) */}
              <div className="form-group">
                <label className="form-section-title">
                  <strong>⚠️ MỨC ĐỘ KHẨN CẤP CỦA SỰ CỐ:</strong>
                </label>

                <div className="severity-cards-grid">
                  <div
                    className={`severity-card card-low ${severity === 'LOW' ? 'active-low' : ''}`}
                    onClick={() => setSeverity('LOW')}
                  >
                    <div className="sev-radio-icon">{severity === 'LOW' ? '🔘' : '⚪'}</div>
                    <div>
                      <h4 className="sev-title yellow-text">🟡 CẦN THEO DÕI</h4>
                      <p className="sev-desc">Ghi nhật ký sự cố nhẹ, theo dõi thêm trong ngày</p>
                    </div>
                  </div>

                  <div
                    className={`severity-card card-medium ${severity === 'MEDIUM' ? 'active-medium' : ''}`}
                    onClick={() => setSeverity('MEDIUM')}
                  >
                    <div className="sev-radio-icon">{severity === 'MEDIUM' ? '🔘' : '⚪'}</div>
                    <div>
                      <h4 className="sev-title orange-text">🟧 KHẨN CẤP</h4>
                      <p className="sev-desc">Thú y cần ghé kiểm tra ô chuồng trong buổi làm việc</p>
                    </div>
                  </div>

                  <div
                    className={`severity-card card-high ${severity === 'HIGH' ? 'active-high' : ''}`}
                    onClick={() => setSeverity('HIGH')}
                  >
                    <div className="sev-radio-icon">{severity === 'HIGH' ? '🔘' : '⚪'}</div>
                    <div>
                      <h4 className="sev-title red-text">🔴 RẤT KHẨN CẤP</h4>
                      <p className="sev-desc">Phát còi báo động trực tiếp tới Bác sĩ Thú y & HLV trưởng!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SYMPTOMS SELECTION CARDS GRID */}
              <div className="form-group">
                <div className="label-with-counter">
                  <label className="form-section-title">
                    <strong>🩺 CHỌN TRIỆU CHỨNG SỰ CỐ THỰC TẾ:</strong>
                  </label>
                  <span className="symptom-count-badge">
                    Đã chọn: <strong>{selectedSymptoms.length}</strong> triệu chứng
                  </span>
                </div>

                <div className="symptom-cards-grid-v2">
                  {availableSymptoms.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym.label);
                    return (
                      <div
                        key={sym.id}
                        className={`symptom-card-v2 ${isSelected ? 'selected-card' : ''}`}
                        onClick={() => toggleSymptom(sym.label)}
                      >
                        <div className="sym-card-header">
                          <span className="sym-category-badge">{sym.category}</span>
                          <span className={`sym-check-badge ${isSelected ? 'checked' : ''}`}>
                            {isSelected ? '✓ Đã chọn' : '+ Chọn'}
                          </span>
                        </div>
                        <h4 className="sym-card-title">{sym.label}</h4>
                        <p className="sym-card-desc">{sym.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DESCRIPTION TEXTAREA */}
              <div className="form-group">
                <label htmlFor="incident-desc" className="form-section-title">
                  <strong>📝 MÔ TẢ CHI TIẾT HIỆN TRẠNG SỰ CỐ:</strong>
                </label>
                <textarea
                  id="incident-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea-v2"
                  placeholder="Ghi rõ chi tiết về lượng thức ăn thừa, nhiệt độ đo được, diễn biến đau móng hoặc chấn thương..."
                  required
                />
              </div>

              {/* PHOTO UPLOAD & PREVIEW ZONE */}
              <div className="form-group">
                <label className="form-section-title">
                  <strong>📸 ĐÍNH KÈM HÌNH ẢNH THỰC TẾ TẠI CHUỒNG:</strong>
                </label>

                <div className="photo-upload-zone-v2">
                  <div className="upload-dropzone">
                    <div className="dropzone-icon">📷</div>
                    <div className="dropzone-info">
                      <strong>Tải ảnh sự cố thực tế từ điện thoại/máy tính</strong>
                      <span>Hỗ trợ định dạng JPG, PNG, WEBP</span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      id="incident-photo-file"
                      className="file-input-hidden"
                    />
                    <label htmlFor="incident-photo-file" className="btn btn-gold-outline btn-sm">
                      📁 Chọn tập tin ảnh
                    </label>
                  </div>

                  <div className="quick-sample-photos">
                    <span className="sample-photos-title">Hoặc chọn nhanh ảnh mẫu minh họa:</span>
                    <div className="sample-photos-row">
                      {samplePhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className={`sample-photo-thumb ${attachedImage === photo.url ? 'active-thumb' : ''}`}
                          onClick={() => setAttachedImage(photo.url)}
                          title={photo.title}
                        >
                          <img src={photo.url} alt={photo.title} />
                          <span className="thumb-hover-label">Chọn</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ATTACHED IMAGE PREVIEW DISPLAY */}
                {attachedImage && (
                  <div className="image-preview-card-v2">
                    <div className="preview-header-bar">
                      <span>🖼️ ẢNH SỰ CỐ SẼ ĐƯỢC GỬI CHO BÁC SĨ THÚ Y</span>
                      <button
                        type="button"
                        className="btn-delete-photo-text"
                        onClick={() => setAttachedImage('')}
                      >
                        ✕ Xóa ảnh này
                      </button>
                    </div>
                    <div className="preview-img-frame">
                      <img src={attachedImage} alt="Ảnh sự cố thực tế" className="attached-img-v2" />
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTION BUTTONS */}
              <div className="modal-footer incident-modal-footer">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-solid btn-incident-submit-v2">
                  🚀 PHÁT THÔNG BÁO KHẨN CẤP TỚI BÁC SĨ THÚ Y TRỰC
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
