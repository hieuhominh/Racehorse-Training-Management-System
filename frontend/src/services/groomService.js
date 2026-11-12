// Dịch vụ dữ liệu và quản lý nghiệp vụ cho Cổng Groom (Nhân viên chăm sóc ngựa)
// Tuân thủ nghiêm ngặt các nguyên tắc phân quyền và giới hạn của Groom:
// 1. Groom được quan sát, ghi nhận và báo cáo.
// 2. Groom KHÔNG ĐƯỢC tự chẩn đoán bệnh, không kê đơn, không chỉnh sửa bệnh án chính thức.
// 3. Groom KHÔNG ĐƯỢC tự thay đổi trạng thái sức khỏe chính thức hay tự mở khóa huấn luyện.
// 4. CHỦ NHÓM GROOM (HEAD GROOM): Quản lý phân ca, tạo lịch công việc, xóa lịch công việc cho bản thân và nhân viên dưới quyền.
// 5. NHÂN VIÊN GROOM (STAFF GROOM): Chỉ xem việc được giao của riêng mình, không có quyền tạo hoặc xóa lịch công việc, chỉ cập nhật tiến độ thực hiện.

const STORAGE_KEYS = {
  TASKS: 'matruong_groom_tasks',
  HORSES: 'matruong_groom_horses',
  ALERTS: 'matruong_groom_alerts',
  VET_INSTRUCTIONS: 'matruong_groom_vet_instructions',
  INCIDENTS: 'matruong_groom_incidents',
  INVENTORY: 'matruong_groom_inventory',
  DAILY_REPORTS: 'matruong_groom_daily_reports',
  ACTIVE_ROLE: 'matruong_groom_active_role'
};

// =========================================================================
// 1. DANH SÁCH NHÂN SỰ ĐỘI GROOM & CÁC CA LÀM VIỆC (SHIFTS)
// =========================================================================
export const GROOM_SHIFTS = [
  { id: 'MORNING', name: 'Ca Sáng', timeRange: '05:00 – 13:00', desc: 'Cho ăn sáng, vệ sinh chuồng, chải lông nạo móng trước tập' },
  { id: 'AFTERNOON', name: 'Ca Chiều', timeRange: '13:00 – 21:00', desc: 'Cho ăn cữ chiều, tắm mát hạ nhiệt, uống thuốc theo y lệnh' },
  { id: 'NIGHT', name: 'Ca Đêm', timeRange: '21:00 – 05:00', desc: 'Tuần tra an toàn then cài cửa, kiểm tra phao nước, theo dõi ngựa chấn thương' }
];

export const GROOM_TEAM_MEMBERS = [
  {
    id: 'groom_nam',
    username: 'groom_nam',
    name: 'Lê Hoàng Nam',
    title: 'Chủ nhóm Groom (Head Groom)',
    role: 'HEAD_GROOM',
    shift: 'ALL_SHIFTS',
    shiftName: 'Chủ nhóm (Điều phối toàn ca Block A)',
    isLead: true,
    phone: '0903.456.789',
    email: 'groom@matruong.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'groom_dung',
    username: 'groom_dung',
    name: 'Vũ Tiến Dũng',
    title: 'Nhân viên Groom (Block B)',
    role: 'STAFF_GROOM',
    shift: 'MORNING',
    shiftName: 'Ca Sáng (05:00 – 13:00)',
    isLead: false,
    phone: '0903.456.790',
    email: 'groom_dung@matruong.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'groom_thao',
    username: 'groom_thao',
    name: 'Nguyễn Thu Thảo',
    title: 'Nhân viên Groom (Block C)',
    role: 'STAFF_GROOM',
    shift: 'AFTERNOON',
    shiftName: 'Ca Chiều (13:00 – 21:00)',
    isLead: false,
    phone: '0903.456.791',
    email: 'groom_thao@matruong.vn',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
  }
];

// =========================================================================
// 2. MẪU CÔNG VIỆC THƯỜNG QUY CÓ SẴN CHO NGỰA (PREDEFINED TASK TEMPLATES)
// =========================================================================
export const PREDEFINED_GROOM_TASK_TEMPLATES = [
  {
    id: 'TPL_FEED_AM',
    type: 'FEEDING',
    shift: 'MORNING',
    defaultTime: '05:30',
    shortTitle: 'Cho ăn cỏ Alfalfa & phao nước',
    title: 'Cho ăn cỏ khô Alfalfa sáng & kiểm tra phao nước',
    desc: 'Cung cấp 4kg cỏ Alfalfa loại 1, xả rửa máng nước tự động và kiểm tra tốc độ nạp nước.'
  },
  {
    id: 'TPL_CLEAN_AM',
    type: 'CLEANING',
    shift: 'MORNING',
    defaultTime: '07:00',
    shortTitle: 'Vệ sinh chuồng & rắc vôi bột',
    title: 'Vệ sinh cào phân chuồng, rắc vôi bột & lót mùn cưa khô',
    desc: 'Dọn sạch phân cũ, rắc vôi sát trùng nền chuồng và bổ sung đệm lót mùn cưa thông hút ẩm 5cm.'
  },
  {
    id: 'TPL_GROOM_AM',
    type: 'GROOMING',
    shift: 'MORNING',
    defaultTime: '08:30',
    shortTitle: 'Chải lông Curry & nạo móng guốc',
    title: 'Chải lông bằng lược Curry & nạo bùn sỏi kẽ móng guốc Hoof Pick',
    desc: 'Dùng bàn chải cao su nới lỏng bụi cát, dao Hoof pick cạo sạch đất kẽ móng guốc 4 chân.'
  },
  {
    id: 'TPL_HEALTH_AM',
    type: 'HEALTH_CHECK',
    shift: 'MORNING',
    defaultTime: '10:00',
    shortTitle: 'Đo thân nhiệt & nhịp thở lâm sàng',
    title: 'Đo thân nhiệt, đếm nhịp thở & nghe nhu động ruột lâm sàng',
    desc: 'Cặp nhiệt độ hậu môn (chuẩn 37.5-38.5°C), quan sát nhịp thở 8-16 bpm và áp tai nghe nhu động 4 góc bụng.'
  },
  {
    id: 'TPL_POST_TRAIN_PM',
    type: 'POST_TRAIN',
    shift: 'AFTERNOON',
    defaultTime: '14:30',
    shortTitle: 'Tắm mát, hạ nhiệt & xịt lạnh chân',
    title: 'Tắm rửa hạ nhiệt, xịt lạnh gân chân & dắt đi bộ hồi sức',
    desc: 'Rửa sạch mồ hôi bằng vòi nước áp lực thấp, xịt lạnh khớp cổ chân 15 phút và dắt bộ chậm.'
  },
  {
    id: 'TPL_VET_PM',
    type: 'VET_CARE',
    shift: 'AFTERNOON',
    defaultTime: '16:00',
    shortTitle: 'Uống thuốc & bôi gel theo y lệnh',
    title: 'Cho uống thuốc & bôi gel giảm đau khớp theo chỉ định BS Thú y',
    desc: 'Thực hiện đúng y lệnh thuốc từ Bác sĩ Thú y, tuyệt đối không tự thay đổi liều lượng.'
  },
  {
    id: 'TPL_FEED_PM',
    type: 'FEEDING',
    shift: 'AFTERNOON',
    defaultTime: '18:30',
    shortTitle: 'Cho ăn cỏ Alfalfa & yến mạch tối',
    title: 'Cho ăn cữ tối: Cỏ khô Alfalfa & yến mạch Rolled Oats ngâm',
    desc: 'Cung cấp 5kg cỏ khô và 2kg yến mạch cán hạt đã ngâm nở, bổ sung bột khoáng vi lượng.'
  },
  {
    id: 'TPL_NIGHT_CHECK',
    type: 'CLEANING',
    shift: 'NIGHT',
    defaultTime: '22:00',
    shortTitle: 'Tuần tra an toàn & khóa then đêm',
    title: 'Tuần tra an toàn then cài cửa chuồng & kiểm tra phao nước đêm',
    desc: 'Kiểm tra chốt cài then sắt 2 lớp ô chuồng, kiểm tra nước uống ban đêm và phát hiện dấu hiệu Colic sớm.'
  }
];

// 3. TỦ VẬT TƯ & THỨC ĂN (INVENTORY)
export const INITIAL_INVENTORY = [
  { id: 'INV-01', category: 'FEED', name: 'Cỏ khô Alfalfa Mỹ loại 1', qty: '450 kg', minQty: '200 kg', unit: 'Bao 50kg', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '10/11/2026' },
  { id: 'INV-02', category: 'FEED', name: 'Yến mạch cán nguyên hạt (Rolled Oats)', qty: '180 kg', minQty: '100 kg', unit: 'Bao 25kg', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '08/11/2026' },
  { id: 'INV-03', category: 'BEDDING', name: 'Mùn cưa thông sạch hút ẩm', qty: '12 bao', minQty: '20 bao', unit: 'Bao 40kg', status: 'LOW', statusLabel: 'Sắp hết - Cần nhập', lastRestocked: '05/11/2026' },
  { id: 'INV-04', category: 'BEDDING', name: 'Rơm lúa mì sấy khô cao cấp', qty: '25 kiện', minQty: '15 kiện', unit: 'Kiện ép', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '09/11/2026' },
  { id: 'INV-05', category: 'MEDICAL', name: 'Băng thun quấn chân gân Polo Wrap', qty: '14 cuộn', minQty: '10 cuộn', unit: 'Bộ 4 cuộn', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '01/11/2026' },
  { id: 'INV-06', category: 'MEDICAL', name: 'Ủng đá lạnh phục hồi Cryo Boots', qty: '6 bộ', minQty: '8 bộ', unit: 'Bộ 2 chân', status: 'LOW', statusLabel: 'Cần bổ sung', lastRestocked: '25/10/2026' },
  { id: 'INV-07', category: 'MEDICAL', name: 'Thuốc xịt sát trùng móng Blue Kote', qty: '2 chai', minQty: '5 chai', unit: 'Chai 500ml', status: 'CRITICAL', statusLabel: 'Gần cạn', lastRestocked: '20/10/2026' },
  { id: 'INV-08', category: 'TOOL', name: 'Dao nạo sỏi kẽ móng guốc Hoof Pick', qty: '8 chiếc', minQty: '6 chiếc', unit: 'Cái', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '15/10/2026' },
  { id: 'INV-09', category: 'TOOL', name: 'Lược chải cao su Curry Comb', qty: '10 chiếc', minQty: '6 chiếc', unit: 'Cái', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '15/10/2026' },
  { id: 'INV-10', category: 'FEED', name: 'Bột điện giải chống mất nước Electrolytes', qty: '8 hộp', minQty: '5 hộp', unit: 'Hộp 2kg', status: 'GOOD', statusLabel: 'Đầy đủ', lastRestocked: '02/11/2026' }
];

export const INITIAL_ASSIGNED_HORSES = [];
export const INITIAL_DAILY_TASKS = [];
export const INITIAL_EMERGENCY_ALERTS = [];
export const INITIAL_VET_INSTRUCTIONS = [];

// Helper get & set local storage
export function getGroomData(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return defaultData;
}

export function saveGroomData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// Chuyển đổi một bản ghi phân công được Groom ĐỒNG Ý thành dữ liệu chiến mã đầy đủ cho Groom
export function formatConfirmedHorseForGroom(asgn) {
  const stallCode = asgn.stable ? (asgn.stable.match(/Ô\s*[A-Z0-9]+/i)?.[0] || asgn.stable.split('(')[0].trim()) : 'Ô A1';
  const block = stallCode.includes('B') ? 'Block B' : stallCode.includes('C') ? 'Block C' : 'Block A';
  const ageNum = parseInt(String(asgn.age).replace(/\D/g, ''), 10) || 4;

  return {
    id: asgn.id || asgn.microchip,
    horseId: asgn.microchip || 'MC-VN-2026',
    name: asgn.horseName,
    breed: asgn.breed || 'Thoroughbred thuần chủng',
    age: ageNum,
    gender: asgn.gender || 'Đực (Stallion)',
    color: 'Tiêu chuẩn',
    stall: stallCode,
    block,
    assignedGroom: asgn.groomName || 'Lê Hoàng Nam',
    groomUsername: asgn.groomUsername || 'groom_nam',
    healthStatus: asgn.isLockedByVet ? 'INJURED' : 'FIT',
    healthLabel: asgn.isLockedByVet ? 'Bị chấn thương (Khóa y tế)' : 'Đủ điều kiện sức khỏe',
    lastHealthCheck: '07:30 Sáng nay',
    nextFeeding: '11:30 - Cỏ Alfalfa & Yến mạch ngâm',
    nextTask: '10:00 - Kiểm tra móng & Vệ sinh chuồng',
    weight: '485 kg',
    temp: '38.0°C',
    pulse: '38 bpm',
    trainer: asgn.trainerName || 'HLV Lê Trọng Nghĩa',
    vet: asgn.vetName || 'BS. Nguyễn An',
    owner: asgn.ownerName || 'Chủ sở hữu',
    avatar: asgn.avatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
    notes: `Chiến mã do Chủ sở hữu ${asgn.ownerName || 'Chủ sở hữu'} gửi gắm chăm sóc. Groom đã đồng ý tiếp nhận.`
  };
}

// Sinh danh sách công việc hằng ngày dựa trên các chiến mã Groom ĐÃ ĐỒNG Ý
// Phân bổ đều cho các ca: Ca Sáng (Vũ Tiến Dũng), Ca Chiều & Tối (Nguyễn Thu Thảo) và Chủ nhóm (Lê Hoàng Nam)
// Hỗ trợ theo dõi tiến độ thời gian thực cho: Hôm Qua (YESTERDAY), Hôm Nay (TODAY), Ngày Mai (TOMORROW)
export function generateRealtimeDailyTasks(confirmedHorses = []) {
  if (!confirmedHorses || confirmedHorses.length === 0) {
    return [];
  }

  const tasks = [];

  confirmedHorses.forEach((h, idx) => {
    const stall = h.stall || `Ô A${idx + 1}`;
    const name = h.name || 'Chiến mã';

    // 1. CÔNG VIỆC HÔM NAY (TODAY) - ĐANG THEO TIẾN ĐỘ THỜI GIAN THỰC
    tasks.push(
      // Ca Sáng - Giao cho Vũ Tiến Dũng (Nhân viên Ca Sáng)
      {
        id: `TASK-TODAY-${h.id}-FEED-AM`,
        dateKey: 'TODAY',
        shift: 'MORNING',
        shiftLabel: 'Ca Sáng (05:00 – 13:00)',
        time: '05:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'FEEDING',
        title: `Cho ${name} ăn cỏ khô Alfalfa sáng`,
        desc: `Cung cấp 4kg cỏ Alfalfa loại 1 và kiểm tra phao nước tự động ô ${stall}.`,
        status: 'COMPLETED',
        completedAt: '05:45',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      {
        id: `TASK-TODAY-${h.id}-CLEAN`,
        dateKey: 'TODAY',
        shift: 'MORNING',
        shiftLabel: 'Ca Sáng (05:00 – 13:00)',
        time: '07:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'CLEANING',
        title: `Vệ sinh ô chuồng ${stall} (${name})`,
        desc: 'Cào phân cũ, rắc vôi bột sát trùng và bổ sung đệm lót mùn cưa khô.',
        status: 'COMPLETED',
        completedAt: '07:25',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      // Ca Chiều - Giao cho Nguyễn Thu Thảo (Nhân viên Ca Chiều)
      {
        id: `TASK-TODAY-${h.id}-GROOM`,
        dateKey: 'TODAY',
        shift: 'AFTERNOON',
        shiftLabel: 'Ca Chiều (13:00 – 21:00)',
        time: '14:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'GROOMING',
        title: `Chải lông & Nạo móng ${name} sau tập`,
        desc: 'Dùng lược Curry chải sạch bụi cát, dao Hoof pick nạo sỏi kẽ móng guốc.',
        status: 'IN_PROGRESS',
        startedAt: '14:30',
        groom: 'Nguyễn Thu Thảo',
        groomId: 'groom_thao',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      {
        id: `TASK-TODAY-${h.id}-HEALTH`,
        dateKey: 'TODAY',
        shift: 'AFTERNOON',
        shiftLabel: 'Ca Chiều (13:00 – 21:00)',
        time: '16:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'HEALTH_CHECK',
        title: `Kiểm tra thân nhiệt & Thể trạng ${name}`,
        desc: 'Đo thân nhiệt, quan sát nhịp thở và ghi nhận mức độ thèm ăn.',
        status: 'PENDING',
        groom: 'Nguyễn Thu Thảo',
        groomId: 'groom_thao',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      // Ca Đêm - Giao cho Vũ Tiến Dũng / phân ca đêm
      {
        id: `TASK-TODAY-${h.id}-NIGHT`,
        dateKey: 'TODAY',
        shift: 'NIGHT',
        shiftLabel: 'Ca Đêm (21:00 – 05:00)',
        time: '22:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'CLEANING',
        title: `Tuần tra ô chuồng ${stall} & Khóa then đêm`,
        desc: 'Kiểm tra then cài sắt 2 lớp, ngắt phao nước rò rỉ và quan sát dấu hiệu Colic đêm.',
        status: 'PENDING',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },

      // 2. CÔNG VIỆC HÔM QUA (YESTERDAY)
      // Theo yêu cầu: Nếu hôm qua không làm sẽ KHÔNG cập nhật tiến độ (các việc không làm sẽ ở trạng thái OVERDUE hoặc PENDING)
      {
        id: `TASK-YEST-${h.id}-FEED-AM`,
        dateKey: 'YESTERDAY',
        shift: 'MORNING',
        shiftLabel: 'Ca Sáng (05:00 – 13:00)',
        time: '05:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'FEEDING',
        title: `[Hôm qua] Cho ${name} ăn cỏ khô Alfalfa`,
        desc: 'Cung cấp cỏ Alfalfa cữ sáng.',
        status: 'COMPLETED',
        completedAt: '05:40',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      {
        id: `TASK-YEST-${h.id}-UNFINISHED-CLEAN`,
        dateKey: 'YESTERDAY',
        shift: 'MORNING',
        shiftLabel: 'Ca Sáng (05:00 – 13:00)',
        time: '07:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'CLEANING',
        title: `[Hôm qua] Thay rơm lót chuồng ${stall}`,
        desc: 'Nhiệm vụ hôm qua không có nhân viên làm -> Bị quá hạn, không cập nhật tiến độ.',
        status: 'OVERDUE',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      {
        id: `TASK-YEST-${h.id}-UNFINISHED-VET`,
        dateKey: 'YESTERDAY',
        shift: 'AFTERNOON',
        shiftLabel: 'Ca Chiều (13:00 – 21:00)',
        time: '15:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'VET_CARE',
        title: `[Hôm qua] Chườm lạnh khớp cổ chân ${name}`,
        desc: 'Nhiệm vụ hôm qua bị bỏ qua -> Không cập nhật tiến độ hoàn thành.',
        status: 'OVERDUE',
        groom: 'Nguyễn Thu Thảo',
        groomId: 'groom_thao',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },

      // 3. CÔNG VIỆC NGÀY MAI (TOMORROW) - ĐÃ LÊN LỊCH TRƯỚC BỞI CHỦ NHÓM GROOM
      {
        id: `TASK-TOMORROW-${h.id}-FEED-AM`,
        dateKey: 'TOMORROW',
        shift: 'MORNING',
        shiftLabel: 'Ca Sáng (05:00 – 13:00)',
        time: '05:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'FEEDING',
        title: `[Ngày mai] Cấp cỏ Alfalfa & Kiểm tra phao nước ${name}`,
        desc: 'Lịch định kỳ do Chủ nhóm Groom thiết lập sẵn cho Ca Sáng ngày mai.',
        status: 'PENDING',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      {
        id: `TASK-TOMORROW-${h.id}-GROOM-AM`,
        dateKey: 'TOMORROW',
        shift: 'MORNING',
        shiftLabel: 'Ca Sáng (05:00 – 13:00)',
        time: '08:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'GROOMING',
        title: `[Ngày mai] Chải lông & Nạo móng ${name}`,
        desc: 'Vệ sinh thân thể trước khi đưa ngựa ra đường chạy tập.',
        status: 'PENDING',
        groom: 'Vũ Tiến Dũng',
        groomId: 'groom_dung',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      },
      {
        id: `TASK-TOMORROW-${h.id}-POST-TRAIN`,
        dateKey: 'TOMORROW',
        shift: 'AFTERNOON',
        shiftLabel: 'Ca Chiều (13:00 – 21:00)',
        time: '15:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'POST_TRAIN',
        title: `[Ngày mai] Tắm rửa hạ nhiệt & Phục hồi sau huấn luyện`,
        desc: 'Xịt lạnh gân chân và kiểm tra mạch đập sau buổi chạy tốc độ.',
        status: 'PENDING',
        groom: 'Nguyễn Thu Thảo',
        groomId: 'groom_thao',
        createdBy: 'Lê Hoàng Nam (Chủ nhóm Groom)'
      }
    );
  });

  return tasks;
}

export { STORAGE_KEYS };
