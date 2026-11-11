import React, { useState, useMemo } from 'react';

const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

// 1. DỮ LIỆU CHI PHÍ VẬN HÀNH CHUỒNG TRẠI (STABLE OPERATING EXPENSES)
const STABLE_EXPENSES_DATA = [
  {
    id: 'STB-02',
    name: 'Thức ăn Alfalfa & Cám vi khoáng nhập khẩu',
    category: 'Dinh dưỡng chiến mã',
    quantity: '3.2 tấn cỏ khô + 1.8 tấn cám',
    unitPrice: 65200000,
    total: 65200000,
    color: '#10B981', // Xanh lá
    note: 'Khẩu phần giàu protein & khoáng chất cho đàn ngựa đua'
  },
  {
    id: 'STB-01',
    name: 'Điện 3 pha & Làm mát phun sương chuồng',
    category: 'Năng lượng & Tiện ích',
    quantity: '1 hệ thống (30 ô chuồng)',
    unitPrice: 28500000,
    total: 28500000,
    color: '#3B82F6', // Xanh dương
    note: 'Vận hành 24/7 duy trì nhiệt độ chuồng 22-25°C'
  },
  {
    id: 'STB-03',
    name: 'Đệm lót mùn cưa ép & Vôi bột sát trùng',
    category: 'Vệ sinh & An toàn sinh học',
    quantity: '450 bao đệm lót tiêu chuẩn',
    unitPrice: 18500000,
    total: 18500000,
    color: '#F59E0B', // Cam
    note: 'Thay đệm định kỳ 2 lần/tuần, khử khuẩn chống nấm móng'
  },
  {
    id: 'STB-05',
    name: 'Bảo trì cơ sở hạ tầng, ray cửa & hàng rào',
    category: 'Bảo trì & Cơ sở vật chất',
    quantity: 'Trọn gói tháng',
    unitPrice: 14200000,
    total: 14200000,
    color: '#8B5CF6', // Tím
    note: 'Bảo dưỡng định kỳ ray trượt, bản lề và camera giám sát'
  },
  {
    id: 'STB-04',
    name: 'Nước lọc RO tự động cấp máng 24/7',
    category: 'Tiện ích nguồn nước',
    quantity: '280 m³ nước tinh khiết',
    unitPrice: 9800000,
    total: 9800000,
    color: '#06B6D4', // Xanh ngọc
    note: 'Hệ thống phao ngắt cảm ứng chống tràn tự động'
  }
];

// 2. DỮ LIỆU TIỀN THUỐC & DỊCH VỤ Y TẾ CHUYÊN SÂU (VET MEDICAL & MEDICINE EXPENSES)
const MEDICINE_EXPENSES_DATA = [
  {
    id: 'MED-01',
    name: 'Thuốc kháng viêm gân, giảm đau & bao khớp',
    category: 'Thuốc điều trị & Phục hồi cơ',
    quantity: '60 lọ tiêm + 40 tuýp gel thoa',
    unitPrice: 32400000,
    total: 32400000,
    color: '#EC4899', // Hồng y tế
    note: 'Dành cho ngựa sau các bài chạy biến tốc 60 km/h'
  },
  {
    id: 'MED-02',
    name: 'Vitamin tổng hợp, sắt & Điện giải viễn trắc',
    category: 'Thực phẩm bổ sung y tế',
    quantity: '120 hộp dung dịch pha nước',
    unitPrice: 24800000,
    total: 24800000,
    color: '#F59E0B', // Cam
    note: 'Bù nước khẩn cấp sau bài tập nặng và chống mất cơ'
  },
  {
    id: 'MED-05',
    name: 'Bộ kit xét nghiệm sinh hóa máu & doping',
    category: 'Chẩn đoán hình ảnh & Xét nghiệm',
    quantity: '40 lượt xét nghiệm máu chuyên sâu',
    unitPrice: 18600000,
    total: 18600000,
    color: '#8B5CF6', // Tím
    note: 'Đánh giá chỉ số men cơ CK/AST và kiểm tra an toàn doping'
  },
  {
    id: 'MED-03',
    name: 'Vaccine phòng cúm ngựa & uốn ván định kỳ',
    category: 'Tiêm chủng & Phòng dịch',
    quantity: 'Liều định kỳ cho đàn',
    unitPrice: 16500000,
    total: 16500000,
    color: '#10B981', // Xanh lá
    note: 'Đạt chuẩn kiểm dịch thú y thi đấu quốc gia'
  },
  {
    id: 'MED-04',
    name: 'Băng gạc nén cổ chân & Dung dịch sát trùng',
    category: 'Vật tư sơ cứu & Chăm sóc móng',
    quantity: '80 cuộn băng nén + 20 can sát trùng',
    unitPrice: 11200000,
    total: 11200000,
    color: '#3B82F6', // Xanh dương
    note: 'Băng bó cố định gân gót và bảo vệ móng sau tập'
  }
];

// 3. DỮ LIỆU TỔNG QUAN DOANH THU GIẢI ĐẤU (TOURNAMENT REVENUE OVERVIEW)
const TOURNAMENT_REVENUE_DATA = [
  {
    id: 'TOURN-01',
    name: 'Cúp Derby Mùa Thu 2026 (Group 1)',
    track: 'Trường đua Quốc tế Phú Thọ (2.400m Turf)',
    date: '15/11/2026',
    status: 'COMPLETED',
    statusLabel: 'Đã quyết toán',
    ticketSales: 480000000,
    entryFees: 160000000,
    sponsorship: 1250000000,
    totalRevenue: 1890000000,
    prizePursePayout: 1500000000,
    netFacilityRevenue: 390000000
  },
  {
    id: 'TOURN-02',
    name: 'Cúp Tốc Độ Sprint Cup 2026 (Group 2)',
    track: 'Trường đua Cát Thể Thao (1.200m Dirt)',
    date: '28/11/2026',
    status: 'COMPLETED',
    statusLabel: 'Đã quyết toán',
    ticketSales: 290000000,
    entryFees: 60000000,
    sponsorship: 660000000,
    totalRevenue: 1010000000,
    prizePursePayout: 800000000,
    netFacilityRevenue: 210000000
  },
  {
    id: 'TOURN-03',
    name: 'Cúp Tranh Tài Mùa Thu Phú Thọ (Group 3)',
    track: 'Trường đua Quốc tế Phú Thọ (1.600m Turf)',
    date: '08/12/2026',
    status: 'SETTLING',
    statusLabel: 'Đang đối soát',
    ticketSales: 180000000,
    entryFees: 30000000,
    sponsorship: 450000000,
    totalRevenue: 660000000,
    prizePursePayout: 500000000,
    netFacilityRevenue: 160000000
  },
  {
    id: 'TOURN-04',
    name: 'Cúp Mùa Đông Toàn Quốc Listed Cup',
    track: 'Trường đua Cao nguyên (1.800m Dirt)',
    date: '24/12/2026',
    status: 'SETTLING',
    statusLabel: 'Đang đối soát',
    ticketSales: 140000000,
    entryFees: 20000000,
    sponsorship: 380000000,
    totalRevenue: 540000000,
    prizePursePayout: 400000000,
    netFacilityRevenue: 140000000
  }
];

// Cấu hình lương thưởng định mức theo 3 vai trò chuyên môn
const ROLE_PAYROLL_CONFIG = {
  TRAINER: {
    roleNameVi: 'Huấn Luyện Viên',
    roleNameEn: 'Racehorse Trainer',
    baseSalary: 28000000,
    allowance: 5000000,
    bonus: 7000000,
    color: '#3B82F6', // Xanh dương
    allowanceLabel: 'Phụ cấp Telemetry & Giáo án',
    bonusLabel: 'Thưởng bứt tốc & Thành tích'
  },
  VET: {
    roleNameVi: 'Bác Sĩ Thú Y',
    roleNameEn: 'Veterinarian',
    baseSalary: 30000000,
    allowance: 6000000,
    bonus: 4000000,
    color: '#EC4899', // Hồng y tế
    allowanceLabel: 'Trực cấp cứu & An toàn dịch',
    bonusLabel: 'Thưởng giám định y tế giải'
  },
  GROOM: {
    roleNameVi: 'Chăm Sóc Chuồng',
    roleNameEn: 'Stable Groom',
    baseSalary: 14000000,
    allowance: 3000000,
    bonus: 2000000,
    color: '#F59E0B', // Cam
    allowanceLabel: 'Phụ cấp Đệm lót & Tắm chải',
    bonusLabel: 'Thưởng chuyên cần chuồng trại'
  }
};

/**
 * COMPONENT BIỂU ĐỒ HÌNH TRÒN DONUT CHART (SVG THUẦN - SIÊU NHẸ & MƯỢT MÀ)
 */
function SvgDonutChart({
  data = [],
  totalValue,
  centerTitle = 'Tổng cộng',
  centerValue,
  size = 170,
  strokeWidth = 22,
  hoveredIndex,
  onHover
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = totalValue || data.reduce((acc, d) => acc + (d.value || 0), 0) || 1;

  let accumulatedPercent = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Dynamic Segments */}
        {data.map((item, index) => {
          const percent = (item.value || 0) / total;
          const strokeDasharray = `${percent * circumference} ${circumference * (1 - percent)}`;
          const strokeDashoffset = -accumulatedPercent * circumference;
          accumulatedPercent += percent;
          const isHovered = hoveredIndex === index;

          return (
            <circle
              key={item.id || index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                opacity: hoveredIndex === null || isHovered ? 1 : 0.45,
                cursor: 'pointer'
              }}
              onMouseEnter={() => onHover && onHover(index)}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <title>{`${item.label}: ${formatVND(item.value)} (${(percent * 100).toFixed(1)}%)`}</title>
            </circle>
          );
        })}
      </svg>

      {/* Tâm biểu đồ hình tròn */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        textAlign: 'center',
        padding: '0 8px'
      }}>
        <div style={{ fontSize: '10px', color: 'var(--paper-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
          {hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex].label.slice(0, 14) : centerTitle}
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 800, color: hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex].color : 'var(--paper)', margin: '2px 0 0' }}>
          {hoveredIndex !== null && data[hoveredIndex] ? formatVND(data[hoveredIndex].value) : centerValue}
        </div>
        <div style={{ fontSize: '9.5px', color: 'var(--paper-dim)', marginTop: '1px' }}>
          {hoveredIndex !== null && data[hoveredIndex] 
            ? `${((data[hoveredIndex].value / total) * 100).toFixed(1)}%` 
            : `${data.length} danh mục`}
        </div>
      </div>
    </div>
  );
}

export default function FacilityFinancialReport({ staffList = [], horses = [], stables = [], lang = 'vi', showToast }) {
  // Chế độ xem: 'CHARTS' (4 Biểu đồ hình tròn xếp gọn) hoặc 'TABLES' (Bảng chi tiết)
  const [viewMode, setViewMode] = useState('CHARTS');
  const [period, setPeriod] = useState('11/2026');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Quản lý trạng thái hover riêng biệt cho 4 biểu đồ
  const [hoveredTourn, setHoveredTourn] = useState(null);
  const [hoveredPayroll, setHoveredPayroll] = useState(null);
  const [hoveredStable, setHoveredStable] = useState(null);
  const [hoveredMed, setHoveredMed] = useState(null);

  const [paidMap, setPaidMap] = useState(() => {
    try {
      const saved = localStorage.getItem('matruong_staff_payroll_paid');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const togglePaidStatus = (staffId, staffName) => {
    setPaidMap(prev => {
      const isPaid = !prev[staffId];
      const next = { ...prev, [staffId]: isPaid };
      try {
        localStorage.setItem('matruong_staff_payroll_paid', JSON.stringify(next));
      } catch {}
      if (showToast) {
        showToast(
          isPaid 
            ? `Đã duyệt chi & hoàn tất thanh toán lương cho "${staffName}"` 
            : `Đã chuyển lương của "${staffName}" về trạng thái "Chờ duyệt chi"`,
          isPaid ? 'ĐÃ CHI TRẢ LƯƠNG' : 'CHỜ DUYỆT CHI',
          isPaid ? 'success' : 'info'
        );
      }
      return next;
    });
  };

  // 1. Tổng chi phí chuồng trại
  const totalStableExpenses = useMemo(() => {
    return STABLE_EXPENSES_DATA.reduce((sum, item) => sum + item.total, 0);
  }, []);

  // 2. Tổng chi phí thuốc y tế
  const totalMedicineExpenses = useMemo(() => {
    return MEDICINE_EXPENSES_DATA.reduce((sum, item) => sum + item.total, 0);
  }, []);

  // 3. Tính toán bảng lương 3 vai trò từ danh sách staffList
  const staffPayrollList = useMemo(() => {
    const targetStaff = staffList.filter(s => ['TRAINER', 'VET', 'GROOM'].includes(s.role));
    const fallbackList = [
      { id: 'ST-TR-01', name: 'Lê Trọng Nghĩa (HLV Trưởng)', username: 'trainer_truong', role: 'TRAINER' },
      { id: 'ST-VT-01', name: 'BS. Nguyễn Văn An', username: 'vet_an', role: 'VET' },
      { id: 'ST-GR-01', name: 'Trần Văn Nam (Chăm sóc A)', username: 'groom_nam', role: 'GROOM' },
      { id: 'ST-GR-02', name: 'Nguyễn Thị Hoa (Chăm sóc B)', username: 'groom_hoa', role: 'GROOM' }
    ];

    const source = targetStaff.length > 0 ? targetStaff : fallbackList;

    return source.map((staff, index) => {
      const cfg = ROLE_PAYROLL_CONFIG[staff.role] || ROLE_PAYROLL_CONFIG.GROOM;
      const staffId = staff.id || `staff-${staff.role}-${index}`;
      const baseSalary = cfg.baseSalary;
      const allowance = cfg.allowance;
      const bonus = cfg.bonus;
      const totalNet = baseSalary + allowance + bonus;
      const isPaid = paidMap[staffId] ?? (index % 2 === 0);

      return {
        id: staffId,
        name: staff.fullName || staff.name || staff.username || `Nhân sự ${index + 1}`,
        username: staff.username || staff.email || 'N/A',
        role: staff.role,
        roleName: lang === 'en' ? cfg.roleNameEn : cfg.roleNameVi,
        baseSalary,
        allowance,
        bonus,
        color: cfg.color,
        allowanceLabel: cfg.allowanceLabel,
        bonusLabel: cfg.bonusLabel,
        totalNet,
        isPaid
      };
    });
  }, [staffList, paidMap, lang]);

  // Tổng quỹ lương 3 vai trò
  const totalPayrollExpenses = useMemo(() => {
    return staffPayrollList.reduce((sum, item) => sum + item.totalNet, 0);
  }, [staffPayrollList]);

  // Tách tổng quỹ lương theo từng vai trò
  const payrollByRole = useMemo(() => {
    return {
      TRAINER: staffPayrollList.filter(s => s.role === 'TRAINER').reduce((sum, s) => sum + s.totalNet, 0),
      VET: staffPayrollList.filter(s => s.role === 'VET').reduce((sum, s) => sum + s.totalNet, 0),
      GROOM: staffPayrollList.filter(s => s.role === 'GROOM').reduce((sum, s) => sum + s.totalNet, 0)
    };
  }, [staffPayrollList]);

  // 4. Tổng doanh thu giải đấu
  const tournamentSummary = useMemo(() => {
    const totalRev = TOURNAMENT_REVENUE_DATA.reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalPrize = TOURNAMENT_REVENUE_DATA.reduce((sum, t) => sum + t.prizePursePayout, 0);
    const totalNet = TOURNAMENT_REVENUE_DATA.reduce((sum, t) => sum + t.netFacilityRevenue, 0);
    const totalTicket = TOURNAMENT_REVENUE_DATA.reduce((sum, t) => sum + t.ticketSales, 0);
    const totalEntry = TOURNAMENT_REVENUE_DATA.reduce((sum, t) => sum + t.entryFees, 0);
    const totalSponsor = TOURNAMENT_REVENUE_DATA.reduce((sum, t) => sum + t.sponsorship, 0);
    return {
      totalRev,
      totalPrize,
      totalNet,
      totalTicket,
      totalEntry,
      totalSponsor
    };
  }, []);

  const grandTotalOperatingExpenses = totalStableExpenses + totalMedicineExpenses + totalPayrollExpenses;
  const operatingNetSurplus = tournamentSummary.totalNet - grandTotalOperatingExpenses;

  // DỮ LIỆU ĐƯA VÀO 4 BIỂU ĐỒ HÌNH TRÒN:
  
  // Biểu đồ 1: Doanh thu giải đấu theo nguồn thu
  const tournamentPieData = useMemo(() => [
    { id: 'rev-sponsor', label: 'Tài Trợ & Bản Quyền', value: tournamentSummary.totalSponsor, color: '#10B981' },
    { id: 'rev-ticket', label: 'Vé Khán Đài & VIP', value: tournamentSummary.totalTicket, color: '#3B82F6' },
    { id: 'rev-entry', label: 'Phí Đăng Ký Thi Đấu', value: tournamentSummary.totalEntry, color: '#F59E0B' }
  ], [tournamentSummary]);

  // Biểu đồ 2: Bảng lương 3 vai trò
  const payrollPieData = useMemo(() => [
    { id: 'role-trainer', label: 'Huấn Luyện Viên (HLV)', value: payrollByRole.TRAINER, color: '#3B82F6' },
    { id: 'role-vet', label: 'Bác Sĩ Thú Y (Vet)', value: payrollByRole.VET, color: '#EC4899' },
    { id: 'role-groom', label: 'Chăm Sóc Chuồng (Groom)', value: payrollByRole.GROOM, color: '#F59E0B' }
  ], [payrollByRole]);

  // Biểu đồ 3: Chi phí chuồng trại & thức ăn
  const stablePieData = useMemo(() => {
    return STABLE_EXPENSES_DATA.map(item => ({
      id: item.id,
      label: item.name,
      value: item.total,
      color: item.color
    }));
  }, []);

  // Biểu đồ 4: Tiền thuốc & y tế
  const medicinePieData = useMemo(() => {
    return MEDICINE_EXPENSES_DATA.map(item => ({
      id: item.id,
      label: item.name,
      value: item.total,
      color: item.color
    }));
  }, []);

  const handleExportCSV = () => {
    const rows = [
      ['BÁO CÁO TỔNG QUAN TÀI CHÍNH & CHI PHÍ VẬN HÀNH CƠ SỞ MÃ TRƯỜNG'],
      ['Kỳ đối soát:', period],
      ['Ngày xuất:', new Date().toLocaleString('vi-VN')],
      [],
      ['1. TỔNG QUAN DOANH THU GIẢI ĐẤU'],
      ['Tổng Doanh Thu Giải', tournamentSummary.totalRev],
      ['Tổng Chi Trả Quỹ Thưởng', tournamentSummary.totalPrize],
      ['Doanh Thu Ròng Cơ Sở Thu Về', tournamentSummary.totalNet],
      [],
      ['2. CHI PHÍ VẬN HÀNH CƠ SỞ'],
      ['Chi Phí Vận Hành Chuồng Trại', totalStableExpenses],
      ['Chi Phí Thuốc & Dịch Vụ Y Tế', totalMedicineExpenses],
      ['Tổng Quỹ Lương 3 Vai Trò (HLV, Bác Sĩ, Groom)', totalPayrollExpenses],
      ['TỔNG CHI PHÍ VẬN HÀNH', grandTotalOperatingExpenses],
      [],
      ['3. KẾT QUẢ KINH DOANH VẬN HÀNH'],
      ['Lợi Nhuận Ròng Thặng Dư Cơ Sở', operatingNetSurplus]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BaoCao_TaiChinh_MaTruong_${period.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast('Đã xuất file báo cáo tài chính đối soát định dạng CSV thành công!', 'XUẤT BÁO CÁO', 'success');
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      
      {/* HEADER SECTION: TIÊU ĐỀ & ĐIỀU HƯỚNG CHẾ ĐỘ XEM */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(201, 162, 39, 0.25) 0%, rgba(201, 162, 39, 0.05) 100%)',
            border: '1px solid var(--brass)',
            color: 'var(--brass)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
          </span>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--paper)', margin: 0, letterSpacing: '-0.3px' }}>
              {lang === 'en' ? 'Operating Costs & Tournament Revenues' : 'Báo Cáo Chi Phí Vận Hành & Doanh Thu Giải Đấu'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--paper-dim)' }}>
              {lang === 'en' 
                ? 'Visual breakdown of stable upkeep, medicines, 3-role staff payroll, and tournament earnings'
                : 'Biểu đồ hình tròn trực quan hóa chi phí chuồng trại, tiền thuốc, tiền lương và doanh thu giải đua'}
            </p>
          </div>
        </div>

        {/* NÚT THAO TÁC: CHUYỂN CHẾ ĐỘ XEM, KỲ ĐỐI SOÁT & XUẤT FILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Toggle Chế độ xem: Biểu đồ tròn (Gọn) vs Bảng kế toán */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <button
              type="button"
              onClick={() => setViewMode('CHARTS')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'CHARTS' ? 'var(--brass)' : 'transparent',
                color: viewMode === 'CHARTS' ? '#0F172A' : 'var(--paper-dim)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s'
              }}
            >
              <span>🍩</span> 4 Biểu Đồ Tròn
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLES')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'TABLES' ? 'var(--brass)' : 'transparent',
                color: viewMode === 'TABLES' ? '#0F172A' : 'var(--paper-dim)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s'
              }}
            >
              <span>📋</span> Bảng Kế Toán
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--paper)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="11/2026" style={{ background: '#111827', color: '#fff' }}>Tháng 11/2026</option>
              <option value="10/2026" style={{ background: '#111827', color: '#fff' }}>Tháng 10/2026</option>
              <option value="Q4/2026" style={{ background: '#111827', color: '#fff' }}>Quý 4/2026</option>
              <option value="2026" style={{ background: '#111827', color: '#fff' }}>Năm 2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              background: 'rgba(201, 162, 39, 0.12)',
              border: '1px solid rgba(201, 162, 39, 0.35)',
              color: 'var(--brass)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Xuất file báo cáo tài chính CSV"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* ===================== CHẾ ĐỘ XEM 1: 4 BIỂU ĐỒ HÌNH TRÒN XẾP GỌN 2x2 ===================== */}
      {viewMode === 'CHARTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '18px', marginBottom: '24px' }}>
          
          {/* BIỂU ĐỒ 1: DOANH THU GIẢI ĐẤU ĐUA NGỰA */}
          <div className="facility-card" style={{ padding: '20px', borderTop: '4px solid #10B981', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    🏆 DOANH THU GIẢI ĐẤU ĐUA NGỰA
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', margin: '2px 0' }}>
                    {formatVND(tournamentSummary.totalRev)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Ròng cơ sở thu về: <b style={{ color: '#10B981' }}>+{formatVND(tournamentSummary.totalNet)}</b> (Chi giải: -{formatVND(tournamentSummary.totalPrize)})
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 700 }}>
                  4 Giải đấu
                </span>
              </div>

              {/* Thân biểu đồ & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SvgDonutChart
                  data={tournamentPieData}
                  totalValue={tournamentSummary.totalRev}
                  centerTitle="Tổng Thu"
                  centerValue="4.1 Tỷ"
                  hoveredIndex={hoveredTourn}
                  onHover={setHoveredTourn}
                />

                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tournamentPieData.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredTourn(idx)}
                      onMouseLeave={() => setHoveredTourn(null)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: hoveredTourn === idx ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--paper)', fontWeight: 600 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }}></span>
                          {item.label}
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>
                          {((item.value / tournamentSummary.totalRev) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', paddingLeft: '14px', marginTop: '1px' }}>
                        {formatVND(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-dim)' }}>
              <span>Thặng dư cơ sở sau chi phí: <b style={{ color: '#10B981' }}>+{formatVND(operatingNetSurplus)}</b></span>
              <button
                type="button"
                onClick={() => { setViewMode('TABLES'); setActiveCategory('TOURNAMENT'); }}
                style={{ background: 'none', border: 'none', color: 'var(--brass)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Xem chi tiết →
              </button>
            </div>
          </div>

          {/* BIỂU ĐỒ 2: BẢNG LƯƠNG & PHỤ CẤP 3 VAI TRÒ (HLV, VET, GROOM) */}
          <div className="facility-card" style={{ padding: '20px', borderTop: '4px solid #F59E0B', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    👥 LƯƠNG & PHỤ CẤP 3 VAI TRÒ CHUYÊN MÔN
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', margin: '2px 0' }}>
                    {formatVND(totalPayrollExpenses)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Phân bổ {staffPayrollList.length} nhân sự: Huấn luyện viên, Bác sĩ & Chăm sóc
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontWeight: 700 }}>
                  3 Vai trò
                </span>
              </div>

              {/* Thân biểu đồ & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SvgDonutChart
                  data={payrollPieData}
                  totalValue={totalPayrollExpenses}
                  centerTitle="Tổng Quỹ"
                  centerValue={formatVND(totalPayrollExpenses)}
                  hoveredIndex={hoveredPayroll}
                  onHover={setHoveredPayroll}
                />

                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {payrollPieData.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredPayroll(idx)}
                      onMouseLeave={() => setHoveredPayroll(null)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: hoveredPayroll === idx ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--paper)', fontWeight: 600 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }}></span>
                          {item.label}
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>
                          {((item.value / totalPayrollExpenses) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--paper-dim)', paddingLeft: '14px', marginTop: '1px' }}>
                        {formatVND(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-dim)' }}>
              <span>Đã chi trả: <b style={{ color: '#10B981' }}>{staffPayrollList.filter(s => s.isPaid).length}/{staffPayrollList.length} nhân sự</b></span>
              <button
                type="button"
                onClick={() => { setViewMode('TABLES'); setActiveCategory('PAYROLL'); }}
                style={{ background: 'none', border: 'none', color: 'var(--brass)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Xem chi tiết →
              </button>
            </div>
          </div>

          {/* BIỂU ĐỒ 3: CHI PHÍ VẬN HÀNH CHUỒNG TRẠI & THỨC ĂN */}
          <div className="facility-card" style={{ padding: '20px', borderTop: '4px solid #3B82F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    🏡 CHI PHÍ CHUỒNG TRẠI, THỨC ĂN & CƠ SỞ
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#60A5FA', margin: '2px 0' }}>
                    {formatVND(totalStableExpenses)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Điện nước, cỏ Alfalfa, mùn cưa hữu cơ & bảo trì
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', fontWeight: 700 }}>
                  5 Hạng mục
                </span>
              </div>

              {/* Thân biểu đồ & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SvgDonutChart
                  data={stablePieData}
                  totalValue={totalStableExpenses}
                  centerTitle="Tổng Chi"
                  centerValue={formatVND(totalStableExpenses)}
                  hoveredIndex={hoveredStable}
                  onHover={setHoveredStable}
                />

                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {stablePieData.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredStable(idx)}
                      onMouseLeave={() => setHoveredStable(null)}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '6px',
                        background: hoveredStable === idx ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--paper)', fontWeight: 600 }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: item.color }}></span>
                          {item.label.slice(0, 24)}
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>
                          {((item.value / totalStableExpenses) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', paddingLeft: '13px' }}>
                        {formatVND(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-dim)' }}>
              <span>Khoản chi lớn nhất: <b style={{ color: '#10B981' }}>Cỏ Alfalfa & Cám ({((65200000 / totalStableExpenses) * 100).toFixed(0)}%)</b></span>
              <button
                type="button"
                onClick={() => { setViewMode('TABLES'); setActiveCategory('STABLE'); }}
                style={{ background: 'none', border: 'none', color: 'var(--brass)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Xem chi tiết →
              </button>
            </div>
          </div>

          {/* BIỂU ĐỒ 4: CHI PHÍ TIỀN THUỐC & DỊCH VỤ Y TẾ */}
          <div className="facility-card" style={{ padding: '20px', borderTop: '4px solid #EC4899', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#F472B6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    💊 TIỀN THUỐC, TIÊM PHÒNG & Y TẾ THÚ Y
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#F472B6', margin: '2px 0' }}>
                    {formatVND(totalMedicineExpenses)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                    Kháng viêm, vitamin vi khoáng, vaccine & kiểm tra doping
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(236, 72, 153, 0.1)', color: '#F472B6', fontWeight: 700 }}>
                  5 Nhóm thuốc
                </span>
              </div>

              {/* Thân biểu đồ & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SvgDonutChart
                  data={medicinePieData}
                  totalValue={totalMedicineExpenses}
                  centerTitle="Tổng Thuốc"
                  centerValue={formatVND(totalMedicineExpenses)}
                  hoveredIndex={hoveredMed}
                  onHover={setHoveredMed}
                />

                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {medicinePieData.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredMed(idx)}
                      onMouseLeave={() => setHoveredMed(null)}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '6px',
                        background: hoveredMed === idx ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--paper)', fontWeight: 600 }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: item.color }}></span>
                          {item.label.slice(0, 24)}
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>
                          {((item.value / totalMedicineExpenses) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--paper-dim)', paddingLeft: '13px' }}>
                        {formatVND(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-dim)' }}>
              <span>Thuốc kháng viêm: <b style={{ color: '#F472B6' }}>{formatVND(32400000)} ({((32400000 / totalMedicineExpenses) * 100).toFixed(0)}%)</b></span>
              <button
                type="button"
                onClick={() => { setViewMode('TABLES'); setActiveCategory('MEDICINE'); }}
                style={{ background: 'none', border: 'none', color: 'var(--brass)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Xem chi tiết →
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ===================== CHẾ ĐỘ XEM 2: BẢNG KẾ TOÁN CHI TIẾT (FIT 100% KHÔNG THANH CUỘN) ===================== */}
      {viewMode === 'TABLES' && (
        <div>
          {/* Thanh Filter Tab con */}
          <div className="portal-filter-bar" style={{ marginBottom: '18px' }}>
            <div className="portal-filter-pills">
              <button
                type="button"
                className={`portal-pill-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveCategory('ALL')}
              >
                Tất Cả Danh Mục <span className="pill-count">Toàn cảnh</span>
              </button>
              
              <button
                type="button"
                className={`portal-pill-btn ${activeCategory === 'STABLE' ? 'active' : ''}`}
                onClick={() => setActiveCategory('STABLE')}
              >
                Chi Phí Chuồng Trại <span className="pill-count">{formatVND(totalStableExpenses)}</span>
              </button>

              <button
                type="button"
                className={`portal-pill-btn ${activeCategory === 'MEDICINE' ? 'active' : ''}`}
                onClick={() => setActiveCategory('MEDICINE')}
              >
                Tiền Thuốc & Y Tế <span className="pill-count">{formatVND(totalMedicineExpenses)}</span>
              </button>

              <button
                type="button"
                className={`portal-pill-btn ${activeCategory === 'PAYROLL' ? 'active' : ''}`}
                onClick={() => setActiveCategory('PAYROLL')}
              >
                Lương 3 Vai Trò <span className="pill-count">{formatVND(totalPayrollExpenses)}</span>
              </button>

              <button
                type="button"
                className={`portal-pill-btn ${activeCategory === 'TOURNAMENT' ? 'active' : ''}`}
                onClick={() => setActiveCategory('TOURNAMENT')}
                style={activeCategory === 'TOURNAMENT' ? { borderColor: '#10B981', color: '#10B981' } : {}}
              >
                Doanh Thu Giải Đấu <span className="pill-count" style={{ background: '#10B981', color: '#fff' }}>+{formatVND(tournamentSummary.totalNet)}</span>
              </button>
            </div>
          </div>

          {/* BẢNG 1: DOANH THU GIẢI ĐẤU (FIT 100%, 5 CỘT THÔNG MINH, KHÔNG CUỘN NGANG) */}
          {(activeCategory === 'ALL' || activeCategory === 'TOURNAMENT') && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#10B981', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏆</span> Báo Cáo Tổng Quan Doanh Thu Các Giải Đấu Đua Ngựa
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Tổng chi giải: <b style={{ color: '#F59E0B' }}>-{formatVND(tournamentSummary.totalPrize)}</b> · Ròng thu về: <b style={{ color: '#10B981' }}>+{formatVND(tournamentSummary.totalNet)}</b>
                </span>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '12px 16px', width: '30%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Giải Đấu & Thời Gian</th>
                      <th style={{ padding: '12px 14px', width: '25%', verticalAlign: 'middle' }}>Chi Tiết Nguồn Thu</th>
                      <th style={{ padding: '12px 14px', width: '15%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Tổng Doanh Thu</th>
                      <th style={{ padding: '12px 14px', width: '15%', textAlign: 'right', color: '#F59E0B', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Chi Thưởng Quỹ</th>
                      <th style={{ padding: '12px 16px', width: '15%', textAlign: 'right', color: '#10B981', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Ròng & Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOURNAMENT_REVENUE_DATA.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px' }}>{t.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                            {t.track} · <span style={{ color: 'var(--paper)' }}>{t.date}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontSize: '11.5px', color: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>Vé & VIP: <b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatVND(t.ticketSales)}</b></span>
                            <span style={{ color: 'var(--paper-dim)' }}>Phí: {formatVND(t.entryFees)} · Tài trợ: {formatVND(t.sponsorship)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--brass)', verticalAlign: 'middle', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                          {formatVND(t.totalRevenue)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#F59E0B', fontWeight: 700, verticalAlign: 'middle', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          -{formatVND(t.prizePursePayout)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: '#10B981', fontSize: '13.5px', fontVariantNumeric: 'tabular-nums' }}>
                            +{formatVND(t.netFacilityRevenue)}
                          </div>
                          <div style={{ marginTop: '3px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: t.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: t.status === 'COMPLETED' ? '#10B981' : '#F59E0B',
                              border: `1px solid ${t.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                            }}>
                              {t.statusLabel}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', fontWeight: 800 }}>
                      <td style={{ padding: '12px 16px', color: 'var(--brass)', verticalAlign: 'middle' }}>
                        TỔNG CỘNG ({TOURNAMENT_REVENUE_DATA.length} GIẢI)
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '11.5px', color: 'var(--paper-dim)', verticalAlign: 'middle' }}>
                        Vé: {formatVND(tournamentSummary.totalTicket)} · Tài trợ: {formatVND(tournamentSummary.totalSponsor)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--brass)', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                        {formatVND(tournamentSummary.totalRev)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#F59E0B', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                        -{formatVND(tournamentSummary.totalPrize)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10B981', fontSize: '14px', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                        +{formatVND(tournamentSummary.totalNet)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* BẢNG 2: BẢNG LƯƠNG 3 VAI TRÒ (FIT 100%, 5 CỘT GỌN GÀNG, KHÔNG CUỘN NGANG) */}
          {(activeCategory === 'ALL' || activeCategory === 'PAYROLL') && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#F59E0B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👥</span> Bảng Lương & Phụ Cấp 3 Vai Trò: Huấn Luyện Viên, Bác Sĩ & Chăm Sóc Chuồng
                </h3>
                
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--paper-dim)' }}>HLV: <b style={{ color: 'var(--paper)' }}>{formatVND(payrollByRole.TRAINER)}</b></span>
                  <span style={{ color: 'var(--paper-dim)' }}>Bác Sĩ: <b style={{ color: 'var(--paper)' }}>{formatVND(payrollByRole.VET)}</b></span>
                  <span style={{ color: 'var(--paper-dim)' }}>Groom: <b style={{ color: 'var(--paper)' }}>{formatVND(payrollByRole.GROOM)}</b></span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '12px 16px', width: '25%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Họ Tên & Tài Khoản</th>
                      <th style={{ padding: '12px 14px', width: '18%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Vai Trò</th>
                      <th style={{ padding: '12px 14px', width: '22%', textAlign: 'right', verticalAlign: 'middle' }}>Lương & Phụ Cấp</th>
                      <th style={{ padding: '12px 16px', width: '18%', textAlign: 'right', color: 'var(--brass)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thực Lĩnh</th>
                      <th style={{ padding: '12px 16px', width: '17%', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Trạng Thái & Duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPayrollList.map(staff => (
                      <tr key={staff.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px' }}>{staff.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>@{staff.username}</div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: staff.role === 'TRAINER' 
                              ? 'rgba(59, 130, 246, 0.12)' 
                              : staff.role === 'VET' 
                                ? 'rgba(236, 72, 153, 0.12)' 
                                : 'rgba(245, 158, 11, 0.12)',
                            color: staff.role === 'TRAINER' 
                              ? '#60A5FA' 
                              : staff.role === 'VET' 
                                ? '#F472B6' 
                                : '#FBBF24',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            {staff.roleName}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ color: 'var(--paper)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {formatVND(staff.baseSalary)}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#10B981', marginTop: '1px', fontVariantNumeric: 'tabular-nums' }}>
                            +{formatVND(staff.allowance + staff.bonus)} phụ cấp
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--brass)', fontSize: '13.5px', verticalAlign: 'middle', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {formatVND(staff.totalNet)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: staff.isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: staff.isPaid ? '#10B981' : '#F59E0B',
                              border: `1px solid ${staff.isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                            }}>
                              {staff.isPaid ? '✓ Đã trả' : 'Chờ chi'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePaidStatus(staff.id, staff.name)}
                              style={{
                                padding: '4px 8px',
                                background: staff.isPaid ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                border: staff.isPaid ? '1px solid var(--line)' : 'none',
                                color: staff.isPaid ? 'var(--paper-dim)' : '#0F172A',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {staff.isPaid ? 'Hủy' : 'Chi'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', fontWeight: 800 }}>
                      <td colSpan={3} style={{ padding: '12px 16px', color: 'var(--brass)', verticalAlign: 'middle' }}>
                        TỔNG QUỸ LƯƠNG NHÂN SỰ ({staffPayrollList.length} NGƯỜI)
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--brass)', fontSize: '14px', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                        {formatVND(totalPayrollExpenses)}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '11px', color: '#10B981' }}>
                        Đã trả {staffPayrollList.filter(s => s.isPaid).length}/{staffPayrollList.length}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* BẢNG 3: CHI PHÍ CHUỒNG TRẠI (FIT 100%, 4 CỘT GỌN GÀNG, KHÔNG CUỘN NGANG) */}
          {(activeCategory === 'ALL' || activeCategory === 'STABLE') && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#3B82F6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏡</span> Chi Phí Vận Hành Chuồng Trại, Thức Ăn & Cơ Sở Vật Chất
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Tổng chi tháng: <b style={{ color: '#60A5FA' }}>{formatVND(totalStableExpenses)}</b>
                </span>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '12px 16px', width: '35%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Hạng Mục & Nhóm</th>
                      <th style={{ padding: '12px 14px', width: '20%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Định Mức / Khối Lượng</th>
                      <th style={{ padding: '12px 16px', width: '18%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thành Tiền</th>
                      <th style={{ padding: '12px 16px', width: '27%', verticalAlign: 'middle' }}>Ghi Chú Vận Hành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STABLE_EXPENSES_DATA.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '1px' }}>{item.category}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--paper)', verticalAlign: 'middle' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#60A5FA', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                          {formatVND(item.total)}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--paper-dim)', fontSize: '11.5px', verticalAlign: 'middle' }}>
                          {item.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '12px 16px', color: '#60A5FA', verticalAlign: 'middle' }}>
                        TỔNG CHI PHÍ CHUỒNG TRẠI (5 HẠNG MỤC)
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#60A5FA', fontSize: '14px', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                        {formatVND(totalStableExpenses)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* BẢNG 4: CHI PHÍ TIỀN THUỐC (FIT 100%, 4 CỘT GỌN GÀNG, KHÔNG CUỘN NGANG) */}
          {(activeCategory === 'ALL' || activeCategory === 'MEDICINE') && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#EC4899', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💊</span> Chi Phí Tiền Thuốc, Tiêm Chủng & Dịch Vụ Y Tế Thú Y
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                  Tổng tiền thuốc & vật tư: <b style={{ color: '#F472B6' }}>{formatVND(totalMedicineExpenses)}</b>
                </span>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '12px 16px', width: '35%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thuốc / Dịch Vụ & Phân Loại</th>
                      <th style={{ padding: '12px 14px', width: '20%', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Số Lượng Sử Dụng</th>
                      <th style={{ padding: '12px 16px', width: '18%', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Thành Tiền</th>
                      <th style={{ padding: '12px 16px', width: '27%', verticalAlign: 'middle' }}>Chỉ Định & Mục Đích Y Tế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MEDICINE_EXPENSES_DATA.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, color: 'var(--paper)', fontSize: '13px' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--paper-dim)', marginTop: '1px' }}>{item.category}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--paper)', verticalAlign: 'middle' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#F472B6', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                          {formatVND(item.total)}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--paper-dim)', fontSize: '11.5px', verticalAlign: 'middle' }}>
                          {item.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '12px 16px', color: '#F472B6', verticalAlign: 'middle' }}>
                        TỔNG TIỀN THUỐC & DỊCH VỤ Y TẾ (5 NHÓM)
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#F472B6', fontSize: '14px', whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                        {formatVND(totalMedicineExpenses)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
