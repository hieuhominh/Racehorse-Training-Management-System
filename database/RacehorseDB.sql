-- =========================================================================
-- DATABASE: RacehorseDB (Hệ thống Quản lý Huấn luyện Ngựa đua - Mã Trường)
-- RDBMS: Microsoft SQL Server 2019
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'RacehorseDB')
BEGIN
    CREATE DATABASE RacehorseDB;
END
GO

USE RacehorseDB;
GO

-- Xóa các bảng cũ theo thứ tự quan hệ ngược để tránh lỗi Khóa ngoại (Foreign Key) khi chạy lại F5
IF OBJECT_ID('dbo.RaceEntries', 'U') IS NOT NULL DROP TABLE dbo.RaceEntries;
IF OBJECT_ID('dbo.Races', 'U') IS NOT NULL DROP TABLE dbo.Races;
IF OBJECT_ID('dbo.DailyCareTasks', 'U') IS NOT NULL DROP TABLE dbo.DailyCareTasks;
IF OBJECT_ID('dbo.MedicalRecords', 'U') IS NOT NULL DROP TABLE dbo.MedicalRecords;
IF OBJECT_ID('dbo.TrainingSessions', 'U') IS NOT NULL DROP TABLE dbo.TrainingSessions;
IF OBJECT_ID('dbo.TrainingPrograms', 'U') IS NOT NULL DROP TABLE dbo.TrainingPrograms;
IF OBJECT_ID('dbo.Horses', 'U') IS NOT NULL DROP TABLE dbo.Horses;
IF OBJECT_ID('dbo.Stables', 'U') IS NOT NULL DROP TABLE dbo.Stables;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

-- 1. BẢNG VAI TRÒ (Roles - RBAC)
CREATE TABLE dbo.Roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_code VARCHAR(30) UNIQUE NOT NULL, -- TRAINER, VET, GROOM, OWNER, MANAGER
    role_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255)
);

-- 2. BẢNG NGƯỜI DÙNG (Users)
CREATE TABLE dbo.Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Roles(role_id),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at DATETIME DEFAULT GETDATE()
);

-- 3. BẢNG CHUỒNG TRẠI (Stables)
CREATE TABLE dbo.Stables (
    stable_id INT IDENTITY(1,1) PRIMARY KEY,
    stall_code VARCHAR(10) UNIQUE NOT NULL, -- A1, A2, A3..., B1, B2...
    block_name VARCHAR(10) NOT NULL,        -- Block A, Block B
    status VARCHAR(20) DEFAULT 'AVAILABLE' -- AVAILABLE, OCCUPIED, MAINTENANCE
);

-- 4. BẢNG CHIẾN MÃ (Horses - Profile & Pedigree)
CREATE TABLE dbo.Horses (
    horse_id INT IDENTITY(1,1) PRIMARY KEY,
    microchip_id VARCHAR(50) UNIQUE NOT NULL, -- Mã định danh chip điện tử
    name NVARCHAR(100) NOT NULL,              -- Tên ngựa (vd: Hắc Phong)
    breed NVARCHAR(50) DEFAULT 'Thoroughbred',-- Giống ngựa
    gender VARCHAR(10) CHECK (gender IN ('STALLION', 'MARE', 'GELDING')),
    dob DATE,                                 -- Ngày sinh
    weight_kg DECIMAL(6,2),                   -- Cân nặng (kg)
    height_cm DECIMAL(6,2),                   -- Chiều cao (cm)
    sire_name NVARCHAR(100),                  -- Tên bố (Pedigree)
    dam_name NVARCHAR(100),                   -- Tên mẹ (Pedigree)
    owner_id INT NULL FOREIGN KEY REFERENCES dbo.Users(user_id),
    stable_id INT NULL FOREIGN KEY REFERENCES dbo.Stables(stable_id),
    health_status VARCHAR(20) DEFAULT 'ELIGIBLE', -- ELIGIBLE (Đủ điều kiện), WATCH (Theo dõi), INJURED (Chấn thương), QUARANTINE (Cách ly)
    is_training_locked BIT DEFAULT 0,         -- Khóa huấn luyện khẩn cấp bởi Bác sĩ Thú y
    avatar_url VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);

-- 5. BẢNG GIÁO ÁN HUẤN LUYỆN (Training Programs)
CREATE TABLE dbo.TrainingPrograms (
    program_id INT IDENTITY(1,1) PRIMARY KEY,
    horse_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Horses(horse_id),
    trainer_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id),
    title NVARCHAR(150) NOT NULL,
    phase NVARCHAR(50),                       -- Giai đoạn (Nước rút, Thể lực nền, v.v.)
    target_distance_m INT,                    -- Cự ly mục tiêu (mét)
    surface_type VARCHAR(20),                 -- GRASS (cỏ), SAND (cát)
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE'       -- ACTIVE, COMPLETED, CANCELLED
);

-- 6. BẢNG BUỔI TẬP VÀ CHỈ SỐ TELEMETRY (Training Sessions & Vitals)
CREATE TABLE dbo.TrainingSessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    program_id INT NOT NULL FOREIGN KEY REFERENCES dbo.TrainingPrograms(program_id),
    session_time DATETIME DEFAULT GETDATE(),
    distance_run_m INT,                       -- Mét đã chạy
    avg_speed_kmh DECIMAL(5,2),               -- Vận tốc trung bình (km/h)
    max_heart_rate INT,                       -- Nhịp tim tối đa (bpm)
    over_limit_alert BIT DEFAULT 0,           -- Cảnh báo vượt ngưỡng an toàn
    trainer_feedback NVARCHAR(MAX),           -- Nhận xét HLV
    score_performance DECIMAL(3,1)            -- Điểm phong độ (thang 10)
);

-- 7. BẢNG HỒ SƠ Y TẾ & CHẤN THƯƠNG (Medical & Injury Records)
CREATE TABLE dbo.MedicalRecords (
    record_id INT IDENTITY(1,1) PRIMARY KEY,
    horse_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Horses(horse_id),
    vet_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id),
    diagnosis_date DATETIME DEFAULT GETDATE(),
    diagnosis NVARCHAR(MAX) NOT NULL,         -- Chẩn đoán lâm sàng
    injury_body_part VARCHAR(50),             -- Vị trí trên cơ thể / mô hình 3D (vd: LEFT_FORELEG_TENDON)
    prescription NVARCHAR(MAX),               -- Đơn thuốc & phác đồ
    lock_training BIT DEFAULT 1,              -- Ra lệnh cấm bài tập nặng
    next_checkup_date DATE,
    status VARCHAR(20) DEFAULT 'TREATING'     -- TREATING, RECOVERED, MONITORING
);

-- 8. BẢNG CÔNG VIỆC CHUỒNG TRẠI (Daily Care & Stable Tasks)
CREATE TABLE dbo.DailyCareTasks (
    task_id INT IDENTITY(1,1) PRIMARY KEY,
    horse_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Horses(horse_id),
    groom_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(user_id),
    task_date DATE DEFAULT CAST(GETDATE() AS DATE),
    meal_plan NVARCHAR(255),                  -- Khẩu phần ăn đã duyệt (Ngũ cốc, cỏ, vitamin)
    is_fed BIT DEFAULT 0,                     -- Đã cho ăn
    is_cleaned BIT DEFAULT 0,                 -- Đã vệ sinh chuồng
    is_bathed BIT DEFAULT 0,                  -- Đã tắm
    is_ice_soaked BIT DEFAULT 0,              -- Đã ngâm chân nước đá
    incident_report NVARCHAR(MAX),            -- Báo cáo sự cố tại chuồng
    incident_photo_url VARCHAR(255),
    completed_at DATETIME
);

-- 9. BẢNG GIẢI ĐUA & THÀNH TÍCH (Races & Results)
CREATE TABLE dbo.Races (
    race_id INT IDENTITY(1,1) PRIMARY KEY,
    race_name NVARCHAR(150) NOT NULL,
    location NVARCHAR(150) DEFAULT N'Trường đua Đại Nam',
    race_date DATETIME NOT NULL,
    distance_m INT NOT NULL,
    total_prize_vnd DECIMAL(15,2),
    registration_deadline DATETIME,
    status VARCHAR(20) DEFAULT 'OPEN'         -- OPEN, CLOSED, FINISHED
);

-- 10. BẢNG ĐĂNG KÝ THAM GIA ĐUA (Race Entries)
CREATE TABLE dbo.RaceEntries (
    entry_id INT IDENTITY(1,1) PRIMARY KEY,
    race_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Races(race_id),
    horse_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Horses(horse_id),
    jockey_name NVARCHAR(100),
    bib_number INT,
    final_rank INT NULL,
    prize_awarded_vnd DECIMAL(15,2) DEFAULT 0,
    vet_cleared BIT DEFAULT 0                 -- Xác nhận đủ điều kiện từ thú y
);

-- =========================================================================
-- SAMPLE DATA (DỮ LIỆU MẪU KHỞI TẠO ĐỒNG BỘ VỚI GIAO DIỆN)
-- =========================================================================

-- Chèn Vai trò
INSERT INTO dbo.Roles (role_code, role_name, description) VALUES
('TRAINER', N'Huấn luyện viên trưởng', N'Lập giáo án, theo dõi chỉ số, chấm phong độ'),
('VET', N'Bác sĩ thú y', N'Khám bệnh, phác đồ, bản đồ chấn thương 3D, khóa huấn luyện'),
('GROOM', N'Nhân viên chăm sóc', N'Checklist hằng ngày, dinh dưỡng khẩu phần, báo sự cố chuồng'),
('OWNER', N'Chủ sở hữu ngựa', N'Xem lý lịch, video chạy thử, báo cáo chi phí và tiền thưởng'),
('MANAGER', N'Quản lý câu lạc bộ', N'Quản trị danh mục, phân quyền RBAC, báo cáo doanh thu');

-- Chèn Người dùng (Password mặc định là 123456 hash giả định)
INSERT INTO dbo.Users (username, password_hash, full_name, email, phone, role_id) VALUES
('admin', '123456', N'Quản trị viên Hệ thống', 'admin@matruong.vn', '0905678999', 5),
('admin_quan', '123456', N'Ban Quản trị Mã Trường', 'quanly@matruong.vn', '0905678901', 5),
('trainer_truong', '123456', N'Trần Văn Hùng (HLV Trưởng)', 'trainer@matruong.vn', '0901234567', 1),
('vet_an', '123456', N'Bác sĩ Nguyễn An (Thú Y)', 'vet@matruong.vn', '0902345678', 2),
('groom_nam', '123456', N'Lê Hoàng Nam (Chăm sóc)', 'groom@matruong.vn', '0903456789', 3),
('owner_thanh', '123456', N'Phạm Tiến Thành (Chủ ngựa)', 'owner@matruong.vn', '0904567890', 4);

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
('MC-VN-2022-001', N'Hắc Phong', N'Thoroughbred', 'STALLION', '2022-03-15', 485.5, N'Đại Phong Sơn', N'Bạch Ngọc', 4, 3, 'WATCH', 0),
('MC-VN-2021-014', N'Xích Thố', N'Arabian', 'GELDING', '2021-05-20', 510.0, N'Hỏa Long', N'Hồng Đào', 4, 1, 'ELIGIBLE', 0),
('MC-VN-2023-009', N'Phi Yến', N'Thoroughbred', 'MARE', '2023-01-10', 460.0, N'Bão Táp', N'Yến Nhi', 4, 5, 'INJURED', 1),
('MC-VN-2022-088', N'Lôi Chấn', N'Quarter Horse', 'STALLION', '2022-08-04', 525.0, N'Sấm Sét', N'Ngân Hà', 4, 8, 'QUARANTINE', 1);

-- Chèn Giải đua
INSERT INTO dbo.Races (race_name, location, race_date, distance_m, total_prize_vnd, registration_deadline) VALUES
(N'Vòng loại Giải Vô địch Đại Nam 2026', N'Trường đua Đại Nam, Bình Dương', DATEADD(day, 12, GETDATE()), 1600, 500000000, DATEADD(day, 5, GETDATE()));

GO
PRINT 'Khởi tạo RacehorseDB thành công!';
