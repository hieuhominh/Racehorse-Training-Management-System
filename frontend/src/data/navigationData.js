export const megaMenusData = [
  {
    id: 'mega-1',
    label: 'Hồ sơ ngựa',
    badge: 'BẮT BUỘC',
    fno: '1',
    title: 'Hồ sơ & lý lịch ngựa',
    subtitle: 'Horse Profile & Pedigree',
    description: 'Khai sinh hồ sơ một chiến mã và giữ mọi dữ liệu huấn luyện, y tế, thi đấu về sau móc vào đúng một mã định danh.',
    ctaText: 'Mở danh sách ngựa',
    ctaLink: '/ho-so-ngua',
    links: [
      { title: 'Danh sách & Mã Chip', desc: 'Lọc theo mã chip RFID', link: '/ho-so-ngua' },
      { title: 'Cây dòng dõi 3 đời', desc: 'Sire, Dam & Grandparents', link: '/ho-so-ngua' },
      { title: 'Chủ sở hữu & Tỉ lệ', desc: 'Gán ngựa cho chủ và tỉ lệ sở hữu', link: '/thanh-tich' },
      { title: 'Lịch sử thành tích', desc: 'Đối soát chi phí & thưởng giải đua', link: '/thanh-tich' },
      { title: 'Cân nặng & thể trạng', desc: 'Biểu đồ theo thời gian', link: '/ho-so-ngua' },
      { title: 'Ảnh & giấy tờ', desc: 'Chứng nhận, hộ chiếu ngựa', link: '/ho-so-ngua' }
    ]
  },
  {
    id: 'mega-2',
    label: 'Huấn luyện',
    badge: 'BẮT BUỘC',
    fno: '2',
    title: 'Giáo án huấn luyện',
    subtitle: 'Training Program',
    description: 'Từ mục tiêu giai đoạn của HLV trưởng xuống tới lịch tập hằng ngày của từng người phụ trách.',
    ctaText: 'Mở bảng huấn luyện',
    ctaLink: '/huan-luyen.html',
    links: [
      { title: 'Lập giáo án', desc: 'Cự ly, khối lượng, mặt sân theo giai đoạn', link: '/huan-luyen/giao-an.html' },
      { title: 'Lịch tập hằng ngày', desc: 'Phân công cho đội chăm sóc', link: '/huan-luyen/lich-tap.html' },
      { title: 'Lượt chạy thử', desc: 'Đặt lịch và ghi nhận kết quả', link: '/huan-luyen/chay-thu.html' },
      { title: 'Biểu đồ thể lực', desc: 'Nhịp tim, vận tốc theo buổi tập', link: '/huan-luyen/the-luc.html' },
      { title: 'Cảnh báo vượt ngưỡng', desc: 'Nguy cơ quá tải và chấn thương', link: '/huan-luyen/canh-bao.html' },
      { title: 'Đánh giá phong độ', desc: 'Chỉ số và nhận xét sau buổi tập', link: '/huan-luyen/danh-gia.html' }
    ]
  },
  {
    id: 'mega-3',
    label: 'Y tế',
    badge: 'BẮT BUỘC',
    fno: '3',
    title: 'Y tế & chấn thương',
    subtitle: 'Medical & Injury',
    description: 'Từ ca khám đầu tiên đến ngày ngựa trở lại đường chạy, kèm quyền chặn mọi bài tập nặng khi cần.',
    ctaText: 'Mở hồ sơ y tế',
    ctaLink: '/y-te.html',
    links: [
      { title: 'Sơ đồ sức khỏe đàn ngựa', desc: 'Đủ điều kiện · theo dõi · chấn thương · cách ly', link: '/y-te/so-do-suc-khoe.html' },
      { title: 'Hồ sơ khám & chẩn đoán', desc: 'Ghi nhận từng lần khám', link: '/y-te/kham-benh.html' },
      { title: 'Phác đồ & đơn thuốc', desc: 'Liều dùng và lịch điều trị', link: '/y-te/phac-do.html' },
      { title: 'Bản đồ chấn thương 3D', desc: 'Đánh dấu cơ — xương, theo dõi phục hồi', link: '/y-te/mo-hinh-3d.html' },
      { title: 'Khóa huấn luyện', desc: 'Chặn xếp lịch bài tập nặng', link: '/y-te/khoa-huan-luyen.html' },
      { title: 'Tiêm phòng & kiểm tra móng', desc: 'Nhắc tự động theo chu kỳ', link: '/y-te/lich-dinh-ky.html' }
    ]
  },
  {
    id: 'mega-4',
    label: 'Chuồng trại',
    badge: 'TÙY CHỌN',
    fno: '4',
    title: 'Chăm sóc & dinh dưỡng',
    subtitle: 'Daily Care & Nutrition',
    description: 'Việc trong ngày của đội chăm sóc: cho ăn, vệ sinh, tắm rửa, và báo sự cố ngay tại chuồng.',
    ctaText: 'Mở việc hôm nay',
    ctaLink: '/chuong-trai.html',
    links: [
      { title: 'Sơ đồ chuồng', desc: 'Vị trí và lịch sinh hoạt từng con', link: '/chuong-trai/so-do.html' },
      { title: 'Khẩu phần ăn', desc: 'Ngũ cốc, cỏ, vitamin theo từng bữa', link: '/chuong-trai/khau-phan.html' },
      { title: 'Checklist công việc', desc: 'Cho ăn, vệ sinh, tắm, ngâm chân đá', link: '/chuong-trai/checklist.html' },
      { title: 'Báo sự cố', desc: 'Bỏ ăn, đau bụng, sốt, xước móng — kèm ảnh', link: '/chuong-trai/su-co.html' },
      { title: 'Vật tư khu vực', desc: 'Tồn kho và đề xuất bổ sung', link: '/chuong-trai/vat-tu.html' }
    ]
  },
  {
    id: 'mega-5',
    label: 'Thi đấu',
    badge: 'TÙY CHỌN',
    fno: '5',
    title: 'Thi đấu & thành tích',
    subtitle: 'Race Entry & Results',
    description: 'Chọn chiến mã phù hợp với từng giải, nộp hồ sơ đăng ký và tổng hợp tiền thưởng về cho chủ sở hữu.',
    ctaText: 'Xem giải sắp diễn ra',
    ctaLink: '/thi-dau.html',
    links: [
      { title: 'Lịch giải đua', desc: 'Điều kiện dự giải và hạn đăng ký', link: '/thi-dau/lich-giai.html' },
      { title: 'Chọn ngựa dự giải', desc: 'Đối chiếu phong độ và xác nhận thú y', link: '/thi-dau/chon-ngua.html' },
      { title: 'Hồ sơ đăng ký', desc: 'Số áo, nài ngựa, lệ phí', link: '/thi-dau/dang-ky.html' },
      { title: 'Kết quả & tiền thưởng', desc: 'Ghi nhận thứ hạng và phân chia', link: '/thi-dau/ket-qua.html' },
      { title: 'Báo cáo cho chủ ngựa', desc: 'Chi phí, y tế, doanh thu định kỳ', link: '/thi-dau/bao-cao.html' }
    ]
  }
];
