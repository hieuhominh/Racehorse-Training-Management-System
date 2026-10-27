# Hệ thống Quản lý Huấn luyện Ngựa đua — MÃ TRƯỜNG
> Dự án môn học SWP / Web Application

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
