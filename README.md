# Hệ thống Quản lý Huấn luyện Ngựa đua — MÃ TRƯỜNG (SWP391)
> **Dự án Đồ án SWP391 / Ứng dụng Web Quản lý & Huấn luyện Chiến mã Cao cấp**  
> **Kiến trúc:** Decoupled MVC / RESTful Architecture (Backend: Java Servlet + JDBC DAO; Frontend: React SPA)

---

## 🔑 Danh Sách Tài Khoản & Mật Khẩu (Cố định để kiểm thử & chấm điểm)

> **Mật khẩu chung cho tất cả tài khoản hệ thống bên dưới:** `123` (hoặc `123456`)

### 1. Quản Trị Viên & Chủ Sở Hữu Ngựa
| Vai trò | Họ tên | Tên đăng nhập (Username) | Mật khẩu | Email | Cổng điều hành & Quyền hạn |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Quản trị viên (Admin / Manager)** | Quản trị viên Hệ thống | `admin` | `123` | `admin@matruong.vn` | `/admin` — Quản lý toàn bộ hệ thống, ô chuồng, phân công & khóa/mở tài khoản nhân sự, duyệt yêu cầu |
| **Chủ sở hữu (Horse Owner)** | Hồ Minh Hiếu | `hominhieu27072005` | `123` | `hominhieu27072005@gmail.com` | `/owner` — Quản lý chiến mã, chỉ định đội ngũ phục vụ (HLV, BS, Groom), đăng ký giải đấu & yêu cầu đổi chuồng |

---

### 2. Ba (03) Huấn Luyện Viên Chính (Trainers) — Cổng `/trainer`
| STT | Huấn Luyện Viên | Tên đăng nhập (Username) | Mật khẩu | Email | Chuyên môn phụ trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **Trần Văn Hùng** | `trainer_truong` | `123` | `trainer@matruong.vn` | HLV Trưởng — Quản lý tổng thể & Cự ly dài |
| 2 | **Lê Trọng Nghĩa** | `trainer_nghia` | `123` | `trainer_nghia@matruong.vn` | Chuyên cự ly dài & chiến thuật sân cỏ |
| 3 | **Phạm Quốc Anh** | `trainer_anh` | `123` | `trainer_anh@matruong.vn` | Chuyên kỹ thuật nước rút & bứt tốc |

---

### 3. Ba (03) Bác Sĩ Thú Y Chính (Veterinarians) — Cổng `/vet`
| STT | Bác Sĩ Thú Y | Tên đăng nhập (Username) | Mật khẩu | Email | Chuyên khoa đảm trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **BS. Nguyễn An** | `vet_an` | `123` | `vet@matruong.vn` | Trưởng khoa Thú y & Chẩn đoán hình ảnh |
| 2 | **BS. Trần Minh Hoàng** | `vet_hoang` | `123` | `vet_hoang@matruong.vn` | Chuyên gia Cơ Xương Khớp & Chấn thương thể thao |
| 3 | **BS. Lê Mai Linh** | `vet_linh` | `123` | `vet_linh@matruong.vn` | Chuyên khoa Dinh Dưỡng, Dịch tễ & Kiểm dịch |

---

### 4. Ba (03) Người Chăm Sóc Chính (Grooms) — Cổng `/groom`
| STT | Nhân Viên Chăm Sóc | Tên đăng nhập (Username) | Mật khẩu | Email | Khu vực phụ trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **Lê Hoàng Nam** | `groom_nam` | `123` | `groom@matruong.vn` | Trưởng nhóm Chăm sóc ô chuồng Block A |
| 2 | **Vũ Tiến Dũng** | `groom_dung` | `123` | `groom_dung@matruong.vn` | Chuyên viên chăm sóc & vệ sinh móng Block B |
| 3 | **Nguyễn Thu Thảo** | `groom_thao` | `123` | `groom_thao@matruong.vn` | Chuyên viên chăm sóc phục hồi & dinh dưỡng Block C |

> ⚡ **Mẹo thao tác nhanh trên Web:** Tại cửa sổ Đăng nhập trên giao diện web, bạn có thể click vào các nút **"Đăng nhập nhanh 1 chạm"** theo vai trò để tự động điền và đăng nhập ngay lập tức.

---

## 🏛️ Kiến Trúc Hệ Thống (Mô hình MVC & Công nghệ)

Dự án áp dụng mô hình **Decoupled MVC (RESTful MVC)** kế thừa toàn bộ nền tảng Servlet / DAO của môn **PRJ301**, nâng cấp tầng View thành **React SPA**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        VIEW: FRONTEND (React SPA)                      │
│   React 18 + Vite + React Router + Context API + Real-time Sync       │
│   5 Cổng nghiệp vụ: Admin, Trainer, Vet, Groom, Horse Owner            │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON API (Fetch / CORS)
┌────────────────────────────────────▼───────────────────────────────────┐
│                    CONTROLLER: BACKEND (Java Servlet)                  │
│   Apache Tomcat + javax.servlet.http.HttpServlet + Gson                │
│   AuthApiController, HorseApiController, UserApiController,            │
│   StableApiController, VetApiController, GroomApiController...         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JDBC (java.sql.PreparedStatement)
┌────────────────────────────────────▼───────────────────────────────────┐
│               MODEL & DAL: DATA ACCESS LAYER (DAO / DBContext)         │
│   DBContext.java, UserDAO.java, HorseDAO.java, StableDAO.java...       │
│   Model: User.java, Horse.java, Stable.java, Incident.java...          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ SQL Queries
┌────────────────────────────────────▼───────────────────────────────────┐
│                     DATABASE: SQL Server / PostgreSQL                  │
│   Bảng: Users, Horses, Stables, Incidents, TrainingSessions, Medical...│
└────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết các thành phần:
- **Controller (Java Servlets):** Kế thừa `HttpServlet` xử lý các endpoint RESTful trả về JSON (`/api/auth/*`, `/api/horses/*`, `/api/users/*`, `/api/stables/*`, `/api/incidents/*`, `/api/reports/*`, `/api/training/*`).
- **Data Access Layer (DAO):** Kế thừa `DBContext.java`, dùng `PreparedStatement` và `ResultSet` chống SQL Injection (`UserDAO`, `HorseDAO`, `StableDAO`, `IncidentDAO`).
- **View (Frontend):** Thiết kế theo phong cách Luxury Dark Theme, tích hợp Route Guard bảo vệ đường dẫn theo vai trò, đồng bộ dữ liệu thời gian thực.

---

## 🌟 Các Tính Năng Nổi Bật Vừa Hoàn Thiện

1. **Kiểm Soát Quyền Truy Cập & Khóa Tài Khoản Nhân Sự (Real-time RBAC Access Control):**
   - Quản trị viên (Admin) có thể bấm **Khóa** hoặc **Mở** quyền truy cập của bất kỳ nhân sự nào trực tiếp trên bảng quản lý.
   - Khi tài khoản bị khóa, hệ thống lập tức chặn đăng nhập (báo lỗi rõ ràng), ngắt phiên làm việc đang chạy và chặn truy cập tại tất cả các Route Guard (`TrainerRoute`, `VetRoute`, `GroomRoute`, `OwnerRoute`).
   - Khi Admin bấm **Mở**, tài khoản lập tức được kích hoạt lại và đăng nhập bình thường.

2. **Quản Lý Ô Chuồng Thông Minh & Bảo Dưỡng Tự Động (Smart Stabling):**
   - Ô chuồng đã gán chiến mã được cố định thông tin, không thể tự ý chuyển về trạng thái trống khi đang nuôi dưỡng.
   - Tính năng **Bảo dưỡng chuồng**: Tự động chuyển chiến mã sang ô chuồng còn trống tạm thời và phát thông báo đa vai trò (Chủ ngựa, HLV, Bác sĩ, Chăm sóc).
   - Tự động đếm ngược 30 phút bảo dưỡng và chuyển chiến mã về đúng ô chuồng gốc ban đầu khi hoàn tất.

3. **Phân Công Chuyên Môn 1-1 Tuyệt Đối:**
   - Huấn luyện viên, Bác sĩ thú y và Nhân viên chăm sóc chỉ thấy và phụ trách đúng các chiến mã được phân công, không bị lẫn lộn giữa các nhân sự.
   - Thẻ trạng thái rõ ràng: `✓ ĐÃ XÁC NHẬN` khi nhân sự đã nhận nhiệm vụ, `⏳ CHỜ XÁC NHẬN` khi chưa phản hồi.

4. **Hồ Sơ Nhân Sự Tinh Gọn (Staff Profile & Edit):**
   - Giao diện xem hồ sơ chuyên nghiệp, hiển thị đầy đủ danh sách chiến mã, chủ sở hữu, số ô chuồng đang phụ trách.
   - Chỉnh sửa thông tin nhân sự và lưu trữ bền vững, không bị hoàn tác khi tải lại trang.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
SWP/
├── frontend/                   # [FRONT-END] Ứng dụng React SPA
│   ├── src/
│   │   ├── components/         # Các Component giao diện (Navbar, Route Guards, Modals...)
│   │   ├── context/            # AuthContext (xác thực & RBAC), ThemeContext, ToastContext...
│   │   ├── pages/              # AdminPage, TrainerPage, VetPage, GroomPage, OwnerPage
│   │   ├── services/           # api.js (kết nối Backend/Fallback), notificationService.js...
│   │   ├── App.jsx             # Router chính điều hướng các trang
│   │   └── index.css           # Hệ thống Style Luxury Theme
│   ├── vite.config.js          # Cấu hình proxy kết nối Tomcat
│   └── package.json
│
├── backend/                    # [BACK-END] Java Web API (Tomcat + Maven)
│   ├── pom.xml                 # Cấu hình Maven (Java 17, Servlet 4.0, Gson, JDBC Driver)
│   └── src/main/
│       ├── java/
│       │   ├── controller/     # Các HttpServlet (AuthApiController, HorseApiController, UserApiController...)
│       │   ├── dal/            # DBContext.java, UserDAO.java, HorseDAO.java, StableDAO.java...
│       │   ├── model/          # User.java, Horse.java, Stable.java, Incident.java...
│       │   ├── filter/         # CorsFilter.java
│       │   └── util/           # SecurityUtil.java
│       └── webapp/WEB-INF/
│           └── web.xml         # Cấu hình Web Application
│
├── database/                   # [DATABASE] Cơ sở dữ liệu
│   └── RacehorseDB.sql         # Script CSDL đầy đủ bảng và dữ liệu mẫu
│
├── run-frontend.bat            # Script chạy Frontend 1 chạm
└── README.md                   # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Chạy Front-end (ReactJS)

#### Cách 1: Chạy tự động (Khuyên dùng)
Double-click chuột vào file **`run-frontend.bat`** ở thư mục gốc của dự án. File sẽ tự động kiểm tra thư viện và khởi chạy máy chủ giao diện `npm run dev`.

#### Cách 2: Chạy thủ công
```powershell
cd frontend
npm install
npm run dev
```
Trình duyệt sẽ mở tại địa chỉ: **`http://localhost:3000`**

---

### 2. Chạy Back-end (NetBeans / IntelliJ / Eclipse + Apache Tomcat)

1. **Thiết lập Cơ sở dữ liệu:**
   - Mở hệ quản trị CSDL (SQL Server Management Studio hoặc pgAdmin).
   - Chạy script trong [`database/RacehorseDB.sql`](file:///c:/Users/ASUS/Desktop/SWP/database/RacehorseDB.sql) để tạo cơ sở dữ liệu `RacehorseDB` và nạp dữ liệu mẫu.

2. **Chạy ứng dụng Backend:**
   - Mở project `backend` trong NetBeans hoặc IntelliJ IDEA.
   - Cấu hình máy chủ **Apache Tomcat 9.0.x** (hoặc Tomcat 10 với `javax.servlet`).
   - Bấm **Run** để khởi động máy chủ.
   - Endpoint kiểm tra: `http://localhost:8080/racehorse-backend/api/horses`

---

## 🌿 Quy Trình Phân Nhánh Git & Làm Việc Nhóm (Git Workflow)

Để đảm bảo website luôn hoạt động ổn định 100%, không bị lỗi hay gián đoạn khi có thành viên nộp code, nhóm áp dụng mô hình phân nhánh chuẩn **Gitflow (Main & Dev)**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        NHÁNH MAIN (PRODUCTION)                         │
│  - Luôn là phiên bản sạch, ổn định 100%, dùng để demo / chấm điểm      │
│  - TUYỆT ĐỐI KHÔNG PUSH TRỰC TIẾP LÊN MAIN                             │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │ (Chỉ Trưởng nhóm review, test xong mới gộp)
┌────────────────────────────────────┴───────────────────────────────────┐
│                       NHÁNH DEV (DEVELOPMENT)                          │
│  - Nhánh làm việc chung của tất cả thành viên trong nhóm               │
│  - Mọi tính năng mới, sửa lỗi đều tích hợp vào đây trước               │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │ Push / Pull Request
                     ┌───────────────┴───────────────┐
                     │                               │
             ┌───────┴───────┐               ┌───────┴───────┐
             │ feature/chuc- │               │ feature/chuc- │
             │   nang-A      │               │   nang-B      │
             └───────────────┘               └───────────────┘
```

### 1. Quy tắc bắt buộc cho Thành viên nhóm:
1. **Tuyệt đối không push trực tiếp lên `main`**: Nhánh `main` đã được cài đặt chế độ bảo vệ.
2. **Luôn bắt đầu từ `dev`**: Trước khi code, luôn cập nhật code mới nhất từ nhánh `dev`.
3. **Tạo nhánh riêng khi làm tính năng**: Đặt tên theo cú pháp `feature/ten-tinh-nang` hoặc `fix/ten-loi`.

### 2. Các lệnh Git thành viên sử dụng hằng ngày:

```bash
# Bước 1: Chuyển về nhánh dev và cập nhật code mới nhất
git checkout dev
git pull origin dev

# Bước 2: Tạo nhánh riêng để làm việc
git checkout -b feature/tinh-nang-moi

# Bước 3: Viết code, kiểm tra build trước khi commit
cd frontend && npm run build   # Đảm bảo không có lỗi cú pháp
git add .
git commit -m "feat: mô tả công việc vừa làm"

# Bước 4: Đẩy nhánh lên GitHub và tạo Pull Request (PR) vào nhánh dev
git push origin feature/tinh-nang-moi
```
> Sau khi push, vào GitHub bấm **"Compare & pull request"** để gửi yêu cầu gộp vào nhánh `dev` cho Trưởng nhóm duyệt.

---

### 3. Quy trình Trưởng nhóm Kiểm tra & Gộp code sang `main`:

Khi thành viên hoàn thành công việc và push lên `dev`:

1. **Trưởng nhóm kéo `dev` về máy để test cục bộ:**
   ```bash
   git checkout dev
   git pull origin dev
   cd frontend && npm run build   # Kiểm tra tính toàn vẹn
   ```

2. **Nếu có xung đột (conflict) hoặc lỗi:**
   - Trưởng nhóm sửa trực tiếp trên máy, test chạy thử mượt mà.
   - Commit và push cập nhật lại lên `dev`:
     ```bash
     git add .
     git commit -m "fix: giải quyết xung đột code nhánh dev"
     git push origin dev
     ```

3. **Khi nhánh `dev` đã hoàn toàn ổn định, gộp an toàn vào `main`:**
   ```bash
   git checkout main
   git pull origin main
   git merge dev
   git push origin main
   ```
   *(Lúc này nhánh `main` nhận code mới mà không bao giờ sợ bị lỗi hay sập trang web).*
