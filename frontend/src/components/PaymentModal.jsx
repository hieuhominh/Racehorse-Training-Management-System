import React, { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';

// Danh sách đầy đủ tất cả các ngân hàng đang hoạt động tại Việt Nam (chuẩn Napas/NHNN & logo chính thức)
const VN_BANKS = [
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại thương Việt Nam', bin: '970436', logoCode: 'VCB' },
  { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội', bin: '970422', logoCode: 'MB' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ thương Việt Nam', bin: '970407', logoCode: 'TCB' },
  { code: 'CTG', shortName: 'VietinBank', name: 'Ngân hàng Công thương Việt Nam', bin: '970415', logoCode: 'ICB' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển VN', bin: '970418', logoCode: 'BIDV' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu', bin: '970416', logoCode: 'ACB' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng', bin: '970432', logoCode: 'VPB' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong', bin: '970423', logoCode: 'TPB' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc tế Việt Nam', bin: '970441', logoCode: 'VIB' },
  { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín', bin: '970403', logoCode: 'STB' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM', bin: '970437', logoCode: 'HDB' },
  { code: 'SHB', shortName: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội', bin: '970443', logoCode: 'SHB' },
  { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng Hàng Hải Việt Nam', bin: '970426', logoCode: 'MSB' },
  { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông', bin: '970448', logoCode: 'OCB' },
  { code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng Lộc Phát Việt Nam', bin: '970449', logoCode: 'LPB' },
  { code: 'SEAB', shortName: 'SeABank', name: 'Ngân hàng Đông Nam Á', bin: '970440', logoCode: 'SEAB' },
  { code: 'AGR', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp & PTNT Việt Nam', bin: '970405', logoCode: 'VBA' },
  { code: 'EIB', shortName: 'Eximbank', name: 'Ngân hàng Xuất Nhập Khẩu', bin: '970431', logoCode: 'EIB' },
  { code: 'NAB', shortName: 'Nam A Bank', name: 'Ngân hàng Nam Á', bin: '970428', logoCode: 'NAB' },
  { code: 'VAB', shortName: 'VietABank', name: 'Ngân hàng Việt Á', bin: '970427', logoCode: 'VAB' },
  { code: 'BAB', shortName: 'Bac A Bank', name: 'Ngân hàng Bắc Á', bin: '970409', logoCode: 'BAB' },
  { code: 'BVB', shortName: 'BaoViet Bank', name: 'Ngân hàng Bảo Việt', bin: '970438', logoCode: 'BVB' },
  { code: 'KLB', shortName: 'KienlongBank', name: 'Ngân hàng Kiên Long', bin: '970452', logoCode: 'KLB' },
  { code: 'SGB', shortName: 'Saigonbank', name: 'Ngân hàng Sài Gòn Công Thương', bin: '970400', logoCode: 'SGICB' },
  { code: 'PVC', shortName: 'PVcomBank', name: 'Ngân hàng Đại Chúng Việt Nam', bin: '970412', logoCode: 'PVCB' },
  { code: 'PGB', shortName: 'PGBank', name: 'Ngân hàng Thịnh vượng và Phát triển', bin: '970430', logoCode: 'PGB' },
  { code: 'ABB', shortName: 'ABBANK', name: 'Ngân hàng An Bình', bin: '970425', logoCode: 'ABB' },
  { code: 'NCB', shortName: 'NCB', name: 'Ngân hàng Quốc Dân', bin: '970419', logoCode: 'NCB' },
  { code: 'SCB', shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn', bin: '970429', logoCode: 'SCB' },
  { code: 'SHINHAN', shortName: 'Shinhan Bank', name: 'Ngân hàng Shinhan Việt Nam', bin: '970424', logoCode: 'SHBVN' },
  { code: 'HSBC', shortName: 'HSBC', name: 'Ngân hàng TNHH MTV HSBC Việt Nam', bin: '445094', logoCode: 'HSBC' },
  { code: 'WOORI', shortName: 'Woori Bank', name: 'Ngân hàng Woori Việt Nam', bin: '970457', logoCode: 'WVN' },
  { code: 'SC', shortName: 'Standard Chartered', name: 'Ngân hàng Standard Chartered VN', bin: '970410', logoCode: 'SCVN' },
  { code: 'PBVN', shortName: 'Public Bank', name: 'Ngân hàng Public Bank Việt Nam', bin: '970439', logoCode: 'PBVN' }
];

export default function PaymentModal({
  isOpen,
  onClose,
  packageData = { id: 'PREMIUM', name: 'Horse Premium VIP', cycle: 'year', amount: 35000000 },
  ownerInfo = { name: 'Chủ sở hữu', ownerKey: 'owner' },
  onPaymentSuccess
}) {
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('VIETQR'); // 'VIETQR' | 'CARD' | 'PAYPAL'
  const [selectedBank, setSelectedBank] = useState(VN_BANKS[0]); // Mặc định Vietcombank
  const [bankSearch, setBankSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionReceipt, setTransactionReceipt] = useState(null);

  // Dữ liệu thẻ Visa / Mastercard
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });

  // Dữ liệu PayPal
  const [paypalEmail, setPaypalEmail] = useState('');

  // Lọc ngân hàng theo ô tìm kiếm
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return VN_BANKS;
    const q = bankSearch.toLowerCase().trim();
    return VN_BANKS.filter(
      b => b.code.toLowerCase().includes(q) ||
           b.shortName.toLowerCase().includes(q) ||
           b.name.toLowerCase().includes(q)
    );
  }, [bankSearch]);

  if (!isOpen) return null;

  const currentAmount = packageData.amount || (packageData.cycle === 'year' ? 35000000 : 3500000);
  const formattedVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentAmount);
  const usdAmount = (currentAmount / 25400).toFixed(2);
  const transferMemo = `VIP ${String(ownerInfo.ownerKey).toUpperCase()} ${packageData.cycle === 'year' ? '1NAM' : '1THANG'}`;
  const bankAccountNo = '19038886669999';
  const bankAccountName = 'CTY CP TRUONG DUA QUOC TE PHU THO';

  // Sao chép nội dung vào Clipboard
  const handleCopy = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}: ${text}`, 'ĐÃ SAO CHÉP', 'info');
    }
  };

  // Định dạng số thẻ 4 số cách nhau 1 khoảng trắng
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardData(prev => ({ ...prev, number: parts ? parts.join(' ') : '' }));
  };

  // Định dạng ngày hết hạn MM/YY
  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardData(prev => ({ ...prev, expiry: `${raw.slice(0, 2)}/${raw.slice(2, 4)}` }));
    } else {
      setCardData(prev => ({ ...prev, expiry: raw }));
    }
  };

  // Xử lý xác nhận thanh toán
  const handleConfirmPayment = () => {
    // Validate theo từng phương thức
    if (paymentMethod === 'CARD') {
      const cleanNum = cardData.number.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        showToast('Vui lòng nhập số thẻ Visa/Mastercard hợp lệ (16 chữ số)', 'THÔNG TIN CHƯA ĐỦ', 'warning');
        return;
      }
      if (!cardData.holder.trim()) {
        showToast('Vui lòng nhập tên in trên thẻ không dấu', 'THÔNG TIN CHƯA ĐỦ', 'warning');
        return;
      }
      if (cardData.expiry.length < 5) {
        showToast('Vui lòng nhập ngày hết hạn thẻ (MM/YY)', 'THÔNG TIN CHƯA ĐỦ', 'warning');
        return;
      }
      if (cardData.cvv.length < 3) {
        showToast('Vui lòng nhập mã bảo mật CVV (3 số)', 'THÔNG TIN CHƯA ĐỦ', 'warning');
        return;
      }
    } else if (paymentMethod === 'PAYPAL') {
      if (!paypalEmail || !paypalEmail.includes('@')) {
        showToast('Vui lòng nhập tài khoản email PayPal hợp lệ', 'THÔNG TIN CHƯA ĐỦ', 'warning');
        return;
      }
    }

    setIsProcessing(true);

    // Giả lập xử lý thanh toán ngân hàng / cổng thanh toán bảo mật (1.2s)
    setTimeout(() => {
      setIsProcessing(false);
      const receipt = {
        transactionId: `TXN-VIP-${Date.now().toString().slice(-6)}`,
        packageName: 'HORSE PREMIUM VIP',
        billingCycle: packageData.cycle === 'year' ? '1 Năm (365 Ngày)' : '1 Tháng (30 Ngày)',
        amount: currentAmount,
        amountFormatted: formattedVND,
        method: paymentMethod === 'VIETQR' 
          ? `Ngân hàng ${selectedBank.shortName} (VietQR)` 
          : paymentMethod === 'CARD' 
          ? `Thẻ quốc tế (Visa/Mastercard ending ${cardData.number.slice(-4) || '****'})` 
          : `PayPal (${paypalEmail})`,
        paidAt: new Date().toLocaleString('vi-VN'),
        ownerName: ownerInfo.name,
        status: 'THÀNH CÔNG (PAID)'
      };

      setTransactionReceipt(receipt);
      setIsSuccess(true);

      if (onPaymentSuccess) {
        onPaymentSuccess(receipt);
      }

      showToast('Thanh toán thành công! Gói HORSE PREMIUM VIP đã được kích hoạt.', 'GIAO DỊCH HOÀN TẤT', 'info');
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          maxWidth: '720px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          border: '1.5px solid var(--brass)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          borderRadius: '12px'
        }}
      >
        {/* MÀN HÌNH BIÊN LAI THÀNH CÔNG */}
        {isSuccess && transactionReceipt ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              color: '#10B981',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              ✓
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: 'var(--brass)' }}>
              THANH TOÁN GIAO DỊCH THÀNH CÔNG!
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--paper-dim)' }}>
              Đặc quyền <b>HORSE PREMIUM VIP</b> đã được kích hoạt trực tiếp vào tài khoản của bạn.
            </p>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '16px 18px',
              textAlign: 'left',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Mã giao dịch điện tử:</span>
                <b style={{ color: 'var(--paper)', fontFamily: 'monospace' }}>{transactionReceipt.transactionId}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Gói dịch vụ:</span>
                <b style={{ color: 'var(--brass)' }}>{transactionReceipt.packageName}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Thời hạn hiệu lực:</span>
                <span style={{ color: 'var(--paper)' }}>{transactionReceipt.billingCycle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Phương thức thanh toán:</span>
                <span style={{ color: 'var(--paper)' }}>{transactionReceipt.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--paper-dim)' }}>Thời gian thanh toán:</span>
                <span style={{ color: 'var(--paper)' }}>{transactionReceipt.paidAt}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '10px', fontSize: '15px' }}>
                <b>Tổng tiền thực thu:</b>
                <b style={{ color: '#10B981', fontSize: '16px' }}>{transactionReceipt.amountFormatted}</b>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--brass)',
                color: '#0A0D14',
                fontWeight: 800,
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                letterSpacing: '0.02em'
              }}
            >
              Vào Cổng Quản Lý Chủ Ngựa VIP Ngay →
            </button>
          </div>
        ) : (
          /* MÀN HÌNH CHỌN PHƯƠNG THỨC THANH TOÁN */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)', fontSize: '20px' }}>💳</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--brass)' }}>
                  Giao Dịch Thanh Toán Gói Hội Viên VIP
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Khối tóm tắt hóa đơn giao dịch */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  GÓI ĐĂNG KÝ
                </div>
                <b style={{ fontSize: '16px', color: 'var(--brass)' }}>
                  {packageData.name} ({packageData.cycle === 'year' ? 'Gói 1 Năm' : 'Gói 1 Tháng'})
                </b>
                <div style={{ fontSize: '12px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                  Chủ sở hữu: <b>{ownerInfo.name}</b> · Không giới hạn chiến mã
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--paper-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  SỐ TIỀN CẦN THANH TOÁN
                </div>
                <b style={{ fontSize: '20px', color: 'var(--paper)', fontFamily: 'var(--display)' }}>
                  {formattedVND}
                </b>
                <div style={{ fontSize: '11.5px', color: 'var(--brass)', fontWeight: 600 }}>
                  ~ ${usdAmount} USD
                </div>
              </div>
            </div>

            {/* Tabs chọn Phương thức thanh toán */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Chọn phương thức thanh toán bảo mật:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    background: paymentMethod === 'VIETQR' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${paymentMethod === 'VIETQR' ? 'var(--brass)' : 'var(--line)'}`,
                    color: paymentMethod === 'VIETQR' ? 'var(--brass)' : 'var(--paper)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🏦</span>
                  <span>Ngân hàng VN (VietQR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    background: paymentMethod === 'CARD' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${paymentMethod === 'CARD' ? 'var(--brass)' : 'var(--line)'}`,
                    color: paymentMethod === 'CARD' ? 'var(--brass)' : 'var(--paper)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>💳</span>
                  <span>Visa / Mastercard / JCB</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYPAL')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    background: paymentMethod === 'PAYPAL' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${paymentMethod === 'PAYPAL' ? 'var(--brass)' : 'var(--line)'}`,
                    color: paymentMethod === 'PAYPAL' ? 'var(--brass)' : 'var(--paper)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🅿️</span>
                  <span>PayPal Express (USD)</span>
                </button>
              </div>
            </div>

            {/* NỘI DUNG 1: CHUYỂN KHOẢN TẤT CẢ NGÂN HÀNG VIỆT NAM (VIETQR / 247) */}
            {paymentMethod === 'VIETQR' && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <b style={{ fontSize: '13px', color: 'var(--paper)' }}>
                    Chọn ngân hàng chuyển khoản ({VN_BANKS.length} ngân hàng Việt Nam):
                  </b>
                  <span style={{ fontSize: '11px', color: 'var(--brass)', fontWeight: 600 }}>
                    ⚡ Napas 24/7 tức thì
                  </span>
                </div>

                {/* Ô tìm kiếm nhanh ngân hàng */}
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="🔍 Tìm nhanh ngân hàng: Vietcombank, MB, Techcombank, BIDV, VPBank..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                {/* Danh sách cuộn chọn ngân hàng */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))',
                  gap: '7px',
                  maxHeight: '145px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                  marginBottom: '14px',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '8px',
                  background: 'var(--bg-card)'
                }}>
                  {filteredBanks.map(b => {
                    const isSelected = selectedBank.code === b.code;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-secondary)',
                          border: `1.5px solid ${isSelected ? 'var(--brass)' : 'var(--line)'}`,
                          color: isSelected ? 'var(--brass)' : 'var(--paper)',
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          overflow: 'hidden'
                        }}
                        title={`${b.shortName} - ${b.name}`}
                      >
                        <div style={{
                          width: '30px',
                          height: '20px',
                          borderRadius: '3px',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1px 2px',
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={`https://cdn.vietqr.io/img/${b.logoCode}.png`}
                            alt={b.shortName}
                            loading="lazy"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentNode) {
                                e.currentTarget.parentNode.innerText = b.shortName.slice(0, 3).toUpperCase();
                                e.currentTarget.parentNode.style.fontSize = '8px';
                                e.currentTarget.parentNode.style.fontWeight = 'bold';
                                e.currentTarget.parentNode.style.color = '#334155';
                              }
                            }}
                          />
                        </div>
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {b.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Chi tiết mã QR và thông tin chuyển khoản */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  flexWrap: 'wrap'
                }}>
                  {/* Mã QR giả lập chuẩn VietQR */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '130px',
                      height: '130px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '1px solid #E2E8F0'
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=114x114&data=247|${selectedBank.bin}|${bankAccountNo}|${currentAmount}|${encodeURIComponent(transferMemo)}`}
                        alt="VietQR Chuyển khoản"
                        style={{ width: '114px', height: '114px', display: 'block' }}
                        onError={(e) => {
                          // Fallback nếu không có internet: hiển thị QR CSS mockup
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brass)', fontWeight: 700, marginTop: '4px' }}>
                      Quét mã VietQR 24/7
                    </div>
                  </div>

                  {/* Chi tiết người nhận */}
                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Ngân hàng thụ hưởng:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '36px',
                          height: '22px',
                          borderRadius: '4px',
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1px 3px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          flexShrink: 0
                        }}>
                          <img
                            src={`https://cdn.vietqr.io/img/${selectedBank.logoCode}.png`}
                            alt={selectedBank.shortName}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <b style={{ color: 'var(--paper)', fontSize: '12.5px' }}>
                          {selectedBank.shortName} ({selectedBank.code})
                        </b>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Số tài khoản:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ color: 'var(--brass)', fontFamily: 'monospace', fontSize: '14px' }}>{bankAccountNo}</b>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankAccountNo, 'Số tài khoản')}
                          style={{ padding: '2px 6px', fontSize: '10.5px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Chủ tài khoản:</span>
                      <b style={{ color: 'var(--paper)', fontSize: '11.5px' }}>{bankAccountName}</b>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Số tiền:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ color: '#10B981', fontSize: '14px' }}>{formattedVND}</b>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(currentAmount), 'Số tiền')}
                          style={{ padding: '2px 6px', fontSize: '10.5px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--paper-dim)' }}>Nội dung CK:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ color: 'var(--brass)', fontFamily: 'monospace' }}>{transferMemo}</b>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferMemo, 'Nội dung chuyển khoản')}
                          style={{ padding: '2px 6px', fontSize: '10.5px', background: 'var(--bg-secondary)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NỘI DUNG 2: THẺ QUỐC TẾ (VISA / MASTERCARD / JCB) */}
            {paymentMethod === 'CARD' && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <b style={{ fontSize: '13px', color: 'var(--paper)' }}>
                    Nhập thông tin thẻ thanh toán quốc tế:
                  </b>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ background: '#1A1F71', color: '#FFFFFF', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, fontStyle: 'italic', letterSpacing: '0.04em' }}>VISA</span>
                    <span style={{ background: '#F79E1B', color: '#FFFFFF', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>Mastercard</span>
                    <span style={{ background: '#0F7337', color: '#FFFFFF', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>JCB</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      SỐ THẺ (16 CHỮ SỐ)
                    </label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={handleCardNumberChange}
                      placeholder="4123 4567 8901 2345"
                      maxLength={19}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      TÊN CHỦ THẺ (IN TRÊN THẺ, KHÔNG DẤU)
                    </label>
                    <input
                      type="text"
                      value={cardData.holder}
                      onChange={(e) => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                      placeholder="NGUYEN VAN A"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        color: 'var(--paper)',
                        fontSize: '13px',
                        letterSpacing: '0.04em'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                        NGÀY HẾT HẠN (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={handleExpiryChange}
                        placeholder="12/28"
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          color: 'var(--paper)',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                        MÃ BẢO MẬT (CVV/CVC)
                      </label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="•••"
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          color: 'var(--paper)',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔒</span> Giao dịch bảo mật chuẩn mã hóa PCI-DSS & 3D-Secure OTP từ tổ chức phát hành thẻ.
                  </div>
                </div>
              </div>
            )}

            {/* NỘI DUNG 3: PAYPAL EXPRESS CHECKOUT */}
            {paymentMethod === 'PAYPAL' && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', color: '#003087', marginBottom: '6px', fontWeight: 900 }}>
                  <i>Pay</i><i style={{ color: '#0079C1' }}>Pal</i>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--paper)', fontWeight: 600, marginBottom: '4px' }}>
                  Thanh toán toàn cầu qua tài khoản PayPal hoặc thẻ liên kết
                </div>
                <p style={{ fontSize: '12px', color: 'var(--paper-dim)', margin: '0 0 14px' }}>
                  Số tiền quy đổi tỷ giá thương mại: <b>${usdAmount} USD</b>
                </p>

                <div style={{ maxWidth: '380px', margin: '0 auto 12px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    TÀI KHOẢN EMAIL PAYPAL
                  </label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your-paypal-email@domain.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>🛡️</span> Được bảo vệ bởi chính sách PayPal Buyer Protection 180 ngày.
                </div>
              </div>
            )}

            {/* Nút hành động thanh toán */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--paper-dim)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)'
                }}
              >
                {isProcessing ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    <span>Đang xử lý giao dịch an toàn...</span>
                  </>
                ) : (
                  <>
                    <span>🔒 Xác Nhận Thanh Toán ({formattedVND})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

