-- =========================================================================
-- DATABASE: RacehorseDB (Hệ thống Quản lý Huấn luyện Ngựa đua - Mã Trường)
-- RDBMS: PostgreSQL 14+ / 16 / 18
-- =========================================================================

-- Tạo Schema dbo để tương thích hoàn toàn với các câu lệnh truy vấn backend
CREATE SCHEMA IF NOT EXISTS dbo;
SET search_path TO dbo, public;

-- Xóa các bảng cũ theo thứ tự quan hệ ngược để tránh lỗi Khóa ngoại (Foreign Key)
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

-- 9. BẢNG GIẢI ĐUA & THÀNH TÍCH (Races & Results)
CREATE TABLE dbo.Races (
    race_id SERIAL PRIMARY KEY,
    race_name VARCHAR(150) NOT NULL,
    location VARCHAR(150) DEFAULT 'Trường đua Đại Nam',
    race_date TIMESTAMP NOT NULL,
    distance_m INT NOT NULL,
    total_prize_vnd DECIMAL(15,2),
    registration_deadline TIMESTAMP,
    status VARCHAR(20) DEFAULT 'OPEN'         -- OPEN, CLOSED, FINISHED
);

-- 10. BẢNG ĐĂNG KÝ THAM GIA ĐUA (Race Entries)
CREATE TABLE dbo.RaceEntries (
    entry_id SERIAL PRIMARY KEY,
    race_id INT NOT NULL REFERENCES dbo.Races(race_id),
    horse_id INT NOT NULL REFERENCES dbo.Horses(horse_id),
    jockey_name VARCHAR(100),
    bib_number INT,
    final_rank INT NULL,
    prize_awarded_vnd DECIMAL(15,2) DEFAULT 0,
    vet_cleared BOOLEAN DEFAULT FALSE         -- Xác nhận đủ điều kiện từ thú y
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

-- Chèn Giải đua
INSERT INTO dbo.Races (race_name, location, race_date, distance_m, total_prize_vnd, registration_deadline) VALUES
('Vòng loại Giải Vô địch Đại Nam 2026', 'Trường đua Đại Nam, Bình Dương', CURRENT_TIMESTAMP + INTERVAL '12 days', 1600, 500000000, CURRENT_TIMESTAMP + INTERVAL '5 days');
