# Hệ thống Quản lý Huấn luyện Ngựa đua — MÃ TRƯỜNG
> Dự án môn học SWP / Web Application

---

## 🔑 Danh Sách Tài Khoản & Mật Khẩu (Cố định để kiểm thử)

> **Mật khẩu chung cho tất cả tài khoản bên dưới:** `123` (hoặc `123456`)

### 1. Quản Trị Viên & Chủ Sở Hữu Ngựa
| Vai trò | Họ tên | Tên đăng nhập (Username) | Mật khẩu | Email | Quyền hạn chính |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Quản trị viên (Admin)** | Quản trị viên Hệ thống | `admin` | `123` | `admin@matruong.vn` | Quản lý toàn bộ hệ thống, phân bổ ô chuồng, kiểm duyệt hồ sơ & audit logs |
| **Chủ sở hữu (Horse Owner)** | Phạm Tiến Thành | `owner_thanh` | `123` | `owner@matruong.vn` | Quản lý chiến mã, chọn/đổi đội ngũ phục vụ (HLV, BS, Groom), đăng ký giải đấu |

---

### 2. Ba (03) Huấn Luyện Viên Chính (Trainers)
| STT | Huấn Luyện Viên | Tên đăng nhập (Username) | Mật khẩu | Email | Chuyên môn phụ trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **Trần Văn Hùng** | `trainer_truong` | `123` | `trainer@matruong.vn` | HLV Trưởng - Quản lý tổng thể & Cự ly dài |
| 2 | **Lê Trọng Nghĩa** | `trainer_nghia` | `123` | `trainer_nghia@matruong.vn` | Chuyên cự ly dài & chiến thuật sân cỏ |
| 3 | **Phạm Quốc Anh** | `trainer_anh` | `123` | `trainer_anh@matruong.vn` | Chuyên kỹ thuật nước rút & bứt tốc |

---

### 3. Ba (03) Bác Sĩ Thú Y Chính (Veterinarians)
| STT | Bác Sĩ Thú Y | Tên đăng nhập (Username) | Mật khẩu | Email | Chuyên khoa đảm trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **BS. Nguyễn An** | `vet_an` | `123` | `vet@matruong.vn` | Trưởng khoa Thú y & Chẩn đoán hình ảnh |
| 2 | **BS. Trần Minh Hoàng** | `vet_hoang` | `123` | `vet_hoang@matruong.vn` | Chuyên gia Cơ Xương Khớp & Chấn thương thể thao |
| 3 | **BS. Lê Mai Linh** | `vet_linh` | `123` | `vet_linh@matruong.vn` | Chuyên khoa Dinh Dưỡng, Dịch tễ & Kiểm dịch |

---

### 4. Ba (03) Người Chăm Sóc Chính (Grooms)
| STT | Nhân Viên Chăm Sóc | Tên đăng nhập (Username) | Mật khẩu | Email | Khu vực phụ trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **Lê Hoàng Nam** | `groom_nam` | `123` | `groom@matruong.vn` | Trưởng nhóm Chăm sóc ô chuồng Block A |
| 2 | **Vũ Tiến Dũng** | `groom_dung` | `123` | `groom_dung@matruong.vn` | Chuyên viên chăm sóc & vệ sinh móng Block B |
| 3 | **Nguyễn Thu Thảo** | `groom_thao` | `123` | `groom_thao@matruong.vn` | Chuyên viên chăm sóc phục hồi & dinh dưỡng Block C |

> ⚡ **Mẹo thao tác nhanh trên Web:** Tại cửa sổ Đăng nhập trên giao diện web, bạn cũng có thể bấm vào khung **"Đăng nhập nhanh 1 chạm"** để tự động điền và đăng nhập ngay lập tức với bất kỳ vai trò nào ở trên mà không cần nhập tay.

---

## 📁 1. Cấu trúc thư mục dự án chuẩn Front-end / Back-end

Toàn bộ dự án đã được phân tách rõ ràng giữa Front-end và Back-end:

```text
SWP/
├── frontend/                   # [FRONT-END] Ứng dụng giao diện người dùng
│   ├── src/
│   │   ├── components/         # Các React component (Navbar, Hero, Vitals, Roles, Stables...)
│   │   ├── data/               # Dữ liệu tĩnh (Navigation, Roles, Flows, Stalls, Schedule)
│   │   ├── App.jsx             # Component chính tập hợp giao diện
│   │   ├── index.css           # Toàn bộ CSS Design System, Responsive
│   │   └── main.jsx
│   ├── static/                 # Bản HTML/CSS/JS thuần tách riêng (để xem ngay không cần npm)
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/main.js
│   ├── vite.config.js          # Cấu hình proxy sang Backend Tomcat (port 8080)
│   └── package.json
│
├── backend/                    # [BACK-END] Mã nguồn Java Web API (NetBeans 13 + Tomcat 9)
│   ├── pom.xml                 # Maven cấu hình Java 17, Servlet 4.0, SQL JDBC Driver, Gson
│   └── src/main/
│       ├── java/
│       │   ├── dal/            # DBContext.java kết nối SQL Server 2019, HorseDAO.java
│       │   ├── model/          # Horse.java (Model chiến mã)
│       │   ├── controller/     # HorseApiController.java (REST API trả về JSON)
│       │   └── filter/         # CorsFilter.java (Cho phép React gọi API không bị chặn CORS)
│       └── webapp/WEB-INF/
│           └── web.xml         # Cấu hình Web Application
│
├── database/                   # [DATABASE] Cơ sở dữ liệu Microsoft SQL Server 2019
│   └── init.sql                # Script tạo DB RacehorseDB + Dữ liệu mẫu đồng bộ với UI
│
├── docker-compose.yml          # Cấu hình Docker chạy SQL Server 2019 với 1 lệnh
└── README.md                   # Hướng dẫn chi tiết dự án
```

---

## 🎨 2. Chạy Front-end (ReactJS)

### Cách 1: Chạy tự động 1 click (Khuyên dùng)
Double-click chuột vào file **`run-frontend.bat`** ở thư mục gốc của dự án. 
File này sẽ tự động kiểm tra Node.js, tự động chạy `npm install` nếu máy chưa có thư viện và khởi chạy máy chủ giao diện `npm run dev`.

### Cách 2: Chạy thủ công bằng Terminal / PowerShell
1. Mở PowerShell hoặc Command Prompt tại thư mục `frontend`:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Trình duyệt sẽ mở tại địa chỉ: **`http://localhost:3000`**

### ⚠️ Khắc phục lỗi khi chạy trên máy tính khác:
* **Lỗi 1: `npm : The term 'npm' is not recognized...`**:
  * **Nguyên nhân:** Máy tính đó chưa cài Node.js (môi trường chạy npm).
  * **Cách sửa:**
    1. Truy cập [https://nodejs.org/](https://nodejs.org/) và tải bản **LTS** (Khuyên dùng).
    2. Cài đặt file `.msi` vừa tải về (bấm *Next* theo mặc định).
    3. **Tắt hoàn toàn cửa sổ VS Code / Terminal hiện tại và mở lại** để máy nhận diện biến môi trường `PATH`.
* **Lỗi 2: `File ... cannot be loaded because running scripts is disabled on this system`**:
  * **Cách sửa:** Mở PowerShell và gõ lệnh sau để cấp quyền chạy script trên Windows:
    ```powershell
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
    ```

*(Nếu muốn xem bản HTML thuần không cần Node.js, bạn có thể mở trực tiếp file `frontend/static/index.html`)*.

---

## ☕ 3. Chạy Back-end (NetBeans 13 + Tomcat 9.0.113 + JDK 17)

1. **Khởi động SQL Server 2019 (Docker):**
   ```powershell
   cd c:\Users\ASUS\Desktop\SWP
   docker compose up -d
   ```
   *Tài khoản:* `sa` / *Mật khẩu:* `Password123@#` / *Database:* `RacehorseDB`. Chạy script trong `database/init.sql` để tạo bảng và nạp dữ liệu mẫu.

2. **Mở dự án Back-end trong NetBeans 13:**
   - Trong NetBeans: Chọn **File** > **Open Project...**
   - Trỏ tới thư mục `c:\Users\ASUS\Desktop\SWP\backend`.
   - Chuột phải vào project `racehorse-backend` > Chọn **Properties** > Mục **Run** > Chọn Server: **Apache Tomcat 9.0.113**.
   - Bấm **Run** (F6).

3. **Kiểm tra REST API:**
   - Truy cập: `http://localhost:8080/racehorse-backend/api/horses`
   - Dữ liệu JSON danh sách chiến mã sẽ được trả về và kết nối trực tiếp với Front-end React.
