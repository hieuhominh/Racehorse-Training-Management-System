-- =========================================================================
-- DATABASE: RacehorseDB (Hệ thống Quản lý Huấn luyện Ngựa đua - Mã Trường)
-- RDBMS: PostgreSQL 14+ / 16 / 18
-- =========================================================================

-- Tạo Schema dbo để tương thích hoàn toàn với các câu lệnh truy vấn backend
CREATE SCHEMA IF NOT EXISTS dbo;
SET search_path TO dbo, public;

-- Xóa các bảng cũ theo thứ tự quan hệ ngược để tránh lỗi Khóa ngoại (Foreign Key)
DROP TABLE IF EXISTS dbo.AuditLogs CASCADE;
DROP TABLE IF EXISTS dbo.RaceEntries CASCADE;
DROP TABLE IF EXISTS dbo.Races CASCADE;
DROP TABLE IF EXISTS dbo.DailyCareTasks CASCADE;
DROP TABLE IF EXISTS dbo.MedicalRecords CASCADE;
DROP TABLE IF EXISTS dbo.TrainingSessions CASCADE;
DROP TABLE IF EXISTS dbo.TrainingPrograms CASCADE;
DROP TABLE IF EXISTS dbo.Horses CASCADE;
DROP TABLE IF EXISTS dbo.Stables CASCADE;
DROP TABLE IF EXISTS dbo.Users CASCADE;
DROP TABLE IF EXISTS dbo.Roles CASCADE;

-- 1. BẢNG VAI TRÒ (Roles - RBAC)
CREATE TABLE dbo.Roles (
    role_id SERIAL PRIMARY KEY,
    role_code VARCHAR(30) UNIQUE NOT NULL, -- TRAINER, VET, GROOM, OWNER, MANAGER
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

-- 2. BẢNG NGƯỜI DÙNG (Users)
CREATE TABLE dbo.Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role_id INT NOT NULL REFERENCES dbo.Roles(role_id),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG CHUỒNG TRẠI (Stables)
CREATE TABLE dbo.Stables (
    stable_id SERIAL PRIMARY KEY,
    stall_code VARCHAR(10) UNIQUE NOT NULL, -- A1, A2, A3..., B1, B2...
    block_name VARCHAR(10) NOT NULL,        -- Block A, Block B
    status VARCHAR(20) DEFAULT 'AVAILABLE' -- AVAILABLE, OCCUPIED, MAINTENANCE
);

-- 4. BẢNG CHIẾN MÃ (Horses - Profile & Pedigree)
CREATE TABLE dbo.Horses (
    horse_id SERIAL PRIMARY KEY,
    microchip_id VARCHAR(50) UNIQUE NOT NULL, -- Mã định danh chip điện tử
    name VARCHAR(100) NOT NULL,              -- Tên ngựa (vd: Hắc Phong)
    breed VARCHAR(50) DEFAULT 'Thoroughbred',-- Giống ngựa
    gender VARCHAR(10) CHECK (gender IN ('STALLION', 'MARE', 'GELDING')),
    dob DATE,                                 -- Ngày sinh
    weight_kg DECIMAL(6,2),                   -- Cân nặng (kg)
    height_cm DECIMAL(6,2),                   -- Chiều cao (cm)
    sire_name VARCHAR(100),                  -- Tên bố (Pedigree)
    dam_name VARCHAR(100),                   -- Tên mẹ (Pedigree)
    owner_id INT NULL REFERENCES dbo.Users(user_id),
    stable_id INT NULL REFERENCES dbo.Stables(stable_id),
    health_status VARCHAR(20) DEFAULT 'ELIGIBLE', -- ELIGIBLE (Đủ điều kiện), WATCH (Theo dõi), INJURED (Chấn thương), QUARANTINE (Cách ly)
    is_training_locked BOOLEAN DEFAULT FALSE,     -- Khóa huấn luyện khẩn cấp bởi Bác sĩ Thú y
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG GIÁO ÁN HUẤN LUYỆN (Training Programs)
CREATE TABLE dbo.TrainingPrograms (
    program_id SERIAL PRIMARY KEY,
    horse_id INT NOT NULL REFERENCES dbo.Horses(horse_id),
    trainer_id INT NOT NULL REFERENCES dbo.Users(user_id),
    title VARCHAR(150) NOT NULL,
    phase VARCHAR(50),                       -- Giai đoạn (Nước rút, Thể lực nền, v.v.)
    target_distance_m INT,                    -- Cự ly mục tiêu (mét)
    surface_type VARCHAR(20),                 -- GRASS (cỏ), SAND (cát)
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE'       -- ACTIVE, COMPLETED, CANCELLED
);

-- 6. BẢNG BUỔI TẬP VÀ CHỈ SỐ TELEMETRY (Training Sessions & Vitals)
CREATE TABLE dbo.TrainingSessions (
    session_id SERIAL PRIMARY KEY,
    program_id INT NOT NULL REFERENCES dbo.TrainingPrograms(program_id),
    session_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    distance_run_m INT,                       -- Mét đã chạy
    avg_speed_kmh DECIMAL(5,2),               -- Vận tốc trung bình (km/h)
    max_heart_rate INT,                       -- Nhịp tim tối đa (bpm)
    over_limit_alert BOOLEAN DEFAULT FALSE,   -- Cảnh báo vượt ngưỡng an toàn
    trainer_feedback TEXT,                    -- Nhận xét HLV
    score_performance DECIMAL(3,1)            -- Điểm phong độ (thang 10)
);

-- 7. BẢNG HỒ SƠ Y TẾ & CHẤN THƯƠNG (Medical & Injury Records)
CREATE TABLE dbo.MedicalRecords (
    record_id SERIAL PRIMARY KEY,
    horse_id INT NOT NULL REFERENCES dbo.Horses(horse_id),
    vet_id INT NOT NULL REFERENCES dbo.Users(user_id),
    diagnosis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diagnosis TEXT NOT NULL,                  -- Chẩn đoán lâm sàng
    injury_body_part VARCHAR(50),             -- Vị trí trên cơ thể / mô hình 3D (vd: LEFT_FORELEG_TENDON)
    prescription TEXT,                        -- Đơn thuốc & phác đồ
    lock_training BOOLEAN DEFAULT TRUE,       -- Ra lệnh cấm bài tập nặng
    next_checkup_date DATE,
    status VARCHAR(20) DEFAULT 'TREATING'     -- TREATING, RECOVERED, MONITORING
);

-- 8. BẢNG CÔNG VIỆC CHUỒNG TRẠI (Daily Care & Stable Tasks)
CREATE TABLE dbo.DailyCareTasks (
    task_id SERIAL PRIMARY KEY,
    horse_id INT NOT NULL REFERENCES dbo.Horses(horse_id),
    groom_id INT NOT NULL REFERENCES dbo.Users(user_id),
    task_date DATE DEFAULT CURRENT_DATE,
    meal_plan VARCHAR(255),                  -- Khẩu phần ăn đã duyệt (Ngũ cốc, cỏ, vitamin)
    is_fed BOOLEAN DEFAULT FALSE,            -- Đã cho ăn
    is_cleaned BOOLEAN DEFAULT FALSE,        -- Đã vệ sinh chuồng
    is_bathed BOOLEAN DEFAULT FALSE,         -- Đã tắm
    is_ice_soaked BOOLEAN DEFAULT FALSE,     -- Đã ngâm chân nước đá
    incident_report TEXT,                    -- Báo cáo sự cố tại chuồng
    incident_photo_url VARCHAR(255),
    completed_at TIMESTAMP
);

-- 9. BẢNG GIẢI ĐUA (Races - Hỗ trợ cả Mô hình A: Giải ngoài & Mô hình B: Nền tảng tổ chức)
CREATE TABLE dbo.Races (
    race_id SERIAL PRIMARY KEY,
    race_name VARCHAR(150) NOT NULL,
    tournament_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL', -- 'INTERNAL' (Mô hình B: Admin tổ chức), 'EXTERNAL' (Mô hình A: Bên ngoài tổ chức)
    organizer_name VARCHAR(150) NOT NULL DEFAULT 'Ban Quản Trị Mã Trường', -- Tên đơn vị tổ chức
    location VARCHAR(150) DEFAULT 'Trường đua Đại Nam',
    surface_type VARCHAR(30) DEFAULT 'TURF',                  -- TURF (cỏ), DIRT (cát nén), SAND (cát)
    distance_m INT NOT NULL,                                  -- Cự ly đua (mét)
    race_date TIMESTAMP NOT NULL,                             -- Ngày diễn ra thi đấu
    reg_open_date TIMESTAMP,                                  -- Thời điểm mở đăng ký
    reg_close_date TIMESTAMP,                                 -- Thời điểm đóng đăng ký (deadline)
    entry_fee_vnd DECIMAL(15,2) DEFAULT 0,                    -- Lệ phí đăng ký thi đấu
    total_prize_vnd DECIMAL(15,2) DEFAULT 0,                  -- Tổng quỹ tiền thưởng giải đấu
    commission_rate DECIMAL(5,2) DEFAULT 0.05,                -- Tỷ lệ hoa hồng nền tảng (0.05 = 5%, 0.08 = 8%, Giải ngoài = 0.00)
    terms_and_rules TEXT,                                     -- Thể lệ thi đấu & cam kết hoa hồng
    is_active_on_platform BOOLEAN DEFAULT TRUE,               -- Admin kiểm duyệt và cho phép hiển thị
    status VARCHAR(20) DEFAULT 'OPEN',                        -- UPCOMING, OPEN, CLOSED, IN_PROGRESS, FINISHED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. BẢNG ĐĂNG KÝ THAM GIA ĐUA & QUYẾT TOÁN GIẢI THƯỞNG (Race Entries & Prize Settlements)
CREATE TABLE dbo.RaceEntries (
    entry_id SERIAL PRIMARY KEY,
    race_id INT NOT NULL REFERENCES dbo.Races(race_id),
    horse_id INT NOT NULL REFERENCES dbo.Horses(horse_id),
    owner_id INT NOT NULL REFERENCES dbo.Users(user_id),
    jockey_name VARCHAR(100),
    bib_number INT,
    status VARCHAR(20) DEFAULT 'PENDING',                     -- PENDING (Chờ duyệt), APPROVED (Đã duyệt), REJECTED (Từ chối), CONFIRMED (Đã thanh toán lệ phí & sẵn sàng thi đấu)
    rejection_reason VARCHAR(255),                            -- Lý do Admin từ chối phê duyệt đơn
    payment_status VARCHAR(20) DEFAULT 'UNPAID',              -- UNPAID (Chưa đóng lệ phí), PAID (Đã đóng), EXEMPT (Miễn phí)
    final_rank INT NULL,                                      -- Thứ hạng chung cuộc (1 = Vô địch, 2 = Á quân...)
    -- 4 TRƯỜNG TÀI CHÍNH AN TOÀN LƯU RIÊNG THEO QUY TẮC NGHIỆP VỤ:
    gross_prize_vnd DECIMAL(15,2) DEFAULT 0,                  -- 1. Tiền thưởng trước khấu trừ (Tổng giải thưởng đạt được)
    commission_rate DECIMAL(5,2) DEFAULT 0.00,                -- 2. Tỷ lệ hoa hồng nền tảng (0.05 = 5%, 0.08 = 8%, Giải ngoài = 0.00)
    commission_amount_vnd DECIMAL(15,2) DEFAULT 0,            -- 3. Số tiền hoa hồng nền tảng nhận (= gross_prize * commission_rate)
    net_payout_vnd DECIMAL(15,2) DEFAULT 0,                   -- 4. Số tiền thực nhận của Chủ ngựa (= gross_prize - commission_amount)
    owner_agreed_terms BOOLEAN DEFAULT FALSE,                 -- Chủ ngựa đã xác nhận đồng ý thể lệ & trích hoa hồng trước khi nộp đơn
    is_external BOOLEAN DEFAULT FALSE,                        -- TRUE nếu là giải ngoài (Mô hình A)
    vet_cleared BOOLEAN DEFAULT FALSE,                        -- Xác nhận đủ điều kiện thể lực từ Thú y
    external_notes TEXT,                                      -- Ghi chú bổ sung / Minh chứng giải ngoài
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP NULL                                 -- Thời điểm quyết toán giải thưởng
);

-- 11. BẢNG NHẬT KÝ KIỂM TOÁN HỆ THỐNG (Audit Logs - Bắt buộc theo nguyên tắc nghiệp vụ)
CREATE TABLE dbo.AuditLogs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES dbo.Users(user_id),
    action VARCHAR(50) NOT NULL,                              -- CREATE_TOURNAMENT, APPROVE_ENTRY, REJECT_ENTRY, SETTLE_PRIZE, UPDATE_COMMISSION
    entity_type VARCHAR(30) NOT NULL,                         -- RACES, RACE_ENTRIES, FINANCIAL_SETTLEMENT
    entity_id VARCHAR(50) NOT NULL,
    details TEXT,                                             -- Nội dung chi tiết thay đổi (JSON hoặc Text)
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SAMPLE DATA (DỮ LIỆU MẪU KHỞI TẠO ĐỒNG BỘ VỚI GIAO DIỆN)
-- =========================================================================

-- Chèn Vai trò
INSERT INTO dbo.Roles (role_code, role_name, description) VALUES
('TRAINER', 'Huấn luyện viên trưởng', 'Lập giáo án, theo dõi chỉ số, chấm phong độ'),
('VET', 'Bác sĩ thú y', 'Khám bệnh, phác đồ, bản đồ chấn thương 3D, khóa huấn luyện'),
('GROOM', 'Nhân viên chăm sóc', 'Checklist hằng ngày, dinh dưỡng khẩu phần, báo sự cố chuồng'),
('OWNER', 'Chủ sở hữu ngựa', 'Xem lý lịch, video chạy thử, báo cáo chi phí và tiền thưởng'),
('MANAGER', 'Quản lý câu lạc bộ', 'Quản trị danh mục, phân quyền RBAC, báo cáo doanh thu');

-- Chèn Người dùng (Password mặc định là 123 / 123456 hash giả định)
INSERT INTO dbo.Users (username, password_hash, full_name, email, phone, role_id) VALUES
('admin', '123', 'Quản trị viên Hệ thống', 'admin@matruong.vn', '0905678999', 5),
('admin_quan', '123456', 'Ban Quản trị Mã Trường', 'quanly@matruong.vn', '0905678901', 5),
('trainer_truong', '123456', 'Trần Văn Hùng (HLV Trưởng)', 'trainer@matruong.vn', '0901234567', 1),
('vet_an', '123456', 'Bác sĩ Nguyễn An (Thú Y)', 'vet@matruong.vn', '0902345678', 2),
('groom_nam', '123456', 'Lê Hoàng Nam (Chăm sóc)', 'groom@matruong.vn', '0903456789', 3),
('owner_thanh', '123456', 'Phạm Tiến Thành (Chủ ngựa)', 'owner@matruong.vn', '0904567890', 4);

-- Chèn Chuồng trại (A1 - A6, B1 - B6 như sơ đồ UI)
INSERT INTO dbo.Stables (stall_code, block_name, status) VALUES
('A1', 'Block A', 'OCCUPIED'),
('A2', 'Block A', 'OCCUPIED'),
('A3', 'Block A', 'OCCUPIED'),
('A4', 'Block A', 'OCCUPIED'),
('A5', 'Block A', 'OCCUPIED'),
('A6', 'Block A', 'OCCUPIED'),
('B1', 'Block B', 'OCCUPIED'),
('B2', 'Block B', 'OCCUPIED'),
('B3', 'Block B', 'OCCUPIED'),
('B4', 'Block B', 'OCCUPIED'),
('B5', 'Block B', 'OCCUPIED'),
('B6', 'Block B', 'AVAILABLE');

-- Chèn Ngựa đua mẫu (Trong đó Hắc Phong ở ô A5/A3 có cảnh báo như UI)
INSERT INTO dbo.Horses (microchip_id, name, breed, gender, dob, weight_kg, sire_name, dam_name, owner_id, stable_id, health_status, is_training_locked) VALUES
('MC-VN-2022-001', 'Hắc Phong', 'Thoroughbred', 'STALLION', '2022-03-15', 485.5, 'Đại Phong Sơn', 'Bạch Ngọc', 4, 3, 'WATCH', FALSE),
('MC-VN-2021-014', 'Xích Thố', 'Arabian', 'GELDING', '2021-05-20', 510.0, 'Hỏa Long', 'Hồng Đào', 4, 1, 'ELIGIBLE', FALSE),
('MC-VN-2023-009', 'Phi Yến', 'Thoroughbred', 'MARE', '2023-01-10', 460.0, 'Bão Táp', 'Yến Nhi', 4, 5, 'INJURED', TRUE),
('MC-VN-2022-088', 'Lôi Chấn', 'Quarter Horse', 'STALLION', '2022-08-04', 525.0, 'Sấm Sét', 'Ngân Hà', 4, 8, 'QUARANTINE', TRUE);

-- =========================================================================
-- CHÈN DỮ LIỆU GIẢI ĐẤU (2 MÔ HÌNH: MÔ HÌNH A & MÔ HÌNH B)
-- =========================================================================

-- 1. GIẢI NỘI BỘ NỀN TẢNG (MÔ HÌNH B - ÁP DỤNG HOA HỒNG 5% HOẶC 8%)
INSERT INTO dbo.Races (
    race_name, tournament_type, organizer_name, location, surface_type,
    distance_m, race_date, reg_open_date, reg_close_date,
    entry_fee_vnd, total_prize_vnd, commission_rate, terms_and_rules, status
) VALUES
(
    'Cúp Derby Mùa Thu 2026 (Group 1)',
    'INTERNAL',
    'Ban Quản Trị Mã Trường Phú Thọ',
    'Trường đua Quốc tế Phú Thọ (TP.HCM)',
    'TURF',
    2400,
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    10000000,
    1500000000,
    0.05, -- Hoa hồng 5%
    'Giải đấu nội bộ chính thức. Nền tảng áp dụng trích 5% hoa hồng trên tổng tiền thưởng thực tế của Chủ ngựa để phục vụ công tác tổ chức, bảo hiểm thi đấu và duy tu đường đua.',
    'OPEN'
),
(
    'Cúp Nước Rút Tốc Độ Sprint Cup 2026 (Group 2)',
    'INTERNAL',
    'Ban Quản Trị Mã Trường Phú Thọ',
    'Trường đua Cát Thể Thao Đại Nam',
    'DIRT',
    1200,
    CURRENT_TIMESTAMP + INTERVAL '25 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '15 days',
    5000000,
    800000000,
    0.08, -- Hoa hồng 8%
    'Giải đấu bứt tốc nước rút. Nền tảng áp dụng trích 8% hoa hồng trên giải thưởng nhận được để chi trả đội ngũ giám sát viễn trắc camera hồng ngoại và hội đồng trọng tài quốc tế.',
    'OPEN'
);

-- 2. GIẢI ĐẤU BÊN NGOÀI (MÔ HÌNH A - OWNER TỰ ĐĂNG KÝ, HOA HỒNG 0%)
INSERT INTO dbo.Races (
    race_name, tournament_type, organizer_name, location, surface_type,
    distance_m, race_date, reg_open_date, reg_close_date,
    entry_fee_vnd, total_prize_vnd, commission_rate, terms_and_rules, status
) VALUES
(
    'Giải Đua Ngựa Truyền Thống Bắc Hà 2026',
    'EXTERNAL',
    'Sở Văn Hóa Thể Thao & Du Lịch Lào Cai',
    'Sân Vận Động Huyện Bắc Hà, Lào Cai',
    'SAND',
    1600,
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '12 days',
    2000000,
    300000000,
    0.00, -- Hoa hồng 0%
    'Giải đấu ngoài do đơn vị thứ ba tổ chức. Chủ ngựa tự do liên hệ, nộp lệ phí trực tiếp cho BTC. Hệ thống KHÔNG thu bất kỳ khoản hoa hồng giải thưởng nào (0%).',
    'OPEN'
),
(
    'Cúp Quốc Tế Bangkok Turf Club Open 2026',
    'EXTERNAL',
    'Royal Bangkok Sports Club (Thái Lan)',
    'Trường đua Bangkok RBSC, Thái Lan',
    'TURF',
    2000,
    CURRENT_TIMESTAMP + INTERVAL '45 days',
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    CURRENT_TIMESTAMP + INTERVAL '20 days',
    15000000,
    1200000000,
    0.00, -- Hoa hồng 0%
    'Giải đấu quốc tế ngoài. Chủ ngựa tự túc thủ tục xuất cảnh, kiểm dịch thú y và thanh toán trực tiếp cho BTC giải đấu tại Bangkok.',
    'OPEN'
);

-- =========================================================================
-- CHÈN LỊCH SỬ THI ĐẤU & QUYẾT TOÁN MẪU MINH CHỨNG CẢ 2 MÔ HÌNH
-- =========================================================================

-- Mẫu 1 (Mô hình B - Hoa hồng 5% theo đúng ví dụ nghiệp vụ):
-- Xích Thố đạt Hạng Nhất Giải Derby: Gross = 500.000.000đ -> Hoa hồng 5% = 25.000.000đ -> Owner nhận = 475.000.000đ
INSERT INTO dbo.RaceEntries (
    race_id, horse_id, owner_id, jockey_name, bib_number, status, payment_status,
    final_rank, gross_prize_vnd, commission_rate, commission_amount_vnd, net_payout_vnd,
    owner_agreed_terms, is_external, vet_cleared, settled_at
) VALUES (
    1, 2, 4, 'Nguyễn Văn Hùng (Nài chính)', 7, 'CONFIRMED', 'PAID',
    1, 500000000, 0.05, 25000000, 475000000,
    TRUE, FALSE, TRUE, CURRENT_TIMESTAMP - INTERVAL '3 days'
);

-- Mẫu 2 (Mô hình B - Hoa hồng 8% theo đúng ví dụ nghiệp vụ):
-- Hắc Phong đạt Hạng Nhì Giải Sprint: Gross = 500.000.000đ -> Hoa hồng 8% = 40.000.000đ -> Owner nhận = 460.000.000đ
INSERT INTO dbo.RaceEntries (
    race_id, horse_id, owner_id, jockey_name, bib_number, status, payment_status,
    final_rank, gross_prize_vnd, commission_rate, commission_amount_vnd, net_payout_vnd,
    owner_agreed_terms, is_external, vet_cleared, settled_at
) VALUES (
    2, 1, 4, 'Trần Quốc Bảo (Nài tốc độ)', 3, 'CONFIRMED', 'PAID',
    2, 500000000, 0.08, 40000000, 460000000,
    TRUE, FALSE, TRUE, CURRENT_TIMESTAMP - INTERVAL '1 days'
);

-- Mẫu 3 (Mô hình A - Giải ngoài độc lập):
-- Xích Thố tham gia Giải Bắc Hà: Gross = 150.000.000đ -> Hoa hồng 0% = 0đ -> Owner nhận trọn vẹn = 150.000.000đ
INSERT INTO dbo.RaceEntries (
    race_id, horse_id, owner_id, jockey_name, bib_number, status, payment_status,
    final_rank, gross_prize_vnd, commission_rate, commission_amount_vnd, net_payout_vnd,
    owner_agreed_terms, is_external, vet_cleared, external_notes, settled_at
) VALUES (
    3, 2, 4, 'Vàng A Lử (Nài địa phương)', 12, 'CONFIRMED', 'EXEMPT',
    1, 150000000, 0.00, 0, 150000000,
    TRUE, TRUE, TRUE, 'Owner tự đăng ký trực tiếp và nhận tiền mặt tại văn phòng BTC Bắc Hà.', CURRENT_TIMESTAMP - INTERVAL '10 days'
);

-- Chèn nhật ký kiểm toán khởi tạo
INSERT INTO dbo.AuditLogs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'SYSTEM_INIT', 'RACES', 'ALL', 'Khởi tạo schema 2 mô hình giải đấu song song (Mô hình A: External, Mô hình B: Internal hoa hồng 5%-8%).');
