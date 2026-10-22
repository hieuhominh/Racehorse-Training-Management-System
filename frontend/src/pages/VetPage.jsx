import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  getHorsesApi,
  toggleHorseLockApi,
  getIncidentsApi,
  reportIncidentApi
} from '../services/api';

// Minimalist High-End SVG Icons for Veterinary Medical Portal
const IconStethoscope = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

const IconAlert = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSyringe = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 2 4 4" />
    <path d="m17 7 3-3" />
    <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
    <path d="m9 11 4 4" />
    <path d="m5 19-3 3" />
    <path d="m14 4 6 6" />
  </svg>
);

const IconBone = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 10c.7-.7 1.6-1 2.5-1a3.5 3.5 0 1 0-3.5 3.5c0 .9.3 1.8 1 2.5l-6 6c-.7-.7-1.6-1-2.5-1a3.5 3.5 0 1 0 3.5-3.5c0-.9-.3-1.8-1-2.5l6-6z" />
  </svg>
);

const IconShieldLock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
    <path d="M10 11V9a2 2 0 1 1 4 0v2" />
  </svg>
);

const IconClipboardCheck = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

const IconPill = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

// Dữ liệu giải phẫu cơ thể chiến mã (Musculoskeletal Anatomy Zones)
const ANATOMY_PARTS = [
  { id: 'HOOF', nameVi: 'Móng & Guốc (Hoof & Sole)', nameEn: 'Hoof & Sole', risk: 'HIGH', descVi: 'Vùng dễ bị rạn nứt móng, áp xe móng chân hoặc xước guốc khi chạy sân cát', descEn: 'High impact zone prone to hoof cracking, abscess, or bruising from track surfaces' },
  { id: 'FETLOCK', nameVi: 'Gân gót & Khớp cổ chân (Fetlock & Tendon)', nameEn: 'Fetlock Joint & Tendon', risk: 'CRITICAL', descVi: 'Vùng dây chằng treo Suspensory Ligament, nguy cơ giãn gân cấp tính khi bứt tốc', descEn: 'Critical suspensory ligament site prone to acute flexor tendon strain during sprint finish' },
  { id: 'KNEE', nameVi: 'Khớp gối trước (Carpus / Front Knee)', nameEn: 'Carpal Knee Joint', risk: 'MEDIUM', descVi: 'Khớp chịu lực chính khi hạ chân, theo dõi tràn dịch bao hoạt dịch', descEn: 'Primary weight-bearing joint, monitor for synovial effusion or micro-fractures' },
  { id: 'SHOULDER', nameVi: 'Cơ vai & Ngực (Shoulder & Chest)', nameEn: 'Shoulder & Pectoral Muscle', risk: 'LOW', descVi: 'Vùng cơ sải chân, kiểm tra co rút cơ sau bài chạy cự ly dài 2.400m', descEn: 'Stride power muscles, check for post-endurance lactic acid cramping' },
  { id: 'BACK', nameVi: 'Cột sống & Lưng (Thoracolumbar Spine)', nameEn: 'Thoracolumbar Spine', risk: 'MEDIUM', descVi: 'Khung xương chịu tải của Jockey, kiểm tra co thắt cơ lưng', descEn: 'Jockey load bearing region, palpate for thoracic spine spasm or saddle soreness' },
  { id: 'RESPIRATORY', nameVi: 'Hệ hô hấp & Phổi (Respiratory & Lungs)', nameEn: 'Upper Airway & Lungs', risk: 'HIGH', descVi: 'Đánh giá tiếng thở rít, nội soi kiểm tra xuất huyết phổi do gắng sức (EIPH)', descEn: 'Scope for Exercise-Induced Pulmonary Hemorrhage (EIPH) and dorsal displacement' },
  { id: 'GI_TRACT', nameVi: 'Hệ tiêu hóa & Bụng (Colic / Abdomen)', nameEn: 'GI Tract & Colic Screen', risk: 'CRITICAL', descVi: 'Dấu hiệu đau bụng Colic cấp tính, nghe âm nhu động ruột 4 góc bụng', descEn: 'Acute colic auscultation in four quadrants, check for gut hypomotility' }
];

export default function VetPage() {
  const { currentUser, logout } = useAuth();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'anatomy' | 'lockout' | 'vaccines' | 'prescriptions' | 'clearance'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAnatomy, setSelectedAnatomy] = useState(ANATOMY_PARTS[1]); // Mặc định là Fetlock (Gân gót)
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Danh sách chiến mã y tế
  const [horses, setHorses] = useState([
    {
      id: 1,
      microchip: 'MC-VN-2022-001',
      name: 'Hắc Phong',
      breed: 'Thoroughbred',
      stable: 'A3',
      owner: 'Phạm Tiến Thành',
      status: 'WATCH',
      statusText: 'Theo dõi nhịp tim',
      locked: false,
      lockReason: '',
      lastExamDate: '10/10/2026',
      restingHeartRate: '38 bpm',
      tempCelsius: 38.1,
      avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      microchip: 'MC-VN-2021-014',
      name: 'Xích Thố',
      breed: 'Arabian',
      stable: 'A1',
      owner: 'Phạm Tiến Thành',
      status: 'ELIGIBLE',
      statusText: 'Đủ điều kiện thi đấu',
      locked: false,
      lockReason: '',
      lastExamDate: '10/10/2026',
      restingHeartRate: '36 bpm',
      tempCelsius: 37.8,
      avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 3,
      microchip: 'MC-VN-2023-009',
      name: 'Phi Yến',
      breed: 'Thoroughbred',
      stable: 'A5',
      owner: 'Phạm Tiến Thành',
      status: 'INJURED',
      statusText: 'Khóa y tế: Giãn gân',
      locked: true,
      lockReason: 'Giãn gân chân trước trái cấp độ 2 (Left Forelimb Superficial Digital Flexor Tendonitis)',
      lastExamDate: '09/10/2026',
      restingHeartRate: '44 bpm',
      tempCelsius: 38.6,
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 4,
      microchip: 'MC-VN-2022-088',
      name: 'Lôi Chấn',
      breed: 'Quarter Horse',
      stable: 'B2',
      owner: 'Phạm Tiến Thành',
      status: 'QUARANTINE',
      statusText: 'Cách ly theo dõi',
      locked: true,
      lockReason: 'Theo dõi kiểm dịch dịch tễ tại khu cách ly Block B',
      lastExamDate: '08/10/2026',
      restingHeartRate: '40 bpm',
      tempCelsius: 38.2,
      avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 5,
      microchip: 'MC-VN-2024-003',
      name: 'Bạch Long',
      breed: 'Thoroughbred',
      stable: 'A2',
      owner: 'Phạm Tiến Thành',
      status: 'ELIGIBLE',
      statusText: 'Khỏe mạnh',
      locked: false,
      lockReason: '',
      lastExamDate: '10/10/2026',
      restingHeartRate: '37 bpm',
      tempCelsius: 37.9,
      avatar: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  // 2. Danh sách Sự cố y tế lâm sàng (Clinical Incident Queue)
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-9012',
      stallCode: 'A3',
      horseName: 'Hắc Phong',
      chipId: 'MC-VN-2022-001',
      symptoms: ['Ngựa bỏ ăn', 'Có dấu hiệu đau bụng / Sốt'],
      severity: 'HIGH',
      description: 'Hắc Phong bỏ 2/3 khẩu phần cỏ Alfalfa buổi trưa, thở nhanh và dậm chân liên tục. Thân nhiệt 38.8°C, nghi ngờ đau bụng nhẹ (Colic).',
      imageUrl: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Groom Nguyễn Văn Hùng',
      timestamp: '11:45 - 08/10/2026',
      status: 'pending_vet',
      vetDiagnosis: '',
      actionTaken: ''
    },
    {
      id: 'INC-8819',
      stallCode: 'B4',
      horseName: 'Phi Vân',
      chipId: '982-000-348-192-010',
      symptoms: ['Móng bị xước / Rạn guốc'],
      severity: 'MEDIUM',
      description: 'Phát hiện vết rạn móng nhẹ ở guốc sau phải sau buổi tập trên sân cát. Đã làm sạch móng, ngâm đá & chờ Thú y kiểm tra.',
      imageUrl: 'https://images.unsplash.com/photo-1598974357801-cbca10065444?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Groom Phạm Minh Tiến',
      timestamp: '09:15 - 08/10/2026',
      status: 'in_review',
      vetDiagnosis: 'Rạn nứt thành ngoài móng sau phải, chưa chạm tầng sinh móng.',
      actionTaken: 'Băng keo bảo vệ móng + Đặt lịch thợ gọt móng Farrier'
    }
  ]);

  // 3. Sổ tiêm chủng Vaccine & Tẩy giun định kỳ
  const [vaccines, setVaccines] = useState([
    { id: 1, horseName: 'Hắc Phong', vaccineType: 'Cúm ngựa (Equine Influenza)', dueDate: '15/10/2026', status: 'DUE_SOON', dose: '1.0 ml IM', vetInCharge: 'BS Nguyễn An' },
    { id: 2, horseName: 'Xích Thố', vaccineType: 'Uốn ván (Tetanus Toxoid)', dueDate: '20/11/2026', status: 'UP_TO_DATE', dose: '1.0 ml IM', vetInCharge: 'BS Nguyễn An' },
    { id: 3, horseName: 'Phi Yến', vaccineType: 'Tẩy giun Ivermectin Paste', dueDate: '10/10/2026', status: 'OVERDUE', dose: 'Tuýp 6.42g đường uống', vetInCharge: 'BS Nguyễn An' },
    { id: 4, horseName: 'Lôi Chấn', vaccineType: 'Viêm não thể EHV 1 & 4', dueDate: '12/10/2026', status: 'DUE_SOON', dose: '1.5 ml IM', vetInCharge: 'BS Nguyễn An' },
    { id: 5, horseName: 'Bạch Long', vaccineType: 'Kiểm tra móng (Farrier Routine)', dueDate: '18/10/2026', status: 'UP_TO_DATE', dose: 'Gọt & đóng móng nhôm đua', vetInCharge: 'Farrier Trần Văn Vũ' }
  ]);

  // 4. Đơn thuốc & Phác đồ điều trị lâm sàng
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'RX-2026-001',
      horseName: 'Phi Yến',
      stall: 'Ô A5',
      diagnosis: 'Giãn gân trước trái độ 2',
      medications: [
        { name: 'Phenylbutazone 20%', dosage: '10ml tiêm tĩnh mạch IV', frequency: '1 lần/ngày x 5 ngày' },
        { name: 'Gel lạnh giảm đau DMSO + Băng ép Cryotherapy', dosage: 'Bôi ngoài da', frequency: '2 lần/ngày (sáng/tối)' },
        { name: 'Bột bổ sung khớp Glucosamine + MSM', dosage: '30g trộn khẩu phần ăn', frequency: 'Hàng ngày' }
      ],
      restrictions: 'Khóa hoàn toàn bài tập chạy nước rút và tập nặng. Chỉ cho phép đi bộ thả lỏng dắt tay 15 phút/ngày trên mặt đất mềm.',
      date: '09/10/2026',
      status: 'ACTIVE'
    },
    {
      id: 'RX-2026-002',
      horseName: 'Hắc Phong',
      stall: 'Ô A3',
      diagnosis: 'Nghi ngờ kích ứng dạ dày nhẹ (Mild Gastric Distress)',
      medications: [
        { name: 'Omeprazole Equine Paste (GastroGard)', dosage: '1 tuýp đường uống lúc đói', frequency: 'Mỗi sáng x 7 ngày' },
        { name: 'Men vi sinh đường ruột Probiotic Paste', dosage: '15ml', frequency: 'Sau bữa ăn trưa' }
      ],
      restrictions: 'Chia nhỏ khẩu phần ăn làm 4 bữa. Tạm ngưng yến mạch đậm đặc, tăng cỏ khô Alfalfa chất lượng cao.',
      date: '10/10/2026',
      status: 'ACTIVE'
    }
  ]);

  // 5. Cấp chứng nhận y tế thi đấu (Vet Race Clearance)
  const [raceClearanceList, setRaceClearanceList] = useState([
    { id: 1, horseName: 'Xích Thố', raceName: 'Giải Vô địch Quốc gia Đại Nam 2026', distance: '2.400m', date: '25/10/2026', vetStatus: 'CLEARED', heartRateRest: '36 bpm', notes: 'Thể lực hoàn hảo, âm tim chuẩn, không có dấu hiệu phù nề gân.' },
    { id: 2, horseName: 'Bạch Long', raceName: 'Cúp Đua Ngựa Mùa Thu Cự Ly Ngắn', distance: '1.200m', date: '28/10/2026', vetStatus: 'CLEARED', heartRateRest: '37 bpm', notes: 'Đạt chuẩn kiểm định thể lực thú y.' },
    { id: 3, horseName: 'Hắc Phong', raceName: 'Giải Đua Tốc Độ Sân Cát', distance: '1.600m', date: '30/10/2026', vetStatus: 'PENDING_EXAM', heartRateRest: '38 bpm', notes: 'Chờ theo dõi thêm 48h về tiêu hóa trước khi cấp chứng nhận.' },
    { id: 4, horseName: 'Phi Yến', raceName: 'Giải Vô địch Mở Rộng Cup C1', distance: '1.600m', date: '26/10/2026', vetStatus: 'REJECTED_INJURY', heartRateRest: '44 bpm', notes: 'TỪ CHỐI CẤP PHÉP: Đang chịu lệnh Khóa Y Tế do giãn gân chân trái!' }
  ]);

  // Modal Xử lý ca sự cố
  const [selectedIncidentModal, setSelectedIncidentModal] = useState(null);
  const [incidentActionInput, setIncidentActionInput] = useState('');
  const [incidentDiagnosisInput, setIncidentDiagnosisInput] = useState('');

  // Modal Kê đơn thuốc mới
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [newRxData, setNewRxData] = useState({
    horseName: 'Hắc Phong',
    stall: 'Ô A3',
    diagnosis: '',
    medication: '',
    dosage: '',
    frequency: '1 lần/ngày',
    restrictions: 'Cấm tập nặng, theo dõi nhiệt độ hàng ngày.'
  });

  // Modal Khóa Y Tế Khẩn Cấp
  const [lockModalTarget, setLockModalTarget] = useState(null);
  const [lockReasonInput, setLockReasonInput] = useState('');

  // Nạp dữ liệu đồng bộ từ API Backend khi khởi động
  useEffect(() => {
    let isMounted = true;
    getHorsesApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setHorses(prev => {
          if (!Array.isArray(prev)) return prev;
          const apiMap = new Map(res.data.map(h => [h.id, h]));
          return prev.map(h => {
            const apiHorse = apiMap.get(h.id);
            if (apiHorse) {
              return {
                ...h,
                locked: Boolean(apiHorse.locked),
                status: apiHorse.locked ? 'INJURED' : (h.status || 'ELIGIBLE'),
                statusText: apiHorse.locked ? 'Khóa y tế: Thú y cấm tập' : (h.statusText || 'Khỏe mạnh')
              };
            }
            return h;
          });
        });
      }
    }).catch(() => {});

    getIncidentsApi().then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        const sanitized = res.data.map((item, idx) => ({
          id: item.id || `INC-${1000 + idx}`,
          stallCode: item.stallCode || item.stall || 'A1',
          horseName: item.horseName || item.horse || 'Chiến mã',
          chipId: item.chipId || item.microchip || 'N/A',
          symptoms: Array.isArray(item.symptoms) ? item.symptoms : (typeof item.symptoms === 'string' ? [item.symptoms] : ['Theo dõi thể trạng']),
          severity: item.severity || 'HIGH',
          description: item.description || item.note || 'Báo cáo sự cố cần bác sĩ khám nghiệm.',
          imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=600&q=80',
          reportedBy: item.reportedBy || 'Groom phụ trách',
          timestamp: item.timestamp || 'Gần đây',
          status: item.status || 'pending_vet',
          vetDiagnosis: item.vetDiagnosis || '',
          actionTaken: item.actionTaken || ''
        }));
        setIncidents(sanitized);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Xử lý Khóa / Mở khóa Y tế (Quyền phủ quyết Y tế - Medical Safety Veto)
  const handleToggleLock = (horse, customReason = '') => {
    const nextLocked = !horse.locked;
    const reason = customReason || (nextLocked ? 'Khám nghiệm Thú y phát hiện dấu hiệu bất thường, kích hoạt phong tỏa y tế!' : '');

    // Đồng bộ với API Backend
    toggleHorseLockApi(horse.id, nextLocked).catch(() => {});

    setHorses(prev => prev.map(h => {
      if (h.id === horse.id) {
        return {
          ...h,
          locked: nextLocked,
          lockReason: nextLocked ? reason : '',
          status: nextLocked ? 'INJURED' : 'ELIGIBLE',
          statusText: nextLocked ? 'Khóa y tế Thú y' : 'Đủ điều kiện thi đấu'
        };
      }
      return h;
    }));

    // Cập nhật trạng thái phê duyệt giải đua tương ứng
    setRaceClearanceList(prev => prev.map(rc => {
      if (rc.horseName.toLowerCase() === horse.name.toLowerCase()) {
        return {
          ...rc,
          vetStatus: nextLocked ? 'REJECTED_INJURY' : 'CLEARED',
          notes: nextLocked ? `LỆNH KHÓA Y TẾ KÍCH HOẠT: ${reason}` : 'Đã được Bác sĩ Thú y gỡ bỏ lệnh khóa, cho phép thi đấu.'
        };
      }
      return rc;
    }));

    showToast(
      nextLocked
        ? `ĐÃ KÍCH HOẠT KHÓA Y TẾ THÚ Y cho chiến mã ${horse.name}! Toàn bộ bài tập nặng bị phong tỏa.`
        : `ĐÃ MỞ KHÓA Y TẾ cho ${horse.name}. Chiến mã đủ điều kiện trở lại tập luyện!`,
      nextLocked ? 'LỆNH KHÓA AN TOÀN Y TẾ' : 'MỞ KHÓA THI ĐẤU',
      nextLocked ? 'error' : 'info'
    );

    setLockModalTarget(null);
    setLockReasonInput('');
  };

  // Mở modal xác nhận khóa y tế
  const handleOpenLockModal = (horse) => {
    if (horse.locked) {
      // Đang khóa -> Bấm để mở khóa ngay
      handleToggleLock(horse, '');
    } else {
      setLockModalTarget(horse);
      setLockReasonInput('Đau mỏi cơ gân chân sau tập luyện');
    }
  };

  // Tiếp nhận & Cập nhật ca sự cố
  const handleResolveIncident = (e) => {
    e.preventDefault();
    if (!selectedIncidentModal) return;

    setIncidents(prev => prev.map(inc => {
      if (inc.id === selectedIncidentModal.id) {
        return {
          ...inc,
          status: 'resolved',
          vetDiagnosis: incidentDiagnosisInput || 'Bác sĩ thú y đã trực tiếp thăm khám và xử lý tại chuồng.',
          actionTaken: incidentActionInput || 'Đã áp dụng phác đồ điều trị và ổn định thể trạng.'
        };
      }
      return inc;
    }));

    showToast(
      `Đã hoàn tất xử lý ca bệnh ${selectedIncidentModal.id} (${selectedIncidentModal.horseName})`,
      'XỬ LÝ LÂM SÀNG THÀNH CÔNG',
      'info'
    );
    setSelectedIncidentModal(null);
    setIncidentDiagnosisInput('');
    setIncidentActionInput('');
  };

  // Hoàn tất mũi tiêm vaccine 1-chạm
  const handleMarkVaccineDone = (vacId) => {
    setVaccines(prev => prev.map(v => {
      if (v.id === vacId) {
        return { ...v, status: 'UP_TO_DATE', dueDate: '15/04/2027' };
      }
      return v;
    }));
    showToast('Đã xác nhận tiêm chủng & gia hạn lịch tiêm phòng thành công!', 'TIÊM CHỦNG ĐÃ LƯU', 'info');
  };

  // Kê đơn thuốc mới
  const handleCreatePrescription = (e) => {
    e.preventDefault();
    const newRx = {
      id: `RX-2026-00${prescriptions.length + 1}`,
      horseName: newRxData.horseName,
      stall: newRxData.stall,
      diagnosis: newRxData.diagnosis || 'Viêm cơ vận động thể thao',
      medications: [
        { name: newRxData.medication || 'Phenylbutazone Gel', dosage: newRxData.dosage || '10ml', frequency: newRxData.frequency }
      ],
      restrictions: newRxData.restrictions,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'ACTIVE'
    };
    setPrescriptions([newRx, ...prescriptions]);
    showToast(`Đã xuất đơn thuốc điều trị #${newRx.id} cho ${newRx.horseName}`, 'KÊ ĐƠN THÀNH CÔNG', 'info');
    setShowAddRxModal(false);
    setNewRxData({
      horseName: 'Hắc Phong',
      stall: 'Ô A3',
      diagnosis: '',
      medication: '',
      dosage: '',
      frequency: '1 lần/ngày',
      restrictions: 'Cấm tập nặng, theo dõi nhiệt độ hàng ngày.'
    });
  };

  // Ký duyệt y tế cho phép thi đấu (Vet Clearance)
  const handleApproveClearance = (item) => {
    setRaceClearanceList(prev => prev.map(rc => {
      if (rc.id === item.id) {
        return {
          ...rc,
          vetStatus: 'CLEARED',
          notes: `Bác sĩ Thú y ${currentUser?.full_name || 'Nguyễn An'} đã ký số xác nhận: Đủ 100% điều kiện y tế thi đấu.`
        };
      }
      return rc;
    }));
    showToast(`Đã cấp chứng nhận y tế thi đấu cho chiến mã ${item.horseName}!`, 'VET CLEARANCE APPROVED', 'info');
  };

  // Từ chối tư cách thi đấu do rủi ro chấn thương
  const handleRejectClearance = (item) => {
    setRaceClearanceList(prev => prev.map(rc => {
      if (rc.id === item.id) {
        return {
          ...rc,
          vetStatus: 'REJECTED_INJURY',
          notes: `TỪ CHỐI BỞI BÁC SĨ THÚ Y: Phát hiện rủi ro cơ gân khi gắng sức. Đình chỉ thi đấu giải ${item.raceName}.`
        };
      }
      return rc;
    }));
    showToast(`Đã bác bỏ tư cách thi đấu của ${item.horseName} để bảo vệ an toàn sinh mạng chiến mã!`, 'VET VETO ACTIVE', 'warning');
  };

  // Bộ lọc danh sách ngựa
  const filteredHorses = useMemo(() => {
    if (!Array.isArray(horses)) return [];
    return horses.filter(h => {
      if (!h) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = String(h.name || '').toLowerCase();
      const microchip = String(h.microchip || h.chipId || '').toLowerCase();
      const stable = String(h.stable || h.stall || '').toLowerCase();
      return name.includes(q) || microchip.includes(q) || stable.includes(q);
    });
  }, [horses, searchQuery]);

  return (
    <div className="portal-layout">
      {/* Mobile drawer backdrop */}
      <div
        className={`portal-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===================== 1. SIDEBAR NAVIGATION ===================== */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '280px', minWidth: '280px' }}>
        <div className="portal-brand">
          <div className="portal-brand-icon">
            <IconStethoscope size={22} color="#14100A" />
          </div>
          <div className="portal-brand-text">
            <h3>Mã Trường OS</h3>
            <p>Bác sĩ Thú y (Veterinary)</p>
          </div>
        </div>

        <nav className="portal-nav">
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'triage' ? 'active' : ''}`}
            onClick={() => { setActiveTab('triage'); setSidebarOpen(false); }}
            title="Tiếp nhận & Xử lý Sự cố Lâm sàng"
          >
            <span className="portal-nav-icon"><IconAlert size={18} /></span>
            <span className="portal-nav-label">Tiếp nhận sự cố</span>
            {incidents.filter(i => i.status === 'pending_vet').length > 0 && (
              <span className="portal-nav-badge" style={{ background: 'var(--brass)', color: '#0A0D14' }}>
                {incidents.filter(i => i.status === 'pending_vet').length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'anatomy' ? 'active' : ''}`}
            onClick={() => { setActiveTab('anatomy'); setSidebarOpen(false); }}
            title="Bản đồ Giải phẫu Cơ xương khớp"
          >
            <span className="portal-nav-icon"><IconBone size={18} /></span>
            <span className="portal-nav-label">Bản đồ giải phẫu</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'lockout' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lockout'); setSidebarOpen(false); }}
            title="Quyền Khóa Y Tế Thú Y (Medical Safety Veto)"
          >
            <span className="portal-nav-icon"><IconShieldLock size={18} /></span>
            <span className="portal-nav-label">Khóa y tế (Veto)</span>
            <span className="portal-nav-badge">
              {horses.filter(h => h.locked).length} khóa
            </span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'vaccines' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vaccines'); setSidebarOpen(false); }}
            title="Sổ Tiêm Chủng Vaccine & Tẩy Giun Định Kỳ"
          >
            <span className="portal-nav-icon"><IconSyringe size={18} /></span>
            <span className="portal-nav-label">Sổ tiêm chủng</span>
            <span className="portal-nav-badge">{vaccines.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('prescriptions'); setSidebarOpen(false); }}
            title="Đơn Thuốc & Phác Đồ Điều Trị Lâm Sàng (Rx)"
          >
            <span className="portal-nav-icon"><IconPill size={18} /></span>
            <span className="portal-nav-label">Đơn thuốc & Phác đồ</span>
            <span className="portal-nav-badge">{prescriptions.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'clearance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('clearance'); setSidebarOpen(false); }}
            title="Phê Duyệt Y Tế Tham Gia Thi Đấu"
          >
            <span className="portal-nav-icon"><IconClipboardCheck size={18} /></span>
            <span className="portal-nav-label">Phê duyệt thi đấu</span>
          </button>
        </nav>
      </aside>

      {/* ===================== 2. MAIN CONTENT WRAPPER ===================== */}
      <div className="portal-content-wrap">
        {/* TOP BAR */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              type="button"
              className="portal-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở Menu"
            >
              <IconStethoscope size={20} />
            </button>
            <div className="portal-title-box">
              <h2 className="portal-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>CỔNG BÁC SĨ THÚ Y</span>
                <span style={{
                  fontSize: '10.5px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  color: 'var(--brass)',
                  border: '1px solid var(--line-strong)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  VETERINARY MEDICINE
                </span>
              </h2>
              <div className="portal-page-subtitle">
                Veterinary Clinical Hospital & Medical Safety Lockout Protocol
              </div>
            </div>
          </div>

          <div className="portal-topbar-right">
            <ThemeToggle />
            <div className="portal-user-badge">
              <div className="portal-user-avatar">
                BS
              </div>
              <div className="portal-user-info">
                <div className="portal-user-name">{currentUser?.full_name || 'Bác sĩ Nguyễn An'}</div>
                <div className="portal-user-role">Bác sĩ Thú y Trưởng khoa</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="portal-btn-logout"
              title="Đăng xuất khỏi hệ thống"
            >
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="portal-main">
          {/* ========================================================================= */}
          {/* TAB 1: TRIAGE & TIẾP NHẬN SỰ CỐ KHẨN CẤP */}
          {/* ========================================================================= */}
          {activeTab === 'triage' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Tiếp nhận & Xử lý Sự cố Lâm sàng (Clinical Incident Triage)</h2>
                  <p className="pane-desc">Các ca báo động bất thường từ nhân viên Groom và HLV gửi lên theo thời gian thực.</p>
                </div>
              </div>

              {/* Chỉ số nhanh (3 thẻ ngang cân đối chuẩn SaaS Dashboard theo đúng 3 màu chủ đạo) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div className="facility-card" style={{
                  padding: '18px 20px',
                  borderTop: '2px solid var(--brass)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--brass)', textTransform: 'uppercase' }}>
                      CHỜ BÁC SĨ KHÁM GẤP
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brass)', boxShadow: '0 0 8px var(--brass-glow)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brass)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                    {incidents.filter(i => i.status === 'pending_vet').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Cần thăm khám trực tiếp tại ô chuồng
                  </div>
                </div>

                <div className="facility-card" style={{
                  padding: '18px 20px',
                  borderTop: '2px solid var(--line-strong)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--paper)', textTransform: 'uppercase' }}>
                      ĐANG THEO DÕI ĐIỀU TRỊ
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-dim)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                    {incidents.filter(i => i.status === 'in_review').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Có phác đồ chăm sóc ban đầu
                  </div>
                </div>

                <div className="facility-card" style={{
                  padding: '18px 20px',
                  borderTop: '2px solid var(--line)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--paper-dim)', textTransform: 'uppercase' }}>
                      ĐÃ XỬ LÝ ỔN ĐỊNH
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--paper-muted)' }} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--paper)', margin: '8px 0 4px', fontFamily: 'var(--display)' }}>
                    {incidents.filter(i => i.status === 'resolved').length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--paper-dim)' }}>CA</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
                    Bác sĩ Thú y đã ký duyệt hoàn tất
                  </div>
                </div>
              </div>

              {/* Danh sách thẻ sự cố */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '18px' }}>
                {incidents.map((inc) => {
                  const isPending = inc.status === 'pending_vet';
                  return (
                    <div
                      key={inc.id}
                      className="facility-card"
                      style={{
                        borderColor: isPending ? 'var(--brass)' : 'var(--line)',
                        boxShadow: isPending ? '0 0 16px var(--brass-glow)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isPending ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                            color: isPending ? 'var(--brass)' : 'var(--paper-dim)',
                            border: `1px solid ${isPending ? 'var(--brass)' : 'var(--line)'}`,
                            marginRight: '8px'
                          }}>
                            {inc.severity}
                          </span>
                          <b style={{ color: 'var(--paper)', fontSize: '14px' }}>Mã phiếu: {inc.id}</b>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>{inc.timestamp}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                        {inc.imageUrl && (
                          <img
                            src={inc.imageUrl}
                            alt="Ảnh hiện trường"
                            style={{ width: '90px', height: '90px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--line)' }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brass)' }}>
                            {inc.horseName} · <span style={{ color: 'var(--paper)' }}>Ô chuồng {inc.stallCode}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--paper-dim)', margin: '4px 0' }}>
                            Báo cáo bởi: <b>{inc.reportedBy}</b>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {Array.isArray(inc.symptoms) && inc.symptoms.map((sym, idx) => (
                              <span key={idx} style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--paper)' }}>
                                • {sym}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12.5px', color: 'var(--paper)', marginBottom: '14px', lineHeight: '1.45' }}>
                        {inc.description}
                      </div>

                      {inc.vetDiagnosis && (
                        <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '10px 12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '14px' }}>
                          <b style={{ color: 'var(--brass)' }}>Chẩn đoán BS Thú y:</b> {inc.vetDiagnosis}
                          {inc.actionTaken && <div style={{ color: 'var(--paper-dim)', marginTop: '4px' }}>• Xử lý: {inc.actionTaken}</div>}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIncidentModal(inc);
                            setIncidentDiagnosisInput(inc.vetDiagnosis || '');
                            setIncidentActionInput(inc.actionTaken || '');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            background: isPending ? 'var(--brass)' : 'var(--bg-secondary)',
                            color: isPending ? '#000000' : 'var(--paper)',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            cursor: 'pointer'
                          }}
                        >
                          {isPending ? 'Thăm khám & Kê toa' : 'Cập nhật diễn biến'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const matched = horses.find(h => String(h?.name || '').toLowerCase() === String(inc?.horseName || '').toLowerCase());
                            if (matched) handleOpenLockModal(matched);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--paper)',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            cursor: 'pointer'
                          }}
                          title="Kích hoạt lệnh cấm tập nặng ngay lập tức"
                        >
                          Khóa Y Tế
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BẢN ĐỒ GIẢI PHẪU CƠ XƯƠNG KHỚP 3D */}
          {/* ========================================================================= */}
          {activeTab === 'anatomy' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Bản đồ Giải phẫu Cơ xương khớp (Musculoskeletal Anatomy)</h2>
                  <p className="pane-desc">Đánh dấu và theo dõi chính xác các vùng tổn thương, dây chằng và hệ cơ quan chịu tải.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', gap: '20px' }}>
                {/* Khung trực quan hóa các vùng giải phẫu */}
                <div className="facility-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--brass)' }}>
                    Sơ đồ Cơ quan & Vùng Chấn thương (Interactive Hotspots)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ANATOMY_PARTS.map((part) => {
                      const isSelected = selectedAnatomy?.id === part.id;
                      const isHighRisk = part.risk === 'CRITICAL' || part.risk === 'HIGH';

                      return (
                        <div
                          key={part.id}
                          onClick={() => setSelectedAnatomy(part)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? 'var(--brass)' : 'var(--line)'}`,
                            background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? 'var(--brass)' : 'var(--paper)' }}>
                              {part.nameVi}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)', marginTop: '2px' }}>
                              {part.descVi}
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isHighRisk ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-card)',
                            color: isHighRisk ? 'var(--brass)' : 'var(--paper-dim)',
                            border: `1px solid ${isHighRisk ? 'var(--brass)' : 'var(--line)'}`,
                            whiteSpace: 'nowrap',
                            marginLeft: '12px'
                          }}>
                            {part.risk}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chi tiết ca bệnh giải phẫu được chọn */}
                <div className="facility-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--paper)' }}>
                    Hồ sơ Điều trị: <span style={{ color: 'var(--brass)' }}>{selectedAnatomy?.nameVi}</span>
                  </h3>

                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>Mô tả bệnh học thể thao:</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--paper)', margin: '6px 0', lineHeight: '1.45' }}>
                      {selectedAnatomy?.descVi}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--paper-dim)' }}>
                      Tên y khoa quốc tế: <i>{selectedAnatomy?.nameEn}</i>
                    </div>
                  </div>

                  <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px', color: 'var(--paper)' }}>
                    Chiến mã đang ghi nhận tổn thương tại vùng này:
                  </h4>

                  {selectedAnatomy?.id === 'FETLOCK' ? (
                    <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b style={{ color: 'var(--brass)' }}>Phi Yến (Ô A5)</b>
                        <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>MC-VN-2023-009</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '4px' }}>
                        Giãn gân trước trái cấp độ 2 sau bài tập nước rút. Đang áp dụng lệnh Khóa Y Tế & Chườm đá lạnh Cryo.
                      </div>
                    </div>
                  ) : selectedAnatomy?.id === 'GI_TRACT' ? (
                    <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b style={{ color: 'var(--brass)' }}>Hắc Phong (Ô A3)</b>
                        <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>MC-VN-2022-001</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--paper)', marginTop: '4px' }}>
                        Nghi ngờ đau bụng nhẹ (Colic), nghe nhu động ruột giảm. Đang dùng Omeprazole và men vi sinh.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--paper-dim)', fontSize: '13px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--line)' }}>
                      Không có chiến mã nào đang bị tổn thương cấp tính tại vùng giải phẫu này.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRxModal(true);
                      setNewRxData(prev => ({ ...prev, diagnosis: `Tổn thương cơ xương khớp vùng ${selectedAnatomy?.nameVi}` }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--brass)',
                      color: '#000',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '12px'
                    }}
                  >
                    + Lập phác đồ điều trị cho vùng này
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: QUYỀN KHÓA Y TẾ (MEDICAL SAFETY VETO) */}
          {/* ========================================================================= */}
          {activeTab === 'lockout' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Quyền Khóa Y Tế Thú Y (Medical Safety Lockout Protocol)</h2>
                  <p className="pane-desc">
                    Công cụ quyền lực nhất của Bác sĩ Thú y: Ngay lập tức đình chỉ mọi bài tập nặng và cấm thi đấu để bảo vệ sinh mạng chiến mã.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã chip..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      width: '240px'
                    }}
                  />
                </div>
              </div>

              {/* Bảng danh sách khóa y tế */}
              <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '14px 18px' }}>Chiến mã</th>
                      <th style={{ padding: '14px 18px' }}>Mã Chip RFID</th>
                      <th style={{ padding: '14px 18px' }}>Ô Chuồng</th>
                      <th style={{ padding: '14px 18px' }}>Sinh hiệu nghỉ</th>
                      <th style={{ padding: '14px 18px' }}>Tình trạng Khóa Y Tế</th>
                      <th style={{ padding: '14px 18px' }}>Lý do / Phác đồ</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao tác Bác sĩ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHorses.map((h) => {
                      const isLocked = h.locked;

                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--line)', background: isLocked ? 'rgba(212, 175, 55, 0.04)' : 'transparent' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {h.avatar && (
                                <img
                                  src={h.avatar}
                                  alt={h.name}
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: isLocked ? '2px solid var(--brass)' : '1px solid var(--line)' }}
                                />
                              )}
                              <div>
                                <b style={{ fontSize: '14px', color: 'var(--brass)' }}>{h.name}</b>
                                <div style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>{h.breed}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: 'var(--paper)' }}>{h.microchip || h.chipId || 'N/A'}</td>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--paper)' }}>Ô {h.stable || h.stall || 'A1'}</td>
                          <td style={{ padding: '14px 18px', fontSize: '12px' }}>
                            <div>Nhịp tim: <b>{h.restingHeartRate}</b></div>
                            <div>Thân nhiệt: <b>{h.tempCelsius}°C</b></div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              background: isLocked ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                              color: isLocked ? 'var(--brass)' : 'var(--paper-dim)',
                              border: `1px solid ${isLocked ? 'var(--brass)' : 'var(--line)'}`
                            }}>
                              {isLocked ? '🔒 KHÓA Y TẾ (VETO)' : 'ĐỦ ĐIỀU KIỆN (FIT)'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--paper)', maxWidth: '240px' }}>
                            {isLocked ? (
                              <span style={{ color: 'var(--brass)' }}>{h.lockReason || 'Khám nghiệm Thú y ghi nhận chấn thương.'}</span>
                            ) : (
                              <span style={{ color: 'var(--paper-dim)' }}>Sinh hiệu bình thường, không có lệnh cấm.</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenLockModal(h)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                background: isLocked ? 'var(--brass)' : 'var(--bg-secondary)',
                                color: isLocked ? '#0A0D14' : 'var(--paper)',
                                border: isLocked ? 'none' : '1px solid var(--line)'
                              }}
                            >
                              {isLocked ? '🔓 MỞ KHÓA Y TẾ' : '🔒 KHÓA Y TẾ'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SỔ TIÊM CHỦNG VACCINE & TẨY GIUN */}
          {/* ========================================================================= */}
          {activeTab === 'vaccines' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Sổ Tiêm Chủng Vaccine & Chăm Sóc Định Kỳ (Preventive Medicine)</h2>
                  <p className="pane-desc">Đếm ngược lịch tiêm phòng dịch tễ, tẩy giun và chu kỳ gọt móng theo chuẩn FEI quốc tế.</p>
                </div>
              </div>

              <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '14px 18px' }}>Chiến mã</th>
                      <th style={{ padding: '14px 18px' }}>Loại Vaccine / Dịch vụ</th>
                      <th style={{ padding: '14px 18px' }}>Liều lượng chỉ định</th>
                      <th style={{ padding: '14px 18px' }}>Hạn tiêm kế tiếp</th>
                      <th style={{ padding: '14px 18px' }}>Tình trạng</th>
                      <th style={{ padding: '14px 18px' }}>Bác sĩ phụ trách</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccines.map((v) => {
                      const isOverdue = v.status === 'OVERDUE';
                      const isDueSoon = v.status === 'DUE_SOON';
                      const needsAttention = isOverdue || isDueSoon;
                      const statusText = isOverdue ? 'QUÁ HẠN TIÊM' : isDueSoon ? 'SẮP ĐẾN HẠN' : 'ĐÃ HOÀN TẤT';

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brass)' }}>{v.horseName}</td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--paper)' }}>{v.vaccineType}</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{v.dose}</td>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: needsAttention ? 'var(--brass)' : 'var(--paper)' }}>{v.dueDate}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: needsAttention ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                              color: needsAttention ? 'var(--brass)' : 'var(--paper-dim)',
                              border: `1px solid ${needsAttention ? 'var(--brass)' : 'var(--line)'}`
                            }}>
                              {statusText}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{v.vetInCharge}</td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            {v.status !== 'UP_TO_DATE' ? (
                              <button
                                type="button"
                                onClick={() => handleMarkVaccineDone(v.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: 'var(--brass)',
                                  color: '#000',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Xác nhận đã tiêm
                              </button>
                            ) : (
                              <span style={{ color: 'var(--paper-dim)', fontSize: '12px', fontWeight: 600 }}>✓ Hợp lệ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ĐƠN THUỐC & PHÁC ĐỒ ĐIỀU TRỊ */}
          {/* ========================================================================= */}
          {activeTab === 'prescriptions' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Đơn Thuốc & Phác Đồ Điều Trị (Clinical Prescriptions - Rx)</h2>
                  <p className="pane-desc">Quản lý các loại thuốc đặc trị, kháng viêm, điện giải và phác đồ vật lý trị liệu.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRxModal(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    background: 'var(--brass)',
                    color: '#000',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + Kê đơn thuốc mới
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="facility-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brass)', border: '1px solid var(--line-strong)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          {rx.id}
                        </span>
                        <b style={{ fontSize: '16px', color: 'var(--brass)' }}>{rx.horseName}</b>
                        <span style={{ color: 'var(--paper-dim)', fontSize: '13px' }}>({rx.stall})</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>Ngày kê toa: {rx.date}</span>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ color: 'var(--paper-dim)', fontSize: '13px' }}>Chẩn đoán y khoa: </span>
                      <b style={{ color: 'var(--paper)', fontSize: '13.5px' }}>{rx.diagnosis}</b>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--paper)', marginBottom: '8px' }}>DANH MỤC THUỐC & LIỀU DÙNG:</div>
                      {Array.isArray(rx.medications) && rx.medications.map((m, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '4px 0', borderBottom: idx !== rx.medications.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                          <b style={{ color: 'var(--paper)' }}>{idx + 1}. {m.name}</b>
                          <span style={{ color: 'var(--paper-dim)' }}>Liều: {m.dosage} ({m.frequency})</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--paper)', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '10px 12px', borderRadius: '6px' }}>
                      ⚠️ <b>Chế độ vận động & hạn chế:</b> {rx.restrictions}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PHÊ DUYỆT Y TẾ THI ĐẤU (VET CLEARANCE) */}
          {/* ========================================================================= */}
          {activeTab === 'clearance' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Phê Duyệt Y Tế Thi Đấu (Vet Race Clearance)</h2>
                  <p className="pane-desc">
                    Bác sĩ Thú y thực hiện kiểm định thể lực cuối cùng trước khi cấp phép cho chiến mã bước vào ngày thi đấu chính thức.
                  </p>
                </div>
              </div>

              <div className="facility-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--line)', color: 'var(--paper-dim)' }}>
                      <th style={{ padding: '14px 18px' }}>Chiến mã</th>
                      <th style={{ padding: '14px 18px' }}>Giải Đua Đăng Ký</th>
                      <th style={{ padding: '14px 18px' }}>Cự ly</th>
                      <th style={{ padding: '14px 18px' }}>Ngày đua</th>
                      <th style={{ padding: '14px 18px' }}>Trạng thái Phê duyệt</th>
                      <th style={{ padding: '14px 18px' }}>Kết luận Bác sĩ Thú y</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raceClearanceList.map((rc) => {
                      const isCleared = rc.vetStatus === 'CLEARED';
                      const isRejected = rc.vetStatus === 'REJECTED_INJURY';
                      const isPending = !isCleared && !isRejected;
                      const statusLabel = isCleared ? 'ĐÃ ĐƯỢC CẤP PHÉP' : isRejected ? 'BÁC BỎ DO CHẤN THƯƠNG' : 'CHỜ KHÁM LÂM SÀNG';

                      return (
                        <tr key={rc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brass)' }}>{rc.horseName}</td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--paper)' }}>{rc.raceName}</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{rc.distance}</td>
                          <td style={{ padding: '14px 18px', color: 'var(--paper-dim)' }}>{rc.date}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: isPending ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-secondary)',
                              color: isPending ? 'var(--brass)' : 'var(--paper-dim)',
                              border: `1px solid ${isPending ? 'var(--brass)' : 'var(--line)'}`
                            }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--paper)', maxWidth: '280px' }}>
                            {rc.notes}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleApproveClearance(rc)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  background: 'var(--brass)',
                                  color: '#0A0D14',
                                  border: 'none',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '11.5px'
                                }}
                              >
                                Cấp phép
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectClearance(rc)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--paper)',
                                  border: '1px solid var(--line)',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontSize: '11.5px'
                                }}
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: XỬ LÝ CA SỰ CỐ & THĂM KHÁM LÂM SÀNG */}
      {/* ========================================================================= */}
      {selectedIncidentModal && (
        <div className="modal-overlay" onClick={() => setSelectedIncidentModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '90%' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', color: 'var(--brass)' }}>
              Thăm khám & Kê đơn Sự cố: {selectedIncidentModal.id}
            </h3>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px', fontSize: '13px' }}>
              <div>Chiến mã: <b style={{ color: 'var(--paper)' }}>{selectedIncidentModal.horseName}</b> (Ô {selectedIncidentModal.stallCode})</div>
              <div>Báo cáo bởi: <b>{selectedIncidentModal.reportedBy}</b> lúc {selectedIncidentModal.timestamp}</div>
              <div style={{ marginTop: '6px', color: 'var(--paper-dim)' }}>{selectedIncidentModal.description}</div>
            </div>

            <form onSubmit={handleResolveIncident}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px' }}>
                  Chẩn đoán lâm sàng của Bác sĩ Thú y:
                </label>
                <textarea
                  rows="3"
                  value={incidentDiagnosisInput}
                  onChange={(e) => setIncidentDiagnosisInput(e.target.value)}
                  placeholder="Ví dụ: Đau bụng nhẹ do ăn quá nhanh, gõ nghe âm vang vùng manh tràng..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--paper-dim)', marginBottom: '6px' }}>
                  Biện pháp xử lý & Phác đồ điều trị:
                </label>
                <textarea
                  rows="2"
                  value={incidentActionInput}
                  onChange={(e) => setIncidentActionInput(e.target.value)}
                  placeholder="Ví dụ: Tiêm giảm đau chống co thắt Buscopan 20ml, cho nhịn ăn tinh 12h, ngâm chân đá lạnh..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--paper)',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedIncidentModal(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', color: 'var(--paper-dim)', border: '1px solid var(--line)', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: 'var(--brass)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Lưu & Hoàn tất ca khám
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KHÓA AN TOÀN Y TẾ (COMPACT & CLEAN) */}
      {/* ========================================================================= */}
      {lockModalTarget && (
        <div className="modal-overlay" onClick={() => setLockModalTarget(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '90%',
              padding: '20px 22px',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔒 Khóa Y Tế · {lockModalTarget.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--paper-dim)', fontWeight: 600 }}>Ô {lockModalTarget.stable}</span>
              </h3>
              <button
                type="button"
                onClick={() => setLockModalTarget(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--paper-dim)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Đình chỉ tập luyện và cấm thi đấu ngay lập tức.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--paper)', marginBottom: '6px' }}>
                Lý do khóa:
              </label>
              <textarea
                rows="2"
                value={lockReasonInput}
                onChange={(e) => setLockReasonInput(e.target.value)}
                placeholder="Nhập lý do chấn thương hoặc cách ly..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--paper)',
                  fontFamily: 'inherit',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
                  resize: 'none'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setLockModalTarget(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--paper-dim)',
                  border: '1px solid var(--line)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleToggleLock(lockModalTarget, lockReasonInput)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  background: 'var(--brass)',
                  color: '#0A0D14',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Xác nhận khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KÊ ĐƠN THUỐC MỚI */}
      {/* ========================================================================= */}
      {showAddRxModal && (
        <div className="modal-overlay" onClick={() => setShowAddRxModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--brass)' }}>
              Kê Đơn Thuốc & Phác Đồ Điều Trị Mới (Rx)
            </h3>

            <form onSubmit={handleCreatePrescription}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px' }}>Chiến mã:</label>
                  <select
                    value={newRxData.horseName}
                    onChange={(e) => {
                      const h = horses.find(item => item.name === e.target.value);
                      setNewRxData({ ...newRxData, horseName: e.target.value, stall: h ? `Ô ${h.stable}` : 'Ô A1' });
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg-secondary)', color: 'var(--paper)' }}
                  >
                    {horses.map(h => (
                      <option key={h.id} value={h.name}>{h.name} (Ô {h.stable})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px' }}>Tên thuốc / Chế phẩm:</label>
                  <input
                    type="text"
                    value={newRxData.medication}
                    onChange={(e) => setNewRxData({ ...newRxData, medication: e.target.value })}
                    placeholder="VD: Phenylbutazone 20%"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg-secondary)', color: 'var(--paper)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px' }}>Chẩn đoán:</label>
                <input
                  type="text"
                  value={newRxData.diagnosis}
                  onChange={(e) => setNewRxData({ ...newRxData, diagnosis: e.target.value })}
                  placeholder="VD: Viêm màng hoạt dịch khớp gối trái"
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg-secondary)', color: 'var(--paper)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px' }}>Liều dùng:</label>
                  <input
                    type="text"
                    value={newRxData.dosage}
                    onChange={(e) => setNewRxData({ ...newRxData, dosage: e.target.value })}
                    placeholder="VD: 10ml tiêm bắp"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg-secondary)', color: 'var(--paper)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px' }}>Tần suất:</label>
                  <select
                    value={newRxData.frequency}
                    onChange={(e) => setNewRxData({ ...newRxData, frequency: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg-secondary)', color: 'var(--paper)' }}
                  >
                    <option value="1 lần/ngày">1 lần/ngày</option>
                    <option value="2 lần/ngày (sáng/tối)">2 lần/ngày (sáng/tối)</option>
                    <option value="3 lần/ngày">3 lần/ngày</option>
                    <option value="Cách ngày 1 lần">Cách ngày 1 lần</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--paper-dim)', marginBottom: '4px' }}>Chế độ vận động & Lưu ý:</label>
                <textarea
                  rows="2"
                  value={newRxData.restrictions}
                  onChange={(e) => setNewRxData({ ...newRxData, restrictions: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg-secondary)', color: 'var(--paper)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddRxModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', color: 'var(--paper-dim)', border: '1px solid var(--line)', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: 'var(--brass)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Lưu & Xuất Đơn Thuốc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
