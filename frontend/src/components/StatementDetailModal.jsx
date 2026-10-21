import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function StatementDetailModal({ statement, isOpen, onClose }) {
  const { t, lang } = useLanguage();

  if (!isOpen || !statement) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatVND = (num) => {
    if (lang === 'en') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num / 25000);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const breakdown = statement.breakdown || {};
  const careItems = breakdown.careItems || [];
  const vetItems = breakdown.vetItems || [];
  const prizeItems = breakdown.prizeItems || [];

  return (
    <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="modal-container statement-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="badge-row">
              <span className="badge badge-gold">{t('stmtModalTitle')}</span>
              <span className="chip-badge">{t('colChip')}: {statement.chipId}</span>
            </div>
            <h2 className="modal-title">
              {statement.period} • {statement.horseName}
            </h2>
            <p className="modal-subtitle">
              {lang === 'en'
                ? `Owner equity entitlement: ${statement.ownershipShare}% syndicated share`
                : `Chủ sở hữu hưởng ${statement.ownershipShare}% tỉ lệ sở hữu chiến mã`}
            </p>
          </div>

          <div className="modal-actions-top">
            <button type="button" className="close-btn" onClick={onClose} aria-label={t('closeBtn')}>
              &times;
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Summary Banner */}
          <div className="statement-summary-banner">
            <div className="sum-block">
              <span className="sum-label">{t('summaryTotalPrize')}</span>
              <span className="sum-value gold-text">{formatVND(statement.totalRacePrize)}</span>
              <span className="sum-sub">{lang === 'en' ? `Share (${statement.ownershipShare}%):` : `Hưởng ${statement.ownershipShare}%:`} {formatVND(statement.shareRacePrize)}</span>
            </div>

            <div className="sum-operator">-</div>

            <div className="sum-block">
              <span className="sum-label">{t('summaryStableCost')}</span>
              <span className="sum-value alert-text">{formatVND(statement.totalMonthExpense)}</span>
              <span className="sum-sub">{lang === 'en' ? `Share (${statement.ownershipShare}%):` : `Chủ gánh ${statement.ownershipShare}%:`} {formatVND(statement.shareMonthExpense)}</span>
            </div>

            <div className="sum-operator">=</div>

            <div className="sum-block highlight-block">
              <span className="sum-label">{t('summaryNetPayout')}</span>
              <span className="sum-value green-text">{formatVND(statement.netPayout)}</span>
              <span className="sum-sub">{statement.status === 'paid' ? t('stmtPaid') : t('stmtPending')}</span>
            </div>
          </div>

          {/* Itemized Audit Tables */}
          <div className="itemized-sections">
            {/* 1. Race Prize Distribution */}
            <div className="itemized-card">
              <div className="item-card-header">
                <h3>{lang === 'en' ? '1. Race Purse Revenue (Syndicate Share)' : '1. Doanh Thu Tiền Thưởng Giải Đua (Phân chia % Sở Hữu)'}</h3>
                <span className="share-pill">{statement.ownershipShare}% {lang === 'en' ? 'Share' : 'Sở hữu'}</span>
              </div>
              <table className="item-table">
                <thead>
                  <tr>
                    <th>{lang === 'en' ? 'Race Event / Purse Description' : 'Nội dung giải đua / Giải thưởng'}</th>
                    <th className="text-right">{lang === 'en' ? 'Total Purse' : 'Tổng giải thưởng'}</th>
                    <th className="text-right">{lang === 'en' ? 'Share %' : 'Tỉ lệ hưởng'}</th>
                    <th className="text-right">{lang === 'en' ? 'Disbursed to Owner' : 'Thực nhận về chủ'}</th>
                  </tr>
                </thead>
                <tbody>
                  {prizeItems.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.desc}</strong></td>
                      <td className="text-right">{formatVND(item.total)}</td>
                      <td className="text-right"><span className="badge badge-gold">{item.sharePercent}%</span></td>
                      <td className="text-right gold-text"><strong>{formatVND(item.ownerAmount)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. Care & Nutrition Expenses */}
            <div className="itemized-card">
              <div className="item-card-header">
                <h3>{lang === 'en' ? '2. Boarding, Grooming & Daily Diet Expenses' : '2. Chi Phí Nuôi Dưỡng & Dinh Dưỡng Hằng Ngày'}</h3>
                <span className="sub-cost-text">{lang === 'en' ? 'Board Subtotal:' : 'Tổng khoản nuôi:'} {formatVND(statement.careExpense)}</span>
              </div>
              <table className="item-table">
                <thead>
                  <tr>
                    <th>{lang === 'en' ? 'Feed & Care Operations' : 'Hạng mục khẩu phần & Chăm sóc'}</th>
                    <th className="text-right">{lang === 'en' ? 'Amount' : 'Thành tiền (VNĐ)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {careItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.desc}</td>
                      <td className="text-right">{formatVND(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. Medical & Veterinary Expenses */}
            <div className="itemized-card">
              <div className="item-card-header">
                <h3>{lang === 'en' ? '3. Veterinary Diagnostics & Clinical Services' : '3. Viện Phí Thú Y & Chẩn Đoán Sức Khỏe'}</h3>
                <span className="sub-cost-text">{lang === 'en' ? 'Vet Subtotal:' : 'Tổng viện phí:'} {formatVND(statement.vetExpense)}</span>
              </div>
              <table className="item-table">
                <thead>
                  <tr>
                    <th>{lang === 'en' ? 'Veterinary Treatments & Medication' : 'Chi tiết dịch vụ thú y & Thuốc trị liệu'}</th>
                    <th className="text-right">{lang === 'en' ? 'Amount' : 'Thành tiền (VNĐ)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {vetItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.desc}</td>
                      <td className="text-right">{formatVND(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Trainer & Jockey Fee */}
            <div className="itemized-card">
              <div className="item-card-header">
                <h3>{lang === 'en' ? '4. Head Trainer & Jockey Commission' : '4. Phí Quản Lý HLV & Nài Ngựa'}</h3>
                <span className="sub-cost-text">{formatVND(statement.trainerFee)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Audit Authentication Details */}
          <div className="audit-proof-box">
            <div className="proof-title">{lang === 'en' ? 'AUDIT TRAIL & LEDGER VERIFICATION' : 'MINH BẠCH ĐỐI SOÁT & XÁC THỰC GIAO DỊCH'}</div>
            <div className="proof-grid">
              <div><strong>{t('colStatus')}:</strong> <span className="badge badge-gold">{statement.status === 'paid' ? t('stmtPaid') : t('stmtPending')}</span></div>
              <div><strong>{lang === 'en' ? 'Method:' : 'Phương thức:'}</strong> {statement.paymentMethod}</div>
              <div><strong>{lang === 'en' ? 'Date Issued:' : 'Ngày phát hành:'}</strong> {statement.date}</div>
              <div><strong>{t('stmtColCode')}:</strong> <code>{statement.id}</code></div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-info">
            {lang === 'en'
              ? 'Encrypted audit ledger verified against vet prescriptions and escrow disbursals.'
              : 'Hóa đơn & Bản đối soát tài chính được mã hóa bảo mật, đối chiếu tự động với nhật ký thú y và ngân hàng.'}
          </div>
          <div className="footer-btns">
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              {t('stmtPrintBtn')}
            </button>
            <button type="button" className="btn btn-solid" onClick={onClose}>
              {t('stmtCloseBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

