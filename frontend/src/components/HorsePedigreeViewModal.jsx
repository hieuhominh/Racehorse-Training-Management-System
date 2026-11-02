import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function HorsePedigreeViewModal({ horse, isOpen = true, onClose, onOpenProfile }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !horse) return null;

  const defaultAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80';
  const horseAvatar = horse.avatar || horse.horse_avatar || defaultAvatar;
  const ownerName = horse.ownerName || horse.owner || 'Chủ sở hữu';
  const stallCode = horse.stable || horse.stall || 'Ô A1';
  const microchip = horse.microchip || horse.chipId || 'MC-VN-2026-001';

  // Trích xuất hoặc tổng hợp dữ liệu phả hệ do Chủ sở hữu cung cấp
  const rawPed = horse.pedigree || {};
  const g1 = rawPed.g1 || {};
  const g2 = rawPed.g2 || {};
  const g3 = rawPed.g3 || {};

  const sireName = rawPed.sire || g2.sire?.name || 'Chưa cập nhật dòng Bố';
  const sireAch = rawPed.sireAchievements || g2.sire?.achievements || '';
  const sireSire = rawPed.sireOfSire || g3.sireSire?.name || g3.paternalGrandSire?.name || 'Chưa cập nhật';
  const sireDam = rawPed.damOfSire || g3.sireDam?.name || g3.paternalGrandDam?.name || 'Chưa cập nhật';

  const damName = rawPed.dam || g2.dam?.name || 'Chưa cập nhật dòng Mẹ';
  const damAch = rawPed.damAchievements || g2.dam?.achievements || '';
  const damSire = rawPed.sireOfDam || g3.damSire?.name || g3.maternalGrandSire?.name || 'Chưa cập nhật';
  const damDam = rawPed.damOfDam || g3.damDam?.name || g3.maternalGrandDam?.name || 'Chưa cập nhật';

  const studBookNo = rawPed.studBookNo || g1.chipId || `VTB-SB-${horse.id || (microchip ? microchip.replace(/\D/g, '').slice(-4) : '2026')}`;
  const foaledYear = rawPed.foaled || g1.yob || horse.age || '2023 (3 tuổi)';
  const originCountry = rawPed.origin || g1.origin || 'Việt Nam (Trường đua Phú Thọ)';
  const bloodlineDesc = rawPed.bloodline || (sireName !== 'Chưa cập nhật dòng Bố' ? `${sireName} × ${damName}` : 'Dòng thuần chủng F1 thi đấu chính thức');

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 999999,
        cursor: 'pointer'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #0E1322)',
          border: '1.5px solid var(--brass, #D4AF37)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px 28px',
          color: 'var(--paper, #F3F4F6)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          cursor: 'default',
          position: 'relative'
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'var(--bg-secondary, #151C2F)',
            border: '1px solid var(--line, rgba(212, 175, 55, 0.2))',
            color: 'var(--paper-dim, #9CA3AF)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            transition: 'all 0.2s'
          }}
          title="Đóng modal"
        >
          ✕
        </button>

        {/* Header Modal */}
        <div style={{ marginBottom: '18px', paddingRight: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              background: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--brass, #D4AF37)',
              letterSpacing: '0.04em'
            }}>
              SỔ PHẢ HỆ CHỦ SỞ HỮU ĐĂNG KÝ
            </span>
            <span style={{
              fontSize: '11.5px',
              color: 'var(--paper-dim, #9CA3AF)',
              fontFamily: 'monospace',
              background: 'var(--bg-secondary, #151C2F)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--line, rgba(212, 175, 55, 0.2))'
            }}>
              Mã chip: <b style={{ color: 'var(--paper, #F3F4F6)' }}>{microchip}</b>
            </span>
          </div>

          <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 800, color: 'var(--paper, #F3F4F6)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>{horse.name}</span>
            {horse.englishName && horse.englishName !== horse.name && (
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brass, #D4AF37)' }}>
                ({horse.englishName})
              </span>
            )}
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--paper-dim, #9CA3AF)', marginTop: '4px' }}>
            {horse.breed || 'Thoroughbred'} · {horse.gender || 'Ngựa thi đấu'} · Vị trí: <b style={{ color: 'var(--brass, #D4AF37)' }}>{stallCode}</b> · Chủ sở hữu: <b style={{ color: 'var(--brass, #D4AF37)' }}>{ownerName}</b>
          </div>
        </div>

        {/* Banner thông báo nguồn dữ liệu */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.06)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--paper, #F3F4F6)' }}>
            <span>
              Phả hệ 3 đời chính thức do <b>{ownerName}</b> cung cấp và cập nhật lúc đăng ký chiến mã vào hệ thống.
            </span>
          </div>
          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenProfile(horse);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--brass, #D4AF37)',
                color: 'var(--brass, #D4AF37)',
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Xem Hồ Sơ Định Danh →
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* SƠ ĐỒ CÂY PHẢ HỆ 3 THẾ HỆ (G0 -> G1 -> G2) */}
        {/* ========================================================= */}
        <div style={{
          background: 'var(--bg-secondary, #151C2F)',
          border: '1px solid var(--line, rgba(212, 175, 55, 0.2))',
          borderRadius: '10px',
          padding: '22px 18px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '18px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--paper-dim, #9CA3AF)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>↔️</span>
            <span>Sơ đồ phả hệ trực quan 3 thế hệ (Chủ thể · Dòng Cha & Mẹ · Ông Bà Nội Ngoại)</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '780px',
            gap: '0px'
          }}>
            {/* CỘT 1: THẾ HỆ 0 - CHIẾN MÃ (CHỦ THỂ) */}
            <div style={{ width: '220px', flexShrink: 0, paddingRight: '10px' }}>
              <div style={{
                background: 'var(--bg-card, #0E1322)',
                border: '1.5px solid var(--brass, #D4AF37)',
                borderRadius: '8px',
                padding: '16px 12px',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.15)',
                textAlign: 'center'
              }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px', overflow: 'hidden', border: '2px solid var(--brass, #D4AF37)' }}>
                  <img
                    src={horseAvatar}
                    alt={horse.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = defaultAvatar; }}
                  />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, background: 'var(--brass, #D4AF37)', color: '#0A0D14', padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.04em' }}>
                  CHIẾN MÃ (CHỦ THỂ)
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brass, #D4AF37)', marginTop: '8px' }}>
                  {horse.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-dim, #9CA3AF)' }}>
                  {horse.englishName || horse.breed}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--paper-dim, #9CA3AF)', marginTop: '6px' }}>
                  Chuồng: <b>{stallCode}</b>
                </div>
              </div>
            </div>

            {/* BRACKET CỘT 1 -> CỘT 2 */}
            <div style={{
              width: '28px',
              height: '270px',
              position: 'relative',
              flexShrink: 0
            }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '14px', height: '2px', background: 'var(--brass, #D4AF37)', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', top: '25%', bottom: '25%', left: '14px', width: '2px', background: 'var(--brass, #D4AF37)' }} />
              <div style={{ position: 'absolute', top: '25%', left: '14px', width: '14px', height: '2px', background: 'var(--brass, #D4AF37)' }} />
              <div style={{ position: 'absolute', bottom: '25%', left: '14px', width: '14px', height: '2px', background: 'var(--brass, #D4AF37)' }} />
            </div>

            {/* CỘT 2: THẾ HỆ 1 - CHA & MẸ (SIRE & DAM) */}
            <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* BỐ (SIRE) */}
              <div style={{
                background: 'var(--bg-card, #0E1322)',
                border: '1.5px solid #3B82F6',
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '1px 7px', borderRadius: '4px' }}>
                    ♂ DÒNG BỐ (SIRE)
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--paper-dim, #9CA3AF)' }}>F1</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper, #F3F4F6)' }}>
                  {sireName}
                </div>
                {sireAch && (
                  <div style={{ fontSize: '11px', color: '#93C5FD', marginTop: '4px', lineHeight: 1.3 }}>
                    🏆 {sireAch}
                  </div>
                )}
              </div>

              {/* MẸ (DAM) */}
              <div style={{
                background: 'var(--bg-card, #0E1322)',
                border: '1.5px solid #F43F5E',
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(244, 63, 94, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(244, 63, 94, 0.2)', color: '#FB7185', padding: '1px 7px', borderRadius: '4px' }}>
                    ♀ DÒNG MẸ (DAM)
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--paper-dim, #9CA3AF)' }}>F1</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper, #F3F4F6)' }}>
                  {damName}
                </div>
                {damAch && (
                  <div style={{ fontSize: '11px', color: '#FDA4AF', marginTop: '4px', lineHeight: 1.3 }}>
                    🌸 {damAch}
                  </div>
                )}
              </div>
            </div>

            {/* BRACKET CỘT 2 -> CỘT 3 */}
            <div style={{
              width: '28px',
              height: '340px',
              position: 'relative',
              flexShrink: 0
            }}>
              {/* Nhánh Bố -> Ông Bà Nội */}
              <div style={{ position: 'absolute', top: '23%', left: 0, width: '14px', height: '2px', background: '#3B82F6', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', top: '11%', height: '24%', left: '14px', width: '2px', background: '#3B82F6' }} />
              <div style={{ position: 'absolute', top: '11%', left: '14px', width: '14px', height: '2px', background: '#3B82F6' }} />
              <div style={{ position: 'absolute', top: '35%', left: '14px', width: '14px', height: '2px', background: '#3B82F6' }} />

              {/* Nhánh Mẹ -> Ông Bà Ngoại */}
              <div style={{ position: 'absolute', bottom: '23%', left: 0, width: '14px', height: '2px', background: '#F43F5E', transform: 'translateY(50%)' }} />
              <div style={{ position: 'absolute', bottom: '11%', height: '24%', left: '14px', width: '2px', background: '#F43F5E' }} />
              <div style={{ position: 'absolute', bottom: '35%', left: '14px', width: '14px', height: '2px', background: '#F43F5E' }} />
              <div style={{ position: 'absolute', bottom: '11%', left: '14px', width: '14px', height: '2px', background: '#F43F5E' }} />
            </div>

            {/* CỘT 3: THẾ HỆ 2 - ÔNG BÀ NỘI & NGOẠI (F2) */}
            <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* ÔNG NỘI */}
              <div style={{ background: 'var(--bg-card, #0E1322)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                  ♂ Ông nội (Sire of Sire)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper, #F3F4F6)', marginTop: '2px' }}>
                  {sireSire}
                </div>
              </div>

              {/* BÀ NỘI */}
              <div style={{ background: 'var(--bg-card, #0E1322)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FB7185', textTransform: 'uppercase' }}>
                  ♀ Bà nội (Dam of Sire)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper, #F3F4F6)', marginTop: '2px' }}>
                  {sireDam}
                </div>
              </div>

              {/* ÔNG NGOẠI */}
              <div style={{ background: 'var(--bg-card, #0E1322)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', padding: '8px 12px', marginTop: '6px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
                  ♂ Ông ngoại (Sire of Dam)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper, #F3F4F6)', marginTop: '2px' }}>
                  {damSire}
                </div>
              </div>

              {/* BÀ NGOẠI */}
              <div style={{ background: 'var(--bg-card, #0E1322)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#FB7185', textTransform: 'uppercase' }}>
                  ♀ Bà ngoại (Dam of Dam)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper, #F3F4F6)', marginTop: '2px' }}>
                  {damDam}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG TỔNG QUAN DÒNG DÕI HUYẾT THỐNG */}
        <div style={{
          background: 'var(--bg-secondary, #151C2F)',
          border: '1px solid var(--line, rgba(212, 175, 55, 0.2))',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--paper-dim, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>
              Sổ Phả Hệ Quốc Tế (Stud Book)
            </span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brass, #D4AF37)', marginTop: '2px', fontFamily: 'monospace' }}>
              {studBookNo}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--paper-dim, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>
              Năm Sinh & Tuổi
            </span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper, #F3F4F6)', marginTop: '2px' }}>
              {foaledYear}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--paper-dim, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>
              Xuất Xứ Giống & Đăng Kiểm
            </span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--paper, #F3F4F6)', marginTop: '2px' }}>
              {originCountry}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--paper-dim, #9CA3AF)', textTransform: 'uppercase', fontWeight: 700 }}>
              Đặc Trưng Dòng Dõi
            </span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brass, #D4AF37)', marginTop: '2px' }}>
              {bloodlineDesc}
            </div>
          </div>
        </div>

        {/* Nút đóng chân modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: 'var(--brass, #D4AF37)',
              color: '#0A0D14',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}
          >
            Đóng Phả Hệ
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

