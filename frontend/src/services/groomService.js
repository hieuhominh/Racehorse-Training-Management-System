// Dịch vụ dữ liệu và quản lý nghiệp vụ cho Cổng Groom (Nhân viên chăm sóc ngựa)
// Tuân thủ nghiêm ngặt các nguyên tắc phân quyền và giới hạn của Groom:
// 1. Groom được quan sát, ghi nhận và báo cáo.
// 2. Groom KHÔNG ĐƯỢC tự chẩn đoán bệnh, không kê đơn, không chỉnh sửa bệnh án chính thức.
// 3. Groom KHÔNG ĐƯỢC tự thay đổi trạng thái sức khỏe chính thức hay tự mở khóa huấn luyện.

const STORAGE_KEYS = {
  TASKS: 'matruong_groom_tasks',
  HORSES: 'matruong_groom_horses',
  ALERTS: 'matruong_groom_alerts',
  VET_INSTRUCTIONS: 'matruong_groom_vet_instructions',
  INCIDENTS: 'matruong_groom_incidents',
  INVENTORY: 'matruong_groom_inventory',
  DAILY_REPORTS: 'matruong_groom_daily_reports'
};

// 1. DANH SÁCH CHIẾN MÃ ĐƯỢC PHÂN CÔNG (Khởi tạo rỗng - CHỈ đồng bộ từ Chủ sở hữu gửi gắm và Groom đồng ý)
export const INITIAL_ASSIGNED_HORSES = [];

// 2. TỔNG CỘNG CÔNG VIỆC TRONG NGÀY (Khởi tạo rỗng - Sinh tự động theo chiến mã Groom đã đồng ý)
export const INITIAL_DAILY_TASKS = [];

// 3. DANH SÁCH CẢNH BÁO QUAN TRỌNG (Khởi tạo rỗng - Chỉ hiển thị cho các chiến mã Groom ĐÃ ĐỒNG Ý)
export const INITIAL_EMERGENCY_ALERTS = [];

// 4. DANH SÁCH Y LỆNH TỪ BÁC SĨ THÚ Y GIAO CHO GROOM (Khởi tạo rỗng - Chỉ theo y lệnh của ngựa Groom phục vụ)
export const INITIAL_VET_INSTRUCTIONS = [];

// 5. TỦ VẬT TƯ & THỨC ĂN (INVENTORY)
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

// Helper get & set local storage
export function getGroomData(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
export function generateRealtimeDailyTasks(confirmedHorses = []) {
  if (!confirmedHorses || confirmedHorses.length === 0) {
    return [];
  }

  const tasks = [];
  confirmedHorses.forEach((h, idx) => {
    const stall = h.stall || `Ô A${idx + 1}`;
    const name = h.name || 'Chiến mã';

    tasks.push(
      {
        id: `TASK-${h.id}-FEED-AM`,
        time: '05:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'FEEDING',
        title: `Cho ${name} ăn cỏ khô Alfalfa sáng`,
        desc: `Cung cấp 4kg cỏ Alfalfa loại 1 và kiểm tra phao nước tự động ô ${stall}.`,
        status: 'COMPLETED',
        completedAt: '05:45',
        groom: h.assignedGroom || 'Lê Hoàng Nam'
      },
      {
        id: `TASK-${h.id}-CLEAN`,
        time: '07:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'CLEANING',
        title: `Vệ sinh ô chuồng ${stall} (${name})`,
        desc: 'Cào phân cũ, rắc vôi bột sát trùng và bổ sung đệm lót mùn cưa khô.',
        status: 'COMPLETED',
        completedAt: '07:25',
        groom: h.assignedGroom || 'Lê Hoàng Nam'
      },
      {
        id: `TASK-${h.id}-GROOM`,
        time: '08:30',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'GROOMING',
        title: `Chải lông & Nạo móng ${name}`,
        desc: 'Dùng lược Curry chải sạch bụi cát, dao Hoof pick nạo sỏi kẽ móng guốc.',
        status: 'IN_PROGRESS',
        startedAt: '08:30',
        groom: h.assignedGroom || 'Lê Hoàng Nam'
      },
      {
        id: `TASK-${h.id}-HEALTH`,
        time: '10:00',
        horseId: h.id,
        horseName: name,
        stall,
        type: 'HEALTH_CHECK',
        title: `Kiểm tra thân nhiệt & Thể trạng ${name}`,
        desc: 'Đo thân nhiệt, quan sát nhịp thở và ghi nhận mức độ thèm ăn.',
        status: 'PENDING',
        groom: h.assignedGroom || 'Lê Hoàng Nam'
      }
    );
  });

  return tasks;
}

export { STORAGE_KEYS };

