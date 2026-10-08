export const ownersList = [
  { id: 'OWN001', name: 'Nguyễn Văn Minh', farm: 'Trang trại Đông Á', avatar: '👤' },
  { id: 'OWN002', name: 'Trần Hoàng Lâm', farm: 'CLB Đua Mã Sài Gòn', avatar: '👤' },
  { id: 'OWN003', name: 'Nguyễn Bích Ngọc', farm: 'Ngọc Mã Stables', avatar: '👤' },
  { id: 'OWN004', name: 'Tập đoàn Thể thao Mã Trường', farm: 'Mã Trường Corp', avatar: '🏢' }
];

export const ownedHorsesData = [
  {
    id: 'H001',
    name: 'Xích Thố',
    englishName: 'Red Hare Legend',
    chipId: '982-000-348-192-001',
    breed: 'Thoroughbred thuần chủng',
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
    ownerName: 'Nguyễn Văn Minh (Trang trại Đông Á)',
    ownershipShare: 70, // 70% share
    trainer: 'HLV Phạm Hoàng Nam',
    winsSummary: '14 trận (9 Nhất, 3 Nhì, 1 Ba)',
    totalPrizeWon: 2450000000, // 2.450.000.000 VNĐ
    sharePrizeWon: 1715000000, // 70% share
    totalExpenses: 340000000,  // 340M VNĐ
    shareExpenses: 238000000,  // 70% share
    netProfit: 1477000000,     // Net balance for owner
    status: 'eligible',
    statusLabel: 'Đủ điều kiện thi đấu'
  },
  {
    id: 'H002',
    name: 'Bạch Long',
    englishName: 'White Dragon',
    chipId: '982-000-348-192-002',
    breed: 'Thoroughbred lai Arabian',
    avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=400&q=80',
    ownerName: 'Trần Hoàng Lâm',
    ownershipShare: 30, // 30% share
    trainer: 'HLV Phạm Hoàng Nam',
    winsSummary: '16 trận (8 Nhất, 5 Nhì, 2 Ba)',
    totalPrizeWon: 1820000000,
    sharePrizeWon: 546000000,
    totalExpenses: 280000000,
    shareExpenses: 84000000,
    netProfit: 462000000,
    status: 'eligible',
    statusLabel: 'Đủ điều kiện thi đấu'
  },
  {
    id: 'H003',
    name: 'Hắc Phong',
    englishName: 'Black Wind',
    chipId: '982-000-348-192-003',
    breed: 'Thoroughbred thuần chủng',
    avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80',
    ownerName: 'Nguyễn Bích Ngọc',
    ownershipShare: 100, // 100% share
    trainer: 'HLV Vũ Đức Thắng',
    winsSummary: '8 trận (5 Nhất, 2 Nhì, 0 Ba)',
    totalPrizeWon: 1100000000,
    sharePrizeWon: 1100000000,
    totalExpenses: 210000000,
    shareExpenses: 210000000,
    netProfit: 890000000,
    status: 'watch',
    statusLabel: 'Cần theo dõi nhịp tim'
  },
  {
    id: 'H006',
    name: 'Thần Mã',
    englishName: 'Pegasus Prince',
    chipId: '982-000-348-192-006',
    breed: 'Thoroughbred thuần chủng',
    avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80',
    ownerName: 'Tập đoàn Thể thao Mã Trường',
    ownershipShare: 100,
    trainer: 'HLV Phạm Hoàng Nam',
    winsSummary: '22 trận (14 Nhất, 4 Nhì, 2 Ba)',
    totalPrizeWon: 3900000000,
    sharePrizeWon: 3900000000,
    totalExpenses: 450000000,
    shareExpenses: 450000000,
    netProfit: 3450000000,
    status: 'eligible',
    statusLabel: 'Đủ điều kiện thi đấu'
  }
];

export const settlementStatementsData = [
  {
    id: 'STMT-2026-09',
    period: 'Tháng 09/2026',
    date: '30/09/2026',
    horseId: 'H001',
    horseName: 'Xích Thố',
    chipId: '982-000-348-192-001',
    ownershipShare: 70,
    raceName: 'Cúp Đua Mã Mùa Thu Khai Mạc G1 (2400m)',
    raceRank: 'HẠNG NHẤT (VÔ ĐỊCH 🏆)',
    totalRacePrize: 600000000, // 600M
    shareRacePrize: 420000000, // 70% = 420M
    careExpense: 25000000,     // 25M (Thức ăn, dinh dưỡng, chuồng A1)
    vetExpense: 12000000,      // 12M (Kiểm tra móng, siêu âm gân định kỳ)
    trainerFee: 15000000,      // 15M (Phí HLV & nài ngựa)
    totalMonthExpense: 52000000, // 52M
    shareMonthExpense: 36400000, // 70% = 36.4M
    netPayout: 383600000,      // Net payout to owner = 420M - 36.4M = 383.6M
    status: 'paid',
    statusLabel: 'Đã thanh toán đối soát',
    paymentMethod: 'Chuyển khoản Vietcombank (Số GD: VCB-98212903)',
    breakdown: {
      careItems: [
        { desc: 'Khẩu phần ngũ cốc cao cấp & Vitamin nhập khẩu (30 ngày)', amount: 12000000 },
        { desc: 'Cỏ tươi Alfalfa & khoáng chất chuồng A1', amount: 8000000 },
        { desc: 'Dịch vụ ngâm chân nước đá & vật lý trị liệu sau tập', amount: 5000000 }
      ],
      vetItems: [
        { desc: 'Khám tổng quát & chụp X-Quang khớp gối trước giải', amount: 7000000 },
        { desc: 'Tiêm phòng bổ sung vi chất & kiểm tra móng guốc', amount: 5000000 }
      ],
      prizeItems: [
        { desc: 'Tiền thưởng Hạng Nhất Giải Cúp Mùa Thu G1', total: 600000000, sharePercent: 70, ownerAmount: 420000000 }
      ]
    }
  },
  {
    id: 'STMT-2026-08',
    period: 'Tháng 08/2026',
    date: '31/08/2026',
    horseId: 'H001',
    horseName: 'Xích Thố',
    chipId: '982-000-348-192-001',
    ownershipShare: 70,
    raceName: 'Giải Vô Địch Nước Rút Mở Rộng 1400m',
    raceRank: 'HẠNG NHÌ (Á QUÂN 🥈)',
    totalRacePrize: 300000000,
    shareRacePrize: 210000000,
    careExpense: 24000000,
    vetExpense: 8000000,
    trainerFee: 15000000,
    totalMonthExpense: 47000000,
    shareMonthExpense: 32900000,
    netPayout: 177100000,
    status: 'paid',
    statusLabel: 'Đã thanh toán đối soát',
    paymentMethod: 'Chuyển khoản Vietcombank (Số GD: VCB-88120391)',
    breakdown: {
      careItems: [
        { desc: 'Khẩu phần dinh dưỡng thi đấu cự ly ngắn', amount: 14000000 },
        { desc: 'Chi phí chăm sóc vệ sinh & ngâm chân đá', amount: 10000000 }
      ],
      vetItems: [
        { desc: 'Kiểm tra khớp cổ chân & massage cơ thể', amount: 8000000 }
      ],
      prizeItems: [
        { desc: 'Tiền thưởng Hạng Nhì Giải Vô Địch Nước Rút', total: 300000000, sharePercent: 70, ownerAmount: 210000000 }
      ]
    }
  },
  {
    id: 'STMT-2026-09-BL',
    period: 'Tháng 09/2026',
    date: '30/09/2026',
    horseId: 'H002',
    horseName: 'Bạch Long',
    chipId: '982-000-348-192-002',
    ownershipShare: 30,
    raceName: 'Giải Đua Mã Trường Đường Dài 2400m',
    raceRank: 'HẠNG NHẤT (VÔ ĐỊCH 🏆)',
    totalRacePrize: 450000000,
    shareRacePrize: 135000000, // 30% of 450M
    careExpense: 22000000,
    vetExpense: 6000000,
    trainerFee: 12000000,
    totalMonthExpense: 40000000,
    shareMonthExpense: 12000000, // 30% of 40M
    netPayout: 123000000, // 135M - 12M = 123M
    status: 'pending',
    statusLabel: 'Đang chờ chủ xác nhận',
    paymentMethod: 'Dự kiến chuyển khoản ngày 05/10/2026',
    breakdown: {
      careItems: [
        { desc: 'Khẩu phần ăn đường dài Arabian Thoroughbred', amount: 14000000 },
        { desc: 'Chăm sóc thể lực chuồng A2', amount: 8000000 }
      ],
      vetItems: [
        { desc: 'Kiểm tra điện tim & xét nghiệm máu định kỳ', amount: 6000000 }
      ],
      prizeItems: [
        { desc: 'Tiền thưởng Hạng Nhất Giải Đường Dài 2400m', total: 450000000, sharePercent: 30, ownerAmount: 135000000 }
      ]
    }
  }
];

export const raceHistoryLogs = [
  {
    id: 'RACE-001',
    horseId: 'H001',
    horseName: 'Xích Thố',
    date: '25/09/2026',
    raceName: 'Cúp Đua Mã Mùa Thu Khai Mạc G1',
    track: 'Mặt sân cỏ Turf • 2.400 m',
    rank: '1 / 12',
    rankBadge: 'HẠNG NHẤT 🏆',
    jockey: 'Nài ngựa Nguyễn Văn Hùng',
    timeRecord: '2:14.38 (Kỷ lục mùa giải)',
    prizeAmount: 600000000,
    ownerShareAmount: 420000000
  },
  {
    id: 'RACE-002',
    horseId: 'H001',
    horseName: 'Xích Thố',
    date: '18/08/2026',
    raceName: 'Giải Vô Địch Nước Rút Mở Rộng',
    track: 'Mặt sân cát Sand • 1.400 m',
    rank: '2 / 10',
    rankBadge: 'HẠNG NHÌ 🥈',
    jockey: 'Nài ngựa Trần Quốc Bảo',
    timeRecord: '1:21.05',
    prizeAmount: 300000000,
    ownerShareAmount: 210000000
  },
  {
    id: 'RACE-003',
    horseId: 'H002',
    horseName: 'Bạch Long',
    date: '20/09/2026',
    raceName: 'Giải Đua Mã Trường Đường Dài 2400m',
    track: 'Mặt sân cỏ Turf • 2.400 m',
    rank: '1 / 8',
    rankBadge: 'HẠNG NHẤT 🏆',
    jockey: 'Nài ngựa Phạm Minh Tiến',
    timeRecord: '2:16.12',
    prizeAmount: 450000000,
    ownerShareAmount: 135000000
  },
  {
    id: 'RACE-004',
    horseId: 'H003',
    horseName: 'Hắc Phong',
    date: '05/09/2026',
    raceName: 'Giải Đua Thử Sức Trẻ Mùa Thu 1200m',
    track: 'Mặt sân cát Sand • 1.200 m',
    rank: '1 / 10',
    rankBadge: 'HẠNG NHẤT 🏆',
    jockey: 'Nài ngựa Vũ Đức Thắng',
    timeRecord: '1:09.45',
    prizeAmount: 250000000,
    ownerShareAmount: 250000000
  }
];
