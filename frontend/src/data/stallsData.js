export const initialStallsData = [
  // KHU A (A1 - A6)
  {
    code: 'A1',
    zone: 'Khu A - Chuồng Huấn Luyện Chính',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Xích Thố',
    englishName: 'Red Hare Legend',
    chipId: '982-000-348-192-001',
    groom: 'Nguyễn Văn Hùng (Trưởng nhóm Groom)',
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
    feedDiet: '3.5kg Ngũ cốc yến mạch + 5kg Cỏ Alfalfa + Vitamin B12 & Điện giải',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng · Khẩu phần yến mạch & Điện giải 3.5kg', category: 'feed', done: true },
      { time: '06:15', title: 'Chạy bền 3.000m · Mặt sân cỏ Turf (HLV Nam)', category: 'train', done: true },
      { time: '08:00', title: 'Tắm rửa kỹ & Ngâm chân nước đá 20 phút', category: 'care', done: true },
      { time: '10:30', title: 'Thú y tái khám định kỳ gân trước trái', category: 'vet', done: true },
      { time: '15:00', title: 'Bài tập nước rút 800m trên sân cát Sand', category: 'train', done: false },
      { time: '17:30', title: 'Cho ăn chiều, dọn cỏ khô & khử trùng chuồng A1', category: 'clean', done: false }
    ]
  },
  {
    code: 'A2',
    zone: 'Khu A - Chuồng Huấn Luyện Chính',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Bạch Long',
    englishName: 'White Dragon',
    chipId: '982-000-348-192-002',
    groom: 'Phạm Minh Tiến',
    avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=400&q=80',
    feedDiet: '3.0kg Ngũ cốc mầm + 6kg Cỏ khô cao cấp + Khoáng chất Canxi',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: false,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng · Khẩu phần mầm lúa mạch 3.0kg', category: 'feed', done: true },
      { time: '06:30', title: 'Tập đi bộ thả lỏng & Chạy dèo 2.000m', category: 'train', done: true },
      { time: '08:30', title: 'Dọn chuồng, chải lông & Ngâm chân đá', category: 'care', done: true },
      { time: '14:30', title: 'Tập bơi hồ thể lực 15 phút', category: 'train', done: false },
      { time: '17:30', title: 'Cho ăn chiều & Thay rơm chuồng A2', category: 'clean', done: false }
    ]
  },
  {
    code: 'A3',
    zone: 'Khu A - Chuồng Theo Dõi Thể Lực',
    status: 'watch',
    label: 'Cần theo dõi',
    horse: 'Hắc Phong',
    englishName: 'Black Wind',
    chipId: '982-000-348-192-003',
    groom: 'Trần Bảo Nam',
    avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80',
    feedDiet: '2.8kg Ngũ cốc nhẹ + Cỏ tươi Alfalfa + Bổ sung trợ tim & Điện giải',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: false,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng & Uống trợ tim theo đơn thú y', category: 'feed', done: true },
      { time: '07:00', title: 'Đo nhịp tim lúc nghỉ (Resting HR) & Đi bộ 1.000m', category: 'vet', done: true },
      { time: '09:00', title: 'Vệ sinh chuồng & Bổ sung cỏ tươi Alfalfa', category: 'clean', done: true },
      { time: '15:30', title: 'Kiểm tra lại chỉ số nhịp tim sau đi bộ', category: 'vet', done: false },
      { time: '17:30', title: 'Cho ăn chiều & Kiểm tra tổng thể', category: 'feed', done: false }
    ]
  },
  {
    code: 'A4',
    zone: 'Khu A - Chuồng Huấn Luyện Chính',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Kim Mã',
    englishName: 'Golden Stallion',
    chipId: '982-000-348-192-004',
    groom: 'Nguyễn Văn Hùng',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    feedDiet: '3.8kg Yến mạch hỗn hợp + 5.5kg Cỏ Alfalfa + Omega 3',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng · Ngũ cốc bứt tốc 3.8kg', category: 'feed', done: true },
      { time: '06:15', title: 'Tập chạy nước rút 1.000m (Sân cát Sand)', category: 'train', done: true },
      { time: '08:00', title: 'Tắm rửa & Ngâm chân đá 20 phút', category: 'care', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Khử trùng chuồng A4', category: 'clean', done: false }
    ]
  },
  {
    code: 'A5',
    zone: 'Khu A - Chuồng Trị Liệu Chấn Thương',
    status: 'hurt',
    label: 'Chấn thương',
    horse: 'Phi Yến',
    englishName: 'Flying Swallow',
    chipId: '982-000-348-192-005',
    groom: 'Lê Văn Hoàng',
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
    feedDiet: '2.5kg Ngũ cốc phục hồi + Cỏ mềm + Thuốc kháng viêm gân & Băng ép',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng & Uống thuốc kháng viêm gân', category: 'feed', done: true },
      { time: '08:00', title: 'Vật lý trị liệu chườm đá gân chân trước trái', category: 'care', done: true },
      { time: '10:00', title: 'Bác sĩ thú y siêu âm chấn thương gân', category: 'vet', done: true },
      { time: '16:00', title: 'Thay băng bó chấn thương & Massage chân', category: 'care', done: false },
      { time: '17:30', title: 'Cho ăn chiều & Rải lớp rơm đệm mềm chuồng A5', category: 'clean', done: false }
    ]
  },
  {
    code: 'A6',
    zone: 'Khu A - Chuồng Huấn Luyện Chính',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Thần Mã',
    englishName: 'Pegasus Prince',
    chipId: '982-000-348-192-006',
    groom: 'Phạm Minh Tiến',
    avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80',
    feedDiet: '4.0kg Ngũ cốc năng lượng cao + 6kg Cỏ Alfalfa + Vitamin C & E',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng · Khẩu phần chiến mã 4.0kg', category: 'feed', done: true },
      { time: '06:15', title: 'Chạy biến tốc 2.400m sân cỏ Turf', category: 'train', done: true },
      { time: '08:30', title: 'Tắm & Ngâm chân đá phục hồi', category: 'care', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Vệ sinh chuồng A6', category: 'clean', done: false }
    ]
  },

  // KHU B (B1 - B6)
  {
    code: 'B1',
    zone: 'Khu B - Chuồng Chăm Sóc Đua Cỏ',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Ngân Hà',
    englishName: 'Galaxy Star',
    chipId: '982-000-348-192-007',
    groom: 'Trần Bảo Nam',
    avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=400&q=80',
    feedDiet: '3.2kg Ngũ cốc yến mạch + Cỏ khô Pháp + Vitamin tổng hợp',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: false,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng · Ngũ cốc 3.2kg', category: 'feed', done: true },
      { time: '06:30', title: 'Tập chạy dèo 1.800m sân cỏ', category: 'train', done: true },
      { time: '08:30', title: 'Ngâm chân đá & Chải lông đuôi', category: 'care', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Thay đệm rơm B1', category: 'clean', done: false }
    ]
  },
  {
    code: 'B2',
    zone: 'Khu B - Chuồng Nghỉ Dưỡng / Cách Ly',
    status: 'quar',
    label: 'Cách ly',
    horse: 'Lôi Chấn',
    englishName: 'Thunder Bolt',
    chipId: '982-000-348-192-008',
    groom: 'Lê Văn Hoàng',
    avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80',
    feedDiet: '2.6kg Ngũ cốc dinh dưỡng + Thuốc bổ phục hồi sau giải đua',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: false,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng & Uống vitamin phục hồi', category: 'feed', done: true },
      { time: '08:00', title: 'Khử trùng khu vực chuồng B2 cách ly', category: 'clean', done: true },
      { time: '10:00', title: 'Thú y kiểm tra thân nhiệt & xét nghiệm', category: 'vet', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Vệ sinh biệt lập', category: 'feed', done: false }
    ]
  },
  {
    code: 'B3',
    zone: 'Khu B - Chuồng Chăm Sóc Dự Bị',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Dũng Khí',
    englishName: 'Valiant Heart',
    chipId: '982-000-348-192-009',
    groom: 'Nguyễn Văn Hùng',
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
    feedDiet: '3.0kg Yến mạch + Cỏ Alfalfa',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: false,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng 3.0kg ngũ cốc', category: 'feed', done: true },
      { time: '07:00', title: 'Tập chạy dèo 2.000m', category: 'train', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Vệ sinh chuồng', category: 'clean', done: false }
    ]
  },
  {
    code: 'B4',
    zone: 'Khu B - Chuồng Theo Dõi Thể Lực',
    status: 'watch',
    label: 'Cần theo dõi',
    horse: 'Hỏa Tiễn',
    englishName: 'Rocket Flash',
    chipId: '982-000-348-192-010',
    groom: 'Phạm Minh Tiến',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    feedDiet: '2.8kg Ngũ cốc nhẹ + Điện giải bứt tốc',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: false,
      medication: true,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng & Uống vitamin khoáng', category: 'feed', done: true },
      { time: '09:00', title: 'Thú y kiểm tra vách móng guốc', category: 'vet', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Dọn chuồng B4', category: 'clean', done: false }
    ]
  },
  {
    code: 'B5',
    zone: 'Khu B - Chuồng Chăm Sóc Dự Bị',
    status: 'eligible',
    label: 'Đủ điều kiện',
    horse: 'Tia Chớp',
    englishName: 'Flash Lightning',
    chipId: '982-000-348-192-011',
    groom: 'Trần Bảo Nam',
    avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=400&q=80',
    feedDiet: '3.4kg Ngũ cốc + Cỏ tươi',
    checklist: {
      feedMorning: true,
      cleanStall: true,
      iceBath: true,
      medication: false,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '05:30', title: 'Cho ăn sáng 3.4kg', category: 'feed', done: true },
      { time: '06:45', title: 'Tập chạy 1.600m sân cát', category: 'train', done: true },
      { time: '17:30', title: 'Cho ăn chiều & Khử trùng', category: 'clean', done: false }
    ]
  },
  {
    code: 'B6',
    zone: 'Khu B - Chuồng Dự Phòng',
    status: 'empty',
    label: 'Chuồng trống',
    horse: 'Chuồng trống',
    englishName: 'Empty Stall',
    chipId: 'N/A',
    groom: 'Tùy phân công',
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
    feedDiet: 'Không có chiến mã',
    checklist: {
      feedMorning: false,
      cleanStall: true,
      iceBath: false,
      medication: false,
      feedEvening: false
    },
    dailyRoutine: [
      { time: '09:00', title: 'Khử trùng định kỳ chuồng B6 trống', category: 'clean', done: true }
    ]
  }
];

export const stallsData = initialStallsData;

export const scheduleData = [
  { time: '05:30', barClass: 'c1', title: 'Cho ăn sáng · Khẩu phần yến mạch & Điện giải' },
  { time: '06:30', barClass: 'c2', title: 'Huấn luyện · Chạy bền 3.000m & Đi bộ thả lỏng' },
  { time: '08:30', barClass: 'c3', title: 'Chăm sóc · Tắm mát, chải lông & Ngâm chân đá 20 phút' },
  { time: '10:30', barClass: 'c4', title: 'Thú y · Khám định kỳ & Bôi khoáng móng' },
  { time: '14:30', barClass: 'c2', title: 'Huấn luyện · Bài tập nước rút 800m & Bơi hồ' },
  { time: '17:30', barClass: 'c1', title: 'Cho ăn chiều · Dọn vệ sinh & Rải đệm chuồng' }
];
