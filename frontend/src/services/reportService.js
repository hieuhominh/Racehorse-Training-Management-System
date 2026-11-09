// Quản lý hệ thống Khiếu nại & Báo cáo Nhân sự (Huấn Luyện Viên, Bác Sĩ Thú Y, Nhân Viên Chăm Sóc)
// Cho phép Chủ sở hữu gửi phản ánh/khiếu nại, và Ban Quản Trị (Admin) tiếp nhận, thẩm tra, phản hồi và xử lý kỷ luật.
import { addSystemNotification } from './notificationService';
import {
  getPersonnelReportsApi,
  createPersonnelReportApi,
  updateReportAdminReviewApi,
  deletePersonnelReportApi
} from './api';

const STORAGE_KEY = 'matruong_personnel_reports';
const EVENT_NAME = 'matruong_personnel_reports_updated';

export const REPORT_TARGET_ROLES = {
  TRAINER: { id: 'TRAINER', label: 'Huấn Luyện Viên', icon: '🏇', color: '#D4AF37' },
  VET: { id: 'VET', label: 'Bác Sĩ Thú Y', icon: '🩺', color: '#10B981' },
  CARETAKER: { id: 'CARETAKER', label: 'Nhân Viên Chăm Sóc / Nài Ngựa', icon: '🌾', color: '#3B82F6' }
};

export const PREDEFINED_PERSONNEL = [
  // Huấn luyện viên
  { id: 'trainer_truong', role: 'TRAINER', name: 'Trần Văn Hùng', title: 'HLV Trưởng - Cự ly Dài & Tổng thể', phone: '0903.112.334', block: 'Trường đua chính' },
  { id: 'trainer_nghia', role: 'TRAINER', name: 'Lê Trọng Nghĩa', title: 'HLV Chuyên Cự Ly Dài & Sân Cỏ', phone: '0912.445.667', block: 'Bãi tập sân cỏ tự nhiên' },
  { id: 'trainer_anh', role: 'TRAINER', name: 'Phạm Quốc Anh', title: 'HLV Nước Rút 400m & Sân Cát', phone: '0988.776.554', block: 'Bãi tập sân cát tốc độ' },

  // Bác sĩ Thú y
  { id: 'vet_mai', role: 'VET', name: 'BS. Nguyễn Thị Mai', title: 'Trưởng khoa Thú y & Chẩn đoán hình ảnh', phone: '0934.556.778', block: 'Bệnh viện thú y trung tâm' },
  { id: 'vet_long', role: 'VET', name: 'BS. Vũ Hoàng Long', title: 'Chuyên gia Cơ - Xương - Khớp & Chấn thương', phone: '0977.889.900', block: 'Phòng chụp X-quang & Viễn trắc' },
  { id: 'vet_tri', role: 'VET', name: 'BS. Đỗ Minh Trí', title: 'Chuyên gia Dinh dưỡng & Kiểm soát Doping', phone: '0908.223.445', block: 'Trung tâm xét nghiệm sinh hóa' },

  // Nhân viên chăm sóc / Nài ngựa
  { id: 'care_bay', role: 'CARETAKER', name: 'Nguyễn Văn Bảy', title: 'Trưởng nhóm Chăm sóc Block A (Vệ sinh & Tắm ngựa)', phone: '0922.334.455', block: 'Chuồng Block A' },
  { id: 'care_lanh', role: 'CARETAKER', name: 'Trần Thị Lành', title: 'Nhân viên Dinh dưỡng & Khẩu phần ăn Block B', phone: '0944.556.677', block: 'Chuồng Block B' },
  { id: 'care_kien', role: 'CARETAKER', name: 'Lê Văn Kiên', title: 'Nài tập dạo & Chăm sóc móng guốc Block C', phone: '0966.778.899', block: 'Chuồng Block C' },
  { id: 'care_duc', role: 'CARETAKER', name: 'Hoàng Văn Đức', title: 'Nhân viên Phục hồi chức năng & Thủy liệu pháp', phone: '0918.990.112', block: 'Khu hồ bơi & Spa chiến mã' }
];

export const REPORT_CATEGORIES = [
  'Thái độ phục vụ & Ứng xử thiếu chuẩn mực',
  'Vi phạm giờ giấc, trễ hẹn hoặc tự ý hủy buổi tập',
  'Kỹ thuật huấn luyện kém, ngựa có dấu hiệu quá tải',
  'Thiếu trách nhiệm khám chữa, chậm trễ y tế',
  'Vệ sinh ô chuồng ẩm mốc, khẩu phần dinh dưỡng kém',
  'Nghi vấn lạm dụng roi vọt hoặc vi phạm an toàn',
  'Không báo cáo minh bạch chỉ số viễn trắc',
  'Bất cập và vi phạm nội quy khác'
];

export const REPORT_SEVERITIES = [
  { id: 'LOW', label: 'Thông thường / Góp ý xây dựng', color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'MEDIUM', label: 'Cần chấn chỉnh & Yêu cầu giải trình', color: '#F59E0B', badgeBg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'HIGH', label: 'Nghiêm trọng (Ảnh hưởng sức khỏe chiến mã)', color: '#EF4444', badgeBg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'CRITICAL', label: 'Khẩn cấp (Yêu cầu đình chỉ & lập biên bản)', color: '#DC2626', badgeBg: 'rgba(220, 38, 38, 0.2)' }
];

export const REPORT_STATUSES = [
  { id: 'PENDING', label: 'Chờ Admin tiếp nhận', color: '#F59E0B', badgeBg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'INVESTIGATING', label: 'Đang thẩm tra & Xác minh', color: '#3B82F6', badgeBg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'RESOLVED', label: 'Đã giải quyết & Xử lý kỷ luật', color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'DISMISSED', label: 'Bác bỏ (Không đủ cơ sở)', color: '#6B7280', badgeBg: 'rgba(107, 114, 128, 0.15)' }
];

let isSyncing = false;

/**
 * Lấy danh sách báo cáo khiếu nại (đồng bộ tức thì từ cache, tự động cập nhật nền từ API)
 */
export function getPersonnelReports() {
  let cached = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cached = parsed.filter(r => r && r.id !== 1730001001 && r.id !== 1730001002 && r.id !== 1730001003);
      }
    }
  } catch {}

  // Tự động tải từ API backend nếu chưa đồng bộ
  if (!isSyncing && typeof window !== 'undefined') {
    isSyncing = true;
    getPersonnelReportsApi().then(apiList => {
      isSyncing = false;
      if (Array.isArray(apiList) && apiList.length > 0) {
        const rawLocal = localStorage.getItem(STORAGE_KEY);
        const localList = rawLocal ? JSON.parse(rawLocal) : [];
        // Gộp thông minh bảo toàn dữ liệu
        const mergedMap = new Map();
        apiList.forEach(r => mergedMap.set(String(r.id), r));
        localList.forEach(r => {
          if (!mergedMap.has(String(r.id))) {
            mergedMap.set(String(r.id), r);
          }
        });
        const mergedList = Array.from(mergedMap.values());
        if (JSON.stringify(mergedList) !== rawLocal) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
          window.dispatchEvent(new Event(EVENT_NAME));
        }
      }
    }).catch(() => {
      isSyncing = false;
    });
  }

  return cached;
}

/**
 * Lấy danh sách báo cáo bất đồng bộ trực tiếp từ API
 */
export async function fetchPersonnelReportsAsync(ownerKey = '') {
  const data = await getPersonnelReportsApi(ownerKey);
  if (Array.isArray(data)) {
    savePersonnelReports(data);
  }
  return data;
}

/**
 * Lưu danh sách báo cáo cục bộ và phát sự kiện đồng bộ
 */
export function savePersonnelReports(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_NAME));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving personnel reports:', err);
  }
}

/**
 * Chủ sở hữu tạo báo cáo / khiếu nại nhân sự (Gọi API và đồng bộ hệ thống)
 */
export function createPersonnelReport({
  ownerUser,
  targetRole,
  targetPersonnelId,
  horse,
  category,
  severity,
  title,
  content,
  evidenceNote
}) {
  const personnel = PREDEFINED_PERSONNEL.find(p => p.id === targetPersonnelId) || {
    name: 'Nhân sự mã trường',
    title: 'Cán bộ phụ trách',
    id: targetPersonnelId
  };

  const ownerKey = (ownerUser?.username || ownerUser?.email || String(ownerUser?.user_id || 'owner')).toLowerCase();
  const ownerName = ownerUser?.full_name || 'Chủ sở hữu chiến mã';
  const ownerPhone = ownerUser?.phone || '0908.xxx.xxx';

  const newReport = {
    id: Date.now(),
    ownerName,
    ownerKey,
    ownerPhone,
    targetRole, // 'TRAINER' | 'VET' | 'CARETAKER'
    targetPersonnelId: personnel.id,
    targetName: personnel.name,
    targetTitle: personnel.title,
    horseId: horse?.id || null,
    horseName: horse?.name || 'Chiến mã phụ trách',
    stall: horse?.stable || 'Khu chuồng trại',
    category: category || 'Thái độ phục vụ & Ứng xử thiếu chuẩn mực',
    severity: severity || 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    title: title.trim(),
    content: content.trim(),
    evidenceNote: evidenceNote ? evidenceNote.trim() : '',
    status: 'PENDING', // 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
    createdAt: new Date().toLocaleString('vi-VN'),
    adminNotes: '',
    adminAction: '',
    adminFeedback: '',
    resolvedBy: null,
    resolvedAt: null
  };

  // Cập nhật local state ngay
  const list = getPersonnelReports();
  const updatedList = [newReport, ...list];
  savePersonnelReports(updatedList);

  // Đẩy lên Backend API
  createPersonnelReportApi(newReport).catch(err => {
    console.warn('API report sync notice (cached locally):', err);
  });

  // Phát thông báo khẩn tới Admin
  try {
    addSystemNotification({
      type: 'PERSONNEL_REPORT_SUBMITTED',
      title: `KHIẾU NẠI MỚI: BÁO CÁO ${REPORT_TARGET_ROLES[targetRole]?.label.toUpperCase()}`,
      content: `Chủ sở hữu ${ownerName} đã gửi báo cáo khiếu nại đối với ${REPORT_TARGET_ROLES[targetRole]?.label} "${personnel.name}" (Chiến mã: ${newReport.horseName}). Tiêu đề: "${newReport.title}". Vui lòng thẩm tra và xử lý!`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      recipientRoles: ['ADMIN', 'ALL'],
      reportId: newReport.id
    });
  } catch (err) {
    console.error('Error adding admin notification for report:', err);
  }

  return { success: true, report: newReport };
}

/**
 * Admin tiếp nhận, cập nhật thẩm tra và giải quyết báo cáo (Gọi API và thông báo)
 */
export function updateReportAdminReview(reportId, {
  status,
  adminNotes,
  adminAction,
  adminFeedback,
  adminUser
}) {
  const list = getPersonnelReports();
  const index = list.findIndex(r => String(r.id) === String(reportId));
  if (index === -1) {
    return { success: false, error: 'Không tìm thấy khiếu nại cần xử lý.' };
  }

  const target = list[index];
  const nowStr = new Date().toLocaleString('vi-VN');

  const updatedReport = {
    ...target,
    status: status || target.status,
    adminNotes: adminNotes !== undefined ? adminNotes : target.adminNotes,
    adminAction: adminAction !== undefined ? adminAction : target.adminAction,
    adminFeedback: adminFeedback !== undefined ? adminFeedback : target.adminFeedback,
    resolvedBy: adminUser?.username || 'admin',
    resolvedAt: (status === 'RESOLVED' || status === 'DISMISSED') ? nowStr : target.resolvedAt
  };

  list[index] = updatedReport;
  savePersonnelReports(list);

  // Cập nhật lên Backend API
  updateReportAdminReviewApi(reportId, {
    status: updatedReport.status,
    adminNotes: updatedReport.adminNotes,
    adminAction: updatedReport.adminAction,
    adminFeedback: updatedReport.adminFeedback,
    adminUser
  }).catch(err => {
    console.warn('API review sync notice (cached locally):', err);
  });

  // Gửi thông báo kết quả thẩm tra đến Chủ sở hữu
  try {
    const statusText = status === 'RESOLVED'
      ? 'ĐÃ GIẢI QUYẾT & XỬ LÝ'
      : status === 'INVESTIGATING'
      ? 'ĐANG TIẾN HÀNH THẨM TRA'
      : status === 'DISMISSED'
      ? 'ĐÃ PHẢN HỒI KẾT LUẬN'
      : 'ĐÃ TIẾP NHẬN';

    addSystemNotification({
      type: 'PERSONNEL_REPORT_UPDATED',
      title: `ADMIN ${statusText} KHIẾU NẠI VỀ ${target.targetName.toUpperCase()}`,
      content: `Ban Quản Trị đã xử lý báo cáo của bạn về ${target.targetTitle} "${target.targetName}". Kết luận phản hồi: "${updatedReport.adminFeedback || updatedReport.adminAction || 'Đã ghi nhận và tiến hành chấn chỉnh'}"`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      ownerKey: target.ownerKey,
      reportId: target.id
    });
  } catch (err) {}

  return { success: true, report: updatedReport };
}

/**
 * Admin xóa báo cáo nếu là spam hoặc đã xử lý lưu trữ (Gọi API và cập nhật local)
 */
export function deletePersonnelReport(reportId) {
  const list = getPersonnelReports();
  const nextList = list.filter(r => String(r.id) !== String(reportId));
  savePersonnelReports(nextList);

  deletePersonnelReportApi(reportId).catch(err => {
    console.warn('API delete report notice (cached locally):', err);
  });

  return nextList;
}
