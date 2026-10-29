import React, { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function IncidentReportModal({ isOpen, onClose, activeStall, stallsList, onSubmitIncident }) {
  const { showToast } = useToast();
  const { t, lang } = useLanguage();
  const [selectedStallCode, setSelectedStallCode] = useState(activeStall ? activeStall.code : 'A1');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Ngựa bỏ ăn / Ăn kém', 'Móng bị xước / Rạn guốc']);
  const [severity, setSeverity] = useState('HIGH'); // 'LOW' | 'MEDIUM' | 'HIGH'
  const [description, setDescription] = useState(
    lang === 'en'
      ? 'Racehorse refused 1/3 of afternoon Alfalfa hay. Minor superficial crack detected on front-left hoof, requiring immediate veterinary assessment.'
      : 'Chiến mã có biểu hiện bỏ ăn chiều, ăn không hết 1/3 khẩu phần cỏ Alfalfa. Phát hiện vết xước nông ở móng trước bên trái, cần Thú y kiểm tra gấp.'
  );
  const [attachedImage, setAttachedImage] = useState('https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80');
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // Active Stall object preview
  const currentStallObj = useMemo(() => {
    const safeList = Array.isArray(stallsList) ? stallsList : [];
    return safeList.find(s => s.code === selectedStallCode) || activeStall || safeList[0] || {};
  }, [stallsList, selectedStallCode, activeStall]);

  // Symptoms list with clean typography
  const availableSymptoms = useMemo(() => [
    {
      id: 'appetite',
      label: lang === 'en' ? 'Loss of Appetite / Poor Feeding' : 'Ngựa bỏ ăn / Ăn kém',
      desc: lang === 'en' ? 'Refused morning or evening ration' : 'Không ăn hết khẩu phần sáng/chiều',
      category: lang === 'en' ? 'Nutrition' : 'Dinh dưỡng'
    },
    {
      id: 'fever',
      label: lang === 'en' ? 'Signs of Colic / Elevated Fever' : 'Có dấu hiệu đau bụng / Sốt',
      desc: lang === 'en' ? 'Temp > 38.5°C, rapid breathing, restless pacing' : 'Thân nhiệt > 38.5°C, thở nhanh, dậm chân (Colic)',
      category: lang === 'en' ? 'Physical' : 'Thể trạng'
    },
    {
      id: 'hoof',
      label: lang === 'en' ? 'Scratched / Cracked Hoof' : 'Móng bị xước / Rạn guốc',
      desc: lang === 'en' ? 'Hoof wall fissure, bleeding or loose shoe' : 'Vết nứt móng, rỉ máu hoặc bong guốc',
      category: lang === 'en' ? 'Injury' : 'Chấn thương'
    },
    {
      id: 'tendon',
      label: lang === 'en' ? 'Tendon Strain / Joint Swelling' : 'Đau gân / Sưng khớp',
      desc: lang === 'en' ? 'Hot, swollen flexor tendon post-workout' : 'Sưng nóng gân trước/sau sau buổi tập',
      category: lang === 'en' ? 'Injury' : 'Chấn thương'
    },
    {
      id: 'cough',
      label: lang === 'en' ? 'Coughing / Nasal Discharge' : 'Ho / Chảy nước mũi',
      desc: lang === 'en' ? 'Mucus discharge, persistent dry cough' : 'Chảy nước mũi trong/đục, ho kéo dài',
      category: lang === 'en' ? 'Respiratory' : 'Hô hấp'
    },
    {
      id: 'other',
      label: lang === 'en' ? 'Other Barn Infrastructure Issue' : 'Sự cố chuồng trại khác',
      desc: lang === 'en' ? 'Door latch failure, power or water supply outage' : 'Hỏng chốt cửa, mất điện/nước khu chuồng',
      category: lang === 'en' ? 'Facilities' : 'Cơ sở vật chất'
    }
  ], [lang]);

  // Preset sample actual photos for quick demo selection
  const samplePhotos = useMemo(() => [
    {
      title: lang === 'en' ? 'Photo 1: Foreleg hoof crack' : 'Ảnh 1: Vết xước móng trước',
      url: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: lang === 'en' ? 'Photo 2: Uneaten hay ration' : 'Ảnh 2: Khẩu phần cỏ còn thừa',
      url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: lang === 'en' ? 'Photo 3: Temperature check & palpation' : 'Ảnh 3: Đo nhiệt độ & khám gân',
      url: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80'
    }
  ], [lang]);

  if (!isOpen) return null;

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
      showToast(t('incModalToastWarning'), lang === 'en' ? 'REPORT WARNING' : 'CẢNH BÁO BÁO CÁO', 'warning');
      return;
    }

    const horseDisplay = (lang === 'en' && currentStallObj.englishName) ? currentStallObj.englishName : (currentStallObj.horse || 'Chiến mã');

    const newIncident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      stallCode: selectedStallCode,
      horseName: horseDisplay,
      chipId: currentStallObj.chipId || 'N/A',
      symptoms: selectedSymptoms,
      severity,
      description,
      imageUrl: attachedImage,
      reportedBy: currentStallObj.groom || 'Groom Nguyễn Văn Hùng',
      timestamp: new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN'),
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
              <span className="badge badge-gold">{t('stablesBadgeTitle')}</span>
              <span className="badge badge-slate">{t('incModalBadgeGroom')}</span>
            </div>
            <h2 className="modal-title">{t('incModalHeaderTitle')}</h2>
            <p className="modal-sub">
              {t('incModalHeaderSub')}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('closeBtn')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="modal-body incident-modal-body">
          {isSuccessToast ? (
            <div className="incident-success-banner" style={{ border: '1px solid var(--line-strong)', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: 'var(--brass)', marginBottom: '12px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 style={{ color: 'var(--brass)', fontSize: '18px', marginBottom: '8px' }}>{t('incModalSuccessTitle')}</h3>
              <p style={{ color: 'var(--paper-dim)', fontSize: '14px' }}>{t('incModalSuccessDesc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="incident-form">
              {/* TARGET STALL & HORSE VISUAL CONTEXT CARD */}
              <div className="stall-context-preview-card">
                <div className="context-left">
                  <label htmlFor="stall-selector-dropdown" className="context-label">
                    <strong>{t('incModalTargetStallLabel')}</strong>
                  </label>
                  <select
                    id="stall-selector-dropdown"
                    value={selectedStallCode}
                    onChange={(e) => setSelectedStallCode(e.target.value)}
                    className="form-select stall-hero-select"
                  >
                    {stallsList.map((s) => {
                      const hName = (lang === 'en' && s.englishName) ? s.englishName : s.horse;
                      return (
                        <option key={s.code} value={s.code}>
                          {t('stablesStallLabelPrefix')} {s.code} — {hName} ({s.chipId})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="context-right-horse">
                  <img src={currentStallObj.avatar} alt={currentStallObj.horse} className="context-avatar" />
                  <div>
                    <h3 className="context-horse-name">{(lang === 'en' && currentStallObj.englishName) ? currentStallObj.englishName : currentStallObj.horse}</h3>
                    <div className="context-chip">{t('stablesRfidChip')} <code>{currentStallObj.chipId}</code></div>
                    <div className="context-groom">{t('stablesGroomLabel')} {currentStallObj.groom}</div>
                  </div>
                </div>
              </div>

              {/* SEVERITY LEVEL SELECTOR CARDS (3 INTERACTIVE CHOICES) */}
              <div className="form-group">
                <label className="form-section-title">
                  <strong>{t('incModalUrgencyTitle')}</strong>
                </label>

                <div className="severity-cards-grid">
                  <div
                    className={`severity-card ${severity === 'LOW' ? 'active-low' : ''}`}
                    onClick={() => setSeverity('LOW')}
                    style={{
                      border: severity === 'LOW' ? '1px solid var(--brass)' : '1px solid var(--line)',
                      background: severity === 'LOW' ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="sev-radio-icon">
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: severity === 'LOW' ? 'var(--brass)' : 'transparent',
                        border: '2px solid var(--brass)'
                      }}></span>
                    </div>
                    <div>
                      <h4 className="sev-title" style={{ color: 'var(--paper)' }}>{t('incModalSevLowTitle')}</h4>
                      <p className="sev-desc" style={{ color: 'var(--paper-dim)' }}>{t('incModalSevLowDesc')}</p>
                    </div>
                  </div>

                  <div
                    className={`severity-card ${severity === 'MEDIUM' ? 'active-medium' : ''}`}
                    onClick={() => setSeverity('MEDIUM')}
                    style={{
                      border: severity === 'MEDIUM' ? '1px solid var(--brass)' : '1px solid var(--line)',
                      background: severity === 'MEDIUM' ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="sev-radio-icon">
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: severity === 'MEDIUM' ? 'var(--brass)' : 'transparent',
                        border: '2px solid var(--brass)'
                      }}></span>
                    </div>
                    <div>
                      <h4 className="sev-title" style={{ color: 'var(--paper)' }}>{t('incModalSevMedTitle')}</h4>
                      <p className="sev-desc" style={{ color: 'var(--paper-dim)' }}>{t('incModalSevMedDesc')}</p>
                    </div>
                  </div>

                  <div
                    className={`severity-card ${severity === 'HIGH' ? 'active-high' : ''}`}
                    onClick={() => setSeverity('HIGH')}
                    style={{
                      border: severity === 'HIGH' ? '1px solid var(--brass)' : '1px solid var(--line)',
                      background: severity === 'HIGH' ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="sev-radio-icon">
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: severity === 'HIGH' ? 'var(--brass)' : 'transparent',
                        border: '2px solid var(--brass)'
                      }}></span>
                    </div>
                    <div>
                      <h4 className="sev-title" style={{ color: 'var(--brass)' }}>{t('incModalSevHighTitle')}</h4>
                      <p className="sev-desc" style={{ color: 'var(--paper-dim)' }}>{t('incModalSevHighDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SYMPTOMS SELECTION CARDS GRID */}
              <div className="form-group">
                <div className="label-with-counter">
                  <label className="form-section-title">
                    <strong>{t('incModalSymptomsTitle')}</strong>
                  </label>
                  <span className="symptom-count-badge" style={{ color: 'var(--brass)', fontSize: '13px' }}>
                    {t('incModalSelectedCount')} <strong>{selectedSymptoms.length}</strong> {t('incModalSymptomsUnit')}
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
                        style={{
                          border: isSelected ? '1px solid var(--brass)' : '1px solid var(--line)',
                          background: isSelected ? 'rgba(212, 175, 55, 0.06)' : 'var(--bg-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="sym-card-header">
                          <span className="sym-category-badge" style={{ fontSize: '11px', color: 'var(--paper-dim)', background: 'var(--line)', padding: '2px 6px', borderRadius: '4px' }}>{sym.category}</span>
                          <span className={`sym-check-badge ${isSelected ? 'checked' : ''}`} style={{ fontSize: '12px', color: isSelected ? 'var(--brass)' : 'var(--paper-dim)' }}>
                            {isSelected ? t('incModalSelectedAction') : t('incModalSelectAction')}
                          </span>
                        </div>
                        <h4 className="sym-card-title" style={{ color: 'var(--paper)', fontSize: '14px', marginTop: '6px' }}>{sym.label}</h4>
                        <p className="sym-card-desc" style={{ color: 'var(--paper-dim)', fontSize: '12px' }}>{sym.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DESCRIPTION TEXTAREA */}
              <div className="form-group">
                <label htmlFor="incident-desc" className="form-section-title">
                  <strong>{t('incModalDescLabel')}</strong>
                </label>
                <textarea
                  id="incident-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea-v2"
                  placeholder={t('incModalDescPlaceholder')}
                  required
                />
              </div>

              {/* PHOTO UPLOAD & PREVIEW ZONE */}
              <div className="form-group">
                <label className="form-section-title">
                  <strong>{t('incModalAttachTitle')}</strong>
                </label>

                <div className="photo-upload-zone-v2">
                  <div className="upload-dropzone">
                    <div className="dropzone-info">
                      <strong>{t('incModalUploadPrompt')}</strong>
                      <span>{t('incModalUploadFormats')}</span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      id="incident-photo-file"
                      className="file-input-hidden"
                    />
                    <label htmlFor="incident-photo-file" className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                      {t('incModalChooseFile')}
                    </label>
                  </div>

                  <div className="quick-sample-photos">
                    <span className="sample-photos-title">{t('incModalSamplePrompt')}</span>
                    <div className="sample-photos-row">
                      {samplePhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className={`sample-photo-thumb ${attachedImage === photo.url ? 'active-thumb' : ''}`}
                          onClick={() => setAttachedImage(photo.url)}
                          title={photo.title}
                        >
                          <img src={photo.url} alt={photo.title} />
                          <span className="thumb-hover-label">{t('incModalSampleSelect')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ATTACHED IMAGE PREVIEW DISPLAY */}
                {attachedImage && (
                  <div className="image-preview-card-v2">
                    <div className="preview-header-bar">
                      <span style={{ fontSize: '13px', color: 'var(--paper-dim)' }}>{t('incModalImgNotice')}</span>
                      <button
                        type="button"
                        className="btn-delete-photo-text"
                        onClick={() => setAttachedImage('')}
                      >
                        {t('incModalDeleteImg')}
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
                  {t('incModalCancelBtn')}
                </button>
                <button type="submit" className="btn btn-solid btn-incident-submit-v2">
                  {t('incModalSubmitBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

